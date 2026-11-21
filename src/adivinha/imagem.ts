// Imagem: começa com zoom num ponto sorteado, desfocada; cada chute errado afasta o zoom e tira desfoque, até a
// imagem inteira. O ponto cai numa parte "com desenho" da imagem: em render transparente, onde não é transparente;
// em splash de fundo, onde há mais contraste. Lógica pura (quem lê os pixels é a tela).

/** Zoom e desfoque (px na moldura, já contando o zoom) a cada chute errado; o último nível é a imagem inteira. */
export const NIVEIS: readonly { escala: number; desfoque: number }[] = [
  { escala: 6, desfoque: 18 },
  { escala: 4.6, desfoque: 13 },
  { escala: 3.5, desfoque: 9 },
  { escala: 2.6, desfoque: 6 },
  { escala: 1.9, desfoque: 3.5 },
  { escala: 1.4, desfoque: 1.5 },
  { escala: 1, desfoque: 0 },
];

/** Zoom depois de `erros` chutes errados (no fim, a imagem inteira). */
export function zoom(erros: number, fim = false): { escala: number; desfoque: number; nivel: number } {
  const nivel = fim ? NIVEIS.length - 1 : Math.min(Math.max(0, erros), NIVEIS.length - 1);
  return { ...(NIVEIS[nivel] as { escala: number; desfoque: number }), nivel };
}

/** Lado da grade em que a imagem é dividida pra escolher o ponto. */
export const GRADE = 12;
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

/** Segundo número de 0 a 1 tirado da semente (pra x e y não andarem juntos). */
const outra = (s: number) => {
  const x = Math.sin((s + 0.1234) * 12_989.8) * 43_758.5453;
  return x - Math.floor(x);
};

/** Sem pixels (imagem sem CORS): um ponto no miolo, onde quase sempre está o personagem. */
export function focoNoMiolo(semente: number): Ponto {
  return { x: 0.35 + 0.3 * semente, y: 0.3 + 0.3 * outra(semente) };
}

/**
 * Ponto do zoom (0 a 1 em x e y): divide a amostra numa grade, fica com as casas quase opacas longe da borda e,
 * entre elas, com as 40% de mais contraste; a semente escolhe uma. Nada opaco (ou sem amostra) -> o miolo.
 */
export function escolherFoco(a: Amostra | null, semente: number): Ponto {
  if (!a || a.w < GRADE || a.h < GRADE) return focoNoMiolo(semente);
  const casas: { i: number; x: number; y: number; nota: number }[] = [];
  for (let gy = 1; gy < GRADE - 1; gy++) {
    for (let gx = 1; gx < GRADE - 1; gx++) {
      const x0 = Math.floor((gx * a.w) / GRADE), x1 = Math.floor(((gx + 1) * a.w) / GRADE);
      const y0 = Math.floor((gy * a.h) / GRADE), y1 = Math.floor(((gy + 1) * a.h) / GRADE);
      let n = 0, alfa = 0, soma = 0, soma2 = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const o = (y * a.w + x) * 4;
          const lum = 0.299 * (a.data[o] as number) + 0.587 * (a.data[o + 1] as number) + 0.114 * (a.data[o + 2] as number);
          n++; alfa += a.data[o + 3] as number; soma += lum; soma2 += lum * lum;
        }
      }
      if (!n || alfa / n < 200) continue;
      const media = soma / n;
      casas.push({ i: gy * GRADE + gx, x: (gx + 0.5) / GRADE, y: (gy + 0.5) / GRADE, nota: soma2 / n - media * media });
    }
  }
  if (!casas.length) return focoNoMiolo(semente);
  casas.sort((p, q) => q.nota - p.nota || p.i - q.i);
  const boas = casas.slice(0, Math.max(1, Math.ceil(casas.length * 0.4)));
  const c = boas[Math.min(boas.length - 1, Math.floor(semente * boas.length))] as (typeof boas)[number];
  return { x: c.x, y: c.y };
}
