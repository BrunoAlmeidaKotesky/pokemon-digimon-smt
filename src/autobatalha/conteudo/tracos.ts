// Traços: 10 origens (franquias) e 19 classes/elementos. Escadas e efeitos de docs/tft/autobatalha.md ("Traços").
// Conta campeões diferentes no tabuleiro pela forma atual; Únicos não é traço.
// Estado entre ganchos fica em WeakMap por lutador (os lutadores são objetos novos a cada luta).
import { S } from '../dados';
import type { Contexto, Lutador, NomeAtributo, Traco } from '../tipos';
import { LUTA_TODA, fracVida, maisPertoEm, naArea, num, pct } from './util';

type Bonus = Partial<Record<NomeAtributo, number>>;
/** Valor do degrau `n` (0, 1, 2). */
const deg = (v: readonly number[], n: number): number => v[Math.max(0, Math.min(n, v.length - 1))] ?? 0;

/** Segundo inteiro da luta (os ganchos `porSegundo` vêm a cada segundo). */
const segundo = (ctx: Contexto) => Math.round(ctx.tempo);
const aCadaS = (ctx: Contexto, s: number) => segundo(ctx) > 0 && segundo(ctx) % s === 0;

/** Aumenta a vida máxima no começo da luta e enche a vida de novo (todo mundo começa cheio). */
function buffVidaInicio(ctx: Contexto, u: Lutador, fracao: number): void {
  ctx.buff(u, 'vida', fracao);
  ctx.definirFracaoVida(u, 1);
}

/** Estado de um lado da luta, compartilhado por todos os membros (criado no aoComecar, ou na hora se faltar). */
function estadoDoLado<T>(mapa: WeakMap<Lutador, T>, criar: () => T) {
  return {
    registrar(membros: readonly Lutador[]): T {
      const e = criar();
      for (const m of membros) mapa.set(m, e);
      return e;
    },
    de(u: Lutador): T {
      let e = mapa.get(u);
      if (!e) { e = criar(); mapa.set(u, e); }
      return e;
    },
  };
}

// ===================================================================================================
// Classes (2/4/6)
// ===================================================================================================

const TANQUE = [0.2, 0.4, 0.7];
const PORRADEIRO = [0.15, 0.3, 0.5];
const ASSASSINO = [0.15, 0.3, 0.45];
const DEMONIACOS = [0.1, 0.2, 0.25];
const BIZARRA_MULT = [1, 2, 2.5];
const FADINHAS = [0.04, 0.08, 0.14];
const SAFADA = [0.15, 0.27, 0.4];
/** Safada: segundos de encantado */
const SAFADA_CHARME = 1.5;
const ATIRADOR = [0.03, 0.06, 0.08];
const ANJO = [0.4, 0.5, 0.8];
const ROBO_ARMADURA = [0.25, 0.5, 0.9];
const ROBO_ESCUDO = [0.1, 0.2, 0.35];
// Dragão levou nerf a pedido do usuário (04/11/2026): era 15/30/50% e +10% de dano pro time
const DRAGAO = [0.1, 0.2, 0.32];
const TEMPORAIS = [0.06, 0.12, 0.2];

// aoMorrer roda nos traços do lado do morto e também nos do lado de quem matou: quem age em morte só confia no
// degrau registrado no aoComecar do próprio lado.
const porradeiroBravo = new WeakSet<Lutador>();
const nivelAssassino = new WeakMap<Lutador, number>();
const assassinoAbateu = new WeakSet<Lutador>();
const nivelDemoniaco = new WeakMap<Lutador, number>();
const demoniacoMorto = new WeakSet<Lutador>();
const bizarraCura = new WeakMap<Lutador, number>();
const atiradorAcumulos = new WeakMap<Lutador, number>();
const anjo = new WeakMap<Lutador, { nivel: number; usou: boolean }>();
const anjoRenasceu = new WeakSet<Lutador>();
const temporais = estadoDoLado(new WeakMap<Lutador, { salvou: boolean }>(), () => ({ salvou: false }));

