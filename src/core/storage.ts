// localStorage com tolerância a falhas: sem armazenamento (modo privado, Node) ou JSON inválido não quebram nada.

export const STATS_KEY = 'pdx-stats';
export const BAGS_KEY = 'pdx-bags';
export const YGO_KEY = 'pdx-ygo-v1';

/** JSON.parse do valor guardado; null se não existir, se for inválido ou se não houver localStorage. */
export function readJSON<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) as string) as T;
  } catch {
    return null;
  }
}

/** Guarda o valor como JSON; ignora qualquer erro (cota, modo privado, sem localStorage). */
export function writeJSON(key: string, v: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* sem armazenamento: segue sem salvar */
  }
}
