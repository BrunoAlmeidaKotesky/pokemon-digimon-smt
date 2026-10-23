import { useEffect, useState } from 'react';
import { spinDelay, PICK_MS, PICK_MS_CALM } from '../../core/spin';
import type { VoteView } from '../../online/types';

type Spin = NonNullable<NonNullable<VoteView['result']>['spin']>;
/** Roleta antiga demais (de quem entrou depois) não anima: mostra direto o resultado. */
const MAX_AGE = 8000;
const iniciada = new Set<number>();
const terminada = new Set<number>();

/**
 * Anima a roleta decidida pelo host: acende as cartas `among` em sequência, desacelerando, e para no vencedor
 * (mesma conta da roleta do modo solo). Todos usam o mesmo plano, então a animação é a mesma em todos os aparelhos.
 * `done` = pode mostrar o resultado.
 */
export function useSpinAnim(spin: Spin | null): { lit: number | null; picked: number | null; done: boolean } {
  const [cur, setCur] = useState<{ id: number; lit: number | null; picked: number | null } | null>(null);
  const [, setFim] = useState(0);
  const id = spin?.id ?? null;

  useEffect(() => {
    if (!spin || iniciada.has(spin.id)) return;
    const { among, start, total } = spin, sid = spin.id, m = among.length;
    iniciada.add(sid);
    let t: ReturnType<typeof setTimeout> | null = null;
    let vivo = true;
    const acabar = () => {
      terminada.add(sid);
      document.body.classList.remove('spinning');
      if (vivo) { setCur(null); setFim(x => x + 1); }
    };
    if (spin.age > MAX_AGE) { t = setTimeout(acabar, 0); return () => { vivo = false; if (t) clearTimeout(t); terminada.add(sid); }; }
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.add('spinning');
    let k = calm ? total : 0;
    const tick = () => {
      const idx = among[(start + k) % m]!;
      if (k >= total) {
        setCur({ id: sid, lit: idx, picked: idx });
        t = setTimeout(acabar, calm ? PICK_MS_CALM : PICK_MS);
        return;
      }
      setCur({ id: sid, lit: idx, picked: null });
      k++;
      t = setTimeout(tick, spinDelay(k, total));
    };
    t = setTimeout(tick, 0);
    return () => { vivo = false; if (t) clearTimeout(t); terminada.add(sid); document.body.classList.remove('spinning'); };
    // o plano de uma roleta não muda depois de decidido: basta reagir ao id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (id == null) return { lit: null, picked: null, done: true };
  if (terminada.has(id)) return { lit: null, picked: null, done: true };
  if (cur && cur.id === id) return { lit: cur.lit, picked: cur.picked, done: false };
  return { lit: null, picked: null, done: false };
}
