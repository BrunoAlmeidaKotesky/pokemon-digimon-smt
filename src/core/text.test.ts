import { describe, expect, it } from 'vitest';
import { nice } from './text';

// referência: cópia do site antigo (só com cast pro tipo)
const refNice = (s: string) => s.split('-').map(w => (w[0] as string).toUpperCase()+w.slice(1)).join(' ');

describe('nice', () => {
  it('troca hífen por espaço e põe maiúscula em cada palavra', () => {
    expect(nice('pikachu')).toBe('Pikachu');
    expect(nice('mr-mime')).toBe('Mr Mime');
    expect(nice('ho-oh')).toBe('Ho Oh');
    expect(nice('tapu-koko')).toBe('Tapu Koko');
    expect(nice('nidoran-f')).toBe('Nidoran F');
  });
  it('não mexe no resto da palavra', () => {
    expect(nice('mIme-jR')).toBe('MIme JR');
  });
  it('segmento vazio quebra como no antigo', () => {
    expect(() => nice('a--b')).toThrow(TypeError);
    expect(() => refNice('a--b')).toThrow(TypeError);
  });
  it('equivalência com o antigo', () => {
    for (const s of ['bulbasaur', 'type-null', 'porygon-z', 'jangmo-o', 'great-tusk', 'x', 'iron-valiant']) expect(nice(s)).toBe(refNice(s));
  });
});
