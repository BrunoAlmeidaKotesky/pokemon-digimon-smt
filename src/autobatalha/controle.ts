// Controle da partida da Autobatalha: guarda a partida em andamento, roda o relógio do planejamento, os bots e as
// lutas, e avisa a tela a cada mudança (useSyncExternalStore, como src/state/app.ts). A tela lê EstadoTela e chama as
// ações pela sessão (sessao.ts; contrato em api.ts).
//
// Ciclo: [carrossel no começo de cada estágio a partir do 2: as duplas são liberadas no tempo, os humanos clicam numa
// opção] → planejamento (bots jogam e votam "Pronto" no começo; no solo a partida é salva; acaba no relógio ou quando
// todos os vivos votaram "Pronto") → luta (todas simuladas de uma vez; a de quem joga nesta tela é reproduzida em
// tempo real × velocidade) → resultado (~1,5 s) → próxima rodada. Sem nenhum humano vivo, o resto da partida corre
// sem mostrar e a tela vai pro fim.
//
// Sala online: no navegador do anfitrião, este controle roda a partida de todos (online/anfitriao.ts liga os ganchos
// com ligarAnfitriao). Os convidados são humanos da partida (Jogador.bot false); as ações deles chegam por acaoDe (com
// o id que a conexão garante), quem cai fica `ausente` e um bot joga por ele, e a luta só acaba quando todos os
// humanos terminaram de ver a sua (viuLuta) ou no limite de tempo. O anfitrião não pausa (a partida é de todos) e não
// salva a partida online no lugar da solo.
//
// A partida é trocada por uma cópia a cada mudança (estado.partida muda de referência), então a tela pode
// comparar referências. No solo, sem ninguém olhando (aba fechada), o relógio, o carrossel e a luta ficam pausados.
import { useSyncExternalStore } from 'react';
import type { Acoes, Config, EstadoOnline, EstadoSala, EstadoTela, RegrasSala, Velocidade } from './api';
import { atributosDaUnidade, simularLuta } from './combate';
import { combinar, contarTracos, ehComponente } from './conteudo';
import { carregarSet, S, setCarregado } from './dados';
import { estadoDaVotacao, estadoDoCarrossel, humanosPresentes } from './derivados';
import { ESTILO_PADRAO, estiloOuPadrao } from './estilos';
import { ID_ANFITRIAO, nomePadraoDoLugar, SUFIXO_TESTE } from './online/parametros';
import type { TempoPartida } from './online/protocolo';
import * as P from './partida';
import type { AcaoJogador, EscolhasJogador, HumanoSala, Onde, Partida } from './tipos';

P.definirMotor({ simularLuta, atributosDaUnidade, contarTracos, combinar, ehComponente });

// ---------- configuração ----------

export const CHAVE_CONFIG = 'pdx-autobatalha-config';
export const CONFIG_PADRAO: Config = {
  relogio: true, segundos: 35, dificuldade: 'facil',
  nome: '', avatar: null, estilo: ESTILO_PADRAO,
  velocidade: 1, volume: 0.6,
};
/** campos da configuração que são regras da sala: só o anfitrião muda */
export const CAMPOS_SALA: readonly (keyof RegrasSala)[] = ['relogio', 'segundos', 'dificuldade'];
/** tempo da tela de resultado entre a luta e o próximo planejamento */
export const MS_RESULTADO = 1500;
/** tick da reprodução da luta */
export const MS_TICK_LUTA = 50;
/** apresentação dos dois lados (o "clash", com "VS") antes de cada luta: a reprodução só começa a correr depois */
export const MS_CLASH = 1500;
/** tick do carrossel (libera as duplas e anda o tempo da tela) */
export const MS_TICK_CARROSSEL = 200;
/** todos já pegaram no carrossel: ele fecha este tanto de segundos depois */
export const S_FECHAR_CARROSSEL = 1.5;
const MS_AVISO = 2500;
/** online: folga do limite da luta (todos já deviam ter visto a sua; quem não avisou é esperado só até aqui) */
export const MS_FOLGA_LUTA = 4000;

/** chave da configuração (`?transporte=local&jogador=N` dos testes separa a de cada aba; no site é sempre a mesma) */
const chaveConfig = (): string => CHAVE_CONFIG + SUFIXO_TESTE;

