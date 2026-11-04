// Carrossel: no começo de cada estágio a partir do 2 (antes do planejamento da x-1), 9 campeões de estrela 1, cada um
// segurando um item, saem do pool e ficam girando no meio. Os jogadores vivos são liberados em duplas, da menor vida
// pra maior (empate sorteado). O bot pega na hora em que é liberado; o humano, depois de liberado, clica em qualquer
// opção que sobrou até o carrossel acabar, e sem pegar leva uma ao acaso. Quem pega leva o campeão pro banco (banco
// cheio: o campeão é vendido na hora pelo custo, a não ser que feche uma evolução, como na loja) e o item pros itens
// soltos. Os que ninguém pegou voltam pro pool.
//
// Lógica pura sobre a Partida (muda ela no lugar), determinística pela semente. O tempo corre no controle
// (src/autobatalha/controle.ts): ele chama avancarCarrossel com os segundos passados e terminarCarrossel no fim.
import { S } from '../dados';
import type { Rng } from '../rng';
import { COMPONENTES, type CampeaoDados, type Carrossel, type Custo, type Jogador, type Partida } from '../tipos';
import { copias, estaVivo, jogadorDe, ondeEsta, tracosDe, vagaLivreBanco, vivos } from './consultas';
import { criarUnidade, sortearFormaNivel1, verificarEvolucoes } from './evolucao';
import { devolverAoPool } from './loja';
import { M } from './motor';
import { rngDa } from './sorteio';

// ---------- números ----------

/** primeiro estágio com carrossel (no começo de cada estágio daí em diante) */
export const PRIMEIRO_ESTAGIO_DO_CARROSSEL = 2;
export const OPCOES_DO_CARROSSEL = 9;
/** jogadores liberados de cada vez */
export const POR_GRUPO = 2;
/** segundos do começo até a 1ª dupla ser liberada (pra ver as opções) */
export const S_ATE_A_PRIMEIRA = 3;
/** segundos entre uma dupla e a próxima */
export const S_ENTRE_DUPLAS = 3;
/** segundos depois da última dupla até o fim (quem não pegou leva uma ao acaso) */
export const S_DEPOIS_DA_ULTIMA = 4;
/** do estágio 5 em diante o item já vem completo (Bakugan); antes, um componente */
export const ESTAGIO_DO_ITEM_COMPLETO = 5;

/**
 * Chance de cada custo (1 a 5) em cada uma das 9 opções, em porcentagem, por estágio. O estágio 5 vale do 5 em diante.
 * Estágio 2: custos 1 e 2; 3: 2 e 3; 4: 3 e 4; 5+: 3 a 5. Dentro do custo, o campeão sai com peso pelas cópias que
 * sobram no pool, sem repetir campeão enquanto der. Sem cópia nenhuma nos custos do estágio, vale qualquer custo.
 */
export const CUSTOS_DO_CARROSSEL: Readonly<Record<number, readonly [number, number, number, number, number]>> = {
  2: [50, 50, 0, 0, 0],
  3: [0, 50, 50, 0, 0],
  4: [0, 0, 50, 50, 0],
  5: [0, 0, 40, 40, 20],
};

export const temCarrossel = (estagio: number, rodada: number): boolean =>
  rodada === 1 && estagio >= PRIMEIRO_ESTAGIO_DO_CARROSSEL;

/** Chances de custo do carrossel no estágio (em fração, soma 1). */
export function custosDoCarrossel(estagio: number): number[] {
  const e = Math.min(5, Math.max(PRIMEIRO_ESTAGIO_DO_CARROSSEL, Math.floor(estagio)));
  return CUSTOS_DO_CARROSSEL[e]!.map(x => x / 100);
}

/** Segundo (desde o começo do carrossel) em que o grupo k é liberado. */
export const horarioDoGrupo = (k: number): number => S_ATE_A_PRIMEIRA + k * S_ENTRE_DUPLAS;
/** Segundo em que o carrossel acaba. */
export const duracaoDoCarrossel = (c: Carrossel): number =>
  horarioDoGrupo(Math.max(0, c.grupos.length - 1)) + S_DEPOIS_DA_ULTIMA;

// ---------- consultas ----------

export const jaPegou = (c: Carrossel, id: string): boolean => c.opcoes.some(o => o.pegou === id);
export const foiLiberado = (c: Carrossel, id: string): boolean => c.grupos.slice(0, c.liberados).some(g => g.includes(id));
const livres = (c: Carrossel): number[] => c.opcoes.flatMap((o, i) => (o.pegou == null ? [i] : []));

