// O ciclo da rodada: fim do planejamento (prepara os tabuleiros) → simular as lutas → aplicar os resultados
// (vida, ouro, sequência, traços que mexem na partida, eliminações) → avançar pra próxima rodada (no começo de cada
// estágio a partir do 2, o carrossel vem antes do planejamento).
import { S } from '../dados';
import type { Rng } from '../rng';
import {
  COMPONENTES, type EntradaLutador, type EntradaTime, type Jogador, type Lado, type Partida, type ResultadoLuta,
  type SimularLuta, type Unidade,
} from '../tipos';
import { montarCarrossel, temCarrossel, terminarCarrossel } from './carrossel';
import { ID_MONSTROS, OURO_VITORIA, XP_POR_RODADA } from './constantes';
import {
  donoDoFantasma, ehFantasma, ehMonstros, ehStand, estaVivo, forca, jogadorDe, limiteTabuleiro, ondeEsta, origemDe,
  rodadasDoEstagio, unidadesNoTabuleiro, vivos,
} from './consultas';
import { danoDerrota, danoMonstros, novaSequencia, rendaDaRodada } from './economia';
import { sortearEscolhas } from './evolucao';
import { darUnidade, devolverTudo, ganharXp, sortearLoja } from './loja';
import { gerarMonstros } from './monstros';
import { M, nivelTraco } from './motor';
import { confrontosDaRodada } from './rodadas';
import { rngDa } from './sorteio';
import { prepararTabuleiro } from './tabuleiro';
import { moedasProChao } from './moedas';
import { limparVotos } from './votacao';
import { ALMAS_POR_ABATE, BONUS_DEADLOCK_POR_10_ALMAS, BONUS_OVERWATCH, CHANCE_SUJIMON, CUSTO_MAX_SUJIMON, porDegrau } from './origens';


export interface LutaDaRodada {
  /** jogador do lado A (o humano, quando é a luta dele) */
  a: string;
  /** jogador do lado B, 'monstros' ou `fantasma:${id}` */
  b: string;
  entradaA: EntradaTime;
  entradaB: EntradaTime;
  /** semente da luta: a mesma entrada com a mesma semente dá a mesma luta (o convidado online reproduz a dele) */
  semente: number;
  resultado: ResultadoLuta;
}
export interface ResultadoRodada { estagio: number; rodada: number; lutas: LutaDaRodada[] }

// ---------- montar os times ----------

const copiar = (u: Unidade): Unidade => ({ ...u, itens: [...u.itens], bonus: u.bonus ? { ...u.bonus } : undefined });

/** Unidades que lutam: as normais do tabuleiro (até o limite, as mais fortes) e os Stands presos a elas, nas vagas que
 *  sobraram, os mais fortes primeiro. */
export function unidadesQueLutam(j: Jogador): Unidade[] {
  const lim = limiteTabuleiro(j);
  const normais = unidadesNoTabuleiro(j, false).sort((a, b) => forca(b) - forca(a)).slice(0, lim);
  const ids = new Set(normais.map(u => u.uid));
  const presos = unidadesNoTabuleiro(j).filter(u => ehStand(u) && u.usuario != null && ids.has(u.usuario))
    .sort((a, b) => forca(b) - forca(a));
  return [...normais, ...presos.slice(0, lim - normais.length)];
}

/** Time do jogador pro motor (fantasma: o mesmo time com outro dono). Deadlock ativo: +2/3/4% (pelo degrau) de vida e
 *  dano por 10 almas nos heróis do Deadlock. */
