
export default function SafeLocationSelector({ locations, onSelect, selectedLocation, loading }) {
    if (!locations || locations.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="text-sm font-medium text-slate-900 dark:text-white">
                Select a Safe Meetup Point
            </div>
            <div className="grid gap-3">
                {locations.map((loc, idx) => {
                    const isSelected = selectedLocation?.label === loc.label;
                    return (
                        <button
                            key={idx}
                            onClick={() => onSelect(loc)}
                            disabled={loading}
                            className={`text-left p-4 rounded-xl border transition-all ${isSelected
                                    ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-500 ring-1 ring-teal-500'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-500/50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 dark:border-slate-600'
                                    }`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <div>
                                    <div className={`font-medium ${isSelected ? 'text-teal-700 dark:text-teal-300' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {loc.label}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {loc.address}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
