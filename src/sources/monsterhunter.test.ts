import { afterEach, describe, expect, it, vi } from 'vitest';
import { monsterhunter, MONSTERHUNTER_URL } from './monsterhunter';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

describe('monsterhunter', () => {
  it('rótulo e chave', () => {
    expect(monsterhunter.key).toBe('monsterhunter');
    expect(monsterhunter.label).toBe('Monster Hunter');
    expect(monsterhunter.optional).toBeUndefined();
  });

  it('lê a lista local', async () => {
    const f = stubFetch();
    await monsterhunter.load();
    expect(urls(f)).toEqual([MONSTERHUNTER_URL]);
    expect(MONSTERHUNTER_URL).toBe('monsterhunter/list.json');
  });

  it('40 monstros; o tamanho da lista fica fora do item (é só pro catálogo)', async () => {
    stubFetch();
    const list = await monsterhunter.load();
    expect(list).toHaveLength(40);
    expect(Object.keys(list[0]!).sort()).toEqual(['img', 'name']);
    expect(list[0]!.name).toBe('Rathalos');
    expect(list.map(x => x.name)).toEqual(expect.arrayContaining(["Safi'jiiva", "Dah'ren Mohran", 'Yian Kut-Ku', 'Felyne']));
    expect(new Set(list.map(x => x.name)).size).toBe(40);
  });

  it('falha se a lista vier vazia ou não carregar', async () => {
    stubFetch(() => json([]));
    await expect(monsterhunter.load()).rejects.toThrow('vazio');
    stubFetch(() => text('not found', 404));
    await expect(monsterhunter.load()).rejects.toThrow();
  });
});

describe('public/monsterhunter/list.json (gerado pelo monsterhunter.mjs)', async () => {
  const fs = await import('node:fs');
  const list = JSON.parse(fs.readFileSync(new URL('../../public/monsterhunter/list.json', import.meta.url), 'utf8')) as [string, string, string][];
  const nomes = new Set(list.map(([n]) => n));

  it('sem nome nem imagem repetidos, tudo da wiki', () => {
    expect(list.length).toBeGreaterThan(450);
    expect(nomes.size).toBe(list.length);
    expect(new Set(list.map(([, img]) => img)).size).toBe(list.length);
    for (const [n, img] of list) {
      expect(img, n).toMatch(/^https:\/\/monsterhunterwiki\.org\/images\//);
      expect(img, n).not.toMatch(/wiki\.png/i);
    }
  });

  it('grandes e pequenos', () => {
    const tamanho = new Map(list.map(([n, , t]) => [n, t]));
    expect(new Set(tamanho.values())).toEqual(new Set(['Grande', 'Pequeno']));
    for (const n of ['Rathalos', 'Zinogre', 'Fatalis', 'Arkveld']) expect(tamanho.get(n), n).toBe('Grande');
    for (const n of ['Felyne', 'Kelbi', 'Jagras']) expect(tamanho.get(n), n).toBe('Pequeno');
  });

  it('sem render ou genérico fica de fora', () => {
    for (const n of ['Fish', 'Guardian Ratha', 'Immortal Zinogre', 'Epona']) expect(nomes.has(n), n).toBe(false);
  });
});
