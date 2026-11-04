// Mensagens da Autobatalha online entre o anfitrião (quem criou a sala e roda a partida) e cada convidado.
//
// Vão pela rede como texto JSON (`paraRede`/`daRede`): os dois transportes (PeerJS e o local dos testes) passam texto
// sem mexer, e o JSON não troca `undefined` por `null` como o empacotamento binário do PeerJS faria (a luta reproduzida
// no convidado tem de ver a mesma entrada que o anfitrião viu).
//
// Nada aqui lança: o que não tiver o formato esperado vira null e é ignorado. O anfitrião confere com rigor o que vem
// do convidado (ações com números inteiros nas faixas certas); o convidado confere a forma do que vem do anfitrião, o
// bastante pra tela não quebrar.
import type { RegrasSala } from '../api';
import {
  COLUNAS, LINHAS_DONO, type AcaoJogador, type Carrossel, type EntradaLutador, type EntradaTime, type EscolhasJogador,
  type Jogador, type Lado, type LugarSala, type MonstroRodada, type Onde, type Partida, type Unidade,
} from '../tipos';

// ---------- mensagens ----------

/** O tempo da fase atual, no relógio do anfitrião na hora do envio (o convidado conta daí pra frente). */
export interface TempoPartida {
  /** ms que faltam do planejamento (null = sem relógio ou fora do planejamento) */
  relogioMs: number | null;
  /** carrossel: segundos desde o começo e o segundo em que acaba */
  carrossel: { tempo: number; fim: number } | null;
}

/** A partida sem os jogadores (o que é igual pra todos, menos `voce`). */
export type BasePartida = Omit<Partida, 'jogadores'>;

/** A partida vista por um convidado, em partes: só o que mudou desde a última mensagem pra ele. */
export interface PartidaParcial {
  /** sem = igual à última */
  base?: BasePartida;
  /** ids dos jogadores, na ordem */
  ids: string[];
  /** só os jogadores que mudaram (o próprio completo; os outros sem a loja e as escolhas) */
  jogadores: Jogador[];
}

/** A sala (lobby) vista por um convidado. */
export interface SalaVista {
  codigo: string;
  anfitriao: string;
  /** o lugar deste convidado */
  voce: string;
  lugares: LugarSala[];
  regras: RegrasSala;
  /** a partida está rolando */
  emPartida: boolean;
}

/** A luta de um humano nesta rodada: o convidado reproduz com o mesmo motor (mesma entrada e semente = mesma luta). */
export interface LutaVista {
  /** `${estágio}-${rodada}`: o convidado devolve no "viu" */
  chave: string;
  entradaA: EntradaTime;
  entradaB: EntradaTime;
  semente: number;
  /** de que lado o convidado está (no B, ele vê a luta espelhada, com o time dele embaixo) */
  lado: Lado;
  /** o outro lado visto por ele: id do jogador, 'monstros' ou `fantasma:${id}` */
  adversario: string;
}

/** Convidado → anfitrião. */
export type MsgConvidado =
  /** `aparelho` = senha deste aparelho (só ele e o anfitrião sabem; devolve o mesmo lugar a quem cai e volta) */
  | { t: 'ola'; aparelho: string; versao: string; escolhas: EscolhasJogador }
  | { t: 'escolher'; escolhas: EscolhasJogador }
  | { t: 'acao'; acao: AcaoJogador }
  /** terminou de ver a luta da rodada `luta` (chave) */
  | { t: 'viu'; luta: string }
  | { t: 'sair' }
  | { t: 'ping' };

/** Anfitrião → convidado. */
export type MsgAnfitriao =
  | { t: 'bemvindo'; id: string; versao: string }
  /** não entrou (sala cheia, partida rolando, versão diferente...) */
  | { t: 'recusado'; motivo: string; versao: boolean }
  | { t: 'sala'; sala: SalaVista }
  /** partida null = sem partida (lobby) */
  | { t: 'estado'; partida: PartidaParcial | null; tempo: TempoPartida }
  | { t: 'luta'; luta: LutaVista }
  /** resposta curta a uma ação ("Ouro insuficiente") */
  | { t: 'aviso'; texto: string }
  | { t: 'expulso' }
  /** a sala acabou (o anfitrião fechou ou saiu) */
  | { t: 'encerrada'; motivo: string }
  /** a mesma pessoa entrou por outra aba ou aparelho: esta conexão sai e não tenta voltar */
  | { t: 'substituido' }
  | { t: 'ping' };

// ---------- texto na rede ----------

/** maior mensagem aceita do convidado (as dele são pequenas) */
export const MAX_MSG_CONVIDADO = 16_000;
/** maior mensagem aceita do anfitrião (a partida inteira cabe com folga) */
export const MAX_MSG_ANFITRIAO = 4_000_000;

