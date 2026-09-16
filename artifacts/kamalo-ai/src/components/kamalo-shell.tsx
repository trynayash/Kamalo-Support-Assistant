import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { BookOpenText, CircleHelp, Library, MessageSquareText, PanelLeftClose, PanelLeftOpen, Plus, ShieldCheck } from 'lucide-react';

type KamaloShellProps = {
  children: ReactNode;
  conversationCount?: number;
  onNewConversation?: () => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
};

export function KamaloMark({ small = false }: { small?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${small ? 'scale-90 origin-left' : ''}`} data-testid="brand-kamalo">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--sidebar))]">
        <span className="font-sans text-[19px] font-extrabold leading-none">K</span>
      </div>
      <div className="leading-none">
        <div className="font-sans text-[15px] font-extrabold tracking-[.16em] text-sidebar-foreground">KAMALO</div>
        <div className="mt-1 font-mono text-[8px] tracking-[.22em] text-sidebar-foreground/50">SUPPORT CONSOLE</div>
      </div>
    </div>
  );
}

export function KamaloShell({ children, conversationCount = 0, onNewConversation, mobileOpen = false, onMobileOpenChange }: KamaloShellProps) {
  const [location] = useLocation();
  const openNavigationRef = useRef<HTMLButtonElement>(null);
  const closeNavigationRef = useRef<HTMLButtonElement>(null);
  const isKnowledge = location.startsWith('/admin/knowledge');
  const closeMobile = () => onMobileOpenChange?.(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobile();
      }
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    const focusTimer = window.setTimeout(() => closeNavigationRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
      openNavigationRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <button
        className={`fixed inset-0 z-30 bg-[hsl(var(--sidebar)/.45)] transition-opacity md:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={closeMobile}
        aria-label="Close navigation"
        data-testid="button-close-navigation"
      />
      <aside id="workspace-navigation" aria-label="Workspace navigation" className={`fixed inset-y-0 left-0 z-40 flex w-[276px] flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform duration-300 md:static md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between">
          <Link href="/" onClick={closeMobile} className="block" data-testid="link-kamalo-home"><KamaloMark /></Link>
          <button ref={closeNavigationRef} onClick={closeMobile} className="rounded-lg p-2 text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden" aria-label="Close navigation" data-testid="button-close-sidebar"><PanelLeftClose size={17} /></button>
        </div>

        <div className="mt-12">
          <button
            onClick={() => { onNewConversation?.(); closeMobile(); }}
            className="group flex w-full items-center justify-between rounded-xl border border-sidebar-foreground/15 bg-sidebar-foreground/[.06] px-3.5 py-3 text-left transition-colors hover:border-[hsl(var(--accent)/.45)] hover:bg-sidebar-accent"
            data-testid="button-new-conversation"
          >
             <span className="flex items-center gap-2.5 text-[13px] font-semibold"><Plus size={16} className="text-[hsl(var(--accent))]" /> New conversation</span>
             <span className="font-mono text-[10px] text-sidebar-foreground/40">N</span>
          </button>
        </div>

        <nav className="mt-8 space-y-1" aria-label="Primary navigation">
           <div className="mb-3 px-2 font-mono text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/35">Workspace</div>
          <Link href="/" onClick={closeMobile} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${!isKnowledge ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid="link-conversations">
            <MessageSquareText size={16} className={!isKnowledge ? 'text-[hsl(var(--accent))]' : ''} /> Conversations
            {conversationCount > 0 && <span className="ml-auto rounded-full bg-sidebar-foreground/10 px-2 py-0.5 font-mono text-[10px]">{conversationCount}</span>}
          </Link>
          <Link href="/admin/knowledge" onClick={closeMobile} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${isKnowledge ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid="link-knowledge">
            <BookOpenText size={16} className={isKnowledge ? 'text-[hsl(var(--accent))]' : ''} /> Knowledge base
          </Link>
        </nav>

        <div className="mt-auto space-y-5">
           <div className="rounded-xl border border-sidebar-foreground/10 bg-sidebar-foreground/[.045] p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold"><ShieldCheck size={14} className="text-[hsl(var(--accent))]" /> Grounded answers</div>
            <p className="mt-2 text-[11px] leading-relaxed text-sidebar-foreground/50">KAMALO AI explains from the approved knowledge base, not guesswork.</p>
          </div>
           <div className="flex items-center gap-3 border-t border-sidebar-border pt-4">
             <div className="grid h-8 w-8 place-items-center rounded-md bg-[hsl(var(--primary))] font-mono text-[11px] text-primary-foreground">KS</div>
            <div className="min-w-0"><div className="truncate text-[12px] font-semibold">KAMALO account</div><div className="font-mono text-[9px] text-sidebar-foreground/45">CUSTOMER SPACE</div></div>
            <CircleHelp size={15} className="ml-auto text-sidebar-foreground/35" />
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="flex items-center border-b border-border/70 px-4 py-3 md:hidden">
          <button ref={openNavigationRef} onClick={() => onMobileOpenChange?.(true)} className="rounded-lg p-2 hover:bg-muted" aria-label="Open navigation" aria-controls="workspace-navigation" aria-expanded={mobileOpen} data-testid="button-open-navigation"><PanelLeftOpen size={19} /></button>
          <span className="ml-3 font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">{isKnowledge ? 'Knowledge base' : 'Conversations'}</span>
        </div>
        {children}
      </main>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.19em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-sm bg-[hsl(var(--accent))]" />{children}</div>;
}

export function KnowledgeIcon() {
  return <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[hsl(var(--primary)/.1)] text-primary"><Library size={18} /></div>;
}