// Progresso do desafio do dia e estatísticas da aba Adivinha, guardados em pdx-adivinha-v1 (chave nova, só desta
// aba). Funções puras sobre o objeto salvo; quem lê e grava no localStorage é solo.ts.
//
// Formato 2 (21/11/2026): o submodo de imagem com desfoque passou a se chamar Blur ("blur") e "imagem" virou o
// recorte; o dia virou um percurso (Clássico → Imagem → Blur → Emoji) e ganhou estatística própria por franquia.
// O salvo antigo (sem `v`) é migrado na leitura: "<franquia>:imagem" vira "<franquia>:blur" e a estatística do
// percurso começa com a da etapa jogada por último, pra ninguém perder a sequência de dias.
import { ETAPAS, GRUPOS, isSubmodo, type Submodo } from './grupos';
import { diaAnterior } from './dia';
import { limparRecorte } from './recorte';

export const ADIVINHA_KEY = 'pdx-adivinha-v1';
export const VERSAO_SALVO = 2;

export type Rodada = 'dia' | 'livre';
/** No livre: um submodo solto ou "todos" (Clássico → Imagem → Blur → Emoji, um personagem por etapa, em ciclo). */
export type Escolha = Submodo | 'todos';
export const isEscolha = (x: unknown): x is Escolha => x === 'todos' || isSubmodo(x);

/** O desafio de hoje de uma franquia e etapa: quem é (fica o mesmo o dia todo), os chutes e se acertou. */
export interface DiaSalvo {
  data: string;
  alvo: string;
  chutes: string[];
  acertou: boolean;
}
/** Dias resolvidos: quantos, soma dos chutes, sequência de dias seguidos (e a maior) e o último dia. */
export interface Estat {
  jogos: number;
  chutes: number;
  seq: number;
  melhor: number;
  ultimo: string;
}
export interface Salvo {
  v: number;
  /** "<franquia>:<etapa>" -> desafio */
  dia: Record<string, DiaSalvo>;
  /** "<franquia>:<etapa>" (cada etapa) e "<franquia>:percurso" (o dia inteiro da franquia) -> estatística */
  stats: Record<string, Estat>;
  /** última escolha da tela (franquia, submodo do livre, do dia ou livre) */
  cfg: { grupo: string; submodo: Escolha; rodada: Rodada } | null;
  /** etapas ligadas no percurso do dia e no "Todos" (pelo menos uma; padrão: todas) */
  etapas: Submodo[];
  /** recorte do livre por franquia (valores ligados; franquia ausente = todos) */
  recortes: Record<string, string[]>;
}

export const chaveDe = (grupo: string, sub: Submodo) => `${grupo}:${sub}`;
export const chavePercurso = (grupo: string) => `${grupo}:percurso`;
export const vazio = (): Salvo => ({ v: VERSAO_SALVO, dia: {}, stats: {}, cfg: null, etapas: [...ETAPAS], recortes: {} });
const zero = (): Estat => ({ jogos: 0, chutes: 0, seq: 0, melhor: 0, ultimo: '' });

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isData = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const nat = (x: unknown) => (typeof x === 'number' && Number.isSafeInteger(x) && x >= 0 ? x : 0);

