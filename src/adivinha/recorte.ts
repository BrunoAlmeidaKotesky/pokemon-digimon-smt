// Recorte do livre e da sala online: o jogador escolhe quais valores de um campo do catálogo entram (gerações do
// Pokémon, partes do JoJo). `null` = todos (o padrão, e o que vale sempre no desafio do dia). Lógica pura.
import { valores, type Info } from '../catalog/model';
import type { Grupo } from './grupos';

/** Valores ligados válidos, na ordem do grupo; nenhum válido, todos ligados ou grupo sem recorte = null. */
export function limparRecorte(g: Grupo | undefined, x: unknown): string[] | null {
  const r = g?.recorte;
  if (!r || !Array.isArray(x)) return null;
  const l = r.valores.map(v => v.id).filter(v => x.includes(v));
  return l.length && l.length < r.valores.length ? l : null;
}

/** O valor está ligado? */
export const ligado = (ligados: readonly string[] | null, v: string): boolean => !ligados || ligados.includes(v);

/** Liga ou desliga um valor; o último ligado não desliga; todos ligados = null. */
export function alternarRecorte(g: Grupo, ligados: readonly string[] | null, v: string): string[] | null {
  const r = g.recorte;
  if (!r || !r.valores.some(x => x.id === v)) return ligados ? [...ligados] : null;
  const atual = ligados ?? r.valores.map(x => x.id);
  if (atual.includes(v)) return atual.length > 1 ? limparRecorte(g, atual.filter(x => x !== v)) : [...atual];
  return limparRecorte(g, [...atual, v]);
}

/** O personagem entra no recorte: tem pelo menos um dos valores ligados no campo (que pode ser lista). */
export function noRecorte(g: Grupo, info: Info, ligados: readonly string[] | null): boolean {
  if (!ligados || !g.recorte) return true;
  const v = info[g.recorte.campo];
  return v !== undefined && valores(v).some(x => ligados.includes(x));
}

/**
 * "gerações I e III", "geração IV"; quando o nome do valor já diz o que é: "Parte 4, Parte 5 e Kishibe Rohan".
 * Vazio = todos.
 */
export function textoRecorte(g: Grupo, ligados: readonly string[] | null): string {
  const r = g.recorte;
  if (!r || !ligados) return '';
  const ns = r.valores.filter(v => ligados.includes(v.id)).map(v => v.rotulo);
  const lista = ns.length <= 1 ? ns.join('') : ns.slice(0, -1).join(', ') + ' e ' + ns.at(-1);
  const um = r.rotulo.replace(/s$/, '').replace(/õe$/, 'ão');
  if (r.valores.some(v => v.rotulo.startsWith(um))) return lista;
  return `${(ns.length === 1 ? um : r.rotulo).toLowerCase()} ${lista}`;
}
