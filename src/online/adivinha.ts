// Adivinha online, "vez de cada um": o host sorteia o personagem secreto (que só sai do host quando a rodada acaba)
// e os jogadores chutam em ordem, um chute por vez, com tempo (ou sem limite). Todo mundo vê todos os chutes com as
// pistas; quem acerta ganha a rodada (+1 ponto). Tempo esgotado passa a vez; quem caiu da sala é pulado.
// A sala pode ter várias franquias e vários modos: as rodadas alternam os modos na ordem e sorteiam a franquia.
// Tudo puro como em room.ts: sorteio só com ctx.rand, relógio só com ctx.now; estas funções recebem o estado JÁ
// CLONADO e mudam ele (false = ação ignorada).
import { pistas } from '../adivinha/comparar';
import { GRUPOS, SUBMODOS, grupoDe, rotuloSubmodo, type Submodo } from '../adivinha/grupos';
import { acharNoPool, montarPool, type AdvItem } from '../adivinha/pool';
import { limparRecorte, textoRecorte } from '../adivinha/recorte';
import type { Entry } from '../types';
import type { Action, AdivinhaGame, Ctx, OnlineConfig, RoomState } from './types';

/** Segundos por vez que o host pode escolher (0 = sem limite). */
export const ADV_TEMPOS = [15, 20, 30, 40, 60, 90, 0] as const;
/** Rótulo do tempo: "40 s" ou "Sem limite". */
export const tempoTxt = (n: number): string => (n > 0 ? `${n} s` : 'Sem limite');
/** Rodadas: mínimo, máximo e padrão. */
export const ADV_RODADAS = { min: 1, max: 10, def: 5 } as const;
export const ADV_PADRAO: OnlineConfig['adivinha'] = { grupo: 'lol', submodo: 'classico', rodadas: ADV_RODADAS.def, tempo: 40 };

type ChuteAction = Extract<Action, { type: 'chute' }>;

/** A configuração já conferida: as listas sempre vêm preenchidas (pelo menos uma franquia e um modo). */
export type AdvCfg = OnlineConfig['adivinha'] & { grupos: string[]; submodos: Submodo[]; recortes: Record<string, string[]> };

/** Configuração dentro dos limites (o que não servir vira o padrão). Franquias e modos saem na ordem da tela. */
export function advSettings(c: Partial<OnlineConfig['adivinha']> | null | undefined): AdvCfg {
  const r = c?.rodadas;
  const pedidos = Array.isArray(c?.grupos) && c.grupos.length ? c.grupos : [c?.grupo];
  const grupos = GRUPOS.map(g => g.id).filter(id => pedidos.includes(id));
  if (!grupos.length) grupos.push(ADV_PADRAO.grupo);
  const modosPedidos: unknown[] = Array.isArray(c?.submodos) && c.submodos.length ? c.submodos : [c?.submodo];
  const submodos = SUBMODOS.map(x => x.id).filter(id => modosPedidos.includes(id));
  if (!submodos.length) submodos.push(ADV_PADRAO.submodo);
  // recorte só vale pra franquia que tem um; sem o campo (ou inválido) = todos. O `recorte` solto é o da 1ª franquia
  const recortes: Record<string, string[]> = {};
  for (const id of grupos) {
    const bruto = c?.recortes && typeof c.recortes === 'object' ? c.recortes[id] : undefined;
    const limpo = limparRecorte(grupoDe(id), bruto ?? (id === c?.grupo ? c?.recorte : undefined));
    if (limpo) recortes[id] = limpo;
  }
  const grupo = grupos[0] as string;
  const recorte = recortes[grupo];
  return {
    grupo,
    ...(recorte ? { recorte } : {}),
    submodo: submodos[0] as Submodo,
    grupos, submodos, recortes,
    rodadas: typeof r === 'number' && Number.isFinite(r) ? Math.min(ADV_RODADAS.max, Math.max(ADV_RODADAS.min, Math.round(r))) : ADV_RODADAS.def,
    tempo: (ADV_TEMPOS as readonly number[]).includes(c?.tempo as number) ? (c?.tempo as number) : ADV_PADRAO.tempo,
  };
}