export function montarTime(j: Jogador, dono: string = j.id): EntradaTime {
  const us = unidadesQueLutam(j);
  const dl = nivelTraco(us, 'deadlock');
  const extra = dl >= 0 ? porDegrau(BONUS_DEADLOCK_POR_10_ALMAS, dl) * Math.floor(j.almas / 10) : 0;
  const lutadores: EntradaLutador[] = [];
  for (const u of us) {
    const onde = ondeEsta(j, u.uid);
    if (onde?.tipo !== 'tabuleiro') continue;
    const unidade = copiar(u);
    if (extra && origemDe(u) === 'deadlock') {
      unidade.bonus = { vida: (u.bonus?.vida ?? 0) + extra, dano: (u.bonus?.dano ?? 0) + extra };
    }
    lutadores.push({ id: String(u.uid), unidade, casa: { ...onde.casa } });
  }
  return { dono, lutadores };
}

export function timeMonstros(p: Partida): EntradaTime {
  return {
    dono: ID_MONSTROS,
    lutadores: p.monstros.map((m, i) => ({
      id: `m${i}`, monstro: { dados: m.monstro, chefe: m.chefe, atributos: { ...m.atributos } }, casa: { ...m.casa },
    })),
  };
}

// ---------- ids do resultado ----------

/** Valores do resultado por uid do time: aceita "12" e "a:12" (o lado tem de bater); ignora monstros ("m0") e
 *  invocados ("a:12~inv1"). */
export function porUid(rec: Record<string, number> | string[], lado: Lado, time: EntradaTime): Map<number, number> {
  const uids = new Set(time.lutadores.filter(l => l.unidade).map(l => l.unidade!.uid));
  const pares: [string, number][] = Array.isArray(rec) ? rec.map(id => [id, 1]) : Object.entries(rec);
  const out = new Map<number, number>();
  for (const [k, v] of pares) {
    const m = /^(?:([ab]):)?(\d+)$/.exec(k);
    if (!m || (m[1] && m[1] !== lado)) continue;
    const uid = Number(m[2]);
    if (uids.has(uid)) out.set(uid, (out.get(uid) ?? 0) + v);
  }
  return out;
}

const unidadeDoTime = (time: EntradaTime, uid: number) => time.lutadores.find(l => l.unidade?.uid === uid)?.unidade;

/** Estrelas dos sobreviventes de um lado (pro dano da derrota). */
function estrelasVivas(res: ResultadoLuta, lado: Lado, time: EntradaTime): number[] {
  const vivosIds = porUid(lado === 'a' ? res.vivosA : res.vivosB, lado, time);
  return [...vivosIds.keys()].map(uid => unidadeDoTime(time, uid)?.estrela ?? 1);
}

// ---------- fim do planejamento e simular ----------

/** Fim do planejamento: escolhas sem resposta são sorteadas, cada tabuleiro é preparado e os votos de "Pronto" são
 *  apagados. Carrossel que ficou aberto (simulação que pulou a fase) termina antes. */
export function fimDoPlanejamento(p: Partida): void {
  if (p.carrossel) terminarCarrossel(p);
  limparVotos(p);
  for (const j of vivos(p)) {
    sortearEscolhas(p, j);
    prepararTabuleiro(j);
  }
}

/** Simula as lutas da rodada (só a do humano desta tela, p.voce, é gravada; online, cada convidado reproduz a dele com a
 *  semente). Não muda vida nem ouro: isso é aplicarRodada. */
export function simularRodada(p: Partida, simular: SimularLuta = M().simularLuta): ResultadoRodada {
  const rng = rngDa(p);
  const lutas: LutaDaRodada[] = [];
  for (const [a, b] of p.confrontos) {
    const ja = jogadorDe(p, a);
    if (!estaVivo(ja)) continue;
    const entradaA = montarTime(ja);
    const entradaB = ehMonstros(b) ? timeMonstros(p)
      : ehFantasma(b) ? montarTime(jogadorDe(p, donoDoFantasma(b)), b)
      : montarTime(jogadorDe(p, b));
    const semente = rng.semente();
    const resultado = simular(entradaA, entradaB, semente, a === p.voce);
    lutas.push({ a, b, entradaA, entradaB, semente, resultado });
  }
  p.fase = 'luta';
  return { estagio: p.estagio, rodada: p.rodada, lutas };
}

