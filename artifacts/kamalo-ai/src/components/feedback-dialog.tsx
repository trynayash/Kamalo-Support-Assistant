import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@workspace/api-client-react';
import { HiOutlineHandThumbDown, HiOutlineHandThumbUp, HiOutlineXMark } from 'react-icons/hi2';
import { SectionLabel } from '@/components/kamalo-shell';
import { ticketLevelMeta } from '@/lib/ticket-levels';

export type FeedbackDialogSubmission = {
  score: number;
  feedback: string;
  escalate: boolean;
  contactEmail: string;
  category: string;
  summary: string;
  details: string;
};

type FeedbackDialogProps = {
  message: ChatMessage;
  reaction: 'helpful' | 'not_helpful';
  imageCount: number;
  saving: boolean;
  onClose: () => void;
  onSubmit: (submission: FeedbackDialogSubmission) => void;
};

export function FeedbackDialog({ message, reaction, imageCount, saving, onClose, onSubmit }: FeedbackDialogProps) {
  const [score, setScore] = useState(reaction === 'helpful' ? 5 : 1);
  const [feedback, setFeedback] = useState('');
  const [escalate, setEscalate] = useState(reaction === 'not_helpful');
  const [contactEmail, setContactEmail] = useState('');
  const [category, setCategory] = useState('Answer quality');
  const [summary, setSummary] = useState('I need help with this answer');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const savingRef = useRef(saving);
  onCloseRef.current = onClose;
  savingRef.current = saving;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, input, textarea, select, [href]')).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('tabindex') !== '-1');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  const submit = () => {
    if (!score) {
      setError('Choose a rating from 1 to 5.');
      return;
    }
    if (escalate) {
      if (!contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
        setError('Add an email so a specialist can send the resolution.');
        return;
      }
      if (!category.trim() || !summary.trim() || !details.trim()) {
        setError('Add a category, short summary, and a few details for the ticket.');
        return;
      }
    }
    setError('');
    onSubmit({ score, feedback: feedback.trim(), escalate, contactEmail: contactEmail.trim(), category: category.trim(), summary: summary.trim(), details: details.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--sidebar)/.52)] p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="presentation" data-testid="dialog-feedback">
       <div ref={dialogRef} className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-[0_22px_70px_hsl(var(--foreground)/.2)] sm:rounded-xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="feedback-dialog-title" aria-describedby="feedback-dialog-description">
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionLabel>{reaction === 'helpful' ? 'Answer feedback' : 'Answer review'}</SectionLabel>
            <h2 id="feedback-dialog-title" className="mt-3 text-2xl font-extrabold tracking-[-.045em]">{reaction === 'helpful' ? 'How useful was this answer?' : 'What should we improve?'}</h2>
             <p id="feedback-dialog-description" className="mt-2 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{message.content}</p>
          </div>
           <button ref={closeButtonRef} onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close feedback form" data-testid="button-close-feedback"><HiOutlineXMark size={18} /></button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2" role="radiogroup" aria-label="Answer score">
          {[1, 2, 3, 4, 5].map((value) => <button key={value} onClick={() => setScore(value)} className={`grid h-10 w-10 place-items-center rounded-lg border text-[12px] font-bold transition-colors ${score === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary'}`} role="radio" aria-checked={score === value} aria-label={`${value} out of 5`} data-testid={`button-feedback-score-${value}`}>{value}</button>)}
        </div>
        <div className="mt-2 text-center font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">1 = not useful · 5 = fully useful</div>

        <label className="mt-6 block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Optional comment</span><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={1000} rows={3} placeholder="Tell us what worked or what was missing." className="w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-[12px] leading-6 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-feedback-comment" /></label>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/60 p-3.5">
          <input type="checkbox" checked={escalate} onChange={(event) => setEscalate(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" data-testid="checkbox-escalate-ticket" />
          <span><span className="flex items-center gap-2 text-[12px] font-bold">{reaction === 'not_helpful' ? <HiOutlineHandThumbDown size={15} className="text-destructive" /> : <HiOutlineHandThumbUp size={15} className="text-primary" />} Ask a specialist to review this</span><span className="mt-1 block text-[11px] leading-5 text-muted-foreground">Create a support ticket with this conversation and any relevant image evidence.</span></span>
        </label>

        {escalate && <div className="mt-5 space-y-4 rounded-xl border border-primary/20 bg-primary/[.045] p-4 animate-rise">
          <div className="font-mono text-[9px] uppercase tracking-[.15em] text-primary">Support ticket details</div>
           <div className="rounded-lg border border-border bg-background/70 p-3">
             <div className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">How escalation works</div>
             <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">KAMALO assigns the level on the server from the case details. Specialists can adjust it after review.</p>
             <div className="mt-3 grid gap-1.5 sm:grid-cols-5">{(Object.entries(ticketLevelMeta) as [string, (typeof ticketLevelMeta)[1]][]).map(([level, meta]) => <div key={level} className="rounded-md border border-border/70 px-2 py-1.5"><div className="font-mono text-[9px] font-bold">L{level}</div><div className="mt-0.5 text-[9px] font-semibold">{meta.label}</div></div>)}</div>
           </div>
          <label className="block"><span className="mb-2 block text-[11px] font-semibold">Email for the resolution</span><input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="you@example.com" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-[12px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-ticket-email" /></label>
          <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
            <label className="block"><span className="mb-2 block text-[11px] font-semibold">Stuck category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-[11px] outline-none focus:border-primary" data-testid="select-ticket-category"><option>Answer quality</option><option>Rewards</option><option>Auto KAMALO</option><option>FINCADO</option><option>Transactions</option><option>Account access</option><option>Other</option></select></label>
            <label className="block"><span className="mb-2 block text-[11px] font-semibold">Short issue brief</span><input value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={180} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-[12px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-ticket-summary" /></label>
          </div>
          <label className="block"><span className="mb-2 block text-[11px] font-semibold">What were you trying to do?</span><textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={2000} rows={3} placeholder="Give the specialist the shortest useful explanation." className="w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-[12px] leading-5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-ticket-details" /></label>
          <div className="font-mono text-[9px] text-muted-foreground">{imageCount > 0 ? `${imageCount} conversation image${imageCount === 1 ? '' : 's'} will be included.` : 'No image is attached to this answer.'}</div>
        </div>}

        {error && <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-[11px] text-destructive" role="alert" data-testid="status-feedback-error">{error}</div>}
        <div className="safe-bottom mt-6 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end"><button onClick={onClose} className="rounded-lg px-4 py-2.5 text-[12px] font-semibold text-muted-foreground hover:bg-muted" data-testid="button-cancel-feedback">Cancel</button><button onClick={submit} disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-[12px] font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-submit-feedback">{saving ? 'Saving…' : escalate ? 'Send feedback & raise ticket' : 'Send feedback'}</button></div>
      </div>
    </div>
  );
}