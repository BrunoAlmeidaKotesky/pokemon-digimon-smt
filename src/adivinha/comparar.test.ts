import { describe, expect, it } from 'vitest';
import { comparar, explicar, pistas, romano, textoDe, valorDe } from './comparar';
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
  it('LoL: as sete colunas, na ordem (com gênero)', () => {
    const ahri = { fr: 'lol', info: { classe: ['Mago', 'Assassino'], regiao: 'Ionia', alcance: 'À distância', dano: 'Mágico', recurso: 'Mana', dificuldade: 5, genero: 'Feminino' } };
    const akali = { fr: 'lol', info: { classe: 'Assassino', regiao: 'Ionia', alcance: 'Corpo a corpo', dano: 'Mágico', recurso: 'Energia', dificuldade: 7, genero: 'Feminino' } };
    expect(G('lol').colunas.map(c => c.id)).toEqual(['classe', 'regiao', 'alcance', 'dano', 'recurso', 'dificuldade', 'genero']);
    expect(pistas(G('lol'), ahri, akali)).toEqual([
      { t: 'Mago, Assassino', c: 'parcial' },
      { t: 'Ionia', c: 'certo' },
      { t: 'À distância', c: 'errado' },
      { t: 'Mágico', c: 'certo' },
      { t: 'Mana', c: 'errado' },
      { t: '5', c: 'errado', s: 'cima' },
      { t: 'Feminino', c: 'certo' },
    ]);
  });

  it('Pokémon: Tipo 1 e Tipo 2 separados ("Nenhum" sem o segundo), habitat, altura e peso com unidade e seta', () => {
    const g = G('pokemon');
    expect(g.colunas.map(c => c.rotulo)).toEqual(['Tipo 1', 'Tipo 2', 'Geração', 'Estágio', 'Cor', 'Forma', 'Habitat', 'Altura', 'Peso']);
    const pikachu = { fr: 'pokemon', info: { tipo: ['Electric'], geracao: 'I', estagio: 2, cor: 'Yellow', forma: 'Quadruped', habitat: 'Forest', altura: 0.4, peso: 6 } };
    const charizard = { fr: 'pokemon', info: { tipo: ['Fire', 'Flying'], geracao: 'I', estagio: 3, cor: 'Red', forma: 'Upright', habitat: 'Mountain', altura: 1.7, peso: 90.5 } };
    const voltorb = { fr: 'pokemon', info: { tipo: ['Electric'], geracao: 'I', estagio: 1, cor: 'Red', forma: 'Ball', altura: 0.5, peso: 10.4 } };
    expect(pistas(g, pikachu, charizard)).toEqual([
      { t: 'Electric', c: 'errado' },
      { t: 'Nenhum', c: 'errado' },
      { t: 'I', c: 'certo' },
      { t: '2', c: 'errado', s: 'cima' },
      { t: 'Yellow', c: 'errado' },
      { t: 'Quadruped', c: 'errado' },
      { t: 'Forest', c: 'errado' },
      { t: '0,4 m', c: 'errado', s: 'cima' },
      { t: '6 kg', c: 'errado', s: 'cima' },
    ]);
    // dois "Nenhum" no Tipo 2 são iguais; habitat que falta é "?"
    const p = pistas(g, voltorb, pikachu);
    expect(p[0]).toEqual({ t: 'Electric', c: 'certo' });
    expect(p[1]).toEqual({ t: 'Nenhum', c: 'certo' });
    expect(p[6]).toEqual({ t: '?', c: 'errado' });
    expect(p[7]).toEqual({ t: '0,5 m', c: 'errado', s: 'baixo' });
    expect(p[8]).toEqual({ t: '10,4 kg', c: 'errado', s: 'baixo' });
    // sem o campo tipo: "?" nos dois
    const sem = { fr: 'pokemon', info: {} };
    expect(valorDe(g.colunas[1]!, sem)).toBeUndefined();
    expect(valorDe(g.colunas[1]!, charizard)).toBe('Flying');
    expect(textoDe(g.colunas[8]!, 0.8)).toBe('0,8 kg');
  });

  it('SMT + Persona: Persona não tem raça e aparece como "Persona"; resiste e atributo mais forte', () => {
    const g = G('megaten');
    const raca = g.colunas.find(c => c.id === 'raca') as Coluna;
    const persona = { fr: 'persona', info: { arcana: 'Fool', mitologia: 'European', nivel: 1, fraco: ['Elec'], resiste: ['Curse'], atributo: ['Força', 'Magia'] } };
    const outra = { fr: 'persona', info: { arcana: 'Fool', mitologia: 'Greco-Roman', nivel: 1, atributo: 'Magia' } };
    const demonio = { fr: 'smt', info: { raca: 'Fairy', mitologia: 'European', nivel: 2, fraco: ['Elec', 'Phys'], resiste: ['Force'], atributo: 'Agilidade' } };
    expect(valorDe(raca, persona)).toBe('Persona');
    expect(valorDe(raca, demonio)).toBe('Fairy');
    expect(pistas(g, persona, demonio)).toEqual([
      { t: 'Persona', c: 'errado' },
      { t: 'Fool', c: 'errado' },
      { t: 'European', c: 'certo' },
      { t: '1', c: 'errado', s: 'cima' },
      { t: 'Elec', c: 'parcial' },
      { t: 'Curse', c: 'errado' },
      { t: 'Força, Magia', c: 'errado' },
    ]);
    // duas Personas: a raça bate; atributo com parte em comum
    expect(pistas(g, persona, outra)[0]).toEqual({ t: 'Persona', c: 'certo' });
    expect(pistas(g, persona, outra)[6]).toEqual({ t: 'Força, Magia', c: 'parcial' });
  });

  it('cada grupo tem as colunas pedidas', () => {
    expect(G('overwatch').colunas.map(c => c.id)).toEqual(['funcao', 'subfuncao', 'afiliacao', 'pais', 'especie']);
    expect(G('deadlock').colunas.map(c => [c.id, c.tipo])).toEqual([['tipo', 'texto'], ['arma', 'texto'], ['disparo', 'texto'], ['genero', 'texto']]);
    expect(G('pokemon').colunas.map(c => [c.id, c.tipo])).toEqual([
      ['tipo1', 'texto'], ['tipo2', 'texto'], ['geracao', 'romano'], ['estagio', 'numero'], ['cor', 'texto'], ['forma', 'texto'], ['habitat', 'texto'], ['altura', 'numero'], ['peso', 'numero'],
    ]);
    expect(G('jojo').colunas.map(c => c.id)).toEqual(['parte', 'alcance', 'forma', 'mecanica']);
    expect(G('megaten').colunas.map(c => c.id)).toEqual(['raca', 'arcana', 'mitologia', 'nivel', 'fraco', 'resiste', 'atributo']);
    expect(G('megaten').frs).toEqual(['smt', 'persona']);
  });
});
