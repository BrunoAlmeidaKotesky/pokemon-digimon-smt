// Quem pode ser sorteado (e chutado) em cada grupo e submodo: a lista do próprio site cruzada com o catálogo
// (public/catalogo/<chave>.json) e, no Emoji, com os emojis (public/adivinha/emoji/<chave>.json). Lógica pura.
import type { Catalogo, Info } from '../catalog/model';
import { normalizar } from '../catalog/model';
import type { Entry, Item } from '../types';
import type { Grupo, Submodo } from './grupos';

/** Emojis de cada personagem, do mais vago ao mais revelador. */
export type EmojiMapa = Map<string, string[]>;

/** Personagem do jogo: o da lista do site, com as informações do catálogo e (se houver) os emojis. */
export interface AdvItem extends Entry {
  info: Info;
  emoji: string[] | null;
}

/** O que o pool usa de fora: listas do site, catálogos e emojis, por franquia (undefined = ainda não carregou). */
export interface Fontes {
  listas: Record<string, readonly Item[] | null | undefined>;
  catalogos: Record<string, Catalogo | null | undefined>;
  emojis: Record<string, EmojiMapa | null | undefined>;
}

/** Ordem por nome que não depende do idioma do navegador (o "do dia" precisa da mesma lista em todo lugar). */
export const porNome = (a: { name: string }, b: { name: string }) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

/**
 * Personagens do grupo no submodo, ordenados por nome: quem está na lista do site, tem entrada no catálogo e passa
 * no filtro do grupo (Pokémon: só espécies, sem Paradoxos nem Unown; JoJo: só Stands do anime e do mangá; Persona: sem Picaro); no Emoji, só quem tem emoji.
 * Franquia sem lista ou sem catálogo fica de fora.
 */
export function montarPool(g: Grupo, sub: Submodo, f: Fontes): AdvItem[] {
  const out = new Map<string, AdvItem>();
  for (const fr of g.frs) {
    const lista = f.listas[fr], cat = f.catalogos[fr];
    if (!lista || !cat) continue;
    const emo = f.emojis[fr] ?? null;
    if (sub === 'emoji' && !emo) continue;
    for (const it of lista) {
      const info = cat.itens.get(it.name);
      if (!info || out.has(it.name)) continue;
      if (g.aceita && !g.aceita(info, it.name)) continue;
      const emoji = emo?.get(it.name) ?? null;
      if (sub === 'emoji' && !emoji?.length) continue;
      out.set(it.name, { name: it.name, img: it.img, fr, info, emoji });
    }
  }
  return [...out.values()].sort(porNome);
}

/** Personagem pelo nome exato; sem ele, pelo nome sem acento e maiúscula (se só um bater). */
export function acharNoPool(pool: readonly AdvItem[], nome: string): AdvItem | undefined {
  if (typeof nome !== 'string') return undefined;
  const exato = pool.find(x => x.name === nome);
  if (exato) return exato;
  const n = normalizar(nome.trim());
  const iguais = pool.filter(x => normalizar(x.name) === n);
  return iguais.length === 1 ? iguais[0] : undefined;
}

/**
 * Sugestões do campo de chute: quem ainda não foi chutado e tem o texto no nome (sem diferenciar acento e
 * maiúscula). Primeiro quem começa com o texto, depois quem começa uma palavra com ele, depois o resto; em cada
 * grupo, por nome.
 */
export function sugerir(pool: readonly AdvItem[], q: string, usados: ReadonlySet<string>, max = 8): AdvItem[] {
  const n = normalizar(q.trim());
  if (!n) return [];
  const peso = (nome: string): number => {
    const x = normalizar(nome);
    if (x.startsWith(n)) return 0;
    if (x.split(/[\s\-'.(]+/).some(p => p.startsWith(n))) return 1;
    return x.includes(n) ? 2 : -1;
  };
  return pool
    .map(it => ({ it, p: usados.has(it.name) ? -1 : peso(it.name) }))
    .filter(x => x.p >= 0)
    .sort((a, b) => a.p - b.p || porNome(a.it, b.it))
    .slice(0, max)
    .map(x => x.it);
}
