// Motor de combate da Autobatalha: monta os lutadores dos dois times (atributos, traços, itens, Stands), roda a luta
// em passos de 0,1 s com semente (a mesma entrada dá a mesma luta) e devolve o resultado, com a gravação pra tela
// quando pedida. Regras em docs/tft/autobatalha.md, seções "Atributos" e "Luta".
//
// Ids no resultado e na gravação: `${lado}:${EntradaLutador.id}` ("a:12", "b:m0"); invocado: `${id do dono}~inv${n}`
// ("a:12~inv1"). separarId (lutador.ts) desfaz.
//
// Combinados com o conteúdo (habilidades, traços e itens):
// - emVolta pega quem está a até `raio` casas do centro, inclusive o próprio centro (distância 0) se for do lado pedido.
// - Quem está `intocavel` não vira alvo de ataque nem é escolhido por maisProximo/maisLonge/menosVida/maisVida, mas é
//   atingido por área (emVolta, emLinha, emCone).
// - dano/danoFixo: tipo padrão 'magico' durante o lançamento e 'fisico' fora; crítico padrão 'pode' no físico e
//   'nunca' no resto. Durante `lancar` (e nos depois/aCada agendados nele) o dano conta como golpe recebido (dá
//   mana a quem recebe) e, com RegrasMotor.poder, dano, cura e escudo multiplicam pelo poder do lançador.
// - Mana: +MANA_ATAQUE por ataque; golpe recebido (ataque ou habilidade) dá mana pela fração da vida máxima que
//   tirou (MANA_POR_VIDA por vida inteira), até MANA_GOLPE_MAX por golpe. Quem tem mais vida enche mais devagar
//   apanhando: tanque não lança mais rápido só por estar na frente.
// - RegrasMotor: poder, LoL ★3 dobrado e +15% de vel. ataque na transformação podem ficar no motor ou no conteúdo
//   (index.ts escolhe; hoje o conteúdo faz os três).
// - status sem valor: lento 0,3; queimando 0,01; vulneravel, fraco e refletir 0,2. Reaplicar fica com o maior valor e
//   o fim mais tarde. memoria['imune:<status>'] = até quando (segundos de luta) o lutador ignora aquele status (Robô).
// - aoMorrer: traços do lado do morto em que ele é membro e, se quem matou é inimigo, os traços do lado dele em que
//   ele é membro; itens do morto e de quem matou. O status do morto ainda vale no gancho (Fogo: "morreu queimando").
// - maisVida = mais pontos de vida; menosVida = menor fração de vida.
// - Erro dentro do conteúdo não derruba a luta: o gancho para ali e o erro vai pro console uma vez por luta.
import { S } from '../dados';
import { cone, dentro, distancia as distanciaHex, paraLuta, retaAteBorda, vizinhas } from '../hex';
import { criarRng, type Rng } from '../rng';
import {
  COLUNAS, LINHAS, LINHAS_DONO,
  type Atributos, type Casa, type Contexto, type EfeitoVisual, type EntradaLutador, type EntradaTime, type EstadoVisivel,
  type EventoLuta, type Item, type Lado, type Lutador, type NomeAtributo, type OpcoesDano, type Quadro, type ResultadoLuta,
  type Status, type TipoDano, type Unidade,
} from '../tipos';
import { CRIT_CHANCE, CRIT_DANO, baseDaUnidade, bonusDaUnidade, bonusZero, papelDe, somarBonus } from './atributos';
import { HABILIDADE_CHEFE } from './chefe';
import type { Conteudo, TracoAtivo } from './contrato';
import { LutadorInterno, idLuta, type TracoNoLado } from './lutador';

/** segundos por passo */
export const PASSO = 0.1;
/** fim por tempo, em segundos */
export const DURACAO_MAX = 30;
const PASSOS_POR_SEGUNDO = 10;
/** segundos pra andar uma casa */
const TEMPO_POR_CASA = 0.5;
export const MANA_ATAQUE = 10;
/** mana por apanhar: perder a vida máxima inteira daria isto (antes do teto por golpe) */
export const MANA_POR_VIDA = 40;
/** teto de mana por golpe recebido */
export const MANA_GOLPE_MAX = 5;
/** a transformação multiplica a vel. de ataque por isto (com RegrasMotor.velTransformar) */
const VEL_TRANSFORMAR = 1.15;
/** queimadura: cura recebida ×0,67 (33% a menos) */
const CURA_QUEIMANDO = 0.67;
/** ganchos chamando ganchos: para nesta profundidade */
const MAX_PROFUNDIDADE = 5;
const STATUS_RUINS: readonly Status[] = ['atordoado', 'lento', 'queimando', 'provocado', 'semMana', 'vulneravel', 'fraco', 'semCura'];
const VALOR_PADRAO: Partial<Record<Status, number>> = { lento: 0.3, queimando: 0.01, vulneravel: 0.2, fraco: 0.2, refletir: 0.2 };
const LADOS: readonly Lado[] = ['a', 'b'];
const outro = (l: Lado): Lado => (l === 'a' ? 'b' : 'a');

// Tabuleiro em índices (lin * COLUNAS + col), com vizinhas e distâncias prontas.
const N = COLUNAS * LINHAS;
const CASAS: readonly Casa[] = Array.from({ length: N }, (_, i) => Object.freeze({ col: i % COLUNAS, lin: Math.floor(i / COLUNAS) }));
const indice = (c: Casa) => c.lin * COLUNAS + c.col;
const VIZ: readonly (readonly number[])[] = CASAS.map(c => vizinhas(c).map(indice));
const DIST = new Int8Array(N * N);
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) DIST[i * N + j] = distanciaHex(CASAS[i]!, CASAS[j]!);
const dist = (i: number, j: number) => DIST[i * N + j]!;
/** todas as casas em ordem de distância de cada casa */
const PERTO: readonly (readonly number[])[] = CASAS.map((_, i) =>
  Array.from({ length: N }, (_, j) => j).sort((p, q) => dist(i, p) - dist(i, q) || p - q));

const casaDe = (x: Lutador | Casa): Casa => ('casa' in x ? x.casa : x);
const copiaCasa = (c: Casa): Casa => ({ col: c.col, lin: c.lin });

