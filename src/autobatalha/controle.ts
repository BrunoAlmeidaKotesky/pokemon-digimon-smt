// Controle da partida da Autobatalha: guarda a partida em andamento, roda o relógio do planejamento, os bots e as
// lutas, e avisa a tela a cada mudança (useSyncExternalStore, como src/state/app.ts). A tela só lê EstadoTela
// (useAutobatalha) e chama `acoes` (contrato em api.ts).
//
// Ciclo: [carrossel no começo de cada estágio a partir do 2: as duplas são liberadas no tempo, o humano clica numa
// opção] → planejamento (bots jogam no começo; a partida é salva; relógio ou "Pronto") → luta (todas simuladas de uma
// vez; a do humano é reproduzida em tempo real × velocidade) → resultado (~1,5 s) → próxima rodada. Com o humano
// eliminado, o resto da partida corre sem mostrar e a tela vai pro fim.
//
// A partida é trocada por uma cópia a cada mudança (estado.partida muda de referência), então a tela pode
// comparar referências. Sem ninguém olhando (aba fechada), o relógio, o carrossel e a luta ficam pausados.
import { useSyncExternalStore } from 'react';
import type { Acoes, Config, EstadoCarrossel, EstadoTela, Velocidade } from './api';
import { atributosDaUnidade, simularLuta } from './combate';
import { combinar, contarTracos, ehComponente } from './conteudo';
import { carregarSet, S } from './dados';
import * as P from './partida';
import type { Fase, Onde, Partida } from './tipos';

P.definirMotor({ simularLuta, atributosDaUnidade, contarTracos, combinar, ehComponente });

// ---------- configuração ----------

export const CHAVE_CONFIG = 'pdx-autobatalha-config';
export const CONFIG_PADRAO: Config = { relogio: true, segundos: 35, velocidade: 1, dificuldade: 'facil', volume: 0.6 };
/** tempo da tela de resultado entre a luta e o próximo planejamento */
export const MS_RESULTADO = 1500;
/** tick da reprodução da luta */
export const MS_TICK_LUTA = 50;
/** tick do carrossel (libera as duplas e anda o tempo da tela) */
export const MS_TICK_CARROSSEL = 200;
/** todos já pegaram no carrossel: ele fecha este tanto de segundos depois */
export const S_FECHAR_CARROSSEL = 1.5;
const MS_AVISO = 2500;

function lerConfig(): Config {
  try {
    const c = JSON.parse(globalThis.localStorage?.getItem(CHAVE_CONFIG) ?? 'null') as Partial<Config> | null;
    if (!c || typeof c !== 'object') return { ...CONFIG_PADRAO };
    return normalizarConfig({ ...CONFIG_PADRAO, ...c });
  } catch { return { ...CONFIG_PADRAO }; }
}
function normalizarConfig(c: Config): Config {
  const v: Velocidade = c.velocidade === 2 || c.velocidade === 4 ? c.velocidade : 1;
  const segundos = Number.isFinite(c.segundos) ? Math.min(300, Math.max(5, Math.round(c.segundos))) : CONFIG_PADRAO.segundos;
  const dificuldade = c.dificuldade === 'normal' || c.dificuldade === 'dificil' ? c.dificuldade : 'facil';
  const volume = Number.isFinite(c.volume) ? Math.min(1, Math.max(0, c.volume)) : CONFIG_PADRAO.volume;
  return { relogio: c.relogio !== false, segundos, velocidade: v, dificuldade, volume };
}
function gravarConfig(c: Config): void {
  try { globalThis.localStorage?.setItem(CHAVE_CONFIG, JSON.stringify(c)); } catch { /* sem localStorage */ }
}

// ---------- estado e assinatura ----------

