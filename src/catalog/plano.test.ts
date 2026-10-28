import { describe, expect, it } from 'vitest';
import {
  adicionarClasse, adicionarMembro, alternarClasse, apagarLinha, classesDaUnidade, classesEfetivas, classesVistasAgora, compactarLinhas, confirmarLinha,
  criarLinha, definirDe, descreverClasse, extrasDoPersonagem, guardarLinhas, idUnico, indiceLinhas, limparClasses, limparLinhas, limparPlano,
  limparSalvas, limparUnidades, linhasCompletas, linhasEfetivas, linhasMudadas, mesclarLinhas, moverClasse, moverMembro, mudarUnidade,
  parseBase, planoCompleto, planoVazio, removerMembro, renomearClasse, renomearLinha, restaurarPlano, resumoPlano, slug,
  custoDaLinha, custoDoCampeao, habilidadeEfetiva, mudarUltDaClasse, tirarClasseDeTodos, ultDaClasse, ultEfetiva, ultPraGravar, type Base, type LinhaEvo, type LinhaSalva, type Plano,
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
    expect(Object.keys(b)).toEqual(['versao', 'geradoEm', 'classes', 'selecao', 'linhas', 'ults', 'habilidades']);
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
    expect(parseBase({ selecao: { lol: ['Ahri', 'Ahri', 3] } })).toEqual({ versao: 1, geradoEm: '', classes: [], selecao: { lol: ['Ahri'] }, linhas: {}, ults: {}, habilidades: {} });
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
    expect(limparPlano({ classes: [], classesVistas: ['a', 'a', 3, ''] }).classesVistas).toEqual(['a']);
    expect('classesVistas' in limparPlano({ classesVistas: 'a' })).toBe(false);
  });
  it('personagem chamado "constructor" não esbarra no protótipo', () => {
    const u = limparUnidades({ pokemon: { constructor: { habilidade: 'x' } } });
    expect(u.pokemon!.constructor).toEqual({ habilidade: 'x' });
    expect(mudarUnidade({}, 'pokemon', 'toString', { habilidade: 'y' }).pokemon!.toString).toEqual({ habilidade: 'y' });
  });
});

describe('plano por cima da base', () => {
  it('sem nada no plano, vale a base; classes mexidas valem as do plano; linhas apagadas somem', () => {
    const b = base();
    const p = planoVazio();
    expect(classesEfetivas(p, b)).toBe(b.classes);
    expect(linhasEfetivas(p, b, 'pokemon')).toBe(b.linhas.pokemon);
    expect(linhasEfetivas(p, b, 'lol')).toEqual([]);
    const mexido: Plano = { ...p, classes: [], apagadas: { pokemon: ['charmander', 'ralts'] } };
    expect(classesEfetivas(mexido, b)).toEqual([]);
    expect(linhasEfetivas(mexido, b, 'pokemon')).toEqual([]);
    expect(linhasEfetivas(mexido, b, 'persona')).toBe(b.linhas.persona);
    expect(classesEfetivas(p, null)).toEqual([]);
    expect(linhasEfetivas(p, null, 'pokemon')).toEqual([]);
  });
  it('classes: as que a base ganhou depois entram no fim; as que o usuário removeu não voltam', () => {
    const b: Base = { ...base(), classes: [{ id: 'dragao', nome: 'Dragão' }, { id: 'anjo', nome: 'Anjo' }, { id: 'tanque', nome: 'Tanque' }, { id: 'fogo', nome: 'Fogo' }] };
    // plano de antes das classes vistas: tirou o Anjo (que a base já tinha) e criou o Robô
    const antigo: Plano = { ...planoVazio(), classes: [{ id: 'dragao', nome: 'Dragão' }, { id: 'robo', nome: 'Robô' }] };
    expect(classesEfetivas(antigo, b).map(c => c.id)).toEqual(['dragao', 'robo', 'tanque', 'fogo']);
    // já viu o Tanque e tirou: só o Fogo é novo
    const viu: Plano = { ...antigo, classesVistas: ['dragao', 'anjo', 'tanque'] };
    expect(classesEfetivas(viu, b).map(c => c.id)).toEqual(['dragao', 'robo', 'fogo']);
    // nada novo: o próprio array do plano
    const tudo: Plano = { ...antigo, classesVistas: ['dragao', 'anjo', 'tanque', 'fogo'] };
    expect(classesEfetivas(tudo, b)).toBe(tudo.classes);
    expect(classesEfetivas(antigo, null)).toBe(antigo.classes);
    expect(classesVistasAgora(antigo, b)).toEqual(['dragao', 'anjo', 'tanque', 'fogo']);
    expect(classesVistasAgora(viu, null)).toBe(viu.classesVistas);
  });
  it('classes: a que a base tirou depois que o plano viu sai do plano também; a criada pelo usuário fica', () => {
    const b: Base = { ...base(), classes: [{ id: 'dragao', nome: 'Dragão' }, { id: 'fogo', nome: 'Fogo' }] };
    const p: Plano = {
      ...planoVazio(),
      classes: [{ id: 'dragao', nome: 'Dragão' }, { id: 'luz', nome: 'Luz' }, { id: 'minha', nome: 'Minha' }, { id: 'fogo', nome: 'Fogo' }],
      classesVistas: ['dragao', 'luz', 'fogo'],
    };
    expect(classesEfetivas(p, b).map(c => c.id)).toEqual(['dragao', 'minha', 'fogo']);
    // sem a base não dá pra saber o que saiu
    expect(classesEfetivas(p, null)).toBe(p.classes);
  });
});

