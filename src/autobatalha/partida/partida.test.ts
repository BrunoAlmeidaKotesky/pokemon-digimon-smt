import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { S } from '../dados';
import { criarRng } from '../rng';
import type { Partida } from '../tipos';
import {
  acabou, alternarPosicao, aplicarRodada, atualizarLoja, avancarRodada, bonusSequencia, carregarPartida, CHANCES_LOJA,
  chancesLoja, comprar, comprarXp, contaNoLimite, COPIAS_POR_CUSTO, danoDerrota, equipar, escolherEvolucao,
  fimDoPlanejamento, humano, jogadorDe, jogarBot, jogarBots, juros, limiteTabuleiro, mover, terminarCarrossel,
  MSG_LIMITE, novaPartida, ondeEsta, rendaDaRodada, rodadasDoEstagio, salvarPartida, simularRodada, sortearConfrontos,
  sortearLoja, standDe, travarLoja, unidadesNoTabuleiro, valorVenda, vender, vivos, xpParaProximo, apagarPartida,
  temPartidaSalva, CHAVE_PARTIDA, escolherUlt, gerarMonstros, montarTime, BONUS_DEADLOCK_POR_10_ALMAS,
  BONUS_OVERWATCH, ALMAS_POR_ABATE, CHANCE_SUJIMON, definirMotor,
} from './index';
import { contarTracosFalso, dar, limpar, lutaGanha, prepararTeste, resultado } from './test-helpers';

beforeEach(() => prepararTeste());

/** Partida nova com o humano (e opcionalmente outro jogador) sem nada. */
function cenario(semente = 1): { p: Partida; eu: ReturnType<typeof humano> } {
  const p = novaPartida(semente);
  const eu = humano(p);
  limpar(eu);
  eu.ouro = 100;
  return { p, eu };
}

describe('constantes e consultas', () => {
  it('xp por nível, chances e rodadas', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(xpParaProximo)).toEqual([2, 2, 6, 10, 20, 36, 48, 76, 84, 0]);
    for (let n = 1; n <= 10; n++) expect(chancesLoja(n).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(chancesLoja(7)).toEqual([0.19, 0.3, 0.4, 0.1, 0.01]);
    expect(rodadasDoEstagio(1)).toEqual(['monstros', 'monstros', 'monstros']);
    expect(rodadasDoEstagio(2)).toEqual(['pvp', 'pvp', 'pvp', 'pvp', 'pvp', 'pvp', 'monstros']);
    expect(rodadasDoEstagio(4).at(-1)).toBe('chefe');
  });

  it('valor de venda', () => {
    const u = (campeao: string, estrela: 1 | 2 | 3) => ({ uid: 1, campeao, estrela, forma: S().formaPadrao(campeao, estrela), itens: [] });
    expect(valorVenda(u('pokemon:squirtle', 1))).toBe(1);
    expect(valorVenda(u('pokemon:squirtle', 2))).toBe(3);
    expect(valorVenda(u('pokemon:squirtle', 3))).toBe(9);
    expect(valorVenda(u('pokemon:eevee', 2))).toBe(5);
    expect(valorVenda(u('lol:jinx', 3))).toBe(35);
  });
});

describe('partida nova', () => {
  it('8 jogadores com vida, ouro, nível, campeão de graça e loja', () => {
    const p = novaPartida(42);
    expect(p.jogadores.map(j => j.nome)).toEqual(['Você', 'Pyrus', 'Aquos', 'Haos', 'Darkus', 'Subterra', 'Ventus', 'Aurelus']);
    for (const j of p.jogadores) {
      expect(j.vida).toBe(100);
      expect(j.ouro).toBe(1);
      expect(j.nivel).toBe(1);
      expect(j.avatar).toMatch(/\.webp$/);
      const us = Object.values(j.unidades);
      expect(us).toHaveLength(1);
      expect(S().campeao(us[0]!.campeao).custo).toBe(1);
      expect(unidadesNoTabuleiro(j)).toHaveLength(1);
      expect(j.loja).toHaveLength(7);
    }
    const dados = S().dados.campeoes;
    const tirados = dados.reduce((s, c) => s + COPIAS_POR_CUSTO[c.custo] - p.pool[c.id]!, 0);
    expect(tirados).toBe(8);
    expect(p.estagio).toBe(1);
    expect(p.tipo).toBe('monstros');
    expect(p.monstros).toHaveLength(2);
    expect(p.confrontos).toHaveLength(8);
  });

  it('a mesma semente dá a mesma partida', () => {
    expect(JSON.stringify(novaPartida(7))).toBe(JSON.stringify(novaPartida(7)));
    expect(JSON.stringify(novaPartida(7))).not.toBe(JSON.stringify(novaPartida(8)));
  });
});