let partida: Partida | null = null;
let pendente: P.ResultadoRodada | null = null;
let estado: EstadoTela = {
  carregando: false, erro: null, partida: null, relogio: null, reproducao: null, config: lerConfig(),
  temSalva: false, carrossel: null, olhando: null, aviso: null,
};
/** segundos desde o começo do carrossel, e o segundo em que ele acaba */
let tCarrossel = 0;
let fimCarrossel = 0;

const ouvintes = new Set<() => void>();

function estadoDoCarrossel(p: Partida | null): EstadoCarrossel | null {
  const c = p?.fase === 'carrossel' ? p.carrossel : undefined;
  if (!p || !c) return null;
  return {
    opcoes: c.opcoes, grupos: c.grupos, liberados: c.liberados, horarios: c.grupos.map((_, k) => P.horarioDoGrupo(k)),
    tempo: tCarrossel, fim: fimCarrossel, podePegar: P.podePegar(p, p.voce),
  };
}

/** Avisa a tela. `copiar` = a partida mudou (troca por uma cópia, pra mudar a referência). */
function publicar(copiar = false): void {
  if (copiar && partida) partida = structuredClone(partida);
  estado = { ...estado, partida, carrossel: estadoDoCarrossel(partida) };
  ouvintes.forEach(l => l());
}
function mudar(m: Partial<EstadoTela>, copiar = false): void {
  estado = { ...estado, ...m };
  publicar(copiar);
}

function assinar(l: () => void): () => void {
  ouvintes.add(l);
  if (ouvintes.size === 1) retomar();
  return () => {
    ouvintes.delete(l);
    if (ouvintes.size === 0) pausar();
  };
}

export function useAutobatalha(): EstadoTela {
  return useSyncExternalStore(assinar, () => estado, () => estado);
}
/** Estado atual sem hook (testes, atalhos de teclado). */
export const estadoAutobatalha = (): EstadoTela => estado;

// ---------- relógios ----------

let timerRelogio: ReturnType<typeof setInterval> | null = null;
let timerLuta: ReturnType<typeof setInterval> | null = null;
let timerCarrossel: ReturnType<typeof setInterval> | null = null;
let timerResultado: ReturnType<typeof setTimeout> | null = null;
let timerAviso: ReturnType<typeof setTimeout> | null = null;
/** fim do planejamento (Date.now) */
let prazo: number | null = null;
/** o que faltava do planejamento quando pausou (ms) */
let restante: number | null = null;
let ultimoTick = 0;
let pausado = false;

function pararRelogio(): void { if (timerRelogio) clearInterval(timerRelogio); timerRelogio = null; }
function pararLuta(): void { if (timerLuta) clearInterval(timerLuta); timerLuta = null; }
function pararCarrossel(): void { if (timerCarrossel) clearInterval(timerCarrossel); timerCarrossel = null; }
function pararResultado(): void { if (timerResultado) clearTimeout(timerResultado); timerResultado = null; }
function pararTudo(): void {
  pararRelogio(); pararLuta(); pararCarrossel(); pararResultado();
  prazo = null; restante = null; pendente = null; tCarrossel = 0; fimCarrossel = 0;
}

const segundosDoPlanejamento = (p: Partida, c: Config) => (p.estagio <= 1 ? Math.round((c.segundos * 2) / 3) : c.segundos);

/** Liga o relógio do planejamento com `ms` de prazo (padrão: o tempo cheio da rodada). */
function ligarRelogio(ms?: number): void {
  pararRelogio();
  const p = partida;
  if (!p || p.fase !== 'planejamento' || !estado.config.relogio) { prazo = null; estado = { ...estado, relogio: null }; return; }
  const total = ms ?? segundosDoPlanejamento(p, estado.config) * 1000;
  prazo = Date.now() + total;
  estado = { ...estado, relogio: Math.ceil(total / 1000) };
  if (pausado) { restante = total; return; }
  timerRelogio = setInterval(tickRelogio, 250);
}
function tickRelogio(): void {
  if (prazo == null) return;
  const falta = Math.max(0, Math.ceil((prazo - Date.now()) / 1000));
  if (falta <= 0) { terminarPlanejamento(); return; }
  if (falta !== estado.relogio) mudar({ relogio: falta });
}

