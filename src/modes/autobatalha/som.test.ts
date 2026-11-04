// Sons da Autobatalha: sem Web Audio (ambiente node, como nos testes) tudo vira nada sem erro; o limite por segundo
// descarta o excesso numa janela deslizante.
import { describe, expect, it } from 'vitest';
import type { EfeitoVisual } from '../../autobatalha/tipos';
import { criarLimite, definirVolume, prepararAudio, tocar, tocarHabilidade, type Som } from './som';

const SONS: Som[] = [
  'clique', 'comprar', 'vender', 'atualizar', 'xp', 'nivel', 'evoluir2', 'evoluir3', 'posicionar', 'equipar', 'juntar',
  'clash', 'luta', 'golpe', 'critico', 'morte', 'vitoria', 'derrota', 'empate', 'carrosselVez', 'carrosselPegou',
  'relogio', 'relogioFim', 'moeda', 'erro', 'abrir', 'fechar',
];
const EFEITOS: (EfeitoVisual | null)[] = ['fogo', 'gelo', 'raio', 'cura', 'escudo', 'trevas', 'transformar', 'invocar', null];

describe('som', () => {
  it('sem Web Audio nada quebra', () => {
    expect(() => {
      prepararAudio();
      prepararAudio();
      for (const v of [-1, 0, 0.5, 2, Number.NaN, 0.6]) definirVolume(v);
      for (const s of SONS) tocar(s);
      for (const e of EFEITOS) tocarHabilidade(e);
    }).not.toThrow();
  });

  it('limite por segundo: janela deslizante, excesso descartado', () => {
    const pode = criarLimite(3);
    expect([0, 100, 200, 300, 400].map(pode)).toEqual([true, true, true, false, false]);
    // o 1º (t=0) sai da janela em t=1000; os descartados não contam
    expect(pode(999)).toBe(false);
    expect(pode(1000)).toBe(true);
    expect(pode(1050)).toBe(false);
    expect(pode(1100)).toBe(true);
    expect(pode(1200)).toBe(true);
    expect(pode(1201)).toBe(false);
    // janela própria
    const raro = criarLimite(1, 500);
    expect([0, 499, 500, 600, 1000].map(raro)).toEqual([true, false, true, false, true]);
  });
});
