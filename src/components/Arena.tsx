import { Fragment, type ReactNode } from 'react';
import type { Entry } from '../types';
import { app, choose, type Row } from '../state/app';
import { Card } from './Card';

// Id estável por objeto, pra carta que continua na arena não recarregar a imagem.
const ids = new WeakMap<object, number>();
let seq = 0;
export const keyOf = (o: object) => { let id = ids.get(o); if (id == null) { id = ++seq; ids.set(o, id); } return id; };

/** Cartas lado a lado com "VS" entre elas. Clique escolhe (ignorado durante a roleta). */
export function Arena({ id, className, row, items, extras = [], waiting, onPick }: {
  id: string;
  className: string;
  row: Row;
  items: Entry[];
  extras?: ReactNode[];
  waiting?: boolean;
  onPick?: (e: Entry) => void;
}) {
  if (waiting) return <div className={className} id={id}><p className="mute">Esperando as listas carregarem…</p></div>;
  const spinHere = app.spinRow === row;
  return (
    <div className={className} id={id}>
      {items.map((it, i) => (
        <Fragment key={keyOf(it)}>
          {i > 0 && <span className="vs">VS</span>}
          <Card it={it} index={i} extra={extras[i]} lit={spinHere && app.lit === i} picked={spinHere && app.picked === i}
            onClick={() => (onPick ?? choose)(it)} />
        </Fragment>
      ))}
    </div>
  );
}