const classes: Traco[] = [
  {
    id: 'tanque', nome: 'Tanque', tipo: 'classe', degraus: [2, 4, 6],
    descricao: 'Linha de frente que segura o dano pelo time: mais armadura e resistência.',
    textos: [
      '+20% de armadura e resistência.',
      '+40% de armadura e resistência, e começam a luta com escudo de 15% da vida.',
      '+70% de armadura e resistência, escudo de 15% da vida no começo, e no começo provocam os inimigos a até 2 casas por 3 s.',
    ],
    atributos: n => ({ armadura: deg(TANQUE, n), resist: deg(TANQUE, n) }),
    aoComecar(ctx, n, membros) {
      if (n < 1) return;
      for (const m of membros) ctx.escudo(m, m.at.vida * 0.15, LUTA_TODA);
      if (n < 2) return;
      for (const m of membros) for (const x of naArea(ctx, m, m, 2, 'inimigos')) ctx.status(m, x, 'provocado', 3);
    },
  },
  {
    id: 'porradeiro', nome: 'Porradeiro', tipo: 'classe', degraus: [2, 4, 6],
    descricao: 'Briga corpo a corpo: muita vida, e bate mais forte quando apanha.',
    textos: [
      '+15% de vida.',
      '+30% de vida; ao cair abaixo de metade da vida, causam 20% a mais de dano até o fim da luta.',
      '+50% de vida, o bônus abaixo de metade da vida, e o resto do time ganha +10% de vida.',
    ],
    atributos: n => ({ vida: deg(PORRADEIRO, n) }),
    aoComecar(ctx, n, membros) {
      if (n < 2 || !membros[0]) return;
      for (const a of ctx.aliadosDe(membros[0], true)) if (!membros.includes(a)) buffVidaInicio(ctx, a, 0.1);
    },
    aoReceberDano(ctx, n, u) {
      if (n < 1 || !u.vivo || porradeiroBravo.has(u) || fracVida(u) >= 0.5) return;
      porradeiroBravo.add(u);
      ctx.texto(u, 'Bravo!');
      ctx.buff(u, 'dano', 0.2);
    },
  },
  {
    id: 'assassino', nome: 'Assassino', tipo: 'classe', degraus: [2, 4, 6],
    descricao: 'No começo da luta saltam pra trás da linha inimiga e acertam críticos.',
    textos: [
      '+15% de chance e +15% de dano de crítico.',
      '+30% de chance e +30% de dano de crítico.',
      '+45% de chance e +45% de dano de crítico, e cada abate deixa o Assassino 1 s sem poder ser alvo.',
    ],
    atributos: n => ({ critChance: deg(ASSASSINO, n), critDano: deg(ASSASSINO, n) }),
    aoComecar(_ctx, n, membros) {
      for (const m of membros) nivelAssassino.set(m, n);
    },
    aoMorrer(ctx, _n, morto, abatedor) {
      if (!abatedor?.vivo || abatedor.lado === morto.lado || (nivelAssassino.get(abatedor) ?? -1) < 2) return;
      if (assassinoAbateu.has(morto)) return;
      assassinoAbateu.add(morto);
      ctx.status(abatedor, abatedor, 'intocavel', 1);
    },
  },
  {
    id: 'demoniacos', nome: 'Demoníacos', tipo: 'classe', degraus: [2, 4, 6],
    descricao: 'Roubam vida, e a morte de um deixa os outros mais fortes.',
    textos: DEMONIACOS.map(v => `${pct(v)} de roubo de vida; quando um Demoníaco morre, os outros ganham +${pct(v)} de dano.`),
    atributos: n => ({ rouboVida: deg(DEMONIACOS, n) }),
    aoComecar(_ctx, n, membros) {
      for (const m of membros) nivelDemoniaco.set(m, n);
    },
    aoMorrer(ctx, _n, morto) {
      const nivel = nivelDemoniaco.get(morto);
      if (nivel === undefined || demoniacoMorto.has(morto)) return;
      demoniacoMorto.add(morto);
      for (const a of ctx.aliadosDe(morto, false)) {
        if (a.vivo && nivelDemoniaco.has(a)) ctx.buff(a, 'dano', deg(DEMONIACOS, nivel));
      }
    },
  },
  {
    // 3/5/7 (pedido do usuário em 04/11/2026: nem todo traço deve começar no 2; é a maior classe do set)
    id: 'criaturinha-bizarra', nome: 'Criaturinha Bizarra', tipo: 'classe', degraus: [3, 5, 7],
    descricao: 'No começo da luta, cada uma ganha um bônus sorteado.',
    textos: [
      'No começo, cada uma ganha um bônus sorteado: escudo de 15% da vida, +15% de vel. ataque, +15% de dano ou cura ' +
      'de 2% da vida por segundo.',
      'O bônus sorteado vale o dobro: escudo de 30%, +30% de vel. ataque, +30% de dano ou cura de 4% por segundo.',
      `O bônus vale ${num(deg(BIZARRA_MULT, 2))} vezes (${pct(0.15 * deg(BIZARRA_MULT, 2))} de escudo, vel. ataque ou dano, ou ` +
      `cura de ${pct(0.02 * deg(BIZARRA_MULT, 2))} por segundo), e cada uma ganha dois bônus diferentes.`,
    ],
    aoComecar(ctx, n, membros) {
      const mult = deg(BIZARRA_MULT, n);
      const opcoes = ['escudo', 'velAtaque', 'dano', 'cura'] as const;
      for (const m of membros) {
        for (const b of ctx.sortear(opcoes, n >= 2 ? 2 : 1)) {
          if (b === 'escudo') ctx.escudo(m, m.at.vida * 0.15 * mult, LUTA_TODA);
          else if (b === 'cura') bizarraCura.set(m, 0.02 * mult);
          else ctx.buff(m, b, 0.15 * mult);
        }
      }
    },
    porSegundo(ctx, _n, membros) {
      for (const m of membros) {
        const c = bizarraCura.get(m);
        if (c && m.vivo) ctx.curar(m, m, m.at.vida * c);
      }
    },
  },
  {
    id: 'fadinhas', nome: 'Fadinhas', tipo: 'classe', degraus: [2, 4, 6],
    descricao: 'Curam o aliado que mais precisa.',
    textos: FADINHAS.map(v => `A cada 4 s, cada Fadinha cura o aliado com menos vida em ${pct(v)} da vida máxima dele.`),
    porSegundo(ctx, n, membros) {
      if (!aCadaS(ctx, 4)) return;
      for (const m of membros) {
        if (!m.vivo) continue;
        const a = ctx.menosVida(m, 'aliados', true);
        if (!a) continue;
        ctx.visual('cura', [a], m);
        ctx.curar(m, a, a.at.vida * deg(FADINHAS, n));
      }
    },
  },
  {
    // 3/5/7 (pedido do usuário em 04/11/2026; a 2ª maior classe do set)
    id: 'safada', nome: 'Safada', tipo: 'classe', degraus: [3, 5, 7],
    descricao: 'Os ataques encantam o alvo.',
    textos: SAFADA.map(v => `Os ataques têm ${pct(v)} de chance de encantar o alvo por ${num(SAFADA_CHARME)} s (atordoado).`),
    aoAtacar(ctx, n, de, alvo) {
      if (!alvo.vivo || !ctx.chance(deg(SAFADA, n))) return;
      ctx.visual('charme', [alvo], de);
      ctx.status(de, alvo, 'atordoado', SAFADA_CHARME);
    },
  },
  {
    id: 'atirador', nome: 'Atirador', tipo: 'classe', degraus: [2, 4, 6],
    descricao: 'Atiram de longe e cada vez mais rápido.',
    textos: ATIRADOR.map(v => `+1 de alcance; cada ataque dá +${pct(v)} de vel. ataque (até 15 vezes).`),
    atributos: () => ({ alcance: 1 }),
    aoAtacar(ctx, n, de) {
      const k = atiradorAcumulos.get(de) ?? 0;
      if (k >= 15) return;
      atiradorAcumulos.set(de, k + 1);
      ctx.buff(de, 'velAtaque', deg(ATIRADOR, n));
    },
  },
  {
    id: 'anjo', nome: 'Anjo', tipo: 'classe', degraus: [2, 4, 6],
    descricao: 'Renascem depois de morrer.',
    textos: [
      `O primeiro Anjo que morrer renasce com ${pct(deg(ANJO, 0))} da vida.`,
      `Todos os Anjos renascem uma vez com ${pct(deg(ANJO, 1))} da vida.`,
      `Todos os Anjos renascem uma vez com ${pct(deg(ANJO, 2))} da vida.`,
    ],
    aoComecar(_ctx, n, membros) {
      const e = { nivel: n, usou: false };
      for (const m of membros) anjo.set(m, e);
    },
    aoMorrer(ctx, _n, morto) {
      const e = anjo.get(morto);
      if (!e || anjoRenasceu.has(morto) || (e.nivel === 0 && e.usou)) return;
      e.usou = true;
      anjoRenasceu.add(morto);
      ctx.visual('luz', [morto], morto);
      ctx.reviver(morto, deg(ANJO, e.nivel));
    },
  },
  {
    id: 'robo', nome: 'Robô', tipo: 'classe', degraus: [2, 4, 6],
    descricao: 'Blindados: armadura e escudo no começo da luta.',
    textos: [
      '+25% de armadura e escudo de 10% da vida no começo.',
      '+50% de armadura e escudo de 20% da vida no começo.',
      '+90% de armadura e escudo de 35% da vida no começo, e imunes a atordoar nos primeiros 5 s.',
    ],
    atributos: n => ({ armadura: deg(ROBO_ARMADURA, n) }),
    aoComecar(ctx, n, membros) {
      for (const m of membros) {
        ctx.escudo(m, m.at.vida * deg(ROBO_ESCUDO, n), LUTA_TODA);
        // o motor ignora o status até esse segundo de luta (memoria['imune:<status>'])
        if (n >= 2) m.memoria['imune:atordoado'] = ctx.tempo + 5;
      }
    },
  },
  {
    id: 'dragao', nome: 'Dragão', tipo: 'classe', degraus: [2, 4, 6],
    descricao: 'Mais vida e mais dano.',
    textos: [
      '+10% de vida e dano.',
      '+20% de vida e dano.',
      '+32% de vida e dano, e o time inteiro ganha +5% de dano.',
    ],
    atributos: n => ({ vida: deg(DRAGAO, n), dano: deg(DRAGAO, n) }),
    aoComecar(ctx, n, membros) {
      if (n < 2 || !membros[0]) return;
      for (const a of ctx.aliadosDe(membros[0], true)) ctx.buff(a, 'dano', 0.05);
    },
  },
  {
    id: 'temporais', nome: 'Temporais', tipo: 'classe', degraus: [2, 4, 6], alcance: 'time',
    descricao: 'Aceleram o time inteiro com o passar da luta.',
    textos: [
      'A cada 5 s, o time ganha +6% de vel. ataque até o fim da luta (acumula).',
      'A cada 5 s, o time ganha +12% de vel. ataque até o fim da luta (acumula).',
      'A cada 5 s, o time ganha +20% de vel. ataque (acumula); uma vez por luta, o aliado que cair abaixo de 20% da ' +
      'vida cura 40% dela.',
    ],
    aoComecar(_ctx, _n, membros) {
      temporais.registrar(membros);
    },
    porSegundo(ctx, n, membros) {
      if (!aCadaS(ctx, 5)) return;
      for (const m of membros) if (m.vivo) ctx.buff(m, 'velAtaque', deg(TEMPORAIS, n));
    },
    aoReceberDano(ctx, n, u) {
      if (n < 2 || !u.vivo || fracVida(u) >= 0.2) return;
      const e = temporais.de(u);
      if (e.salvou) return;
      e.salvou = true;
      ctx.visual('tempo', [u], u);
      ctx.curar(u, u, u.at.vida * 0.4);
    },
  },
];

