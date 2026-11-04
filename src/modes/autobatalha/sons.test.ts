// Quando cada som toca: a comparação do jogador antes e depois de cada mudança (sons.ts).
import { describe, expect, it } from 'vitest';
import type { Estrela, Jogador, Unidade } from '../../autobatalha/tipos';
import { CUSTO_ATUALIZAR, CUSTO_XP } from '../../autobatalha/partida';
import { sonsDoJogador } from './sons';

const LOJA = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
function jog(m: Partial<Jogador> = {}): Jogador {
  return {
    id: 'voce', nome: 'Você', bot: false, avatar: '', vida: 100, ouro: 20, nivel: 3, xp: 0, unidades: {},
    banco: Array<number | null>(9).fill(null), tabuleiro: {}, itens: [], loja: [...LOJA], lojaTravada: false, sequencia: 0,
    almas: 0, ultimosAdversarios: [], ...m,
  };
}
const un = (uid: number, campeao: string, estrela: Estrela = 1, itens: string[] = []): Unidade => ({ uid, campeao, estrela, forma: campeao, itens });
const juntos = (...us: Unidade[]) => Object.fromEntries(us.map(u => [u.uid, u]));

describe('sons do jogador', () => {
  it('comprar, vender, atualizar e XP', () => {
    const a = jog();
    const comprou = jog({ ouro: 19, loja: [null, ...LOJA.slice(1)], unidades: juntos(un(1, 'a')), banco: [1, ...Array<null>(8).fill(null)] });
    expect(sonsDoJogador(a, comprou, true)).toEqual(['comprar']);
    const vendeu = jog({ ouro: 20, loja: comprou.loja });
    expect(sonsDoJogador(comprou, vendeu, true)).toEqual(['vender']);
    expect(sonsDoJogador(a, jog({ ouro: 20 - CUSTO_ATUALIZAR, loja: ['h', 'i', 'j', 'k', 'l', 'm', 'n'] }), true)).toEqual(['atualizar']);
    expect(sonsDoJogador(a, jog({ ouro: 20 - CUSTO_XP, xp: 4 }), true)).toEqual(['xp']);
    expect(sonsDoJogador(a, jog({ ouro: 20 - CUSTO_XP, nivel: 4, xp: 0 }), true)).toEqual(['nivel']);
  });

  it('a compra que fecha 3 cópias toca a evolução junto', () => {
    const a = jog({ unidades: juntos(un(1, 'x'), un(2, 'x')), banco: [1, 2, ...Array<null>(7).fill(null)] });
    const b = jog({ ouro: 19, loja: [null, ...LOJA.slice(1)], unidades: juntos(un(1, 'x', 2)), banco: [1, ...Array<null>(8).fill(null)] });
    expect(sonsDoJogador(a, b, true)).toEqual(['comprar', 'evoluir2']);
    const c = jog({ unidades: juntos(un(1, 'x', 3)) });
    expect(sonsDoJogador(b, c, false)).toContain('evoluir3');
  });

  it('juntar na bolsa, equipar, posicionar e recolher moeda', () => {
    const u = un(1, 'a');
    const a = jog({ unidades: juntos(u), banco: [1, ...Array<null>(8).fill(null)], itens: ['pyrus', 'aquos'] });
    expect(sonsDoJogador(a, { ...a, itens: ['pyrus+aquos'] }, true)).toEqual(['juntar']);
    expect(sonsDoJogador(a, { ...a, itens: ['aquos'], unidades: juntos(un(1, 'a', 1, ['pyrus'])) }, true)).toEqual(['equipar']);
    expect(sonsDoJogador(a, { ...a, banco: Array<null>(9).fill(null), tabuleiro: { '3,1': 1 } }, true)).toEqual(['posicionar']);
    const comMoeda = { ...a, moedas: [{ casa: { col: 1, lin: 1 }, valor: 2 }] };
    expect(sonsDoJogador(comMoeda, { ...a, ouro: 22 }, true)).toEqual(['moeda']);
  });

  it('a virada da rodada (renda, XP e loja nova) não toca nada além do nível', () => {
    const a = jog();
    expect(sonsDoJogador(a, jog({ ouro: 26, xp: 2, loja: ['h', 'i', 'j', 'k', 'l', 'm', 'n'] }), false)).toEqual([]);
    expect(sonsDoJogador(a, jog({ ouro: 26, nivel: 4 }), false)).toEqual(['nivel']);
  });
});
