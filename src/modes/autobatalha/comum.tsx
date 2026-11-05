// Peças da tela da Autobatalha usadas em mais de um lugar: geometria das casas, cores do custo, imagens das formas,
// ícones de item e de rodada, estrelas e o texto "a/b/c" com o número da estrela em destaque.
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { COLUNAS, type Casa, type Componente, type Custo, type Estrela, type FormaDados, type Jogador, type TipoRodada, type Unidade } from '../../autobatalha/tipos';
import { S, urlImagem } from '../../autobatalha/dados';
import { ITENS, ehComponente } from '../../autobatalha/conteudo';
import { estiloOuPadrao } from '../../autobatalha/estilos';

export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// ---------- casas hexagonais (pontudas em cima, linhas ímpares meia casa pra direita, como hex.ts) ----------
export interface Geo { w: number; h: number }
/** altura da casa / largura: 1 (o hexágono regular seria 1,1547) achata um pouco o tabuleiro, como uma câmera
 *  inclinada, e deixa as casas maiores na mesma altura */
export const RAZAO_CASA = 1;
/** na luta (8 linhas na mesma altura) o tabuleiro achata mais, pra as casas não ficarem pequenas */
export const RAZAO_LUTA = 0.8;
export const geo = (w: number, razao = RAZAO_CASA): Geo => ({ w, h: Math.round(w * razao * 10) / 10 });
/** maior largura de casa que cabe em largura × altura com `linhas` linhas (8,5 casas de largura: as ímpares deslocadas) */
export function casaQueCabe(largura: number, altura: number, linhas: number, razao = RAZAO_CASA): number {
  const porAltura = altura / (((linhas - 1) * 0.75 + 1) * razao);
  return Math.max(24, Math.floor(Math.min(largura / (COLUNAS + 0.5), porAltura)));
}
/** centro da casa em pixels, a partir do canto de cima à esquerda do tabuleiro */
export const centroCasa = (c: Casa, g: Geo) => ({ x: c.col * g.w + (c.lin & 1 ? g.w / 2 : 0) + g.w / 2, y: c.lin * g.h * 0.75 + g.h / 2 });
export const tamanhoTabuleiro = (linhas: number, g: Geo) => ({ largura: COLUNAS * g.w + g.w / 2, altura: (linhas - 1) * g.h * 0.75 + g.h });

// ---------- custo, formas, traços ----------
export const custoAttr = (c: Custo | number) => ({ 'data-custo': String(c) });
export const imgForma = (id: string) => (S().temForma(id) ? urlImagem(S().forma(id).img) : '');
export const formaOuNada = (id: string): FormaDados | null => (S().temForma(id) ? S().forma(id) : null);
/** imagem do avatar do jogador (uma forma do set ou um caminho) */
export const avatarDe = (j: Pick<Jogador, 'avatar'>) => (formaOuNada(j.avatar) ? imgForma(j.avatar) : j.avatar ? urlImagem(j.avatar) : '');
/** id do estilo do tabuleiro do jogador (pro data-estilo do CSS); partida salva antes dos estilos = o padrão */
export const estiloDe = (j: Pick<Jogador, 'estilo'> | null | undefined): string => estiloOuPadrao(j?.estilo);
/** classes da forma que são traço de verdade (Únicos não é traço) */
export const NOME_UNICOS = 'Únicos';
export const ehOrigem = (id: string) => ['pokemon', 'digimon', 'smt', 'persona', 'jojo', 'ygo', 'lol', 'overwatch', 'deadlock', 'sujimon'].includes(id);
export const nomeTraco = (id: string) => (id === 'unicos' ? NOME_UNICOS : S().nomeTraco(id));
/** nome com mais letras que isto é comprido: na carta da loja vai pro fim das etiquetas e pode virar o curto */
export const LETRAS_NOME_COMPRIDO = 12;
/** Nome curto do traço, pra etiqueta apertada: nome comprido de mais de uma palavra abrevia a primeira em 5 letras
 *  ("Criaturinha Bizarra" → "Criat. Bizarra"); o resto fica igual. */
