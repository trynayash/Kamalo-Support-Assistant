import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, ConversationSummary, ImageAttachment } from '@workspace/api-client-react';
import {
  useCreateSupportTicket,
  getGetConversationQueryKey,
  getListConversationsQueryKey,
  useCreateConversation,
  useCreateMessageFeedback,
  useDeleteConversation,
  useGetConversation,
  useListConversations,
  uploadConversationImage,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowPath, HiOutlineBackspace, HiOutlineCheck, HiOutlineClipboardDocument, HiOutlineHandThumbDown, HiOutlineHandThumbUp, HiOutlineLanguage, HiOutlineMicrophone, HiOutlinePaperAirplane, HiOutlinePaperClip, HiOutlinePlus, HiOutlineStop, HiOutlineXMark } from 'react-icons/hi2';
import { KamaloShell, SectionLabel } from '@/components/kamalo-shell';
import { FeedbackDialog, type FeedbackDialogSubmission } from '@/components/feedback-dialog';
import { useLocation } from 'wouter';
import { getTicketLevelMeta } from '@/lib/ticket-levels';
import { useSpeechInput } from '@/hooks/use-speech-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CLIENT_SAFE_RESPONSE_ERROR = 'I’m having trouble responding right now. Please try again.';
const IMAGE_ATTACHMENT_MESSAGE = 'Image attachment sent.';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const quickPrompts = [
  { label: 'Coins', text: 'How do KAMALO Coins work?' },
  { label: 'Transactions', text: 'Where can I see my recent transactions?' },
  { label: 'Auto KAMALO', text: 'What is Auto KAMALO?' },
];

type ChatLanguage = 'en' | 'hi' | 'mr';

const chatLanguages: Array<{ value: ChatLanguage; label: string; voiceLocale: string }> = [
  { value: 'en', label: 'English', voiceLocale: 'en-IN' },
  { value: 'hi', label: 'हिन्दी', voiceLocale: 'hi-IN' },
  { value: 'mr', label: 'मराठी', voiceLocale: 'mr-IN' },
];

const chatLanguageDescriptions: Record<ChatLanguage, string> = {
  en: 'Listen and reply in English',
  hi: 'सुनें और हिन्दी में जवाब दें',
  mr: 'ऐका आणि मराठीत उत्तर द्या',
};

const CHAT_LANGUAGE_STORAGE_KEY = 'kamalo-chat-language';

function initialChatLanguage(): ChatLanguage {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(CHAT_LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'hi' || saved === 'mr') return saved;
  }
  const browserLanguage = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : '';
  return browserLanguage.startsWith('hi') ? 'hi' : browserLanguage.startsWith('mr') ? 'mr' : 'en';
}

