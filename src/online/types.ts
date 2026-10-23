// Contrato do modo online: estado da sala (vive no host), ações, visão de cada jogador, mensagens e transporte.
import type { Cup, Entry, FranchiseKey, Item } from '../types';

// ---------- configuração ----------
export type OnlineMode = 'duel' | 'trio' | 'cup' | 'draft';

export interface OnlineConfig {
  mode: OnlineMode;
  /** voto secreto: o resultado mostra só a contagem (padrão: desligado) */
  secret: boolean;
  /** roleta nas rodadas: o host pode girar a roleta em vez de esperar a votação (padrão: desligado) */
  roulette: boolean;
  duel: [FranchiseKey, FranchiseKey];
  trio: [FranchiseKey, FranchiseKey, FranchiseKey];
  cup: { size: number; frs: FranchiseKey[]; even: boolean; mix: boolean };
  /** Draft (etapa 6): franquias na ordem, opções por franquia e nº de rodadas */
  draft: { frs: FranchiseKey[]; x: number; rounds: number };
}

// ---------- estado da sala (só no host) ----------
export interface Player {
  id: string;
  name: string;
  host: boolean;
  online: boolean;
}

/** Roleta: gira entre os itens `among` (índices de vote.items), começando em `start`, por `total` passos. */
export interface SpinPlan {
  id: number;
  among: number[];
  start: number;
  total: number;
  /** quando o host decidiu (ms, relógio do host) */
  at: number;
}

export interface VoteResult {
  /** votos por item */
  counts: number[];
  /** ids de quem votou em cada item */
  voters: string[][];
  /** índice (em vote.items) do vencedor */
  win: number;
  /** empatados, quando a votação empatou */
  tie: number[] | null;
  /** 'votos' = mais votado; 'empate' = roleta entre os empatados; 'roleta' = o host girou */
  how: 'votos' | 'empate' | 'roleta';
  spin: SpinPlan | null;
}

export interface Vote {
  seq: number;
  items: Entry[];
  /** texto no topo de cada carta (coroa "♛ 2 vitórias", "de Ana"...), '' se nada */
  extras: string[];
  /** id do jogador -> índice escolhido */
  ballots: Record<string, number>;
  result: VoteResult | null;
}

/** Duelo e Trio online: rei do morro com 2 ou 3 lados. */
export interface KingGame {
  mode: 'duel' | 'trio';
  frs: FranchiseKey[];
  slots: Entry[];
  streak: number[];
}
export interface CupGame {
  mode: 'cup';
  cup: Cup;
}
/** Escolha secreta de um jogador numa rodada do Draft. */
export interface DraftTeam {
  /** escolha por franquia (índice = posição em frs); null = ainda não escolheu nesta passada */
  picks: (Entry | null)[];
  /** franquias (índices) que ainda faltam escolher nesta passada, na ordem */
  queue: number[];
  /** opções sorteadas pra cada franquia da passada atual */
  opts: Record<number, Entry[]>;
  /** passada (sobe a cada refação), pra ignorar escolha atrasada */
  att: number;
  /** o host seguiu sem este jogador nesta rodada */
  skipped: boolean;
}

/** Personagem classificado no Draft: quem escolheu, em qual rodada e franquia. */
export interface Qualified extends Entry {
  by: string;
  byName: string;
  round: number;
  fi: number;
}

export interface DraftGame {
  mode: 'draft';
  frs: FranchiseKey[];
  x: number;
  rounds: number;
  /** rodada atual (1..rounds) */
  round: number;
  /** pick = escolha secreta; reveal = revelação e votação por franquia; final = mata-mata; end = fim */
  step: 'pick' | 'reveal' | 'final' | 'end';
  /** times desta rodada, por id de jogador (quem entrou no meio da rodada fica sem time até a próxima) */
  teams: Record<string, DraftTeam>;
  /** ordem dos jogadores nesta rodada */
  order: string[];
  /** personagens já escolhidos em rodadas anteriores, por franquia: não aparecem mais */
  used: Record<FranchiseKey, string[]>;
  /** nesta rodada: personagens que repetiram, por índice de franquia (ficam fora das novas opções) */
  banned: Record<number, string[]>;
  /** quantas vezes cada franquia (índice) foi refeita nesta rodada */
  redos: Record<number, number>;
  /** franquias (índices) sendo refeitas agora por causa de repetição, ou null */
  redo: number[] | null;
  /** franquia (índice) em revelação */
  reveal: number;
  qualified: Qualified[];
  /** o que cada jogador escolheu em cada rodada (fica fixo quando a rodada sai da escolha) */
  history: { round: number; teams: { id: string; name: string; picks: Entry[] }[] }[];
  /** saco de sorteio de cada jogador, por franquia (as opções são independentes pra cada um) */
  bags: Record<string, Record<FranchiseKey, string[]>>;
  /** chaveamento da final (com "bye" quando o nº não é potência de 2) */
  final: Cup | null;
  champion: Qualified | null;
}

export type Game = KingGame | CupGame | DraftGame;

export interface RoomState {
  code: string;
  hostId: string;
  players: Player[];
  cfg: OnlineConfig;
  phase: 'lobby' | 'play';
  game: Game | null;
  vote: Vote | null;
  /** saco de sorteio da sala (memória do host; não mexe no pdx-bags) */
  bags: Record<string, string[]>;
  /** contador de votações e roletas */
  nextSeq: number;
  /** aviso pra todos (ex.: "Lista de JoJo ainda não carregou") */
  notice: string;
}