export function nomeCurtoTraco(id: string): string {
  const nome = nomeTraco(id);
  const [primeira, ...resto] = nome.split(' ');
  if (nome.length <= LETRAS_NOME_COMPRIDO || !resto.length || !primeira || primeira.length <= 6) return nome;
  return `${primeira.slice(0, 5)}. ${resto.join(' ')}`;
}
/** Cor própria de cada classe e elemento (as origens usam a cor da franquia, a mesma do resto do site). */
const COR_TRACO: Record<string, string> = {
  tanque: '#8394a8', porradeiro: '#d26a2c', assassino: '#8e44c9', demoniacos: '#b02a43', 'criaturinha-bizarra': '#9bb32a',
  fadinhas: '#ea7fc8', safada: '#e0447a', atirador: '#c9a03a', anjo: '#e4c55a', robo: '#3f9bb8', dragao: '#c43b2c',
  temporais: '#6a6ce6', fogo: '#ff7022', agua: '#2e8cf0', terra: '#a77a42', vento: '#4ccfa0', raio: '#f0c419',
  gelo: '#7ad3f2', planta: '#4caf3e',
};
/** cor do traço (valor CSS): a da franquia pras origens, a própria pras classes e elementos */
export const corDoTraco = (id: string): string => (ehOrigem(id) ? `var(--${id})` : COR_TRACO[id] ?? 'var(--mute)');
/** cor do traço pra CSS (`--tc`) */
export const corTraco = (id: string): CSSProperties => ({ ['--tc' as string]: corDoTraco(id) });

/** Forma do degrau ativo: bronze, prata, ouro e prisma (o último degrau das escadas longas). null = inativo. */
export type ClasseDegrau = 'bronze' | 'prata' | 'ouro' | 'prisma';
export function classeDegrau(nivel: number, total: number): ClasseDegrau | null {
  if (nivel < 0 || total <= 0) return null;
  if (nivel >= total - 1) return total >= 4 ? 'prisma' : 'ouro';
  const a = total > 1 ? nivel / (total - 1) : 1;
  return a < 0.34 ? 'bronze' : a < 0.67 ? 'prata' : 'ouro';
}

/** Hexágono do traço: borda na forma do degrau (bronze, prata, ouro, prisma; cinza se inativo), miolo na cor do traço
 *  e a contagem no meio. */
export function MarcaDegrau({ id, n, nivel, total, className }: { id: string; n: number | string; nivel: number; total: number; className?: string }) {
  const c = classeDegrau(nivel, total);
  return (
    <span className={'ab-marca-dg ' + (c ?? 'inativo') + (className ? ' ' + className : '')} style={corTraco(id)}>
      <b>{n}</b>
    </span>
  );
}

