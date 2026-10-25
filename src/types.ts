// Tipos compartilhados entre fontes, lógica pura e telas.

/** Chave de franquia ('pokemon', 'digimon', 'smt', 'persona', 'jojo', 'ygo', 'bakugan', 'lol', 'overwatch', 'deadlock', 'ff', 'sujimon'). */
export type FranchiseKey = string;

/** Personagem como vem da fonte. `img` vazio = sem imagem; `href` = detalhe que resolve() consulta (Digimon). */
export interface Item {
  name: string;
  img: string;
  href?: string;
}

/** Personagem já com a franquia. `k` é um id estável opcional (usado quando o objeto atravessa a rede). */
export interface Entry extends Item {
  fr: FranchiseKey;
  k?: string;
}

/** Uma franquia: rótulo, carga assíncrona e, se houver, a lista que já existe sem rede (SMT). */
export interface Source {
  key: FranchiseKey;
  label: string;
  load(): Promise<Item[]>;
  /** lista pronta na hora (sem "carregando") */
  initial?: Item[];
  /** se a carga falhar, a franquia some de tudo (Sujimon) em vez de mostrar "falhou" */
  optional?: boolean;
}

export interface Stats {
  w: Record<string, number>;
  n: Record<string, number>;
  hist: string[];
  best: { name: string; fr: FranchiseKey; streak: number } | null;
}

export interface Match {
  a: Entry | null;
  b: Entry | null;
  w: Entry | null;
}

/** Estado de um campeonato (mesma forma do `cup` do site antigo). */
export interface Cup {
  round: Entry[];
  next: Entry[];
  i: number;
  rounds: Match[][];
  losers: Record<number, Entry[]>;
  champ: Entry | null;
  mix: boolean;
}
