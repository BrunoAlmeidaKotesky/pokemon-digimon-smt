// Franquias customizadas: grupos de imagens que a pessoa cria na hora (só durante a sessão, nada é salvo).

/** Uma imagem da franquia, já reduzida e convertida em data URL (image/webp ou image/jpeg). */
export interface CustomItem {
  /** id estável dentro da franquia */
  id: string;
  /** rótulo (nome do personagem) */
  name: string;
  /** data URL da imagem reduzida */
  data: string;
}

export interface CustomFranchise {
  /** chave única, sempre começando com 'c-' (ex.: 'c-k3x9a2'); vira a chave da franquia no site */
  key: string;
  /** nome do grupo (rótulo da franquia) */
  label: string;
  /** cor da franquia (#rrggbb), escolhida de uma paleta */
  color: string;
  items: CustomItem[];
}

/** Prefixo das imagens customizadas dentro de Item.img: `cst:<chave da franquia>/<id do item>`. */
export const CUSTOM_IMG_PREFIX = 'cst:';
export const CUSTOM_KEY_PREFIX = 'c-';

/** Limites (validação local e de quem manda pela rede). */
export const CUSTOM_LIMITS = {
  /** franquias customizadas por pessoa/sala */
  franchises: 8,
  /** imagens por franquia */
  items: 200,
  /** tamanho do rótulo (nome da franquia ou do personagem) */
  label: 40,
  /** maior lado da imagem reduzida (px) */
  side: 512,
  /** tamanho máximo de uma data URL aceita (caracteres) */
  dataChars: 400_000,
} as const;

/** Alterações que um jogador pode pedir ao host (se o host permitir). */
export type CustomOp =
  | { op: 'add'; key: string; items: { name: string; data: string }[] }
  | { op: 'label'; key: string; id: string; name: string };
