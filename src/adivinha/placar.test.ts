import { describe, expect, it } from 'vitest';
import { chaveDe, desafioDeHoje, lerSalvo, media, registrarChute, sequenciaAtual, vazio } from './placar';

const K = chaveDe('lol', 'classico');

describe('lerSalvo', () => {
  it('descarta o que não tem o formato certo', () => {
    expect(lerSalvo(null)).toEqual(vazio());
    expect(lerSalvo('x')).toEqual(vazio());
    const s = lerSalvo({
      dia: { [K]: { data: '2026-11-21', alvo: 'Ahri', chutes: ['Zed', 3, 'Ahri'], acertou: true }, ruim: { data: 'ontem', alvo: 'x', chutes: [] } },
      stats: { [K]: { jogos: 2, chutes: 7, seq: 2, melhor: 3, ultimo: '2026-11-21' }, torto: { jogos: -1, chutes: 'x', seq: 1.5, ultimo: 5 } },
      cfg: { grupo: 'megaten', submodo: 'emoji', rodada: 'livre' },
    });
    expect(s.dia).toEqual({ [K]: { data: '2026-11-21', alvo: 'Ahri', chutes: ['Zed', 'Ahri'], acertou: true } });
    expect(s.stats.torto).toEqual({ jogos: 0, chutes: 0, seq: 0, melhor: 0, ultimo: '' });
    expect(s.cfg).toEqual({ grupo: 'megaten', submodo: 'emoji', rodada: 'livre' });
    expect(lerSalvo({ cfg: { grupo: 'digimon', submodo: 'classico', rodada: 'dia' } }).cfg).toBeNull();
    expect(lerSalvo({ cfg: { grupo: 'lol', submodo: 'falas', rodada: 'dia' } }).cfg).toBeNull();
  });
});

describe('desafio do dia', () => {
  it('guarda os chutes; acertar fecha o desafio e soma nas estatísticas', () => {
    let s = registrarChute(vazio(), K, '2026-11-21', 'Ahri', 'Zed', false);
    s = registrarChute(s, K, '2026-11-21', 'Ahri', 'Jinx', false);
    expect(desafioDeHoje(s, K, '2026-11-21')).toEqual({ data: '2026-11-21', alvo: 'Ahri', chutes: ['Zed', 'Jinx'], acertou: false });
    expect(s.stats[K]).toBeUndefined();
    s = registrarChute(s, K, '2026-11-21', 'Ahri', 'Ahri', true);
    expect(desafioDeHoje(s, K, '2026-11-21')?.acertou).toBe(true);
    expect(s.stats[K]).toEqual({ jogos: 1, chutes: 3, seq: 1, melhor: 1, ultimo: '2026-11-21' });
    // depois de resolvido, nada muda
    expect(registrarChute(s, K, '2026-11-21', 'Ahri', 'Akali', false)).toBe(s);
    // chute repetido não conta
    const r = registrarChute(vazio(), K, '2026-11-21', 'Ahri', 'Zed', false);
    expect(registrarChute(r, K, '2026-11-21', 'Ahri', 'Zed', false)).toBe(r);
  });

  it('o desafio de outro dia não vale hoje; outra franquia ou submodo tem o próprio', () => {
    const s = registrarChute(vazio(), K, '2026-11-20', 'Ahri', 'Zed', false);
    expect(desafioDeHoje(s, K, '2026-11-21')).toBeNull();
    expect(desafioDeHoje(s, chaveDe('lol', 'emoji'), '2026-11-20')).toBeNull();
    const t = registrarChute(s, K, '2026-11-21', 'Jinx', 'Ahri', false);
    expect(desafioDeHoje(t, K, '2026-11-21')).toEqual({ data: '2026-11-21', alvo: 'Jinx', chutes: ['Ahri'], acertou: false });
  });

  it('sequência: dias seguidos continuam, um dia pulado recomeça; média de chutes', () => {
    const acerta = (s: ReturnType<typeof vazio>, d: string, chutes: string[]) =>
      chutes.reduce((x, c, i) => registrarChute(x, K, d, 'Alvo', i === chutes.length - 1 ? 'Alvo' : c, i === chutes.length - 1), s);
    let s = acerta(vazio(), '2026-11-19', ['a', 'b', 'c']);
    s = acerta(s, '2026-11-20', ['x']);
    s = acerta(s, '2026-11-21', ['a', 'b']);
    expect(s.stats[K]).toEqual({ jogos: 3, chutes: 6, seq: 3, melhor: 3, ultimo: '2026-11-21' });
    expect(media(s.stats[K])).toBe(2);
    expect(sequenciaAtual(s.stats[K], '2026-11-21')).toBe(3);
    expect(sequenciaAtual(s.stats[K], '2026-11-22')).toBe(3);
    expect(sequenciaAtual(s.stats[K], '2026-11-23')).toBe(0);
    s = acerta(s, '2026-11-23', ['a']);
    expect(s.stats[K]).toEqual({ jogos: 4, chutes: 7, seq: 1, melhor: 3, ultimo: '2026-11-23' });
    expect(media(undefined)).toBeNull();
    expect(sequenciaAtual(undefined, '2026-11-23')).toBe(0);
  });
});
