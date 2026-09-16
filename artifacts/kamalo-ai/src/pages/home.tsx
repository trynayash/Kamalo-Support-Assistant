import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, ConversationSummary } from '@workspace/api-client-react';
import {
  getGetConversationQueryKey,
  getListConversationsQueryKey,
  useCreateConversation,
  useCreateMessageFeedback,
  useDeleteConversation,
  useGetConversation,
  useListConversations,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowPath, HiOutlineBackspace, HiOutlineCheck, HiOutlineClipboardDocument, HiOutlineHandThumbDown, HiOutlineHandThumbUp, HiOutlinePaperAirplane, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';
import { KamaloShell, SectionLabel } from '@/components/kamalo-shell';

const firstUsePrompts = [
  { label: 'Rewards', text: 'How do KAMALO Coins work?' },
  { label: 'Auto KAMALO', text: 'Explain Auto KAMALO in simple terms.' },
  { label: 'FINCADO', text: 'What is FINCADO and how do I use it?' },
  { label: 'Transactions', text: 'Where can I see my recent transactions?' },
];

const CLIENT_SAFE_RESPONSE_ERROR = 'I’m having trouble responding right now. Please try again.';

const compactDate = (value: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));

function cleanDisplayedAssistantContent(content: string) {
  let cleaned = content.trim();
  if (
    cleaned.length >= 2 &&
    ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith('“') && cleaned.endsWith('”')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'")))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned
    .replace(/["“”`]/g, '')
    .replace(/[—–]/g, ', ')
    .replace(/(\*\*[^*\n]+\*\*)\s*[-:]\s*/g, '$1. ')
    .replace(/^[ \t]*[-•][ \t]+/gm, '')
    .replace(/\n*(If you(?:'d| would) like|Would you like|Let me know|Feel free to ask)[\s\S]*$/i, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function ConversationSkeleton() {
  return <div className="space-y-2 px-1"><div className="skeleton h-14 rounded-lg" /><div className="skeleton h-14 rounded-lg" /><div className="skeleton h-14 rounded-lg" /></div>;
}

function ConversationHistory({ conversations, selectedId, loading, error, onSelect, onDelete }: { conversations: ConversationSummary[]; selectedId: string | null; loading: boolean; error?: boolean; onSelect: (id: string) => void; onDelete: (conversation: ConversationSummary) => void }) {
  return (
    <div id="conversation-history" className="mt-7" data-testid="panel-conversation-history">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="font-mono text-[10px] uppercase tracking-[.17em] text-muted-foreground">Recent conversations</span>
        <span className="font-mono text-[10px] text-muted-foreground/70" data-testid="text-conversation-count">{conversations.length}</span>
      </div>
      {error ? <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center text-[11px] leading-relaxed text-destructive" data-testid="status-conversation-history-error">History is temporarily unavailable. Please try again shortly.</div> : loading ? <ConversationSkeleton /> : conversations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-[11px] leading-relaxed text-muted-foreground" data-testid="empty-conversations">Your conversation history will appear here.</div>
      ) : (
        <div className="thin-scrollbar max-h-[min(47vh,440px)] space-y-1 overflow-y-auto pr-1">
          {conversations.map((conversation) => (
            <div key={conversation.id} className={`group flex items-center rounded-lg border px-2.5 py-2.5 transition-colors ${selectedId === conversation.id ? 'border-[hsl(var(--primary)/.28)] bg-[hsl(var(--primary)/.09)]' : 'border-transparent hover:border-border hover:bg-card'}`} data-testid={`conversation-item-${conversation.id}`}>
              <button onClick={() => onSelect(conversation.id)} className="min-w-0 flex-1 text-left" data-testid={`button-select-conversation-${conversation.id}`}>
                <div className="truncate text-[12px] font-semibold">{conversation.title || 'Untitled conversation'}</div>
                <div className="mt-1 font-mono text-[9px] text-muted-foreground">{conversation.messageCount} {conversation.messageCount === 1 ? 'message' : 'messages'} · {compactDate(conversation.updatedAt)}</div>
              </button>
              <button onClick={() => onDelete(conversation)} className="ml-1 rounded-md p-1.5 text-muted-foreground opacity-70 transition-opacity hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100" aria-label={`Delete ${conversation.title || 'conversation'}`} data-testid={`button-delete-conversation-${conversation.id}`}><HiOutlineTrash size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormattedMessage({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*\n]+\*\*|__[^_\n]+__)/g);
  return (
    <>
      {parts.map((part, index) => {
        const bold = (part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'));
        return bold
          ? <strong key={`${part}-${index}`} className="font-bold text-current">{part.slice(2, -2)}</strong>
          : <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function MessageBubble({ message, onFeedback, onCopy, onRetry }: { message: ChatMessage; onFeedback: (message: ChatMessage, rating: 'helpful' | 'not_helpful') => void; onCopy: (content: string) => void; onRetry: () => void }) {
  const assistant = message.role === 'assistant';
  const displayContent = assistant ? cleanDisplayedAssistantContent(message.content) : message.content;
  return (
    <div className={`animate-rise flex gap-3 ${assistant ? 'items-start' : 'items-start justify-end'}`} data-testid={`message-${message.id}`}>
      <div className={`min-w-0 max-w-[min(680px,87%)] ${assistant ? '' : 'order-first'}`}>
        <div className={`max-w-full rounded-xl px-4 py-3.5 text-[13px] leading-[1.75] [overflow-wrap:anywhere] ${assistant ? 'rounded-tl-sm border border-border/80 bg-card text-card-foreground shadow-[var(--shadow-sm)]' : 'rounded-tr-sm bg-primary text-primary-foreground shadow-[0_7px_18px_hsl(var(--primary)/.16)]'}`}>
          <div className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]"><FormattedMessage content={displayContent} /></div>
        </div>
        <div className={`mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground ${assistant ? '' : 'justify-end'}`}>
          <span className="font-mono">{new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(message.createdAt))}</span>
          {assistant && (
            <>
              <span className="mx-1 opacity-40">·</span>
              <button onClick={() => onCopy(displayContent)} className="rounded-md p-1.5 hover:bg-muted hover:text-foreground" aria-label="Copy assistant response" data-testid={`button-copy-message-${message.id}`}><HiOutlineClipboardDocument size={13} /></button>
              <button onClick={() => onFeedback(message, 'helpful')} className={`rounded-md p-1.5 hover:bg-muted hover:text-primary ${message.feedback === 'helpful' ? 'text-primary' : ''}`} aria-label="Mark response helpful" data-testid={`button-helpful-${message.id}`}><HiOutlineHandThumbUp size={13} /></button>
              <button onClick={() => onFeedback(message, 'not_helpful')} className={`rounded-md p-1.5 hover:bg-muted hover:text-destructive ${message.feedback === 'not_helpful' ? 'text-destructive' : ''}`} aria-label="Mark response not helpful" data-testid={`button-not-helpful-${message.id}`}><HiOutlineHandThumbDown size={13} /></button>
              <button onClick={onRetry} className="rounded-md p-1.5 hover:bg-muted hover:text-foreground" aria-label="Retry last prompt" data-testid={`button-retry-message-${message.id}`}><HiOutlineArrowPath size={13} /></button>
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
      <div className="min-w-0 w-fit max-w-full rounded-xl rounded-tl-sm border border-border/80 bg-card px-4 py-3.5 shadow-[var(--shadow-sm)]">
        {content && <div className="mb-3 min-w-0 whitespace-pre-wrap text-[13px] leading-[1.75] text-card-foreground [overflow-wrap:anywhere]"><FormattedMessage content={content} /></div>}
        <div className="flex items-center gap-1.5 py-1" role="status" aria-label="KAMALO is responding">
          <span className="sr-only">KAMALO is responding</span>
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: '140ms' }} />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: '280ms' }} />
        </div>
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
    await response.text();
    return { content: CLIENT_SAFE_RESPONSE_ERROR, messageId: null };
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';
  let messageId: string | null = null;
  let finalContent: string | null = null;
  const consume = (event: string) => {
    const line = event.split('\n').find((item) => item.startsWith('data:'));
    if (!line) return;
    try {
      const payload = JSON.parse(line.slice(5).trim()) as { content?: unknown; done?: boolean; messageId?: unknown; finalContent?: unknown };
      if (typeof payload.content === 'string' && payload.content) {
        fullResponse += payload.content;
        onChunk(fullResponse);
      }
      if (typeof payload.messageId === 'string') messageId = payload.messageId;
      if (typeof payload.finalContent === 'string') finalContent = payload.finalContent;
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
  return { content: finalContent || fullResponse, messageId };
}

function ChatEmptyState({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <div className="flex min-h-[min(530px,calc(100dvh-260px))] flex-col justify-center px-1 py-12">
      <SectionLabel>Support workspace</SectionLabel>
      <h1 className="mt-4 max-w-xl text-[clamp(2rem,4.4vw,3.5rem)] font-extrabold leading-[1.03] tracking-[-.055em] text-foreground">What can we help you<br className="hidden sm:block" /> verify today?</h1>
      <p className="mt-5 max-w-lg text-[13px] leading-7 text-muted-foreground">Ask about your KAMALO account, rewards, transactions, or a product feature. Answers are grounded in approved support content.</p>
      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
        {firstUsePrompts.map((prompt) => <button key={prompt.label} onClick={() => onPrompt(prompt.text)} className="group rounded-lg border border-border/80 bg-card/70 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card" data-testid={`button-prompt-${prompt.label.toLowerCase().replaceAll(' ', '-')}`}><span className="font-mono text-[9px] uppercase tracking-[.15em] text-primary">{prompt.label}</span><span className="mt-1 block text-[12px] font-semibold text-foreground/80 group-hover:text-foreground">{prompt.text}</span></button>)}
      </div>
    </div>
  );
}

function ChatClosedState({ onNewConversation }: { onNewConversation: () => void }) {
  return (
    <div className="flex min-h-[min(530px,calc(100dvh-260px))] flex-col items-center justify-center px-4 py-12 text-center animate-rise">
      <SectionLabel>Conversation closed</SectionLabel>
      <h1 className="mt-4 max-w-md text-[clamp(1.7rem,4vw,2.5rem)] font-extrabold leading-[1.08] tracking-[-.045em] text-foreground">This chat was closed due to inactivity.</h1>
      <p className="mt-4 max-w-md text-[13px] leading-7 text-muted-foreground">Your conversation is saved in History. Start a new conversation when you are ready.</p>
      <button onClick={onNewConversation} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-closed-new-conversation"><HiOutlinePlus size={16} /> Start new conversation</button>
    </div>
  );
}

export function HomePage() {
  const queryClient = useQueryClient();
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [newConversationNotice, setNewConversationNotice] = useState(false);
  const [inactivityState, setInactivityState] = useState<'active' | 'prompted' | 'closed'>('active');
  const [inactivityResetToken, setInactivityResetToken] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useListConversations({ query: { queryKey: getListConversationsQueryKey() } });
  const conversationQuery = useGetConversation(selectedId || '', { query: { enabled: !!selectedId, queryKey: getGetConversationQueryKey(selectedId || '') } });
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const createFeedback = useCreateMessageFeedback();
  const conversations = useMemo(() => conversationsQuery.data || [], [conversationsQuery.data]);
  const activeConversation = conversations.find((conversation) => conversation.id === selectedId);
  const messages = localMessages.length > 0 ? localMessages : (conversationQuery.data?.messages || []);

  useEffect(() => {
    if (!selectedId && !isCreatingConversation && conversations.length > 0) setSelectedId(conversations[0].id);
  }, [conversations, isCreatingConversation, selectedId]);

  useEffect(() => {
    if (conversationQuery.data?.id === selectedId && !isSending) setLocalMessages(conversationQuery.data.messages);
  }, [conversationQuery.data, selectedId, isSending]);

  useEffect(() => {
    const container = messagesScrollRef.current;
    if (!container || (messages.length === 0 && !isSending)) return;
    const frame = window.requestAnimationFrame(() => {
      const behavior = isSending ? 'auto' : 'smooth';
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages.length, streamingText, isSending, selectedId]);

  useEffect(() => {
    if (!selectedId || messages.length === 0 || isSending || inactivityState === 'closed') return;
    const promptTimer = window.setTimeout(() => setInactivityState('prompted'), 30_000);
    const closeTimer = window.setTimeout(() => setInactivityState('closed'), 90_000);
    return () => {
      window.clearTimeout(promptTimer);
      window.clearTimeout(closeTimer);
    };
  }, [selectedId, messages.length, isSending, inactivityResetToken]);

  const markUserActivity = () => {
    if (inactivityState === 'closed') return;
    setInactivityState('active');
    setInactivityResetToken((value) => value + 1);
  };

  const startNewConversation = async () => {
    if (isCreatingConversation || isSending) return;
    setIsCreatingConversation(true);
    setNewConversationNotice(false);
    setErrorMessage('');
    setMobileHistoryOpen(false);
    setSelectedId(null);
    setLocalMessages([]);
    setInput('');
    setStreamingText('');
    setInactivityState('active');
    setInactivityResetToken((value) => value + 1);
    try {
      const created = await createConversation.mutateAsync({ data: { title: 'New conversation' } });
      setSelectedId(created.id);
      await queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      setNewConversationNotice(true);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } catch {
      setErrorMessage('The new conversation could not be opened. Please try again.');
    } finally {
      setIsCreatingConversation(false);
    }
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

  const copyAssistantResponse = async (content: string) => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(content);
      setNotice('Answer copied to clipboard.');
    } catch {
      setNotice('Copying is not available right now.');
    }
    window.setTimeout(() => setNotice(''), 2200);
  };

  const deleteConversationItem = async (conversation: ConversationSummary) => {
    if (!window.confirm(`Remove “${conversation.title || 'Untitled conversation'}” from your chat history?\n\nThe visible chat and its messages will be removed and cannot be undone. KAMALO will retain an internal record for system and support continuity.`)) return;
    try {
      await deleteConversation.mutateAsync({ conversationId: conversation.id });
      await queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      if (selectedId === conversation.id) void startNewConversation();
    } catch {
      setErrorMessage('This chat could not be removed right now. Please try again.');
    }
  };

  const clearCurrent = async () => {
    if (!selectedId || !activeConversation) return startNewConversation();
    if (!window.confirm('Clear this chat?\n\nEverything in this visible chat will be deleted and cannot be undone. KAMALO will retain an internal record for system and support continuity. Continue?')) return;
    try {
      await deleteConversation.mutateAsync({ conversationId: activeConversation.id });
      await queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      await startNewConversation();
    } catch {
      setErrorMessage('This chat could not be cleared right now. Please try again.');
    }
  };

  return (
    <KamaloShell conversationCount={conversations.length} onNewConversation={startNewConversation}>
      <div className="chat-workspace mx-auto flex min-h-0 max-w-[1320px] flex-col overflow-hidden px-4 pb-4 sm:px-6 md:px-9 md:py-7 lg:px-12" onPointerDown={markUserActivity} onKeyDown={markUserActivity}>
          <header className="flex items-center justify-between border-b border-border/70 py-4 md:border-0 md:py-0">
          <div className="min-w-0"><SectionLabel>Customer support / KAMALO AI</SectionLabel><h2 className="mt-2 truncate text-[15px] font-bold tracking-[-.02em] md:text-[20px]">{activeConversation?.title || 'Support workspace'}</h2></div>
          <button onClick={clearCurrent} disabled={!selectedId || deleteConversation.isPending} className="hidden items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40 sm:flex" data-testid="button-clear-conversation"><HiOutlineBackspace size={14} /> Clear</button>
        </header>
          {newConversationNotice && <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/[.06] px-4 py-3 text-[12px] text-foreground animate-rise" role="status" data-testid="status-new-conversation"><div><div className="font-semibold">New conversation created</div><div className="mt-1 text-muted-foreground">Your earlier chat is saved in History. The same approved KAMALO knowledge is available here.</div></div><div className="flex shrink-0 items-center gap-2"><button onClick={() => { setMobileHistoryOpen(true); window.setTimeout(() => document.getElementById('conversation-history')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0); }} className="rounded-lg border border-primary/25 bg-background px-3 py-2 text-[11px] font-semibold text-primary hover:bg-primary/10" data-testid="button-view-history">View history</button><button onClick={() => setNewConversationNotice(false)} className="rounded-md px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Dismiss new conversation notice" data-testid="button-dismiss-new-conversation">×</button></div></div>}

        <div className="mt-3 flex items-center justify-end border-y border-border/60 py-2.5 xl:hidden">
          <button onClick={() => setMobileHistoryOpen((open) => !open)} className="rounded-md px-2 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10" aria-expanded={mobileHistoryOpen} data-testid="button-toggle-mobile-history">{mobileHistoryOpen ? 'Close history' : 'History'} <span className="font-mono text-[10px] text-muted-foreground">{conversations.length}</span></button>
        </div>
        {mobileHistoryOpen && <div className="rounded-b-lg border-x border-b border-border bg-card px-3 pb-3 xl:hidden"><ConversationHistory conversations={conversations} selectedId={selectedId} loading={conversationsQuery.isLoading} error={conversationsQuery.isError} onSelect={(id) => { setSelectedId(id); setLocalMessages([]); setMobileHistoryOpen(false); }} onDelete={deleteConversationItem} /></div>}

        <div className="grid min-h-0 flex-1 gap-8 xl:grid-cols-[minmax(0,1fr)_248px] xl:gap-12">
          <section className="flex min-h-0 min-w-0 flex-col pt-5 md:pt-12">
            {isCreatingConversation ? <div className="flex min-h-[min(530px,calc(100dvh-260px))] items-center justify-center text-[13px] text-muted-foreground animate-rise">Opening a new conversation...</div> : inactivityState === 'closed' ? <ChatClosedState onNewConversation={() => void startNewConversation()} /> : conversationQuery.isError ? <div className="flex min-h-[min(530px,calc(100dvh-260px))] flex-col items-center justify-center text-center animate-rise"><p className="text-[13px] text-destructive">This conversation could not be loaded.</p><button onClick={() => void queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(selectedId || '') })} className="mt-3 rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-semibold text-primary hover:bg-muted" data-testid="button-retry-conversation-load">Try again</button></div> : messages.length === 0 && !conversationQuery.isLoading ? (
              <div ref={messagesScrollRef} className="thin-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-7 pr-1" data-testid="conversation-messages">
                <ChatEmptyState onPrompt={(text) => void sendMessage(text)} />
              </div>
            ) : (
              <div ref={messagesScrollRef} className="thin-scrollbar min-h-0 min-w-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto overscroll-contain pb-7 pr-1 md:space-y-7" data-testid="conversation-messages">
                {conversationQuery.isLoading && <div className="space-y-5"><div className="skeleton h-20 w-4/5 rounded-xl" /><div className="ml-auto skeleton h-14 w-3/5 rounded-xl" /></div>}
                {messages.map((message) => <MessageBubble key={message.id} message={message} onFeedback={handleFeedback} onCopy={(content) => { void copyAssistantResponse(content); }} onRetry={retryLast} />)}
                {isSending && <StreamingBubble content={streamingText} />}
                <div ref={messagesEndRef} className="h-px w-full" aria-hidden="true" data-testid="conversation-end" />
              </div>
            )}
            {errorMessage && <div className="mb-3 flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-[11px] text-destructive" data-testid="status-send-error"><span>{errorMessage}</span><button onClick={() => void sendMessage()} className="font-semibold underline" data-testid="button-retry-send">Try again</button></div>}
            {notice && <div className="mb-3 flex items-center justify-center gap-2 text-center font-mono text-[10px] text-primary animate-rise" data-testid="status-feedback"><HiOutlineCheck size={13} />{notice}</div>}
            {inactivityState === 'prompted' && <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[.06] px-4 py-3 text-[12px] text-foreground animate-rise" role="alert" data-testid="status-inactivity-prompt"><span>Are you there?</span><button onClick={markUserActivity} className="rounded-lg border border-primary/25 bg-background px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10" data-testid="button-inactivity-continue">I’m here</button></div>}
            {inactivityState !== 'closed' && <div className="safe-bottom shrink-0 -mx-1 bg-background/95 pt-2 backdrop-blur-sm">
              <div className="relative rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-md)] focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5">
                <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about KAMALO..." rows={2} maxLength={4000} className="w-full resize-none bg-transparent px-3 py-2 text-[13px] leading-6 outline-none placeholder:text-muted-foreground/70" data-testid="input-chat-message" />
                <div className="flex justify-end px-2 pb-1"><button onClick={() => void sendMessage()} disabled={!input.trim() || isSending} className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Send message" data-testid="button-send-message"><HiOutlinePaperAirplane size={15} /></button></div>
              </div>
              <p className="mt-2 px-2 text-center text-[10px] leading-4 text-muted-foreground/70">KAMALO can make mistakes. Check important information before acting.</p>
            </div>}
          </section>

          <aside className="hidden border-l border-border/70 pl-7 xl:block">
            <ConversationHistory conversations={conversations} selectedId={selectedId} loading={conversationsQuery.isLoading} error={conversationsQuery.isError} onSelect={(id) => { setSelectedId(id); setLocalMessages([]); }} onDelete={deleteConversationItem} />
          </aside>
        </div>
      </div>
    </KamaloShell>
  );
}