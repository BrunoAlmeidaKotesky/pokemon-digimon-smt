// Laboratório do playtest automático (docs/tft/matematica/README.md, "Playtest"): lutas controladas com o set, o
// motor e o conteúdo de verdade, determinísticas pela semente. O conteúdo passa por um embrulho que mede cada
// habilidade (lançamentos, dano, cura e escudo) e pode desligar traços de um lado só. Os cenários:
// - força por campeão: cada campeão com 3 bonecos contra cada outro do mesmo custo e estrela com os mesmos bonecos;
// - curva por custo: times de 5 campeões sorteados de um custo/estrela contra os de outro;
// - equivalentes: quanto de vida e dano (no time todo, ou só na unidade) vale um traço, um item ou o pacote papel +
//   ult de uma classe — o bônus que o outro lado precisa pra empatar (bisseção em medidas.ts);
// - origens: time cheio de cada origem contra os das outras, quanto valem Stands além do limite e quanto vale evoluir;
// - composições forçadas: times focados em cada traço e em cada par origem + classe, um contra o outro, em vários
//   tamanhos de tabuleiro e estrelas; e se 2 Stands num time normal viram obrigação.
// "Boneco" = monstro sem habilidade nem traço, com os atributos base do custo e da estrela (papel Únicos).
import { S } from '../dados';
import * as real from '../conteudo';
import {
  REGRAS, atributosBase, atributosDaUnidade, papelDe, simularLutaCom, type Conteudo, type ObservadorLuta,
} from '../combate';
import { vizinhas } from '../hex';
import { chancesLoja } from '../partida/consultas';
import { criarRng, type Rng } from '../rng';
import {
  COMPONENTES, LINHAS_DONO, ORIGENS,
  type CampeaoDados, type CasaDono, type Contexto, type Custo, type EntradaLutador, type EntradaTime, type Estrela,
  type FormaDados, type Habilidade, type Lado, type MonstroDados, type Origem, type ResultadoLuta, type SetDados,
  type Unidade,
} from '../tipos';
import { equivalente, placarVazio, semente, somarLuta, taxa, type Placar } from './medidas';

// =================================================================================================================
// Conteúdo medido
// =================================================================================================================

/** O que cada lutador (id da luta) fez numa luta: a habilidade (lançamentos, dano, cura e escudo), a mana que ganhou
 *  por fonte e quando morreu (NaN = vivo no fim). */
export interface MedidaLutador {
  lancamentos: number;
  /** segundo do 1º lançamento (NaN = não lançou) */
  primeiro: number;
  dano: number;
  cura: number;
  escudo: number;
  manaAtaque: number;
  manaGolpe: number;
  manaConteudo: number;
  morte: number;
}

let medidas = new Map<string, MedidaLutador>();
/** lados com unidade, na ordem em que o motor conta os traços (A, depois B) */
let filaLados: Lado[] = [];
let desligados: Record<Lado, ReadonlySet<string>> = { a: new Set(), b: new Set() };

function medidaDe(id: string): MedidaLutador {
  let m = medidas.get(id);
  if (!m) {
    m = { lancamentos: 0, primeiro: NaN, dano: 0, cura: 0, escudo: 0, manaAtaque: 0, manaGolpe: 0, manaConteudo: 0, morte: NaN };
    medidas.set(id, m);
  }
  return m;
}

const OBSERVADOR: ObservadorLuta = {
  mana(l, fonte, ganho) {
    const m = medidaDe(l.id);
    if (fonte === 'ataque') m.manaAtaque += ganho;
    else if (fonte === 'golpe') m.manaGolpe += ganho;
    else m.manaConteudo += ganho;
  },
  morte(l, t) { medidaDe(l.id).morte = t; },
};

/** Contexto que repassa tudo ao do motor e soma em `m` o dano, a cura e o escudo da habilidade. */
function contextoMedido(ctx: Contexto, m: MedidaLutador): Contexto {
  return {
    aleatorio: () => ctx.aleatorio(),
    chance: p => ctx.chance(p),
    sortear<T>(xs: readonly T[], n: number): T[] { return ctx.sortear(xs, n); },
    get tempo() { return ctx.tempo; },
    inimigosDe: u => ctx.inimigosDe(u),
    aliadosDe: (u, s) => ctx.aliadosDe(u, s),
    emVolta: (c, r, de, q) => ctx.emVolta(c, r, de, q),
    emLinha: (de, p, q) => ctx.emLinha(de, p, q),
    emCone: (de, p, a, q) => ctx.emCone(de, p, a, q),
    maisProximo: (de, q) => ctx.maisProximo(de, q),
    maisLonge: (de, q, a) => ctx.maisLonge(de, q, a),
    menosVida: (de, q, s) => ctx.menosVida(de, q, s),
    maisVida: (de, q) => ctx.maisVida(de, q),
    distancia: (a, b) => ctx.distancia(a, b),
    dano(de, para, f, op) { const v = ctx.dano(de, para, f, op); m.dano += v; return v; },
    danoFixo(de, para, valor, op) { const v = ctx.danoFixo(de, para, valor, op); m.dano += v; return v; },
    curar(de, para, valor) { const v = ctx.curar(de, para, valor); m.cura += v; return v; },
    escudo(para, valor, duracao) {
      if (para.vivo && valor > 0) m.escudo += valor;
      ctx.escudo(para, valor, duracao);
    },
    status: (de, para, s, d, v) => ctx.status(de, para, s, d, v),
    limparStatusRuins: u => ctx.limparStatusRuins(u),
    buff: (u, a, f, d) => ctx.buff(u, a, f, d),
    mana: (u, d) => ctx.mana(u, d),
    matar: (de, para) => ctx.matar(de, para),
    definirFracaoVida: (u, f) => ctx.definirFracaoVida(u, f),
    casaLivreAoLado: c => ctx.casaLivreAoLado(c),
    mover: (u, c) => ctx.mover(u, c),
    empurrar: (u, o, n) => ctx.empurrar(u, o, n),
    transformar: (u, f, mult) => ctx.transformar(u, f, mult),
    invocarFF: (d, f, c) => ctx.invocarFF(d, f, c),
    reviver: (u, f) => ctx.reviver(u, f),
    depois: (s, fn) => ctx.depois(s, fn),
    aCada: (i, d, fn) => ctx.aCada(i, d, fn),
    visual: (t, onde, de) => ctx.visual(t, onde, de),
    texto: (u, t) => ctx.texto(u, t),
    ouro: (l, n) => ctx.ouro(l, n),
    moeda: (l, n, onde) => ctx.moeda(l, n, onde),
  };
}

