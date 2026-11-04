// Ações de um jogador sobre o próprio Jogador (comprar, vender, mover, equipar, votar pronto...), num lugar só: a tela
// do solo e do anfitrião chama com o id de quem joga ali, e o anfitrião online chama com o id do convidado que mandou a
// ação (o id vem da conexão, não da mensagem: ninguém mexe no Jogador dos outros). Aqui se confere a fase de cada ação;
// as funções de cada parte (loja, tabuleiro, itens...) conferem o resto (ouro, unidade que existe, casa válida).
import { S } from '../dados';
import type { AcaoJogador, Fase, Partida } from '../tipos';
import { pegarDoCarrossel } from './carrossel';
import { estaVivo, jogadorDe, ondeEsta, origemDe } from './consultas';
import { escolherForma } from './evolucao';
import { equiparItem, juntarSoltos } from './itens';
import { atualizar, comprarVaga, comprarXpDe, travar, venderUnidade } from './loja';
import { pegarMoeda } from './moedas';
import { moverUnidade } from './tabuleiro';
import { votarPronto } from './votacao';

/** fases em que o jogador mexe na loja, no banco e nos itens (o tabuleiro, só no planejamento) */
export const FASES_DE_JOGO: readonly Fase[] = ['carrossel', 'planejamento', 'luta', 'resultado'];
export const MSG_SO_PLANEJAMENTO = 'O tabuleiro só muda no planejamento';

/** Fases em que a ação vale: o carrossel só no carrossel, o voto só no planejamento, o resto nas fases de jogo. */
function fasesDa(a: AcaoJogador): readonly Fase[] {
  if (a.tipo === 'carrossel') return ['carrossel'];
  if (a.tipo === 'pronto') return ['planejamento'];
  return FASES_DE_JOGO;
}

/** A ação vale agora: o jogador existe, é humano, está vivo e a fase é a da ação. */
export function podeAgir(p: Partida, jid: string, a: AcaoJogador): boolean {
  const j = p.jogadores.find(x => x.id === jid);
  return !!j && !j.bot && estaVivo(j) && fasesDa(a).includes(p.fase);
}

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

/**
 * Aplica a ação do jogador `jid` no próprio Jogador. Devolve a mensagem pra ele quando não dá ("Ouro insuficiente") ou
 * null. Ação fora da fase dela, de bot, de eliminado ou de jogador que não existe é ignorada (null), como a tela que
 * nem mostra o botão nessa hora.
 */
export function aplicarAcao(p: Partida, jid: string, a: AcaoJogador): string | null {
  const j = p.jogadores.find(x => x.id === jid);
  if (!j || !podeAgir(p, jid, a)) return null;
  switch (a.tipo) {
    case 'comprar': return comprarVaga(p, j, a.i);
    case 'vender': return venderUnidade(p, j, a.uid);
    case 'atualizar': return atualizar(p, j);
    case 'xp': return comprarXpDe(j);
    case 'travar': travar(j); return null;
    case 'mover': {
      const mexeNoTabuleiro = a.para.tipo === 'tabuleiro' || ondeEsta(j, a.uid)?.tipo === 'tabuleiro';
      if (mexeNoTabuleiro && p.fase !== 'planejamento') return MSG_SO_PLANEJAMENTO;
      return moverUnidade(j, a.uid, a.para);
    }
    case 'equipar': return equiparItem(j, a.i, a.uid);
    case 'juntar': return juntarSoltos(j, a.i, a.k);
    case 'evolucao': return escolherForma(p, j, a.forma);
    case 'carrossel': return pegarDoCarrossel(p, jid, a.i);
    // recolhe passando o mouse: moeda que já sumiu não vira aviso
    case 'moeda': pegarMoeda(p, jid, a.i); return null;
    case 'ult': return escolherUlt(p, jid, a.uid, a.ult);
    case 'posicao': return alternarPosicao(p, jid, a.uid);
    case 'pronto': votarPronto(p, jid, a.valor); return null;
  }
}
