import { expect, test } from '@playwright/test';

const conversationId = 'scope-routing-conversation';

type StoredMessage = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  feedback: null;
  createdAt: string;
  attachments: [];
};

function message(
  id: string,
  role: StoredMessage['role'],
  content: string,
  createdAt: string,
): StoredMessage {
  return {
    id,
    conversationId,
    role,
    content,
    feedback: null,
    createdAt,
    attachments: [],
  };
}

async function stubScopeRoutingApi(page: import('@playwright/test').Page) {
  const messages: StoredMessage[] = [];
  let responseNumber = 0;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'GET' && url.pathname === '/api/conversations') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(messages.length > 0
          ? [{
              id: conversationId,
              title: 'Scope routing check',
              createdAt: messages[0].createdAt,
              updatedAt: messages.at(-1)?.createdAt,
              messageCount: messages.length,
            }]
          : []),
      });
      return;
    }

    if (request.method() === 'POST' && url.pathname === '/api/conversations') {
      const now = new Date().toISOString();
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          id: conversationId,
          title: 'Scope routing check',
          createdAt: now,
          updatedAt: now,
        }),
      });
      return;
    }

    if (request.method() === 'GET' && url.pathname === `/api/conversations/${conversationId}`) {
      const createdAt = messages[0]?.createdAt || new Date().toISOString();
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          id: conversationId,
          title: 'Scope routing check',
          createdAt,
          updatedAt: messages.at(-1)?.createdAt || createdAt,
          messages,
        }),
      });
      return;
    }

    if (request.method() === 'POST' && url.pathname === `/api/conversations/${conversationId}/messages`) {
      const body = request.postDataJSON() as { content?: string };
      const content = body.content || '';
      responseNumber += 1;
      const now = new Date().toISOString();
      const userMessageId = `scope-user-${responseNumber}`;
      const assistantMessageId = `scope-assistant-${responseNumber}`;
      const assistantContent = responseNumber === 1
        ? 'Sorry, please email info@kamalo.app.'
        : "I don't have confirmed information about that in the KAMALO information available to me.";
      const outcome = responseNumber === 1 ? 'out_of_scope' : 'unknown';

      messages.push(
        message(userMessageId, 'user', content, now),
        message(assistantMessageId, 'assistant', assistantContent, new Date(Date.now() + 1).toISOString()),
      );

      await route.fulfill({
        contentType: 'text/event-stream',
        body: [
          `data: ${JSON.stringify({ content: assistantContent })}`,
          '',
          `data: ${JSON.stringify({ done: true, messageId: assistantMessageId, finalContent: assistantContent, outcome })}`,
          '',
        ].join('\n'),
      });
      return;
    }

    await route.continue();
  });
}

test('keeps ticket escalation for Kamalo-adjacent unknowns but not unrelated input', async ({ page }) => {
  await stubScopeRoutingApi(page);
  await page.goto('/');

  const composer = page.getByTestId('input-chat-message');
  await expect(composer).toBeVisible();

  await composer.fill('hrcvyun gvtg');
  await page.getByTestId('button-send-message').click();

  const unrelatedAssistantMessage = page.getByTestId('message-scope-assistant-1');
  await expect(unrelatedAssistantMessage).toContainText('info@kamalo.app');
  await expect(page.getByTestId('card-unknown-escalation-scope-assistant-1')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Raise a ticket' })).toHaveCount(0);

  await composer.fill('What cashback rules does KAMALO support?');
  await page.getByTestId('button-send-message').click();

  const adjacentAssistantMessage = page.getByTestId('message-scope-assistant-2');
  await expect(adjacentAssistantMessage).toContainText("I don't have confirmed information");
  await expect(page.getByTestId('card-unknown-escalation-scope-assistant-2')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Raise a ticket' })).toBeVisible();
});