// ===================================================================================================
// Elementos (2/3/4)
// ===================================================================================================

const FOGO = [0.01, 0.02, 0.03];
const AGUA = [0.015, 0.03, 0.045];
const TERRA = [0.3, 0.6, 1];
/** Terra (4): segundos entre os tremores */
const TERRA_TREMOR = 4;
const VENTO = [0.15, 0.3, 0.45];
const VENTO_DESVIO = [0, 0.1, 0.15];
const RAIO = [1, 2, 3];
const GELO = [0.15, 0.25, 0.35];
const PLANTA = [0.02, 0.035, 0.045];

const fogo = estadoDoLado(new WeakMap<Lutador, Map<Lutador, { ate: number; de: Lutador }>>(), () => new Map());
const raioAtaques = new WeakMap<Lutador, number>();
const geloSeguidos = new WeakMap<Lutador, { alvo: Lutador; n: number }>();
const planta = estadoDoLado(new WeakMap<Lutador, WeakSet<Lutador>>(), () => new WeakSet());

const elementos: Traco[] = [
  {
    id: 'fogo', nome: 'Fogo', tipo: 'elemento', degraus: [2, 3, 4],
    descricao: 'Os ataques queimam: o alvo perde vida aos poucos e recebe menos cura.',
    textos: [
      'Os ataques queimam o alvo por 3 s: 1% da vida máxima por segundo, e ele recebe 33% menos cura.',
      'Os ataques queimam o alvo por 3 s: 2% da vida máxima por segundo, e ele recebe 33% menos cura.',
      'Os ataques queimam o alvo por 3 s: 3% da vida máxima por segundo, e ele recebe 33% menos cura. Quem morre ' +
      'queimando passa o fogo pro inimigo mais perto.',
    ],
    aoComecar(_ctx, _n, membros) {
      fogo.registrar(membros);
    },
    aoAtacar(ctx, n, de, alvo) {
      if (!alvo.vivo) return;
      ctx.status(de, alvo, 'queimando', 3, deg(FOGO, n));
      if (n >= 2) fogo.de(de).set(alvo, { ate: ctx.tempo + 3, de });
    },
    porSegundo(ctx, n, membros) {
      if (n < 2) return;
      for (const queimados of new Set(membros.map(m => fogo.de(m)))) {
        for (const [x, q] of [...queimados]) {
          if (x.vivo) {
            if (ctx.tempo > q.ate) queimados.delete(x);
            continue;
          }
          queimados.delete(x);
          if (ctx.tempo > q.ate + 1) continue;
          const prox = maisPertoEm(ctx, x, ctx.aliadosDe(x, false).filter(a => a.vivo));
          if (!prox) continue;
          ctx.visual('fogo', [x.casa, prox], q.de);
          ctx.status(q.de, prox, 'queimando', 3, deg(FOGO, n));
          queimados.set(prox, { ate: ctx.tempo + 3, de: q.de });
        }
      }
    },
  },
  {
    id: 'agua', nome: 'Água', tipo: 'elemento', degraus: [2, 3, 4],
    descricao: 'Recuperam vida durante a luta.',
    textos: AGUA.map((v, i) => `Recuperam ${pct(v)} da vida máxima por segundo` +
      (i >= 2 ? ', e a cada 4 s se livram de queimadura, lentidão e outros efeitos ruins.' : '.')),
    porSegundo(ctx, n, membros) {
      const limpar = n >= 2 && aCadaS(ctx, 4);
      for (const m of membros) {
        if (!m.vivo) continue;
        ctx.curar(m, m, m.at.vida * deg(AGUA, n));
        if (limpar) ctx.limparStatusRuins(m);
      }
    },
  },
  {
    id: 'terra', nome: 'Terra', tipo: 'elemento', degraus: [2, 3, 4],
    descricao: 'Pele de pedra.',
    textos: TERRA.map((v, i) => `+${pct(v)} de armadura e resistência` +
      (i >= 2 ? `, e a cada ${num(TERRA_TREMOR)} s um tremor atordoa por 0,5 s os inimigos em volta (1 casa).` : '.')),
    atributos: n => ({ armadura: deg(TERRA, n), resist: deg(TERRA, n) }),
    porSegundo(ctx, n, membros) {
      if (n < 2 || !aCadaS(ctx, TERRA_TREMOR)) return;
      for (const m of membros) {
        if (!m.vivo) continue;
        const perto = naArea(ctx, m, m, 1, 'inimigos');
        if (!perto.length) continue;
        ctx.visual('terra', [m, ...perto], m);
        for (const x of perto) ctx.status(m, x, 'atordoado', 0.5);
      }
    },
  },
  {
    id: 'vento', nome: 'Vento', tipo: 'elemento', degraus: [2, 3, 4],
    descricao: 'Rápidos e difíceis de acertar.',
    textos: VENTO.map((v, i) => `+${pct(v)} de vel. ataque` +
      (deg(VENTO_DESVIO, i) > 0 ? `, e desviam de ${pct(deg(VENTO_DESVIO, i))} dos ataques.` : '.')),
    atributos: n => {
      const b: Bonus = { velAtaque: deg(VENTO, n) };
      if (deg(VENTO_DESVIO, n) > 0) b.desvio = deg(VENTO_DESVIO, n);
      return b;
    },
  },
  {
    id: 'raio', nome: 'Raio', tipo: 'elemento', degraus: [2, 3, 4],
    descricao: 'A cada 3 ataques, um raio pula do alvo pra outros inimigos.',
    textos: [
      'A cada 3 ataques, um raio pula do alvo pra 1 inimigo perto dele (60% do dano de ataque).',
      'A cada 3 ataques, um raio pula do alvo pra 2 inimigos perto dele (60% do dano de ataque).',
      'A cada 3 ataques, um raio pula do alvo pra 3 inimigos perto dele (60% do dano de ataque) e atordoa por 0,5 s.',
    ],
    aoAtacar(ctx, n, de, alvo) {
      const k = (raioAtaques.get(de) ?? 0) + 1;
      raioAtaques.set(de, k % 3);
      if (k < 3) return;
      const pulos: Lutador[] = [];
      let atual = alvo;
      for (let i = 0; i < deg(RAIO, n); i++) {
        const prox = maisPertoEm(ctx, atual, ctx.inimigosDe(de).filter(x => x.vivo && x !== alvo && !pulos.includes(x)));
        if (!prox) break;
        pulos.push(prox);
        atual = prox;
      }
      if (!pulos.length) return;
      ctx.visual('raio', [alvo, ...pulos], de);
      for (const x of pulos) {
        ctx.dano(de, x, 0.6, { tipo: 'magico', critico: 'nunca' });
        if (n >= 2 && x.vivo) ctx.status(de, x, 'atordoado', 0.5);
      }
    },
  },
  {
    id: 'gelo', nome: 'Gelo', tipo: 'elemento', degraus: [2, 3, 4],
    descricao: 'Os ataques deixam o alvo mais lento.',
    textos: [
      'Os ataques deixam o alvo 15% mais lento por 2 s.',
      'Os ataques deixam o alvo 25% mais lento por 2 s.',
      'Os ataques deixam o alvo 35% mais lento por 2 s, e o 5º ataque seguido no mesmo alvo congela ele por 1 s.',
    ],
    aoAtacar(ctx, n, de, alvo) {
      if (!alvo.vivo) return;
      ctx.status(de, alvo, 'lento', 2, deg(GELO, n));
      if (n < 2) return;
      const s = geloSeguidos.get(de);
      const k = s && s.alvo === alvo ? s.n + 1 : 1;
      geloSeguidos.set(de, { alvo, n: k >= 5 ? 0 : k });
      if (k >= 5) {
        ctx.visual('gelo', [alvo], de);
        ctx.status(de, alvo, 'atordoado', 1);
      }
    },
  },
  {
    id: 'planta', nome: 'Planta', tipo: 'elemento', degraus: [2, 3, 4],
    descricao: 'O primeiro ataque em cada inimigo planta uma semente que suga a vida dele.',
    textos: PLANTA.map((v, i) => `O 1º ataque do time em cada inimigo planta uma semente que suga ${pct(v)} da vida ` +
      'máxima dele por segundo, por 4 s' +
      (i >= 2 ? '; a cura vai pra quem plantou e pro aliado mais perto dele.' : ', e cura quem plantou.')),
    aoComecar(_ctx, _n, membros) {
      planta.registrar(membros);
    },
    aoAtacar(ctx, n, de, alvo) {
      const semeados = planta.de(de);
      if (!alvo.vivo || semeados.has(alvo)) return;
      semeados.add(alvo);
      ctx.visual('veneno', [alvo], de);
      const fracao = deg(PLANTA, n);
      for (let i = 1; i <= 4; i++) {
        ctx.depois(i, () => {
          if (!alvo.vivo) return;
          const d = ctx.danoFixo(de, alvo, alvo.at.vida * fracao, { tipo: 'verdadeiro', critico: 'nunca' });
          if (d <= 0) return;
          if (de.vivo) ctx.curar(de, de, d);
          if (n < 2) return;
          const vizinho = maisPertoEm(ctx, de, ctx.aliadosDe(de, false).filter(a => a.vivo));
          if (vizinho) ctx.curar(de, vizinho, d);
        });
      }
    },
  },
];

