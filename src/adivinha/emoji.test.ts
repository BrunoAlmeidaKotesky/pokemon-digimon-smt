import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emojisVisiveis, lerEmojis, MAX_EMOJIS, separarEmojis } from './emoji';

describe('separarEmojis', () => {
  it('um item por emoji, com sequências (ZWJ, variação, bandeira) inteiras', () => {
    expect(separarEmojis('🦊🔮💖✨🌕')).toEqual(['🦊', '🔮', '💖', '✨', '🌕']);
    expect(separarEmojis('🏴‍☠️🔫🪝🕶️🏜️')).toEqual(['🏴‍☠️', '🔫', '🪝', '🕶️', '🏜️']);
    expect(separarEmojis('⚔️🩸😈👹')).toEqual(['⚔️', '🩸', '😈', '👹']);
    expect(separarEmojis('👨‍👩‍👧 🇧🇷')).toEqual(['👨‍👩‍👧', '🇧🇷']);
  });
  it('ignora espaço e separador', () => {
    expect(separarEmojis(' 🐂 , 🛡️ | 💪 ')).toEqual(['🐂', '🛡️', '💪']);
    expect(separarEmojis('')).toEqual([]);
  });
});

describe('lerEmojis', () => {
  it('nome -> lista; entrada vazia ou que não é texto fica de fora; corta o excesso', () => {
    const m = lerEmojis({ Ahri: '🦊🔮💖', Zed: '', Nada: 3, Muitos: '1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟' });
    expect([...m!.keys()]).toEqual(['Ahri', 'Muitos']);
    expect(m!.get('Ahri')).toEqual(['🦊', '🔮', '💖']);
    expect(m!.get('Muitos')).toHaveLength(MAX_EMOJIS);
  });
  it('arquivo torto -> null', () => {
    expect(lerEmojis(null)).toBeNull();
    expect(lerEmojis(['🦊'])).toBeNull();
    expect(lerEmojis('🦊')).toBeNull();
  });
  it('os arquivos que já existem são lidos sem erro (de 1 a 8 emojis cada)', () => {
    const dir = new URL('../../public/adivinha/emoji/', import.meta.url);
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json'))) {
      const m = lerEmojis(JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8')));
      expect(m, f).not.toBeNull();
      for (const [nome, l] of m!) expect(l.length, `${f}: ${nome}`).toBeGreaterThan(0);
    }
  });
});

describe('emojisVisiveis', () => {
  it('1 no começo, mais 1 por chute errado, até todos; no fim, todos', () => {
    expect([0, 1, 2, 3, 4, 9].map(e => emojisVisiveis(4, e))).toEqual([1, 2, 3, 4, 4, 4]);
    expect(emojisVisiveis(5, 0, true)).toBe(5);
    expect(emojisVisiveis(0, 3)).toBe(0);
  });
});
