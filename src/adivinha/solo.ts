// Aba Adivinha, sozinho. Três jeitos de jogar:
//   dia:   o percurso do dia da franquia (Clássico → Imagem → Blur → Emoji, só as etapas ligadas), o mesmo personagem
//          pra todo mundo em cada etapa; a seguinte só abre depois de resolver a anterior.
//   livre: um submodo solto, um personagem atrás do outro;
//   todos: (livre) o ciclo das etapas ligadas, um personagem por etapa, recomeçando no fim.
// O dia (e as estatísticas) fica em pdx-adivinha-v1; o livre fica só na memória (sobrevive à troca de aba, não à
// recarga). Toda mudança avisa quem assinou (useSyncExternalStore).
import { useSyncExternalStore } from 'react';
import { readJSON, writeJSON } from '../core/storage';
import { shuffle } from '../core/random';
import { ETAPAS, GRUPO_PADRAO, GRUPOS, grupoDe, type Submodo } from './grupos';
import { indiceDoDia, sementeDoDia } from './dia';
import { alternar, etapaSeguinte, etapasDoPercurso, liberada, percursoDoDia, proximaFranquia, type Percurso } from './percurso';
import { ADIVINHA_KEY, chaveDe, desafioDeHoje, lerSalvo, registrarChute, registrarPercurso, type Escolha, type Rodada, type Salvo } from './placar';
import { acharNoPool, type AdvItem } from './pool';
import { limparRecorte } from './recorte';

