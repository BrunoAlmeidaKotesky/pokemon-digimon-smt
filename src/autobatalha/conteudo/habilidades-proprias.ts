// Habilidades próprias (JoJo, Únicos e as que o usuário escreveu no Catálogo), pela chave da forma `${fr}:${nome}`.
// Textos de docs/tft/base/habilidades.json ("unidades") e de docs/tft/set1-escolhas-v5.json, ajustados ao que o código
// faz. Valores "a/b/c" = estrela 1/2/3. "A unidade do Stand" = eu.usuario (ou o próprio Stand, se estiver solto).
import type { Contexto, Habilidade, Lutador, PorEstrela } from '../tipos';
import {
  alvejaveis, alvoDe, bater, baterFixo, copiaCasa, corrente, curarH, devolverMana, escudoH, fracVida, inimigosVivos,
  naArea, num, pc, pct, pe, porSegundos, repetir, semRepetir, seg, tirarMana, usuarioDe,
} from './util';

type Lancar = (ctx: Contexto, eu: Lutador, alvo: Lutador | null) => void;

function hab(id: string, nome: string, mana: number, texto: string, lancar: Lancar, manaInicial?: number): Habilidade {
  return { id, nome, mana, texto: `${nome}: ${texto}`, lancar, ...(manaInicial != null ? { manaInicial } : {}) };
}

/** Executa `fn` com o alvo da habilidade (o atual ou o mais perto); sem inimigo, não faz nada. */
const comAlvo = (fn: (ctx: Contexto, eu: Lutador, alvo: Lutador) => void): Lancar => (ctx, eu, alvo0) => {
  const alvo = alvoDe(ctx, eu, alvo0);
  if (alvo) fn(ctx, eu, alvo);
};

/** O aliado (sem contar `fora`) com menor fração de vida. */
function aliadoMaisFerido(ctx: Contexto, eu: Lutador, fora: readonly Lutador[]): Lutador | null {
  let melhor: Lutador | null = null;
  for (const a of ctx.aliadosDe(eu, true)) {
    if (!a.vivo || fora.includes(a)) continue;
    if (!melhor || fracVida(a) < fracVida(melhor)) melhor = a;
  }
  return melhor;
}

/** Vitórias do Boy II Man contra cada alvo, por Stand (os lutadores são novos a cada luta). */
const vitoriasJokenpo = new WeakMap<Lutador, Map<Lutador, number>>();

// ---------------------------------------------------------------------------------------------------------------
// Pokémon e Digimon
// ---------------------------------------------------------------------------------------------------------------

const EXPLOUD: PorEstrela = [1.5, 2.25, 3.4];
const LUXRAY: PorEstrela = [1.3, 1.95, 2.9];
const LUXRAY_ATORDOA: PorEstrela = [1, 1.25, 1.5];
const SERPERIOR: PorEstrela = [1.2, 1.8, 2.7];
const REUNICLUS_CURA: PorEstrela = [0.5, 0.75, 1];
const REUNICLUS_ESCUDO: PorEstrela = [0.2, 0.3, 0.45];
const AEGISLASH: PorEstrela = [1.5, 2.25, 3.4];
const AEGISLASH_SANGRA: PorEstrela = [0.2, 0.3, 0.45];
const VIKAVOLT: PorEstrela = [1.2, 1.8, 2.7];
const TSAREENA: PorEstrela = [2, 3, 4.5];
const SOLGALEO_QUEIMA: PorEstrela = [0.04, 0.06, 0.08];
const SOLGALEO: PorEstrela = [1.5, 2.25, 3.4];
const LUNALA_RESIST: PorEstrela = [0.3, 0.4, 0.5];
const LUNALA: PorEstrela = [2, 3, 4.5];
const MEWTWO: PorEstrela = [2, 3, 4.5];
const MEWTWO_ATORDOA: PorEstrela = [1.5, 2, 2.5];
const BANETTE: PorEstrela = [1, 1.5, 2.25];
const BANETTE_MEDO: PorEstrela = [1.5, 1.75, 2];
const LOPUNNY: PorEstrela = [1.5, 2.25, 3.4];
const LOPUNNY_VEL: PorEstrela = [0.4, 0.5, 0.6];
const SUKAMON: PorEstrela = [2.2, 3.3, 5];

