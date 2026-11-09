// Atributos de combate: base pelo custo, multiplicador da estrela, ajuste do papel (a classe que define o jeito de
// lutar) e a soma dos bônus (itens, traços, buffs). Tabelas em docs/tft/autobatalha.md, seção "Atributos".
import { S } from '../dados';
import type { Atributos, CampeaoDados, Custo, Estrela, FormaDados, Habilidade, NomeAtributo, Origem, Unidade } from '../tipos';
import type { Conteudo } from './contrato';

interface BaseCusto { vida: number; dano: number; armadura: number; resist: number; velAtaque: number }

/** Estrela 1 de cada custo. */
export const BASE_POR_CUSTO: Record<Custo, BaseCusto> = {
  1: { vida: 450, dano: 42, armadura: 20, resist: 20, velAtaque: 0.65 },
  2: { vida: 600, dano: 50, armadura: 25, resist: 25, velAtaque: 0.7 },
  3: { vida: 750, dano: 63, armadura: 30, resist: 30, velAtaque: 0.75 },
  4: { vida: 910, dano: 80, armadura: 40, resist: 40, velAtaque: 0.8 },
  5: { vida: 1110, dano: 98, armadura: 50, resist: 50, velAtaque: 0.85 },
};

/** Quanto a estrela multiplica a vida e o dano. */
export const MULT_ESTRELA: Record<Estrela, { vida: number; dano: number }> = {
  1: { vida: 1, dano: 1 },
  2: { vida: 1.8, dano: 1.5 },
  3: { vida: 3.24, dano: 2.25 },
};

export const CRIT_CHANCE = 0.25;
export const CRIT_DANO = 1.4;

/** Ajuste do papel: multiplicadores de vida, dano e vel. ataque; pontos de armadura, resistência e crítico. */
export interface Papel {
  vida: number;
  dano: number;
  alcance: number;
  mana: number;
  manaInicial?: number;
  armadura?: number;
  resist?: number;
  crit?: number;
  velAtaque?: number;
}

export const PAPEIS: Record<string, Papel> = {
  tanque: { vida: 1.25, dano: 0.75, armadura: 20, resist: 20, alcance: 1, mana: 70 },
  porradeiro: { vida: 1.15, dano: 1.1, alcance: 1, mana: 70 },
  assassino: { vida: 1, dano: 1.2, crit: 0.15, alcance: 1, mana: 60 },
  atirador: { vida: 0.8, dano: 1, velAtaque: 1.1, alcance: 4, mana: 80 },
  dragao: { vida: 1.05, dano: 1.05, alcance: 2, mana: 80 },
  robo: { vida: 1, dano: 1, armadura: 15, alcance: 2, mana: 70 },
  anjo: { vida: 0.85, dano: 1, alcance: 3, mana: 80 },
  fadinhas: { vida: 0.9, dano: 0.95, alcance: 3, mana: 70 },
  safada: { vida: 1, dano: 1, alcance: 2, mana: 70 },
  temporais: { vida: 0.9, dano: 1, alcance: 3, mana: 90 },
  demoniacos: { vida: 1, dano: 1.05, alcance: 2, mana: 80 },
  'criaturinha-bizarra': { vida: 1.2, dano: 1.05, alcance: 1, mana: 70 },
  unicos: { vida: 1, dano: 1, alcance: 2, mana: 80 },
  // só elemento
  fogo: { vida: 1, dano: 1, alcance: 2, mana: 80 },
  agua: { vida: 1, dano: 1, alcance: 2, mana: 80 },
  vento: { vida: 1, dano: 1, velAtaque: 1.1, alcance: 2, mana: 80 },
  planta: { vida: 1, dano: 1, alcance: 2, mana: 80 },
  raio: { vida: 1, dano: 1, alcance: 3, mana: 80 },
  gelo: { vida: 1, dano: 1, alcance: 3, mana: 80 },
  terra: { vida: 1.1, dano: 1, alcance: 1, mana: 80 },
};
const PAPEL_PADRAO = 'unicos';

