import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { Casa, Contexto, EventoLuta, Lutador, ResultadoLuta, Traco } from '../tipos';
import { simularLutaCom } from './motor';
import { conteudoFalso, em, monstro, time, traco, unidade, usarSetTeste, type OpcoesFalso } from './test-helpers';

const eventos = <T extends EventoLuta['tipo']>(r: ResultadoLuta, tipo: T) =>
  (r.gravacao?.eventos ?? []).filter((e): e is Extract<EventoLuta, { tipo: T }> => e.tipo === tipo);
const saco = (col = 3, lin = 0, vida = 100000) => time('monstros', monstro('m0', col, lin, { vida, dano: 0, armadura: 0, resist: 0 }));
/** traço 'smt' (Muralha) que roda `fn` no começo da luta */
const noComeco = (fn: (ctx: Contexto, eu: Lutador) => void, resto: Partial<Traco> = {}, o: OpcoesFalso = {}) =>
  conteudoFalso({ ...o, tracos: { smt: traco('smt', [1], { aoComecar: (ctx, _n, m) => fn(ctx, m[0]!), ...resto }) } });

let erro: MockInstance;
beforeAll(usarSetTeste);
beforeEach(() => { erro = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  expect(erro).not.toHaveBeenCalled();
  erro.mockRestore();
});

