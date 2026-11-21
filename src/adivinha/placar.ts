// Progresso do desafio do dia e estatísticas da aba Adivinha, guardados em pdx-adivinha-v1 (chave nova, só desta
// aba). Funções puras sobre o objeto salvo; quem lê e grava no localStorage é solo.ts.
import { GRUPOS, isSubmodo, type Submodo } from './grupos';
import { diaAnterior } from './dia';

export const ADIVINHA_KEY = 'pdx-adivinha-v1';

export type Rodada = 'dia' | 'livre';
/** O desafio de hoje de uma franquia e submodo: quem é (fica o mesmo o dia todo), os chutes e se acertou. */
export interface DiaSalvo {
  data: string;
  alvo: string;
  chutes: string[];
  acertou: boolean;
}
/** Desafios do dia resolvidos: quantos, soma dos chutes, sequência de dias seguidos (e a maior) e o último dia. */
export interface Estat {
  jogos: number;
  chutes: number;
  seq: number;
  melhor: number;
  ultimo: string;
}
export interface Salvo {
  dia: Record<string, DiaSalvo>;
  stats: Record<string, Estat>;
  /** última escolha da tela (franquia, submodo, do dia ou livre) */
  cfg: { grupo: string; submodo: Submodo; rodada: Rodada } | null;
}

export const chaveDe = (grupo: string, sub: Submodo) => `${grupo}:${sub}`;
export const vazio = (): Salvo => ({ dia: {}, stats: {}, cfg: null });

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isData = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const nat = (x: unknown) => (typeof x === 'number' && Number.isSafeInteger(x) && x >= 0 ? x : 0);

/** Lê o que estava salvo, descartando o que não tiver o formato certo (nada lança). */
export function lerSalvo(raw: unknown): Salvo {
  const s = vazio();
  if (!isObj(raw)) return s;
  if (isObj(raw.dia)) {
    for (const [k, d] of Object.entries(raw.dia)) {
      if (!isObj(d) || !isData(d.data) || typeof d.alvo !== 'string' || !Array.isArray(d.chutes)) continue;
      s.dia[k] = { data: d.data, alvo: d.alvo, chutes: d.chutes.filter((c): c is string => typeof c === 'string'), acertou: d.acertou === true };
    }
  }
  if (isObj(raw.stats)) {
    for (const [k, e] of Object.entries(raw.stats)) {
      if (!isObj(e)) continue;
      s.stats[k] = { jogos: nat(e.jogos), chutes: nat(e.chutes), seq: nat(e.seq), melhor: nat(e.melhor), ultimo: isData(e.ultimo) ? e.ultimo : '' };
    }
  }
  const c = raw.cfg;
  if (isObj(c) && typeof c.grupo === 'string' && GRUPOS.some(g => g.id === c.grupo) && isSubmodo(c.submodo) && (c.rodada === 'dia' || c.rodada === 'livre')) {
    s.cfg = { grupo: c.grupo, submodo: c.submodo, rodada: c.rodada };
  }
  return s;
}

/** O desafio salvo da franquia e submodo, se for de hoje. */
export function desafioDeHoje(s: Salvo, chave: string, hoje: string): DiaSalvo | null {
  const d = s.dia[chave];
  return d && d.data === hoje ? d : null;
}

/**
 * Registra um chute no desafio de hoje (começa o dia se preciso). Se `certo`, fecha o desafio e soma nas
 * estatísticas: mais um jogo, os chutes dele e a sequência (continua se o último foi ontem; senão, recomeça em 1).
 * Devolve um objeto novo; chute repetido ou desafio já resolvido não muda nada.
 */
export function registrarChute(s: Salvo, chave: string, hoje: string, alvo: string, nome: string, certo: boolean): Salvo {
  const atual = desafioDeHoje(s, chave, hoje);
  const d: DiaSalvo = atual && atual.alvo === alvo ? atual : { data: hoje, alvo, chutes: [], acertou: false };
  if (d.acertou || d.chutes.includes(nome)) return s;
  const novo: DiaSalvo = { ...d, chutes: [...d.chutes, nome], acertou: certo };
  const r: Salvo = { ...s, dia: { ...s.dia, [chave]: novo } };
  if (certo) {
    const e = s.stats[chave] ?? { jogos: 0, chutes: 0, seq: 0, melhor: 0, ultimo: '' };
    if (e.ultimo !== hoje) {
      const seq = e.ultimo === diaAnterior(hoje) ? e.seq + 1 : 1;
      r.stats = { ...s.stats, [chave]: { jogos: e.jogos + 1, chutes: e.chutes + novo.chutes.length, seq, melhor: Math.max(e.melhor, seq), ultimo: hoje } };
    }
  }
  return r;
}

/** Sequência que ainda vale hoje: a salva, se o último acerto foi hoje ou ontem; senão, 0. */
export function sequenciaAtual(e: Estat | undefined, hoje: string): number {
  if (!e) return 0;
  return e.ultimo === hoje || e.ultimo === diaAnterior(hoje) ? e.seq : 0;
}

/** Média de chutes por desafio resolvido (null sem nenhum). */
export const media = (e: Estat | undefined): number | null => (e && e.jogos ? e.chutes / e.jogos : null);
