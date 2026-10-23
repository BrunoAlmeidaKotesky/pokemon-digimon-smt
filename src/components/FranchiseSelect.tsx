import { app, label } from '../state/app';

/** Seletor de franquia com as franquias disponíveis (Sujimon some se a lista faltar). */
export function FranchiseSelect({ id, ariaLabel, value, onChange }: { id: string; ariaLabel: string; value: string; onChange: (k: string) => void }) {
  return (
    <select id={id} aria-label={ariaLabel} value={value} onChange={e => onChange(e.target.value)}>
      {app.avail.map(k => <option key={k} value={k}>{label(k)}</option>)}
    </select>
  );
}
