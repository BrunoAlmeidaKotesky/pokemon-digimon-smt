// Gerador aleatório com semente (mulberry32): a mesma semente dá a mesma luta e a mesma partida.

export interface Rng {
  /** 0 (incluso) a 1 (excluso) */
  (): number;
  /** inteiro de 0 a n - 1 */
  int(n: number): number;
  chance(p: number): boolean;
  /** n itens diferentes, na ordem sorteada */
  sortear<T>(xs: readonly T[], n: number): T[];
  /** um item com peso */
  pesado<T>(xs: readonly T[], peso: (x: T) => number): T | undefined;
  /** semente nova derivada deste gerador (pra lutas e sub-sorteios independentes) */
  semente(): number;
}

export function criarRng(semente: number): Rng {
  let s = semente >>> 0;
  const r = (() => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as Rng;
  r.int = n => Math.floor(r() * n);
  r.chance = p => r() < p;
  r.sortear = (xs, n) => {
    const copia = [...xs];
    const out: typeof copia = [];
    while (out.length < n && copia.length) out.push(copia.splice(r.int(copia.length), 1)[0]!);
    return out;
  };
  r.pesado = (xs, peso) => {
    let total = 0;
    for (const x of xs) total += Math.max(0, peso(x));
    if (total <= 0) return undefined;
    let alvo = r() * total;
    for (const x of xs) { alvo -= Math.max(0, peso(x)); if (alvo < 0) return x; }
    return xs[xs.length - 1];
  };
  r.semente = () => Math.floor(r() * 4294967296) >>> 0;
  return r;
}
