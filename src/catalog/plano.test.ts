import { describe, expect, it } from 'vitest';
import {
  adicionarClasse, adicionarMembro, alternarClasse, apagarLinha, classesDaUnidade, classesEfetivas, confirmarLinha, criarLinha,
  descreverClasse, extrasDoPersonagem, idUnico, indiceLinhas, limparClasses, limparLinhas, limparPlano, limparUnidades,
  linhasEfetivas, moverClasse, moverMembro, mudarUnidade, parseBase, planoCompleto, planoVazio, removerMembro, renomearClasse,
  renomearLinha, restaurarPlano, resumoPlano, slug, tirarClasseDeTodos, ultEfetiva, ultPraGravar, type Base, type LinhaEvo, type Plano,
} from './plano';

const L = (id: string, ...niveis: string[][]): LinhaEvo => ({ id, nome: id, niveis });
const CHAR = L('charmander', ['Charmander'], ['Charmeleon'], ['Charizard']);
const RALTS = L('ralts', ['Ralts'], ['Kirlia'], ['Gardevoir', 'Gallade']);
const LINHAS = [CHAR, RALTS];
const niveis = (ls: LinhaEvo[], id: string) => ls.find(l => l.id === id)?.niveis;

const BASE_JSON = {
  versao: 1,
  geradoEm: '2026-10-26',
  classes: [{ id: 'dragao', nome: 'Dragão' }, { id: 'anjo', nome: 'Anjo', descricao: 'Cura' }],
  selecao: { pokemon: ['Charmander', 'Charizard', 'Ralts'], lol: ['Ahri'], vazia: [] },
  linhas: { pokemon: [CHAR, RALTS], persona: [L('orpheus', ['Orpheus', 'Orpheus F'], ['Messiah'])] },
  itens: { componentes: [{ id: 'pyrus' }] },
  ults: { pokemon: { Charizard: 'Mega Charizard X', Vazio: '  ', Numero: 3 }, lol: 'x' },
};
const base = (): Base => parseBase(structuredClone(BASE_JSON))!;

describe('slug e idUnico', () => {
  it('sem acento, minúsculas, traços', () => {
    expect(slug('Criaturinha Bizarra')).toBe('criaturinha-bizarra');
    expect(slug('Robô')).toBe('robo');
    expect(slug('  Arsène!! ')).toBe('arsene');
    expect(slug('***')).toBe('x');
  });
  it('acrescenta -2, -3 até achar um livre', () => {
    expect(idUnico('a', new Set())).toBe('a');
    expect(idUnico('a', new Set(['a', 'a-2']))).toBe('a-3');
  });
});

describe('parseBase', () => {
  it('lê classes, seleção e linhas; ignora chaves desconhecidas (itens) e seleção vazia', () => {
    const b = base();
    expect(b.versao).toBe(1);
    expect(b.geradoEm).toBe('2026-10-26');
    expect(b.classes).toEqual([{ id: 'dragao', nome: 'Dragão' }, { id: 'anjo', nome: 'Anjo', descricao: 'Cura' }]);
    expect(b.selecao).toEqual({ pokemon: ['Charmander', 'Charizard', 'Ralts'], lol: ['Ahri'] });
    expect(b.linhas.pokemon).toEqual([CHAR, RALTS]);
    expect(b.linhas.persona![0]!.niveis).toEqual([['Orpheus', 'Orpheus F'], ['Messiah']]);
    expect(Object.keys(b)).toEqual(['versao', 'geradoEm', 'classes', 'selecao', 'linhas', 'ults']);
    // ult sem texto (ou que não é texto) e franquia que não é objeto ficam de fora
    expect(b.ults).toEqual({ pokemon: { Charizard: 'Mega Charizard X' } });
  });
  it('não é a base -> null', () => {
    expect(parseBase(null)).toBeNull();
    expect(parseBase('<!doctype html>')).toBeNull();
    expect(parseBase([])).toBeNull();
    expect(parseBase({ campos: [], itens: {} })).toBeNull();
  });
  it('só com parte dos campos: o resto fica vazio', () => {
    expect(parseBase({ selecao: { lol: ['Ahri', 'Ahri', 3] } })).toEqual({ versao: 1, geradoEm: '', classes: [], selecao: { lol: ['Ahri'] }, linhas: {}, ults: {} });
  });
});

