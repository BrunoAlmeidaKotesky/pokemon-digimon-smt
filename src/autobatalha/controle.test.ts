import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { acoes, estadoAutobatalha, MS_RESULTADO } from './controle';
import { CHAVE_PARTIDA, definirMotor, humano } from './partida';
import { lutaGanha, prepararTeste } from './partida/test-helpers';

let guardado: Map<string, string>;

beforeEach(() => {
  vi.useFakeTimers();
  guardado = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => guardado.get(k) ?? null,
    setItem: (k: string, v: string) => { guardado.set(k, v); },
    removeItem: (k: string) => { guardado.delete(k); },
  });
  prepararTeste();
  acoes.abandonar();
  acoes.configurar({ relogio: true, segundos: 30, velocidade: 1 });
});
afterEach(() => {
  acoes.abandonar();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const E = estadoAutobatalha;

describe('controle', () => {
  it('ciclo: planejamento com relógio → luta reproduzida → resultado → próximo planejamento', () => {
    acoes.novaPartida(5);
    let e = E();
    expect(e.partida?.fase).toBe('planejamento');
    expect(e.relogio).toBe(20); // estágio 1: 2/3 de 30 s
    expect(e.temSalva).toBe(true);
    expect(guardado.has(CHAVE_PARTIDA)).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(E().relogio).toBe(15);
    vi.advanceTimersByTime(15000);
    e = E();
    expect(e.partida?.fase).toBe('luta');
    expect(e.reproducao?.adversario).toBe('monstros');
    expect(e.reproducao?.resultado.gravacao).toBeDefined();
    expect(e.relogio).toBeNull();
    vi.advanceTimersByTime(4000);
    expect(E().reproducao!.t).toBeGreaterThan(3.5);
    acoes.velocidade(4);
    vi.advanceTimersByTime(1600);
    expect(E().reproducao!.t).toBeGreaterThan(9);
    vi.advanceTimersByTime(400);
    e = E();
    expect(e.partida?.fase).toBe('resultado');
    expect(e.reproducao?.acabou).toBe(true);
    vi.advanceTimersByTime(MS_RESULTADO);
    e = E();
    expect(e.partida?.fase).toBe('planejamento');
    expect([e.partida?.estagio, e.partida?.rodada]).toEqual([1, 2]);
    expect(e.reproducao).toBeNull();
    expect(e.config.velocidade).toBe(4);
  });

  it('a partida muda de referência a cada ação; avisos somem sozinhos', () => {
    acoes.novaPartida(6);
    const antes = E().partida;
    acoes.atualizarLoja(); // 1 de ouro: não dá
    expect(E().aviso).toBe('Ouro insuficiente');
    expect(E().partida).not.toBe(antes);
    vi.advanceTimersByTime(3000);
    expect(E().aviso).toBeNull();
  });

  it('pronto, pular luta e sem relógio', () => {
    acoes.configurar({ relogio: false });
    acoes.novaPartida(7);
    expect(E().relogio).toBeNull();
    vi.advanceTimersByTime(120000);
    expect(E().partida?.fase).toBe('planejamento');
    acoes.pronto();
    expect(E().partida?.fase).toBe('luta');
    acoes.pularLuta();
    expect(E().partida?.fase).toBe('resultado');
    vi.advanceTimersByTime(MS_RESULTADO);
    expect(E().partida?.rodada).toBe(2);
  });

  it('presente aparece no estado e a escolha vai pros itens', () => {
    acoes.configurar({ relogio: false });
    acoes.novaPartida(8);
    for (let r = 0; r < 3; r++) { acoes.pronto(); acoes.pularLuta(); vi.advanceTimersByTime(MS_RESULTADO); }
    const e = E();
    expect([e.partida?.estagio, e.partida?.rodada]).toEqual([2, 1]);
    expect(e.presente).toHaveLength(3);
    const c = e.presente![0]!;
    const n = humano(e.partida!).itens.length;
    acoes.escolherPresente(c);
    expect(E().presente).toBeNull();
    expect(humano(E().partida!).itens).toHaveLength(n + 1);
  });

  it('continuar carrega a salva; abandonar apaga', () => {
    acoes.novaPartida(9);
    const salva = JSON.parse(guardado.get(CHAVE_PARTIDA)!) as unknown;
    acoes.pronto(); acoes.pularLuta(); vi.advanceTimersByTime(MS_RESULTADO);
    expect(E().partida?.rodada).toBe(2);
    guardado.set(CHAVE_PARTIDA, JSON.stringify(salva));
    acoes.continuar();
    expect(E().partida).toEqual(salva);
    expect(E().partida?.fase).toBe('planejamento');
    expect(E().relogio).toBe(20);
    acoes.abandonar();
    expect(E().partida).toBeNull();
    expect(E().temSalva).toBe(false);
    expect(guardado.has(CHAVE_PARTIDA)).toBe(false);
  });

  it('humano eliminado: o resto corre sem mostrar e vai pro fim', () => {
    acoes.configurar({ relogio: false });
    acoes.novaPartida(10);
    definirMotor({ simularLuta: lutaGanha('b') });
    const p = E().partida!;
    p.estagio = 2; p.rodada = 7; p.tipo = 'monstros';
    humano(p).vida = 1;
    acoes.pronto();
    acoes.pularLuta();
    expect(humano(E().partida!).colocacao).toBe(8);
    vi.advanceTimersByTime(MS_RESULTADO);
    const e = E();
    expect(e.partida?.fase).toBe('fim');
    expect(e.partida?.jogadores.map(j => j.colocacao).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(e.temSalva).toBe(false);
  });

  it('olhar outro jogador', () => {
    acoes.novaPartida(11);
    acoes.olhar('pyrus');
    expect(E().olhando).toBe('pyrus');
    acoes.olhar(null);
    expect(E().olhando).toBeNull();
  });
});
