// Contexto falso e mínimo pra testar habilidades, traços e itens sem o motor de verdade. Simplificado: dano com
// redução por defesa, escudo, status com prazo, buff com prazo e agenda de chamadas. O teste de integração com o
// motor real fica em src/autobatalha/combate.
import { cone, distancia as distHex, retaAteBorda, vizinhas, chave } from '../hex';
import { criarRng } from '../rng';
import {
  ATRIBUTOS_EM_FRACAO, type Atributos, type Casa, type Contexto, type Custo, type Estrela, type Lado, type Lutador,
  type NomeAtributo, type Origem, type Status, type Unidade,
} from '../tipos';

export const ATRIBUTOS_TESTE: Atributos = {
  vida: 1000, dano: 100, armadura: 0, resist: 0, velAtaque: 1, alcance: 1, mana: 80, manaInicial: 0,
  critChance: 0, critDano: 1.4, rouboVida: 0, desvio: 0, poder: 1,
};

const RUINS: readonly Status[] = ['atordoado', 'lento', 'queimando', 'provocado', 'semMana', 'vulneravel', 'fraco', 'semCura'];

export class LutadorFalso implements Lutador {
  vivo = true;
  vida: number;
  escudo = 0;
  mana = 0;
  lancamentos = 0;
  stand = false;
  usuario: Lutador | null = null;
  standDele: Lutador | null = null;
  invocado = false;
  unidade: Unidade | null = null;
  memoria: Record<string, number> = {};
  at: Atributos;
  readonly base: Atributos;
  /** status → [até quando, valor] */
  readonly status = new Map<Status, [number, number]>();
  forma: string;

  constructor(
    private readonly mundo: { tempo: number },
    readonly id: string,
    readonly lado: Lado,
    public casa: Casa,
    readonly fr: Origem | 'ff' = 'pokemon',
    readonly classes: readonly string[] = [],
    readonly estrela: Estrela = 1,
    readonly custo: Custo = 1,
    atributos: Partial<Atributos> = {},
  ) {
    this.base = { ...ATRIBUTOS_TESTE, ...atributos };
    this.at = { ...this.base };
    this.vida = this.at.vida;
    this.forma = `${fr}:${id}`;
  }
  get campeao(): string { return this.forma; }
  temStatus(s: Status): boolean {
    const st = this.status.get(s);
    return !!st && st[0] > this.mundo.tempo;
  }
  valorStatus(s: Status): number {
    return this.temStatus(s) ? this.status.get(s)![1] : 0;
  }
}

export interface Mundo {
  ctx: Contexto;
  lutadores: LutadorFalso[];
  /** chamadas feitas ao contexto ("dano", "status:atordoado", "buff:velAtaque", "visual:fogo"…) */
  registro: string[];
  readonly tempo: number;
  add(id: string, lado: Lado, casa: Casa, extra?: {
    fr?: Origem | 'ff'; classes?: string[]; estrela?: Estrela; at?: Partial<Atributos>;
  }): LutadorFalso;
  /** avança o relógio, rodando o que estiver agendado */
  rodar(segundos: number): void;
  conta(prefixo: string): number;
}

