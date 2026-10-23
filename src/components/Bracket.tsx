import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Cup, Entry, Match } from '../types';
import { bracketColumns, bracketHeight, bracketLinks, same } from '../core/cup';
import { frStyle } from '../state/app';
import { resolveImg } from '../customs/store';

/** Participante dentro de um confronto: miniatura, nome e faixa na cor da franquia. "???" quando ainda não se sabe. */
function Slot({ it, m, title }: { it: Entry | null; m?: Match; title?: (e: Entry) => string | undefined }) {
  if (!it) return <div className="slot empty"><span className="th"></span><span className="nm">???</span></div>;
  if (it.fr === '') return <div className="slot empty"><span className="th"></span><span className="nm">{it.name}</span></div>;
  const st = !m || !m.w ? '' : same(m.w, it) ? ' win' : ' lose';
  return (
    <div className={'slot' + st} data-fr={it.fr} style={frStyle(it.fr)} title={title?.(it)}>
      <span className="th">{it.img ? <img src={resolveImg(it.img)} alt="" loading="lazy" /> : null}</span>
      <span className="nm">{it.name}</span>
    </div>
  );
}

/** Chaveamento: uma coluna por rodada e a coluna "Campeão", com linhas ligando cada vencedor ao próximo confronto. */
export function Bracket({ cup, title }: { cup: Cup; title?: (e: Entry) => string | undefined }) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const cols = bracketColumns(cup);
  const H = bracketHeight(cup);
  const champCol = cols[cols.length - 1]!;
  const roundCols = cols.slice(0, -1);

  // Liga cada confronto decidido ao confronto da rodada seguinte em que o vencedor aparece.
  const draw = () => {
    const b = box.current, s = svg.current;
    if (!b || !s) return;
    const o = b.getBoundingClientRect();
    s.setAttribute('width', String(b.scrollWidth)); s.setAttribute('height', String(b.scrollHeight));
    const at = (r: number, m: number) => b.querySelector(`.match[data-r="${r}"][data-m="${m}"]`);
    let d = '';
    for (const l of bracketLinks(cup)) {
      const A = at(l.r, l.m), B = at(l.tr, l.tm);
      if (!A || !B) continue;
      const a = A.getBoundingClientRect(), c = B.getBoundingClientRect();
      const x1 = a.right - o.left, y1 = a.top + a.height / 2 - o.top, x2 = c.left - o.left, y2 = c.top + c.height / 2 - o.top, xm = (x1 + x2) / 2;
      d += `M${x1} ${y1}H${xm}V${y2}H${x2}`;
    }
    s.innerHTML = `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
  };
  const drawRef = useRef(draw);
  useLayoutEffect(() => { drawRef.current = draw; requestAnimationFrame(() => drawRef.current()); });
  useEffect(() => {
    const onResize = () => requestAnimationFrame(() => drawRef.current());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="bk-inner" style={{ height: H + 28 }} ref={box}>
      {roundCols.map((c, ci) => (
        <div className="bk-col" key={ci}>
          <div className="bk-title">{c.title}</div>
          <div className="bk-ms" style={{ height: H }}>
            {c.matches.map((x, mi) => (
              <div className={'match' + (x.now ? ' now' : '')} data-r={ci} data-m={mi} key={mi}>
                {x.hidden ? <><Slot it={null} /><Slot it={null} /></> : <><Slot it={x.m.a} m={x.m} title={title} /><Slot it={x.m.b} m={x.m} title={title} /></>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="bk-col">
        <div className="bk-title">{champCol.title}</div>
        <div className="bk-ms" style={{ height: H }}>
          <div className="match champ" data-r={roundCols.length} data-m="0"><Slot it={cup.champ} title={title} /></div>
        </div>
      </div>
      <svg className="bk-lines" aria-hidden="true" ref={svg}></svg>
    </div>
  );
}
