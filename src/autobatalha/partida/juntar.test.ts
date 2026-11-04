// Juntar dois componentes nos itens soltos (arrastar um sobre o outro na tela): vira o Bakugan completo.
import { beforeEach, describe, expect, it } from 'vitest';
import { humano, juntarItens, novaPartida } from './index';
import { limpar, prepararTeste } from './test-helpers';

beforeEach(() => prepararTeste());

function cenario(itens: string[]) {
  const p = novaPartida(3);
  const eu = humano(p);
  limpar(eu);
  eu.itens = [...itens];
  return { p, eu };
}

describe('juntar itens soltos', () => {
  it('componente sobre componente vira o completo no lugar do de baixo (ordem de COMPONENTES no id)', () => {
    const { p, eu } = cenario(['ventus', 'haos', 'pyrus']);
    expect(juntarItens(p, eu.id, 2, 0)).toBeNull();
    expect(eu.itens).toEqual(['pyrus+ventus', 'haos']);
    expect(juntarItens(p, eu.id, 1, 0)).toMatch(/dois componentes/);
    expect(eu.itens).toEqual(['pyrus+ventus', 'haos']);
  });

  it('o i some e o k vira o completo, nas duas direções', () => {
    const { p, eu } = cenario(['aquos', 'darkus', 'subterra', 'aquos']);
    expect(juntarItens(p, eu.id, 0, 3)).toBeNull();
    expect(eu.itens).toEqual(['darkus', 'subterra', 'aquos+aquos']);
    expect(juntarItens(p, eu.id, 1, 0)).toBeNull();
    expect(eu.itens).toEqual(['darkus+subterra', 'aquos+aquos']);
  });

  it('completo, a mesma posição ou posição fora da lista não juntam', () => {
    const { p, eu } = cenario(['pyrus', 'haos+darkus', 'aurelus']);
    expect(juntarItens(p, eu.id, 0, 1)).toMatch(/dois componentes/);
    expect(juntarItens(p, eu.id, 0, 0)).toMatch(/não encontrado/);
    expect(juntarItens(p, eu.id, 0, 9)).toMatch(/não encontrado/);
    expect(eu.itens).toEqual(['pyrus', 'haos+darkus', 'aurelus']);
  });
});
