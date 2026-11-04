// Monstros do Final Fantasy das rodadas de monstros (1-1 a 1-3, x-7). Sorteados a cada partida de S().dados.ff
// (chefe só da categoria Chefe), com atributos que crescem com o estágio.
//
// Fórmulas (os números ficam em CALIBRAGEM, embaixo):
//   comum no estágio 1, rodada r: vida 190 + 60r (250 / 310 / 370), dano 22 + 6r (28 / 34 / 40), armadura e
//     resistência 10, 0,6 ataque/s; 2, 3 e 4 monstros na 1-1, 1-2 e 1-3
//   comum do estágio e ≥ 2 (4 no 2-7; escolta do chefe): vida 1000 × 1,45^(e−2), dano 66 × 1,35^(e−2), armadura e
//     resistência 15 + 10(e−2), 0,65 ataque/s
//   chefe (3-7 em diante): vida 4000 × 1,4^(e−3), dano 260 × 1,4^(e−3), armadura e resistência 40 + 10(e−3),
//     0,75 ataque/s, 15% de crítico (o motor dá a ele a Pancada do Chefe: 200% em área e atordoa)
//   escolta do chefe: 2 (estágio 3), 3 (4 e 5), 4 (6 em diante)
// Calibrado em 04/11/2026 com o motor e o conteúdo de verdade e o set1.json, em 40 partidas de 8 bots (o time que
// cada bot monta faz o papel do time normal daquele ponto). Vitória contra os monstros (e unidades que sobrevivem):
//   1-1 100% (100%), 1-2 100% (95%), 1-3 100% (93%), 2-7 98% (90%)
//   chefe: 3-7 61% (35%; 12% das lutas vão até os 30 s), 4-7 69% (37%), 5-7 25% (só 8 lutas: as partidas de bots
//   costumam acabar no estágio 5)
// Pra recalibrar: jogar partidas de bots com o motor de verdade e medir de novo; número maior = monstro mais forte.
import type { Rng } from '../rng';
import { S } from '../dados';
import type { Atributos, CasaDono, MonstroDados, MonstroRodada, TipoRodada } from '../tipos';

/** quantos monstros comuns em cada rodada de monstros comuns */
export function quantosComuns(estagio: number, rodada: number): number {
  if (estagio <= 1) return ([2, 3, 4] as const)[rodada - 1] ?? 4;
  return 4;
}
export const quantosEscolta = (estagio: number): number => (estagio <= 3 ? 2 : estagio <= 5 ? 3 : 4);

const base = (vida: number, dano: number, defesa: number, velAtaque: number): Atributos => ({
  vida: Math.round(vida), dano: Math.round(dano), armadura: Math.round(defesa), resist: Math.round(defesa),
  velAtaque, alcance: 1, mana: 100, manaInicial: 0, critChance: 0.1, critDano: 1.4, rouboVida: 0, desvio: 0, poder: 1,
});

/** Os números da calibragem (fórmulas no comentário do topo). */
export interface Escala { vida: number; dano: number; defesa: number; vel: number; cresceVida: number; cresceDano: number; cresceDefesa: number }
export const CALIBRAGEM: { estagio1: Escala; comum: Escala; chefe: Escala } = {
  /** estágio 1: vida = vida + cresceVida × rodada (idem dano), sem crescer a defesa */
  estagio1: { vida: 190, dano: 22, defesa: 10, vel: 0.6, cresceVida: 60, cresceDano: 6, cresceDefesa: 0 },
  /** do estágio 2 em diante: vida × cresceVida^(estágio − 2), dano × cresceDano^(…), defesa + cresceDefesa × (…) */
  comum: { vida: 1000, dano: 66, defesa: 15, vel: 0.65, cresceVida: 1.45, cresceDano: 1.35, cresceDefesa: 10 },
  /** chefe: igual ao comum, contando do estágio 3 */
  chefe: { vida: 4000, dano: 260, defesa: 40, vel: 0.75, cresceVida: 1.4, cresceDano: 1.4, cresceDefesa: 10 },
};

/** Atributos do monstro comum (também a escolta do chefe). */
export function atributosComum(estagio: number, rodada: number): Atributos {
  if (estagio <= 1) {
    const e = CALIBRAGEM.estagio1;
    return base(e.vida + e.cresceVida * rodada, e.dano + e.cresceDano * rodada, e.defesa, e.vel);
  }
  const c = CALIBRAGEM.comum, k = estagio - 2;
  return base(c.vida * c.cresceVida ** k, c.dano * c.cresceDano ** k, c.defesa + c.cresceDefesa * k, c.vel);
}

/** Atributos do chefe (estágio 3 em diante). */
export function atributosChefe(estagio: number): Atributos {
  const c = CALIBRAGEM.chefe, k = Math.max(0, estagio - 3);
  return { ...base(c.vida * c.cresceVida ** k, c.dano * c.cresceDano ** k, c.defesa + c.cresceDefesa * k, c.vel), critChance: 0.15 };
}

const RESERVA: MonstroDados = { nome: 'Monstro', jogo: 'Final Fantasy', img: '' };

/** Monstros pro estágio: no 1, os de nível mais baixo (metade de baixo, quando o set tem o nível); depois, todos. */
function candidatos(estagio: number): MonstroDados[] {
  const todos = S().dados.ff.inimigos;
  if (!todos.length) return [RESERVA];
  const comNivel = todos.filter(m => m.nivel != null).sort((a, b) => a.nivel! - b.nivel!);
  if (estagio <= 1 && comNivel.length >= 8) return comNivel.slice(0, Math.ceil(comNivel.length / 2));
  return todos;
}

const sortearVarios = (xs: MonstroDados[], n: number, rng: Rng): MonstroDados[] => {
  const out = rng.sortear(xs, n);
  while (out.length < n) out.push(xs[rng.int(xs.length)]!);
  return out;
};

/** casas da linha da frente, do meio pras bordas (metade do lado B; linha 0 = frente) */
const FRENTE: CasaDono[] = [3, 4, 2, 5, 1, 6, 0, 7].map(col => ({ col, lin: 0 }));
const SEGUNDA: CasaDono[] = [3, 4, 2, 5, 1, 6, 0, 7].map(col => ({ col, lin: 1 }));

/** Monstros da rodada (vazio em rodada contra jogadores). */
export function gerarMonstros(estagio: number, rodada: number, tipo: TipoRodada, rng: Rng): MonstroRodada[] {
  if (tipo === 'pvp') return [];
  if (tipo === 'monstros') {
    const n = quantosComuns(estagio, rodada);
    const at = atributosComum(estagio, rodada);
    return sortearVarios(candidatos(estagio), n, rng).map((monstro, i) => ({
      monstro, chefe: false, casa: [...FRENTE, ...SEGUNDA][i]!, atributos: { ...at },
    }));
  }
  const chefes = S().dados.ff.chefes;
  const chefe = chefes.length ? chefes[rng.int(chefes.length)]! : sortearVarios(candidatos(estagio), 1, rng)[0]!;
  const escolta = sortearVarios(candidatos(estagio), quantosEscolta(estagio), rng);
  const at = atributosComum(estagio, rodada);
  return [
    { monstro: chefe, chefe: true, casa: { col: 3, lin: 1 }, atributos: atributosChefe(estagio) },
    ...escolta.map((monstro, i) => ({ monstro, chefe: false, casa: FRENTE[i]!, atributos: { ...at } })),
  ];
}
