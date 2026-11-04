import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { S } from '../dados';
import { COMPONENTES, type Partida } from '../tipos';
import {
  aplicarRodada, avancarCarrossel, avancarRodada, carregarPartida, COPIAS_POR_CUSTO, COPIAS_POR_ESTRELA,
  custosDoCarrossel, duracaoDoCarrossel, fimDoPlanejamento, horarioDoGrupo, humano, jogadorDe, jogarBots,
  liberarProximoGrupo, montarCarrossel, novaPartida, OPCOES_DO_CARROSSEL, pegarCarrossel, podePegar, salvarPartida,
  simularRodada, terminarCarrossel, todosPegaram, vivos,
} from './index';
import { dar, limpar, prepararTeste } from './test-helpers';

beforeEach(() => prepararTeste());

/** Partida no fim da 1-3: o próximo avancarRodada abre o carrossel do estágio 2. */
function antesDoEstagio(estagio: number, semente = 1): Partida {
  const p = novaPartida(semente);
  if (estagio === 2) { p.rodada = 3; return p; }
  p.estagio = estagio - 1; p.rodada = 7; p.tipo = estagio - 1 === 2 ? 'monstros' : 'chefe';
  return p;
}

/** Cópias de cada campeão em jogo: pool + unidades de todos os jogadores. */
function contarCopias(p: Partida): Record<string, number> {
  const conta: Record<string, number> = { ...p.pool };
  for (const j of p.jogadores) for (const u of Object.values(j.unidades)) conta[u.campeao] = (conta[u.campeao] ?? 0) + COPIAS_POR_ESTRELA[u.estrela];
  return conta;
}

const custo = (id: string) => S().campeao(id).custo;
const ehComponente = (id: string) => (COMPONENTES as readonly string[]).includes(id);

