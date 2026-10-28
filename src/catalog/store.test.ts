import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installStorage } from '../core/test-helpers';
import { BAGS_KEY, STATS_KEY, YGO_KEY } from '../core/storage';
import * as s from './store';

beforeEach(() => {
  s.esquecerCatalogos();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('marcações no localStorage (pdx-set1)', () => {
  it('chave nova, diferente das que já existem', () => {
    expect(s.SET1_KEY).toBe('pdx-set1');
    expect([STATS_KEY, BAGS_KEY, YGO_KEY]).not.toContain(s.SET1_KEY);
  });
  it('lê o que estava salvo (limpando lixo) e grava cada mudança', () => {
    const st = installStorage({ 'pdx-set1': JSON.stringify({ pokemon: ['Pikachu', 'Pikachu', 7], lol: 'x' }), 'pdx-stats': '{"w":{}}' });
    s.recarregarMarcas();
    expect([...s.marcados('pokemon')]).toEqual(['Pikachu']);
    expect(s.marcados('lol').size).toBe(0);
    s.alternar('pokemon', 'Charizard');
    s.alternar('lol', 'Ahri');
    expect(JSON.parse(st.getItem('pdx-set1')!)).toEqual({ pokemon: ['Pikachu', 'Charizard'], lol: ['Ahri'] });
    s.alternar('pokemon', 'Pikachu');
    expect(JSON.parse(st.getItem('pdx-set1')!)).toEqual({ pokemon: ['Charizard'], lol: ['Ahri'] });
    // nenhuma outra chave mexida
    expect(st.getItem('pdx-stats')).toBe('{"w":{}}');
    expect(st.length).toBe(2);
  });
  it('marcar e desmarcar vários; limpar tira a franquia', () => {
    const st = installStorage();
    s.recarregarMarcas();
    s.marcar('ff', ['A', 'B', 'C'], true);
    s.marcar('ff', ['B', 'Z'], false);
    expect([...s.marcados('ff')]).toEqual(['A', 'C']);
    s.marcar('smt', ['Pixie'], true);
    s.limpar('ff');
    expect(s.marcados('ff').size).toBe(0);
    expect(JSON.parse(st.getItem('pdx-set1')!)).toEqual({ smt: ['Pixie'] });
    expect(s.marcasSalvas()).toEqual({ smt: ['Pixie'] });
  });
  it('cada mudança troca o Set da franquia (serve de dependência do useMemo) e avisa quem assinou', () => {
    installStorage();
    s.recarregarMarcas();
    const aviso = vi.fn();
    const desfaz = s.assinar(aviso);
    const antes = s.marcados('pokemon');
    s.alternar('pokemon', 'Mew');
    expect(s.marcados('pokemon')).not.toBe(antes);
    expect(aviso).toHaveBeenCalledTimes(1);
    desfaz();
    s.alternar('pokemon', 'Mew');
    expect(aviso).toHaveBeenCalledTimes(1);
  });
  it('importar soma às marcações de agora e devolve quantas eram novas', () => {
    const st = installStorage({ 'pdx-set1': JSON.stringify({ pokemon: ['A'] }) });
    s.recarregarMarcas();
    expect(s.importar({ pokemon: ['A', 'B'], lol: ['Ahri'] })).toBe(2);
    expect(JSON.parse(st.getItem('pdx-set1')!)).toEqual({ pokemon: ['A', 'B'], lol: ['Ahri'] });
    expect([...s.marcados('lol')]).toEqual(['Ahri']);
  });
  it('sem localStorage (ou cota cheia) funciona só na memória', () => {
    vi.stubGlobal('localStorage', undefined);
    s.recarregarMarcas();
    s.alternar('pokemon', 'Mew');
    expect([...s.marcados('pokemon')]).toEqual(['Mew']);
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('cota'); } });
    expect(() => s.alternar('pokemon', 'Mewtwo')).not.toThrow();
  });
});

