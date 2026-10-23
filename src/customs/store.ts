// Registro das franquias customizadas, só em memória (some ao recarregar: nada vai pro localStorage nem pro servidor).
// Duas camadas: `mine` (as que eu criei, no solo e como host) e `room` (as que o host da sala mandou, quando sou jogador).
import { parseCustomImg } from './model';
import { CUSTOM_IMG_PREFIX, type CustomFranchise } from './types';

let mine: CustomFranchise[] = [];
let room: CustomFranchise[] | null = null;
let ver = 0;
/** 'chave/id' -> data URL; refeito na primeira consulta depois de cada mudança */
let index: Map<string, string> | null = null;
const subs = new Set<() => void>();

function changed(): void {
  ver++;
  index = null;
  // cópia: quem se desinscreve durante o aviso não atrapalha os outros
  for (const fn of Array.from(subs)) fn();
}

/** As franquias que eu criei. */
export function getMine(): CustomFranchise[] {
  return mine;
}

export function setMine(list: CustomFranchise[]): void {
  if (list === mine) return;
  mine = list;
  changed();
}

/** As franquias que vieram do host (null = não estou numa sala como jogador). */
export function getRoom(): CustomFranchise[] | null {
  return room;
}

export function setRoom(list: CustomFranchise[] | null): void {
  if (list === room) return;
  room = list;
  changed();
}

/** As que valem agora: as da sala, se sou jogador numa sala; senão as minhas. */
export function active(): CustomFranchise[] {
  return room ?? mine;
}

/** Avisa fn a cada mudança. Devolve a função que desfaz a inscrição. */
export function subscribe(fn: () => void): () => void {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

/** Número que muda a cada alteração (snapshot pro useSyncExternalStore). */
export function version(): number {
  return ver;
}

function buildIndex(): Map<string, string> {
  const m = new Map<string, string>();
  // room por último: se a mesma imagem existir nas duas camadas, vale a da sala
  for (const list of [mine, room ?? []]) {
    for (const f of list) for (const it of f.items) m.set(`${f.key}/${it.id}`, it.data);
  }
  return m;
}

/** 'cst:<chave>/<id>' -> data URL da imagem (procura na sala e nas minhas; não achou -> ''). Outra imagem volta igual. */
export function resolveImg(img: string): string {
  if (typeof img !== 'string' || !img.startsWith(CUSTOM_IMG_PREFIX)) return img;
  const p = parseCustomImg(img);
  if (!p) return '';
  index ??= buildIndex();
  return index.get(`${p.key}/${p.id}`) ?? '';
}
