// Passivas de campeão (poucos têm): ganchos como os de item, que o motor roda no lutador do campeão. Por enquanto, os
// que derrubam ouro no chão durante a luta (a moeda fica no tabuleiro até o jogador passar o mouse em cima; o bot
// recolhe na hora). Regra comum: ao lançar a habilidade e no golpe que derruba um inimigo, chance de derrubar 1 de
// ouro, até um teto por luta que sobe com a estrela. Calibrada no playtest (docs/tft/matematica/equilibrio.md, seção
// "Ouro no chão") pra dar perto de 1 de ouro por luta por campeão desses.
import type { Contexto, Lutador, Passiva, PorEstrela } from '../tipos';
import { pct } from './util';

/** Chance de derrubar 1 de ouro ao lançar a habilidade. */
export const CHANCE_MOEDA_LANCAR = 0.5;
/** Chance de derrubar 1 de ouro no golpe que derruba um inimigo. */
export const CHANCE_MOEDA_ABATE = 0.5;
/** Chance por ataque do Numemon (as formas não finais dele não lançam nada). */
export const CHANCE_MOEDA_ATAQUE_NUMEMON = 0.06;
/** No máximo, por luta, na estrela 1 / 2 / 3. */
export const TETO_MOEDAS: PorEstrela = [2, 3, 4];

/** Moedas que cada lutador já derrubou nesta luta (os lutadores são novos a cada luta). */
const derrubadas = new WeakMap<Lutador, number>();

function derrubar(ctx: Contexto, p: Lutador, chance: number): void {
  const n = derrubadas.get(p) ?? 0;
  if (n >= (TETO_MOEDAS[p.estrela - 1] ?? TETO_MOEDAS[0]) || !ctx.chance(chance)) return;
  derrubadas.set(p, n + 1);
  ctx.moeda(p.lado, 1, p);
  ctx.texto(p, '+1 ouro');
}

const REGRA = `Ao lançar a habilidade, ${pct(CHANCE_MOEDA_LANCAR)} de chance, e no golpe que derruba um inimigo, ` +
  `${pct(CHANCE_MOEDA_ABATE)}, de derrubar 1 de ouro no chão (até ${TETO_MOEDAS.join('/')} por luta, pela estrela).`;

/** Passiva de ouro no chão, com nome e o começo do texto de cada campeão; `chanceAtaque` = chance a mais em cada
 *  ataque básico (pra quem quase não lança). */
function ouroNoChao(nome: string, comeco: string, chanceAtaque = 0): Passiva {
  const ataque = chanceAtaque > 0 ? ` Também ${pct(chanceAtaque)} de chance a cada ataque.` : '';
  return {
    nome,
    texto: `${comeco} ${REGRA}${ataque}`,
    ...(chanceAtaque > 0 ? {
      aoAtacar(ctx: Contexto, p: Lutador, de: Lutador) { if (de === p && p.vivo) derrubar(ctx, p, chanceAtaque); },
    } : {}),
    aoLancar(ctx, p, u) {
      if (u === p && p.vivo) derrubar(ctx, p, CHANCE_MOEDA_LANCAR);
    },
    // roda nos itens de quem morreu e nos de quem matou: só vale o abate de um inimigo por este portador
    aoMorrer(ctx, p, morto, abatedor) {
      if (abatedor === p && morto.lado !== p.lado && p.vivo) derrubar(ctx, p, CHANCE_MOEDA_ABATE);
    },
  };
}

/** Passivas pelo id do campeão (CampeaoDados.id). */
export const PASSIVAS: Record<string, Passiva> = {
  'jojo:harvest': ouroNoChao('Achados', 'os Harvests vasculham o chão atrás de moedas.'),
  'sujimon:pro-pickpocket': ouroNoChao('Mão Leve', 'bate a carteira de quem passa por perto.'),
  'sujimon:pseudotrash': ouroNoChao('Catador', 'acha valor no lixo dos outros.'),
  'digimon:nova-linha': ouroNoChao('Ouro de Numemon', 'onde passa, sobra ouro (de verdade, desta vez).',
    CHANCE_MOEDA_ATAQUE_NUMEMON),
  'deadlock:rat-king': ouroNoChao('Tesouro do Rei Rato', 'os ratos trazem moedas dos esgotos.'),
};

/** Passiva do campeão (nome e texto pra tela; ganchos pro motor). */
export function passivaDe(campeao: string): Passiva | undefined {
  return PASSIVAS[campeao];
}

/** Frase da passiva pro tooltip ("Passiva — Achados: …"), ou undefined. */
export function textoPassiva(campeao: string): string | undefined {
  const p = PASSIVAS[campeao];
  return p && `Passiva — ${p.nome}: ${p.texto}`;
}
