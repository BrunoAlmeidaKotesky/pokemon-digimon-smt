// Ouro no chão: alguns campeões derrubam moedas na luta (Contexto.moeda). Pro humano, as moedas do lado dele viram
// ouro caído na metade dele do tabuleiro (Jogador.moedas), que só entra no ouro quando ele passa o mouse em cima;
// pros bots, o ouro entra direto.
import { COLUNAS, LINHAS_DONO, type Casa, type CasaDono, type Jogador, type Lado, type Partida, type ResultadoLuta } from '../tipos';
import { jogadorDe } from './consultas';

/** Casa da luta → casa na metade do dono. Moeda que cai na metade do adversário vai pra linha da frente dele. */
export function casaNoChao(c: Casa, lado: Lado): CasaDono {
  const naMetade = lado === 'a'
    ? { col: c.col, lin: c.lin - LINHAS_DONO }
    : { col: COLUNAS - 1 - c.col, lin: LINHAS_DONO - 1 - c.lin };
  return { col: Math.min(COLUNAS - 1, Math.max(0, naMetade.col)), lin: Math.min(LINHAS_DONO - 1, Math.max(0, naMetade.lin)) };
}

/** Põe no chão do jogador as moedas que o lado dele derrubou; devolve quanto ouro foi pro chão (sai do ouro direto). */
export function moedasProChao(j: Jogador, res: ResultadoLuta, lado: Lado): number {
  let total = 0;
  for (const m of res.moedas ?? []) {
    if (m.lado !== lado || m.valor <= 0) continue;
    (j.moedas ??= []).push({ casa: casaNoChao(m.casa, lado), valor: m.valor });
    total += m.valor;
  }
  return total;
}

/** Recolhe a moeda i do chão. */
export function pegarMoeda(p: Partida, jid: string, i: number): string | null {
  const j = jogadorDe(p, jid);
  const m = j.moedas?.[i];
  if (!m) return 'Essa moeda não está mais aí';
  j.ouro += m.valor;
  j.moedas!.splice(i, 1);
  if (!j.moedas!.length) j.moedas = undefined;
  return null;
}
