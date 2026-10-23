// Franquias customizadas: funções puras (sem DOM) sobre a lista de franquias.
// Nada aqui muda o que recebe: cada alteração devolve uma lista nova e, quando nada muda
// (chave que não existe, rótulo vazio, limite cheio...), devolve a MESMA lista (bom pro React).
import type { Item } from '../types';
import {
  CUSTOM_IMG_PREFIX,
  CUSTOM_KEY_PREFIX,
  CUSTOM_LIMITS,
  type CustomFranchise,
  type CustomItem,
  type CustomOp,
} from './types';

/** Gerador de números em [0, 1) (Math.random ou o gerador com semente da sala). */
export type Rand = () => number;

/**
 * Cores das franquias customizadas, na ordem em que são dadas. Todas têm contraste >= 3:1 tanto no
 * painel claro (#ffffff) quanto no escuro (#1a1d23) e ficam longe das cores das franquias fixas.
 */
export const PALETTE: readonly string[] = [
  '#6461e0', // anil
  '#8f8a00', // mostarda
  '#c0465a', // rosa-vinho
  '#5a8f1c', // verde-limão
  '#9a6324', // marrom
  '#a0619a', // malva
  '#64748b', // ardósia
  '#857563', // taupe
];

/** Rótulo de imagem sem nome. */
export const NO_NAME = 'Sem nome';

/** O que vem depois de 'c-' numa chave de franquia, e o id de uma imagem. */
const ID_RE = /^[a-z0-9]{1,16}$/;
const COLOR_RE = /^#[0-9a-f]{6}$/i;
const DATA_RE = /^data:image\/(?:webp|jpeg|png|gif);base64,[A-Za-z0-9+/]+={0,2}$/;
/** caracteres de controle e de direção de texto (mesmos que o nome de jogador tira) */
const INVISIBLE = /[\p{Cc}‎‏‪-‮⁦-⁩]/gu;
/** folga pra rótulos que chegam pela rede antes do cleanLabel (emoji conta 2 em .length) */
const WIRE_LABEL = CUSTOM_LIMITS.label * 4;

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Chave de franquia customizada válida: 'c-' + 1..16 caracteres [a-z0-9]. */
export function isCustomKey(x: unknown): x is string {
  return typeof x === 'string' && x.startsWith(CUSTOM_KEY_PREFIX) && ID_RE.test(x.slice(CUSTOM_KEY_PREFIX.length));
}

const isId = (x: unknown): x is string => typeof x === 'string' && ID_RE.test(x);

/** data:image/(webp|jpeg|png|gif);base64,... com até CUSTOM_LIMITS.dataChars caracteres. */
export function isImageDataUrl(s: unknown): s is string {
  return typeof s === 'string' && s.length <= CUSTOM_LIMITS.dataChars && DATA_RE.test(s);
}

/** Rótulo limpo: espaços viram um só, sem controle, sem sobra nas pontas, até CUSTOM_LIMITS.label caracteres. */
export function cleanLabel(s: string): string {
  if (typeof s !== 'string') return '';
  const flat = s.replace(/\s/g, ' ').replace(INVISIBLE, '').replace(/ +/g, ' ').trim();
  // Array.from conta por caractere (não corta emoji no meio)
  return Array.from(flat).slice(0, CUSTOM_LIMITS.label).join('').trim();
}

/** n caracteres base36 (n chamadas a rand). */
function base36(rand: Rand, n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const d = Math.floor(rand() * 36);
    s += (d >= 0 && d < 36 ? d : 0).toString(36);
  }
  return s;
}

/** Um valor de make() que não esteja em taken; se o gerador insistir em repetir, cai num contador. */
function fresh(taken: ReadonlySet<string>, make: () => string, prefix: string): string {
  for (let i = 0; i < 20; i++) {
    const s = make();
    if (!taken.has(s)) return s;
  }
  for (let i = 0; ; i++) {
    const s = prefix + i.toString(36).padStart(6, '0');
    if (!taken.has(s)) return s;
  }
}

/** Chave nova: 'c-' + 6 caracteres base36 (6 chamadas a rand). Não confere repetição (addFranchise confere). */
export function newKey(rand: Rand = Math.random): string {
  return CUSTOM_KEY_PREFIX + base36(rand, 6);
}

