import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, ConversationSummary } from '@workspace/api-client-react';
import {
  getGetConversationQueryKey,
  getHealthCheckQueryKey,
  getListConversationsQueryKey,
  useCreateConversation,
  useCreateMessageFeedback,
  useDeleteConversation,
  useGetConversation,
  useHealthCheck,
  useListConversations,
  useStreamAssistantMessage,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Eraser, Menu, MoreHorizontal, RefreshCw, Send, Sparkles, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { KamaloShell, SectionLabel } from '@/components/kamalo-shell';

const firstUsePrompts = [
  { label: 'KAMALO Coins', text: 'How do KAMALO Coins work?' },
  { label: 'Auto KAMALO', text: 'Explain Auto KAMALO in simple terms.' },
  { label: 'FINCADO', text: 'What is FINCADO and how do I use it?' },
  { label: 'Transactions', text: 'Where can I see my recent transactions?' },
];

const compactDate = (value: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));

function ConversationSkeleton() {
  return <div className="space-y-3 px-3"><div className="skeleton h-12 rounded-xl" /><div className="skeleton h-12 rounded-xl" /><div className="skeleton h-12 rounded-xl" /></div>;
}

function ConversationHistory({ conversations, selectedId, loading, onSelect, onDelete }: { conversations: ConversationSummary[]; selectedId: string | null; loading: boolean; onSelect: (id: string) => void; onDelete: (conversation: ConversationSummary) => void }) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="font-mono text-[10px] uppercase tracking-[.17em] text-muted-foreground">Recent conversations</span>
        <span className="font-mono text-[10px] text-muted-foreground/70">{conversations.length}</span>
      </div>
      {loading ? <ConversationSkeleton /> : conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] leading-relaxed text-muted-foreground" data-testid="empty-conversations">Your conversation history will appear here.</div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <div key={conversation.id} className={`group flex items-center rounded-xl border px-2.5 py-2.5 transition-colors ${selectedId === conversation.id ? 'border-[hsl(var(--primary)/.2)] bg-[hsl(var(--primary)/.07)]' : 'border-transparent hover:border-border hover:bg-card'}`} data-testid={`conversation-item-${conversation.id}`}>
              <button onClick={() => onSelect(conversation.id)} className="min-w-0 flex-1 text-left" data-testid={`button-select-conversation-${conversation.id}`}>
                <div className="truncate text-[12px] font-semibold">{conversation.title || 'Untitled conversation'}</div>
                <div className="mt-1 font-mono text-[9px] text-muted-foreground">{conversation.messageCount} {conversation.messageCount === 1 ? 'message' : 'messages'} · {compactDate(conversation.updatedAt)}</div>
              </button>
              <button onClick={() => onDelete(conversation)} className="ml-1 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100" aria-label={`Delete ${conversation.title}`} data-testid={`button-delete-conversation-${conversation.id}`}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssistantBadge() {
  return <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] bg-primary text-primary-foreground shadow-[0_6px_16px_hsl(var(--primary)/.22)]"><Sparkles size={15} /></div>;
}

