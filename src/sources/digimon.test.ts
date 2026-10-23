import { afterEach, describe, expect, it, vi } from 'vitest';
import { digimon } from './digimon';
import { fixture, json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

const BASE = 'https://digi-api.com/api/v1/digimon';
interface Page { content: { id: number; name: string; href: string; image: string | null }[]; pageable: { totalPages: number } }

describe('digimon', () => {
  it('rótulo e chave', () => {
    expect(digimon.key).toBe('digimon');
    expect(digimon.label).toBe('Digimon');
    expect(digimon.optional).toBeUndefined();
  });

  it('busca a 1ª página, depois as outras, e junta tudo na ordem (40)', async () => {
    const f = stubFetch();
    const list = await digimon.load();
    expect(list).toHaveLength(40);
    expect(urls(f)).toEqual([`${BASE}?pageSize=100&page=0`, `${BASE}?pageSize=100&page=1`]);
    expect(list[0]).toEqual({ name: 'Agumon', img: 'https://digi-api.com/images/digimon/w/Agumon.png', href: `${BASE}/1` });
    expect(list[20]?.name).toBe('Monzaemon');
    expect(list.map(x => x.href)).toEqual([...fixture<Page>('digimon-page0.json').content, ...fixture<Page>('digimon-page1.json').content].map(d => d.href));
  });

  it('sem imagem vira img vazio, mantendo o href (resolve() completa depois)', async () => {
    stubFetch();
    const list = await digimon.load();
    expect(list.find(x => x.name === 'Betamon')).toEqual({ name: 'Betamon', img: '', href: `${BASE}/4` });
    expect(list.find(x => x.name === 'Vademon')).toEqual({ name: 'Vademon', img: '', href: `${BASE}/26` });
  });

  it('pede as páginas seguintes em paralelo, e a que falha vira []', async () => {
    const p0 = fixture<Page>('digimon-page0.json'), p1 = fixture<Page>('digimon-page1.json');
    let release!: () => void;
    const hold = new Promise<void>(r => { release = r; });
    const f = stubFetch(u => {
      const page = u.searchParams.get('page');
      if (page === '0') return json({ ...p0, pageable: { ...p0.pageable, totalPages: 4 } });
      if (page === '1') return hold.then(() => json(p1));
      if (page === '2') return Promise.reject(new TypeError('sem rede'));
      if (page === '3') return text('erro', 500);
      return undefined;
    });
    const done = digimon.load();
    await vi.waitFor(() => expect(f).toHaveBeenCalledTimes(4));
    expect(urls(f)).toEqual([0, 1, 2, 3].map(i => `${BASE}?pageSize=100&page=${i}`));
    release();
    const list = await done;
    expect(list).toHaveLength(40);
    expect(list.map(x => x.name)).toEqual([...p0.content, ...p1.content].map(d => d.name));
  });

  it('página sem content vira []', async () => {
    const p0 = fixture<Page>('digimon-page0.json');
    stubFetch(u => u.searchParams.get('page') === '1' ? json({}) : json(p0));
    expect(await digimon.load()).toHaveLength(20);
  });

  it('sem pageable busca só a 1ª página', async () => {
    const { content } = fixture<Page>('digimon-page0.json');
    const f = stubFetch(() => json({ content }));
    expect(await digimon.load()).toHaveLength(20);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('falha se a 1ª página falhar', async () => {
    stubFetch(() => text('erro', 500));
    await expect(digimon.load()).rejects.toThrow();
    stubFetch(() => Promise.reject(new TypeError('sem rede')));
    await expect(digimon.load()).rejects.toThrow('sem rede');
  });
});