const embrulhadas = new WeakMap<Habilidade, Habilidade>();
function embrulhar(h: Habilidade): Habilidade {
  let e = embrulhadas.get(h);
  if (!e) {
    e = {
      ...h,
      lancar(ctx, eu, alvo) {
        const m = medidaDe(eu.id);
        m.lancamentos++;
        if (Number.isNaN(m.primeiro)) m.primeiro = ctx.tempo;
        h.lancar(contextoMedido(ctx, m), eu, alvo);
      },
    };
    embrulhadas.set(h, e);
  }
  return e;
}

/** O conteúdo de verdade, com as habilidades medidas e traços desligáveis por lado. */
export const CONTEUDO_MEDIDO: Conteudo = {
  get TRACOS() { return real.TRACOS; },
  get ITENS() { return real.ITENS; },
  habilidadeDa(forma, escolha) {
    const h = real.habilidadeDa(forma, escolha);
    return h ? embrulhar(h) : null;
  },
  passivaDe: campeao => real.passivaDe(campeao),
  contarTracos(us) {
    const r = real.contarTracos(us);
    const lado = filaLados.shift();
    const fora = lado ? desligados[lado] : undefined;
    return fora?.size ? r.map(t => (fora.has(t.id) ? { ...t, nivel: -1 } : t)) : r;
  },
};

export interface OpcoesLuta {
  /** traços que não ativam naquele lado */
  desligar?: Partial<Record<Lado, readonly string[]>>;
  /** grava quadro a quadro (pra conferir invariantes dentro da luta) */
  gravar?: boolean;
}
export interface LutaMedida { r: ResultadoLuta; med: ReadonlyMap<string, MedidaLutador> }

/** Uma luta com o conteúdo medido. O motor conta os traços do lado A e depois os do B (só dos lados com unidade):
 *  é por essa ordem que o embrulho sabe de que lado é cada contagem. */
export function lutar(a: EntradaTime, b: EntradaTime, sem: number, op: OpcoesLuta = {}): LutaMedida {
  medidas = new Map();
  filaLados = (['a', 'b'] as const).filter(l => (l === 'a' ? a : b).lutadores.some(x => x.unidade));
  desligados = { a: new Set(op.desligar?.a ?? []), b: new Set(op.desligar?.b ?? []) };
  const r = simularLutaCom(CONTEUDO_MEDIDO, a, b, sem, !!op.gravar, REGRAS, OBSERVADOR);
  return { r, med: medidas };
}

export const resultadoDo = (r: ResultadoLuta, lado: Lado): 'vitoria' | 'derrota' | 'empate' =>
  r.vencedor === 'empate' ? 'empate' : r.vencedor === lado ? 'vitoria' : 'derrota';

// =================================================================================================================
// Set: campeões de verdade e os sintéticos (pacote papel + ult de cada classe)
// =================================================================================================================

/** Prefixo dos campeões sintéticos que estenderSet acrescenta (nunca entram nos sorteios). */
export const SINTETICO = 'pokemon:~';

/** Cópia do set com um campeão sintético de custo 3 por classe/elemento: uma forma só, com só essa classe (papel e
 *  ult padrão dela). Sozinho no time, não ativa traço nenhum. */
export function estenderSet(dados: SetDados, classes: readonly string[]): SetDados {
  const formas: Record<string, FormaDados> = { ...dados.formas };
  const campeoes: CampeaoDados[] = [...dados.campeoes];
  for (const c of classes) {
    const id = `${SINTETICO}${c}`;
    formas[id] = { id, nome: `Pacote ${c}`, img: '', fr: 'pokemon', classes: [c], info: [] };
    campeoes.push({ id, fr: 'pokemon', nome: `Pacote ${c}`, custo: 3, niveis: [[id]] });
  }
  return { ...dados, formas, campeoes };
}

/** Campeões de verdade (sem os sintéticos), do custo pedido ou de todos. */
export function reais(custo?: Custo): CampeaoDados[] {
  const lista = custo ? S().porCusto[custo] : S().dados.campeoes;
  return lista.filter(c => !c.id.startsWith(SINTETICO));
}

/** Traços (origem e classes da forma) que a unidade conta no tabuleiro. */
export const tracosDaForma = (c: CampeaoDados, forma: string): string[] => [c.fr, ...S().forma(forma).classes];

// =================================================================================================================
// Times
// =================================================================================================================

export function unidade(uid: number, campeao: string, estrela: Estrela, extra: Partial<Unidade> = {}): Unidade {
  return { uid, campeao, estrela, forma: S().formaPadrao(campeao, estrela), itens: [], ...extra };
}

const BONECO: MonstroDados = { nome: 'Boneco', jogo: 'playtest', img: '' };

/** Boneco: atributos base do custo e da estrela (papel Únicos), sem habilidade; `bonus` soma vida e dano. */
export function boneco(id: string, custo: Custo, estrela: Estrela, alcance: number, casa: CasaDono, bonus = 0): EntradaLutador {
  const at = atributosBase(custo, estrela, 'unicos');
  at.alcance = alcance;
  at.vida *= 1 + bonus;
  at.dano *= 1 + bonus;
  return { id, monstro: { dados: BONECO, chefe: false, atributos: at }, casa };
}

/** Linhas boas pelo alcance (0 = frente), como a partida arruma: corpo a corpo na frente, alcance 2 no meio, longe
 *  atrás. */
