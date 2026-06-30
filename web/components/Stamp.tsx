/**
 * Élément signature du design KonfIA : un sceau qui matérialise une preuve
 * (et pas une simple décoration). Utilisé partout où une donnée a été
 * vérifiée par le système — niveau de compétence, nombre de validations,
 * statut d'un projet — jamais pour de l'esthétique pure.
 */
export function Stamp({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-jade/40 bg-jade/10 px-2.5 py-1 font-mono text-xs text-jade">
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" className="shrink-0">
        <circle cx="4" cy="4" r="4" fill="currentColor" />
      </svg>
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-jade">{value}</span>
    </span>
  );
}