describe('carrossel', () => {
  it('abre no começo de cada estágio a partir do 2, com 9 opções que saem do pool', () => {
    const p = antesDoEstagio(2);
    const pool = { ...p.pool };
    avancarRodada(p);
    expect([p.estagio, p.rodada, p.fase]).toEqual([2, 1, 'carrossel']);
    const c = p.carrossel!;
    expect(c.opcoes).toHaveLength(OPCOES_DO_CARROSSEL);
    // sem repetir campeão enquanto o custo tiver outro; estrela 1, custos 1–2 e componentes no estágio 2
    for (const k of [1, 2] as const) {
      const doCusto = c.opcoes.filter(o => custo(o.campeao) === k);
      expect(new Set(doCusto.map(o => o.campeao)).size).toBe(Math.min(doCusto.length, S().porCusto[k].length));
    }
    for (const o of c.opcoes) {
      expect([1, 2]).toContain(custo(o.campeao));
      expect(ehComponente(o.item)).toBe(true);
      expect(S().campeao(o.campeao).niveis[0]).toContain(o.forma);
      expect(o.pegou).toBeNull();
    }
    // cada componente aparece pelo menos uma vez
    expect(new Set(c.opcoes.map(o => o.item)).size).toBe(COMPONENTES.length);
    for (const o of c.opcoes) expect(p.pool[o.campeao]).toBe(pool[o.campeao]! - 1);
    // a rodada segue montada (confrontos da 2-1)
    expect(p.confrontos.length).toBeGreaterThan(0);
    // fora do começo do estágio não tem
    terminarCarrossel(p);
    avancarRodada(p);
    expect([p.estagio, p.rodada, p.fase]).toEqual([2, 2, 'planejamento']);
    expect(p.carrossel).toBeUndefined();
  });

  it('custos pelo estágio e item completo do 5 em diante', () => {
    expect(custosDoCarrossel(2)).toEqual([0.5, 0.5, 0, 0, 0]);
    expect(custosDoCarrossel(9)).toEqual(custosDoCarrossel(5));
    for (const [estagio, custos] of [[3, [2, 3]], [4, [3, 4]], [5, [3, 4, 5]], [7, [3, 4, 5]]] as const) {
      const p = antesDoEstagio(estagio, 10 + estagio);
      avancarRodada(p);
      expect(p.fase).toBe('carrossel');
      for (const o of p.carrossel!.opcoes) {
        expect(custos as readonly number[]).toContain(custo(o.campeao));
        expect(ehComponente(o.item)).toBe(estagio < 5);
        if (estagio >= 5) expect(o.item).toMatch(/^\w+\+\w+$/);
      }
    }
  });

  it('ordem: vivos da menor vida pra maior, em duplas; eliminado fica de fora', () => {
    const p = antesDoEstagio(2, 3);
    const vidas: Record<string, number> = { voce: 40, pyrus: 90, aquos: 10, haos: 70, darkus: 55, subterra: 20, ventus: 0, aurelus: 80 };
    for (const j of p.jogadores) j.vida = vidas[j.id]!;
    jogadorDe(p, 'ventus').colocacao = 8;
    avancarRodada(p);
    const c = p.carrossel!;
    expect(c.grupos).toEqual([['aquos', 'subterra'], ['voce', 'darkus'], ['haos', 'aurelus'], ['pyrus']]);
    expect(c.liberados).toBe(0);
    expect(duracaoDoCarrossel(c)).toBe(horarioDoGrupo(3) + 4);
  });

  it('empate de vida é sorteado (pela semente)', () => {
    const ordens = new Set<string>();
    for (let s = 1; s <= 12; s++) {
      const p = antesDoEstagio(2, s);
      avancarRodada(p);
      expect(p.carrossel!.grupos.flat()).toHaveLength(8);
      ordens.add(p.carrossel!.grupos.flat().join());
    }
    expect(ordens.size).toBeGreaterThan(1);
  });

  it('bots pegam na hora em que são liberados; o humano só depois de liberado, uma vez', () => {
    const p = antesDoEstagio(2, 4);
    for (const j of p.jogadores) j.vida = j.bot ? 50 : 100; // humano por último, sozinho (7 vivos)
    Object.assign(jogadorDe(p, 'aurelus'), { vida: 0, colocacao: 8 });
    avancarRodada(p);
    const c = p.carrossel!;
    const eu = humano(p);
    expect(c.grupos.map(g => g.length)).toEqual([2, 2, 2, 1]);
    expect(c.grupos.at(-1)).toEqual(['voce']);
    expect(podePegar(p, eu.id)).toBe(false);
    expect(pegarCarrossel(p, eu.id, 0)).toMatch(/Espere/);
    // antes do horário ninguém sai
    expect(avancarCarrossel(p, horarioDoGrupo(0) - 0.1)).toBe(0);
    expect(c.opcoes.filter(o => o.pegou)).toHaveLength(0);
    // 1ª dupla: os dois bots pegam e levam campeão (banco) e item (soltos)
    expect(avancarCarrossel(p, horarioDoGrupo(0))).toBe(1);
    for (const id of c.grupos[0]!) {
      const o = c.opcoes.find(x => x.pegou === id)!;
      const j = jogadorDe(p, id);
      expect(j.itens).toContain(o.item);
      expect(Object.keys(j.unidades)).toHaveLength(2);
      expect(Object.values(j.unidades).filter(u => u.campeao === o.campeao).length).toBeGreaterThan(0);
    }
    // as outras duplas de bots
    expect(avancarCarrossel(p, horarioDoGrupo(2))).toBe(2);
    expect(c.opcoes.filter(o => o.pegou)).toHaveLength(6);
    expect(todosPegaram(p)).toBe(false);
    expect(podePegar(p, eu.id)).toBe(false);
    expect(avancarCarrossel(p, horarioDoGrupo(3))).toBe(1);
    expect(podePegar(p, eu.id)).toBe(true);
    const i = c.opcoes.findIndex(o => o.pegou == null);
    const pegada = c.opcoes.findIndex(o => o.pegou != null);
    expect(pegarCarrossel(p, eu.id, pegada)).toMatch(/já pegou esse/);
    const ouro = eu.ouro;
    expect(pegarCarrossel(p, eu.id, i)).toBeNull();
    expect(c.opcoes[i]!.pegou).toBe(eu.id);
    expect(eu.itens).toEqual([c.opcoes[i]!.item]);
    expect(Object.values(eu.unidades).some(u => u.campeao === c.opcoes[i]!.campeao && u.estrela === 1)).toBe(true);
    expect(eu.ouro).toBe(ouro);
    expect(pegarCarrossel(p, eu.id, c.opcoes.findIndex(o => o.pegou == null))).toMatch(/já pegou um/);
    expect(todosPegaram(p)).toBe(true);
    expect(podePegar(p, eu.id)).toBe(false);
  });

  it('fim: quem não pegou leva uma ao acaso, o resto volta pro pool e vem o planejamento', () => {
    const p = antesDoEstagio(2, 5);
    const antes = contarCopias(p);
    avancarRodada(p);
    expect(contarCopias(p)).not.toEqual(antes); // 9 fora do pool
    const c = p.carrossel!;
    liberarProximoGrupo(p);
    terminarCarrossel(p);
    expect(p.fase).toBe('planejamento');
    expect(p.carrossel).toBeUndefined();
    // todos os vivos levaram uma (o humano também, ao acaso)
    for (const j of vivos(p)) expect(c.opcoes.filter(o => o.pegou === j.id)).toHaveLength(1);
    expect(c.opcoes.filter(o => o.pegou == null)).toHaveLength(1);
    expect(humano(p).itens).toHaveLength(1);
    // nenhuma cópia sumiu nem apareceu
    expect(contarCopias(p)).toEqual(antes);
    for (const id of Object.keys(antes)) expect(contarCopias(p)[id]).toBeLessThanOrEqual(COPIAS_POR_CUSTO[custo(id)]);
    // terminar de novo não faz nada
    terminarCarrossel(p);
    expect(p.fase).toBe('planejamento');
  });

  it('banco cheio: o campeão é vendido na hora pelo custo (volta pro pool) e o item fica; se fecha evolução, evolui', () => {
    const p = antesDoEstagio(2, 6);
    avancarRodada(p);
    const c = p.carrossel!;
    c.grupos = [['voce'], ...c.grupos.map(g => g.filter(id => id !== 'voce')).filter(g => g.length)];
    const eu = humano(p);
    limpar(eu);
    for (let i = 0; i < 9; i++) dar(p, eu, 'ygo:mago', { banco: i, estrela: 2 });
    liberarProximoGrupo(p);
    const i = 0;
    const o = c.opcoes[i]!;
    const [ouro, pool, nUnidades] = [eu.ouro, p.pool[o.campeao]!, Object.keys(eu.unidades).length];
    expect(pegarCarrossel(p, eu.id, i)).toBeNull();
    expect(o.vendido).toBe(true);
    expect(eu.ouro).toBe(ouro + custo(o.campeao));
    expect(p.pool[o.campeao]).toBe(pool + 1);
    expect(Object.keys(eu.unidades)).toHaveLength(nUnidades);
    expect(eu.itens).toEqual([o.item]);

    // outro carrossel: banco cheio, mas já tem 2 cópias do campeão da opção → evolui pra estrela 2
    const q = antesDoEstagio(2, 7);
    avancarRodada(q);
    const cq = q.carrossel!;
    cq.grupos = [['voce'], ...cq.grupos.map(g => g.filter(id => id !== 'voce')).filter(g => g.length)];
    const eu2 = humano(q);
    limpar(eu2);
    const alvo = cq.opcoes[0]!;
    dar(q, eu2, alvo.campeao, { banco: 0 });
    dar(q, eu2, alvo.campeao, { banco: 1 });
    for (let k = 2; k < 9; k++) dar(q, eu2, 'ygo:mago', { banco: k, estrela: 2 });
    liberarProximoGrupo(q);
    expect(pegarCarrossel(q, eu2.id, 0)).toBeNull();
    expect(alvo.vendido).toBeUndefined();
    const deles = Object.values(eu2.unidades).filter(u => u.campeao === alvo.campeao);
    expect(deles.map(u => u.estrela)).toEqual([2]);
  });

  it('bot prefere campeão que já tem', () => {
    const p = antesDoEstagio(2, 8);
    avancarRodada(p);
    const c = p.carrossel!;
    const bot = jogadorDe(p, c.grupos[0]!.find(id => id !== 'voce')!);
    limpar(bot);
    bot.alvos = [];
    const k = 4;
    dar(p, bot, c.opcoes[k]!.campeao, { banco: 0 });
    // ninguém na frente dele
    c.grupos = [[bot.id], ...c.grupos.map(g => g.filter(id => id !== bot.id)).filter(g => g.length)];
    liberarProximoGrupo(p);
    expect(c.opcoes.find(o => o.pegou === bot.id)?.campeao).toBe(c.opcoes[k]!.campeao);
  });

  it('determinístico pela semente, com o humano pegando no meio', () => {
    const jogar = () => {
      const p = antesDoEstagio(2, 9);
      avancarRodada(p);
      const c = p.carrossel!;
      for (let t = 0; t <= duracaoDoCarrossel(c); t += 0.5) {
        avancarCarrossel(p, t);
        if (podePegar(p, p.voce)) pegarCarrossel(p, p.voce, c.opcoes.findIndex(o => o.pegou == null));
      }
      terminarCarrossel(p);
      return p;
    };
    const a = jogar(), b = jogar();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.jogadores.every(j => j.itens.length === 1)).toBe(true);
  });

  it('montar direto (sem avancarRodada) e terminar sem liberar ninguém: todos levam uma', () => {
    const p = novaPartida(12);
    p.estagio = 3;
    montarCarrossel(p);
    expect(p.fase).toBe('carrossel');
    terminarCarrossel(p);
    expect(vivos(p).every(j => j.itens.length === 1)).toBe(true);
  });

  it('fim do planejamento fecha um carrossel que ficou aberto', () => {
    const p = antesDoEstagio(2, 13);
    avancarRodada(p);
    fimDoPlanejamento(p);
    expect(p.carrossel).toBeUndefined();
    expect(vivos(p).every(j => j.itens.length === 1)).toBe(true);
  });
});

