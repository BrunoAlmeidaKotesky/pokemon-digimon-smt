import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Item } from '../types';
import { resolve } from './resolve';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

const HREF = 'https://digi-api.com/api/v1/digimon/4';

describe('resolve', () => {
  it('sem img e com href: busca o detalhe e preenche img no próprio item', async () => {
    const f = stubFetch();
    const item: Item = { name: 'Betamon', img: '', href: HREF };
    const out = await resolve(item);
    expect(out).toBe(item);
    expect(item.img).toBe('https://digi-api.com/images/digimon/w/Betamon.png');
    expect(urls(f)).toEqual([HREF]);
  });

  it('já com img: não busca nada', async () => {
    const f = stubFetch();
    const item: Item = { name: 'Agumon', img: 'a.png', href: 'https://digi-api.com/api/v1/digimon/1' };
    expect(await resolve(item)).toEqual({ name: 'Agumon', img: 'a.png', href: 'https://digi-api.com/api/v1/digimon/1' });
    expect(f).not.toHaveBeenCalled();
  });

  it('sem href: devolve como está', async () => {
    const f = stubFetch();
    const item: Item = { name: 'X', img: '' };
    expect(await resolve(item)).toEqual({ name: 'X', img: '' });
    expect(f).not.toHaveBeenCalled();
  });

  it('detalhe sem imagens: img vazio', async () => {
    stubFetch(() => json({ images: [] }));
    const item: Item = { name: 'Betamon', img: '', href: HREF };
    await resolve(item);
    expect(item.img).toBe('');
  });

  it('erro é ignorado (sem rede ou resposta inválida)', async () => {
    stubFetch(() => Promise.reject(new TypeError('sem rede')));
    const a: Item = { name: 'Betamon', img: '', href: HREF };
    await expect(resolve(a)).resolves.toBe(a);
    expect(a.img).toBe('');
    stubFetch(() => text('erro', 500));
    const b: Item = { name: 'Betamon', img: '', href: HREF };
    await expect(resolve(b)).resolves.toEqual({ name: 'Betamon', img: '', href: HREF });
  });
});