// ===================================================================================================
// Origens (franquias)
// ===================================================================================================

// Escadas das origens: 5 degraus (6 nas maiores), pela conta de docs/tft/matematica/resultado.md, seção 6b. Os números
// de cada degrau estão nas listas abaixo (uma posição por degrau).
const POKEMON = [0.01, 0.015, 0.02, 0.025, 0.03, 0.035];
const DIGIMON = [0.08, 0.12, 0.18, 0.25, 0.35];
/** Digimon: o parceiro ganha metade a partir deste degrau (3 Digimon), e a mana cheia a partir deste (5 Digimon) */
const DIGIMON_PARCEIRO = 1;
const DIGIMON_MANA = 3;
const SMT = [0.2, 0.25, 0.32, 0.45, 0.6];
const PERSONA = [0.08, 0.14, 0.2, 0.28, 0.38];
const JOJO = [0.06, 0.1, 0.16, 0.24, 0.32, 0.42];
/** JoJo: Stands lançam com 25% menos mana a partir deste degrau (7 de JoJo) */
const JOJO_MANA = 3;
const YGO = [0.1, 0.15, 0.22, 0.3, 0.4, 0.5];
/** Yu-Gi-Oh!: as cartas ganham as duas posições a partir deste degrau (7 cartas) */
const YGO_DUAS = 3;
const LOL = [0.1, 0.15, 0.22, 0.3, 0.4, 0.5];
const OVERWATCH = [0.06, 0.1, 0.15, 0.2, 0.28];
const OVERWATCH_JOGADA = [0.02, 0.03, 0.05, 0.07, 0.1];
const DEADLOCK_POR_10 = [0.015, 0.02, 0.025, 0.03, 0.04];
const DEADLOCK_ALMAS = [1, 1, 1, 2, 2];
const SUJIMON = [0.1, 0.15, 0.22, 0.3, 0.4];
const SUJIMON_RECRUTAR = [0, 0.3, 0.5, 0.75, 1];

