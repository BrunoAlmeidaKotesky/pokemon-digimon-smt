import { beforeEach, describe, expect, it } from 'vitest';
import {
  fimDoPlanejamento, humano, jogadorDe, limparVotos, novaPartida, novaPartidaComHumanos, prontos, todosProntos, votarBots,
  votarPronto, vivos,
} from './index';
import { prepararTeste } from './test-helpers';

beforeEach(() => prepararTeste());

describe('votação do "Pronto"', () => {
  it('os bots votam; o voto do humano alterna, fecha a votação e pode ser desfeito', () => {
    const p = novaPartida(3);
    expect(p.fase).toBe('planejamento');
    expect(prontos(p)).toHaveLength(0);
    votarBots(p);
    expect(prontos(p).map(j => j.id).sort()).toEqual(vivos(p).filter(j => j.bot).map(j => j.id).sort());
    expect(todosProntos(p)).toBe(false);
    expect(votarPronto(p, p.voce)).toBe(true);
    expect(humano(p).pronto).toBe(true);
    expect(todosProntos(p)).toBe(true);
    // alternar desfaz; com o voto explícito não alterna
    expect(votarPronto(p, p.voce)).toBe(false);
    expect(humano(p).pronto).toBeUndefined();
    expect(todosProntos(p)).toBe(false);
    expect(votarPronto(p, p.voce, true)).toBe(true);
    expect(votarPronto(p, p.voce, true)).toBe(true);
    expect(votarPronto(p, p.voce, false)).toBe(false);
  });

  it('eliminado não vota nem conta; fora do planejamento não muda nada; o fim do planejamento limpa', () => {
    const p = novaPartida(4);
    votarBots(p);
    const bot = jogadorDe(p, 'pyrus');
    delete bot.pronto;
    bot.vida = 0;
    bot.colocacao = 8;
    expect(votarPronto(p, 'pyrus', true)).toBe(false);
    expect(bot.pronto).toBeUndefined();
    votarPronto(p, p.voce, true);
    // o eliminado fica de fora da conta: todos os vivos votaram
    expect(todosProntos(p)).toBe(true);

    fimDoPlanejamento(p);
    expect(p.jogadores.some(j => j.pronto)).toBe(false);
    p.fase = 'luta';
    expect(votarPronto(p, p.voce)).toBe(false);
    votarBots(p);
    expect(prontos(p)).toHaveLength(0);

    p.fase = 'planejamento';
    votarBots(p);
    limparVotos(p);
    expect(prontos(p)).toHaveLength(0);
  });

  it('online: cada humano vota da sua tela; humano fora do ar vota como bot', () => {
    const p = novaPartidaComHumanos(5, [{ id: 'h1', escolhas: {} }, { id: 'h2', escolhas: {} }, { id: 'h3', escolhas: {} }], 'facil', 'h1');
    jogadorDe(p, 'h3').ausente = true;
    votarBots(p);
    expect(prontos(p).map(j => j.id)).toContain('h3');
    expect(prontos(p).map(j => j.id)).not.toContain('h2');
    expect(todosProntos(p)).toBe(false);
    votarPronto(p, 'h1', true);
    expect(todosProntos(p)).toBe(false);
    votarPronto(p, 'h2', true);
    expect(todosProntos(p)).toBe(true);
  });
});
