export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMRequest = {
  messages: LLMMessage[];
  temperature?: number;
};

export interface LLMProvider {
  generate(request: LLMRequest): Promise<string>;
  stream(request: LLMRequest): AsyncIterable<string>;
}

// OpenRouter's free-model router chooses from the currently available free
// text models. Keep this fixed to prevent an accidental paid-model fallback.
export const OPENROUTER_MODEL = "openrouter/free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_TIMEOUT_MS = 45_000;

function getOpenRouterKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not configured");
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

async function checkResponse(response: Response): Promise<void> {
  if (response.ok) return;
  await response.body?.cancel();
  throw new Error(`OpenRouter request failed with status ${response.status}`);
}

function parseSseEvent(event: string): { done: boolean; content?: string } {
  const line = event.split(/\r?\n/).find((item) => item.startsWith("data:"));
  if (!line) return { done: false };

  const data = line.slice(5).trim();
  if (data === "[DONE]") return { done: true };

  try {
    const parsed = JSON.parse(data) as {
      choices?: Array<{ delta?: { content?: unknown } }>;
    };
    const content = parsed.choices?.[0]?.delta?.content;
    return {
      done: false,
      content: typeof content === "string" ? content : undefined,
    };
  } catch {
    return { done: false };
  }
}

export class OpenRouterProvider implements LLMProvider {
  async generate(request: LLMRequest): Promise<string> {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getOpenRouterKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kamalo.ai",
        "X-Title": "KAMALO AI",
      },
      body: JSON.stringify(requestBody(request, false)),
      signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
    });
    await checkResponse(response);
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return payload.choices?.[0]?.message?.content?.trim() ?? "";
  }

  async *stream(request: LLMRequest): AsyncIterable<string> {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getOpenRouterKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kamalo.ai",
        "X-Title": "KAMALO AI",
      },
      body: JSON.stringify(requestBody(request, true)),
      signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
    });
    await checkResponse(response);
    if (!response.body) {
      throw new Error("OpenRouter returned no stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        const parsed = parseSseEvent(event);
        if (parsed.done) return;
        if (parsed.content) yield parsed.content;
      }
      if (done) break;
    }

    const parsed = parseSseEvent(buffer);
    if (!parsed.done && parsed.content) yield parsed.content;
  }
}

export const llmProvider: LLMProvider = new OpenRouterProvider();