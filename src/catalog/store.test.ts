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
    expect(s.filtrosDe('pokemon')).toEqual({ q: 'char', campos: { tipo: 'Fire', geracao: 'I' }, soMarcados: false });
    expect(s.filtrosDe('lol')).toEqual({ q: '', campos: {}, soMarcados: false });
    s.mostrarMais();
    s.escolherFranquia('lol');
    expect(s.franquiaAtual()).toBe('lol');
    expect(s.quantosMostrar()).toBe(s.PAGINA);
    s.limparFiltros('pokemon');
    expect(s.filtrosDe('pokemon')).toEqual({ q: '', campos: {}, soMarcados: false });
  });
});