describe('limpeza do que vem de fora', () => {
  it('classes: id único, nome (ou o id), descrição só com texto', () => {
    expect(limparClasses([{ id: 'a', nome: ' A ', descricao: ' ' }, { id: 'a', nome: 'B' }, { id: 'b' }, { nome: 'sem id' }, 'x', { id: 'c', nome: 'C', descricao: 'd' }]))
      .toEqual([{ id: 'a', nome: 'A' }, { id: 'b', nome: 'b' }, { id: 'c', nome: 'C', descricao: 'd' }]);
    expect(limparClasses('x')).toEqual([]);
  });
  it('linhas: sem nível vazio, personagem só na primeira linha, id que falta ou repete é gerado', () => {
    const l = limparLinhas([
      { id: 'a', nome: 'A', niveis: [['X'], [], ['Y', 'Y', 7]], confirmada: true },
      { id: 'a', nome: 'Outra', niveis: [['X', 'Z']] },
      { niveis: [['W']] },
      { id: 'q', niveis: 'nada' },
      { id: 'vazia', nome: 'Vazia', niveis: [] },
    ], 'pokemon');
    expect(l).toEqual([
      { id: 'a', nome: 'A', niveis: [['X'], ['Y']], confirmada: true },
      { id: 'pokemon:outra', nome: 'Outra', niveis: [['Z']] },
      { id: 'pokemon:w', nome: 'W', niveis: [['W']] },
      { id: 'vazia', nome: 'Vazia', niveis: [] },
    ]);
  });
  it('unidades: classes como textos, habilidade com texto; vazias somem', () => {
    expect(limparUnidades({
      pokemon: { Charizard: { classes: ['dragao', 'dragao', 3], habilidade: '  Voa  ' }, Pidgey: { classes: [], habilidade: '  ' }, Mew: 'x' },
      lol: {},
      smt: 'x',
    })).toEqual({ pokemon: { Charizard: { classes: ['dragao'], habilidade: '  Voa  ' } } });
  });
  it('limparPlano: formato estranho vira plano vazio; classes ausentes continuam ausentes (seguem a base)', () => {
    expect(limparPlano(null)).toEqual(planoVazio());
    expect(limparPlano('x')).toEqual({ versao: 1, unidades: {}, linhas: {} });
    const p = limparPlano({ versao: 7, unidades: { lol: { Ahri: { habilidade: 'Charme' } } }, linhas: { pokemon: [CHAR], lol: 'x' } });
    expect(p).toEqual({ versao: 1, unidades: { lol: { Ahri: { habilidade: 'Charme' } } }, linhas: { pokemon: [CHAR] } });
    expect('classes' in p).toBe(false);
    // lista de linhas vazia é uma escolha do usuário (apagou todas): fica
    expect(limparPlano({ linhas: { pokemon: [] }, classes: [] })).toEqual({ versao: 1, classes: [], unidades: {}, linhas: { pokemon: [] } });
  });
  it('personagem chamado "constructor" não esbarra no protótipo', () => {
    const u = limparUnidades({ pokemon: { constructor: { habilidade: 'x' } } });
    expect(u.pokemon!.constructor).toEqual({ habilidade: 'x' });
    expect(mudarUnidade({}, 'pokemon', 'toString', { habilidade: 'y' }).pokemon!.toString).toEqual({ habilidade: 'y' });
  });
});