export interface JogoSolo {
  /** 'dia:lol:classico', 'livre:lol:imagem' ou 'todos:lol:blur' */
  id: string;
  alvo: AdvItem;
  /** nomes chutados, na ordem */
  chutes: string[];
  fim: 'acertou' | 'desistiu' | null;
  /** de 0 a 1: ponto do recorte (Imagem) ou do zoom (Blur) */
  semente: number;
  /** data do desafio (só no do dia) */
  data: string | null;
  /** ciclo do "Todos" em que o jogo foi sorteado */
  ciclo?: number;
}
/** Pools da franquia escolhida, por submodo (vazio = sem dados: sem catálogo, ou o Emoji sem arquivo). */
export type Pools = Record<Submodo, readonly AdvItem[]>;
export type Modo = 'dia' | 'livre' | 'todos';
/** O que a tela mostra agora. */
export interface Tela {
  modo: Modo;
  sub: Submodo;
  jogo: JogoSolo;
  /** etapas do percurso (dia) ou do ciclo (todos); no livre solto, só o submodo */
  etapas: Submodo[];
  /** só no dia */
  percurso: Percurso | null;
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
/** O que está salvo (estatísticas, desafios e etapas ligadas). */
export const salvoAtual = (): Salvo => tudo();

const inicial = () => {
  const s = tudo();
  return { grupo: s.cfg?.grupo ?? GRUPO_PADRAO, submodo: (s.cfg?.submodo ?? 'classico') as Escolha, rodada: (s.cfg?.rodada ?? 'dia') as Rodada, etapas: s.etapas };
};
/** O que a tela está mostrando; `submodo` vale no livre ('todos' = o ciclo). */
export const solo = inicial();

const guardarCfg = () => gravar({ ...tudo(), cfg: { grupo: solo.grupo, submodo: solo.submodo, rodada: solo.rodada } });

/** Troca franquia, submodo do livre ou rodada (e lembra da escolha). */
export function escolher(p: Partial<Pick<typeof solo, 'grupo' | 'submodo' | 'rodada'>>): void {
  if (p.grupo !== undefined && !grupoDe(p.grupo)) return;
  Object.assign(solo, p);
  guardarCfg();
  mudou();
}

const jogos = new Map<string, JogoSolo>();
/** saco de sorteio do livre, por franquia e submodo (só na memória) */
const sacos = new Map<string, string[]>();
/** acertos e chutes do livre nesta sessão, por franquia e submodo (ou "todos") */
const sessao = new Map<string, { acertos: number; chutes: number }>();
export const sessaoLivre = (grupo: string, esc: Escolha) => sessao.get(`${grupo}:${esc}`) ?? { acertos: 0, chutes: 0 };
/** dia: etapa que a tela mostra, por franquia (a resolvida fica na tela até "Próxima etapa") */
const vista = new Map<string, Submodo>();
/** todos: etapa e ciclo de cada franquia */
const todos = new Map<string, { etapa: Submodo; ciclo: number }>();

const noPool = (pool: readonly AdvItem[], nome: string) => pool.find(x => x.name === nome);
export const comDados = (pools: Pools): Submodo[] => ETAPAS.filter(e => pools[e].length > 0);

function sortear(chave: string, pool: readonly AdvItem[], antes: string | null): AdvItem {
  const nomes = new Set(pool.map(x => x.name));
  let saco = (sacos.get(chave) ?? []).filter(n => nomes.has(n));
  if (!saco.length) {
    saco = shuffle([...nomes]);
    // saco novo: o primeiro a sair não repete o que acabou de ser jogado
    if (saco.length > 1 && saco[saco.length - 1] === antes) [saco[0], saco[saco.length - 1]] = [saco[saco.length - 1] as string, saco[0] as string];
  }
  const alvo = noPool(pool, saco.pop() as string) as AdvItem;
  sacos.set(chave, saco);
  return alvo;
}
function novoLivre(id: string, sub: Submodo, pool: readonly AdvItem[], ciclo?: number): JogoSolo {
  const j: JogoSolo = { id, alvo: sortear(chaveDe(solo.grupo, sub), pool, jogos.get(id)?.alvo.name ?? null), chutes: [], fim: null, semente: Math.random(), data: null, ...(ciclo ? { ciclo } : {}) };
  jogos.set(id, j);
  return j;
}

/** Desafio do dia da etapa: o personagem do índice do dia na lista ordenada (ou o já salvo hoje), com os chutes. */
function jogoDia(pool: readonly AdvItem[], hoje: string, sub: Submodo): JogoSolo {
  const id = `dia:${chaveDe(solo.grupo, sub)}`;
  const j = jogos.get(id);
  if (j && j.data === hoje && noPool(pool, j.alvo.name)) return j;
  // o salvo de hoje vale enquanto o personagem estiver na lista (ela pode mudar no meio do dia: emoji novo, campeão novo)
  const d = desafioDeHoje(tudo(), chaveDe(solo.grupo, sub), hoje);
  const salvoOk = d ? noPool(pool, d.alvo) : undefined;
  const novo: JogoSolo = {
    id, data: hoje,
    alvo: salvoOk ?? (pool[indiceDoDia(hoje, solo.grupo, sub, pool.length)] as AdvItem),
    chutes: d && salvoOk ? d.chutes.filter(n => noPool(pool, n)) : [],
    fim: d && salvoOk && d.acertou ? 'acertou' : null,
    semente: sementeDoDia(hoje, solo.grupo, sub, 'foco'),
  };
  jogos.set(id, novo);
  return novo;
}

/** Percurso de hoje da franquia escolhida (etapas ligadas e com dados). */
export function percursoAtual(pools: Pools, hoje: string): Percurso {
  return percursoDoDia(tudo(), solo.grupo, hoje, etapasDoPercurso(solo.etapas, comDados(pools)));
}

/**
 * O que mostrar agora (cria o jogo na primeira vez). null = nada pra jogar (sem dados, ou o submodo solto do
 * livre sem personagens, como o Emoji sem arquivo).
 */
export function tela(pools: Pools, hoje: string): Tela | null {
  if (solo.rodada === 'dia') {
    const etapas = etapasDoPercurso(solo.etapas, comDados(pools));
    if (!etapas.length) return null;
    const p = percursoDoDia(tudo(), solo.grupo, hoje, etapas);
    const v = vista.get(solo.grupo);
    const sub = v && liberada(p, v) ? v : (p.atual ?? (etapas[etapas.length - 1] as Submodo));
    return { modo: 'dia', sub, jogo: jogoDia(pools[sub], hoje, sub), etapas, percurso: p };
  }
  if (solo.submodo === 'todos') {
    const etapas = etapasDoPercurso(solo.etapas, comDados(pools));
    if (!etapas.length) return null;
    const st = todos.get(solo.grupo) ?? { etapa: etapas[0] as Submodo, ciclo: 1 };
    // etapa desligada (ou sem dados): vai pra próxima ligada; sem nenhuma depois, recomeça o ciclo
    if (!etapas.includes(st.etapa)) {
      const depois = etapas.find(e => ETAPAS.indexOf(e) > ETAPAS.indexOf(st.etapa));
      Object.assign(st, depois ? { etapa: depois } : { etapa: etapas[0], ciclo: st.ciclo + 1 });
    }
    todos.set(solo.grupo, st);
    const id = `todos:${chaveDe(solo.grupo, st.etapa)}`, pool = pools[st.etapa];
    const j = jogos.get(id);
    const jogo = j && j.ciclo === st.ciclo && noPool(pool, j.alvo.name) ? j : novoLivre(id, st.etapa, pool, st.ciclo);
    return { modo: 'todos', sub: st.etapa, jogo, etapas, percurso: null };
  }
  const sub = solo.submodo, pool = pools[sub];
  if (!pool.length) return null;
  const id = `livre:${chaveDe(solo.grupo, sub)}`;
  const j = jogos.get(id);
  return { modo: 'livre', sub, jogo: j && noPool(pool, j.alvo.name) ? j : novoLivre(id, sub, pool), etapas: [sub], percurso: null };
}

/** Dia: se o percurso de hoje terminou (com as etapas ligadas), conta o dia na estatística do percurso. */
function conferirPercurso(pools: Pools, hoje: string) {
  const p = percursoAtual(pools, hoje);
  if (p.completo) gravar(registrarPercurso(tudo(), solo.grupo, hoje, p.chutes));
}

/** Chuta um nome (do pool, sem repetir). Acertou: fecha o jogo; no dia, soma na etapa e, no fim, no percurso. */
export function chutar(pools: Pools, nome: string, hoje: string): void {
  const t = tela(pools, hoje);
  if (!t) return;
  const j = t.jogo, it = acharNoPool(pools[t.sub], nome);
  if (j.fim || !it || j.chutes.includes(it.name)) return;
  const certo = it.name === j.alvo.name;
  j.chutes = [...j.chutes, it.name];
  if (certo) j.fim = 'acertou';
  if (t.modo === 'dia' && j.data) {
    gravar(registrarChute(tudo(), chaveDe(solo.grupo, t.sub), j.data, j.alvo.name, it.name, certo));
    if (certo) {
      // a etapa resolvida fica na tela (com o botão da próxima)
      vista.set(solo.grupo, t.sub);
      conferirPercurso(pools, j.data);
    }
  } else if (certo) {
    const k = `${solo.grupo}:${t.modo === 'todos' ? 'todos' : t.sub}`, s = sessao.get(k) ?? { acertos: 0, chutes: 0 };
    sessao.set(k, { acertos: s.acertos + 1, chutes: s.chutes + j.chutes.length });
  }
  mudou();
}

/** Livre e Todos: mostra quem era. */
export function desistir(pools: Pools, hoje: string): void {
  const t = tela(pools, hoje);
  if (!t || t.modo === 'dia' || t.jogo.fim) return;
  t.jogo.fim = 'desistiu';
  mudou();
}

/** Livre solto: próximo personagem do mesmo submodo. */
export function proximo(pools: Pools, hoje: string): void {
  const t = tela(pools, hoje);
  if (!t || t.modo !== 'livre') return;
  novoLivre(t.jogo.id, t.sub, pools[t.sub]);
  mudou();
}

/** Dia: abre uma etapa já resolvida ou a da vez (as outras continuam trancadas). */
export function verEtapa(pools: Pools, hoje: string, sub: Submodo): void {
  if (solo.rodada !== 'dia' || !liberada(percursoAtual(pools, hoje), sub)) return;
  vista.set(solo.grupo, sub);
  mudou();
}

/** Dia: vai pra etapa da vez. Todos: depois de terminar a etapa, a seguinte do ciclo (com personagem novo). */
export function proximaEtapa(pools: Pools, hoje: string): void {
  const t = tela(pools, hoje);
  if (!t || !t.jogo.fim) return;
  if (t.modo === 'dia') {
    const atual = t.percurso?.atual;
    if (!atual) return;
    vista.set(solo.grupo, atual);
  } else if (t.modo === 'todos') {
    const seg = etapaSeguinte(t.etapas, t.sub);
    if (!seg) return;
    todos.set(solo.grupo, { etapa: seg, ciclo: todos.get(solo.grupo)?.ciclo ?? 1 });
  } else return;
  mudou();
}

/** Todos: recomeça o ciclo na primeira etapa ligada, com personagens novos. */
export function recomecarCiclo(pools: Pools): void {
  const etapas = etapasDoPercurso(solo.etapas, comDados(pools));
  if (solo.rodada !== 'livre' || solo.submodo !== 'todos' || !etapas.length) return;
  todos.set(solo.grupo, { etapa: etapas[0] as Submodo, ciclo: (todos.get(solo.grupo)?.ciclo ?? 1) + 1 });
  mudou();
}

/**
 * Próxima franquia na ordem dos chips. No dia, pula as que já terminaram o percurso de hoje (`feita`); null = todas
 * feitas. No Todos, a próxima franquia começa um ciclo novo.
 */
export function franquiaSeguinte(feita: (g: string) => boolean = () => false): string | null {
  return proximaFranquia(GRUPOS.map(g => g.id), solo.grupo, solo.rodada === 'dia' ? feita : () => false);
}
export function irParaFranquia(grupo: string): void {
  if (!grupoDe(grupo)) return;
  if (solo.rodada === 'livre' && solo.submodo === 'todos') {
    const st = todos.get(grupo);
    todos.set(grupo, { etapa: ETAPAS[0] as Submodo, ciclo: (st?.ciclo ?? 0) + 1 });
  }
  escolher({ grupo });
}

/** Percurso de hoje de outra franquia (pra pular as feitas e pro resumo do dia); `dados` = etapas com dados dela. */
export function percursoDe(grupo: string, hoje: string, dados: readonly Submodo[]): Percurso {
  return percursoDoDia(tudo(), grupo, hoje, etapasDoPercurso(solo.etapas, dados));
}

/** Recorte do livre da franquia (gerações, partes...): os valores ligados, ou null = todos. O dia ignora. */
export const recorteDe = (grupo: string): string[] | null => tudo().recortes[grupo] ?? null;

/**
 * Troca o recorte do livre da franquia (null = todos) e guarda no navegador. O jogo do livre e do Todos dessa
 * franquia recomeça com um personagem novo, já dentro do recorte.
 */
export function mudarRecorte(grupo: string, novo: readonly string[] | null): void {
  const s = tudo(), recortes = { ...s.recortes }, r = limparRecorte(grupoDe(grupo), novo);
  if (r) recortes[grupo] = r;
  else delete recortes[grupo];
  gravar({ ...s, recortes });
  for (const id of [...jogos.keys()]) if (id.startsWith(`livre:${grupo}:`) || id.startsWith(`todos:${grupo}:`)) jogos.delete(id);
  mudou();
}

/** Liga ou desliga uma etapa do percurso e do Todos (pelo menos uma fica); guarda no navegador. */
export function alternarEtapa(pools: Pools, hoje: string, sub: Submodo): void {
  solo.etapas = alternar(solo.etapas, sub);
  gravar({ ...tudo(), etapas: solo.etapas });
  if (solo.rodada === 'dia') {
    const v = vista.get(solo.grupo);
    if (v && !solo.etapas.includes(v)) vista.delete(solo.grupo);
    conferirPercurso(pools, hoje);
  }
  mudou();
}

/** Esquece tudo o que está na memória (testes). */
export function reiniciarSolo(): void {
  salvo = null;
  jogos.clear();
  sacos.clear();
  sessao.clear();
  vista.clear();
  todos.clear();
  Object.assign(solo, inicial());
  mudou();
}
