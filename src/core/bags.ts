// Sorteio "saco de bolinhas": cada franquia passa por todos os personagens antes de repetir algum.
// O que falta sortear fica guardado (no navegador, no caso do localBagStore), então recarregar não volta a repetir.
import type { Entry, Item } from '../types';
import { shuffle } from './random';
import { BAGS_KEY, writeJSON } from './storage';

/** Onde os sacos ficam guardados: { franquia: [nomes que ainda faltam sortear] }. */
export interface BagStore {
  load(): Record<string, string[]>;
  save(b: Record<string, string[]>): void;
}

/** Sacos em localStorage['pdx-bags'] (como no site antigo). */
export const localBagStore: BagStore = {
  load() {
    const bags: Record<string, string[]> = {};
    try {
      Object.assign(bags, JSON.parse(localStorage.getItem(BAGS_KEY) as string) || {});
    } catch {
      /* sem armazenamento ou JSON inválido: começa vazio */
    }
    return bags;
  },
  save(b) {
    writeJSON(BAGS_KEY, b);
  },
};

/** Sacos só em memória (não persiste); quem criar outro Bags com o mesmo store continua de onde parou. */
export function memoryBagStore(): BagStore {
  let saved: Record<string, string[]> = {};
  return {
    load: () => Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, [...v]])),
    save: b => {
      saved = Object.fromEntries(Object.entries(b).map(([k, v]) => [k, [...v]]));
    },
  };
}

export class Bags {
  private readonly store: BagStore;
  private readonly rand: () => number;
  private readonly bags: Record<string, string[]>;
  /** nome -> personagem, por lista (o antigo guardava em SRC[k].byName). */
  private readonly byName = new WeakMap<Item[], Map<string, Item>>();

  constructor(store: BagStore, rand: () => number = Math.random) {
    this.store = store;
    this.rand = rand;
    this.bags = store.load();
  }

  /** Tira o próximo personagem do saco da franquia `k` (refaz o saco embaralhado quando esvazia). Salva a cada sorteio. */
  draw(k: string, list: Item[]): Item {
    let byName = this.byName.get(list);
    if (!byName) {
      byName = new Map(list.map(x => [x.name, x]));
      this.byName.set(list, byName);
    }
    const names = byName;
    let bag = (this.bags[k] || []).filter(n => names.has(n));
    if (!bag.length) bag = shuffle(list.map(x => x.name), this.rand);
    const name = bag.pop() as string;
    this.bags[k] = bag;
    this.store.save(this.bags);
    return names.get(name) as Item;
  }

  /** Sorteia evitando os nomes de `avoid` (até 20 tentativas; depois aceita o que vier). */
  pick(k: string, list: Item[], avoid: { name: string }[] = []): Entry {
    const names = new Set(avoid.map(a => a.name));
    let it: Entry;
    let tries = 0;
    do {
      it = { ...this.draw(k, list), fr: k };
    } while (names.has(it.name) && ++tries < 20);
    return it;
  }
}
