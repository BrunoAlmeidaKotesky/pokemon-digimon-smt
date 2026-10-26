import { useEffect, useState, type ReactNode } from 'react';
import type { Entry, FranchiseKey } from '../types';
import { resolve } from '../sources/resolve';
import { label, frColor } from '../state/app';
import { resolveImg } from '../customs/store';

/** "Top 10 de Pokémon" (um top por franquia) ou "Top 10 misturado". */
export const topTitle = (fr: FranchiseKey | null, n: number) => (fr ? `Top ${n} de ${label(fr) || fr}` : `Top ${n} misturado`);
/** Posição (0 = 1º lugar) por extenso curto: "1º". */
export const lugar = (pos: number) => `${pos + 1}º`;
/** Tecla de cada posição: 1 a 9 e 0 pra 10ª (as outras não têm). */
const tecla = (pos: number) => (pos < 9 ? String(pos + 1) : pos === 9 ? '0' : '');

/** Miniatura: o Digimon chega sem imagem e busca o detalhe; a franquia personalizada vem como "cst:". */
function Thumb({ it }: { it: Entry }) {
  const [got, setGot] = useState<{ href: string; img: string } | null>(null);
  useEffect(() => {
    if (it.img || !it.href) return;
    let vivo = true;
    resolve({ ...it }).then(x => { if (vivo) setGot({ href: it.href!, img: x.img }); });
    return () => { vivo = false; };
    // depende do conteúdo, não do objeto (no modo online cada visão chega como objeto novo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [it.img, it.href]);
  const img = it.img || (got && got.href === it.href ? got.img : '');
  return <span className="th">{img ? <img src={resolveImg(img)} alt="" loading="lazy" /> : null}</span>;
}

/** O que muda numa posição durante a votação online: classes, etiqueta ("seu voto") e contagem depois do resultado. */
export interface RankMark {
  cls?: string;
  tag?: ReactNode;
  tally?: ReactNode;
}

/**
 * As posições de um top, do 1º lugar ao último: número e, se ocupada, miniatura, nome e franquia (na cor dela).
 * Com `onPick`, as posições livres viram botões (solo: põe o personagem; online: vota na posição).
 */
export function RankBoard({ id, slots, onPick, free, keys, mark, ghost }: {
  id?: string;
  slots: (Entry | null)[];
  /** clique numa posição livre; sem isso a lista é só pra ver */
  onPick?: (pos: number) => void;
  /** posições que aceitam clique (padrão: todas as livres) */
  free?: number[];
  /** mostra a tecla de cada posição livre (1 a 9 e 0) */
  keys?: boolean;
  /** classes e conteúdo extra de cada posição (votação online) */
  mark?: (pos: number) => RankMark | undefined;
  /** personagem mostrado numa posição ainda livre (online: o vencedor da votação, antes do "Próximo") */
  ghost?: { pos: number; it: Entry } | null;
}) {
  return (
    <ol className="rank-board" id={id}>
      {slots.map((e, i) => {
        const it = e ?? (ghost && ghost.pos === i ? ghost.it : null);
        const m = mark?.(i);
        const pickable = !e && !!onPick && (!free || free.includes(i));
        const cls = ['rank-slot', !e && it && 'ghost', m?.cls].filter(Boolean).join(' ');
        const style = it ? ({ '--c': frColor(it.fr) } as Record<string, string>) : undefined;
        const body = (
          <>
            <span className="pos">{i + 1}</span>
            {it
              ? <><Thumb it={it} /><span className="info"><span className="nm">{it.name}</span><span className="fr">{label(it.fr)}</span></span></>
              : <span className="info"><span className="nm empty">livre</span></span>}
            {m?.tag}
            {m?.tally}
            {keys && pickable && tecla(i) && <kbd className="k" aria-hidden="true">{tecla(i)}</kbd>}
          </>
        );
        return (
          <li key={i} data-pos={i} data-fr={it?.fr} className={'rank-row ' + (e ? 'filled' : 'free')}>
            {pickable
              ? <button type="button" className={cls} aria-label={`Colocar no ${lugar(i)} lugar`} onClick={() => onPick!(i)}>{body}</button>
              : <div className={cls} style={style}>{body}</div>}
          </li>
        );
      })}
    </ol>
  );
}

/** Os tops prontos (fim do ranking), cada um com o título e a lista numerada. */
export function RankTops({ tops, id }: { tops: { fr: FranchiseKey | null; slots: (Entry | null)[] }[]; id?: string }) {
  return (
    <div className={'rank-tops' + (tops.length > 1 ? ' many' : '')} id={id}>
      {tops.map((t, i) => (
        <section key={i} className="rank-top" data-fr={t.fr ?? 'mix'}>
          <h3>{topTitle(t.fr, t.slots.length)}</h3>
          <RankBoard slots={t.slots} />
        </section>
      ))}
    </div>
  );
}
