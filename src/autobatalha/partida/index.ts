// Partida da Autobatalha: loja, economia, rodadas, bots e salvar. Lógica pura sobre o objeto Partida (muda ele no
// lugar). As ações devolvem a mensagem pro jogador quando não dá ("Ouro insuficiente") ou null quando deu certo.
// O controle (src/autobatalha/controle.ts) liga o motor (definirMotor), roda o relógio e chama isto.
import type { Componente, Onde, Partida } from '../tipos';
import { S } from '../dados';
import { jogadorDe, origemDe } from './consultas';
import { escolherForma } from './evolucao';
import { equiparItem, escolherPresenteDe } from './itens';
import { atualizar, comprarVaga, comprarXpDe, travar, venderUnidade } from './loja';
import { moverUnidade } from './tabuleiro';

export * from './constantes';
export {
  chancesLoja, custoDe, ehFantasma, ehMonstros, ehStand, estaVivo, forca, humano, jogadorDe, limiteTabuleiro,
  ondeEsta, origemDe, rodadasDoEstagio, standDe, unidadesNoBanco, unidadesNoTabuleiro, valorVenda, vivos,
  xpParaProximo, donoDoFantasma,
} from './consultas';
export { bonusSequencia, danoDerrota, danoMonstros, juros, rendaDaRodada } from './economia';
export { formasDaEvolucao, verificarEvolucoes } from './evolucao';
export { ganharXp, poolCheio, sortearLoja } from './loja';
export {
  acabou, aplicarRodada, avancarRodada, eliminar, fimDoPlanejamento, montarTime, simularRodada, timeMonstros,
  BONUS_OVERWATCH, CHANCE_SUJIMON, type LutaDaRodada, type ResultadoRodada,
} from './luta';
export { atributosChefe, atributosComum, gerarMonstros } from './monstros';
export { definirMotor, limparMotor, motorLigado, type MotorPartida, type TracoContado } from './motor';
export { novaPartida } from './nova';
export { confrontosDaRodada, sortearConfrontos } from './rodadas';
export { apagarPartida, carregarPartida, CHAVE_PARTIDA, salvarPartida, temPartidaSalva } from './salvar';
export { jogarBot, jogarBots, nivelAlvo } from './bots';
export { arrumarStands, contaNoLimite, MSG_LIMITE, prepararTabuleiro } from './tabuleiro';
export { MSG_BANCO, MSG_OURO } from './loja';

// ---------- ações de um jogador (a tela usa com o id do humano) ----------

export const comprar = (p: Partida, jid: string, i: number): string | null => comprarVaga(p, jogadorDe(p, jid), i);
export const vender = (p: Partida, jid: string, uid: number): string | null => venderUnidade(p, jogadorDe(p, jid), uid);
export const atualizarLoja = (p: Partida, jid: string): string | null => atualizar(p, jogadorDe(p, jid));
export const comprarXp = (p: Partida, jid: string): string | null => comprarXpDe(jogadorDe(p, jid));
export const travarLoja = (p: Partida, jid: string): void => travar(jogadorDe(p, jid));
export const mover = (p: Partida, jid: string, uid: number, para: Onde): string | null =>
  moverUnidade(jogadorDe(p, jid), uid, para);
export const equipar = (p: Partida, jid: string, i: number, uid: number): string | null =>
  equiparItem(jogadorDe(p, jid), i, uid);
export const escolherEvolucao = (p: Partida, jid: string, forma: string): string | null =>
  escolherForma(p, jogadorDe(p, jid), forma);
export const escolherPresente = (p: Partida, jid: string, c: Componente): string | null =>
  escolherPresenteDe(jogadorDe(p, jid), c);

/** Qual ult a unidade usa (id de classe da forma ou de forma de transformação). */
export function escolherUlt(p: Partida, jid: string, uid: number, ult: string): string | null {
  const u = jogadorDe(p, jid).unidades[uid];
  if (!u) return 'Unidade não encontrada';
  const f = S().forma(u.forma);
  if (!f.classes.includes(ult) && !(f.transforma ?? []).includes(ult)) return 'Essa ult não é desta forma';
  u.ult = ult;
  return null;
}

/** Yu-Gi-Oh!: alterna ataque/defesa. */
export function alternarPosicao(p: Partida, jid: string, uid: number): string | null {
  const u = jogadorDe(p, jid).unidades[uid];
  if (!u) return 'Unidade não encontrada';
  if (origemDe(u) !== 'ygo') return 'Só as cartas do Yu-Gi-Oh! têm posição';
  u.posicao = u.posicao === 'defesa' ? 'ataque' : 'defesa';
  return null;
}