type FonteDano = 'ataque' | 'habilidade' | 'efeito' | 'refletido';
interface Temporizador { t: number; ordem: number; fn: () => void; lancando: LutadorInterno | null }

/** Regras que o motor aplica por conta própria ou deixa pro conteúdo. O que estiver ligado aqui não pode estar
 *  também no conteúdo, senão conta duas vezes. */
export interface RegrasMotor {
  /** dano, cura e escudo do Contexto multiplicam pelo poder do lançador durante a habilidade */
  poder: boolean;
  /** LoL ★3: a cada 2 lançamentos, a habilidade sai duas vezes seguidas */
  lolDobrado: boolean;
  /** ctx.transformar também multiplica a vel. de ataque por 1,15 */
  velTransformar: boolean;
}
export const REGRAS_TODAS: RegrasMotor = { poder: true, lolDobrado: true, velTransformar: true };

/** De onde veio a mana: o próprio ataque, um golpe recebido (ataque ou habilidade inimiga) ou o conteúdo (ctx.mana). */
export type FonteMana = 'ataque' | 'golpe' | 'conteudo';
/** Quem olha a luta de fora (o playtest, src/autobatalha/equilibrio): não muda nada nela. */
export interface ObservadorLuta {
  /** mana que entrou de fato (depois do teto) */
  mana?(l: Lutador, fonte: FonteMana, ganho: number): void;
  morte?(l: Lutador, t: number): void;
}

/** Roda uma luta com o conteúdo dado. index.ts liga o conteúdo de verdade (simularLuta). */
export function simularLutaCom(
  c: Conteudo, a: EntradaTime, b: EntradaTime, semente: number, gravar: boolean, regras: RegrasMotor = REGRAS_TODAS,
  observador?: ObservadorLuta,
): ResultadoLuta {
  return new Luta(c, regras, a, b, semente, gravar, observador).rodar();
}

class Luta implements Contexto {
  t = 0;
  private readonly rng: Rng;
  /** lado A, lado B e os invocados, na ordem em que entraram */
  private readonly todos: LutadorInterno[] = [];
  private readonly porLado: Record<Lado, LutadorInterno[]> = { a: [], b: [] };
  private readonly tracosLado: Record<Lado, TracoNoLado[]> = { a: [], b: [] };
  /** quem está em cada casa (só vivos) */
  private readonly ocup: (LutadorInterno | null)[] = new Array<LutadorInterno | null>(N).fill(null);
  /** vivos que decidem a luta (invocados não contam) */
  private readonly restam: Record<Lado, number> = { a: 0, b: 0 };
  private readonly danoPor: Record<string, number> = {};
  private readonly abatesPor: Record<string, number> = {};
  private readonly ouroPor = { a: 0, b: 0 };
  private readonly moedas: NonNullable<ResultadoLuta['moedas']> = [];
  private readonly eventos: EventoLuta[] = [];
  private readonly quadros: Quadro[] = [];
  private temporizadores: Temporizador[] = [];
  private ordem = 0;
  /** quem está lançando a habilidade agora (poder, tipo de dano padrão) */
  private lancando: LutadorInterno | null = null;
  private profundidade = 0;
  private avisou = false;
  private readonly campo = new Int16Array(N);
  private readonly fila = new Int16Array(N);

  constructor(
    private readonly c: Conteudo, private readonly regras: RegrasMotor, a: EntradaTime, b: EntradaTime, semente: number,
    private readonly gravar: boolean, private readonly obs?: ObservadorLuta,
  ) {
    this.rng = criarRng(semente);
    this.montarTime(a, 'a');
    this.montarTime(b, 'b');
  }

  get tempo(): number { return this.t; }

  rodar(): ResultadoLuta {
    const inicial = this.gravar ? this.todos.map(l => this.estadoVisivel(l)) : [];
    this.comecar();
    let vencedor = this.decidido();
    let n = 0;
    while (vencedor === null && n < DURACAO_MAX * PASSOS_POR_SEGUNDO) {
      n++;
      this.t = n / PASSOS_POR_SEGUNDO;
      this.passo(n);
      if (this.gravar) this.quadros.push(this.quadro());
      vencedor = this.decidido();
    }
    vencedor ??= this.porVida();
    const vivos = (lado: Lado) => this.porLado[lado].filter(l => l.vivo).map(l => l.id);
    const r: ResultadoLuta = {
      vencedor, vivosA: vivos('a'), vivosB: vivos('b'), duracao: this.t, dano: this.danoPor, abates: this.abatesPor, ouro: this.ouroPor,
    };
    if (this.moedas.length) r.moedas = this.moedas;
    if (this.gravar) r.gravacao = { passo: PASSO, inicial, quadros: this.quadros, eventos: this.eventos };
    return r;
  }

  // =============================================================================================================
  // Montagem
  // =============================================================================================================

  private montarTime(time: EntradaTime, lado: Lado): void {
    const s = S();
    const comuns: EntradaLutador[] = [], stands: EntradaLutador[] = [];
    for (const e of time.lutadores) (e.unidade && s.campeao(e.unidade.campeao).stand ? stands : comuns).push(e);
    const porUid = new Map<number, LutadorInterno>();
    const unidades: LutadorInterno[] = [];
    const criar = (e: EntradaLutador): LutadorInterno | null => {
      const idx = this.casaInicial(paraLuta(e.casa, lado), lado);
      if (idx < 0) return null;
      const l = e.unidade ? this.criarUnidade(e.id, e.unidade, lado, idx) : e.monstro ? this.criarMonstro(e.id, e.monstro, lado, idx) : null;
      if (l) this.entrar(l);
      return l;
    };
    for (const e of comuns) {
      const l = criar(e);
      if (l?.unidade) { porUid.set(l.unidade.uid, l); unidades.push(l); }
    }
    // Stand só entra com o usuário no time, um por usuário
    for (const e of stands) {
      const usuario = e.unidade?.usuario != null ? porUid.get(e.unidade.usuario) : undefined;
      if (!usuario || usuario.standDele) continue;
      const l = criar(e);
      if (!l) continue;
      l.usuario = usuario;
      usuario.standDele = l;
      unidades.push(l);
    }
    this.ativarTracos(unidades, lado);
    for (const l of this.porLado[lado]) {
      l.recalcular();
      l.vida = l.at.vida;
      l.mana = l.at.manaInicial;
      l.maxVisto = [Math.round(l.at.vida), Math.round(l.at.mana)];
    }
  }

