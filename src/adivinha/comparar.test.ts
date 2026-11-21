import { describe, expect, it } from 'vitest';
import { comparar, explicar, pistas, romano, valorDe } from './comparar';
import { grupoDe, type Coluna, type Grupo } from './grupos';

const texto: Coluna = { id: 'x', rotulo: 'X', tipo: 'texto' };
const num: Coluna = { id: 'n', rotulo: 'N', tipo: 'numero' };
const rom: Coluna = { id: 'g', rotulo: 'G', tipo: 'romano' };
const G = (id: string) => grupoDe(id) as Grupo;

describe('romano', () => {
  it('converte as gerações', () => {
    expect(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map(romano)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(romano(' iv ')).toBe(4);
    expect(romano('Kanto')).toBeNull();
    expect(romano('')).toBeNull();
  });
});

describe('comparar', () => {
  it('texto: igual é verde, diferente é vermelho', () => {
    expect(comparar(texto, 'Ionia', 'Ionia')).toEqual({ t: 'Ionia', c: 'certo' });
    expect(comparar(texto, 'Ionia', 'Noxus')).toEqual({ t: 'Ionia', c: 'errado' });
  });

  it('lista: mesmos itens em qualquer ordem é verde; parte em comum é amarelo; nada em comum é vermelho', () => {
    expect(comparar(texto, ['Mago', 'Assassino'], ['Assassino', 'Mago'])).toEqual({ t: 'Mago, Assassino', c: 'certo' });
    expect(comparar(texto, ['Mago', 'Assassino'], ['Mago'])).toEqual({ t: 'Mago, Assassino', c: 'parcial' });
    expect(comparar(texto, 'Mago', ['Mago', 'Suporte'])).toEqual({ t: 'Mago', c: 'parcial' });
    expect(comparar(texto, ['Grass', 'Poison'], ['Fire'])).toEqual({ t: 'Grass, Poison', c: 'errado' });
  });

  it('número: igual é verde; diferente é vermelho com seta pra onde está o secreto', () => {
    expect(comparar(num, 4, 4)).toEqual({ t: '4', c: 'certo' });
    expect(comparar(num, 4, 7)).toEqual({ t: '4', c: 'errado', s: 'cima' });
    expect(comparar(num, 7, 4)).toEqual({ t: '7', c: 'errado', s: 'baixo' });
    expect(comparar(num, 0, 10)).toEqual({ t: '0', c: 'errado', s: 'cima' });
  });

  it('geração em romano compara como número e mostra o romano', () => {
    expect(comparar(rom, 'IV', 'IX')).toEqual({ t: 'IV', c: 'errado', s: 'cima' });
    expect(comparar(rom, 'IX', 'IV')).toEqual({ t: 'IX', c: 'errado', s: 'baixo' });
    expect(comparar(rom, 'III', 'III')).toEqual({ t: 'III', c: 'certo' });
  });

  it('sem informação: "?"; dois "?" contam como iguais, um só é diferente (sem seta)', () => {
    expect(comparar(texto, undefined, undefined)).toEqual({ t: '?', c: 'certo' });
    expect(comparar(texto, undefined, 'Talon')).toEqual({ t: '?', c: 'errado' });
    expect(comparar(texto, 'Talon', undefined)).toEqual({ t: 'Talon', c: 'errado' });
    expect(comparar(num, undefined, 3)).toEqual({ t: '?', c: 'errado' });
  });

  it('explicação da célula', () => {
    expect(explicar({ t: '4', c: 'errado', s: 'cima' })).toBe('diferente: o personagem tem mais');
    expect(explicar({ t: 'a', c: 'parcial' })).toBe('em parte');
    expect(explicar({ t: 'a', c: 'certo' })).toBe('igual');
  });
});

describe('pistas por grupo', () => {
  it('LoL: as seis colunas, na ordem', () => {
    const ahri = { fr: 'lol', info: { classe: ['Mago', 'Assassino'], regiao: 'Ionia', alcance: 'À distância', dano: 'Mágico', recurso: 'Mana', dificuldade: 5 } };
    const akali = { fr: 'lol', info: { classe: 'Assassino', regiao: 'Ionia', alcance: 'Corpo a corpo', dano: 'Mágico', recurso: 'Energia', dificuldade: 7 } };
    expect(G('lol').colunas.map(c => c.id)).toEqual(['classe', 'regiao', 'alcance', 'dano', 'recurso', 'dificuldade']);
    expect(pistas(G('lol'), ahri, akali)).toEqual([
      { t: 'Mago, Assassino', c: 'parcial' },
      { t: 'Ionia', c: 'certo' },
      { t: 'À distância', c: 'errado' },
      { t: 'Mágico', c: 'certo' },
      { t: 'Mana', c: 'errado' },
      { t: '5', c: 'errado', s: 'cima' },
    ]);
  });

  it('SMT + Persona: Persona não tem raça e aparece como "Persona"; arcana que falta é "?"', () => {
    const g = G('megaten');
    const raca = g.colunas.find(c => c.id === 'raca') as Coluna;
    const persona = { fr: 'persona', info: { jogo: 'Persona 5', arcana: 'Fool', mitologia: 'European', nivel: 1, fraco: ['Elec'] } };
    const outra = { fr: 'persona', info: { jogo: 'Persona 3', arcana: 'Fool', mitologia: 'Greco-Roman', nivel: 1 } };
    const demonio = { fr: 'smt', info: { jogo: 'SMT V', raca: 'Fairy', mitologia: 'European', nivel: 2, fraco: ['Elec', 'Phys'] } };
    expect(valorDe(raca, persona)).toBe('Persona');
    expect(valorDe(raca, demonio)).toBe('Fairy');
    expect(pistas(g, persona, demonio)).toEqual([
      { t: 'Persona 5', c: 'errado' },
      { t: 'Persona', c: 'errado' },
      { t: 'Fool', c: 'errado' },
      { t: 'European', c: 'certo' },
      { t: '1', c: 'errado', s: 'cima' },
      { t: 'Elec', c: 'parcial' },
    ]);
    // duas Personas: a raça bate; fraqueza sem informação no secreto
    expect(pistas(g, persona, outra)[1]).toEqual({ t: 'Persona', c: 'certo' });
    expect(pistas(g, persona, outra)[5]).toEqual({ t: 'Elec', c: 'errado' });
  });

  it('cada grupo tem as colunas pedidas', () => {
    expect(G('overwatch').colunas.map(c => c.id)).toEqual(['funcao', 'subfuncao', 'afiliacao', 'pais', 'especie']);
    expect(G('deadlock').colunas.map(c => [c.id, c.tipo])).toEqual([['tipo', 'texto'], ['arma', 'texto'], ['disparo', 'texto'], ['complexidade', 'numero'], ['genero', 'texto']]);
    expect(G('pokemon').colunas.map(c => [c.id, c.tipo])).toEqual([['tipo', 'texto'], ['geracao', 'romano'], ['estagio', 'numero'], ['cor', 'texto'], ['forma', 'texto'], ['ovo', 'texto']]);
    expect(G('jojo').colunas.map(c => c.id)).toEqual(['parte', 'alcance', 'forma', 'mecanica']);
    expect(G('megaten').colunas.map(c => c.id)).toEqual(['jogo', 'raca', 'arcana', 'mitologia', 'nivel', 'fraco']);
    expect(G('megaten').frs).toEqual(['smt', 'persona']);
  });
});
