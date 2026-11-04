// Integração: o set de verdade (public/autobatalha/set1.json), o motor e o conteúdo de verdade, e partidas inteiras de
// 8 bots (o "humano" joga como bot). Pega erro de habilidade que só aparece com o Contexto real e partida que não
// termina.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { definirSet } from './dados';
import type { Partida, SetDados } from './tipos';
import { simularLuta, atributosDaUnidade } from './combate';
import { combinar, contarTracos, ehComponente, HABILIDADES_PROPRIAS } from './conteudo';
import * as P from './partida';

interface Resumo { estagioFinal: number; rodadas: number; colocacoes: number[] }

/** Joga uma partida inteira só com bots; devolve onde acabou. */
function jogarPartida(semente: number): Resumo {
  const p: Partida = P.novaPartida(semente);
  let rodadas = 0;
  const humano = p.jogadores.find(j => !j.bot)!;
  while (!P.acabou(p) && rodadas < 120) {
    P.jogarBots(p);
    if (humano.colocacao == null) P.jogarBot(p, humano);
    P.fimDoPlanejamento(p);
    P.aplicarRodada(p, P.simularRodada(p));
    rodadas++;
    if (P.acabou(p)) break;
    P.avancarRodada(p);
  }
  return { estagioFinal: p.estagio, rodadas, colocacoes: p.jogadores.map(j => j.colocacao ?? 0) };
}

beforeAll(() => {
  definirSet(JSON.parse(readFileSync('public/autobatalha/set1.json', 'utf8')) as SetDados);
  P.definirMotor({ simularLuta, atributosDaUnidade, contarTracos, combinar, ehComponente });
});

describe('Autobatalha com tudo de verdade', () => {
  it('toda forma com habilidade própria tem a habilidade no conteúdo', () => {
    const set = JSON.parse(readFileSync('public/autobatalha/set1.json', 'utf8')) as SetDados;
    const faltam = Object.values(set.formas).filter(f => f.habilidade && !HABILIDADES_PROPRIAS[f.habilidade]).map(f => f.id);
    expect(faltam).toEqual([]);
  });

  it('partidas de 8 bots terminam, com colocações 1 a 8 e sem erro do conteúdo', () => {
    const erros = vi.spyOn(console, 'error').mockImplementation(() => {});
    const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const semente of [11, 2026]) {
      const r = jogarPartida(semente);
      expect(r.rodadas).toBeLessThan(120);
      expect([...r.colocacoes].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    }
    expect(erros.mock.calls.concat(avisos.mock.calls).map(c => String(c[0]))).toEqual([]);
    erros.mockRestore();
    avisos.mockRestore();
  }, 60_000);
});