function lerConfig(): Config {
  try {
    return normalizarConfig(JSON.parse(globalThis.localStorage?.getItem(chaveConfig()) ?? 'null'));
  } catch { return { ...CONFIG_PADRAO }; }
}
const numero = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);
/** Configuração válida a partir do que veio do armazenamento: o que faltar (config antiga, sem os campos da sala e
 *  do jogador) ou vier errado fica com o padrão. */
export function normalizarConfig(bruto: unknown): Config {
  const c = (bruto && typeof bruto === 'object' ? bruto : {}) as Partial<Record<keyof Config, unknown>>;
  const velocidade: Velocidade = c.velocidade === 2 || c.velocidade === 4 ? c.velocidade : 1;
  const s = numero(c.segundos);
  const segundos = s != null ? Math.min(300, Math.max(5, Math.round(s))) : CONFIG_PADRAO.segundos;
  const dificuldade = c.dificuldade === 'normal' || c.dificuldade === 'dificil' ? c.dificuldade : 'facil';
  const v = numero(c.volume);
  const volume = v != null ? Math.min(1, Math.max(0, v)) : CONFIG_PADRAO.volume;
  const avatar = typeof c.avatar === 'string' && c.avatar && c.avatar.length <= 200 ? c.avatar : null;
  return {
    relogio: c.relogio !== false, segundos, dificuldade,
    nome: P.limparNome(c.nome), avatar, estilo: estiloOuPadrao(c.estilo),
    velocidade, volume,
  };
}
function gravarConfig(c: Config): void {
  try { globalThis.localStorage?.setItem(chaveConfig(), JSON.stringify(c)); } catch { /* sem localStorage */ }
}

// ---------- estado e assinatura ----------

let partida: Partida | null = null;
let pendente: P.ResultadoRodada | null = null;
let estado: EstadoTela = {
  carregando: false, erro: null, partida: null, relogio: null, reproducao: null, config: lerConfig(), sala: null,
  temSalva: false, carrossel: null, votacao: null, olhando: null, aviso: null, online: null,
};
/** segundos desde o começo do carrossel, e o segundo em que ele acaba */
let tCarrossel = 0;
let fimCarrossel = 0;

// ---------- sala (lobby) ----------
// A sala separa o que é do anfitrião (RegrasSala: relógio, segundos, dificuldade) do que é de cada jogador
// (EscolhasJogador: nome, ícone, estilo). No solo você é o anfitrião; online, quem criou a sala, e os convidados entram
// nos lugares seguintes (os ganchos do anfitrião dizem quem são).

/** semente da próxima partida: o lobby mostra os bots com o ícone e o estilo que vão ter nela */
let sementeSala = Date.now() >>> 0;
const novaSementeSala = () => { sementeSala = (Math.floor(Math.random() * 4294967296) ^ Date.now()) >>> 0; };

export const escolhasDe = (c: Config): EscolhasJogador => ({ nome: c.nome, avatar: c.avatar, estilo: c.estilo });

/** Os humanos da sala online: você (o anfitrião) e os convidados dos ganchos. */
function humanosDaSala(config: Config, g: GanchosAnfitriao): HumanoSala[] {
  const eu: HumanoSala = { id: ID_ANFITRIAO, escolhas: escolhasDe(config), nomePadrao: nomePadraoDoLugar(ID_ANFITRIAO), anfitriao: true, conectado: true };
  return [eu, ...g.convidados()];
}

/** A sala da próxima partida (null sem o set: os ícones dos bots saem dele). */
function montarSala(config: Config): EstadoSala | null {
  if (!setCarregado()) return null;
  if (anfitriao) {
    return { semente: sementeSala, anfitriao: ID_ANFITRIAO, voce: ID_ANFITRIAO, lugares: P.lugaresComHumanos(sementeSala, humanosDaSala(config, anfitriao)) };
  }
  return { semente: sementeSala, anfitriao: P.ID_HUMANO, voce: P.ID_HUMANO, lugares: P.lugaresDaSala(sementeSala, escolhasDe(config)) };
}

/** você muda as regras da sala (sem sala ainda, é solo: sim) */
const souAnfitriao = (): boolean => !estado.sala || estado.sala.anfitriao === estado.sala.voce;

const ouvintes = new Set<() => void>();

// ---------- sala online (anfitrião) ----------

