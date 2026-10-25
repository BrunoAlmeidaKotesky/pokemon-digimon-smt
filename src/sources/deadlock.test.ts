import { afterEach, describe, expect, it, vi } from 'vitest';
import { deadlock, DEADLOCK_URL, DEADLOCK_WIKI } from './deadlock';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

const card = (f: string) => `https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/${f}_card.webp`;
const wiki = (u: URL) => u.hostname === 'deadlock.wiki';

describe('deadlock', () => {
  it('rótulo e chave', () => {
    expect(deadlock.key).toBe('deadlock');
    expect(deadlock.label).toBe('Deadlock');
    expect(deadlock.optional).toBeUndefined();
  });

  it('44 heróis jogáveis com o render da Deadlock Wiki em 500px; tira os desativados e os de teste', async () => {
    const f = stubFetch();
    const list = await deadlock.load();
    const us = urls(f);
    expect(us[0]).toBe(DEADLOCK_URL);
    expect(us).toHaveLength(2);
    const w = new URL(us[1]!);
    expect(w.origin + w.pathname).toBe(DEADLOCK_WIKI);
    expect(w.searchParams.get('prop')).toBe('imageinfo');
    expect(w.searchParams.get('iiurlwidth')).toBe('500');
    expect(w.searchParams.get('titles')!.split('|')).toHaveLength(44);
    expect(list).toHaveLength(44);
    expect(list[0]).toEqual({ name: 'Infernus', img: 'https://cdn.deadlock.wiki/thumb/Infernus_Render.png/500px-Infernus_Render.png' });
    expect(list.find(x => x.name === 'Mo & Krill')!.img).toMatch(/Render\.png$/);
    const names = list.map(x => x.name);
    expect(names).not.toContain('Kali');
    expect(names).not.toContain('hero_testhero');
  });

  it('sem render: fica a carta (webp, senão png); sem imagem nenhuma fica de fora', async () => {
    stubFetch(u => wiki(u)
      ? json({ query: { pages: { 1: { title: 'File:D Render.png', imageinfo: [{ url: 'd.png', thumburl: 'd-500.png' }] } } } })
      : json([
        { name: 'A', player_selectable: true, images: { icon_hero_card: 'a.png' } },
        { name: 'B', player_selectable: true, images: {} },
        { name: 'C', player_selectable: true, disabled: true, images: { icon_hero_card_webp: 'c.webp' } },
        { name: 'D', player_selectable: true },
      ]));
    expect(await deadlock.load()).toEqual([{ name: 'A', img: 'a.png' }, { name: 'D', img: 'd-500.png' }]);
  });

  it('wiki fora do ar: todos com a carta, a franquia carrega igual', async () => {
    stubFetch(u => wiki(u) ? text('<!DOCTYPE html>', 403) : undefined);
    const list = await deadlock.load();
    expect(list).toHaveLength(44);
    expect(list[0]).toEqual({ name: 'Infernus', img: card('inferno') });
  });

  it('falha se não sobrar nenhum ou se a API falhar', async () => {
    stubFetch(u => wiki(u) ? json({}) : json([{ name: 'B', player_selectable: true }]));
    await expect(deadlock.load()).rejects.toThrow('vazio');
    stubFetch(() => text('erro', 500));
    await expect(deadlock.load()).rejects.toThrow();
  });
});