export function linhasPorAlcance(alcance: number): number[] {
  if (alcance <= 1) return [0, 1, 2, 3];
  if (alcance === 2) return [1, 0, 2, 3];
  return [3, 2, 1, 0];
}
const COLUNAS_DO_MEIO = [3, 4, 2, 5, 1, 6, 0, 7];
const chave = (c: CasaDono) => `${c.col},${c.lin}`;

/** Arruma as unidades na metade do dono: cada uma na linha do alcance, colunas do meio pras bordas (girando com
 *  `variacao`); Stands (com `usuario`) numa casa livre ao lado do usuário. */
export function posicionar(unidades: readonly Unidade[], variacao = 0, ocupadas: readonly CasaDono[] = []): EntradaLutador[] {
  const usadas = new Set(ocupadas.map(chave));
  const out: EntradaLutador[] = [];
  const casaDe = new Map<number, CasaDono>();
  const giro = ((variacao % COLUNAS_DO_MEIO.length) + COLUNAS_DO_MEIO.length) % COLUNAS_DO_MEIO.length;
  const colunas = [...COLUNAS_DO_MEIO.slice(giro), ...COLUNAS_DO_MEIO.slice(0, giro)];
  const livre = (c: CasaDono) => !usadas.has(chave(c));
  const tomar = (u: Unidade, c: CasaDono) => {
    usadas.add(chave(c));
    casaDe.set(u.uid, c);
    out.push({ id: String(u.uid), unidade: u, casa: c });
  };
  for (const u of unidades.filter(x => x.usuario == null)) {
    let casa: CasaDono | undefined;
    for (const lin of linhasPorAlcance(atributosDaUnidade(u).alcance)) {
      const col = colunas.find(cl => livre({ col: cl, lin }));
      if (col !== undefined) { casa = { col, lin }; break; }
    }
    if (casa) tomar(u, casa);
  }
  for (const s of unidades.filter(x => x.usuario != null)) {
    const perto = casaDe.get(s.usuario!);
    const casa = perto ? vizinhas(perto, LINHAS_DONO).sort((p, q) => q.lin - p.lin).find(livre) : undefined;
    if (casa) tomar(s, casa);
  }
  return out;
}

/** Disposições do teste de força: coluna do campeão testado e dos 3 bonecos (b1 na frente, b2 e b3 atrás). */
const DISPOSICOES = [
  { x: 3, b1: 4, b2: 2, b3: 5 },
  { x: 1, b1: 3, b2: 3, b3: 6 },
  { x: 6, b1: 3, b2: 1, b3: 4 },
] as const;
export const N_DISPOSICOES = DISPOSICOES.length;

/** Time padrão do teste: a unidade `x` (id "x"; se for Stand, presa ao usuário `u`, id "u") e 3 bonecos do custo e
 *  da estrela dela. `bonusX` soma vida e dano na unidade testada. */
export function timeComBonecos(dono: string, x: Unidade, disposicao: number, usuario?: Unidade): EntradaTime {
  const d = DISPOSICOES[disposicao % DISPOSICOES.length]!;
  const custo = S().campeao(x.campeao).custo;
  const portador = usuario ?? x;
  const lin = linhasPorAlcance(atributosDaUnidade(portador).alcance)[0]!;
  const lutadores: EntradaLutador[] = [
    boneco('b1', custo, x.estrela, 1, { col: d.b1, lin: 0 }),
    boneco('b2', custo, x.estrela, 3, { col: d.b2, lin: 3 }),
    boneco('b3', custo, x.estrela, 3, { col: d.b3, lin: 3 }),
  ];
  const ocupadas = lutadores.map(l => l.casa);
  if (usuario) {
    lutadores.push({ id: 'u', unidade: usuario, casa: { col: d.x, lin } });
    const livre = vizinhas({ col: d.x, lin }, LINHAS_DONO).find(c => !ocupadas.some(o => o.col === c.col && o.lin === c.lin));
    lutadores.push({ id: 'x', unidade: { ...x, usuario: usuario.uid }, casa: livre ?? { col: d.x, lin: (lin + 1) % LINHAS_DONO } });
  } else {
    lutadores.push({ id: 'x', unidade: x, casa: { col: d.x, lin } });
  }
  return { dono, lutadores };
}

// =================================================================================================================
// Força por campeão
// =================================================================================================================

export interface LinhaCampeao {
  campeao: string;
  nome: string;
  forma: string;
  custo: Custo;
  estrela: Estrela;
  stand: boolean;
  papel: string;
  /** id da habilidade (null = só ataca) */
  habilidade: string | null;
  /** mana da habilidade e mana inicial (com a habilidade) */
  mana: number;
  manaInicial: number;
  placar: Placar;
  /** dano causado por luta */
  dano: number;
  /** fração das lutas em que estava vivo no fim */
  sobrevive: number;
  /** segundos vivo por luta */
  tempoVivo: number;
  /** lançamentos por luta */
  lancamentos: number;
  /** lançamentos por segundo vivo */
  lancPorSegundo: number;
  /** segundo médio do 1º lançamento, nas lutas em que lançou */
  primeiro: number;
  /** fração das lutas em que lançou ao menos uma vez */
  lancou: number;
  /** por lançamento */
  habDano: number;
  habCura: number;
  habEscudo: number;
  /** (dano + cura + escudo da habilidade) por segundo vivo */
  habPorSegundo: number;
  /** mana ganha por luta, por fonte */
  manaAtaque: number;
  manaGolpe: number;
  manaConteudo: number;
  /** dano de ataque da unidade (base + estrela + papel) */
  danoAtaque: number;
  /** segundos de luta, média */
  duracao: number;
  /** ouro derrubado no chão pelo lado dele, por luta (só os bonecos e ele: é dele) */
  moedas: number;
}

interface Soma {
  placar: Placar; dano: number; vivo: number; tempoVivo: number; lanc: number; primeiro: number; nPrimeiro: number;
  habDano: number; habCura: number; habEscudo: number; manaAtaque: number; manaGolpe: number; manaConteudo: number;
  duracao: number; moedas: number;
}
const somaVazia = (): Soma => ({
  placar: placarVazio(), dano: 0, vivo: 0, tempoVivo: 0, lanc: 0, primeiro: 0, nPrimeiro: 0, habDano: 0, habCura: 0,
  habEscudo: 0, manaAtaque: 0, manaGolpe: 0, manaConteudo: 0, duracao: 0, moedas: 0,
});

