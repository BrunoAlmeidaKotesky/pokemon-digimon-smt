// Emoji: public/adivinha/emoji/<chave>.json = { "Nome exato": "🦊💋🌙✨" }, de 3 a 5 emojis do mais vago ao mais
// revelador. O jogo começa com 1 e revela mais 1 a cada chute errado. Lógica pura.
import type { EmojiMapa } from './pool';

/** Mais que isso numa entrada é erro do arquivo: corta. */
export const MAX_EMOJIS = 8;

const segmentador = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;

/** '🏴‍☠️🔫 🪝' -> ['🏴‍☠️', '🔫', '🪝']: um item por emoji (sequências com ZWJ e variação ficam juntas), sem espaços. */
export function separarEmojis(s: string): string[] {
  const partes = segmentador ? Array.from(segmentador.segment(s), x => x.segment) : Array.from(s);
  return partes.filter(p => p.trim() && !/^[\s,;|·.]+$/.test(p));
}

/** Lê o arquivo de emojis. Entrada sem emoji ou com valor que não é texto é ignorada; arquivo torto -> null. */
export function lerEmojis(j: unknown): EmojiMapa | null {
  if (typeof j !== 'object' || j === null || Array.isArray(j)) return null;
  const m: EmojiMapa = new Map();
  for (const [nome, v] of Object.entries(j as Record<string, unknown>)) {
    if (typeof v !== 'string') continue;
    const l = separarEmojis(v).slice(0, MAX_EMOJIS);
    if (l.length) m.set(nome, l);
  }
  return m;
}

/** Quantos emojis aparecem: 1 no começo e mais 1 a cada chute errado (no fim, todos). */
export function emojisVisiveis(total: number, erros: number, fim = false): number {
  return fim ? total : Math.min(total, 1 + Math.max(0, erros));
}
