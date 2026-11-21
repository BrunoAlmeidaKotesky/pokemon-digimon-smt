// Desafio do dia: data no horário de Brasília (America/Sao_Paulo) e o mesmo personagem pra todo mundo, sorteado de
// forma determinística pela data, franquia e submodo. Lógica pura (o relógio vem de fora).

export const FUSO = 'America/Sao_Paulo';

const fmtData = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' });
const fmtHora = new Intl.DateTimeFormat('en-GB', { timeZone: FUSO, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** 'AAAA-MM-DD' no horário de Brasília. */
export function dataSP(agora: number): string {
  const p = Object.fromEntries(fmtData.formatToParts(new Date(agora)).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

/** Dia anterior de uma data 'AAAA-MM-DD'. */
export function diaAnterior(d: string): string {
  const [a, m, dia] = d.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(a, m - 1, dia - 1)).toISOString().slice(0, 10);
}

/** Milissegundos até a próxima meia-noite em Brasília. */
export function msAteAmanha(agora: number): number {
  const p = Object.fromEntries(fmtHora.formatToParts(new Date(agora)).map(x => [x.type, x.value]));
  const passou = ((Number(p.hour) * 60 + Number(p.minute)) * 60 + Number(p.second)) * 1000 + (((agora % 1000) + 1000) % 1000);
  return 86_400_000 - passou;
}

/** 'HH:MM:SS' (arredonda pra cima: falta 0,2 s = 00:00:01). */
export function relogio(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${dois(Math.floor(s / 3600))}:${dois(Math.floor(s / 60) % 60)}:${dois(s % 60)}`;
}

/** '2026-11-21' -> '21/11/2026' */
export const dataBR = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? d.split('-').reverse().join('/') : d);

/** Hash de 32 bits sem sinal (FNV-1a com mistura final do murmur3): o mesmo em todo navegador. */
export function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Índice do personagem do dia numa lista de `n` (ordenada por nome): data + franquia + submodo. */
export function indiceDoDia(data: string, grupo: string, submodo: string, n: number): number {
  return n > 0 ? hash32(`${data}|${grupo}|${submodo}`) % n : -1;
}

/** Número de 0 a 1 fixo pro dia (ponto do zoom da Imagem, por exemplo). */
export function sementeDoDia(data: string, grupo: string, submodo: string, extra: string): number {
  return hash32(`${data}|${grupo}|${submodo}|${extra}`) / 4294967296;
}
