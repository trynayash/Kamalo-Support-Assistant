import { useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { HiOutlineBookOpen, HiOutlineChatBubbleLeftRight, HiOutlineChevronDoubleLeft, HiOutlineChevronDoubleRight, HiOutlinePlus } from 'react-icons/hi2';

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
  const [collapsed, setCollapsed] = useState(false);
  const isKnowledge = location.startsWith('/admin/knowledge');

  const shellStyle = { '--kamalo-sidebar-width': collapsed ? '72px' : '276px' } as CSSProperties;

  return (
    <div className="flex min-h-[100dvh] w-full max-w-full overflow-x-clip bg-background" style={shellStyle}>
      <aside id="workspace-navigation" aria-label="Workspace navigation" className={`relative fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-6 text-sidebar-foreground transition-[width,padding] duration-300 md:static md:flex ${collapsed ? 'w-[72px] px-3' : 'w-[276px] px-5'}`}>
        <div className={`flex items-start ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link href="/" className="block" data-testid="link-kamalo-home"><KamaloMark small={collapsed} /></Link>
        </div>

        <button onClick={() => setCollapsed((value) => !value)} className="absolute -right-3 top-7 z-50 hidden h-6 w-6 place-items-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/65 shadow-sm hover:text-sidebar-foreground md:grid" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} data-testid="button-toggle-sidebar">
          {collapsed ? <HiOutlineChevronDoubleRight size={13} /> : <HiOutlineChevronDoubleLeft size={13} />}
        </button>

        <div className="mt-12">
          <button
            onClick={() => onNewConversation?.()}
            className={`group flex w-full items-center rounded-xl border border-sidebar-foreground/15 bg-sidebar-foreground/[.06] py-3 text-left transition-colors hover:border-[hsl(var(--accent)/.45)] hover:bg-sidebar-accent ${collapsed ? 'justify-center px-0' : 'justify-between px-3.5'}`}
            data-testid="button-new-conversation"
          >
             <span className="flex items-center gap-2.5 text-[13px] font-semibold"><HiOutlinePlus size={16} className="text-[hsl(var(--accent))]" /> <span className={collapsed ? 'sr-only' : ''}>New conversation</span></span>
             {!collapsed && <span className="font-mono text-[10px] text-sidebar-foreground/40">N</span>}
          </button>
        </div>

        <nav className="mt-8 space-y-1" aria-label="Primary navigation">
          <Link href="/" className={`flex items-center gap-3 rounded-lg py-2.5 text-[13px] transition-colors ${collapsed ? 'justify-center px-0' : 'px-3'} ${!isKnowledge ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid="link-conversations">
            <HiOutlineChatBubbleLeftRight size={16} className={!isKnowledge ? 'text-[hsl(var(--accent))]' : ''} /> <span className={collapsed ? 'sr-only' : ''}>Conversations</span>
            {!collapsed && conversationCount > 0 && <span className="ml-auto rounded-full bg-sidebar-foreground/10 px-2 py-0.5 font-mono text-[10px]">{conversationCount}</span>}
          </Link>
          <Link href="/admin/knowledge" className={`flex items-center gap-3 rounded-lg py-2.5 text-[13px] transition-colors ${collapsed ? 'justify-center px-0' : 'px-3'} ${isKnowledge ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid="link-knowledge">
            <HiOutlineBookOpen size={16} className={isKnowledge ? 'text-[hsl(var(--accent))]' : ''} /> <span className={collapsed ? 'sr-only' : ''}>Knowledge base</span>
          </Link>
        </nav>

        <div className="mt-auto" />
      </aside>
      <main className="w-0 min-w-0 max-w-full flex-1 overflow-x-clip">
        <div className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/95 px-4 pb-3 pt-3 backdrop-blur-sm md:hidden">
          <Link href="/" aria-label="Open KAMALO home" data-testid="mobile-brand-link"><KamaloMark onLight /></Link>
          <div className="flex items-center gap-1.5">
            {onNewConversation && <button onClick={() => onNewConversation()} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary" aria-label="Start a new conversation" data-testid="button-mobile-new-conversation"><HiOutlinePlus size={19} /></button>}
            <Link href={isKnowledge ? '/' : '/admin/knowledge'} className={`grid h-10 w-10 place-items-center rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:text-primary ${isKnowledge ? 'text-primary' : 'text-foreground'}`} aria-label={isKnowledge ? 'Open conversations' : 'Open knowledge base'} data-testid="button-mobile-knowledge">{isKnowledge ? <HiOutlineChatBubbleLeftRight size={19} /> : <HiOutlineBookOpen size={19} />}</Link>
          </div>
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