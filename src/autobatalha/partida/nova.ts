// Partida nova: 8 jogadores (você e 7 bots), 100 de vida, 1 de ouro, nível 1, pool cheio, um campeão de custo 1
// de graça pra cada um e a primeira loja. Começa no planejamento da 1-1.
//
// Antes da partida, o lobby mostra os 8 lugares como vão estar nela (lugaresDaSala): o seu nome, ícone e estilo de
// tabuleiro escolhidos e, dos bots, o ícone e o estilo sorteados com a semente da próxima partida.
import { S } from '../dados';
import { ESTILOS_TABULEIRO, estiloOuPadrao } from '../estilos';
import { criarRng, type Rng } from '../rng';
import type { Dificuldade, EscolhasJogador, Jogador, LugarSala, Partida } from '../tipos';
import { ID_HUMANO, MAX_NOME, NOME_PADRAO, NOMES_BOTS, OURO_INICIAL, VAGAS_BANCO, VIDA_INICIAL } from './constantes';
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
export const nomeDoJogador = (nome: unknown): string => limparNome(nome) || NOME_PADRAO;

/** Imagem da forma escolhida como ícone (null se não escolheu ou se a forma não existe mais no set). */
function imgDoIcone(forma: string | null | undefined): string | null {
  return forma && S().temForma(forma) ? S().forma(forma).img : null;
}

/** Um ícone sorteado pra cada um dos 8 lugares (você primeiro), no primeiro sorteio da partida: o mesmo gerador segue
 *  pro campeão de graça e pra loja, como sempre foi. */
function sortearIcones(rng: Rng): string[] {
  const formas = Object.values(S().dados.formas).filter(f => !f.soUlt);
  return Array.from({ length: 1 + NOMES_BOTS.length }, () => (formas.length ? formas[rng.int(formas.length)]!.img : ''));
}

/** Um estilo de tabuleiro sorteado pra cada lugar (o primeiro, o seu, fica sem uso: você escolhe). */
function sortearEstilos(semente: number): string[] {
  const rng = criarRng(misturar(semente >>> 0, SAL_ESTILOS));
  return Array.from({ length: 1 + NOMES_BOTS.length }, () => ESTILOS_TABULEIRO[rng.int(ESTILOS_TABULEIRO.length)]!.id);
}

function montarLugares(semente: number, icones: readonly string[], escolhas: Partial<EscolhasJogador>): LugarSala[] {
  const estilos = sortearEstilos(semente);
  return [
    {
      id: ID_HUMANO, nome: nomeDoJogador(escolhas.nome), bot: false, anfitriao: true,
      avatar: imgDoIcone(escolhas.avatar) ?? icones[0] ?? '', estilo: estiloOuPadrao(escolhas.estilo),
    },
    ...NOMES_BOTS.map((n, i): LugarSala => ({
      id: n.toLowerCase(), nome: n, bot: true, anfitriao: false, avatar: icones[i + 1] ?? '', estilo: estilos[i + 1]!,
    })),
  ];
}

/** Os 8 lugares da partida da semente, como o lobby mostra antes de começar (iguais aos jogadores de novaPartida). */
export function lugaresDaSala(semente: number, escolhas: Partial<EscolhasJogador> = {}): LugarSala[] {
  return montarLugares(semente >>> 0, sortearIcones(rngDoSorteio(semente, 1)), escolhas);
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
  const p: Partida = {
    versao: 1, semente: semente >>> 0, dificuldade, jogadores: [], voce: ID_HUMANO, estagio: 1, rodada: 1, tipo: 'monstros',
    fase: 'planejamento', pool: poolCheio(), confrontos: [], monstros: [], historico: {}, proximoUid: 1, sorteios: 0,
  };
  // o 1º sorteio (o mesmo de lugaresDaSala): ícones, e depois o campeão de graça e a loja
  const rng = rngDa(p);
  p.jogadores = montarLugares(p.semente, sortearIcones(rng), escolhas).map(jogadorNovo);
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
