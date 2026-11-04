// O que o motor usa do conteúdo (src/autobatalha/conteudo): habilidades, traços e itens. O motor recebe isto como
// parâmetro (os testes injetam um conteúdo falso); index.ts liga o conteúdo de verdade.
import type { FormaDados, Habilidade, Item, Passiva, Traco } from '../tipos';

/** Traço contado num time: `n` campeões diferentes, `nivel` = índice do degrau ativo (-1 = nenhum). */
export interface TracoAtivo { id: string; n: number; nivel: number }

export interface Conteudo {
  /** habilidade da forma (semUlt, transformação, própria ou da classe escolhida); null = não lança */
  habilidadeDa(forma: FormaDados, escolha?: string): Habilidade | null;
  readonly TRACOS: Readonly<Record<string, Traco>>;
  contarTracos(unidades: { campeao: string; forma: string }[]): TracoAtivo[];
  readonly ITENS: Readonly<Record<string, Item>>;
  /** passiva do campeão (id de CampeaoDados), quando tem */
  passivaDe?(campeao: string): Passiva | undefined;
}
