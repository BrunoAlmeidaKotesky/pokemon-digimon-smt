import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseSujidex, loadSujidexWiki, YAKUZA_API } from './sujidex';
import { sujimon } from './sujimon';
import { fixture, json, stubFetch, text, urls } from './test-utils';
import type { SujidexFixture } from '../../tests/sujidex-mock';

afterEach(() => { vi.unstubAllGlobals(); });
const fx = fixture<SujidexFixture>('sujidex.json');

describe('parseSujidex', () => {
  const rows = parseSujidex(fx.wikitext);

  it('lê só a tabela de Infinite Wealth (ignora a de Y:LAD)', () => {
    expect(rows).toHaveLength(44);
    expect(rows.map(r => r.num)).toEqual([...rows.map(r => r.num)].sort((a, b) => a - b));
    expect(rows[0]).toEqual({ num: 1, name: 'Burnout Bully', page: 'Burnout Bully', icon: 'Burnout Bully Icon.png' });
  });

  it('linha sem ícone, link com rótulo, linhas em várias linhas e nome sem link', () => {
    const by = (n: number) => rows.find(r => r.num === n)!;
    expect(by(9)).toEqual({ num: 9, name: 'Transcendent Transient', page: 'Transcendent Transient', icon: null });
    expect(by(13)).toMatchObject({ name: 'Street Punk', page: 'Punkling', icon: 'Punkling Icon.png' });
    expect(by(273)).toEqual({ num: 273, name: 'Powered Tool', page: 'Powered Tool', icon: null });
    expect(by(305)).toMatchObject({ name: 'Chau Ka Long', page: 'Lau Ka Long' });
    expect(by(300)).toEqual({ num: 300, name: 'Legendary Excavators ft. Lam-chan and Lun-chan', page: null, icon: null });
    expect(by(306)).toEqual({ num: 306, name: 'Yoshida', page: null, icon: null });
  });

  it('sem a seção de Infinite Wealth devolve lista vazia', () => {
    expect(parseSujidex('==Outra coisa==\n{|\n|-\n|a||1||[[B]]\n|}')).toEqual([]);
  });
});

describe('loadSujidexWiki', () => {
  it('usa a imagem da página e, se faltar, o ícone; quem não tem imagem fica de fora', async () => {
    const f = stubFetch();
    const list = await loadSujidexWiki();
    const pageImgs = Object.values(fx.pageimages.query.pages) as { title: string; thumbnail?: { source: string } }[];
    const comFoto = pageImgs.filter(p => p.thumbnail);
    // cada item tem imagem; nenhum nome repetido
    expect(list.length).toBeGreaterThan(20);
    expect(list.every(x => x.img.startsWith('https://static.wikia.nocookie.net/'))).toBe(true);
    expect(new Set(list.map(x => x.name)).size).toBe(list.length);
    // Burnout Bully tem imagem própria na página: ela ganha do ícone
    const bully = comFoto.find(p => p.title === 'Burnout Bully');
    if (bully) expect(list.find(x => x.name === 'Burnout Bully')!.img).toBe(bully.thumbnail!.source);
    // nomes sem link e sem ícone não entram
    expect(list.map(x => x.name)).not.toContain('Yoshida');
    // um pedido do wikitext, depois imagens das páginas e dos ícones, sempre com origin=*
    const us = urls(f).map(u => new URL(u));
    expect(us[0]!.origin + us[0]!.pathname).toBe(YAKUZA_API);
    expect(us[0]!.searchParams.get('action')).toBe('parse');
    expect(us.every(u => u.searchParams.get('origin') === '*' && u.searchParams.get('format') === 'json')).toBe(true);
    expect(us.some(u => u.searchParams.get('prop') === 'pageimages')).toBe(true);
    expect(us.some(u => u.searchParams.get('prop') === 'imageinfo')).toBe(true);
  });

  it('wikitext sem a tabela: rejeita com "vazio"', async () => {
    stubFetch(u => u.hostname === 'yakuza.fandom.com' ? json({ parse: { wikitext: { '*': 'nada' } } }) : undefined);
    await expect(loadSujidexWiki()).rejects.toThrow('vazio');
  });
});

describe('sujimon: lista local primeiro, wiki depois', () => {
  it('com list.json local não consulta a wiki', async () => {
    const f = stubFetch();
    const list = await sujimon.load();
    expect(list[0]).toEqual({ name: 'Kowloon Mullet', img: 'sujimon/001.webp' });
    expect(urls(f)).toEqual(['sujimon/list.json']);
  });

  it('sem list.json (404) usa a Yakuza Wiki', async () => {
    const f = stubFetch(u => u.pathname === '/sujimon/list.json' ? text('not found', 404) : undefined);
    const list = await sujimon.load();
    expect(list.length).toBeGreaterThan(20);
    expect(list[0]!.name).toBe('Burnout Bully');
    expect(urls(f)[0]).toBe('sujimon/list.json');
    expect(urls(f).slice(1).every(u => u.startsWith(YAKUZA_API))).toBe(true);
  });

  it('sem list.json e sem wiki: rejeita (a franquia some)', async () => {
    stubFetch(u => u.pathname === '/sujimon/list.json' ? text('not found', 404) : u.hostname === 'yakuza.fandom.com' ? Promise.reject(new TypeError('sem rede')) : undefined);
    await expect(sujimon.load()).rejects.toThrow();
  });
});