const advOf = (s: RoomState): AdivinhaGame | null => (s.phase === 'play' && s.game?.mode === 'adivinha' ? s.game : null);
const entry = (it: AdvItem): Entry => ({ name: it.name, img: it.img, fr: it.fr });

/** Personagens possíveis do jogo, com o que o host tem carregado. */
function poolDe(grupo: string, sub: Submodo, ctx: Ctx, recorte: readonly string[] | null = null): AdvItem[] {
  const g = grupoDe(grupo);
  if (!g || !ctx.adivinha) return [];
  return montarPool(g, sub, { listas: ctx.lists, catalogos: ctx.adivinha.catalogos, emojis: ctx.adivinha.emojis }, recorte);
}

/** Resumo de uma franquia com o recorte: "Pokémon (gerações I e III)". */
export function franquiaComRecorte(cfg: { grupo: string; recorte?: string[] | null }): string {
  const g = grupoDe(cfg.grupo);
  if (!g) return cfg.grupo;
  const r = textoRecorte(g, cfg.recorte ?? null);
  return r ? `${g.rotulo} (${r})` : g.rotulo;
}
/** Todas as franquias da sala: "LoL + Pokémon (geração I)". */
export const franquiasTxt = (cfg: AdvCfg): string => cfg.grupos.map(grupo => franquiaComRecorte({ grupo, recorte: cfg.recortes[grupo] })).join(' + ');
/** Todos os modos da sala: "Clássico + Emoji". */
export const modosTxt = (submodos: readonly Submodo[]): string => submodos.map(rotuloSubmodo).join(' + ');

/** Por que o jogo não pode começar ('' = pode). `label` dá o rótulo de cada franquia. */
export function advProblema(bruto: OnlineConfig['adivinha'], ctx: Ctx, label: (k: string) => string): string {
  const cfg = advSettings(bruto);
  const cats = ctx.adivinha?.catalogos ?? {};
  for (const id of cfg.grupos) {
    const g = grupoDe(id);
    if (!g) return 'Escolha uma franquia.';
    const lista = g.frs.find(fr => !ctx.lists[fr]?.length);
    if (lista !== undefined && g.frs.every(fr => !ctx.lists[fr]?.length)) return `Lista de ${label(lista)} ainda não carregou.`;
    if (g.frs.some(fr => cats[fr] === undefined)) return `As informações de ${g.rotulo} ainda estão carregando. Tente de novo em instantes.`;
    if (g.frs.every(fr => cats[fr] === null)) return `Não consegui carregar as informações de ${g.rotulo}.`;
  }
  const rec = (id: string) => cfg.recortes[id] ?? null;
  if (cfg.grupos.length === 1 && cfg.submodos.length === 1) {
    const g = grupoDe(cfg.grupo)!;
    if (cfg.submodo === 'emoji' && !poolDe(cfg.grupo, 'emoji', ctx).length) return `${g.rotulo} ainda não tem emojis: escolha outro modo.`;
    if (!poolDe(cfg.grupo, cfg.submodo, ctx).length) return `Nenhum personagem de ${g.rotulo} pra adivinhar.`;
    if (!poolDe(cfg.grupo, cfg.submodo, ctx, rec(cfg.grupo)).length) return `Nenhum personagem de ${franquiaComRecorte(cfg)} pra adivinhar: ligue mais opções.`;
    return '';
  }
  // várias franquias ou vários modos: cada modo precisa de alguma franquia, e cada franquia de algum modo
  for (const sub of cfg.submodos) {
    if (!cfg.grupos.some(id => poolDe(id, sub, ctx, rec(id)).length)) {
      return `Nenhuma franquia escolhida tem personagens pro modo ${rotuloSubmodo(sub)}${sub === 'emoji' ? ' (faltam os emojis)' : ''}: desligue esse modo.`;
    }
  }
  for (const id of cfg.grupos) {
    if (!cfg.submodos.some(sub => poolDe(id, sub, ctx, rec(id)).length)) {
      return `Nenhum personagem de ${franquiaComRecorte({ grupo: id, recorte: rec(id) })} pra adivinhar: ligue mais opções.`;
    }
  }
  return '';
}

const naSala = (s: RoomState, id: string) => s.players.some(p => p.id === id && p.online);