/** Troca a franquia `key` por fn(franquia). Sem a chave, ou se fn devolver a mesma, devolve a mesma lista. */
function mapFranchise(
  list: CustomFranchise[],
  key: string,
  fn: (f: CustomFranchise) => CustomFranchise,
): CustomFranchise[] {
  const i = list.findIndex(f => f.key === key);
  if (i < 0) return list;
  const f = list[i] as CustomFranchise;
  const next = fn(f);
  if (next === f) return list;
  const out = list.slice();
  out[i] = next;
  return out;
}

/** 'Grupo N' que ainda não exista. */
function defaultLabel(list: CustomFranchise[]): string {
  const used = new Set(list.map(f => f.label));
  let n = list.length + 1;
  while (used.has(`Grupo ${n}`)) n++;
  return `Grupo ${n}`;
}

/**
 * Nova franquia (vazia) no fim da lista. Cor: a primeira da PALETTE que ninguém da lista usa.
 * Rótulo vazio vira 'Grupo N'. Lista cheia (CUSTOM_LIMITS.franchises): devolve a mesma lista.
 * A franquia criada é a última da lista devolvida.
 */
export function addFranchise(list: CustomFranchise[], label: string, rand: Rand = Math.random): CustomFranchise[] {
  if (list.length >= CUSTOM_LIMITS.franchises) return list;
  const key = fresh(new Set(list.map(f => f.key)), () => newKey(rand), CUSTOM_KEY_PREFIX);
  const used = new Set(list.map(f => f.color));
  const color = PALETTE.find(c => !used.has(c)) ?? (PALETTE[list.length % PALETTE.length] as string);
  return [...list, { key, label: cleanLabel(label) || defaultLabel(list), color, items: [] }];
}

/** Renomeia a franquia. Rótulo vazio (depois de limpo) ou chave inexistente: mesma lista. */
export function renameFranchise(list: CustomFranchise[], key: string, label: string): CustomFranchise[] {
  const name = cleanLabel(label);
  if (!name) return list;
  return mapFranchise(list, key, f => (f.label === name ? f : { ...f, label: name }));
}

export function removeFranchise(list: CustomFranchise[], key: string): CustomFranchise[] {
  return list.some(f => f.key === key) ? list.filter(f => f.key !== key) : list;
}

/**
 * Acrescenta imagens à franquia `key`, com ids novos (6 caracteres base36) e rótulos limpos
 * (vazio vira 'Sem nome'). Ignora data URL inválida e o que passar de CUSTOM_LIMITS.items.
 * Se nada entrar, devolve a mesma lista.
 */
export function addItems(
  list: CustomFranchise[],
  key: string,
  items: { name: string; data: string }[],
  rand: Rand = Math.random,
): CustomFranchise[] {
  if (!Array.isArray(items)) return list;
  return mapFranchise(list, key, f => {
    const room = CUSTOM_LIMITS.items - f.items.length;
    if (room <= 0) return f;
    const taken = new Set(f.items.map(i => i.id));
    const add: CustomItem[] = [];
    for (const it of items) {
      if (add.length >= room) break;
      if (!isRec(it) || !isImageDataUrl(it.data)) continue;
      const id = fresh(taken, () => base36(rand, 6), '');
      taken.add(id);
      add.push({ id, name: cleanLabel(it.name) || NO_NAME, data: it.data });
    }
    return add.length ? { ...f, items: [...f.items, ...add] } : f;
  });
}

/** Troca o rótulo de uma imagem. Rótulo vazio, franquia ou imagem inexistente: mesma lista. */
export function renameItem(list: CustomFranchise[], key: string, id: string, name: string): CustomFranchise[] {
  const n = cleanLabel(name);
  if (!n) return list;
  return mapFranchise(list, key, f => {
    const i = f.items.findIndex(x => x.id === id);
    const it = f.items[i];
    if (!it || it.name === n) return f;
    const items = f.items.slice();
    items[i] = { ...it, name: n };
    return { ...f, items };
  });
}

export function removeItem(list: CustomFranchise[], key: string, id: string): CustomFranchise[] {
  return mapFranchise(list, key, f => (f.items.some(x => x.id === id) ? { ...f, items: f.items.filter(x => x.id !== id) } : f));
}

/**
 * Aplica um pedido de jogador ('add' ou 'label'). O pedido pode ter vindo pela rede: é conferido aqui
 * e nunca lança. Pedido inválido, franquia ou imagem inexistente: devolve a mesma lista.
 */
