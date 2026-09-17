import { type CSSProperties, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { HiOutlineBookOpen, HiOutlineChatBubbleLeftRight, HiOutlineClock, HiOutlineLifebuoy, HiOutlinePlus, HiOutlineShieldCheck } from 'react-icons/hi2';

type KamaloShellProps = {
  children: ReactNode;
  conversationCount?: number;
  onNewConversation?: () => void;
};

export function KamaloMark({ small = false, onLight = false }: { small?: boolean; onLight?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${small ? 'scale-90 origin-left' : ''}`} data-testid="brand-kamalo">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--sidebar))]">
        <span className="font-sans text-[19px] font-extrabold leading-none">K</span>
      </div>
      <div className={`${small ? 'hidden' : 'leading-none'}`}>
        <div className={`font-sans text-[15px] font-extrabold tracking-[.16em] ${onLight ? 'text-foreground' : 'text-sidebar-foreground'}`}>KAMALO</div>
      </div>
    </div>
  );
}

export function KamaloShell({ children, conversationCount = 0, onNewConversation }: KamaloShellProps) {
  const [location] = useLocation();
  const isConversations = location === '/' || location === '/history';
  const isKnowledge = location.startsWith('/admin/knowledge');
  const isSupport = location.startsWith('/support');
  const isTickets = location.startsWith('/admin/tickets');

  const shellStyle = { '--kamalo-sidebar-width': '276px' } as CSSProperties;

  return (
    <div className="flex min-h-[100dvh] w-full max-w-full overflow-x-clip bg-background" style={shellStyle}>
      <aside id="workspace-navigation" aria-label="Workspace navigation" className="relative fixed inset-y-0 left-0 z-40 hidden w-[276px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 text-sidebar-foreground md:static md:flex">
        <div className="flex items-start">
          <Link href="/" className="block" data-testid="link-kamalo-home"><KamaloMark /></Link>
        </div>

        <div className="mt-12">
          <button
            onClick={() => onNewConversation?.()}
            className="group flex w-full items-center justify-between rounded-xl border border-sidebar-foreground/15 bg-sidebar-foreground/[.06] px-3.5 py-3 text-left transition-colors hover:border-[hsl(var(--accent)/.45)] hover:bg-sidebar-accent"
            data-testid="button-new-conversation"
          >
             <span className="flex items-center gap-2.5 text-[13px] font-semibold"><HiOutlinePlus size={16} className="text-[hsl(var(--accent))]" /> <span>New conversation</span></span>
          </button>
        </div>

        <nav className="mt-8 space-y-1" aria-label="Primary navigation">
           <Link href="/" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${isConversations ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid="link-conversations">
             <HiOutlineChatBubbleLeftRight size={16} className={isConversations ? 'text-[hsl(var(--accent))]' : ''} /> <span>Conversations</span>
            {conversationCount > 0 && <span className="ml-auto rounded-full bg-sidebar-foreground/10 px-2 py-0.5 font-mono text-[10px]">{conversationCount}</span>}
          </Link>
           <Link href="/admin/knowledge" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${isKnowledge ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid="link-knowledge">
             <HiOutlineBookOpen size={16} className={isKnowledge ? 'text-[hsl(var(--accent))]' : ''} /> <span>Knowledge base</span>
           </Link>
          <Link href="/support" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${isSupport ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid="link-support">
            <HiOutlineLifebuoy size={16} className={isSupport ? 'text-[hsl(var(--accent))]' : ''} /> <span>Help &amp; Support</span>
          </Link>
           <Link href="/admin/tickets" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${isTickets ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid="link-admin-tickets">
            <HiOutlineShieldCheck size={16} className={isTickets ? 'text-[hsl(var(--accent))]' : ''} /> <span>Admin access <span className="font-mono text-[8px] uppercase text-[hsl(var(--accent))]">test</span></span>
           </Link>
        </nav>

        <div className="mt-auto" />
      </aside>
      <main className="w-0 min-w-0 max-w-full flex-1 overflow-x-clip">
        <div className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/95 px-4 pb-3 pt-3 backdrop-blur-sm md:hidden">
          <Link href="/" aria-label="Open KAMALO home" data-testid="mobile-brand-link"><KamaloMark onLight /></Link>
          <div className="flex items-center gap-1.5">
            {onNewConversation && <button onClick={() => onNewConversation()} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary" aria-label="Start a new conversation" data-testid="button-mobile-new-conversation"><HiOutlinePlus size={19} /></button>}
             <Link href="/history" className={`grid h-10 w-10 place-items-center rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:text-primary ${location === '/history' ? 'text-primary' : 'text-foreground'}`} aria-label="Open conversation history" data-testid="button-mobile-history"><HiOutlineClock size={19} /></Link>
            <Link href="/support" className={`grid h-10 w-10 place-items-center rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:text-primary ${isSupport ? 'text-primary' : 'text-foreground'}`} aria-label="Open Help & Support" data-testid="button-mobile-support"><HiOutlineLifebuoy size={19} /></Link>
             <Link href="/admin/tickets" className={`grid h-10 w-10 place-items-center rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:text-primary ${isTickets ? 'text-primary' : 'text-foreground'}`} aria-label="Open admin tickets" data-testid="button-mobile-admin-tickets"><HiOutlineShieldCheck size={19} /></Link>
             <Link href={isKnowledge ? '/' : '/admin/knowledge'} className={`grid h-10 w-10 place-items-center rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:text-primary ${isKnowledge ? 'text-primary' : 'text-foreground'}`} aria-label={isKnowledge ? 'Open conversations' : 'Open knowledge base'} data-testid="button-mobile-knowledge">{isKnowledge ? <HiOutlineChatBubbleLeftRight size={19} /> : <HiOutlineBookOpen size={19} />}</Link>
          </div>
        </div>
        <div className="hidden items-center justify-end gap-3 border-b border-border/60 bg-background/95 px-8 py-2.5 backdrop-blur-sm md:flex lg:px-12">
          <Link href="/support" className="text-[10px] font-semibold text-muted-foreground hover:text-primary" data-testid="link-topbar-support">Help &amp; Support</Link>
           <Link href="/admin/tickets" className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--accent)/.45)] bg-[hsl(var(--accent)/.12)] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[.1em] text-[hsl(31_60%_35%)] hover:bg-[hsl(var(--accent)/.2)]" data-testid="link-topbar-admin"><HiOutlineShieldCheck size={12} /> Admin access · test</Link>
        </div>
        {children}
      </main>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[10px] uppercase tracking-[.19em] text-muted-foreground">{children}</div>;
}

export function KnowledgeIcon() {
  return <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[hsl(var(--primary)/.1)] text-primary"><HiOutlineBookOpen size={18} /></div>;
}