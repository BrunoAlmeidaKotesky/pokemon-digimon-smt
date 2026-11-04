// Confrontos de cada rodada: monstros (todos contra os mesmos monstros) ou jogadores (sorteio entre os vivos
// evitando os 2 últimos adversários; número ímpar = um enfrenta o fantasma de outro).
import type { Rng } from '../rng';
import type { Jogador, Partida, TipoRodada } from '../tipos';
import { ID_MONSTROS, PREFIXO_FANTASMA } from './constantes';
import { vivos } from './consultas';

/** quantos adversários recentes evitar */
export const EVITAR_ULTIMOS = 2;

const recentes = (j: Jogador) => j.ultimosAdversarios.slice(-EVITAR_ULTIMOS);

interface Emparelhamento { pares: [string, string][]; penalidade: number }

/** Todos os jeitos de juntar os jogadores em pares (n par), na ordem dada. */
function* pareamentos(ids: string[]): Generator<[string, string][]> {
  if (!ids.length) { yield []; return; }
  const [a, ...resto] = ids;
  for (let i = 0; i < resto.length; i++) {
    const b = resto[i]!;
    const sobra = [...resto.slice(0, i), ...resto.slice(i + 1)];
    for (const outros of pareamentos(sobra)) yield [[a!, b], ...outros];
  }
}

/** Sorteia os confrontos contra jogadores. O humano desta tela (p.voce, se vivo) fica sempre no lado A; online, humano
 *  contra bot também fica no A (o convidado no lado B vê a luta espelhada, online/visao.ts). */
export function sortearConfrontos(p: Partida, rng: Rng): [string, string][] {
  const vs = vivos(p);
  if (vs.length < 2) return [];
  const porId = new Map(vs.map(j => [j.id, j]));
  const ruim = (a: string, b: string) =>
    (recentes(porId.get(a)!).includes(b) ? 1 : 0) + (recentes(porId.get(b)!).includes(a) ? 1 : 0);
  const ordem = rng.sortear(vs.map(j => j.id), vs.length);
  let melhor: Emparelhamento | null = null;
  // número ímpar: cada um pode ser quem enfrenta o fantasma, de cada outro vivo
  const sozinhos = ordem.length % 2 ? ordem : [null];
  for (const so of sozinhos) {
    const resto = so == null ? ordem : ordem.filter(x => x !== so);
    const fantasmas = so == null ? [null] : rng.sortear(resto, resto.length);
    for (const f of fantasmas) {
      for (const pares of pareamentos(resto)) {
        let pen = pares.reduce((s, [a, b]) => s + ruim(a, b), 0);
        if (so != null && f != null) pen += ruim(so, f);
        if (!melhor || pen < melhor.penalidade) {
          const todos: [string, string][] = so != null && f != null ? [...pares, [so, `${PREFIXO_FANTASMA}${f}`]] : pares;
          melhor = { pares: todos, penalidade: pen };
          if (pen === 0) break;
        }
      }
      if (melhor?.penalidade === 0) break;
    }
    if (melhor?.penalidade === 0) break;
  }
  // o humano sempre no lado A
  const humanoAqui = (id: string) => porId.get(id)?.bot === false;
  const trocar = (a: string, b: string) => b === p.voce || (humanoAqui(b) && !humanoAqui(a) && a !== p.voce);
  return melhor!.pares.map(([a, b]) => (trocar(a, b) ? [b, a] : [a, b]) as [string, string]);
}

/** Confrontos da rodada pelo tipo. */
export function confrontosDaRodada(p: Partida, tipo: TipoRodada, rng: Rng): [string, string][] {
  if (tipo === 'pvp') return sortearConfrontos(p, rng);
  return vivos(p).map(j => [j.id, ID_MONSTROS] as [string, string]);
}