export const paraRede = (m: MsgConvidado | MsgAnfitriao): string => JSON.stringify(m);

/** Texto JSON da rede → objeto (null se não for texto, passar do tamanho ou não for JSON). */
export function daRede(x: unknown, max: number): unknown {
  if (typeof x !== 'string' || x.length > max) return null;
  try { return JSON.parse(x) as unknown; } catch { return null; }
}

// ---------- conferências ----------

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown, max = 200): x is string => typeof x === 'string' && x.length <= max;
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
/** inteiro de 0 a max */
const isNat = (x: unknown, max = Number.MAX_SAFE_INTEGER): x is number => typeof x === 'number' && Number.isSafeInteger(x) && x >= 0 && x <= max;
const isInt = (x: unknown): x is number => typeof x === 'number' && Number.isSafeInteger(x);
const isBool = (x: unknown): x is boolean => typeof x === 'boolean';
const isArr = (x: unknown, ok: (y: unknown) => boolean, max = 10_000): x is unknown[] => Array.isArray(x) && x.length <= max && x.every(ok);
const opt = (x: unknown, ok: (y: unknown) => boolean): boolean => x === undefined || ok(x);
const isStrOuNull = (x: unknown): boolean => x === null || isStr(x);

/** Roda a conferência; se algo lançar (objeto estranho), null. */
function seguro<T>(f: () => T | null): T | null {
  try { return f(); } catch { return null; }
}

/** vagas da loja, itens soltos e opções do carrossel: índices pequenos */
const MAX_INDICE = 64;
const MAX_ID = 64;
const VAGAS_BANCO = 9;

function lerOnde(x: unknown): Onde | null {
  if (!isRec(x)) return null;
  if (x.tipo === 'banco') return isNat(x.i, VAGAS_BANCO - 1) ? { tipo: 'banco', i: x.i } : null;
  if (x.tipo === 'tabuleiro' && isRec(x.casa) && isNat(x.casa.col, COLUNAS - 1) && isNat(x.casa.lin, LINHAS_DONO - 1)) {
    return { tipo: 'tabuleiro', casa: { col: x.casa.col, lin: x.casa.lin } };
  }
  return null;
}

/** Ação do convidado: um objeto novo só com os campos conhecidos. */
export function lerAcao(x: unknown): AcaoJogador | null {
  return seguro((): AcaoJogador | null => {
    if (!isRec(x)) return null;
    const i = isNat(x.i, MAX_INDICE) ? x.i : null;
    const uid = isNat(x.uid) ? x.uid : null;
    switch (x.tipo) {
      case 'comprar': return i != null ? { tipo: 'comprar', i } : null;
      case 'vender': return uid != null ? { tipo: 'vender', uid } : null;
      case 'atualizar': return { tipo: 'atualizar' };
      case 'xp': return { tipo: 'xp' };
      case 'travar': return { tipo: 'travar' };
      case 'mover': {
        const para = lerOnde(x.para);
        return uid != null && para ? { tipo: 'mover', uid, para } : null;
      }
      case 'equipar': return i != null && uid != null ? { tipo: 'equipar', i, uid } : null;
      case 'juntar': return i != null && isNat(x.k, MAX_INDICE) ? { tipo: 'juntar', i, k: x.k } : null;
      case 'evolucao': return isStr(x.forma) ? { tipo: 'evolucao', forma: x.forma } : null;
      case 'carrossel': return i != null ? { tipo: 'carrossel', i } : null;
      case 'moeda': return i != null ? { tipo: 'moeda', i } : null;
      case 'ult': return uid != null && isStr(x.ult) ? { tipo: 'ult', uid, ult: x.ult } : null;
      case 'posicao': return uid != null ? { tipo: 'posicao', uid } : null;
      case 'pronto':
        if (x.valor === undefined) return { tipo: 'pronto' };
        return isBool(x.valor) ? { tipo: 'pronto', valor: x.valor } : null;
      default: return null;
    }
  });
}

/** Escolhas do convidado (o anfitrião ainda limpa o nome e confere o ícone e o estilo). */
export function lerEscolhas(x: unknown): EscolhasJogador | null {
  if (!isRec(x) || !isStr(x.nome, 64) || !(x.avatar === null || isStr(x.avatar)) || !isStr(x.estilo, 40)) return null;
  return { nome: x.nome, avatar: x.avatar as string | null, estilo: x.estilo };
}