describe('pedirCatalogo', () => {
  const ARQ = { chave: 'lol', fonte: 'Data Dragon', geradoEm: '2026-10-25', campos: [{ id: 'classe', rotulo: 'Classe' }], itens: { Ahri: { classe: ['Mage'] } } };
  const resposta = (status: number, corpo: string) => new Response(corpo, { status });

  it('baixa catalogo/<chave>.json uma vez só e guarda', async () => {
    const f = vi.fn(async () => resposta(200, JSON.stringify(ARQ)));
    vi.stubGlobal('fetch', f);
    expect(s.catalogo('lol')).toBeUndefined();
    const p = s.pedirCatalogo('lol');
    expect(s.catalogo('lol')).toBe('carregando');
    const c = await p;
    expect(c?.itens.get('Ahri')).toEqual({ classe: ['Mage'] });
    expect(s.catalogo('lol')).toBe(c);
    await s.pedirCatalogo('lol');
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledWith('catalogo/lol.json', { cache: 'no-cache' });
  });
  it('404, a página do site no lugar do JSON, JSON inválido ou erro de rede -> null', async () => {
    const respostas: Record<string, () => Promise<Response>> = {
      a: async () => resposta(404, 'not found'),
      b: async () => resposta(200, '<!doctype html><html></html>'),
      c: async () => resposta(200, '{"campos": "x"}'),
      d: async () => { throw new TypeError('rede'); },
    };
    vi.stubGlobal('fetch', (u: string) => respostas[u.match(/catalogo\/(\w)\.json/)![1]!]!());
    for (const k of Object.keys(respostas)) {
      expect(await s.pedirCatalogo(k)).toBeNull();
      expect(s.catalogo(k)).toBeNull();
    }
  });
});

describe('o que a aba mostra', () => {
  it('filtros por franquia; mudar filtro ou franquia volta pra primeira página', () => {
    s.escolherFranquia('pokemon');
    s.mostrarMais();
    expect(s.quantosMostrar()).toBe(2 * s.PAGINA);
    const vazio = s.filtrosDe('lol');
    expect(s.filtrosDe('lol')).toBe(vazio);
    s.mudarFiltros('pokemon', { q: 'char' });
    expect(s.quantosMostrar()).toBe(s.PAGINA);
    s.mudarCampo('pokemon', 'tipo', 'Fire');
    s.mudarCampo('pokemon', 'geracao', 'I');
    expect(s.filtrosDe('pokemon')).toEqual({ q: 'char', campos: { tipo: 'Fire', geracao: 'I' }, classe: '', linha: '', ult: '', custo: '' });
    expect(s.filtrosDe('lol')).toEqual({ q: '', campos: {}, classe: '', linha: '', ult: '', custo: '' });
    s.mostrarMais();
    s.escolherFranquia('lol');
    expect(s.franquiaAtual()).toBe('lol');
    expect(s.quantosMostrar()).toBe(s.PAGINA);
    s.limparFiltros('pokemon');
    expect(s.filtrosDe('pokemon')).toEqual({ q: '', campos: {}, classe: '', linha: '', ult: '', custo: '' });
  });
});

