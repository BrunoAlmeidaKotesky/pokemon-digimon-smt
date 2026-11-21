// Peças da aba Adivinha usadas também na sala online: escolha da franquia, campo de chute com autocompletar,
// tabela do Clássico, imagem com zoom, emojis e lista de chutes errados.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './adivinha.css';
import type { Entry } from '../../types';
import { label, frStyle } from '../../state/app';
import { resolveImg } from '../../customs/store';
import { GRUPOS, corDoGrupo, type Grupo } from '../../adivinha/grupos';
import { explicar, type Pista } from '../../adivinha/comparar';
import { sugerir, type AdvItem } from '../../adivinha/pool';
import { escolherFoco, focoNoMiolo, zoom, type Amostra, type Ponto } from '../../adivinha/imagem';

/** Chips das franquias do Adivinha (SMT e Persona juntas). */
export function EscolhaGrupo({ id, valor, onChange, disabled }: { id: string; valor: string; onChange: (g: string) => void; disabled?: boolean }) {
  return (
    <div className="adv-grupos" id={id} role="radiogroup" aria-label="Franquia">
      {GRUPOS.map(g => (
        <button key={g.id} type="button" role="radio" aria-checked={valor === g.id} data-grupo={g.id} disabled={disabled}
          className={'adv-grupo' + (valor === g.id ? ' on' : '')} style={{ ['--c' as string]: corDoGrupo(g) }} onClick={() => onChange(g.id)}>
          <span className="dot" aria-hidden="true" />{g.rotulo}
        </button>
      ))}
    </div>
  );
}

/** Miniatura do personagem (splash do LoL recortada, o resto inteiro). */
export function Miniatura({ it }: { it: Entry }) {
  return (
    <span className="adv-th" data-fr={it.fr} style={frStyle(it.fr)}>
      {it.img ? <img src={resolveImg(it.img)} alt="" loading="lazy" draggable={false} /> : null}
    </span>
  );
}

/**
 * Campo de chute: autocompletar com nome e miniatura, sem diferenciar acento e maiúscula, sem quem já foi chutado.
 * Setas escolhem a sugestão; Enter chuta a marcada (a primeira, se nenhuma foi marcada).
 */
export function CampoChute({ id, pool, usados, onChute, disabled, placeholder, foco, varias }: {
  id: string;
  pool: readonly AdvItem[];
  usados: ReadonlySet<string>;
  onChute: (nome: string) => void;
  disabled?: boolean;
  placeholder: string;
  /** põe o cursor no campo quando fica true (vez do jogador, jogo novo) */
  foco?: boolean;
  /** mostra a franquia de cada sugestão (SMT + Persona) */
  varias?: boolean;
}) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const sugs = useMemo(() => sugerir(pool, q, usados), [pool, q, usados]);
  const marcada = Math.min(sel, Math.max(0, sugs.length - 1));
  useEffect(() => { if (foco && !disabled) ref.current?.focus(); }, [foco, disabled]);
  const chutar = (it: AdvItem) => { onChute(it.name); setQ(''); setSel(0); };
  const mostra = aberto && !disabled && q.trim() !== '';
  return (
    <div className="adv-campo">
      <input ref={ref} id={id} type="text" role="combobox" aria-label="Seu chute" aria-autocomplete="list" aria-controls={id + 'Lista'}
        aria-expanded={mostra && sugs.length > 0} aria-activedescendant={mostra && sugs.length ? `${id}Op${marcada}` : undefined}
        autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} maxLength={60}
        value={q} disabled={disabled} placeholder={placeholder}
        onChange={e => { setQ(e.target.value); setSel(0); setAberto(true); }}
        onFocus={() => setAberto(true)} onBlur={() => setAberto(false)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setAberto(true); setSel(Math.min(marcada + 1, sugs.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(Math.max(marcada - 1, 0)); }
          else if (e.key === 'Enter') { e.preventDefault(); const it = sugs[marcada]; if (it) chutar(it); }
          else if (e.key === 'Escape') setAberto(false);
        }} />
      {mostra && sugs.length > 0 && (
        <ul className="adv-sug" id={id + 'Lista'} role="listbox" aria-label="Sugestões">
          {sugs.map((it, i) => (
            <li key={it.name} id={`${id}Op${i}`} role="option" aria-selected={i === marcada} className={i === marcada ? 'on' : undefined} data-nome={it.name}
              onMouseDown={e => { e.preventDefault(); chutar(it); }} onMouseEnter={() => setSel(i)}>
              <Miniatura it={it} /><span className="nm">{it.name}</span>{varias && <span className="fr" style={frStyle(it.fr)} data-fr={it.fr}>{label(it.fr)}</span>}
            </li>
          ))}
        </ul>
      )}
      {mostra && !sugs.length && <p className="adv-nada" id={id + 'Nada'}>Ninguém com esse nome (ou já foi chutado).</p>}
    </div>
  );
}

