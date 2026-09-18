export type TicketLevel = 1 | 2 | 3 | 4 | 5;

export const ticketLevelMeta: Record<TicketLevel, {
  label: string;
  description: string;
  className: string;
}> = {
  1: { label: 'Informational', description: 'General guidance or a low-impact question.', className: 'border-border bg-muted text-muted-foreground' },
  2: { label: 'Standard', description: 'A service issue that needs a normal support review.', className: 'border-primary/20 bg-primary/10 text-primary' },
  3: { label: 'Elevated', description: 'A repeated, account-affecting, or evidence-backed issue.', className: 'border-[hsl(31_60%_45%/.35)] bg-[hsl(var(--accent)/.14)] text-[hsl(31_60%_35%)]' },
  4: { label: 'Urgent', description: 'Access, transaction, verification, or financial-impact issue.', className: 'border-orange-300/60 bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-200' },
  5: { label: 'Critical', description: 'Security, fraud, unauthorized activity, or active-loss signal.', className: 'border-destructive/30 bg-destructive/10 text-destructive' },
};

export function getTicketLevelMeta(level: number) {
  const safeLevel = Math.min(5, Math.max(1, Math.round(level))) as TicketLevel;
  return { level: safeLevel, ...ticketLevelMeta[safeLevel] };
}

export function TicketLevelBadge({ level }: { level: number }) {
  const meta = getTicketLevelMeta(level);
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[9px] uppercase tracking-[.1em] ${meta.className}`} title={meta.description}>L{meta.level} · {meta.label}</span>;
}