import { afterEach, describe, expect, it, vi } from 'vitest';
import { overwatch, OVERWATCH_URL, OVERWATCH_WIKI } from './overwatch';
import { fixture, json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

const renders = fixture<Record<string, Record<string, string>>>('wiki-renders.json')['overwatch.fandom.com']!;
const wiki = (u: URL) => u.hostname === 'overwatch.fandom.com';
const ANA = 'https://d15f34w2p8l1cc.cloudfront.net/overwatch/985b06beae46b7ba3ca87d1512d0fc62ca7f206ceca58ef16fc44d43a1cc84ed.png';

describe('overwatch', () => {
  it('rótulo e chave', () => {
    expect(overwatch.key).toBe('overwatch');
    expect(overwatch.label).toBe('Overwatch');
    expect(overwatch.optional).toBeUndefined();
  });

  it('54 heróis na ordem da API, com o render da Overwatch Wiki (2 pedidos de até 50)', async () => {
    const f = stubFetch();
    const list = await overwatch.load();
    const us = urls(f);
    expect(us[0]).toBe(OVERWATCH_URL);
    expect(us.slice(1).map(u => new URL(u)).map(u => u.origin + u.pathname)).toEqual([OVERWATCH_WIKI, OVERWATCH_WIKI]);
    expect(list).toHaveLength(54);
    expect(list[0]).toEqual({ name: 'Ana', img: renders['Ana'] });
    expect(list[0]!.img).toMatch(/\/OW2_Ana\.png\//);
    expect(list.find(x => x.name === 'Soldier: 76')!.img).toBe(renders['Soldier: 76']);
  });

  it('sem render na wiki: fica o retrato; sem nenhum dos dois, fica de fora', async () => {
    stubFetch(u => wiki(u) ? json({ query: { pages: { 1: { title: 'B', thumbnail: { source: 'b-render.png' } } } } })
      : json([{ key: 'a', name: 'A', portrait: 'a.png' }, { key: 'b', name: 'B' }, { key: 'c', name: 'C' }]));
    expect(await overwatch.load()).toEqual([{ name: 'A', img: 'a.png' }, { name: 'B', img: 'b-render.png' }]);
  });

  it('wiki fora do ar: todos com o retrato, a franquia carrega igual', async () => {
    stubFetch(u => wiki(u) ? text('<!DOCTYPE html>', 403) : undefined);
    const list = await overwatch.load();
    expect(list).toHaveLength(54);
    expect(list[0]).toEqual({ name: 'Ana', img: ANA });
  });

  it('falha se não sobrar nenhum ou se a API falhar', async () => {
    stubFetch(u => wiki(u) ? json({}) : json([{ key: 'b', name: 'B' }]));
    await expect(overwatch.load()).rejects.toThrow('vazio');
    stubFetch(() => text('erro', 500));
    await expect(overwatch.load()).rejects.toThrow();
  });
});
