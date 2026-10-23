// Sorteio. Usa Math.random direto: a ordem e a quantidade de chamadas são as mesmas do site antigo
// (os testes de ponta a ponta trocam Math.random por um gerador com semente). O modo online passa o próprio gerador.

/** Um elemento qualquer da lista (1 chamada a Math.random). */
export function rnd<T>(a: readonly T[], rand: () => number = Math.random): T {
  return a[Math.floor(rand() * a.length)] as T;
}

/** Fisher-Yates do fim pro começo, no próprio array (a.length - 1 chamadas). Devolve o mesmo array. */
export function shuffle<T>(a: T[], rand: () => number = Math.random): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = a[i] as T;
    a[i] = a[j] as T;
    a[j] = t;
  }
  return a;
}