describe('economia', () => {
  it('juros, sequência e renda', () => {
    expect([0, 9, 10, 19, 49, 50, 99].map(juros)).toEqual([0, 0, 1, 1, 4, 5, 5]);
    expect([0, 1, 2, 3, 4, 5, 9, -2, -4, -7].map(bonusSequencia)).toEqual([0, 0, 1, 1, 2, 3, 3, 1, 2, 3]);
    expect(rendaDaRodada(1, 1, 10, 0)).toBe(0);
    expect(rendaDaRodada(1, 2, 10, 0)).toBe(2);
    expect(rendaDaRodada(1, 3, 50, 5)).toBe(2);
    expect(rendaDaRodada(2, 1, 35, -4)).toBe(5 + 3 + 2);
    expect(rendaDaRodada(4, 3, 80, 6)).toBe(5 + 5 + 3);
  });

  it('avançar pra 2-1 dá renda, XP e loja nova (a travada fica)', () => {
    const p = novaPartida(3);
    p.rodada = 3;
    const [a, b] = [jogadorDe(p, 'pyrus'), jogadorDe(p, 'aquos')];
    a.ouro = 23; a.sequencia = 2; a.nivel = 3; a.xp = 0;
    b.lojaTravada = true;
    const lojaB = [...b.loja];
    avancarRodada(p);
    expect([p.estagio, p.rodada, p.tipo, p.fase]).toEqual([2, 1, 'pvp', 'carrossel']);
    expect(a.ouro).toBe(23 + 5 + 2 + 1);
    expect(a.xp).toBe(2);
    expect(b.loja).toEqual(lojaB);
  });

  it('comprar XP sobe de nível', () => {
    const { p, eu } = cenario();
    eu.ouro = 9;
    expect(comprarXp(p, eu.id)).toBeNull();
    expect([eu.nivel, eu.xp, eu.ouro]).toEqual([3, 0, 5]);
    expect(comprarXp(p, eu.id)).toBeNull();
    expect([eu.nivel, eu.xp]).toEqual([3, 4]);
    expect(comprarXp(p, eu.id)).toBe('Ouro insuficiente');
  });
});

describe('loja', () => {
  it('chances de custo por nível (estatístico)', () => {
    const { p, eu } = cenario(11);
    const rng = criarRng(99);
    for (const nivel of [1, 4, 7, 10]) {
      eu.nivel = nivel;
      const conta = [0, 0, 0, 0, 0];
      const lojas = 3000;
      for (let k = 0; k < lojas; k++) {
        sortearLoja(p, eu, rng);
        for (const id of eu.loja) conta[S().campeao(id!).custo - 1]!++;
      }
      const esperado = CHANCES_LOJA[nivel - 1]!;
      conta.forEach((n, i) => expect(Math.abs((100 * n) / (lojas * 7) - esperado[i]!)).toBeLessThan(1.5));
    }
  });

  it('peso 4 pro campeão que o jogador já tem', () => {
    const { p, eu } = cenario(12);
    dar(p, eu, 'pokemon:squirtle', { casa: [3, 0] });
    const rng = criarRng(5);
    const custo1 = S().porCusto[1].length;
    let squirtle = 0, total = 0;
    for (let k = 0; k < 4000; k++) {
      sortearLoja(p, eu, rng);
      for (let i = 0; i < 6; i++) { total++; if (eu.loja[i] === 'pokemon:squirtle') squirtle++; }
    }
    // squirtle tem 21 cópias (uma comprada), os outros 22: 4·21 / (4·21 + 22·(n − 1))
    const esperado = (4 * 21) / (4 * 21 + 22 * (custo1 - 1));
    expect(Math.abs(squirtle / total - esperado)).toBeLessThan(0.02);
  });

  it('vaga do time: só campeões que dividem origem ou classe (tabuleiro, senão banco)', () => {
    const { p, eu } = cenario(13);
    const rng = criarRng(6);
    const u = dar(p, eu, 'overwatch:tracer', { banco: 0 });
    const tracos = new Set(['overwatch', 'assassino']);
    const divide = (id: string) => S().tracosDoCampeao(id).some(t => tracos.has(t));
    for (let k = 0; k < 300; k++) { sortearLoja(p, eu, rng); expect(divide(eu.loja[6]!)).toBe(true); }
    // no tabuleiro um Squirtle: a vaga do time segue o tabuleiro
    mover(p, eu.id, u.uid, { tipo: 'banco', i: 1 });
    dar(p, eu, 'pokemon:squirtle', { casa: [3, 0] });
    const doTime = (id: string) => S().tracosDoCampeao(id).some(t => ['pokemon', 'tanque', 'agua'].includes(t));
    for (let k = 0; k < 300; k++) { sortearLoja(p, eu, rng); expect(doTime(eu.loja[6]!)).toBe(true); }
  });

  it('campeão sem cópia não sai na loja', () => {
    const { p, eu } = cenario(14);
    for (const c of S().porCusto[1]) if (c.id !== 'pokemon:rotom') p.pool[c.id] = 0;
    for (let k = 0; k < 50; k++) {
      sortearLoja(p, eu);
      expect(eu.loja.every(id => id === 'pokemon:rotom')).toBe(true);
      expect(eu.lojaFormas!.every(f => f === 'pokemon:Rotom-W' || f === 'pokemon:Rotom-H')).toBe(true);
    }
  });

  it('atualizar custa 2 e travar alterna', () => {
    const { p, eu } = cenario(15);
    eu.ouro = 3;
    expect(atualizarLoja(p, eu.id)).toBeNull();
    expect(eu.ouro).toBe(1);
    expect(atualizarLoja(p, eu.id)).toBe('Ouro insuficiente');
    travarLoja(p, eu.id);
    expect(eu.lojaTravada).toBe(true);
  });

  it('pool não fica negativo e vender devolve as cópias e os itens', () => {
    const { p, eu } = cenario(16);
    p.pool['pokemon:squirtle'] = 1;
    eu.loja = ['pokemon:squirtle', 'pokemon:squirtle', null, null, null, null, null];
    eu.lojaFormas = [null, null, null, null, null, null, null];
    expect(comprar(p, eu.id, 0)).toBeNull();
    expect(comprar(p, eu.id, 1)).toBe('Esgotado');
    expect(p.pool['pokemon:squirtle']).toBe(0);
    const u2 = dar(p, eu, 'pokemon:eevee', { estrela: 2, forma: 'pokemon:Jolteon', itens: ['pyrus'] });
    const pool = p.pool['pokemon:eevee']!;
    const ouro = eu.ouro;
    expect(vender(p, eu.id, u2.uid)).toBeNull();
    expect(p.pool['pokemon:eevee']).toBe(pool + 3);
    expect(eu.ouro).toBe(ouro + 5);
    expect(eu.itens).toEqual(['pyrus']);
    expect(eu.unidades[u2.uid]).toBeUndefined();
  });

  it('banco cheio: só compra se fechar evolução', () => {
    const { p, eu } = cenario(17);
    for (let i = 0; i < 9; i++) dar(p, eu, i < 2 ? 'pokemon:squirtle' : 'sujimon:a', { banco: i, estrela: i < 2 ? 1 : 2 });
    eu.loja = ['overwatch:tracer', 'pokemon:squirtle', null, null, null, null, null];
    expect(comprar(p, eu.id, 0)).toBe('Banco cheio');
    expect(comprar(p, eu.id, 1)).toBeNull();
    const squirtles = Object.values(eu.unidades).filter(u => u.campeao === 'pokemon:squirtle');
    expect(squirtles.map(u => u.estrela)).toEqual([2]);
    expect(ondeEsta(eu, squirtles[0]!.uid)).toEqual({ tipo: 'banco', i: 0 });
  });
});

