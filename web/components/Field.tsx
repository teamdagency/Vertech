export function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-body text-xs text-muted">{label}</span>
      <input
        type={type}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 font-body text-sm text-paper focus:border-ochre/60 focus:outline-none"
      />
      {hint && <span className="mt-1 block font-mono text-[11px] text-muted">{hint}</span>}
    </label>
  );
}
