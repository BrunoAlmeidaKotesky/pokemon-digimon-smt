// Motor de combate da Autobatalha ligado ao conteúdo de verdade (src/autobatalha/conteudo). Os testes usam
// simularLutaCom (motor.ts) com um conteúdo falso.
import * as conteudo from '../conteudo';
import type { Atributos, SimularLuta, Unidade } from '../tipos';
import { atributosDaUnidadeCom } from './atributos';
import type { Conteudo } from './contrato';
import { simularLutaCom, type RegrasMotor } from './motor';

// namespace: as propriedades só são lidas na hora da luta (seguro mesmo se o conteúdo importar daqui)
const C: Conteudo = conteudo;

/** O conteúdo já aplica o poder nas habilidades (util.ts: bater, curarH, escudoH), a regra do LoL ★3 (comRegraLol)
 *  e o +15% de vel. ataque da transformação (transformacao): o motor não repete, senão conta duas vezes. Pra passar
 *  uma delas pro motor, ligue aqui e tire do conteúdo. */
export const REGRAS: RegrasMotor = { poder: false, lolDobrado: false, velTransformar: false };

/** Roda uma luta: lado A = time `a` (embaixo), lado B = time `b` espelhado em cima. */
export const simularLuta: SimularLuta = (a, b, semente, gravar) => simularLutaCom(C, a, b, semente, gravar, REGRAS);

/** O que o tooltip mostra: base do custo + estrela + papel + Unidade.bonus + itens (sem traços). */
export function atributosDaUnidade(u: Unidade): Atributos {
  return atributosDaUnidadeCom(u, C);
}

export {
  BASE_POR_CUSTO, CRIT_CHANCE, CRIT_DANO, MULT_ESTRELA, ORDEM_PAPEIS, PAPEIS, atributosBase, papelDe, type Papel,
} from './atributos';
export { HABILIDADE_CHEFE } from './chefe';
export type { Conteudo, TracoAtivo } from './contrato';
export { idLuta, separarId } from './lutador';
export {
  DURACAO_MAX, PASSO, REGRAS_TODAS, simularLutaCom, type FonteMana, type ObservadorLuta, type RegrasMotor,
} from './motor';
