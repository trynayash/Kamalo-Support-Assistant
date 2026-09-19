import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { HiOutlineBars3, HiOutlineBookOpen, HiOutlineChatBubbleLeftRight, HiOutlineClock, HiOutlineLifebuoy, HiOutlinePlus, HiOutlineShieldCheck, HiOutlineXMark } from 'react-icons/hi2';

type KamaloShellProps = {
  children: ReactNode;
  conversationCount?: number;
  onNewConversation?: () => void;
  lockChrome?: boolean;
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

export function KamaloShell({ children, conversationCount = 0, onNewConversation, lockChrome = false }: KamaloShellProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isConversations = location === '/' || location === '/history';
  const isKnowledge = location.startsWith('/admin/knowledge');
  const isSupport = location.startsWith('/support');
  const isTickets = location.startsWith('/admin/tickets');

  const shellStyle = { '--kamalo-sidebar-width': '276px' } as CSSProperties;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  return (
    <div className={`flex w-full max-w-full overflow-x-clip bg-background ${lockChrome ? 'app-shell-locked' : 'min-h-[100dvh]'}`} style={shellStyle}>
      <aside id="workspace-navigation" aria-label="Workspace navigation" className={`relative fixed inset-y-0 left-0 z-40 hidden w-[276px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 text-sidebar-foreground lg:static lg:flex ${lockChrome ? 'h-full overflow-hidden' : ''}`}>
        <div className="flex items-start">
          <Link href="/" className="block" data-testid="link-kamalo-home"><KamaloMark /></Link>
        </div>

         <div className="mt-10">
           {onNewConversation ? <button
             onClick={() => onNewConversation()}
             className="group flex h-11 w-full items-center justify-between rounded-xl border border-sidebar-foreground/15 bg-sidebar-foreground/[.06] px-3.5 text-left text-[13px] font-semibold transition-colors hover:border-[hsl(var(--accent)/.45)] hover:bg-sidebar-accent"
             data-testid="button-new-conversation"
           >
              <span className="flex items-center gap-2.5"><HiOutlinePlus size={16} className="text-[hsl(var(--accent))]" /> <span>New conversation</span></span>
           </button> : <Link
             href="/"
             className="group flex h-11 w-full items-center justify-between rounded-xl border border-sidebar-foreground/15 bg-sidebar-foreground/[.06] px-3.5 text-left text-[13px] font-semibold transition-colors hover:border-[hsl(var(--accent)/.45)] hover:bg-sidebar-accent"
             data-testid="link-new-conversation"
           >
              <span className="flex items-center gap-2.5"><HiOutlinePlus size={16} className="text-[hsl(var(--accent))]" /> <span>New conversation</span></span>
           </Link>}
        </div>

         <nav className="mt-8 space-y-1.5" aria-label="Primary navigation">
            <Link href="/" className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors ${isConversations ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid="link-conversations">
             <HiOutlineChatBubbleLeftRight size={16} className={isConversations ? 'text-[hsl(var(--accent))]' : ''} /> <span>Conversations</span>
            {conversationCount > 0 && <span className="ml-auto rounded-full bg-sidebar-foreground/10 px-2 py-0.5 font-mono text-[10px]">{conversationCount}</span>}
          </Link>
            <Link href="/admin/knowledge" className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors ${isKnowledge ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid="link-knowledge">
             <HiOutlineBookOpen size={16} className={isKnowledge ? 'text-[hsl(var(--accent))]' : ''} /> <span>Knowledge base</span>
           </Link>
           <Link href="/support" className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors ${isSupport ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid="link-support">
            <HiOutlineLifebuoy size={16} className={isSupport ? 'text-[hsl(var(--accent))]' : ''} /> <span>Help &amp; Support</span>
          </Link>
            <Link href="/admin/tickets" className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors ${isTickets ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid="link-admin-tickets">
            <HiOutlineShieldCheck size={16} className={isTickets ? 'text-[hsl(var(--accent))]' : ''} /> <span>Admin access <span className="font-mono text-[8px] uppercase text-[hsl(var(--accent))]">test</span></span>
           </Link>
        </nav>

        <div className="mt-auto" />
      </aside>
      <main className={`w-0 min-w-0 max-w-full flex-1 overflow-x-clip ${lockChrome ? 'app-main-locked flex flex-col' : ''}`}>
         <div className={`safe-top sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-border/70 bg-background/95 px-3 pb-3 pt-3 backdrop-blur-sm sm:px-5 lg:hidden ${lockChrome ? 'sticky' : ''}`}>
          <Link href="/" aria-label="Open KAMALO home" className="mobile-kamalo-brand min-w-0 shrink" data-testid="mobile-brand-link"><KamaloMark onLight /></Link>
           <div className="mobile-nav-actions flex shrink-0 items-center gap-1.5">
             <Link href="/history" className={`icon-button inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-[10px] font-semibold sm:h-10 sm:px-3 ${location === '/history' ? 'text-primary' : 'text-foreground'}`} aria-label="Open conversation history" data-testid="button-mobile-history"><HiOutlineClock size={17} /><span>History</span>{conversationCount > 0 && <span className="font-mono text-[9px] opacity-70">({conversationCount})</span>}</Link>
             <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="icon-button grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground sm:h-10 sm:w-10" aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation-menu" data-testid="button-mobile-menu">{mobileMenuOpen ? <HiOutlineXMark size={19} /> : <HiOutlineBars3 size={19} />}</button>
           </div>
        </div>
         {mobileMenuOpen && <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation menu" data-testid="mobile-navigation-menu">
           <button type="button" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-[hsl(var(--sidebar)/.28)] backdrop-blur-[2px]" aria-label="Close navigation menu" />
           <div className="absolute right-3 top-[calc(4.5rem+env(safe-area-inset-top))] w-[min(320px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-[0_22px_70px_hsl(var(--foreground)/.18)] sm:right-5">
             <div className="flex items-center justify-between px-3 pb-2 pt-2">
               <div><div className="font-mono text-[9px] uppercase tracking-[.17em] text-muted-foreground">KAMALO</div><div className="mt-1 text-[13px] font-bold">Workspace menu</div></div>
               <button type="button" onClick={() => setMobileMenuOpen(false)} className="icon-button rounded-lg p-2 text-muted-foreground" aria-label="Close navigation menu"><HiOutlineXMark size={17} /></button>
             </div>
             <nav className="space-y-1" aria-label="Mobile navigation">
               {onNewConversation ? <button type="button" onClick={() => { onNewConversation(); setMobileMenuOpen(false); }} className="flex h-11 w-full items-center gap-3 rounded-xl bg-primary px-3 text-left text-[12px] font-bold text-primary-foreground" data-testid="button-mobile-new-conversation"><HiOutlinePlus size={17} /><span>New conversation</span></button> : <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center gap-3 rounded-xl bg-primary px-3 text-[12px] font-bold text-primary-foreground" data-testid="link-mobile-new-conversation"><HiOutlinePlus size={17} /><span>New conversation</span></Link>}
               <Link href="/" onClick={() => setMobileMenuOpen(false)} className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[12px] font-semibold ${isConversations ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`} data-testid="link-mobile-conversations"><HiOutlineChatBubbleLeftRight size={17} /><span>Conversations</span>{conversationCount > 0 && <span className="ml-auto rounded-full bg-muted px-2 py-0.5 font-mono text-[9px]">{conversationCount}</span>}</Link>
               <Link href="/history" onClick={() => setMobileMenuOpen(false)} className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[12px] font-semibold ${location === '/history' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`} data-testid="link-mobile-history"><HiOutlineClock size={17} /><span>History</span></Link>
               <Link href="/admin/knowledge" onClick={() => setMobileMenuOpen(false)} className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[12px] font-semibold ${isKnowledge ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`} data-testid="link-mobile-knowledge"><HiOutlineBookOpen size={17} /><span>Knowledge base</span></Link>
               <Link href="/support" onClick={() => setMobileMenuOpen(false)} className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[12px] font-semibold ${isSupport ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`} data-testid="link-mobile-support"><HiOutlineLifebuoy size={17} /><span>Help &amp; Support</span></Link>
               <Link href="/admin/tickets" onClick={() => setMobileMenuOpen(false)} className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[12px] font-semibold ${isTickets ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`} data-testid="link-mobile-admin-tickets"><HiOutlineShieldCheck size={17} /><span>Admin access <span className="font-mono text-[8px] uppercase text-primary">test</span></span></Link>
             </nav>
           </div>
         </div>}
         <div className="hidden shrink-0 items-center justify-end gap-3 border-b border-border/60 bg-background/95 px-8 py-2.5 backdrop-blur-sm lg:flex lg:px-12">
          <Link href="/history" className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-semibold transition-colors ${location === '/history' ? 'border-primary/25 bg-primary/5 text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-primary'}`} data-testid="link-topbar-history"><HiOutlineClock size={13} /> History{conversationCount > 0 && <span className="font-mono text-[9px] opacity-70">({conversationCount})</span>}</Link>
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