/** Próximo da ordem depois de `de` que está na sala e online (pode voltar pro próprio `de`). */
function proxima(s: RoomState, g: AdivinhaGame, de: string): string | null {
  const n = g.ordem.length, i = g.ordem.indexOf(de);
  for (let k = 1; k <= n; k++) {
    const id = g.ordem[(i + k + n) % n] as string;
    if (naSala(s, id)) return id;
  }
  return null;
}
/** Quem começa a rodada: cada rodada começa num jogador diferente (o próximo da ordem). */
function primeira(s: RoomState, g: AdivinhaGame): string | null {
  const n = g.ordem.length;
  for (let k = 0; k < n; k++) {
    const id = g.ordem[(g.rodada - 1 + k) % n] as string;
    if (naSala(s, id)) return id;
  }
  return null;
}
/** Quando a vez acaba: sem limite de tempo, nunca (0). */
const prazoDe = (g: AdivinhaGame, ctx: Ctx): number => (g.tempo > 0 ? ctx.now + g.tempo * 1000 : 0);
function passarVez(s: RoomState, g: AdivinhaGame, de: string, ctx: Ctx) {
  g.vez = proxima(s, g, de);
  g.prazo = prazoDe(g, ctx);
}

/**
 * Franquia e modo da rodada: os modos alternam na ordem (rodada 1 = o primeiro) e a franquia é sorteada entre as que
 * têm personagem naquele modo; modo sem nenhuma franquia é pulado. Com uma franquia só, não gasta sorteio.
 * Devolve o pool da rodada (vazio = não há o que sortear).
 */
function escolherRodada(g: AdivinhaGame, ctx: Ctx): AdvItem[] {
  const n = g.submodos.length;
  for (let k = 0; k < n; k++) {
    const sub = g.submodos[(g.rodada - 1 + k) % n] as Submodo;
    const opcoes = g.grupos.map(id => ({ id, pool: poolDe(id, sub, ctx, g.recortes[id] ?? null) })).filter(o => o.pool.length);
    if (!opcoes.length) continue;
    const o = opcoes.length === 1 ? opcoes[0]! : opcoes[Math.floor(ctx.rand() * opcoes.length)]!;
    g.submodo = sub;
    g.grupo = o.id;
    g.recorte = g.recortes[o.id] ?? null;
    return o.pool;
  }
  return [];
}

/** Sorteia o secreto (sem repetir os já usados, até acabar a lista) e abre a rodada. */
function abrirRodada(s: RoomState, g: AdivinhaGame, pool: AdvItem[], ctx: Ctx) {
  const usados = new Set(g.usados);
  let livres = pool.filter(x => !usados.has(x.name));
  if (!livres.length) {
    g.usados = [];
    livres = pool;
  }
  const alvo = livres[Math.floor(ctx.rand() * livres.length)] as AdvItem;
  g.usados.push(alvo.name);
  g.secreto = structuredClone(alvo);
  g.foco = ctx.rand();
  g.chutes = [];
  g.vencedor = null;
  g.passo = 'chute';
  g.vez = primeira(s, g);
  g.prazo = prazoDe(g, ctx);
}

/** Começa o jogo (room.ts já conferiu o modo). Problema (lista ou catálogo faltando) vira aviso. */
export function startAdivinha(s: RoomState, ctx: Ctx, label: (k: string) => string): boolean {
  const cfg = advSettings(s.cfg.adivinha);
  const erro = advProblema(cfg, ctx, label);
  if (erro) {
    s.notice = erro;
    return true;
  }
  const g: AdivinhaGame = {
    mode: 'adivinha', grupo: cfg.grupo, submodo: cfg.submodo, grupos: cfg.grupos, submodos: cfg.submodos, recortes: cfg.recortes,
    rodadas: cfg.rodadas, tempo: cfg.tempo, recorte: cfg.recorte ?? null, rodada: 1, passo: 'chute',
    ordem: s.players.map(p => p.id), vez: null, prazo: 0,
    secreto: null as unknown as AdvItem, foco: 0, chutes: [], usados: [],
    placar: Object.fromEntries(s.players.map(p => [p.id, 0])),
    nomes: Object.fromEntries(s.players.map(p => [p.id, p.name])),
    vencedor: null, historico: [],
  };
  // advProblema já garantiu que existe o que sortear
  const pool = escolherRodada(g, ctx);
  s.game = g;
  s.phase = 'play';
  s.vote = null;
  s.notice = '';
  abrirRodada(s, g, pool, ctx);
  return true;
}

