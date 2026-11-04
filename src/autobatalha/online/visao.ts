// O que cada jogador vê da partida online, e a luta dele.
//
// Visão: o próprio Jogador completo; dos outros, o que é público (nome, ícone, estilo, vida, nível, ouro, sequência,
// tabuleiro, banco e itens pra olhar), sem a loja, as formas da loja e as escolhas de evolução. A partida vai sem o
// pool, sem a semente (que deixaria prever a loja: no lugar vai um id da partida) e sem a última luta.
//
// Luta: o anfitrião simula todas sem gravar e manda a cada humano só a entrada e a semente da dele; o navegador do
// convidado roda o mesmo motor gravando (mesmo código e mesmo set = mesma luta) e mostra. Quem está no lado B vê a
// luta espelhada (giro de 180° no tabuleiro e lados trocados), com o time dele embaixo como sempre.
import { M } from '../partida/motor';
import type { LutaDaRodada, ResultadoRodada } from '../partida';
import {
  COLUNAS, LINHAS, type Casa, type EstadoVisivel, type EventoLuta, type Jogador, type Lado, type Partida, type Quadro,
  type ResultadoLuta, type SimularLuta,
} from '../tipos';
import type { BasePartida, LutaVista } from './protocolo';

// ---------- visão da partida ----------

/** O próprio jogador (só sem o que os bots usam por dentro). */
export function jogadorProprio(j: Jogador): Jogador {
  const { alvos: _a, ...resto } = j;
  return resto;
}

/** Outro jogador: sem a loja, as formas dela e as escolhas de evolução. */
export function jogadorPublico(j: Jogador): Jogador {
  const { loja: _l, lojaFormas: _lf, escolhaPendente: _e, escolhasFila: _ef, alvos: _a, lojaTravada: _t, ...resto } = j;
  return { ...resto, loja: [], lojaTravada: false };
}

/** A partida sem os jogadores, vista por `voce` (`idPartida` no lugar da semente). */
export function basePraVer(p: Partida, voce: string, idPartida: number): BasePartida {
  const { jogadores: _j, pool: _p, sorteios: _s, ultimaLuta: _u, semente: _sem, ...resto } = p;
  return { ...resto, semente: idPartida, voce, pool: {} };
}

/** A partida inteira como `voce` vê. */
export function visaoDaPartida(p: Partida, voce: string, idPartida: number): Partida {
  return {
    ...basePraVer(p, voce, idPartida),
    jogadores: p.jogadores.map(j => (j.id === voce ? jogadorProprio(j) : jogadorPublico(j))),
  };
}

/** Junta as partes recebidas com a visão anterior (jogador que não veio continua como estava). */
export function juntarVisao(antes: Partida | null, base: BasePartida | undefined, ids: string[], novos: Jogador[]): Partida | null {
  const b = base ?? (antes ? (({ jogadores: _j, ...resto }) => resto)(antes) : null);
  if (!b) return null;
  const porId = new Map((antes?.jogadores ?? []).map(j => [j.id, j]));
  for (const j of novos) porId.set(j.id, j);
  const jogadores: Jogador[] = [];
  for (const id of ids) {
    const j = porId.get(id);
    if (!j) return null;
    jogadores.push(j);
  }
  return { ...b, jogadores };
}

// ---------- a luta de cada um ----------

export const chaveDaRodada = (p: Pick<Partida, 'estagio' | 'rodada'>): string => `${p.estagio}-${p.rodada}`;

/** A luta do jogador `id` nesta rodada (null se ele não luta: eliminado). */
export function lutaPraVer(lutas: readonly LutaDaRodada[], id: string, chave: string): LutaVista | null {
  const l = lutas.find(x => x.a === id || x.b === id);
  if (!l) return null;
  const lado: Lado = l.a === id ? 'a' : 'b';
  return { chave, entradaA: l.entradaA, entradaB: l.entradaB, semente: l.semente, lado, adversario: lado === 'a' ? l.b : l.a };
}

