// Habilidades, traços e itens rodando num Contexto falso (test-helpers.ts): nenhum quebra e cada um faz alguma
// coisa; e alguns comportamentos que são fáceis de errar.
import { describe, expect, it } from 'vitest';
import type { Estrela, Ganchos, Habilidade } from '../tipos';
import {
  ESCUDO_HAOS, GOLPE, HABILIDADES_CLASSE, HABILIDADES_PROPRIAS, ITENS, PASSIVAS, TETO_MOEDAS, TRACOS, textoPassiva,
} from './index';
import { criarMundo, type LutadorFalso, type Mundo } from './test-helpers';

/** Tabuleiro de teste: lançador e 2 aliados embaixo, 5 inimigos em cima (frente colada). */
function montar(estrela: Estrela = 1, semente = 7) {
  const m = criarMundo(semente);
  const eu = m.add('eu', 'a', { col: 3, lin: 4 }, { estrela, classes: ['fogo'] });
  const usuario = m.add('usuario', 'a', { col: 4, lin: 4 }, { estrela });
  const aliado = m.add('aliado', 'a', { col: 3, lin: 5 }, { estrela });
  const inimigos = [
    m.add('i1', 'b', { col: 3, lin: 3 }),
    m.add('i2', 'b', { col: 4, lin: 3 }),
    m.add('i3', 'b', { col: 2, lin: 3 }),
    m.add('i4', 'b', { col: 3, lin: 2 }),
    m.add('i5', 'b', { col: 5, lin: 0 }, { at: { alcance: 4 } }),
  ];
  eu.usuario = usuario;
  aliado.vida = 300;
  return { m, eu, usuario, aliado, inimigos };
}

const todas: Habilidade[] = [...Object.values(HABILIDADES_CLASSE), ...Object.values(HABILIDADES_PROPRIAS), GOLPE];
const EFEITOS = ['dano', 'cura', 'escudo', 'status:', 'buff:', 'mana', 'mover', 'vida', 'transformar', 'morte'];

describe('toda habilidade lança sem quebrar e faz efeito', () => {
  for (const h of todas) {
    it(h.id, () => {
      for (const estrela of [1, 2, 3] as const) {
        const { m, eu, inimigos } = montar(estrela);
        h.lancar(m.ctx, eu, inimigos[0]!);
        m.rodar(8);
        h.lancar(m.ctx, eu, null);
        m.rodar(8);
        expect(m.registro.some(r => EFEITOS.some(e => r.startsWith(e))), `${h.id} ★${estrela}`).toBe(true);
        expect(m.lutadores.every(l => Number.isFinite(l.vida) && Number.isFinite(l.mana)), `${h.id} ★${estrela}`).toBe(true);
      }
    });
  }

  it('sem inimigo nenhum, ninguém quebra', () => {
    for (const h of todas) {
      const m = criarMundo();
      const eu = m.add('eu', 'a', { col: 3, lin: 4 });
      expect(() => { h.lancar(m.ctx, eu, null); m.rodar(10); }, h.id).not.toThrow();
    }
  });
});

/** Roda todos os ganchos de um traço ou item por uns segundos de luta. */
function rodarGanchos<N>(m: Mundo, membros: LutadorFalso[], inimigos: LutadorFalso[], x: Ganchos<N>, nn: N) {
  x.aoComecar?.(m.ctx, nn, membros);
  for (let s = 1; s <= 12; s++) {
    for (const de of membros) {
      const alvo = inimigos.find(i => i.vivo);
      if (!alvo) break;
      const d = m.ctx.dano(de, alvo, 0.2, { tipo: 'fisico' });
      x.aoAtacar?.(m.ctx, nn, de, alvo, d);
      x.aoLancar?.(m.ctx, nn, de);
      const bate = inimigos.find(i => i.vivo);
      if (bate) {
        const r = m.ctx.dano(bate, de, 0.5, { tipo: 'fisico' });
        x.aoReceberDano?.(m.ctx, nn, de, bate, r);
      }
    }
    m.rodar(1);
    x.porSegundo?.(m.ctx, nn, membros.filter(l => l.vivo));
  }
  for (const morto of [...membros, ...inimigos]) {
    if (morto.vivo) m.ctx.matar(inimigos[0]!, morto);
    x.aoMorrer?.(m.ctx, nn, morto, null);
  }
  m.rodar(5);
}

describe('traços e itens rodam sem quebrar', () => {
  for (const t of Object.values(TRACOS)) {
    it(`traço ${t.id}`, () => {
      for (let n = 0; n < t.degraus.length; n++) {
        const { m, eu, usuario, aliado, inimigos } = montar(1, n + 3);
        const membros = [eu, usuario, aliado];
        expect(() => rodarGanchos(m, membros, inimigos, t, n), `${t.id} degrau ${n}`).not.toThrow();
        if (t.atributos) expect(Object.keys(t.atributos(n)).length, t.id).toBeGreaterThan(0);
      }
    });
  }
  for (const i of Object.values(ITENS)) {
    it(`item ${i.id}`, () => {
      const { m, eu, inimigos } = montar(1, 11);
      expect(() => rodarGanchos(m, [eu], inimigos, i, eu)).not.toThrow();
    });
  }
  for (const [id, p] of Object.entries(PASSIVAS)) {
    it(`passiva ${id}`, () => {
      const { m, eu, inimigos } = montar(1, 13);
      expect(() => rodarGanchos(m, [eu], inimigos, p, eu)).not.toThrow();
      expect(textoPassiva(id)).toMatch(/^Passiva — /);
    });
  }
});

