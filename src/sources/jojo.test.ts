import { afterEach, describe, expect, it, vi } from 'vitest';
import { jojo, JOJO_CATEGORIES } from './jojo';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

const params = (cat: string, cont: Record<string, string> = {}) => new URLSearchParams({
  action: 'query', generator: 'categorymembers', gcmtitle: 'Category:' + cat, gcmlimit: '500', gcmnamespace: '0',
  prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '400', pilimit: '500', format: 'json', origin: '*', ...cont,
});

describe('jojo', () => {
  it('rótulo e chave', () => {
    expect(jojo.key).toBe('jojo');
    expect(jojo.label).toBe('JoJo');
    expect(jojo.optional).toBeUndefined();
  });

  it('pede as 11 categorias (em paralelo) e segue o gcmcontinue', async () => {
    const f = stubFetch();
    await jojo.load();
    expect(JOJO_CATEGORIES).toEqual(['Part 3 Stands', 'Part 4 Stands', 'Part 5 Stands', 'Part 6 Stands', 'Part 7 Stands', 'Part 8 Stands', 'Part 9 Stands',
      'Light Novel Stands', 'Other Stands', 'Thus Spoke Kishibe Rohan Stands', 'Evolved Stands']);
    expect(urls(f)).toEqual([
      ...JOJO_CATEGORIES.map(c => 'https://jojowiki.com/api.php?' + params(c)),
      'https://jojowiki.com/api.php?' + params('Part 3 Stands', { gcmcontinue: 'page|4845524d4954|2078', continue: 'gcmcontinue||' }),
    ]);
  });

  it('41 Stands: junta por pageid e tira lista, subpágina e sem imagem', async () => {
    stubFetch();
    const list = await jojo.load();
    const names = list.map(x => x.name);
    expect(list).toHaveLength(41);
    expect(names).not.toContain('List of Stands');
    expect(names).not.toContain('Star Platinum/Gallery');
    expect(names).not.toContain('Stand sem imagem');
    expect(names.filter(n => n === 'Star Platinum')).toHaveLength(1);
    expect(new Set(names).size).toBe(names.length);
    expect(list[0]).toEqual({
      name: 'Star Platinum',
      img: 'https://static.jojowiki.com/images/thumb/0/00/latest/2024/Star_Platinum_Infobox.png/400px-Star_Platinum_Infobox.png',
    });
    expect(list.every(x => x.img.startsWith('https://') && x.href === undefined)).toBe(true);
  });

  it('"List of" é tirado sem diferenciar maiúsculas', async () => {
    stubFetch(() => json({ query: { pages: {
      1: { pageid: 1, title: 'list of stands', thumbnail: { source: 'a' } },
      2: { pageid: 2, title: 'The World', thumbnail: { source: 'b' } },
    } } }));
    expect(await jojo.load()).toEqual([{ name: 'The World', img: 'b' }]);
  });

  it('falha se não sobrar nenhum Stand', async () => {
    stubFetch(() => json({ batchcomplete: '', query: { pages: {} } }));
    await expect(jojo.load()).rejects.toThrow('vazio');
    stubFetch(() => json({}));
    await expect(jojo.load()).rejects.toThrow('vazio');
  });

  it('falha se alguma categoria falhar', async () => {
    stubFetch(u => u.searchParams.get('gcmtitle') === 'Category:Part 5 Stands' ? text('erro', 500) : undefined);
    await expect(jojo.load()).rejects.toThrow();
    stubFetch(() => Promise.reject(new TypeError('sem rede')));
    await expect(jojo.load()).rejects.toThrow('sem rede');
  });
});
