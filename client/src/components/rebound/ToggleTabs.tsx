import { cn } from '../../lib/utils';

export type ToggleValue = 'LOST' | 'FOUND';

export function ToggleTabs({
  value,
  onChange,
  className
}: {
  value: ToggleValue;
  onChange: (v: ToggleValue) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter items by status"
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-white p-1.5 shadow-soft border border-slate-200',
        className
      )}
    >
      {(
        [
          { label: 'Lost', value: 'LOST' as const },
          { label: 'Found', value: 'FOUND' as const }
        ] as const
      ).map((t) => (
        <button
          key={t.value}
          type="button"
          role="radio"
          aria-checked={value === t.value}
          aria-label={t.label === 'Lost' ? 'Show lost items' : 'Show found items'}
          onClick={() => onChange(t.value)}
          className={cn(
            'rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
            value === t.value
              ? 'bg-primary text-white shadow-button'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