describe('plano por cima da base', () => {
  it('sem nada no plano, vale a base; franquia mexida e classes mexidas valem as do plano', () => {
    const b = base();
    const p = planoVazio();
    expect(classesEfetivas(p, b)).toBe(b.classes);
    expect(linhasEfetivas(p, b, 'pokemon')).toBe(b.linhas.pokemon);
    expect(linhasEfetivas(p, b, 'lol')).toEqual([]);
    const mexido: Plano = { ...p, classes: [], linhas: { pokemon: [] } };
    expect(classesEfetivas(mexido, b)).toEqual([]);
    expect(linhasEfetivas(mexido, b, 'pokemon')).toEqual([]);
    expect(linhasEfetivas(mexido, b, 'persona')).toBe(b.linhas.persona);
    expect(classesEfetivas(p, null)).toEqual([]);
    expect(linhasEfetivas(p, null, 'pokemon')).toEqual([]);
  });
});

describe('linhas', () => {
  it('indiceLinhas: linha e nível (0 = primeiro) de cada personagem', () => {
    const i = indiceLinhas(LINHAS);
    expect(i.get('Charmeleon')).toEqual({ linha: CHAR, nivel: 1 });
    expect(i.get('Gallade')).toEqual({ linha: RALTS, nivel: 2 });
    expect(i.has('Pikachu')).toBe(false);
  });
  it('adicionar: num nível que já tem alguém vira alternativa; "inicio" e "fim" criam nível novo', () => {
    let l = adicionarMembro(LINHAS, 'charmander', 'Charizard X', 2);
    expect(niveis(l, 'charmander')).toEqual([['Charmander'], ['Charmeleon'], ['Charizard', 'Charizard X']]);
    l = adicionarMembro(l, 'charmander', 'Mega Charizard', 'fim');
    expect(niveis(l, 'charmander')!.at(-1)).toEqual(['Mega Charizard']);
    l = adicionarMembro(l, 'charmander', 'Ovo', 'inicio');
    expect(niveis(l, 'charmander')![0]).toEqual(['Ovo']);
    // nível fora do intervalo = fim
    expect(niveis(adicionarMembro(LINHAS, 'ralts', 'X', 9), 'ralts')!.at(-1)).toEqual(['X']);
    // não mexe no original
    expect(CHAR.niveis).toEqual([['Charmander'], ['Charmeleon'], ['Charizard']]);
  });
  it('um personagem, uma linha: entrar numa linha tira da outra (e o nível que esvazia some)', () => {
    const l = adicionarMembro(LINHAS, 'ralts', 'Charmeleon', 1);
    expect(niveis(l, 'charmander')).toEqual([['Charmander'], ['Charizard']]);
    expect(niveis(l, 'ralts')).toEqual([['Ralts'], ['Kirlia', 'Charmeleon'], ['Gardevoir', 'Gallade']]);
    expect(l.filter(x => x.niveis.flat().includes('Charmeleon'))).toHaveLength(1);
  });
  it('mover de nível: o destino conta os níveis de antes (o único do nível 1 indo pro 2 vira alternativa lá)', () => {
    expect(niveis(moverMembro(LINHAS, 'charmander', 'Charmander', 1), 'charmander')).toEqual([['Charmeleon', 'Charmander'], ['Charizard']]);
    expect(niveis(moverMembro(LINHAS, 'charmander', 'Charizard', 0), 'charmander')).toEqual([['Charmander', 'Charizard'], ['Charmeleon']]);
    // alternativa vira nível próprio
    expect(niveis(moverMembro(LINHAS, 'ralts', 'Gallade', 'fim'), 'ralts')).toEqual([['Ralts'], ['Kirlia'], ['Gardevoir'], ['Gallade']]);
    // linha que não existe: nada muda
    expect(moverMembro(LINHAS, 'nada', 'X', 0)).toBe(LINHAS);
  });
  it('remover: tira da linha; nível vazio some; quem não está lá não muda nada', () => {
    expect(niveis(removerMembro(LINHAS, 'charmander', 'Charmeleon'), 'charmander')).toEqual([['Charmander'], ['Charizard']]);
    expect(niveis(removerMembro(LINHAS, 'ralts', 'Gallade'), 'ralts')).toEqual([['Ralts'], ['Kirlia'], ['Gardevoir']]);
    expect(removerMembro(LINHAS, 'ralts', 'Charizard')).toBe(LINHAS);
  });
  it('criar: no fim, com o personagem no nível 1 (saindo da outra linha), id sem repetir', () => {
    const r = criarLinha(LINHAS, 'pokemon', '', 'Kirlia');
    expect(r.id).toBe('pokemon:kirlia');
    expect(r.linhas.at(-1)).toEqual({ id: 'pokemon:kirlia', nome: 'Kirlia', niveis: [['Kirlia']] });
    expect(niveis(r.linhas, 'ralts')).toEqual([['Ralts'], ['Gardevoir', 'Gallade']]);
    const v = criarLinha(r.linhas, 'pokemon', '  ');
    expect(v.linhas.at(-1)).toEqual({ id: 'pokemon:nova-linha', nome: 'Nova linha', niveis: [] });
    expect(criarLinha(v.linhas, 'pokemon', 'Nova linha').id).toBe('pokemon:nova-linha-2');
  });
  it('apagar, renomear e confirmar (sem mudança = mesmo array)', () => {
    expect(apagarLinha(LINHAS, 'ralts')).toEqual([CHAR]);
    expect(apagarLinha(LINHAS, 'nada')).toBe(LINHAS);
    expect(renomearLinha(LINHAS, 'ralts', '  Gardevoir  ')[1]!.nome).toBe('Gardevoir');
    expect(renomearLinha(LINHAS, 'ralts', '  ')).toBe(LINHAS);
    expect(renomearLinha(LINHAS, 'ralts', 'ralts')).toBe(LINHAS);
    const c = confirmarLinha(LINHAS, 'ralts', true);
    expect(c[1]).toEqual({ ...RALTS, confirmada: true });
    expect(c[0]).toBe(CHAR);
    expect(confirmarLinha(c, 'ralts', true)).toBe(c);
    expect(confirmarLinha(c, 'ralts', false)[1]).toEqual(RALTS);
    expect('confirmada' in confirmarLinha(c, 'ralts', false)[1]!).toBe(false);
  });
});

