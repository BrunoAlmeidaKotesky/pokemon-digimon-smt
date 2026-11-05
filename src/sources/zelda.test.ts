import { afterEach, describe, expect, it, vi } from 'vitest';
import { zelda, ZELDA_URL } from './zelda';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

describe('zelda', () => {
  it('rótulo e chave', () => {
    expect(zelda.key).toBe('zelda');
    expect(zelda.label).toBe('Zelda');
    expect(zelda.optional).toBeUndefined();
  });

  it('lê a lista local (um arquivo só, em vez de ~25 pedidos à wiki)', async () => {
    const f = stubFetch();
    await zelda.load();
    expect(urls(f)).toEqual([ZELDA_URL]);
    expect(ZELDA_URL).toBe('zelda/list.json');
  });

  it('40 inimigos e chefes, com nome e imagem', async () => {
    stubFetch();
    const list = await zelda.load();
    expect(list).toHaveLength(40);
    expect(list[0]).toEqual({ name: 'Ache', img: 'https://cdn.wikimg.net/en/zeldawiki/images/thumb/2/24/TAoL_Ache_Artwork.png/400px-TAoL_Ache_Artwork.png' });
    expect(list.map(x => x.name)).toEqual(expect.arrayContaining(['Moldorm', 'Moldorm (Boss)', "Majora's Mask", "Agahnim's Shadow"]));
    expect(new Set(list.map(x => x.name)).size).toBe(40);
  });

  it('falha se a lista vier vazia ou não carregar', async () => {
    stubFetch(() => json([]));
    await expect(zelda.load()).rejects.toThrow('vazio');
    stubFetch(() => text('not found', 404));
    await expect(zelda.load()).rejects.toThrow();
  });
});

describe('public/zelda/list.json (gerado pelo zelda.mjs)', async () => {
  const fs = await import('node:fs');
  const list = JSON.parse(fs.readFileSync(new URL('../../public/zelda/list.json', import.meta.url), 'utf8')) as [string, string][];
  const nomes = new Set(list.map(([n]) => n));

  it('a série inteira, sem nome repetido (o site usa o nome como chave)', () => {
    expect(list.length).toBeGreaterThan(700);
    expect(nomes.size).toBe(list.length);
  });

  it('só modelo, render ou arte: nada de sprite, print ou ícone', () => {
    for (const [n, img] of list) {
      expect(img, n).toMatch(/^https:\/\/cdn\.wikimg\.net\/en\/zeldawiki\/images\//);
      expect(img, n).toMatch(/Model|Render|Artwork|Art\b/i);
      expect(img, n).not.toMatch(/Sprite|Screenshot|Icon/i);
    }
  });

  it('nenhuma imagem repetida (seriam duas cartas iguais)', () => {
    expect(new Set(list.map(([, img]) => img)).size).toBe(list.length);
  });

  it('aliado que aparece como chefe sai; vilão e monstro ficam', () => {
    for (const n of ['Princess Zelda', 'Darunia', 'Link', 'Midna', 'Impa', 'Fi', 'Dark Zelda', 'Dark Marin']) expect(nomes.has(n), n).toBe(false);
    for (const n of ['Ganon', 'Ganondorf', 'Zant', 'Ghirahim', 'Bokoblin', 'Lynel', 'Octorok', 'Dark Link', 'Windblight Ganon']) expect(nomes.has(n), n).toBe(true);
  });

  it('armadilha e cenário saem; criatura da categoria Traps fica', () => {
    for (const n of ['Lava', 'Quicksand', 'Trap Door', 'Whirlpool', 'Rock', 'Horde Battle']) expect(nomes.has(n), n).toBe(false);
    for (const n of ['Bubble', 'Medusa']) expect(nomes.has(n), n).toBe(true);
  });
});
