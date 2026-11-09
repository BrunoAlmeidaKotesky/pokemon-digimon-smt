import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { distancia } from '../hex';
import type { EntradaTime, EventoLuta, Lutador, ResultadoLuta } from '../tipos';
import { BONUS_EVOLUCAO } from './atributos';
import { separarId } from './lutador';
import { simularLutaCom } from './motor';
import { conteudoFalso, em, monstro, time, traco, unidade, usarSetTeste, type ConteudoFalso } from './test-helpers';

const lutar = (c: ConteudoFalso, a: EntradaTime, b: EntradaTime, semente = 1, gravar = true) => simularLutaCom(c, a, b, semente, gravar);
const eventos = <T extends EventoLuta['tipo']>(r: ResultadoLuta, tipo: T) =>
  (r.gravacao?.eventos ?? []).filter((e): e is Extract<EventoLuta, { tipo: T }> => e.tipo === tipo);
const quadros = (r: ResultadoLuta) => r.gravacao?.quadros ?? [];
/** dummy: monstro com muita vida e sem dano */
const saco = (col = 3, lin = 0) => time('monstros', monstro('m0', col, lin, { vida: 100000, dano: 0 }));

let erro: MockInstance;
beforeAll(usarSetTeste);
beforeEach(() => { erro = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  expect(erro).not.toHaveBeenCalled();
  erro.mockRestore();
});

