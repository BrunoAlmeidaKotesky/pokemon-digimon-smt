// Itens: Bakugan. 7 componentes (os atributos) e 28 completos (2 componentes; receitas de
// docs/tft/base/receitas-bakugan.json). O completo soma os dois componentes ×1,5 (arredondado pra número inteiro de
// % ou de pontos) e ganha um efeito próprio com a cara do Bakugan.
import { COMPONENTES, type Componente, type Contexto, type Item, type Lutador, type NomeAtributo } from '../tipos';
import { LUTA_TODA, fracVida, naArea, num } from './util';

type Bonus = Partial<Record<NomeAtributo, number>>;
type Efeito = Omit<Item, 'id' | 'nome' | 'bakugan' | 'componentes' | 'texto' | 'atributos'> & { texto: string; atributos?: Bonus };

export const MULT_COMPLETO = 1.5;
/** Escudo do Haos no começo da luta (fração da vida), por componente. */
export const ESCUDO_HAOS = 0.1;

const NOMES: Record<Componente, string> = {
  pyrus: 'Pyrus', aquos: 'Aquos', haos: 'Haos', darkus: 'Darkus', subterra: 'Subterra', ventus: 'Ventus', aurelus: 'Aurelus',
};
// Rebalanceados no playtest de 04/11/2026 (docs/tft/matematica/equilibrio.md): dano, vida e vel. ataque valiam o
// dobro dos outros.
const BONUS: Record<Componente, Bonus> = {
  pyrus: { dano: 0.12 },
  aquos: { manaInicial: 20 },
  haos: { resist: 0.25 },
  darkus: { rouboVida: 0.12 },
  subterra: { armadura: 0.35 },
  ventus: { velAtaque: 0.1 },
  aurelus: { vida: 0.12 },
};

/** Receitas (a ordem de cada par segue COMPONENTES): par → nome do Bakugan em SetDados.bakugan. */
export const RECEITAS: [Componente, Componente, string][] = [
  ['pyrus', 'pyrus', 'Drago'], ['aquos', 'aquos', 'Preyas'], ['haos', 'haos', 'Tigrerra'],
  ['darkus', 'darkus', 'Hydranoid (Generation 1)'], ['subterra', 'subterra', 'Gorem'], ['ventus', 'ventus', 'Skyress'],
  ['aurelus', 'aurelus', 'Nobilious'],
  ['pyrus', 'aquos', 'Siege'], ['pyrus', 'haos', 'Griffon'], ['pyrus', 'darkus', 'Fear Ripper'],
  ['pyrus', 'subterra', 'Saurus'], ['pyrus', 'ventus', 'Falconeer'], ['pyrus', 'aurelus', 'Pyravian'],
  ['aquos', 'haos', 'Jelldon'], ['aquos', 'darkus', 'Limulus'], ['aquos', 'subterra', 'Serpenoid'],
  ['aquos', 'ventus', 'Tayghen'], ['aquos', 'aurelus', 'Hydorous X Aurelus'],
  ['haos', 'darkus', 'Hammersaur'], ['haos', 'subterra', 'Hynoid'], ['haos', 'ventus', 'Monarus'],
  ['haos', 'aurelus', 'Pegatrix X Aurelus'],
  ['darkus', 'subterra', 'Wormquake'], ['darkus', 'ventus', 'Gargonoid'], ['darkus', 'aurelus', 'Dragonoid X Darkus'],
  ['subterra', 'ventus', 'El Condor'], ['subterra', 'aurelus', 'Goreene'],
  ['ventus', 'aurelus', 'Howlkor X Aurelus'],
];

export function ehComponente(id: string): id is Componente {
  return (COMPONENTES as readonly string[]).includes(id);
}

/** Id do completo feito com dois componentes (`${a}+${b}` na ordem de COMPONENTES). */
export function combinar(a: Componente, b: Componente): string {
  return COMPONENTES.indexOf(a) <= COMPONENTES.indexOf(b) ? `${a}+${b}` : `${b}+${a}`;
}

// ---------------------------------------------------------------------------------------------------------------
// Textos dos atributos
// ---------------------------------------------------------------------------------------------------------------