function fecharRodada(g: AdivinhaGame, vencedor: string | null) {
  g.vencedor = vencedor;
  g.passo = 'resultado';
  g.vez = null;
  g.historico.push({ rodada: g.rodada, secreto: entry(g.secreto), vencedor, chutes: g.chutes.filter(c => c.alvo).length });
}

/** Chute de quem está na vez: personagem do jogo, ainda não chutado na rodada. Acertou: ganha a rodada. */
export function advChute(s: RoomState, a: ChuteAction, ctx: Ctx): boolean {
  const g = advOf(s);
  if (!g || g.passo !== 'chute' || a.id !== g.vez || a.rodada !== g.rodada) return false;
  const it = acharNoPool(poolDe(g.grupo, g.submodo, ctx, g.recorte), a.nome);
  if (!it || g.chutes.some(c => c.alvo?.name === it.name)) return false;
  const certo = it.name === g.secreto.name;
  const grupo = grupoDe(g.grupo);
  g.chutes.push({
    por: a.id, porNome: g.nomes[a.id] ?? '?', alvo: entry(it),
    pistas: g.submodo === 'classico' && grupo ? pistas(grupo, it, g.secreto) : null, certo,
  });
  if (certo) {
    g.placar[a.id] = (g.placar[a.id] ?? 0) + 1;
    fecharRodada(g, a.id);
  } else passarVez(s, g, a.id, ctx);
  return true;
}

/** O tempo da vez acabou (pelo relógio do host): a vez passa pro próximo. */
export function advTempo(s: RoomState, ctx: Ctx): boolean {
  const g = advOf(s);
  if (!g || g.passo !== 'chute' || !g.vez || g.tempo <= 0 || ctx.now < g.prazo) return false;
  g.chutes.push({ por: g.vez, porNome: g.nomes[g.vez] ?? '?', alvo: null, pistas: null, certo: false });
  passarVez(s, g, g.vez, ctx);
  return true;
}

/** O host revela o secreto e fecha a rodada sem vencedor. */
export function advRevelar(s: RoomState): boolean {
  const g = advOf(s);
  if (!g || g.passo !== 'chute') return false;
  fecharRodada(g, null);
  return true;
}

/** Depois do resultado: próxima rodada ou, na última, o placar final. */
export function advNext(s: RoomState, ctx: Ctx): boolean {
  const g = advOf(s);
  if (!g || g.passo !== 'resultado') return false;
  if (g.rodada >= g.rodadas) {
    g.passo = 'fim';
    return true;
  }
  g.rodada++;
  const pool = escolherRodada(g, ctx);
  if (!pool.length) {
    g.rodada--;
    s.notice = `As informações de ${grupoDe(g.grupo)?.rotulo ?? g.grupo} sumiram. Volte ao lobby e comece de novo.`;
    return true;
  }
  s.notice = '';
  abrirRodada(s, g, pool, ctx);
  return true;
}

/** Entrou (ou voltou) alguém: quem é novo vai pro fim da ordem; se ninguém estava na vez, ele assume. */
export function advEntrou(s: RoomState, id: string, ctx: Ctx): void {
  const g = advOf(s);
  if (!g) return;
  const p = s.players.find(x => x.id === id);
  if (p) g.nomes[id] = p.name;
  if (!g.ordem.includes(id)) g.ordem.push(id);
  g.placar[id] ??= 0;
  if (g.passo === 'chute' && g.vez === null) {
    g.vez = primeira(s, g);
    g.prazo = prazoDe(g, ctx);
  }
}

/** Caiu (ou saiu) alguém: se era a vez dele, passa pro próximo. `sair` = tira da ordem (os pontos ficam no placar). */
export function advCaiu(s: RoomState, id: string, ctx: Ctx, sair: boolean): void {
  const g = advOf(s);
  if (!g) return;
  if (g.passo === 'chute' && g.vez === id) passarVez(s, g, id, ctx);
  if (sair) g.ordem = g.ordem.filter(x => x !== id);
}
