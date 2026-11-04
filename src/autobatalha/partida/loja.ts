// Loja (7 vagas, a última é a vaga do time), pool compartilhado, comprar, vender, atualizar, travar e XP.
import { S } from '../dados';
import type { Rng } from '../rng';
import type { CampeaoDados, Custo, Jogador, Partida } from '../tipos';
import {
  COPIAS_POR_CUSTO, COPIAS_POR_ESTRELA, CUSTO_ATUALIZAR, CUSTO_XP, NIVEL_MAXIMO, PESO_DONO, VAGA_DO_TIME, VAGAS_LOJA,
  XP_POR_COMPRA,
} from './constantes';
import {
  chancesLoja, copias, tracosDe, unidadesNoBanco, unidadesNoTabuleiro, vagaLivreBanco, valorVenda, xpParaProximo,
} from './consultas';
import { criarUnidade, limparEscolhas, sortearFormaNivel1, verificarEvolucoes } from './evolucao';
import { rngDa } from './sorteio';
import { arrumarStands, tirar } from './tabuleiro';

export const MSG_OURO = 'Ouro insuficiente';
export const MSG_BANCO = 'Banco cheio';

/** Pool cheio: cópias por custo de cada campeão do set. */
export function poolCheio(): Record<string, number> {
  const pool: Record<string, number> = {};
  for (const c of S().dados.campeoes) pool[c.id] = COPIAS_POR_CUSTO[c.custo];
  return pool;
}

/** Traços que a vaga do time procura: os do tabuleiro; tabuleiro vazio, os do banco. */
function tracosDoTime(j: Jogador): Set<string> {
  let us = unidadesNoTabuleiro(j);
  if (!us.length) us = unidadesNoBanco(j);
  return new Set(us.flatMap(u => tracosDe(u.campeao)));
}

/** Sorteia um custo pela tabela do nível, só entre os custos que ainda têm cópias. */
function sortearCusto(p: Partida, j: Jogador, rng: Rng): Custo | null {
  const chances = chancesLoja(j.nivel);
  const custos: Custo[] = [1, 2, 3, 4, 5];
  const temCopia = (c: Custo) => S().porCusto[c].some(x => (p.pool[x.id] ?? 0) > 0);
  return rng.pesado(custos, c => (temCopia(c) ? chances[c - 1]! : 0)) ?? rng.pesado(custos, c => (temCopia(c) ? 1 : 0)) ?? null;
}

/** Campeão do custo: peso 4 pro que o jogador já tem e 1 pros outros, vezes as cópias restantes no pool. */
function sortearCampeao(p: Partida, j: Jogador, candidatos: CampeaoDados[], rng: Rng): CampeaoDados | undefined {
  const meus = new Set(Object.values(j.unidades).map(u => u.campeao));
  return rng.pesado(candidatos, c => (p.pool[c.id] ?? 0) * (meus.has(c.id) ? PESO_DONO : 1));
}

/** Loja nova (sem cobrar). */
export function sortearLoja(p: Partida, j: Jogador, rng: Rng = rngDa(p)): void {
  const loja: (string | null)[] = [];
  const formas: (string | null)[] = [];
  const time = tracosDoTime(j);
  for (let i = 0; i < VAGAS_LOJA; i++) {
    const custo = sortearCusto(p, j, rng);
    let c: CampeaoDados | undefined;
    if (custo != null) {
      const doCusto = S().porCusto[custo];
      if (i === VAGA_DO_TIME && time.size) {
        const doTime = doCusto.filter(x => tracosDe(x.id).some(t => time.has(t)));
        c = sortearCampeao(p, j, doTime, rng);
      }
      c ??= sortearCampeao(p, j, doCusto, rng);
    }
    loja.push(c?.id ?? null);
    formas.push(c ? sortearFormaNivel1(c.id, rng) : null);
  }
  j.loja = loja;
  j.lojaFormas = formas;
}

