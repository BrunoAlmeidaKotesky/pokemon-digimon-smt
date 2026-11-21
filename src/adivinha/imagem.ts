// Os dois submodos de imagem. Lógica pura (quem lê os pixels é a tela):
//   Imagem: um recorte nítido da arte num ponto sorteado, longe do rosto; cada chute errado abre um pouco a área.
//   Blur:   zoom num ponto sorteado, desfocado; cada chute errado afasta o zoom e tira desfoque.
// Os dois chegam na imagem inteira só depois de 10 erros. O ponto cai numa parte "com desenho": em render
// transparente, onde não é transparente; em splash de fundo, onde há mais contraste.

export type ModoImagem = 'imagem' | 'blur';
/** Zoom (a moldura mostra 1/escala da imagem em cada lado) e desfoque (px na moldura, já contando o zoom). */
export interface Nivel {
  escala: number;
  desfoque: number;
}

/** Blur: 11 níveis, a imagem limpa só no 10º erro (antes eram 7 e abria rápido demais). */
export const NIVEIS_BLUR: readonly Nivel[] = [
  { escala: 6, desfoque: 22 },
  { escala: 5.3, desfoque: 19 },
  { escala: 4.6, desfoque: 16 },
  { escala: 4, desfoque: 13.5 },
  { escala: 3.4, desfoque: 11 },
  { escala: 2.9, desfoque: 9 },
  { escala: 2.4, desfoque: 7 },
  { escala: 2, desfoque: 5 },
  { escala: 1.6, desfoque: 3.2 },
  { escala: 1.25, desfoque: 1.6 },
  { escala: 1, desfoque: 0 },
];
/** Imagem (recorte): sem desfoque; começa mostrando 1/5 da largura e abre aos poucos, inteira no 10º erro. */
export const NIVEIS_RECORTE: readonly Nivel[] = [5, 4.4, 3.85, 3.35, 2.9, 2.5, 2.1, 1.75, 1.45, 1.2, 1].map(escala => ({ escala, desfoque: 0 }));
export const niveis = (m: ModoImagem): readonly Nivel[] => (m === 'blur' ? NIVEIS_BLUR : NIVEIS_RECORTE);

/** Zoom depois de `erros` chutes errados (no fim, a imagem inteira). */
export function zoom(modo: ModoImagem, erros: number, fim = false): Nivel & { nivel: number; total: number } {
  const n = niveis(modo);
  const nivel = fim ? n.length - 1 : Math.min(Math.max(0, erros), n.length - 1);
  return { ...(n[nivel] as Nivel), nivel, total: n.length - 1 };
}

