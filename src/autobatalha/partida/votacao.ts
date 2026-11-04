// Votação do "Pronto" no planejamento: cada jogador vivo vota que está pronto (Jogador.pronto) e, quando todos votam,
// o planejamento acaba na hora, sem esperar o relógio. Os bots votam assim que terminam o planejamento deles (no solo,
// logo no começo, então o voto do humano fecha a votação). Dá pra desfazer o voto enquanto o planejamento corre.
//
// O voto fica na Partida (e não só na tela) porque no modo online cada um vota da sua tela. Humano fora do ar
// (Jogador.ausente) vota como bot, pra não travar os outros. Os votos valem só no planejamento: fimDoPlanejamento
// limpa todos.
import type { Jogador, Partida } from '../tipos';
import { estaVivo, jogadorDe, vivos } from './consultas';

/** O jogador vivo, no planejamento, vota pronto (`voto` true), desfaz o voto (false) ou alterna (sem `voto`).
 *  Devolve o voto que ficou; fora do planejamento ou eliminado, não muda nada. */
export function votarPronto(p: Partida, jid: string, voto?: boolean): boolean {
  const j = jogadorDe(p, jid);
  if (p.fase !== 'planejamento' || !estaVivo(j)) return !!j.pronto;
  const novo = voto ?? !j.pronto;
  if (novo) j.pronto = true;
  else delete j.pronto;
  return novo;
}

/** Os bots vivos (e os humanos fora do ar, que um bot joga por eles) votam pronto (chamado depois de eles jogarem o
 *  planejamento). */
export function votarBots(p: Partida): void {
  if (p.fase !== 'planejamento') return;
  for (const j of vivos(p)) if (j.bot || j.ausente) j.pronto = true;
}

/** Jogadores vivos que já votaram pronto. */
export const prontos = (p: Partida): Jogador[] => vivos(p).filter(j => j.pronto);

/** Todos os vivos votaram: o planejamento pode acabar. */
export function todosProntos(p: Partida): boolean {
  const vs = vivos(p);
  return vs.length > 0 && vs.every(j => j.pronto);
}

/** Apaga os votos (fim do planejamento). */
export function limparVotos(p: Partida): void {
  for (const j of p.jogadores) delete j.pronto;
}