const pokemonEDigimon: Habilidade[] = [
  hab('pokemon:Exploud', 'Estrondo', 80,
    `solta um grito que acerta todos os inimigos numa área de 2 casas em volta: ${pc(EXPLOUD)} do dano de ataque, e eles ` +
    'perdem 30% da mana. Os inimigos em volta (1 casa) ainda ficam atordoados por 1 s.',
    (ctx, eu) => {
      const area = naArea(ctx, eu, eu, 2, 'inimigos');
      ctx.visual('sopro', [eu, ...area], eu);
      for (const x of area) {
        bater(ctx, eu, x, pe(eu, EXPLOUD));
        if (!x.vivo) continue;
        tirarMana(ctx, x, 0.3);
        if (ctx.distancia(eu, x) <= 1) ctx.status(eu, x, 'atordoado', 1);
      }
    }),

  hab('pokemon:Luxray', 'Descarga Paralisante', 80,
    `dispara um raio em linha reta, do Luxray até a borda passando pelo alvo: ${pc(LUXRAY)} do dano de ataque em todos ` +
    `no caminho, que ficam atordoados por ${seg(LUXRAY_ATORDOA)}.`,
    comAlvo((ctx, eu, alvo) => {
      const linha = semRepetir([alvo, ...ctx.emLinha(eu, alvo, 'inimigos')]);
      ctx.visual('raio', linha, eu);
      for (const x of linha) {
        bater(ctx, eu, x, pe(eu, LUXRAY));
        if (x.vivo) ctx.status(eu, x, 'atordoado', pe(eu, LUXRAY_ATORDOA));
      }
    })),

  hab('pokemon:Serperior', 'Tempestade de Folhas', 80,
    'dispara 3 folhas afiadas em leque (3 casas na direção do alvo). Cada folha acerta um inimigo diferente do leque, do ' +
    `mais perto pro mais longe, com ${pc(SERPERIOR)} do dano de ataque; folha que sobrar vai no alvo.`,
    comAlvo((ctx, eu, alvo) => {
      const leque = ctx.emCone(eu, alvo, 3, 'inimigos').sort((a, b) => ctx.distancia(eu, a) - ctx.distancia(eu, b));
      ctx.visual('vento', leque.length ? leque : [alvo], eu);
      for (let i = 0; i < 3; i++) bater(ctx, eu, leque[i] ?? alvo, pe(eu, SERPERIOR));
    })),

  hab('pokemon:Reuniclus', 'Sacrifício Celular', 90,
    'se o aliado com menos vida estiver abaixo de metade da vida, o Reuniclus se desfaz por ele: cura ' +
    `${pc(REUNICLUS_CURA)} da vida máxima dele e passa a vida que ainda tinha como escudo por 5 s; o Reuniclus morre. ` +
    `Senão, só dá a esse aliado escudo de ${pc(REUNICLUS_ESCUDO)} da vida máxima dele por 4 s.`,
    (ctx, eu) => {
      const a = aliadoMaisFerido(ctx, eu, [eu]);
      if (!a) {
        curarH(ctx, eu, eu, eu.at.vida * 0.3);
        return;
      }
      ctx.visual('cura', [a], eu);
      if (fracVida(a) < 0.5) {
        const resto = eu.vida;
        curarH(ctx, eu, a, a.at.vida * pe(eu, REUNICLUS_CURA));
        ctx.escudo(a, resto, 5);
        ctx.texto(eu, 'Pela equipe!');
        ctx.matar(eu, eu);
      } else {
        escudoH(ctx, eu, a, a.at.vida * pe(eu, REUNICLUS_ESCUDO), 4);
      }
    }),

  hab('pokemon:Aegislash', 'Lâmina Real', 70,
    `corta na horizontal: o alvo e os inimigos ao lado dele na mesma fila levam ${pc(AEGISLASH)} do dano de ataque e ` +
    `sangram por 4 s, perdendo ${pc(AEGISLASH_SANGRA)} do dano de ataque por segundo (dano físico).`,
    comAlvo((ctx, eu, alvo) => {
      const fila = naArea(ctx, eu, alvo, 1, 'inimigos').filter(x => x.casa.lin === alvo.casa.lin);
      ctx.visual('golpe', fila, eu);
      for (const x of fila) bater(ctx, eu, x, pe(eu, AEGISLASH));
      const sangra = pe(eu, AEGISLASH_SANGRA);
      porSegundos(ctx, 4, () => {
        for (const x of fila) bater(ctx, eu, x, sangra, { tipo: 'fisico', critico: 'nunca' });
      });
    })),

  hab('pokemon:Vikavolt', 'Zap Canhão', 80,
    'dispara choques nos 3 inimigos mais perto à sua frente (leque de 3 casas na direção do alvo): ' +
    `${pc(VIKAVOLT)} do dano de ataque, e eles ficam atordoados por 1,5 s.`,
    comAlvo((ctx, eu, alvo) => {
      const leque = ctx.emCone(eu, alvo, 3, 'inimigos').sort((a, b) => ctx.distancia(eu, a) - ctx.distancia(eu, b));
      const alvos = leque.length ? leque.slice(0, 3) : [alvo];
      ctx.visual('raio', alvos, eu);
      for (const x of alvos) {
        bater(ctx, eu, x, pe(eu, VIKAVOLT));
        if (x.vivo) ctx.status(eu, x, 'atordoado', 1.5);
      }
    })),

  hab('pokemon:Tsareena', 'Charme da Rainha', 70,
    `encanta o inimigo mais próximo e dá um chute real: ${pc(TSAREENA)} do dano de ataque. Ele fica encantado por 2,5 s ` +
    '(atordoado) e leva 25% a mais de dano enquanto isso.',
    (ctx, eu, alvo0) => {
      const alvo = ctx.maisProximo(eu, 'inimigos') ?? alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      ctx.visual('charme', [alvo], eu);
      ctx.status(eu, alvo, 'vulneravel', 2.5, 0.25);
      bater(ctx, eu, alvo, pe(eu, TSAREENA));
      if (alvo.vivo) ctx.status(eu, alvo, 'atordoado', 2.5);
    }),

  hab('pokemon:Solgaleo', 'Explosão Solar', 90,
    `incendeia todos os inimigos por 3 s: perdem ${pc(SOLGALEO_QUEIMA)} da vida máxima por segundo e recebem 33% menos ` +
    `cura. O alvo ainda leva ${pc(SOLGALEO)} do dano de ataque.`,
    (ctx, eu, alvo0) => {
      const todos = inimigosVivos(ctx, eu);
      ctx.visual('fogo', todos, eu);
      for (const x of todos) ctx.status(eu, x, 'queimando', 3, pe(eu, SOLGALEO_QUEIMA));
      const alvo = alvoDe(ctx, eu, alvo0);
      if (alvo) bater(ctx, eu, alvo, pe(eu, SOLGALEO));
    }),

  hab('pokemon:Lunala', 'Raio Fantasma Lunar', 80,
    `abaixa em ${pc(LUNALA_RESIST)} a resistência de todos os inimigos por 6 s e acerta o alvo com um raio fantasma: ` +
    `${pc(LUNALA)} do dano de ataque.`,
    (ctx, eu, alvo0) => {
      const todos = inimigosVivos(ctx, eu);
      ctx.visual('trevas', todos, eu);
      for (const x of todos) ctx.buff(x, 'resist', -pe(eu, LUNALA_RESIST), 6);
      const alvo = alvoDe(ctx, eu, alvo0);
      if (alvo) {
        ctx.visual('feixe', [alvo], eu);
        bater(ctx, eu, alvo, pe(eu, LUNALA));
      }
    }),

  hab('pokemon:Mega Mewtwo X', 'Onda Psíquica', 90,
    `libera uma onda psíquica em círculo: os inimigos a até 2 casas levam ${pc(MEWTWO)} do dano de ataque e ficam ` +
    `atordoados por ${seg(MEWTWO_ATORDOA)}.`,
    (ctx, eu) => {
      const area = naArea(ctx, eu, eu, 2, 'inimigos');
      ctx.visual('explosao', [eu, ...area], eu);
      for (const x of area) {
        bater(ctx, eu, x, pe(eu, MEWTWO));
        if (x.vivo) ctx.status(eu, x, 'atordoado', pe(eu, MEWTWO_ATORDOA));
      }
    }),

  hab('pokemon:Mega Banette', 'Pavor', 80,
    `solta um riso de dar medo: os inimigos a até 2 casas levam ${pc(BANETTE)} do dano de ataque e ficam com medo ` +
    `(atordoados) por ${seg(BANETTE_MEDO)}; depois, ainda tremendo, causam 25% menos dano por 3 s.`,
    (ctx, eu) => {
      const area = naArea(ctx, eu, eu, 2, 'inimigos');
      ctx.visual('trevas', [eu, ...area], eu);
      const medo = pe(eu, BANETTE_MEDO);
      for (const x of area) {
        bater(ctx, eu, x, pe(eu, BANETTE));
        if (!x.vivo) continue;
        ctx.status(eu, x, 'atordoado', medo);
        ctx.status(eu, x, 'fraco', medo + 3, 0.25);
      }
    }),

  hab('pokemon:Mega Lopunny', 'Salto Alto', 70,
    'dá um dash em linha reta até a fila de trás dos inimigos, chutando quem estiver no caminho ' +
    `(${pc(LOPUNNY)} do dano de ataque), e fica lá atacando: ganha ${pc(LOPUNNY_VEL)} de velocidade de ataque por 4 s.`,
    (ctx, eu, alvo0) => {
      const fundo = ctx.maisLonge(eu, 'inimigos') ?? alvoDe(ctx, eu, alvo0);
      if (!fundo) return;
      const caminho = semRepetir([...ctx.emLinha(eu, fundo, 'inimigos'), fundo]);
      ctx.visual('vento', caminho, eu);
      for (const x of caminho) bater(ctx, eu, x, pe(eu, LOPUNNY));
      const casa = ctx.casaLivreAoLado(fundo);
      if (casa) ctx.mover(eu, casa);
      ctx.buff(eu, 'velAtaque', pe(eu, LOPUNNY_VEL), 4);
    }),

  hab('digimon:Sukamon', 'Cocô', 70,
    `arremessa cocô no alvo: ${pc(SUKAMON)} do dano de ataque, e ele fica com nojo: causa 30% menos dano por 4 s. ` +
    'Os inimigos em volta dele (1 casa) também ficam com nojo, por 2 s.',
    comAlvo((ctx, eu, alvo) => {
      const respingo = naArea(ctx, eu, alvo, 1, 'inimigos').filter(x => x !== alvo);
      ctx.visual('veneno', [alvo, ...respingo], eu);
      bater(ctx, eu, alvo, pe(eu, SUKAMON));
      if (alvo.vivo) {
        ctx.status(eu, alvo, 'fraco', 4, 0.3);
        ctx.texto(alvo, 'Eca!');
      }
      for (const x of respingo) ctx.status(eu, x, 'fraco', 2, 0.3);
    })),
];

// ---------------------------------------------------------------------------------------------------------------
// SMT, LoL, Deadlock e Sujimon
// ---------------------------------------------------------------------------------------------------------------

