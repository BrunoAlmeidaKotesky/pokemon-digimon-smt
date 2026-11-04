// Funções puras do playtest automático (docs/tft/matematica/README.md, "Playtest"): estatística das lutas, busca do
// "equivalente em atributos", faixas de equilíbrio e a escrita do relatório em Markdown. Não leem o set nem rodam
// luta: isso fica em laboratorio.ts. Testes em medidas.test.ts.

/** Placar de um grupo de lutas: empate vale meia vitória. */
export interface Placar { vitorias: number; empates: number; lutas: number }

export const placarVazio = (): Placar => ({ vitorias: 0, empates: 0, lutas: 0 });

export function somarLuta(p: Placar, resultado: 'vitoria' | 'derrota' | 'empate'): void {
  p.lutas++;
  if (resultado === 'vitoria') p.vitorias++;
  else if (resultado === 'empate') p.empates++;
}

/** Taxa de vitória (empate = meia); sem lutas, NaN. */
export const taxa = (p: Placar): number => (p.lutas ? (p.vitorias + p.empates / 2) / p.lutas : NaN);

/** Intervalo de Wilson (95% com z = 1,96) da taxa de vitória. */
export function wilson(p: Placar, z = 1.96): [number, number] {
  const n = p.lutas;
  if (!n) return [NaN, NaN];
  const f = taxa(p);
  const z2 = z * z;
  const centro = (f + z2 / (2 * n)) / (1 + z2 / n);
  const meia = (z / (1 + z2 / n)) * Math.sqrt((f * (1 - f)) / n + z2 / (4 * n * n));
  return [Math.max(0, centro - meia), Math.min(1, centro + meia)];
}

export function media(xs: readonly number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN;
}

/** Quantil por interpolação linear (q = 0,5 é a mediana). */
export function quantil(xs: readonly number[], q: number): number {
  if (!xs.length) return NaN;
  const o = [...xs].sort((a, b) => a - b);
  const pos = (o.length - 1) * Math.min(1, Math.max(0, q));
  const i = Math.floor(pos), f = pos - i;
  return i + 1 < o.length ? o[i]! * (1 - f) + o[i + 1]! * f : o[i]!;
}
export const mediana = (xs: readonly number[]): number => quantil(xs, 0.5);

/** Faixas de equilíbrio do playtest (o que o relatório marca como fora). */
export const FAIXAS = {
  /** vitórias de um campeão contra os outros do mesmo custo e estrela (rodízio com bonecos) */
  campeao: [0.35, 0.65] as const,
  /** segundos até o 1º lançamento, pra maioria (o usuário achou rápido demais: ver equilibrio.md, histórico) */
  primeiroLancamento: [4, 10] as const,
  /** lançamentos por segundo vivo: acima disto, "lança demais" (1 a cada 3 s) */
  lancPorSegundoMax: 1 / 3,
  /** lançou em menos desta fração das lutas: "quase nunca lança" */
  lancouMin: 0.5,
  /** time de custo c+1 contra c, mesma estrela: ganha */
  custoAcima: [0.75, 1] as const,
  /** uma estrela a mais contra 1 custo acima (★2 de custo c contra ★1 de custo c+1): ganha */
  duasEstrelasContraCusto2: [0.6, 1] as const,
  /** uma estrela a mais contra 2 custos acima (★2 de custo c contra ★1 de custo c+2): briga */
  duasEstrelasContraCusto3: [0.35, 0.65] as const,
  /** valor da habilidade por lançamento: mais que este fator acima ou abaixo da mediana do custo e estrela */
  habilidadeMult: 2,
  /** equivalentes (traço, item, pacote): fora de [mediana ÷ 1,6, mediana × 1,6], com folga de 3 pontos */
  relativoMediana: [1 / 1.6, 1.6] as const,
  folga: 0.03,
};

/** Longe da mediana do grupo: abaixo de mediana × mín − folga ou acima de mediana × máx + folga. Mediana negativa
 *  ou zero compara só pela folga. */
export function foraDaMediana(valor: number, med: number, [min, max]: readonly [number, number], folga: number): boolean {
  if (!Number.isFinite(valor) || !Number.isFinite(med)) return false;
  const base = Math.max(0, med);
  return valor < base * min - folga || valor > base * max + folga;
}

/** Faixa aceitável [mín, máx]: 'abaixo', 'acima' ou null (dentro). */
export function foraDaFaixa(valor: number, [min, max]: readonly [number, number]): 'abaixo' | 'acima' | null {
  if (!Number.isFinite(valor)) return null;
  return valor < min ? 'abaixo' : valor > max ? 'acima' : null;
}

/**
 * Equivalente em atributos: o x em [lo, hi] onde `taxaDe(x)` cruza 0,5, por bisseção. `taxaDe` tem de cair com x
 * (x = bônus dado ao lado que NÃO tem a coisa medida). Se já está abaixo de 0,5 em lo, devolve lo; acima em hi, hi.
 * Com as mesmas sementes em todo x, a taxa fica monótona o bastante pra bisseção.
 */
export function equivalente(taxaDe: (x: number) => number, lo: number, hi: number, passos = 8): number {
  if (taxaDe(lo) <= 0.5) return lo;
  if (taxaDe(hi) >= 0.5) return hi;
  let a = lo, b = hi;
  for (let i = 0; i < passos; i++) {
    const m = (a + b) / 2;
    if (taxaDe(m) > 0.5) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

/** Semente estável a partir de partes (hash FNV-1a de 32 bits do texto). */
export function semente(...partes: (string | number)[]): number {
  let h = 0x811c9dc5;
  for (const ch of partes.join('|')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------------------------------------------

/** Número com vírgula e `casas` casas decimais ("1,25"); NaN vira "–". */
export function num(x: number, casas = 0): string {
  if (!Number.isFinite(x)) return '–';
  return x.toFixed(casas).replace('.', ',').replace(/^-(0(,0+)?)$/, '$1');
}
/** Fração como porcentagem ("57%", "+12%" com sinal). */
export function pct(x: number, casas = 0, sinal = false): string {
  if (!Number.isFinite(x)) return '–';
  const s = num(x * 100, casas);
  return `${sinal && x > 0 ? '+' : ''}${s}%`;
}

/** Tabela em Markdown. */
export function tabela(cabecalho: readonly string[], linhas: readonly (readonly (string | number)[])[]): string {
  const celula = (x: string | number) => String(x).replace(/\|/g, '\\|');
  return [
    `| ${cabecalho.map(celula).join(' | ')} |`,
    `|${cabecalho.map(() => '---').join('|')}|`,
    ...linhas.map(l => `| ${l.map(celula).join(' | ')} |`),
  ].join('\n');
}

/** Marcador que separa a parte gerada (em cima) da escrita à mão (embaixo) no equilibrio.md. */
export const MARCADOR_HISTORICO = '<!-- histórico: daqui pra baixo é escrito à mão; o playtest mantém -->';

/** Junta o relatório novo com a parte escrita à mão do arquivo antigo (do marcador pra baixo). */
export function juntarComHistorico(gerado: string, antigo: string | null): string {
  const i = antigo?.indexOf(MARCADOR_HISTORICO) ?? -1;
  const historico = antigo && i >= 0 ? antigo.slice(i) : `${MARCADOR_HISTORICO}\n\n## Histórico de ajustes\n`;
  return `${gerado.trimEnd()}\n\n${historico.trimEnd()}\n`;
}
