import { Router, type IRouter } from "express";
import { TranscriptionError, transcribeAudio } from "../lib/transcription";

const router: IRouter = Router();
const MAX_BODY_BYTES = 16 * 1024 * 1024;

router.post("/transcribe", async (req, res): Promise<void> => {
  const body = req.body as { audioBase64?: unknown; mimeType?: unknown; language?: unknown } | undefined;
  const audioBase64 = typeof body?.audioBase64 === "string" ? body.audioBase64.trim() : "";
  const mimeType = typeof body?.mimeType === "string" && body.mimeType.trim()
    ? body.mimeType.trim()
    : "audio/webm";
  const language = typeof body?.language === "string" ? body.language.trim() : undefined;

  if (!audioBase64) {
    res.status(400).json({ error: "Audio data is required." });
    return;
  }

  let audio: Buffer;
  try {
    audio = Buffer.from(audioBase64, "base64");
  } catch {
    res.status(400).json({ error: "Audio data could not be read." });
    return;
  }

  if (audio.length > MAX_BODY_BYTES) {
    res.status(413).json({ error: "Voice note is too long. Please keep it under 60 seconds." });
    return;
  }

  try {
    const transcript = await transcribeAudio(audio, mimeType, language);
    res.json({ transcript });
  } catch (error) {
    if (error instanceof TranscriptionError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    req.log.error({ err: error }, "Voice transcription failed");
    res.status(503).json({ error: "Voice transcription is temporarily unavailable. Please try again or type your question." });
  }
});

export default router;
