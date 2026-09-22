function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export async function transcribeRecordedAudio(blob: Blob, language?: string): Promise<string> {
  if (!blob.size) return '';

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      audioBase64: bytesToBase64(bytes),
      mimeType: blob.type || 'audio/webm',
      language,
    }),
  });

  const payload = await response.json().catch(() => null) as { transcript?: string; error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error || 'Voice transcription is temporarily unavailable. Please try again or type your question.');
  }

  return payload?.transcript?.trim() || '';
}
