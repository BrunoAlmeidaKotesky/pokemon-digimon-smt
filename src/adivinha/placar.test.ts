import { describe, expect, it } from 'vitest';
import { chaveDe, chavePercurso, desafioDeHoje, lerSalvo, media, registrarChute, registrarPercurso, sequenciaAtual, vazio } from './placar';

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

describe('formato 2 (Imagem virou Blur, percurso do dia)', () => {
  it('salvo antigo: "imagem" vira "blur" (desafio, estatística e escolha da tela); a sequência continua no percurso', () => {
    const antigo = {
      dia: { 'lol:imagem': { data: '2026-11-20', alvo: 'Ahri', chutes: ['Zed', 'Ahri'], acertou: true }, 'lol:classico': { data: '2026-11-19', alvo: 'Jinx', chutes: ['Jinx'], acertou: true } },
      stats: {
        'lol:imagem': { jogos: 5, chutes: 20, seq: 4, melhor: 4, ultimo: '2026-11-20' },
        'lol:classico': { jogos: 9, chutes: 30, seq: 2, melhor: 6, ultimo: '2026-11-19' },
        'pokemon:emoji': { jogos: 1, chutes: 3, seq: 1, melhor: 1, ultimo: '2026-11-18' },
      },
      cfg: { grupo: 'lol', submodo: 'imagem', rodada: 'livre' },
    };
    const s = lerSalvo(antigo);
    expect(s.v).toBe(2);
    expect(Object.keys(s.dia).sort()).toEqual(['lol:blur', 'lol:classico']);
    expect(s.stats['lol:blur']).toEqual({ jogos: 5, chutes: 20, seq: 4, melhor: 4, ultimo: '2026-11-20' });
    expect(s.stats['lol:imagem']).toBeUndefined();
    expect(s.cfg).toEqual({ grupo: 'lol', submodo: 'blur', rodada: 'livre' });
    // o percurso começa com a etapa jogada por último: quem vinha em 4 dias segue a sequência
    expect(s.stats[chavePercurso('lol')]).toEqual({ jogos: 5, chutes: 20, seq: 4, melhor: 4, ultimo: '2026-11-20' });
    expect(s.stats[chavePercurso('pokemon')]).toEqual({ jogos: 1, chutes: 3, seq: 1, melhor: 1, ultimo: '2026-11-18' });
    expect(s.stats[chavePercurso('jojo')]).toBeUndefined();
    expect(sequenciaAtual(s.stats[chavePercurso('lol')], '2026-11-21')).toBe(4);
    const r = registrarPercurso(s, 'lol', '2026-11-21', 9);
    expect(r.stats[chavePercurso('lol')]).toEqual({ jogos: 6, chutes: 29, seq: 5, melhor: 5, ultimo: '2026-11-21' });
    expect(s.etapas).toEqual(['classico', 'imagem', 'blur', 'emoji']);
  });

  it('salvo novo: "imagem" é o recorte e não migra; etapas ligadas', () => {
    const s = lerSalvo({ v: 2, dia: { 'lol:imagem': { data: '2026-11-21', alvo: 'Ahri', chutes: [], acertou: false } }, stats: {}, cfg: { grupo: 'lol', submodo: 'todos', rodada: 'livre' }, etapas: ['emoji', 'classico', 'xyz'] });
    expect(Object.keys(s.dia)).toEqual(['lol:imagem']);
    expect(s.cfg?.submodo).toBe('todos');
    expect(s.etapas).toEqual(['classico', 'emoji']);
    expect(lerSalvo({ v: 2, etapas: [] }).etapas).toEqual(['classico', 'imagem', 'blur', 'emoji']);
    expect(lerSalvo({ v: 2, etapas: 'blur' }).etapas).toEqual(['classico', 'imagem', 'blur', 'emoji']);
  });

  it('percurso conta uma vez por dia; dia pulado recomeça a sequência', () => {
    let s = registrarPercurso(vazio(), 'jojo', '2026-11-20', 7);
    s = registrarPercurso(s, 'jojo', '2026-11-21', 5);
    expect(registrarPercurso(s, 'jojo', '2026-11-21', 99)).toBe(s);
    expect(s.stats[chavePercurso('jojo')]).toEqual({ jogos: 2, chutes: 12, seq: 2, melhor: 2, ultimo: '2026-11-21' });
    s = registrarPercurso(s, 'jojo', '2026-11-23', 4);
    expect(s.stats[chavePercurso('jojo')]).toMatchObject({ seq: 1, melhor: 2, jogos: 3 });
  });
});

describe('recorte do livre no salvo', () => {
  it('salvo sem o campo (de quem já jogou) = todos; inválido é descartado; o resto continua', () => {
    const antigo = lerSalvo({ v: 2, dia: { 'lol:classico': { data: '2026-11-21', alvo: 'Ahri', chutes: ['Ahri'], acertou: true } }, stats: {}, cfg: null, etapas: ['classico'] });
    expect(antigo.recortes).toEqual({});
    expect(antigo.etapas).toEqual(['classico']);
    expect(Object.keys(antigo.dia)).toEqual(['lol:classico']);
    const s = lerSalvo({ v: 2, recortes: { pokemon: ['III', 'I', 'X'], jojo: [], lol: ['I'], megaten: 'x', zelda: ['I'] } });
    expect(s.recortes).toEqual({ pokemon: ['I', 'III'] });
    expect(lerSalvo({ v: 2, recortes: ['I'] }).recortes).toEqual({});
  });
});
