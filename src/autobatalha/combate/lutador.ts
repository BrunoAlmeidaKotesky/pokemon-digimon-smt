// Lutador em luta: o estado que o motor muda a cada passo, exposto ao conteúdo pela interface Lutador.
import type { Atributos, Casa, Custo, Estrela, Habilidade, Item, Lado, Lutador, NomeAtributo, Origem, Status, Traco, Unidade } from '../tipos';
import { aplicarBonus, type Bonus } from './atributos';

/** Id do lutador na luta: `${lado}:${EntradaLutador.id}` ("a:12", "b:m0"), porque os dois times podem repetir ids
 *  (fantasma é cópia de outro tabuleiro; monstros são sempre "m0", "m1"...). Invocado: `${id do dono}~inv${n}`. */
export const idLuta = (lado: Lado, id: string) => `${lado}:${id}`;

/** Desfaz um id da luta: lado, id da entrada (do dono, no invocado) e se é invocado. */
export function separarId(id: string): { lado: Lado; id: string; invocado: boolean } {
  const lado: Lado = id.startsWith('b:') ? 'b' : 'a';
  const resto = id.slice(2);
  const k = resto.indexOf('~');
  return { lado, id: k < 0 ? resto : resto.slice(0, k), invocado: k >= 0 };
}

/** Um traço ativo num lado, com quem recebe os ganchos. */
export interface TracoNoLado { traco: Traco; id: string; nivel: number; lado: Lado; membros: LutadorInterno[] }

export interface EstadoStatus { fim: number; valor: number; fonte: LutadorInterno | null }
export interface Relogio { readonly t: number }

export interface DadosLutador {
  id: string;
  lado: Lado;
  forma: string;
  campeao: string;
  fr: Origem | 'ff';
  classes: readonly string[];
  estrela: Estrela;
  custo: Custo;
  nome: string;
  img: string;
  papel: string;
  base: Atributos;
  bonus: Bonus;
  habilidade: Habilidade | null;
  itens: Item[];
  unidade: Unidade | null;
  stand: boolean;
  invocado: boolean;
  monstro: boolean;
  chefe: boolean;
}

const TODOS_STATUS: readonly Status[] = [
  'atordoado', 'lento', 'queimando', 'provocado', 'semMana', 'intocavel', 'vulneravel', 'fraco', 'refletir', 'semCura', 'invulneravel',
];

export class LutadorInterno implements Lutador {
  readonly id: string;
  readonly lado: Lado;
  forma: string;
  readonly campeao: string;
  readonly fr: Origem | 'ff';
  classes: readonly string[];
  readonly estrela: Estrela;
  readonly custo: Custo;
  readonly stand: boolean;
  readonly invocado: boolean;
  readonly unidade: Unidade | null;
  readonly memoria: Record<string, number> = {};
  vivo = true;
  vida = 0;
  mana = 0;
  lancamentos = 0;
  usuario: LutadorInterno | null = null;
  standDele: LutadorInterno | null = null;
  casa: Casa;
  at: Atributos;

  // ---- só do motor ----
  /** índice da casa: lin * COLUNAS + col */
  idx: number;
  nome: string;
  img: string;
  readonly papel: string;
  readonly monstro: boolean;
  readonly chefe: boolean;
  /** atributos sem bônus (a transformação multiplica estes) */
  readonly base: Atributos;
  /** soma dos bônus (itens, traços, buffs); regra de ATRIBUTOS_EM_FRACAO */
  readonly bonus: Bonus;
  habilidade: Habilidade | null;
  readonly itens: Item[];
  tracos: TracoNoLado[] = [];
  escudos: { valor: number; fim: number }[] = [];
  buffs: { atributo: NomeAtributo; valor: number; fim: number }[] = [];
  st: Partial<Record<Status, EstadoStatus>> = {};
  alvo: LutadorInterno | null = null;
  /** carga até o próximo ataque (ataca ao chegar em 1) */
  accAtaque = 0.5;
  /** carga até o próximo passo (anda ao chegar em 0,5 s; começa em 0,4 pra andar já no 1º passo) */
  accPasso = 0.4;
  nInvocados = 0;
  /** últimos [vidaMax, manaMax] mandados pra tela */
  maxVisto: [number, number] = [0, 0];

  constructor(private readonly relogio: Relogio, d: DadosLutador, casa: Casa, idx: number) {
    this.id = d.id;
    this.lado = d.lado;
    this.forma = d.forma;
    this.campeao = d.campeao;
    this.fr = d.fr;
    this.classes = d.classes;
    this.estrela = d.estrela;
    this.custo = d.custo;
    this.nome = d.nome;
    this.img = d.img;
    this.papel = d.papel;
    this.base = d.base;
    this.bonus = d.bonus;
    this.habilidade = d.habilidade;
    this.itens = d.itens;
    this.unidade = d.unidade;
    this.stand = d.stand;
    this.invocado = d.invocado;
    this.monstro = d.monstro;
    this.chefe = d.chefe;
    this.casa = casa;
    this.idx = idx;
    this.at = aplicarBonus(d.base, d.bonus);
  }

  get escudo(): number {
    let s = 0;
    for (const e of this.escudos) if (e.fim > this.relogio.t) s += e.valor;
    return s;
  }

  temStatus(s: Status): boolean {
    const e = this.st[s];
    return e !== undefined && e.fim > this.relogio.t;
  }

  /** valor do status ativo (0 se não tem) */
  valorStatus(s: Status): number {
    const e = this.st[s];
    return e !== undefined && e.fim > this.relogio.t ? e.valor : 0;
  }

  statusAtivos(): Status[] {
    const out: Status[] = [];
    for (const s of TODOS_STATUS) if (this.temStatus(s)) out.push(s);
    return out;
  }

  recalcular(): void {
    this.at = aplicarBonus(this.base, this.bonus);
  }

  /** escudos absorvem `v` (os que acabam antes primeiro); devolve o que sobrou pra vida */
  absorver(v: number): number {
    if (!this.escudos.length) return v;
    this.escudos.sort((p, q) => p.fim - q.fim);
    for (const e of this.escudos) {
      if (v <= 0) break;
      if (e.fim <= this.relogio.t) continue;
      const tirado = Math.min(e.valor, v);
      e.valor -= tirado;
      v -= tirado;
    }
    return v;
  }
}
