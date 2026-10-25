import { afterEach, describe, expect, it, vi } from 'vitest';
import { lol, LOL_VERSIONS, LOL_WIKI, lolChampions } from './lol';
import { fixture, json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

const tile = (key: string) => `https://cdn.communitydragon.org/latest/champion/${key}/tile`;
const renders = fixture<Record<string, Record<string, string>>>('wiki-renders.json')['leagueoflegends.fandom.com']!;
const wiki = (u: URL) => u.hostname === 'leagueoflegends.fandom.com';

describe('lol', () => {
  it('rótulo e chave', () => {
    expect(lol.key).toBe('lol');
    expect(lol.label).toBe('LoL');
    expect(lol.optional).toBeUndefined();
  });

  it('pega a versão mais nova, os campeões dela e os renders da LoL Wiki', async () => {
    const f = stubFetch();
    await lol.load();
    const us = urls(f);
    expect(us.slice(0, 2)).toEqual([LOL_VERSIONS, 'https://ddragon.leagueoflegends.com/cdn/16.21.1/data/en_US/champion.json']);
    expect(lolChampions('1.2.3')).toBe('https://ddragon.leagueoflegends.com/cdn/1.2.3/data/en_US/champion.json');
    expect(us).toHaveLength(3);
    const w = new URL(us[2]!);
    expect(w.origin + w.pathname).toBe(LOL_WIKI);
    expect(w.searchParams.get('prop')).toBe('pageimages');
    expect(w.searchParams.get('pithumbsize')).toBe('600');
    expect(w.searchParams.get('titles')!.split('|')).toContain('Nunu & Willump/LoL');
  });

  it('40 campeões com o nome de exibição e o render de corpo inteiro', async () => {
    stubFetch();
    const list = await lol.load();
    expect(list).toHaveLength(40);
    expect(list[0]).toEqual({ name: 'Aatrox', img: renders['Aatrox/LoL'] });
    expect(list.find(x => x.name === 'Ahri')!.img).toMatch(/\/Ahri_Render\.png\//);
    expect(list.every(x => /_Render\./.test(x.img))).toBe(true);
    expect(list.map(x => x.name)).toEqual(expect.arrayContaining(['Wukong', 'Fiddlesticks', "Bel'Veth"]));
  });

  it('sem render na wiki (ou imagem que não é render): fica o quadrado pelo número', async () => {
    stubFetch(u => wiki(u) ? json({ query: { pages: {
      1: { title: 'Ahri/LoL', thumbnail: { source: 'https://x/Ahri_Splash.jpg' } },
      2: { title: 'Jinx/LoL', thumbnail: { source: 'https://x/Jinx_Render.png' } },
    } } }) : undefined);
    const list = await lol.load();
    expect(list.find(x => x.name === 'Ahri')).toEqual({ name: 'Ahri', img: tile('103') });
    expect(list.find(x => x.name === 'Jinx')).toEqual({ name: 'Jinx', img: 'https://x/Jinx_Render.png' });
    expect(list.find(x => x.name === 'Fiddlesticks')).toEqual({ name: 'Fiddlesticks', img: tile('9') });
  });

  it('wiki fora do ar: todos com o quadrado, a franquia carrega igual', async () => {
    stubFetch(u => wiki(u) ? text('<!DOCTYPE html>', 403) : undefined);
    const list = await lol.load();
    expect(list).toHaveLength(40);
    expect(list).toContainEqual({ name: 'Wukong', img: tile('62') });
    expect(list.every(x => x.img.startsWith('https://cdn.communitydragon.org/'))).toBe(true);
  });

  it('falha se não vier versão ou campeão', async () => {
    stubFetch(u => u.pathname === '/api/versions.json' ? json([]) : undefined);
    await expect(lol.load()).rejects.toThrow('vazio');
    stubFetch(u => u.pathname.endsWith('champion.json') ? json({ data: {} }) : undefined);
    await expect(lol.load()).rejects.toThrow('vazio');
  });

  it('falha se a API falhar', async () => {
    stubFetch(u => u.pathname.endsWith('champion.json') ? text('erro', 500) : undefined);
    await expect(lol.load()).rejects.toThrow();
    stubFetch(() => Promise.reject(new TypeError('sem rede')));
    await expect(lol.load()).rejects.toThrow('sem rede');
  });
});