  /** a casa pedida, ou a livre mais perto dela na metade do lado (casa repetida ou fora do tabuleiro) */
  private casaInicial(c: Casa, lado: Lado): number {
    if (dentro(c) && !this.ocup[indice(c)]) return indice(c);
    const ref = dentro(c) ? indice(c) : indice({ col: 0, lin: lado === 'a' ? LINHAS_DONO : LINHAS_DONO - 1 });
    const naMetade = (i: number) => (lado === 'a' ? CASAS[i]!.lin >= LINHAS_DONO : CASAS[i]!.lin < LINHAS_DONO);
    for (const i of PERTO[ref]!) if (!this.ocup[i] && naMetade(i)) return i;
    return -1;
  }

  private criarUnidade(id: string, u: Unidade, lado: Lado, idx: number): LutadorInterno {
    const s = S();
    const forma = s.forma(u.forma), camp = s.campeao(u.campeao);
    const habilidade = this.c.habilidadeDa(forma, u.ult);
    const itens: Item[] = [];
    for (const i of u.itens) {
      const item = this.c.ITENS[i];
      if (item) itens.push(item);
    }
    // passiva do campeão: roda junto com os ganchos dos itens (sem atributos)
    const passiva = this.c.passivaDe?.(camp.id);
    if (passiva) itens.push({ ...passiva, id: `passiva:${camp.id}`, atributos: {} });
    return new LutadorInterno(this, {
      id: idLuta(lado, id), lado, forma: forma.id, campeao: camp.id, fr: forma.fr, classes: forma.classes, estrela: u.estrela,
      custo: camp.custo, nome: forma.nome, img: forma.img, papel: papelDe(forma), base: baseDaUnidade(u, habilidade),
      bonus: bonusDaUnidade(u, this.c), habilidade, itens, unidade: u, stand: !!camp.stand, invocado: false, monstro: false,
      chefe: false,
    }, CASAS[idx]!, idx);
  }

  private criarMonstro(id: string, m: NonNullable<EntradaLutador['monstro']>, lado: Lado, idx: number): LutadorInterno {
    const habilidade = m.chefe ? HABILIDADE_CHEFE : null;
    const base: Atributos = { ...m.atributos };
    if (habilidade) base.mana = habilidade.mana;
    const nome = `ff:${m.dados.nome}`;
    return new LutadorInterno(this, {
      id: idLuta(lado, id), lado, forma: nome, campeao: nome, fr: 'ff', classes: [], estrela: 1, custo: m.chefe ? 5 : 1,
      nome: m.dados.nome, img: m.dados.img, papel: '', base, bonus: bonusZero(), habilidade, itens: [], unidade: null,
      stand: false, invocado: false, monstro: true, chefe: m.chefe,
    }, CASAS[idx]!, idx);
  }

  private entrar(l: LutadorInterno): void {
    this.todos.push(l);
    this.porLado[l.lado].push(l);
    this.ocup[l.idx] = l;
    if (!l.invocado) this.restam[l.lado]++;
    this.danoPor[l.id] = 0;
    this.abatesPor[l.id] = 0;
  }

  /** conta os traços do time pela forma atual, soma os atributos de cada degrau ativo e guarda quem recebe os ganchos */
  private ativarTracos(unidades: LutadorInterno[], lado: Lado): void {
    if (!unidades.length) return;
    let ativos: TracoAtivo[] = [];
    try {
      ativos = this.c.contarTracos(unidades.map(l => ({ campeao: l.campeao, forma: l.forma })));
    } catch (e) { this.falha(e); }
    for (const ta of ativos) {
      const traco = this.c.TRACOS[ta.id];
      if (!traco || ta.nivel < 0) continue;
      const tn: TracoNoLado = { traco, id: ta.id, nivel: ta.nivel, lado, membros: [] };
      let at: Partial<Record<NomeAtributo, number>> = {};
      try {
        at = traco.atributos?.(ta.nivel) ?? {};
      } catch (e) { this.falha(e); }
      for (const l of unidades) {
        if (traco.alcance !== 'time' && l.fr !== ta.id && !l.classes.includes(ta.id)) continue;
        tn.membros.push(l);
        l.tracos.push(tn);
        somarBonus(l.bonus, at);
      }
      this.tracosLado[lado].push(tn);
    }
  }

  /** ganchos de começo (traços, depois itens) e o salto dos assassinos */
  private comecar(): void {
    for (const lado of LADOS) for (const tn of this.tracosLado[lado]) {
      if (!tn.traco.aoComecar) continue;
      const membros = tn.membros.filter(x => x.vivo);
      this.protegido(() => tn.traco.aoComecar?.(this, tn.nivel, membros), null);
    }
    for (const l of [...this.todos]) for (const it of l.itens) {
      if (it.aoComecar && l.vivo) this.protegido(() => it.aoComecar?.(this, l, [l]), null);
    }
    for (const l of [...this.todos]) if (l.vivo && l.papel === 'assassino') this.saltar(l);
    if (this.gravar) this.quadros.push(this.quadro());
  }

  /** assassino: vai pra casa livre mais perto da última linha inimiga (a mais perto dele, nessa linha) */
  private saltar(l: LutadorInterno): void {
    for (let k = 0; k < LINHAS_DONO; k++) {
      const lin = l.lado === 'a' ? k : LINHAS - 1 - k;
      let melhor = -1;
      for (let col = 0; col < COLUNAS; col++) {
        const i = lin * COLUNAS + col;
        if (!this.ocup[i] && (melhor < 0 || dist(l.idx, i) < dist(l.idx, melhor))) melhor = i;
      }
      if (melhor >= 0) { this.colocar(l, melhor); return; }
    }
  }

  // =============================================================================================================
  // Passo
  // =============================================================================================================

  private passo(n: number): void {
    for (const l of this.todos) if (l.vivo) this.expirar(l);
    this.rodarTemporizadores();
    if (n % (PASSOS_POR_SEGUNDO / 2) === 0) this.queimar();
    if (n % PASSOS_POR_SEGUNDO === 0) this.porSegundo();
    // alterna quem age primeiro (lado A num passo, B no outro)
    const lista = this.todos, total = lista.length;
    if (n % 2 === 0) for (let i = 0; i < total && !this.acabou(); i++) this.agir(lista[i]!);
    else for (let i = total - 1; i >= 0 && !this.acabou(); i--) this.agir(lista[i]!);
  }

