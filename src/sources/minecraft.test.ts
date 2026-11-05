import { afterEach, describe, expect, it, vi } from 'vitest';
import { minecraft, MINECRAFT_URL } from './minecraft';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

describe('minecraft', () => {
  it('rótulo e chave', () => {
    expect(minecraft.key).toBe('minecraft');
    expect(minecraft.label).toBe('Minecraft');
    expect(minecraft.optional).toBeUndefined();
  });

  it('lê a lista local', async () => {
    const f = stubFetch();
    await minecraft.load();
    expect(urls(f)).toEqual([MINECRAFT_URL]);
    expect(MINECRAFT_URL).toBe('minecraft/list.json');
  });

  it('40 mobs, com nome e imagem', async () => {
    stubFetch();
    const list = await minecraft.load();
    expect(list).toHaveLength(40);
    expect(list[0]!.name).toBe('Allay');
    expect(list[0]!.img).toMatch(/^https:\/\/minecraft\.wiki\/images\//);
    expect(new Set(list.map(x => x.name)).size).toBe(40);
  });

  it('falha se a lista vier vazia ou não carregar', async () => {
    stubFetch(() => json([]));
    await expect(minecraft.load()).rejects.toThrow('vazio');
    stubFetch(() => text('not found', 404));
    await expect(minecraft.load()).rejects.toThrow();
  });
});

describe('public/minecraft/list.json (gerado pelo minecraft.mjs)', async () => {
  const fs = await import('node:fs');
  const list = JSON.parse(fs.readFileSync(new URL('../../public/minecraft/list.json', import.meta.url), 'utf8')) as [string, string][];
  const nomes = new Set(list.map(([n]) => n));
  const imagem = new Map(list);

  it('sem nome nem imagem repetidos, tudo da wiki', () => {
    expect(list.length).toBeGreaterThan(120);
    expect(nomes.size).toBe(list.length);
    expect(new Set(list.map(([, img]) => img)).size).toBe(list.length);
    for (const [n, img] of list) expect(img, n).toMatch(/^https:\/\/minecraft\.wiki\/images\//);
  });

  it('variantes entram no lugar do mob base, uma carta por cor', () => {
    for (const n of ['Cat', 'Wolf', 'Horse', 'Sheep', 'Frog', 'Axolotl']) expect(nomes.has(n), n).toBe(false);
    for (const n of ['Black Cat', 'Persian Cat', 'Pale Wolf', 'Ashen Wolf', 'White Horse', 'White Sheep', 'Light Blue Sheep', 'Temperate Frog', 'Lucy Axolotl']) {
      expect(nomes.has(n), n).toBe(true);
    }
    expect(list.filter(([n]) => n.endsWith(' Sheep'))).toHaveLength(16);
    expect(list.filter(([n]) => n.endsWith(' Wolf'))).toHaveLength(9);
    expect(list.filter(([n]) => n.endsWith(' Cat'))).toHaveLength(11);
  });

  it('jockeys, mobs de 1º de abril, Education e os que não existem no jogo normal ficam de fora', () => {
    for (const n of ['Spider Jockey', 'Chicken Jockey', 'Redstone Bug', 'Pink Wither', 'Agent', 'NPC', 'Camera', 'Giant', 'Elder Guardian Ghost', 'Villager (old)']) {
      expect(nomes.has(n), n).toBe(false);
    }
    for (const n of ['Creeper', 'Enderman', 'Warden', 'Ender Dragon', 'Wither', 'Illusioner']) expect(nomes.has(n), n).toBe(true);
  });

  it('Skeleton usa o render normal, não a imagem dele canhoto', () => {
    expect(imagem.get('Skeleton')).toContain('Skeleton_JE6_BE4');
  });
});