/** Mensagem do convidado pro anfitrião (já tirada do texto com daRede). */
export function lerMsgConvidado(x: unknown): MsgConvidado | null {
  return seguro((): MsgConvidado | null => {
    if (!isRec(x)) return null;
    switch (x.t) {
      case 'ola': {
        const escolhas = lerEscolhas(x.escolhas);
        return isStr(x.aparelho, MAX_ID) && x.aparelho.length >= 8 && isStr(x.versao) && escolhas
          ? { t: 'ola', aparelho: x.aparelho, versao: x.versao, escolhas } : null;
      }
      case 'escolher': {
        const escolhas = lerEscolhas(x.escolhas);
        return escolhas ? { t: 'escolher', escolhas } : null;
      }
      case 'acao': {
        const acao = lerAcao(x.acao);
        return acao ? { t: 'acao', acao } : null;
      }
      case 'viu': return isStr(x.luta, 16) ? { t: 'viu', luta: x.luta } : null;
      case 'sair': return { t: 'sair' };
      case 'ping': return { t: 'ping' };
      default: return null;
    }
  });
}

// ---------- o que vem do anfitrião ----------

const isCasa = (c: unknown): boolean => isRec(c) && isInt(c.col) && isInt(c.lin);

function isUnidade(u: unknown): u is Unidade {
  return isRec(u) && isNat(u.uid) && isStr(u.campeao) && (u.estrela === 1 || u.estrela === 2 || u.estrela === 3) &&
    isStr(u.forma) && isArr(u.itens, y => isStr(y), 3) && opt(u.ult, y => isStr(y)) &&
    opt(u.posicao, y => y === 'ataque' || y === 'defesa') && opt(u.usuario, y => isNat(y)) &&
    opt(u.bonus, b => isRec(b) && opt(b.vida, isNum) && opt(b.dano, isNum));
}

const isEscolhaEvolucao = (e: unknown): boolean =>
  isRec(e) && isNat(e.uid) && isArr(e.opcoes, y => isStr(y), 8) && opt(e.motivo, m => m === 'evolucao' || m === 'compra');

/** Um jogador como o anfitrião manda (o próprio, completo; os outros, sem a loja). */
export function isJogador(j: unknown): j is Jogador {
  if (!isRec(j)) return false;
  const unidades = j.unidades;
  return isStr(j.id, MAX_ID) && isStr(j.nome, 64) && isBool(j.bot) && isStr(j.avatar, 500) && opt(j.estilo, y => isStr(y, 40)) &&
    isNum(j.vida) && isNum(j.ouro) && isNat(j.nivel, 100) && isNum(j.xp) &&
    isRec(unidades) && Object.keys(unidades).length <= 200 && Object.values(unidades).every(isUnidade) &&
    isArr(j.banco, y => y === null || isNat(y), 20) && isRec(j.tabuleiro) && Object.values(j.tabuleiro).every(y => isNat(y)) &&
    isArr(j.itens, y => isStr(y), 100) && isArr(j.loja, isStrOuNull, 20) && isBool(j.lojaTravada) && isInt(j.sequencia) &&
    opt(j.colocacao, y => isNat(y, 8)) && isNum(j.almas) && isArr(j.ultimosAdversarios, y => isStr(y)) &&
    opt(j.escolhaPendente, isEscolhaEvolucao) && opt(j.escolhasFila, y => isArr(y, isEscolhaEvolucao, 50)) &&
    opt(j.moedas, y => isArr(y, m => isRec(m) && isCasa(m.casa) && isNum(m.valor), 100)) &&
    opt(j.lojaFormas, y => isArr(y, isStrOuNull, 20)) && opt(j.pronto, y => y === true) && opt(j.ausente, y => y === true);
}

const isAtributos = (a: unknown): boolean => isRec(a) && Object.values(a).every(isNum);
const isMonstroDados = (m: unknown): boolean => isRec(m) && isStr(m.nome) && isStr(m.jogo) && isStr(m.img, 500) && opt(m.nivel, isNum);
const isMonstroRodada = (m: unknown): m is MonstroRodada =>
  isRec(m) && isMonstroDados(m.monstro) && isBool(m.chefe) && isCasa(m.casa) && isAtributos(m.atributos);
const isCarrossel = (c: unknown): c is Carrossel =>
  isRec(c) && isArr(c.opcoes, o => isRec(o) && isStr(o.campeao) && isStr(o.forma) && isStr(o.item) && isStrOuNull(o.pegou) &&
    opt(o.vendido, y => y === true), 20) &&
  isArr(c.grupos, g => isArr(g, y => isStr(y), 8), 8) && isNat(c.liberados, 8);
const FASES = ['carrossel', 'planejamento', 'luta', 'resultado', 'fim'];
const TIPOS = ['pvp', 'monstros', 'chefe'];

/** A partida sem os jogadores. */
export function isBase(b: unknown): b is BasePartida {
  return isRec(b) && b.versao === 1 && isNum(b.semente) && isStr(b.voce, MAX_ID) && isNat(b.estagio, 100) && isNat(b.rodada, 20) &&
    TIPOS.includes(b.tipo as string) && FASES.includes(b.fase as string) && isRec(b.pool) &&
    isArr(b.confrontos, c => isArr(c, y => isStr(y, 80), 2), 8) && isArr(b.monstros, isMonstroRodada, 30) &&
    isRec(b.historico) && Object.values(b.historico).every(h => isArr(h, y => y === 'v' || y === 'd', 500)) &&
    isNat(b.proximoUid) && opt(b.carrossel, isCarrossel) &&
    opt(b.dificuldade, d => d === 'facil' || d === 'normal' || d === 'dificil');
}