export type Action =
  /** entrou ou voltou (o id já vem resolvido por canJoin) */
  | { type: 'join'; id: string; name: string }
  /** conexão abriu ou caiu */
  | { type: 'online'; id: string; online: boolean }
  /** saiu por conta própria */
  | { type: 'leave'; id: string }
  /** o host removeu */
  | { type: 'kick'; id: string }
  /** o host mudou a configuração (só no lobby) */
  | { type: 'config'; patch: Partial<OnlineConfig> }
  | { type: 'start' }
  /** encerra a partida e volta ao lobby */
  | { type: 'lobby' }
  | { type: 'vote'; id: string; seq: number; idx: number }
  /** o host encerra a votação com os votos que já tem */
  | { type: 'close' }
  /** o host gira a roleta (só com cfg.roulette) */
  | { type: 'spin' }
  /** o host avança depois do resultado */
  | { type: 'next' }
  /** Draft: escolha secreta (idx nas opções da franquia da vez) */
  | { type: 'pick'; id: string; round: number; att: number; idx: number }
  /** Draft: o host segue sem quem ainda não terminou de escolher */
  | { type: 'skip' };

/** O que o redutor precisa de fora: gerador aleatório, relógio e as listas de personagens do host. */
export interface Ctx {
  rand: () => number;
  now: number;
  lists: Record<string, Item[] | null>;
}

export type JoinCheck = { ok: true; id: string } | { ok: false; reason: string };

// ---------- visão de cada jogador (o que vai pela rede) ----------
export interface PlayerView {
  id: string;
  name: string;
  host: boolean;
  online: boolean;
  /** já votou na votação aberta */
  voted: boolean;
}

export interface VoteView {
  seq: number;
  items: Entry[];
  extras: string[];
  /** o meu voto (índice) ou null */
  mine: number | null;
  result: {
    counts: number[];
    /** nomes de quem votou em cada item; null com voto secreto */
    voters: string[][] | null;
    win: number;
    tie: number[] | null;
    how: VoteResult['how'];
    /** `age` = quantos ms se passaram desde a decisão, no relógio do host */
    spin: (SpinPlan & { age: number }) | null;
  } | null;
}

/** O Draft visto por um jogador: as próprias opções e escolhas, nunca as dos outros (até a revelação). */
export interface DraftView {
  mode: 'draft';
  frs: FranchiseKey[];
  x: number;
  rounds: number;
  round: number;
  step: DraftGame['step'];
  /** o meu time nesta rodada (null = sem time: entrou no meio da rodada) */
  me: {
    /** franquia (índice) da vez, ou null se terminei */
    fi: number | null;
    opts: Entry[];
    picks: (Entry | null)[];
    att: number;
    skipped: boolean;
  } | null;
  /** quem já terminou de escolher (só isso aparece dos outros) */
  progress: { id: string; name: string; state: 'escolhendo' | 'pronto' | 'pulado' }[];
  /** franquias sendo refeitas por repetição (sem dizer qual personagem nem quem) */
  redo: FranchiseKey[] | null;
  reveal: number;
  qualified: Qualified[];
  final: Cup | null;
  /** título da rodada da final ('Semifinal', 'Final'...) e "confronto X de Y" */
  title: string;
  count: string;
  champion: Qualified | null;
  /** só no fim: o que cada jogador escolheu em cada rodada */
  history: DraftGame['history'] | null;
}

export type GameView =
  | { mode: 'duel' | 'trio'; frs: FranchiseKey[]; streak: number[] }
  | { mode: 'cup'; cup: Cup; title: string; count: string }
  | DraftView;

export interface RoomView {
  code: string;
  /** id deste jogador */
  me: string;
  hostId: string;
  phase: RoomState['phase'];
  cfg: OnlineConfig;
  notice: string;
  players: PlayerView[];
  game: GameView | null;
  vote: VoteView | null;
}

// ---------- mensagens ----------
export type ClientMsg =
  | { t: 'hello'; id: string; name: string }
  | { t: 'vote'; seq: number; idx: number }
  | { t: 'pick'; round: number; att: number; idx: number }
  | { t: 'leave' }
  | { t: 'ping' };

export type HostMsg =
  /** id definitivo deste jogador na sala */
  | { t: 'welcome'; id: string }
  | { t: 'state'; view: RoomView }
  | { t: 'reject'; reason: string }
  | { t: 'kicked' }
  /** o host encerrou a sala */
  | { t: 'closed' }
  | { t: 'ping' };

// ---------- transporte ----------
/** Uma conexão entre o host e um jogador. */
export interface Link {
  send(msg: unknown): void;
  close(): void;
  onMessage(cb: (msg: unknown) => void): void;
  onClose(cb: () => void): void;
}

export type TransportErrorKind =
  /** já existe uma sala com esse código */
  | 'codigo-em-uso'
  /** não existe sala com esse código (ou o host saiu) */
  | 'sala-nao-existe'
  /** achou a sala mas a conexão direta não abriu (rede bloqueando P2P) */
  | 'p2p-bloqueado'
  /** sem acesso ao servidor de convites */
  | 'rede'
  /** navegador sem WebRTC */
  | 'navegador';

export class TransportError extends Error {
  readonly kind: TransportErrorKind;
  constructor(kind: TransportErrorKind, message?: string) {
    super(message ?? kind);
    this.kind = kind;
    this.name = 'TransportError';
  }
}

export interface HostEndpoint {
  code: string;
  onLink(cb: (link: Link) => void): void;
  /** o host perdeu o servidor de convites (quem já está continua; ninguém novo entra) */
  onTrouble(cb: (ok: boolean) => void): void;
  close(): void;
}

export interface Transport {
  name: 'peerjs' | 'local';
  host(code: string): Promise<HostEndpoint>;
  join(code: string): Promise<Link>;
}