function ligarLuta(): void {
  pararLuta();
  ultimoTick = Date.now();
  if (!pausado) timerLuta = setInterval(tickLuta, MS_TICK_LUTA);
}
function tickLuta(): void {
  const r = estado.reproducao;
  if (!r || r.acabou) { pararLuta(); return; }
  const agora = Date.now();
  const t = r.t + ((agora - ultimoTick) / 1000) * estado.config.velocidade;
  ultimoTick = agora;
  if (t >= r.resultado.duracao) { terminarLuta(); return; }
  mudar({ reproducao: { ...r, t } });
}

function ligarCarrossel(): void {
  pararCarrossel();
  ultimoTick = Date.now();
  if (!pausado) timerCarrossel = setInterval(tickCarrossel, MS_TICK_CARROSSEL);
}
/** Todos já pegaram: o carrossel fecha logo (não espera o fim do tempo). */
function encurtarCarrossel(p: Partida): void {
  if (P.todosPegaram(p)) fimCarrossel = Math.min(fimCarrossel, tCarrossel + S_FECHAR_CARROSSEL);
}
function tickCarrossel(): void {
  const p = partida;
  if (!p?.carrossel || p.fase !== 'carrossel') { pararCarrossel(); return; }
  const agora = Date.now();
  tCarrossel += (agora - ultimoTick) / 1000;
  ultimoTick = agora;
  const liberou = P.avancarCarrossel(p, tCarrossel) > 0;
  encurtarCarrossel(p);
  if (tCarrossel >= fimCarrossel) { fecharCarrossel(); return; }
  publicar(liberou);
}

function pausar(): void {
  pausado = true;
  if (timerRelogio && prazo != null) restante = Math.max(0, prazo - Date.now());
  pararRelogio(); pararLuta(); pararCarrossel(); pararResultado();
}
function retomar(): void {
  if (!pausado) return;
  pausado = false;
  const p = partida;
  if (!p) return;
  if (p.fase === 'planejamento' && restante != null) { const ms = restante; restante = null; ligarRelogio(ms); }
  else if (p.fase === 'carrossel' && p.carrossel) ligarCarrossel();
  else if (p.fase === 'luta' && estado.reproducao && !estado.reproducao.acabou) ligarLuta();
  else if (p.fase === 'resultado') timerResultado = setTimeout(depoisDoResultado, MS_RESULTADO);
}

// ---------- ciclo da rodada ----------

/** Começo do estágio com carrossel: o tempo corre (as duplas são liberadas) até o fim, e aí vem o planejamento. */
function comecarCarrossel(): void {
  const p = partida;
  if (!p?.carrossel) { comecarPlanejamento(); return; }
  tCarrossel = 0;
  fimCarrossel = P.duracaoDoCarrossel(p.carrossel);
  estado = { ...estado, reproducao: null, relogio: null };
  ligarCarrossel();
  publicar(true);
}

/** Fim do carrossel: quem não pegou leva uma ao acaso, o resto volta pro pool e começa o planejamento. */
function fecharCarrossel(): void {
  pararCarrossel();
  const p = partida;
  if (!p) return;
  const c = p.carrossel;
  const jaTinha = !c || P.jaPegou(c, p.voce);
  P.terminarCarrossel(p);
  const minha = c?.opcoes.find(o => o.pegou === p.voce);
  if (minha && !jaTinha) {
    const nome = S().temForma(minha.forma) ? S().forma(minha.forma).nome : S().campeao(minha.campeao).nome;
    avisar(`Você levou ${nome} do carrossel ao acaso${minha.vendido ? ' (banco cheio: vendido)' : ''}`);
  }
  tCarrossel = 0;
  comecarPlanejamento();
}

