import { afterEach, describe, expect, it, vi } from 'vitest';
import { kamenrider, KAMENRIDER_URL } from './kamenrider';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

describe('kamenrider', () => {
  it('rótulo e chave', () => {
    expect(kamenrider.key).toBe('kamenrider');
    expect(kamenrider.label).toBe('Kamen Rider');
    expect(kamenrider.optional).toBeUndefined();
  });

  it('lê a lista local', async () => {
    const f = stubFetch();
    await kamenrider.load();
    expect(urls(f)).toEqual([KAMENRIDER_URL]);
    expect(KAMENRIDER_URL).toBe('kamenrider/list.json');
  });

  it('40 Riders; série e usuário ficam fora do item (são só pro catálogo)', async () => {
    stubFetch();
    const list = await kamenrider.load();
    expect(list).toHaveLength(40);
    expect(Object.keys(list[0]!).sort()).toEqual(['img', 'name']);
    expect(list.map(x => x.name)).toEqual(expect.arrayContaining(['Kamen Rider Kuuga', 'Kamen Rider Birth·Proto Type', 'Agito Burning Form (Evil)']));
    expect(new Set(list.map(x => x.name)).size).toBe(40);
  });

  it('falha se a lista vier vazia ou não carregar', async () => {
    stubFetch(() => json([]));
    await expect(kamenrider.load()).rejects.toThrow('vazio');
    stubFetch(() => text('not found', 404));
    await expect(kamenrider.load()).rejects.toThrow();
  });
});

describe('public/kamenrider/list.json (gerado pelo kamenrider.mjs)', async () => {
  const fs = await import('node:fs');
  const list = JSON.parse(fs.readFileSync(new URL('../../public/kamenrider/list.json', import.meta.url), 'utf8')) as [string, string, string, string][];
  const imagem = new Map(list.map(([n, img]) => [n, img]));

  it('sem nome nem imagem repetidos, tudo da wiki e nada de marcador', () => {
    expect(list.length).toBeGreaterThan(330);
    expect(imagem.size).toBe(list.length);
    expect(new Set(list.map(([, img]) => img)).size).toBe(list.length);
    for (const [n, img] of list) {
      expect(img, n).toMatch(/^https:\/\/static\.wikia\.nocookie\.net\/kamenrider\/images\//);
      expect(img, n).not.toMatch(/No_Image/i);
    }
  });

  it('cada Rider com o próprio render, não o de quem tem nome parecido', () => {
    const certo: [string, RegExp][] = [
      ['Kamen Rider Decade', /KRDCD-Decade\./], ['Kamen Rider G3', /KRAg-G3\./], ['Kamen Rider G3-X', /KRAg-G3-X/], ['Kamen Rider Rogue', /KRBu-Rogue\./],
      ['Night Rogue', /Night_Rogue/], ['Kamen Rider Joker', /KRW-Joker/], ['Kamen Rider ZX', /KRZX-ZX/], ['Kamen Rider Psyga', /KR555-Psyga/],
      ['Kamen Rider 1', /Original_1\./], ['Kamen Rider New 1', /New_1\./],
    ];
    for (const [n, re] of certo) expect(imagem.get(n), n).toMatch(re);
  });

  it('a tabela oficial para no Gotchard: Gavv e Zeztz entram à mão', () => {
    for (const n of ['Kamen Rider Gavv', 'Kamen Rider Valen', 'Kamen Rider Zeztz']) expect(imagem.has(n), n).toBe(true);
  });

  it('série preenchida pro catálogo', () => {
    for (const [n, , serie] of list) expect(serie, n).toBeTruthy();
  });
});
