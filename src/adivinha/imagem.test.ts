import { describe, expect, it } from 'vitest';
import {
  caixaDoRosto, escolherFoco, escolherPonto, escolherRecorte, focoForaDoRosto, focoNoMiolo, GRADE, janela, NIVEIS_BLUR, NIVEIS_RECORTE,
  ROSTO_SPLASH, sobra, TOLERANCIA_ROSTO, zoom, type Amostra, type Ponto,
} from './imagem';

/** Amostra w×h; `px(x, y)` dá [r, g, b, a]. */
function amostra(w: number, h: number, px: (x: number, y: number) => [number, number, number, number]): Amostra {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.set(px(x, y), (y * w + x) * 4);
  return { data, w, h };
}
const SEMENTES = [0, 0.13, 0.31, 0.5, 0.77, 0.999];
/** "Textura" com contraste (xadrez com variação), opaca. */
const tex = (x: number, y: number): [number, number, number, number] => ((x + y) % 2 ? [240, 220 - y, 200, 255] : [20 + x, 30, 60, 255]);
const k0 = NIVEIS_RECORTE[0]!.escala;

describe('níveis', () => {
  it('Blur: 11 níveis, cada erro afasta e tira desfoque um pouco; limpo só no 10º erro', () => {
    expect(NIVEIS_BLUR).toHaveLength(11);
    for (let i = 1; i < NIVEIS_BLUR.length; i++) {
      expect(NIVEIS_BLUR[i]!.escala).toBeLessThan(NIVEIS_BLUR[i - 1]!.escala);
      expect(NIVEIS_BLUR[i]!.desfoque).toBeLessThan(NIVEIS_BLUR[i - 1]!.desfoque);
      // passos pequenos: nenhum tira mais de 3,5 px de desfoque
      expect(NIVEIS_BLUR[i - 1]!.desfoque - NIVEIS_BLUR[i]!.desfoque).toBeLessThanOrEqual(3.5);
    }
    expect(zoom('blur', 0)).toEqual({ escala: 6, desfoque: 22, nivel: 0, total: 10 });
    expect(zoom('blur', 9).desfoque).toBeGreaterThan(0);
    expect(zoom('blur', 10)).toEqual({ escala: 1, desfoque: 0, nivel: 10, total: 10 });
    expect(zoom('blur', 99)).toEqual(zoom('blur', 10));
    expect(zoom('blur', 0, true)).toEqual({ escala: 1, desfoque: 0, nivel: 10, total: 10 });
  });

  it('Imagem (recorte): sem desfoque, abre aos poucos, inteira no 10º erro', () => {
    expect(NIVEIS_RECORTE).toHaveLength(11);
    expect(NIVEIS_RECORTE.every(n => n.desfoque === 0)).toBe(true);
    for (let i = 1; i < NIVEIS_RECORTE.length; i++) {
      const antes = 1 / NIVEIS_RECORTE[i - 1]!.escala, agora = 1 / NIVEIS_RECORTE[i]!.escala;
      expect(agora).toBeGreaterThan(antes);
      // cada erro abre no máximo 1/6 da largura
      expect(agora - antes).toBeLessThanOrEqual(1 / 6);
    }
    expect(zoom('imagem', 0)).toMatchObject({ escala: 5, desfoque: 0, nivel: 0 });
    expect(zoom('imagem', 3)).toMatchObject({ escala: 3.35, nivel: 3 });
    expect(zoom('imagem', 10)).toMatchObject({ escala: 1, nivel: 10 });
  });

  it('janela: o que a moldura mostra, sempre dentro da imagem e com o ponto dentro', () => {
    for (const p of [{ x: 0.1, y: 0.9 }, { x: 0.5, y: 0.5 }, { x: 0.95, y: 0.05 }]) {
      const j = janela(p, 4);
      expect(j.x1 - j.x0).toBeCloseTo(0.25);
      expect(j.y1 - j.y0).toBeCloseTo(0.25);
      expect(j.x0).toBeGreaterThanOrEqual(0);
      expect(j.x1).toBeLessThanOrEqual(1);
      expect(p.x).toBeGreaterThanOrEqual(j.x0);
      expect(p.x).toBeLessThanOrEqual(j.x1);
    }
    expect(janela({ x: 0.3, y: 0.3 }, 1)).toEqual({ x0: 0, x1: 1, y0: 0, y1: 1 });
    expect(sobra({ x0: 0, y0: 0, x1: 0.5, y1: 0.5 }, { x0: 0.25, y0: 0.25, x1: 1, y1: 1 })).toBeCloseTo(0.0625);
    expect(sobra({ x0: 0, y0: 0, x1: 0.2, y1: 0.2 }, { x0: 0.5, y0: 0.5, x1: 1, y1: 1 })).toBe(0);
  });
});

