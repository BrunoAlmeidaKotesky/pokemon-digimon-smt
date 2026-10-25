import { app, spin } from '../state/app';
import { KEYS } from '../sources';

// Um setor da roda por franquia fixa, a partir do topo em sentido horário, cada um com a cor --{chave}.
const pt = (i: number) => {
  const a = (i / KEYS.length) * 2 * Math.PI;
  return `${(20 + 18 * Math.sin(a)).toFixed(2)} ${(20 - 18 * Math.cos(a)).toFixed(2)}`;
};
const SLICES = KEYS.map((k, i) => ({ k, d: `M20 20L${pt(i)}A18 18 0 0 1 ${pt(i + 1)}Z` }));

/** Botão "Roleta" com a roda nas cores das franquias (tecla R). */
export function SpinButton({ onSpin = spin, disabled }: { onSpin?: () => void; disabled?: boolean }) {
  return (
    <div className="spinbar">
      <button className="spin" title="Roleta (tecla R)" disabled={disabled ?? app.spinning} onClick={onSpin}>
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <g className="wheel">
            <circle cx="20" cy="20" r="18" fill="var(--line)" />
            {SLICES.map(s => <path key={s.k} d={s.d} fill={`var(--${s.k})`} />)}
            <circle cx="20" cy="20" r="18" fill="none" stroke="var(--fg)" strokeWidth="2" />
            <circle cx="20" cy="20" r="4" fill="var(--panel)" stroke="var(--fg)" strokeWidth="2" />
          </g>
          <path d="M20 0L24 7H16Z" fill="var(--gold)" stroke="var(--fg)" strokeWidth="1" />
        </svg>
        <span>Roleta</span>
      </button>
    </div>
  );
}