/** Ouro derrubado no chão por um lado da luta. */
export const moedasDoLado = (r: ResultadoLuta, lado: Lado): number =>
  (r.moedas ?? []).reduce((s, m) => s + (m.lado === lado ? m.valor : 0), 0);

function somarLado(s: Soma, l: LutaMedida, lado: Lado): void {
  const id = `${lado}:x`;
  somarLuta(s.placar, resultadoDo(l.r, lado));
  s.dano += l.r.dano[id] ?? 0;
  const vivo = (lado === 'a' ? l.r.vivosA : l.r.vivosB).includes(id);
  if (vivo) s.vivo++;
  s.duracao += l.r.duracao;
  s.moedas += moedasDoLado(l.r, lado);
  const m = l.med.get(id);
  s.tempoVivo += vivo || !m || Number.isNaN(m.morte) ? l.r.duracao : m.morte;
  if (!m) return;
  s.lanc += m.lancamentos;
  if (!Number.isNaN(m.primeiro)) { s.primeiro += m.primeiro; s.nPrimeiro++; }
  s.habDano += m.dano;
  s.habCura += m.cura;
  s.habEscudo += m.escudo;
  s.manaAtaque += m.manaAtaque;
  s.manaGolpe += m.manaGolpe;
  s.manaConteudo += m.manaConteudo;
}

function linhaDe(c: CampeaoDados, estrela: Estrela, s: Soma): LinhaCampeao {
  const u = unidade(1, c.id, estrela);
  const forma = S().forma(u.forma);
  const h = real.habilidadeDa(forma);
  const at = atributosDaUnidade(u);
  const n = s.placar.lutas || 1;
  const porLanc = (x: number) => (s.lanc ? x / s.lanc : NaN);
  return {
    campeao: c.id, nome: forma.nome, forma: forma.id, custo: c.custo, estrela, stand: !!c.stand,
    papel: papelDe(forma), habilidade: h?.id ?? null, mana: at.mana, manaInicial: at.manaInicial, placar: s.placar,
    dano: s.dano / n, sobrevive: s.vivo / n, tempoVivo: s.tempoVivo / n, lancamentos: s.lanc / n,
    lancPorSegundo: s.tempoVivo ? s.lanc / s.tempoVivo : NaN, primeiro: s.nPrimeiro ? s.primeiro / s.nPrimeiro : NaN,
    lancou: s.nPrimeiro / n, habDano: porLanc(s.habDano), habCura: porLanc(s.habCura), habEscudo: porLanc(s.habEscudo),
    habPorSegundo: s.tempoVivo ? (s.habDano + s.habCura + s.habEscudo) / s.tempoVivo : NaN,
    manaAtaque: s.manaAtaque / n, manaGolpe: s.manaGolpe / n, manaConteudo: s.manaConteudo / n,
    danoAtaque: at.dano, duracao: s.duracao / n, moedas: s.moedas / n,
  };
}

/** Usuário fixo pros Stands do custo: o 1º campeão (por id) que não é JoJo nem Stand. */
function usuarioPadrao(custo: Custo, estrela: Estrela, uid: number): Unidade {
  const c = reais(custo).filter(x => !x.stand && x.fr !== 'jojo').sort((p, q) => p.id.localeCompare(q.id))[0];
  if (!c) throw new Error(`sem usuário pros Stands no custo ${custo}`);
  return unidade(uid, c.id, estrela);
}

/**
 * Força por campeão: cada campeão do custo e da estrela (com a forma da estrela e a ult padrão), com 3 bonecos,
 * contra cada outro do mesmo grupo com os mesmos bonecos, em todas as disposições e dos dois lados. Os Stands
 * formam um grupo à parte, presos ao mesmo usuário (o 1º campeão do custo que não é JoJo).
 */
export function forcaPorCampeao(custo: Custo, estrela: Estrela, base = 0): LinhaCampeao[] {
  const out: LinhaCampeao[] = [];
  for (const stands of [false, true]) {
    const grupo = reais(custo).filter(c => !!c.stand === stands);
    const somas = grupo.map(somaVazia);
    for (let i = 0; i < grupo.length; i++) for (let j = i + 1; j < grupo.length; j++) {
      for (let d = 0; d < N_DISPOSICOES; d++) for (const ladoI of ['a', 'b'] as const) {
        const ci = grupo[i]!, cj = grupo[j]!;
        const ti = timeComBonecos('i', unidade(1, ci.id, estrela), d, stands ? usuarioPadrao(custo, estrela, 2) : undefined);
        const tj = timeComBonecos('j', unidade(1, cj.id, estrela), d, stands ? usuarioPadrao(custo, estrela, 2) : undefined);
        const l = ladoI === 'a'
          ? lutar(ti, tj, semente(base, ci.id, cj.id, estrela, d, ladoI))
          : lutar(tj, ti, semente(base, ci.id, cj.id, estrela, d, ladoI));
        somarLado(somas[i]!, l, ladoI);
        somarLado(somas[j]!, l, ladoI === 'a' ? 'b' : 'a');
      }
    }
    grupo.forEach((c, k) => out.push(linhaDe(c, estrela, somas[k]!)));
  }
  return out;
}

// =================================================================================================================
// Curva por custo
// =================================================================================================================

export interface Grupo { custo: Custo; estrela: Estrela }

/** Time de `n` campeões diferentes (sem Stands) sorteados do custo, todos na estrela, arrumados pelo alcance. */
export function timeSorteado(dono: string, g: Grupo, n: number, rng: Rng, variacao: number, bonus = 0): EntradaTime {
  const escolhidos = rng.sortear(reais(g.custo).filter(c => !c.stand), n);
  const us = escolhidos.map((c, i) => unidade(i + 1, c.id, g.estrela, bonus ? { bonus: { vida: bonus, dano: bonus } } : {}));
  return { dono, lutadores: posicionar(us, variacao) };
}