describe('Blur: ponto do zoom', () => {
  it('render transparente: cai na parte desenhada', () => {
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
    const a = amostra(48, 48, (x, y) => (y < 24 ? [90, 140, 220, 255] : tex(x, y)));
    for (const s of SEMENTES) {
      const p = escolherFoco(a, s);
      expect(p.y).toBeGreaterThan(0.5);
      expect(p.x).toBeGreaterThan(1 / GRADE);
      expect(p.x).toBeLessThan(1 - 1 / GRADE);
    }
  });

  it('sem pixels ou tudo transparente: o miolo', () => {
    const vazio = amostra(48, 48, () => [0, 0, 0, 0]);
    for (const s of SEMENTES) {
      expect(escolherFoco(null, s)).toEqual(focoNoMiolo(s));
      expect(escolherFoco(vazio, s)).toEqual(focoNoMiolo(s));
    }
  });
});

describe('Imagem (recorte): longe do rosto', () => {
  it('caixa do rosto: topo da parte desenhada num render; o meio de cima numa splash ou sem pixels', () => {
    // figura de pé: ocupa x 16..47 e y 8..63 de 64×64
    const fig = amostra(64, 64, (x, y) => (x >= 16 && x < 48 && y >= 8 ? tex(x, y) : [0, 0, 0, 0]));
    const r = caixaDoRosto(fig);
    expect(r.y0).toBeCloseTo(8 / 64);
    expect(r.y1).toBeCloseTo(8 / 64 + 0.45 * (56 / 64));
    // o rosto não fica no corpo: a metade de baixo da figura está fora
    expect(r.y1).toBeLessThan(0.55);
    expect(r.x0).toBeCloseTo(16 / 64 + 0.15 * 0.5);
    expect(r.x1).toBeCloseTo(48 / 64 - 0.15 * 0.5);
    expect(caixaDoRosto(amostra(64, 64, tex))).toEqual(ROSTO_SPLASH);
    expect(caixaDoRosto(null)).toEqual(ROSTO_SPLASH);
    expect(caixaDoRosto(amostra(64, 64, () => [0, 0, 0, 0]))).toEqual(ROSTO_SPLASH);
  });

  /** quanto do primeiro recorte cai na caixa do rosto */
  const naoPega = (a: Amostra | null, p: Ponto) => sobra(janela(p, k0), caixaDoRosto(a)) * k0 * k0;

  it('render de corpo inteiro: o primeiro recorte não pega o topo da figura e cai na parte desenhada', () => {
    const fig = amostra(64, 64, (x, y) => (x >= 16 && x < 48 && y >= 4 ? tex(x, y) : [0, 0, 0, 0]));
    for (const s of SEMENTES) {
      const p = escolherRecorte(fig, s);
      expect(naoPega(fig, p), `semente ${s}`).toBeLessThanOrEqual(TOLERANCIA_ROSTO + 1e-9);
      expect(p.x * 64).toBeGreaterThanOrEqual(16);
      expect(p.x * 64).toBeLessThan(48);
    }
  });

  it('splash centralizada (opaca): o primeiro recorte fica fora do meio de cima', () => {
    const splash = amostra(64, 64, tex);
    const pontos = SEMENTES.map(s => escolherRecorte(splash, s));
    for (const p of pontos) expect(naoPega(splash, p)).toBeLessThanOrEqual(TOLERANCIA_ROSTO + 1e-9);
    // e não é sempre o mesmo lugar
    expect(new Set(pontos.map(p => `${p.x},${p.y}`)).size).toBeGreaterThan(2);
  });

  it('fundo desfocado perde pra borda nítida, mesmo com claro e escuro (splash com profundidade de campo)', () => {
    // metade de cima: fundo desfocado (degradê largo, muito contraste no total); de baixo: detalhe nítido
    const a = amostra(128, 128, (x, y) => (y < 64 ? [Math.round(127 + 120 * Math.sin(x / 9)), 90, 90, 255] : tex(x, y)));
    for (const s of SEMENTES) expect(escolherRecorte(a, s).y).toBeGreaterThan(0.5);
  });

  it('quando todo recorte pega o rosto, fica com o que pega menos', () => {
    // só uma faixa desenhada no topo: tudo encosta no rosto
    const faixa = amostra(64, 64, (x, y) => (y < 14 ? tex(x, y) : [0, 0, 0, 0]));
    const p = escolherRecorte(faixa, 0.4);
    expect(p.y).toBeLessThan(14 / 64 + 0.05);
  });

  it('sem pixels (sem CORS): embaixo do miolo, fora da caixa do rosto da splash', () => {
    for (const s of SEMENTES) {
      const p = escolherRecorte(null, s);
      expect(p).toEqual(focoForaDoRosto(s));
      expect(sobra(janela(p, k0), ROSTO_SPLASH)).toBe(0);
      expect(p.x).toBeGreaterThanOrEqual(0.38);
      expect(p.x).toBeLessThanOrEqual(0.62);
    }
  });

  it('determinístico pela semente (do dia e online: o mesmo recorte pra todos); cada modo com o seu ponto', () => {
    const a = amostra(64, 64, (x, y) => [(x * 13 + y * 7) % 256, (x * y) % 256, (x ^ y) % 256, 255]);
    expect(escolherRecorte(a, 0.42)).toEqual(escolherRecorte(a, 0.42));
    expect(escolherPonto('imagem', a, 0.42)).toEqual(escolherRecorte(a, 0.42));
    expect(escolherPonto('blur', a, 0.42)).toEqual(escolherFoco(a, 0.42));
  });
});
