import { describe, expect, it } from 'vitest';
import { escolherFoco, focoNoMiolo, GRADE, NIVEIS, zoom, type Amostra } from './imagem';

/** Amostra w×h; `px(x, y)` dá [r, g, b, a]. */
function amostra(w: number, h: number, px: (x: number, y: number) => [number, number, number, number]): Amostra {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.set(px(x, y), (y * w + x) * 4);
  return { data, w, h };
}
const SEMENTES = [0, 0.13, 0.5, 0.77, 0.999];

describe('zoom', () => {
  it('cada chute errado afasta e tira desfoque, até a imagem inteira', () => {
    const z = Array.from({ length: NIVEIS.length + 2 }, (_, e) => zoom(e));
    for (let i = 1; i < NIVEIS.length; i++) {
      expect(z[i]!.escala).toBeLessThan(z[i - 1]!.escala);
      expect(z[i]!.desfoque).toBeLessThan(z[i - 1]!.desfoque);
    }
    expect(z[0]!.escala).toBeGreaterThan(4);
    expect(z[0]!.desfoque).toBeGreaterThan(0);
    expect(zoom(NIVEIS.length - 1)).toEqual({ escala: 1, desfoque: 0, nivel: NIVEIS.length - 1 });
    expect(zoom(99)).toEqual(zoom(NIVEIS.length - 1));
    expect(zoom(0, true)).toEqual({ escala: 1, desfoque: 0, nivel: NIVEIS.length - 1 });
  });
});

describe('escolherFoco', () => {
  it('render transparente: o ponto cai na parte desenhada', () => {
    // só um quadrado opaco no canto de cima à direita (casas 7 a 9 da grade de 12)
    const a = amostra(48, 48, (x, y) => (x >= 28 && x < 40 && y >= 4 && y < 16 ? [(x * 37) % 255, (y * 91) % 255, 80, 255] : [0, 0, 0, 0]));
    for (const s of SEMENTES) {
      const p = escolherFoco(a, s);
      expect(p.x * 48).toBeGreaterThanOrEqual(28);
      expect(p.x * 48).toBeLessThan(40);
      expect(p.y * 48).toBeGreaterThanOrEqual(4);
      expect(p.y * 48).toBeLessThan(16);
    }
  });

  it('splash opaca: prefere onde há contraste, longe da borda', () => {
    // céu liso em cima, personagem (xadrez) embaixo
    const a = amostra(48, 48, (x, y) => (y < 24 ? [90, 140, 220, 255] : (x + y) % 2 ? [250, 250, 250, 255] : [10, 10, 10, 255]));
    for (const s of SEMENTES) {
      const p = escolherFoco(a, s);
      expect(p.y).toBeGreaterThan(0.5);
      expect(p.x).toBeGreaterThan(1 / GRADE);
      expect(p.x).toBeLessThan(1 - 1 / GRADE);
    }
  });

  it('a mesma semente dá o mesmo ponto (todos na sala veem o mesmo zoom); sementes diferentes variam', () => {
    const a = amostra(48, 48, (x, y) => [(x * 13 + y * 7) % 256, (x * y) % 256, (x ^ y) % 256, 255]);
    expect(escolherFoco(a, 0.42)).toEqual(escolherFoco(a, 0.42));
    expect(new Set(SEMENTES.map(s => JSON.stringify(escolherFoco(a, s)))).size).toBeGreaterThan(1);
  });

  it('sem pixels (imagem sem CORS) ou tudo transparente: o miolo da imagem', () => {
    const vazio = amostra(48, 48, () => [0, 0, 0, 0]);
    for (const s of SEMENTES) {
      for (const p of [escolherFoco(null, s), escolherFoco(vazio, s)]) {
        expect(p).toEqual(focoNoMiolo(s));
        expect(p.x).toBeGreaterThanOrEqual(0.35);
        expect(p.x).toBeLessThanOrEqual(0.65);
        expect(p.y).toBeGreaterThanOrEqual(0.3);
        expect(p.y).toBeLessThanOrEqual(0.6);
      }
    }
  });
});
