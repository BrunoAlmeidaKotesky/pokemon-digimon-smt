// Partida nova: 8 jogadores (você e 7 bots), 100 de vida, 1 de ouro, nível 1, pool cheio, um campeão de custo 1
// de graça pra cada um e a primeira loja. Começa no planejamento da 1-1.
import { S } from '../dados';
import type { Dificuldade, Jogador, Partida } from '../tipos';
import { ID_HUMANO, NOMES_BOTS, OURO_INICIAL, VAGAS_BANCO, VIDA_INICIAL } from './constantes';
import { montarRodada } from './luta';
import { darUnidade, poolCheio, sortearLoja } from './loja';
import { rngDa } from './sorteio';
import { casaPreferida, colocar, tirar } from './tabuleiro';

function jogadorNovo(id: string, nome: string, bot: boolean, avatar: string): Jogador {
  return {
    id, nome, bot, avatar, vida: VIDA_INICIAL, ouro: OURO_INICIAL, nivel: 1, xp: 0, unidades: {},
    banco: Array<number | null>(VAGAS_BANCO).fill(null), tabuleiro: {}, itens: [], loja: [], lojaTravada: false,
    sequencia: 0, almas: 0, ultimosAdversarios: [],
  };
}

export function novaPartida(semente: number, nomeHumano = 'Você', dificuldade: Dificuldade = 'normal'): Partida {
  const p: Partida = {
    versao: 1, semente: semente >>> 0, dificuldade, jogadores: [], voce: ID_HUMANO, estagio: 1, rodada: 1, tipo: 'monstros',
    fase: 'planejamento', pool: poolCheio(), confrontos: [], monstros: [], historico: {}, proximoUid: 1, sorteios: 0,
  };
  const rng = rngDa(p);
  const formas = Object.values(S().dados.formas).filter(f => !f.soUlt);
  const avatar = () => (formas.length ? formas[rng.int(formas.length)]!.img : '');
  p.jogadores = [
    jogadorNovo(ID_HUMANO, nomeHumano, false, avatar()),
    ...NOMES_BOTS.map(n => jogadorNovo(n.toLowerCase(), n, true, avatar())),
  ];
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
