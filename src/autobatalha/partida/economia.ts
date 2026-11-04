// Ouro (renda, juros, sequência) e dano da derrota.
import { JUROS_MAX, RENDA_BASE, RENDA_ESTAGIO_1, danoBaseEstagio } from './constantes';

/** 1 de ouro a cada 10 guardados, até 5. */
export const juros = (ouro: number): number => Math.min(JUROS_MAX, Math.floor(Math.max(0, ouro) / 10));

/** Bônus da sequência (de vitórias ou de derrotas): 2–3 seguidas +1, 4 +2, 5 ou mais +3. */
export function bonusSequencia(sequencia: number): number {
  const n = Math.abs(sequencia);
  if (n >= 5) return 3;
  if (n === 4) return 2;
  if (n >= 2) return 1;
  return 0;
}

/** Ouro do começo do planejamento da rodada (estagio-rodada), com o ouro e a sequência que o jogador tem.
 *  1-1: nada (começa com 1); 1-2 e 1-3: 2; do 2-1 em diante: 5 + juros + sequência. */
export function rendaDaRodada(estagio: number, rodada: number, ouro: number, sequencia: number): number {
  if (estagio <= 1) return rodada >= 2 ? RENDA_ESTAGIO_1 : 0;
  return RENDA_BASE + juros(ouro) + bonusSequencia(sequencia);
}

/** Sequência depois de uma luta contra jogador. */
export const novaSequencia = (sequencia: number, venceu: boolean): number =>
  venceu ? (sequencia > 0 ? sequencia + 1 : 1) : (sequencia < 0 ? sequencia - 1 : -1);

/** Dano da derrota contra jogador: base do estágio + metade (pra cima) de: 1 por inimigo vivo + 1 por estrela acima
 *  da 1ª desses vivos. */
export function danoDerrota(estagio: number, estrelasVivas: number[]): number {
  return danoBaseEstagio(estagio) + Math.ceil(estrelasVivas.reduce((s, e) => s + 1 + (e - 1), 0) / 2);
}
/** Dano da derrota contra monstros: só a base (estágio 1 não tira vida). */
export const danoMonstros = (estagio: number): number => danoBaseEstagio(estagio);
