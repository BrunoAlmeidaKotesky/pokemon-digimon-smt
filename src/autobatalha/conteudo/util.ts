// Ferramentas comuns das habilidades, traços e itens: valor por estrela, textos com números, áreas e alvos.
// Tudo passa pelo Contexto do motor (nunca Math.random).
import type { Casa, Contexto, Lutador, OpcoesDano, PorEstrela } from '../tipos';

/** Valor da estrela do lutador. */
export const pe = (eu: Lutador, v: PorEstrela): number => v[eu.estrela - 1] ?? v[0];

/** Número com vírgula, até 2 casas ("1,5", "2", "0,25"). */
export function num(x: number): string {
  return String(Math.round(x * 100) / 100).replace('.', ',');
}
/** "150/225/340%" */
export const pc = (v: PorEstrela): string => `${v.map(x => num(x * 100)).join('/')}%`;
/** "1,5/2/2,5 s" */
export const seg = (v: PorEstrela): string => `${v.map(num).join('/')} s`;
/** "30%" */
export const pct = (x: number): string => `${num(x * 100)}%`;

/** Fração da vida máxima (0..1). */
export const fracVida = (u: Lutador): number => (u.at.vida > 0 ? u.vida / u.at.vida : 0);

/** Multiplicador de habilidade do lançador (poder; 1 = normal). As habilidades aplicam; traços e itens não. */
export const poder = (eu: Lutador): number => (eu.at.poder > 0 ? eu.at.poder : 1);

/** A unidade de um Stand (o próprio lutador, se não for Stand ou estiver solto). */
export const usuarioDe = (eu: Lutador): Lutador => eu.usuario ?? eu;

/** Alvo da habilidade: o atual, se ainda vale; senão o inimigo mais perto. */
export function alvoDe(ctx: Contexto, eu: Lutador, alvo: Lutador | null): Lutador | null {
  if (alvo && alvo.vivo && alvo.lado !== eu.lado) return alvo;
  return ctx.maisProximo(eu, 'inimigos');
}

export const inimigosVivos = (ctx: Contexto, eu: Lutador): Lutador[] => ctx.inimigosDe(eu).filter(x => x.vivo);
/** Inimigos vivos que podem ser escolhidos como alvo. */
export const alvejaveis = (ctx: Contexto, eu: Lutador): Lutador[] =>
  inimigosVivos(ctx, eu).filter(x => !x.temStatus('intocavel'));

/** Vivos a até `raio` casas de `centro` (incluindo quem está no centro), do lado pedido em relação a `eu`. */
export function naArea(ctx: Contexto, eu: Lutador, centro: Lutador | Casa, raio: number, quem: 'inimigos' | 'aliados'): Lutador[] {
  const lista = quem === 'inimigos' ? ctx.inimigosDe(eu) : ctx.aliadosDe(eu, true);
  return lista.filter(x => x.vivo && ctx.distancia(x, centro) <= raio);
}

/** Lutadores sem repetir (pelo id), na ordem. */
export function semRepetir(xs: readonly Lutador[]): Lutador[] {
  const vistos = new Set<string>();
  return xs.filter(x => (vistos.has(x.id) ? false : (vistos.add(x.id), true)));
}

/** O mais perto de `de` numa lista. */
export function maisPertoEm(ctx: Contexto, de: Lutador | Casa, lista: readonly Lutador[]): Lutador | null {
  let melhor: Lutador | null = null;
  let dm = Infinity;
  for (const x of lista) {
    const d = ctx.distancia(de, x);
    if (d < dm) { dm = d; melhor = x; }
  }
  return melhor;
}

/** Corrente: começa em `primeiro` e pula pro inimigo mais perto do último que ainda não levou, `pulos` vezes. */
export function corrente(ctx: Contexto, eu: Lutador, primeiro: Lutador, pulos: number): Lutador[] {
  const out = [primeiro];
  let atual = primeiro;
  for (let i = 0; i < pulos; i++) {
    const prox = maisPertoEm(ctx, atual, inimigosVivos(ctx, eu).filter(x => !out.includes(x)));
    if (!prox) break;
    out.push(prox);
    atual = prox;
  }
  return out;
}

/** Cópia da casa (a do lutador muda quando ele anda). */
export const copiaCasa = (c: Casa): Casa => ({ col: c.col, lin: c.lin });

/** Chama `fn(0)` agora e `fn(i)` a cada `intervalo` segundos, `vezes` vezes no total. */
export function repetir(ctx: Contexto, vezes: number, intervalo: number, fn: (i: number) => void): void {
  fn(0);
  for (let i = 1; i < vezes; i++) ctx.depois(i * intervalo, () => fn(i));
}
/** Chama `fn(i)` no fim de cada segundo, `segundos` vezes (i = 1..segundos). */
export function porSegundos(ctx: Contexto, segundos: number, fn: (i: number) => void): void {
  for (let i = 1; i <= segundos; i++) ctx.depois(i, () => fn(i));
}

/** Dano de habilidade: fração do dano de ataque de `eu`, multiplicada pelo poder. */
export function bater(ctx: Contexto, eu: Lutador, para: Lutador, fracao: number, opcoes?: OpcoesDano): number {
  if (!para.vivo) return 0;
  return ctx.dano(eu, para, fracao * poder(eu), opcoes);
}
/** Dano de habilidade em pontos (já multiplicado pelo poder). */
export function baterFixo(ctx: Contexto, eu: Lutador, para: Lutador, valor: number, opcoes?: OpcoesDano): number {
  if (!para.vivo || valor <= 0) return 0;
  return ctx.danoFixo(eu, para, valor * poder(eu), opcoes);
}
/** Cura de habilidade (multiplicada pelo poder). */
export function curarH(ctx: Contexto, eu: Lutador, para: Lutador, valor: number): number {
  if (!para.vivo || valor <= 0) return 0;
  return ctx.curar(eu, para, valor * poder(eu));
}
/** Escudo de habilidade (multiplicado pelo poder). */
export function escudoH(ctx: Contexto, eu: Lutador, para: Lutador, valor: number, duracao: number): void {
  if (!para.vivo || valor <= 0) return;
  ctx.escudo(para, valor * poder(eu), duracao);
}

/** Mana devolvida logo depois do lançamento (o motor zera a mana ao lançar). */
export function devolverMana(ctx: Contexto, u: Lutador, pontos: number): void {
  ctx.depois(0.1, () => { if (u.vivo) ctx.mana(u, pontos); });
}

/** Tira mana de `de` (fração da mana atual) e devolve quanto tirou. */
export function tirarMana(ctx: Contexto, de: Lutador, fracao: number): number {
  const m = Math.max(0, de.mana * fracao);
  if (m > 0) ctx.mana(de, -m);
  return m;
}

/** Na luta toda (buff/escudo/status sem fim definido). */
export const LUTA_TODA = 999;
