import { describe, expect, it } from 'vitest';
import {
  F_CLASSE, SEM, TODOS, compararNatural, distintos, filtrar, filtravel, filtrosVazios, juntarMarcas, lerImportacao, limparMarcas,
  montarExportacao, montarLinhas, normalizar, opcoes, opcoesClasse, opcoesLinha, parseCatalogo, resumoInfo, temFiltro, valores,
  type Contexto, type Filtros,
} from './model';

const ARQUIVO = {
  chave: 'pokemon',
  fonte: 'PokeAPI (GraphQL)',
  geradoEm: '2026-10-25',
  campos: [{ id: 'tipo', rotulo: 'Tipo' }, { id: 'geracao', rotulo: 'Geração' }, { id: 'peso', rotulo: 'Peso' }],
  itens: {
    Bulbasaur: { tipo: ['Grass', 'Poison'], geracao: 'I', peso: 69 },
    Charmander: { tipo: ['Fire'], geracao: 'I', peso: 85 },
    Charizard: { tipo: ['Fire', 'Flying'], geracao: 'I' },
    Chikorita: { tipo: 'Grass', geracao: 'II' },
    Pidgey: { tipo: ['Normal', 'Flying'], geracao: 'I' },
  },
  imagens: { Agumon: 'https://x/agumon.png' },
};
const cat = () => parseCatalogo(structuredClone(ARQUIVO))!;
const LISTA = ['Bulbasaur', 'Charmander', 'Charizard', 'Pidgey', 'Pikachu', 'Agumon'].map(name => ({ name, img: name === 'Agumon' ? '' : `img/${name}.png` }));
const f = (p: Partial<Filtros> = {}): Filtros => ({ ...filtrosVazios(), ...p });
const nomes = (l: { nome: string }[]) => l.map(x => x.nome);
const NADA = TODOS;
const grupo = (...n: string[]): Contexto => ({ grupo: new Set(n) });

describe('parseCatalogo', () => {
  it('lê o arquivo do catalogo.mjs', () => {
    const c = cat();
    expect(c.chave).toBe('pokemon');
    expect(c.fonte).toBe('PokeAPI (GraphQL)');
    expect(c.geradoEm).toBe('2026-10-25');
    expect(c.campos.map(x => x.id)).toEqual(['tipo', 'geracao', 'peso']);
    expect(c.itens.get('Bulbasaur')).toEqual({ tipo: ['Grass', 'Poison'], geracao: 'I', peso: 69 });
    expect(c.imagens.get('Agumon')).toBe('https://x/agumon.png');
  });
  it('sem campos ou itens -> null', () => {
    expect(parseCatalogo(null)).toBeNull();
    expect(parseCatalogo('<!doctype html>')).toBeNull();
    expect(parseCatalogo({ campos: [] })).toBeNull();
    expect(parseCatalogo({ itens: {} })).toBeNull();
    expect(parseCatalogo({ campos: {}, itens: {} })).toBeNull();
  });
  it('ignora campo não declarado, valor inválido, campo repetido e item que não é objeto', () => {
    const c = parseCatalogo({
      campos: [{ id: 'a', rotulo: 'A' }, { id: 'a', rotulo: 'outra' }, { id: 'b' }, { rotulo: 'sem id' }, 'x'],
      itens: { X: { a: 'ok', b: [1, 'só texto', ''], z: 'não declarado' }, Y: { a: '', b: [] }, Z: { a: NaN, b: { o: 1 } }, W: 'nada' },
      imagens: { X: 'u', Y: 3 },
    })!;
    expect(c.campos).toEqual([{ id: 'a', rotulo: 'A' }, { id: 'b', rotulo: 'b' }]);
    expect(c.itens.get('X')).toEqual({ a: 'ok', b: ['só texto'] });
    expect(c.itens.get('Y')).toEqual({});
    expect(c.itens.get('Z')).toEqual({});
    expect(c.itens.has('W')).toBe(false);
    expect([...c.imagens]).toEqual([['X', 'u']]);
    expect(c.fonte).toBe('');
  });
  it('nome que coincide com propriedade de objeto não atrapalha', () => {
    const c = parseCatalogo({ campos: [{ id: 'a', rotulo: 'A' }], itens: { constructor: { a: 'x' } } })!;
    expect(c.itens.get('constructor')).toEqual({ a: 'x' });
    expect(c.itens.get('toString')).toBeUndefined();
  });
});

