import { logger } from "./logger";

export class TranscriptionError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 503) {
    super(message);
    this.name = "TranscriptionError";
    this.statusCode = statusCode;
  }
}

function languageCode(language?: string): string | undefined {
  const code = language?.split("-")[0]?.toLowerCase();
  if (code === "en" || code === "hi" || code === "mr") return code;
  return undefined;
}

async function transcribeWithGroq(audio: Buffer, mimeType: string, language?: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;

  const formData = new FormData();
  const extension = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
  formData.append("file", new Blob([Uint8Array.from(audio)], { type: mimeType || "audio/webm" }), `voice.${extension}`);
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("response_format", "json");
  formData.append("temperature", "0");
  const lang = languageCode(language);
  if (lang) formData.append("language", lang);

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    logger.warn({ status: response.status, detail: detail.slice(0, 300) }, "Groq transcription failed");
    throw new TranscriptionError("Voice transcription is temporarily unavailable. Please try again or type your question.", 503);
  }

  const payload = await response.json() as { text?: string };
  return payload.text?.trim() || "";
}

async function transcribeWithHuggingFace(audio: Buffer, mimeType: string): Promise<string | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY?.trim() || process.env.HF_TOKEN?.trim();
  if (!apiKey) return null;

  const response = await fetch("https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": mimeType || "audio/webm",
    },
    body: audio,
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    logger.warn({ status: response.status, detail: detail.slice(0, 300) }, "Hugging Face transcription failed");
    throw new TranscriptionError("Voice transcription is temporarily unavailable. Please try again or type your question.", 503);
  }

  const payload = await response.json() as { text?: string } | Array<{ text?: string }>;
  if (Array.isArray(payload)) return payload[0]?.text?.trim() || "";
  return payload.text?.trim() || "";
}

export async function transcribeAudio(audio: Buffer, mimeType: string, language?: string): Promise<string> {
  if (!audio.length) {
    throw new TranscriptionError("No audio was recorded. Please try again.", 400);
  }
  if (audio.length > 12 * 1024 * 1024) {
    throw new TranscriptionError("Voice note is too long. Please keep it under 60 seconds.", 413);
  }

  const providers: Array<() => Promise<string | null>> = [
    () => transcribeWithGroq(audio, mimeType, language),
    () => transcribeWithHuggingFace(audio, mimeType),
  ];

  let lastError: TranscriptionError | null = null;
  for (const provider of providers) {
    try {
      const transcript = await provider();
      if (transcript !== null) {
        if (!transcript) {
          throw new TranscriptionError("Didn't catch that. Try speaking again, closer to the microphone.", 422);
        }
        return transcript;
      }
    } catch (error) {
      if (error instanceof TranscriptionError) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new TranscriptionError(
    "Voice transcription is not configured. Add GROQ_API_KEY (free at console.groq.com) or HUGGINGFACE_API_KEY, then try again.",
    503,
  );
}
