// Planejador de times: salvar, renomear, apagar e marcar planos (localStorage pdx-autobatalha-planos), o limite de 10
// campeões, a busca da grade e os traços contados pela forma de maior estrela.
import { describe, expect, it } from 'vitest';
import { indexar } from './dados';
import type { CampeaoDados, FormaDados, Origem, SetDados } from './tipos';
import {
  CHAVE_PLANOS, FILTRO_VAZIO, MAX_CAMPEOES, SEM_PLANOS, alternarCampeao, apagarPlano, definirAtivo, filtrarCampeoes, lerPlanos, nomeLivre,
  planoAtivo, salvarPlano, salvarPlanos, tracosDoPlano, unidadesDoPlano, validarPlanos, type Planos,
} from './planejador';

const forma = (fr: Origem, nome: string, classes: string[]): FormaDados => ({ id: `${fr}:${nome}`, nome, img: '', fr, classes, info: [] });
const formas = [
  forma('pokemon', 'Charmander', ['fogo']), forma('pokemon', 'Charmeleon', ['fogo']), forma('pokemon', 'Charizard', ['fogo', 'dragao']),
  forma('pokemon', 'Ralts', ['fadinhas']), forma('pokemon', 'Kirlia', ['fadinhas']), forma('pokemon', 'Gardevoir', ['fadinhas']), forma('pokemon', 'Gallade', ['porradeiro']),
  forma('jojo', 'Jotaro Kujo', ['porradeiro']), forma('lol', 'Ahri', ['safada']),
];
const campeoes: CampeaoDados[] = [
  { id: 'pokemon:charmander', fr: 'pokemon', nome: 'Charmander', linha: 'Charmander', custo: 2, niveis: [['pokemon:Charmander'], ['pokemon:Charmeleon'], ['pokemon:Charizard']] },
  { id: 'pokemon:ralts', fr: 'pokemon', nome: 'Ralts', linha: 'Ralts', custo: 3, niveis: [['pokemon:Ralts'], ['pokemon:Kirlia'], ['pokemon:Gardevoir', 'pokemon:Gallade']] },
  { id: 'jojo:jotaro-kujo', fr: 'jojo', nome: 'Jotaro Kujo', custo: 5, niveis: [['jojo:Jotaro Kujo']] },
  { id: 'lol:ahri', fr: 'lol', nome: 'Ahri', custo: 1, niveis: [['lol:Ahri']] },
];
const dados: SetDados = {
  versao: 1, geradoEm: '2026-11-04', fonte: 'teste',
  tracos: [{ id: 'fogo', nome: 'Fogo' }, { id: 'dragao', nome: 'Dragão' }, { id: 'fadinhas', nome: 'Fadinhas' }, { id: 'porradeiro', nome: 'Porradeiro' }, { id: 'safada', nome: 'Safada' }],
  campeoes, formas: Object.fromEntries(formas.map(f => [f.id, f])), bakugan: {}, ff: { inimigos: [], chefes: [] },
};
const set = indexar(dados);

/** localStorage de mentira */
function memoria(inicial: Record<string, string> = {}) {
  const m = new Map(Object.entries(inicial));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m };
}
let n = 0;
const ids = () => `id${++n}`;

describe('planos salvos', () => {
  it('sem nada salvo, com JSON quebrado ou sem armazenamento: nenhum plano', () => {
    expect(lerPlanos(memoria())).toEqual(SEM_PLANOS);
    expect(lerPlanos(memoria({ [CHAVE_PLANOS]: '{quebrado' }))).toEqual(SEM_PLANOS);
    expect(lerPlanos(null)).toEqual(SEM_PLANOS);
    const explode = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    expect(lerPlanos(explode)).toEqual(SEM_PLANOS);
    expect(salvarPlanos(SEM_PLANOS, explode)).toBe(false);
  });

  it('grava e lê de volta na chave pdx-autobatalha-planos', () => {
    const mem = memoria();
    const { planos } = salvarPlano(SEM_PLANOS, { nome: 'Fogo', campeoes: ['pokemon:charmander', 'lol:ahri'] }, ids);
    const p = definirAtivo(planos, planos.planos[0]!.id);
    expect(salvarPlanos(p, mem)).toBe(true);
    expect(JSON.parse(mem.m.get(CHAVE_PLANOS)!)).toMatchObject({ versao: 1, ativo: p.ativo });
    expect(lerPlanos(mem)).toEqual(p);
  });

  it('o que não tem o formato certo some; ativo que não existe vira null', () => {
    const p = validarPlanos({
      planos: [{ id: 'a', nome: 'A', campeoes: ['x', 'x', 3, 'y'] }, { id: 'a', nome: 'repetido', campeoes: [] }, { nome: 'sem id' }, null, { id: 'b', nome: 'B' }],
      ativo: 'zzz',
    });
    expect(p).toEqual({ planos: [{ id: 'a', nome: 'A', campeoes: ['x', 'y'] }, { id: 'b', nome: 'B', campeoes: [] }], ativo: null });
    expect(validarPlanos('lixo')).toEqual(SEM_PLANOS);
  });

  it('salvar com id substitui (renomear); sem id cria; nome vazio vira o primeiro "Plano N" livre', () => {
    let p: Planos = SEM_PLANOS;
    const a = salvarPlano(p, { nome: '  ', campeoes: ['lol:ahri'] }, ids);
    p = a.planos;
    expect(p.planos[0]!.nome).toBe('Plano 1');
    const b = salvarPlano(p, { id: a.id, nome: 'Safadas', campeoes: ['lol:ahri', 'pokemon:ralts'] }, ids);
    expect(b.id).toBe(a.id);
    expect(b.planos.planos).toEqual([{ id: a.id, nome: 'Safadas', campeoes: ['lol:ahri', 'pokemon:ralts'] }]);
    expect(nomeLivre(b.planos)).toBe('Plano 1');
    const c = salvarPlano(b.planos, { id: 'nao-existe', nome: 'Outro', campeoes: [] }, ids);
    expect(c.planos.planos).toHaveLength(2);
    expect(c.id).not.toBe('nao-existe');
  });

  it('apagar o plano ativo desmarca; planoAtivo acha o marcado', () => {
    const a = salvarPlano(SEM_PLANOS, { nome: 'A', campeoes: [] }, ids);
    const b = salvarPlano(a.planos, { nome: 'B', campeoes: ['jojo:jotaro-kujo'] }, ids);
    let p = definirAtivo(b.planos, b.id);
    expect(planoAtivo(p)?.nome).toBe('B');
    expect(definirAtivo(p, 'nao-existe').ativo).toBeNull();
    p = apagarPlano(p, a.id);
    expect(p.ativo).toBe(b.id);
    p = apagarPlano(p, b.id);
    expect(p).toEqual(SEM_PLANOS);
    expect(planoAtivo(p)).toBeNull();
  });
});

