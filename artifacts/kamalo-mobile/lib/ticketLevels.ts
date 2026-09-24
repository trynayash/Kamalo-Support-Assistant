export type TicketLevel = 1 | 2 | 3 | 4 | 5;

export type SlaCategory = 'L1' | 'L2' | 'IS';

export interface TicketLevelMeta {
  level: TicketLevel;
  slaCode: SlaCategory;
  slaLabel: string;
  slaHours: number;
  label: string;
  description: string;
  badgeTone: 'neutral' | 'teal' | 'amber' | 'red';
}

export const TICKET_LEVEL_CONFIG: Record<TicketLevel, TicketLevelMeta> = {
  1: {
    level: 1,
    slaCode: 'L1',
    slaLabel: 'L1 · 24h SLA',
    slaHours: 24,
    label: 'Informational',
    description: 'Direct deal & standard product guidance (24 hours resolution target).',
    badgeTone: 'neutral',
  },
  2: {
    level: 2,
    slaCode: 'L2',
    slaLabel: 'L2 · 48h SLA',
    slaHours: 48,
    label: 'Standard',
    description: 'General support inquiry or answer review (48 hours resolution target).',
    badgeTone: 'teal',
  },
  3: {
    level: 3,
    slaCode: 'L2',
    slaLabel: 'L2 · 48h SLA',
    slaHours: 48,
    label: 'Elevated',
    description: 'Engine query (Coins/Fincado/Rewards) requiring specialist review.',
    badgeTone: 'amber',
  },
  4: {
    level: 4,
    slaCode: 'IS',
    slaLabel: 'I.S. · Immediate',
    slaHours: 4,
    label: 'Urgent',
    description: 'Transaction or account access issue under immediate supervision.',
    badgeTone: 'red',
  },
  5: {
    level: 5,
    slaCode: 'IS',
    slaLabel: 'I.S. · Immediate',
    slaHours: 1,
    label: 'Critical',
    description: 'Security or financial risk under Immediate Supervision (I.S.).',
    badgeTone: 'red',
  },
};

export const SUPPORT_CATEGORIES = [
  'Transaction Related Issue',
  'Coin Related Issue',
  'Fincado Related Issue',
  'Others',
] as const;

export type SupportCategory = typeof SUPPORT_CATEGORIES[number];

export function getTicketLevelMeta(level: number): TicketLevelMeta {
  const safeLevel = Math.min(5, Math.max(1, Math.round(level))) as TicketLevel;
  return TICKET_LEVEL_CONFIG[safeLevel];
}

export function calculateSlaStatus(createdAt: string | Date, level: number, resolvedAt?: string | Date | null) {
  const meta = getTicketLevelMeta(level);
  const createdDate = new Date(createdAt);
  const slaDeadline = new Date(createdDate.getTime() + meta.slaHours * 60 * 60 * 1000);
  const now = resolvedAt ? new Date(resolvedAt) : new Date();
  const diffMs = slaDeadline.getTime() - now.getTime();
  const isOverdue = diffMs < 0;

  const totalHours = Math.abs(diffMs) / (1000 * 60 * 60);
  const formattedHours = Math.round(totalHours);

  let statusText = '';
  if (resolvedAt) {
    statusText = isOverdue ? `Resolved (${formattedHours}h past SLA)` : 'Resolved within SLA';
  } else if (isOverdue) {
    statusText = `Overdue by ${formattedHours}h`;
  } else if (meta.slaCode === 'IS') {
    statusText = 'Immediate Supervision (Act now)';
  } else {
    statusText = `${formattedHours}h remaining`;
  }

  return {
    slaCode: meta.slaCode,
    slaLabel: meta.slaLabel,
    deadline: slaDeadline,
    isOverdue,
    statusText,
    badgeTone: isOverdue ? ('red' as const) : meta.badgeTone,
  };
}
