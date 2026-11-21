// Pistas do Clássico: cada coluna do chute comparada com a do personagem secreto. Lógica pura.
//   certo   = igual (lista: os mesmos itens, em qualquer ordem)
//   parcial = lista com parte em comum
//   errado  = nada em comum; em número (e geração em romano) vem com seta pra onde está o secreto
// Campo sem informação aparece como "?": dois "?" contam como iguais. Número com unidade: "0,2 m".
import { valores, type Valor } from '../catalog/model';
import type { Coluna, Grupo } from './grupos';
import type { AdvItem } from './pool';

export type Cor = 'certo' | 'parcial' | 'errado';
/** `t` = texto da célula; `s` = seta: o secreto tem mais (cima) ou menos (baixo). */
export interface Pista {
  t: string;
  c: Cor;
  s?: 'cima' | 'baixo';
}
export const SEM_INFO = '?';

const ROMANOS: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
/** 'IV' -> 4, 'IX' -> 9; texto que não é romano -> null. */
export function romano(s: string): number | null {
  const r = s.trim().toUpperCase();
  if (!/^[IVXLC]+$/.test(r)) return null;
  let n = 0;
  for (let i = 0; i < r.length; i++) {
    const v = ROMANOS[r[i] as string] as number, prox = ROMANOS[r[i + 1] as string] ?? 0;
    n += v < prox ? -v : v;
  }
  return n;
}

/**
 * Valor da coluna pro personagem: o do catálogo (do campo `campo`, ou do `id`) ou, sem ele, o fixo da franquia
 * (Persona: raça "Persona"). Coluna de um item da lista (Tipo 2): sem o item, `vazio` ("Nenhum"); sem o campo, "?".
 */
export function valorDe(col: Coluna, it: Pick<AdvItem, 'fr' | 'info'>): Valor | undefined {
  const v = it.info[col.campo ?? col.id];
  if (col.indice !== undefined) return v === undefined ? undefined : (valores(v)[col.indice] ?? col.vazio);
  return v ?? col.fixo?.[it.fr];
}

/** Texto da célula: lista separada por vírgula; número com vírgula decimal e, se houver, a unidade. */
export function textoDe(col: Coluna, v: Valor): string {
  if (typeof v === 'number') return `${String(v).replace('.', ',')}${col.unidade ? ' ' + col.unidade : ''}`;
  return valores(v).join(', ');
}

function numero(col: Coluna, v: Valor): number | null {
  if (Array.isArray(v)) return null;
  if (typeof v === 'number') return v;
  if (col.tipo === 'romano') return romano(v);
  const n = Number(v.replace(',', '.'));
  return v.trim() && Number.isFinite(n) ? n : null;
}

/** Compara o valor do chute com o do secreto numa coluna. */
export function comparar(col: Coluna, chute: Valor | undefined, alvo: Valor | undefined): Pista {
  const t = chute === undefined ? SEM_INFO : textoDe(col, chute);
  if (chute === undefined || alvo === undefined) return { t, c: chute === alvo ? 'certo' : 'errado' };
  if (col.tipo !== 'texto') {
    const a = numero(col, chute), b = numero(col, alvo);
    if (a !== null && b !== null) return a === b ? { t, c: 'certo' } : { t, c: 'errado', s: b > a ? 'cima' : 'baixo' };
  }
  const A = new Set(valores(chute)), B = new Set(valores(alvo));
  if (A.size === B.size && [...A].every(x => B.has(x))) return { t, c: 'certo' };
  return { t, c: [...A].some(x => B.has(x)) ? 'parcial' : 'errado' };
}

/** As pistas de um chute, na ordem das colunas do grupo. */
export function pistas(g: Grupo, chute: Pick<AdvItem, 'fr' | 'info'>, alvo: Pick<AdvItem, 'fr' | 'info'>): Pista[] {
  return g.colunas.map(col => comparar(col, valorDe(col, chute), valorDe(col, alvo)));
}

/** Explicação da célula (title e leitor de tela). */
export function explicar(p: Pista): string {
  const base = p.c === 'certo' ? 'igual' : p.c === 'parcial' ? 'em parte' : 'diferente';
  return p.s ? `${base}: o personagem tem ${p.s === 'cima' ? 'mais' : 'menos'}` : base;
}
