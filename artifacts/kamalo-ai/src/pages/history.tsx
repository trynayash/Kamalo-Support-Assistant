import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { HiOutlineArrowLeft, HiOutlineChatBubbleLeftRight, HiOutlineTrash } from '@/components/kamalo-icons';
import type { ConversationSummary } from '@workspace/api-client-react';
import {
  getListConversationsQueryKey,
  useDeleteAllConversations,
  useDeleteConversation,
  useListConversations,
} from '@workspace/api-client-react';
import { KamaloShell, SectionLabel } from '@/components/kamalo-shell';
import { KamaloActionButton } from '@/components/kamalo-action-button';

const compactDate = (value: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

export function HistoryPage() {
  const queryClient = useQueryClient();
  const conversationsQuery = useListConversations({ query: { queryKey: getListConversationsQueryKey() } });
  const deleteConversation = useDeleteConversation();
  const deleteAllConversations = useDeleteAllConversations();
  const conversations = useMemo(() => conversationsQuery.data || [], [conversationsQuery.data]);

  const removeConversation = async (conversation: ConversationSummary) => {
    if (!window.confirm(`Remove “${conversation.title || 'Untitled conversation'}” from your chat history?`)) return;
    try {
      await deleteConversation.mutateAsync({ conversationId: conversation.id });
      await queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    } catch {
      // The list query remains visible; the user can retry from the page.
    }
  };

  const removeAllConversations = async () => {
    if (!conversations.length || deleteAllConversations.isPending) return;
    if (!window.confirm(`Delete all ${conversations.length} conversations from History?\n\nThis cannot be undone.`)) return;
    try {
      await deleteAllConversations.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    } catch {
      // Keep the list visible so the user can retry.
    }
  };

  return (
    <KamaloShell conversationCount={conversations.length}>
       <main className="page-frame min-h-[calc(100dvh-60px)] pb-12 pt-7 md:pb-16 md:pt-12">
         <Link href="/" className="inline-flex items-center gap-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary" data-testid="link-history-back">
          <HiOutlineArrowLeft size={14} /> Back to conversations
        </Link>
          <div className="page-header mt-7 flex-col items-start gap-4 sm:flex-row sm:items-end">
          <div>
            <SectionLabel>Conversation archive</SectionLabel>
             <h1 className="page-title">History</h1>
             <p className="page-description">Open an earlier conversation or remove it from your visible history.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] text-muted-foreground">{conversations.length} conversations</span>
            {conversations.length > 0 && <KamaloActionButton type="button" variant="outline" size="sm" onClick={() => void removeAllConversations()} disabled={deleteAllConversations.isPending} leftIcon={<HiOutlineTrash size={14} />} data-testid="button-history-delete-all">Delete all</KamaloActionButton>}
          </div>
        </div>

        {conversationsQuery.isLoading ? (
          <div className="mt-7 space-y-2" role="status" aria-live="polite" data-testid="history-loading">
            <div className="skeleton h-20 rounded-xl" />
            <div className="skeleton h-20 rounded-xl" />
          </div>
        ) : conversationsQuery.isError ? (
          <div className="mt-7 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-[12px] text-destructive" role="alert" aria-live="assertive" data-testid="history-error">History is temporarily unavailable. Please try again shortly.</div>
        ) : conversations.length === 0 ? (
          <div className="mt-7 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center" role="region" aria-label="Empty conversation history" data-testid="history-empty">
            <HiOutlineChatBubbleLeftRight className="mx-auto text-primary" size={24} />
            <p className="mt-3 text-[13px] font-semibold">No conversations yet.</p>
            <Link href="/" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground" data-testid="link-history-start-chat">Start a conversation</Link>
          </div>
        ) : (
           <div className="mt-8 space-y-2.5" data-testid="history-list">
            {conversations.map((conversation) => (
               <div key={conversation.id} className="surface group flex items-center gap-3 px-4 py-4 transition-colors hover:border-primary/35 sm:px-5" data-testid={`history-item-${conversation.id}`}>
                <Link href={`/?conversation=${conversation.id}`} className="min-w-0 flex-1" data-testid={`link-history-conversation-${conversation.id}`}>
                  <div className="truncate text-[13px] font-bold">{conversation.title || 'Untitled conversation'}</div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">{conversation.messageCount} {conversation.messageCount === 1 ? 'message' : 'messages'} · {compactDate(conversation.updatedAt)}</div>
                </Link>
                 <button onClick={() => void removeConversation(conversation)} className="icon-button rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${conversation.title || 'conversation'}`} data-testid={`button-history-delete-${conversation.id}`}>
                  <HiOutlineTrash size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </KamaloShell>
  );
}