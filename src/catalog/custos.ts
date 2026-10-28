// Custos do Set 1 (1 a 5 na loja): quantos campeões cabem em cada custo, no total e em cada origem, e os avisos de quem
// passou do limite, com o que mudar pra equilibrar. Lógica pura; a subaba Custos do Catálogo mostra. Campeão = linha
// evolutiva (o custo é o da 1ª forma) ou personagem solto, como nas contas de docs/tft/matematica.
import { CUSTOS, custoDaLinha, type LinhaEvo, type Unidades } from './plano';

/**
 * Quantos campeões de cada custo, em proporção (custo 1 a 5): a do TFT, 14/13/14/14/10 num set de 65. É a referência
 * até termos a nossa tabela de chances da loja.
 */
export const PROPORCAO = [14, 13, 14, 14, 10] as const;
/** Franquias que não viram campeão: Bakugan são os itens; Final Fantasy, os monstros das rodadas. */
export const NAO_SAO_CAMPEOES: readonly string[] = ['bakugan', 'ff'];

export interface Campeao { nome: string; custo?: number }

/** Os campeões da franquia: cada linha com alguém marcado (com o custo da 1ª forma) e cada marcado fora de linha. */
export function campeoesDe(marcados: ReadonlySet<string>, linhas: readonly LinhaEvo[], unidades: Unidades): Campeao[] {
  const r: Campeao[] = [];
  const naLinha = new Set<string>();
  for (const l of linhas) {
    const membros = l.niveis.flat();
    membros.forEach(n => naLinha.add(n));
    if (membros.some(n => marcados.has(n))) r.push({ nome: l.nome, custo: custoDaLinha(l, unidades) });
  }
  for (const n of marcados) if (!naLinha.has(n)) r.push({ nome: n, custo: unidades[n]?.custo });
  return r;
}

/** Divide `n` campeões pelos custos na `proporcao`, arredondando pelo maior resto pra somar `n`. */
export function metas(n: number, proporcao: readonly number[] = PROPORCAO): number[] {
  const tot = proporcao.reduce((a, x) => a + x, 0);
  const bruto = proporcao.map(x => (n * x) / tot);
  const r = bruto.map(Math.floor);
  const ordem = bruto.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0]);
  for (let i = 0; r.reduce((a, x) => a + x, 0) < n; i++) r[ordem[i]![1]]!++;
  return r;
}

/** Quanto cada custo pode fugir da meta: 10% dela, no mínimo 1. */
export const folga = (meta: number) => Math.max(1, Math.round(meta * 0.1));

export interface Cota { custo: number; tem: number; meta: number; min: number; max: number }
export interface Situacao { total: number; semCusto: number; cotas: Cota[] }

/** Quantos campeões há em cada custo contra a meta (a meta conta todos, com custo ou não). */
export function situacao(cs: readonly Campeao[], proporcao: readonly number[] = PROPORCAO): Situacao {
  const ms = metas(cs.length, proporcao);
  return {
    total: cs.length,
    semCusto: cs.filter(c => !c.custo).length,
    cotas: CUSTOS.map((custo, i) => {
      const meta = ms[i]!;
      return { custo, tem: cs.filter(c => c.custo === custo).length, meta, min: Math.max(0, meta - folga(meta)), max: meta + folga(meta) };
    }),
  };
}

export interface Aviso { texto: string; k?: string }

/**
 * O que está passando do limite e como equilibrar: no total, cada custo acima do máximo; em cada origem, cada custo
 * acima do máximo dela, com a sugestão de passar o excesso pros custos que ainda estão abaixo da meta.
 */
export function avisos(total: Situacao, origens: readonly { k: string; rotulo: string; s: Situacao }[]): Aviso[] {
  const r: Aviso[] = [];
  for (const c of total.cotas) {
    if (c.tem > c.max) r.push({ texto: `Custo ${c.custo}: ${c.tem} campeões, ${c.tem - c.max} acima do limite de ${c.max} (meta ${c.meta}).` });
  }
  for (const { k, rotulo, s } of origens) {
    const acima = s.cotas.filter(c => c.tem > c.max);
    if (!acima.length) continue;
    const abaixo = s.cotas.filter(c => c.tem < c.meta);
    const pra = abaixo.length ? ` Dá pra passar pra ${abaixo.map(c => `custo ${c.custo} (${c.tem} de ${c.meta})`).join(', ')}.` : '';
    r.push({
      k,
      texto: `${rotulo}: ${acima.map(c => `custo ${c.custo} com ${c.tem}, limite ${c.max} (meta ${c.meta})`).join('; ')}.${pra}`,
    });
  }
  return r;
}