/** Pixels (RGBA) de uma amostra da imagem, já reduzida (a tela desenha num canvas pequeno). */
export interface Amostra {
  data: ArrayLike<number>;
  w: number;
  h: number;
}
export interface Ponto {
  x: number;
  y: number;
}
/** Retângulo em frações da imagem (0 a 1). */
export interface Caixa {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** O que a moldura mostra com o zoom `escala` e origem no ponto (transform-origin): sempre dentro da imagem. */
export function janela(p: Ponto, escala: number): Caixa {
  return { x0: p.x - p.x / escala, x1: p.x + (1 - p.x) / escala, y0: p.y - p.y / escala, y1: p.y + (1 - p.y) / escala };
}
/** Área em comum de duas caixas. */
export function sobra(a: Caixa, b: Caixa): number {
  return Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
}

/** Segundo número de 0 a 1 tirado da semente (pra x e y não andarem juntos). */
const outra = (s: number) => {
  const x = Math.sin((s + 0.1234) * 12_989.8) * 43_758.5453;
  return x - Math.floor(x);
};

/** Blur sem pixels (imagem sem CORS): um ponto no miolo, onde quase sempre está o personagem. */
export function focoNoMiolo(semente: number): Ponto {
  return { x: 0.35 + 0.3 * semente, y: 0.3 + 0.3 * outra(semente) };
}
/** Imagem sem pixels: embaixo do miolo (tronco ou pernas), abaixo de onde o rosto costuma ficar. */
export function focoForaDoRosto(semente: number): Ponto {
  return { x: 0.38 + 0.24 * semente, y: 0.7 + 0.15 * outra(semente) };
}

/** Onde o rosto costuma estar numa splash de fundo (arte centralizada): no meio, da faixa de cima até o centro. */
export const ROSTO_SPLASH: Caixa = { x0: 0.32, y0: 0.08, x1: 0.68, y1: 0.52 };
/** Quanto do primeiro recorte pode cair na caixa do rosto (ela é larga de propósito; o rosto é menor que ela). */
export const TOLERANCIA_ROSTO = 0.2;

/**
 * Onde o rosto deve estar (heurística, sem detectar rosto de verdade). Render transparente: no topo da parte
 * desenhada (os 45% de cima), sem as laterais (15% de cada lado). Imagem opaca (splash) ou sem pixels: ROSTO_SPLASH.
 */
export function caixaDoRosto(a: Amostra | null): Caixa {
  if (!a || !a.w || !a.h) return ROSTO_SPLASH;
  let x0 = a.w, y0 = a.h, x1 = -1, y1 = -1, opacos = 0;
  for (let y = 0; y < a.h; y++) {
    for (let x = 0; x < a.w; x++) {
      if ((a.data[(y * a.w + x) * 4 + 3] as number) < 128) continue;
      opacos++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0 || opacos > a.w * a.h * 0.97) return ROSTO_SPLASH;
  const L = x0 / a.w, R = (x1 + 1) / a.w, T = y0 / a.h, B = (y1 + 1) / a.h;
  const w = R - L, h = B - T;
  return { x0: L + 0.15 * w, x1: R - 0.15 * w, y0: T, y1: T + 0.45 * h };
}

interface Casa extends Ponto {
  i: number;
  nota: number;
}
/** Imagem opaca (splash de fundo): quase nenhum pixel transparente. */
function opaca(a: Amostra): boolean {
  let n = 0;
  for (let i = 3; i < a.w * a.h * 4; i += 4) if ((a.data[i] as number) >= 128) n++;
  return n > a.w * a.h * 0.97;
}
const lum = (a: Amostra, x: number, y: number) => {
  const o = (y * a.w + x) * 4;
  return 0.299 * (a.data[o] as number) + 0.587 * (a.data[o + 1] as number) + 0.114 * (a.data[o + 2] as number);
};
/**
 * Casas da grade `n`×`n` quase opacas e longe da borda, com a nota de "detalhe": a média da diferença de brilho entre
 * pixels vizinhos (borda nítida dá nota alta; fundo desfocado da splash, mesmo com claro e escuro, dá nota baixa).
 * Em imagem opaca, a nota cai com a distância do centro (o personagem da splash centralizada fica no meio).
 */
function casas(a: Amostra, n: number): Casa[] {
  const out: Casa[] = [];
  const centro = opaca(a);
  for (let gy = 1; gy < n - 1; gy++) {
    for (let gx = 1; gx < n - 1; gx++) {
      const x0 = Math.floor((gx * a.w) / n), x1 = Math.floor(((gx + 1) * a.w) / n);
      const y0 = Math.floor((gy * a.h) / n), y1 = Math.floor(((gy + 1) * a.h) / n);
      let k = 0, alfa = 0, grad = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const l = lum(a, x, y);
          k++; alfa += a.data[(y * a.w + x) * 4 + 3] as number;
          if (x + 1 < a.w) grad += Math.abs(lum(a, x + 1, y) - l);
          if (y + 1 < a.h) grad += Math.abs(lum(a, x, y + 1) - l);
        }
      }
      if (!k || alfa / k < 200) continue;
      const cx = (gx + 0.5) / n, cy = (gy + 0.5) / n;
      const peso = centro ? Math.max(0.15, 1 - 1.6 * Math.max(Math.abs(cx - 0.5), Math.abs(cy - 0.55))) : 1;
      out.push({ i: gy * n + gx, x: cx, y: cy, nota: (grad / k) * peso });
    }
  }
  return out;
}
/** Entre as casas, as 20% de mais detalhe; a semente escolhe uma. */
function sortear(cs: Casa[], semente: number): Ponto {
  const ord = [...cs].sort((p, q) => q.nota - p.nota || p.i - q.i);
  const boas = ord.slice(0, Math.max(1, Math.ceil(ord.length * 0.2)));
  const c = boas[Math.min(boas.length - 1, Math.floor(semente * boas.length))] as Casa;
  return { x: c.x, y: c.y };
}