const ANUBIS: PorEstrela = [3, 4.5, 6.75];
const ARAHABAKI: PorEstrela = [2, 2.5, 3];
const MOT: PorEstrela = [2.5, 3.75, 5.6];
const VELKOZ: PorEstrela = [3, 4.5, 7];
const BABA: PorEstrela = [1.6, 2.4, 3.6];
const ESCAPIST_CURA: PorEstrela = [0.2, 0.3, 0.45];
const TWISTED: PorEstrela = [0.9, 1.35, 2];
const DIEHARD: PorEstrela = [2.2, 3.3, 5];
const MASCOT: PorEstrela = [3.2, 4.8, 7.2];

const outros: Habilidade[] = [
  hab('smt:Anubis', 'Pesagem do Coração', 70,
    `põe na balança o coração do inimigo com mais vida: ele leva ${pc(ANUBIS)} do dano de ataque mais 10% da vida que ` +
    'tem agora. Se ainda tiver mais vida que o Anubis, o coração pesou: fica atordoado por 1,5 s.',
    (ctx, eu, alvo0) => {
      const vivos = alvejaveis(ctx, eu);
      const alvo = vivos.reduce<Lutador | null>((m, x) => (!m || x.vida > m.vida ? x : m), null) ?? alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      ctx.visual('trevas', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, ANUBIS), { extra: alvo.vida * 0.1 });
      if (alvo.vivo && alvo.vida > eu.vida) ctx.status(eu, alvo, 'atordoado', 1.5);
    }),

  hab('smt:Arahabaki', 'Tetrakarn e Makarakarn', 70,
    `por ${seg(ARAHABAKI)} não perde vida e devolve todo dano que recebe pra quem atacou. Ao fim, provoca os inimigos ` +
    'em volta (1 casa) por 2 s.',
    (ctx, eu) => {
      const d = pe(eu, ARAHABAKI);
      ctx.visual('escudo', [eu], eu);
      ctx.status(eu, eu, 'invulneravel', d);
      ctx.status(eu, eu, 'refletir', d, 1);
      ctx.depois(d, () => {
        if (!eu.vivo) return;
        for (const x of naArea(ctx, eu, eu, 1, 'inimigos')) ctx.status(eu, x, 'provocado', 2);
      });
    }, 20),

  hab('smt:Mot', 'Bocarra da Morte', 80,
    `abre a boca do chão ao céu e engole o inimigo com menos vida a até 3 casas: ${pc(MOT)} do dano de ataque. Se isso ` +
    'matar, Mot cura 30% da vida máxima e recupera 50% da mana.',
    (ctx, eu, alvo0) => {
      const perto = naArea(ctx, eu, eu, 3, 'inimigos').filter(x => !x.temStatus('intocavel'));
      const alvo = perto.reduce<Lutador | null>((m, x) => (!m || fracVida(x) < fracVida(m) ? x : m), null)
        ?? alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      ctx.visual('trevas', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, MOT));
      if (!alvo.vivo) {
        curarH(ctx, eu, eu, eu.at.vida * 0.3);
        devolverMana(ctx, eu, eu.at.mana * 0.5);
      }
    }),

  hab("lol:Vel'Koz", 'Raio de Desintegração', 90,
    `canaliza por 2,5 s um raio em linha que segue o alvo: ${pc(VELKOZ)} do dano de ataque no total em todos no caminho. ` +
    'Esse dano ignora armadura e resistência mágica (Desconstrução).',
    comAlvo((ctx, eu, alvo) => {
      let atual = alvo;
      const porTique = pe(eu, VELKOZ) / 5;
      repetir(ctx, 5, 0.5, () => {
        if (!eu.vivo) return;
        if (!atual.vivo) {
          const novo = ctx.maisProximo(eu, 'inimigos');
          if (!novo) return;
          atual = novo;
        }
        const linha = semRepetir([atual, ...ctx.emLinha(eu, atual, 'inimigos')]);
        ctx.visual('feixe', linha, eu);
        for (const x of linha) bater(ctx, eu, x, porTique, { tipo: 'verdadeiro', critico: 'nunca' });
      });
    })),

  hab('deadlock:Baba', 'Bombardeio da Bruxa', 80,
    'lança 3 bombas de artilharia que caem em inimigos ao acaso numa área de 2 casas em volta do alvo, cada uma com ' +
    `${pc(BABA)} do dano de ataque. Onde cai fica uma poça de feitiço por 3 s, com lentidão de 25% em quem estiver nela.`,
    comAlvo((ctx, eu, alvo) => {
      const area = naArea(ctx, eu, alvo, 2, 'inimigos');
      for (let i = 0; i < 3; i++) {
        const [x] = ctx.sortear(area.filter(a => a.vivo), 1);
        if (!x) break;
        const poca = copiaCasa(x.casa);
        ctx.visual('explosao', [poca], eu);
        bater(ctx, eu, x, pe(eu, BABA));
        repetir(ctx, 3, 1, () => {
          for (const y of naArea(ctx, eu, poca, 0, 'inimigos')) ctx.status(eu, y, 'lento', 1.1, 0.25);
        });
      }
    })),

  hab('sujimon:Escapist', 'Rota de Fuga', 70,
    'joga uma bomba de fumaça e foge: os inimigos em volta (1 casa) ficam atordoados por 1 s, e o Escapist recua ' +
    `2 casas, fica 2 s sem poder ser alvo e cura ${pc(ESCAPIST_CURA)} da vida máxima.`,
    (ctx, eu) => {
      const perto = naArea(ctx, eu, eu, 1, 'inimigos');
      ctx.visual('vento', [eu, ...perto], eu);
      for (const x of perto) ctx.status(eu, x, 'atordoado', 1);
      const ameaca = ctx.maisProximo(eu, 'inimigos');
      if (ameaca) ctx.empurrar(eu, ameaca, 2);
      ctx.status(eu, eu, 'intocavel', 2);
      curarH(ctx, eu, eu, eu.at.vida * pe(eu, ESCAPIST_CURA));
    }),

  hab('sujimon:Twisted Mind', 'Surto', 60,
    `some e reaparece atrás do inimigo com menos vida, dando 3 facadas de ${pc(TWISTED)} do dano de ataque cada. ` +
    'O alvo fica paralisado de medo: atordoado por 1,5 s.',
    (ctx, eu, alvo0) => {
      const alvo = ctx.menosVida(eu, 'inimigos') ?? alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      const casa = ctx.casaLivreAoLado(alvo);
      if (casa && ctx.distancia(eu, alvo) > 1) ctx.mover(eu, casa);
      ctx.visual('golpe', [alvo], eu);
      for (let i = 0; i < 3; i++) bater(ctx, eu, alvo, pe(eu, TWISTED), { tipo: 'fisico' });
      if (alvo.vivo) ctx.status(eu, alvo, 'atordoado', 1.5);
    }),

  hab('sujimon:Baseball Diehard', 'Taco Fanático', 70,
    `dá 2 tacadas no alvo, cada uma com ${pc(DIEHARD)} do dano de ataque; a 2ª manda ele 1 casa pra trás.`,
    comAlvo((ctx, eu, alvo) => {
      ctx.visual('golpe', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, DIEHARD), { tipo: 'fisico' });
      bater(ctx, eu, alvo, pe(eu, DIEHARD), { tipo: 'fisico' });
      if (alvo.vivo) ctx.empurrar(alvo, eu, 1);
    })),

  hab('sujimon:Massacre Mascot', 'Home Run', 70,
    `gira o taco no alvo e manda ele voando 2 casas pra trás: ${pc(MASCOT)} do dano de ataque e atordoa por 1,5 s. ` +
    'Quem estiver em volta de onde ele cair (1 casa) leva metade do dano.',
    comAlvo((ctx, eu, alvo) => {
      ctx.visual('golpe', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, MASCOT), { tipo: 'fisico' });
      if (!alvo.vivo) return;
      ctx.status(eu, alvo, 'atordoado', 1.5);
      ctx.empurrar(alvo, eu, 2);
      const queda = naArea(ctx, eu, alvo, 1, 'inimigos').filter(x => x !== alvo);
      ctx.visual('explosao', [alvo, ...queda], eu);
      for (const x of queda) bater(ctx, eu, x, pe(eu, MASCOT) / 2, { tipo: 'fisico' });
    })),
];

