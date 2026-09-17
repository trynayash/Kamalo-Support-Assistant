import { fetch } from 'expo/fetch';

export async function streamConversationMessage(
  conversationId: string,
  content: string,
  attachmentId: string | null,
  onChunk: (chunk: string) => void,
) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) throw new Error('KAMALO is not connected to its support server.');
  const response = await fetch(`https://${domain}/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ content, attachmentId }),
  });
  if (!response.ok) throw new Error(`The assistant could not respond (${response.status}).`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error('The assistant response could not be streamed.');
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]' || !data) continue;
      try {
        const parsed = JSON.parse(data) as { content?: string; error?: string };
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.content) onChunk(parsed.content);
      } catch (error) {
        if (error instanceof Error && error.message !== 'Unexpected end of JSON input') throw error;
      }
    }
  }
}