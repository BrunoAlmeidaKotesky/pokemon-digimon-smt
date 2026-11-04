// Funções puras do playtest (medidas.ts): estatística, bisseção do equivalente, faixas e texto do relatório.
import { describe, expect, it } from 'vitest';
import {
  MARCADOR_HISTORICO, equivalente, foraDaFaixa, foraDaMediana, juntarComHistorico, media, mediana, num, pct,
  placarVazio, quantil, semente, somarLuta, tabela, taxa, wilson,
} from './medidas';

describe('placar', () => {
  it('empate vale meia vitória; sem lutas, NaN', () => {
    const p = placarVazio();
    expect(taxa(p)).toBeNaN();
    for (const r of ['vitoria', 'vitoria', 'empate', 'derrota'] as const) somarLuta(p, r);
    expect(p).toEqual({ vitorias: 2, empates: 1, lutas: 4 });
    expect(taxa(p)).toBeCloseTo(2.5 / 4);
  });

  it('intervalo de Wilson contém a taxa e encolhe com mais lutas', () => {
    const pouco = { vitorias: 6, empates: 0, lutas: 10 }, muito = { vitorias: 600, empates: 0, lutas: 1000 };
    const [a, b] = wilson(pouco), [c, d] = wilson(muito);
    expect(a).toBeLessThan(0.6);
    expect(b).toBeGreaterThan(0.6);
    expect(d - c).toBeLessThan(b - a);
    expect(wilson({ vitorias: 0, empates: 0, lutas: 5 })[0]).toBe(0);
    expect(wilson(placarVazio())[0]).toBeNaN();
  });
});

describe('estatística', () => {
  it('média, mediana e quantis', () => {
    expect(media([1, 2, 3, 10])).toBe(4);
    expect(media([])).toBeNaN();
    expect(mediana([5, 1, 3])).toBe(3);
    expect(mediana([1, 2, 3, 4])).toBe(2.5);
    expect(quantil([0, 10], 0.1)).toBeCloseTo(1);
    expect(quantil([], 0.5)).toBeNaN();
  });

  it('equivalente: acha onde a taxa cruza 50% e para nas pontas', () => {
    const curva = (centro: number) => (x: number) => 1 / (1 + Math.exp(8 * (x - centro)));
    expect(equivalente(curva(0.4), -0.5, 2, 12)).toBeCloseTo(0.4, 2);
    expect(equivalente(curva(-0.2), -0.5, 2, 12)).toBeCloseTo(-0.2, 2);
    expect(equivalente(curva(5), -0.5, 2)).toBe(2);
    expect(equivalente(curva(-5), -0.5, 2)).toBe(-0.5);
  });

  it('faixas', () => {
    expect(foraDaFaixa(0.3, [0.35, 0.65])).toBe('abaixo');
    expect(foraDaFaixa(0.7, [0.35, 0.65])).toBe('acima');
    expect(foraDaFaixa(0.5, [0.35, 0.65])).toBeNull();
    expect(foraDaFaixa(NaN, [0, 1])).toBeNull();
    // mediana 0,2: aceita de 0,2/1,6 − 0,03 = 0,095 até 0,2 × 1,6 + 0,03 = 0,35
    const f = (v: number) => foraDaMediana(v, 0.2, [1 / 1.6, 1.6], 0.03);
    expect([f(0.09), f(0.1), f(0.34), f(0.36)]).toEqual([true, false, false, true]);
    // mediana negativa: só a folga
    expect(foraDaMediana(0.02, -0.1, [1 / 1.6, 1.6], 0.03)).toBe(false);
    expect(foraDaMediana(-0.05, -0.1, [1 / 1.6, 1.6], 0.03)).toBe(true);
  });

  it('semente: estável e diferente pra partes diferentes', () => {
    expect(semente('a', 1)).toBe(semente('a', 1));
    expect(semente('a', 1)).not.toBe(semente('a', 2));
    expect(semente('a', 1)).toBeGreaterThanOrEqual(0);
  });
});

describe('texto', () => {
  it('números com vírgula e porcentagem com sinal', () => {
    expect(num(1.256, 2)).toBe('1,26');
    expect(num(NaN)).toBe('–');
    expect(num(-0.001, 1)).toBe('0,0');
    expect(pct(0.123)).toBe('12%');
    expect(pct(0.123, 0, true)).toBe('+12%');
    expect(pct(-0.05, 0, true)).toBe('-5%');
  });

  it('tabela em Markdown escapa a barra vertical', () => {
    expect(tabela(['a', 'b'], [[1, 'x|y']])).toBe('| a | b |\n|---|---|\n| 1 | x\\|y |');
  });

  it('juntarComHistorico mantém a parte escrita à mão', () => {
    const novo = juntarComHistorico('# Gerado 2\n', `# Gerado 1\n\n${MARCADOR_HISTORICO}\n\n## Histórico\n\n- ajuste\n`);
    expect(novo).toBe(`# Gerado 2\n\n${MARCADOR_HISTORICO}\n\n## Histórico\n\n- ajuste\n`);
    expect(juntarComHistorico('# G', null)).toContain(MARCADOR_HISTORICO);
  });
});
