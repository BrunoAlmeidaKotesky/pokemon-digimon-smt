import { beforeEach, describe, expect, it } from 'vitest';
import { novaPartidaComHumanos } from '../partida';
import { prepararTeste } from '../partida/test-helpers';
import {
  daRede, lerAcao, lerMsgAnfitriao, lerMsgConvidado, MAX_MSG_CONVIDADO, paraRede, type MsgAnfitriao,
} from './protocolo';
import { basePraVer, juntarVisao, jogadorProprio, jogadorPublico, visaoDaPartida } from './visao';

beforeEach(() => prepararTeste());

describe('protocolo: o que vem do convidado', () => {
  it('ações válidas viram um objeto novo só com os campos conhecidos', () => {
    expect(lerAcao({ tipo: 'comprar', i: 3, extra: 'x' })).toEqual({ tipo: 'comprar', i: 3 });
    expect(lerAcao({ tipo: 'mover', uid: 12, para: { tipo: 'tabuleiro', casa: { col: 7, lin: 3 } } }))
      .toEqual({ tipo: 'mover', uid: 12, para: { tipo: 'tabuleiro', casa: { col: 7, lin: 3 } } });
    expect(lerAcao({ tipo: 'mover', uid: 12, para: { tipo: 'banco', i: 8 } })).toEqual({ tipo: 'mover', uid: 12, para: { tipo: 'banco', i: 8 } });
    expect(lerAcao({ tipo: 'pronto' })).toEqual({ tipo: 'pronto' });
    expect(lerAcao({ tipo: 'pronto', valor: false })).toEqual({ tipo: 'pronto', valor: false });
    expect(lerAcao({ tipo: 'ult', uid: 1, ult: 'tanque' })).toEqual({ tipo: 'ult', uid: 1, ult: 'tanque' });
    expect(lerAcao({ tipo: 'juntar', i: 0, k: 2 })).toEqual({ tipo: 'juntar', i: 0, k: 2 });
  });

  it('ações tortas são ignoradas', () => {
    for (const x of [
      null, 'comprar', [], { tipo: 'roubar' }, { tipo: 'comprar' }, { tipo: 'comprar', i: -1 }, { tipo: 'comprar', i: 1.5 },
      { tipo: 'comprar', i: 999 }, { tipo: 'vender', uid: '3' }, { tipo: 'mover', uid: 1, para: { tipo: 'tabuleiro', casa: { col: 8, lin: 0 } } },
      { tipo: 'mover', uid: 1, para: { tipo: 'tabuleiro', casa: { col: 0, lin: 4 } } }, { tipo: 'mover', uid: 1, para: { tipo: 'banco', i: 9 } },
      { tipo: 'pronto', valor: 'sim' }, { tipo: 'evolucao', forma: 'x'.repeat(500) }, { tipo: 'equipar', i: 0 },
    ]) expect(lerAcao(x)).toBeNull();
  });

  it('mensagens: ola, escolher, ação, viu; texto grande ou que não é JSON não passa', () => {
    const ola = { t: 'ola', aparelho: 'abcdefgh12', versao: 'p1|x|y', escolhas: { nome: 'Ana', avatar: null, estilo: 'neve' } };
    expect(lerMsgConvidado(daRede(JSON.stringify(ola), MAX_MSG_CONVIDADO))).toEqual(ola);
    expect(lerMsgConvidado({ ...ola, aparelho: 'curta' })).toBeNull();
    expect(lerMsgConvidado({ ...ola, escolhas: { nome: 3, avatar: null, estilo: 'neve' } })).toBeNull();
    expect(lerMsgConvidado({ t: 'acao', acao: { tipo: 'xp' } })).toEqual({ t: 'acao', acao: { tipo: 'xp' } });
    expect(lerMsgConvidado({ t: 'acao', acao: { tipo: 'xp', jogador: 'h3' } })).toEqual({ t: 'acao', acao: { tipo: 'xp' } });
    expect(lerMsgConvidado({ t: 'viu', luta: '2-3' })).toEqual({ t: 'viu', luta: '2-3' });
    expect(lerMsgConvidado({ t: 'vender-tudo' })).toBeNull();
    expect(daRede('{"t":"ping"', MAX_MSG_CONVIDADO)).toBeNull();
    expect(daRede({ t: 'ping' }, MAX_MSG_CONVIDADO)).toBeNull();
    expect(daRede(`"${'x'.repeat(MAX_MSG_CONVIDADO)}"`, MAX_MSG_CONVIDADO)).toBeNull();
  });
});

