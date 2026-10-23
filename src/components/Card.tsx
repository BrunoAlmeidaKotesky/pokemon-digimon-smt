import { useEffect, useState, type ReactNode } from 'react';
import type { Entry } from '../types';
import { resolve } from '../sources/resolve';
import { label } from '../state/app';

type ImgState = 'carregando' | 'ok' | 'sem' | 'erro';

/** Carta de um personagem: tecla e coroa em cima, imagem no meio, nome e franquia embaixo. */
export function Card({ it, index, extra, lit, picked, isStatic, hideKey, onClick, cls: more, children }: {
  it: Entry;
  index: number;
  extra?: ReactNode;
  lit?: boolean;
  picked?: boolean;
  isStatic?: boolean;
  hideKey?: boolean;
  onClick?: () => void;
  /** classes extras (modo online: mine, win, lose) */
  cls?: string;
  /** conteúdo depois do rótulo da franquia (modo online: votos) */
  children?: ReactNode;
}) {
  const [img, setImg] = useState<ImgState>('carregando');
  useEffect(() => {
    let vivo = true;
    resolve(it).then(x => {
      if (!vivo) return;
      if (!x.img) { setImg('sem'); return; }
      const im = new Image(); im.alt = x.name; im.src = x.img;
      im.onload = () => { if (vivo) setImg('ok'); };
      im.onerror = () => { if (vivo) setImg('erro'); };
    });
    return () => { vivo = false; };
    // depende do conteúdo, não do objeto: no modo online cada visão chega como objeto novo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [it.name, it.img, it.href]);

  const cls = ['card', isStatic && 'static', lit && 'lit', picked && 'picked', more].filter(Boolean).join(' ');
  return (
    <button className={cls} data-fr={it.fr} onClick={onClick}>
      <div className="top">{!hideKey && <span className="key">{index + 1}</span>}{extra}</div>
      <div className="img">
        {img === 'ok' ? <img alt={it.name} src={it.img} /> : img === 'sem' ? 'sem imagem' : img === 'erro' ? 'imagem não carregou' : 'carregando…'}
      </div>
      <span className="name">{it.name}</span>
      <span className="fr">{label(it.fr)}</span>
      {children}
    </button>
  );
}

/** Coroa com a sequência de vitórias ("♛ 1 vitória", "♛ 2 vitórias"). */
export function Crown({ streak }: { streak: number }) {
  return streak > 0 ? <span className="crown">♛ {streak} {streak === 1 ? 'vitória' : 'vitórias'}</span> : null;
}