export function applyOp(list: CustomFranchise[], op: CustomOp, rand: Rand = Math.random): CustomFranchise[] {
  try {
    const o: unknown = op;
    if (!isRec(o) || typeof o.key !== 'string') return list;
    if (o.op === 'add') {
      if (!Array.isArray(o.items)) return list;
      const items: { name: string; data: string }[] = [];
      const n = Math.min(o.items.length, CUSTOM_LIMITS.items);
      for (let i = 0; i < n; i++) {
        const it: unknown = o.items[i];
        if (isRec(it) && typeof it.data === 'string') {
          items.push({ name: typeof it.name === 'string' ? it.name : '', data: it.data });
        }
      }
      return addItems(list, o.key, items, rand);
    }
    if (o.op === 'label') {
      if (typeof o.id !== 'string' || typeof o.name !== 'string') return list;
      return renameItem(list, o.key, o.id, o.name);
    }
    return list;
  } catch {
    return list;
  }
}

/** Valor de Item.img de uma imagem customizada: 'cst:<chave>/<id>'. */
export function customImg(key: string, id: string): string {
  return `${CUSTOM_IMG_PREFIX}${key}/${id}`;
}

/** 'cst:<chave>/<id>' -> { key, id }; qualquer outra coisa -> null. */
export function parseCustomImg(img: string): { key: string; id: string } | null {
  if (typeof img !== 'string' || !img.startsWith(CUSTOM_IMG_PREFIX)) return null;
  const rest = img.slice(CUSTOM_IMG_PREFIX.length);
  const slash = rest.indexOf('/');
  if (slash < 0) return null;
  const key = rest.slice(0, slash);
  const id = rest.slice(slash + 1);
  return isCustomKey(key) && isId(id) ? { key, id } : null;
}

/** Chave da franquia de um Item.img customizado ('cst:c-abc/x1' -> 'c-abc'); outra imagem -> null. */
export function imgKey(img: string): string | null {
  return parseCustomImg(img)?.key ?? null;
}

/**
 * Personagens da franquia pro resto do site: name = rótulo, img = 'cst:<chave>/<id>'.
 * O sorteio usa o nome como chave, então rótulos repetidos ganham ' (2)', ' (3)'... (o primeiro fica como está,
 * e o sufixo nunca bate com um rótulo que já exista na franquia).
 */
export function toItems(f: CustomFranchise): Item[] {
  const names = f.items.map(it => it.name || NO_NAME);
  const taken = new Set(names);
  const seen = new Set<string>();
  return f.items.map((it, i) => {
    let name = names[i] as string;
    if (seen.has(name)) {
      let n = 2;
      while (taken.has(`${name} (${n})`)) n++;
      name = `${name} (${n})`;
      taken.add(name);
    }
    seen.add(name);
    return { name, img: customImg(f.key, it.id) };
  });
}

function validItem(x: unknown): CustomItem | null {
  if (!isRec(x)) return null;
  const { id, name, data } = x;
  if (!isId(id) || typeof name !== 'string' || name.length > WIRE_LABEL || !isImageDataUrl(data)) return null;
  return { id, name: cleanLabel(name) || NO_NAME, data };
}

function validFranchise(x: unknown): CustomFranchise | null {
  if (!isRec(x)) return null;
  const { key, label, color, items } = x;
  if (!isCustomKey(key) || typeof label !== 'string' || label.length > WIRE_LABEL) return null;
  if (typeof color !== 'string' || !COLOR_RE.test(color)) return null;
  if (!Array.isArray(items) || items.length > CUSTOM_LIMITS.items) return null;
  const out: CustomItem[] = [];
  const ids = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    const it = validItem(items[i]);
    if (!it || ids.has(it.id)) return null;
    ids.add(it.id);
    out.push(it);
  }
  return { key, label: cleanLabel(label) || NO_NAME, color: color.toLowerCase(), items: out };
}

/**
 * Confere uma lista de franquias que veio pela rede (estrutura, chaves 'c-', ids, cores, limites, data URLs).
 * Devolve uma cópia só com os campos conhecidos e os rótulos limpos, ou null se algo estiver fora do formato.
 * Nunca lança (nem com getter que lança ou Proxy).
 */
export function validateCustoms(x: unknown): CustomFranchise[] | null {
  try {
    if (!Array.isArray(x) || x.length > CUSTOM_LIMITS.franchises) return null;
    const out: CustomFranchise[] = [];
    const keys = new Set<string>();
    for (let i = 0; i < x.length; i++) {
      const f = validFranchise(x[i]);
      if (!f || keys.has(f.key)) return null;
      keys.add(f.key);
      out.push(f);
    }
    return out;
  } catch {
    return null;
  }
}
