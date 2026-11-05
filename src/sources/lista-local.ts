import type { Item } from '../types';

/**
 * Carga de franquia cuja lista fica salva em public/ por um script (zelda.mjs, brainrot.mjs...): linhas
 * [nome, url da imagem, ...]. O que vem depois da imagem é só pro catálogo.
 */
export const listaLocal = (url: string) => async (): Promise<Item[]> => {
  const list = (await (await fetch(url)).json()) as [name: string, img: string, ...resto: unknown[]][];
  if (!list.length) throw new Error('vazio');
  return list.map(([name, img]) => ({ name, img }));
};