describe('evolução', () => {
  it('★2 fica no lugar da do tabuleiro e soma os itens (componentes viram completo)', () => {
    const { p, eu } = cenario(20);
    const a = dar(p, eu, 'pokemon:squirtle', { casa: [2, 0], itens: ['pyrus'] });
    dar(p, eu, 'pokemon:squirtle', { banco: 0, itens: ['aurelus'] });
    eu.loja = ['pokemon:squirtle', null, null, null, null, null, null];
    expect(comprar(p, eu.id, 0)).toBeNull();
    const us = Object.values(eu.unidades);
    expect(us).toHaveLength(1);
    expect(us[0]!.uid).toBe(a.uid);
    expect(us[0]!.estrela).toBe(2);
    expect(us[0]!.forma).toBe('pokemon:Wartortle');
    expect(us[0]!.itens).toEqual(['pyrus+aurelus']);
    expect(ondeEsta(eu, a.uid)).toEqual({ tipo: 'tabuleiro', casa: { col: 2, lin: 0 } });
    expect(eu.banco.every(x => x == null)).toBe(true);
  });

  it('★3 em cadeia, itens além de 3 voltam pros soltos', () => {
    const { p, eu } = cenario(21);
    dar(p, eu, 'pokemon:squirtle', { estrela: 2, banco: 3, itens: ['pyrus+aquos', 'haos+darkus'] });
    dar(p, eu, 'pokemon:squirtle', { estrela: 2, banco: 1, itens: ['subterra+ventus', 'aurelus+aurelus'] });
    dar(p, eu, 'pokemon:squirtle', { banco: 5 });
    dar(p, eu, 'pokemon:squirtle', { banco: 6 });
    eu.loja = ['pokemon:squirtle', null, null, null, null, null, null];
    expect(comprar(p, eu.id, 0)).toBeNull();
    const us = Object.values(eu.unidades);
    expect(us).toHaveLength(1);
    expect(us[0]!.estrela).toBe(3);
    expect(us[0]!.forma).toBe('pokemon:Blastoise');
    // a comprada entrou na vaga 0: as ★1 fundem lá (a mais à esquerda) e a ★3 também
    expect(ondeEsta(eu, us[0]!.uid)).toEqual({ tipo: 'banco', i: 0 });
    expect(us[0]!.itens).toHaveLength(3);
    expect([...us[0]!.itens, ...eu.itens].sort()).toEqual(['aurelus+aurelus', 'haos+darkus', 'pyrus+aquos', 'subterra+ventus']);
  });

  it('alternativa sem `de`: o humano escolhe; o bot sorteia; o fim do planejamento sorteia', () => {
    const { p, eu } = cenario(22);
    dar(p, eu, 'pokemon:ralts', { estrela: 2 });
    dar(p, eu, 'pokemon:ralts', { estrela: 2 });
    dar(p, eu, 'pokemon:ralts');
    dar(p, eu, 'pokemon:ralts');
    eu.loja = ['pokemon:ralts', null, null, null, null, null, null];
    comprar(p, eu.id, 0);
    const u = Object.values(eu.unidades)[0]!;
    expect(u.estrela).toBe(3);
    expect(eu.escolhaPendente).toEqual({ uid: u.uid, opcoes: ['pokemon:Gardevoir', 'pokemon:Gallade'] });
    expect(escolherEvolucao(p, eu.id, 'pokemon:Squirtle')).toMatch(/opções/);
    expect(escolherEvolucao(p, eu.id, 'pokemon:Gallade')).toBeNull();
    expect(u.forma).toBe('pokemon:Gallade');
    expect(eu.escolhaPendente).toBeUndefined();

    // sem resposta: sorteia no fim do planejamento
    limpar(eu);
    for (let k = 0; k < 3; k++) dar(p, eu, 'pokemon:ralts', { estrela: 2 });
    eu.loja = ['pokemon:ralts', null, null, null, null, null, null];
    dar(p, eu, 'pokemon:ralts'); dar(p, eu, 'pokemon:ralts');
    comprar(p, eu.id, 0);
    expect(Object.values(eu.unidades)).toHaveLength(2); // a ★3 nova e uma ★2 (3 ★2 + a nova ★2 = 4 → 1 ★3 + 1 ★2)
    expect(eu.escolhaPendente).toBeDefined();
    fimDoPlanejamento(p);
    expect(eu.escolhaPendente).toBeUndefined();
    expect(Object.values(eu.unidades).some(x => x.estrela === 3 && ['pokemon:Gardevoir', 'pokemon:Gallade'].includes(x.forma))).toBe(true);

    // bot: escolhe na hora
    const bot = jogadorDe(p, 'pyrus');
    limpar(bot);
    bot.ouro = 10;
    p.pool['pokemon:ralts'] = 22;
    dar(p, bot, 'pokemon:ralts', { estrela: 2 }); dar(p, bot, 'pokemon:ralts', { estrela: 2 });
    dar(p, bot, 'pokemon:ralts'); dar(p, bot, 'pokemon:ralts');
    bot.loja = ['pokemon:ralts', null, null, null, null, null, null];
    comprar(p, bot.id, 0);
    const b3 = Object.values(bot.unidades)[0]!;
    expect(b3.estrela).toBe(3);
    expect(['pokemon:Gardevoir', 'pokemon:Gallade']).toContain(b3.forma);
    expect(bot.escolhaPendente).toBeUndefined();
  });

  it('alternativa com `de` (Eevee): a forma vem da anterior; formas misturadas viram escolha', () => {
    const { p, eu } = cenario(23);
    for (let k = 0; k < 2; k++) dar(p, eu, 'pokemon:eevee', { estrela: 2, forma: 'pokemon:Jolteon' });
    dar(p, eu, 'pokemon:eevee'); dar(p, eu, 'pokemon:eevee');
    eu.loja = ['pokemon:eevee', null, null, null, null, null, null];
    comprar(p, eu.id, 0);
    // a ★2 nova (Eevee → Vaporeon ou Jolteon) pede escolha antes da cadeia
    expect(eu.escolhaPendente?.opcoes).toEqual(['pokemon:Vaporeon', 'pokemon:Jolteon']);
    expect(Object.values(eu.unidades).filter(u => u.estrela === 2)).toHaveLength(3);
    escolherEvolucao(p, eu.id, 'pokemon:Jolteon');
    let us = Object.values(eu.unidades);
    expect(us).toHaveLength(1);
    expect(us[0]!.forma).toBe('pokemon:Raikou');
    expect(eu.escolhaPendente).toBeUndefined();

    limpar(eu);
    dar(p, eu, 'pokemon:eevee', { estrela: 2, forma: 'pokemon:Jolteon' });
    dar(p, eu, 'pokemon:eevee', { estrela: 2, forma: 'pokemon:Vaporeon' });
    dar(p, eu, 'pokemon:eevee'); dar(p, eu, 'pokemon:eevee');
    eu.loja = ['pokemon:eevee', null, null, null, null, null, null];
    comprar(p, eu.id, 0);
    escolherEvolucao(p, eu.id, 'pokemon:Jolteon');
    us = Object.values(eu.unidades);
    expect(us).toHaveLength(1);
    expect(eu.escolhaPendente?.opcoes).toEqual(['pokemon:Suicune', 'pokemon:Raikou']);
    escolherEvolucao(p, eu.id, 'pokemon:Suicune');
    expect(us[0]!.forma).toBe('pokemon:Suicune');
  });

  it('alternativa no nível 1 (solto): a loja guarda a forma e a ★2 continua a forma', () => {
    const { p, eu } = cenario(24);
    eu.loja = Array(7).fill('pokemon:rotom');
    eu.lojaFormas = ['pokemon:Rotom-H', 'pokemon:Rotom-H', 'pokemon:Rotom-H', 'pokemon:Rotom-W', 'pokemon:Rotom-W', 'pokemon:Rotom-H', null];
    comprar(p, eu.id, 0);
    expect(Object.values(eu.unidades)[0]!.forma).toBe('pokemon:Rotom-H');
    comprar(p, eu.id, 1); comprar(p, eu.id, 2);
    expect(Object.values(eu.unidades).map(u => [u.estrela, u.forma])).toEqual([[2, 'pokemon:Rotom-H']]);
    comprar(p, eu.id, 3); comprar(p, eu.id, 4); comprar(p, eu.id, 5);
    // W, W, H → ★2 com escolha entre as formas que vieram
    expect(eu.escolhaPendente?.opcoes.sort()).toEqual(['pokemon:Rotom-H', 'pokemon:Rotom-W']);
  });
});

