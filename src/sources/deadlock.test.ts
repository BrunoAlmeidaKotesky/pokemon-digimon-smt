import { afterEach, describe, expect, it, vi } from 'vitest';
import { deadlock, DEADLOCK_URL } from './deadlock';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

const card = (f: string) => `https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/${f}_card.webp`;

describe('deadlock', () => {
  it('rótulo e chave', () => {
    expect(deadlock.key).toBe('deadlock');
    expect(deadlock.label).toBe('Deadlock');
    expect(deadlock.optional).toBeUndefined();
  });

  it('44 heróis jogáveis com a arte da carta; tira os desativados e os de teste', async () => {
    const f = stubFetch();
    const list = await deadlock.load();
    expect(urls(f)).toEqual([DEADLOCK_URL]);
    expect(list).toHaveLength(44);
    expect(list[0]).toEqual({ name: 'Infernus', img: card('inferno') });
    const names = list.map(x => x.name);
    expect(names).toContain('Mo & Krill');
    expect(names).not.toContain('Kali');
    expect(names).not.toContain('hero_testhero');
  });

  it('usa o png se faltar o webp; sem imagem fica de fora; falha se não sobrar nenhum', async () => {
    stubFetch(() => json([
      { name: 'A', player_selectable: true, images: { icon_hero_card: 'a.png' } },
      { name: 'B', player_selectable: true, images: {} },
      { name: 'C', player_selectable: true, disabled: true, images: { icon_hero_card_webp: 'c.webp' } },
    ]));
    expect(await deadlock.load()).toEqual([{ name: 'A', img: 'a.png' }]);
    stubFetch(() => json([{ name: 'B', player_selectable: true }]));
    await expect(deadlock.load()).rejects.toThrow('vazio');
  });

  it('falha se a API falhar', async () => {
    stubFetch(() => text('erro', 500));
    await expect(deadlock.load()).rejects.toThrow();
  });
});