describe('protocolo e visão: o que vem do anfitrião', () => {
  it('cada um vê o próprio Jogador inteiro e o público dos outros; sem pool nem semente', () => {
    const p = novaPartidaComHumanos(9, [{ id: 'h1', escolhas: {} }, { id: 'h2', escolhas: {} }], 'facil', 'h1');
    const v = visaoDaPartida(p, 'h2', 1234);
    expect(v.voce).toBe('h2');
    expect(v.semente).toBe(1234);
    expect(v.pool).toEqual({});
    const h2 = v.jogadores.find(j => j.id === 'h2')!;
    expect(h2.loja).toEqual(p.jogadores.find(j => j.id === 'h2')!.loja);
    for (const j of v.jogadores.filter(x => x.id !== 'h2')) {
      expect(j.loja).toEqual([]);
      expect(j.unidades).toEqual(p.jogadores.find(x => x.id === j.id)!.unidades);
    }
    expect(p.jogadores[0]!.loja.length).toBeGreaterThan(0); // a original não mudou
  });

  it('a partida em partes passa pela rede e se junta com a anterior', () => {
    const p = novaPartidaComHumanos(10, [{ id: 'h1', escolhas: {} }, { id: 'h2', escolhas: {} }], 'facil', 'h1');
    const ids = p.jogadores.map(j => j.id);
    const tudo: MsgAnfitriao = {
      t: 'estado', tempo: { relogioMs: 20000, carrossel: null },
      partida: { base: basePraVer(p, 'h2', 7), ids, jogadores: p.jogadores.map(j => (j.id === 'h2' ? jogadorProprio(j) : jogadorPublico(j))) },
    };
    const m1 = lerMsgAnfitriao(daRede(paraRede(tudo), 4_000_000));
    expect(m1?.t).toBe('estado');
    if (m1?.t !== 'estado' || !m1.partida) throw new Error('não leu');
    const v1 = juntarVisao(null, m1.partida.base, m1.partida.ids, m1.partida.jogadores)!;
    expect(v1).toEqual(JSON.parse(JSON.stringify(visaoDaPartida(p, 'h2', 7))));
    // só um jogador mudou: vem só ele, sem a base
    p.jogadores[3]!.vida = 55;
    const m2 = lerMsgAnfitriao(daRede(paraRede({ t: 'estado', tempo: { relogioMs: null, carrossel: null }, partida: { ids, jogadores: [jogadorPublico(p.jogadores[3]!)] } }), 4_000_000));
    if (m2?.t !== 'estado' || !m2.partida) throw new Error('não leu');
    const v2 = juntarVisao(v1, m2.partida.base, m2.partida.ids, m2.partida.jogadores)!;
    expect(v2.jogadores[3]!.vida).toBe(55);
    expect(v2.jogadores[0]).toBe(v1.jogadores[0]);
    // sem a anterior, uma parte sem base não monta nada
    expect(juntarVisao(null, undefined, ids, [])).toBeNull();
  });

  it('mensagens tortas do anfitrião são ignoradas', () => {
    for (const x of [
      { t: 'estado', partida: { ids: ['a'], jogadores: [{ id: 'a' }] }, tempo: { relogioMs: null, carrossel: null } },
      { t: 'estado', partida: null, tempo: { relogioMs: -5, carrossel: null } },
      { t: 'luta', luta: { chave: '1-1', entradaA: { dono: 'x', lutadores: [{ id: '1', casa: { col: 0, lin: 0 } }] }, entradaB: { dono: 'y', lutadores: [] }, semente: 1, lado: 'a', adversario: 'y' } },
      { t: 'luta', luta: { chave: '1-1', entradaA: { dono: 'x', lutadores: [] }, entradaB: { dono: 'y', lutadores: [] }, semente: -1, lado: 'a', adversario: 'y' } },
      { t: 'sala', sala: { codigo: 'ABCD', anfitriao: 'h1', voce: 'h2', lugares: [], regras: { relogio: true, segundos: 30, dificuldade: 'impossivel' }, emPartida: false } },
      { t: 'aviso' }, { t: 'qualquer' }, 7,
    ]) expect(lerMsgAnfitriao(x)).toBeNull();
    expect(lerMsgAnfitriao({ t: 'encerrada', motivo: 'O anfitrião fechou a sala.' })).toEqual({ t: 'encerrada', motivo: 'O anfitrião fechou a sala.' });
    expect(lerMsgAnfitriao({ t: 'recusado', motivo: 'cheia' })).toEqual({ t: 'recusado', motivo: 'cheia', versao: false });
  });
});
