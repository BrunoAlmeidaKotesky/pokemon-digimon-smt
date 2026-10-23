import { app, spin } from '../state/app';

/** Botão "Roleta" com a roda nas cores das franquias (tecla R). */
export function SpinButton({ onSpin = spin, disabled }: { onSpin?: () => void; disabled?: boolean }) {
  return (
    <div className="spinbar">
      <button className="spin" title="Roleta (tecla R)" disabled={disabled ?? app.spinning} onClick={onSpin}>
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <g className="wheel">
            <circle cx="20" cy="20" r="18" fill="var(--line)" />
            <path d="M20 20L20.00 2.00A18 18 0 0 1 34.07 8.78Z" fill="var(--pokemon)" />
            <path d="M20 20L34.07 8.78A18 18 0 0 1 37.55 24.01Z" fill="var(--digimon)" />
            <path d="M20 20L37.55 24.01A18 18 0 0 1 27.81 36.22Z" fill="var(--smt)" />
            <path d="M20 20L27.81 36.22A18 18 0 0 1 12.19 36.22Z" fill="var(--jojo)" />
            <path d="M20 20L12.19 36.22A18 18 0 0 1 2.45 24.01Z" fill="var(--ygo)" />
            <path d="M20 20L2.45 24.01A18 18 0 0 1 5.93 8.78Z" fill="var(--bakugan)" />
            <path d="M20 20L5.93 8.78A18 18 0 0 1 20.00 2.00Z" fill="var(--sujimon)" />
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