function comecarPlanejamento(): void {
  const p = partida;
  if (!p) return;
  p.fase = 'planejamento';
  P.jogarBots(p);
  P.salvarPartida(p);
  estado = { ...estado, temSalva: true, reproducao: null };
  ligarRelogio();
  publicar(true);
}

function terminarPlanejamento(): void {
  const p = partida;
  if (!p || p.fase !== 'planejamento') return;
  pararRelogio();
  prazo = null; restante = null;
  P.fimDoPlanejamento(p);
  pendente = P.simularRodada(p);
  const minha = pendente.lutas.find(l => l.a === p.voce);
  if (!minha) { estado = { ...estado, relogio: null }; terminarLuta(); return; }
  estado = { ...estado, relogio: null, reproducao: { resultado: minha.resultado, adversario: minha.b, t: 0, acabou: false } };
  publicar(true);
  ligarLuta();
}

function terminarLuta(): void {
  pararLuta();
  const p = partida;
  if (!p || !pendente) return;
  const r = estado.reproducao;
  if (r) estado = { ...estado, reproducao: { ...r, t: r.resultado.duracao, acabou: true } };
  P.aplicarRodada(p, pendente);
  pendente = null;
  publicar(true);
  pararResultado();
  if (!pausado) timerResultado = setTimeout(depoisDoResultado, MS_RESULTADO);
}

/** Humano eliminado: o resto da partida corre sem mostrar, só pra fechar as colocações dos bots. */
function correrAteOFim(p: Partida): void {
  for (let guarda = 0; guarda < 400 && !P.acabou(p); guarda++) {
    P.avancarRodada(p);
    if (P.acabou(p)) break;
    if (p.fase === 'carrossel') P.terminarCarrossel(p);
    P.jogarBots(p);
    P.fimDoPlanejamento(p);
    P.aplicarRodada(p, P.simularRodada(p));
  }
  p.fase = 'fim';
}

function depoisDoResultado(): void {
  timerResultado = null;
  const p = partida;
  if (!p) return;
  const eu = P.humano(p);
  if (P.acabou(p) || eu.colocacao != null) {
    correrAteOFim(p);
    P.apagarPartida();
    mudar({ temSalva: false, reproducao: null, relogio: null }, true);
    return;
  }
  P.avancarRodada(p);
  if (p.fase === 'carrossel') comecarCarrossel();
  else comecarPlanejamento();
}

// ---------- avisos e ações do humano ----------

function avisar(msg: string): void {
  if (timerAviso) clearTimeout(timerAviso);
  estado = { ...estado, aviso: msg };
  timerAviso = setTimeout(() => {
    timerAviso = null;
    if (estado.aviso === msg) mudar({ aviso: null });
  }, MS_AVISO);
}

/** fases em que o humano mexe na loja, no banco e nos itens (o tabuleiro, só no planejamento) */
const FASES_DE_JOGO: readonly Fase[] = ['carrossel', 'planejamento', 'luta', 'resultado'];

/** Roda uma ação do humano (vivo, em fase de jogo) e mostra a mensagem se não deu. */
function acao(f: (p: Partida, id: string) => string | null | void, fases: readonly Fase[] = FASES_DE_JOGO): void {
  const p = partida;
  if (!p || !fases.includes(p.fase)) return;
  if (!P.estaVivo(P.humano(p))) return;
  const msg = f(p, p.voce);
  if (msg) avisar(msg);
  publicar(true);
}

/** Confere se a partida salva ainda bate com o set carregado (campeões e formas existem). */
function partidaValida(p: Partida): boolean {
  try {
    for (const j of p.jogadores) for (const u of Object.values(j.unidades)) { S().campeao(u.campeao); S().forma(u.forma); }
    for (const id of Object.keys(p.pool)) S().campeao(id);
    return true;
  } catch { return false; }
}