describe('base (catalogo/set1-base.json) e planejamento (pdx-set1-plano)', () => {
  const BASE = {
    versao: 1,
    geradoEm: '2026-10-26',
    classes: [{ id: 'dragao', nome: 'Dragão' }, { id: 'anjo', nome: 'Anjo' }],
    selecao: { pokemon: ['Charmander', 'Charizard'], bakugan: ['Drago'] },
    linhas: {
      pokemon: [{ id: 'pokemon:charmander', nome: 'Charmander', niveis: [['Charmander'], ['Charmeleon'], ['Charizard']] }],
      persona: [{ id: 'persona:orpheus', nome: 'P3', niveis: [['Orpheus', 'Orpheus F'], ['Messiah']] }],
    },
    itens: { componentes: [] },
    ults: { pokemon: { Charizard: 'Mega Charizard X' } },
  };
  const comBase = (corpo: unknown = BASE, status = 200) => {
    const f = vi.fn(async () => new Response(typeof corpo === 'string' ? corpo : JSON.stringify(corpo), { status }));
    vi.stubGlobal('fetch', f);
    return f;
  };
  beforeEach(() => {
    s.esquecerBase();
  });

  it('chave nova, diferente de todas as outras', () => {
    expect(s.PLANO_KEY).toBe('pdx-set1-plano');
    expect([STATS_KEY, BAGS_KEY, YGO_KEY, s.SET1_KEY]).not.toContain(s.PLANO_KEY);
  });
  it('baixa a base uma vez; grupo base por franquia; chave desconhecida (itens) não atrapalha', async () => {
    installStorage();
    s.recarregarPlano();
    const f = comBase();
    expect(s.base()).toBeUndefined();
    const p = s.pedirBase();
    expect(s.base()).toBe('carregando');
    await p;
    await s.pedirBase();
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledWith('catalogo/set1-base.json', { cache: 'no-cache' });
    expect([...s.grupoBase('pokemon')]).toEqual(['Charmander', 'Charizard']);
    expect([...s.grupoBase('bakugan')]).toEqual(['Drago']);
    expect(s.grupoBase('lol').size).toBe(0);
    expect(s.classes().map(c => c.nome)).toEqual(['Dragão', 'Anjo']);
    expect(s.linhasDe('persona')[0]!.niveis).toEqual([['Orpheus', 'Orpheus F'], ['Messiah']]);
  });
  it('sem base (404, página do site, erro de rede): null, sem classes nem linhas, e o grupo padrão vira "todos"', async () => {
    installStorage();
    s.recarregarPlano();
    const falhas = [
      () => comBase('not found', 404),
      () => comBase('<!doctype html>'),
      () => vi.stubGlobal('fetch', async () => { throw new TypeError('rede'); }),
    ];
    for (const falha of falhas) {
      s.esquecerBase();
      falha();
      expect(await s.pedirBase()).toBeNull();
      expect(s.base()).toBeNull();
      expect(s.classes()).toEqual([]);
      expect(s.linhasDe('pokemon')).toEqual([]);
      expect(s.grupoAtual()).toBe('todos');
    }
  });
  it('grupo: base por padrão (e enquanto carrega); escolher troca; grupoDe dá o conjunto da franquia', async () => {
    installStorage({ 'pdx-set1': JSON.stringify({ pokemon: ['Pikachu'] }) });
    s.recarregarMarcas();
    comBase();
    const p = s.pedirBase();
    expect(s.grupoAtual()).toBe('base');
    await p;
    expect(s.grupoAtual()).toBe('base');
    expect([...s.grupoDe('pokemon')!]).toEqual(['Charmander', 'Charizard']);
    s.escolherGrupo('marcados');
    expect([...s.grupoDe('pokemon')!]).toEqual(['Pikachu']);
    s.escolherGrupo('todos');
    expect(s.grupoDe('pokemon')).toBeNull();
    s.escolherGrupo('base');
  });
  it('linhas, uma por uma: confirmar não fixa a linha; mexer fixa só ela; criar e apagar; voltar pra base', async () => {
    const st = installStorage();
    s.recarregarPlano();
    comBase();
    await s.pedirBase();
    const antes = s.linhasDe('pokemon');
    expect(antes).toBe(s.linhasDe('pokemon'));
    expect(s.linhasMexidas('pokemon')).toBe(false);
    // mudança que não muda nada não grava
    s.editarLinhas('pokemon', l => l);
    expect(st.getItem('pdx-set1-plano')).toBeNull();
    // confirmar: só a confirmação vai pro plano; nome e níveis seguem a base
    s.editarLinhas('pokemon', l => l.map(x => ({ ...x, confirmada: true })));
    expect(s.linhasMexidas('pokemon')).toBe(false);
    expect(s.linhasDe('pokemon')[0]).toEqual({ ...BASE.linhas.pokemon[0], confirmada: true });
    // a mesma lista enquanto nada muda (serve de dependência do useMemo)
    expect(s.linhasDe('pokemon')).toBe(s.linhasDe('pokemon'));
    const salvo = JSON.parse(st.getItem('pdx-set1-plano')!);
    expect(salvo.linhas).toEqual({ pokemon: [{ id: 'pokemon:charmander', confirmada: true }] });
    expect(salvo.classes).toBeUndefined();
    expect(s.linhasMexidas('persona')).toBe(false);
    // criar uma linha com o Charmeleon: a do Charmander (da base) fica sem ele, sem ser fixada
    const id = s.criarLinha('pokemon', '', 'Charmeleon');
    expect(id).toBe('pokemon:charmeleon');
    expect(s.linhasDe('pokemon').map(l => l.niveis)).toEqual([[['Charmander'], ['Charizard']], [['Charmeleon']]]);
    expect(s.linhasMexidas('pokemon')).toBe(true);
    expect(JSON.parse(st.getItem('pdx-set1-plano')!).linhas.pokemon).toEqual([
      { id: 'pokemon:charmander', confirmada: true },
      { id: 'pokemon:charmeleon', nome: 'Charmeleon', niveis: [['Charmeleon']], editada: true },
    ]);
    // mexer na linha da base (renomear) fixa só ela; voltar à da base desfaz e guarda a confirmação
    s.editarLinhas('pokemon', l => l.map(x => (x.id === 'pokemon:charmander' ? { ...x, nome: 'Fogo' } : x)), ['pokemon:charmander']);
    expect(s.linhasDe('pokemon')[0]).toMatchObject({ nome: 'Fogo', editada: true, confirmada: true });
    expect(s.linhaNaBase('pokemon', 'pokemon:charmander')).toBe(true);
    expect(s.linhaNaBase('pokemon', 'pokemon:charmeleon')).toBe(false);
    s.voltarLinhaDaBase('pokemon', 'pokemon:charmander');
    expect(s.linhasDe('pokemon')[0]).toEqual({ id: 'pokemon:charmander', nome: 'Charmander', niveis: [['Charmander'], ['Charizard']], confirmada: true });
    // apagar uma linha da base guarda o id
    s.editarLinhas('pokemon', l => l.filter(x => x.id !== 'pokemon:charmander'));
    expect(JSON.parse(st.getItem('pdx-set1-plano')!).apagadas).toEqual({ pokemon: ['pokemon:charmander'] });
    expect(s.linhasDe('pokemon').map(l => l.id)).toEqual(['pokemon:charmeleon']);
    // voltar pra base: some o que foi criado e apagado (as confirmações ficariam)
    s.voltarLinhasDaBase('pokemon');
    expect(s.linhasDe('pokemon')).toEqual(BASE.linhas.pokemon);
    const fim = JSON.parse(st.getItem('pdx-set1-plano')!);
    expect(fim.linhas).toEqual({});
    expect(fim.apagadas).toBeUndefined();
  });
  it('plano no formato antigo (a franquia inteira copiada): a base nova aparece e a confirmação fica', async () => {
    // o plano guardou as linhas antigas (sem o Charizard e sem a linha da Persona), com o Charmander confirmado
    installStorage({
      'pdx-set1-plano': JSON.stringify({
        versao: 1, unidades: {},
        linhas: { pokemon: [{ id: 'pokemon:charmander', nome: 'Charmander', niveis: [['Charmander'], ['Charmeleon']], confirmada: true }, { id: 'pokemon:minha', nome: 'Minha', niveis: [['Pidgey']] }] },
      }),
    });
    s.recarregarPlano();
    comBase();
    await s.pedirBase();
    expect(s.linhasDe('pokemon')).toEqual([
      { ...BASE.linhas.pokemon[0], confirmada: true },
      { id: 'pokemon:minha', nome: 'Minha', niveis: [['Pidgey']], editada: true },
    ]);
    expect(s.linhasDe('persona')).toEqual(BASE.linhas.persona);
  });
  it('classes e unidades: classe nova copia as da base; remover tira de todo mundo; habilidade salva; nada de outras chaves', async () => {
    const st = installStorage({ 'pdx-stats': '{"w":{}}', 'pdx-set1': '{"lol":["Ahri"]}' });
    s.recarregarPlano();
    comBase();
    await s.pedirBase();
    s.alternarClasse('pokemon', 'Charizard', 'dragao');
    s.mudarHabilidade('pokemon', 'Charizard', 'Lança-chamas');
    expect(s.unidadesDe('pokemon')).toEqual({ Charizard: { classes: ['dragao'], habilidade: 'Lança-chamas' } });
    // as classes ainda seguem a base
    expect(JSON.parse(st.getItem('pdx-set1-plano')!).classes).toBeUndefined();
    expect(s.adicionarClasse('Robô', 'Máquinas')).toBe('robo');
    expect(s.classes().map(c => c.id)).toEqual(['dragao', 'anjo', 'robo']);
    s.alternarClasse('lol', 'Ahri', 'robo');
    s.removerClasse('dragao');
    expect(s.classes().map(c => c.id)).toEqual(['anjo', 'robo']);
    expect(s.unidadesDe('pokemon')).toEqual({ Charizard: { habilidade: 'Lança-chamas' } });
    s.mudarHabilidade('pokemon', 'Charizard', '');
    expect(s.unidadesDe('pokemon')).toEqual({});
    const salvo = JSON.parse(st.getItem('pdx-set1-plano')!);
    expect(salvo).toEqual({
      versao: 1,
      classes: [{ id: 'anjo', nome: 'Anjo' }, { id: 'robo', nome: 'Robô', descricao: 'Máquinas' }],
      classesVistas: ['dragao', 'anjo'],
      unidades: { lol: { Ahri: { classes: ['robo'] } } },
      linhas: {},
    });
    expect(st.getItem('pdx-stats')).toBe('{"w":{}}');
    expect(st.getItem('pdx-set1')).toBe('{"lol":["Ahri"]}');
    // relê do localStorage
    s.recarregarPlano();
    expect(s.unidadesDe('lol')).toEqual({ Ahri: { classes: ['robo'] } });
  });
  it('classe nova na base aparece no fim pra quem já mexeu nas classes; a removida não volta', async () => {
    // plano gravado antes das classes vistas: só o Dragão (o Anjo, que a base antiga já tinha, foi removido)
    const st = installStorage({ 'pdx-set1-plano': JSON.stringify({ versao: 1, classes: [{ id: 'dragao', nome: 'Dragão' }], unidades: {}, linhas: {} }) });
    s.recarregarPlano();
    comBase({ ...BASE, classes: [...BASE.classes, { id: 'tanque', nome: 'Tanque' }, { id: 'fogo', nome: 'Fogo' }] });
    await s.pedirBase();
    expect(s.classes().map(c => c.id)).toEqual(['dragao', 'tanque', 'fogo']);
    expect(s.classes()).toBe(s.classes());
    s.removerClasse('tanque');
    expect(JSON.parse(st.getItem('pdx-set1-plano')!).classesVistas).toEqual(['dragao', 'anjo', 'tanque', 'fogo']);
    s.recarregarPlano();
    expect(s.classes().map(c => c.id)).toEqual(['dragao', 'fogo']);
  });
  it('importarPlano espera a base e restaura; pra exportar: o plano no formato guardado e as linhas que valem', async () => {
    installStorage();
    s.recarregarPlano();
    comBase();
    await s.importarPlano({
      versao: 1,
      classes: BASE.classes,
      unidades: { pokemon: { Charizard: { classes: ['anjo'] } } },
      linhas: { persona: [{ id: 'p', nome: 'P', niveis: [['Orpheus']] }] },
    }, ['pokemon', 'persona']);
    // linha que não está na base é do usuário (e fica com o Orpheus)
    expect(s.plano()).toEqual({ versao: 1, unidades: { pokemon: { Charizard: { classes: ['anjo'] } } }, linhas: { persona: [{ id: 'p', nome: 'P', niveis: [['Orpheus']], editada: true }] } });
    expect(s.linhasDe('persona').map(l => l.niveis)).toEqual([[['Orpheus F'], ['Messiah']], [['Orpheus']]]);
    const exp = s.planoParaExportar(['pokemon', 'persona', 'lol']);
    expect(exp.classes).toEqual(BASE.classes);
    expect(Object.keys(exp.linhas)).toEqual(['persona']);
    expect(Object.keys(s.linhasParaExportar(['pokemon', 'persona', 'lol']))).toEqual(['pokemon', 'persona']);
  });
  it('ult: a da base até mudar; trocar grava; tirar fica gravado (vazio) e não volta; escolher a da base volta a seguir a base', async () => {
    const st = installStorage();
    s.recarregarPlano();
    comBase();
    await s.pedirBase();
    expect(s.ultsBase('pokemon')).toEqual({ Charizard: 'Mega Charizard X' });
    expect(s.ultsBase('lol')).toEqual({});
    expect(s.ultDe('pokemon', 'Charizard')).toBe('Mega Charizard X');
    expect(s.ultDe('pokemon', 'Pidgey')).toBe('');
    // escolher a mesma não grava nada
    s.mudarUlt('pokemon', 'Charizard', 'Mega Charizard X');
    expect(st.getItem('pdx-set1-plano')).toBeNull();
    s.mudarUlt('pokemon', 'Charizard', 'Gigantamax Charizard');
    expect(s.unidadesDe('pokemon')).toEqual({ Charizard: { ult: 'Gigantamax Charizard' } });
    s.mudarUlt('pokemon', 'Charizard', '');
    expect(s.ultDe('pokemon', 'Charizard')).toBe('');
    expect(JSON.parse(st.getItem('pdx-set1-plano')!).unidades).toEqual({ pokemon: { Charizard: { ult: '' } } });
    s.recarregarPlano();
    expect(s.ultDe('pokemon', 'Charizard')).toBe('');
    s.mudarUlt('pokemon', 'Charizard', 'Mega Charizard X');
    expect(s.unidadesDe('pokemon')).toEqual({});
    s.mudarUlt('pokemon', 'Pidgey', 'Mega Pidgeot');
    expect(s.ultDe('pokemon', 'Pidgey')).toBe('Mega Pidgeot');
    s.mudarUlt('pokemon', 'Pidgey', '');
    expect(s.unidadesDe('pokemon')).toEqual({});
  });
  it('vista, subaba Classes e ir pra uma linha', async () => {
    installStorage();
    s.recarregarPlano();
    comBase();
    await s.pedirBase();
    s.escolherFranquia('lol');
    s.abrirClasses();
    expect(s.classesAbertas()).toBe(true);
    s.escolherFranquia('lol');
    expect(s.classesAbertas()).toBe(false);
    s.editarLinhas('pokemon', l => l.map(x => ({ ...x, confirmada: true })));
    s.mudarSoNaoConfirmadas(true);
    s.abrirClasses();
    s.irParaLinha('pokemon', 'pokemon:charmander');
    expect(s.franquiaAtual()).toBe('pokemon');
    expect(s.classesAbertas()).toBe(false);
    expect(s.vistaAtual()).toBe('linhas');
    // a linha confirmada estaria escondida pelo "só não confirmadas"
    expect(s.soNaoConfirmadas()).toBe(false);
    expect(s.focoEm('lol')).toBeNull();
    expect(s.focoEm('pokemon')).toBe('pokemon:charmander');
    s.focoFeito();
    expect(s.focoEm('pokemon')).toBeNull();
    s.escolherVista('personagens');
  });
});
