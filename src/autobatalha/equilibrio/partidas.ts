// Partidas inteiras de 8 bots (o "humano" joga como bot) com o motor e o conteúdo de verdade, contando cada luta:
// taxa de vitória dos times com cada traço ativo (por degrau) e com cada item, rodadas de monstros e duração das
// partidas. É o laço de src/autobatalha/integracao.test.ts. Os números se misturam com a força do tabuleiro (quem tem
// traço alto costuma ter mais ouro e nível): servem de sinal, e as lutas controladas (laboratorio.ts) isolam o efeito.
import { contarTracos, combinar, ehComponente, passivaDe } from '../conteudo';
import { atributosDaUnidade, simularLuta } from '../combate';
import { S } from '../dados';
import * as P from '../partida';
import type { EntradaTime, Lado, Partida, ResultadoLuta, SimularLuta, Unidade } from '../tipos';
import { placarVazio, somarLuta, type Placar } from './medidas';
import { lutar, moedasDoLado, resultadoDo, somarLancamentos, type TabelaLanc } from './laboratorio';

/** O que entra em campo, somado por nível do jogador. */
export interface CampoDoNivel {
  /** jogador-rodadas contadas */
  n: number;
  /** unidades em campo, com Stands */
  unidades: number;
  stands: number;
  /** maior número de unidades em campo */
  maximo: number;
}

export interface EstatPartidas {
  partidas: number;
  rodadas: number[];
  estagioFinal: number[];
  /** `${traço}:${degrau}` (degrau começando em 0) → lutas contra jogador */
  tracos: Map<string, Placar>;
  /** item → lutas contra jogador de times com o item em alguém */
  itens: Map<string, Placar>;
  /** `${estágio}-${rodada}` → lutas contra monstros */
  monstros: Map<string, Placar>;
  /** lutas contra jogador que foram até o fim do tempo */
  porTempo: Placar;
  /** lançamentos e mana de todas as unidades, por papel, custo e estrela */
  lanc: TabelaLanc;
  /** ouro no chão: por campeão com passiva, unidades-luta e moedas (dividido entre os do mesmo lado) */
  moedas: Map<string, { lutas: number; moedas: number }>;
  /** origem mais usada do estágio 3 em diante (cada unidade em campo conta) → colocação final de quem usou */
  colocacoes: Map<string, number[]>;
  /** nível do jogador → o que ele pôs em campo */
  campo: Map<number, CampoDoNivel>;
}

const unidadesDo = (t: EntradaTime): Unidade[] => t.lutadores.flatMap(l => (l.unidade ? [l.unidade] : []));

function somar(m: Map<string, Placar>, chave: string, r: ResultadoLuta, lado: Lado): void {
  let p = m.get(chave);
  if (!p) m.set(chave, (p = placarVazio()));
  somarLuta(p, resultadoDo(r, lado));
}

function contarLado(e: EstatPartidas, t: EntradaTime, r: ResultadoLuta, lado: Lado): void {
  const us = unidadesDo(t);
  if (!us.length) return;
  for (const tr of contarTracos(us)) if (tr.nivel >= 0) somar(e.tracos, `${tr.id}:${tr.nivel}`, r, lado);
  for (const item of new Set(us.flatMap(u => u.itens))) somar(e.itens, item, r, lado);
}

/** Soma o que o jogador põe em campo nesta rodada e, do estágio 3 em diante, as origens que ele usa. */
function contarCampo(e: EstatPartidas, p: Partida, uso: Map<string, Map<string, number>>): void {
  for (const j of P.vivos(p)) {
    const us = unidadesDo(P.montarTime(j));
    const stands = us.filter(P.ehStand).length;
    const c = e.campo.get(j.nivel) ?? { n: 0, unidades: 0, stands: 0, maximo: 0 };
    c.n++;
    c.unidades += us.length;
    c.stands += stands;
    c.maximo = Math.max(c.maximo, us.length);
    e.campo.set(j.nivel, c);
    if (p.estagio < 3) continue;
    const dele = uso.get(j.id) ?? new Map<string, number>();
    for (const u of us) { const fr = S().campeao(u.campeao).fr; dele.set(fr, (dele.get(fr) ?? 0) + 1); }
    uso.set(j.id, dele);
  }
}

/** Joga uma partida por semente e soma as lutas. */
export function jogarPartidas(sementes: readonly number[], maxRodadas = 120): EstatPartidas {
  P.definirMotor({ simularLuta, atributosDaUnidade, contarTracos, combinar, ehComponente });
  const e: EstatPartidas = {
    partidas: 0, rodadas: [], estagioFinal: [], tracos: new Map(), itens: new Map(), monstros: new Map(), porTempo: placarVazio(),
    lanc: new Map(), moedas: new Map(), colocacoes: new Map(), campo: new Map(),
  };
  const contarMoedas = (t: EntradaTime, r: ResultadoLuta, lado: Lado) => {
    const com = unidadesDo(t).filter(u => passivaDe(u.campeao));
    if (!com.length) return;
    const cada = moedasDoLado(r, lado) / com.length;
    for (const u of com) {
      const m = e.moedas.get(u.campeao) ?? { lutas: 0, moedas: 0 };
      m.lutas++;
      m.moedas += cada;
      e.moedas.set(u.campeao, m);
    }
  };
  // a mesma luta do motor de verdade (o conteúdo medido só observa), somando os lançamentos
  const simular: SimularLuta = (a, b, s) => {
    const l = lutar(a, b, s);
    somarLancamentos(e.lanc, a, 'a', l);
    somarLancamentos(e.lanc, b, 'b', l);
    contarMoedas(a, l.r, 'a');
    contarMoedas(b, l.r, 'b');
    return l.r;
  };
  for (const s of sementes) {
    const p: Partida = P.novaPartida(s);
    const humano = p.jogadores.find(j => !j.bot)!;
    const uso = new Map<string, Map<string, number>>();
    let rodadas = 0;
    while (!P.acabou(p) && rodadas < maxRodadas) {
      P.jogarBots(p);
      if (humano.colocacao == null) P.jogarBot(p, humano);
      P.fimDoPlanejamento(p);
      contarCampo(e, p, uso);
      const rr = P.simularRodada(p, simular);
      for (const l of rr.lutas) {
        if (P.ehMonstros(l.b)) {
          somar(e.monstros, `${rr.estagio}-${rr.rodada}`, l.resultado, 'a');
          continue;
        }
        contarLado(e, l.entradaA, l.resultado, 'a');
        if (!P.ehFantasma(l.b)) contarLado(e, l.entradaB, l.resultado, 'b');
        somarLuta(e.porTempo, l.resultado.duracao >= 30 - 1e-9 ? 'vitoria' : 'derrota');
      }
      P.aplicarRodada(p, rr);
      rodadas++;
      if (P.acabou(p)) break;
      P.avancarRodada(p);
    }
    e.partidas++;
    e.rodadas.push(rodadas);
    e.estagioFinal.push(p.estagio);
    for (const j of p.jogadores) {
      const maisUsada = [...(uso.get(j.id) ?? [])].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0]?.[0];
      if (!maisUsada || j.colocacao == null) continue;
      const lista = e.colocacoes.get(maisUsada) ?? [];
      lista.push(j.colocacao);
      e.colocacoes.set(maisUsada, lista);
    }
  }
  return e;
}