describe('valores e resumoInfo', () => {
  it('número vira texto, lista fica lista, ausente vira []', () => {
    expect(valores(3)).toEqual(['3']);
    expect(valores('Fire')).toEqual(['Fire']);
    expect(valores(['A', 'B'])).toEqual(['A', 'B']);
    expect(valores(undefined)).toEqual([]);
  });
  it('"Rótulo: valor · Rótulo: a, b" na ordem dos campos, só os que existem', () => {
    const c = cat();
    expect(resumoInfo(c.campos, c.itens.get('Charizard'))).toBe('Tipo: Fire, Flying · Geração: I');
    expect(resumoInfo(c.campos, c.itens.get('Bulbasaur'))).toBe('Tipo: Grass, Poison · Geração: I · Peso: 69');
    expect(resumoInfo(c.campos, null)).toBe('');
    expect(resumoInfo(c.campos, {})).toBe('');
  });
});

describe('compararNatural', () => {
  const ordenar = (l: string[]) => [...l].sort(compararNatural);
  it('números pelo valor', () => expect(ordenar(['10', '9', '1', '100'])).toEqual(['1', '9', '10', '100']));
  it('algarismos romanos pelo valor', () => {
    expect(ordenar(['IX', 'I', 'V', 'IV', 'X', 'II', 'VIII'])).toEqual(['I', 'II', 'IV', 'V', 'VIII', 'IX', 'X']);
    expect(ordenar(['FF X', 'FF IV', 'FF XVI', 'FF IX', 'FF I'])).toEqual(['FF I', 'FF IV', 'FF IX', 'FF X', 'FF XVI']);
  });
  it('texto em ordem alfabética, sem ligar pra maiúscula e acento', () => {
    expect(ordenar(['Water', 'fire', 'Électrique', 'Bug'])).toEqual(['Bug', 'Électrique', 'fire', 'Water']);
    expect(ordenar(['Vaccine', 'Data', 'Virus', 'Free'])).toEqual(['Data', 'Free', 'Vaccine', 'Virus']);
  });
});

describe('montarLinhas', () => {
  it('junta pelo nome exato, na ordem da lista; quem só está no catálogo fica de fora', () => {
    const l = montarLinhas(LISTA, cat());
    expect(nomes(l)).toEqual(['Bulbasaur', 'Charmander', 'Charizard', 'Pidgey', 'Pikachu', 'Agumon']);
    expect(l[0]!.info).toEqual({ tipo: ['Grass', 'Poison'], geracao: 'I', peso: 69 });
    expect(l[4]!.info).toBeNull();
    expect(l[5]!.imgFonte).toBe('https://x/agumon.png');
    expect(l[0]!.item).toBe(LISTA[0]);
  });
  it('sem catálogo: só nome e imagem', () => {
    const l = montarLinhas(LISTA, null);
    expect(l.every(x => x.info === null && x.imgFonte === '')).toBe(true);
  });
});

describe('filtrar', () => {
  const linhas = montarLinhas(LISTA, cat());
  it('sem filtro: todos', () => expect(filtrar(linhas, f(), NADA)).toHaveLength(6));
  it('busca no nome, sem acento nem maiúscula, todos os termos', () => {
    expect(nomes(filtrar(linhas, f({ q: 'CHAR' }), NADA))).toEqual(['Charmander', 'Charizard']);
    expect(nomes(filtrar(linhas, f({ q: 'char zard' }), NADA))).toEqual(['Charizard']);
    expect(normalizar('Pokémon Ação')).toBe('pokemon acao');
  });
  it('busca também nos valores', () => {
    expect(nomes(filtrar(linhas, f({ q: 'flying' }), NADA))).toEqual(['Charizard', 'Pidgey']);
  });
  it('campo com lista: basta ter um dos valores', () => {
    expect(nomes(filtrar(linhas, f({ campos: { tipo: 'Flying' } }), NADA))).toEqual(['Charizard', 'Pidgey']);
    expect(nomes(filtrar(linhas, f({ campos: { tipo: 'Fire' } }), NADA))).toEqual(['Charmander', 'Charizard']);
  });
  it('campos diferentes se somam (E); "" = todos', () => {
    expect(nomes(filtrar(linhas, f({ campos: { tipo: 'Flying', geracao: 'I' } }), NADA))).toEqual(['Charizard', 'Pidgey']);
    expect(nomes(filtrar(linhas, f({ campos: { tipo: 'Fire', peso: '85' } }), NADA))).toEqual(['Charmander']);
    expect(filtrar(linhas, f({ campos: { tipo: '' } }), NADA)).toHaveLength(6);
  });
  it('SEM pega quem não tem o campo', () => {
    expect(nomes(filtrar(linhas, f({ campos: { peso: SEM } }), NADA))).toEqual(['Charizard', 'Pidgey', 'Pikachu', 'Agumon']);
  });
  it('grupo (base ou marcados): só quem está nele; sem grupo, todos', () => {
    expect(nomes(filtrar(linhas, f(), grupo('Pidgey', 'Bulbasaur', 'Fora')))).toEqual(['Bulbasaur', 'Pidgey']);
    expect(nomes(filtrar(linhas, f({ q: 'pid' }), grupo('Pidgey', 'Bulbasaur')))).toEqual(['Pidgey']);
    expect(filtrar(linhas, f(), grupo())).toEqual([]);
  });
  it('temFiltro (o grupo não conta: não é limpo pelo "Limpar filtros")', () => {
    expect(temFiltro(f())).toBe(false);
    expect(temFiltro(f({ q: '  ' }))).toBe(false);
    expect(temFiltro(f({ campos: { tipo: '' } }))).toBe(false);
    expect(temFiltro(f({ q: 'a' }))).toBe(true);
    expect(temFiltro(f({ campos: { tipo: 'Fire' } }))).toBe(true);
    expect(temFiltro(f({ classe: SEM }))).toBe(true);
    expect(temFiltro(f({ linha: 'pendente' }))).toBe(true);
  });
});