describe('motor de combate', () => {
  it('mesma semente = mesma luta; ids com o lado na frente', () => {
    const c = conteudoFalso();
    const a = time('p1', em(unidade('pokemon:brigao', 2), 3, 0), em(unidade('overwatch:mira'), 2, 3), em(unidade('smt:muralha'), 4, 0));
    const b = time('p2', em(unidade('pokemon:brigao', 2), 3, 0), em(unidade('lol:ahri'), 2, 3), em(unidade('deadlock:faca'), 5, 3));
    const r1 = lutar(c, a, b, 42), r2 = lutar(c, a, b, 42);
    expect(r1).toEqual(r2);
    expect(lutar(c, a, b, 43).gravacao!.eventos).not.toEqual(r1.gravacao!.eventos);
    const ids = r1.gravacao!.inicial.map(e => e.id);
    expect(ids).toContain(`a:${a.lutadores[0]!.id}`);
    expect(ids).toContain(`b:${b.lutadores[1]!.id}`);
    expect(separarId('b:12~inv2')).toEqual({ lado: 'b', id: '12', invocado: true });
    expect(separarId('a:m0')).toEqual({ lado: 'a', id: 'm0', invocado: false });
    // um quadro no começo (t = 0) e um por passo
    expect(quadros(r1).length).toBe(Math.round(r1.duracao / 0.1) + 1);
    expect(r1.gravacao!.passo).toBe(0.1);
  });

  it('time mais forte vence, dos dois lados', () => {
    const c = conteudoFalso();
    const fortes = () => time('p1', ...[2, 3, 4].map(col => em(unidade('pokemon:brigao', 3), col, 0)));
    const fracos = () => time('p2', ...[2, 3, 4].map(col => em(unidade('pokemon:brigao', 1), col, 0)));
    for (const s of [1, 2, 3]) {
      const r = lutar(c, fortes(), fracos(), s, false);
      expect(r.vencedor).toBe('a');
      expect(r.vivosB).toEqual([]);
      expect(r.vivosA.length).toBeGreaterThan(0);
      expect(Object.values(r.abates).reduce((x, y) => x + y, 0)).toBe(3);
      expect(lutar(c, fracos(), fortes(), s, false).vencedor).toBe('b');
    }
    expect(lutar(c, fortes(), fracos(), 1, false).gravacao).toBeUndefined();
  });

  it('corpo a corpo anda até encostar; atirador ataca de longe; 1 casa a cada 0,5 s, sem casa ocupada', () => {
    const c = conteudoFalso();
    const brigao = unidade('pokemon:brigao'), mira = unidade('overwatch:mira');
    const r = lutar(c, time('p1', em(brigao, 0, 3)), time('p2', em(mira, 0, 3)));
    const idB = `a:${brigao.uid}`, idM = `b:${mira.uid}`;
    const ataques = eventos(r, 'ataque');
    const doBrigao = ataques.filter(e => e.de === idB), daMira = ataques.filter(e => e.de === idM);
    expect(doBrigao.length).toBeGreaterThan(0);
    expect(doBrigao.every(e => e.distancia === 1)).toBe(true);
    expect(daMira.every(e => e.distancia <= 4)).toBe(true);
    expect(daMira[0]!.distancia).toBeGreaterThan(1);
    // movimento: no máximo 1 casa por quadro e um passo a cada 0,5 s
    const qs = quadros(r);
    for (const id of [idB, idM]) {
      let ultimoPasso = -Infinity;
      for (let i = 1; i < qs.length; i++) {
        const [c0, l0] = qs[i - 1]!.u[id]!, [c1, l1] = qs[i]!.u[id]!;
        const d = distancia({ col: c0, lin: l0 }, { col: c1, lin: l1 });
        expect(d).toBeLessThanOrEqual(1);
        if (d === 1) {
          expect(qs[i]!.t - ultimoPasso).toBeGreaterThan(0.5 - 1e-6);
          ultimoPasso = qs[i]!.t;
        }
      }
    }
    expect(qs[0]!.u[idB]!.slice(0, 2)).not.toEqual(qs.at(-1)!.u[idB]!.slice(0, 2));
  });

  it('ninguém divide casa numa luta cheia', () => {
    const c = conteudoFalso();
    const cheio = (dono: string) => time(dono, ...[0, 1, 2, 3, 4, 5, 6, 7].map(col => em(unidade(col % 2 ? 'pokemon:brigao' : 'smt:muralha', 2), col, 0)),
      em(unidade('overwatch:mira'), 3, 3), em(unidade('overwatch:mira'), 4, 3));
    const r = lutar(c, cheio('p1'), cheio('p2'), 7);
    for (const q of quadros(r)) {
      const casas = Object.values(q.u).filter(x => x[5] === 1).map(x => `${x[0]},${x[1]}`);
      expect(new Set(casas).size).toBe(casas.length);
    }
  });

  it('assassino salta pra última linha inimiga no começo', () => {
    const c = conteudoFalso();
    const faca = unidade('deadlock:faca');
    const r = lutar(c, time('p1', em(faca, 3, 3)), saco());
    expect(r.gravacao!.inicial[0]!.casa.lin).toBe(7);
    expect(quadros(r)[0]!.u[`a:${faca.uid}`]![1]).toBe(0);
  });

  it('mana enche com os ataques e lança; a sobra passa; tanque começa sem mana', () => {
    const c = conteudoFalso();
    const brigao = unidade('pokemon:brigao');
    const r = lutar(c, time('p1', em(brigao, 3, 0)), saco(4, 0));
    const id = `a:${brigao.uid}`;
    const lancou = eventos(r, 'habilidade').filter(e => e.de === id);
    expect(lancou.length).toBeGreaterThan(1);
    expect(lancou[0]!.nome).toBe('Golpe');
    // golpe falso: 60 de mana = 6 ataques de +10
    expect(eventos(r, 'ataque').filter(e => e.de === id && e.t <= lancou[0]!.t).length).toBe(6);
    expect(c.chamadas[id]).toBe(lancou.length);
    const q = quadros(r).find(x => x.t > lancou[0]!.t)!;
    expect(q.u[id]![4]).toBeLessThan(60);

    const muralha = unidade('smt:muralha');
    const r2 = lutar(c, time('p1', em(muralha, 3, 0)), saco());
    expect(r2.gravacao!.inicial[0]).toMatchObject({ mana: 0, manaMax: 60 });
  });

  it('atordoado não age até passar', () => {
    const c = conteudoFalso({
      tracos: {
        smt: traco('smt', [1], {
          aoComecar(ctx, _n, membros) {
            for (const m of membros) for (const x of ctx.inimigosDe(m)) ctx.status(m, x, 'atordoado', 5);
          },
        }),
      },
    });
    const muralha = unidade('smt:muralha'), brigao = unidade('pokemon:brigao');
    const r = lutar(c, time('p1', em(muralha, 0, 0)), time('p2', em(brigao, 0, 3)));
    const id = `b:${brigao.uid}`;
    const qs = quadros(r);
    const inicio = qs[0]!.u[id]!.slice(0, 2);
    for (const q of qs.filter(x => x.t < 5 - 1e-6)) {
      expect(q.u[id]!.slice(0, 2)).toEqual(inicio);
      expect(q.s?.[id]).toContain('atordoado');
    }
    expect(eventos(r, 'ataque').some(e => e.de === id && e.t < 5)).toBe(false);
    // passou: anda ou ataca logo
    const andou = qs.some(q => q.t >= 5 && q.t < 7 && (q.u[id]![0] !== inicio[0] || q.u[id]![1] !== inicio[1]));
    const atacou = eventos(r, 'ataque').some(e => e.de === id && e.t >= 5 && e.t < 7);
    expect(andou || atacou).toBe(true);
  });

  it('Stand: entra só com o usuário, fica ligado a ele e morre junto', () => {
    let ligados: [string | undefined, string | undefined] = [undefined, undefined];
    const c = conteudoFalso({
      tracos: {
        jojo: traco('jojo', [1], {
          aoComecar(_ctx, _n, membros: Lutador[]) {
            const s = membros.find(m => m.stand);
            ligados = [s?.usuario?.id, s?.usuario?.standDele?.id];
          },
        }),
      },
    });
    const jotaro = unidade('jojo:jotaro'), star = unidade('jojo:star-platinum', 1, { usuario: jotaro.uid });
    const fortes = time('p2', ...[2, 3, 4, 5].map(col => em(unidade('pokemon:brigao', 3), col, 0)));
    const r = lutar(c, time('p1', em(jotaro, 3, 0), em(star, 4, 0)), fortes);
    const ja = `a:${jotaro.uid}`, st = `a:${star.uid}`;
    expect(ligados).toEqual([ja, st]);
    expect(r.vencedor).toBe('b');
    const mortes = eventos(r, 'morte');
    const tj = mortes.find(e => e.id === ja)!.t, ts = mortes.find(e => e.id === st)!.t;
    expect(tj).toBe(ts);

    const solto = unidade('jojo:star-platinum', 1, { usuario: 9999 });
    const r2 = lutar(c, time('p1', em(solto, 3, 0), em(unidade('pokemon:brigao'), 4, 0)), fortes);
    expect(r2.gravacao!.inicial.map(e => e.id)).not.toContain(`a:${solto.uid}`);
  });

  it('transformação troca a forma e multiplica os atributos; depois não lança mais', () => {
    let antes: Record<string, number> = {}, depois: Record<string, number> = {}, forma = '';
    const c = conteudoFalso({
      tracos: {
        dragao: traco('dragao', [1], {
          aoComecar(_ctx, _n, membros) { antes = { ...membros[0]!.at, vidaAtual: membros[0]!.vida }; },
          aoLancar(_ctx, _n, u) { depois = { ...u.at, vidaAtual: u.vida }; forma = u.forma; },
        }),
      },
    });
    const zard = unidade('pokemon:charizard');
    const r = lutar(c, time('p1', em(zard, 3, 0)), saco(4, 0));
    const id = `a:${zard.uid}`;
    expect(forma).toBe('pokemon:Mega Charizard X');
    for (const k of ['vida', 'dano', 'armadura', 'resist', 'vidaAtual']) expect(depois[k]! / antes[k]!, k).toBeCloseTo(1.4);
    expect(depois.velAtaque! / antes.velAtaque!).toBeCloseTo(1.15);
    const tr = eventos(r, 'transformar');
    expect(tr).toEqual([expect.objectContaining({ id, nome: 'Mega Charizard X', img: 'pokemon/Mega Charizard X.webp' })]);
    expect(c.chamadas[id]).toBe(1);
    const comMax = quadros(r).filter(q => q.max?.[id]);
    expect(comMax.length).toBe(1);
    expect(comMax[0]!.max![id]![0]).toBe(Math.round(depois.vida!));
  });

  it('LoL ★3 lança dobrado a cada 2 lançamentos; ★2 não', () => {
    const c = conteudoFalso({
      proprias: { 'lol:Ahri': { id: 'lol:Ahri', nome: 'Orbe', texto: '', mana: 30, lancar(ctx, eu, alvo) { if (alvo) ctx.dano(eu, alvo, 0.5); } } },
    });
    const ahri3 = unidade('lol:ahri', 3), ahri2 = unidade('lol:ahri', 2);
    const r3 = lutar(c, time('p1', em(ahri3, 3, 0)), saco());
    const r2 = lutar(c, time('p1', em(ahri2, 3, 0)), saco());
    const L3 = c.lancamentos[`a:${ahri3.uid}`]!, L2 = c.lancamentos[`a:${ahri2.uid}`]!;
    expect(L3).toBeGreaterThanOrEqual(4);
    expect(c.chamadas[`a:${ahri3.uid}`]).toBe(L3 + Math.floor(L3 / 2));
    expect(c.chamadas[`a:${ahri2.uid}`]).toBe(L2);
    expect(eventos(r3, 'habilidade').length).toBe(c.chamadas[`a:${ahri3.uid}`]);
    expect(r2.vencedor).toBe('a');
  });

  it('regras desligadas (o conteúdo faz): sem LoL dobrado, sem vel. na transformação, sem poder', () => {
    const regras = { poder: false, lolDobrado: false, velTransformar: false };
    const c = conteudoFalso({
      proprias: { 'lol:Ahri': { id: 'lol:Ahri', nome: 'Orbe', texto: '', mana: 30, lancar(ctx, eu, alvo) { if (alvo) ctx.dano(eu, alvo, 0.5); } } },
    });
    const ahri3 = unidade('lol:ahri', 3);
    simularLutaCom(c, time('p1', em(ahri3, 3, 0)), saco(), 1, false, regras);
    expect(c.chamadas[`a:${ahri3.uid}`]).toBe(c.lancamentos[`a:${ahri3.uid}`]);

    let vel: [number, number] = [0, 0];
    const c2 = conteudoFalso({
      tracos: {
        dragao: traco('dragao', [1], {
          aoComecar(_ctx, _n, m) { vel = [m[0]!.at.velAtaque, 0]; },
          aoLancar(_ctx, _n, u) { vel[1] = u.at.velAtaque; },
        }),
      },
    });
    simularLutaCom(c2, time('p1', em(unidade('pokemon:charizard'), 3, 0)), saco(4, 0), 1, false, regras);
    expect(vel[1]).toBeCloseTo(vel[0]);
  });

  it('fim por tempo: 30 s, ganha a maior fração de vida; igual = empate', () => {
    const c = conteudoFalso();
    const parado = (dono: string, dano: number) => time(dono, monstro('m0', 3, 0, { vida: 5000, dano }));
    const r = lutar(c, parado('monstros', 0), parado('monstros', 0));
    expect(r.duracao).toBe(30);
    expect(r.vencedor).toBe('empate');
    expect(r.vivosA).toEqual(['a:m0']);
    expect(r.vivosB).toEqual(['b:m0']);
    const r2 = lutar(c, parado('monstros', 5), parado('monstros', 0));
    expect(r2.duracao).toBe(30);
    expect(r2.vencedor).toBe('a');
  });

  it('time vazio perde na hora', () => {
    const r = lutar(conteudoFalso(), time('p1'), time('p2', em(unidade('pokemon:brigao'), 0, 0)));
    expect(r).toMatchObject({ vencedor: 'b', duracao: 0 });
  });

  it('invocado do Final Fantasy: surge ao lado com fração dos atributos e não decide a luta', () => {
    const c = conteudoFalso({
      tracos: {
        smt: traco('smt', [1], {
          aoComecar(ctx, _n, membros) {
            for (const m of membros) {
              const inv = ctx.invocarFF(m, 0.25);
              expect(inv && ctx.distancia(inv, m)).toBe(1);
              expect(inv!.at.vida).toBeCloseTo(m.at.vida * 0.25);
              ctx.depois(1, () => ctx.matar(m, m));
            }
          },
        }),
      },
    });
    const muralha = unidade('smt:muralha');
    const r = lutar(c, time('p1', em(muralha, 0, 3)), saco(0, 3));
    const inv = `a:${muralha.uid}~inv1`;
    expect(eventos(r, 'surge')).toEqual([expect.objectContaining({ estado: expect.objectContaining({ id: inv, nome: 'Goblin', monstro: true }) })]);
    expect(r.vencedor).toBe('b');
    expect(r.duracao).toBeCloseTo(1);
    expect(r.vivosA).toEqual([inv]);
  });

  it('chefe lança a pancada em área e atordoa', () => {
    const c = conteudoFalso();
    const u1 = unidade('pokemon:brigao'), u2 = unidade('pokemon:brigao');
    const chefe = time('monstros', monstro('m0', 3, 0, { manaInicial: 100, vida: 20000 }, true));
    const r = lutar(c, time('p1', em(u1, 3, 0), em(u2, 4, 0)), chefe);
    const h = eventos(r, 'habilidade')[0]!;
    expect(h).toMatchObject({ de: 'b:m0', nome: 'Pancada do Chefe', t: 0.1 });
    const q = quadros(r).find(x => x.t === 0.1)!;
    expect(q.s?.[`a:${u1.uid}`]).toContain('atordoado');
    expect(q.s?.[`a:${u2.uid}`]).toContain('atordoado');
  });

  it('traços: atributos nos membros (ou no time todo) e ganchos chamados; item com atributos e gancho', () => {
    const conta = { atacar: 0, receber: 0, morrer: 0, segundo: 0, lancar: 0 };
    const c = conteudoFalso({
      tracos: {
        porradeiro: traco('porradeiro', [2], {
          atributos: () => ({ vida: 0.5 }),
          aoAtacar() { conta.atacar++; },
          aoReceberDano() { conta.receber++; },
          aoMorrer() { conta.morrer++; },
          porSegundo() { conta.segundo++; },
          aoLancar() { conta.lancar++; },
        }),
        overwatch: traco('overwatch', [1], { alcance: 'time', atributos: () => ({ vida: 0.1 }) }),
      },
      itens: {
        haos: { id: 'haos', nome: 'Haos', texto: '', atributos: { resist: 0.15 }, aoComecar(ctx, eu) { ctx.escudo(eu, 100, 99); } },
      },
    });
    const brigao = unidade('pokemon:brigao', 1, { itens: ['haos'] }), jotaro = unidade('jojo:jotaro'), mira = unidade('overwatch:mira');
    const r = lutar(c, time('p1', em(brigao, 3, 0), em(jotaro, 4, 0), em(mira, 3, 3)), time('p2', ...[2, 3, 4].map(col => em(unidade('pokemon:brigao', 2), col, 0))));
    const ini = Object.fromEntries(r.gravacao!.inicial.map(e => [e.id, e]));
    expect(ini[`a:${brigao.uid}`]!.vidaMax).toBe(Math.round(450 * 1.15 * 1.6));
    expect(ini[`a:${jotaro.uid}`]!.vidaMax).toBe(Math.round(910 * 1.15 * 1.6));
    expect(ini[`a:${mira.uid}`]!.vidaMax).toBe(Math.round(450 * 0.8 * 1.1));
    // os Brigões do lado B não têm o traço (é um campeão só)
    expect(r.gravacao!.inicial.filter(e => e.lado === 'b').every(e => e.vidaMax === Math.round(450 * 1.8 * 1.15 * (1 + BONUS_EVOLUCAO.pokemon![2])))).toBe(true);
    expect(quadros(r)[0]!.u[`a:${brigao.uid}`]![3]).toBe(100);
    expect(conta.atacar).toBeGreaterThan(0);
    expect(conta.receber).toBeGreaterThan(0);
    expect(conta.segundo).toBeGreaterThan(0);
    expect(conta.morrer).toBeGreaterThan(0);
  });

  it('moeda: soma no ouro do lado, guarda a casa e vira evento; a passiva do campeão roda como item', () => {
    const base = conteudoFalso({
      golpe: { id: 'golpe', nome: 'Golpe', texto: '', mana: 30, lancar(ctx, eu) { ctx.moeda(eu.lado, 2, eu); } },
    });
    const vistos: string[] = [];
    const c: ConteudoFalso = {
      ...base,
      passivaDe: campeao => (campeao === 'pokemon:brigao'
        ? { nome: 'Teste', texto: '', aoLancar(ctx, p) { vistos.push(p.id); ctx.moeda(p.lado, 1, p.casa); } }
        : undefined),
    };
    const brigao = unidade('pokemon:brigao');
    const r = lutar(c, time('p1', em(brigao, 3, 0)), saco());
    const id = `a:${brigao.uid}`;
    const lancou = eventos(r, 'habilidade').filter(e => e.de === id).length;
    expect(lancou).toBeGreaterThan(0);
    expect(vistos.length).toBe(lancou);
    expect(r.ouro.a).toBe(3 * lancou);
    expect(r.moedas!.length).toBe(2 * lancou);
    expect(r.moedas!.every(m => m.lado === 'a' && m.casa.lin >= 4)).toBe(true);
    const ev = eventos(r, 'moeda');
    expect(ev.map(e => e.valor)).toEqual(r.moedas!.map(m => m.valor));
    // sem moeda, o resultado não tem a lista
    expect(lutar(conteudoFalso(), time('p1', em(unidade('pokemon:brigao'), 3, 0)), saco()).moedas).toBeUndefined();
  });

  it('desempenho: 100 lutas de 9 contra 9 sem gravar em menos de 2 s', () => {
    const c = conteudoFalso({
      tracos: {
        porradeiro: traco('porradeiro', [2], { atributos: () => ({ vida: 0.2 }), aoAtacar(ctx, _n, de) { ctx.mana(de, 1); } }),
        atirador: traco('atirador', [1], { atributos: () => ({ alcance: 1 }) }),
      },
    });
    const campeoes = ['pokemon:brigao', 'overwatch:mira', 'smt:muralha', 'lol:ahri', 'deadlock:faca', 'pokemon:charizard', 'persona:raio', 'jojo:jotaro', 'pokemon:lerdo'];
    const montar = (dono: string, s: number) => time(dono, ...campeoes.map((camp, i) => em(unidade(camp, ((i + s) % 3 + 1) as 1 | 2 | 3), i % 8, Math.floor(i / 8) + (i % 2) * 2)));
    lutar(c, montar('p1', 0), montar('p2', 1), 0, false);
    const t0 = performance.now();
    for (let s = 1; s <= 100; s++) lutar(c, montar('p1', s), montar('p2', s + 1), s, false);
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(2000);
  });
});