describe('classes e unidades', () => {
  const CL = [{ id: 'dragao', nome: 'Dragão' }, { id: 'anjo', nome: 'Anjo' }];
  it('adicionar: id do nome; nome repetido (sem acento/maiúscula) devolve a que existe; vazio não cria', () => {
    const r = adicionarClasse(CL, ' Criaturinha Bizarra ', ' esquisitos ');
    expect(r.id).toBe('criaturinha-bizarra');
    expect(r.classes.at(-1)).toEqual({ id: 'criaturinha-bizarra', nome: 'Criaturinha Bizarra', descricao: 'esquisitos' });
    expect(adicionarClasse(CL, 'DRAGAO')).toEqual({ classes: CL, id: 'dragao' });
    expect(adicionarClasse(CL, '   ')).toEqual({ classes: CL, id: '' });
    expect(adicionarClasse([{ id: 'robo', nome: 'Máquina' }], 'Robô').id).toBe('robo-2');
  });
  it('renomear, descrever e mover', () => {
    expect(renomearClasse(CL, 'anjo', 'Anjos')[1]).toEqual({ id: 'anjo', nome: 'Anjos' });
    expect(renomearClasse(CL, 'anjo', ' ')).toBe(CL);
    // fica como foi digitado (é salvo enquanto digita); só espaços = sem descrição
    const d = descreverClasse(CL, 'anjo', 'Curam ');
    expect(d[1]).toEqual({ id: 'anjo', nome: 'Anjo', descricao: 'Curam ' });
    expect(descreverClasse(d, 'anjo', '  ')[1]).toEqual({ id: 'anjo', nome: 'Anjo' });
    expect(descreverClasse(CL, 'anjo', '')).toBe(CL);
    expect(moverClasse(CL, 'anjo', -1).map(c => c.id)).toEqual(['anjo', 'dragao']);
    expect(moverClasse(CL, 'anjo', 1)).toBe(CL);
  });
  it('alternar classe e habilidade; unidade vazia some, e a franquia sem ninguém também', () => {
    let u = alternarClasse({}, 'pokemon', 'Charizard', 'dragao');
    u = alternarClasse(u, 'pokemon', 'Charizard', 'anjo');
    expect(u).toEqual({ pokemon: { Charizard: { classes: ['dragao', 'anjo'] } } });
    u = mudarUnidade(u, 'pokemon', 'Charizard', { habilidade: 'Lança-chamas\nem área' });
    expect(u.pokemon!.Charizard).toEqual({ classes: ['dragao', 'anjo'], habilidade: 'Lança-chamas\nem área' });
    u = alternarClasse(u, 'pokemon', 'Charizard', 'dragao');
    u = alternarClasse(u, 'pokemon', 'Charizard', 'anjo');
    expect(u.pokemon!.Charizard).toEqual({ habilidade: 'Lança-chamas\nem área' });
    expect(mudarUnidade(u, 'pokemon', 'Charizard', { habilidade: '  ' })).toEqual({});
  });
  it('remover uma classe tira de todo mundo (e quem fica vazio some)', () => {
    let u = alternarClasse({}, 'pokemon', 'Charizard', 'dragao');
    u = alternarClasse(u, 'pokemon', 'Dragonite', 'dragao');
    u = alternarClasse(u, 'pokemon', 'Dragonite', 'anjo');
    u = mudarUnidade(u, 'lol', 'Ahri', { habilidade: 'Charme' });
    const r = tirarClasseDeTodos(u, 'dragao');
    expect(r).toEqual({ pokemon: { Dragonite: { classes: ['anjo'] } }, lol: { Ahri: { habilidade: 'Charme' } } });
    expect(r.lol).toBe(u.lol);
    expect(tirarClasseDeTodos(u, 'nada')).toBe(u);
  });
  it('classesDaUnidade: só as que existem, na ordem da lista de classes', () => {
    expect(classesDaUnidade({ classes: ['anjo', 'sumiu', 'dragao'] }, CL).map(c => c.nome)).toEqual(['Dragão', 'Anjo']);
    expect(classesDaUnidade(undefined, CL)).toEqual([]);
  });
});