describe('filtros do planejamento (classe, linha, busca na habilidade)', () => {
  const linhas = montarLinhas(LISTA, cat());
  const CLS: Record<string, string[]> = { Charizard: ['dragao', 'fogo'], Charmander: ['fogo'], Pidgey: [] };
  const LIN: Record<string, { confirmada?: boolean }> = { Bulbasaur: { confirmada: true }, Charmander: {}, Charizard: {} };
  const ctx: Contexto = {
    grupo: null,
    classes: n => CLS[n],
    linha: n => LIN[n],
    texto: n => (n === 'Pikachu' ? 'choque do trovao\neletrico' : ''),
  };
  it('classe: quem tem a classe; SEM = sem classe nenhuma', () => {
    expect(nomes(filtrar(linhas, f({ classe: 'fogo' }), ctx))).toEqual(['Charmander', 'Charizard']);
    expect(nomes(filtrar(linhas, f({ classe: 'dragao' }), ctx))).toEqual(['Charizard']);
    expect(nomes(filtrar(linhas, f({ classe: SEM }), ctx))).toEqual(['Bulbasaur', 'Pidgey', 'Pikachu', 'Agumon']);
  });
  it('linha: com, sem, confirmada, não confirmada', () => {
    expect(nomes(filtrar(linhas, f({ linha: 'com' }), ctx))).toEqual(['Bulbasaur', 'Charmander', 'Charizard']);
    expect(nomes(filtrar(linhas, f({ linha: 'sem' }), ctx))).toEqual(['Pidgey', 'Pikachu', 'Agumon']);
    expect(nomes(filtrar(linhas, f({ linha: 'confirmada' }), ctx))).toEqual(['Bulbasaur']);
    expect(nomes(filtrar(linhas, f({ linha: 'pendente' }), ctx))).toEqual(['Charmander', 'Charizard']);
  });
  it('a busca olha também a habilidade (cada termo em qualquer lugar)', () => {
    expect(nomes(filtrar(linhas, f({ q: 'trovão' }), ctx))).toEqual(['Pikachu']);
    expect(nomes(filtrar(linhas, f({ q: 'pika eletrico' }), ctx))).toEqual(['Pikachu']);
  });
  it('tudo junto: grupo E classe E linha', () => {
    expect(nomes(filtrar(linhas, f({ classe: 'fogo', linha: 'pendente' }), { ...ctx, grupo: new Set(['Charizard', 'Pidgey']) }))).toEqual(['Charizard']);
  });
  it('opcoesClasse: toda classe, mesmo sem ninguém, e "sem classe"; acompanha os outros filtros', () => {
    expect(opcoesClasse(linhas, ['dragao', 'fogo', 'anjo'], f(), ctx)).toEqual([
      { valor: 'dragao', n: 1 }, { valor: 'fogo', n: 2 }, { valor: 'anjo', n: 0 }, { valor: SEM, n: 4 },
    ]);
    expect(opcoesClasse(linhas, ['dragao', 'fogo'], f({ classe: 'dragao', q: 'char' }), ctx)).toEqual([
      { valor: 'dragao', n: 1 }, { valor: 'fogo', n: 2 }, { valor: SEM, n: 0 },
    ]);
    // classe que não existe mais na lista não conta (o personagem fica "sem classe")
    expect(opcoesClasse(linhas, ['dragao'], f({ q: 'charmander' }), ctx)).toEqual([{ valor: 'dragao', n: 0 }, { valor: SEM, n: 1 }]);
    expect(filtrar(linhas, f({ classe: 'fogo' }), ctx, F_CLASSE)).toHaveLength(6);
  });
  it('opcoesLinha conta cada situação', () => {
    expect(opcoesLinha(linhas, f(), ctx)).toEqual([
      { valor: 'com', n: 3 }, { valor: 'sem', n: 3 }, { valor: 'confirmada', n: 1 }, { valor: 'pendente', n: 2 },
    ]);
    expect(opcoesLinha(linhas, f({ classe: 'fogo', linha: 'sem' }), ctx)).toEqual([
      { valor: 'com', n: 2 }, { valor: 'sem', n: 0 }, { valor: 'confirmada', n: 0 }, { valor: 'pendente', n: 2 },
    ]);
  });
});

