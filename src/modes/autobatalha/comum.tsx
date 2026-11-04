// Peças da tela da Autobatalha usadas em mais de um lugar: geometria das casas, cores do custo, imagens das formas,
// ícones de item e de rodada, estrelas e o texto "a/b/c" com o número da estrela em destaque.
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { COLUNAS, type Casa, type Componente, type Custo, type Estrela, type FormaDados, type TipoRodada } from '../../autobatalha/tipos';
import { S, urlImagem } from '../../autobatalha/dados';
import { ITENS, ehComponente } from '../../autobatalha/conteudo';

export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// ---------- casas hexagonais (pontudas em cima, linhas ímpares meia casa pra direita, como hex.ts) ----------
export interface Geo { w: number; h: number }
export const geo = (w: number): Geo => ({ w, h: Math.round(w * 1.1547 * 10) / 10 });
/** centro da casa em pixels, a partir do canto de cima à esquerda do tabuleiro */
export const centroCasa = (c: Casa, g: Geo) => ({ x: c.col * g.w + (c.lin & 1 ? g.w / 2 : 0) + g.w / 2, y: c.lin * g.h * 0.75 + g.h / 2 });
export const tamanhoTabuleiro = (linhas: number, g: Geo) => ({ largura: COLUNAS * g.w + g.w / 2, altura: (linhas - 1) * g.h * 0.75 + g.h });

// ---------- custo, formas, traços ----------
export const custoAttr = (c: Custo | number) => ({ 'data-custo': String(c) });
export const imgForma = (id: string) => (S().temForma(id) ? urlImagem(S().forma(id).img) : '');
export const formaOuNada = (id: string): FormaDados | null => (S().temForma(id) ? S().forma(id) : null);
/** classes da forma que são traço de verdade (Únicos não é traço) */
export const NOME_UNICOS = 'Únicos';
export const ehOrigem = (id: string) => ['pokemon', 'digimon', 'smt', 'persona', 'jojo', 'ygo', 'lol', 'overwatch', 'deadlock', 'sujimon'].includes(id);
export const nomeTraco = (id: string) => (id === 'unicos' ? NOME_UNICOS : S().nomeTraco(id));
/** cor do traço pra CSS: a da franquia pras origens */
export const corTraco = (id: string): CSSProperties | undefined => (ehOrigem(id) ? ({ ['--tc' as string]: `var(--${id})` }) : undefined);

/** Retrato redondo (ou quadrado, com `quadrado`), com a imagem cobrindo. Imagem que falha some e fica a inicial. */
export function Foto({ src, nome, className, style }: { src: string; nome: string; className?: string; style?: CSSProperties }) {
  return (
    <span className={'ab-foto' + (className ? ' ' + className : '')} style={style} data-ini={nome.slice(0, 1)}>
      {src ? <img src={src} alt="" draggable={false} decoding="async" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} /> : null}
    </span>
  );
}

export function Estrelas({ n, className }: { n: Estrela | number; className?: string }) {
  return <span className={'ab-estrelas e' + n + (className ? ' ' + className : '')} aria-label={plural(n, 'estrela', 'estrelas')}>{'★'.repeat(n)}</span>;
}

/** Moedinha do ouro. */
export function Moeda() {
  return <span className="ab-moeda" aria-hidden="true" />;
}

// ---------- itens (Bakugan) ----------
export const COR_COMPONENTE: Record<Componente, string> = {
  pyrus: '#e0412f', aquos: '#2b8fe0', haos: '#f0d24a', darkus: '#6a3fa6', subterra: '#b0763a', ventus: '#33b36a', aurelus: '#c9a227',
};
const NOME_COMPONENTE: Record<Componente, string> = {
  pyrus: 'Pyrus', aquos: 'Aquos', haos: 'Haos', darkus: 'Darkus', subterra: 'Subterra', ventus: 'Ventus', aurelus: 'Aurelus',
};
export const nomeItem = (id: string) => ITENS[id]?.nome ?? (ehComponente(id) ? NOME_COMPONENTE[id] : id);
export const textoItem = (id: string) => ITENS[id]?.texto ?? '';
/** os dois componentes de um completo (`${a}+${b}`) ou o próprio componente */
export function partesItem(id: string): Componente[] {
  const it = ITENS[id];
  if (it?.componentes) return [...it.componentes];
  if (ehComponente(id)) return [id];
  return id.split('+').filter(ehComponente);
}
function imgItem(id: string): string {
  const b = ITENS[id]?.bakugan;
  const url = b ? S().dados.bakugan[b] : undefined;
  return url ? urlImagem(url) : '';
}