/** Quem chutou, no começo da frase ("você" vira "Você"). */
const quem = (por: string | undefined) => (por ? por[0]!.toUpperCase() + por.slice(1) : '?');

/** Uma linha da tabela do Clássico: o personagem chutado, as pistas e (online) quem chutou. */
export interface LinhaClassico {
  chave: string;
  it: Entry | null;
  pistas: Pista[] | null;
  certo: boolean;
  por?: string;
}

/** Tabela do Clássico, o chute mais novo em cima. Linha sem personagem = tempo esgotado (online). */
export function TabelaClassico({ grupo, linhas }: { grupo: Grupo; linhas: LinhaClassico[] }) {
  if (!linhas.length) return null;
  const n = grupo.colunas.length + 1;
  return (
    <div className="adv-tabela-wrap">
      <table className="adv-tabela" id="advTabela" style={{ ['--n' as string]: n } as CSSProperties}>
        <thead><tr><th>Personagem</th>{grupo.colunas.map(c => <th key={c.id} data-col={c.id}>{c.rotulo}</th>)}</tr></thead>
        <tbody>
          {linhas.map(l => l.it && l.pistas ? (
            <tr key={l.chave} data-nome={l.it.name} className={l.certo ? 'certo' : undefined}>
              <td className="adv-pers">
                <div className="adv-pers-in">
                  <Miniatura it={l.it} />
                  <span className="txt"><b>{l.it.name}</b>{l.por && <small>{l.por}</small>}</span>
                </div>
              </td>
              {l.pistas.map((p, i) => (
                <td key={i} className={'adv-c ' + p.c} data-cor={p.c} title={explicar(p)}>
                  <span>{p.t}</span>
                  {p.s && <span className="adv-seta" aria-label={p.s === 'cima' ? 'mais' : 'menos'}>{p.s === 'cima' ? '▲' : '▼'}</span>}
                </td>
              ))}
            </tr>
          ) : (
            <tr key={l.chave} className="adv-tempo"><td colSpan={n}>⏱ {quem(l.por)} deixou o tempo acabar</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Legenda das cores do Clássico. */
export function Legenda() {
  return (
    <p className="adv-legenda" id="advLegenda">
      <span className="adv-c certo">igual</span>
      <span className="adv-c parcial">em parte</span>
      <span className="adv-c errado">diferente</span>
      <span>▲▼ o personagem tem mais ou menos</span>
      <span>? sem informação</span>
    </p>
  );
}

/** Chutes errados (Imagem e Emoji), o mais novo primeiro; sem personagem = tempo esgotado. */
export function Errados({ itens }: { itens: { chave: string; it: Entry | null; por?: string }[] }) {
  if (!itens.length) return null;
  return (
    <ul className="adv-errados" id="advErrados" aria-label="Chutes errados">
      {itens.map(x => x.it ? (
        <li key={x.chave} data-nome={x.it.name} data-fr={x.it.fr} style={frStyle(x.it.fr)}>
          <Miniatura it={x.it} /><span>{x.it.name}</span>{x.por && <small>{x.por}</small>}
        </li>
      ) : (
        <li key={x.chave} className="tempo">⏱ {quem(x.por)} deixou o tempo acabar</li>
      ))}
    </ul>
  );
}

/** Emojis: os revelados e um "?" pra cada um que falta. */
export function LinhaEmoji({ emojis, total }: { emojis: readonly string[]; total: number }) {
  return (
    <div className="adv-emoji" id="advEmoji" role="img" aria-label={`${emojis.length} de ${total} emojis: ${emojis.join(' ')}`}>
      {Array.from({ length: Math.max(total, emojis.length) }, (_, i) => (
        i < emojis.length ? <span key={i} className="vis">{emojis[i]}</span> : <span key={i} className="oculto" aria-hidden="true">?</span>
      ))}
    </div>
  );
}

// ---------- imagem com zoom ----------

type Foco = (Ponto & { r: number }) | 'erro';
/** foco já calculado de cada imagem e semente (não recalcula ao voltar pra mesma imagem) */
const focos = new Map<string, Foco>();
const razao = (im: HTMLImageElement) => (im.naturalWidth && im.naturalHeight ? Math.min(2, Math.max(0.5, im.naturalWidth / im.naturalHeight)) : 1);

/**
 * Ponto do zoom e proporção da imagem. Lê os pixels quando o servidor deixa (CORS) pra cair numa parte desenhada;
 * sem isso, o miolo da imagem. Até saber, a imagem não aparece (pra não mostrar a imagem inteira de relance).
 */
function useFoco(img: string, semente: number): Foco | undefined {
  const chave = `${img}|${semente}`;
  const [, redesenhar] = useState(0);
  useEffect(() => {
    if (focos.has(chave)) return;
    let vivo = true;
    const pronto = (f: Foco) => { focos.set(chave, f); if (vivo) redesenhar(x => x + 1); };
    const src = resolveImg(img);
    const cors = new Image();
    cors.crossOrigin = 'anonymous';
    cors.onload = () => {
      let amostra: Amostra | null = null;
      try {
        const c = document.createElement('canvas');
        c.width = 48; c.height = 48;
        const g = c.getContext('2d');
        if (g) { g.drawImage(cors, 0, 0, 48, 48); amostra = { data: g.getImageData(0, 0, 48, 48).data, w: 48, h: 48 }; }
      } catch { /* canvas sujo: sem pixels */ }
      pronto({ ...escolherFoco(amostra, semente), r: razao(cors) });
    };
    cors.onerror = () => {
      // sem CORS: carrega do jeito normal só pra saber a proporção
      const simples = new Image();
      simples.onload = () => pronto({ ...focoNoMiolo(semente), r: razao(simples) });
      simples.onerror = () => pronto('erro');
      simples.src = src;
    };
    cors.src = src;
    return () => { vivo = false; };
  }, [chave, img, semente]);
  return focos.get(chave);
}

/** Imagem do secreto: zoom e desfoque diminuem a cada chute errado; no fim, inteira. */
export function QuadroImagem({ img, semente, erros, fim }: { img: string; semente: number; erros: number; fim: boolean }) {
  const f = useFoco(img, semente);
  const z = zoom(erros, fim);
  if (f === 'erro') return <div className="adv-quadro vazio" id="advImagem">imagem não carregou</div>;
  const estilo = { ['--r' as string]: f ? f.r : 1 } as CSSProperties;
  return (
    <div className={'adv-quadro' + (fim ? ' fim' : '')} id="advImagem" data-nivel={z.nivel} style={estilo}>
      {f
        ? <img src={resolveImg(img)} alt="" draggable={false} style={{
          transformOrigin: `${(f.x * 100).toFixed(1)}% ${(f.y * 100).toFixed(1)}%`,
          transform: `scale(${z.escala})`,
          filter: z.desfoque ? `blur(${(z.desfoque / z.escala).toFixed(2)}px)` : 'none',
        }} />
        : <span className="mute">carregando…</span>}
    </div>
  );
}

/** Painel do personagem revelado. */
export function Revelado({ titulo, children, id }: { titulo: ReactNode; children?: ReactNode; id: string }) {
  return (
    <div className="panel adv-fim" id={id} role="status">
      <h3>{titulo}</h3>
      {children}
    </div>
  );
}