function MessageBubble({ message, onFeedback, onCopy, onRetry }: { message: ChatMessage; onFeedback: (message: ChatMessage, rating: 'helpful' | 'not_helpful') => void; onCopy: (content: string) => void; onRetry: () => void }) {
  const assistant = message.role === 'assistant';
  return (
    <div className={`animate-rise flex gap-3 ${assistant ? 'items-start' : 'items-start justify-end'}`} data-testid={`message-${message.id}`}>
      {assistant && <AssistantBadge />}
      <div className={`max-w-[min(680px,87%)] ${assistant ? '' : 'order-first'}`}>
        <div className={`rounded-2xl px-4 py-3.5 text-[13px] leading-[1.75] ${assistant ? 'rounded-tl-md border border-border/80 bg-card text-card-foreground shadow-[0_6px_24px_hsl(var(--foreground)/.035)]' : 'rounded-tr-md bg-primary text-primary-foreground shadow-[0_7px_18px_hsl(var(--primary)/.18)]'}`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
        <div className={`mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground ${assistant ? '' : 'justify-end'}`}>
          <span className="font-mono">{new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(message.createdAt))}</span>
          {assistant && (
            <>
              <span className="mx-1 opacity-40">·</span>
              <button onClick={() => onCopy(message.content)} className="rounded-md p-1 hover:bg-muted hover:text-foreground" aria-label="Copy assistant response" data-testid={`button-copy-message-${message.id}`}><Copy size={13} /></button>
              <button onClick={() => onFeedback(message, 'helpful')} className={`rounded-md p-1 hover:bg-muted hover:text-primary ${message.feedback === 'helpful' ? 'text-primary' : ''}`} aria-label="Mark response helpful" data-testid={`button-helpful-${message.id}`}><ThumbsUp size={13} /></button>
              <button onClick={() => onFeedback(message, 'not_helpful')} className={`rounded-md p-1 hover:bg-muted hover:text-destructive ${message.feedback === 'not_helpful' ? 'text-destructive' : ''}`} aria-label="Mark response not helpful" data-testid={`button-not-helpful-${message.id}`}><ThumbsDown size={13} /></button>
              <button onClick={onRetry} className="rounded-md p-1 hover:bg-muted hover:text-foreground" aria-label="Retry last prompt" data-testid={`button-retry-message-${message.id}`}><RefreshCw size={13} /></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StreamingBubble() {
  return <div className="flex items-start gap-3 animate-rise" data-testid="status-streaming"><AssistantBadge /><div className="rounded-2xl rounded-tl-md border border-border/80 bg-card px-4 py-4 shadow-[0_6px_24px_hsl(var(--foreground)/.035)]"><div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary animate-breathe" /><span className="h-1.5 w-1.5 rounded-full bg-primary animate-breathe [animation-delay:180ms]" /><span className="h-1.5 w-1.5 rounded-full bg-primary animate-breathe [animation-delay:360ms]" /><span className="ml-2 text-[11px] text-muted-foreground">Checking the KAMALO knowledge base</span></div></div></div>;
}

function ChatEmptyState({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <div className="flex min-h-[min(530px,calc(100dvh-230px))] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="relative mb-7">
        <div className="absolute -inset-5 rounded-full bg-[hsl(var(--accent)/.17)] blur-2xl" />
        <div className="relative grid h-20 w-20 place-items-center rounded-[26px] border border-[hsl(var(--accent)/.4)] bg-[hsl(var(--accent)/.23)] text-primary"><Sparkles size={28} strokeWidth={1.5} /></div>
      </div>
      <SectionLabel>Here when you need clarity</SectionLabel>
      <h1 className="mt-5 max-w-xl font-serif text-[clamp(2.35rem,5vw,4rem)] leading-[.96] tracking-[-.04em] text-foreground">Good questions deserve<br /><em className="text-primary not-italic">grounded answers.</em></h1>
      <p className="mt-5 max-w-md text-[13px] leading-7 text-muted-foreground">Ask about your KAMALO account, rewards, transactions, or any feature you want to understand better.</p>
      <div className="mt-9 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {firstUsePrompts.map((prompt) => <button key={prompt.label} onClick={() => onPrompt(prompt.text)} className="group rounded-xl border border-border/80 bg-card/60 px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-[0_8px_20px_hsl(var(--foreground)/.06)]" data-testid={`button-prompt-${prompt.label.toLowerCase().replaceAll(' ', '-')}`}><span className="font-mono text-[9px] uppercase tracking-[.15em] text-primary">{prompt.label}</span><span className="mt-1 block text-[12px] font-semibold text-foreground/80 group-hover:text-foreground">{prompt.text}</span></button>)}
      </div>
    </div>
  );
}

export function HomePage() {
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const conversationsQuery = useListConversations({ query: { queryKey: getListConversationsQueryKey() } });
  const healthQuery = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const conversationQuery = useGetConversation(selectedId || '', { query: { enabled: !!selectedId, queryKey: getGetConversationQueryKey(selectedId || '') } });
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const streamAssistantMessage = useStreamAssistantMessage();
  const createFeedback = useCreateMessageFeedback();
  const conversations = useMemo(() => conversationsQuery.data || [], [conversationsQuery.data]);
  const activeConversation = conversations.find((conversation) => conversation.id === selectedId);
  const messages = localMessages.length > 0 ? localMessages : (conversationQuery.data?.messages || []);

  useEffect(() => {
    if (!selectedId && conversations.length > 0) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  useEffect(() => {
    if (conversationQuery.data?.id === selectedId && !isSending) setLocalMessages(conversationQuery.data.messages);
  }, [conversationQuery.data, selectedId, isSending]);

  const startNewConversation = () => {
    setSelectedId(null);
    setLocalMessages([]);
    setInput('');
    setErrorMessage('');
    inputRef.current?.focus();
  };

  const sendMessage = async (contentOverride?: string) => {
    const content = (contentOverride ?? input).trim();
    if (!content || isSending) return;
    setErrorMessage('');
    setNotice('');
    setInput('');
    let conversationId = selectedId;
    try {
      if (!conversationId) {
        const created = await createConversation.mutateAsync({ data: { title: content.slice(0, 64) } });
        conversationId = created.id;
        setSelectedId(created.id);
      }
      const userMessage: ChatMessage = { id: `local-user-${Date.now()}`, conversationId, role: 'user', content, createdAt: new Date().toISOString(), feedback: null };
      setLocalMessages((current) => [...current, userMessage]);
      setIsSending(true);
      const response = await streamAssistantMessage.mutateAsync({ conversationId, data: { content } });
      const assistantMessage: ChatMessage = { id: `local-assistant-${Date.now()}`, conversationId, role: 'assistant', content: response || 'I could not find a grounded answer for that yet.', createdAt: new Date().toISOString(), feedback: null };
      setLocalMessages((current) => [...current, assistantMessage]);
      await queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(conversationId) });
      await queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    } catch {
      setErrorMessage('That did not go through. Check your connection and try again.');
      setInput(content);
    } finally {
      setIsSending(false);
    }
  };

  const retryLast = () => {
    const previous = [...messages].reverse().find((message) => message.role === 'user');
    if (previous) void sendMessage(previous.content);
  };

  const handleFeedback = async (message: ChatMessage, rating: 'helpful' | 'not_helpful') => {
    try {
      await createFeedback.mutateAsync({ messageId: message.id, data: { rating, feedback: null } });
      setLocalMessages((current) => current.map((item) => item.id === message.id ? { ...item, feedback: rating } : item));
      setNotice(rating === 'helpful' ? 'Thanks — that helps us keep answers useful.' : 'Thanks for the signal. We will review this answer.');
      window.setTimeout(() => setNotice(''), 3200);
    } catch {
      setNotice('Feedback could not be saved right now.');
    }
  };

  const deleteConversationItem = async (conversation: ConversationSummary) => {
    if (!window.confirm(`Delete “${conversation.title || 'Untitled conversation'}”?`)) return;
    await deleteConversation.mutateAsync({ conversationId: conversation.id });
    await queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    if (selectedId === conversation.id) startNewConversation();
  };

  const clearCurrent = async () => {
    if (!selectedId || !activeConversation) return startNewConversation();
    await deleteConversationItem(activeConversation);
  };

  return (
    <KamaloShell conversationCount={conversations.length} onNewConversation={startNewConversation} mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen}>
      <div className="mx-auto flex min-h-[calc(100dvh-57px)] max-w-[1220px] flex-col px-4 pb-5 sm:px-6 md:min-h-[100dvh] md:px-9 md:py-7 lg:px-14">
        <header className="hidden items-center justify-between md:flex">
          <div><SectionLabel>Customer support / KAMALO AI</SectionLabel><h2 className="mt-3 font-serif text-[25px] tracking-[-.025em]">{activeConversation?.title || 'A clearer way to ask'}</h2></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5"><span className={`h-1.5 w-1.5 rounded-full ${healthQuery.isError ? 'bg-destructive' : 'bg-[hsl(var(--primary))]'} ${healthQuery.isLoading ? 'animate-breathe' : ''}`} /><span className="font-mono text-[9px] uppercase tracking-[.13em] text-muted-foreground">{healthQuery.isError ? 'Service check failed' : 'System ready'}</span></div>
            <button onClick={clearCurrent} disabled={!selectedId || deleteConversation.isPending} className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-clear-conversation"><Eraser size={14} /> Clear</button>
            <button onClick={() => setMobileOpen(true)} className="rounded-lg border border-border bg-card p-2 text-muted-foreground md:hidden" aria-label="Open menu" data-testid="button-open-menu"><Menu size={17} /></button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-7 md:grid-cols-[minmax(0,1fr)_248px] lg:gap-12">
          <section className="flex min-h-0 flex-col pt-7 md:pt-14">
            {messages.length === 0 && !conversationQuery.isLoading ? <ChatEmptyState onPrompt={(text) => void sendMessage(text)} /> : (
              <div className="flex-1 space-y-6 overflow-y-auto pb-8 pr-1 md:space-y-7" data-testid="conversation-messages">
                {conversationQuery.isLoading && <div className="space-y-5"><div className="skeleton h-20 w-4/5 rounded-2xl" /><div className="ml-auto skeleton h-14 w-3/5 rounded-2xl" /></div>}
                {messages.map((message) => <MessageBubble key={message.id} message={message} onFeedback={handleFeedback} onCopy={(content) => { void navigator.clipboard?.writeText(content); setNotice('Answer copied to clipboard.'); window.setTimeout(() => setNotice(''), 2200); }} onRetry={retryLast} />)}
                {isSending && <StreamingBubble />}
              </div>
            )}
            {errorMessage && <div className="mb-3 flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-[11px] text-destructive" data-testid="status-send-error"><span>{errorMessage}</span><button onClick={() => void sendMessage()} className="font-semibold underline" data-testid="button-retry-send">Try again</button></div>}
            {notice && <div className="mb-3 text-center font-mono text-[10px] text-primary animate-rise" data-testid="status-feedback">{notice}</div>}
            <div className="relative rounded-2xl border border-border bg-card p-2 shadow-[0_12px_30px_hsl(var(--foreground)/.06)] focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5">
              <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Ask anything about KAMALO..." rows={2} maxLength={4000} className="w-full resize-none bg-transparent px-3 py-2 text-[13px] leading-6 outline-none placeholder:text-muted-foreground/70" data-testid="input-chat-message" />
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="font-mono text-[9px] text-muted-foreground/70">Enter to send · Shift + Enter for a new line</span>
                <button onClick={() => void sendMessage()} disabled={!input.trim() || isSending} className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Send message" data-testid="button-send-message"><Send size={15} /></button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-center font-mono text-[9px] text-muted-foreground/65"><ShieldIcon /> KAMALO AI can make mistakes. Check important details in the app.</div>
          </section>

          <aside className="hidden border-l border-border/70 pl-7 md:block">
            <ConversationHistory conversations={conversations} selectedId={selectedId} loading={conversationsQuery.isLoading} onSelect={(id) => { setSelectedId(id); setLocalMessages([]); }} onDelete={deleteConversationItem} />
            <div className="mt-10 border-t border-border/70 pt-6"><div className="font-mono text-[10px] uppercase tracking-[.17em] text-muted-foreground">Need a starting point?</div><p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">Ask for a definition, a step-by-step, or help finding a transaction.</p><button onClick={() => setInput('What can you help me understand?')} className="mt-4 flex items-center gap-2 text-[11px] font-bold text-primary hover:underline" data-testid="button-suggest-question">Explore questions <MoreHorizontal size={14} /></button></div>
          </aside>
        </div>
      </div>
    </KamaloShell>
  );
}

function ShieldIcon() {
  return <span className="inline-block h-2 w-2 rounded-sm border border-primary/50" />;
}