  private acabou(): boolean { return this.restam.a === 0 || this.restam.b === 0; }

  private decidido(): Lado | 'empate' | null {
    const { a, b } = this.restam;
    if (a > 0 && b > 0) return null;
    return a > 0 ? 'a' : b > 0 ? 'b' : 'empate';
  }

  /** fim por tempo: maior soma de fração de vida dos que decidem */
  private porVida(): Lado | 'empate' {
    const soma = (lado: Lado) => this.porLado[lado].reduce((s, l) => s + (l.vivo && !l.invocado ? l.vida / l.at.vida : 0), 0);
    const a = soma('a'), b = soma('b');
    return Math.abs(a - b) < 1e-9 ? 'empate' : a > b ? 'a' : 'b';
  }

  private expirar(l: LutadorInterno): void {
    if (l.escudos.length) {
      let k = 0;
      for (const e of l.escudos) if (e.fim > this.t && e.valor > 0.01) l.escudos[k++] = e;
      l.escudos.length = k;
    }
    if (l.buffs.length) {
      const limite = this.t + 1e-9;
      const vencidos = l.buffs.filter(b => b.fim <= limite);
      if (vencidos.length) {
        l.buffs = l.buffs.filter(b => b.fim > limite);
        for (const b of vencidos) this.mudarBonus(l, b.atributo, -b.valor);
      }
    }
  }

  private rodarTemporizadores(): void {
    if (!this.temporizadores.length) return;
    const limite = this.t + 1e-9;
    const vencidos = this.temporizadores.filter(x => x.t <= limite);
    if (!vencidos.length) return;
    this.temporizadores = this.temporizadores.filter(x => x.t > limite);
    vencidos.sort((p, q) => p.t - q.t || p.ordem - q.ordem);
    for (const x of vencidos) this.protegido(x.fn, x.lancando);
  }

  /** queimadura: a cada 0,5 s, meia fração da vida máxima (dano verdadeiro, de quem pôs o fogo) */
  private queimar(): void {
    for (const l of this.todos) {
      if (!l.vivo) continue;
      const q = l.st.queimando;
      if (q && q.fim > this.t) this.aplicarDano(q.fonte, l, q.valor * l.at.vida * 0.5, 'verdadeiro', false, false, 'efeito');
    }
  }

  private porSegundo(): void {
    for (const lado of LADOS) for (const tn of this.tracosLado[lado]) {
      if (!tn.traco.porSegundo) continue;
      const membros = tn.membros.filter(x => x.vivo);
      if (membros.length) this.protegido(() => tn.traco.porSegundo?.(this, tn.nivel, membros), null);
    }
    for (const l of [...this.todos]) for (const it of l.itens) {
      if (it.porSegundo && l.vivo) this.protegido(() => it.porSegundo?.(this, l, [l]), null);
    }
  }

  private agir(l: LutadorInterno): void {
    if (!l.vivo || l.temStatus('atordoado')) return;
    const alvo = this.escolherAlvo(l);
    if (l.habilidade && l.mana >= l.at.mana) { this.lancar(l, alvo); return; }
    if (!alvo) return;
    const ritmo = Math.max(0, 1 - l.valorStatus('lento'));
    const d = dist(l.idx, alvo.idx);
    if (d <= l.at.alcance) {
      l.accAtaque += PASSO * l.at.velAtaque * ritmo;
      if (l.accAtaque >= 1) {
        l.accAtaque = Math.min(l.accAtaque - 1, 1);
        this.atacar(l, alvo, d);
      }
    } else {
      l.accPasso += PASSO * ritmo;
      if (l.accPasso >= TEMPO_POR_CASA - 1e-9) {
        if (this.andar(l, alvo)) l.accPasso -= TEMPO_POR_CASA;
        else l.accPasso = TEMPO_POR_CASA - PASSO; // bloqueado: tenta de novo no próximo passo
      }
    }
  }

  private alvoValido(l: LutadorInterno, x: LutadorInterno | null): x is LutadorInterno {
    return !!x && x.vivo && x.lado !== l.lado && !x.temStatus('intocavel');
  }

  /** provocador; senão o alvo atual se ainda está no alcance; senão o inimigo mais perto (empate: fica o atual) */
  private escolherAlvo(l: LutadorInterno): LutadorInterno | null {
    const prov = l.st.provocado;
    if (prov && prov.fim > this.t && this.alvoValido(l, prov.fonte)) return (l.alvo = prov.fonte);
    const atual = this.alvoValido(l, l.alvo) ? l.alvo : null;
    if (atual && dist(l.idx, atual.idx) <= l.at.alcance) return atual;
    let melhor = atual, md = atual ? dist(l.idx, atual.idx) : Infinity;
    for (const x of this.porLado[outro(l.lado)]) {
      if (x === atual || !x.vivo || x.temStatus('intocavel')) continue;
      const d = dist(l.idx, x.idx);
      if (d < md) { md = d; melhor = x; }
    }
    return (l.alvo = melhor);
  }

  /** um passo pela menor rota até uma casa de onde alcança o alvo, sem entrar em casa ocupada */
  private andar(l: LutadorInterno, alvo: LutadorInterno): boolean {
    const campo = this.campo, fila = this.fila, alc = l.at.alcance, ai = alvo.idx;
    const livre = (i: number) => { const o = this.ocup[i]; return !o || o === l; };
    let ini = 0, fim = 0;
    for (let i = 0; i < N; i++) {
      if (livre(i) && dist(i, ai) <= alc) { campo[i] = 0; fila[fim++] = i; } else campo[i] = -1;
    }
    while (ini < fim) {
      const x = fila[ini++]!;
      for (const v of VIZ[x]!) if (campo[v]! < 0 && livre(v)) { campo[v] = campo[x]! + 1; fila[fim++] = v; }
    }
    let melhor = -1, mc = Infinity, md = Infinity;
    for (const v of VIZ[l.idx]!) {
      if (this.ocup[v]) continue;
      const cv = campo[v]! < 0 ? Infinity : campo[v]!, dv = dist(v, ai);
      if (cv < mc || (cv === mc && dv < md)) { melhor = v; mc = cv; md = dv; }
    }
    // sem rota: só anda se chegar mais perto
    if (melhor < 0 || (mc === Infinity && md >= dist(l.idx, ai))) return false;
    this.colocar(l, melhor);
    return true;
  }