/** O que o anfitrião online (online/anfitriao.ts) liga no controle. */
export interface GanchosAnfitriao {
  /** os convidados da sala (sem você), na ordem dos lugares, com as escolhas e se estão conectados */
  convidados(): HumanoSala[];
  /** a partida, o tempo, a sala ou as regras mudaram: manda a visão de cada um (juntando mudanças seguidas) */
  mudou(): void;
  /** a luta da rodada começou (todas simuladas): manda a de cada convidado */
  lutas(rr: P.ResultadoRodada): void;
  /** mensagem curta pra um convidado (o resultado de uma ação dele) */
  avisar(id: string, msg: string): void;
}
let anfitriao: GanchosAnfitriao | null = null;
/** humanos que já viram a luta desta rodada: a rodada só segue quando todos viram (ou no limite, online) */
const viram = new Set<string>();
let timerLimiteLuta: ReturnType<typeof setTimeout> | null = null;
/** id desta partida pros convidados (no lugar da semente, que deixaria prever a loja) */
let idPartida = 0;

/** Avisa a tela. `copiar` = a partida mudou (troca por uma cópia, pra mudar a referência). */
function publicar(copiar = false): void {
  if (copiar && partida) partida = structuredClone(partida);
  estado = { ...estado, partida, carrossel: estadoDoCarrossel(partida, tCarrossel, fimCarrossel), votacao: estadoDaVotacao(partida) };
  ouvintes.forEach(l => l());
  anfitriao?.mudou();
}
function mudar(m: Partial<EstadoTela>, copiar = false): void {
  estado = { ...estado, ...m };
  publicar(copiar);
}

