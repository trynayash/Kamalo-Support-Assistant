import { fetch } from 'expo/fetch';

function getApiBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN?.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (!domain) throw new Error('KAMALO is not connected to its support server.');
  return `https://${domain}`;
}

async function getResponseError(response: Response): Promise<string> {
  try {
    const raw = await response.text();
    if (!raw) return '';
    try {
      const payload = JSON.parse(raw) as { error?: unknown; message?: unknown };
      if (typeof payload.error === 'string') return payload.error;
      if (typeof payload.message === 'string') return payload.message;
    } catch {
      // Some proxies return plain text instead of JSON.
    }
    return raw.replace(/\s+/g, ' ').trim().slice(0, 180);
  } catch {
    return '';
  }
}

export async function streamConversationMessage(
  conversationId: string,
  content: string,
  attachmentId: string | null,
  onChunk: (chunk: string) => void,
  inputMode: 'text' | 'voice' = 'text',
) {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ content, attachmentId, inputMode }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('fetch failed') || message.includes('network request failed') || message.includes('network error')) {
      throw new Error('KAMALO could not reach the support server. Check your connection and try again.');
    }
    throw new Error(error instanceof Error ? error.message : 'The assistant could not connect. Please try again.');
  }
  if (!response.ok) {
    const detail = await getResponseError(response);
    throw new Error(detail || `The assistant could not respond (${response.status}).`);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('The assistant response could not be streamed.');
  const decoder = new TextDecoder();
  let buffer = '';
  let receivedDone = false;
  let receivedContent = false;
  const consumeLine = (line: string) => {
    if (!line.startsWith('data:')) return;
    const data = line.slice(5).trim();
    if (!data) return;
    try {
      const parsed = JSON.parse(data) as { content?: string; error?: string; done?: boolean };
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.content) {
        receivedContent = true;
        onChunk(parsed.content);
      }
      if (parsed.done === true) receivedDone = true;
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unexpected end of JSON input') throw error;
    }
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    lines.forEach(consumeLine);
  }
  buffer += decoder.decode();
  if (buffer) buffer.split(/\r?\n/).forEach(consumeLine);
  if (!receivedDone) throw new Error('The assistant response ended before completion. Please try again.');
  if (!receivedContent) throw new Error('The assistant returned an empty response. Please try again.');
}