  private colocar(l: LutadorInterno, i: number): void {
    if (this.ocup[l.idx] === l) this.ocup[l.idx] = null;
    l.idx = i;
    l.casa = CASAS[i]!;
    this.ocup[i] = l;
  }

  private atacar(l: LutadorInterno, alvo: LutadorInterno, d: number): void {
    if (this.gravar) this.eventos.push({ t: this.t, tipo: 'ataque', de: l.id, para: alvo.id, distancia: d });
    this.ganharMana(l, MANA_ATAQUE, 'ataque');
    if (alvo.at.desvio > 0 && this.rng() < alvo.at.desvio) {
      if (this.gravar) this.eventos.push({ t: this.t, tipo: 'texto', para: alvo.id, texto: 'Desviou' });
      return;
    }
    let v = l.at.dano, critico = false;
    if (this.rng() < l.at.critChance) { v *= l.at.critDano; critico = true; }
    const causado = this.aplicarDano(l, alvo, v, 'fisico', critico, false, 'ataque');
    if (l.tracos.length || l.itens.length) this.protegido(() => {
      for (const tn of l.tracos) tn.traco.aoAtacar?.(this, tn.nivel, l, alvo, causado);
      for (const it of l.itens) it.aoAtacar?.(this, l, l, alvo, causado);
    }, null);
  }

  /** gasta a mana (a sobra passa) e lança; LoL ★3 lança duas vezes a cada 2 lançamentos */
  private lancar(l: LutadorInterno, alvo: LutadorInterno | null): void {
    l.mana = Math.max(0, l.mana - l.at.mana);
    l.lancamentos++;
    const vezes = this.regras.lolDobrado && l.fr === 'lol' && l.estrela === 3 && l.lancamentos % 2 === 0 ? 2 : 1;
    let a = alvo;
    for (let i = 0; i < vezes && l.vivo; i++) {
      const h = l.habilidade;
      if (!h) break;
      if (i > 0 && !this.alvoValido(l, a)) a = this.escolherAlvo(l);
      if (this.gravar) this.eventos.push({ t: this.t, tipo: 'habilidade', de: l.id, nome: h.nome });
      this.protegido(() => h.lancar(this, l, a), l);
    }
    if (l.tracos.length || l.itens.length) this.protegido(() => {
      for (const tn of l.tracos) tn.traco.aoLancar?.(this, tn.nivel, l);
      for (const it of l.itens) it.aoLancar?.(this, l, l);
    }, null);
  }

  // =============================================================================================================
  // Dano, cura, morte
  // =============================================================================================================

  private aplicarDano(
    de: LutadorInterno | null, para: LutadorInterno, bruto: number, tipo: TipoDano, critico: boolean, ignoraDefesa: boolean, fonte: FonteDano,
  ): number {
    if (!para.vivo || !(bruto > 0)) return 0;
    let v = bruto;
    if (de) v *= Math.max(0, 1 - de.valorStatus('fraco'));
    v *= 1 + para.valorStatus('vulneravel');
    if (!ignoraDefesa && tipo !== 'verdadeiro') v *= 100 / (100 + Math.max(0, tipo === 'fisico' ? para.at.armadura : para.at.resist));
    if (para.temStatus('invulneravel')) return 0;
    const resto = ignoraDefesa ? v : para.absorver(v);
    const tirado = Math.min(resto, para.vida);
    para.vida -= resto;
    const causado = v - resto + tirado;
    if (de) this.danoPor[de.id] = (this.danoPor[de.id] ?? 0) + causado;
    if (this.gravar) this.eventos.push({ t: this.t, tipo: 'dano', para: para.id, valor: Math.round(v), critico, danoTipo: tipo });
    if ((fonte === 'ataque' || fonte === 'habilidade') && causado > 0) {
      this.ganharMana(para, Math.min(MANA_GOLPE_MAX, (MANA_POR_VIDA * causado) / Math.max(1, para.at.vida)), 'golpe');
    }
    if (de && fonte !== 'refletido') {
      if (de.vivo && de.at.rouboVida > 0 && causado > 0) this.curarInterno(de, causado * de.at.rouboVida);
      const refletir = para.valorStatus('refletir');
      if (refletir > 0 && de !== para && de.vivo) this.aplicarDano(para, de, causado * refletir, 'verdadeiro', false, false, 'refletido');
    }
    if (para.vida <= 0) this.morrer(para, de);
    else if (causado > 0 && (para.tracos.length || para.itens.length)) this.protegido(() => {
      for (const tn of para.tracos) tn.traco.aoReceberDano?.(this, tn.nivel, para, de, causado);
      for (const it of para.itens) it.aoReceberDano?.(this, para, para, de, causado);
    }, null);
    return causado;
  }

  private danoBruto(de: LutadorInterno, para: LutadorInterno, valor: number, op?: OpcoesDano): number {
    const tipo = op?.tipo ?? (this.lancando ? 'magico' : 'fisico');
    let v = valor;
    v *= this.poderAgora();
    v += op?.extra ?? 0;
    const modo = op?.critico ?? (tipo === 'fisico' ? 'pode' : 'nunca');
    const critico = modo === 'sempre' || (modo === 'pode' && this.rng() < de.at.critChance);
    if (critico) v *= de.at.critDano;
    return this.aplicarDano(de, para, v, tipo, critico, op?.ignoraDefesa ?? false, this.lancando ? 'habilidade' : 'efeito');
  }

  private curarInterno(para: LutadorInterno, valor: number): number {
    if (!para.vivo || !(valor > 0) || para.temStatus('semCura')) return 0;
    const v = para.temStatus('queimando') ? valor * CURA_QUEIMANDO : valor;
    const c = Math.min(v, para.at.vida - para.vida);
    if (c <= 0) return 0;
    para.vida += c;
    if (this.gravar && c >= 1) this.eventos.push({ t: this.t, tipo: 'cura', para: para.id, valor: Math.round(c) });
    return c;
  }

