import { describe, expect, it, vi } from 'vitest';
import { streamConversationMessage } from '../../kamalo-mobile/lib/stream';

describe('mobile assistant voice requests', () => {
  it.each(['hi', 'mr'] as const)('sends the %s language with voice messages', async (language) => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.stringify({ content: 'उत्तर', done: true });
      return new Response(`data: ${body}\n\n`, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('EXPO_PUBLIC_DOMAIN', 'support.example.test');

    await streamConversationMessage('conversation-1', 'प्रश्न', null, vi.fn(), 'voice', language);

    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(request?.body))).toMatchObject({
      inputMode: 'voice',
      language,
    });
  });
});