import { afterEach, describe, expect, it, vi } from 'vitest';
import { lol, LOL_VERSIONS, lolChampions } from './lol';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

const splash = (key: string) => `https://cdn.communitydragon.org/latest/champion/${key}/splash-art/centered`;

describe('lol', () => {
  it('rótulo e chave', () => {
    expect(lol.key).toBe('lol');
    expect(lol.label).toBe('LoL');
    expect(lol.optional).toBeUndefined();
  });

  it('pega a versão mais nova e depois os campeões dela', async () => {
    const f = stubFetch();
    await lol.load();
    expect(urls(f)).toEqual([LOL_VERSIONS, 'https://ddragon.leagueoflegends.com/cdn/16.21.1/data/en_US/champion.json']);
    expect(lolChampions('1.2.3')).toBe('https://ddragon.leagueoflegends.com/cdn/1.2.3/data/en_US/champion.json');
  });

  it('40 campeões com o nome de exibição e a splash centralizada pelo número', async () => {
    stubFetch();
    const list = await lol.load();
    expect(list).toHaveLength(40);
    expect(list[0]).toEqual({ name: 'Aatrox', img: splash('266') });
    expect(list).toContainEqual({ name: 'Wukong', img: splash('62') });
    expect(list).toContainEqual({ name: 'Fiddlesticks', img: splash('9') });
    expect(list).toContainEqual({ name: "Bel'Veth", img: splash('200') });
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