  private ganharMana(l: LutadorInterno, n: number, fonte: FonteMana): void {
    if (!l.vivo || l.temStatus('semMana')) return;
    const antes = l.mana;
    l.mana = Math.min(l.mana + n, l.habilidade ? l.at.mana * 2 : l.at.mana);
    if (this.obs?.mana && l.mana > antes) this.obs.mana(l, fonte, l.mana - antes);
  }

  private morrer(l: LutadorInterno, abatedor: LutadorInterno | null): void {
    if (!l.vivo) return;
    l.vivo = false;
    this.obs?.morte?.(l, this.t);
    l.vida = 0;
    if (this.ocup[l.idx] === l) this.ocup[l.idx] = null;
    if (!l.invocado) this.restam[l.lado]--;
    if (this.gravar) this.eventos.push({ t: this.t, tipo: 'morte', id: l.id });
    const inimigo = abatedor && abatedor.lado !== l.lado ? abatedor : null;
    if (inimigo) this.abatesPor[inimigo.id] = (this.abatesPor[inimigo.id] ?? 0) + 1;
    this.protegido(() => {
      for (const tn of l.tracos) tn.traco.aoMorrer?.(this, tn.nivel, l, abatedor);
      for (const it of l.itens) it.aoMorrer?.(this, l, l, abatedor);
      if (!inimigo) return;
      for (const tn of inimigo.tracos) tn.traco.aoMorrer?.(this, tn.nivel, l, abatedor);
      for (const it of inimigo.itens) it.aoMorrer?.(this, inimigo, l, abatedor);
    }, null);
    if (l.vivo) return; // reviveu num gancho (Anjo)
    l.mana = 0;
    l.escudos = [];
    l.st = {};
    l.buffs = [];
    l.alvo = null;
    // morte ligada: Stand e usuário
    if (l.usuario?.vivo) this.morrer(l.usuario, abatedor);
    if (l.standDele?.vivo) this.morrer(l.standDele, abatedor);
  }

  private mudarBonus(l: LutadorInterno, atributo: NomeAtributo, v: number): void {
    const antes = l.at.vida;
    l.bonus[atributo] += v;
    l.recalcular();
    const d = l.at.vida - antes;
    if (d > 0) l.vida += d;
    else l.vida = Math.min(l.vida, l.at.vida);
  }

  /** roda conteúdo de fora (habilidade, gancho, temporizador) sem derrubar a luta, com o lançador certo */
  private protegido(fn: () => void, lancando: LutadorInterno | null): void {
    if (this.profundidade >= MAX_PROFUNDIDADE) return;
    const antes = this.lancando;
    this.lancando = lancando;
    this.profundidade++;
    try {
      fn();
    } catch (e) {
      this.falha(e);
    } finally {
      this.lancando = antes;
      this.profundidade--;
    }
  }

  /** poder do lançador durante a habilidade (1 fora dela, ou com a regra desligada) */
  private poderAgora(): number {
    return this.regras.poder && this.lancando ? this.lancando.at.poder : 1;
  }

  private falha(e: unknown): void {
    if (this.avisou) return;
    this.avisou = true;
    console.error('Autobatalha: erro no conteúdo durante a luta', e);
  }

  private L(u: Lutador): LutadorInterno {
    if (u instanceof LutadorInterno) return u;
    throw new Error('Autobatalha: lutador de fora desta luta');
  }

  // =============================================================================================================
  // Gravação
  // =============================================================================================================

  private estadoVisivel(l: LutadorInterno): EstadoVisivel {
    return {
      id: l.id, lado: l.lado, nome: l.nome, img: l.img, custo: l.custo, estrela: l.estrela, casa: copiaCasa(l.casa),
      vida: Math.round(l.vida), vidaMax: Math.round(l.at.vida), escudo: Math.round(l.escudo), mana: Math.round(l.mana),
      manaMax: Math.round(l.at.mana), vivo: l.vivo, status: l.statusAtivos(), itens: l.unidade ? [...l.unidade.itens] : [],
      monstro: l.monstro, chefe: l.chefe, stand: l.stand,
    };
  }

  private quadro(): Quadro {
    const u: Quadro['u'] = {};
    let s: Record<string, Status[]> | undefined;
    let max: Record<string, [number, number]> | undefined;
    for (const l of this.todos) {
      u[l.id] = [l.casa.col, l.casa.lin, Math.round(l.vida), Math.round(l.escudo), Math.round(l.mana), l.vivo ? 1 : 0];
      if (!l.vivo) continue;
      const st = l.statusAtivos();
      if (st.length) (s ??= {})[l.id] = st;
      const vm = Math.round(l.at.vida), mm = Math.round(l.at.mana);
      if (vm !== l.maxVisto[0] || mm !== l.maxVisto[1]) {
        l.maxVisto = [vm, mm];
        (max ??= {})[l.id] = [vm, mm];
      }
    }
    const q: Quadro = { t: this.t, u };
    if (s) q.s = s;
    if (max) q.max = max;
    return q;
  }

  // =============================================================================================================
  // Contexto (o que habilidades, traços e itens usam)
  // =============================================================================================================

  aleatorio(): number { return this.rng(); }
  chance(p: number): boolean { return this.rng() < p; }
  sortear<T>(xs: readonly T[], n: number): T[] { return this.rng.sortear(xs, n); }

  private ladoPedido(de: Lutador, quem: 'inimigos' | 'aliados'): Lado { return quem === 'inimigos' ? outro(de.lado) : de.lado; }

  /** vivos que podem ser escolhidos: inimigos sem `intocavel`; aliados sem o próprio `de` (a não ser que incluirSi) */
  private candidatos(de: Lutador, quem: 'inimigos' | 'aliados', incluirSi = false): LutadorInterno[] {
    if (quem === 'inimigos') return this.porLado[outro(de.lado)].filter(x => x.vivo && !x.temStatus('intocavel'));
    return this.porLado[de.lado].filter(x => x.vivo && (incluirSi || x !== de));
  }

  inimigosDe(u: Lutador): Lutador[] { return this.porLado[outro(u.lado)].filter(x => x.vivo); }
  aliadosDe(u: Lutador, incluirSi = false): Lutador[] { return this.porLado[u.lado].filter(x => x.vivo && (incluirSi || x !== u)); }