/** O jogador pode clicar numa opção agora: carrossel aberto, vivo, liberado, sem ter pegado e com opção sobrando. */
export function podePegar(p: Partida, id: string): boolean {
  const c = p.carrossel;
  if (!c || p.fase !== 'carrossel') return false;
  const j = p.jogadores.find(x => x.id === id);
  return !!j && estaVivo(j) && foiLiberado(c, id) && !jaPegou(c, id) && livres(c).length > 0;
}

/** Todos os da ordem (vivos) já pegaram, ou não sobrou opção. */
export function todosPegaram(p: Partida): boolean {
  const c = p.carrossel;
  if (!c) return true;
  if (!livres(c).length) return true;
  return c.grupos.flat().every(id => jaPegou(c, id) || !estaVivo(jogadorDe(p, id)));
}

// ---------- montar ----------

const CUSTOS: readonly Custo[] = [1, 2, 3, 4, 5];

function sortearCusto(p: Partida, rng: Rng): Custo | undefined {
  const chances = custosDoCarrossel(p.estagio);
  const temCopia = (c: Custo) => S().porCusto[c].some(x => (p.pool[x.id] ?? 0) > 0);
  return rng.pesado(CUSTOS, c => (temCopia(c) ? chances[c - 1]! : 0)) ?? rng.pesado(CUSTOS, c => (temCopia(c) ? 1 : 0));
}

/** Campeão do custo pelas cópias do pool, sem repetir os que já estão no carrossel (se der). */
function sortearCampeao(p: Partida, custo: Custo, ja: Set<string>, rng: Rng): CampeaoDados | undefined {
  const doCusto = S().porCusto[custo];
  return rng.pesado(doCusto, c => (ja.has(c.id) ? 0 : p.pool[c.id] ?? 0)) ?? rng.pesado(doCusto, c => p.pool[c.id] ?? 0);
}

/** Itens das 9 opções: componentes (cada um pelo menos uma vez) ou completos diferentes. */
function sortearItens(estagio: number, rng: Rng): string[] {
  if (estagio >= ESTAGIO_DO_ITEM_COMPLETO) {
    const completos = COMPONENTES.flatMap((a, i) => COMPONENTES.slice(i).map(b => M().combinar(a, b)));
    return rng.sortear(completos, OPCOES_DO_CARROSSEL);
  }
  const itens: string[] = [...COMPONENTES];
  while (itens.length < OPCOES_DO_CARROSSEL) itens.push(COMPONENTES[rng.int(COMPONENTES.length)]!);
  return rng.sortear(itens, OPCOES_DO_CARROSSEL);
}

/** Ordem de escolha: vivos da menor vida pra maior (empate sorteado), em duplas. */
export function ordemDoCarrossel(p: Partida, rng: Rng): string[][] {
  const vs = vivos(p);
  const ordem = rng.sortear(vs, vs.length).sort((a, b) => a.vida - b.vida);
  const grupos: string[][] = [];
  for (let i = 0; i < ordem.length; i += POR_GRUPO) grupos.push(ordem.slice(i, i + POR_GRUPO).map(j => j.id));
  return grupos;
}

/** Monta o carrossel do estágio (os campeões saem do pool) e põe a partida na fase 'carrossel'. */
export function montarCarrossel(p: Partida, rng: Rng = rngDa(p)): Carrossel {
  const itens = sortearItens(p.estagio, rng);
  const opcoes: Carrossel['opcoes'] = [];
  const ja = new Set<string>();
  for (let i = 0; i < OPCOES_DO_CARROSSEL; i++) {
    const custo = sortearCusto(p, rng);
    const c = custo != null ? sortearCampeao(p, custo, ja, rng) : undefined;
    if (!c) break;
    p.pool[c.id] = (p.pool[c.id] ?? 0) - 1;
    ja.add(c.id);
    const forma = sortearFormaNivel1(c.id, rng) ?? S().formaPadrao(c.id, 1);
    opcoes.push({ campeao: c.id, forma, item: itens[i]!, pegou: null });
  }
  const carrossel: Carrossel = { opcoes, grupos: ordemDoCarrossel(p, rng), liberados: 0 };
  p.carrossel = carrossel;
  p.fase = 'carrossel';
  return carrossel;
}

// ---------- pegar ----------

/** O jogador leva a opção i: o item vai pros soltos; o campeão pro banco (banco cheio: vendido pelo custo, a não ser
 *  que feche uma evolução, como na loja). */
