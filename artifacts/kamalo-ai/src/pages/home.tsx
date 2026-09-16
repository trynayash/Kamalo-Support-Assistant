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
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Clipboard, Eraser, Headphones, MoreHorizontal, RefreshCw, Send, ShieldCheck, ThumbsDown, ThumbsUp, Trash2, X } from 'lucide-react';
import { KamaloShell, SectionLabel } from '@/components/kamalo-shell';

const firstUsePrompts = [
  { label: 'Rewards', text: 'How do KAMALO Coins work?' },
  { label: 'Auto KAMALO', text: 'Explain Auto KAMALO in simple terms.' },
  { label: 'FINCADO', text: 'What is FINCADO and how do I use it?' },
  { label: 'Transactions', text: 'Where can I see my recent transactions?' },
];

const compactDate = (value: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));

function ConversationSkeleton() {
  return <div className="space-y-2 px-1"><div className="skeleton h-14 rounded-lg" /><div className="skeleton h-14 rounded-lg" /><div className="skeleton h-14 rounded-lg" /></div>;
}

function ConversationHistory({ conversations, selectedId, loading, onSelect, onDelete }: { conversations: ConversationSummary[]; selectedId: string | null; loading: boolean; onSelect: (id: string) => void; onDelete: (conversation: ConversationSummary) => void }) {
  return (
    <div className="mt-7" data-testid="panel-conversation-history">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="font-mono text-[10px] uppercase tracking-[.17em] text-muted-foreground">Recent conversations</span>
        <span className="font-mono text-[10px] text-muted-foreground/70" data-testid="text-conversation-count">{conversations.length}</span>
      </div>
      {loading ? <ConversationSkeleton /> : conversations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-[11px] leading-relaxed text-muted-foreground" data-testid="empty-conversations">Your conversation history will appear here.</div>
      ) : (
        <div className="thin-scrollbar max-h-[min(47vh,440px)] space-y-1 overflow-y-auto pr-1">
          {conversations.map((conversation) => (
            <div key={conversation.id} className={`group flex items-center rounded-lg border px-2.5 py-2.5 transition-colors ${selectedId === conversation.id ? 'border-[hsl(var(--primary)/.28)] bg-[hsl(var(--primary)/.09)]' : 'border-transparent hover:border-border hover:bg-card'}`} data-testid={`conversation-item-${conversation.id}`}>
              <button onClick={() => onSelect(conversation.id)} className="min-w-0 flex-1 text-left" data-testid={`button-select-conversation-${conversation.id}`}>
                <div className="truncate text-[12px] font-semibold">{conversation.title || 'Untitled conversation'}</div>
                <div className="mt-1 font-mono text-[9px] text-muted-foreground">{conversation.messageCount} {conversation.messageCount === 1 ? 'message' : 'messages'} · {compactDate(conversation.updatedAt)}</div>
              </button>
              <button onClick={() => onDelete(conversation)} className="ml-1 rounded-md p-1.5 text-muted-foreground opacity-70 transition-opacity hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100" aria-label={`Delete ${conversation.title || 'conversation'}`} data-testid={`button-delete-conversation-${conversation.id}`}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssistantBadge() {
  return <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Headphones size={15} /></div>;
}

function MessageBubble({ message, onFeedback, onCopy, onRetry }: { message: ChatMessage; onFeedback: (message: ChatMessage, rating: 'helpful' | 'not_helpful') => void; onCopy: (content: string) => void; onRetry: () => void }) {
  const assistant = message.role === 'assistant';
  return (
    <div className={`animate-rise flex gap-3 ${assistant ? 'items-start' : 'items-start justify-end'}`} data-testid={`message-${message.id}`}>
      {assistant && <AssistantBadge />}
      <div className={`max-w-[min(680px,87%)] ${assistant ? '' : 'order-first'}`}>
        <div className={`rounded-xl px-4 py-3.5 text-[13px] leading-[1.75] ${assistant ? 'rounded-tl-sm border border-border/80 bg-card text-card-foreground shadow-[var(--shadow-sm)]' : 'rounded-tr-sm bg-primary text-primary-foreground shadow-[0_7px_18px_hsl(var(--primary)/.16)]'}`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
        <div className={`mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground ${assistant ? '' : 'justify-end'}`}>
          <span className="font-mono">{new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(message.createdAt))}</span>
          {assistant && (
            <>
              <span className="mx-1 opacity-40">·</span>
              <button onClick={() => onCopy(message.content)} className="rounded-md p-1.5 hover:bg-muted hover:text-foreground" aria-label="Copy assistant response" data-testid={`button-copy-message-${message.id}`}><Clipboard size={13} /></button>
              <button onClick={() => onFeedback(message, 'helpful')} className={`rounded-md p-1.5 hover:bg-muted hover:text-primary ${message.feedback === 'helpful' ? 'text-primary' : ''}`} aria-label="Mark response helpful" data-testid={`button-helpful-${message.id}`}><ThumbsUp size={13} /></button>
              <button onClick={() => onFeedback(message, 'not_helpful')} className={`rounded-md p-1.5 hover:bg-muted hover:text-destructive ${message.feedback === 'not_helpful' ? 'text-destructive' : ''}`} aria-label="Mark response not helpful" data-testid={`button-not-helpful-${message.id}`}><ThumbsDown size={13} /></button>
              <button onClick={onRetry} className="rounded-md p-1.5 hover:bg-muted hover:text-foreground" aria-label="Retry last prompt" data-testid={`button-retry-message-${message.id}`}><RefreshCw size={13} /></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-3 animate-rise" data-testid="status-streaming">
      <AssistantBadge />
      <div className="min-w-[min(340px,80%)] max-w-[min(680px,87%)] rounded-xl rounded-tl-sm border border-border/80 bg-card px-4 py-3.5 shadow-[var(--shadow-sm)]">
        {content && <div className="mb-3 whitespace-pre-wrap text-[13px] leading-[1.75] text-card-foreground">{content}</div>}
        <div className="flex items-center justify-between gap-4 text-[11px] text-muted-foreground"><span>Checking approved sources</span><span className="font-mono text-[10px] text-primary">working</span></div>
        <div className="mt-3 h-1 overflow-hidden rounded-sm bg-muted"><div className="h-full w-2/5 rounded-sm bg-primary transition-transform duration-700" /></div>
      </div>
    </div>
  );
}

async function streamAssistantResponse(conversationId: string, content: string, onChunk: (chunk: string) => void): Promise<{ content: string; messageId: string | null }> {
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error('Assistant request failed');
  if (!response.body) {
    const fallback = await response.text();
    return { content: fallback, messageId: null };
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';
  let messageId: string | null = null;
  const consume = (event: string) => {
    const line = event.split('\n').find((item) => item.startsWith('data:'));
    if (!line) return;
    try {
      const payload = JSON.parse(line.slice(5).trim()) as { content?: string; done?: boolean; messageId?: string };
      if (payload.content) {
        fullResponse += payload.content;
        onChunk(fullResponse);
      }
      if (payload.messageId) messageId = payload.messageId;
    } catch {
      // Ignore incomplete event frames; the next read will complete them.
    }
  };
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    events.forEach(consume);
    if (done) break;
  }
  if (buffer.trim()) consume(buffer);
  return { content: fullResponse, messageId };
}

function ChatEmptyState({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <div className="flex min-h-[min(530px,calc(100dvh-260px))] flex-col justify-center px-1 py-12">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-[hsl(var(--primary)/.24)] bg-[hsl(var(--primary)/.08)] text-primary"><Headphones size={22} /></div>
      <SectionLabel>Support workspace</SectionLabel>
      <h1 className="mt-4 max-w-xl text-[clamp(2rem,4.4vw,3.5rem)] font-extrabold leading-[1.03] tracking-[-.055em] text-foreground">What can we help you<br className="hidden sm:block" /> verify today?</h1>
      <p className="mt-5 max-w-lg text-[13px] leading-7 text-muted-foreground">Ask about your KAMALO account, rewards, transactions, or a product feature. Answers are grounded in approved support content.</p>
      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
        {firstUsePrompts.map((prompt) => <button key={prompt.label} onClick={() => onPrompt(prompt.text)} className="group rounded-lg border border-border/80 bg-card/70 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card" data-testid={`button-prompt-${prompt.label.toLowerCase().replaceAll(' ', '-')}`}><span className="font-mono text-[9px] uppercase tracking-[.15em] text-primary">{prompt.label}</span><span className="mt-1 block text-[12px] font-semibold text-foreground/80 group-hover:text-foreground">{prompt.text}</span></button>)}
      </div>
    </div>
  );
}

export function HomePage() {
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const conversationsQuery = useListConversations({ query: { queryKey: getListConversationsQueryKey() } });
  const healthQuery = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const conversationQuery = useGetConversation(selectedId || '', { query: { enabled: !!selectedId, queryKey: getGetConversationQueryKey(selectedId || '') } });
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
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
    setStreamingText('');
    setErrorMessage('');
    setMobileHistoryOpen(false);
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
      setStreamingText('');
      const response = await streamAssistantResponse(conversationId, content, setStreamingText);
      const assistantMessage: ChatMessage = { id: response.messageId || `local-assistant-${Date.now()}`, conversationId, role: 'assistant', content: response.content || 'I could not find a grounded answer for that yet.', createdAt: new Date().toISOString(), feedback: null };
      setLocalMessages((current) => [...current, assistantMessage]);
      await queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(conversationId) });
      await queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    } catch {
      setErrorMessage('That did not go through. Check your connection and try again.');
      setInput(content);
    } finally {
      setIsSending(false);
      setStreamingText('');
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
      setNotice(rating === 'helpful' ? 'Thanks. That signal helps keep answers useful.' : 'Thanks for the signal. We will review this answer.');
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

  const healthLabel = healthQuery.isLoading ? 'Checking service' : healthQuery.isError ? 'Service check failed' : 'Service ready';

  return (
    <KamaloShell conversationCount={conversations.length} onNewConversation={startNewConversation} mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen}>
      <div className="mx-auto flex min-h-[calc(100dvh-57px)] max-w-[1320px] flex-col px-4 pb-4 sm:px-6 md:min-h-[100dvh] md:px-9 md:py-7 lg:px-12">
        <header className="flex items-center justify-between border-b border-border/70 py-4 md:border-0 md:py-0">
          <div className="min-w-0"><SectionLabel>Customer support / KAMALO AI</SectionLabel><h2 className="mt-2 truncate text-[15px] font-bold tracking-[-.02em] md:text-[20px]">{activeConversation?.title || 'Support workspace'}</h2></div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-md border border-border bg-card/70 px-3 py-2 sm:flex"><span className={`h-1.5 w-1.5 rounded-sm ${healthQuery.isError ? 'bg-destructive' : 'bg-primary'}`} /><span className="font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground" data-testid="status-health">{healthLabel}</span></div>
            <button onClick={clearCurrent} disabled={!selectedId || deleteConversation.isPending} className="hidden items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40 sm:flex" data-testid="button-clear-conversation"><Eraser size={14} /> Clear</button>
          </div>
        </header>

        <div className="mt-3 flex items-center justify-between border-y border-border/60 py-2.5 xl:hidden">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-sm ${healthQuery.isError ? 'bg-destructive' : 'bg-primary'}`} />{healthLabel}</div>
          <button onClick={() => setMobileHistoryOpen((open) => !open)} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10" aria-expanded={mobileHistoryOpen} data-testid="button-toggle-mobile-history">{mobileHistoryOpen ? <X size={14} /> : <MoreHorizontal size={14} />} History <span className="font-mono text-[10px] text-muted-foreground">{conversations.length}</span></button>
        </div>
        {mobileHistoryOpen && <div className="rounded-b-lg border-x border-b border-border bg-card px-3 pb-3 xl:hidden"><ConversationHistory conversations={conversations} selectedId={selectedId} loading={conversationsQuery.isLoading} onSelect={(id) => { setSelectedId(id); setLocalMessages([]); setMobileHistoryOpen(false); }} onDelete={deleteConversationItem} /></div>}

        <div className="grid min-h-0 flex-1 gap-8 xl:grid-cols-[minmax(0,1fr)_248px] xl:gap-12">
          <section className="flex min-h-0 flex-col pt-5 md:pt-12">
            {messages.length === 0 && !conversationQuery.isLoading ? <ChatEmptyState onPrompt={(text) => void sendMessage(text)} /> : (
              <div className="thin-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto pb-7 pr-1 md:space-y-7" data-testid="conversation-messages">
                {conversationQuery.isLoading && <div className="space-y-5"><div className="skeleton h-20 w-4/5 rounded-xl" /><div className="ml-auto skeleton h-14 w-3/5 rounded-xl" /></div>}
                {messages.map((message) => <MessageBubble key={message.id} message={message} onFeedback={handleFeedback} onCopy={(content) => { void navigator.clipboard?.writeText(content); setNotice('Answer copied to clipboard.'); window.setTimeout(() => setNotice(''), 2200); }} onRetry={retryLast} />)}
                {isSending && <StreamingBubble content={streamingText} />}
              </div>
            )}
            {errorMessage && <div className="mb-3 flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-[11px] text-destructive" data-testid="status-send-error"><span>{errorMessage}</span><button onClick={() => void sendMessage()} className="font-semibold underline" data-testid="button-retry-send">Try again</button></div>}
            {notice && <div className="mb-3 flex items-center justify-center gap-2 text-center font-mono text-[10px] text-primary animate-rise" data-testid="status-feedback"><Check size={13} />{notice}</div>}
            <div className="safe-bottom sticky bottom-0 z-10 -mx-1 bg-background/95 pt-2 backdrop-blur-sm">
              <div className="relative rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-md)] focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5">
                <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Ask about KAMALO..." rows={2} maxLength={4000} className="w-full resize-none bg-transparent px-3 py-2 text-[13px] leading-6 outline-none placeholder:text-muted-foreground/70" data-testid="input-chat-message" />
                <div className="flex items-center justify-between px-2 pb-1"><span className="hidden font-mono text-[9px] text-muted-foreground/70 sm:block">Enter to send · Shift + Enter for a new line</span><span className="font-mono text-[9px] text-muted-foreground/70 sm:hidden">Enter to send</span><button onClick={() => void sendMessage()} disabled={!input.trim() || isSending} className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Send message" data-testid="button-send-message"><Send size={15} /></button></div>
              </div>
              <div className="mt-2 flex items-center justify-center gap-1.5 text-center font-mono text-[9px] text-muted-foreground/65"><ShieldCheck size={12} className="text-primary" /> KAMALO AI can make mistakes. Check important details in the app.</div>
            </div>
          </section>

          <aside className="hidden border-l border-border/70 pl-7 xl:block">
            <ConversationHistory conversations={conversations} selectedId={selectedId} loading={conversationsQuery.isLoading} onSelect={(id) => { setSelectedId(id); setLocalMessages([]); }} onDelete={deleteConversationItem} />
            <div className="mt-8 border-t border-border/70 pt-6"><div className="font-mono text-[10px] uppercase tracking-[.17em] text-muted-foreground">Support note</div><p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">Use a specific question for a faster, more useful answer. Approved guidance is always shown first.</p><button onClick={() => setInput('What can you help me understand?')} className="mt-4 flex items-center gap-2 text-[11px] font-bold text-primary hover:underline" data-testid="button-suggest-question">Explore a question <MoreHorizontal size={14} /></button></div>
          </aside>
        </div>
      </div>
    </KamaloShell>
  );
}