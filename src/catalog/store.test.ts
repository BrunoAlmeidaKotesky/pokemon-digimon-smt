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
    expect(f).toHaveBeenCalledWith('catalogo/lol.json');
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
    expect(s.filtrosDe('pokemon')).toEqual({ q: 'char', campos: { tipo: 'Fire', geracao: 'I' }, classe: '', linha: '' });
    expect(s.filtrosDe('lol')).toEqual({ q: '', campos: {}, classe: '', linha: '' });
    s.mostrarMais();
    s.escolherFranquia('lol');
    expect(s.franquiaAtual()).toBe('lol');
    expect(s.quantosMostrar()).toBe(s.PAGINA);
    s.limparFiltros('pokemon');
    expect(s.filtrosDe('pokemon')).toEqual({ q: '', campos: {}, classe: '', linha: '' });
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
    expect(f).toHaveBeenCalledWith('catalogo/set1-base.json');
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
  it('linhas: a franquia segue a base até ser mexida; a primeira mudança copia pro plano', async () => {
    const st = installStorage();
    s.recarregarPlano();
    comBase();
    await s.pedirBase();
    const antes = s.linhasDe('pokemon');
    expect(s.linhasMexidas('pokemon')).toBe(false);
    // mudança que não muda nada não grava
    s.editarLinhas('pokemon', l => l);
    expect(st.getItem('pdx-set1-plano')).toBeNull();
    s.editarLinhas('pokemon', l => l.map(x => ({ ...x, confirmada: true })));
    expect(s.linhasMexidas('pokemon')).toBe(true);
    expect(s.linhasDe('pokemon')).not.toBe(antes);
    expect(s.linhasDe('pokemon')[0]!.confirmada).toBe(true);
    const salvo = JSON.parse(st.getItem('pdx-set1-plano')!);
    expect(Object.keys(salvo.linhas)).toEqual(['pokemon']);
    expect(salvo.classes).toBeUndefined();
    // persona continua seguindo a base
    expect(s.linhasMexidas('persona')).toBe(false);
    const id = s.criarLinha('pokemon', '', 'Charmeleon');
    expect(id).toBe('pokemon:charmeleon');
    expect(s.linhasDe('pokemon').map(l => l.niveis)).toEqual([[['Charmander'], ['Charizard']], [['Charmeleon']]]);
    s.voltarLinhasDaBase('pokemon');
    expect(s.linhasDe('pokemon')).toBe(antes);
    expect(JSON.parse(st.getItem('pdx-set1-plano')!).linhas).toEqual({});
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
      unidades: { lol: { Ahri: { classes: ['robo'] } } },
      linhas: {},
    });
    expect(st.getItem('pdx-stats')).toBe('{"w":{}}');
    expect(st.getItem('pdx-set1')).toBe('{"lol":["Ahri"]}');
    // relê do localStorage
    s.recarregarPlano();
    expect(s.unidadesDe('lol')).toEqual({ Ahri: { classes: ['robo'] } });
  });
  it('importarPlano espera a base e restaura; planoParaExportar leva classes e linhas que valem agora', async () => {
    installStorage();
    s.recarregarPlano();
    comBase();
    await s.importarPlano({
      versao: 1,
      classes: BASE.classes,
      unidades: { pokemon: { Charizard: { classes: ['anjo'] } } },
      linhas: { persona: [{ id: 'p', nome: 'P', niveis: [['Orpheus']] }] },
    }, ['pokemon', 'persona']);
    expect(s.plano()).toEqual({ versao: 1, unidades: { pokemon: { Charizard: { classes: ['anjo'] } } }, linhas: { persona: [{ id: 'p', nome: 'P', niveis: [['Orpheus']] }] } });
    const exp = s.planoParaExportar(['pokemon', 'persona', 'lol']);
    expect(exp.classes).toEqual(BASE.classes);
    expect(Object.keys(exp.linhas)).toEqual(['pokemon', 'persona']);
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
