import { describe, expect, it } from 'vitest';
import { dataBR, dataSP, diaAnterior, hash32, indiceDoDia, msAteAmanha, relogio, sementeDoDia } from './dia';

// 21/11/2026 15:30:00 em Brasília (UTC-3, sem horário de verão)
const T = Date.parse('2026-11-21T18:30:00Z');

describe('data em Brasília', () => {
  it('a data muda à meia-noite de Brasília, não à de Greenwich', () => {
    expect(dataSP(T)).toBe('2026-11-21');
    expect(dataSP(Date.parse('2026-11-22T02:59:59Z'))).toBe('2026-11-21');
    expect(dataSP(Date.parse('2026-11-22T03:00:00Z'))).toBe('2026-11-22');
  });

  it('dia anterior, virando mês e ano', () => {
    expect(diaAnterior('2026-11-21')).toBe('2026-11-20');
    expect(diaAnterior('2026-03-01')).toBe('2026-02-28');
    expect(diaAnterior('2024-03-01')).toBe('2024-02-29');
    expect(diaAnterior('2027-01-01')).toBe('2026-12-31');
  });

  it('quanto falta pra meia-noite', () => {
    expect(msAteAmanha(T)).toBe(8.5 * 3600 * 1000);
    expect(msAteAmanha(Date.parse('2026-11-22T02:59:59.250Z'))).toBe(750);
    expect(msAteAmanha(Date.parse('2026-11-22T03:00:00Z'))).toBe(86_400_000);
    expect(relogio(8.5 * 3600 * 1000)).toBe('08:30:00');
    expect(relogio(750)).toBe('00:00:01');
    expect(relogio(-5)).toBe('00:00:00');
  });

  it('data brasileira', () => {
    expect(dataBR('2026-11-21')).toBe('21/11/2026');
    expect(dataBR('x')).toBe('x');
  });
});

describe('personagem do dia', () => {
  it('determinístico: mesma data, franquia e submodo dão o mesmo índice', () => {
    expect(hash32('abc')).toBe(hash32('abc'));
    expect(hash32('abc')).not.toBe(hash32('abd'));
    const i = indiceDoDia('2026-11-21', 'lol', 'classico', 173);
    expect(i).toBe(indiceDoDia('2026-11-21', 'lol', 'classico', 173));
    expect(i).toBeGreaterThanOrEqual(0);
    expect(i).toBeLessThan(173);
    expect(indiceDoDia('2026-11-21', 'lol', 'classico', 0)).toBe(-1);
  });

  it('muda com a data, a franquia e o submodo (e se espalha pela lista)', () => {
    const dias = Array.from({ length: 60 }, (_, d) => new Date(Date.UTC(2026, 0, 1 + d)).toISOString().slice(0, 10));
    const idx = dias.map(d => indiceDoDia(d, 'pokemon', 'classico', 1025));
    expect(new Set(idx).size).toBeGreaterThan(50);
    const n = 1000;
    const outros = ['imagem', 'emoji'].map(s => indiceDoDia('2026-11-21', 'pokemon', s, n));
    const base = indiceDoDia('2026-11-21', 'pokemon', 'classico', n);
    expect(outros.some(x => x !== base)).toBe(true);
    expect(indiceDoDia('2026-11-21', 'jojo', 'classico', n)).not.toBe(indiceDoDia('2026-11-21', 'overwatch', 'classico', n));
  });

  it('semente de 0 a 1, fixa pro dia', () => {
    const s = sementeDoDia('2026-11-21', 'lol', 'imagem', 'foco');
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThan(1);
    expect(sementeDoDia('2026-11-21', 'lol', 'imagem', 'foco')).toBe(s);
    expect(sementeDoDia('2026-11-22', 'lol', 'imagem', 'foco')).not.toBe(s);
  });
});