export const acoes: Acoes = {
  async carregar() {
    if (estado.carregando) return;
    mudar({ carregando: true, erro: null });
    try {
      await carregarSet();
      mudar({ carregando: false, temSalva: P.temPartidaSalva() });
    } catch (e) {
      mudar({ carregando: false, erro: `Não deu pra baixar o set da Autobatalha (${e instanceof Error ? e.message : String(e)})` });
    }
  },

  novaPartida(semente) {
    pararTudo();
    try {
      partida = P.novaPartida(semente ?? (Date.now() >>> 0), undefined, estado.config.dificuldade);
    } catch (e) {
      partida = null;
      mudar({ erro: `Não deu pra começar a partida (${e instanceof Error ? e.message : String(e)})` });
      return;
    }
    estado = { ...estado, erro: null, olhando: null, reproducao: null, aviso: null };
    comecarPlanejamento();
  },

  continuar() {
    const p = P.carregarPartida();
    if (!p || !partidaValida(p)) {
      if (p) P.apagarPartida();
      mudar({ temSalva: false, aviso: p ? 'A partida salva é de outra versão do set' : null });
      return;
    }
    pararTudo();
    partida = p;
    estado = { ...estado, erro: null, olhando: null, reproducao: null };
    if (p.fase === 'fim') { mudar({ relogio: null }, true); return; }
    // a partida é salva no começo do planejamento, com os bots já jogados (carrossel aberto num salvo antigo: fecha)
    if (p.carrossel) P.terminarCarrossel(p);
    p.fase = 'planejamento';
    ligarRelogio();
    publicar(true);
  },

  abandonar() {
    pararTudo();
    P.apagarPartida();
    partida = null;
    mudar({ temSalva: false, reproducao: null, relogio: null, olhando: null, aviso: null });
  },

  comprar: i => acao((p, id) => P.comprar(p, id, i)),
  vender: uid => acao((p, id) => P.vender(p, id, uid)),
  atualizarLoja: () => acao((p, id) => P.atualizarLoja(p, id)),
  comprarXp: () => acao((p, id) => P.comprarXp(p, id)),
  travarLoja: () => acao((p, id) => P.travarLoja(p, id)),

  mover(uid: number, para: Onde) {
    acao((p, id) => {
      const j = P.jogadorDe(p, id);
      const mexeNoTabuleiro = para.tipo === 'tabuleiro' || P.ondeEsta(j, uid)?.tipo === 'tabuleiro';
      if (mexeNoTabuleiro && p.fase !== 'planejamento') return 'O tabuleiro só muda no planejamento';
      return P.mover(p, id, uid, para);
    });
  },

  equipar: (i, uid) => acao((p, id) => P.equipar(p, id, i, uid)),
  escolherEvolucao: forma => acao((p, id) => P.escolherEvolucao(p, id, forma)),
  pegarCarrossel(i) {
    acao((p, id) => {
      const msg = P.pegarCarrossel(p, id, i);
      if (msg) return msg;
      encurtarCarrossel(p);
      return p.carrossel?.opcoes[i]?.vendido ? 'Banco cheio: o campeão foi vendido (o item ficou)' : null;
    }, ['carrossel']);
  },
  escolherUlt: (uid, ult) => acao((p, id) => P.escolherUlt(p, id, uid, ult)),
  alternarPosicao: uid => acao((p, id) => P.alternarPosicao(p, id, uid)),

  pronto() { terminarPlanejamento(); },

  velocidade(v) {
    const config = normalizarConfig({ ...estado.config, velocidade: v });
    gravarConfig(config);
    mudar({ config });
  },

  pularLuta() {
    if (estado.reproducao && !estado.reproducao.acabou && pendente) terminarLuta();
  },

  configurar(c) {
    const antes = estado.config;
    const config = normalizarConfig({ ...antes, ...c });
    gravarConfig(config);
    estado = { ...estado, config };
    if (partida?.fase === 'planejamento' && config.relogio !== antes.relogio) ligarRelogio();
    publicar();
  },

  olhar(id) { mudar({ olhando: id }); },
};
