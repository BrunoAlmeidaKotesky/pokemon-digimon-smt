// Laboratório do playtest com o set de verdade: o conteúdo medido não muda a luta, mede lançamentos e mana, desliga
// traço de um lado só, e os times de teste ficam em casas válidas. Rápido (poucas lutas).
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { definirSet, S } from '../dados';
import { simularLuta } from '../combate';
import { habilidadeDa } from '../conteudo';
import type { EntradaTime, SetDados } from '../tipos';
import {
  SINTETICO, doisStandsNoTime, estenderSet, focosDoSet, focosEmConfronto, lutar, posicionar, reais, resultadoDo,
  timeComBonecos, timeDaOrigem, timeDoFoco, timeSorteado, unidade, valorDoPacote,
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
  it('time da origem: enche o tabuleiro; JoJo é metade Stands, metade usuários de fora', () => {
    const rng = criarRng(5);
    const lol = timeDaOrigem('lol', 6, 2, rng, 0);
    expect(lol.lutadores).toHaveLength(6);
    expect(lol.lutadores.every(l => S().campeao(l.unidade!.campeao).fr === 'lol')).toBe(true);
    const digi = timeDaOrigem('digimon', 6, 2, rng, 0);
    expect(digi.lutadores.filter(l => S().campeao(l.unidade!.campeao).fr === 'digimon')).toHaveLength(4);
    const jojo = timeDaOrigem('jojo', 6, 2, rng, 0);
    const stands = jojo.lutadores.filter(l => S().campeao(l.unidade!.campeao).stand);
    expect(stands).toHaveLength(3);
    expect(jojo.lutadores.length - stands.length).toBe(3);
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

  it('composições forçadas: focos do set e times de cada tipo', () => {
    const focos = focosDoSet(2);
    const ids = focos.map(f => f.id);
    expect(ids).toEqual(expect.arrayContaining(['pokemon', 'jojo', 'tanque', 'fogo', 'pokemon+tanque', 'jojo+porradeiro', 'digimon+planta']));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain('pokemon+unicos');
    const rng = criarRng(11);
    // classe: todo mundo com a classe na forma da estrela (sem Stands)
    const tanque = timeDoFoco({ id: 'tanque', classe: 'tanque' }, 4, 2, rng, 0);
    expect(tanque.lutadores).toHaveLength(4);
    expect(tanque.lutadores.every(l => !S().campeao(l.unidade!.campeao).stand)).toBe(true);
    expect(tanque.lutadores.every(l => S().forma(l.unidade!.forma).classes.includes('tanque'))).toBe(true);
    // par: JoJo sempre metade Stands e metade usuários de fora, Digimon com o Parceiro
    const jojo = timeDoFoco({ id: 'jojo+porradeiro', origem: 'jojo', classe: 'porradeiro' }, 8, 2, rng, 1);
    const stands = jojo.lutadores.filter(l => S().campeao(l.unidade!.campeao).stand);
    expect(stands).toHaveLength(4);
    expect(jojo.lutadores).toHaveLength(8);
    expect(stands.every(l => l.unidade!.usuario !== undefined)).toBe(true);
    const digi = timeDoFoco({ id: 'digimon+planta', origem: 'digimon', classe: 'planta' }, 9, 2, rng, 2);
    expect(digi.lutadores).toHaveLength(9);
    expect(digi.lutadores.filter(l => S().campeao(l.unidade!.campeao).fr === 'digimon')).toHaveLength(6);
  });

  it('composições forçadas: confronto e 2 Stands são determinísticos pela semente', () => {
    const focos = focosDoSet(2).slice(0, 12);
    const a = focosEmConfronto(focos, 4, 1, 2, 7), b = focosEmConfronto(focos, 4, 1, 2, 7);
    expect([...a.focos]).toEqual([...b.focos]);
    expect([...a.campeoes]).toEqual([...b.campeoes]);
    expect(a.lutas).toBe(focos.length * 2 * 2);
    // os dois lados do confronto contam: cada luta soma um placar pra cada foco
    expect([...a.focos.values()].reduce((s, p) => s + p.lutas, 0)).toBe(a.lutas * 2);
    const c = doisStandsNoTime(6, 2, 2, 7), d = doisStandsNoTime(6, 2, 2, 7);
    expect(c).toEqual(d);
    expect(c.lutas).toBe(4);
  });

  it('equivalente do pacote: o tanque sintético vale alguma coisa (e é determinístico)', () => {
    const a = valorDoPacote('tanque', 1, 4, 1, 3), b = valorDoPacote('tanque', 1, 4, 1, 3);
    expect(a).toEqual(b);
    expect(a.equivalente).toBeGreaterThan(0);
  });
});