describe('tabuleiro e Stands', () => {
  it('limite do tabuleiro = nível; trocar não passa do limite', () => {
    const { p, eu } = cenario(30);
    const a = dar(p, eu, 'pokemon:squirtle', { casa: [3, 0] });
    const b = dar(p, eu, 'sujimon:a', { banco: 0 });
    expect(limiteTabuleiro(eu)).toBe(1);
    expect(mover(p, eu.id, b.uid, { tipo: 'tabuleiro', casa: { col: 4, lin: 0 } })).toBe(MSG_LIMITE);
    expect(ondeEsta(eu, b.uid)).toEqual({ tipo: 'banco', i: 0 });
    // trocar com a do tabuleiro pode
    expect(mover(p, eu.id, b.uid, { tipo: 'tabuleiro', casa: { col: 3, lin: 0 } })).toBeNull();
    expect(ondeEsta(eu, a.uid)).toEqual({ tipo: 'banco', i: 0 });
    expect(ondeEsta(eu, b.uid)).toEqual({ tipo: 'tabuleiro', casa: { col: 3, lin: 0 } });
    // mover dentro do tabuleiro pode
    expect(mover(p, eu.id, b.uid, { tipo: 'tabuleiro', casa: { col: 0, lin: 3 } })).toBeNull();
    eu.nivel = 2;
    expect(mover(p, eu.id, a.uid, { tipo: 'tabuleiro', casa: { col: 4, lin: 0 } })).toBeNull();
    expect(contaNoLimite(eu)).toBe(2);
    expect(mover(p, eu.id, a.uid, { tipo: 'tabuleiro', casa: { col: 8, lin: 0 } })).toBe('Lugar inválido');
  });

  it('Stand preso a uma unidade de outra origem, não conta no limite e segue o usuário', () => {
    const { p, eu } = cenario(31);
    const sq = dar(p, eu, 'pokemon:squirtle', { casa: [3, 0] });
    const jo = dar(p, eu, 'jojo:jotaro', { banco: 1 });
    const sp = dar(p, eu, 'jojo:star-platinum', { banco: 0 });
    // longe de todo mundo: não pode
    expect(mover(p, eu.id, sp.uid, { tipo: 'tabuleiro', casa: { col: 7, lin: 3 } })).toMatch(/Stand/);
    // ao lado do Squirtle: prende (nível 1 e já tem 1 unidade: o Stand não conta)
    expect(mover(p, eu.id, sp.uid, { tipo: 'tabuleiro', casa: { col: 3, lin: 1 } })).toBeNull();
    expect(sp.usuario).toBe(sq.uid);
    expect(standDe(eu, sq.uid)?.uid).toBe(sp.uid);
    expect(contaNoLimite(eu)).toBe(1);
    expect(unidadesNoTabuleiro(eu)).toHaveLength(2);
    // mover o usuário leva o Stand pra uma casa ao lado
    expect(mover(p, eu.id, sq.uid, { tipo: 'tabuleiro', casa: { col: 6, lin: 2 } })).toBeNull();
    const c = ondeEsta(eu, sp.uid);
    expect(c?.tipo).toBe('tabuleiro');
    if (c?.tipo === 'tabuleiro') {
      const d = Math.max(Math.abs(c.casa.col - 6), Math.abs(c.casa.lin - 2));
      expect(d).toBe(1);
    }
    expect(sp.usuario).toBe(sq.uid);
    // solto em cima do usuário: vai pra casa livre ao lado
    mover(p, eu.id, sp.uid, { tipo: 'banco', i: 0 });
    expect(sp.usuario).toBeUndefined();
    expect(mover(p, eu.id, sp.uid, { tipo: 'tabuleiro', casa: { col: 6, lin: 2 } })).toBeNull();
    expect(sp.usuario).toBe(sq.uid);
    expect(ondeEsta(eu, sq.uid)).toEqual({ tipo: 'tabuleiro', casa: { col: 6, lin: 2 } });
    // JoJo não segura Stand (mesma origem)
    eu.nivel = 2;
    mover(p, eu.id, jo.uid, { tipo: 'tabuleiro', casa: { col: 0, lin: 0 } });
    expect(mover(p, eu.id, sp.uid, { tipo: 'tabuleiro', casa: { col: 0, lin: 0 } })).toMatch(/outra franquia/);
    // usuário sai do tabuleiro: Stand volta pro banco
    expect(mover(p, eu.id, sq.uid, { tipo: 'banco', i: 5 })).toBeNull();
    expect(ondeEsta(eu, sp.uid)?.tipo).toBe('banco');
    expect(sp.usuario).toBeUndefined();
  });

  it('antes da luta: preenche com o banco, Stand sem usuário volta, time montado com Deadlock', () => {
    const { p, eu } = cenario(32);
    eu.nivel = 3;
    dar(p, eu, 'overwatch:tracer', { banco: 0 });
    const forte = dar(p, eu, 'lol:jinx', { banco: 1 });
    const h1 = dar(p, eu, 'deadlock:haze', { casa: [3, 0] });
    dar(p, eu, 'deadlock:infernus', { banco: 2, estrela: 2 });
    const sp = dar(p, eu, 'jojo:star-platinum', { casa: [7, 3] });
    eu.almas = 25;
    fimDoPlanejamento(p);
    expect(contaNoLimite(eu)).toBe(3);
    expect(ondeEsta(eu, forte.uid)?.tipo).toBe('tabuleiro');
    // atirador vai pra trás
    const cf = ondeEsta(eu, forte.uid);
    expect(cf?.tipo === 'tabuleiro' && cf.casa.lin).toBe(3);
    expect(ondeEsta(eu, sp.uid)?.tipo).toBe('banco');
    const time = montarTime(eu);
    expect(time.lutadores).toHaveLength(3);
    // 2 do Deadlock = 1º degrau; 25 almas = 2 dezenas
    const haze = time.lutadores.find(l => l.id === String(h1.uid))!;
    const extra = BONUS_DEADLOCK_POR_10_ALMAS[0] * 2;
    expect(haze.unidade!.bonus).toEqual({ vida: extra, dano: extra });
    expect(eu.unidades[h1.uid]!.bonus).toBeUndefined();
  });
});

