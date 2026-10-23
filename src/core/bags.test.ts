import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Entry, Item } from '../types';
import { Bags, localBagStore, memoryBagStore, type BagStore } from './bags';
import { installStorage, makeList, mulberry32, SEEDS, seedRandom, sequence } from './test-helpers';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const stored = (s: { getItem(k: string): string | null }) => JSON.parse(s.getItem('pdx-bags') as string) as Record<string, string[]>;

describe('Bags.draw', () => {
  it('tira do fim do saco, sem sortear, e devolve o próprio objeto da lista', () => {
    const s = installStorage({ 'pdx-bags': JSON.stringify({ pokemon: ['P0', 'P1', 'P2'] }) });
    const list = makeList('P', 3);
    const r = sequence([]);
    const b = new Bags(localBagStore);
    expect(b.draw('pokemon', list)).toBe(list[2]);
    expect(stored(s)).toEqual({ pokemon: ['P0', 'P1'] });
    expect(b.draw('pokemon', list)).toBe(list[1]);
    expect(b.draw('pokemon', list)).toBe(list[0]);
    expect(stored(s)).toEqual({ pokemon: [] });
    expect(r.calls()).toBe(0);
  });

  it('ignora nomes que não existem mais na lista', () => {
    const s = installStorage({ 'pdx-bags': JSON.stringify({ pokemon: ['P0', 'SUMIU', 'P1', 'OUTRO'] }) });
    const list = makeList('P', 3);
    sequence([]);
    const b = new Bags(localBagStore);
    expect(b.draw('pokemon', list).name).toBe('P1');
    expect(stored(s)).toEqual({ pokemon: ['P0'] });
  });

  it('saco vazio (ou só com nomes velhos): recomeça com shuffle dos nomes e salva o resto', () => {
    const s = installStorage({ 'pdx-bags': JSON.stringify({ pokemon: ['VELHO'] }) });
    const list = makeList('P', 4);
    const r = sequence([0, 0, 0]);
    const b = new Bags(localBagStore);
    // shuffle([P0,P1,P2,P3]) com r=0,0,0 -> [P1,P2,P3,P0]; pop -> P0
    expect(b.draw('pokemon', list).name).toBe('P0');
    expect(r.calls()).toBe(3);
    expect(stored(s)).toEqual({ pokemon: ['P1', 'P2', 'P3'] });
  });

  it('sem saco guardado também embaralha', () => {
    installStorage();
    const r = sequence([0.999, 0.999]);
    const b = new Bags(localBagStore);
    expect(b.draw('smt', makeList('S', 3)).name).toBe('S2');
    expect(r.calls()).toBe(2);
  });

  it('salva no formato {franquia: [nomes]} e preserva as outras franquias', () => {
    const s = installStorage({ 'pdx-bags': JSON.stringify({ smt: ['x', 'y'] }) });
    seedRandom(3);
    const b = new Bags(localBagStore);
    b.draw('pokemon', makeList('P', 5));
    b.draw('digimon', makeList('D', 4));
    const got = stored(s);
    expect(Object.keys(got).sort()).toEqual(['digimon', 'pokemon', 'smt']);
    expect(got.smt).toEqual(['x', 'y']);
    expect(got.pokemon).toHaveLength(4);
    expect(got.digimon).toHaveLength(3);
    got.pokemon?.forEach(n => expect(n).toMatch(/^P\d$/));
  });

  it('N sorteios seguidos numa lista de N são todos diferentes, e cada ciclo gasta N-1 chamadas', () => {
    installStorage();
    const list = makeList('P', 25);
    const r = seedRandom(11);
    const b = new Bags(localBagStore);
    for (let cycle = 0; cycle < 3; cycle++) {
      const names = Array.from({ length: 25 }, () => b.draw('pokemon', list).name);
      expect(new Set(names).size).toBe(25);
      expect(r.calls()).toBe(24 * (cycle + 1));
    }
  });

  it('continua de onde parou depois de recarregar (nova instância lê o localStorage)', () => {
    installStorage();
    seedRandom(8);
    const list = makeList('P', 10);
    const first = Array.from({ length: 4 }, () => new Bags(localBagStore).draw('pokemon', list).name);
    const b2 = new Bags(localBagStore);
    const rest = Array.from({ length: 6 }, () => b2.draw('pokemon', list).name);
    expect(new Set([...first, ...rest]).size).toBe(10);
  });

  it('nomes repetidos na lista: o Map fica com o último (como o antigo)', () => {
    installStorage({ 'pdx-bags': JSON.stringify({ k: ['A'] }) });
    const list: Item[] = [{ name: 'A', img: '1' }, { name: 'A', img: '2' }];
    expect(new Bags(localBagStore).draw('k', list).img).toBe('2');
  });
});

describe('localBagStore', () => {
  it('JSON inválido, "null" ou sem localStorage: começa vazio e não quebra', () => {
    installStorage({ 'pdx-bags': '{nao eh json' });
    expect(localBagStore.load()).toEqual({});
    installStorage({ 'pdx-bags': 'null' });
    expect(localBagStore.load()).toEqual({});
    vi.stubGlobal('localStorage', undefined);
    expect(localBagStore.load()).toEqual({});
    expect(() => localBagStore.save({ a: ['x'] })).not.toThrow();
    seedRandom(1);
    expect(() => new Bags(localBagStore).draw('a', makeList('A', 3))).not.toThrow();
  });
});

