import { describe, expect, it } from 'vitest';
import { avisos, campeoesDe, folga, metas, situacao } from './custos';
import type { LinhaEvo, Unidades } from './plano';

const L = (nome: string, ...niveis: string[][]): LinhaEvo => ({ id: `x:${nome}`, nome, niveis });

describe('custos', () => {
  it('metas: proporção do TFT, soma exata pelo maior resto', () => {
    expect(metas(65)).toEqual([14, 13, 14, 14, 10]);
    const m = metas(278);
    expect(m.reduce((a, x) => a + x, 0)).toBe(278);
    expect(metas(0)).toEqual([0, 0, 0, 0, 0]);
    expect(folga(60)).toBe(6);
    expect(folga(3)).toBe(1);
  });

  it('campeões: linha com alguém marcado vira um (custo da 1ª forma); marcado fora de linha é um', () => {
    const linhas = [L('Bulbasaur', ['Bulbasaur'], ['Ivysaur'], ['Venusaur']), L('Abra', ['Abra'], ['Kadabra'], ['Alakazam']), L('Orpheus', ['Orpheus', 'Orpheus F'], ['Messiah'])];
    const unidades: Unidades = { Ivysaur: { custo: 4 }, 'Orpheus F': { custo: 3 }, Pikachu: { custo: 1 } };
    const cs = campeoesDe(new Set(['Venusaur', 'Messiah', 'Pikachu', 'Mew']), linhas, unidades);
    // a linha do Abra não tem ninguém marcado; o custo do Ivysaur (2ª forma) não conta
    expect(cs).toEqual([
      { nome: 'Bulbasaur', custo: undefined },
      { nome: 'Orpheus', custo: 3 },
      { nome: 'Pikachu', custo: 1 },
      { nome: 'Mew', custo: undefined },
    ]);
  });

  it('situação e avisos: custo acima do limite, no total e na origem, com pra onde passar', () => {
    // 10 campeões: metas 2/2/2/2/2 (14/13/14/14/10 de 10, pelo maior resto), folga 1
    const cs = [1, 1, 1, 1, 2, 3, 4, undefined, undefined, undefined].map((custo, i) => ({ nome: `c${i}`, custo }));
    const s = situacao(cs);
    expect(s.total).toBe(10);
    expect(s.semCusto).toBe(3);
    expect(s.cotas.map(c => c.meta)).toEqual([2, 2, 2, 2, 2]);
    expect(s.cotas[0]).toEqual({ custo: 1, tem: 4, meta: 2, min: 1, max: 3 });
    const a = avisos(s, [{ k: 'pokemon', rotulo: 'Pokémon', s }]);
    expect(a[0]!.texto).toBe('Custo 1: 4 campeões, 1 acima do limite de 3 (meta 2).');
    expect(a[1]).toEqual({
      k: 'pokemon',
      texto: 'Pokémon: custo 1 com 4, limite 3 (meta 2). Dá pra passar pra custo 2 (1 de 2), custo 3 (1 de 2), custo 4 (1 de 2), custo 5 (0 de 2).',
    });
    expect(avisos(situacao([{ nome: 'a', custo: 1 }]), [])).toEqual([]);
  });
});