/** Lê o que estava salvo, descartando o que não tiver o formato certo e migrando o formato 1 (nada lança). */
export function lerSalvo(raw: unknown): Salvo {
  const s = vazio();
  if (!isObj(raw)) return s;
  const antigo = raw.v !== VERSAO_SALVO;
  // formato 1: "imagem" era o desfoque, que agora é o Blur
  const chave = (k: string) => (antigo ? k.replace(/:imagem$/, ':blur') : k);
  if (isObj(raw.dia)) {
    for (const [k, d] of Object.entries(raw.dia)) {
      if (!isObj(d) || !isData(d.data) || typeof d.alvo !== 'string' || !Array.isArray(d.chutes)) continue;
      s.dia[chave(k)] = { data: d.data, alvo: d.alvo, chutes: d.chutes.filter((c): c is string => typeof c === 'string'), acertou: d.acertou === true };
    }
  }
  if (isObj(raw.stats)) {
    for (const [k, e] of Object.entries(raw.stats)) {
      if (!isObj(e)) continue;
      s.stats[chave(k)] = { jogos: nat(e.jogos), chutes: nat(e.chutes), seq: nat(e.seq), melhor: nat(e.melhor), ultimo: isData(e.ultimo) ? e.ultimo : '' };
    }
  }
  if (antigo) {
    // o percurso de cada franquia começa com a etapa jogada por último (empate: a de maior sequência)
    for (const g of GRUPOS) {
      if (s.stats[chavePercurso(g.id)]) continue;
      const etapas = Object.entries(s.stats).filter(([k, e]) => k.startsWith(g.id + ':') && e.ultimo);
      etapas.sort(([, a], [, b]) => (a.ultimo === b.ultimo ? b.seq - a.seq : a.ultimo < b.ultimo ? 1 : -1));
      const e = etapas[0]?.[1];
      if (e) s.stats[chavePercurso(g.id)] = { ...e };
    }
  }
  const c = raw.cfg;
  const sub = antigo && isObj(c) && c.submodo === 'imagem' ? 'blur' : isObj(c) ? c.submodo : undefined;
  if (isObj(c) && typeof c.grupo === 'string' && GRUPOS.some(g => g.id === c.grupo) && isEscolha(sub) && (c.rodada === 'dia' || c.rodada === 'livre')) {
    s.cfg = { grupo: c.grupo, submodo: sub, rodada: c.rodada };
  }
  const ligadas = Array.isArray(raw.etapas) ? ETAPAS.filter(e => (raw.etapas as unknown[]).includes(e)) : [];
  if (ligadas.length) s.etapas = ligadas;
  // recorte do livre (sem o campo, ou inválido = todos)
  if (isObj(raw.recortes)) {
    for (const g of GRUPOS) {
      const r = limparRecorte(g, raw.recortes[g.id]);
      if (r) s.recortes[g.id] = r;
    }
  }
  return s;
}

/** O desafio salvo da franquia e etapa, se for de hoje. */
export function desafioDeHoje(s: Salvo, chave: string, hoje: string): DiaSalvo | null {
  const d = s.dia[chave];
  return d && d.data === hoje ? d : null;
}

/** Soma um dia resolvido (com `chutes`): a sequência continua se o último foi ontem; senão, recomeça em 1. */
function somarDia(e: Estat, hoje: string, chutes: number): Estat {
  if (e.ultimo === hoje) return e;
  const seq = e.ultimo === diaAnterior(hoje) ? e.seq + 1 : 1;
  return { jogos: e.jogos + 1, chutes: e.chutes + chutes, seq, melhor: Math.max(e.melhor, seq), ultimo: hoje };
}

/**
 * Registra um chute no desafio de hoje da etapa (começa o dia se preciso). Se `certo`, fecha a etapa e soma na
 * estatística dela. Devolve um objeto novo; chute repetido ou etapa já resolvida não muda nada.
 */
export function registrarChute(s: Salvo, chave: string, hoje: string, alvo: string, nome: string, certo: boolean): Salvo {
  const atual = desafioDeHoje(s, chave, hoje);
  const d: DiaSalvo = atual && atual.alvo === alvo ? atual : { data: hoje, alvo, chutes: [], acertou: false };
  if (d.acertou || d.chutes.includes(nome)) return s;
  const novo: DiaSalvo = { ...d, chutes: [...d.chutes, nome], acertou: certo };
  const r: Salvo = { ...s, dia: { ...s.dia, [chave]: novo } };
  if (certo) r.stats = { ...s.stats, [chave]: somarDia(s.stats[chave] ?? zero(), hoje, novo.chutes.length) };
  return r;
}

/** O percurso do dia da franquia terminou: conta o dia (uma vez só) na estatística do percurso. */
export function registrarPercurso(s: Salvo, grupo: string, hoje: string, chutes: number): Salvo {
  const k = chavePercurso(grupo), e = s.stats[k] ?? zero();
  const novo = somarDia(e, hoje, chutes);
  return novo === e ? s : { ...s, stats: { ...s.stats, [k]: novo } };
}

/** Sequência que ainda vale hoje: a salva, se o último dia feito foi hoje ou ontem; senão, 0. */
export function sequenciaAtual(e: Estat | undefined, hoje: string): number {
  if (!e) return 0;
  return e.ultimo === hoje || e.ultimo === diaAnterior(hoje) ? e.seq : 0;
}

/** Média de chutes por dia resolvido (null sem nenhum). */
export const media = (e: Estat | undefined): number | null => (e && e.jogos ? e.chutes / e.jogos : null);