describe('itens', () => {
  it('equipar: componente + componente vira completo; até 3', () => {
    const { p, eu } = cenario(40);
    const u = dar(p, eu, 'pokemon:squirtle', { casa: [3, 0] });
    eu.itens = ['pyrus', 'aquos', 'haos+darkus', 'aurelus+aurelus', 'ventus'];
    expect(equipar(p, eu.id, 0, u.uid)).toBeNull();
    expect(equipar(p, eu.id, 0, u.uid)).toBeNull();
    expect(u.itens).toEqual(['pyrus+aquos']);
    expect(equipar(p, eu.id, 0, u.uid)).toBeNull();
    expect(equipar(p, eu.id, 0, u.uid)).toBeNull();
    expect(equipar(p, eu.id, 0, u.uid)).toMatch(/3 itens/);
    expect(eu.itens).toEqual(['ventus']);
  });
});

describe('rodada', () => {
  function rodadaContra(p: Partida, b: string, simular: Parameters<typeof simularRodada>[1]) {
    p.confrontos = [[p.voce, b]];
    const rr = simularRodada(p, simular);
    aplicarRodada(p, rr);
    return rr;
  }

  it('dano na derrota: base do estágio + metade de (inimigos vivos + estrelas acima da 1ª)', () => {
    expect(danoDerrota(3, [2, 1])).toBe(3 + Math.ceil((2 + 1) / 2));
    const p = novaPartida(50);
    p.estagio = 3; p.rodada = 2; p.tipo = 'pvp';
    const eu = humano(p), b = jogadorDe(p, 'pyrus');
    limpar(b);
    const b1 = dar(p, b, 'pokemon:squirtle', { estrela: 2, casa: [3, 0] });
    const b2 = dar(p, b, 'sujimon:a', { casa: [4, 0] });
    dar(p, b, 'overwatch:tracer', { casa: [5, 0] });
    b.nivel = 3;
    const simular = vi.fn(() => resultado('b', [], [`b:${b1.uid}`, `b:${b2.uid}`, 'b:12~inv1']));
    rodadaContra(p, 'pyrus', simular);
    expect(simular).toHaveBeenCalledOnce();
    expect(eu.vida).toBe(100 - (3 + 2));
    expect(b.vida).toBe(100);
    expect(b.ouro).toBe(1 + 1);
    expect([eu.sequencia, b.sequencia]).toEqual([-1, 1]);
    expect(eu.ultimosAdversarios).toEqual(['pyrus']);
    expect(p.historico[eu.id]).toEqual(['d']);
    // sem prefixo de lado também vale
    rodadaContra(p, 'pyrus', () => resultado('b', [], [String(b1.uid)]));
    expect(eu.vida).toBe(95 - (3 + 1));
  });

  it('monstros: só a base (estágio 1 não tira vida); vencer dá componente e ouro; chefe dá 2', () => {
    const p = novaPartida(51);
    const eu = humano(p);
    rodadaContra(p, 'monstros', lutaGanha('b'));
    expect(eu.vida).toBe(100);
    expect(eu.ouro).toBe(2);
    p.estagio = 2; p.rodada = 7; p.tipo = 'monstros';
    p.monstros = gerarMonstros(2, 7, 'monstros', criarRng(1));
    rodadaContra(p, 'monstros', lutaGanha('b'));
    expect(eu.vida).toBe(98);
    rodadaContra(p, 'monstros', lutaGanha('a'));
    expect(eu.itens).toHaveLength(1);
    expect(eu.ouro).toBe(4);
    p.estagio = 3; p.tipo = 'chefe';
    p.monstros = gerarMonstros(3, 7, 'chefe', criarRng(2));
    expect(p.monstros.filter(m => m.chefe)).toHaveLength(1);
    expect(p.monstros).toHaveLength(3);
    rodadaContra(p, 'monstros', lutaGanha('a'));
    expect(eu.itens).toHaveLength(3);
    expect(eu.ouro).toBe(6);
  });

  it('fantasma: só quem enfrenta ganha ou perde', () => {
    const p = novaPartida(52);
    p.estagio = 2; p.tipo = 'pvp';
    const eu = humano(p), b = jogadorDe(p, 'aquos');
    rodadaContra(p, 'fantasma:aquos', lutaGanha('b'));
    expect(eu.vida).toBeLessThan(100);
    expect(b.vida).toBe(100);
    expect(b.ouro).toBe(1);
    expect(p.historico.aquos).toEqual([]);
  });

  it('Overwatch e Deadlock depois da luta', () => {
    const p = novaPartida(53);
    p.estagio = 2; p.tipo = 'pvp';
    const eu = humano(p);
    limpar(eu);
    eu.nivel = 5; eu.almas = 8;
    const t = dar(p, eu, 'overwatch:tracer', { casa: [0, 0] });
    const m = dar(p, eu, 'overwatch:mercy', { casa: [1, 0] });
    const h = dar(p, eu, 'deadlock:haze', { casa: [2, 0] });
    dar(p, eu, 'deadlock:infernus', { casa: [3, 0] });
    dar(p, eu, 'deadlock:abrams', { casa: [4, 0] });
    const ouro = eu.ouro;
    rodadaContra(p, 'pyrus', () => resultado('a', [`a:${t.uid}`], [], { [`a:${t.uid}`]: 100, [`a:${m.uid}`]: 300, [`b:${t.uid}`]: 999 }, { [`a:${h.uid}`]: 3 }));
    // 2 do Overwatch = 1º degrau
    expect(eu.unidades[m.uid]!.bonus).toEqual({ vida: BONUS_OVERWATCH[0], dano: BONUS_OVERWATCH[0] });
    expect(eu.unidades[t.uid]!.bonus).toBeUndefined();
    // 3 heróis do Deadlock = 2º degrau: 8 + 3 abates × almas do degrau = 11 → +1 de ouro; +1 da vitória
    expect(ALMAS_POR_ABATE[1]).toBe(1);
    expect(eu.almas).toBe(8 + 3 * ALMAS_POR_ABATE[1]);
    expect(eu.ouro).toBe(ouro + 2);
  });

  it('Sujimon no último degrau recruta um Sujimon de custo até 3 depois de vencer monstros', () => {
    // o set de teste tem só 5 Sujimon: o último degrau (6, chance 100%) é forçado no contarTracos
    expect(CHANCE_SUJIMON.at(-1)).toBe(1);
    definirMotor({
      contarTracos: us => contarTracosFalso(us).map(t => (t.id === 'sujimon' ? { ...t, nivel: CHANCE_SUJIMON.length - 1 } : t)),
    });
    const p = novaPartida(54);
    const eu = humano(p);
    limpar(eu);
    eu.nivel = 4;
    ['sujimon:a', 'sujimon:b', 'sujimon:c', 'sujimon:d'].forEach((c, i) => dar(p, eu, c, { casa: [i, 0] }));
    const pool = { ...p.pool };
    rodadaContra(p, 'monstros', lutaGanha('a'));
    const banco = eu.banco.filter(x => x != null).map(uid => eu.unidades[uid!]!);
    expect(banco).toHaveLength(1);
    const c = S().campeao(banco[0]!.campeao);
    expect(c.fr).toBe('sujimon');
    expect(c.custo).toBeLessThanOrEqual(3);
    expect(p.pool[c.id]).toBe(pool[c.id]! - 1);
    // banco cheio: não recruta
    for (let i = 0; i < 9; i++) if (eu.banco[i] == null) dar(p, eu, 'ygo:mago', { banco: i, estrela: 2 });
    const antes = Object.keys(eu.unidades).length;
    rodadaContra(p, 'monstros', lutaGanha('a'));
    expect(Object.keys(eu.unidades)).toHaveLength(antes);
  });

  it('eliminação: colocação = vivos + 1, empate na rodada desempata pela vida', () => {
    const p = novaPartida(55);
    p.estagio = 7; p.tipo = 'pvp';
    const [a, b, c, d] = ['voce', 'pyrus', 'aquos', 'haos'].map(id => jogadorDe(p, id));
    a!.vida = 5; b!.vida = 3;
    p.confrontos = [['voce', 'aquos'], ['pyrus', 'haos']];
    aplicarRodada(p, simularRodada(p, lutaGanha('b')));
    expect([a!.colocacao, b!.colocacao]).toEqual([7, 8]);
    expect(vivos(p)).toHaveLength(6);
    expect(c!.colocacao).toBeUndefined();
    expect(d!.vida).toBe(100);
  });

  it('confrontos evitam os 2 últimos adversários; ímpar = fantasma', () => {
    const p = novaPartida(56);
    const rng = criarRng(3);
    for (let r = 0; r < 12; r++) {
      const cs = sortearConfrontos(p, rng);
      expect(cs).toHaveLength(4);
      const ids = cs.flat();
      expect(new Set(ids).size).toBe(8);
      for (const [x, y] of cs) {
        expect(jogadorDe(p, x).ultimosAdversarios.slice(-2)).not.toContain(y);
        expect(jogadorDe(p, y).ultimosAdversarios.slice(-2)).not.toContain(x);
      }
      for (const [x, y] of cs) { jogadorDe(p, x).ultimosAdversarios.push(y); jogadorDe(p, y).ultimosAdversarios.push(x); }
      if (cs.some(([x, y]) => y === p.voce && x !== p.voce)) throw new Error('humano tem de ficar no lado A');
    }
    jogadorDe(p, 'aurelus').colocacao = 8;
    const cs = sortearConfrontos(p, rng);
    expect(cs).toHaveLength(4);
    const f = cs.filter(([, y]) => y.startsWith('fantasma:'));
    expect(f).toHaveLength(1);
    expect(f[0]![1]).not.toBe(`fantasma:${f[0]![0]}`);
    expect(f[0]![1]).not.toBe('fantasma:aurelus');
  });
});

