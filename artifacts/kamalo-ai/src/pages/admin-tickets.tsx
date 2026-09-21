import { useEffect, useMemo, useState } from 'react';
import type { SupportTicket, SupportTicketUpdateStatus } from '@workspace/api-client-react';
import { getListSupportTicketsQueryKey, useAnalyzeSupportTicket, useListSupportTickets, useRetrySupportTicketEmail, useUpdateSupportTicket } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowPath, HiOutlineCheck, HiOutlineClock, HiOutlineCpuChip, HiOutlineEnvelope, HiOutlineHandRaised, HiOutlineInboxStack, HiOutlinePaperClip, HiOutlineSparkles } from '@/components/kamalo-icons';
import { KamaloShell, SectionLabel } from '@/components/kamalo-shell';
import { TicketLevelBadge } from '@/lib/ticket-levels';
import { KamaloSelect } from '@/components/kamalo-select';

const dateTime = (value: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
const statuses: SupportTicketUpdateStatus[] = ['open', 'in_review', 'resolved', 'closed'];
const tone: Record<string, string> = { open: 'text-[hsl(31_60%_35%)] bg-[hsl(var(--accent)/.14)]', in_review: 'text-primary bg-primary/10', resolved: 'text-[hsl(150_35%_30%)] bg-[hsl(150_35%_45%/.1)]', closed: 'text-muted-foreground bg-muted' };

function TicketListItem({ ticket, selected, onSelect }: { ticket: SupportTicket; selected: boolean; onSelect: () => void }) {
  return <button onClick={onSelect} className={`w-full border-b border-border/80 px-3 py-4 text-left transition-colors sm:px-4 ${selected ? 'bg-primary/[.07]' : 'hover:bg-muted/40'}`} data-testid={`button-admin-ticket-${ticket.id}`}><div className="flex items-start justify-between gap-3"><span className="min-w-0 truncate font-mono text-[9px] font-bold tracking-[.08em] text-primary">{ticket.ticketNumber}</span><span className={`shrink-0 rounded-md px-2 py-1 font-mono text-[8px] uppercase tracking-[.1em] ${tone[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span></div><div className="mt-2 flex items-center gap-2"><span className="min-w-0 truncate text-[12px] font-bold">{ticket.summary}</span><TicketLevelBadge level={ticket.level} /></div><div className="mt-1 truncate text-[10px] text-muted-foreground">{ticket.category} · {dateTime(ticket.createdAt)}</div></button>;
}

function TicketDetail({ ticket, onSaved }: { ticket: SupportTicket; onSaved: (message: string) => void }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'ai' | 'human'>((ticket.resolutionSource as 'ai' | 'human') || 'human');
  const [status, setStatus] = useState<SupportTicketUpdateStatus>(ticket.status);
  const [resolution, setResolution] = useState(ticket.resolution || '');
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo || '');
  const analyze = useAnalyzeSupportTicket();
  const update = useUpdateSupportTicket();
  const retryEmail = useRetrySupportTicketEmail();

  useEffect(() => {
    setMode((ticket.resolutionSource as 'ai' | 'human') || 'human');
    setStatus(ticket.status);
    setResolution(ticket.resolution || '');
    setAssignedTo(ticket.assignedTo || '');
  }, [ticket.id, ticket.status, ticket.resolution, ticket.resolutionSource, ticket.assignedTo]);

  const analyzeTicket = async () => {
    try {
      const result = await analyze.mutateAsync({ ticketId: ticket.id, data: { mode } });
      setResolution(result.draftResolution);
      setStatus('in_review');
      onSaved(mode === 'ai' ? 'AI draft prepared. Verify it before sending.' : 'Human review assigned.');
    } catch {
      onSaved('Analysis could not be completed. Try again.');
    }
  };

  const save = async () => {
    if (status === 'resolved' && !resolution.trim()) {
      onSaved('Add a resolution before marking the ticket resolved.');
      return;
    }
    try {
      const updatedTicket = await update.mutateAsync({ ticketId: ticket.id, data: { status, assignedTo: assignedTo.trim() || null, resolution: resolution.trim() || null, resolutionSource: mode } });
      await queryClient.invalidateQueries({ queryKey: getListSupportTicketsQueryKey() });
      if (status !== 'resolved') {
        onSaved('Ticket updated.');
      } else if (updatedTicket.emailStatus === 'sent') {
        onSaved('Resolution saved and emailed to the user.');
      } else if (updatedTicket.emailStatus === 'failed') {
        onSaved('Resolution saved. Email delivery failed, but the user can still see it in Help & Support.');
      } else {
        onSaved('Resolution saved. It is available in Help & Support.');
      }
    } catch {
      onSaved('Ticket could not be updated. Try again.');
    }
  };

  const retryNotification = async () => {
    try {
      const updatedTicket = await retryEmail.mutateAsync({ ticketId: ticket.id });
      await queryClient.invalidateQueries({ queryKey: getListSupportTicketsQueryKey() });
      onSaved(updatedTicket.emailStatus === 'sent' ? 'Email sent successfully.' : 'Email delivery is still unavailable. The ticket remains saved.');
    } catch {
      onSaved('Email retry could not be completed. The ticket remains saved.');
    }
  };

  const attachmentUrls = ticket.attachmentIds.map((id) => `/api/conversations/${ticket.conversationId}/attachments/${id}`);
  return <div className="min-w-0 p-4 sm:p-6 lg:p-7" data-testid="panel-admin-ticket-detail">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5"><div className="min-w-0"><SectionLabel>Ticket / {ticket.category}</SectionLabel><h2 className="mt-3 break-words text-2xl font-extrabold tracking-[-.045em]">{ticket.summary}</h2><div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[9px] text-muted-foreground"><span>{ticket.ticketNumber}</span><span>·</span><span>Opened {dateTime(ticket.createdAt)}</span><span>·</span><span>Language {ticket.language}</span><span className="hidden sm:inline">·</span><span className="break-all sm:break-normal">{ticket.contactEmail || 'No contact email'}</span></div></div><div className="flex flex-wrap items-center gap-2"><span className={`shrink-0 rounded-md px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] ${tone[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span><TicketLevelBadge level={ticket.level} /></div></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
         <div className="rounded-xl border border-border bg-background p-4"><div className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Customer issue brief</div><p className="mt-3 whitespace-pre-wrap text-[12px] leading-6">{ticket.details}</p><div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3"><span className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">AI routing</span><span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{ticket.assignedTo || 'Not assigned'}</span></div></div>
        {attachmentUrls.length > 0 && <div className="mt-4"><div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground"><HiOutlinePaperClip size={13} /> Evidence attached</div><div className="grid gap-3 sm:grid-cols-2">{attachmentUrls.map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={url} className="overflow-hidden rounded-lg border border-border bg-background hover:border-primary/40"><img src={url} alt={`Ticket evidence ${index + 1}`} className="h-36 w-full object-contain" /><div className="border-t border-border px-3 py-2 text-[10px] font-semibold text-primary">Open image</div></a>)}</div></div>}
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/[.04] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-mono text-[9px] uppercase tracking-[.14em] text-primary">Analysis path</div><p className="mt-1 text-[11px] text-muted-foreground">Choose who reviews this ticket, then prepare a resolution.</p></div><div className="flex rounded-lg border border-border bg-background p-1"><button onClick={() => setMode('ai')} className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[10px] font-bold ${mode === 'ai' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} data-testid="button-analysis-ai"><HiOutlineCpuChip size={14} /> AI</button><button onClick={() => setMode('human')} className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[10px] font-bold ${mode === 'human' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} data-testid="button-analysis-human"><HiOutlineHandRaised size={14} /> Human</button></div></div><button onClick={() => void analyzeTicket()} disabled={analyze.isPending} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-background px-3 py-2.5 text-[11px] font-bold text-primary hover:bg-primary/10 disabled:opacity-50" data-testid="button-run-ticket-analysis"><HiOutlineSparkles size={14} />{analyze.isPending ? 'Analyzing…' : mode === 'ai' ? 'Prepare AI draft' : 'Assign human review'}</button></div>
      </div>
         <div className="min-w-0 space-y-4"><label className="block"><span className="mb-2 block font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Status</span><KamaloSelect value={status} onValueChange={(value) => setStatus(value as SupportTicketUpdateStatus)} ariaLabel="Ticket status" testId="select-ticket-status" options={statuses.map((item) => ({ value: item, label: item.replace('_', ' ') }))} /></label><label className="block"><span className="mb-2 block font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Assigned to</span><input value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="Human specialist or KAMALO AI" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-[11px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-ticket-assignee" /></label><label className="block"><span className="mb-2 block font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Resolution to send</span><textarea value={resolution} onChange={(event) => setResolution(event.target.value)} maxLength={4000} rows={10} placeholder="Write the verified answer the user should receive." className="w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-[11px] leading-5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-ticket-resolution" /></label><button onClick={() => void save()} disabled={update.isPending || retryEmail.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[11px] font-bold text-primary-foreground hover:-translate-y-0.5 disabled:opacity-50" data-testid="button-save-ticket-resolution"><HiOutlineCheck size={14} />{update.isPending ? 'Saving…' : status === 'resolved' ? 'Save & notify user' : 'Save ticket update'}</button>{ticket.emailStatus === 'failed' && ticket.contactEmail && <button onClick={() => void retryNotification()} disabled={update.isPending || retryEmail.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[11px] font-bold text-destructive hover:bg-destructive/10 disabled:opacity-50" data-testid="button-retry-ticket-email"><HiOutlineArrowPath size={14} />{retryEmail.isPending ? 'Retrying…' : 'Retry email'}</button>}<div className={`flex items-start gap-2 text-[10px] ${ticket.emailStatus === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`}><HiOutlineEnvelope size={13} className="mt-0.5 shrink-0" /><span className="min-w-0 break-words">{ticket.emailStatus === 'sent' ? 'Last notification sent' : ticket.emailStatus === 'failed' ? 'Email delivery failed. The ticket and any resolution remain available in Help & Support.' : ticket.contactEmail ? 'Notification available' : 'Add an email to notify'}</span></div></div>
    </div>
  </div>;
}

export function AdminTicketsPage() {
  const ticketsQuery = useListSupportTickets({
    query: {
      queryKey: getListSupportTicketsQueryKey(),
      retry: 5,
      retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 5000),
      refetchOnMount: true,
    },
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const tickets = ticketsQuery.data || [];
  const selected = useMemo(() => tickets.find((ticket) => ticket.id === selectedId) || tickets[0], [selectedId, tickets]);
  useEffect(() => { if (!selectedId && tickets[0]) setSelectedId(tickets[0].id); }, [selectedId, tickets]);
  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200); };

  return <KamaloShell><div className="mx-auto min-h-[calc(100dvh-57px)] max-w-[1400px] px-4 pb-12 sm:px-6 md:min-h-[100dvh] md:px-9 md:py-8 lg:px-12"><header className="flex flex-col gap-4 border-b border-border/70 pb-7 pt-5 lg:flex-row lg:items-end lg:justify-between lg:pt-0"><div><SectionLabel>Temporary test access / Support operations</SectionLabel><h1 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-none tracking-[-.06em]">Ticket control room.</h1><p className="mt-4 max-w-xl text-[13px] leading-6 text-muted-foreground">Review customer context, choose AI or human analysis, and publish a verified resolution. This page is intentionally exposed for testing until authentication is added.</p></div><div className="flex items-center gap-2"><span className="rounded-md border border-[hsl(var(--accent)/.45)] bg-[hsl(var(--accent)/.14)] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[hsl(31_60%_35%)]">Test admin</span><button onClick={() => void ticketsQuery.refetch()} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary" aria-label="Refresh tickets" data-testid="button-refresh-tickets"><HiOutlineArrowPath size={15} /></button></div></header>{notice && <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-[11px] text-primary animate-rise" role="status" data-testid="status-admin-ticket-notice">{notice}</div>}{ticketsQuery.isLoading ? <div className="mt-7 grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]"><div className="skeleton h-[460px] rounded-xl" /><div className="skeleton h-[460px] rounded-xl" /></div> : ticketsQuery.isError ? <div className="mt-7 rounded-xl border border-destructive/20 bg-destructive/5 p-10 text-center"><p className="text-[13px] font-semibold">Ticket queue unavailable.</p><button onClick={() => void ticketsQuery.refetch()} className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-[11px] font-bold" data-testid="button-retry-admin-tickets">Try again</button></div> : tickets.length === 0 ? <div className="mt-7 rounded-xl border border-dashed border-border bg-card/60 p-12 text-center"><HiOutlineInboxStack size={26} className="mx-auto text-muted-foreground" /><h2 className="mt-4 text-xl font-extrabold">Queue is clear.</h2><p className="mt-2 text-[12px] text-muted-foreground">Tickets raised from the chat will appear here.</p></div> : <div className="mt-7 grid min-w-0 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]"><section className="thin-scrollbar min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-sm)]"><div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3"><span className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Queue</span><span className="font-mono text-[10px] text-muted-foreground">{tickets.length}</span></div>{tickets.map((ticket) => <TicketListItem key={ticket.id} ticket={ticket} selected={ticket.id === selected?.id} onSelect={() => setSelectedId(ticket.id)} />)}</section><section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-sm)]">{selected && <TicketDetail key={selected.id} ticket={selected} onSaved={showNotice} />}</section></div>}</div></KamaloShell>;
}