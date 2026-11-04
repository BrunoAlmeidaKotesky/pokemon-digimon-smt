// Conteúdo da Autobatalha: habilidades, traços e itens. O motor (src/autobatalha/combate) e a tela leem daqui.
// Regra de qual habilidade cada forma lança: docs/tft/autobatalha.md, "Set" (Ult e habilidade).
import { S, setCarregado } from '../dados';
import type { FormaDados, Habilidade, Lutador } from '../tipos';
import { GOLPE, HABILIDADES_CLASSE } from './habilidades-classe';
import { HABILIDADES_PROPRIAS } from './habilidades-proprias';
import { alvoDe } from './util';

export { GOLPE, HABILIDADES_CLASSE } from './habilidades-classe';
export { HABILIDADES_PROPRIAS } from './habilidades-proprias';
export {
  ALMAS_POR_ABATE, ATRIBUTO_PERSONA, CHANCE_RECRUTAR_SUJIMON, DEADLOCK_POR_10_ALMAS, JOGADA_DA_PARTIDA, TRACOS, contarTracos, nivelDoTraco,
  type TracoAtivo,
} from './tracos';
export { ESCUDO_HAOS, ITENS, MULT_COMPLETO, RECEITAS, combinar, ehComponente } from './itens';

/** Multiplicador da transformação (Mega, Gigantamax, Primal, Hisui, Paradox, 4ª forma do Digimon). */
export const MULT_TRANSFORMAR = 1.4;
/** Velocidade de ataque somada na transformação (fração). */
export const VEL_TRANSFORMAR = 0.15;
export const MANA_TRANSFORMAR = 80;

const cache = new Map<string, Habilidade>();

function nomeDaForma(id: string): string {
  if (setCarregado() && S().temForma(id)) return S().forma(id).nome;
  return id.slice(id.indexOf(':') + 1);
}

/** A ult de transformação pra virar a forma `alvo` (id = o da forma). */
export function transformacao(alvo: string): Habilidade {
  const nome = nomeDaForma(alvo);
  const chave = `transformar|${alvo}|${nome}`;
  let h = cache.get(chave);
  if (!h) {
    h = {
      id: alvo,
      nome: `Vira ${nome}`,
      texto: `Vira ${nome}: +40% de vida, dano, armadura e resistência e +15% de velocidade de ataque até o fim da luta.`,
      mana: MANA_TRANSFORMAR,
      lancar(ctx, eu) {
        ctx.visual('transformar', [eu], eu);
        ctx.transformar(eu, alvo, MULT_TRANSFORMAR);
        ctx.buff(eu, 'velAtaque', VEL_TRANSFORMAR);
      },
    };
    cache.set(chave, h);
  }
  return h;
}

/** Classes da forma que têm ult, na ordem do Catálogo. */
export function classesComUlt(forma: FormaDados): string[] {
  return forma.classes.filter(c => c in HABILIDADES_CLASSE);
}

/** Regra do LoL (com ou sem traço): na estrela 3, a cada 2 lançamentos a habilidade sai duas vezes. */
function comRegraLol(forma: FormaDados, base: Habilidade): Habilidade {
  if (forma.fr !== 'lol') return base;
  const chave = `lol|${base.id}`;
  let h = cache.get(chave);
  if (!h) {
    h = {
      ...base,
      texto: `${base.texto} Na estrela 3, a cada 2 lançamentos a habilidade sai duas vezes (regra do LoL).`,
      lancar(ctx, eu, alvo) {
        base.lancar(ctx, eu, alvo);
        if (eu.estrela !== 3) return;
        const n = (eu.memoria.lolLancamentos ?? 0) + 1;
        eu.memoria.lolLancamentos = n;
        if (n % 2 !== 0) return;
        ctx.texto(eu, 'Ultimate!');
        ctx.depois(0.3, () => { if (eu.vivo) base.lancar(ctx, eu, alvoDe(ctx, eu, alvo)); });
      },
    };
    cache.set(chave, h);
  }
  return h;
}

/** Habilidade que a forma lança. Regra: habilidade própria → a própria; forma não final (semUlt) → nada;
 *  transformação → virar a forma escolhida (ou a 1ª); forma que só existe por transformação → nada (já usou a ult);
 *  senão → a ult da classe escolhida (ou da 1ª classe com ult); sem classe com ult → Golpe. */
export function habilidadeDa(forma: FormaDados, escolha?: string): Habilidade | null {
  if (forma.habilidade) {
    const propria = HABILIDADES_PROPRIAS[forma.habilidade];
    if (propria) return comRegraLol(forma, propria);
  }
  if (forma.semUlt) return null;
  const alvos = forma.transforma ?? [];
  if (alvos.length) return transformacao(escolha && alvos.includes(escolha) ? escolha : alvos[0]!);
  if (forma.soUlt) return null;
  const classes = classesComUlt(forma);
  const c = escolha && classes.includes(escolha) ? escolha : classes[0];
  return comRegraLol(forma, c ? HABILIDADES_CLASSE[c]! : GOLPE);
}

/** Escolhas de ult da forma (a tela mostra quando há mais de uma): formas de transformação, ou as classes com ult. */
export function opcoesDeUlt(forma: FormaDados): { id: string; nome: string }[] {
  if ((forma.habilidade && forma.habilidade in HABILIDADES_PROPRIAS) || forma.semUlt) return [];
  const alvos = forma.transforma ?? [];
  if (alvos.length) return alvos.map(id => ({ id, nome: transformacao(id).nome }));
  if (forma.soUlt) return [];
  return classesComUlt(forma).map(c => ({ id: c, nome: HABILIDADES_CLASSE[c]!.nome }));
}

/** Atalho pro motor: a habilidade de um lutador, pela forma atual e pela ult escolhida na unidade. */
export function habilidadeDoLutador(u: Lutador): Habilidade | null {
  if (!setCarregado() || !S().temForma(u.forma)) return null;
  return habilidadeDa(S().forma(u.forma), u.unidade?.ult);
}
