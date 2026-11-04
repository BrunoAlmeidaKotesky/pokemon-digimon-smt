// Números da partida (docs/tft/autobatalha.md, seção "Partida"). Mudar a economia é mexer aqui.
import type { Custo, Estrela } from '../tipos';

export const VIDA_INICIAL = 100;
export const OURO_INICIAL = 1;
/** nível máximo (pedido do usuário em 04/11/2026: era 10) */
export const NIVEL_MAXIMO = 12;
/** unidades no tabuleiro além do nível (limite = nível + isto; Stands à parte). O set é bem maior que o do gênero. */
export const UNIDADES_ALEM_DO_NIVEL = 1;
export const VAGAS_LOJA = 7;
/** a última vaga da loja é a vaga do time */
export const VAGA_DO_TIME = VAGAS_LOJA - 1;
export const VAGAS_BANCO = 9;
export const MAX_ITENS = 3;
export const CUSTO_ATUALIZAR = 2;
export const CUSTO_XP = 4;
/** XP que a compra de XP dá */
export const XP_POR_COMPRA = 4;
/** XP de graça no começo de cada planejamento (a partir da 1-2) */
export const XP_POR_RODADA = 2;
/** peso, dentro do custo sorteado, do campeão que o jogador já tem (os outros pesam 1) */
export const PESO_DONO = 4;

/** XP pra passar do nível n pro n + 1 (índice n - 1) */
/** (mais barata nos níveis baixos e médios, pedido do usuário em 04/11/2026; era 2, 2, 6, 10, 20, 36, 48, 76, 84) */
export const XP_POR_NIVEL: readonly number[] = [2, 2, 4, 8, 14, 24, 36, 56, 76, 96, 120];

/** chance de cada custo (1 a 5) por nível (índice nível - 1), em porcentagem */
export const CHANCES_LOJA: readonly (readonly [number, number, number, number, number])[] = [
  [100, 0, 0, 0, 0],
  [100, 0, 0, 0, 0],
  [75, 25, 0, 0, 0],
  [55, 30, 15, 0, 0],
  [45, 33, 20, 2, 0],
  [30, 40, 25, 5, 0],
  [19, 30, 40, 10, 1],
  [18, 25, 32, 22, 3],
  [15, 20, 25, 30, 10],
  [5, 10, 20, 40, 25],
  [3, 7, 15, 40, 35],
  [2, 5, 13, 35, 45],
];

/** cópias de cada campeão no pool compartilhado, por custo */
export const COPIAS_POR_CUSTO: Record<Custo, number> = { 1: 22, 2: 20, 3: 17, 4: 10, 5: 9 };
/** cópias de estrela 1 que uma unidade vale */
export const COPIAS_POR_ESTRELA: Record<Estrela, number> = { 1: 1, 2: 3, 3: 9 };

/** dano base da derrota por estágio (estágio 1 não tira vida; 7 em diante, 11). Com isto e metade do dano por
 *  sobrevivente, partidas de 8 bots vão até o estágio 6 ou 7 (~35 rodadas). */
export function danoBaseEstagio(estagio: number): number {
  if (estagio <= 1) return 0;
  return ([2, 3, 4, 6, 8] as const)[estagio - 2] ?? 11;
}

/** renda fixa do começo do planejamento a partir do 2-1 (era 5: o set tem muito mais campeões que o do gênero) */
export const RENDA_BASE = 6;
/** ouro por vitória contra jogador (era 1) */
export const OURO_VITORIA = 2;
/** bônus de sequência (vitórias ou derrotas seguidas): índice = tamanho da sequência, o último vale pra mais */
export const BONUS_SEQUENCIA: readonly number[] = [0, 0, 1, 2, 3, 4];
/** renda da 1-2 e da 1-3 */
export const RENDA_ESTAGIO_1 = 2;
/** juros: 1 de ouro a cada 10 guardados, até 5 */
export const JUROS_MAX = 5;

/** nomes dos 7 bots (os atributos dos Bakugan) */
export const NOMES_BOTS = ['Pyrus', 'Aquos', 'Haos', 'Darkus', 'Subterra', 'Ventus', 'Aurelus'] as const;
export const ID_HUMANO = 'voce';
export const ID_MONSTROS = 'monstros';
export const PREFIXO_FANTASMA = 'fantasma:';