  emVolta(centro: Lutador | Casa, raio: number, de: Lutador, quem: 'inimigos' | 'aliados'): Lutador[] {
    const c = casaDe(centro);
    return this.porLado[this.ladoPedido(de, quem)].filter(x => x.vivo && distanciaHex(x.casa, c) <= raio);
  }

  private naCasas(casas: Casa[], lado: Lado): Lutador[] {
    const out: Lutador[] = [];
    for (const c of casas) {
      const x = dentro(c) ? this.ocup[indice(c)] : null;
      if (x && x.vivo && x.lado === lado) out.push(x);
    }
    return out;
  }

  emLinha(de: Lutador, para: Lutador | Casa, quem: 'inimigos' | 'aliados'): Lutador[] {
    return this.naCasas(retaAteBorda(de.casa, casaDe(para)), this.ladoPedido(de, quem));
  }

  emCone(de: Lutador, para: Lutador | Casa, alcance: number, quem: 'inimigos' | 'aliados'): Lutador[] {
    return this.naCasas(cone(de.casa, casaDe(para), alcance), this.ladoPedido(de, quem));
  }

  maisProximo(de: Lutador, quem: 'inimigos' | 'aliados'): Lutador | null {
    let melhor: Lutador | null = null, md = Infinity;
    for (const x of this.candidatos(de, quem)) {
      const d = distanciaHex(de.casa, x.casa);
      if (d < md) { md = d; melhor = x; }
    }
    return melhor;
  }

  maisLonge(de: Lutador, quem: 'inimigos' | 'aliados', alcanceMax = Infinity): Lutador | null {
    let melhor: Lutador | null = null, md = -1;
    for (const x of this.candidatos(de, quem)) {
      const d = distanciaHex(de.casa, x.casa);
      if (d <= alcanceMax && d > md) { md = d; melhor = x; }
    }
    return melhor;
  }

  menosVida(de: Lutador, quem: 'inimigos' | 'aliados', incluirSi = false): Lutador | null {
    let melhor: Lutador | null = null, mf = Infinity;
    for (const x of this.candidatos(de, quem, incluirSi)) {
      const f = x.vida / x.at.vida;
      if (f < mf) { mf = f; melhor = x; }
    }
    return melhor;
  }

  maisVida(de: Lutador, quem: 'inimigos' | 'aliados'): Lutador | null {
    let melhor: Lutador | null = null, mv = -1;
    for (const x of this.candidatos(de, quem)) if (x.vida > mv) { mv = x.vida; melhor = x; }
    return melhor;
  }

  distancia(a: Lutador | Casa, b: Lutador | Casa): number { return distanciaHex(casaDe(a), casaDe(b)); }

  dano(de: Lutador, para: Lutador, fracaoDoDano: number, opcoes?: OpcoesDano): number {
    const d = this.L(de);
    return this.danoBruto(d, this.L(para), d.at.dano * fracaoDoDano, opcoes);
  }

  danoFixo(de: Lutador, para: Lutador, valor: number, opcoes?: OpcoesDano): number {
    return this.danoBruto(this.L(de), this.L(para), valor, opcoes);
  }

  curar(_de: Lutador, para: Lutador, valor: number): number {
    return this.curarInterno(this.L(para), valor * this.poderAgora());
  }

  escudo(para: Lutador, valor: number, duracao: number): void {
    const p = this.L(para);
    if (!p.vivo || !(valor > 0)) return;
    p.escudos.push({ valor: valor * this.poderAgora(), fim: this.t + Math.max(0, duracao) });
  }

  status(de: Lutador, para: Lutador, s: Status, duracao: number, valor?: number): void {
    const p = this.L(para);
    if (!p.vivo || !(duracao > 0)) return;
    const imune = p.memoria[`imune:${s}`];
    if (imune !== undefined && imune > this.t) return;
    const v = valor ?? VALOR_PADRAO[s] ?? 1;
    const fim = this.t + duracao, fonte = this.L(de);
    const e = p.st[s];
    if (e && e.fim > this.t) {
      e.fim = Math.max(e.fim, fim);
      e.valor = Math.max(e.valor, v);
      e.fonte = fonte;
    } else p.st[s] = { fim, valor: v, fonte };
  }

  limparStatusRuins(u: Lutador): void {
    const l = this.L(u);
    for (const s of STATUS_RUINS) delete l.st[s];
  }

  buff(u: Lutador, atributo: NomeAtributo, fracao: number, duracao?: number): void {
    const l = this.L(u);
    if (!l.vivo || !fracao) return;
    this.mudarBonus(l, atributo, fracao);
    if (duracao !== undefined && duracao > 0 && Number.isFinite(duracao)) l.buffs.push({ atributo, valor: fracao, fim: this.t + duracao });
  }

  mana(u: Lutador, delta: number): void {
    const l = this.L(u);
    if (delta > 0) this.ganharMana(l, delta, 'conteudo');
    else l.mana = Math.max(0, l.mana + delta);
  }

  matar(de: Lutador, para: Lutador): void { this.morrer(this.L(para), this.L(de)); }

  definirFracaoVida(u: Lutador, fracao: number): void {
    const l = this.L(u);
    if (!l.vivo) return;
    if (fracao <= 0) this.morrer(l, null);
    else l.vida = Math.min(1, fracao) * l.at.vida;
  }

  casaLivreAoLado(c: Lutador | Casa): Casa | null {
    const casa = casaDe(c);
    if (!dentro(casa)) return null;
    for (const v of VIZ[indice(casa)]!) if (!this.ocup[v]) return copiaCasa(CASAS[v]!);
    return null;
  }

  mover(u: Lutador, para: Casa): void {
    const l = this.L(u);
    if (!l.vivo || !dentro(para)) return;
    let i = indice(para);
    const o = this.ocup[i];
    if (o && o !== l) {
      const c = this.casaLivreAoLado(para);
      if (!c) return;
      i = indice(c);
    }
    this.colocar(l, i);
  }