/** Ordem de prioridade: o papel é a primeira destas classes que a forma tem. */
export const ORDEM_PAPEIS: readonly string[] = [
  'tanque', 'porradeiro', 'assassino', 'atirador', 'dragao', 'robo', 'anjo', 'fadinhas', 'safada', 'temporais',
  'demoniacos', 'criaturinha-bizarra', 'unicos',
];
const ELEMENTOS: readonly string[] = ['fogo', 'agua', 'terra', 'vento', 'raio', 'gelo', 'planta'];

/** Id da classe que define o papel da forma: a de maior prioridade; sem nenhuma, o 1º elemento; sem classe, Únicos. */
export function papelDe(forma: FormaDados): string {
  for (const p of ORDEM_PAPEIS) if (forma.classes.includes(p)) return p;
  return forma.classes.find(c => ELEMENTOS.includes(c)) ?? PAPEL_PADRAO;
}

const papel = (id: string): Papel => PAPEIS[id] ?? PAPEIS[PAPEL_PADRAO]!;

/** Atributos da estrela pelo custo e pelo papel, sem bônus. */
export function atributosBase(custo: Custo, estrela: Estrela, idPapel: string): Atributos {
  const b = BASE_POR_CUSTO[custo], e = MULT_ESTRELA[estrela], p = papel(idPapel);
  return {
    vida: b.vida * e.vida * p.vida,
    dano: b.dano * e.dano * p.dano,
    armadura: b.armadura + (p.armadura ?? 0),
    resist: b.resist + (p.resist ?? 0),
    velAtaque: b.velAtaque * (p.velAtaque ?? 1),
    alcance: p.alcance,
    mana: p.mana,
    manaInicial: p.manaInicial ?? 0,
    critChance: CRIT_CHANCE + (p.crit ?? 0),
    critDano: CRIT_DANO,
    rouboVida: 0,
    desvio: 0,
    poder: 1,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Bônus: soma de tudo que mexe nos atributos. Nos ATRIBUTOS_EM_FRACAO o valor é fração do base (0.2 = +20%);
// nos outros, pontos.
// ---------------------------------------------------------------------------------------------------------------

export type Bonus = Record<NomeAtributo, number>;
export const NOMES_ATRIBUTOS: readonly NomeAtributo[] = [
  'vida', 'dano', 'armadura', 'resist', 'velAtaque', 'alcance', 'mana', 'manaInicial', 'critChance', 'critDano',
  'rouboVida', 'desvio', 'poder',
];

export const bonusZero = (): Bonus => ({
  vida: 0, dano: 0, armadura: 0, resist: 0, velAtaque: 0, alcance: 0, mana: 0, manaInicial: 0, critChance: 0,
  critDano: 0, rouboVida: 0, desvio: 0, poder: 0,
});

/** Soma `p` (vezes `fator`) em `b`. */
export function somarBonus(b: Bonus, p: Partial<Record<NomeAtributo, number>>, fator = 1): Bonus {
  for (const k of NOMES_ATRIBUTOS) {
    const v = p[k];
    if (v) b[k] += v * fator;
  }
  return b;
}

const limitar = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

/** Base + bônus. Fração (vida, dano, armadura, resist, velAtaque, poder) multiplica o base; o resto soma pontos. */
export function aplicarBonus(a: Atributos, b: Bonus): Atributos {
  return {
    vida: Math.max(1, a.vida * (1 + b.vida)),
    dano: Math.max(0, a.dano * (1 + b.dano)),
    armadura: a.armadura * (1 + b.armadura),
    resist: a.resist * (1 + b.resist),
    velAtaque: limitar(a.velAtaque * (1 + b.velAtaque), 0.2, 5),
    alcance: limitar(Math.round(a.alcance + b.alcance), 1, 8),
    mana: Math.max(10, a.mana + b.mana),
    manaInicial: Math.max(0, a.manaInicial + b.manaInicial),
    critChance: limitar(a.critChance + b.critChance, 0, 1),
    critDano: Math.max(1, a.critDano + b.critDano),
    rouboVida: limitar(a.rouboVida + b.rouboVida, 0, 1),
    desvio: limitar(a.desvio + b.desvio, 0, 0.9),
    poder: Math.max(0, a.poder * (1 + b.poder)),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Unidade do jogador
// ---------------------------------------------------------------------------------------------------------------

/** Forma que não lança nada (não final de Pokémon e Digimon): vida e dano a mais, por estrela, no lugar da
 *  habilidade (na estrela 2 as habilidades dos outros crescem, então o bônus também). */
// buff pedido pelo usuário em 04/11/2026 (era 20/25/25%; 22/28% na época). Em 09/11/2026 a ★2 foi pra 24%: somado ao
// bônus de evoluir, ★2 que só ataca chegava a 90% no rodízio (equilibrio.md, histórico).
export const BONUS_SEM_HABILIDADE: Record<Estrela, number> = { 1: 0.22, 2: 0.24, 3: 0.28 };

/** Vida e dano a mais por evoluir, por estrela, nas linhas de Pokémon e Digimon (pedido do usuário em 05/11/2026): a
 *  forma de cima é outro bicho, não a mesma carta mais forte. Solto da mesma origem (Mew não evolui) não ganha. */
export const BONUS_EVOLUCAO: Partial<Record<Origem, Record<Estrela, number>>> = {
  pokemon: { 1: 0, 2: 0.05, 3: 0.1 },
  digimon: { 1: 0, 2: 0.06, 3: 0.3 },
};
const bonusEvolucao = (c: CampeaoDados, e: Estrela): number => (c.niveis.length > 1 ? BONUS_EVOLUCAO[c.fr]?.[e] ?? 0 : 0);

/** Quem luta de perto na obra, apesar de o papel dar alcance (o usuário achou gente demais de longe, 05/11/2026): quem
 *  bate, morde ou corta no contato. Quem tem ataque de longe de verdade (sopro, tiro, magia) fica com o do papel. */
const CORPO_A_CORPO: Readonly<Record<string, readonly string[]>> = {
  pokemon: [
    // mordida e garra
    'Totodile', 'Croconaw', 'Carvanha', 'Sharpedo', 'Mega Sharpedo', 'Deino', 'Zweilous', 'Gible', 'Gabite', 'Zygarde (10%)',
    'Shinx', 'Luxio', 'Luxray', 'Eevee', 'Flareon', 'Litten', 'Torracat',
    // brigões e quem corta com a lâmina
    'Mudkip', 'Marshtomp', 'Swampert', 'Mega Swampert', 'Oshawott', 'Dewott', 'Samurott', 'Hisuian Samurott',
    'Treecko', 'Grovyle', 'Sceptile', 'Mega Sceptile', 'Torchic', 'Combusken', 'Chimchar', 'Tepig', 'Slither Wing',
    'Gouging Fire', 'Dratini', 'Dragonair', 'Dragonite', 'Mega Dragonite', 'Mega Mewtwo X',
    // chute, bicada e corpo
    'Buneary', 'Lopunny', 'Mega Lopunny', 'Bounsweet', 'Steenee', 'Tsareena', 'Rookidee', 'Corvisquire', 'Corviknight',
    'Gigantamax Corviknight', 'Dunsparce', 'Dudunsparce', 'Turtwig', 'Chespin', 'Quilladin', 'Piplup', 'Prinplup', 'Wailmer',
  ],
  digimon: ['Punimon', 'Devimon', 'Neo Devimon', 'Fantomon', 'Plotmon', 'Tailmon', 'Saber Leomon', 'War Greymon'],
  smt: ['Abaddon', 'Bugs', 'Cironnup', 'Melchizedek', 'Niddhoggr'],
  // humanoides de curto alcance na obra, o navio e a tartaruga
  jojo: ['Gold Experience', 'Gold Experience Requiem', 'Made in Heaven', 'Strength', 'Mr.President'],
  ygo: ['Kuriboh', 'Clockwork Knight'],
  // corpo a corpo no próprio LoL
  lol: ['Aatrox', 'Akali', 'Blitzcrank', 'Ekko'],
  // pedido do usuário em 04/11/2026: a Baba Yaga bate de perto
  deadlock: ['Baba'],
  // brigões de rua, quem luta com o taco e as máquinas de obra
  sujimon: [
    'City Slicker', 'Grease Monk', 'Pornogra-Pharoah', 'Chucklehead', 'Warhead', "Death's-head", 'Masked Demonling', 'Profaner Demon',
    'Weeping Archdemon', 'Escapist', 'Baseball Diehard', 'Massacre Mascot', 'Heavy Machinery',
    'Legendary Excavators ft. Lam-chan & Lun-chan',
  ],
};

/** Alcance próprio de uma forma, quando o do papel não combina com o personagem (id da forma → casas). */
export const ALCANCE_PROPRIO: Readonly<Record<string, number>> = Object.fromEntries(
  Object.entries(CORPO_A_CORPO).flatMap(([fr, nomes]) => nomes.map(nome => [`${fr}:${nome}`, 1] as const)),
);

/** Multiplicador de vida mínimo de quem o papel deixava de longe e luta de perto (o do Porradeiro): sem o alcance, ele
 *  toma os golpes da frente, e papel de trás (Anjo, Fadinhas) tem vida de quem fica atrás. */
export const VIDA_DE_PERTO = 1.15;

/** Casas de alcance da forma: o próprio, se tiver; senão, o do papel. */
export const alcanceDaForma = (f: FormaDados): number => ALCANCE_PROPRIO[f.id] ?? papel(papelDe(f)).alcance;

/** Base da unidade (custo + estrela + papel); a habilidade, quando tem, define a mana (e a inicial, se disser). Sem
 *  habilidade, ganha BONUS_SEM_HABILIDADE de vida e dano. */
export function baseDaUnidade(u: Unidade, hab: Habilidade | null): Atributos {
  const s = S();
  const forma = s.forma(u.forma);
  const idPapel = papelDe(forma);
  const c = s.campeao(u.campeao);
  const at = atributosBase(c.custo, u.estrela, idPapel);
  at.vida *= 1 + bonusEvolucao(c, u.estrela);
  at.dano *= 1 + bonusEvolucao(c, u.estrela);
  const alcance = alcanceDaForma(forma);
  if (alcance < at.alcance) {
    at.vida *= Math.max(1, VIDA_DE_PERTO / papel(idPapel).vida);
    at.alcance = alcance;
  }
  if (hab) {
    at.mana = hab.mana;
    if (hab.manaInicial !== undefined) at.manaInicial = hab.manaInicial;
  } else {
    at.vida *= 1 + BONUS_SEM_HABILIDADE[u.estrela];
    at.dano *= 1 + BONUS_SEM_HABILIDADE[u.estrela];
  }
  return at;
}

/** Bônus da unidade fora da luta: os permanentes da partida (Unidade.bonus) e os itens. */
export function bonusDaUnidade(u: Unidade, c: Pick<Conteudo, 'ITENS'>): Bonus {
  const b = bonusZero();
  b.vida += u.bonus?.vida ?? 0;
  b.dano += u.bonus?.dano ?? 0;
  for (const id of u.itens) {
    const item = c.ITENS[id];
    if (item) somarBonus(b, item.atributos);
  }
  return b;
}

/** O que o tooltip mostra: base + estrela + papel + Unidade.bonus + itens (sem traços). */
export function atributosDaUnidadeCom(u: Unidade, c: Pick<Conteudo, 'ITENS' | 'habilidadeDa'>): Atributos {
  const hab = c.habilidadeDa(S().forma(u.forma), u.ult);
  return aplicarBonus(baseDaUnidade(u, hab), bonusDaUnidade(u, c));
}