describe('memoryBagStore', () => {
  it('não toca no localStorage e guarda entre instâncias do mesmo store', () => {
    const s = installStorage();
    seedRandom(4);
    const store = memoryBagStore();
    const list = makeList('P', 6);
    const a = Array.from({ length: 3 }, () => new Bags(store).draw('pokemon', list).name);
    const b = Array.from({ length: 3 }, () => new Bags(store).draw('pokemon', list).name);
    expect(new Set([...a, ...b]).size).toBe(6);
    expect(s.length).toBe(0);
    expect(memoryBagStore().load()).toEqual({});
  });

  it('load devolve cópia', () => {
    const store = memoryBagStore();
    store.save({ a: ['1', '2'] });
    const got = store.load();
    got.a?.pop();
    expect(store.load()).toEqual({ a: ['1', '2'] });
  });
});

describe('Bags.pick', () => {
  const spyStore = (init: Record<string, string[]>): BagStore & { saves: number } => {
    const st = {
      saves: 0,
      load: () => JSON.parse(JSON.stringify(init)) as Record<string, string[]>,
      save: () => {
        st.saves++;
      },
    };
    return st;
  };

  it('devolve uma cópia com fr', () => {
    const list = makeList('P', 3);
    const it0 = new Bags(spyStore({ pokemon: ['P0'] })).pick('pokemon', list);
    expect(it0).toEqual({ name: 'P0', img: 'p/0.png', fr: 'pokemon' });
    expect(it0).not.toBe(list[0]);
    expect(list[0]).not.toHaveProperty('fr');
  });

  it('pula nomes de avoid', () => {
    const list = makeList('P', 3);
    const st = spyStore({ pokemon: ['P0', 'P1', 'P2'] });
    const b = new Bags(st);
    expect(b.pick('pokemon', list, [{ name: 'P2' }]).name).toBe('P1');
    expect(st.saves).toBe(2);
  });

  it('desiste depois de 20 sorteios e fica com o último', () => {
    sequence([]);
    const st = spyStore({});
    const got = new Bags(st).pick('k', makeList('A', 1), [{ name: 'A0' }]);
    expect(got.name).toBe('A0');
    expect(st.saves).toBe(20);
  });

  it('com 2 nomes e os 2 evitados também para em 20', () => {
    seedRandom(9);
    const st = spyStore({});
    new Bags(st).pick('k', makeList('A', 2), [{ name: 'A0' }, { name: 'A1' }]);
    expect(st.saves).toBe(20);
  });

  it('sem avoid: 1 sorteio', () => {
    const st = spyStore({ k: ['A0', 'A1'] });
    expect(new Bags(st).pick('k', makeList('A', 2)).name).toBe('A1');
    expect(st.saves).toBe(1);
  });
});

// --- referência: cópia do site antigo (só ganhou tipos/casts) ---
type RefSrc = Record<string, { list: Item[]; byName?: Map<string, Item> }>;
function makeRef(SRC: RefSrc) {
  const shuffle = <T,>(a: T[]): T[] => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j] as T,a[i] as T];} return a; };
  const bags: Record<string, string[]> = {};
  try{ Object.assign(bags, JSON.parse(localStorage.getItem('pdx-bags') as string) || {}); }catch{ /* igual */ }
  function saveBags(){ try{ localStorage.setItem('pdx-bags', JSON.stringify(bags)); }catch{ /* igual */ } }
  function draw(k: string): Item {
    const src = SRC[k] as RefSrc[string];
    const list = src.list;
    const byName = src.byName || (src.byName = new Map(list.map(x => [x.name, x])));
    let bag = (bags[k] || []).filter(n => byName.has(n));
    if(!bag.length) bag = shuffle(list.map(x => x.name));
    const name = bag.pop() as string;
    bags[k] = bag; saveBags();
    return byName.get(name) as Item;
  }
  function pick(k: string, avoid: { name: string }[] = []): Entry {
    const names = new Set(avoid.map(a => a.name)); let it: Entry, tries = 0;
    do{ it = {...draw(k), fr:k}; }while(names.has(it.name) && ++tries < 20);
    return it;
  }
  return { draw, pick };
}

describe('equivalência com o site antigo (mulberry32)', () => {
  it.each(SEEDS)('draw/pick/saco salvo, semente %i', seed => {
    const lists: Record<string, Item[]> = { pokemon: makeList('P', 40), digimon: makeList('D', 7), smt: makeList('S', 2), solo: makeList('U', 1) };
    const initial = JSON.stringify({ pokemon: ['P3', 'GONE', 'P9', 'P1'], smt: [], outra: ['z'] });
    const keys = Object.keys(lists);
    const run = (pick: (k: string, avoid: { name: string }[]) => Entry, draw: (k: string) => Item) => {
      const ops = mulberry32(seed ^ 0x5eed); // escolhe as operações sem gastar Math.random
      const out: string[] = [];
      let last: Entry[] = [];
      for (let i = 0; i < 300; i++) {
        const k = keys[Math.floor(ops() * keys.length)] as string;
        if (ops() < 0.2) out.push('d:' + draw(k).name);
        else {
          const e = pick(k, ops() < 0.5 ? last : []);
          last = [e, ...last].slice(0, 2);
          out.push(`p:${e.fr}:${e.name}:${e.img}`);
        }
      }
      return out;
    };
    let st = installStorage({ 'pdx-bags': initial });
    let r = seedRandom(seed);
    const ref = makeRef(Object.fromEntries(Object.entries(lists).map(([k, list]) => [k, { list }])));
    const refOut = run(ref.pick, ref.draw);
    const refCalls = r.calls();
    const refSaved = st.getItem('pdx-bags');

    st = installStorage({ 'pdx-bags': initial });
    r = seedRandom(seed);
    const b = new Bags(localBagStore);
    const got = run((k, avoid) => b.pick(k, lists[k] as Item[], avoid), k => b.draw(k, lists[k] as Item[]));
    expect(got).toEqual(refOut);
    expect(r.calls()).toBe(refCalls);
    expect(st.getItem('pdx-bags')).toBe(refSaved);
  });
});