function isLugar(l: unknown): l is LugarSala {
  return isRec(l) && isStr(l.id, MAX_ID) && isStr(l.nome, 64) && isBool(l.bot) && isBool(l.anfitriao) && isStr(l.avatar, 500) &&
    isStr(l.estilo, 40) && opt(l.conectado, isBool);
}
const isRegras = (r: unknown): r is RegrasSala =>
  isRec(r) && isBool(r.relogio) && isNat(r.segundos, 600) && (r.dificuldade === 'facil' || r.dificuldade === 'normal' || r.dificuldade === 'dificil');

function isEntradaLutador(l: unknown): l is EntradaLutador {
  return isRec(l) && isStr(l.id, MAX_ID) && isCasa(l.casa) && opt(l.unidade, isUnidade) &&
    opt(l.monstro, m => isRec(m) && isMonstroDados(m.dados) && isBool(m.chefe) && isAtributos(m.atributos)) &&
    (l.unidade !== undefined || l.monstro !== undefined);
}
const isEntradaTime = (t: unknown): t is EntradaTime => isRec(t) && isStr(t.dono, 80) && isArr(t.lutadores, isEntradaLutador, 40);

const isTempo = (t: unknown): t is TempoPartida =>
  isRec(t) && (t.relogioMs === null || isNat(t.relogioMs, 3_600_000)) &&
  (t.carrossel === null || (isRec(t.carrossel) && isNum(t.carrossel.tempo) && isNum(t.carrossel.fim)));

function lerParcial(x: unknown): PartidaParcial | null {
  if (!isRec(x) || !isArr(x.ids, y => isStr(y, MAX_ID), 8) || !isArr(x.jogadores, isJogador, 8)) return null;
  if (x.base !== undefined && !isBase(x.base)) return null;
  const out: PartidaParcial = { ids: x.ids as string[], jogadores: x.jogadores as Jogador[] };
  if (x.base !== undefined) out.base = x.base;
  return out;
}

/** Mensagem do anfitrião pro convidado (já tirada do texto com daRede). */
export function lerMsgAnfitriao(x: unknown): MsgAnfitriao | null {
  return seguro((): MsgAnfitriao | null => {
    if (!isRec(x)) return null;
    switch (x.t) {
      case 'bemvindo': return isStr(x.id, MAX_ID) && isStr(x.versao) ? { t: 'bemvindo', id: x.id, versao: x.versao } : null;
      case 'recusado': return isStr(x.motivo, 400) ? { t: 'recusado', motivo: x.motivo, versao: x.versao === true } : null;
      case 'sala': {
        const s = x.sala;
        if (!isRec(s) || !isStr(s.codigo, 8) || !isStr(s.anfitriao, MAX_ID) || !isStr(s.voce, MAX_ID) ||
          !isArr(s.lugares, isLugar, 8) || !isRegras(s.regras) || !isBool(s.emPartida)) return null;
        return { t: 'sala', sala: { codigo: s.codigo, anfitriao: s.anfitriao, voce: s.voce, lugares: s.lugares as LugarSala[], regras: s.regras, emPartida: s.emPartida } };
      }
      case 'estado': {
        if (!isTempo(x.tempo)) return null;
        if (x.partida === null) return { t: 'estado', partida: null, tempo: x.tempo };
        const partida = lerParcial(x.partida);
        return partida ? { t: 'estado', partida, tempo: x.tempo } : null;
      }
      case 'luta': {
        const l = x.luta;
        if (!isRec(l) || !isStr(l.chave, 16) || !isEntradaTime(l.entradaA) || !isEntradaTime(l.entradaB) ||
          !isNat(l.semente, 0xffffffff) || (l.lado !== 'a' && l.lado !== 'b') || !isStr(l.adversario, 80)) return null;
        return { t: 'luta', luta: { chave: l.chave, entradaA: l.entradaA, entradaB: l.entradaB, semente: l.semente, lado: l.lado, adversario: l.adversario } };
      }
      case 'aviso': return isStr(x.texto, 400) ? { t: 'aviso', texto: x.texto } : null;
      case 'expulso': return { t: 'expulso' };
      case 'encerrada': return isStr(x.motivo, 400) ? { t: 'encerrada', motivo: x.motivo } : null;
      case 'substituido': return { t: 'substituido' };
      case 'ping': return { t: 'ping' };
      default: return null;
    }
  });
}