// ---------------------------------------------------------------------------------------------------------------
// JoJo (Stands)
// ---------------------------------------------------------------------------------------------------------------

const BALL_BREAKER: PorEstrela = [1.35, 2, 3];
const CIVIL_WAR: PorEstrela = [2.2, 3.3, 5];
const D4C: PorEstrela = [2, 3, 4.5];
const HEY_YA: PorEstrela = [0.4, 0.6, 0.9];
const HEY_YA_DESVIO = 0.3;
const HEY_YA_TEMPO = 6;
const SCARY: PorEstrela = [1.6, 2.4, 3.6];
const THE_WORLD_SBR: PorEstrela = [1.6, 2.4, 3.6];
const THE_WORLD_SBR_TEMPO: PorEstrela = [1.5, 1.75, 2];
const TUBULAR: PorEstrela = [1.5, 2.25, 3.4];
export const TUSK: PorEstrela = [0.2, 0.29, 0.45];
const SILVER: PorEstrela = [0.4, 0.6, 0.9];
const STAR_TEMPO: PorEstrela = [1, 1.5, 2];
const STAR: PorEstrela = [2.5, 3.75, 5.6];
const STRENGTH_TEMPO: PorEstrela = [1.5, 2, 2.5];
const STRENGTH: PorEstrela = [1.5, 2.25, 3.4];
const HOLY: PorEstrela = [0.45, 0.65, 1];
const SOFT: PorEstrela = [0.6, 0.9, 1.35];
const WONDER: PorEstrela = [1.6, 2.4, 3.6];
const BOY: PorEstrela = [0.6, 0.75, 0.9];
const PEARL: PorEstrela = [0.22, 0.33, 0.5];
const BAD_COMPANY: PorEstrela = [0.5, 0.75, 1.1];
const CRAZY: PorEstrela = [1.8, 2.7, 4];
const CRAZY_CURA: PorEstrela = [0.25, 0.35, 0.5];
const HARVEST: PorEstrela = [0.4, 0.6, 0.9];
const RHCP: PorEstrela = [1.3, 1.95, 2.9];
const STRAY: PorEstrela = [1.4, 2.1, 3.1];
const THE_HAND: PorEstrela = [3.6, 5.4, 8.1];
const BABY: PorEstrela = [2.2, 3.3, 5];
const REQUIEM_SONO: PorEstrela = [1.5, 2, 2.5];
const GOLD: PorEstrela = [1.6, 2.4, 3.6];
const GER_TEMPO: PorEstrela = [3, 4, 5];
const GER: PorEstrela = [3, 4.5, 6.75];
const METALLICA: PorEstrela = [3.2, 4.8, 7.2];
const PRESIDENT: PorEstrela = [2, 3, 4];
const PISTOLS: PorEstrela = [0.55, 0.8, 1.2];
const TALKING: PorEstrela = [2, 2.5, 3];
const TALKING_ESCUDO = 0.12;
const CMOON: PorEstrela = [2, 3, 4.5];
const MIH: PorEstrela = [0.6, 0.9, 1.5];
const TWOH_TEMPO: PorEstrela = [2, 2.5, 3];
const TWOH: PorEstrela = [3, 4.5, 7];
const NOVEMBER: PorEstrela = [0.6, 0.9, 1.35];
const LIGHT_ROD: PorEstrela = [1.8, 2.7, 4];
const FOO: PorEstrela = [1.2, 1.8, 2.7];
const ECHOES: PorEstrela = [3, 4.5, 6.75];
const FOO_CURA: PorEstrela = [0.15, 0.22, 0.33];
const WHITESNAKE: PorEstrela = [1.5, 2.25, 3.4];
const WHITESNAKE_TEMPO: PorEstrela = [2, 3, 4];

/** Para o tempo: todos os inimigos atordoados por `d` s. */
function pararOTempo(ctx: Contexto, eu: Lutador, d: number, grito: string): void {
  const todos = inimigosVivos(ctx, eu);
  ctx.texto(eu, grito);
  ctx.visual('tempo', todos, eu);
  for (const x of todos) ctx.status(eu, x, 'atordoado', d);
}

