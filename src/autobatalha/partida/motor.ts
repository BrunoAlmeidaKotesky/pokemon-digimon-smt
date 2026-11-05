// O que a partida usa do motor de combate (src/autobatalha/combate) e do conteúdo (src/autobatalha/conteudo).
// A partida não importa esses módulos direto: o controle (src/autobatalha/controle.ts) liga os de verdade com
// definirMotor() e os testes ligam falsos. Assim a lógica da partida roda e testa sozinha.
import { COMPONENTES, type Atributos, type Componente, type SimularLuta, type Unidade } from '../tipos';

/** Traço ativo como o conteúdo conta: nivel = índice do degrau ativo (-1 = nenhum). */
export interface TracoContado { id: string; n: number; nivel: number }

export interface MotorPartida {
  simularLuta: SimularLuta;
  atributosDaUnidade(u: Unidade): Atributos;
  contarTracos(unidades: { campeao: string; forma: string }[]): TracoContado[];
  /** id do Bakugan completo feito de dois componentes */
  combinar(a: Componente, b: Componente): string;
  ehComponente(id: string): id is Componente;
  /** Stands que não ocupam vaga no tabuleiro, pelo nível (a regra da partida; o playtest liga outras pra comparar) */
  standsForaDaVaga(nivel: number): number;
}

const faltando = (nome: string) => () => {
  throw new Error(`Autobatalha: ${nome} não foi ligado (chame definirMotor no controle)`);
};

/** combinar e ehComponente seguem a regra de tipos.ts (`${a}+${b}` na ordem de COMPONENTES) até o conteúdo ligar
 *  os dele; simularLuta, atributosDaUnidade e contarTracos precisam ser ligados. */
const padrao: MotorPartida = {
  simularLuta: faltando('simularLuta'),
  atributosDaUnidade: faltando('atributosDaUnidade'),
  contarTracos: faltando('contarTracos'),
  combinar(a, b) {
    const [x, y] = COMPONENTES.indexOf(a) <= COMPONENTES.indexOf(b) ? [a, b] : [b, a];
    return `${x}+${y}`;
  },
  ehComponente: (id): id is Componente => (COMPONENTES as readonly string[]).includes(id),
  standsForaDaVaga: () => Infinity,
};

let atual: MotorPartida = { ...padrao };
let ligado = false;

/** Liga o motor e o conteúdo (o que não vier fica como estava). */
export function definirMotor(m: Partial<MotorPartida>): void {
  atual = { ...atual, ...m };
  if (m.simularLuta) ligado = true;
}
/** Volta pro estado inicial (testes). */
export function limparMotor(): void { atual = { ...padrao }; ligado = false; }
export function motorLigado(): boolean { return ligado; }
export function M(): MotorPartida { return atual; }

/** Alcance da unidade pelo motor; sem motor ligado (ou forma estranha), 1. */
export function alcanceDe(u: Unidade): number {
  try { return M().atributosDaUnidade(u).alcance; } catch { return 1; }
}

/** Degrau ativo de um traço (-1 = desligado) entre as unidades dadas. */
export function nivelTraco(unidades: { campeao: string; forma: string }[], traco: string): number {
  try {
    return M().contarTracos(unidades).find(t => t.id === traco)?.nivel ?? -1;
  } catch { return -1; }
}
