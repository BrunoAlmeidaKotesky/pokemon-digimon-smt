// Partida da Autobatalha: loja, economia, rodadas, carrossel, bots e salvar. Lógica pura sobre o objeto Partida
// (muda ele no lugar). As ações devolvem a mensagem pro jogador quando não dá ("Ouro insuficiente") ou null quando
// deu certo.
// O controle (src/autobatalha/controle.ts) liga o motor (definirMotor), roda o relógio e chama isto; as ações do
// jogador passam por aplicarAcao (acao.ts), que confere a fase de cada uma.
import type { Onde, Partida } from '../tipos';
import { jogadorDe } from './consultas';
import { escolherForma } from './evolucao';
import { pegarDoCarrossel } from './carrossel';
import { equiparItem, juntarSoltos } from './itens';
import { atualizar, comprarVaga, comprarXpDe, travar, venderUnidade } from './loja';
import { moverUnidade } from './tabuleiro';

export * from './constantes';
export {
  avancarCarrossel, CUSTOS_DO_CARROSSEL, custosDoCarrossel, duracaoDoCarrossel, ESTAGIO_DO_ITEM_COMPLETO, foiLiberado,
  horarioDoGrupo, jaPegou, liberarProximoGrupo, montarCarrossel, OPCOES_DO_CARROSSEL, ordemDoCarrossel, podePegar,
  POR_GRUPO, PRIMEIRO_ESTAGIO_DO_CARROSSEL, S_ATE_A_PRIMEIRA, S_DEPOIS_DA_ULTIMA, S_ENTRE_DUPLAS, temCarrossel,
  terminarCarrossel, todosPegaram,
} from './carrossel';
export {
  chancesLoja, custoDe, ehFantasma, ehMonstros, ehStand, estaVivo, forca, humano, jogadorDe, limiteTabuleiro,
  ondeEsta, origemDe, rodadasDoEstagio, standDe, standsForaDaVaga, unidadesNoBanco, unidadesNoTabuleiro, valorVenda, vivos,
  xpParaProximo, donoDoFantasma,
} from './consultas';
export { bonusSequencia, danoDerrota, danoMonstros, juros, rendaDaRodada } from './economia';
export { formasDaEvolucao, verificarEvolucoes } from './evolucao';
export { ganharXp, poolCheio, sortearLoja } from './loja';
export {
  acabou, aplicarRodada, avancarRodada, eliminar, fimDoPlanejamento, montarTime, simularRodada, timeMonstros,
  type LutaDaRodada, type ResultadoRodada,
} from './luta';
export * from './origens';
export { casaNoChao, moedasProChao, pegarMoeda } from './moedas';
export { atributosChefe, atributosComum, gerarMonstros } from './monstros';
export { definirMotor, limparMotor, motorLigado, type MotorPartida, type TracoContado } from './motor';
export { limparNome, lugaresComHumanos, lugaresDaSala, nomeDoJogador, novaPartida, novaPartidaComHumanos } from './nova';
export { aplicarAcao, FASES_DE_JOGO, MSG_SO_PLANEJAMENTO, podeAgir } from './acao';
export { confrontosDaRodada, sortearConfrontos } from './rodadas';
export { apagarPartida, carregarPartida, CHAVE_PARTIDA, salvarPartida, temPartidaSalva } from './salvar';
export { jogarBot, jogarBots, nivelAlvo, perfilDa, PERFIS_BOT, type PerfilBot } from './bots';
export { arrumarStands, contaNoLimite, MSG_LIMITE, prepararTabuleiro } from './tabuleiro';
export { MSG_BANCO, MSG_OURO } from './loja';
export { limparVotos, prontos, todosProntos, votarBots, votarPronto } from './votacao';

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
/** Junta dois componentes dos itens soltos (o i solto em cima do k) no Bakugan completo, no lugar do k. */
export const juntarItens = (p: Partida, jid: string, i: number, k: number): string | null =>
  juntarSoltos(jogadorDe(p, jid), i, k);
export const escolherEvolucao = (p: Partida, jid: string, forma: string): string | null =>
  escolherForma(p, jogadorDe(p, jid), forma);
/** O jogador pega a opção i do carrossel (só depois de liberado, uma vez). */
export const pegarCarrossel = (p: Partida, jid: string, i: number): string | null => pegarDoCarrossel(p, jid, i);

/** Qual ult a unidade usa; Yu-Gi-Oh!: alterna ataque/defesa (acao.ts, junto das outras ações). */
export { alternarPosicao, escolherUlt } from './acao';
