// Skins pro modo Imagem (recorte): a franquia que tem a lista (hoje só o LoL, public/adivinha/skins/lol.json, gerada
// pelo skins-lol.mjs) mostra a splash art de uma skin sorteada do personagem secreto, em vez da arte padrão.
// Lógica pura: ler o arquivo e escolher a skin pela semente (a mesma semente dá a mesma skin pra todo mundo).

export interface Skin {
  /** url da splash art */
  img: string;
  /** nome da skin ("Dynasty Ahri"; a padrão leva o nome do personagem) */
  nome: string;
}
/** nome do personagem (como o site mostra) -> skins */
export type SkinsMapa = Map<string, Skin[]>;

/** Franquias que têm arquivo de skins. */
export const COM_SKINS: readonly string[] = ['lol'];
export const skinsUrl = (fr: string) => `adivinha/skins/${encodeURIComponent(fr)}.json`;

/**
 * Lê { base, itens: { nome: [id, [[num, nomeDaSkin], ...]] } }. Entrada torta é pulada; arquivo torto ou sem nenhuma
 * skin válida -> null. A `base` precisa ser https (a url de cada skin é base + id + "_" + num + ".jpg").
 */
export function lerSkins(j: unknown): SkinsMapa | null {
  if (typeof j !== 'object' || j === null) return null;
  const { base, itens } = j as { base?: unknown; itens?: unknown };
  if (typeof base !== 'string' || !/^https:\/\/[^\s"'<>]+\/$/.test(base) || typeof itens !== 'object' || itens === null) return null;
  const m: SkinsMapa = new Map();
  for (const [nome, v] of Object.entries(itens as Record<string, unknown>)) {
    if (!Array.isArray(v) || typeof v[0] !== 'string' || !/^[\w.-]+$/.test(v[0]) || !Array.isArray(v[1])) continue;
    const id = v[0];
    const skins: Skin[] = [];
    for (const s of v[1] as unknown[]) {
      if (!Array.isArray(s) || !Number.isSafeInteger(s[0]) || (s[0] as number) < 0 || typeof s[1] !== 'string' || !s[1]) continue;
      skins.push({ img: `${base}${id}_${s[0] as number}.jpg`, nome: s[1] });
    }
    if (skins.length) m.set(nome, skins);
  }
  return m.size ? m : null;
}

/** A skin do personagem pra esta semente (0 a 1); null se a franquia não tem skins ou o personagem não está na lista. */
export function skinDe(m: SkinsMapa | null | undefined, nome: string, semente: number): Skin | null {
  const skins = m?.get(nome);
  if (!skins?.length) return null;
  // outro pedaço da semente, pra a skin não andar junto com o ponto do recorte (que usa a semente direto)
  const x = (Math.abs(semente) * 7919) % 1;
  return skins[Math.min(skins.length - 1, Math.floor(x * skins.length))] ?? null;
}