/** Lado da grade do Blur e do Imagem. */
export const GRADE = 12;
export const GRADE_RECORTE = 16;

/** Ponto do Blur: casa desenhada e com contraste; sem amostra (ou nada opaco), o miolo. */
export function escolherFoco(a: Amostra | null, semente: number): Ponto {
  if (!a || a.w < GRADE || a.h < GRADE) return focoNoMiolo(semente);
  const cs = casas(a, GRADE);
  return cs.length ? sortear(cs, semente) : focoNoMiolo(semente);
}

/** Soma de uma grandeza por retângulo em O(1): tabela de somas acumuladas ((w+1)×(h+1)). */
function acumulada(w: number, h: number, v: (x: number, y: number) => number): (x0: number, y0: number, x1: number, y1: number) => number {
  const t = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let linha = 0;
    for (let x = 0; x < w; x++) {
      linha += v(x, y);
      t[(y + 1) * (w + 1) + x + 1] = (t[y * (w + 1) + x + 1] as number) + linha;
    }
  }
  const at = (x: number, y: number) => t[y * (w + 1) + x] as number;
  return (x0, y0, x1, y1) => at(x1, y1) - at(x0, y1) - at(x1, y0) + at(x0, y0);
}

/**
 * Ponto do Imagem (recorte). Cada candidato (centro de casa da grade, longe da borda) é julgado pelo primeiro recorte
 * inteiro, o que o jogador vê: precisa ser quase todo desenhado (render transparente) e pegar no máximo
 * TOLERANCIA_ROSTO da caixa do rosto (caixaDoRosto; se todos pegarem mais, os que pegam menos). Entre eles, os 20% com
 * mais detalhe no recorte (diferença de brilho entre vizinhos: fundo desfocado da splash dá pouco), com o peso do
 * centro em imagem opaca; a semente escolhe um. Sem amostra (ou nada desenhado), embaixo do miolo.
 */
export function escolherRecorte(a: Amostra | null, semente: number): Ponto {
  if (!a || a.w < GRADE_RECORTE || a.h < GRADE_RECORTE) return focoForaDoRosto(semente);
  const { w, h } = a, k = (NIVEIS_RECORTE[0] as Nivel).escala;
  const alfa = acumulada(w, h, (x, y) => a.data[(y * w + x) * 4 + 3] as number);
  const grad = acumulada(w, h, (x, y) => {
    const l = lum(a, x, y);
    return (x + 1 < w ? Math.abs(lum(a, x + 1, y) - l) : 0) + (y + 1 < h ? Math.abs(lum(a, x, y + 1) - l) : 0);
  });
  const centro = opaca(a), rosto = caixaDoRosto(a), n = GRADE_RECORTE;
  const cs: (Casa & { pega: number })[] = [];
  for (let gy = 1; gy < n - 1; gy++) {
    for (let gx = 1; gx < n - 1; gx++) {
      const p = { x: (gx + 0.5) / n, y: (gy + 0.5) / n }, j = janela(p, k);
      const x0 = Math.floor(j.x0 * w), x1 = Math.max(x0 + 1, Math.ceil(j.x1 * w)), y0 = Math.floor(j.y0 * h), y1 = Math.max(y0 + 1, Math.ceil(j.y1 * h));
      const area = (x1 - x0) * (y1 - y0);
      if (alfa(x0, y0, x1, y1) / area < 170) continue;
      const peso = centro ? Math.max(0.15, 1 - 1.6 * Math.max(Math.abs(p.x - 0.5), Math.abs(p.y - 0.55))) : 1;
      cs.push({ ...p, i: gy * n + gx, nota: (grad(x0, y0, x1, y1) / area) * peso, pega: sobra(j, rosto) * k * k });
    }
  }
  if (!cs.length) return focoForaDoRosto(semente);
  const limite = Math.max(TOLERANCIA_ROSTO, Math.min(...cs.map(c => c.pega))) + 1e-9;
  return sortear(cs.filter(c => c.pega <= limite), semente);
}

/** O ponto de cada modo. */
export const escolherPonto = (modo: ModoImagem, a: Amostra | null, semente: number): Ponto =>
  modo === 'blur' ? escolherFoco(a, semente) : escolherRecorte(a, semente);
