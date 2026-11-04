// Partida nova: 8 jogadores (no solo, você e 7 bots; online, os humanos da sala e bots nas vagas que sobram), 100 de
// vida, 1 de ouro, nível 1, pool cheio, um campeão de custo 1 de graça pra cada um e a primeira loja. Começa no
// planejamento da 1-1.
//
// Antes da partida, o lobby mostra os 8 lugares como vão estar nela (lugaresDaSala, lugaresComHumanos): o nome, o
// ícone e o estilo de tabuleiro escolhidos por cada humano e, dos bots, o ícone e o estilo sorteados com a semente da
// próxima partida. Os humanos ficam nos primeiros lugares, então o solo (um humano) sorteia igual a sempre.
import { S } from '../dados';
import { ESTILOS_TABULEIRO, estiloOuPadrao } from '../estilos';
import { criarRng, type Rng } from '../rng';
import type { Dificuldade, EscolhasJogador, HumanoSala, Jogador, LugarSala, Partida } from '../tipos';
import { ID_HUMANO, JOGADORES, MAX_NOME, NOME_PADRAO, NOMES_BOTS, OURO_INICIAL, VAGAS_BANCO, VIDA_INICIAL } from './constantes';
import { montarRodada } from './luta';
import { darUnidade, poolCheio, sortearLoja } from './loja';
import { misturar, rngDa, rngDoSorteio } from './sorteio';
import { casaPreferida, colocar, tirar } from './tabuleiro';

/** sal do gerador dos estilos dos bots: à parte do contador da partida, pra não mudar o resto dos sorteios */
const SAL_ESTILOS = 0x7ab1e5;

/** Nome escolhido sem espaços sobrando e no tamanho máximo ('' fica ''). */
export const limparNome = (nome: unknown): string =>
  typeof nome === 'string' ? nome.replace(/\s+/g, ' ').trim().slice(0, MAX_NOME).trim() : '';
/** O nome que vai pra partida: o escolhido ou o padrão. */
export const nomeDoJogador = (nome: unknown, padrao: string = NOME_PADRAO): string => limparNome(nome) || padrao;

/** Imagem da forma escolhida como ícone (null se não escolheu ou se a forma não existe mais no set). */
function imgDoIcone(forma: string | null | undefined): string | null {
  return forma && S().temForma(forma) ? S().forma(forma).img : null;
}

/** Um ícone sorteado pra cada um dos 8 lugares (o 1º humano primeiro), no primeiro sorteio da partida: o mesmo
 *  gerador segue pro campeão de graça e pra loja, como sempre foi. */
function sortearIcones(rng: Rng): string[] {
  const formas = Object.values(S().dados.formas).filter(f => !f.soUlt);
  return Array.from({ length: JOGADORES }, () => (formas.length ? formas[rng.int(formas.length)]!.img : ''));
}

/** Um estilo de tabuleiro sorteado pra cada lugar (os dos humanos ficam sem uso: eles escolhem). */
function sortearEstilos(semente: number): string[] {
  const rng = criarRng(misturar(semente >>> 0, SAL_ESTILOS));
  return Array.from({ length: JOGADORES }, () => ESTILOS_TABULEIRO[rng.int(ESTILOS_TABULEIRO.length)]!.id);
}

/** Os humanos (até 8, na ordem dada) e bots nas vagas que sobram. O lugar k usa o ícone e o estilo sorteados k. */
function montarLugares(semente: number, icones: readonly string[], humanos: readonly HumanoSala[]): LugarSala[] {
  const estilos = sortearEstilos(semente);
  const hs = humanos.slice(0, JOGADORES);
  const lugares = hs.map((h, k): LugarSala => {
    const l: LugarSala = {
      id: h.id, nome: nomeDoJogador(h.escolhas.nome, h.nomePadrao), bot: false, anfitriao: h.anfitriao ?? k === 0,
      avatar: imgDoIcone(h.escolhas.avatar) ?? icones[k] ?? '', estilo: estiloOuPadrao(h.escolhas.estilo),
    };
    if (h.conectado !== undefined) l.conectado = h.conectado;
    return l;
  });
  const bots = NOMES_BOTS.slice(0, JOGADORES - hs.length).map((n, i): LugarSala => {
    const k = hs.length + i;
    return { id: n.toLowerCase(), nome: n, bot: true, anfitriao: false, avatar: icones[k] ?? '', estilo: estilos[k]! };
  });
  return [...lugares, ...bots];
}

