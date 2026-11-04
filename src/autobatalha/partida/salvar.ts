// Partida salva no localStorage (`pdx-autobatalha-v1`), em JSON, sem a gravação da luta (que é grande e a tela não
// precisa depois). Versão errada ou JSON quebrado: ignora. Sem localStorage (modo privado, testes): não faz nada.
import type { Partida } from '../tipos';

export const CHAVE_PARTIDA = 'pdx-autobatalha-v1';

function armazenamento(): Storage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function salvarPartida(p: Partida): void {
  try {
    const { ultimaLuta, ...resto } = p;
    const copia: Partida = ultimaLuta ? { ...resto, ultimaLuta: { ...ultimaLuta, gravacao: undefined } } : resto;
    armazenamento()?.setItem(CHAVE_PARTIDA, JSON.stringify(copia));
  } catch { /* cheio ou bloqueado: segue sem salvar */ }
}

/** Confere o mínimo pra não carregar lixo. */
function pareceUmaPartida(x: unknown): x is Partida {
  if (!x || typeof x !== 'object') return false;
  const p = x as Partial<Partida>;
  return p.versao === 1 && typeof p.semente === 'number' && Array.isArray(p.jogadores) && p.jogadores.length > 0 &&
    typeof p.voce === 'string' && typeof p.estagio === 'number' && typeof p.rodada === 'number' &&
    !!p.pool && typeof p.pool === 'object' && p.jogadores.every(j => j && typeof j.id === 'string' &&
      Array.isArray(j.banco) && !!j.tabuleiro && !!j.unidades && Array.isArray(j.loja));
}

export function carregarPartida(): Partida | null {
  try {
    const texto = armazenamento()?.getItem(CHAVE_PARTIDA);
    if (!texto) return null;
    const p: unknown = JSON.parse(texto);
    return pareceUmaPartida(p) ? p : null;
  } catch { return null; }
}

export function apagarPartida(): void {
  try { armazenamento()?.removeItem(CHAVE_PARTIDA); } catch { /* nada */ }
}

export const temPartidaSalva = (): boolean => carregarPartida() != null;
