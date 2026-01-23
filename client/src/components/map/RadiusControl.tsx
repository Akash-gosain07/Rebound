const options = [
  { label: '1km', value: 1 },
  { label: '2km', value: 2 },
  { label: '5km', value: 5 },
  { label: '10km', value: 10 }
];

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function RadiusControl({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 shadow-soft ring-1 ring-slate-200">
      <span className="pl-1 text-[11px] font-medium text-slate-600">Radius</span>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={
            'rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors ' +
            (opt.value === value
              ? 'bg-gradient-to-r from-teal-500 to-teal-400 text-white shadow-soft'
              : 'text-slate-600 hover:bg-slate-100')
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
