// Os invariantes do playtest: uma partida de verdade passa limpa, e cada estrago conhecido é apontado.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { definirSet, S } from '../dados';
import { atributosDaUnidade, simularLuta } from '../combate';
import { combinar, contarTracos, ehComponente } from '../conteudo';
import * as P from '../partida';
import type { Partida, ResultadoLuta, SetDados } from '../tipos';
import { conferirGravacao, conferirLuta, conferirPartida, conferirTimes, massaDeItens, type Violacoes } from './invariantes';
import { jogarPartidas } from './partidas';

beforeAll(() => {
  definirSet(JSON.parse(readFileSync('public/autobatalha/set1.json', 'utf8')) as SetDados);
  P.definirMotor({ simularLuta, atributosDaUnidade, contarTracos, combinar, ehComponente });
});

/** Partida jogada até o começo do estágio 3, com a rodada aberta. */
function partidaEmAndamento(semente: number): Partida {
  const p = P.novaPartida(semente);
  while (p.estagio < 3) {
    P.jogarBots(p);
    P.jogarBot(p, p.jogadores.find(j => !j.bot)!);
    P.fimDoPlanejamento(p);
    P.aplicarRodada(p, P.simularRodada(p));
    P.avancarRodada(p);
    P.terminarCarrossel(p);
  }
  P.jogarBots(p);
  P.jogarBot(p, p.jogadores.find(j => !j.bot)!);
  P.fimDoPlanejamento(p);
  return p;
}

const categorias = (v: Violacoes) => [...v.keys()];

describe('invariantes', () => {
  it('partidas inteiras em cada dificuldade: nada quebra e toda partida acaba', () => {
    for (const dificuldade of ['facil', 'normal', 'dificil'] as const) {
      const e = jogarPartidas([31, 32], 120, { dificuldade, gravarUmaACada: 25 });
      expect(categorias(e.violacoes), dificuldade).toEqual([]);
      expect(e.errosConteudo, dificuldade).toEqual([]);
      expect(e.naoTerminaram).toBe(0);
    }
  }, 60_000);

  it('aponta pool que não fecha, ouro inválido e unidade sem lugar', () => {
    const p = partidaEmAndamento(41);
    const limpo: Violacoes = new Map();
    conferirPartida(p, limpo, 'teste');
    conferirTimes(p, limpo);
    expect(categorias(limpo)).toEqual([]);

    const j = p.jogadores.find(x => Object.keys(x.unidades).length >= 2)!;
    const uid = Number(Object.keys(j.unidades)[0]);
    const c = j.unidades[uid]!.campeao;
    p.pool[c] = (p.pool[c] ?? 0) + 1;
    j.ouro = -1;
    for (const k of Object.keys(j.tabuleiro)) if (j.tabuleiro[k] === uid) delete j.tabuleiro[k];
    j.banco = j.banco.map(x => (x === uid ? null : x));
    const v: Violacoes = new Map();
    conferirPartida(p, v, 'teste');
    expect(categorias(v)).toEqual(expect.arrayContaining(['pool não fecha', 'ouro inválido', 'unidade fora do banco e do tabuleiro']));
  });

  it('aponta Stand sem usuário e tabuleiro acima do limite', () => {
    const p = partidaEmAndamento(42);
    const j = p.jogadores.find(x => x.bot && Object.keys(x.tabuleiro).length > 0)!;
    const stand = S().dados.campeoes.find(c => c.stand)!;
    const uid = 90_000;
    j.unidades[uid] = { uid, campeao: stand.id, estrela: 1, forma: S().formaPadrao(stand.id, 1), itens: [] };
    const k = ['0,3', '1,3', '2,3', '3,3', '4,3', '5,3', '6,3', '7,3'].find(x => j.tabuleiro[x] == null)!;
    j.tabuleiro[k] = uid;
    p.pool[stand.id] = (p.pool[stand.id] ?? 0) - 1;
    const v: Violacoes = new Map();
    conferirPartida(p, v, 'teste');
    conferirTimes(p, v);
    expect(categorias(v)).toContain('Stand no tabuleiro sem usuário');
    for (let n = 0; n < 12; n++) {
      const livre = `${n % 8},${(n >> 3) + 1}`;
      if (j.tabuleiro[livre] != null) continue;
      j.tabuleiro[livre] = uid + n + 1;
      j.unidades[uid + n + 1] = { ...j.unidades[uid]!, uid: uid + n + 1 };
    }
    const w: Violacoes = new Map();
    conferirTimes(p, w);
    expect(categorias(w)).toContain('bot com tabuleiro acima do limite');
  });

  it('item: a massa conta componente como 1 e completo como 2', () => {
    const j = { itens: ['pyrus', 'pyrus+aquos'], unidades: { 1: { itens: ['haos', 'aquos+aquos'] } } } as unknown as Parameters<typeof massaDeItens>[0];
    expect(massaDeItens(j)).toBe(1 + 2 + 1 + 2);
  });

  it('luta: aponta perdedor vivo antes do tempo, e a gravação aponta dois vivos na mesma casa e vida acima do máximo', () => {
    const vazio = { dono: 'x', lutadores: [] };
    const base: ResultadoLuta = { vencedor: 'a', vivosA: ['a:1'], vivosB: ['b:2'], duracao: 12, dano: {}, abates: {}, ouro: { a: 0, b: 0 } };
    const v: Violacoes = new Map();
    conferirLuta(vazio, vazio, base, v);
    expect(categorias(v)).toEqual(['luta acabou com perdedor vivo']);
    const g: Violacoes = new Map();
    conferirGravacao({
      ...base,
      gravacao: {
        passo: 0.1, eventos: [],
        inicial: [{ id: 'a:1', vidaMax: 100 }, { id: 'b:2', vidaMax: 100 }] as never,
        quadros: [{ t: 1, u: { 'a:1': [2, 2, 150, 0, 0, 1], 'b:2': [2, 2, 50, 0, 0, 1] } }],
      },
    }, g);
    expect(categorias(g)).toEqual(expect.arrayContaining(['gravação: vida acima do máximo', 'gravação: dois vivos na mesma casa']));
  });
});
