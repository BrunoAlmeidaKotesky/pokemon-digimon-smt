// Fumaça com o conteúdo de verdade (src/autobatalha/conteudo) no set de teste: as lutas rodam sem erro no conteúdo,
// com resultado coerente.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { Unidade } from '../tipos';
import { atributosDaUnidade, simularLuta } from './index';
import { em, monstro, time, unidade, usarSetTeste } from './test-helpers';

let erro: MockInstance;
beforeAll(usarSetTeste);
beforeEach(() => { erro = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  expect(erro).not.toHaveBeenCalled();
  erro.mockRestore();
});

const CAMPEOES = ['pokemon:brigao', 'overwatch:mira', 'smt:muralha', 'lol:ahri', 'deadlock:faca', 'pokemon:charizard', 'persona:raio', 'jojo:jotaro', 'pokemon:lerdo'];

describe('motor com o conteúdo de verdade', () => {
  it('lutas variadas rodam sem erro, com resultado coerente', () => {
    const tipos = new Map<string, number>();
    for (let s = 1; s <= 30; s++) {
      const montar = (dono: string, k: number) => {
        const us: Unidade[] = CAMPEOES.map((c, i) => unidade(c, ((i + k + s) % 3 + 1) as 1 | 2 | 3));
        const jotaro = us[7]!;
        const star = unidade('jojo:star-platinum', 2, { usuario: jotaro.uid });
        return time(dono, ...us.map((u, i) => em(u, i % 8, Math.floor(i / 8) + (i % 2) * 2)), em(star, 7, 3));
      };
      const r = simularLuta(montar('p1', 0), montar('p2', 1), s, s % 5 === 0);
      for (const e of r.gravacao?.eventos ?? []) tipos.set(e.tipo, (tipos.get(e.tipo) ?? 0) + 1);
      expect(['a', 'b', 'empate']).toContain(r.vencedor);
      expect(r.duracao).toBeGreaterThan(0);
      expect(r.duracao).toBeLessThanOrEqual(30);
      for (const q of r.gravacao?.quadros ?? []) {
        const casas = Object.values(q.u).filter(x => x[5] === 1).map(x => `${x[0]},${x[1]}`);
        expect(new Set(casas).size).toBe(casas.length);
      }
    }
    for (const t of ['ataque', 'dano', 'habilidade', 'morte', 'transformar', 'cura']) expect(tipos.get(t) ?? 0, t).toBeGreaterThan(0);
  });

  it('rodada de monstros com chefe', () => {
    const r = simularLuta(
      time('p1', em(unidade('pokemon:brigao', 2), 3, 0), em(unidade('overwatch:mira', 2), 3, 3)),
      time('monstros', monstro('m0', 3, 0, { vida: 1500, dano: 60, mana: 100 }, true), monstro('m1', 4, 0)),
      7, true,
    );
    expect(r.gravacao!.inicial.find(e => e.id === 'b:m0')).toMatchObject({ chefe: true, monstro: true, nome: 'Bahamut' });
  });

  it('atributosDaUnidade usa os itens do conteúdo', () => {
    const sem = atributosDaUnidade(unidade('pokemon:brigao', 2));
    const com = atributosDaUnidade(unidade('pokemon:brigao', 2, { itens: ['pyrus'] }));
    expect(com.dano).toBeGreaterThan(sem.dano);
  });
});
