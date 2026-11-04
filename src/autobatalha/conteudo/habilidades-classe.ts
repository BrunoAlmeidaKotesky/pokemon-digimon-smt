// Ult de cada classe e elemento (docs/tft/base/habilidades.json, "classes"). Valores "a/b/c" = estrela 1/2/3.
// A forma sem habilidade própria nem transformação lança a ult de uma das suas classes (o jogador escolhe).
import type { Contexto, Habilidade, Lutador, PorEstrela } from '../tipos';
import {
  alvejaveis, alvoDe, bater, copiaCasa, corrente, curarH, devolverMana, escudoH, fracVida, naArea, pc, pe, poder, repetir,
  semRepetir, seg,
} from './util';

type Lancar = (ctx: Contexto, eu: Lutador, alvo: Lutador | null) => void;

function ult(id: string, nome: string, mana: number, texto: string, lancar: Lancar, manaInicial?: number): Habilidade {
  return { id, nome, mana, texto: `${nome}: ${texto}`, lancar, ...(manaInicial != null ? { manaInicial } : {}) };
}

const DEMONIACOS: PorEstrela = [2, 3, 4.5];
const BIZARRA_GOSMA: PorEstrela = [1.8, 2.7, 4];
const BIZARRA_CURA: PorEstrela = [0.25, 0.35, 0.5];
const FADINHAS: PorEstrela = [0.2, 0.3, 0.45];
const SAFADA: PorEstrela = [1.5, 2.25, 3.4];
const ATIRADOR: PorEstrela = [2.2, 3.3, 5];
const ANJO_DANO: PorEstrela = [1.6, 2.4, 3.6];
const ANJO_CURA: PorEstrela = [0.15, 0.2, 0.3];
const ROBO: PorEstrela = [1, 1.5, 2.25];
const DRAGAO: PorEstrela = [2, 3, 4.5];
const TEMPORAIS: PorEstrela = [1.5, 2, 2.5];
const TANQUE: PorEstrela = [0.3, 0.45, 0.7];
const PORRADEIRO: PorEstrela = [1.8, 2.7, 4];
const ASSASSINO: PorEstrela = [2.5, 3.75, 5.6];
const FOGO: PorEstrela = [1.7, 2.55, 3.8];
const AGUA: PorEstrela = [1.6, 2.4, 3.6];
const TERRA: PorEstrela = [1.4, 2.1, 3.2];
const VENTO: PorEstrela = [1.5, 2.25, 3.4];
const RAIO: PorEstrela = [1.3, 1.95, 2.9];
const GELO: PorEstrela = [1.8, 2.7, 4];
const PLANTA: PorEstrela = [1.4, 2.1, 3.2];

export const GOLPE_DANO: PorEstrela = [2, 3, 4.5];

/** Ult de quem não tem nenhuma classe com ult (só Únicos sem habilidade própria). */
export const GOLPE: Habilidade = ult('golpe', 'Golpe', 70,
  `acerta o alvo com tudo: ${pc(GOLPE_DANO)} do dano de ataque.`,
  (ctx, eu, alvo0) => {
    const alvo = alvoDe(ctx, eu, alvo0);
    if (!alvo) return;
    ctx.visual('golpe', [alvo], eu);
    bater(ctx, eu, alvo, pe(eu, GOLPE_DANO));
  });

