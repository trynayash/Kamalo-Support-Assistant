export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMRequest = {
  messages: LLMMessage[];
  temperature?: number;
  requestId?: string;
  signal?: AbortSignal;
};

export interface LLMProvider {
  generate(request: LLMRequest): Promise<string>;
  stream(request: LLMRequest): AsyncIterable<string>;
}

// Keep the free router explicit. It may select among OpenRouter's currently
// available free text models, but it must never silently become a paid model.
export const OPENROUTER_MODEL = "openrouter/free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 2;

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly status: number | null = null,
    public readonly retryable = false,
    public readonly kind: "configuration" | "http" | "timeout" | "protocol" | "cancelled" = "http",
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

function getOpenRouterKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new OpenRouterError("OPENROUTER_API_KEY is not configured", null, false, "configuration");
  }
  return key;
}

function requestBody(request: LLMRequest, stream: boolean) {
  return {
    model: OPENROUTER_MODEL,
    messages: request.messages,
    temperature: request.temperature ?? 0.2,
    max_tokens: 8192,
    stream,
  };
}

function isTransientStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 8_000);
  return Math.min(250 * (2 ** attempt), 4_000);
}

async function responseError(response: Response): Promise<OpenRouterError> {
  try {
    await response.arrayBuffer();
  } catch {
    await response.body?.cancel().catch(() => undefined);
  }
  return new OpenRouterError(
    `OpenRouter request failed with status ${response.status}`,
    response.status,
    isTransientStatus(response.status),
    "http",
  );
}

function requestSignal(externalSignal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(OPENROUTER_TIMEOUT_MS);
  return externalSignal ? AbortSignal.any([externalSignal, timeoutSignal]) : timeoutSignal;
}

async function fetchWithRetry(request: LLMRequest, stream: boolean): Promise<Response> {
  const key = getOpenRouterKey();
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    if (request.signal?.aborted) {
      throw new OpenRouterError("OpenRouter request was cancelled", null, false, "cancelled");
    }

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://kamalo.ai",
          "X-Title": "KAMALO AI",
          ...(request.requestId ? { "X-Request-ID": request.requestId } : {}),
        },
        body: JSON.stringify(requestBody(request, stream)),
        signal: requestSignal(request.signal),
      });

      if (response.ok) return response;

      const error = await responseError(response);
      if (!error.retryable || attempt === MAX_RETRIES) throw error;
      await response.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs(response, attempt)));
      lastError = error;
    } catch (error) {
      if (error instanceof OpenRouterError) {
        if (!error.retryable || attempt === MAX_RETRIES) throw error;
        lastError = error;
      } else if (error instanceof DOMException && error.name === "AbortError") {
        const cancelled = request.signal?.aborted;
        throw new OpenRouterError(
          cancelled ? "OpenRouter request was cancelled" : "OpenRouter request timed out",
          null,
          false,
          cancelled ? "cancelled" : "timeout",
        );
      } else {
        lastError = error;
        if (attempt === MAX_RETRIES) {
          throw new OpenRouterError("OpenRouter could not be reached", null, true, "http");
        }
      }
      if (lastError instanceof OpenRouterError && lastError.retryable) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs(new Response(null), attempt)));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new OpenRouterError("OpenRouter request failed");
}

function parseSseEvent(event: string): { done: boolean; content?: string } {
  const dataLines = event
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => {
      const value = line.slice(5);
      return value.startsWith(" ") ? value.slice(1) : value;
    });
  if (dataLines.length === 0) return { done: false };

  const data = dataLines.join("\n");
  if (data === "[DONE]") return { done: true };

  let parsed: { choices?: Array<{ delta?: { content?: unknown }; finish_reason?: unknown }> };
  try {
    parsed = JSON.parse(data) as typeof parsed;
  } catch {
    throw new OpenRouterError("OpenRouter returned malformed streaming data", null, true, "protocol");
  }

  const content = parsed.choices?.[0]?.delta?.content;
  if (content !== undefined && typeof content !== "string") {
    throw new OpenRouterError("OpenRouter returned an invalid content chunk", null, true, "protocol");
  }
  return {
    done: false,
    content: typeof content === "string" ? content : undefined,
  };
}

export class OpenRouterProvider implements LLMProvider {
  async generate(request: LLMRequest): Promise<string> {
    const response = await fetchWithRetry(request, false);
    let payload: { choices?: Array<{ message?: { content?: unknown } }> };
    try {
      payload = await response.json() as typeof payload;
    } catch {
      throw new OpenRouterError("OpenRouter returned an unreadable response", response.status, true, "protocol");
    }
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new OpenRouterError("OpenRouter returned an empty response", response.status, true, "protocol");
    }
    return content.trim();
  }

  async *stream(request: LLMRequest): AsyncIterable<string> {
    const response = await fetchWithRetry(request, true);
    if (!response.body) {
      throw new OpenRouterError("OpenRouter returned no stream", response.status, true, "protocol");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let receivedDone = false;
    let receivedContent = false;

    try {
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? "";

        for (const event of events) {
          const parsed = parseSseEvent(event);
          if (parsed.done) {
            receivedDone = true;
            break;
          }
          if (parsed.content) {
            receivedContent = true;
            yield parsed.content;
          }
        }
        if (receivedDone || done) break;
      }

      if (!receivedDone && buffer.trim()) {
        const parsed = parseSseEvent(buffer);
        if (parsed.done) receivedDone = true;
        if (parsed.content) {
          receivedContent = true;
          yield parsed.content;
        }
      }
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }

    if (!receivedDone) {
      throw new OpenRouterError("OpenRouter stream ended before completion", null, true, "protocol");
    }
    if (!receivedContent) {
      throw new OpenRouterError("OpenRouter returned an empty stream", null, true, "protocol");
    }
  }
}

export const llmProvider: LLMProvider = new OpenRouterProvider();