const jojo: Habilidade[] = [
  hab('jojo:Ball Breaker', 'Rotação Dourada', 80,
    `arremessa a bola de aço; o Ball Breaker sai dela e envelhece o alvo: ${pc(BALL_BREAKER)} do dano de ataque, e por ` +
    '4 s ele causa 30% menos dano e ataca 30% mais devagar.',
    comAlvo((ctx, eu, alvo) => {
      ctx.visual('luz', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, BALL_BREAKER));
      if (!alvo.vivo) return;
      ctx.status(eu, alvo, 'fraco', 4, 0.3);
      ctx.status(eu, alvo, 'lento', 4, 0.3);
    })),

  hab('jojo:Civil War', 'Culpa', 80,
    `as coisas que o alvo abandonou no passado surgem e soterram ele: ${pc(CIVIL_WAR)} do dano de ataque e atordoa por ` +
    '1,5 s. Se o alvo já lançou a habilidade nesta luta, a culpa pesa o dobro: leva o dobro do dano.',
    comAlvo((ctx, eu, alvo) => {
      ctx.visual('trevas', [alvo], eu);
      const culpa = alvo.lancamentos > 0 ? 2 : 1;
      bater(ctx, eu, alvo, pe(eu, CIVIL_WAR) * culpa);
      if (alvo.vivo) ctx.status(eu, alvo, 'atordoado', 1.5);
    })),

  hab('jojo:Dirty Deeds Done Dirt Cheap', 'Entre Mundos', 80,
    `traz o alvo de um mundo paralelo; os dois se encostam e se desmancham: ${pc(D4C)} do dano de ataque e atordoa por ` +
    '1 s. Depois do 1º lançamento, uma vez por luta: se a unidade do Stand cair abaixo de 30% da vida, troca de lugar ' +
    'com a versão dela de outro mundo e volta com 60% da vida.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (alvo) {
        ctx.visual('trevas', [alvo], eu);
        bater(ctx, eu, alvo, pe(eu, D4C));
        if (alvo.vivo) ctx.status(eu, alvo, 'atordoado', 1);
      }
      if (eu.memoria.d4cVigia) return;
      eu.memoria.d4cVigia = 1;
      const u = usuarioDe(eu);
      ctx.aCada(0.2, 60, () => {
        if (eu.memoria.d4cUsou || !u.vivo || fracVida(u) >= 0.3) return;
        eu.memoria.d4cUsou = 1;
        ctx.visual('luz', [u], eu);
        ctx.texto(u, 'Outro mundo!');
        ctx.limparStatusRuins(u);
        ctx.definirFracaoVida(u, 0.6);
      });
    }),

  hab('jojo:Hey Ya!', 'Torcida', 60,
    `grita incentivo pra unidade do Stand. Por ${num(HEY_YA_TEMPO)} s ela ganha ${pc(HEY_YA)} de chance de crítico e ` +
    `desvia de ${pct(HEY_YA_DESVIO)} dos ataques, por pura sorte.`,
    (ctx, eu) => {
      const u = usuarioDe(eu);
      ctx.texto(u, 'Vai dar certo!');
      ctx.visual('luz', [u], eu);
      ctx.buff(u, 'critChance', pe(eu, HEY_YA), HEY_YA_TEMPO);
      ctx.buff(u, 'desvio', HEY_YA_DESVIO, HEY_YA_TEMPO);
    }),

  hab('jojo:Scary Monsters', 'Mordida Jurássica', 80,
    `a unidade do Stand vira dinossauro por 5 s (+30% de vida máxima e de dano de ataque) e morde o alvo: ${pc(SCARY)} ` +
    'do dano de ataque. Se o alvo morrer em até 4 s, a unidade do Stand devora o que sobrou e cura 20% da vida máxima.',
    (ctx, eu, alvo0) => {
      const u = usuarioDe(eu);
      ctx.visual('transformar', [u], eu);
      ctx.buff(u, 'vida', 0.3, 5);
      ctx.buff(u, 'dano', 0.3, 5);
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      ctx.visual('golpe', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, SCARY), { tipo: 'fisico' });
      let devorou = false;
      const devorar = () => {
        if (devorou || alvo.vivo || !u.vivo) return;
        devorou = true;
        curarH(ctx, eu, u, u.at.vida * 0.2);
      };
      devorar();
      ctx.aCada(0.25, 4, devorar);
    }),

  hab('jojo:The World (Steel Ball Run)', 'THE WORLD', 100,
    `para o tempo por ${seg(THE_WORLD_SBR_TEMPO)} (todos os inimigos atordoados). Com os sentidos de dinossauro que ` +
    `sobraram do Scary Monsters, atira facas no alvo e nos inimigos em volta (1 casa): ${pc(THE_WORLD_SBR)} do dano de ataque.`,
    (ctx, eu, alvo0) => {
      pararOTempo(ctx, eu, pe(eu, THE_WORLD_SBR_TEMPO), 'THE WORLD!');
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      const facas = naArea(ctx, eu, alvo, 1, 'inimigos');
      ctx.visual('golpe', facas, eu);
      for (const x of facas) bater(ctx, eu, x, pe(eu, THE_WORLD_SBR), { tipo: 'fisico' });
    }),

  hab('jojo:Tubular Bells', 'Bichos de Balão', 70,
    'transforma pregos em 3 bichinhos de balão que correm até inimigos ao acaso e estouram: ' +
    `${pc(TUBULAR)} do dano de ataque cada, e lentidão de 20% por 3 s.`,
    (ctx, eu) => {
      ctx.depois(0.5, () => {
        for (let i = 0; i < 3; i++) {
          const [x] = ctx.sortear(alvejaveis(ctx, eu), 1);
          if (!x) break;
          ctx.visual('explosao', [x], eu);
          bater(ctx, eu, x, pe(eu, TUBULAR));
          if (x.vivo) ctx.status(eu, x, 'lento', 3, 0.2);
        }
      });
    }),

  hab('jojo:Tusk', 'Unhas Giratórias', 80,
    `muda de Act a cada estrela. Estrela 1 (Act 1): dispara as 10 unhas giratórias no alvo, cada uma com ${pct(TUSK[0])} do dano de ` +
    `ataque. Estrela 2 (Act 2): ${pct(TUSK[1])} cada, e depois de 2 s o buraco da bala persegue o alvo e acerta de novo, com 150%. ` +
    `Estrela 3 (Act 4, Rotação Infinita): ${pct(TUSK[2])} cada, e o alvo perde 5% da vida máxima por segundo por 6 s, sem poder ser ` +
    'curado.',
    comAlvo((ctx, eu, alvo) => {
      ctx.visual('feixe', [alvo], eu);
      for (let i = 0; i < 10; i++) bater(ctx, eu, alvo, pe(eu, TUSK), { tipo: 'fisico' });
      if (eu.estrela === 2) {
        ctx.depois(2, () => {
          if (!alvo.vivo) return;
          ctx.visual('golpe', [alvo], eu);
          bater(ctx, eu, alvo, 1.5, { tipo: 'fisico' });
        });
      } else if (eu.estrela === 3 && alvo.vivo) {
        ctx.status(eu, alvo, 'semCura', 6);
        porSegundos(ctx, 6, () => baterFixo(ctx, eu, alvo, alvo.at.vida * 0.05, { tipo: 'verdadeiro', critico: 'nunca' }));
      }
    })),

  hab('jojo:Silver Chariot', 'Estocadas', 70,
    `dá 6 estocadas rápidas no alvo, cada uma com ${pc(SILVER)} do dano de ataque. Na 1ª vez que lança na luta, tira ` +
    'a armadura: perde 20% de armadura e ganha 50% de velocidade de ataque até o fim.',
    comAlvo((ctx, eu, alvo) => {
      ctx.visual('golpe', [alvo], eu);
      for (let i = 0; i < 6; i++) bater(ctx, eu, alvo, pe(eu, SILVER), { tipo: 'fisico' });
      if (eu.memoria.semArmadura) return;
      eu.memoria.semArmadura = 1;
      ctx.texto(eu, 'Sem armadura!');
      ctx.buff(eu, 'armadura', -0.2);
      ctx.buff(eu, 'velAtaque', 0.5);
    })),

  hab('jojo:Star Platinum', 'Star Platinum: The World', 100,
    `para o tempo por ${seg(STAR_TEMPO)} (todos os inimigos atordoados) e solta um ORA ORA no alvo: ${pc(STAR)} do dano ` +
    'de ataque.',
    (ctx, eu, alvo0) => {
      pararOTempo(ctx, eu, pe(eu, STAR_TEMPO), 'ORA ORA ORA!');
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      ctx.visual('golpe', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, STAR), { tipo: 'fisico' });
    }),

  hab('jojo:Strength', 'Navio do Orangotango', 80,
    'o casco do navio se fecha sobre os inimigos numa área de 2 casas em volta do alvo: ficam presos (atordoados) por ' +
    `${seg(STRENGTH_TEMPO)} e levam ${pc(STRENGTH)} do dano de ataque de canos e correntes.`,
    comAlvo((ctx, eu, alvo) => {
      const area = naArea(ctx, eu, alvo, 2, 'inimigos');
      ctx.visual('terra', [alvo, ...area], eu);
      for (const x of area) {
        ctx.status(eu, x, 'atordoado', pe(eu, STRENGTH_TEMPO));
        bater(ctx, eu, x, pe(eu, STRENGTH));
      }
    })),

  hab("jojo:Holy's Stand", 'Vinhas da Maldição', 70,
    'por 4 s, as vinhas fazem a unidade do Stand perder 2% da vida máxima por segundo (sem chegar a matar), mas ' +
    'espalham o mesmo mal em dobro nos inimigos a até 2 casas dela: eles perdem 4% da vida máxima por segundo e ' +
    `levam ${pc(HOLY)} do dano de ataque por segundo.`,
    (ctx, eu) => {
      const u = usuarioDe(eu);
      ctx.visual('veneno', [u], eu);
      porSegundos(ctx, 4, () => {
        if (!u.vivo) return;
        ctx.definirFracaoVida(u, Math.max(0.01, fracVida(u) - 0.02));
        const area = naArea(ctx, eu, u, 2, 'inimigos');
        ctx.visual('veneno', [u, ...area], eu);
        for (const x of area) {
          baterFixo(ctx, eu, x, x.at.vida * 0.04, { tipo: 'verdadeiro', critico: 'nunca' });
          bater(ctx, eu, x, pe(eu, HOLY), { critico: 'nunca' });
        }
      });
    }),

  hab('jojo:Soft & Wet', 'Bolhas Ladras', 70,
    `solta 3 bolhas no alvo, cada uma com ${pc(SOFT)} do dano de ataque. Cada bolha rouba uma coisa dele e passa pra ` +
    'unidade do Stand até o fim da luta: 10% da armadura, 10% da velocidade de ataque e 20% da mana.',
    comAlvo((ctx, eu, alvo) => {
      const u = usuarioDe(eu);
      ctx.visual('agua', [alvo, u], eu);
      for (let i = 0; i < 3; i++) {
        bater(ctx, eu, alvo, pe(eu, SOFT));
        if (!alvo.vivo) break;
        if (i === 0) { ctx.buff(alvo, 'armadura', -0.1); ctx.buff(u, 'armadura', 0.1); }
        if (i === 1) { ctx.buff(alvo, 'velAtaque', -0.1); ctx.buff(u, 'velAtaque', 0.1); }
        if (i === 2) ctx.mana(u, tirarMana(ctx, alvo, 0.2));
      }
    })),

  hab('jojo:Wonder of U', 'Calamidade', 90,
    'por 5 s, quem persegue sofre: cada inimigo que chegar ao alcance de ataque da unidade do Stand ou do Wonder of U ' +
    `leva ${pc(WONDER)} do dano de ataque de uma desgraça do nada (uma vez) e fica 2 s com lentidão de 30%.`,
    (ctx, eu) => {
      const u = usuarioDe(eu);
      const ja = new Set<Lutador>();
      ctx.visual('trevas', [u, eu], eu);
      repetir(ctx, 11, 0.5, () => {
        for (const x of inimigosVivos(ctx, eu)) {
          if (ja.has(x)) continue;
          const alcance = x.at.alcance;
          const persegue = (eu.vivo && ctx.distancia(x, eu) <= alcance) || (u.vivo && ctx.distancia(x, u) <= alcance);
          if (!persegue) continue;
          ja.add(x);
          ctx.visual('trevas', [x], eu);
          bater(ctx, eu, x, pe(eu, WONDER));
          if (x.vivo) ctx.status(eu, x, 'lento', 2, 0.3);
        }
      });
    }),

  hab('jojo:Boy II Man', 'Jokenpô', 60,
    `desafia o alvo e vence em ${pc(BOY)} das vezes. Cada vitória rouba toda a mana dele, que vai pra unidade do ` +
    'Stand, e ele fica 2 s sem ganhar mana. Na 3ª vitória contra o mesmo alvo, a habilidade dele é roubada: ele não ' +
    'ganha mais mana até o fim da luta.',
    comAlvo((ctx, eu, alvo) => {
      const u = usuarioDe(eu);
      if (!ctx.chance(pe(eu, BOY))) {
        ctx.texto(eu, 'Perdeu!');
        return;
      }
      const placar = vitoriasJokenpo.get(eu) ?? new Map<Lutador, number>();
      vitoriasJokenpo.set(eu, placar);
      const v = (placar.get(alvo) ?? 0) + 1;
      placar.set(alvo, v);
      ctx.texto(eu, v >= 3 ? 'Habilidade roubada!' : 'Venceu!');
      ctx.visual('trevas', [alvo, u], eu);
      ctx.mana(u, tirarMana(ctx, alvo, 1));
      ctx.status(eu, alvo, 'semMana', v >= 3 ? 999 : 2);
    })),

  hab('jojo:Pearl Jam', 'Antipasto', 70,
    'serve um prato pro aliado com menos vida e outro pra unidade do Stand. Os dois curam ' +
    `${pc(PEARL)} da vida máxima e se livram de queimadura, lentidão e outros efeitos ruins.`,
    (ctx, eu) => {
      const u = usuarioDe(eu);
      const outro = aliadoMaisFerido(ctx, eu, [eu]);
      for (const a of semRepetir(outro ? [u, outro] : [u])) {
        ctx.visual('cura', [a], eu);
        curarH(ctx, eu, a, a.at.vida * pe(eu, PEARL));
        if (a.vivo) ctx.limparStatusRuins(a);
      }
    }),

  hab('jojo:Bad Company', 'Batalhão', 80,
    'soldadinhos, tanques e um helicóptero Apache disparam 10 tiros divididos entre os inimigos numa área de 2 casas ' +
    `em volta do alvo, cada um com ${pc(BAD_COMPANY)} do dano de ataque.`,
    comAlvo((ctx, eu, alvo) => {
      const area = naArea(ctx, eu, alvo, 2, 'inimigos');
      ctx.visual('explosao', [alvo, ...area], eu);
      for (let i = 0; i < 10; i++) {
        const [x] = ctx.sortear(area.filter(a => a.vivo), 1);
        if (!x) break;
        bater(ctx, eu, x, pe(eu, BAD_COMPANY), { tipo: 'fisico' });
      }
    })),

  hab('jojo:Crazy Diamond', 'Dora Dora Dora', 70,
    `soca o alvo, ${pc(CRAZY)} do dano de ataque. Depois conserta o aliado com menos vida, curando ${pc(CRAZY_CURA)} da ` +
    'vida máxima dele. Como o Josuke, não pode curar a si mesmo: nem o Stand nem a unidade dele.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (alvo) {
        ctx.visual('golpe', [alvo], eu);
        bater(ctx, eu, alvo, pe(eu, CRAZY), { tipo: 'fisico' });
      }
      const a = aliadoMaisFerido(ctx, eu, [eu, usuarioDe(eu)]);
      if (!a) return;
      ctx.visual('cura', [a], eu);
      curarH(ctx, eu, a, a.at.vida * pe(eu, CRAZY_CURA));
    }),

  hab('jojo:Echoes', 'Ecos', 70,
    'muda de Act a cada estrela, e cada Act soma ao anterior. Estrela 1 (Act 1): gruda um som no alvo: ' +
    `${num(ECHOES[0] * 100)}% ` +
    `do dano de ataque, e ele perde 30% da mana. Estrela 2 (Act 2): ${num(ECHOES[1] * 100)}%, e o som explode e acerta ` +
    `também os inimigos em volta (1 casa). Estrela 3 (Act 3, 3 Freeze): ${num(ECHOES[2] * 100)}%, e o alvo fica ` +
    'pesadíssimo, com lentidão de 60% por 3 s.',
    comAlvo((ctx, eu, alvo) => {
      const fracao = pe(eu, ECHOES);
      const atingidos = eu.estrela >= 2 ? naArea(ctx, eu, alvo, 1, 'inimigos') : [alvo];
      ctx.visual('explosao', atingidos, eu);
      for (const x of atingidos) bater(ctx, eu, x, fracao);
      if (!alvo.vivo) return;
      tirarMana(ctx, alvo, 0.3);
      if (eu.estrela === 3) ctx.status(eu, alvo, 'lento', 3, 0.6);
    })),

  hab('jojo:Harvest', 'Enxame', 80,
    'centenas de Harvests picam os inimigos numa área de 2 casas em volta do alvo por 4 s: ' +
    `${pc(HARVEST)} do dano de ataque por segundo e lentidão de 20%.`,
    comAlvo((ctx, eu, alvo) => {
      const centro = copiaCasa(alvo.casa);
      repetir(ctx, 4, 1, () => {
        const area = naArea(ctx, eu, centro, 2, 'inimigos');
        ctx.visual('veneno', [centro, ...area], eu);
        for (const x of area) {
          bater(ctx, eu, x, pe(eu, HARVEST), { critico: 'nunca' });
          if (x.vivo) ctx.status(eu, x, 'lento', 1.1, 0.2);
        }
      });
    })),

  hab('jojo:Red Hot Chili Pepper', 'Fio Desencapado', 70,
    `vira eletricidade e salta entre 4 inimigos: ${pc(RHCP)} do dano de ataque e rouba 15% da mana de cada um. ` +
    'Cada vez que lança, fica 10% mais forte até o fim da luta.',
    comAlvo((ctx, eu, alvo) => {
      const vezes = eu.memoria.rhcp ?? 0;
      eu.memoria.rhcp = vezes + 1;
      const cadeia = corrente(ctx, eu, alvo, 3);
      ctx.visual('raio', cadeia, eu);
      let roubada = 0;
      for (const x of cadeia) {
        bater(ctx, eu, x, pe(eu, RHCP) * (1 + 0.1 * vezes));
        if (x.vivo) roubada += tirarMana(ctx, x, 0.15);
      }
      if (roubada > 0) devolverMana(ctx, eu, roubada);
    })),

  hab('jojo:Stray Cat', 'Bolhas de Ar', 80,
    `dispara 3 bolhas de ar invisíveis em inimigos ao acaso, cada uma com ${pc(STRAY)} do dano de ataque. Também ` +
    'envolve a unidade do Stand numa bolha: escudo de 20% da vida máxima por 4 s.',
    (ctx, eu) => {
      for (let i = 0; i < 3; i++) {
        const [x] = ctx.sortear(alvejaveis(ctx, eu), 1);
        if (!x) break;
        ctx.visual('vento', [x], eu);
        bater(ctx, eu, x, pe(eu, STRAY));
      }
      const u = usuarioDe(eu);
      ctx.visual('escudo', [u], eu);
      escudoH(ctx, eu, u, u.at.vida * 0.2, 4);
    }),

  hab('jojo:The Hand', 'Raspada', 70,
    'apaga o espaço e puxa o inimigo mais longe (até 4 casas) pra frente dele. Depois apaga um pedaço desse inimigo ' +
    `com a mão direita: ${pc(THE_HAND)} do dano de ataque, que ignora escudo e defesas.`,
    (ctx, eu, alvo0) => {
      const alvo = ctx.maisLonge(eu, 'inimigos', 4) ?? alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      if (ctx.distancia(eu, alvo) > 1) {
        const casa = ctx.casaLivreAoLado(eu);
        if (casa) ctx.mover(alvo, casa);
      }
      ctx.visual('trevas', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, THE_HAND), { ignoraDefesa: true });
    }),

  hab('jojo:Baby Face', 'Filho Desmontador', 70,
    `um Baby Face filho pula no alvo e desmonta ele em cubinhos: ${pc(BABY)} do dano de ataque, e ele fica atordoado ` +
    'por 1,5 s enquanto se monta de novo. O filho aprende: cada vez que lança, causa 10% a mais.',
    comAlvo((ctx, eu, alvo) => {
      const vezes = eu.memoria.babyFace ?? 0;
      eu.memoria.babyFace = vezes + 1;
      ctx.visual('explosao', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, BABY) * (1 + 0.1 * vezes));
      if (alvo.vivo) ctx.status(eu, alvo, 'atordoado', 1.5);
    })),

  hab('jojo:Chariot Requiem', 'Réquiem', 100,
    `todos os inimigos numa área de 2 casas em volta caem no sono, atordoados por ${seg(REQUIEM_SONO)}. Depois troca ` +
    'as almas: se a unidade do Stand estiver com menos % de vida que o inimigo com mais % de vida, os dois trocam de ' +
    '% de vida.',
    (ctx, eu) => {
      const area = naArea(ctx, eu, eu, 2, 'inimigos');
      ctx.visual('trevas', [eu, ...area], eu);
      for (const x of area) ctx.status(eu, x, 'atordoado', pe(eu, REQUIEM_SONO));
      const u = usuarioDe(eu);
      const outro = inimigosVivos(ctx, eu).reduce<Lutador | null>((m, x) => (!m || fracVida(x) > fracVida(m) ? x : m), null);
      if (!outro || !u.vivo) return;
      const fu = fracVida(u), fo = fracVida(outro);
      if (fu >= fo) return;
      ctx.visual('luz', [u, outro], eu);
      ctx.texto(u, 'Troca de almas!');
      ctx.definirFracaoVida(u, fo);
      ctx.definirFracaoVida(outro, Math.max(0.01, fu));
    }),

  hab('jojo:Gold Experience', 'MUDA MUDA', 70,
    `soca o alvo, ${pc(GOLD)} do dano de ataque, e acelera os sentidos dele: por 3 s ele vive em câmera lenta ` +
    '(lentidão de 40%). Também transforma uma pedra num sapo do lado da unidade do Stand: por 2 s, todo dano que ela ' +
    'receber volta pra quem atacou.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (alvo) {
        ctx.visual('golpe', [alvo], eu);
        bater(ctx, eu, alvo, pe(eu, GOLD), { tipo: 'fisico' });
        if (alvo.vivo) ctx.status(eu, alvo, 'lento', 3, 0.4);
      }
      const u = usuarioDe(eu);
      ctx.visual('escudo', [u], eu);
      ctx.status(eu, u, 'refletir', 2, 1);
    }),

  hab('jojo:Gold Experience Requiem', 'Retorno a Zero', 90,
    `zera tudo o que o alvo faz por ${seg(GER_TEMPO)}: ele perde a mana, os ataques dele não causam dano e ele não ` +
    `ganha mana. Ao fim, MUDA MUDA: ${pc(GER)} do dano de ataque.`,
    comAlvo((ctx, eu, alvo) => {
      const d = pe(eu, GER_TEMPO);
      ctx.visual('luz', [alvo], eu);
      tirarMana(ctx, alvo, 1);
      ctx.status(eu, alvo, 'fraco', d, 1);
      ctx.status(eu, alvo, 'semMana', d);
      ctx.depois(d, () => {
        if (!alvo.vivo) return;
        ctx.texto(eu, 'MUDA MUDA!');
        ctx.visual('golpe', [alvo], eu);
        bater(ctx, eu, alvo, pe(eu, GER), { tipo: 'fisico' });
      });
    })),

  hab('jojo:Metallica', 'Navalhas no Sangue', 80,
    'puxa o ferro do sangue dos inimigos numa área de 2 casas em volta e faz navalhas brotarem de dentro deles: ' +
    `${pc(METALLICA)} do dano de ataque, e lentidão de 30% por 3 s (falta de ferro). A unidade do Stand se cobre de ` +
    'ferro e fica 1,5 s sem poder ser alvo.',
    (ctx, eu) => {
      const area = naArea(ctx, eu, eu, 2, 'inimigos');
      ctx.visual('golpe', area, eu);
      for (const x of area) {
        bater(ctx, eu, x, pe(eu, METALLICA));
        if (x.vivo) ctx.status(eu, x, 'lento', 3, 0.3);
      }
      const u = usuarioDe(eu);
      ctx.status(eu, u, 'intocavel', 1.5);
    }),

  hab('jojo:Mr.President', 'Quarto da Tartaruga', 80,
    `guarda dentro do casco o aliado com menos vida e a unidade do Stand por ${seg(PRESIDENT)}: não podem ser alvo e ` +
    'curam 10% da vida máxima por segundo. O fantasma do Polnareff mora lá: quem sai ganha 30% de velocidade de ataque ' +
    'por 4 s.',
    (ctx, eu) => {
      const d = pe(eu, PRESIDENT);
      const u = usuarioDe(eu);
      const outro = aliadoMaisFerido(ctx, eu, [eu]);
      const guardados = semRepetir(outro ? [u, outro] : [u]);
      ctx.visual('escudo', guardados, eu);
      for (const a of guardados) ctx.status(eu, a, 'intocavel', d);
      porSegundos(ctx, Math.round(d), () => {
        for (const a of guardados) curarH(ctx, eu, a, a.at.vida * 0.1);
      });
      ctx.depois(d, () => {
        for (const a of guardados) if (a.vivo) ctx.buff(a, 'velAtaque', 0.3, 4);
      });
    }),

  hab('jojo:Sex Pistols', 'Chutem as Balas', 70,
    'dispara 6 tiros, e os Pistols chutam cada bala pro inimigo com menos vida: ' +
    `${pc(PISTOLS)} do dano de ataque cada. O 4º tiro dá azar e não sai, mas o 5º e o 6º são crítico garantido.`,
    (ctx, eu) => {
      for (let i = 1; i <= 6; i++) {
        if (i === 4) { ctx.texto(eu, 'Azar!'); continue; }
        const x = ctx.menosVida(eu, 'inimigos');
        if (!x) break;
        ctx.visual('golpe', [x], eu);
        bater(ctx, eu, x, pe(eu, PISTOLS), { tipo: 'fisico', critico: i >= 5 ? 'sempre' : 'pode' });
      }
    }),

  hab('jojo:Talking Head', 'Língua Mentirosa', 60,
    `gruda a língua nos inimigos em volta (1 casa), provoca por ${seg(TALKING)} e ganha escudo de ${pct(TALKING_ESCUDO)} da ` +
    'vida máxima. ' +
    'Enquanto dura, a língua mente pra eles: não recebem cura.',
    (ctx, eu) => {
      const d = pe(eu, TALKING);
      const perto = naArea(ctx, eu, eu, 1, 'inimigos');
      ctx.visual('charme', [eu, ...perto], eu);
      for (const x of perto) {
        ctx.status(eu, x, 'provocado', d);
        ctx.status(eu, x, 'semCura', d);
      }
      escudoH(ctx, eu, eu, eu.at.vida * TALKING_ESCUDO, d);
    }),

  hab('jojo:C-MOON', 'Gravidade ao Contrário', 80,
    `soca o alvo e vira ele do avesso: ${pc(CMOON)} do dano de ataque, ele perde 50% da mana e fica atordoado por 1 s. ` +
    'A gravidade inverte em volta: os inimigos a até 2 casas da unidade do Stand são empurrados 1 casa pra longe.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (alvo) {
        ctx.visual('golpe', [alvo], eu);
        bater(ctx, eu, alvo, pe(eu, CMOON), { tipo: 'fisico' });
        if (alvo.vivo) {
          tirarMana(ctx, alvo, 0.5);
          ctx.status(eu, alvo, 'atordoado', 1);
        }
      }
      const u = usuarioDe(eu);
      const perto = naArea(ctx, eu, u, 2, 'inimigos');
      ctx.visual('vento', [u, ...perto], eu);
      for (const x of perto) ctx.empurrar(x, u, 1);
    }),

  hab('jojo:Made in Heaven', 'Tempo Acelerado', 100,
    `acelera o tempo por 4 s. O Stand e a unidade dele ganham ${pc(MIH)} de velocidade de ataque; os inimigos ficam ` +
    'com lentidão de 30% e não ganham mana (o tempo passa rápido demais pra eles).',
    (ctx, eu) => {
      const u = usuarioDe(eu);
      const inimigos = inimigosVivos(ctx, eu);
      ctx.texto(eu, 'Made in Heaven!');
      ctx.visual('tempo', [eu, u, ...inimigos], eu);
      for (const a of semRepetir([eu, u])) ctx.buff(a, 'velAtaque', pe(eu, MIH), 4);
      for (const x of inimigos) {
        ctx.status(eu, x, 'lento', 4, 0.3);
        ctx.status(eu, x, 'semMana', 4);
      }
    }),

  hab('jojo:The World Over Heaven', 'Sobrescrever a Realidade', 110,
    `para o tempo por ${seg(TWOH_TEMPO)} (todos os inimigos atordoados) e soca o alvo: ${pc(TWOH)} do dano de ataque, ` +
    'atravessando escudo e defesas. Se o alvo ficar abaixo de 20% da vida, a realidade é reescrita: ele morre.',
    (ctx, eu, alvo0) => {
      pararOTempo(ctx, eu, pe(eu, TWOH_TEMPO), 'THE WORLD!');
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      ctx.visual('luz', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, TWOH), { ignoraDefesa: true });
      if (alvo.vivo && fracVida(alvo) < 0.2) ctx.matar(eu, alvo);
    }),

  hab('jojo:November Rain', 'Chuva Pesada', 80,
    'faz chover gotas pesadíssimas numa área de 2 casas em volta do alvo por 3 s: ' +
    `${pc(NOVEMBER)} do dano de ataque por segundo e lentidão de 30%.`,
    comAlvo((ctx, eu, alvo) => {
      const centro = copiaCasa(alvo.casa);
      repetir(ctx, 3, 1, () => {
        const area = naArea(ctx, eu, centro, 2, 'inimigos');
        ctx.visual('agua', [centro, ...area], eu);
        for (const x of area) {
          bater(ctx, eu, x, pe(eu, NOVEMBER), { critico: 'nunca' });
          if (x.vivo) ctx.status(eu, x, 'lento', 1.1, 0.3);
        }
      });
    })),

  hab('jojo:Light Rod Stand', 'Bastões de Luz', 80,
    'crava bastões de luz em 3 inimigos ao acaso. Depois de 1 s eles explodem em feixes em linha, do Stand até a ' +
    `borda: ${pc(LIGHT_ROD)} do dano de ataque em quem estiver no caminho, e os atingidos ficam 2 s com lentidão de ` +
    '30% (ofuscados).',
    (ctx, eu) => {
      const marcados = ctx.sortear(alvejaveis(ctx, eu), 3);
      ctx.visual('luz', marcados, eu);
      ctx.depois(1, () => {
        if (!eu.vivo) return;
        for (const m of marcados) {
          const linha = semRepetir([...(m.vivo ? [m] : []), ...ctx.emLinha(eu, m.casa, 'inimigos')]);
          ctx.visual('feixe', linha.length ? linha : [m.casa], eu);
          for (const x of linha) {
            bater(ctx, eu, x, pe(eu, LIGHT_ROD));
            if (x.vivo) ctx.status(eu, x, 'lento', 2, 0.3);
          }
        }
      });
    }),

  hab('jojo:Foo Fighters (Stand)', 'Rajada de Plâncton', 70,
    `dispara 3 balas de plâncton no alvo, cada uma com ${pc(FOO)} do dano de ataque. Depois tapa as feridas da unidade ` +
    `do Stand com plâncton: cura ${pc(FOO_CURA)} da vida máxima dela.`,
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (alvo) {
        ctx.visual('agua', [alvo], eu);
        for (let i = 0; i < 3; i++) bater(ctx, eu, alvo, pe(eu, FOO), { tipo: 'fisico' });
      }
      const u = usuarioDe(eu);
      ctx.visual('cura', [u], eu);
      curarH(ctx, eu, u, u.at.vida * pe(eu, FOO_CURA));
    }),

  hab('jojo:Whitesnake', 'Roubar Disco', 80,
    `arranca o disco do alvo: ${pc(WHITESNAKE)} do dano de ataque, ele perde toda a mana e não ganha mana por ` +
    `${seg(WHITESNAKE_TEMPO)}.`,
    comAlvo((ctx, eu, alvo) => {
      ctx.visual('trevas', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, WHITESNAKE));
      if (!alvo.vivo) return;
      tirarMana(ctx, alvo, 1);
      ctx.status(eu, alvo, 'semMana', pe(eu, WHITESNAKE_TEMPO));
    })),
];

/** Habilidades próprias, pela chave da forma (`FormaDados.habilidade`). */
export const HABILIDADES_PROPRIAS: Record<string, Habilidade> = Object.fromEntries(
  [...pokemonEDigimon, ...outros, ...jojo].map(h => [h.id, h]),
);