/** Taxa de vitória de times de `p` contra times de `q` (os dois lados de cada cenário). Com `lanc`, soma também
 *  os lançamentos de todo mundo. */
export function curva(p: Grupo, q: Grupo, cenarios: number, tamanho = 5, base = 0, lanc?: TabelaLanc): Placar {
  const placar = placarVazio();
  for (let i = 0; i < cenarios; i++) {
    const rng = criarRng(semente(base, 'curva', p.custo, p.estrela, q.custo, q.estrela, i));
    const tp = timeSorteado('p', p, tamanho, rng, i);
    const tq = timeSorteado('q', q, tamanho, rng, i + 3);
    const s = rng.semente();
    const l1 = lutar(tp, tq, s), l2 = lutar(tq, tp, s);
    somarLuta(placar, resultadoDo(l1.r, 'a'));
    somarLuta(placar, resultadoDo(l2.r, 'b'));
    if (lanc) for (const [l, a, b] of [[l1, tp, tq], [l2, tq, tp]] as const) {
      somarLancamentos(lanc, a, 'a', l);
      somarLancamentos(lanc, b, 'b', l);
    }
  }
  return placar;
}

// =================================================================================================================
// Lançamentos e mana por papel, custo e estrela (em qualquer luta: curva, partidas de bots)
// =================================================================================================================

export interface SomaLanc {
  /** unidades-luta com habilidade */
  n: number;
  lanc: number;
  /** segundos vivo, somados */
  vivo: number;
  primeiro: number;
  nPrimeiro: number;
  /** 1º lançamento antes de 3 s */
  antes3: number;
  /** 1º lançamento depois de 10 s */
  depois10: number;
  manaAtaque: number;
  manaGolpe: number;
  manaConteudo: number;
}
/** Soma de lançamentos vazia. */
export const somaLancVazia = (): SomaLanc => ({
  n: 0, lanc: 0, vivo: 0, primeiro: 0, nPrimeiro: 0, antes3: 0, depois10: 0, manaAtaque: 0, manaGolpe: 0, manaConteudo: 0,
});
/** `${papel}|${custo}|${estrela}` → soma */
export type TabelaLanc = Map<string, SomaLanc>;

/** Soma os lançamentos e a mana de cada unidade com habilidade do time (do lado `lado` na luta). */
export function somarLancamentos(t: TabelaLanc, time: EntradaTime, lado: Lado, l: LutaMedida): void {
  for (const e of time.lutadores) {
    const u = e.unidade;
    if (!u) continue;
    const forma = S().forma(u.forma);
    if (!real.habilidadeDa(forma, u.ult)) continue;
    const chave = `${papelDe(forma)}|${S().campeao(u.campeao).custo}|${u.estrela}`;
    let s = t.get(chave);
    if (!s) t.set(chave, (s = somaLancVazia()));
    const id = `${lado}:${e.id}`;
    const m = l.med.get(id);
    const vivoNoFim = (lado === 'a' ? l.r.vivosA : l.r.vivosB).includes(id);
    s.n++;
    s.vivo += vivoNoFim || !m || Number.isNaN(m.morte) ? l.r.duracao : m.morte;
    if (!m) continue;
    s.lanc += m.lancamentos;
    if (!Number.isNaN(m.primeiro)) {
      s.primeiro += m.primeiro;
      s.nPrimeiro++;
      if (m.primeiro < 3) s.antes3++;
      if (m.primeiro > 10) s.depois10++;
    }
    s.manaAtaque += m.manaAtaque;
    s.manaGolpe += m.manaGolpe;
    s.manaConteudo += m.manaConteudo;
  }
}

// =================================================================================================================
// Equivalentes: traço, item e pacote de classe
// =================================================================================================================

/** Um cenário: o mesmo time nos dois lados; `b` = bônus de vida e dano do lado sem a coisa medida. */
type Cenario = (bonusB: number) => { a: EntradaTime; b: EntradaTime; semente: number; desligarB?: string[] };

/** Taxa de vitória do lado com a coisa (jogando de A e de B) quando o outro lado tem `bonus`. */
function taxaCom(cenarios: readonly Cenario[], bonus: number): number {
  const placar = placarVazio();
  for (const c of cenarios) {
    const { a, b, semente: s, desligarB } = c(bonus);
    const fora = desligarB ?? [];
    somarLuta(placar, resultadoDo(lutar(a, b, s, { desligar: { b: fora } }).r, 'a'));
    somarLuta(placar, resultadoDo(lutar(b, a, s, { desligar: { a: fora } }).r, 'b'));
  }
  return taxa(placar);
}

export interface Equivalente {
  /** taxa de vitória sem bônus nenhum do outro lado */
  taxa: number;
  /** bônus de vida e dano que o outro lado precisa pra empatar */
  equivalente: number;
  cenarios: number;
}

function medirEquivalente(cenarios: readonly Cenario[], lo: number, hi: number, passos: number): Equivalente {
  const cache = new Map<number, number>();
  const f = (x: number) => {
    let v = cache.get(x);
    if (v === undefined) cache.set(x, (v = taxaCom(cenarios, x)));
    return v;
  };
  return { taxa: f(0), equivalente: equivalente(f, lo, hi, passos), cenarios: cenarios.length };
}

const comBonus = (u: Unidade, b: number): Unidade => (b ? { ...u, bonus: { vida: b, dano: b } } : u);
const bonusNoTime = (t: EntradaTime, b: number): EntradaTime => (b
  ? { ...t, lutadores: t.lutadores.map(l => (l.unidade ? { ...l, unidade: comBonus(l.unidade, b) } : l)) }
  : t);

/** Campeões que contam no traço com a forma da estrela (origem: o campeão; classe: a forma). */
function membrosDoTraco(traco: string, estrela: Estrela): CampeaoDados[] {
  return reais().filter(c => tracosDaForma(c, S().formaPadrao(c.id, estrela)).includes(traco));
}