export function criarMundo(semente = 1): Mundo {
  const rng = criarRng(semente);
  const relogio = { tempo: 0 };
  const lutadores: LutadorFalso[] = [];
  const registro: string[] = [];
  let agenda: { t: number; i: number; fn: () => void }[] = [];
  let seq = 0;
  const agendar = (t: number, fn: () => void) => agenda.push({ t, i: seq++, fn });

  const casaDe = (x: Lutador | Casa): Casa => ('lado' in x ? x.casa : x);
  const dist = (a: Lutador | Casa, b: Lutador | Casa) => distHex(casaDe(a), casaDe(b));
  const vivos = () => lutadores.filter(x => x.vivo);
  const doLado = (de: Lutador, quem: 'inimigos' | 'aliados') =>
    vivos().filter(x => (quem === 'inimigos' ? x.lado !== de.lado : x.lado === de.lado));
  const real = (u: Lutador) => {
    const l = lutadores.find(x => x === u);
    if (!l) throw new Error(`lutador fora do mundo: ${u.id}`);
    return l;
  };
  const ocupada = (c: Casa) => vivos().some(x => x.casa.col === c.col && x.casa.lin === c.lin);
  const nasCasas = (casas: Casa[], de: Lutador, quem: 'inimigos' | 'aliados') => {
    const ks = new Set(casas.map(chave));
    return doLado(de, quem).filter(x => ks.has(chave(x.casa)));
  };

  function morrer(u: LutadorFalso) {
    u.vida = 0;
    u.vivo = false;
    registro.push(`morte:${u.id}`);
  }
  function aplicarDano(de: Lutador, para: Lutador, bruto: number, opcoes: Parameters<Contexto['dano']>[3] = {}) {
    const p = real(para);
    if (!p.vivo || p.temStatus('invulneravel')) return 0;
    const tipo = opcoes.tipo ?? 'magico';
    const defesa = opcoes.ignoraDefesa || tipo === 'verdadeiro' ? 0 : tipo === 'fisico' ? p.at.armadura : p.at.resist;
    let v = Math.max(0, bruto) * 100 / (100 + defesa);
    v *= 1 + p.valorStatus('vulneravel');
    v *= 1 - real(de).valorStatus('fraco');
    if (!opcoes.ignoraDefesa && p.escudo > 0) {
      const absorve = Math.min(p.escudo, v);
      p.escudo -= absorve;
      v -= absorve;
    }
    p.vida -= v;
    registro.push('dano');
    if (p.vida <= 0) morrer(p);
    return v;
  }

  const ctx: Contexto = {
    aleatorio: () => rng(),
    chance: p => rng.chance(p),
    sortear: (xs, n) => rng.sortear(xs, n),
    get tempo() { return relogio.tempo; },
    inimigosDe: u => doLado(u, 'inimigos'),
    aliadosDe: (u, incluirSi = false) => doLado(u, 'aliados').filter(x => incluirSi || x !== u),
    emVolta: (centro, raio, de, quem) => doLado(de, quem).filter(x => x !== centro && dist(x, centro) <= raio),
    emLinha: (de, para, quem) => nasCasas(retaAteBorda(de.casa, casaDe(para)), de, quem),
    emCone: (de, para, alcance, quem) => nasCasas(cone(de.casa, casaDe(para), alcance), de, quem),
    maisProximo(de, quem) {
      const xs = doLado(de, quem).filter(x => x !== de);
      return xs.sort((a, b) => dist(de, a) - dist(de, b))[0] ?? null;
    },
    maisLonge(de, quem, alcanceMax = Infinity) {
      const xs = doLado(de, quem).filter(x => x !== de && dist(de, x) <= alcanceMax);
      return xs.sort((a, b) => dist(de, b) - dist(de, a))[0] ?? null;
    },
    menosVida(de, quem, incluirSi = false) {
      const xs = doLado(de, quem).filter(x => incluirSi || x !== de);
      return xs.sort((a, b) => a.vida / a.at.vida - b.vida / b.at.vida)[0] ?? null;
    },
    maisVida(de, quem) {
      const xs = doLado(de, quem).filter(x => x !== de);
      return xs.sort((a, b) => b.vida / b.at.vida - a.vida / a.at.vida)[0] ?? null;
    },
    distancia: dist,
    dano: (de, para, fracao, opcoes) => aplicarDano(de, para, de.at.dano * fracao + (opcoes?.extra ?? 0), opcoes),
    danoFixo: (de, para, valor, opcoes) => aplicarDano(de, para, valor, opcoes),
    curar(_de, para, valor) {
      const p = real(para);
      if (!p.vivo || p.temStatus('semCura')) return 0;
      const v = Math.min(p.at.vida - p.vida, Math.max(0, valor) * (p.temStatus('queimando') ? 0.67 : 1));
      p.vida += v;
      registro.push('cura');
      return v;
    },
    escudo(para, valor) {
      real(para).escudo += valor;
      registro.push('escudo');
    },
    status(_de, para, s, duracao, valor = 0) {
      real(para).status.set(s, [relogio.tempo + duracao, valor]);
      registro.push(`status:${s}`);
    },
    limparStatusRuins(u) {
      for (const s of RUINS) real(u).status.delete(s);
      registro.push('limpar');
    },
    buff(u, atributo: NomeAtributo, fracao, duracao) {
      const p = real(u);
      const delta = ATRIBUTOS_EM_FRACAO.includes(atributo) ? p.base[atributo] * fracao : fracao;
      p.at[atributo] += delta;
      registro.push(`buff:${atributo}`);
      if (duracao != null) agendar(relogio.tempo + duracao, () => { p.at[atributo] -= delta; });
    },
    mana(u, delta) {
      const p = real(u);
      p.mana = Math.max(0, Math.min(p.at.mana, p.mana + delta));
      registro.push('mana');
    },
    matar(_de, para) { morrer(real(para)); },
    definirFracaoVida(u, fracao) {
      const p = real(u);
      p.vida = p.at.vida * Math.max(0, Math.min(1, fracao));
      registro.push('vida');
    },
    casaLivreAoLado: c => vizinhas(casaDe(c)).find(v => !ocupada(v)) ?? null,
    mover(u, para) {
      real(u).casa = { ...para };
      registro.push('mover');
    },
    empurrar(u, origem, casas) {
      const p = real(u);
      for (let i = 0; i < casas; i++) {
        const prox = vizinhas(p.casa).filter(v => !ocupada(v)).sort((a, b) => dist(origem, b) - dist(origem, a))[0];
        if (!prox || dist(origem, prox) <= dist(origem, p.casa)) break;
        p.casa = prox;
      }
      registro.push('empurrar');
    },
    transformar(u, forma, mult) {
      const p = real(u);
      p.forma = forma;
      for (const k of ['vida', 'dano', 'armadura', 'resist'] as const) p.at[k] *= mult;
      p.vida *= mult;
      registro.push(`transformar:${forma}:${mult}`);
    },
    invocarFF(dono, fracao) {
      const casa = vizinhas(dono.casa).find(v => !ocupada(v));
      if (!casa) return null;
      const inv = new LutadorFalso(relogio, `ff${lutadores.length}`, dono.lado, casa, 'ff', [], 1, 1, {
        vida: dono.at.vida * fracao, dano: dono.at.dano * fracao,
      });
      inv.invocado = true;
      lutadores.push(inv);
      registro.push('invocar');
      return inv;
    },
    reviver(u, fracao) {
      const p = real(u);
      p.vivo = true;
      p.vida = p.at.vida * fracao;
      registro.push(`reviver:${p.id}`);
    },
    depois(segundos, fn) { agendar(relogio.tempo + segundos, fn); },
    aCada(intervalo, duracao, fn) {
      for (let t = intervalo; t <= duracao + 1e-9; t += intervalo) agendar(relogio.tempo + t, fn);
    },
    visual(tipo) { registro.push(`visual:${tipo}`); },
    texto(_u, texto) { registro.push(`texto:${texto}`); },
    ouro(lado, n) { registro.push(`ouro:${lado}:${n}`); },
    moeda(lado, n) { registro.push(`moeda:${lado}:${n}`); },
  };

  return {
    ctx,
    lutadores,
    registro,
    get tempo() { return relogio.tempo; },
    add(id, lado, casa, extra = {}) {
      const l = new LutadorFalso(relogio, id, lado, casa, extra.fr ?? 'pokemon', extra.classes ?? [], extra.estrela ?? 1, 1, extra.at);
      lutadores.push(l);
      return l;
    },
    rodar(segundos) {
      const fim = relogio.tempo + segundos;
      for (;;) {
        agenda.sort((a, b) => a.t - b.t || a.i - b.i);
        const prox = agenda[0];
        if (!prox || prox.t > fim + 1e-9) break;
        agenda = agenda.slice(1);
        relogio.tempo = Math.max(relogio.tempo, prox.t);
        prox.fn();
      }
      relogio.tempo = fim;
    },
    conta: prefixo => registro.filter(r => r.startsWith(prefixo)).length,
  };
}