const ROTULOS: Partial<Record<NomeAtributo, string>> = {
  dano: 'de dano de ataque', manaInicial: 'de mana inicial', resist: 'de resistência', rouboVida: 'de roubo de vida',
  armadura: 'de armadura', velAtaque: 'de velocidade de ataque', vida: 'de vida', desvio: 'de chance de desviar',
  critChance: 'de chance de crítico', poder: 'de poder de habilidade', alcance: 'de alcance', mana: 'de mana',
};
const EM_PONTOS: readonly NomeAtributo[] = ['manaInicial', 'mana', 'alcance'];

function textoBonus(b: Bonus): string {
  const partes = Object.entries(b).map(([k, v]) => {
    const at = k as NomeAtributo;
    const valor = EM_PONTOS.includes(at) ? num(v ?? 0) : `${num((v ?? 0) * 100)}%`;
    return `+${valor} ${ROTULOS[at] ?? at}`;
  });
  return partes.length <= 1 ? partes.join('') : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
}

/** Soma dos bônus de dois componentes ×1,5, arredondada (inteiro de % ou de pontos). */
function somaCompleta(a: Componente, b: Componente): Bonus {
  const out: Bonus = {};
  for (const c of [a, b]) {
    for (const [k, v] of Object.entries(BONUS[c])) {
      const at = k as NomeAtributo;
      out[at] = (out[at] ?? 0) + (v ?? 0) * MULT_COMPLETO;
    }
  }
  for (const [k, v] of Object.entries(out)) {
    const at = k as NomeAtributo;
    // +1e-9: 0,15 × 1,5 dá 0,22499… em ponto flutuante, e a conta é 22,5 → 23
    out[at] = EM_PONTOS.includes(at) ? Math.round((v ?? 0) + 1e-9) : Math.round((v ?? 0) * 100 + 1e-9) / 100;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Estado e ajudantes dos efeitos
// ---------------------------------------------------------------------------------------------------------------

/** Contador por item e por portador (cada item tem o seu). */
function contador() {
  const mapa = new WeakMap<Lutador, number>();
  return {
    /** soma 1 e diz se chegou em `n` (e zera) */
    bateu(u: Lutador, n: number): boolean {
      const k = (mapa.get(u) ?? 0) + 1;
      mapa.set(u, k >= n ? 0 : k);
      return k >= n;
    },
    /** soma 1 até o máximo; diz se ainda somou */
    acumular(u: Lutador, max: number): boolean {
      const k = mapa.get(u) ?? 0;
      if (k >= max) return false;
      mapa.set(u, k + 1);
      return true;
    },
  };
}
/** Uma vez por luta, por portador. */
function umaVez() {
  const usados = new WeakSet<Lutador>();
  return (u: Lutador) => (usados.has(u) ? false : (usados.add(u), true));
}
const segundo = (ctx: Contexto) => Math.round(ctx.tempo);
const aCadaS = (ctx: Contexto, s: number) => segundo(ctx) > 0 && segundo(ctx) % s === 0;

/** Gorem devolvendo dano (evita um Gorem devolver o que o outro devolveu, sem fim). */
let devolvendo = false;
const cTigrerra = umaVez();
const cSkyress = contador();
const cGriffon = contador();
const cSaurus = contador();
const cFalconeer = contador();
const cPyravian = umaVez();
const cTayghen = contador();
const cElCondor = contador();
const cGoreene = contador();

/** Efeito próprio de cada completo, pelo id `${a}+${b}`. */
const EFEITOS: Record<string, Efeito> = {
  'pyrus+pyrus': {
    texto: 'Os ataques queimam o alvo por 3 s: 1,5% da vida máxima por segundo.',
    aoAtacar(ctx, _p, de, alvo) { if (alvo.vivo) ctx.status(de, alvo, 'queimando', 3, 0.015); },
  },
  'aquos+aquos': {
    texto: 'Depois de lançar a habilidade, recupera 20 de mana.',
    aoLancar(ctx, _p, u) { ctx.depois(0.1, () => { if (u.vivo) ctx.mana(u, 20); }); },
  },
  'haos+haos': {
    texto: 'Uma vez por luta, ao cair abaixo de 40% da vida, ganha escudo de 40% da vida máxima por 5 s.',
    aoReceberDano(ctx, _p, u) {
      if (!u.vivo || fracVida(u) >= 0.4 || !cTigrerra(u)) return;
      ctx.visual('escudo', [u], u);
      ctx.escudo(u, u.at.vida * 0.4, 5);
    },
  },
  'darkus+darkus': {
    texto: 'Abaixo de metade da vida, os ataques curam mais 30% do dano causado.',
    aoAtacar(ctx, _p, de, _alvo, dano) { if (de.vivo && fracVida(de) < 0.5 && dano > 0) ctx.curar(de, de, dano * 0.3); },
  },
  'subterra+subterra': {
    texto: 'Devolve 20% do dano recebido a quem atacou.',
    // gancho em vez do status 'refletir': o status reaplicado fica com o maior valor e o fim mais tarde, e grudaria
    // em 100% pro resto da luta depois de um Tetrakarn (Arahabaki) ou do sapo do Gold Experience
    aoReceberDano(ctx, _p, u, de, dano) {
      if (devolvendo || !de || !de.vivo || de === u || dano <= 0) return;
      devolvendo = true;
      try { ctx.danoFixo(u, de, dano * 0.2, { tipo: 'verdadeiro', critico: 'nunca' }); } finally { devolvendo = false; }
    },
  },
  'ventus+ventus': {
    texto: 'A cada 2 s, +4% de velocidade de ataque (até 10 vezes).',
    porSegundo(ctx, p) { if (p.vivo && aCadaS(ctx, 2) && cSkyress.acumular(p, 10)) ctx.buff(p, 'velAtaque', 0.04); },
  },
  'aurelus+aurelus': {
    texto: 'Regenera 1,5% da vida máxima por segundo.',
    porSegundo(ctx, p) { if (p.vivo) ctx.curar(p, p, p.at.vida * 0.015); },
  },
  'pyrus+aquos': {
    texto: 'Depois de lançar a habilidade, solta vapor fervente: 150% do dano de ataque nos inimigos em volta (1 casa).',
    aoLancar(ctx, _p, u) {
      const perto = naArea(ctx, u, u, 1, 'inimigos');
      if (!perto.length) return;
      ctx.visual('fogo', [u, ...perto], u);
      for (const x of perto) ctx.dano(u, x, 1.5, { tipo: 'magico', critico: 'nunca' });
    },
  },
  'pyrus+haos': {
    texto: 'A cada 3 ataques, uma lança de luz em chamas causa mais 80% do dano de ataque (dano mágico).',
    aoAtacar(ctx, _p, de, alvo) {
      if (!alvo.vivo || !cGriffon.bateu(de, 3)) return;
      ctx.visual('luz', [alvo], de);
      ctx.dano(de, alvo, 0.8, { tipo: 'magico', critico: 'nunca' });
    },
  },
  'pyrus+darkus': {
    texto: 'Contra inimigos abaixo de metade da vida, cada ataque causa mais 30% do dano de ataque.',
    aoAtacar(ctx, _p, de, alvo) {
      if (alvo.vivo && fracVida(alvo) < 0.5) ctx.dano(de, alvo, 0.3, { tipo: 'fisico', critico: 'nunca' });
    },
  },
  'pyrus+subterra': {
    texto: 'A cada 5 ataques, uma erupção: 120% do dano de ataque no alvo e nos inimigos em volta (1 casa).',
    aoAtacar(ctx, _p, de, alvo) {
      if (!cSaurus.bateu(de, 5)) return;
      const area = naArea(ctx, de, alvo, 1, 'inimigos');
      ctx.visual('explosao', [alvo, ...area], de);
      for (const x of area) ctx.dano(de, x, 1.2, { tipo: 'magico', critico: 'nunca' });
    },
  },
  'pyrus+ventus': {
    texto: 'A cada 4 ataques, uma rajada de fogo em linha: 80% do dano de ataque em todos no caminho.',
    aoAtacar(ctx, _p, de, alvo) {
      if (!cFalconeer.bateu(de, 4)) return;
      const linha = ctx.emLinha(de, alvo, 'inimigos');
      if (alvo.vivo && !linha.includes(alvo)) linha.unshift(alvo);
      ctx.visual('fogo', linha, de);
      for (const x of linha) ctx.dano(de, x, 0.8, { tipo: 'magico', critico: 'nunca' });
    },
  },
  'pyrus+aurelus': {
    texto: 'Fênix: uma vez por luta, ao cair abaixo de 25% da vida, cura 30% da vida máxima e queima os inimigos em ' +
      'volta (1 casa) por 3 s (3% da vida máxima por segundo).',
    aoReceberDano(ctx, _p, u) {
      if (!u.vivo || fracVida(u) >= 0.25 || !cPyravian(u)) return;
      const perto = naArea(ctx, u, u, 1, 'inimigos');
      ctx.visual('fogo', [u, ...perto], u);
      ctx.curar(u, u, u.at.vida * 0.3);
      for (const x of perto) ctx.status(u, x, 'queimando', 3, 0.03);
    },
  },
  'aquos+haos': {
    texto: 'Depois de lançar a habilidade, cura o aliado com menos vida em 15% da vida máxima dele.',
    aoLancar(ctx, _p, u) {
      const a = ctx.menosVida(u, 'aliados', true);
      if (!a) return;
      ctx.visual('cura', [a], u);
      ctx.curar(u, a, a.at.vida * 0.15);
    },
  },
  'aquos+darkus': {
    texto: 'Os ataques roubam 5 de mana do alvo.',
    aoAtacar(ctx, _p, de, alvo) {
      const m = Math.min(5, alvo.mana);
      if (m <= 0) return;
      ctx.mana(alvo, -m);
      ctx.mana(de, m);
    },
  },
  'aquos+subterra': {
    texto: 'Os ataques envenenam o alvo: por 3 s ele não recebe cura e fica 15% mais lento.',
    aoAtacar(ctx, _p, de, alvo) {
      if (!alvo.vivo) return;
      ctx.status(de, alvo, 'semCura', 3);
      ctx.status(de, alvo, 'lento', 3, 0.15);
    },
  },
  'aquos+ventus': {
    texto: 'A cada 3 ataques, ganha 10 de mana.',
    aoAtacar(ctx, _p, de) { if (cTayghen.bateu(de, 3)) ctx.mana(de, 10); },
  },
  'aquos+aurelus': {
    texto: 'Depois de lançar a habilidade, cura 15% da própria vida máxima.',
    aoLancar(ctx, _p, u) { if (u.vivo) ctx.curar(u, u, u.at.vida * 0.15); },
  },
  'haos+darkus': {
    texto: 'Os ataques deixam o alvo vulnerável: leva 10% a mais de dano por 3 s.',
    aoAtacar(ctx, _p, de, alvo) { if (alvo.vivo) ctx.status(de, alvo, 'vulneravel', 3, 0.1); },
  },
  'haos+subterra': {
    texto: 'No começo da luta, os aliados em volta (1 casa) ganham escudo de 15% da vida deles.',
    aoComecar(ctx, p) {
      const vizinhos = naArea(ctx, p, p, 1, 'aliados').filter(a => a !== p);
      if (vizinhos.length) ctx.visual('escudo', vizinhos, p);
      for (const a of vizinhos) ctx.escudo(a, a.at.vida * 0.15, LUTA_TODA);
    },
  },
  'haos+ventus': {
    texto: 'Desvia de 15% dos ataques.',
    atributos: { desvio: 0.15 },
  },
  'haos+aurelus': {
    texto: 'A cada 5 s, cura o aliado com menos vida em 6% da vida máxima dele.',
    porSegundo(ctx, p) {
      if (!p.vivo || !aCadaS(ctx, 5)) return;
      const a = ctx.menosVida(p, 'aliados', true);
      if (!a) return;
      ctx.visual('cura', [a], p);
      ctx.curar(p, a, a.at.vida * 0.06);
    },
  },
  'darkus+subterra': {
    texto: 'Depois de lançar a habilidade, os inimigos em volta (1 casa) ficam atordoados por 1,5 s.',
    aoLancar(ctx, _p, u) {
      const perto = naArea(ctx, u, u, 1, 'inimigos');
      if (!perto.length) return;
      ctx.visual('terra', [u, ...perto], u);
      for (const x of perto) ctx.status(u, x, 'atordoado', 1.5);
    },
  },
  'darkus+ventus': {
    texto: 'Os ataques têm 25% de chance de golpear de novo na hora: mais 70% do dano de ataque.',
    aoAtacar(ctx, _p, de, alvo) {
      if (alvo.vivo && ctx.chance(0.25)) ctx.dano(de, alvo, 0.7, { tipo: 'fisico' });
    },
  },
  'darkus+aurelus': {
    texto: 'Cada abate com ataque cura 25% da vida máxima.',
    aoAtacar(ctx, _p, de, alvo) { if (!alvo.vivo && de.vivo) ctx.curar(de, de, de.at.vida * 0.25); },
  },
  'subterra+ventus': {
    texto: 'A cada 4 ataques, atordoa o alvo por 0,5 s.',
    aoAtacar(ctx, _p, de, alvo) { if (cElCondor.bateu(de, 4) && alvo.vivo) ctx.status(de, alvo, 'atordoado', 0.5); },
  },
  'subterra+aurelus': {
    texto: 'A cada 3 s, +5% de armadura e resistência (até 6 vezes).',
    porSegundo(ctx, p) {
      if (!p.vivo || !aCadaS(ctx, 3) || !cGoreene.acumular(p, 6)) return;
      ctx.buff(p, 'armadura', 0.05);
      ctx.buff(p, 'resist', 0.05);
    },
  },
  'ventus+aurelus': {
    texto: 'No começo da luta, uiva: os aliados em volta (1 casa) ganham +10% de velocidade de ataque.',
    aoComecar(ctx, p) {
      for (const a of naArea(ctx, p, p, 1, 'aliados')) if (a !== p) ctx.buff(a, 'velAtaque', 0.1);
    },
  },
};

/** Escudo do Haos no começo: `n` componentes Haos no item, cada um vale ESCUDO_HAOS (×1,5 no completo). */
function escudoHaos(fracao: number): Pick<Item, 'aoComecar'> {
  return {
    aoComecar(ctx, p) { if (p.vivo) ctx.escudo(p, p.at.vida * fracao, LUTA_TODA); },
  };
}

/** Junta dois ganchos do mesmo nome (escudo do Haos + efeito do completo). */
function juntar(a: Partial<Item>, b: Partial<Item>): Partial<Item> {
  const out: Partial<Item> = { ...a, ...b };
  if (a.aoComecar && b.aoComecar) {
    const f = a.aoComecar, g = b.aoComecar;
    out.aoComecar = (ctx, p, m) => { f(ctx, p, m); g(ctx, p, m); };
  }
  return out;
}

const componentes: Item[] = COMPONENTES.map(c => {
  const haos = c === 'haos';
  return {
    id: c,
    nome: NOMES[c],
    texto: `${textoBonus(BONUS[c])}${haos ? ` e escudo de ${num(ESCUDO_HAOS * 100)}% da vida no começo da luta` : ''}.`,
    atributos: { ...BONUS[c] },
    ...(haos ? escudoHaos(ESCUDO_HAOS) : {}),
  };
});

const completos: Item[] = RECEITAS.map(([a, b, bakugan]) => {
  const id = combinar(a, b);
  const efeito = EFEITOS[id];
  if (!efeito) throw new Error(`item sem efeito: ${id}`);
  const { texto: textoEfeito, atributos: extra, ...ganchos } = efeito;
  const atributos = { ...somaCompleta(a, b), ...extra };
  const qtdHaos = [a, b].filter(c => c === 'haos').length;
  const escudo = qtdHaos * ESCUDO_HAOS * MULT_COMPLETO;
  const base = textoBonus(somaCompleta(a, b));
  const textoEscudo = escudo > 0 ? ` e escudo de ${num(Math.round(escudo * 100))}% da vida no começo da luta` : '';
  return {
    id,
    nome: bakugan.replace(/\s*\(Generation \d+\)\s*$/, ''),
    bakugan,
    componentes: [a, b],
    texto: `${base}${textoEscudo}. ${textoEfeito}`,
    atributos,
    ...juntar(escudo > 0 ? escudoHaos(escudo) : {}, ganchos),
  } satisfies Item;
});

/** 7 componentes e 28 completos, pelo id. */
export const ITENS: Record<string, Item> = Object.fromEntries([...componentes, ...completos].map(i => [i.id, i]));