/** Ícone de item: a imagem do Bakugan (completo), ou um disco da cor do atributo com a inicial. */
export function IconeItem({ id, className }: { id: string; className?: string }) {
  const partes = partesItem(id);
  const cores = partes.map(c => COR_COMPONENTE[c]);
  const fundo = cores.length > 1 ? `linear-gradient(135deg, ${cores[0]} 0 50%, ${cores[1]} 50% 100%)` : cores[0] ?? 'var(--line)';
  const img = imgItem(id);
  const completo = partes.length > 1;
  return (
    <span className={'ab-item' + (completo ? ' completo' : '') + (className ? ' ' + className : '')} style={{ background: fundo }} aria-label={nomeItem(id)}>
      <b>{nomeItem(id).slice(0, 1)}</b>
      {img ? <img src={img} alt="" draggable={false} onError={e => { e.currentTarget.style.visibility = 'hidden'; }} /> : null}
    </span>
  );
}

// ---------- rodadas ----------
const ROTULO_RODADA: Record<TipoRodada, string> = { pvp: 'contra jogador', monstros: 'contra monstros', chefe: 'contra chefe' };
export const rotuloRodada = (t: TipoRodada) => ROTULO_RODADA[t];
/** Ícone simples por tipo de rodada: duas lâminas cruzadas (jogador), garra (monstros), coroa (chefe). */
export function IconeRodada({ tipo }: { tipo: TipoRodada }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" className={'ab-ic-rodada ' + tipo}>
      {tipo === 'pvp' && <path d="M4 3l9 9M3 4l2-1M16 3l-9 9M17 4l-2-1M5 13l2 2M15 13l-2 2M6 16l-2 1M14 16l2 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />}
      {tipo === 'monstros' && <path d="M5 16c0-5 1-9 3-12M10 16c0-5 0-9 0-12M15 16c0-5-1-9-3-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />}
      {tipo === 'chefe' && <path d="M3 15l1-9 4 4 2-6 2 6 4-4 1 9z" fill="currentColor" />}
    </svg>
  );
}

// ---------- texto por estrela ----------
const POR_ESTRELA = /(\d+(?:[.,]\d+)?)(\s*\/\s*)(\d+(?:[.,]\d+)?)(\s*\/\s*)(\d+(?:[.,]\d+)?)/g;
/** "200/300/450%" com o número da estrela atual em destaque (os outros apagados). */
export function TextoPorEstrela({ texto, estrela }: { texto: string; estrela: Estrela }) {
  const partes: ReactNode[] = [];
  let ultimo = 0;
  let k = 0;
  for (const m of texto.matchAll(POR_ESTRELA)) {
    const i = m.index;
    if (i > ultimo) partes.push(texto.slice(ultimo, i));
    const nums = [m[1]!, m[3]!, m[5]!];
    partes.push(
      <span key={k++} className="ab-pe">
        {nums.map((x, j) => (
          <Fragment key={j}>
            {j > 0 && '/'}
            <span className={j + 1 === estrela ? 'on' : undefined}>{x}</span>
          </Fragment>
        ))}
      </span>,
    );
    ultimo = i + m[0].length;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return <>{partes}</>;
}

/** Número curto pra atributo: 0,75 / 1200 / 25% */
export const num = (x: number, casas = 0) => x.toLocaleString('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: 0 });
export const pct = (x: number) => `${num(x * 100)}%`;
