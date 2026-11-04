// Itens (Bakugan): equipar e juntar dois componentes no completo.
import type { Componente, Jogador, Unidade } from '../tipos';
import { MAX_ITENS } from './constantes';
import { M } from './motor';

/** Põe o item na unidade: componente junta com o primeiro componente que ela tiver (vira o completo); senão ocupa
 *  uma vaga (até 3). false = não coube. */
export function porItem(u: Unidade, item: string): boolean {
  const m = M();
  if (m.ehComponente(item)) {
    const i = u.itens.findIndex(x => m.ehComponente(x));
    if (i >= 0) {
      u.itens[i] = m.combinar(u.itens[i] as Componente, item);
      return true;
    }
  }
  if (u.itens.length >= MAX_ITENS) return false;
  u.itens.push(item);
  return true;
}

/** Equipa o item da posição i dos itens soltos na unidade. */
export function equiparItem(j: Jogador, i: number, uid: number): string | null {
  const item = j.itens[i];
  const u = j.unidades[uid];
  if (item == null || !u) return 'Item ou unidade não encontrado';
  if (!porItem(u, item)) return 'A unidade já tem 3 itens';
  j.itens.splice(i, 1);
  return null;
}

/** Junta dois componentes dos itens soltos (o da posição i solto em cima do da posição k): o completo fica no lugar
 *  do k e o i sai da lista. Só componente com componente, em posições diferentes. */
export function juntarSoltos(j: Jogador, i: number, k: number): string | null {
  const a = j.itens[i];
  const b = j.itens[k];
  if (a == null || b == null || i === k) return 'Item não encontrado';
  const m = M();
  if (!m.ehComponente(a) || !m.ehComponente(b)) return 'Só dá pra juntar dois componentes';
  j.itens[k] = m.combinar(a, b);
  j.itens.splice(i, 1);
  return null;
}

/** Junta itens numa unidade (evolução); o que não couber volta pros itens soltos. */
export function juntarItens(j: Jogador, u: Unidade, itens: string[]): void {
  for (const item of itens) if (!porItem(u, item)) j.itens.push(item);
}