describe('linhas por cima da base, uma por uma (mesclarLinhas, guardarLinhas, compactarLinhas)', () => {
  // a base mudou depois: a linha do Charmander ganhou a Mega
  const BASE_NOVA = [L('charmander', ['Charmander'], ['Charmeleon'], ['Charizard'], ['Mega Charizard X']), RALTS, L('pikachu', ['Pikachu'], ['Raichu'])];
  const ids = (ls: LinhaEvo[]) => ls.map(l => l.id);

  it('confirmação guardada não fixa a linha: nome e níveis seguem a base', () => {
    const r = mesclarLinhas(BASE_NOVA, [{ id: 'charmander', confirmada: true }]);
    expect(r[0]).toEqual({ ...BASE_NOVA[0], confirmada: true });
    expect(r[1]).toEqual(RALTS);
    expect(ids(r)).toEqual(['charmander', 'ralts', 'pikachu']);
  });
  it('formato antigo (a franquia inteira copiada, sem "editada"): nada fica fixo; a base nova aparece', () => {
    // o plano antigo tinha só Charmander e Ralts (sem a Mega e sem a linha do Pikachu), com o Ralts confirmado
    const antigo = limparSalvas([CHAR, { ...RALTS, confirmada: true }, { id: 'minha', nome: 'Minha', niveis: [['Pidgey'], ['Pidgeotto']] }], 'pokemon');
    const r = mesclarLinhas(BASE_NOVA, antigo);
    expect(ids(r)).toEqual(['charmander', 'ralts', 'pikachu', 'minha']);
    expect(r[0]!.niveis).toEqual(BASE_NOVA[0]!.niveis);
    expect(r[1]).toEqual({ ...RALTS, confirmada: true });
    // a linha que não está na base é do usuário
    expect(r[3]).toEqual({ id: 'minha', nome: 'Minha', niveis: [['Pidgey'], ['Pidgeotto']], editada: true });
    expect(linhasMudadas(antigo, [], BASE_NOVA)).toBe(true);
    expect(linhasMudadas(limparSalvas([CHAR, RALTS]), [], BASE_NOVA)).toBe(false);
  });
  it('linha mexida (editada) vale inteira, mesmo com a base mudando; e fica com os personagens dela', () => {
    const mexida: LinhaSalva = { id: 'pikachu', nome: 'Pikachu', niveis: [['Pikachu'], ['Raichu'], ['Charizard']], editada: true };
    const r = mesclarLinhas(BASE_NOVA, [mexida]);
    expect(r[2]).toEqual({ ...mexida, editada: true });
    // o Charizard saiu da linha do Charmander (que continua seguindo a base no resto)
    expect(r[0]!.niveis).toEqual([['Charmander'], ['Charmeleon'], ['Mega Charizard X']]);
    expect(r[0]!.editada).toBeUndefined();
  });
  it('apagadas somem; criadas vão pro fim; linha criada também fica com os personagens dela', () => {
    const r = mesclarLinhas(BASE_NOVA, [{ id: 'nova', nome: 'Nova', niveis: [['Ralts']], editada: true }], ['pikachu']);
    expect(ids(r)).toEqual(['charmander', 'ralts', 'nova']);
    expect(r[1]!.niveis).toEqual([['Kirlia'], ['Gardevoir', 'Gallade']]);
    // apagada que não existe mais na base não atrapalha
    expect(ids(mesclarLinhas(BASE_NOVA, [], ['sumiu']))).toEqual(['charmander', 'ralts', 'pikachu']);
  });
  it('guardarLinhas: só a linha mexida vai inteira; das outras da base, só a confirmação; sumida = apagada', () => {
    const efetivas = mesclarLinhas(BASE_NOVA, []);
    // confirmar o Charmander e mexer no Pikachu (tirar o Raichu); apagar o Ralts
    let depois = confirmarLinha(efetivas, 'charmander', true);
    depois = removerMembro(depois, 'pikachu', 'Raichu');
    depois = apagarLinha(depois, 'ralts');
    const g = guardarLinhas(depois, BASE_NOVA, new Set(['pikachu']));
    expect(g).toEqual({
      salvas: [{ id: 'charmander', confirmada: true }, { id: 'pikachu', nome: 'pikachu', niveis: [['Pikachu']], editada: true }],
      apagadas: ['ralts'],
    });
    // ida e volta: a mistura do que foi guardado é a lista que o usuário vê
    expect(mesclarLinhas(BASE_NOVA, g.salvas, g.apagadas)).toEqual(depois.map(l => (l.id === 'pikachu' ? { ...l, editada: true } : l)));
    // linha criada vai inteira mesmo sem estar em "mexidas"
    const criada = criarLinha(efetivas, 'pokemon', 'Nova', 'Pidgey');
    expect(guardarLinhas(criada.linhas, BASE_NOVA).salvas).toEqual([{ id: 'pokemon:nova', nome: 'Nova', niveis: [['Pidgey']], editada: true }]);
    // mover alguém de uma linha da base pra outra: só a de destino fica fixa; a de origem segue a base sem ele
    const movido = adicionarMembro(efetivas, 'pikachu', 'Charizard', 'fim');
    const gm = guardarLinhas(movido, BASE_NOVA, new Set(['pikachu']));
    expect(gm.salvas.map(s => s.id)).toEqual(['pikachu']);
    expect(mesclarLinhas(BASE_NOVA, gm.salvas)[0]!.niveis).toEqual([['Charmander'], ['Charmeleon'], ['Mega Charizard X']]);
  });
  it('compactarLinhas: formato antigo vira só confirmações e linhas do usuário; apagada fora da base sai', () => {
    const antigo = limparSalvas([{ ...CHAR, confirmada: true }, RALTS, { id: 'minha', niveis: [['Pidgey']] }, { id: 'sem-niveis' }]);
    expect(compactarLinhas(antigo, ['pikachu', 'sumiu'], BASE_NOVA)).toEqual({
      salvas: [{ id: 'charmander', confirmada: true }, { id: 'minha', nome: 'Pidgey', niveis: [['Pidgey']], editada: true }],
      apagadas: ['pikachu'],
    });
    const mexida: LinhaSalva = { id: 'ralts', niveis: [['Ralts']], editada: true };
    expect(compactarLinhas([mexida], [], BASE_NOVA).salvas).toEqual([mexida]);
  });
  it('limparSalvas: guarda só o que veio (sem inventar nome nem níveis); id que falta sem níveis sai', () => {
    expect(limparSalvas([{ id: 'a', confirmada: true, editada: false, nome: '' }, { niveis: [['X', 'X'], []], nome: 'Nova' }, { confirmada: true }, 'x'], 'pokemon')).toEqual([
      { id: 'a', confirmada: true },
      { id: 'pokemon:nova', nome: 'Nova', niveis: [['X']] },
    ]);
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
  // Mothman: dois no nível 2 e dois no nível 3
  const MOTH = L('mothman', ['Mothman'], ['Loup-garou', 'Siegfried'], ['Moloch', 'Fionn']);
  it('de quem vem: só alguém do nível de cima; vazio = de qualquer um; sem mudança = mesmo array', () => {
    let l = definirDe([MOTH], 'mothman', 'Moloch', 'Loup-garou');
    l = definirDe(l, 'mothman', 'Fionn', 'Siegfried');
    expect(l[0]!.de).toEqual({ Moloch: 'Loup-garou', Fionn: 'Siegfried' });
    expect(definirDe(l, 'mothman', 'Fionn', 'Siegfried')).toBe(l);
    // pai que não está no nível de cima, ou quem está no nível 1: nada muda
    expect(definirDe(l, 'mothman', 'Moloch', 'Mothman')).toBe(l);
    expect(definirDe(l, 'mothman', 'Mothman', 'Moloch')).toBe(l);
    expect(definirDe(l, 'nada', 'Moloch', 'Loup-garou')).toBe(l);
    const q = definirDe(definirDe(l, 'mothman', 'Moloch', ''), 'mothman', 'Fionn', '');
    expect('de' in q[0]!).toBe(false);
    expect(MOTH.de).toBeUndefined();
  });
  it('de quem vem: mover ou tirar alguém tira os pares que deixaram de valer', () => {
    const l = definirDe(definirDe([MOTH], 'mothman', 'Moloch', 'Loup-garou'), 'mothman', 'Fionn', 'Siegfried');
    // o Siegfried sai: o Fionn volta a vir de qualquer um
    expect(removerMembro(l, 'mothman', 'Siegfried')[0]!.de).toEqual({ Moloch: 'Loup-garou' });
    // o Moloch vira nível próprio no fim: o pai dele não está mais no nível de cima
    expect(moverMembro(l, 'mothman', 'Moloch', 'fim')[0]!.de).toEqual({ Fionn: 'Siegfried' });
    // o Loup-garou vai pra outra linha
    expect(adicionarMembro([...l, CHAR], 'charmander', 'Loup-garou', 'fim')[0]!.de).toEqual({ Fionn: 'Siegfried' });
  });
  it('de quem vem: a limpeza da base e do plano joga fora o que não vale; vai pro plano e pra exportação', () => {
    const de = { Moloch: 'Loup-garou', Fionn: 'Mothman', Mothman: 'X', Loup: 3 };
    expect(limparLinhas([{ ...MOTH, de }])[0]!.de).toEqual({ Moloch: 'Loup-garou' });
    expect(limparSalvas([{ ...MOTH, de, editada: true }, { id: 'x', de }])).toEqual([{ ...MOTH, de: { Moloch: 'Loup-garou' }, editada: true }, { id: 'x' }]);
    const com = { ...MOTH, de: { Moloch: 'Loup-garou' } };
    expect(guardarLinhas([com], [MOTH], new Set(['mothman'])).salvas).toEqual([{ ...com, editada: true }]);
    expect(mesclarLinhas([com], [])[0]!.de).toEqual({ Moloch: 'Loup-garou' });
    expect(mesclarLinhas([MOTH], [{ ...com, editada: true }])[0]!.de).toEqual({ Moloch: 'Loup-garou' });
    expect(compactarLinhas([{ ...com, editada: true }], [], [MOTH]).salvas[0]!.de).toEqual({ Moloch: 'Loup-garou' });
    const i = indiceLinhas([com]);
    expect(extrasDoPersonagem('Moloch', undefined, [], i.get('Moloch')).linha).toEqual({ nome: 'mothman', nivel: 3, de: 3, confirmada: false, alternativas: ['Fionn'], vemDe: 'Loup-garou' });
    expect(extrasDoPersonagem('Fionn', undefined, [], i.get('Fionn')).linha!.vemDe).toBeUndefined();
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
  it('planoCompleto: classes que valem, unidades com a ult da base e as linhas como o plano guarda (já compactadas)', () => {
    const p: Plano = {
      versao: 1,
      unidades: { pokemon: { Charizard: { habilidade: 'x' } }, zzz: { A: { habilidade: 'y' } } },
      // formato antigo no Pokémon (a lista inteira, com o Ralts confirmado); uma linha criada no LoL
      linhas: { pokemon: [CHAR, { ...RALTS, confirmada: true }], lol: [{ id: 'lol:x', nome: 'X', niveis: [['Ahri']], editada: true }] },
      apagadas: { persona: ['orpheus'] },
    };
    expect(planoCompleto(p, b, ['pokemon', 'persona', 'lol', 'smt'])).toEqual({
      versao: 1, classes: b.classes, classesVistas: ['dragao', 'anjo'], unidades: { pokemon: { Charizard: { habilidade: 'x', ult: 'Mega Charizard X' } } },
      linhas: { pokemon: [{ id: 'ralts', confirmada: true }], lol: [{ id: 'lol:x', nome: 'X', niveis: [['Ahri']], editada: true }] },
      apagadas: { persona: ['orpheus'] },
    });
    // as linhas que valem vão à parte
    expect(linhasCompletas(p, b, ['pokemon', 'persona', 'lol', 'smt'])).toEqual({
      pokemon: [CHAR, { ...RALTS, confirmada: true }],
      lol: [{ id: 'lol:x', nome: 'X', niveis: [['Ahri']], editada: true }],
    });
  });
  it('restaurarPlano: o arquivo substitui classes, as linhas guardadas da franquia e cada personagem; o resto fica', () => {
    const atual: Plano = {
      versao: 1,
      unidades: { pokemon: { Charizard: { classes: ['dragao'] }, Pidgey: { habilidade: 'Voa' } }, lol: { Ahri: { habilidade: 'Charme' } } },
      linhas: { persona: [{ id: 'orpheus', confirmada: true }] },
    };
    const arq: Plano = {
      versao: 1,
      classes: [...b.classes, { id: 'robo', nome: 'Robô' }],
      unidades: { pokemon: { Charizard: { classes: ['robo'], habilidade: 'Laser' } }, zzz: { X: { habilidade: 'ignorado' } } },
      linhas: { pokemon: [{ id: 'ralts', confirmada: true }], zzz: [] },
      apagadas: { pokemon: ['charmander'] },
    };
    const r = restaurarPlano(atual, arq, b, ['pokemon', 'lol', 'persona']);
    expect(r.classes).toEqual(arq.classes);
    expect(r.unidades).toEqual({
      pokemon: { Charizard: { classes: ['robo'], habilidade: 'Laser' }, Pidgey: { habilidade: 'Voa' } },
      lol: { Ahri: { habilidade: 'Charme' } },
    });
    expect(r.linhas).toEqual({ persona: [{ id: 'orpheus', confirmada: true }], pokemon: [{ id: 'ralts', confirmada: true }] });
    expect(r.apagadas).toEqual({ pokemon: ['charmander'] });
  });
  it('restaurarPlano de arquivo antigo (linhas inteiras): só as confirmações e as linhas do usuário; classe que sumiu sai das unidades', () => {
    const atual: Plano = { versao: 1, classes: [{ id: 'x', nome: 'X' }], unidades: { pokemon: { Mew: { classes: ['x', 'dragao'] } } }, linhas: { pokemon: [] } };
    const arq: Plano = {
      versao: 1,
      classes: b.classes,
      unidades: {},
      linhas: { pokemon: [CHAR, RALTS], persona: [...b.linhas.persona!, { id: 'p:minha', nome: 'Minha', niveis: [['Thanatos']] }] },
    };
    const r = restaurarPlano(atual, arq, b, ['pokemon', 'persona']);
    expect(r).toEqual({
      versao: 1,
      unidades: { pokemon: { Mew: { classes: ['dragao'] } } },
      linhas: { persona: [{ id: 'p:minha', nome: 'Minha', niveis: [['Thanatos']], editada: true }] },
    });
    expect(classesEfetivas(r, b)).toBe(b.classes);
    expect(linhasEfetivas(r, b, 'pokemon')).toBe(b.linhas.pokemon);
  });
  it('restaurarPlano: as classes vistas vêm com as classes do arquivo; classe nova da base continua valendo nas unidades', () => {
    const nova = { ...b, classes: [...b.classes, { id: 'fogo', nome: 'Fogo' }] };
    const arq: Plano = { versao: 1, classes: [{ id: 'dragao', nome: 'Dragão' }], classesVistas: ['dragao', 'anjo'], unidades: { pokemon: { Charizard: { classes: ['fogo', 'anjo'] } } }, linhas: {} };
    const r = restaurarPlano(planoVazio(), arq, nova, ['pokemon']);
    expect(r.classesVistas).toEqual(['dragao', 'anjo']);
    // o Anjo foi tirado no arquivo; o Fogo é novo na base e vale
    expect(classesEfetivas(r, nova).map(c => c.id)).toEqual(['dragao', 'fogo']);
    expect(r.unidades).toEqual({ pokemon: { Charizard: { classes: ['fogo'] } } });
    // arquivo sem classes: ficam as atuais, com as vistas delas
    expect(restaurarPlano(r, planoVazio(), nova, ['pokemon']).classesVistas).toEqual(['dragao', 'anjo']);
  });
  it('restaurarPlano sem base: guarda o que veio; sem classes em lugar nenhum, não tira classe de ninguém', () => {
    const arq: Plano = { versao: 1, unidades: { pokemon: { Mew: { classes: ['q'] } } }, linhas: { pokemon: [CHAR] } };
    expect(restaurarPlano(planoVazio(), arq, null, ['pokemon'])).toEqual(arq);
  });
  it('resumoPlano', () => {
    expect(resumoPlano({ versao: 1, classes: [], unidades: { a: { X: { habilidade: 'h' }, Y: { habilidade: 'h' } }, b: { Z: { habilidade: 'h' } } }, linhas: { a: [{ id: 'q', confirmada: true }], c: [] }, apagadas: { b: ['z'] } }))
      .toEqual({ classes: 0, unidades: 3, franquiasComLinhas: 2 });
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

describe('custo, habilidade da base e ult padrão da classe (28/10)', () => {
  it('custo: só de 1 a 5; numa linha vale o da 1ª forma', () => {
    expect(limparUnidades({ pokemon: { Pikachu: { custo: 2 }, Raichu: { custo: 9 }, Mew: { custo: '3' } } })).toEqual({ pokemon: { Pikachu: { custo: 2 } } });
    expect(mudarUnidade({ pokemon: { Pikachu: { custo: 2 } } }, 'pokemon', 'Pikachu', { custo: undefined })).toEqual({});
    const l: LinhaEvo = { id: 'p:x', nome: 'X', niveis: [['A', 'B'], ['C']] };
    expect(custoDaLinha(l, { B: { custo: 3 }, C: { custo: 5 } })).toBe(3);
    expect(custoDaLinha(l, { C: { custo: 5 } })).toBeUndefined();
    expect(custoDoCampeao('C', { linha: l, nivel: 1 }, { A: { custo: 1 }, C: { custo: 5 } })).toBe(1);
    expect(custoDoCampeao('Solto', undefined, { Solto: { custo: 4 } })).toBe(4);
  });
  it('habilidade: a do plano passa por cima do rascunho da base; vazia volta a ele', () => {
    expect(habilidadeEfetiva({ habilidade: 'Minha' }, 'Da base')).toBe('Minha');
    expect(habilidadeEfetiva(undefined, 'Da base')).toBe('Da base');
    expect(habilidadeEfetiva({ habilidade: '  ' }, 'Da base')).toBe('Da base');
    expect(parseBase({ classes: [], habilidades: { jojo: { 'Star Platinum': ' Para o tempo ', Vazio: ' ' }, x: 3 } })!.habilidades).toEqual({ jojo: { 'Star Platinum': 'Para o tempo' } });
  });
  it('ult padrão da classe: a do plano (vazia = tirada), senão a da base; igual à da base volta a seguir a base', () => {
    const b: Base = { ...base(), classes: [{ id: 'tanque', nome: 'Tanque', ult: 'Muralha' }] };
    expect(ultDaClasse({ id: 'tanque', nome: 'Tanque' }, b)).toBe('Muralha');
    expect(ultDaClasse({ id: 'tanque', nome: 'Tanque', ult: '' }, b)).toBe('');
    expect(ultDaClasse({ id: 'minha', nome: 'Minha' }, b)).toBe('');
    expect(limparClasses([{ id: 'a', nome: 'A', ult: ' Soco ' }, { id: 'b', nome: 'B', ult: 3 }])).toEqual([{ id: 'a', nome: 'A', ult: 'Soco' }, { id: 'b', nome: 'B' }]);
    const cs = [{ id: 'tanque', nome: 'Tanque' }, { id: 'minha', nome: 'Minha' }];
    expect(mudarUltDaClasse(cs, 'tanque', 'Outra', 'Muralha')[0]).toEqual({ id: 'tanque', nome: 'Tanque', ult: 'Outra' });
    expect(mudarUltDaClasse(cs, 'tanque', 'Muralha', 'Muralha')).toBe(cs);
    expect(mudarUltDaClasse([{ id: 'tanque', nome: 'Tanque', ult: 'Outra' }], 'tanque', 'Muralha ', 'Muralha')).toEqual([{ id: 'tanque', nome: 'Tanque' }]);
    expect(mudarUltDaClasse(cs, 'tanque', '', 'Muralha')[0]).toEqual({ id: 'tanque', nome: 'Tanque', ult: '' });
    expect(mudarUltDaClasse(cs, 'minha', '', undefined)).toBe(cs);
  });
  it('exportação: habilidade e ult padrão da base escritas em quem não mexeu; custo do campeão nos extras', () => {
    const b: Base = { ...base(), classes: [{ id: 'tanque', nome: 'Tanque', ult: 'Muralha' }], habilidades: { jojo: { 'Star Platinum': 'Para o tempo' } } };
    const p: Plano = { versao: 1, unidades: { jojo: { 'Crazy Diamond': { habilidade: 'Conserta' } } }, linhas: {} };
    const c = planoCompleto(p, b, ['jojo']);
    expect(c.classes).toEqual([{ id: 'tanque', nome: 'Tanque', ult: 'Muralha' }]);
    expect(c.unidades.jojo).toEqual({ 'Crazy Diamond': { habilidade: 'Conserta' }, 'Star Platinum': { habilidade: 'Para o tempo' } });
    expect(extrasDoPersonagem('Star Platinum', undefined, [], undefined, '', { habilidade: 'Para o tempo', custo: 3 })).toEqual({ habilidade: 'Para o tempo', custo: 3 });
  });
});