describe('contexto do motor', () => {
  it('áreas, alvos e distâncias', () => {
    let visto: Record<string, unknown> = {};
    const c = noComeco((ctx, eu) => {
      const inim = ctx.inimigosDe(eu);
      const perto = ctx.maisProximo(eu, 'inimigos')!;
      visto = {
        inimigos: inim.length,
        aliados: ctx.aliadosDe(eu).length,
        comigo: ctx.aliadosDe(eu, true).length,
        emVoltaInclui: ctx.emVolta(perto, 1, eu, 'inimigos').includes(perto),
        longe: ctx.distancia(eu, ctx.maisLonge(eu, 'inimigos')!) >= ctx.distancia(eu, perto),
        linha: ctx.emLinha(eu, perto, 'inimigos').includes(perto),
        cone: ctx.emCone(eu, perto, 8, 'inimigos').includes(perto),
        menos: ctx.menosVida(eu, 'aliados', true) !== null,
        livre: ctx.casaLivreAoLado(eu) !== null,
      };
    });
    simularLutaCom(c, time('p1', em(unidade('smt:muralha'), 3, 0), em(unidade('overwatch:mira'), 3, 3)),
      time('p2', em(unidade('pokemon:brigao'), 4, 0), em(unidade('pokemon:brigao'), 0, 3)), 1, false);
    expect(visto).toEqual({ inimigos: 2, aliados: 1, comigo: 2, emVoltaInclui: true, longe: true, linha: true, cone: true, menos: true, livre: true });
  });

  it('empurrar: 1 casa por vez pra longe da origem, para na borda', () => {
    let antes: Casa | null = null, depois: Casa | null = null, d0 = 0, d1 = 0;
    const c = noComeco((ctx, eu) => {
      const x = ctx.maisProximo(eu, 'inimigos')!;
      antes = { ...x.casa };
      d0 = ctx.distancia(eu, x);
      ctx.empurrar(x, eu, 2);
      depois = { ...x.casa };
      d1 = ctx.distancia(eu, x);
      ctx.empurrar(x, eu, 20); // até a borda, sem erro
    });
    simularLutaCom(c, time('p1', em(unidade('smt:muralha'), 3, 0)), time('p2', em(unidade('pokemon:brigao'), 4, 0)), 1, false);
    expect(antes).not.toEqual(depois);
    expect(d1 - d0).toBe(2);
  });

  it('provocado ataca quem provocou; intocável não vira alvo', () => {
    const muralha = unidade('smt:muralha'), mira = unidade('overwatch:mira'), brigao = unidade('pokemon:brigao');
    const c = noComeco((ctx, eu) => {
      const m = ctx.aliadosDe(eu).find(x => x.campeao === 'overwatch:mira')!;
      for (const x of ctx.inimigosDe(eu)) ctx.status(m, x, 'provocado', 30);
    });
    const a = () => time('p1', em(muralha, 3, 0), em(mira, 3, 3));
    const b = time('p2', em(brigao, 4, 0));
    const r = simularLutaCom(c, a(), b, 1, true);
    const alvos = new Set(eventos(r, 'ataque').filter(e => e.de === `b:${brigao.uid}`).map(e => e.para));
    expect([...alvos]).toEqual([`a:${mira.uid}`]);

    const c2 = noComeco((ctx, eu) => ctx.status(eu, eu, 'intocavel', 30));
    const r2 = simularLutaCom(c2, a(), b, 1, true);
    const alvos2 = new Set(eventos(r2, 'ataque').filter(e => e.de === `b:${brigao.uid}`).map(e => e.para));
    expect(alvos2.has(`a:${muralha.uid}`)).toBe(false);
    expect(alvos2.size).toBeGreaterThan(0);
  });

  it('reviver traz de volta com a fração da vida (uma vez); o morto ainda tem o status no gancho', () => {
    let queimava = false;
    const c = conteudoFalso({
      tracos: {
        porradeiro: traco('porradeiro', [1], {
          aoComecar(ctx, _n, membros) { for (const m of membros) for (const x of ctx.inimigosDe(m)) ctx.status(x, m, 'queimando', 60, 0.001); },
          aoMorrer(ctx, _n, morto) {
            if (morto.memoria.reviveu) return;
            queimava = morto.temStatus('queimando');
            morto.memoria.reviveu = 1;
            ctx.reviver(morto, 0.3);
          },
        }),
      },
    });
    const brigao = unidade('pokemon:brigao');
    const fortes = time('p2', ...[2, 3, 4].map(col => em(unidade('pokemon:brigao', 3), col, 0)));
    const r = simularLutaCom(c, time('p1', em(brigao, 3, 0)), fortes, 1, true);
    const id = `a:${brigao.uid}`;
    const mortes = eventos(r, 'morte').filter(e => e.id === id);
    expect(mortes.length).toBe(2);
    expect(queimava).toBe(true);
    const q = r.gravacao!.quadros.find(x => x.t === mortes[0]!.t)!;
    const vidaMax = r.gravacao!.inicial.find(e => e.id === id)!.vidaMax;
    expect(q.u[id]![5]).toBe(1);
    expect(q.u[id]![2]).toBeLessThanOrEqual(Math.round(vidaMax * 0.3));
  });

  it('poder multiplica dano, cura e escudo da habilidade (não do traço)', () => {
    const golpe = { id: 'golpe', nome: 'Golpe', texto: '', mana: 1000, manaInicial: 1000,
      lancar(ctx: Contexto, eu: Lutador, alvo: Lutador | null) { if (alvo) ctx.danoFixo(eu, alvo, 100, { tipo: 'verdadeiro' }); ctx.escudo(eu, 100, 30); } };
    const danoDo = (poder: number) => {
      const c = conteudoFalso({ golpe, itens: { p: { id: 'p', nome: 'p', texto: '', atributos: { poder } } } });
      const u = unidade('pokemon:brigao', 1, { itens: ['p'] });
      const r = simularLutaCom(c, time('p1', em(u, 3, 0)), saco(), 1, true);
      const t = eventos(r, 'habilidade')[0]!.t;
      return { dano: eventos(r, 'dano').find(e => e.t === t && e.danoTipo === 'verdadeiro')!.valor, escudo: r.gravacao!.quadros.find(q => q.t === t)!.u[`a:${u.uid}`]![3] };
    };
    expect(danoDo(0)).toEqual({ dano: 100, escudo: 100 });
    expect(danoDo(1)).toEqual({ dano: 200, escudo: 200 });
    // traço: sem poder
    let causado = 0;
    const c = noComeco((ctx, eu) => { causado = ctx.danoFixo(eu, ctx.maisProximo(eu, 'inimigos')!, 100, { tipo: 'verdadeiro' }); },
      {}, { itens: { p: { id: 'p', nome: 'p', texto: '', atributos: { poder: 1 } } } });
    simularLutaCom(c, time('p1', em(unidade('smt:muralha', 1, { itens: ['p'] }), 3, 0)), saco(), 1, false);
    expect(causado).toBe(100);
  });

  it('queimando tira vida por segundo e corta a cura; escudo absorve; temporizadores rodam no tempo', () => {
    const marcas: number[] = [];
    let curado = 0, vidaAntes = 0, vidaDepois = 0;
    const c = noComeco((ctx, eu) => {
      const x = ctx.maisProximo(eu, 'inimigos')!;
      ctx.status(eu, x, 'queimando', 2, 0.1);
      ctx.depois(1, () => {
        marcas.push(ctx.tempo);
        vidaAntes = x.vida;
        curado = ctx.curar(eu, x, 100);
        vidaDepois = x.vida;
      });
      ctx.aCada(0.5, 2, () => marcas.push(ctx.tempo));
    });
    const r = simularLutaCom(c, time('p1', em(unidade('smt:muralha'), 0, 3)), saco(0, 3, 10000), 1, true);
    const fogo = eventos(r, 'dano').filter(e => e.para === 'b:m0' && e.danoTipo === 'verdadeiro' && e.t <= 2);
    expect(fogo.map(e => e.t)).toEqual([0.5, 1, 1.5, 2].slice(0, fogo.length));
    expect(fogo.length).toBeGreaterThanOrEqual(3);
    expect(fogo[0]!.valor).toBe(500); // 10% × 10000 × 0,5 s
    expect(curado).toBeCloseTo(67);
    expect(vidaDepois - vidaAntes).toBeCloseTo(67);
    expect(marcas).toEqual([0.5, 1, 1, 1.5, 2]);

    const c2 = noComeco((ctx, eu) => ctx.escudo(eu, 300, 30));
    const muralha = unidade('smt:muralha');
    const r2 = simularLutaCom(c2, time('p1', em(muralha, 3, 0)), time('p2', em(unidade('pokemon:brigao', 3), 4, 0)), 1, true);
    const id = `a:${muralha.uid}`;
    const primeiro = eventos(r2, 'dano').find(e => e.para === id)!;
    const q = r2.gravacao!.quadros.find(x => x.t === primeiro.t)!;
    const ini = r2.gravacao!.inicial.find(e => e.id === id)!;
    expect(q.u[id]![2]).toBe(ini.vida); // a vida não caiu
    expect(Math.abs(q.u[id]![3] - (300 - primeiro.valor))).toBeLessThanOrEqual(1);
  });

  it('buff com duração some no fim; mana e fração de vida', () => {
    const vistos: number[] = [];
    const c = noComeco((ctx, eu) => {
      const base = eu.at.dano;
      ctx.buff(eu, 'dano', 0.5, 2);
      vistos.push(eu.at.dano / base);
      ctx.depois(2.5, () => vistos.push(eu.at.dano / base));
      ctx.definirFracaoVida(eu, 0.5);
      vistos.push(eu.vida / eu.at.vida);
      ctx.mana(eu, 15);
      vistos.push(eu.mana);
    });
    simularLutaCom(c, time('p1', em(unidade('smt:muralha'), 3, 0)), saco(), 1, false);
    expect(vistos).toEqual([1.5, 0.5, 15, 1]);
  });
});
