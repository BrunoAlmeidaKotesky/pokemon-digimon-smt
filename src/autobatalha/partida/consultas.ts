// Consultas sem efeito sobre a partida: o que a tela e as outras partes da partida perguntam.
import { S } from '../dados';
import { chave, deChave } from '../hex';
import type { Custo, Estrela, Jogador, Onde, Origem, Partida, TipoRodada, Unidade } from '../tipos';
import {
  CHANCES_LOJA, COPIAS_POR_ESTRELA, ID_MONSTROS, NIVEL_MAXIMO, PREFIXO_FANTASMA, XP_POR_NIVEL,
} from './constantes';
import { M } from './motor';

export function jogadorDe(p: Partida, id: string): Jogador {
  const j = p.jogadores.find(x => x.id === id);
  if (!j) throw new Error(`jogador desconhecido: ${id}`);
  return j;
}
export const humano = (p: Partida): Jogador => jogadorDe(p, p.voce);
export const estaVivo = (j: Jogador): boolean => j.colocacao == null && j.vida > 0;
export const vivos = (p: Partida): Jogador[] => p.jogadores.filter(estaVivo);
export const ehFantasma = (id: string): boolean => id.startsWith(PREFIXO_FANTASMA);
export const ehMonstros = (id: string): boolean => id === ID_MONSTROS;
/** id do jogador copiado por um fantasma (`fantasma:x` → x) */
export const donoDoFantasma = (id: string): string => id.slice(PREFIXO_FANTASMA.length);

export const custoDe = (u: Unidade): Custo => S().campeao(u.campeao).custo;
export const ehStand = (u: Unidade): boolean => S().campeao(u.campeao).stand === true;
export const origemDe = (u: Unidade): Origem => S().campeao(u.campeao).fr;

/** Valor de venda: custo × cópias (1, 3, 9), menos 1 na estrela 2 ou 3 se o custo for 2 ou mais. */
export function valorVenda(u: Unidade): number {
  const custo = custoDe(u);
  return custo * COPIAS_POR_ESTRELA[u.estrela] - (u.estrela >= 2 && custo >= 2 ? 1 : 0);
}
/** Força aproximada pra ordenar unidades (bots, preencher o tabuleiro): custo × cópias. */
export const forca = (u: Unidade): number => custoDe(u) * COPIAS_POR_ESTRELA[u.estrela];

/** XP que falta do nível pro próximo; 0 no nível máximo. */
export function xpParaProximo(nivel: number): number {
  if (nivel >= NIVEL_MAXIMO) return 0;
  return XP_POR_NIVEL[Math.max(1, nivel) - 1] ?? 0;
}

/** Chance de cada custo (1 a 5) na loja, em fração (soma 1). */
export function chancesLoja(nivel: number): number[] {
  const linha = CHANCES_LOJA[Math.min(NIVEL_MAXIMO, Math.max(1, nivel)) - 1]!;
  return linha.map(x => x / 100);
}

/** Tipo de cada rodada do estágio: 1 = três de monstros; depois seis contra jogadores e a 7ª de monstros
 *  (comuns no 2, chefe do 3 em diante). */
export function rodadasDoEstagio(estagio: number): TipoRodada[] {
  if (estagio <= 1) return ['monstros', 'monstros', 'monstros'];
  return ['pvp', 'pvp', 'pvp', 'pvp', 'pvp', 'pvp', estagio === 2 ? 'monstros' : 'chefe'];
}

/** Limite de unidades no tabuleiro: o nível (pedido do usuário em 05/11/2026: começar com dois não foi boa ideia). */
export const limiteTabuleiro = (j: Jogador): number => j.nivel;
/** Quantos Stands do tabuleiro não gastam vaga no nível; os outros contam como unidade normal. */
export const standsForaDaVagaNoNivel = (nivel: number): number => M().standsForaDaVaga(nivel);
export const standsForaDaVaga = (j: Jogador): number => standsForaDaVagaNoNivel(j.nivel);

/** Unidades no tabuleiro, com ou sem os Stands. */
export function unidadesNoTabuleiro(j: Jogador, comStands = true): Unidade[] {
  const out: Unidade[] = [];
  for (const uid of Object.values(j.tabuleiro)) {
    const u = j.unidades[uid];
    if (u && (comStands || !ehStand(u))) out.push(u);
  }
  return out;
}
/** Unidades no banco, na ordem das vagas. */
export function unidadesNoBanco(j: Jogador): Unidade[] {
  const out: Unidade[] = [];
  for (const uid of j.banco) if (uid != null && j.unidades[uid]) out.push(j.unidades[uid]);
  return out;
}
export const todasUnidades = (j: Jogador): Unidade[] => Object.values(j.unidades);

/** Onde a unidade está (null = em lugar nenhum, só durante uma compra com o banco cheio). */
export function ondeEsta(j: Jogador, uid: number): Onde | null {
  const i = j.banco.indexOf(uid);
  if (i >= 0) return { tipo: 'banco', i };
  for (const [k, v] of Object.entries(j.tabuleiro)) if (v === uid) return { tipo: 'tabuleiro', casa: deChave(k) };
  return null;
}
export const noTabuleiro = (j: Jogador, uid: number): boolean => Object.values(j.tabuleiro).includes(uid);
export const vagaLivreBanco = (j: Jogador): number => j.banco.indexOf(null);
/** uid da unidade no lugar (ou null) */
export function ocupante(j: Jogador, onde: Onde): number | null {
  if (onde.tipo === 'banco') return j.banco[onde.i] ?? null;
  return j.tabuleiro[chave(onde.casa)] ?? null;
}
/** O Stand preso a esta unidade no tabuleiro. */
export function standDe(j: Jogador, uid: number): Unidade | undefined {
  for (const u of unidadesNoTabuleiro(j)) if (u.usuario === uid && ehStand(u)) return u;
  return undefined;
}
/** Cópias de estrela 1 de um campeão que o jogador tem (pra saber se uma compra fecha evolução). */
export function copias(j: Jogador, campeao: string, estrela: Estrela): number {
  let n = 0;
  for (const u of todasUnidades(j)) if (u.campeao === campeao && u.estrela === estrela) n++;
  return n;
}
/** Traços (origem e classes da linha, sem "unicos") de um campeão. */
export const tracosDe = (campeao: string): string[] => S().tracosDoCampeao(campeao).filter(t => t !== 'unicos');