describe('montar o plano', () => {
  it('clicar põe e tira; no máximo 10 campeões', () => {
    expect(alternarCampeao([], 'a')).toEqual(['a']);
    expect(alternarCampeao(['a', 'b'], 'a')).toEqual(['b']);
    const cheio = Array.from({ length: MAX_CAMPEOES }, (_, i) => `c${i}`);
    expect(alternarCampeao(cheio, 'novo')).toBeNull();
    expect(alternarCampeao(cheio, 'c3')).toHaveLength(MAX_CAMPEOES - 1);
    expect(salvarPlano(SEM_PLANOS, { nome: 'X', campeoes: [...cheio, 'a', 'b'] }, ids).planos.planos[0]!.campeoes).toHaveLength(MAX_CAMPEOES);
  });

  it('cada campeão conta pela forma de maior estrela (a primeira alternativa); quem saiu do set fica de fora', () => {
    expect(unidadesDoPlano(['pokemon:charmander', 'pokemon:ralts', 'lol:ahri', 'sumiu:x'], set)).toEqual([
      { campeao: 'pokemon:charmander', forma: 'pokemon:Charizard' },
      { campeao: 'pokemon:ralts', forma: 'pokemon:Gardevoir' },
      { campeao: 'lol:ahri', forma: 'lol:Ahri' },
    ]);
  });

  it('os traços saem da contagem do conteúdo com essas formas', () => {
    let recebeu: unknown = null;
    const r = tracosDoPlano(['pokemon:charmander', 'jojo:jotaro-kujo'], set, u => { recebeu = u; return [{ id: 'fogo', n: 1, nivel: -1 }]; });
    expect(recebeu).toEqual([{ campeao: 'pokemon:charmander', forma: 'pokemon:Charizard' }, { campeao: 'jojo:jotaro-kujo', forma: 'jojo:Jotaro Kujo' }]);
    expect(r).toEqual([{ id: 'fogo', n: 1, nivel: -1 }]);
  });
});

describe('grade do planejador', () => {
  const nomes = (f: Partial<typeof FILTRO_VAZIO>) => filtrarCampeoes(set, { ...FILTRO_VAZIO, ...f }).map(c => c.nome);

  it('sem filtro: todos, por custo e depois por nome', () => {
    expect(nomes({})).toEqual(['Ahri', 'Charmander', 'Ralts', 'Jotaro Kujo']);
  });

  it('busca sem acento pelo nome, pela linha e pelas formas', () => {
    expect(nomes({ busca: 'GALLADE' })).toEqual(['Ralts']);
    expect(nomes({ busca: 'charizárd' })).toEqual(['Charmander']);
    expect(nomes({ busca: 'jotaro' })).toEqual(['Jotaro Kujo']);
    expect(nomes({ busca: 'ninguém' })).toEqual([]);
  });

  it('origem, classe (de qualquer forma da linha) e custos', () => {
    expect(nomes({ origem: 'pokemon' })).toEqual(['Charmander', 'Ralts']);
    expect(nomes({ classe: 'dragao' })).toEqual(['Charmander']);
    expect(nomes({ classe: 'porradeiro' })).toEqual(['Ralts', 'Jotaro Kujo']);
    expect(nomes({ custos: [1, 5] })).toEqual(['Ahri', 'Jotaro Kujo']);
    expect(nomes({ origem: 'pokemon', custos: [3] })).toEqual(['Ralts']);
  });
});
