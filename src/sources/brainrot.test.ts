import { afterEach, describe, expect, it, vi } from 'vitest';
import { brainrot, BRAINROT_URL } from './brainrot';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

describe('brainrot', () => {
  it('rótulo e chave', () => {
    expect(brainrot.key).toBe('brainrot');
    expect(brainrot.label).toBe('Brainrot');
    expect(brainrot.optional).toBeUndefined();
  });

  it('lê a lista local', async () => {
    const f = stubFetch();
    await brainrot.load();
    expect(urls(f)).toEqual([BRAINROT_URL]);
    expect(BRAINROT_URL).toBe('brainrot/list.json');
  });

  it('40 bichos; categoria e votos ficam fora do item (são só pro catálogo)', async () => {
    stubFetch();
    const list = await brainrot.load();
    expect(list).toHaveLength(40);
    expect(Object.keys(list[0]!).sort()).toEqual(['img', 'name']);
    expect(list.map(x => x.name)).toContain('Lirilì Larilà');
    expect(new Set(list.map(x => x.name)).size).toBe(40);
  });

  it('falha se a lista vier vazia ou não carregar', async () => {
    stubFetch(() => json([]));
    await expect(brainrot.load()).rejects.toThrow('vazio');
    stubFetch(() => text('not found', 404));
    await expect(brainrot.load()).rejects.toThrow();
  });
});

describe('public/brainrot/list.json (gerado pelo brainrot.mjs)', async () => {
  const fs = await import('node:fs');
  const list = JSON.parse(fs.readFileSync(new URL('../../public/brainrot/list.json', import.meta.url), 'utf8')) as [string, string, string, number][];

  it('sem nome repetido, mesmo mudando maiúscula (o site usa o nome como chave)', () => {
    expect(list.length).toBeGreaterThan(1500);
    expect(new Set(list.map(([n]) => n.toLowerCase())).size).toBe(list.length);
  });

  it('cada bicho com a imagem própria e o nome sem resto de HTML', () => {
    for (const [n, img] of list) {
      expect(img, n).toMatch(/^https:\/\/static\.animalbrainrot\.com\/(images|animals)\//);
      expect(n).not.toMatch(/[<>]|&\w+;/);
    }
  });

  it('categoria e votos preenchidos pro catálogo', () => {
    for (const [n, , categoria, votos] of list) {
      expect(categoria, n).toBeTruthy();
      expect(votos, n).toBeGreaterThanOrEqual(0);
    }
  });
});
