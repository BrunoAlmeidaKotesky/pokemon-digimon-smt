import { afterEach, describe, expect, it, vi } from 'vitest';
import { ff, FF_URL } from './ff';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

describe('ff', () => {
  it('rótulo e chave', () => {
    expect(ff.key).toBe('ff');
    expect(ff.label).toBe('Final Fantasy');
    expect(ff.optional).toBeUndefined();
  });

  it('lê a lista local (a API não manda CORS)', async () => {
    const f = stubFetch();
    await ff.load();
    expect(urls(f)).toEqual([FF_URL]);
    expect(FF_URL).toBe('ff/list.json');
  });

  it('40 monstros com o jogo no nome; o mesmo monstro de jogos diferentes vale como outro', async () => {
    stubFetch();
    const list = await ff.load();
    expect(list).toHaveLength(40);
    expect(list[0]).toEqual({ name: 'Goblin (FF I)', img: 'https://images.moogleapi.com/gen/monsters/64.webp' });
    expect(list.map(x => x.name).filter(n => n.startsWith('Bomb ('))).toEqual(['Bomb (FF II)', 'Bomb (FF III)', 'Bomb (FF IV)', 'Bomb (FF V)']);
    expect(new Set(list.map(x => x.name)).size).toBe(40);
  });

  it('falha se a lista vier vazia ou não carregar', async () => {
    stubFetch(() => json([]));
    await expect(ff.load()).rejects.toThrow('vazio');
    stubFetch(() => text('not found', 404));
    await expect(ff.load()).rejects.toThrow();
  });
});

describe('public/ff/list.json (gerado pelo ff.mjs)', async () => {
  const fs = await import('node:fs');
  const list = JSON.parse(fs.readFileSync(new URL('../../public/ff/list.json', import.meta.url), 'utf8')) as [string, string, string][];

  it('só monstros com imagem da MoogleAPI e jogo da série principal', () => {
    expect(list.length).toBeGreaterThan(3000);
    for (const [name, game, img] of list) {
      expect(name.trim()).toBe(name);
      expect(game).toMatch(/^FF (I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI)$/);
      expect(img).toMatch(/^https:\/\/images\.moogleapi\.com\/.+\.webp$/);
    }
  });

  it('nome + jogo nunca repete (o site usa o nome como chave)', () => {
    expect(new Set(list.map(([n, g]) => `${n} (${g})`)).size).toBe(list.length);
  });
});
