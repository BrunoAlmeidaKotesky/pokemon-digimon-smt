import type { ReactNode } from 'react';
import { label, frColor } from '../state/app';

/** Botões lado a lado em que só um fica marcado (ex.: 8 / 16 / 32). */
export function Segmented<T extends string | number>({ id, value, options, onChange, disabled, ariaLabel }: {
  id?: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <div className="seg" id={id} role="radiogroup" aria-label={ariaLabel}>
      {options.map(o => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} data-n={o.value}
          className={o.value === value ? 'on' : ''} disabled={disabled} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/** Interruptor liga/desliga com título e explicação (por baixo é um checkbox, então teclado e leitor de tela funcionam). */
export function Switch({ id, checked, onChange, disabled, title, children }: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  title: string;
  children?: ReactNode;
}) {
  return (
    <label className={'switch' + (disabled ? ' off' : '')}>
      <input type="checkbox" role="switch" id={id} checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
      <span className="track" aria-hidden="true"><span className="knob" /></span>
      <span className="txt"><b>{title}</b>{children && <small>{children}</small>}</span>
    </label>
  );
}

/** Chip de franquia que liga/desliga (na cor da franquia). */
export function FranchiseToggle({ k, id, checked, onChange, disabled }: { k: string; id: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={'fr-toggle' + (checked ? ' on' : '')} style={{ ['--c' as string]: frColor(k) }}>
      <input type="checkbox" id={id} checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
      <span className="dot" aria-hidden="true" />{label(k)}
    </label>
  );
}

/** Um lado da arena: rótulo, faixa na cor da franquia escolhida e o seletor. */
export function SideSelect({ id, n, value, frs, onChange, disabled }: { id: string; n: number; value: string; frs: string[]; onChange: (k: string) => void; disabled?: boolean }) {
  return (
    <label className="side" style={{ ['--c' as string]: frColor(value) }}>
      <span className="side-n">Lado {n}</span>
      <select id={id} aria-label={'Franquia ' + n} value={value} disabled={disabled} onChange={e => onChange(e.target.value)}>
        {frs.map(k => <option key={k} value={k}>{label(k)}</option>)}
        {!frs.includes(value) && <option value={value}>{label(value) || value}</option>}
      </select>
    </label>
  );
}
