import { describe, expect, it } from 'vitest';
import { alternar, etapaSeguinte, etapasDoPercurso, liberada, limparLigadas, percursoDoDia, proximaFranquia } from './percurso';
import { chaveDe, registrarChute, vazio } from './placar';
import { ETAPAS } from './grupos';

const HOJE = '2026-11-21';

describe('etapas ligadas', () => {
  it('ordem Clássico → Imagem → Blur → Emoji', () => {
    expect(ETAPAS).toEqual(['classico', 'imagem', 'blur', 'emoji']);
  });
  it('liga e desliga, sempre na ordem; a última ligada não desliga', () => {
    let l = alternar([...ETAPAS], 'blur');
    expect(l).toEqual(['classico', 'imagem', 'emoji']);
    l = alternar(l, 'blur');
    expect(l).toEqual(['classico', 'imagem', 'blur', 'emoji']);
    expect(alternar(['emoji'], 'emoji')).toEqual(['emoji']);
    expect(alternar(['emoji'], 'classico')).toEqual(['classico', 'emoji']);
  });
  it('limpar: só as válidas, na ordem; nenhuma = todas', () => {
    expect(limparLigadas(['emoji', 'x', 'classico'])).toEqual(['classico', 'emoji']);
    expect(limparLigadas([])).toEqual([...ETAPAS]);
    expect(limparLigadas(null)).toEqual([...ETAPAS]);
  });
  it('percurso = ligadas com dados (o Emoji sem arquivo sai sozinho)', () => {
    expect(etapasDoPercurso(['classico', 'blur', 'emoji'], ['classico', 'imagem', 'blur'])).toEqual(['classico', 'blur']);
    expect(etapaSeguinte(['classico', 'blur'], 'classico')).toBe('blur');
    expect(etapaSeguinte(['classico', 'blur'], 'blur')).toBeNull();
    expect(etapaSeguinte(['classico', 'blur'], 'emoji')).toBeNull();
  });
});

describe('percurso do dia', () => {
  const acerta = (s: ReturnType<typeof vazio>, sub: 'classico' | 'imagem' | 'blur' | 'emoji', chutes: string[]) =>
    chutes.reduce((x, c, i) => registrarChute(x, chaveDe('lol', sub), HOJE, 'Alvo', i === chutes.length - 1 ? 'Alvo' : c, i === chutes.length - 1), s);

  it('só abre a etapa seguinte depois de resolver a anterior', () => {
    let s = vazio();
    let p = percursoDoDia(s, 'lol', HOJE, ETAPAS);
    expect(p).toMatchObject({ atual: 'classico', completo: false, chutes: 0 });
    expect(liberada(p, 'classico')).toBe(true);
    expect(liberada(p, 'imagem')).toBe(false);
    // chute errado não abre nada
    s = registrarChute(s, chaveDe('lol', 'classico'), HOJE, 'Alvo', 'Outro', false);
    expect(percursoDoDia(s, 'lol', HOJE, ETAPAS).atual).toBe('classico');
    s = registrarChute(s, chaveDe('lol', 'classico'), HOJE, 'Alvo', 'Alvo', true);
    p = percursoDoDia(s, 'lol', HOJE, ETAPAS);
    expect(p.atual).toBe('imagem');
    expect(p.etapas[0]).toEqual({ sub: 'classico', feita: true, chutes: 2 });
    expect(liberada(p, 'classico')).toBe(true);
    expect(liberada(p, 'imagem')).toBe(true);
    expect(liberada(p, 'blur')).toBe(false);
  });

  it('completo quando as etapas do percurso terminam; desligar uma etapa encurta o percurso', () => {
    let s = acerta(vazio(), 'classico', ['a', 'b']);
    s = acerta(s, 'imagem', ['a']);
    s = acerta(s, 'emoji', ['a', 'b', 'c']);
    expect(percursoDoDia(s, 'lol', HOJE, ETAPAS)).toMatchObject({ atual: 'blur', completo: false });
    const semBlur = percursoDoDia(s, 'lol', HOJE, etapasDoPercurso(['classico', 'imagem', 'emoji'], ETAPAS));
    expect(semBlur).toMatchObject({ atual: null, completo: true, chutes: 6 });
    s = acerta(s, 'blur', ['x']);
    expect(percursoDoDia(s, 'lol', HOJE, ETAPAS)).toMatchObject({ completo: true, chutes: 7 });
    // ontem não conta hoje
    expect(percursoDoDia(s, 'lol', '2026-11-22', ETAPAS)).toMatchObject({ atual: 'classico', completo: false });
    expect(percursoDoDia(s, 'lol', HOJE, [])).toMatchObject({ completo: false, atual: null });
  });
});

describe('próxima franquia', () => {
  const ordem = ['lol', 'overwatch', 'deadlock', 'pokemon', 'jojo', 'megaten'];
  it('a seguinte na ordem dos chips, voltando pro começo', () => {
    expect(proximaFranquia(ordem, 'lol')).toBe('overwatch');
    expect(proximaFranquia(ordem, 'megaten')).toBe('lol');
    expect(proximaFranquia(ordem, 'xyz')).toBe('lol');
  });
  it('no dia, pula as feitas; com todas feitas, nenhuma', () => {
    const feitas = new Set(['overwatch', 'deadlock', 'lol']);
    expect(proximaFranquia(ordem, 'lol', g => feitas.has(g))).toBe('pokemon');
    expect(proximaFranquia(ordem, 'jojo', g => g !== 'deadlock')).toBe('deadlock');
    expect(proximaFranquia(ordem, 'jojo', () => true)).toBeNull();
    expect(proximaFranquia(['lol'], 'lol')).toBeNull();
  });
});
