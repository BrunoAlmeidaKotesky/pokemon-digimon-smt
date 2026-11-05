// Laboratório do playtest com o set de verdade: o conteúdo medido não muda a luta, mede lançamentos e mana, desliga
// traço de um lado só, e os times de teste ficam em casas válidas. Rápido (poucas lutas).
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { definirSet, S } from '../dados';
import { simularLuta } from '../combate';
import { habilidadeDa } from '../conteudo';
import type { EntradaTime, SetDados } from '../tipos';
import {
  SINTETICO, estenderSet, lutar, posicionar, reais, resultadoDo, standsQueCabem, timeComBonecos, timeDaOrigem, timeSorteado, unidade,
  valorDoPacote,
} from './laboratorio';
import { criarRng } from '../rng';

beforeAll(() => {
  const dados = JSON.parse(readFileSync('public/autobatalha/set1.json', 'utf8')) as SetDados;
  definirSet(estenderSet(dados, ['tanque', 'atirador']));
});

/** campeões de verdade que têm a classe na forma da estrela */
const comClasse = (classe: string, estrela: 1 | 2 | 3) =>
  reais().filter(c => !c.stand && S().forma(S().formaPadrao(c.id, estrela)).classes.includes(classe));

describe('laboratório', () => {
  it('Stands que cabem: cada um precisa de um usuário, e os que passam dos livres gastam vaga', () => {
    expect(standsQueCabem(8, Infinity)).toBe(8);
    expect(standsQueCabem(8, 0)).toBe(4);
    expect(standsQueCabem(12, 4)).toBe(8);
    expect(standsQueCabem(1, 0)).toBe(0);
  });

  it('time da origem: enche o tabuleiro; JoJo fica com usuários de fora e os Stands que a regra deixa', () => {
    const rng = criarRng(5);
    const lol = timeDaOrigem('lol', 6, 2, rng, 0);
    expect(lol.lutadores).toHaveLength(6);
    expect(lol.lutadores.every(l => S().campeao(l.unidade!.campeao).fr === 'lol')).toBe(true);
    const digi = timeDaOrigem('digimon', 6, 2, rng, 0);
    expect(digi.lutadores.filter(l => S().campeao(l.unidade!.campeao).fr === 'digimon')).toHaveLength(4);
    const regra = { nome: 'dois', foraDaVaga: () => 2 };
    const jojo = timeDaOrigem('jojo', 6, 2, rng, 0, regra);
    const stands = jojo.lutadores.filter(l => S().campeao(l.unidade!.campeao).stand);
    expect(stands).toHaveLength(4);
    expect(jojo.lutadores.length - stands.length).toBe(4);
    for (const s of stands) expect(s.unidade!.usuario).toBeDefined();
  });

  it('o set estendido tem os sintéticos, e reais() não os devolve', () => {
    expect(S().campeao(`${SINTETICO}tanque`).custo).toBe(3);
    expect(reais().some(c => c.id.startsWith(SINTETICO))).toBe(false);
    expect(reais(3).length).toBe(S().porCusto[3].length - 2);
  });

  it('a luta medida é a mesma luta do motor de verdade', () => {
    for (let i = 0; i < 6; i++) {
      const rng = criarRng(100 + i);
      const a = timeSorteado('a', { custo: 3, estrela: 2 }, 5, rng, i);
      const b = timeSorteado('b', { custo: 3, estrela: 2 }, 5, rng, i + 1);
      const real = simularLuta(a, b, 7 + i, false);
      const medida = lutar(a, b, 7 + i).r;
      expect(medida).toEqual(real);
    }
  });

  it('mede lançamentos, o 1º lançamento e de onde veio a mana', () => {
    const tanque = comClasse('tanque', 2).find(c => habilidadeDa(S().forma(S().formaPadrao(c.id, 2)))?.id === 'tanque')!;
    const t = timeComBonecos('a', unidade(1, tanque.id, 2), 0);
    const l = lutar(t, timeComBonecos('b', unidade(1, tanque.id, 2), 0), 3);
    const m = l.med.get('a:x')!;
    expect(m.lancamentos).toBeGreaterThan(0);
    expect(m.primeiro).toBeGreaterThan(0);
    expect(m.escudo).toBeGreaterThan(0);
    expect(m.manaAtaque).toBeGreaterThan(0);
    expect(m.manaGolpe).toBeGreaterThan(0);
  });

  it('desligar um traço de um lado só muda a luta', () => {
    const robos = comClasse('robo', 2).slice(0, 2);
    expect(robos.length).toBe(2);
    let vitorias = 0;
    for (let s = 0; s < 10; s++) {
      const time: EntradaTime = { dono: 'x', lutadores: posicionar(robos.map((c, i) => unidade(i + 1, c.id, 2)), s) };
      const igual = lutar(time, time, s);
      const semB = lutar(time, time, s, { desligar: { b: ['robo'] } });
      expect(semB.r).not.toEqual(igual.r);
      if (resultadoDo(semB.r, 'a') === 'vitoria') vitorias++;
    }
    expect(vitorias).toBeGreaterThan(5);
  });

  it('posicionar: casas diferentes dentro da metade, e o Stand ao lado do usuário', () => {
    const rng = criarRng(5);
    const normais = rng.sortear(reais().filter(c => !c.stand), 9).map((c, i) => unidade(i + 1, c.id, 1));
    const stand = reais().find(c => c.stand)!;
    const us = [...normais, unidade(99, stand.id, 1, { usuario: normais[0]!.uid })];
    const e = posicionar(us, 2);
    expect(e.length).toBe(us.length);
    const casas = e.map(x => `${x.casa.col},${x.casa.lin}`);
    expect(new Set(casas).size).toBe(casas.length);
    expect(e.every(x => x.casa.col >= 0 && x.casa.col < 8 && x.casa.lin >= 0 && x.casa.lin < 4)).toBe(true);
    const cs = e.find(x => x.id === '99')!.casa, cu = e.find(x => x.id === String(normais[0]!.uid))!.casa;
    expect(Math.abs(cs.lin - cu.lin) + Math.abs(cs.col - cu.col)).toBeLessThanOrEqual(2);
  });

  it('equivalente do pacote: o tanque sintético vale alguma coisa (e é determinístico)', () => {
    const a = valorDoPacote('tanque', 1, 4, 1, 3), b = valorDoPacote('tanque', 1, 4, 1, 3);
    expect(a).toEqual(b);
    expect(a.equivalente).toBeGreaterThan(0);
  });
});
