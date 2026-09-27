import type { ReactNode } from 'react';

/** "LABEL ........ VALUE" row used by system/status screens. */
export function LeaderLine({
  label,
  value,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: 'system' | 'dim' | 'select' | 'danger';
}) {
  return (
    <div className="leader-line">
      <span>{label}</span>
      <span className="leader-line__dots" aria-hidden="true" />
      <span className={tone ? `tone-${tone}` : undefined}>{value}</span>
    </div>
  );
}
