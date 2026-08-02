export const money = (n: number | null | undefined) =>
  n == null ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`;

export const km = (n: number) => `${n.toFixed(1)} km`;
export const mins = (n: number) => `${Math.round(n)} min`;

export function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export const STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Finding a driver',
  MATCHED: 'Driver matched',
  ARRIVING: 'Driver on the way',
  IN_PROGRESS: 'On trip',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const STATUS_COLOR: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-700',
  MATCHED: 'bg-sky-100 text-sky-700',
  ARRIVING: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-brand-100 text-brand-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};