/** Ouve as mudanças. No solo, sem ninguém ouvindo, a partida pausa; o anfitrião online nunca pausa. */
export function assinar(l: () => void): () => void {
  ouvintes.add(l);
  if (ouvintes.size === 1) retomar();
  return () => {
    ouvintes.delete(l);
    if (ouvintes.size === 0 && !anfitriao) pausar();
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
let timerClash: ReturnType<typeof setTimeout> | null = null;
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
function pararLuta(): void {
  if (timerLuta) clearInterval(timerLuta);
  if (timerClash) clearTimeout(timerClash);
  timerLuta = null; timerClash = null;
}
function pararCarrossel(): void { if (timerCarrossel) clearInterval(timerCarrossel); timerCarrossel = null; }
function pararResultado(): void { if (timerResultado) clearTimeout(timerResultado); timerResultado = null; }
function pararLimiteLuta(): void { if (timerLimiteLuta) clearTimeout(timerLimiteLuta); timerLimiteLuta = null; }
function pararTudo(): void {
  pararRelogio(); pararLuta(); pararCarrossel(); pararResultado(); pararLimiteLuta();
  prazo = null; restante = null; pendente = null; tCarrossel = 0; fimCarrossel = 0;
  viram.clear();
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

/** Liga a reprodução: primeiro a apresentação (MS_CLASH, reproducao.comecou = false), depois o tempo corre. Pausar no
 *  meio da apresentação recomeça ela ao voltar. */
function ligarLuta(): void {
  pararLuta();
  if (pausado) return;
  if (estado.reproducao && !estado.reproducao.comecou) { timerClash = setTimeout(comecarLuta, MS_CLASH); return; }
  ultimoTick = Date.now();
  timerLuta = setInterval(tickLuta, MS_TICK_LUTA);
}
function comecarLuta(): void {
  timerClash = null;
  const r = estado.reproducao;
  if (!r || r.acabou) return;
  mudar({ reproducao: { ...r, comecou: true } });
  ligarLuta();
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

/** Mensagem pra um humano: você vê aqui; o convidado recebe pela rede. */
function avisarJogador(id: string, msg: string): void {
  if (id === partida?.voce) avisar(msg);
  else anfitriao?.avisar(id, msg);
}

/** Fim do carrossel: quem não pegou leva uma ao acaso, o resto volta pro pool e começa o planejamento. */
function fecharCarrossel(): void {
  pararCarrossel();
  const p = partida;
  if (!p) return;
  const c = p.carrossel;
  const semPegar = c ? p.jogadores.filter(j => !j.bot && P.estaVivo(j) && !P.jaPegou(c, j.id)).map(j => j.id) : [];
  P.terminarCarrossel(p);
  for (const id of semPegar) {
    const minha = c?.opcoes.find(o => o.pegou === id);
    if (!minha) continue;
    const nome = S().temForma(minha.forma) ? S().forma(minha.forma).nome : S().campeao(minha.campeao).nome;
    avisarJogador(id, `Você levou ${nome} do carrossel ao acaso${minha.vendido ? ' (banco cheio: vendido)' : ''}`);
  }
  tCarrossel = 0;
  comecarPlanejamento();
}

function comecarPlanejamento(): void {
  const p = partida;
  if (!p) return;
  p.fase = 'planejamento';
  // bots (e, online, quem está fora do ar) jogam o planejamento deles e votam "Pronto" (no solo, o voto do humano
  // fecha a votação)
  P.jogarBots(p);
  P.votarBots(p);
  // a partida online não fica salva (não dá pra continuar ela sozinho); a solo, sim
  if (!anfitriao) {
    P.salvarPartida(p);
    estado = { ...estado, temSalva: true };
  }
  estado = { ...estado, reproducao: null };
  ligarRelogio();
  publicar(true);
  conferirVotos();
}

/** Todos os vivos votaram "Pronto": o planejamento acaba na hora. */
function conferirVotos(): void {
  const p = partida;
  if (p?.fase === 'planejamento' && P.todosProntos(p)) terminarPlanejamento();
}

/** Humanos presentes que lutam nesta rodada (cada um vê a sua luta; a rodada espera todos). */
function quemVeALuta(p: Partida, rr: P.ResultadoRodada): string[] {
  const ids = new Set<string>();
  for (const l of rr.lutas) {
    for (const id of [l.a, l.b]) {
      const j = p.jogadores.find(x => x.id === id);
      if (j && !j.bot && !j.ausente) ids.add(id);
    }
  }
  return [...ids];
}

function terminarPlanejamento(): void {
  const p = partida;
  if (!p || p.fase !== 'planejamento') return;
  pararRelogio();
  prazo = null; restante = null;
  P.fimDoPlanejamento(p);
  const rr = P.simularRodada(p);
  pendente = rr;
  viram.clear();
  const minha = rr.lutas.find(l => l.a === p.voce);
  estado = {
    ...estado, relogio: null,
    reproducao: minha ? { resultado: minha.resultado, adversario: minha.b, t: 0, comecou: false, acabou: false } : null,
  };
  publicar(true);
  if (anfitriao) {
    anfitriao.lutas(rr);
    // limite: a luta mais longa dos humanos em 1×, com a apresentação e uma folga (quem não avisar que viu não trava)
    const humanos = new Set(p.jogadores.filter(j => !j.bot).map(j => j.id));
    const maior = Math.max(0, ...rr.lutas.filter(l => humanos.has(l.a) || humanos.has(l.b)).map(l => l.resultado.duracao));
    pararLimiteLuta();
    timerLimiteLuta = setTimeout(aplicarLuta, MS_CLASH + maior * 1000 + MS_FOLGA_LUTA);
  }
  if (minha) ligarLuta();
  else viuLuta(p.voce);
}

/** A reprodução desta tela acabou (chegou no fim ou pulou): você viu a sua luta. */
function terminarLuta(): void {
  pararLuta();
  const r = estado.reproducao;
  if (r && !r.acabou) estado = { ...estado, reproducao: { ...r, t: r.resultado.duracao, comecou: true, acabou: true } };
  const p = partida;
  if (!p || !pendente) return;
  viuLuta(p.voce);
}

/** O humano `id` terminou de ver a luta desta rodada (online, o convidado avisa). Todos viram: a rodada segue. */
export function viuLuta(id: string): void {
  if (!pendente) return;
  viram.add(id);
  conferirLuta();
}

function conferirLuta(): void {
  const p = partida;
  if (!p || !pendente) return;
  if (quemVeALuta(p, pendente).every(id => viram.has(id))) aplicarLuta();
  else publicar();
}

/** Aplica a rodada (vida, ouro, eliminações) e mostra o resultado por um instante. */
function aplicarLuta(): void {
  pararLimiteLuta();
  pararLuta();
  const p = partida;
  if (!p || !pendente) return;
  const r = estado.reproducao;
  if (r && !r.acabou) estado = { ...estado, reproducao: { ...r, t: r.resultado.duracao, comecou: true, acabou: true } };
  P.aplicarRodada(p, pendente);
  pendente = null;
  viram.clear();
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
  // sem nenhum humano vivo e presente (no solo: você eliminado), o resto corre sem mostrar
  if (P.acabou(p) || !humanosPresentes(p).length) {
    correrAteOFim(p);
    if (!anfitriao) P.apagarPartida();
    mudar({ temSalva: anfitriao ? estado.temSalva : false, reproducao: null, relogio: null }, true);
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

/**
 * Ação do humano `id` no próprio Jogador: você (p.voce) pela tela, ou um convidado pela rede (o id vem da conexão).
 * A partida confere a fase (P.aplicarAcao); ação que não vale agora é ignorada. A mensagem ("Ouro insuficiente") vai
 * pra quem agiu.
 */
export function acaoDe(id: string, a: AcaoJogador): void {
  const p = partida;
  if (!p || !P.podeAgir(p, id, a)) return;
  let msg = P.aplicarAcao(p, id, a);
  if (a.tipo === 'carrossel' && !msg) {
    encurtarCarrossel(p);
    if (p.carrossel?.opcoes[a.i]?.vendido) msg = 'Banco cheio: o campeão foi vendido (o item ficou)';
  }
  if (msg) avisarJogador(id, msg);
  publicar(true);
  if (a.tipo === 'pronto') conferirVotos();
}

/** Ação de quem joga nesta tela. */
function acao(a: AcaoJogador): void {
  if (partida) acaoDe(partida.voce, a);
}

/** O humano vota "Pronto" (true), desfaz (false) ou alterna (sem argumento). Com todos os vivos prontos, o
 *  planejamento acaba na hora. */
function votar(voto?: boolean): void {
  acao(voto === undefined ? { tipo: 'pronto' } : { tipo: 'pronto', valor: voto });
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
      mudar({ carregando: false, temSalva: P.temPartidaSalva(), sala: montarSala(estado.config) });
    } catch (e) {
      mudar({ carregando: false, erro: `Não deu pra baixar o set da Autobatalha (${e instanceof Error ? e.message : String(e)})` });
    }
  },

  novaPartida(semente) {
    pararTudo();
    const c = estado.config;
    try {
      if (anfitriao) {
        // online: os humanos conectados nos primeiros lugares, bots no resto
        const humanos = humanosDaSala(c, anfitriao).filter(h => h.conectado !== false);
        partida = P.novaPartidaComHumanos(semente ?? sementeSala, humanos, c.dificuldade, ID_ANFITRIAO);
        idPartida = (Math.floor(Math.random() * 0x7fffffff) ^ Date.now()) >>> 0;
      } else partida = P.novaPartida(semente ?? sementeSala, escolhasDe(c), c.dificuldade);
    } catch (e) {
      partida = null;
      mudar({ erro: `Não deu pra começar a partida (${e instanceof Error ? e.message : String(e)})` });
      return;
    }
    // a semente da sala foi usada: a próxima sala vem com outros bots
    novaSementeSala();
    estado = { ...estado, erro: null, olhando: null, reproducao: null, aviso: null, sala: montarSala(c) };
    comecarPlanejamento();
  },

  continuar() {
    // a partida salva é solo: não continua numa sala online
    if (anfitriao) return;
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
    // salva de antes da votação: os bots já tinham jogado, então já votam
    P.votarBots(p);
    ligarRelogio();
    publicar(true);
  },

  abandonar() {
    pararTudo();
    // online, a partida volta pro lobby da sala (pra todos) e a partida solo salva fica como estava
    if (!anfitriao) P.apagarPartida();
    partida = null;
    mudar({
      temSalva: anfitriao ? estado.temSalva : false, reproducao: null, relogio: null, olhando: null, aviso: null,
      sala: montarSala(estado.config),
    });
  },

  comprar: i => acao({ tipo: 'comprar', i }),
  vender: uid => acao({ tipo: 'vender', uid }),
  atualizarLoja: () => acao({ tipo: 'atualizar' }),
  comprarXp: () => acao({ tipo: 'xp' }),
  travarLoja: () => acao({ tipo: 'travar' }),
  mover: (uid: number, para: Onde) => acao({ tipo: 'mover', uid, para }),
  equipar: (i, uid) => acao({ tipo: 'equipar', i, uid }),
  juntarItens: (i, k) => acao({ tipo: 'juntar', i, k }),
  pegarMoeda: i => acao({ tipo: 'moeda', i }),
  escolherEvolucao: forma => acao({ tipo: 'evolucao', forma }),
  pegarCarrossel: i => acao({ tipo: 'carrossel', i }),
  escolherUlt: (uid, ult) => acao({ tipo: 'ult', uid, ult }),
  alternarPosicao: uid => acao({ tipo: 'posicao', uid }),

  votarPronto() { votar(); },
  pronto() { votar(true); },

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
    // regras da sala de quem não é o anfitrião: ignoradas
    const pedido: Partial<Config> = { ...c };
    if (!souAnfitriao()) for (const k of CAMPOS_SALA) delete pedido[k];
    const config = normalizarConfig({ ...antes, ...pedido });
    gravarConfig(config);
    const mudouEscolha = config.nome !== antes.nome || config.avatar !== antes.avatar || config.estilo !== antes.estilo;
    estado = { ...estado, config, ...(mudouEscolha ? { sala: montarSala(config) } : {}) };
    if (partida?.fase === 'planejamento' && config.relogio !== antes.relogio) ligarRelogio();
    publicar();
  },

  mudarRegras(c) {
    if (!souAnfitriao()) return;
    const regras: Partial<RegrasSala> = {};
    if (c.relogio !== undefined) regras.relogio = c.relogio;
    if (c.segundos !== undefined) regras.segundos = c.segundos;
    if (c.dificuldade !== undefined) regras.dificuldade = c.dificuldade;
    acoes.configurar(regras);
  },

  escolher(c) {
    const escolhas: Partial<EscolhasJogador> = {};
    if (c.nome !== undefined) escolhas.nome = c.nome;
    if (c.avatar !== undefined) escolhas.avatar = c.avatar;
    if (c.estilo !== undefined) escolhas.estilo = c.estilo;
    acoes.configurar(escolhas);
  },

  olhar(id) { mudar({ olhando: id }); },
};

// ---------- ganchos pro anfitrião online (online/anfitriao.ts) ----------

/** Liga o modo anfitrião: a sala do lobby passa a ter os convidados, a partida não pausa nem é salva. */
export function ligarAnfitriao(g: GanchosAnfitriao): void {
  anfitriao = g;
  retomar();
  mudar({ sala: montarSala(estado.config) });
}

/** Desliga o modo anfitrião (a sala fechou): a partida online acaba e volta o lobby solo. */
export function desligarAnfitriao(): void {
  if (!anfitriao) return;
  anfitriao = null;
  if (partida) { pararTudo(); partida = null; }
  mudar({ reproducao: null, relogio: null, olhando: null, online: null, sala: montarSala(estado.config) });
  if (ouvintes.size === 0) pausar();
}

/** A sala online desta tela (o anfitrião mostra o código, o link e a situação). */
export function definirOnline(o: EstadoOnline | null): void { mudar({ online: o }); }

/** Os convidados mudaram (entrou, saiu, trocou nome, ícone ou tabuleiro): refaz os lugares do lobby. */
export function atualizarSala(): void { mudar({ sala: montarSala(estado.config) }); }

/** Um convidado caiu (true) ou voltou (false). Fora do ar, um bot joga por ele: vota pronto, pega no carrossel e
 *  joga os próximos planejamentos; a luta não espera por ele. */
export function marcarAusente(id: string, fora: boolean): void {
  const p = partida;
  const j = p?.jogadores.find(x => x.id === id && !x.bot);
  if (!p || !j || !!j.ausente === fora) return;
  if (fora) {
    j.ausente = true;
    if (p.fase === 'planejamento' && P.estaVivo(j)) j.pronto = true;
  } else {
    delete j.ausente;
    delete j.pronto;
  }
  publicar(true);
  if (fora) { conferirVotos(); conferirLuta(); }
}

/** A partida desta tela (a de verdade, no anfitrião). */
export const partidaAtual = (): Partida | null => partida;
/** id da partida pros convidados (no lugar da semente). */
export const idDaPartida = (): number => idPartida;
/** A rodada em que a luta está rolando (null fora da luta). */
export const lutaPendente = (): P.ResultadoRodada | null => pendente;

/** O tempo da fase, pro anfitrião mandar aos convidados. */
export function tempoDaPartida(): TempoPartida {
  const p = partida;
  return {
    relogioMs: p?.fase === 'planejamento' && prazo != null ? Math.max(0, Math.round(prazo - Date.now())) : null,
    carrossel: p?.fase === 'carrossel' && p.carrossel ? { tempo: tCarrossel, fim: fimCarrossel } : null,
  };
}
/** O que muda o tempo dos convidados (a fase, o prazo do planejamento e o fim do carrossel). */
export const marcaDoTempo = (): string => `${partida?.fase ?? '-'}|${prazo ?? '-'}|${fimCarrossel}`;