/**
 * Quanto vale o traço no degrau: o time tem exatamente os campeões do degrau com o traço (sorteados) e mais 2 que
 * não têm (JoJo: um usuário de outra origem pra cada Stand), todos na estrela. O outro lado é o mesmo time com o
 * traço desligado; o equivalente é o bônus de vida e dano no time todo que empata.
 */
export function valorDoTraco(traco: string, nivel: number, estrela: Estrela, nCenarios: number, base = 0, passos = 7): Equivalente | null {
  const t = real.TRACOS[traco];
  const k = t?.degraus[nivel];
  if (!t || k === undefined) return null;
  const membros = membrosDoTraco(traco, estrela);
  if (membros.length < k) return null;
  const outros = reais().filter(c => !c.stand && !membros.includes(c) && c.fr !== 'jojo');
  const cenarios: Cenario[] = [];
  for (let i = 0; i < nCenarios; i++) {
    const rng = criarRng(semente(base, 'traco', traco, nivel, estrela, i));
    const escolhidos = rng.sortear(membros, k);
    const stands = escolhidos.filter(c => c.stand);
    const extras = rng.sortear(outros, Math.max(2, stands.length));
    let uid = 1;
    const us: Unidade[] = extras.map(c => unidade(uid++, c.id, estrela));
    for (const c of escolhidos) {
      const u = unidade(uid++, c.id, estrela);
      if (c.stand) u.usuario = us[stands.indexOf(c)]!.uid;
      us.push(u);
    }
    const time = posicionar(us, i);
    const s = rng.semente();
    cenarios.push(b => ({
      a: { dono: 'com', lutadores: time },
      b: bonusNoTime({ dono: 'sem', lutadores: time }, b),
      semente: s,
      desligarB: [traco],
    }));
  }
  return medirEquivalente(cenarios, -0.4, 1.6, passos);
}

/**
 * Quanto vale o item: um portador sorteado (custo 2 a 4, sem Stands) com 3 bonecos; o outro lado é o mesmo time sem
 * o item. O equivalente é o bônus de vida e dano só no portador que empata.
 */
export function valorDoItem(item: string, estrela: Estrela, nCenarios: number, base = 0, passos = 7): Equivalente {
  const portadores = reais().filter(c => !c.stand && c.custo >= 2 && c.custo <= 4);
  const cenarios: Cenario[] = [];
  for (let i = 0; i < nCenarios; i++) {
    const rng = criarRng(semente(base, 'item', estrela, i));
    const c = rng.sortear(portadores, 1)[0]!;
    const com = timeComBonecos('com', unidade(1, c.id, estrela, { itens: [item] }), i);
    const s = rng.semente();
    cenarios.push(b => ({ a: com, b: timeComBonecos('sem', comBonus(unidade(1, c.id, estrela), b), i), semente: s }));
  }
  return medirEquivalente(cenarios, -0.3, 2, passos);
}

/**
 * Pacote papel + ult de uma classe: o campeão sintético da classe (custo 3) com 3 bonecos, contra o mesmo time em
 * que ele é um boneco do mesmo alcance. O equivalente é o bônus de vida e dano nesse boneco que empata.
 */
export function valorDoPacote(classe: string, estrela: Estrela, nCenarios: number, base = 0, passos = 7): Equivalente {
  const x = unidade(1, `${SINTETICO}${classe}`, estrela);
  const alcance = atributosDaUnidade(x).alcance;
  const cenarios: Cenario[] = [];
  for (let i = 0; i < nCenarios; i++) {
    const com = timeComBonecos('com', x, i);
    const s = semente(base, 'pacote', classe, estrela, i);
    cenarios.push(b => ({
      a: com,
      b: { dono: 'sem', lutadores: com.lutadores.map(l => (l.id === 'x' ? boneco('x', 3, estrela, alcance, l.casa, b) : l)) },
      semente: s,
    }));
  }
  return medirEquivalente(cenarios, -0.5, 3, passos);
}

// =================================================================================================================
// Origens: time cheio de cada origem e o ganho de evoluir
// =================================================================================================================

/** `n` campeões diferentes do grupo, com os custos que a loja do nível `limite` traz (sem o custo sorteado no grupo,
 *  o mais perto). */
function sortearPelaLoja(grupo: readonly CampeaoDados[], n: number, limite: number, rng: Rng): CampeaoDados[] {
  const resto = [...grupo];
  const chances = chancesLoja(limite);
  const out: CampeaoDados[] = [];
  while (out.length < n && resto.length) {
    const alvo = rng.pesado([1, 2, 3, 4, 5], c => chances[c - 1] ?? 0) ?? 1;
    const perto = Math.min(...resto.map(c => Math.abs(c.custo - alvo)));
    const opcoes = resto.filter(c => Math.abs(c.custo - alvo) === perto);
    const c = opcoes[rng.int(opcoes.length)]!;
    out.push(c);
    resto.splice(resto.indexOf(c), 1);
  }
  return out;
}

/**
 * Time de uma origem num tabuleiro de `limite`, na estrela, com os custos da loja daquele nível. JoJo: metade Stands,
 * metade usuários de outras origens (cada Stand precisa de um, e os dois ocupam vaga). Digimon: um terço do time é de fora (o Parceiro pede um
 * aliado de outra origem do lado). Origem que não enche o tabuleiro completa com outras.
 */
export function timeDaOrigem(fr: Origem, limite: number, estrela: Estrela, rng: Rng, variacao: number): EntradaTime {
  const outros = reais().filter(c => c.fr !== fr && !c.stand);
  let uid = 1;
  if (fr === 'jojo') {
    const s = Math.floor(limite / 2);
    const usuarios = sortearPelaLoja(outros, limite - s, limite, rng).map(c => unidade(uid++, c.id, estrela));
    const stands = sortearPelaLoja(reais().filter(c => c.stand), s, limite, rng)
      .map((c, i) => unidade(uid++, c.id, estrela, { usuario: usuarios[i]!.uid }));
    return { dono: fr, lutadores: posicionar([...usuarios, ...stands], variacao) };
  }
  const n = fr === 'digimon' ? Math.max(1, Math.min(limite - 1, Math.ceil((limite * 2) / 3))) : limite;
  const daOrigem = sortearPelaLoja(reais().filter(c => c.fr === fr), n, limite, rng);
  const todos = [...daOrigem, ...sortearPelaLoja(outros, limite - daOrigem.length, limite, rng)];
  return { dono: fr, lutadores: posicionar(todos.map(c => unidade(uid++, c.id, estrela)), variacao) };
}