describe('carrossel e salvar', () => {
  let guardado: Map<string, string>;
  beforeEach(() => {
    guardado = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => guardado.get(k) ?? null,
      setItem: (k: string, v: string) => { guardado.set(k, v); },
      removeItem: (k: string) => { guardado.delete(k); },
    });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('salvo no planejamento depois do carrossel, carregado, continua igual até o próximo carrossel', () => {
    const p = novaPartida(31);
    const rodada = (x: Partida) => {
      fimDoPlanejamento(x); aplicarRodada(x, simularRodada(x)); avancarRodada(x);
      if (x.carrossel) { avancarCarrossel(x, 999); terminarCarrossel(x); }
      jogarBots(x);
    };
    jogarBots(p);
    for (let r = 0; r < 3; r++) rodada(p);
    expect([p.estagio, p.rodada, p.fase]).toEqual([2, 1, 'planejamento']);
    salvarPartida(p);
    const q = carregarPartida()!;
    expect(q).toEqual(JSON.parse(JSON.stringify(p)));
    expect(q.carrossel).toBeUndefined();
    // os dois seguem iguais, passando pelo carrossel do estágio 3
    for (const x of [p, q]) for (let r = 0; r < 8; r++) rodada(x);
    expect([q.estagio, q.rodada]).toEqual([3, 2]);
    expect(JSON.stringify(q)).toBe(JSON.stringify(p));
  });
});
