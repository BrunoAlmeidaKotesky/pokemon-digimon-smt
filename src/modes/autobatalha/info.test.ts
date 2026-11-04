import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { definirSet } from '../../autobatalha/dados';
import type { SetDados } from '../../autobatalha/tipos';
import { campeoesComTraco } from './Info';

beforeAll(() => { definirSet(JSON.parse(readFileSync('public/autobatalha/set1.json', 'utf8')) as SetDados); });

describe('campeões de um traço', () => {
  it('na loja só quem já tem o traço na 1ª forma; quem ganha ao evoluir vem com a estrela e a forma', () => {
    const porradeiro = new Map(campeoesComTraco('porradeiro').map(x => [x.c.nome, x]));
    expect(porradeiro.get('Hammered Man')?.estrela).toBe(1);
    // Captain Kidd é Atirador; o Seiten Taisei (estrela 2 da linha do Ryuji) é que é Porradeiro
    expect(porradeiro.get('Captain Kidd')).toMatchObject({ estrela: 2, forma: 'persona:Seiten Taisei - P5' });
    expect(porradeiro.get('Chimchar')).toMatchObject({ estrela: 2, forma: 'pokemon:Monferno' });
    // quem nunca é Porradeiro não aparece
    expect(porradeiro.has('Squirtle')).toBe(false);
  });

  it('origem: todo campeão da franquia, já na loja; a ordem é estrela, custo e nome', () => {
    const lista = campeoesComTraco('deadlock');
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every(x => x.estrela === 1 && x.c.fr === 'deadlock')).toBe(true);
    const todos = campeoesComTraco('porradeiro');
    for (let i = 1; i < todos.length; i++) {
      const [a, b] = [todos[i - 1]!, todos[i]!];
      expect(a.estrela < b.estrela || (a.estrela === b.estrela && a.c.custo <= b.c.custo)).toBe(true);
    }
  });
});