/** Cada origem contra cada outra, com os times cheios de `timeDaOrigem`, dos dois lados. */
export function origemContraOrigem(limite: number, estrela: Estrela, cenarios: number, base = 0): Map<Origem, Placar> {
  const placares = new Map<Origem, Placar>(ORIGENS.map(o => [o, placarVazio()]));
  for (let i = 0; i < ORIGENS.length; i++) for (let j = i + 1; j < ORIGENS.length; j++) {
    const p = ORIGENS[i]!, q = ORIGENS[j]!;
    for (let k = 0; k < cenarios; k++) {
      const rng = criarRng(semente(base, 'origem', p, q, limite, estrela, k));
      const tp = timeDaOrigem(p, limite, estrela, rng, k);
      const tq = timeDaOrigem(q, limite, estrela, rng, k + 3);
      const s = rng.semente();
      const ida = lutar(tp, tq, s).r, volta = lutar(tq, tp, s).r;
      somarLuta(placares.get(p)!, resultadoDo(ida, 'a'));
      somarLuta(placares.get(q)!, resultadoDo(ida, 'b'));
      somarLuta(placares.get(p)!, resultadoDo(volta, 'b'));
      somarLuta(placares.get(q)!, resultadoDo(volta, 'a'));
    }
  }
  return placares;
}

/**
 * Quanto vale evoluir: os mesmos campeões da origem numa estrela a mais. O equivalente é o bônus de vida e dano no
 * time da estrela `de` que empata com o time da estrela `de` + 1 (só linhas evolutivas, com `soLinhas`).
 */
export function ganhoDeEvoluir(fr: Origem, de: 1 | 2, limite: number, nCenarios: number, base = 0, soLinhas = false, passos = 7): Equivalente {
  const grupo = reais().filter(c => c.fr === fr && !c.stand && (!soLinhas || c.niveis.length > 1));
  const acima = (de + 1) as Estrela;
  const cenarios: Cenario[] = [];
  for (let i = 0; i < nCenarios; i++) {
    const rng = criarRng(semente(base, 'evoluir', fr, de, limite, i));
    const cs = sortearPelaLoja(grupo, limite, limite, rng);
    const com = posicionar(cs.map((c, n) => unidade(n + 1, c.id, acima)), i);
    const sem = posicionar(cs.map((c, n) => unidade(n + 1, c.id, de)), i);
    const s = rng.semente();
    cenarios.push(b => ({ a: { dono: 'com', lutadores: com }, b: bonusNoTime({ dono: 'sem', lutadores: sem }, b), semente: s }));
  }
  return medirEquivalente(cenarios, 0, 8, passos);
}

// =================================================================================================================
// Composições forçadas: times focados em cada traço e em cada par origem + classe, um contra o outro
// =================================================================================================================

/** Foco de um time: uma origem, uma classe/elemento ou um par origem + classe. */
export interface Foco { id: string; origem?: Origem; classe?: string }

/** Os focos que existem no set: as 10 origens, cada classe e elemento, e os pares origem + classe com pelo menos
 *  `minPar` campeões que têm os dois (com menos, o par não fecha nem o 1º degrau). Únicos não é traço. */
export function focosDoSet(minPar = 2): Foco[] {
  const classes = Object.values(real.TRACOS).filter(t => t.tipo !== 'origem').map(t => t.id);
  const pares: Foco[] = [];
  for (const origem of ORIGENS) for (const classe of classes) {
    if (reais().filter(c => c.fr === origem && S().tracosDoCampeao(c.id).includes(classe)).length >= minPar) {
      pares.push({ id: `${origem}+${classe}`, origem, classe });
    }
  }
  return [...ORIGENS.map(origem => ({ id: origem, origem })), ...classes.map(classe => ({ id: classe, classe })), ...pares];
}

/** Sorteia `n` campeões pela loja do nível `limite`, gastando os grupos em ordem (o 2º só entra se o 1º não bastar). */
function sortearEmOrdem(grupos: readonly (readonly CampeaoDados[])[], n: number, limite: number, rng: Rng): CampeaoDados[] {
  const out: CampeaoDados[] = [];
  for (const g of grupos) {
    if (out.length >= n) break;
    out.push(...sortearPelaLoja(g.filter(c => !out.includes(c)), n - out.length, limite, rng));
  }
  return out;
}

/**
 * Time forçado de um foco num tabuleiro de `limite`, na estrela, com os custos da loja daquele nível. Origem pura:
 * `timeDaOrigem`. Classe/elemento: todos os campeões com a classe na forma da estrela (sem Stands), completando com
 * outros. Par origem + classe: primeiro quem tem os dois; o que faltar, metade da origem e metade da classe. JoJo:
 * sempre metade Stands (com a classe primeiro) e metade usuários de outras origens (também com a classe primeiro).
 * Digimon: dois terços do time é Digimon e o resto de fora (o Parceiro), com a classe primeiro nos dois.
 */