const lista: Habilidade[] = [
  ult('demoniacos', 'Pacto Sombrio', 80,
    `gasta 10% da própria vida e lança chamas negras no alvo e nos inimigos em volta (1 casa): ${pc(DEMONIACOS)} do dano de ` +
    'ataque. Ganha 15% de roubo de vida até o fim da luta, e isso acumula a cada vez.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      ctx.definirFracaoVida(eu, Math.max(0.01, fracVida(eu) - 0.1));
      const atingidos = naArea(ctx, eu, alvo, 1, 'inimigos');
      ctx.visual('trevas', atingidos, eu);
      for (const x of atingidos) bater(ctx, eu, x, pe(eu, DEMONIACOS));
      ctx.buff(eu, 'rouboVida', 0.15);
    }),

  ult('criaturinha-bizarra', 'Coisa Esquisita', 70,
    `faz uma de três coisas, ao acaso: cospe gosma no alvo (${pc(BIZARRA_GOSMA)} do dano de ataque e lentidão de 30% por 3 s), ` +
    `se cura em ${pc(BIZARRA_CURA)} da vida máxima ou dá um berro que atordoa os inimigos em volta (1 casa) por 1,5 s.`,
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      const r = ctx.aleatorio();
      if (r < 1 / 3 && alvo) {
        ctx.visual('veneno', [alvo], eu);
        bater(ctx, eu, alvo, pe(eu, BIZARRA_GOSMA));
        if (alvo.vivo) ctx.status(eu, alvo, 'lento', 3, 0.3);
      } else if (r < 2 / 3 || !alvo) {
        ctx.visual('cura', [eu], eu);
        curarH(ctx, eu, eu, eu.at.vida * pe(eu, BIZARRA_CURA));
      } else {
        const perto = naArea(ctx, eu, eu, 1, 'inimigos');
        ctx.visual('sopro', [eu, ...perto], eu);
        for (const x of perto) ctx.status(eu, x, 'atordoado', 1.5);
      }
    }),

  ult('fadinhas', 'Pó de Fada', 70,
    `cura o aliado com menos vida em ${pc(FADINHAS)} da vida máxima dele e dá a ele escudo de 15% da vida máxima por 4 s.`,
    (ctx, eu) => {
      const a = ctx.menosVida(eu, 'aliados', true) ?? eu;
      ctx.visual('cura', [a], eu);
      curarH(ctx, eu, a, a.at.vida * pe(eu, FADINHAS));
      escudoH(ctx, eu, a, a.at.vida * 0.15, 4);
    }),

  ult('safada', 'Charme', 70,
    `manda um beijo no inimigo mais próximo: ${pc(SAFADA)} do dano de ataque. Ele fica encantado por 2 s, sem agir ` +
    '(vale como atordoar).',
    (ctx, eu, alvo0) => {
      const alvo = ctx.maisProximo(eu, 'inimigos') ?? alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      ctx.visual('charme', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, SAFADA));
      if (alvo.vivo) ctx.status(eu, alvo, 'atordoado', 2);
    }),

  ult('atirador', 'Tiro Perfurante', 80,
    `dispara um tiro em linha que atravessa todos os inimigos no caminho: ${pc(ATIRADOR)} do dano de ataque. ` +
    'Esse tiro sempre dá crítico.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      const linha = semRepetir([alvo, ...ctx.emLinha(eu, alvo, 'inimigos')]);
      ctx.visual('feixe', linha, eu);
      for (const x of linha) bater(ctx, eu, x, pe(eu, ATIRADOR), { critico: 'sempre' });
    }),

  ult('anjo', 'Luz Divina', 80,
    `desce uma coluna de luz numa área de 2 casas em volta do alvo. Inimigos ali levam ${pc(ANJO_DANO)} do dano de ataque; ` +
    `aliados ali curam ${pc(ANJO_CURA)} da vida máxima.`,
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      const centro = copiaCasa(alvo.casa);
      const inimigos = naArea(ctx, eu, centro, 2, 'inimigos');
      const aliados = naArea(ctx, eu, centro, 2, 'aliados');
      ctx.visual('luz', [centro, ...inimigos, ...aliados], eu);
      for (const x of inimigos) bater(ctx, eu, x, pe(eu, ANJO_DANO));
      for (const a of aliados) curarH(ctx, eu, a, a.at.vida * pe(eu, ANJO_CURA));
    }),

  ult('robo', 'Bateria de Mísseis', 70,
    `dispara 4 mísseis em inimigos ao acaso, cada um com ${pc(ROBO)} do dano de ataque. Depois liga a blindagem: escudo ` +
    'de 20% da vida máxima por 4 s.',
    (ctx, eu) => {
      for (let i = 0; i < 4; i++) {
        const [x] = ctx.sortear(alvejaveis(ctx, eu), 1);
        if (!x) break;
        ctx.visual('explosao', [x], eu);
        bater(ctx, eu, x, pe(eu, ROBO));
      }
      ctx.visual('escudo', [eu], eu);
      escudoH(ctx, eu, eu, eu.at.vida * 0.2, 4);
    }),

  ult('dragao', 'Sopro de Dragão', 80,
    `cospe um sopro em leque que acerta uma área de 3 casas à frente, na direção do alvo: ${pc(DRAGAO)} do dano de ataque. ` +
    'Quem for atingido fica vulnerável: leva 20% a mais de dano por 4 s.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      const leque = ctx.emCone(eu, alvo, 3, 'inimigos');
      const atingidos = semRepetir(ctx.distancia(eu, alvo) <= 3 ? [alvo, ...leque] : leque);
      ctx.visual('sopro', atingidos.length ? atingidos : [alvo], eu);
      for (const x of atingidos) {
        bater(ctx, eu, x, pe(eu, DRAGAO));
        if (x.vivo) ctx.status(eu, x, 'vulneravel', 4, 0.2);
      }
    }),

  ult('temporais', 'Parar o Tempo', 90,
    `para o tempo numa área de 2 casas em volta do alvo. Os inimigos ali ficam atordoados por ${seg(TEMPORAIS)} e levam ` +
    '20% a mais de dano enquanto isso.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      const d = pe(eu, TEMPORAIS);
      const area = naArea(ctx, eu, alvo, 2, 'inimigos');
      ctx.visual('tempo', [alvo, ...area], eu);
      for (const x of area) {
        ctx.status(eu, x, 'atordoado', d);
        ctx.status(eu, x, 'vulneravel', d, 0.2);
      }
    }),

  ult('tanque', 'Muralha', 60,
    `ganha escudo de ${pc(TANQUE)} da vida máxima por 4 s e provoca os inimigos em volta (1 casa) por 2 s.`,
    (ctx, eu) => {
      ctx.visual('escudo', [eu], eu);
      escudoH(ctx, eu, eu, eu.at.vida * pe(eu, TANQUE), 4);
      for (const x of naArea(ctx, eu, eu, 1, 'inimigos')) ctx.status(eu, x, 'provocado', 2);
    }, 20),

  ult('porradeiro', 'Pancadão', 70,
    `soca o alvo, causando ${pc(PORRADEIRO)} do dano de ataque mais 8% da própria vida máxima, e atordoa por 1 s. ` +
    'Abaixo de metade da vida, o soco tem 30% de roubo de vida.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      ctx.visual('golpe', [alvo], eu);
      const p = poder(eu);
      const d = ctx.dano(eu, alvo, pe(eu, PORRADEIRO) * p, { extra: eu.at.vida * 0.08 * p });
      if (alvo.vivo) ctx.status(eu, alvo, 'atordoado', 1);
      if (fracVida(eu) < 0.5 && d > 0) ctx.curar(eu, eu, d * 0.3);
    }),

  ult('assassino', 'Golpe Fatal', 60,
    `salta no inimigo com menos vida e golpeia: ${pc(ASSASSINO)} do dano de ataque, que pode dar crítico. ` +
    'Se matar, recupera 50% da mana.',
    (ctx, eu, alvo0) => {
      const alvo = ctx.menosVida(eu, 'inimigos') ?? alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      const casa = ctx.casaLivreAoLado(alvo);
      if (casa && ctx.distancia(eu, alvo) > 1) ctx.mover(eu, casa);
      ctx.visual('golpe', [alvo], eu);
      bater(ctx, eu, alvo, pe(eu, ASSASSINO), { critico: 'pode' });
      if (!alvo.vivo) devolverMana(ctx, eu, eu.at.mana * 0.5);
    }),

  ult('fogo', 'Bola de Fogo', 80,
    `lança uma bola de fogo que explode no alvo e nos inimigos em volta (1 casa): ${pc(FOGO)} do dano de ataque. ` +
    'Todos ficam queimando por 4 s: perdem 2% da vida máxima por segundo e recebem 33% menos cura.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      const atingidos = naArea(ctx, eu, alvo, 1, 'inimigos');
      ctx.visual('fogo', [alvo, ...atingidos], eu);
      for (const x of atingidos) {
        bater(ctx, eu, x, pe(eu, FOGO));
        if (x.vivo) ctx.status(eu, x, 'queimando', 4, 0.02);
      }
    }),

  ult('agua', "Jato d'Água", 80,
    `dispara um jato em linha: ${pc(AGUA)} do dano de ataque nos inimigos no caminho. Depois cura 15% da própria vida ` +
    'máxima e se livra de queimadura, lentidão e outros efeitos ruins.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (alvo) {
        const linha = semRepetir([alvo, ...ctx.emLinha(eu, alvo, 'inimigos')]);
        ctx.visual('agua', linha, eu);
        for (const x of linha) bater(ctx, eu, x, pe(eu, AGUA));
      }
      curarH(ctx, eu, eu, eu.at.vida * 0.15);
      ctx.limparStatusRuins(eu);
    }),

  ult('terra', 'Terremoto', 80,
    `bate no chão. Os inimigos numa área de 2 casas em volta levam ${pc(TERRA)} do dano de ataque e ficam atordoados ` +
    'por 1 s; quem lançou ganha 30% de armadura por 4 s.',
    (ctx, eu) => {
      const area = naArea(ctx, eu, eu, 2, 'inimigos');
      ctx.visual('terra', [eu, ...area], eu);
      for (const x of area) {
        bater(ctx, eu, x, pe(eu, TERRA));
        if (x.vivo) ctx.status(eu, x, 'atordoado', 1);
      }
      ctx.buff(eu, 'armadura', 0.3, 4);
    }),

  ult('vento', 'Tornado', 80,
    `solta um tornado em linha que causa ${pc(VENTO)} do dano de ataque e empurra os inimigos 1 casa pra trás. ` +
    'Depois ganha 40% de velocidade de ataque por 3 s.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (alvo) {
        const linha = semRepetir([alvo, ...ctx.emLinha(eu, alvo, 'inimigos')]);
        ctx.visual('vento', linha, eu);
        for (const x of linha) {
          bater(ctx, eu, x, pe(eu, VENTO));
          if (x.vivo) ctx.empurrar(x, eu, 1);
        }
      }
      ctx.buff(eu, 'velAtaque', 0.4, 3);
    }),

  ult('raio', 'Corrente Elétrica', 80,
    `lança um raio no alvo que pula pra mais 3 inimigos. Cada um leva ${pc(RAIO)} do dano de ataque e fica atordoado ` +
    'por 0,5 s.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      const cadeia = corrente(ctx, eu, alvo, 3);
      ctx.visual('raio', cadeia, eu);
      for (const x of cadeia) {
        bater(ctx, eu, x, pe(eu, RAIO));
        if (x.vivo) ctx.status(eu, x, 'atordoado', 0.5);
      }
    }),

  ult('gelo', 'Nevasca', 80,
    `cai uma nevasca numa área de 2 casas em volta do alvo por 3 s: ${pc(GELO)} do dano de ataque no total e lentidão ` +
    'de 30% em quem está dentro. Quem ficar os 3 s inteiros congela: atordoado por 1,5 s.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      const centro = copiaCasa(alvo.casa);
      const vezes = new Map<Lutador, number>();
      const porTique = pe(eu, GELO) / 3;
      repetir(ctx, 3, 1, i => {
        const dentro = naArea(ctx, eu, centro, 2, 'inimigos');
        ctx.visual('gelo', [centro, ...dentro], eu);
        for (const x of dentro) {
          bater(ctx, eu, x, porTique);
          if (!x.vivo) continue;
          ctx.status(eu, x, 'lento', 1.1, 0.3);
          const n = (vezes.get(x) ?? 0) + 1;
          vezes.set(x, n);
          if (i === 2 && n === 3) ctx.status(eu, x, 'atordoado', 1.5);
        }
      });
    }),

  ult('planta', 'Raízes', 80,
    `prendem o alvo e os inimigos em volta (1 casa) por 1,5 s (atordoados) e sugam ${pc(PLANTA)} do dano de ataque ` +
    'deles. Quem lançou cura o mesmo tanto.',
    (ctx, eu, alvo0) => {
      const alvo = alvoDe(ctx, eu, alvo0);
      if (!alvo) return;
      const presos = naArea(ctx, eu, alvo, 1, 'inimigos');
      ctx.visual('terra', [alvo, ...presos], eu);
      let total = 0;
      for (const x of presos) {
        ctx.status(eu, x, 'atordoado', 1.5);
        total += bater(ctx, eu, x, pe(eu, PLANTA));
      }
      if (total > 0) ctx.curar(eu, eu, total);
    }),
];

/** Ult de cada classe e elemento, pelo id da classe. "unicos" não tem. */
export const HABILIDADES_CLASSE: Record<string, Habilidade> = Object.fromEntries(lista.map(h => [h.id, h]));
