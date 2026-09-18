import { Link } from 'wouter';
import type { SupportTicket } from '@workspace/api-client-react';
import { getListMySupportTicketsQueryKey, useListMySupportTickets } from '@workspace/api-client-react';
import { HiOutlineArrowUpRight, HiOutlineCheckCircle, HiOutlineClock, HiOutlineEnvelope, HiOutlineLifebuoy } from 'react-icons/hi2';
import { KamaloShell, SectionLabel } from '@/components/kamalo-shell';
import { TicketLevelBadge } from '@/lib/ticket-levels';

const dateTime = (value: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

const statusTone: Record<string, string> = {
  open: 'border-[hsl(var(--accent)/.5)] bg-[hsl(var(--accent)/.14)] text-[hsl(31_60%_35%)]',
  in_review: 'border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.1)] text-primary',
  resolved: 'border-[hsl(150_35%_45%/.3)] bg-[hsl(150_35%_45%/.1)] text-[hsl(150_35%_30%)]',
  closed: 'border-border bg-muted text-muted-foreground',
};

function TicketStatus({ status }: { status: string }) {
  return <span className={`inline-flex rounded-md border px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em] ${statusTone[status] || statusTone.closed}`}>{status.replace('_', ' ')}</span>;
}

function TicketRow({ ticket }: { ticket: SupportTicket }) {
  const icon = ticket.status === 'resolved' || ticket.status === 'closed' ? <HiOutlineCheckCircle size={17} /> : <HiOutlineClock size={17} />;
  return (
    <article className="grid gap-4 px-4 py-5 sm:px-5 xl:grid-cols-[minmax(0,1fr)_150px_150px] xl:items-center" data-testid={`row-support-ticket-${ticket.id}`}>
      <div className="flex min-w-0 items-start gap-3">
        <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${ticket.status === 'resolved' ? 'bg-[hsl(150_35%_45%/.1)] text-[hsl(150_35%_30%)]' : 'bg-primary/10 text-primary'}`}>{icon}</div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] font-bold tracking-[.08em] text-primary">{ticket.ticketNumber}</span><TicketStatus status={ticket.status} /><TicketLevelBadge level={ticket.level} /></div>
          <h2 className="mt-2 truncate text-[13px] font-bold">{ticket.summary}</h2>
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{ticket.resolution || ticket.details}</p>
          <div className="mt-2 font-mono text-[9px] text-muted-foreground/70">Opened {dateTime(ticket.createdAt)} · {ticket.category} · {ticket.language}{ticket.attachmentIds.length > 0 ? ` · ${ticket.attachmentIds.length} image${ticket.attachmentIds.length === 1 ? '' : 's'}` : ''}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground xl:justify-center"><HiOutlineEnvelope size={14} />{ticket.emailStatus === 'sent' ? 'Email sent' : ticket.emailStatus === 'failed' ? 'Email delivery failed' : ticket.emailStatus === 'skipped' ? 'No email added' : 'Email pending'}</div>
      <Link href={`/support/${ticket.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-bold text-primary hover:border-primary/40 hover:bg-primary/5 xl:justify-self-end" data-testid={`link-support-ticket-${ticket.id}`}>View ticket <HiOutlineArrowUpRight size={13} /></Link>
    </article>
  );
}

export function SupportPage() {
  const ticketsQuery = useListMySupportTickets({ query: { queryKey: getListMySupportTicketsQueryKey() } });
  const tickets = ticketsQuery.data || [];
  return (
    <KamaloShell>
       <div className="page-frame min-h-[calc(100dvh-57px)] pb-12 md:min-h-[100dvh] md:pb-16">
         <header className="page-header flex-col items-start gap-5 pt-7 lg:flex-row lg:items-end">
          <div><SectionLabel>Customer care / Help &amp; Support</SectionLabel><h1 className="page-title">Your support desk.</h1><p className="page-description">Track specialist reviews, resolutions, and the email updates connected to your KAMALO conversations.</p></div>
          <Link href="/" className="button-primary inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[12px] font-bold text-primary-foreground" data-testid="link-support-new-conversation"><HiOutlineLifebuoy size={16} /> Back to chat</Link>
        </header>
          {ticketsQuery.isLoading ? <div className="mt-8 space-y-2" role="status" aria-live="polite"><span className="sr-only">Loading support tickets</span>{[1, 2, 3].map((item) => <div key={item} className="skeleton h-28 rounded-xl" />)}</div> : ticketsQuery.isError ? <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center" role="alert" aria-live="assertive"><p className="text-[13px] font-semibold">Support history is unavailable.</p><button onClick={() => void ticketsQuery.refetch()} className="button-secondary mt-4 rounded-lg border border-border bg-card px-4 py-2 text-[11px] font-bold" data-testid="button-retry-support">Try again</button></div> : tickets.length === 0 ? <div className="surface mt-8 border-dashed bg-card/60 p-10 text-center" role="region" aria-label="Empty support tickets" data-testid="support-empty"><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><HiOutlineLifebuoy size={22} /></div><h2 className="mt-4 text-xl font-extrabold tracking-[-.03em]">No support tickets yet.</h2><p className="mx-auto mt-2 max-w-sm text-[12px] leading-6 text-muted-foreground">When an answer needs specialist review, raise a ticket from the feedback form and it will appear here with its ticket ID.</p><Link href="/" className="button-primary mt-5 inline-flex rounded-lg bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground" data-testid="link-support-start-chat">Start a conversation</Link></div> : <div className="surface mt-8 overflow-hidden"><div className="hidden border-b border-border bg-muted/40 px-5 py-3 font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground sm:block">Your tickets</div><div className="divide-y divide-border/80">{tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}</div></div>}
      </div>
    </KamaloShell>
  );
}