export function timeDoFoco(f: Foco, limite: number, estrela: Estrela, rng: Rng, variacao: number): EntradaTime {
  const { origem, classe } = f;
  if (!classe) return timeDaOrigem(origem!, limite, estrela, rng, variacao);
  const temClasse = (c: CampeaoDados) => S().forma(S().formaPadrao(c.id, estrela)).classes.includes(classe);
  const comClasseOuNao = (g: readonly CampeaoDados[]) => [g.filter(temClasse), g.filter(c => !temClasse(c))];
  const normais = reais().filter(c => !c.stand);
  const fora = normais.filter(c => c.fr !== origem);
  let uid = 1;
  const un = (c: CampeaoDados, extra: Partial<Unidade> = {}) => unidade(uid++, c.id, estrela, extra);
  let escolhidos: CampeaoDados[];
  if (origem === 'jojo') {
    const s = Math.floor(limite / 2);
    const usuarios = sortearEmOrdem(comClasseOuNao(fora), limite - s, limite, rng).map(c => un(c));
    const stands = sortearEmOrdem(comClasseOuNao(reais().filter(c => c.stand)), s, limite, rng)
      .map((c, i) => un(c, { usuario: usuarios[i]!.uid }));
    return { dono: f.id, lutadores: posicionar([...usuarios, ...stands], variacao) };
  }
  if (origem === 'digimon') {
    const n = Math.max(1, Math.min(limite - 1, Math.ceil((limite * 2) / 3)));
    const daOrigem = sortearEmOrdem(comClasseOuNao(normais.filter(c => c.fr === origem)), n, limite, rng);
    escolhidos = [...daOrigem, ...sortearEmOrdem(comClasseOuNao(fora), limite - daOrigem.length, limite, rng)];
  } else if (origem) {
    const daOrigem = normais.filter(c => c.fr === origem);
    const juntos = sortearPelaLoja(daOrigem.filter(temClasse), limite, limite, rng);
    const falta = limite - juntos.length;
    const soOrigem = sortearPelaLoja(daOrigem.filter(c => !temClasse(c)), Math.ceil(falta / 2), limite, rng);
    const soClasse = sortearPelaLoja(fora.filter(temClasse), falta - soOrigem.length, limite, rng);
    escolhidos = [...juntos, ...soOrigem, ...soClasse];
    escolhidos.push(...sortearEmOrdem([normais], limite - escolhidos.length, limite, rng));
  } else {
    escolhidos = sortearEmOrdem([normais.filter(temClasse), normais], limite, limite, rng);
  }
  return { dono: f.id, lutadores: posicionar(escolhidos.map(c => un(c)), variacao) };
}

export interface ResultadoFocos {
  /** id do foco → placar */
  focos: Map<string, Placar>;
  /** id do campeão → placar de todas as lutas em que apareceu */
  campeoes: Map<string, Placar>;
  lutas: number;
}

/** Cada foco contra `oponentes` focos sorteados (cada confronto dos dois lados); conta pros dois focos e pra todo
 *  campeão que aparece. */
export function focosEmConfronto(focos: readonly Foco[], limite: number, estrela: Estrela, oponentes: number, base = 0): ResultadoFocos {
  const placarDe = (m: Map<string, Placar>, id: string) => {
    let p = m.get(id);
    if (!p) m.set(id, (p = placarVazio()));
    return p;
  };
  const r: ResultadoFocos = { focos: new Map(focos.map(f => [f.id, placarVazio()])), campeoes: new Map(), lutas: 0 };
  const somarTime = (f: Foco, t: EntradaTime, res: 'vitoria' | 'derrota' | 'empate') => {
    somarLuta(placarDe(r.focos, f.id), res);
    for (const l of t.lutadores) if (l.unidade) somarLuta(placarDe(r.campeoes, l.unidade.campeao), res);
  };
  focos.forEach((f, i) => {
    for (let k = 0; k < oponentes; k++) {
      const rng = criarRng(semente(base, 'foco', f.id, limite, estrela, k));
      const j = rng.int(focos.length - 1);
      const g = focos[j >= i ? j + 1 : j]!;
      const tf = timeDoFoco(f, limite, estrela, rng, k);
      const tg = timeDoFoco(g, limite, estrela, rng, k + 3);
      const s = rng.semente();
      const ida = lutar(tf, tg, s).r, volta = lutar(tg, tf, s).r;
      somarTime(f, tf, resultadoDo(ida, 'a'));
      somarTime(g, tg, resultadoDo(ida, 'b'));
      somarTime(f, tf, resultadoDo(volta, 'b'));
      somarTime(g, tg, resultadoDo(volta, 'a'));
      r.lutas += 2;
    }
  });
  return r;
}

/**
 * Vale botar 2 Stands num time normal? O mesmo time de `limite` campeões normais, com 2 deles trocados por 2 Stands
 * (presos a 2 dos normais que ficam), contra ele sem Stand. Passar muito de 50% faria todo mundo querer: os Stands
 * viram obrigação (docs/tft/roadmap.md, seção dos Stands).
 */
export function doisStandsNoTime(limite: number, estrela: Estrela, cenarios: number, base = 0): Placar {
  const placar = placarVazio();
  for (let k = 0; k < cenarios; k++) {
    const rng = criarRng(semente(base, 'dois-stands', limite, estrela, k));
    const normais = sortearPelaLoja(reais().filter(c => !c.stand), limite, limite, rng);
    const stands = sortearPelaLoja(reais().filter(c => c.stand), 2, limite, rng);
    const sem = normais.map((c, i) => unidade(i + 1, c.id, estrela));
    const ficam = sem.slice(0, limite - 2);
    const com = [...ficam, ...stands.map((c, i) => unidade(limite - 1 + i, c.id, estrela, { usuario: ficam[i]!.uid }))];
    const tc: EntradaTime = { dono: 'com', lutadores: posicionar(com, k) };
    const ts: EntradaTime = { dono: 'sem', lutadores: posicionar(sem, k + 3) };
    const s = rng.semente();
    somarLuta(placar, resultadoDo(lutar(tc, ts, s).r, 'a'));
    somarLuta(placar, resultadoDo(lutar(ts, tc, s).r, 'b'));
  }
  return placar;
}

/** Todos os itens: 7 componentes e 28 completos, na ordem de COMPONENTES. */
export function idsDosItens(): string[] {
  const out: string[] = [...COMPONENTES];
  for (let i = 0; i < COMPONENTES.length; i++) for (let j = i; j < COMPONENTES.length; j++) {
    out.push(real.combinar(COMPONENTES[i]!, COMPONENTES[j]!));
  }
  return out;
}
