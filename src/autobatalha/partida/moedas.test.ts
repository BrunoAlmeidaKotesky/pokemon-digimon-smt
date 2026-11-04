import { beforeEach, describe, expect, it } from 'vitest';
import type { ResultadoLuta } from '../tipos';
import {
  aplicarRodada, avancarRodada, casaNoChao, fimDoPlanejamento, humano, jogadorDe, jogarBot, moedasProChao, nivelAlvo,
  novaPartida, pegarMoeda, PERFIS_BOT, simularRodada, terminarCarrossel, vivos,
} from './index';
import { prepararTeste, resultado } from './test-helpers';

beforeEach(() => prepararTeste());

const comMoedas = (moedas: ResultadoLuta['moedas'], ouroA = 0): ResultadoLuta => ({
  ...resultado('a', [], []), ouro: { a: ouroA, b: 0 }, moedas,
});

describe('moedas no chão', () => {
  it('casa da luta vira casa na metade do dono; a do adversário cai na linha da frente', () => {
    expect(casaNoChao({ col: 2, lin: 6 }, 'a')).toEqual({ col: 2, lin: 2 });
    expect(casaNoChao({ col: 5, lin: 1 }, 'a')).toEqual({ col: 5, lin: 0 });
    expect(casaNoChao({ col: 0, lin: 3 }, 'b')).toEqual({ col: 7, lin: 0 });
    expect(casaNoChao({ col: 7, lin: 0 }, 'b')).toEqual({ col: 0, lin: 3 });
  });

  it('as do humano vão pro chão (não entram no ouro); pegar soma o ouro e tira a moeda', () => {
    const p = novaPartida(5);
    const eu = humano(p);
    const res = comMoedas([{ lado: 'a', casa: { col: 1, lin: 5 }, valor: 1 }, { lado: 'b', casa: { col: 1, lin: 2 }, valor: 1 },
      { lado: 'a', casa: { col: 3, lin: 7 }, valor: 2 }], 3);
    expect(moedasProChao(eu, res, 'a')).toBe(3);
    expect(eu.moedas).toEqual([{ casa: { col: 1, lin: 1 }, valor: 1 }, { casa: { col: 3, lin: 3 }, valor: 2 }]);
    const ouro = eu.ouro;
    expect(pegarMoeda(p, eu.id, 1)).toBeNull();
    expect(eu.ouro).toBe(ouro + 2);
    expect(pegarMoeda(p, eu.id, 5)).toBe('Essa moeda não está mais aí');
    expect(pegarMoeda(p, eu.id, 0)).toBeNull();
    expect(eu.moedas).toBeUndefined();
    expect(eu.ouro).toBe(ouro + 3);
  });

  it('bot recebe o ouro das moedas direto; humano só o que não caiu no chão', () => {
    const p = novaPartida(6);
    p.estagio = 2; p.rodada = 2; p.tipo = 'pvp';
    const eu = humano(p), b = jogadorDe(p, 'pyrus');
    p.confrontos = [[eu.id, b.id]];
    fimDoPlanejamento(p);
    const rr = simularRodada(p, () => ({
      ...resultado('a', [], []), ouro: { a: 2, b: 1 },
      moedas: [{ lado: 'a', casa: { col: 0, lin: 4 }, valor: 2 }, { lado: 'b', casa: { col: 0, lin: 3 }, valor: 1 }],
    }));
    const [ouroEu, ouroB] = [eu.ouro, b.ouro];
    aplicarRodada(p, rr);
    expect(eu.moedas).toEqual([{ casa: { col: 0, lin: 0 }, valor: 2 }]);
    expect(eu.ouro - ouroEu).toBeLessThan(b.ouro - ouroB + 2);
    expect(b.moedas).toBeUndefined();
  });
});

describe('dificuldade dos bots', () => {
  it('perfis: o fácil rola menos, sobe de nível depois e erra mais', () => {
    expect(PERFIS_BOT.facil.maxRolagens).toBeLessThan(PERFIS_BOT.normal.maxRolagens);
    expect(PERFIS_BOT.dificil.maxRolagens).toBeGreaterThan(PERFIS_BOT.normal.maxRolagens);
    expect(nivelAlvo(4, 1, PERFIS_BOT.facil.nivelExtra)).toBe(nivelAlvo(4, 1) - 1);
    expect(nivelAlvo(4, 1, PERFIS_BOT.dificil.nivelExtra)).toBe(nivelAlvo(4, 1) + 1);
    expect(nivelAlvo(1, 1, -1)).toBe(1);
  });

  it('partida nova guarda a dificuldade; bots do fácil ficam com nível menor', () => {
    const nivelMedio = (d: 'facil' | 'normal') => {
      const p = novaPartida(77, 'Você', d);
      expect(p.dificuldade).toBe(d);
      for (let r = 0; r < 14; r++) {
        for (const j of vivos(p)) jogarBot(p, j);
        fimDoPlanejamento(p);
        aplicarRodada(p, simularRodada(p));
        avancarRodada(p);
        terminarCarrossel(p);
      }
      const bots = vivos(p).filter(j => j.bot);
      return bots.reduce((s, j) => s + j.nivel, 0) / bots.length;
    };
    expect(nivelMedio('facil')).toBeLessThan(nivelMedio('normal'));
  });
});