// ---------- aplicar ----------

/** Overwatch e Deadlock depois da luta, pra um jogador de verdade. */
function tracosDepoisDaLuta(j: Jogador, time: EntradaTime, res: ResultadoLuta, lado: Lado): void {
  const us = time.lutadores.flatMap(l => (l.unidade ? [l.unidade] : []));
  const ow = nivelTraco(us, 'overwatch');
  if (ow >= 0) {
    const danos = porUid(res.dano, lado, time);
    let melhor: number | null = null, maior = 0;
    for (const u of us) {
      const d = danos.get(u.uid) ?? 0;
      if (origemDe(u) === 'overwatch' && d > maior) { melhor = u.uid; maior = d; }
    }
    const heroi = melhor != null ? j.unidades[melhor] : undefined;
    if (heroi) {
      const b = porDegrau(BONUS_OVERWATCH, ow);
      heroi.bonus = { vida: (heroi.bonus?.vida ?? 0) + b, dano: (heroi.bonus?.dano ?? 0) + b };
    }
  }
  const dl = nivelTraco(us, 'deadlock');
  if (dl >= 0) {
    const abates = porUid(res.abates, lado, time);
    let n = 0;
    for (const u of us) if (origemDe(u) === 'deadlock') n += abates.get(u.uid) ?? 0;
    n *= porDegrau(ALMAS_POR_ABATE, dl);
    const antes = j.almas;
    j.almas += n;
    j.ouro += Math.floor(j.almas / 10) - Math.floor(antes / 10);
  }
}

/** Sujimon (3 ou 4 no tabuleiro): depois de vencer monstros, um Sujimon de custo até 3 de graça no banco. */
function recrutarSujimon(p: Partida, j: Jogador, time: EntradaTime, rng: Rng): void {
  const us = time.lutadores.flatMap(l => (l.unidade ? [l.unidade] : []));
  const nivel = nivelTraco(us, 'sujimon');
  const chance = nivel >= 0 ? porDegrau(CHANCE_SUJIMON, nivel) : 0;
  if (!chance || !rng.chance(chance)) return;
  const candidatos = S().dados.campeoes.filter(c => c.fr === 'sujimon' && c.custo <= CUSTO_MAX_SUJIMON && !c.stand);
  const c = rng.pesado(candidatos, x => p.pool[x.id] ?? 0);
  if (c) darUnidade(p, j, c.id, rng);
}

function registrar(p: Partida, j: Jogador, venceu: boolean): void {
  (p.historico[j.id] ??= []).push(venceu ? 'v' : 'd');
}
function lembrarAdversario(j: Jogador, id: string): void {
  j.ultimosAdversarios.push(id);
  if (j.ultimosAdversarios.length > 3) j.ultimosAdversarios.splice(0, j.ultimosAdversarios.length - 3);
}

