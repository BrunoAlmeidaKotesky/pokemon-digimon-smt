// Estado de interação da tela da Autobatalha, fora do React pra não redesenhar o jogo a cada movimento do mouse:
// a dica (tooltip) aberta e o arrasto em andamento (pointer events, sem biblioteca).
import { useSyncExternalStore, type MouseEvent as MouseReact, type PointerEvent as PointerReact } from 'react';
import type { Custo, Estrela } from '../../autobatalha/tipos';

function loja<T>(inicial: T) {
  let v = inicial;
  const ouvintes = new Set<() => void>();
  return {
    get: () => v,
    set(x: T) { v = x; ouvintes.forEach(f => f()); },
    assinar(f: () => void) { ouvintes.add(f); return () => { ouvintes.delete(f); }; },
  };
}

// ---------- dica ----------
export type AlvoDica =
  /** unidade de um jogador (tabuleiro ou banco); editavel = é sua e dá pra escolher ult e posição */
  | { tipo: 'unidade'; dono: string; uid: number; editavel: boolean }
  /** carta da loja, retrato do planejador ou opção do carrossel: o campeão na estrela 1 (ou na pedida); `item` = o que
   *  ele segura no carrossel; `etiqueta` = a marca no topo (padrão: "na loja: estrela 1") */
  | { tipo: 'campeao'; campeao: string; forma: string; estrela?: Estrela; item?: string; etiqueta?: string }
  /** lutador na luta (id da gravação) */
  | { tipo: 'lutador'; id: string }
  | { tipo: 'traco'; id: string; n: number; nivel: number }
  | { tipo: 'item'; id: string };

/**
 * Passar o mouse mostra a dica sem pegar o mouse (não tampa o retrato vizinho). Clicar numa unidade sua fixa a dica
 * (`fixa`): aí dá pra clicar nela (escolher a ult, a posição) e ela só fecha com clique fora ou Esc.
 */
export interface EstadoDica { alvo: AlvoDica; el: HTMLElement; fixa: boolean }
const dica = loja<EstadoDica | null>(null);
let fechar: ReturnType<typeof setTimeout> | null = null;
const cancelarFechar = () => { if (fechar) clearTimeout(fechar); fechar = null; };
/** o retrato debaixo do mouse agora (o atalho E vende a unidade daqui, mesmo com outra dica fixa) */
let sob: AlvoDica | null = null;

export function abrirDica(alvo: AlvoDica, el: HTMLElement, fixa = false): void {
  if (arrasto.get()) return;
  if (dica.get()?.fixa && !fixa) return;
  cancelarFechar();
  dica.set({ alvo, el, fixa });
}
/** fecha a dica de passar o mouse (a fixa só com `forcar`) */
export function fecharDica(atraso = 60, forcar = false): void {
  if (dica.get()?.fixa && !forcar) return;
  cancelarFechar();
  if (atraso <= 0) { dica.set(null); return; }
  fechar = setTimeout(() => { fechar = null; if (!dica.get()?.fixa) dica.set(null); }, atraso);
}
export const useDica = () => useSyncExternalStore(dica.assinar, dica.get);
export const dicaAtual = () => dica.get();
export const alvoSobMouse = () => sob;

/** onPointerEnter/onPointerLeave pra pôr num retrato; o botão direito deixa a dica fixa (o esquerdo continua
 *  comprando, arrastando ou pegando) */
export function propsDica(alvo: AlvoDica) {
  return {
    onPointerEnter: (e: PointerReact<HTMLElement>) => {
      sob = alvo;
      if (e.pointerType !== 'touch') abrirDica(alvo, e.currentTarget);
    },
    onPointerLeave: () => {
      if (sob === alvo) sob = null;
      fecharDica();
    },
    onContextMenu: (e: MouseReact<HTMLElement>) => {
      e.preventDefault();
      abrirDica(alvo, e.currentTarget, true);
    },
  };
}

// ---------- traço em foco (passar o mouse num traço destaca as unidades dele) ----------
const foco = loja<string | null>(null);
export const useTracoEmFoco = () => useSyncExternalStore(foco.assinar, foco.get);
export const focarTraco = (id: string | null) => { if (foco.get() !== id) foco.set(id); };

// ---------- imagem grande (clicar na foto da dica fixa) ----------
export interface ImagemGrande { src: string; nome: string }
const imagem = loja<ImagemGrande | null>(null);
export const useImagemGrande = () => useSyncExternalStore(imagem.assinar, imagem.get);
export const abrirImagem = (x: ImagemGrande | null) => imagem.set(x);

// ---------- arrastar ----------
export type Carga =
  /** `venda` = valor de venda (aparece no que segue o mouse) */
  | { tipo: 'unidade'; uid: number; img: string; custo: Custo; nome: string; venda?: number }
  | { tipo: 'item'; i: number; id: string };

const arrasto = loja<Carga | null>(null);
export const useArrasto = () => useSyncExternalStore(arrasto.assinar, arrasto.get);

let fantasma: HTMLElement | null = null;
let pos = { x: 0, y: 0 };
let sobre: HTMLElement | null = null;
const moverFantasma = () => { if (fantasma) fantasma.style.transform = `translate(${pos.x}px, ${pos.y}px)`; };
/** ref do elemento que segue o mouse */
export function registrarFantasma(el: HTMLElement | null): void {
  fantasma = el;
  moverFantasma();
}

/** alvo de soltar debaixo do ponto (o elemento com data-solta) */
export function alvoEm(x: number, y: number): HTMLElement | null {
  return document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-solta]') ?? null;
}
function marcar(el: HTMLElement | null) {
  if (el === sobre) return;
  sobre?.classList.remove('ab-sobre');
  sobre = el;
  sobre?.classList.add('ab-sobre');
}

/**
 * Começa um possível arrasto no pointerdown: só vira arrasto depois de mexer 5 px (antes disso é clique, e chama
 * `aoClicar`). Ao soltar, chama `soltar` com a carga e o alvo (elemento com data-solta) debaixo do ponteiro.
 */
export function iniciarArrasto(e: PointerReact<HTMLElement>, carga: Carga, soltar: (c: Carga, alvo: HTMLElement | null) => void, aoClicar?: () => void): void {
  if (e.button !== 0 || arrasto.get()) return;
  const x0 = e.clientX, y0 = e.clientY, id = e.pointerId;
  let comecou = false;
  const mover = (ev: PointerEvent) => {
    if (ev.pointerId !== id) return;
    pos = { x: ev.clientX, y: ev.clientY };
    if (!comecou) {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
      comecou = true;
      fecharDica(0, true);
      arrasto.set(carga);
      document.body.classList.add('ab-arrastando');
    }
    ev.preventDefault();
    moverFantasma();
    marcar(alvoEm(ev.clientX, ev.clientY));
  };
  const fim = (ev: PointerEvent, cancelou: boolean) => {
    if (ev.pointerId !== id) return;
    window.removeEventListener('pointermove', mover);
    window.removeEventListener('pointerup', solto);
    window.removeEventListener('pointercancel', cancela);
    if (!comecou) { if (!cancelou) aoClicar?.(); return; }
    const alvo = cancelou ? null : alvoEm(ev.clientX, ev.clientY);
    marcar(null);
    document.body.classList.remove('ab-arrastando');
    arrasto.set(null);
    if (!cancelou) soltar(carga, alvo);
  };
  const solto = (ev: PointerEvent) => fim(ev, false);
  const cancela = (ev: PointerEvent) => fim(ev, true);
  window.addEventListener('pointermove', mover, { passive: false });
  window.addEventListener('pointerup', solto);
  window.addEventListener('pointercancel', cancela);
}
