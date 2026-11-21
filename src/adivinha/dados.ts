// Carga sob demanda do que a aba Adivinha (sozinho e online) precisa além das listas do site: o catálogo de cada
// franquia (o mesmo da aba Catálogo, baixado uma vez por sessão) e os emojis (public/adivinha/emoji/<chave>.json).
// Toda mudança avisa quem assinou (useSyncExternalStore).
import { useSyncExternalStore } from 'react';
import { assinar as assinarCatalogo, catalogo, pedirCatalogo, versao as versaoCatalogo } from '../catalog/store';
import type { Catalogo } from '../catalog/model';
import { lerEmojis } from './emoji';
import type { Grupo, Submodo } from './grupos';
import { montarPool, type AdvItem, type EmojiMapa, type Fontes } from './pool';

export const emojiUrl = (fr: string) => `adivinha/emoji/${encodeURIComponent(fr)}.json`;

/** null = a franquia não tem arquivo de emojis (ausente, torto ou sem nenhuma entrada) */
type EstadoEmoji = EmojiMapa | null | 'carregando';
const emojis = new Map<string, EstadoEmoji>();
const pedidos = new Map<string, Promise<EmojiMapa | null>>();
/** franquias cujo grupo já foi pedido */
const pedidas = new Set<string>();
let ver = 0;
const subs = new Set<() => void>();
function mudou() {
  ver++;
  for (const fn of Array.from(subs)) fn();
}

/** Baixa os emojis da franquia uma vez por sessão. Arquivo ausente, torto ou vazio -> null (Emoji desligado). */
export function pedirEmojis(fr: string): Promise<EmojiMapa | null> {
  let p = pedidos.get(fr);
  if (!p) {
    emojis.set(fr, 'carregando');
    p = fetch(emojiUrl(fr), { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        const m = lerEmojis(j);
        return m && m.size ? m : null;
      })
      .catch(() => null)
      .then(m => {
        emojis.set(fr, m);
        mudou();
        return m;
      });
    pedidos.set(fr, p);
  }
  return p;
}

/** Pede catálogo e emojis de todas as franquias do grupo; resolve quando tudo chegou (ou falhou). */
export async function pedirGrupo(g: Grupo): Promise<void> {
  g.frs.forEach(fr => pedidas.add(fr));
  await Promise.all(g.frs.flatMap(fr => [pedirCatalogo(fr), pedirEmojis(fr)]));
}

export interface EstadoGrupo {
  /** algum catálogo ou arquivo de emojis ainda não chegou (ou nem foi pedido) */
  carregando: boolean;
  catalogos: Record<string, Catalogo | null | undefined>;
  emojis: Record<string, EmojiMapa | null | undefined>;
  /** franquias do grupo sem catálogo (arquivo ausente ou inválido) */
  semCatalogo: string[];
  /** franquias do grupo sem emojis */
  semEmoji: string[];
}

/** Como estão os dados do grupo agora. */
export function estadoGrupo(g: Grupo): EstadoGrupo {
  const e: EstadoGrupo = { carregando: false, catalogos: {}, emojis: {}, semCatalogo: [], semEmoji: [] };
  for (const fr of g.frs) {
    const c = catalogo(fr), m = emojis.get(fr);
    if (c === undefined || c === 'carregando' || m === undefined || m === 'carregando') e.carregando = true;
    e.catalogos[fr] = c === 'carregando' ? undefined : c;
    e.emojis[fr] = m === 'carregando' ? undefined : m;
    if (c === null) e.semCatalogo.push(fr);
    if (m === null) e.semEmoji.push(fr);
  }
  return e;
}

/** Catálogos e emojis de todas as franquias já carregadas (o que o host passa pra sala online). */
export function fontesCarregadas(): Pick<Fontes, 'catalogos' | 'emojis'> {
  const out: Pick<Fontes, 'catalogos' | 'emojis'> = { catalogos: {}, emojis: {} };
  for (const fr of pedidas) {
    const c = catalogo(fr), m = emojis.get(fr);
    out.catalogos[fr] = c === 'carregando' ? undefined : c;
    out.emojis[fr] = m === 'carregando' ? undefined : m;
  }
  return out;
}

const pools = new Map<string, { deps: unknown[]; pool: AdvItem[] }>();
/**
 * O pool do grupo e submodo com o que já carregou. Fica guardado enquanto listas, catálogos e emojis forem os
 * mesmos objetos: a tela recebe sempre a mesma lista (bom pra useMemo) e não refaz a conta a cada desenho.
 */
export function poolAtual(g: Grupo, sub: Submodo, listas: Fontes['listas'], recorte: readonly string[] | null = null): AdvItem[] {
  const e = estadoGrupo(g);
  const deps = g.frs.flatMap(fr => [listas[fr], e.catalogos[fr], e.emojis[fr]]);
  const chave = `${g.id}:${sub}:${recorte?.join('|') ?? '*'}`, c = pools.get(chave);
  if (c && c.deps.length === deps.length && c.deps.every((x, i) => x === deps[i])) return c.pool;
  const pool = montarPool(g, sub, { listas, catalogos: e.catalogos, emojis: e.emojis }, recorte);
  pools.set(chave, { deps, pool });
  return pool;
}

function assinar(fn: () => void): () => void {
  subs.add(fn);
  const sair = assinarCatalogo(fn);
  return () => {
    subs.delete(fn);
    sair();
  };
}
const versao = () => `${versaoCatalogo()}:${ver}`;
/** Redesenha quando chega um catálogo ou arquivo de emojis. */
export function useDadosAdivinha(): void {
  useSyncExternalStore(assinar, versao);
}

/** Esquece os emojis baixados (testes). */
export function esquecerEmojis(): void {
  emojis.clear();
  pedidos.clear();
  pedidas.clear();
  pools.clear();
}