/** Atualizar a loja por 2 de ouro. */
export function atualizar(p: Partida, j: Jogador): string | null {
  if (j.ouro < CUSTO_ATUALIZAR) return MSG_OURO;
  j.ouro -= CUSTO_ATUALIZAR;
  sortearLoja(p, j);
  return null;
}

export function travar(j: Jogador): void { j.lojaTravada = !j.lojaTravada; }

/** Compra a carta da vaga i. Banco cheio: só se a compra fechar uma evolução. */
export function comprarVaga(p: Partida, j: Jogador, i: number): string | null {
  const id = j.loja[i];
  if (id == null) return 'Vaga vazia';
  const c = S().campeao(id);
  if (j.ouro < c.custo) return MSG_OURO;
  if ((p.pool[id] ?? 0) <= 0) return 'Esgotado';
  const livre = vagaLivreBanco(j);
  if (livre < 0 && copias(j, id, 1) < 2) return MSG_BANCO;
  j.ouro -= c.custo;
  p.pool[id] = (p.pool[id] ?? 0) - 1;
  const u = criarUnidade(p, id, j.lojaFormas?.[i] ?? undefined);
  j.unidades[u.uid] = u;
  if (livre >= 0) j.banco[livre] = u.uid;
  j.loja[i] = null;
  if (j.lojaFormas) j.lojaFormas[i] = null;
  verificarEvolucoes(p, j);
  return null;
}

/** Devolve ao pool as cópias da unidade (1, 3 ou 9). */
export function devolverAoPool(p: Partida, campeao: string, n: number): void {
  p.pool[campeao] = (p.pool[campeao] ?? 0) + n;
}

/** Vende a unidade: ouro pelo valor, cópias de volta pro pool, itens pros soltos. */
export function venderUnidade(p: Partida, j: Jogador, uid: number): string | null {
  const u = j.unidades[uid];
  if (!u) return 'Unidade não encontrada';
  j.ouro += valorVenda(u);
  devolverAoPool(p, u.campeao, COPIAS_POR_ESTRELA[u.estrela]);
  j.itens.push(...u.itens);
  tirar(j, uid);
  delete j.unidades[uid];
  limparEscolhas(j);
  arrumarStands(j);
  return null;
}

/** Ganha XP e sobe de nível quantas vezes der (até o 10). */
export function ganharXp(j: Jogador, n: number): void {
  if (j.nivel >= NIVEL_MAXIMO) { j.xp = 0; return; }
  j.xp += n;
  for (let falta = xpParaProximo(j.nivel); j.nivel < NIVEL_MAXIMO && j.xp >= falta; falta = xpParaProximo(j.nivel)) {
    j.xp -= falta;
    j.nivel++;
  }
  if (j.nivel >= NIVEL_MAXIMO) j.xp = 0;
}

/** Compra 4 de XP por 4 de ouro. */
export function comprarXpDe(j: Jogador): string | null {
  if (j.nivel >= NIVEL_MAXIMO) return 'Nível máximo';
  if (j.ouro < CUSTO_XP) return MSG_OURO;
  j.ouro -= CUSTO_XP;
  ganharXp(j, XP_POR_COMPRA);
  return null;
}

/** Dá uma unidade de graça (campeão inicial, Sujimon recrutado): sai do pool e vai pro banco. false = sem vaga. */
export function darUnidade(p: Partida, j: Jogador, campeao: string, rng: Rng): boolean {
  if ((p.pool[campeao] ?? 0) <= 0) return false;
  const livre = vagaLivreBanco(j);
  if (livre < 0) return false;
  p.pool[campeao] = (p.pool[campeao] ?? 0) - 1;
  const u = criarUnidade(p, campeao, sortearFormaNivel1(campeao, rng) ?? undefined);
  j.unidades[u.uid] = u;
  j.banco[livre] = u.uid;
  verificarEvolucoes(p, j);
  return true;
}

/** Devolve ao pool tudo do jogador eliminado (as unidades continuam pra tela mostrar). */
export function devolverTudo(p: Partida, j: Jogador): void {
  for (const u of Object.values(j.unidades)) devolverAoPool(p, u.campeao, COPIAS_POR_ESTRELA[u.estrela]);
}