function levar(p: Partida, j: Jogador, i: number): void {
  const o = p.carrossel!.opcoes[i]!;
  o.pegou = j.id;
  j.itens.push(o.item);
  const livre = vagaLivreBanco(j);
  const vender = () => {
    j.ouro += S().campeao(o.campeao).custo;
    devolverAoPool(p, o.campeao, 1);
    o.vendido = true;
  };
  if (livre < 0 && copias(j, o.campeao, 1) < 2) { vender(); return; }
  const u = criarUnidade(p, o.campeao, o.forma);
  j.unidades[u.uid] = u;
  if (livre >= 0) j.banco[livre] = u.uid;
  verificarEvolucoes(p, j);
  // não fundiu (não devia acontecer): sem lugar, vende
  if (j.unidades[u.uid] && !ondeEsta(j, u.uid)) { delete j.unidades[u.uid]; vender(); }
}

/** Nota do bot pra uma opção: campeão que ele já tem, que fecha evolução ou que dá traço que ele monta; componente que
 *  fecha um completo com um solto; custo maior desempata. Campeão que seria vendido (banco cheio) só vale o item. */
function notaDoBot(j: Jogador, o: Carrossel['opcoes'][number]): number {
  let n = 0;
  const evolui = copias(j, o.campeao, 1) >= 2;
  if (vagaLivreBanco(j) >= 0 || evolui) {
    const meus = Object.values(j.unidades).filter(u => u.campeao === o.campeao);
    if (meus.length && !meus.some(u => u.estrela === 3)) n += 3;
    if (evolui) n += 2;
    if ((j.alvos ?? []).some(t => tracosDe(o.campeao).includes(t))) n += 2;
    n += S().campeao(o.campeao).custo * 0.25;
  }
  const m = M();
  if (m.ehComponente(o.item) && j.itens.some(x => m.ehComponente(x))) n += 1;
  return n;
}

/** O bot escolhe a melhor opção que sobrou (empate sorteado). */
function pegarBot(p: Partida, j: Jogador, rng: Rng): void {
  const c = p.carrossel!;
  const ls = livres(c);
  if (!ls.length || jaPegou(c, j.id)) return;
  const notas = ls.map(i => notaDoBot(j, c.opcoes[i]!));
  const max = Math.max(...notas);
  const melhores = ls.filter((_, k) => notas[k]! >= max - 1e-9);
  levar(p, j, melhores[rng.int(melhores.length)]!);
}

/** Libera o próximo grupo: os bots dele pegam na hora. false = não havia grupo pra liberar. */
export function liberarProximoGrupo(p: Partida): boolean {
  const c = p.carrossel;
  if (!c || c.liberados >= c.grupos.length) return false;
  const grupo = c.grupos[c.liberados]!;
  c.liberados++;
  const rng = rngDa(p);
  for (const id of grupo) {
    const j = jogadorDe(p, id);
    if (j.bot && estaVivo(j)) pegarBot(p, j, rng);
  }
  return true;
}

/** Libera os grupos cujo horário já chegou (`t` = segundos desde o começo). Devolve quantos liberou. */
export function avancarCarrossel(p: Partida, t: number): number {
  const c = p.carrossel;
  let n = 0;
  while (c && c.liberados < c.grupos.length && horarioDoGrupo(c.liberados) <= t && liberarProximoGrupo(p)) n++;
  return n;
}

/** O jogador (humano) pega a opção i. Devolve a mensagem quando não dá. */
export function pegarDoCarrossel(p: Partida, jid: string, i: number): string | null {
  const c = p.carrossel;
  if (!c || p.fase !== 'carrossel') return 'O carrossel não está aberto';
  const j = jogadorDe(p, jid);
  if (!estaVivo(j)) return 'Você foi eliminado';
  if (jaPegou(c, jid)) return 'Você já pegou um campeão do carrossel';
  if (!foiLiberado(c, jid)) return 'Espere a sua vez no carrossel';
  const o = c.opcoes[i];
  if (!o) return 'Opção não encontrada';
  if (o.pegou != null) return 'Alguém já pegou esse';
  levar(p, j, i);
  return null;
}

/** Fim do carrossel: libera quem faltou (bots pegam), quem não pegou leva uma ao acaso, o que sobrou volta pro pool e
 *  a partida vai pro planejamento. */
export function terminarCarrossel(p: Partida): void {
  const c = p.carrossel;
  if (c) {
    while (liberarProximoGrupo(p)) { /* libera quem faltou */ }
    const rng = rngDa(p);
    for (const id of c.grupos.flat()) {
      const j = jogadorDe(p, id);
      if (!estaVivo(j) || jaPegou(c, id)) continue;
      const ls = livres(c);
      if (!ls.length) break;
      levar(p, j, ls[rng.int(ls.length)]!);
    }
    for (const o of c.opcoes) if (o.pegou == null) devolverAoPool(p, o.campeao, 1);
    delete p.carrossel;
  }
  if (p.fase === 'carrossel') p.fase = 'planejamento';
}
