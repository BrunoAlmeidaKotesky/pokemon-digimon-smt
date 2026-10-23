import { beforeEach, describe, expect, it, vi } from 'vitest';
import { active, getMine, getRoom, resolveImg, setMine, setRoom, subscribe, version } from './store';
import type { CustomFranchise } from './types';

const data = (ch: string): string => `data:image/webp;base64,${ch.repeat(8)}`;
const fr = (key: string, items: [string, string][]): CustomFranchise => ({
  key,
  label: key,
  color: '#6461e0',
  items: items.map(([id, d]) => ({ id, name: id, data: d })),
});

const MINE = [fr('c-mine', [['a1', data('A')], ['a2', data('B')]]), fr('c-both', [['x', data('C')]])];
const ROOM = [fr('c-room', [['r1', data('D')]]), fr('c-both', [['x', data('E')]])];

beforeEach(() => {
  setMine([]);
  setRoom(null);
});

describe('camadas', () => {
  it('começa sem nada: mine vazia, sem sala, active = mine', () => {
    expect(getMine()).toEqual([]);
    expect(getRoom()).toBeNull();
    expect(active()).toBe(getMine());
  });

  it('active é a sala quando há sala; volta pra mine ao sair', () => {
    setMine(MINE);
    expect(active()).toBe(MINE);
    setRoom(ROOM);
    expect(getRoom()).toBe(ROOM);
    expect(getMine()).toBe(MINE);
    expect(active()).toBe(ROOM);
    setRoom([]);
    expect(active()).toEqual([]);
    setRoom(null);
    expect(active()).toBe(MINE);
  });
});

describe('subscribe / version', () => {
  it('avisa a cada mudança e a versão sobe', () => {
    const fn = vi.fn();
    const off = subscribe(fn);
    const v0 = version();
    setMine(MINE);
    setRoom(ROOM);
    setRoom(null);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(version()).toBe(v0 + 3);
    off();
  });

  it('mesma lista não avisa', () => {
    setMine(MINE);
    const fn = vi.fn();
    const off = subscribe(fn);
    const v0 = version();
    setMine(MINE);
    setRoom(null);
    expect(fn).not.toHaveBeenCalled();
    expect(version()).toBe(v0);
    off();
  });

  it('desinscrever para os avisos; quem sai durante o aviso não atrapalha os outros', () => {
    const calls: string[] = [];
    const offA: () => void = subscribe(() => {
      calls.push('a');
      offA();
    });
    const offB = subscribe(() => calls.push('b'));
    setMine(MINE);
    setMine([]);
    expect(calls).toEqual(['a', 'b', 'b']);
    offB();
    setMine(MINE);
    expect(calls).toEqual(['a', 'b', 'b']);
  });

  it('o assinante já vê o estado novo', () => {
    let seen: CustomFranchise[] | null = null;
    const off = subscribe(() => {
      seen = active();
    });
    setRoom(ROOM);
    expect(seen).toBe(ROOM);
    off();
  });
});

describe('resolveImg', () => {
  it('imagem que não é customizada volta igual', () => {
    for (const s of ['', 'https://x/y.png', 'data:image/png;base64,AAAA', 'cstx', 'cs:c-mine/a1']) expect(resolveImg(s)).toBe(s);
  });

  it('acha nas minhas e na sala; a sala vale quando a mesma imagem existe nas duas', () => {
    setMine(MINE);
    expect(resolveImg('cst:c-mine/a1')).toBe(data('A'));
    expect(resolveImg('cst:c-mine/a2')).toBe(data('B'));
    expect(resolveImg('cst:c-both/x')).toBe(data('C'));
    expect(resolveImg('cst:c-room/r1')).toBe('');
    setRoom(ROOM);
    expect(resolveImg('cst:c-room/r1')).toBe(data('D'));
    expect(resolveImg('cst:c-both/x')).toBe(data('E'));
    // como host eu continuo vendo as minhas
    expect(resolveImg('cst:c-mine/a1')).toBe(data('A'));
  });

  it('imagem que não existe ou formato torto vira vazio', () => {
    setMine(MINE);
    for (const s of ['cst:c-mine/zz', 'cst:c-nope/a1', 'cst:', 'cst:c-mine', 'cst:mine/a1', 'cst:c-mine/a1/x']) {
      expect(resolveImg(s)).toBe('');
    }
  });

  it('acompanha as mudanças', () => {
    setMine(MINE);
    expect(resolveImg('cst:c-mine/a1')).toBe(data('A'));
    setMine([fr('c-mine', [['a1', data('Z')]])]);
    expect(resolveImg('cst:c-mine/a1')).toBe(data('Z'));
    expect(resolveImg('cst:c-mine/a2')).toBe('');
    setMine([]);
    expect(resolveImg('cst:c-mine/a1')).toBe('');
  });
});