/** As lutas da rodada de cada humano (menos `exceto`, o anfitrião, que vê a dele direto). */
export function lutasDosHumanos(p: Partida, rr: ResultadoRodada, exceto: string): Map<string, LutaVista> {
  const out = new Map<string, LutaVista>();
  const chave = `${rr.estagio}-${rr.rodada}`;
  for (const j of p.jogadores) {
    if (j.bot || j.id === exceto) continue;
    const l = lutaPraVer(rr.lutas, j.id, chave);
    if (l) out.set(j.id, l);
  }
  return out;
}

const trocarLado = (l: Lado): Lado => (l === 'a' ? 'b' : 'a');
/** "a:12" ⇄ "b:12" (invocados: "a:12~inv1" ⇄ "b:12~inv1") */
export const trocarId = (id: string): string =>
  id.startsWith('a:') ? `b:${id.slice(2)}` : id.startsWith('b:') ? `a:${id.slice(2)}` : id;
/** giro de 180° no tabuleiro inteiro (8 × 8 com as linhas ímpares deslocadas: a casa (c, l) vai pra (7-c, 7-l)) */
export const girarCasa = (c: Casa): Casa => ({ col: COLUNAS - 1 - c.col, lin: LINHAS - 1 - c.lin });
function trocarChaves<T>(r: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(r)) out[trocarId(k)] = v;
  return out;
}

const espelharVisivel = (e: EstadoVisivel): EstadoVisivel => ({ ...e, id: trocarId(e.id), lado: trocarLado(e.lado), casa: girarCasa(e.casa) });

function espelharQuadro(q: Quadro): Quadro {
  const u: Quadro['u'] = {};
  for (const [id, v] of Object.entries(q.u)) {
    const c = girarCasa({ col: v[0], lin: v[1] });
    u[trocarId(id)] = [c.col, c.lin, v[2], v[3], v[4], v[5]];
  }
  const out: Quadro = { t: q.t, u };
  if (q.s) out.s = trocarChaves(q.s);
  if (q.max) out.max = trocarChaves(q.max);
  return out;
}

function espelharEvento(ev: EventoLuta): EventoLuta {
  switch (ev.tipo) {
    case 'ataque': return { ...ev, de: trocarId(ev.de), para: trocarId(ev.para) };
    case 'dano': case 'cura': case 'texto': return { ...ev, para: trocarId(ev.para) };
    case 'habilidade': return { ...ev, de: trocarId(ev.de) };
    case 'morte': case 'transformar': return { ...ev, id: trocarId(ev.id) };
    case 'visual':
      return ev.de !== undefined ? { ...ev, casas: ev.casas.map(girarCasa), de: trocarId(ev.de) } : { ...ev, casas: ev.casas.map(girarCasa) };
    case 'surge': return { ...ev, estado: espelharVisivel(ev.estado) };
    case 'moeda': return { ...ev, lado: trocarLado(ev.lado), casa: girarCasa(ev.casa) };
  }
}

/** A luta vista do lado B: lados trocados e o tabuleiro girado, pro time de B ficar embaixo (lado A). */
export function espelharLuta(r: ResultadoLuta): ResultadoLuta {
  const out: ResultadoLuta = {
    vencedor: r.vencedor === 'empate' ? 'empate' : trocarLado(r.vencedor),
    vivosA: r.vivosB.map(trocarId), vivosB: r.vivosA.map(trocarId),
    duracao: r.duracao, dano: trocarChaves(r.dano), abates: trocarChaves(r.abates), ouro: { a: r.ouro.b, b: r.ouro.a },
  };
  if (r.moedas) out.moedas = r.moedas.map(m => ({ lado: trocarLado(m.lado), casa: girarCasa(m.casa), valor: m.valor }));
  const g = r.gravacao;
  if (g) {
    out.gravacao = { passo: g.passo, inicial: g.inicial.map(espelharVisivel), quadros: g.quadros.map(espelharQuadro), eventos: g.eventos.map(espelharEvento) };
  }
  return out;
}

/** O convidado reproduz a luta dele (gravando) com o motor da partida; no lado B, espelhada. */
export function reproduzirLuta(l: LutaVista, simular: SimularLuta = M().simularLuta): ResultadoLuta {
  const r = simular(l.entradaA, l.entradaB, l.semente, true);
  return l.lado === 'b' ? espelharLuta(r) : r;
}
