import { afterEach, describe, expect, it, vi } from 'vitest';
import { sujimon } from './sujimon';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

describe('sujimon', () => {
  it('rótulo, chave e opcional', () => {
    expect(sujimon.key).toBe('sujimon');
    expect(sujimon.label).toBe('Sujimon');
    expect(sujimon.optional).toBe(true);
    expect(sujimon.initial).toBeUndefined();
  });

  it('lê sujimon/list.json (relativo) e monta as 40 imagens locais', async () => {
    const f = stubFetch();
    const list = await sujimon.load();
    expect(urls(f)).toEqual(['sujimon/list.json']);
    expect(list).toHaveLength(40);
    expect(list[0]).toEqual({ name: 'Kowloon Mullet', img: 'sujimon/001.webp' });
    expect(list[39]).toEqual({ name: 'Sujimon 040', img: 'sujimon/040.webp' });
  });

  it('lista vazia: rejeita', async () => {
    stubFetch(() => json([]));
    await expect(sujimon.load()).rejects.toThrow('vazio');
  });

  it('arquivo ausente (404) ou sem rede: rejeita', async () => {
    stubFetch(() => text('not found', 404));
    await expect(sujimon.load()).rejects.toThrow();
    stubFetch(() => Promise.reject(new TypeError('sem rede')));
    await expect(sujimon.load()).rejects.toThrow('sem rede');
  });
});