describe('opcoes', () => {
  const linhas = montarLinhas(LISTA, cat());
  it('cada valor com a contagem, em ordem natural; quem não tem o campo vira "sem informação" no fim', () => {
    expect(opcoes(linhas, 'tipo', f(), NADA)).toEqual([
      { valor: 'Fire', n: 2 }, { valor: 'Flying', n: 2 }, { valor: 'Grass', n: 1 }, { valor: 'Normal', n: 1 }, { valor: 'Poison', n: 1 },
      { valor: SEM, n: 2 },
    ]);
    expect(opcoes(linhas, 'geracao', f(), NADA)).toEqual([{ valor: 'I', n: 4 }, { valor: SEM, n: 2 }]);
    expect(opcoes(linhas, 'peso', f(), NADA)).toEqual([{ valor: '69', n: 1 }, { valor: '85', n: 1 }, { valor: SEM, n: 4 }]);
  });
  it('acompanha os outros filtros, mas não o do próprio campo', () => {
    expect(opcoes(linhas, 'tipo', f({ q: 'char', campos: { tipo: 'Fire' } }), NADA)).toEqual([{ valor: 'Fire', n: 2 }, { valor: 'Flying', n: 1 }]);
    expect(opcoes(linhas, 'tipo', f(), grupo('Pidgey'))).toEqual([{ valor: 'Flying', n: 1 }, { valor: 'Normal', n: 1 }]);
  });
  it('o valor escolhido continua na lista mesmo sem ninguém', () => {
    expect(opcoes(linhas, 'tipo', f({ q: 'pidgey', campos: { tipo: 'Grass' } }), NADA)).toEqual([
      { valor: 'Flying', n: 1 }, { valor: 'Grass', n: 0 }, { valor: 'Normal', n: 1 },
    ]);
    expect(opcoes(linhas, 'peso', f({ q: 'bulba', campos: { peso: SEM } }), NADA)).toEqual([{ valor: '69', n: 1 }, { valor: SEM, n: 0 }]);
  });
  it('distintos conta os valores diferentes da franquia inteira e quem tem o campo', () => {
    expect(distintos(linhas, 'tipo')).toEqual({ valores: 5, com: 4 });
    expect(distintos(linhas, 'nada')).toEqual({ valores: 0, com: 0 });
  });
  it('filtravel: campo sem valor, com valores demais ou quase um por personagem não ganha seletor', () => {
    expect(filtravel(linhas, 'tipo')).toBe(true);
    expect(filtravel(linhas, 'nada')).toBe(false);
    const lista = (n: number, v: (i: number) => string) => montarLinhas(Array.from({ length: n }, (_, i) => ({ name: 'P' + i, img: '' })),
      parseCatalogo({ campos: [{ id: 'c', rotulo: 'C' }], itens: Object.fromEntries(Array.from({ length: n }, (_, i) => ['P' + i, { c: v(i) }])) }));
    // poucos valores: sempre (mesmo um por personagem)
    expect(filtravel(lista(20, i => 'v' + i), 'c')).toBe(true);
    // número da Sujidex: um por personagem
    expect(filtravel(lista(300, i => String(i)), 'c')).toBe(false);
    // arquétipo: 450 valores em 3000 personagens
    expect(filtravel(lista(3000, i => 'a' + (i % 450)), 'c')).toBe(true);
    // local do Final Fantasy: 2000 valores
    expect(filtravel(lista(3500, i => 'l' + (i % 2000)), 'c')).toBe(false);
  });
});