/** Ícone do alcance: espada (corpo a corpo, alcance 1) ou arco (de longe, 2 ou mais). */
export function IconeAlcance({ alcance, className }: { alcance: number; className?: string }) {
  const longe = alcance > 1;
  return (
    <span className={'ab-alcance' + (longe ? ' longe' : ' perto') + (className ? ' ' + className : '')}
      title={longe ? `Ataca de longe (${alcance} casas)` : 'Ataca de perto (corpo a corpo)'} aria-label={longe ? `de longe, ${alcance} casas` : 'corpo a corpo'}>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        {longe
          ? <path d="M5 2.5c4.5.8 7.7 4 8.5 8.5M5 2.5L3 13l10.5-2M3 13L12.5 3.5M10 3.5h2.5V6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M13.5 2.5l-.6 3L6.4 12 4 9.6l6.5-6.5zM3.2 10.4l2.4 2.4M2.3 13.7l1.8-1.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </span>
  );
}

/** Posição de uma carta de Yu-Gi-Oh! */
export type Posicao = NonNullable<Unidade['posicao']>;
/** O que a posição faz, em uma linha (a dica de passar o mouse). */
export const EFEITO_POSICAO: Record<Posicao, string> = {
  ataque: 'Ataque: mais dano com o traço ativo.',
  defesa: 'Defesa: mais vida e armadura, e provoca em volta.',
};

/** Selo da posição: espada em ataque, escudo em defesa. Com `aoTrocar` é um botão (a peça é sua, no planejamento), que
 *  não arrasta a peça nem mexe na dica; sem, só mostra. */
export function SeloPosicao({ posicao, aoTrocar }: { posicao: Posicao; aoTrocar?: () => void }) {
  const nome = posicao === 'defesa' ? 'Em defesa' : 'Em ataque';
  const classe = `ab-selo-posicao ${posicao}`;
  const icone = (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {posicao === 'defesa'
        ? <path d="M8 1.2l5.3 1.9v4.4c0 3.4-2.2 5.9-5.3 7.3-3.1-1.4-5.3-3.9-5.3-7.3V3.1z" fill="currentColor" />
        : <path d="M8 .8l1.7 2.1v6.2H6.3V2.9zM4.3 9.9h7.4v1.6H9v1.7l1 1.9H6l1-1.9v-1.7H4.3z" fill="currentColor" />}
    </svg>
  );
  if (!aoTrocar) return <span className={classe} data-posicao={posicao} role="img" title={nome} aria-label={nome}>{icone}</span>;
  const texto = `${nome}. Clique pra mudar pra ${posicao === 'defesa' ? 'ataque' : 'defesa'}`;
  return (
    <button type="button" className={classe} data-posicao={posicao} title={texto} aria-label={texto}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => { e.stopPropagation(); aoTrocar(); }}>
      {icone}
    </button>
  );
}

/** Retrato redondo (ou quadrado), com a imagem inteira (contain, sem cortar) sobre o fundo. Imagem que falha some e
 *  fica a inicial. */
export function Foto({ src, nome, className, style, preguicosa }: {
  src: string;
  nome: string;
  className?: string;
  style?: CSSProperties;
  /** só baixa a imagem quando ela chega perto da tela (grades grandes) */
  preguicosa?: boolean;
}) {
  return (
    <span className={'ab-foto' + (className ? ' ' + className : '')} style={style} data-ini={nome.slice(0, 1)}>
      {src ? <img src={src} alt="" draggable={false} decoding="async" loading={preguicosa ? 'lazy' : undefined}
        onError={e => { e.currentTarget.style.visibility = 'hidden'; }} /> : null}
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
/** Imagem do item: o Bakugan (completo) ou o símbolo do atributo (componente), de SetDados.bakugan. */
export function imgItem(id: string): string {
  const it = ITENS[id];
  const chave = it?.bakugan ?? (ehComponente(id) ? it?.nome ?? NOME_COMPONENTE[id] : undefined);
  const url = chave ? S().dados.bakugan[chave] : undefined;
  return url ? urlImagem(url) : '';
}

/** Ícone de item: componente = o símbolo do atributo num disco da cor dele; completo = a imagem do Bakugan inteira
 *  (sem cortar) num quadradinho com a borda nas cores dos dois componentes. Sem imagem fica a inicial. */
export function IconeItem({ id, className }: { id: string; className?: string }) {
  const partes = partesItem(id);
  const cores = partes.map(c => COR_COMPONENTE[c]);
  const fundo = cores.length > 1 ? `linear-gradient(135deg, ${cores[0]} 0 50%, ${cores[1]} 50% 100%)` : cores[0] ?? 'var(--line)';
  const img = imgItem(id);
  const completo = partes.length > 1;
  return (
    <span className={'ab-item' + (completo ? ' completo' : ' componente') + (className ? ' ' + className : '')}
      style={{ background: fundo, ['--ic' as string]: cores[0] ?? 'var(--line)' }} aria-label={nomeItem(id)}>
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
