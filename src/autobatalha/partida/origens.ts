// Números das origens que agem fora da luta (Overwatch, Deadlock, Sujimon), um valor por degrau do traço (o índice
// vem de contarTracos: 0 = primeiro degrau). Os textos ficam em conteudo/tracos.ts e têm de bater com estes números.

/** valor do degrau (o último se o degrau passar do fim; 0 se inativo) */
export function porDegrau(valores: readonly number[], degrau: number): number {
  if (degrau < 0 || !valores.length) return 0;
  return valores[Math.min(degrau, valores.length - 1)]!;
}

/** Overwatch: bônus permanente de vida e dano pro herói que mais causou dano na luta. */
export const BONUS_OVERWATCH = [0.03, 0.05, 0.08] as const;
/** Deadlock: vida e dano por 10 almas juntadas; cada 10 almas = +1 de ouro. */
export const BONUS_DEADLOCK_POR_10_ALMAS = [0.02, 0.03, 0.04] as const;
/** Deadlock: almas por abate de herói do Deadlock. */
export const ALMAS_POR_ABATE = [1, 1, 2] as const;
/** Sujimon: chance de recrutar depois de vencer monstros. */
export const CHANCE_SUJIMON = [0, 0.5, 1] as const;
export const CUSTO_MAX_SUJIMON = 3;