describe('marcações', () => {
  it('limparMarcas: só listas de textos, sem repetidos e sem franquia vazia', () => {
    expect(limparMarcas({ pokemon: ['A', 'B', 'A', 3, ''], lol: [], x: 'texto', y: { a: 1 } })).toEqual({ pokemon: ['A', 'B'] });
    expect(limparMarcas(null)).toEqual({});
    expect(limparMarcas(['A'])).toEqual({});
  });
  it('juntarMarcas soma sem repetir, as atuais na frente, e conta as novas', () => {
    const r = juntarMarcas({ pokemon: ['A', 'B'], lol: ['Ahri'] }, { pokemon: ['B', 'C'], digimon: ['Agumon'] });
    expect(r.marcas).toEqual({ pokemon: ['A', 'B', 'C'], lol: ['Ahri'], digimon: ['Agumon'] });
    expect(r.novas).toBe(2);
  });
});

describe('exportar e importar', () => {
  const c = cat();
  const exp = () => montarExportacao({
    marcas: { pokemon: ['Pikachu', 'Charizard', 'Fora da lista', 'Agumon', 'Bulbasaur'], lol: ['Ahri'], smt: [] },
    ordem: ['pokemon', 'smt', 'lol'],
    listas: { pokemon: LISTA, lol: null },
    catalogos: { pokemon: c, lol: null },
    rotulo: k => ({ pokemon: 'Pokémon', lol: 'LoL', smt: 'SMT' })[k] ?? k,
    geradoEm: '2026-10-25T12:00:00.000Z',
  });
  it('só franquias com marcados, na ordem pedida; personagens na ordem da lista com imagem e informações', () => {
    const e = exp();
    expect(e.geradoEm).toBe('2026-10-25T12:00:00.000Z');
    expect(Object.keys(e.franquias)).toEqual(['pokemon', 'lol']);
    expect(e.franquias.pokemon).toEqual({
      rotulo: 'Pokémon',
      fonte: 'PokeAPI (GraphQL)',
      campos: [{ id: 'tipo', rotulo: 'Tipo' }, { id: 'geracao', rotulo: 'Geração' }, { id: 'peso', rotulo: 'Peso' }],
      personagens: [
        { nome: 'Bulbasaur', img: 'img/Bulbasaur.png', tipo: ['Grass', 'Poison'], geracao: 'I', peso: 69 },
        { nome: 'Charizard', img: 'img/Charizard.png', tipo: ['Fire', 'Flying'], geracao: 'I' },
        { nome: 'Pikachu', img: 'img/Pikachu.png' },
        { nome: 'Agumon', img: 'https://x/agumon.png' },
        { nome: 'Fora da lista', img: '' },
      ],
    });
  });
  it('franquia sem catálogo e sem lista carregada: fonte null e só os nomes', () => {
    expect(exp().franquias.lol).toEqual({ rotulo: 'LoL', fonte: null, campos: [], personagens: [{ nome: 'Ahri', img: '' }] });
  });
  it('campo chamado "nome" ou "img" não sobrescreve o nome e a imagem', () => {
    const c2 = parseCatalogo({ campos: [{ id: 'nome', rotulo: 'Nome' }, { id: 'img', rotulo: 'Img' }, { id: 'a', rotulo: 'A' }], itens: { X: { nome: 'outro', img: 'y', a: 'ok' } } })!;
    const e = montarExportacao({ marcas: { k: ['X'] }, ordem: ['k'], listas: { k: [{ name: 'X', img: 'x.png' }] }, catalogos: { k: c2 }, rotulo: () => 'K', geradoEm: '' });
    expect(e.franquias.k!.personagens).toEqual([{ nome: 'X', img: 'x.png', a: 'ok' }]);
  });
  it('com o plano: classes, habilidade e linha em cada personagem, o grupo e o plano inteiro no arquivo', () => {
    const plano = { versao: 1 as const, unidades: {}, linhas: {} };
    const e = montarExportacao({
      marcas: { pokemon: ['Charizard', 'Pidgey'] }, ordem: ['pokemon'], listas: { pokemon: LISTA }, catalogos: { pokemon: c }, rotulo: () => 'Pokémon',
      geradoEm: 'x',
      plano: {
        grupo: 'base',
        plano,
        extras: (k, nome) => (nome === 'Charizard' ? { classes: [k], habilidade: 'Lança-chamas', linha: { nome: 'Charmander', nivel: 3, de: 3, confirmada: false } } : {}),
      },
    });
    expect(e.grupo).toBe('base');
    expect(e.plano).toBe(plano);
    expect(e.franquias.pokemon!.personagens).toEqual([
      { nome: 'Charizard', img: 'img/Charizard.png', tipo: ['Fire', 'Flying'], geracao: 'I', classes: ['pokemon'], habilidade: 'Lança-chamas', linha: { nome: 'Charmander', nivel: 3, de: 3, confirmada: false } },
      { nome: 'Pidgey', img: 'img/Pidgey.png', tipo: ['Normal', 'Flying'], geracao: 'I' },
    ]);
    // sem plano, o arquivo fica como antes (sem grupo nem plano)
    expect(Object.keys(exp())).toEqual(['geradoEm', 'franquias']);
  });
  it('campo da fonte chamado "classes", "habilidade" ou "linha" não entra (são do planejamento)', () => {
    const c2 = parseCatalogo({ campos: ['classes', 'habilidade', 'linha', 'a'].map(id => ({ id, rotulo: id })), itens: { X: { classes: 'fonte', habilidade: 'fonte', linha: 'fonte', a: 'ok' } } })!;
    const e = montarExportacao({ marcas: { k: ['X'] }, ordem: ['k'], listas: { k: [{ name: 'X', img: '' }] }, catalogos: { k: c2 }, rotulo: () => 'K', geradoEm: '' });
    expect(e.franquias.k!.personagens).toEqual([{ nome: 'X', img: '', a: 'ok' }]);
  });
  it('lerImportacao traz o plano do arquivo; o arquivo do grupo base não marca ninguém', () => {
    const plano = { classes: [{ id: 'dragao', nome: 'Dragão' }], unidades: { pokemon: { Charizard: { classes: ['dragao'], habilidade: 'Voa' } } }, linhas: {} };
    const r = lerImportacao({ geradoEm: '', grupo: 'marcados', franquias: { pokemon: { personagens: [{ nome: 'Charizard' }] } }, plano }, ['pokemon']);
    expect(r!.marcas).toEqual({ pokemon: ['Charizard'] });
    expect(r!.plano).toEqual({ versao: 1, ...plano });
    const b = lerImportacao({ geradoEm: '', grupo: 'base', franquias: { pokemon: { personagens: [{ nome: 'Charizard' }] }, zzz: { personagens: [] } }, plano }, ['pokemon']);
    expect(b).toEqual({ marcas: {}, ignoradas: ['zzz'], plano: { versao: 1, ...plano } });
  });
  it('lerImportacao lê o próprio set1.json exportado (ida e volta)', () => {
    const r = lerImportacao(JSON.parse(JSON.stringify(exp())), ['pokemon', 'lol']);
    expect(r).toEqual({ marcas: { pokemon: ['Bulbasaur', 'Charizard', 'Pikachu', 'Agumon', 'Fora da lista'], lol: ['Ahri'] }, ignoradas: [], plano: null });
  });
  it('lerImportacao aceita as marcações cruas e ignora franquia desconhecida', () => {
    expect(lerImportacao({ pokemon: ['A', 'A', 'B'], c_meu: ['x'], lol: [] }, ['pokemon', 'lol'])).toEqual({ marcas: { pokemon: ['A', 'B'] }, ignoradas: ['c_meu'], plano: null });
    expect(lerImportacao({ franquias: { pokemon: { personagens: ['A', { nome: 'B' }, { x: 1 }, 7] }, zzz: { personagens: [{ nome: 'Q' }] } } }, ['pokemon']))
      .toEqual({ marcas: { pokemon: ['A', 'B'] }, ignoradas: ['zzz'], plano: null });
  });
  it('lerImportacao: formato estranho -> null', () => {
    expect(lerImportacao(null, ['pokemon'])).toBeNull();
    expect(lerImportacao([['pokemon']], ['pokemon'])).toBeNull();
    expect(lerImportacao({ pokemon: 'A' }, ['pokemon'])).toBeNull();
    expect(lerImportacao('texto', ['pokemon'])).toBeNull();
  });
});
