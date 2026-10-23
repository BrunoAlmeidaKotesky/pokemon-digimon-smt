import { describe, expect, it } from 'vitest';
import { nice } from './text';

describe('nice', () => {
  it('troca hífen por espaço e põe maiúscula em cada pedaço', () => {
    expect(nice('nidoran-f')).toBe('Nidoran F');
    expect(nice('mr-mime')).toBe('Mr Mime');
    expect(nice('ho-oh')).toBe('Ho Oh');
    expect(nice('bulbasaur')).toBe('Bulbasaur');
  });
  it('mexe só na primeira letra de cada pedaço', () => {
    expect(nice('type-null')).toBe('Type Null');
    expect(nice('porygon2')).toBe('Porygon2');
    expect(nice('jangmo-o')).toBe('Jangmo O');
  });
  it('como o antigo, falha com pedaço vazio', () => {
    expect(() => nice('')).toThrow(TypeError);
    expect(() => nice('a--b')).toThrow(TypeError);
  });
});