/** Atributo que cada Persona espalha, pela 1ª classe dela. */
export const ATRIBUTO_PERSONA: Record<string, NomeAtributo[]> = {
  atirador: ['dano'], assassino: ['dano'], porradeiro: ['dano'], fogo: ['dano'], raio: ['dano'],
  tanque: ['vida'], terra: ['vida'], anjo: ['vida'], agua: ['vida'],
  vento: ['velAtaque'], safada: ['velAtaque'], temporais: ['velAtaque'],
  robo: ['armadura', 'resist'], gelo: ['armadura', 'resist'], planta: ['armadura', 'resist'],
  fadinhas: ['poder'], demoniacos: ['poder'], dragao: ['poder'], 'criaturinha-bizarra': ['poder'],
};

const origens: Traco[] = [
  {
    id: 'pokemon', nome: 'Pokémon', tipo: 'origem', degraus: [2, 4, 6, 8, 9, 10],
    descricao: 'Quanto mais Pokémon no tabuleiro, mais fortes todos ficam.',
    textos: POKEMON.map(v => `Cada Pokémon ganha +${pct(v)} de vida e dano por Pokémon no tabuleiro.`),
    aoComecar(ctx, n, membros) {
      const b = deg(POKEMON, n) * membros.length;
      for (const m of membros) {
        ctx.buff(m, 'dano', b);
        buffVidaInicio(ctx, m, b);
      }
    },
  },
  {
    id: 'digimon', nome: 'Digimon', tipo: 'origem', degraus: [2, 3, 4, 5, 6],
    descricao: 'Parceiro: o Digimon fica mais forte do lado de um aliado de outra franquia.',
    textos: DIGIMON.map((v, i) => `Parceiro: o Digimon com um aliado de outra origem do lado (1 casa) no começo da luta ` +
      `ganha +${pct(v)} de vida e dano` +
      (i >= DIGIMON_PARCEIRO ? `, e o parceiro ganha metade (+${pct(v / 2)})` : '') +
      (i >= DIGIMON_MANA ? '; o Digimon com parceiro começa com a mana cheia' : '') + '.'),
    aoComecar(ctx, n, membros) {
      const usados = new Set<Lutador>();
      const v = deg(DIGIMON, n);
      for (const m of membros) {
        const candidatos = ctx.aliadosDe(m, false).filter(a =>
          a.vivo && a.fr !== 'digimon' && a.fr !== 'ff' && !a.invocado && ctx.distancia(a, m) <= 1);
        const parceiro = candidatos.find(a => !usados.has(a)) ?? candidatos[0];
        if (!parceiro) continue;
        usados.add(parceiro);
        ctx.visual('luz', [m, parceiro], m);
        ctx.buff(m, 'dano', v);
        buffVidaInicio(ctx, m, v);
        if (n >= DIGIMON_PARCEIRO) {
          ctx.buff(parceiro, 'dano', v / 2);
          buffVidaInicio(ctx, parceiro, v / 2);
        }
        if (n >= DIGIMON_MANA) ctx.mana(m, m.at.mana);
      }
    },
  },
  {
    id: 'smt', nome: 'SMT', tipo: 'origem', degraus: [2, 3, 4, 6, 8],
    descricao: 'Invocadores: cada demônio chama um monstro do Final Fantasy pra lutar do lado dele.',
    textos: SMT.map(v => `No começo da luta, cada demônio invoca ao lado um monstro do Final Fantasy (sorteado) com ` +
      `${pct(v)} dos atributos dele.`),
    aoComecar(ctx, n, membros) {
      for (const m of membros) if (m.vivo && !m.invocado) ctx.invocarFF(m, deg(SMT, n));
    },
  },
  {
    id: 'persona', nome: 'Persona', tipo: 'origem', degraus: [1, 2, 3, 4, 5],
    descricao: 'Cada Persona dá aos aliados em volta (1 casa) um atributo, pela 1ª classe dela: dano (Atirador, ' +
      'Assassino, Porradeiro, Fogo, Raio), vida (Tanque, Terra, Anjo, Água), vel. ataque (Vento, Safada, Temporais), ' +
      'armadura e resistência (Robô, Gelo, Planta) ou poder de habilidade (Fadinhas, Demoníacos, Dragão, Criaturinha ' +
      'Bizarra).',
    textos: PERSONA.map(v => `No começo da luta, cada Persona dá +${pct(v)} do seu atributo aos aliados em volta (1 casa).`),
    aoComecar(ctx, n, membros) {
      const v = deg(PERSONA, n);
      for (const m of membros) {
        const classe = m.classes.find(c => c in ATRIBUTO_PERSONA);
        const atributos: NomeAtributo[] = (classe ? ATRIBUTO_PERSONA[classe] : undefined) ?? ['dano'];
        const vizinhos = naArea(ctx, m, m, 1, 'aliados').filter(a => a !== m);
        if (!vizinhos.length) continue;
        ctx.visual('luz', vizinhos, m);
        for (const a of vizinhos) {
          for (const at of atributos) {
            if (at === 'vida') buffVidaInicio(ctx, a, v);
            else ctx.buff(a, at, v);
          }
        }
      }
    },
  },
  {
    id: 'jojo', nome: 'JoJo', tipo: 'origem', degraus: [2, 3, 5, 7, 9, 10],
    descricao: 'Stands e seus usuários ficam mais fortes.',
    textos: JOJO.map((v, i) => `Stands e seus usuários ganham +${pct(v)} de dano e vida` +
      (i >= JOJO_MANA ? ', e os Stands lançam com 25% menos mana' : '') + '.'),
    aoComecar(ctx, n, membros) {
      const v = deg(JOJO, n);
      const todos = new Set<Lutador>();
      for (const m of membros) {
        todos.add(m);
        if (m.usuario) todos.add(m.usuario);
      }
      for (const u of todos) {
        if (!u.vivo) continue;
        ctx.buff(u, 'dano', v);
        buffVidaInicio(ctx, u, v);
      }
      if (n < JOJO_MANA) return;
      for (const m of membros) if (m.stand) ctx.buff(m, 'mana', -Math.round(m.at.mana * 0.25));
    },
  },
  {
    id: 'ygo', nome: 'Yu-Gi-Oh!', tipo: 'origem', degraus: [2, 3, 5, 7, 9, 10],
    descricao: 'Cada carta fica em posição de ataque (mais dano) ou de defesa (mais vida e armadura, e provoca).',
    textos: YGO.map((v, i) => (i < YGO_DUAS
      ? `Em ataque: +${pct(v)} de dano. Em defesa: +${pct(v)} de vida e armadura, e provoca os inimigos em volta ` +
        '(1 casa) por 2 s no começo.'
      : `Cada carta ganha os dois: +${pct(v)} de dano, +${pct(v)} de vida e armadura, e as em defesa provocam os ` +
        'inimigos em volta (1 casa) por 2 s no começo.')),
    aoComecar(ctx, n, membros) {
      const v = deg(YGO, n);
      const duas = n >= YGO_DUAS;
      for (const m of membros) {
        const defesa = m.unidade?.posicao === 'defesa';
        if (!defesa || duas) ctx.buff(m, 'dano', v);
        if (!defesa && !duas) continue;
        ctx.buff(m, 'armadura', v);
        buffVidaInicio(ctx, m, v);
        if (!defesa) continue;
        for (const x of naArea(ctx, m, m, 1, 'inimigos')) ctx.status(m, x, 'provocado', 2);
      }
    },
  },
  {
    id: 'lol', nome: 'LoL', tipo: 'origem', degraus: [2, 3, 5, 7, 9, 10],
    descricao: 'Mais poder de habilidade. Regra da franquia, com ou sem o traço: na estrela 3, a cada 2 lançamentos a ' +
      'habilidade sai duas vezes (a "ultimate").',
    textos: LOL.map(v => `+${pct(v)} de poder de habilidade.`),
    atributos: n => ({ poder: deg(LOL, n) }),
  },
  {
    id: 'overwatch', nome: 'Overwatch', tipo: 'origem', degraus: [2, 3, 4, 5, 7],
    descricao: 'Mais velocidade de ataque, e o destaque de cada luta fica mais forte pro resto da partida.',
    textos: OVERWATCH.map((v, i) => `+${pct(v)} de vel. ataque. Jogada da Partida: depois de cada luta, o herói do ` +
      `Overwatch que mais causou dano ganha +${pct(OVERWATCH_JOGADA[i] ?? 0)} de dano e vida pro resto da partida.`),
    atributos: n => ({ velAtaque: deg(OVERWATCH, n) }),
  },
  {
    id: 'deadlock', nome: 'Deadlock', tipo: 'origem', degraus: [2, 3, 4, 5, 6],
    descricao: 'Juntam almas com os abates e as trocam por ouro e força.',
    textos: DEADLOCK_POR_10.map((v, i) => `Cada abate de um herói do Deadlock rende ${DEADLOCK_ALMAS[i] ?? 1} ` +
      `alma${(DEADLOCK_ALMAS[i] ?? 1) > 1 ? 's' : ''}. A cada 10 almas: +1 de ouro, e os heróis do Deadlock ganham ` +
      `+${pct(v)} de dano e vida (por 10 almas juntadas na partida).`),
  },
  {
    id: 'sujimon', nome: 'Sujimon', tipo: 'origem', degraus: [2, 3, 4, 5, 6],
    descricao: 'Mais vida e dano, e trazem outros Sujimon depois das rodadas de monstros.',
    textos: SUJIMON.map((v, i) => {
      const c = SUJIMON_RECRUTAR[i] ?? 0;
      return `+${pct(v)} de vida e dano` + (c >= 1
        ? ', e vencer uma rodada de monstros sempre traz um Sujimon de graça pro banco.'
        : c > 0 ? `, e vencer uma rodada de monstros tem ${pct(c)} de chance de trazer um Sujimon de graça pro banco.` : '.');
    }),
    atributos: n => ({ vida: deg(SUJIMON, n), dano: deg(SUJIMON, n) }),
  },
];

