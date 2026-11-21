// Aba Adivinha, sozinho: franquia, submodo, "do dia" ou "livre", o jogo da vez de cada combinação e os chutes.
// O desafio do dia (e as estatísticas) fica em pdx-adivinha-v1; o livre fica só na memória (sobrevive à troca de
// aba, não à recarga). Toda mudança avisa quem assinou (useSyncExternalStore).
import { useSyncExternalStore } from 'react';
import { readJSON, writeJSON } from '../core/storage';
import { shuffle } from '../core/random';
import { GRUPO_PADRAO, grupoDe, type Submodo } from './grupos';
import { indiceDoDia, sementeDoDia } from './dia';
import { ADIVINHA_KEY, chaveDe, desafioDeHoje, lerSalvo, registrarChute, type Rodada, type Salvo } from './placar';
import { acharNoPool, type AdvItem } from './pool';

export interface JogoSolo {
  /** 'dia:lol:classico' ou 'livre:lol:classico' */
  id: string;
  alvo: AdvItem;
  /** nomes chutados, na ordem */
  chutes: string[];
  fim: 'acertou' | 'desistiu' | null;
  /** de 0 a 1: ponto do zoom da Imagem */
  semente: number;
  /** data do desafio (só no "do dia") */
  data: string | null;
}

let ver = 0;
const subs = new Set<() => void>();
function mudou() {
  ver++;
  for (const fn of Array.from(subs)) fn();
}
const assinar = (fn: () => void) => {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
};
export function useSolo() {
  useSyncExternalStore(assinar, () => ver);
  return solo;
}

let salvo: Salvo | null = null;
const tudo = (): Salvo => (salvo ??= lerSalvo(readJSON(ADIVINHA_KEY)));
function gravar(s: Salvo) {
  salvo = s;
  writeJSON(ADIVINHA_KEY, s);
}
/** O que está salvo (estatísticas e desafios). */
export const salvoAtual = (): Salvo => tudo();

const cfg = tudo().cfg;
/** O que a tela está mostrando. */
export const solo = {
  grupo: cfg?.grupo ?? GRUPO_PADRAO,
  submodo: (cfg?.submodo ?? 'classico') as Submodo,
  rodada: (cfg?.rodada ?? 'dia') as Rodada,
};

/** Troca franquia, submodo ou rodada (e lembra da escolha). */
export function escolher(p: Partial<typeof solo>): void {
  if (p.grupo !== undefined && !grupoDe(p.grupo)) return;
  Object.assign(solo, p);
  gravar({ ...tudo(), cfg: { ...solo } });
  mudou();
}

const jogos = new Map<string, JogoSolo>();
/** saco de sorteio do livre, por franquia e submodo (só na memória) */
const sacos = new Map<string, string[]>();
/** acertos e chutes do livre nesta sessão, por franquia e submodo */
const sessao = new Map<string, { acertos: number; chutes: number }>();
export const sessaoLivre = (grupo: string, sub: Submodo) => sessao.get(chaveDe(grupo, sub)) ?? { acertos: 0, chutes: 0 };

const noPool = (pool: readonly AdvItem[], nome: string) => pool.find(x => x.name === nome);

function novoLivre(id: string, chave: string, pool: readonly AdvItem[], antes: string | null): JogoSolo {
  const nomes = new Set(pool.map(x => x.name));
  let saco = (sacos.get(chave) ?? []).filter(n => nomes.has(n));
  if (!saco.length) {
    saco = shuffle([...nomes]);
    // saco novo: o primeiro a sair não repete o que acabou de ser jogado
    if (saco.length > 1 && saco[saco.length - 1] === antes) [saco[0], saco[saco.length - 1]] = [saco[saco.length - 1] as string, saco[0] as string];
  }
  const alvo = noPool(pool, saco.pop() as string) as AdvItem;
  sacos.set(chave, saco);
  const j: JogoSolo = { id, alvo, chutes: [], fim: null, semente: Math.random(), data: null };
  jogos.set(id, j);
  return j;
}

/**
 * O jogo da combinação escolhida (cria na primeira vez). Do dia: o personagem do índice do dia na lista ordenada
 * por nome, com os chutes já salvos hoje (`hoje` = data em Brasília; muda à meia-noite). Livre: um sorteado do saco.
 */
export function jogoAtual(pool: readonly AdvItem[], hoje: string): JogoSolo | null {
  if (!pool.length) return null;
  const chave = chaveDe(solo.grupo, solo.submodo);
  if (solo.rodada === 'livre') {
    const id = `livre:${chave}`;
    const j = jogos.get(id);
    return j && noPool(pool, j.alvo.name) ? j : novoLivre(id, chave, pool, j?.alvo.name ?? null);
  }
  const id = `dia:${chave}`;
  const j = jogos.get(id);
  if (j && j.data === hoje && noPool(pool, j.alvo.name)) return j;
  // o salvo de hoje vale enquanto o personagem estiver na lista (ela pode mudar no meio do dia: emoji novo, campeão novo)
  const d = desafioDeHoje(tudo(), chave, hoje);
  const salvoOk = d ? noPool(pool, d.alvo) : undefined;
  const alvo = salvoOk ?? (pool[indiceDoDia(hoje, solo.grupo, solo.submodo, pool.length)] as AdvItem);
  const novo: JogoSolo = {
    id, alvo, data: hoje,
    chutes: d && salvoOk ? d.chutes.filter(n => noPool(pool, n)) : [],
    fim: d && salvoOk && d.acertou ? 'acertou' : null,
    semente: sementeDoDia(hoje, solo.grupo, solo.submodo, 'foco'),
  };
  jogos.set(id, novo);
  return novo;
}

/** Chuta um nome (do pool, sem repetir). Acertou: fecha o jogo e, no do dia, soma nas estatísticas. */
export function chutar(pool: readonly AdvItem[], nome: string, hoje: string): void {
  const j = jogoAtual(pool, hoje);
  const it = acharNoPool(pool, nome);
  if (!j || j.fim || !it || j.chutes.includes(it.name)) return;
  const certo = it.name === j.alvo.name;
  j.chutes = [...j.chutes, it.name];
  if (certo) j.fim = 'acertou';
  const chave = chaveDe(solo.grupo, solo.submodo);
  if (j.data) gravar(registrarChute(tudo(), chave, j.data, j.alvo.name, it.name, certo));
  else if (certo) {
    const s = sessaoLivre(solo.grupo, solo.submodo);
    sessao.set(chave, { acertos: s.acertos + 1, chutes: s.chutes + j.chutes.length });
  }
  mudou();
}

/** Livre: mostra quem era. */
export function desistir(pool: readonly AdvItem[], hoje: string): void {
  const j = jogoAtual(pool, hoje);
  if (!j || j.fim || j.data) return;
  j.fim = 'desistiu';
  mudou();
}

/** Livre: próximo personagem. */
export function proximo(pool: readonly AdvItem[]): void {
  if (solo.rodada !== 'livre' || !pool.length) return;
  const chave = chaveDe(solo.grupo, solo.submodo), id = `livre:${chave}`;
  novoLivre(id, chave, pool, jogos.get(id)?.alvo.name ?? null);
  mudou();
}

/** Esquece tudo o que está na memória (testes). */
export function reiniciarSolo(): void {
  salvo = null;
  jogos.clear();
  sacos.clear();
  sessao.clear();
  const c = tudo().cfg;
  Object.assign(solo, { grupo: c?.grupo ?? GRUPO_PADRAO, submodo: c?.submodo ?? 'classico', rodada: c?.rodada ?? 'dia' });
  mudou();
}