/** Aplica os resultados da rodada: vida, ouro, sequência, componentes, traços, eliminações. */
export function aplicarRodada(p: Partida, rr: ResultadoRodada): void {
  const rng = rngDa(p);
  const estagio = rr.estagio;
  for (const luta of rr.lutas) {
    const A = jogadorDe(p, luta.a);
    const res = luta.resultado;
    const venceuA = res.vencedor === 'a', venceuB = res.vencedor === 'b';
    tracosDepoisDaLuta(A, luta.entradaA, res, 'a');
    A.ouro += res.ouro.a - (A.bot ? 0 : moedasProChao(A, res, 'a'));
    registrar(p, A, venceuA);
    if (luta.a === p.voce) {
      const { gravacao: _g, ...semGravacao } = res;
      p.ultimaLuta = semGravacao;
    }
    if (ehMonstros(luta.b)) {
      const chefe = luta.entradaB.lutadores.some(l => l.monstro?.chefe);
      if (venceuA) {
        const n = chefe ? 2 : 1;
        for (let k = 0; k < n; k++) A.itens.push(COMPONENTES[rng.int(COMPONENTES.length)]!);
        A.ouro += n;
        recrutarSujimon(p, A, luta.entradaA, rng);
      } else {
        A.ouro += 1;
        A.vida -= danoMonstros(estagio);
      }
      continue;
    }
    const fantasma = ehFantasma(luta.b);
    const idB = fantasma ? donoDoFantasma(luta.b) : luta.b;
    lembrarAdversario(A, idB);
    A.sequencia = novaSequencia(A.sequencia, venceuA);
    if (venceuA) A.ouro += OURO_VITORIA;
    else A.vida -= danoDerrota(estagio, estrelasVivas(res, 'b', luta.entradaB));
    if (fantasma) continue;
    // o lado B é um jogador de verdade
    const B = jogadorDe(p, luta.b);
    tracosDepoisDaLuta(B, luta.entradaB, res, 'b');
    B.ouro += res.ouro.b - (B.bot ? 0 : moedasProChao(B, res, 'b'));
    registrar(p, B, venceuB);
    lembrarAdversario(B, A.id);
    B.sequencia = novaSequencia(B.sequencia, venceuB);
    if (venceuB) B.ouro += OURO_VITORIA;
    else B.vida -= danoDerrota(estagio, estrelasVivas(res, 'a', luta.entradaA));
  }
  eliminar(p);
  p.fase = acabou(p) ? 'fim' : 'resultado';
}

/** Quem ficou sem vida sai: colocação = vivos + 1 (empate na mesma rodada: quem tem mais vida fica na frente).
 *  Sobrou um: colocação 1. As cópias de quem saiu voltam pro pool. */
export function eliminar(p: Partida): void {
  const mortos = p.jogadores.filter(j => j.colocacao == null && j.vida <= 0).sort((a, b) => b.vida - a.vida);
  const restantes = vivos(p).length;
  mortos.forEach((j, i) => {
    j.colocacao = restantes + 1 + i;
    j.vida = 0;
    devolverTudo(p, j);
  });
  if (restantes === 0 && mortos.length) mortos.forEach((j, i) => { j.colocacao = i + 1; });
  const vs = vivos(p);
  if (vs.length === 1) vs[0]!.colocacao = 1;
}

export const acabou = (p: Partida): boolean => p.jogadores.every(j => j.colocacao != null);

// ---------- próxima rodada ----------

/** Monta a rodada atual: monstros e confrontos. */
export function montarRodada(p: Partida, rng: Rng): void {
  p.monstros = gerarMonstros(p.estagio, p.rodada, p.tipo, rng);
  p.confrontos = confrontosDaRodada(p, p.tipo, rng);
}

/** Avança pra próxima rodada: carrossel (começo de cada estágio a partir do 2; os campeões dele saem do pool antes
 *  das lojas), renda, XP, loja nova (se não travada), monstros e confrontos. Com carrossel a partida fica na fase
 *  'carrossel' (terminarCarrossel leva pro planejamento); sem, já no planejamento. Os bots jogam o planejamento
 *  depois (jogarBots). */
export function avancarRodada(p: Partida): void {
  if (acabou(p)) { p.fase = 'fim'; return; }
  const tipos = rodadasDoEstagio(p.estagio);
  if (p.rodada < tipos.length) p.rodada++;
  else { p.estagio++; p.rodada = 1; }
  p.tipo = rodadasDoEstagio(p.estagio)[p.rodada - 1]!;
  const rng = rngDa(p);
  p.fase = 'planejamento';
  if (temCarrossel(p.estagio, p.rodada)) montarCarrossel(p, rng);
  for (const j of vivos(p)) {
    j.ouro += rendaDaRodada(p.estagio, p.rodada, j.ouro, j.sequencia);
    ganharXp(j, XP_POR_RODADA);
    if (!j.lojaTravada) sortearLoja(p, j, rng);
  }
  montarRodada(p, rng);
}
