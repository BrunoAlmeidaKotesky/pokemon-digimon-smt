import { afterEach, describe, expect, it, vi } from 'vitest';
import { overwatch, OVERWATCH_URL } from './overwatch';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

describe('overwatch', () => {
  it('rótulo e chave', () => {
    expect(overwatch.key).toBe('overwatch');
    expect(overwatch.label).toBe('Overwatch');
    expect(overwatch.optional).toBeUndefined();
  });

  it('54 heróis com o retrato, na ordem da API', async () => {
    const f = stubFetch();
    const list = await overwatch.load();
    expect(urls(f)).toEqual([OVERWATCH_URL]);
    expect(list).toHaveLength(54);
    expect(list[0]).toEqual({
      name: 'Ana',
      img: 'https://d15f34w2p8l1cc.cloudfront.net/overwatch/985b06beae46b7ba3ca87d1512d0fc62ca7f206ceca58ef16fc44d43a1cc84ed.png',
    });
    expect(list.map(x => x.name)).toContain('Soldier: 76');
  });

  it('tira quem vem sem retrato; falha se não sobrar nenhum', async () => {
    stubFetch(() => json([{ key: 'a', name: 'A', portrait: 'a.png' }, { key: 'b', name: 'B' }]));
    expect(await overwatch.load()).toEqual([{ name: 'A', img: 'a.png' }]);
    stubFetch(() => json([{ key: 'b', name: 'B' }]));
    await expect(overwatch.load()).rejects.toThrow('vazio');
  });

  it('falha se a API falhar', async () => {
    stubFetch(() => text('erro', 500));
    await expect(overwatch.load()).rejects.toThrow();
  });
});