  empurrar(u: Lutador, origem: Lutador | Casa, casas: number): void {
    const l = this.L(u);
    const o = casaDe(origem);
    if (!l.vivo || (o.col === l.casa.col && o.lin === l.casa.lin)) return;
    const reta = retaAteBorda(o, l.casa);
    let k = reta.findIndex(c => c.col === l.casa.col && c.lin === l.casa.lin);
    for (let n = 0; n < casas; n++) {
      // segue a reta de `origem` passando por `u`; fora dela, a 1ª vizinha que se afasta
      const r = k >= 0 ? reta[k + 1] : undefined;
      let prox: number;
      if (r && dist(l.idx, indice(r)) === 1) prox = indice(r);
      else {
        k = -1;
        const d0 = distanciaHex(o, l.casa);
        prox = VIZ[l.idx]!.find(v => distanciaHex(o, CASAS[v]!) > d0) ?? -1;
      }
      if (prox < 0 || this.ocup[prox]) break; // borda ou casa ocupada
      this.colocar(l, prox);
      if (k >= 0) k++;
    }
  }

  transformar(u: Lutador, forma: string, multiplicador: number): void {
    const l = this.L(u);
    const s = S();
    if (!l.vivo || !s.temForma(forma)) return;
    const f = s.forma(forma);
    const fracaoVida = l.vida / l.at.vida;
    l.forma = f.id;
    l.nome = f.nome;
    l.img = f.img;
    l.base.vida *= multiplicador;
    l.base.dano *= multiplicador;
    l.base.armadura *= multiplicador;
    l.base.resist *= multiplicador;
    if (this.regras.velTransformar) l.base.velAtaque *= VEL_TRANSFORMAR;
    // a nova forma: transforma de novo (cadeia do Digimon) ou não lança mais
    try {
      l.habilidade = this.c.habilidadeDa(f);
    } catch (e) {
      l.habilidade = null;
      this.falha(e);
    }
    if (l.habilidade) l.base.mana = l.habilidade.mana;
    l.recalcular();
    l.vida = Math.min(l.at.vida, fracaoVida * l.at.vida);
    if (this.gravar) this.eventos.push({ t: this.t, tipo: 'transformar', id: l.id, nome: l.nome, img: l.img });
  }

  invocarFF(dono: Lutador, fracaoAtributos: number, casa?: Casa): Lutador | null {
    const d = this.L(dono);
    const lista = S().dados.ff.inimigos;
    if (!lista.length) return null;
    let i = -1;
    if (casa && dentro(casa) && !this.ocup[indice(casa)]) i = indice(casa);
    else {
      const c = this.casaLivreAoLado(d.casa);
      if (c) i = indice(c);
    }
    if (i < 0) return null;
    const m = lista[this.rng.int(lista.length)]!;
    const f = Math.max(0, fracaoAtributos);
    const base: Atributos = {
      vida: Math.max(1, d.at.vida * f), dano: d.at.dano * f, armadura: d.at.armadura * f, resist: d.at.resist * f,
      velAtaque: d.at.velAtaque, alcance: 1, mana: 100, manaInicial: 0, critChance: CRIT_CHANCE, critDano: CRIT_DANO,
      rouboVida: 0, desvio: 0, poder: 1,
    };
    d.nInvocados++;
    const nome = `ff:${m.nome}`;
    const l = new LutadorInterno(this, {
      id: `${d.id}~inv${d.nInvocados}`, lado: d.lado, forma: nome, campeao: nome, fr: 'ff', classes: [], estrela: 1,
      custo: d.custo, nome: m.nome, img: m.img, papel: '', base, bonus: bonusZero(), habilidade: null, itens: [],
      unidade: null, stand: false, invocado: true, monstro: true, chefe: false,
    }, CASAS[i]!, i);
    l.vida = l.at.vida;
    l.maxVisto = [Math.round(l.at.vida), Math.round(l.at.mana)];
    this.entrar(l);
    if (this.gravar) {
      this.eventos.push({ t: this.t, tipo: 'surge', estado: this.estadoVisivel(l) });
      this.eventos.push({ t: this.t, tipo: 'visual', efeito: 'invocar', casas: [copiaCasa(l.casa)], de: d.id });
    }
    return l;
  }

  reviver(u: Lutador, fracaoVida: number): void {
    const l = this.L(u);
    if (l.vivo) return;
    let i = l.idx;
    if (this.ocup[i]) {
      i = PERTO[i]!.find(j => !this.ocup[j]) ?? -1;
      if (i < 0) return;
    }
    l.vivo = true;
    l.vida = Math.max(1, Math.min(1, fracaoVida) * l.at.vida);
    l.mana = 0;
    l.st = {};
    l.escudos = [];
    l.alvo = null;
    l.accAtaque = 0.5;
    l.accPasso = TEMPO_POR_CASA - PASSO;
    this.colocar(l, i);
    if (!l.invocado) this.restam[l.lado]++;
    if (this.gravar) this.eventos.push({ t: this.t, tipo: 'visual', efeito: 'luz', casas: [copiaCasa(l.casa)], de: l.id });
  }

  depois(segundos: number, fn: () => void): void {
    this.temporizadores.push({ t: this.t + Math.max(0, segundos), ordem: this.ordem++, fn, lancando: this.lancando });
  }

  aCada(intervalo: number, duracao: number, fn: () => void): void {
    const fim = this.t + duracao, passo = Math.max(PASSO, intervalo);
    const tick = () => {
      fn();
      if (this.t + passo <= fim + 1e-9) this.depois(passo, tick);
    };
    if (this.t + passo <= fim + 1e-9) this.depois(passo, tick);
  }

  visual(tipo: EfeitoVisual, onde: (Lutador | Casa)[], de?: Lutador): void {
    if (!this.gravar) return;
    const e: Extract<EventoLuta, { tipo: 'visual' }> = { t: this.t, tipo: 'visual', efeito: tipo, casas: onde.map(x => copiaCasa(casaDe(x))) };
    if (de) e.de = de.id;
    this.eventos.push(e);
  }

  texto(u: Lutador, texto: string): void {
    if (this.gravar) this.eventos.push({ t: this.t, tipo: 'texto', para: u.id, texto });
  }

  ouro(lado: Lado, n: number): void { this.ouroPor[lado] += n; }

  moeda(lado: Lado, n: number, onde: Lutador | Casa): void {
    if (!(n > 0)) return;
    const casa = copiaCasa(casaDe(onde));
    this.ouroPor[lado] += n;
    this.moedas.push({ lado, casa, valor: n });
    if (this.gravar) this.eventos.push({ t: this.t, tipo: 'moeda', lado, casa: copiaCasa(casa), valor: n });
  }
}
