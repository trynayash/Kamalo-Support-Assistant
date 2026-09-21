import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { HiOutlineArrowLeft, HiOutlineChatBubbleLeftRight, HiOutlineCheck, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineXMark } from '@/components/kamalo-icons';
import type { ConversationSummary } from '@workspace/api-client-react';
import {
  getListConversationsQueryKey,
  useDeleteConversation,
  useDeleteAllConversations,
  useUpdateConversation,
  useListConversations,
} from '@workspace/api-client-react';
import { KamaloShell, SectionLabel } from '@/components/kamalo-shell';

const compactDate = (value: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

export function HistoryPage() {
  const queryClient = useQueryClient();
  const conversationsQuery = useListConversations({ query: { queryKey: getListConversationsQueryKey() } });
  const deleteConversation = useDeleteConversation();
  const deleteAllConversations = useDeleteAllConversations();
  const updateConversation = useUpdateConversation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
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

  const saveTitle = async (conversationId: string) => {
    if (!titleDraft.trim() || updateConversation.isPending) return;
    try {
      const updated = await updateConversation.mutateAsync({ conversationId, data: { title: titleDraft.trim() } });
      queryClient.setQueryData<ConversationSummary[]>(getListConversationsQueryKey(), (current) => current?.map((item) => item.id === updated.id ? { ...item, title: updated.title, updatedAt: updated.updatedAt } : item));
      setEditingId(null);
    } catch {
      // Keep the draft open so the user can retry.
    }
  };

  const removeAllConversations = async () => {
    if (!window.confirm('Remove all conversations from your visible history?\n\nKAMALO will retain an internal record for support continuity. This cannot be undone.')) return;
    try {
      await deleteAllConversations.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      setEditingId(null);
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
           <div className="flex items-center gap-3"><span className="font-mono text-[10px] text-muted-foreground">{conversations.length} conversations</span>{conversations.length > 0 && <button type="button" onClick={() => void removeAllConversations()} disabled={deleteAllConversations.isPending} className="rounded-lg border border-destructive/20 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[.08em] text-destructive hover:bg-destructive/5 disabled:opacity-50" data-testid="button-history-delete-all">{deleteAllConversations.isPending ? 'Removing…' : 'Delete all'}</button>}</div>
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
                 {editingId === conversation.id ? <form onSubmit={(event) => { event.preventDefault(); void saveTitle(conversation.id); }} className="flex min-w-0 flex-1 items-center gap-2"><input value={titleDraft} onChange={(event) => setTitleDraft(event.target.value)} maxLength={120} autoFocus className="h-9 min-w-0 flex-1 rounded-lg border border-primary/40 bg-background px-3 text-[12px] font-bold outline-none focus:ring-4 focus:ring-primary/10" aria-label="Conversation title" data-testid={`input-history-title-${conversation.id}`} /><button type="submit" disabled={!titleDraft.trim() || updateConversation.isPending} className="rounded-md bg-primary p-2 text-primary-foreground disabled:opacity-50" aria-label="Save conversation name" data-testid={`button-history-save-title-${conversation.id}`}><HiOutlineCheck size={14} /></button><button type="button" onClick={() => setEditingId(null)} className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Cancel conversation rename" data-testid={`button-history-cancel-title-${conversation.id}`}><HiOutlineXMark size={14} /></button></form> : <Link href={`/?conversation=${conversation.id}`} className="min-w-0 flex-1" data-testid={`link-history-conversation-${conversation.id}`}>
                   <div className="truncate text-[13px] font-bold">{conversation.title || 'Untitled conversation'}</div>
                   <div className="mt-1 font-mono text-[10px] text-muted-foreground">{conversation.messageCount} {conversation.messageCount === 1 ? 'message' : 'messages'} · {compactDate(conversation.updatedAt)}</div>
                 </Link>}
                  {editingId !== conversation.id && <button type="button" onClick={() => { setEditingId(conversation.id); setTitleDraft(conversation.title || ''); }} className="icon-button rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary" aria-label={`Rename ${conversation.title || 'conversation'}`} data-testid={`button-history-rename-${conversation.id}`}><HiOutlinePencilSquare size={15} /></button>}
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