describe('exportar e restaurar', () => {
  const b = base();
  it('extrasDoPersonagem: nomes das classes, habilidade e linha (nível a partir de 1, alternativas)', () => {
    const i = indiceLinhas(confirmarLinha(LINHAS, 'ralts', true));
    expect(extrasDoPersonagem('Gardevoir', { classes: ['anjo', 'x'], habilidade: ' Cura \n' }, b.classes, i.get('Gardevoir'))).toEqual({
      classes: ['Anjo'], habilidade: 'Cura', linha: { nome: 'ralts', nivel: 3, de: 3, confirmada: true, alternativas: ['Gallade'] },
    });
    expect(extrasDoPersonagem('Charmeleon', undefined, b.classes, indiceLinhas(LINHAS).get('Charmeleon'))).toEqual({
      linha: { nome: 'charmander', nivel: 2, de: 3, confirmada: false },
    });
    expect(extrasDoPersonagem('Pikachu', undefined, b.classes, undefined)).toEqual({});
  });
  it('planoCompleto: classes e linhas que valem agora (da base ou mudadas), só das franquias pedidas', () => {
    const p: Plano = { versao: 1, unidades: { pokemon: { Charizard: { habilidade: 'x' } }, zzz: { A: { habilidade: 'y' } } }, linhas: { lol: [] } };
    expect(planoCompleto(p, b, ['pokemon', 'persona', 'lol', 'smt'])).toEqual({
      versao: 1, classes: b.classes, unidades: { pokemon: { Charizard: { habilidade: 'x', ult: 'Mega Charizard X' } } },
      linhas: { pokemon: b.linhas.pokemon, persona: b.linhas.persona, lol: [] },
    });
  });
  it('restaurarPlano: o arquivo substitui classes, linhas da franquia e cada personagem; o resto fica', () => {
    const atual: Plano = {
      versao: 1,
      unidades: { pokemon: { Charizard: { classes: ['dragao'] }, Pidgey: { habilidade: 'Voa' } }, lol: { Ahri: { habilidade: 'Charme' } } },
      linhas: { persona: [] },
    };
    const arq: Plano = {
      versao: 1,
      classes: [...b.classes, { id: 'robo', nome: 'Robô' }],
      unidades: { pokemon: { Charizard: { classes: ['robo'], habilidade: 'Laser' } }, zzz: { X: { habilidade: 'ignorado' } } },
      linhas: { pokemon: confirmarLinha(b.linhas.pokemon!, 'ralts', true), zzz: [] },
    };
    const r = restaurarPlano(atual, arq, b, ['pokemon', 'lol', 'persona']);
    expect(r.classes).toEqual(arq.classes);
    expect(r.unidades).toEqual({
      pokemon: { Charizard: { classes: ['robo'], habilidade: 'Laser' }, Pidgey: { habilidade: 'Voa' } },
      lol: { Ahri: { habilidade: 'Charme' } },
    });
    expect(r.linhas).toEqual({ persona: [], pokemon: arq.linhas.pokemon });
  });
  it('restaurarPlano: o que é igual à base volta a seguir a base; classe que sumiu sai das unidades', () => {
    const atual: Plano = { versao: 1, classes: [{ id: 'x', nome: 'X' }], unidades: { pokemon: { Mew: { classes: ['x', 'dragao'] } } }, linhas: { pokemon: [] } };
    const arq = planoCompleto(planoVazio(), b, ['pokemon', 'persona']);
    const r = restaurarPlano(atual, arq, b, ['pokemon', 'persona']);
    expect(r).toEqual({ versao: 1, unidades: { pokemon: { Mew: { classes: ['dragao'] } } }, linhas: {} });
    expect(classesEfetivas(r, b)).toBe(b.classes);
  });
  it('restaurarPlano sem base: guarda o que veio; sem classes em lugar nenhum, não tira classe de ninguém', () => {
    const arq: Plano = { versao: 1, unidades: { pokemon: { Mew: { classes: ['q'] } } }, linhas: { pokemon: [CHAR] } };
    expect(restaurarPlano(planoVazio(), arq, null, ['pokemon'])).toEqual(arq);
  });
  it('resumoPlano', () => {
    expect(resumoPlano({ versao: 1, classes: [], unidades: { a: { X: { habilidade: 'h' }, Y: { habilidade: 'h' } }, b: { Z: { habilidade: 'h' } } }, linhas: { a: [] } }))
      .toEqual({ classes: 0, unidades: 3, franquiasComLinhas: 1 });
    expect(resumoPlano(planoVazio()).classes).toBeNull();
  });
});