describe('ouro no chão', () => {
  it('derruba ao lançar e no abate de quem tem a passiva, até o teto da estrela', () => {
    for (const estrela of [1, 2, 3] as const) {
      const { m, eu } = montar(estrela, 21);
      const p = PASSIVAS['deadlock:rat-king']!;
      for (let i = 0; i < 40; i++) p.aoLancar!(m.ctx, eu, eu);
      expect(m.conta('moeda:a:1'), `★${estrela}`).toBe(TETO_MOEDAS[estrela - 1]);
      // abate de outro aliado ou morte do próprio portador não derruba
      const { m: m2, eu: eu2, aliado: al2, inimigos: in2 } = montar(estrela, 22);
      for (let i = 0; i < 20; i++) {
        p.aoMorrer!(m2.ctx, eu2, in2[0]!, al2);
        p.aoMorrer!(m2.ctx, eu2, eu2, in2[0]!);
      }
      expect(m2.conta('moeda:'), `★${estrela}`).toBe(0);
      for (let i = 0; i < 40; i++) p.aoMorrer!(m2.ctx, eu2, in2[0]!, eu2);
      expect(m2.conta('moeda:a:1'), `★${estrela}`).toBe(TETO_MOEDAS[estrela - 1]);
    }
  });
});

describe('comportamentos', () => {
  it('Anjo (2): só o primeiro que morre renasce; (4): todos, uma vez', () => {
    const anjo = TRACOS.anjo!;
    for (const [n, esperado] of [[0, 1], [1, 1], [2, 2]] as const) {
      const m = criarMundo();
      const a = m.add('a', 'a', { col: 1, lin: 5 }, { classes: ['anjo'] });
      const b = m.add('b', 'a', { col: 2, lin: 5 }, { classes: ['anjo'] });
      anjo.aoComecar!(m.ctx, n, [a, b]);
      for (const x of [a, b, a]) { m.ctx.matar(a, x); anjo.aoMorrer!(m.ctx, n, x, null); }
      expect(m.conta('reviver:'), `degrau ${n}`).toBe(esperado);
    }
  });

  it('aoMorrer chamado pelo lado de quem matou não revive nem fortalece o inimigo', () => {
    const m = criarMundo();
    const assassino = m.add('assassino', 'a', { col: 3, lin: 4 }, { classes: ['assassino', 'anjo', 'demoniacos'] });
    const anjoInimigo = m.add('anjo', 'b', { col: 3, lin: 3 }, { classes: ['anjo', 'demoniacos'] });
    const demoInimigo = m.add('demo', 'b', { col: 4, lin: 3 }, { classes: ['demoniacos'] });
    for (const id of ['assassino', 'anjo', 'demoniacos'] as const) TRACOS[id]!.aoComecar!(m.ctx, 4, [assassino]);
    m.ctx.matar(assassino, anjoInimigo);
    for (const id of ['assassino', 'anjo', 'demoniacos'] as const) TRACOS[id]!.aoMorrer!(m.ctx, 4, anjoInimigo, assassino);
    expect(anjoInimigo.vivo).toBe(false);
    expect(demoInimigo.at.dano).toBe(100);
    expect(assassino.temStatus('intocavel')).toBe(true);
  });

  it('Demoníacos: a morte de um fortalece os outros do mesmo lado', () => {
    const m = criarMundo();
    const a = m.add('a', 'a', { col: 3, lin: 4 }, { classes: ['demoniacos'] });
    const b = m.add('b', 'a', { col: 4, lin: 4 }, { classes: ['demoniacos'] });
    TRACOS.demoniacos!.aoComecar!(m.ctx, 2, [a, b]);
    m.ctx.matar(a, a);
    TRACOS.demoniacos!.aoMorrer!(m.ctx, 2, a, null);
    TRACOS.demoniacos!.aoMorrer!(m.ctx, 2, a, null);
    expect(b.at.dano).toBeCloseTo(120);
  });

  it('Atirador: acumula vel. ataque até 15 vezes', () => {
    const m = criarMundo();
    const eu = m.add('eu', 'a', { col: 3, lin: 4 });
    const alvo = m.add('alvo', 'b', { col: 3, lin: 3 }, { at: { vida: 1e9 } });
    for (let i = 0; i < 20; i++) TRACOS.atirador!.aoAtacar!(m.ctx, 4, eu, alvo, 1);
    expect(m.conta('buff:velAtaque')).toBe(15);
    expect(eu.at.velAtaque).toBeCloseTo(1 + 15 * 0.09);
  });

  it('Raio: o raio pula a cada 3 ataques, pra 1/2/3/4 inimigos', () => {
    for (const n of [0, 1, 2, 3]) {
      const { m, eu, inimigos } = montar();
      for (let i = 0; i < 6; i++) TRACOS.raio!.aoAtacar!(m.ctx, n, eu, inimigos[0]!, 1);
      expect(m.conta('visual:raio')).toBe(2);
      expect(m.conta('dano')).toBe(2 * (n + 1));
    }
  });

  it('Gelo (4): o 5º ataque seguido no mesmo alvo congela', () => {
    const { m, eu, inimigos } = montar();
    for (let i = 0; i < 4; i++) TRACOS.gelo!.aoAtacar!(m.ctx, 2, eu, inimigos[0]!, 1);
    expect(m.conta('status:atordoado')).toBe(0);
    TRACOS.gelo!.aoAtacar!(m.ctx, 2, eu, inimigos[0]!, 1);
    expect(m.conta('status:atordoado')).toBe(1);
  });

  it('Pokémon: bônus pelo número de Pokémon no tabuleiro', () => {
    const { m, eu, usuario, aliado } = montar();
    TRACOS.pokemon!.aoComecar!(m.ctx, 0, [eu, usuario, aliado]);
    expect(eu.at.dano).toBeCloseTo(100 * (1 + 0.01 * 3));
    expect(eu.vida).toBeCloseTo(eu.at.vida);
  });

  it('JoJo (5): Stands lançam com 25% menos mana; usuário também ganha o bônus', () => {
    const { m, eu, usuario } = montar();
    eu.stand = true;
    TRACOS.jojo!.aoComecar!(m.ctx, 3, [eu]);
    expect(eu.at.mana).toBe(60);
    expect(usuario.at.dano).toBeCloseTo(148);
  });

  it('Transformação e Reuniclus: o Reuniclus se sacrifica pelo aliado abaixo de metade', () => {
    const { m, eu, aliado } = montar(3);
    HABILIDADES_PROPRIAS['pokemon:Reuniclus']!.lancar(m.ctx, eu, null);
    expect(eu.vivo).toBe(false);
    expect(aliado.vida).toBeGreaterThan(300);
    expect(aliado.escudo).toBeGreaterThan(0);
  });

  it("Holy's Stand não mata a própria unidade", () => {
    const { m, eu, usuario } = montar();
    usuario.vida = 15;
    HABILIDADES_PROPRIAS["jojo:Holy's Stand"]!.lancar(m.ctx, eu, null);
    m.rodar(5);
    expect(usuario.vivo).toBe(true);
    expect(m.conta('dano')).toBeGreaterThan(0);
  });

  it('Chariot Requiem troca a % de vida com o inimigo mais inteiro', () => {
    const { m, eu, usuario, inimigos } = montar();
    usuario.vida = 200;
    HABILIDADES_PROPRIAS['jojo:Chariot Requiem']!.lancar(m.ctx, eu, null);
    expect(usuario.vida).toBeCloseTo(1000);
    expect(inimigos.some(i => Math.abs(i.vida - 200) < 1e-6)).toBe(true);
  });

  it('Boy II Man: na 3ª vitória contra o mesmo alvo, ele fica sem ganhar mana até o fim', () => {
    const { m, eu, inimigos } = montar(3);
    const alvo = inimigos[0]!;
    alvo.at.vida = 1e9;
    // vence 90% das vezes na estrela 3: lança até a 3ª vitória
    for (let i = 0; i < 12 && !m.registro.includes('texto:Habilidade roubada!'); i++) {
      HABILIDADES_PROPRIAS['jojo:Boy II Man']!.lancar(m.ctx, eu, alvo);
    }
    expect(m.registro).toContain('texto:Habilidade roubada!');
    m.rodar(100);
    expect(alvo.temStatus('semMana')).toBe(true);
  });

  it('Dirty Deeds: uma vez por luta, a unidade do Stand volta com 60% da vida', () => {
    const { m, eu, usuario, inimigos } = montar();
    HABILIDADES_PROPRIAS['jojo:Dirty Deeds Done Dirt Cheap']!.lancar(m.ctx, eu, inimigos[0]!);
    usuario.vida = 100;
    m.rodar(1);
    expect(usuario.vida).toBeCloseTo(600);
    usuario.vida = 100;
    m.rodar(1);
    expect(usuario.vida).toBe(100);
  });

  it('Item Haos dá escudo no começo; Drago queima', () => {
    const { m, eu, inimigos } = montar();
    ITENS.haos!.aoComecar!(m.ctx, eu, [eu]);
    expect(eu.escudo).toBeCloseTo(1000 * ESCUDO_HAOS);
    ITENS['haos+haos']!.aoComecar!(m.ctx, eu, [eu]);
    expect(eu.escudo).toBeCloseTo(1000 * ESCUDO_HAOS * (1 + 2 * 1.5));
    ITENS['pyrus+pyrus']!.aoAtacar!(m.ctx, eu, eu, inimigos[0]!, 10);
    expect(inimigos[0]!.temStatus('queimando')).toBe(true);
  });
});