/** Os 8 lugares da partida da semente, como o lobby mostra antes de começar (iguais aos jogadores de novaPartida). */
export function lugaresDaSala(semente: number, escolhas: Partial<EscolhasJogador> = {}): LugarSala[] {
  return lugaresComHumanos(semente, [{ id: ID_HUMANO, escolhas, anfitriao: true }]);
}

/** Os 8 lugares com vários humanos (sala online), iguais aos jogadores de novaPartidaComHumanos. */
export function lugaresComHumanos(semente: number, humanos: readonly HumanoSala[]): LugarSala[] {
  return montarLugares(semente >>> 0, sortearIcones(rngDoSorteio(semente, 1)), humanos);
}

function jogadorNovo(l: LugarSala): Jogador {
  return {
    id: l.id, nome: l.nome, bot: l.bot, avatar: l.avatar, estilo: l.estilo, vida: VIDA_INICIAL, ouro: OURO_INICIAL, nivel: 1, xp: 0,
    unidades: {}, banco: Array<number | null>(VAGAS_BANCO).fill(null), tabuleiro: {}, itens: [], loja: [], lojaTravada: false,
    sequencia: 0, almas: 0, ultimosAdversarios: [],
  };
}

/** Partida nova. `escolhas` = o que o humano escolheu no lobby (nome, ícone, estilo do tabuleiro); os bots sorteiam
 *  ícone e estilo. */
export function novaPartida(semente: number, escolhas: Partial<EscolhasJogador> = {}, dificuldade: Dificuldade = 'normal'): Partida {
  return novaPartidaComHumanos(semente, [{ id: ID_HUMANO, escolhas, anfitriao: true }], dificuldade, ID_HUMANO);
}

/** Partida nova com vários humanos (sala online): os humanos nos primeiros lugares, bots no resto. `voce` = o humano
 *  desta tela (no online, o anfitrião, que roda a partida). */
export function novaPartidaComHumanos(
  semente: number, humanos: readonly HumanoSala[], dificuldade: Dificuldade = 'normal', voce: string = humanos[0]?.id ?? ID_HUMANO,
): Partida {
  const p: Partida = {
    versao: 1, semente: semente >>> 0, dificuldade, jogadores: [], voce, estagio: 1, rodada: 1, tipo: 'monstros',
    fase: 'planejamento', pool: poolCheio(), confrontos: [], monstros: [], historico: {}, proximoUid: 1, sorteios: 0,
  };
  // o 1º sorteio (o mesmo de lugaresDaSala): ícones, e depois o campeão de graça e a loja
  const rng = rngDa(p);
  p.jogadores = montarLugares(p.semente, sortearIcones(rng), humanos).map(jogadorNovo);
  for (const j of p.jogadores) p.historico[j.id] = [];
  // campeão de custo 1 de graça (sem Stand: sozinho no tabuleiro ele não teria usuário), já no tabuleiro
  const gratis = S().porCusto[1].filter(c => !c.stand);
  for (const j of p.jogadores) {
    const c = rng.pesado(gratis, x => p.pool[x.id] ?? 0);
    if (!c || !darUnidade(p, j, c.id, rng)) continue;
    const u = Object.values(j.unidades)[0]!;
    const casa = casaPreferida(j, u);
    if (casa) { tirar(j, u.uid); colocar(j, u.uid, { tipo: 'tabuleiro', casa }); }
  }
  for (const j of p.jogadores) sortearLoja(p, j, rng);
  montarRodada(p, rng);
  return p;
}