describe('ult (forma em que a unidade vira)', () => {
  const b = base();
  it('vale a do plano (mesmo vazia: tirada), senão a da base', () => {
    expect(ultEfetiva(undefined, 'Mega Charizard X')).toBe('Mega Charizard X');
    expect(ultEfetiva({ habilidade: 'x' }, 'Mega Charizard X')).toBe('Mega Charizard X');
    expect(ultEfetiva({ ult: 'Gigantamax Charizard' }, 'Mega Charizard X')).toBe('Gigantamax Charizard');
    expect(ultEfetiva({ ult: '' }, 'Mega Charizard X')).toBe('');
    expect(ultEfetiva(undefined, undefined)).toBe('');
  });
  it('o que gravar: igual à da base = nada (segue a base); tirar a da base = vazio; sem base, tirar = nada', () => {
    expect(ultPraGravar('Mega Charizard X', 'Mega Charizard X')).toBeUndefined();
    expect(ultPraGravar('Gigantamax Charizard', 'Mega Charizard X')).toBe('Gigantamax Charizard');
    expect(ultPraGravar('', 'Mega Charizard X')).toBe('');
    expect(ultPraGravar('', undefined)).toBeUndefined();
    expect(ultPraGravar(' Mega Venusaur ', undefined)).toBe('Mega Venusaur');
  });
  it('unidade só com a ult tirada (vazia) não some: é o que impede a da base de voltar', () => {
    let u = mudarUnidade({}, 'pokemon', 'Charizard', { ult: '' });
    expect(u).toEqual({ pokemon: { Charizard: { ult: '' } } });
    u = mudarUnidade(u, 'pokemon', 'Charizard', { habilidade: 'Voa' });
    expect(u.pokemon!.Charizard).toEqual({ habilidade: 'Voa', ult: '' });
    // ult undefined = volta a seguir a base
    expect(mudarUnidade(u, 'pokemon', 'Charizard', { ult: undefined }).pokemon!.Charizard).toEqual({ habilidade: 'Voa' });
    expect(limparUnidades({ pokemon: { Charizard: { ult: '' }, Pidgey: { ult: 3 } } })).toEqual({ pokemon: { Charizard: { ult: '' } } });
    expect(limparPlano({ unidades: { pokemon: { Venusaur: { ult: 'Mega Venusaur', classes: [] } } } }).unidades).toEqual({ pokemon: { Venusaur: { ult: 'Mega Venusaur' } } });
  });
  it('exportação: o personagem leva a ult que vale; o plano completo escreve a da base em quem não mexeu', () => {
    expect(extrasDoPersonagem('Charizard', undefined, b.classes, undefined, 'Mega Charizard X')).toEqual({ ult: 'Mega Charizard X' });
    expect(extrasDoPersonagem('Charizard', undefined, b.classes, undefined, '')).toEqual({});
    const tirada: Plano = { versao: 1, unidades: { pokemon: { Charizard: { ult: '' }, Venusaur: { ult: 'Mega Venusaur' } } }, linhas: {} };
    expect(planoCompleto(tirada, b, ['pokemon']).unidades).toEqual({ pokemon: { Charizard: { ult: '' }, Venusaur: { ult: 'Mega Venusaur' } } });
    expect(planoCompleto(planoVazio(), b, ['pokemon', 'lol']).unidades).toEqual({ pokemon: { Charizard: { ult: 'Mega Charizard X' } } });
  });
  it('importação: ult igual à da base volta a seguir a base; diferente ou tirada fica', () => {
    const arq: Plano = {
      versao: 1,
      unidades: { pokemon: { Charizard: { ult: 'Mega Charizard X', habilidade: 'Voa' }, Venusaur: { ult: 'Mega Venusaur' } } },
      linhas: {},
    };
    expect(restaurarPlano(planoVazio(), arq, b, ['pokemon']).unidades).toEqual({ pokemon: { Charizard: { habilidade: 'Voa' }, Venusaur: { ult: 'Mega Venusaur' } } });
    // só a ult da base: o personagem sai do plano (inclusive o que havia antes, que o arquivo substitui)
    const atual: Plano = { versao: 1, unidades: { pokemon: { Charizard: { ult: '' } } }, linhas: {} };
    const so: Plano = { versao: 1, unidades: { pokemon: { Charizard: { ult: 'Mega Charizard X' } } }, linhas: {} };
    expect(restaurarPlano(atual, so, b, ['pokemon']).unidades).toEqual({});
    const tirou: Plano = { versao: 1, unidades: { pokemon: { Charizard: { ult: '' } } }, linhas: {} };
    expect(restaurarPlano(planoVazio(), tirou, b, ['pokemon']).unidades).toEqual({ pokemon: { Charizard: { ult: '' } } });
    // sem base: guarda como veio
    expect(restaurarPlano(planoVazio(), so, null, ['pokemon']).unidades).toEqual(so.unidades);
  });
});