describe('partida inteira', () => {
  function jogarAteOFim(p: Partida): number {
    let rodadas = 0;
    for (; rodadas < 300 && !acabou(p); rodadas++) {
      jogarBots(p);
      jogarBot(p, humano(p));
      fimDoPlanejamento(p);
      aplicarRodada(p, simularRodada(p));
      for (const v of Object.values(p.pool)) expect(v).toBeGreaterThanOrEqual(0);
      avancarRodada(p);
      terminarCarrossel(p);
    }
    return rodadas;
  }

  it('8 bots jogam até o fim com colocações 1..8, rápido, e o pool fecha a conta', () => {
    const p = novaPartida(2026);
    const t0 = performance.now();
    const rodadas = jogarAteOFim(p);
    const ms = performance.now() - t0;
    expect(acabou(p)).toBe(true);
    expect(p.fase).toBe('fim');
    expect(p.jogadores.map(j => j.colocacao).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(rodadas).toBeGreaterThan(10);
    expect(ms).toBeLessThan(2000);
    // o vencedor é o único com vida
    const v = p.jogadores.find(j => j.colocacao === 1)!;
    expect(v.vida).toBeGreaterThan(0);
    // cópias: pool + unidades do vencedor = o pool cheio (os eliminados devolveram tudo)
    const conta: Record<string, number> = { ...p.pool };
    for (const u of Object.values(v.unidades)) conta[u.campeao] = (conta[u.campeao] ?? 0) + [0, 1, 3, 9][u.estrela]!;
    for (const c of S().dados.campeoes) expect(conta[c.id]).toBe(COPIAS_POR_CUSTO[c.custo]);
    // os bots montaram time
    expect(Object.keys(v.unidades).length).toBeGreaterThan(3);
  });

  it('bots usam o ouro, sobem de nível nos pontos fixos e põem até o limite', () => {
    const p = novaPartida(9);
    for (let r = 0; r < 12; r++) {
      jogarBots(p);
      fimDoPlanejamento(p);
      for (const j of vivos(p)) expect(unidadesNoTabuleiro(j, false).length).toBeLessThanOrEqual(j.nivel);
      aplicarRodada(p, simularRodada(p));
      avancarRodada(p);
      terminarCarrossel(p);
    }
    // 3-2 já passou: nível 6 pros que tiveram ouro
    expect([p.estagio, p.rodada]).toEqual([3, 3]);
    const bots = vivos(p).filter(j => j.bot);
    expect(bots.some(j => j.nivel >= 6)).toBe(true);
    for (const j of bots) expect(unidadesNoTabuleiro(j, false).length).toBeGreaterThan(0);
  });
});

describe('salvar', () => {
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

  it('salvar e carregar dá a mesma partida, e ela continua igual', () => {
    const p = novaPartida(77);
    for (let r = 0; r < 5; r++) {
      jogarBots(p); fimDoPlanejamento(p); aplicarRodada(p, simularRodada(p)); avancarRodada(p); terminarCarrossel(p);
    }
    jogarBots(p);
    salvarPartida(p);
    expect(temPartidaSalva()).toBe(true);
    const q = carregarPartida()!;
    expect(q).toEqual(JSON.parse(JSON.stringify(p)));
    for (const x of [p, q]) {
      for (let r = 0; r < 4; r++) {
        fimDoPlanejamento(x); aplicarRodada(x, simularRodada(x)); avancarRodada(x); terminarCarrossel(x); jogarBots(x);
      }
    }
    expect(JSON.stringify(q)).toBe(JSON.stringify(p));
  });

  it('ignora versão errada e JSON quebrado; apagar limpa', () => {
    guardado.set(CHAVE_PARTIDA, '{quebrado');
    expect(carregarPartida()).toBeNull();
    guardado.set(CHAVE_PARTIDA, JSON.stringify({ ...novaPartida(1), versao: 2 }));
    expect(carregarPartida()).toBeNull();
    salvarPartida(novaPartida(1));
    expect(carregarPartida()).not.toBeNull();
    apagarPartida();
    expect(guardado.has(CHAVE_PARTIDA)).toBe(false);
  });

  it('sem localStorage não quebra', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => salvarPartida(novaPartida(1))).not.toThrow();
    expect(carregarPartida()).toBeNull();
  });
});

describe('ult e posição', () => {
  it('escolher ult só da forma; posição só no Yu-Gi-Oh!', () => {
    const { p, eu } = cenario(60);
    const u = dar(p, eu, 'pokemon:squirtle', { casa: [3, 0] });
    const y = dar(p, eu, 'ygo:mago', { banco: 0 });
    expect(escolherUlt(p, eu.id, u.uid, 'agua')).toBeNull();
    expect(u.ult).toBe('agua');
    expect(escolherUlt(p, eu.id, u.uid, 'dragao')).toMatch(/ult/);
    expect(alternarPosicao(p, eu.id, u.uid)).toMatch(/Yu-Gi-Oh/);
    expect(alternarPosicao(p, eu.id, y.uid)).toBeNull();
    expect(y.posicao).toBe('defesa');
  });
});
