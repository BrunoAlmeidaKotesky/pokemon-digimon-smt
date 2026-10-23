import { afterEach, describe, expect, it, vi } from 'vitest';
import { bakugan } from './bakugan';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

const params = (cont: Record<string, string> = {}) => new URLSearchParams({
  action: 'query', generator: 'embeddedin', geititle: 'Template:Infobox Bakugan', geilimit: '500', geinamespace: '0',
  prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '400', pilimit: '500', format: 'json', origin: '*', ...cont,
});

describe('bakugan', () => {
  it('rótulo e chave', () => {
    expect(bakugan.key).toBe('bakugan');
    expect(bakugan.label).toBe('Bakugan');
    expect(bakugan.optional).toBeUndefined();
  });

  it('segue o geicontinue até o fim', async () => {
    const f = stubFetch();
    await bakugan.load();
    expect(urls(f)).toEqual([
      'https://bakugan.fandom.com/api.php?' + params(),
      'https://bakugan.fandom.com/api.php?' + params({ geicontinue: '0|2237', continue: 'geicontinue||' }),
    ]);
  });

  it('49 Bakugan, sem subpágina com "/"', async () => {
    stubFetch();
    const list = await bakugan.load();
    expect(list).toHaveLength(49);
    expect(list.map(x => x.name)).not.toContain('Angelo/Diablo Preyas');
    expect(list[0]).toEqual({
      name: 'Drago',
      img: 'https://static.wikia.nocookie.net/bakugan/images/5/58/FusionDragonoid1.jpg/revision/latest/scale-to-width-down/400?cb=20250406235650',
    });
  });

  it('junta por pageid (fica a posição da 1ª, o conteúdo da última) e tira sem imagem e "List of"', async () => {
    let n = 0;
    stubFetch(() => json(n++ === 0
      ? { continue: { geicontinue: 'x', continue: 'geicontinue||' }, query: { pages: {
        1: { pageid: 1, title: 'Drago', thumbnail: { source: 'velho' } },
        2: { pageid: 2, title: 'Sem Foto' },
        3: { pageid: 3, title: 'List of Bakugan', thumbnail: { source: 'c' } },
      } } }
      : { query: { pages: {
        4: { pageid: 4, title: 'Tigrerra', thumbnail: { source: 't' } },
        1: { pageid: 1, title: 'Drago', thumbnail: { source: 'novo' } },
      } } }));
    expect(await bakugan.load()).toEqual([{ name: 'Drago', img: 'novo' }, { name: 'Tigrerra', img: 't' }]);
  });

  it('falha se não sobrar nenhum', async () => {
    stubFetch(() => json({ query: { pages: { 1: { pageid: 1, title: 'Sem Foto' } } } }));
    await expect(bakugan.load()).rejects.toThrow('vazio');
  });

  it('falha se a API falhar, mesmo na 2ª página', async () => {
    stubFetch(u => u.searchParams.get('geicontinue') ? text('erro', 500) : undefined);
    await expect(bakugan.load()).rejects.toThrow();
    stubFetch(() => Promise.reject(new TypeError('sem rede')));
    await expect(bakugan.load()).rejects.toThrow('sem rede');
  });
});
