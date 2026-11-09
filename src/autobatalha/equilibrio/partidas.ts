// Partidas inteiras de 8 bots (o "humano" joga como bot) com o motor e o conteúdo de verdade, contando cada luta:
// taxa de vitória dos times com cada traço ativo (por degrau) e com cada item, rodadas de monstros e duração das
// partidas. É o laço de src/autobatalha/integracao.test.ts. Os números se misturam com a força do tabuleiro (quem tem
// traço alto costuma ter mais ouro e nível): servem de sinal, e as lutas controladas (laboratorio.ts) isolam o efeito.
import { contarTracos, combinar, ehComponente, passivaDe } from '../conteudo';
import { atributosDaUnidade, simularLuta } from '../combate';
import { S } from '../dados';
import * as P from '../partida';
import type { Dificuldade, EntradaTime, Lado, Partida, ResultadoLuta, SimularLuta, Unidade } from '../tipos';
import { placarVazio, somarLuta, type Placar } from './medidas';
import { conferirGravacao, conferirLuta, conferirPartida, conferirTimes, massaDeItens, type Violacoes } from './invariantes';
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
  /** estágio → jogadores com o Deadlock ativo no tabuleiro e a soma das almas deles nesse estágio */
  almas: Map<number, { n: number; soma: number }>;
  /** invariantes quebrados (invariantes.ts) */
  violacoes: Violacoes;
  /** erros que o conteúdo jogou durante a luta (o motor engole e escreve no console) */
  errosConteudo: string[];
  /** partidas que bateram no limite de rodadas sem acabar */
  naoTerminaram: number;
}

export interface OpcoesPartidas {
  dificuldade?: Dificuldade;
  /** grava e confere quadro a quadro uma a cada N lutas (0 = nunca) */
  gravarUmaACada?: number;
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
    if (contarTracos(us).some(t => t.id === 'deadlock' && t.nivel >= 0)) {
      const a = e.almas.get(p.estagio) ?? { n: 0, soma: 0 };
      a.n++;
      a.soma += j.almas;
      e.almas.set(p.estagio, a);
    }
    if (p.estagio < 3) continue;
    const dele = uso.get(j.id) ?? new Map<string, number>();
    for (const u of us) { const fr = S().campeao(u.campeao).fr; dele.set(fr, (dele.get(fr) ?? 0) + 1); }
    uso.set(j.id, dele);
  }
}

/** Joga uma partida por semente e soma as lutas. */
export function jogarPartidas(sementes: readonly number[], maxRodadas = 120, opcoes: OpcoesPartidas = {}): EstatPartidas {
  P.definirMotor({ simularLuta, atributosDaUnidade, contarTracos, combinar, ehComponente });
  const e: EstatPartidas = {
    partidas: 0, rodadas: [], estagioFinal: [], tracos: new Map(), itens: new Map(), monstros: new Map(), porTempo: placarVazio(),
    lanc: new Map(), moedas: new Map(), colocacoes: new Map(), campo: new Map(), almas: new Map(), violacoes: new Map(), errosConteudo: [], naoTerminaram: 0,
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
  let nLutas = 0;
  const simular: SimularLuta = (a, b, s) => {
    const gravar = !!opcoes.gravarUmaACada && ++nLutas % opcoes.gravarUmaACada === 0;
    const l = lutar(a, b, s, { gravar });
    conferirLuta(a, b, l.r, e.violacoes);
    if (gravar) {
      conferirGravacao(l.r, e.violacoes);
      delete l.r.gravacao;
    }
    somarLancamentos(e.lanc, a, 'a', l);
    somarLancamentos(e.lanc, b, 'b', l);
    contarMoedas(a, l.r, 'a');
    contarMoedas(b, l.r, 'b');
    return l.r;
  };
  const erroOriginal = console.error;
  console.error = (...args: unknown[]) => { e.errosConteudo.push(args.map(String).join(' ')); };
  for (const s of sementes) {
    const p: Partida = P.novaPartida(s, {}, opcoes.dificuldade ?? 'normal');
    const humano = p.jogadores.find(j => !j.bot)!;
    const uso = new Map<string, Map<string, number>>();
    const massa = new Map<string, number>();
    // item não some: a massa de itens (componente = 1, completo = 2) de quem está vivo só sobe
    const conferirItens = (momento: string) => {
      for (const j of P.vivos(p)) {
        const m = massaDeItens(j);
        if (m < (massa.get(j.id) ?? 0)) {
          const x = e.violacoes.get('item sumiu') ?? { n: 0, exemplo: `${momento} ${p.estagio}-${p.rodada} ${j.id}: ${massa.get(j.id)} → ${m}` };
          x.n++;
          e.violacoes.set('item sumiu', x);
        }
        massa.set(j.id, m);
      }
    };
    conferirPartida(p, e.violacoes, 'início');
    let rodadas = 0;
    while (!P.acabou(p) && rodadas < maxRodadas) {
      // regressão: os bots planejam só depois do carrossel acabar, como no jogo (senão usam o que ganharam uma rodada atrasados)
      if (p.carrossel) {
        const x = e.violacoes.get('bots planejando com o carrossel aberto') ?? { n: 0, exemplo: `${p.estagio}-${p.rodada}` };
        x.n++;
        e.violacoes.set('bots planejando com o carrossel aberto', x);
      }
      P.jogarBots(p);
      if (humano.colocacao == null) P.jogarBot(p, humano);
      P.fimDoPlanejamento(p);
      conferirPartida(p, e.violacoes, 'antes da luta');
      conferirTimes(p, e.violacoes);
      conferirItens('antes da luta');
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
      conferirPartida(p, e.violacoes, 'depois da luta');
      conferirItens('depois da luta');
      rodadas++;
      if (P.acabou(p)) break;
      P.avancarRodada(p);
      conferirPartida(p, e.violacoes, 'começo da rodada');
      // como no jogo de verdade (controle.ts): o carrossel acaba e só depois os bots planejam
      P.terminarCarrossel(p);
      conferirPartida(p, e.violacoes, 'depois do carrossel');
    }
    if (!P.acabou(p)) e.naoTerminaram++;
    else if ([...p.jogadores.map(j => j.colocacao)].sort((a, b) => (a ?? 0) - (b ?? 0)).join() !== '1,2,3,4,5,6,7,8') {
      const x = e.violacoes.get('colocações não são 1 a 8') ?? { n: 0, exemplo: p.jogadores.map(j => j.colocacao).join(',') };
      x.n++;
      e.violacoes.set('colocações não são 1 a 8', x);
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
  console.error = erroOriginal;
  return e;
}
