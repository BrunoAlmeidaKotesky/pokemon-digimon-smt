// Itens (Bakugan): equipar, juntar dois componentes no completo e o presente do começo dos estágios 2, 3 e 4.
import type { Rng } from '../rng';
import { COMPONENTES, type Componente, type Jogador, type Unidade } from '../tipos';
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

/** Junta itens numa unidade (evolução); o que não couber volta pros itens soltos. */
export function juntarItens(j: Jogador, u: Unidade, itens: string[]): void {
  for (const item of itens) if (!porItem(u, item)) j.itens.push(item);
}

/** 3 componentes diferentes sorteados pro presente. */
export const sortearPresente = (rng: Rng): Componente[] => rng.sortear(COMPONENTES, 3);

/** O jogador pega um dos componentes do presente. */
export function escolherPresenteDe(j: Jogador, c: Componente): string | null {
  if (!j.presente) return 'Nenhum presente pra escolher';
  if (!j.presente.includes(c)) return 'Esse componente não está no presente';
  j.itens.push(c);
  j.presente = undefined;
  return null;
}