/** Todos os traços pelo id: 10 origens e 19 classes/elementos (sem "unicos"). */
export const TRACOS: Record<string, Traco> = Object.fromEntries([...origens, ...classes, ...elementos].map(t => [t.id, t]));

/** Bônus da Jogada da Partida do Overwatch por degrau (a partida aplica depois da luta). */
export const JOGADA_DA_PARTIDA: readonly number[] = OVERWATCH_JOGADA;
/** Vida e dano por 10 almas do Deadlock, por degrau (a partida aplica). */
export const DEADLOCK_POR_10_ALMAS: readonly number[] = DEADLOCK_POR_10;
/** Almas por abate de herói do Deadlock por degrau (a partida conta). */
export const ALMAS_POR_ABATE: readonly number[] = DEADLOCK_ALMAS;
/** Chance de trazer um Sujimon de graça ao vencer rodada de monstros, por degrau (a partida sorteia). */
export const CHANCE_RECRUTAR_SUJIMON: readonly number[] = SUJIMON_RECRUTAR;

export interface TracoAtivo { id: string; n: number; nivel: number }

/** Índice do maior degrau atingido com `n` campeões (-1 = nenhum). */
export function nivelDoTraco(id: string, n: number): number {
  const t = TRACOS[id];
  if (!t) return -1;
  let nivel = -1;
  t.degraus.forEach((d, i) => { if (n >= d) nivel = i; });
  return nivel;
}

/** Traços de um tabuleiro: campeões diferentes (cópias do mesmo campeão contam uma vez), pela origem do campeão e
 *  pelas classes da forma atual; Únicos fica de fora. Ativos primeiro (degrau maior, depois mais campeões), depois os
 *  inativos por contagem. */
export function contarTracos(unidades: { campeao: string; forma: string }[]): TracoAtivo[] {
  const s = S();
  const porTraco = new Map<string, Set<string>>();
  const somar = (traco: string, campeao: string) => {
    if (!(traco in TRACOS)) return;
    let set = porTraco.get(traco);
    if (!set) porTraco.set(traco, (set = new Set()));
    set.add(campeao);
  };
  for (const u of unidades) {
    somar(s.campeao(u.campeao).fr, u.campeao);
    for (const c of s.forma(u.forma).classes) somar(c, u.campeao);
  }
  const ordem = Object.keys(TRACOS);
  return [...porTraco].map(([id, set]) => ({ id, n: set.size, nivel: nivelDoTraco(id, set.size) }))
    .sort((a, b) => b.nivel - a.nivel || b.n - a.n || ordem.indexOf(a.id) - ordem.indexOf(b.id));
}
