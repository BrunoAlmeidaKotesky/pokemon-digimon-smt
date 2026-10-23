import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ygo, YGO_CACHE_KEY } from './ygo';
import { fixture, json, stubFetch, stubStorage, text, urls } from './test-utils';

const URL_API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes';
const DAY = 864e5;
const NOW = 1_800_000_000_000;
const img = (id: number) => `https://images.ygoprodeck.com/images/cards_cropped/${id}.jpg`;

interface Card { id: number; name: string; type: string; card_images: { id: number }[]; misc_info: { views: number; formats: string[] }[] }
const cards = () => fixture<{ data: Card[] }>('ygo-cardinfo.json').data;
const monster = (i: number, views: number): Card =>
  ({ id: i, name: `Monstro ${i}`, type: 'Effect Monster', card_images: [{ id: i }], misc_info: [{ views, formats: ['TCG'] }] });

beforeEach(() => { vi.spyOn(Date, 'now').mockReturnValue(NOW); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('ygo', () => {
  it('rótulo e chave', () => {
    expect(ygo.key).toBe('ygo');
    expect(ygo.label).toBe('Yu-Gi-Oh!');
    expect(ygo.optional).toBeUndefined();
    expect(YGO_CACHE_KEY).toBe('pdx-ygo-v1');
  });

  it('45 monstros oficiais, do mais visto ao menos visto, arte recortada pelo id da imagem', async () => {
    stubStorage();
    const f = stubFetch();
    const list = await ygo.load();
    expect(urls(f)).toEqual([URL_API]);
    expect(list).toHaveLength(45);
    expect(list[0]).toEqual({ name: 'Blue-Eyes White Dragon', img: img(900000) });
    expect(list[1]).toEqual({ name: 'Dark Magician', img: img(900001) });
    const byImg = new Map(cards().map(c => [img(c.card_images[0]!.id), c]));
    const views = list.map(x => byImg.get(x.img)?.misc_info[0]?.views ?? -1);
    expect(views.every(v => v >= 0)).toBe(true);
    expect(views).toEqual([...views].sort((a, b) => b - a));
    expect(list.every(x => /Monster/.test(byImg.get(x.img)?.type ?? ''))).toBe(true);
  });

  it('tira Token, monstro fora de TCG/OCG, não-monstro e nome repetido (fica o mais visto)', async () => {
    stubStorage();
    stubFetch();
    const names = (await ygo.load()).map(x => x.name);
    expect(names).not.toContain('Sheep Token');
    expect(names).not.toContain('Speed Duel Only Monster');
    expect(names).not.toContain('???');
    expect(names).not.toContain('"A Case for K9"');
    expect(names.filter(n => n === 'Blue-Eyes White Dragon')).toHaveLength(1);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain('30,000-Year White Turtle'); // só OCG
  });

  it('Token é tirado mesmo com "Monster" no tipo, e carta sem imagem também', async () => {
    stubStorage();
    stubFetch(() => json({ data: [
      { ...monster(1, 10), type: 'Token Monster' },
      { ...monster(2, 20), card_images: [] },
      { ...monster(4, 5), misc_info: [{ formats: ['OCG'] }] },
      monster(3, 30),
    ] }));
    expect(await ygo.load()).toEqual([{ name: 'Monstro 3', img: img(3) }, { name: 'Monstro 4', img: img(4) }]);
  });

  it('no máximo 3000', async () => {
    stubStorage();
    stubFetch(() => json({ data: Array.from({ length: 3005 }, (_, i) => monster(i, i)) }));
    const list = await ygo.load();
    expect(list).toHaveLength(3000);
    expect(list[0]?.name).toBe('Monstro 3004');
    expect(list[2999]?.name).toBe('Monstro 5');
  });

  describe('cache no localStorage', () => {
    it('grava {t, list} depois de buscar', async () => {
      const s = stubStorage();
      stubFetch();
      await ygo.load();
      expect(s.setItem).toHaveBeenCalledTimes(1);
      const saved = JSON.parse(s.data.get(YGO_CACHE_KEY) ?? '') as { t: number; list: [string, number][] };
      expect(Object.keys(saved)).toEqual(['t', 'list']);
      expect(saved.t).toBe(NOW);
      expect(saved.list).toHaveLength(45);
      expect(saved.list[0]).toEqual(['Blue-Eyes White Dragon', 900000]);
    });

    it('cache válido: usa a lista guardada e não chama a API', async () => {
      const s = stubStorage({ [YGO_CACHE_KEY]: JSON.stringify({ t: NOW - 7 * DAY + 1, list: [['Kuriboh', 40640057], ['Jinzo', 77585513]] }) });
      const f = stubFetch();
      expect(await ygo.load()).toEqual([{ name: 'Kuriboh', img: img(40640057) }, { name: 'Jinzo', img: img(77585513) }]);
      expect(f).not.toHaveBeenCalled();
      expect(s.setItem).not.toHaveBeenCalled();
    });

    it.each([
      ['vencido (7 dias exatos)', JSON.stringify({ t: NOW - 7 * DAY, list: [['Kuriboh', 1]] })],
      ['vencido (8 dias)', JSON.stringify({ t: NOW - 8 * DAY, list: [['Kuriboh', 1]] })],
      ['sem t', JSON.stringify({ list: [['Kuriboh', 1]] })],
      ['lista vazia', JSON.stringify({ t: NOW, list: [] })],
      ['sem lista', JSON.stringify({ t: NOW })],
      ['JSON corrompido', '{não é json'],
      ['outro tipo', '42'],
      ['lista com formato errado', JSON.stringify({ t: NOW, list: [1, 2] })],
    ])('cache %s: busca de novo e regrava', async (_caso, raw) => {
      const s = stubStorage({ [YGO_CACHE_KEY]: raw });
      const f = stubFetch();
      const list = await ygo.load();
      expect(list).toHaveLength(45);
      expect(f).toHaveBeenCalledTimes(1);
      const saved = JSON.parse(s.data.get(YGO_CACHE_KEY) ?? '') as { t: number; list: unknown[] };
      expect(saved.t).toBe(NOW);
      expect(saved.list).toHaveLength(45);
    });

    it('sem nada guardado: busca e grava', async () => {
      const s = stubStorage();
      const f = stubFetch();
      expect(await ygo.load()).toHaveLength(45);
      expect(f).toHaveBeenCalledTimes(1);
      expect(s.getItem).toHaveBeenCalledWith(YGO_CACHE_KEY);
      expect(s.data.has(YGO_CACHE_KEY)).toBe(true);
    });

    it('localStorage que lança erro (ou inexistente) não atrapalha', async () => {
      const s = stubStorage();
      s.getItem.mockImplementation(() => { throw new Error('bloqueado'); });
      s.setItem.mockImplementation(() => { throw new Error('cheio'); });
      stubFetch();
      expect(await ygo.load()).toHaveLength(45);
      vi.stubGlobal('localStorage', undefined);
      expect(await ygo.load()).toHaveLength(45);
    });
  });

  describe('falhas', () => {
    it('fetch rejeitado: rejeita e não grava cache', async () => {
      const s = stubStorage();
      stubFetch(() => Promise.reject(new TypeError('sem rede')));
      await expect(ygo.load()).rejects.toThrow('sem rede');
      expect(s.setItem).not.toHaveBeenCalled();
    });

    it('resposta que não é JSON: rejeita', async () => {
      stubStorage();
      stubFetch(() => text('erro', 500));
      await expect(ygo.load()).rejects.toThrow();
    });

    it('nenhum monstro: rejeita com "vazio" e não grava cache', async () => {
      const s = stubStorage();
      stubFetch(() => json({ data: cards().filter(c => !/Monster/.test(c.type)) }));
      await expect(ygo.load()).rejects.toThrow('vazio');
      expect(s.setItem).not.toHaveBeenCalled();
    });
  });
});