function ChatLanguageSelect({
  value,
  selectedLabel,
  onChange,
  disabled,
}: {
  value: ChatLanguage;
  selectedLabel: string;
  onChange: (value: ChatLanguage) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue as ChatLanguage)} disabled={disabled}>
      <SelectTrigger
        className="chat-language-trigger h-9 w-[7.75rem] gap-1.5 rounded-xl border-border/80 bg-background/80 px-2.5 text-[10px] font-semibold text-foreground shadow-none transition-[border-color,box-shadow,background-color] hover:border-primary/40 hover:bg-card focus:ring-4 focus:ring-primary/10 sm:w-[7.5rem]"
        aria-label="Chat language"
        data-testid="control-chat-language"
      >
        <HiOutlineLanguage size={14} className="shrink-0 text-primary" />
        <SelectValue className="min-w-0 flex-1 text-left" aria-label={selectedLabel}>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent
        align="start"
        sideOffset={8}
        className="chat-language-content w-[14rem] rounded-2xl border-border/80 bg-popover/95 p-1.5 shadow-[0_18px_55px_hsl(var(--foreground)/.16)] backdrop-blur-xl"
      >
        <div className="px-2.5 pb-1.5 pt-1">
          <div className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Response language</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Choose how KAMALO listens and replies.</div>
        </div>
        {chatLanguages.map((language) => (
          <SelectItem
            key={language.value}
            value={language.value}
            className="min-h-12 rounded-xl py-2 pl-3 pr-9 transition-colors data-[highlighted]:bg-primary/10 data-[highlighted]:text-foreground"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[11px] font-bold">{language.label}</span>
              <span className="text-[9px] font-normal text-muted-foreground">{chatLanguageDescriptions[language.value]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type PendingImage = {
  file: File;
  previewUrl: string;
};

function imageValidationError(file: File): string | null {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const allowedExtension = extension === '.jpg' || extension === '.jpeg' || extension === '.png';
  const allowedType = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!allowedExtension || !allowedType) return 'Only JPG and PNG images can be attached.';
  if (file.size === 0) return 'That image is empty. Choose another file.';
  if (file.size > MAX_IMAGE_BYTES) return 'That image is too large. Choose an image smaller than 5 MB.';
  return null;
}

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

function ChatWelcomeState({ onPrompt, showQuickPrompts }: { onPrompt: (text: string) => void; showQuickPrompts: boolean }) {
  return (
    <div className="flex min-h-[min(440px,calc(100dvh-330px))] items-center justify-center px-4 py-8 text-center animate-rise" role="region" aria-live="polite" aria-label="Conversation start" data-testid="chat-welcome">
      <div className="max-w-md">
        <h1 className="text-[clamp(1.9rem,7vw,3.1rem)] font-extrabold leading-[1.04] tracking-[-.06em] text-foreground">
          <>How can I help you today?</>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-[13px] leading-7 text-muted-foreground">{showQuickPrompts ? 'Choose a common question or type your own.' : 'Select a conversation from your history, or start a new one from the sidebar.'}</p>
        {showQuickPrompts && <div className="mt-7 grid gap-2 sm:grid-cols-3">
          {quickPrompts.map((prompt) => (
            <button key={prompt.label} onClick={() => onPrompt(prompt.text)} className="rounded-lg border border-border/80 bg-card/60 px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card" data-testid={`button-prompt-${prompt.label.toLowerCase()}`}>
              <span className="block text-[11px] font-semibold text-foreground">{prompt.label}</span>
              <span className="mt-1 block text-[10px] leading-4 text-muted-foreground">{prompt.text}</span>
            </button>
          ))}
        </div>}
      </div>
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

function MessageBubble({ message, onFeedback, onCopy, onRetry }: { message: ChatMessage; onFeedback: (message: ChatMessage, rating: 'helpful' | 'not_helpful') => void; onCopy: (content: string) => void; onRetry?: () => void }) {
  const assistant = message.role === 'assistant';
  const displayContent = assistant ? cleanDisplayedAssistantContent(message.content) : message.content;
  return (
    <div className={`animate-rise flex gap-3 ${assistant ? 'items-start' : 'items-start justify-end'}`} data-testid={`message-${message.id}`}>
      <div className={`min-w-0 max-w-[min(680px,87%)] ${assistant ? '' : 'order-first'}`}>
        <div className={`max-w-full rounded-xl px-4 py-3.5 text-[13px] leading-[1.75] [overflow-wrap:anywhere] ${assistant ? 'rounded-tl-sm border border-border/80 bg-card text-card-foreground shadow-[var(--shadow-sm)]' : 'rounded-tr-sm bg-primary text-primary-foreground shadow-[0_7px_18px_hsl(var(--primary)/.16)]'}`}>
          {(message.attachments?.length || 0) > 0 && <div className="mb-3 space-y-2">
            {(message.attachments || []).map((attachment) => <div key={attachment.id} className="max-w-full overflow-hidden rounded-lg border border-current/15 bg-black/10">
              <img src={attachment.url} alt={`Attached image: ${attachment.filename}`} loading="lazy" referrerPolicy="no-referrer" className="max-h-64 w-full max-w-[min(360px,100%)] object-contain" />
              <a href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 border-t border-current/15 px-3 py-2 text-[10px] font-semibold underline-offset-2 hover:underline" aria-label={`Open attached image ${attachment.filename}`}>
                <span className="min-w-0 truncate">{attachment.filename}</span><span className="shrink-0">Open image</span>
              </a>
            </div>)}
          </div>}
          <div className="min-w-0 whitespace-pre-wrap text-[14px] leading-[1.8] [overflow-wrap:anywhere]"><FormattedMessage content={displayContent} /></div>
        </div>
        <div className={`mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground ${assistant ? '' : 'justify-end'}`}>
          <span className="font-mono">{new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(message.createdAt))}</span>
          {assistant && (
            <>
              <span className="mx-1 opacity-40">·</span>
              <button onClick={() => onCopy(displayContent)} className="rounded-md p-1.5 hover:bg-muted hover:text-foreground" aria-label="Copy assistant response" data-testid={`button-copy-message-${message.id}`}><HiOutlineClipboardDocument size={13} /></button>
              <button onClick={() => onFeedback(message, 'helpful')} className={`rounded-md p-1.5 hover:bg-muted hover:text-primary ${message.feedback === 'helpful' ? 'text-primary' : ''}`} aria-label="Mark response helpful" data-testid={`button-helpful-${message.id}`}><HiOutlineHandThumbUp size={13} /></button>
              <button onClick={() => onFeedback(message, 'not_helpful')} className={`rounded-md p-1.5 hover:bg-muted hover:text-destructive ${message.feedback === 'not_helpful' ? 'text-destructive' : ''}`} aria-label="Mark response not helpful" data-testid={`button-not-helpful-${message.id}`}><HiOutlineHandThumbDown size={13} /></button>
              {onRetry && <button onClick={onRetry} className="rounded-md p-1.5 hover:bg-muted hover:text-foreground" aria-label="Retry last text prompt" data-testid={`button-retry-message-${message.id}`}><HiOutlineArrowPath size={13} /></button>}
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

async function streamAssistantResponse(conversationId: string, content: string, onChunk: (chunk: string) => void, attachmentId?: string | null, inputMode: 'text' | 'voice' = 'text', language: ChatLanguage = 'en'): Promise<{ content: string; messageId: string | null }> {
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', 'Accept-Language': language },
    credentials: 'include',
    body: JSON.stringify({ content, attachmentId: attachmentId || undefined, inputMode, language }),
  });
  if (!response.ok) {
    let detail = '';
    try {
      const payload = await response.json() as { error?: unknown };
      if (typeof payload.error === 'string') detail = payload.error;
    } catch {
      // Keep the client message useful even when a proxy returns non-JSON.
    }
    const error = new Error(detail || `Assistant request failed (${response.status})`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
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
  let sawDone = false;
  const consume = (event: string) => {
    const line = event.split('\n').find((item) => item.startsWith('data:'));
    if (!line) return;
    const payload = JSON.parse(line.slice(5).trim()) as { content?: unknown; done?: boolean; messageId?: unknown; finalContent?: unknown; error?: unknown };
    if (typeof payload.error === 'string') throw new Error(payload.error);
    if (typeof payload.content === 'string' && payload.content) {
      fullResponse += payload.content;
      onChunk(fullResponse);
    }
    if (typeof payload.messageId === 'string') messageId = payload.messageId;
    if (typeof payload.finalContent === 'string') finalContent = payload.finalContent;
    if (payload.done === true) sawDone = true;
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
  if (!sawDone) throw new Error('The assistant response ended before completion.');
  return { content: finalContent || fullResponse, messageId };
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

function ReadOnlyHistoryBar({ onNewConversation }: { onNewConversation: () => void }) {
  return (
    <div className="safe-bottom border-t border-border/70 bg-muted/25 px-4 py-3 sm:px-6 md:px-9 lg:px-12" role="status" data-testid="status-read-only-history">
      <div className="mx-auto flex max-w-[980px] items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-sm)]">
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Read-only history</div>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">This conversation is closed. Start a new conversation to send a message.</p>
        </div>
        <button type="button" onClick={onNewConversation} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[10px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-read-only-new-conversation"><HiOutlinePlus size={13} /> New conversation</button>
      </div>
    </div>
  );
}

export function HomePage() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[] | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [conversationMode, setConversationMode] = useState<'new' | 'active' | 'readonly'>('new');
  const [inactivityState, setInactivityState] = useState<'active' | 'prompted' | 'closed'>('active');
  const [inactivityResetToken, setInactivityResetToken] = useState(0);
  const [feedbackDialog, setFeedbackDialog] = useState<{ message: ChatMessage; reaction: 'helpful' | 'not_helpful' } | null>(null);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [attachmentError, setAttachmentError] = useState('');
  const [retryContent, setRetryContent] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<ChatLanguage>(initialChatLanguage);
  const inputModeRef = useRef<'text' | 'voice'>('text');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const conversationsQuery = useListConversations({ query: { queryKey: getListConversationsQueryKey() } });
  const conversationQuery = useGetConversation(selectedId || '', { query: { enabled: !!selectedId, queryKey: getGetConversationQueryKey(selectedId || '') } });
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const createFeedback = useCreateMessageFeedback();
  const createSupportTicket = useCreateSupportTicket();
  const conversations = useMemo(() => conversationsQuery.data || [], [conversationsQuery.data]);
  const activeConversation = conversations.find((conversation) => conversation.id === selectedId);
  const loadedConversation = conversationQuery.data?.id === selectedId ? conversationQuery.data : null;
  const messages = localMessages ?? loadedConversation?.messages ?? [];
  const conversationLoading = Boolean(selectedId) && (conversationQuery.isLoading || conversationQuery.isFetching || !loadedConversation);
  const selectedChatLanguage = chatLanguages.find((language) => language.value === preferredLanguage) || chatLanguages[0];
  const speech = useSpeechInput({
    value: input,
    onChange: setInput,
    disabled: isSending,
    lang: selectedChatLanguage.voiceLocale,
  });

  useEffect(() => {
    return () => {
      if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    };
  }, [pendingImage]);

  useEffect(() => {
    window.localStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, preferredLanguage);
  }, [preferredLanguage]);

  useEffect(() => {
    const conversationId = new URLSearchParams(window.location.search).get('conversation');
    if (conversationId) {
      setSelectedId(conversationId);
       setConversationMode('readonly');
       setLocalMessages(null);
       setRetryContent(null);
    }
  }, [location]);

  useEffect(() => {
    if (loadedConversation && !isSending) setLocalMessages(loadedConversation.messages);
  }, [loadedConversation, selectedId, isSending]);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
  }, [selectedId]);

  const handleWorkspaceScroll = () => {
    const container = messagesScrollRef.current;
    if (!container) return;
    if (document.activeElement === inputRef.current) inputRef.current?.blur();
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 140;
  };

  useEffect(() => {
    const container = messagesScrollRef.current;
    if (!container || (messages.length === 0 && !isSending)) return;
    if (!shouldAutoScrollRef.current) return;
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
    if (!selectedId || conversationMode !== 'active' || messages.length === 0 || isSending || inactivityState === 'closed') return;
    const promptTimer = window.setTimeout(() => setInactivityState('prompted'), 30_000);
    const closeTimer = window.setTimeout(() => setInactivityState('closed'), 90_000);
    return () => {
      window.clearTimeout(promptTimer);
      window.clearTimeout(closeTimer);
    };
  }, [selectedId, conversationMode, messages.length, isSending, inactivityResetToken]);

  const markUserActivity = () => {
    if (inactivityState === 'closed') return;
    setInactivityState('active');
    setInactivityResetToken((value) => value + 1);
  };

  const chooseImage = (file: File | undefined) => {
    setAttachmentError('');
    if (!file) return;
    const validationError = imageValidationError(file);
    if (validationError) {
      setAttachmentError(validationError);
      return;
    }
    if (pendingImage && pendingImage.file.name === file.name && pendingImage.file.size === file.size && pendingImage.file.lastModified === file.lastModified) {
      setAttachmentError('That image is already attached.');
      return;
    }
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
  };

  const removeImage = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
    setAttachmentError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startNewConversation = () => {
    if (isSending) return;
    setErrorMessage('');
    setSelectedId(null);
    setConversationMode('new');
    setLocalMessages(null);
    setRetryContent(null);
    setInput('');
    removeImage();
    setStreamingText('');
    setInactivityState('active');
    setInactivityResetToken((value) => value + 1);
    setNotice('');
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const sendMessage = async (contentOverride?: string, imageOverride?: PendingImage | null, mode: 'text' | 'voice' = inputModeRef.current) => {
    const content = (contentOverride ?? input).trim();
    const image = imageOverride === undefined ? pendingImage : imageOverride;
    if ((!content && !image) || isSending || conversationMode === 'readonly') return;
    if (speech.isListening) speech.stop();
    shouldAutoScrollRef.current = true;
    setErrorMessage('');
    setAttachmentError('');
    setNotice('');
    setInput('');
    setIsSending(true);
    let conversationId = selectedId;
    const hasImage = Boolean(image);
    let uploadFailed = false;
    setRetryContent(null);
    try {
       if (!conversationId) {
        const created = await createConversation.mutateAsync({ data: { title: (content || IMAGE_ATTACHMENT_MESSAGE).slice(0, 64) } });
        conversationId = created.id;
        setSelectedId(created.id);
        setConversationMode('active');
      }
      let uploadedImage: ImageAttachment | null = null;
      if (image) {
        try {
          uploadedImage = await uploadConversationImage(conversationId, { file: image.file });
        } catch {
          uploadFailed = true;
          throw new Error('Image upload failed');
        }
        removeImage();
      }
      const messageContent = content || IMAGE_ATTACHMENT_MESSAGE;
      const userMessage: ChatMessage = { id: `local-user-${Date.now()}`, conversationId, role: 'user', content: messageContent, createdAt: new Date().toISOString(), feedback: null, attachments: uploadedImage ? [uploadedImage] : [] };
      setLocalMessages((current) => [...(current ?? []), userMessage]);
      setStreamingText('');
      const response = await streamAssistantResponse(conversationId, content, setStreamingText, uploadedImage?.id, mode, preferredLanguage);
      const assistantMessage: ChatMessage = { id: response.messageId || `local-assistant-${Date.now()}`, conversationId, role: 'assistant', content: response.content || 'I could not find a grounded answer for that yet.', createdAt: new Date().toISOString(), feedback: null, attachments: [] };
      setLocalMessages((current) => [...(current ?? []), assistantMessage]);
      await queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(conversationId) });
      await queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    } catch {
      if (uploadFailed) setAttachmentError('The image could not be uploaded. Check the file and try again.');
      setErrorMessage(uploadFailed
        ? 'The image could not be uploaded. Check the file and try again.'
        : hasImage
          ? 'The image is stored, but the text request did not go through. The current text provider does not interpret image contents.'
          : 'That did not go through. Check your connection and try again.');
      setInput(content);
      if (!uploadFailed && content) setRetryContent(content);
      if (hasImage && !uploadFailed) setNotice('The image is stored with this conversation, but the current text provider does not interpret image contents. You can send a text question about it when ready.');
    } finally {
      setIsSending(false);
      inputModeRef.current = 'text';
      setStreamingText('');
    }
  };

  const retryLast = () => {
    const previous = [...messages].reverse().find((message) => message.role === 'user');
    if (previous && previous.content !== IMAGE_ATTACHMENT_MESSAGE && !(previous.attachments?.length)) void sendMessage(previous.content, null);
  };

  const handleFeedback = (message: ChatMessage, rating: 'helpful' | 'not_helpful') => {
    setFeedbackDialog({ message, reaction: rating });
  };

  const submitFeedback = async (submission: FeedbackDialogSubmission) => {
    if (!feedbackDialog) return;
    const { message, reaction } = feedbackDialog;
    try {
      await createFeedback.mutateAsync({ messageId: message.id, data: { rating: reaction, score: submission.score, feedback: submission.feedback || null } });
       setLocalMessages((current) => (current ?? []).map((item) => item.id === message.id ? { ...item, feedback: reaction } : item));
      if (submission.escalate && selectedId) {
        const messageIndex = messages.findIndex((item) => item.id === message.id);
        const relatedUserMessage = [...messages.slice(0, messageIndex)].reverse().find((item) => item.role === 'user');
        const conversationContext = [
          relatedUserMessage ? `User message:\n${relatedUserMessage.content}` : '',
          `Assistant answer:\n${message.content}`,
          submission.feedback ? `Feedback:\n${submission.feedback}` : '',
          `Ticket details:\n${submission.details}`,
        ].filter(Boolean).join('\n\n').slice(0, 3900);
        try {
          const ticket = await createSupportTicket.mutateAsync({
            data: {
              conversationId: selectedId,
              messageId: message.id,
              category: submission.category,
              summary: submission.summary,
              details: conversationContext,
              contactEmail: submission.contactEmail,
              feedbackRating: reaction,
              attachmentIds: relatedUserMessage?.attachments?.map((attachment) => attachment.id) || [],
            },
          });
           const deliveryNotice = ticket.emailStatus === 'sent'
             ? ' We will email the resolution and show it in Help & Support.'
             : ticket.emailStatus === 'failed'
               ? ' The ticket is saved, but email delivery needs support sender setup. You can track it in Help & Support.'
               : ' The ticket is saved and will be tracked in Help & Support.';
           const level = getTicketLevelMeta(ticket.level);
           setNotice(`Ticket ${ticket.ticketNumber} was raised at level ${level.level} (${level.label}).${deliveryNotice}`);
        } catch {
          setNotice('Feedback was saved, but the support ticket could not be raised. Please try again.');
        }
      } else {
        setNotice(reaction === 'helpful' ? 'Thanks. That signal helps keep answers useful.' : 'Thanks for the signal. We will review this answer.');
      }
      setFeedbackDialog(null);
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
      if (selectedId === conversation.id) {
        setSelectedId(null);
        setConversationMode('new');
        setLocalMessages(null);
        setRetryContent(null);
        setInactivityState('active');
        setNotice('Conversation removed from history.');
        window.setTimeout(() => setNotice(''), 2600);
      }
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
      setSelectedId(null);
      setConversationMode('new');
      setLocalMessages(null);
      setRetryContent(null);
      setInactivityState('active');
      setNotice('Conversation removed from history.');
      window.setTimeout(() => setNotice(''), 2600);
    } catch {
      setErrorMessage('This chat could not be cleared right now. Please try again.');
    }
  };

  const canRetryMessage = (message: ChatMessage) => {
    if (message.role !== 'assistant') return false;
    const messageIndex = messages.findIndex((item) => item.id === message.id);
    const relatedUserMessage = [...messages.slice(0, messageIndex)].reverse().find((item) => item.role === 'user');
    return Boolean(relatedUserMessage && relatedUserMessage.content !== IMAGE_ATTACHMENT_MESSAGE && relatedUserMessage.content.trim() && !(relatedUserMessage.attachments?.length));
  };

  return (
    <KamaloShell conversationCount={conversations.length} onNewConversation={startNewConversation} lockChrome>
       <div ref={messagesScrollRef} onScroll={handleWorkspaceScroll} className="chat-workspace mx-auto flex min-h-0 w-full max-w-[1320px] flex-1 flex-col px-4 pb-40 sm:px-6 sm:pb-36 md:px-9 md:py-7 lg:px-12" onPointerDown={markUserActivity} onKeyDown={markUserActivity}>
         {selectedId && <header className="flex items-center justify-between border-b border-border/70 py-4 md:border-0 md:py-0">
             <div className="min-w-0"><h2 className="truncate text-[15px] font-bold tracking-[-.02em] md:text-[20px]">{activeConversation?.title || 'Support workspace'}</h2>{conversationMode === 'readonly' && <div className="mt-1 font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Read-only history</div>}</div>
           <button onClick={clearCurrent} disabled={!selectedId || deleteConversation.isPending} className="hidden items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40 sm:flex" data-testid="button-clear-conversation"><HiOutlineBackspace size={14} /> Clear</button>
         </header>}
        <div className="grid min-h-0 w-full min-w-0 flex-1 gap-8 xl:grid-cols-[minmax(0,1fr)_248px] xl:gap-12">
          <section className="flex min-h-0 min-w-0 flex-col pt-5 md:pt-12">
             {inactivityState === 'closed' ? <ChatClosedState onNewConversation={startNewConversation} /> : selectedId && conversationQuery.isError && !loadedConversation ? <div className="flex min-h-[min(530px,calc(100dvh-260px))] flex-col items-center justify-center text-center animate-rise" role="alert" aria-live="assertive" data-testid="status-conversation-load-error"><p className="text-[13px] text-destructive">This conversation could not be loaded.</p><button onClick={() => void conversationQuery.refetch()} className="mt-3 rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-semibold text-primary hover:bg-muted" data-testid="button-retry-conversation-load">Try again</button></div> : conversationLoading ? <div className="flex min-h-[min(530px,calc(100dvh-260px))] items-start justify-center pt-10" role="status" aria-live="polite" data-testid="status-conversation-loading"><div className="w-full max-w-xl space-y-5"><div className="skeleton h-20 w-4/5 rounded-xl" /><div className="ml-auto skeleton h-14 w-3/5 rounded-xl" /><p className="sr-only">Loading conversation</p></div></div> : messages.length === 0 ? (
                <div className="min-w-0 pb-7 pr-1" data-testid="conversation-messages">
                 <div className="mx-auto max-w-xl px-1 py-2 sm:py-5">
                   <ChatWelcomeState
                     onPrompt={(text) => void sendMessage(text)}
                     showQuickPrompts={conversationsQuery.isSuccess && !selectedId}
                   />
                 </div>
              </div>
            ) : (
                 <div className="min-w-0 space-y-6 overflow-x-hidden pb-7 pr-1 md:space-y-7" data-testid="conversation-messages">
                {messages.map((message) => <MessageBubble key={message.id} message={message} onFeedback={handleFeedback} onCopy={(content) => { void copyAssistantResponse(content); }} onRetry={canRetryMessage(message) ? retryLast : undefined} />)}
                {isSending && <StreamingBubble content={streamingText} />}
                 <div ref={messagesEndRef} className="chat-scroll-end h-px w-full" aria-hidden="true" data-testid="conversation-end" />
              </div>
            )}
            {errorMessage && <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-[11px] text-destructive" role="alert" aria-live="assertive" data-testid="status-send-error"><span>{errorMessage}</span>{retryContent && <button onClick={() => void sendMessage(retryContent, null)} className="shrink-0 font-semibold underline" data-testid="button-retry-send">Retry text</button>}</div>}
             {notice && <div className="mb-3 flex items-center justify-center gap-2 text-center font-mono text-[10px] text-primary animate-rise" role="status" aria-live="polite" data-testid="status-feedback"><HiOutlineCheck size={13} />{notice}</div>}
            {inactivityState === 'prompted' && <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[.06] px-4 py-3 text-[12px] text-foreground animate-rise" role="alert" data-testid="status-inactivity-prompt"><span>Are you there?</span><button onClick={markUserActivity} className="rounded-lg border border-primary/25 bg-background px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10" data-testid="button-inactivity-continue">I’m here</button></div>}
             {conversationMode === 'readonly' ? <ReadOnlyHistoryBar onNewConversation={startNewConversation} /> : inactivityState !== 'closed' && <div className="chat-composer safe-bottom bg-background/90 px-3 pt-2 backdrop-blur-xl sm:px-6 md:px-9 lg:px-12">
               <div className="mx-auto max-w-[980px]">
                  <div className="chat-composer-card relative rounded-2xl border border-border/90 bg-card/90 p-1.5 shadow-[var(--shadow-md)] focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
                    {pendingImage && <div className="mb-2 flex min-w-0 items-center gap-2 rounded-lg border border-border/80 bg-background/70 p-2" data-testid="attachment-preview">
                      <img src={pendingImage.previewUrl} alt={`Preview of ${pendingImage.file.name}`} className="h-12 w-12 shrink-0 rounded-md object-cover" />
                       <div className="min-w-0 flex-1"><div className="truncate text-[11px] font-semibold">{pendingImage.file.name}</div><div className="mt-0.5 text-[9px] leading-4 text-muted-foreground">Stored with this conversation; the current text provider does not interpret image contents.</div></div>
                      <button type="button" onClick={removeImage} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Remove ${pendingImage.file.name}`} data-testid="button-remove-attachment"><HiOutlineXMark size={15} /></button>
                    </div>}
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                          event.preventDefault();
                          void sendMessage();
                        }
                      }}
                      placeholder="Ask about KAMALO..."
                      rows={1}
                      maxLength={4000}
                        className="chat-textarea h-12 max-h-28 min-h-12 w-full resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-[14px] leading-6 outline-none placeholder:text-muted-foreground/65"
                      data-testid="input-chat-message"
                    />
                    <div className="flex items-center justify-between gap-2 px-2 pb-0.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => { chooseImage(event.target.files?.[0]); event.target.value = ''; }} data-testid="input-chat-attachment" />
                          <ChatLanguageSelect value={preferredLanguage} selectedLabel={selectedChatLanguage.label} onChange={setPreferredLanguage} disabled={isSending || speech.isListening} />
                         <button type="button" onClick={() => { inputModeRef.current = 'voice'; speech.toggle(); }} disabled={isSending || speech.isSupported === false || speech.isTranscribing} className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border p-0 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${speech.isListening ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'}`} aria-label={speech.isTranscribing ? 'Transcribing voice input' : speech.isListening ? 'Stop voice input' : `Start voice input in ${selectedChatLanguage.label}`} title={speech.isTranscribing ? 'Transcribing voice input' : speech.isListening ? 'Stop voice input' : `Voice input in ${selectedChatLanguage.label}`} data-testid="button-voice-input">{speech.isTranscribing ? <HiOutlineLanguage size={14} className="animate-pulse" /> : speech.isListening ? <HiOutlineStop size={14} /> : <HiOutlineMicrophone size={14} />}</button>
                         <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSending} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border p-0 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40" aria-label="Attach a JPG or PNG image" aria-describedby="attachment-help" title="Attach image" data-testid="button-attach-image"><HiOutlinePaperClip size={14} /></button>
                          <span id="attachment-help" className="hidden truncate text-[9px] text-muted-foreground/70 sm:inline">JPG or PNG · max 5 MB · stored, not interpreted</span>
                      </div>
                      <button onClick={() => void sendMessage()} disabled={(!input.trim() && !pendingImage) || isSending} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35" aria-label={isSending ? 'Sending message' : 'Send message'} data-testid="button-send-message"><HiOutlinePaperAirplane size={15} /></button>
                    </div>
                 </div>
                  {speech.error && <div className={`mt-2 rounded-lg border px-3.5 py-2.5 text-[11px] ${speech.isTranscribing ? 'border-primary/20 bg-primary/5 text-primary' : 'border-destructive/20 bg-destructive/5 text-destructive'}`} role="status" aria-live="polite" data-testid="status-voice-error">{speech.error}</div>}
                  {attachmentError && <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-[11px] text-destructive" role="status" data-testid="status-attachment-error">{attachmentError}</div>}
                 <p className="mt-1 px-2 text-center text-[9px] leading-3.5 text-muted-foreground/65">KAMALO can make mistakes. Check important information before acting.</p>
               </div>
            </div>}
          </section>

        </div>
      </div>
      {feedbackDialog && (() => {
        const index = messages.findIndex((item) => item.id === feedbackDialog.message.id);
        const relatedUserMessage = [...messages.slice(0, index)].reverse().find((item) => item.role === 'user');
        return <FeedbackDialog message={feedbackDialog.message} reaction={feedbackDialog.reaction} imageCount={relatedUserMessage?.attachments?.length || 0} saving={createFeedback.isPending || createSupportTicket.isPending} onClose={() => setFeedbackDialog(null)} onSubmit={(submission) => void submitFeedback(submission)} />;
      })()}
    </KamaloShell>
  );
}
