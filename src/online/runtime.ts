// Runtime do modo online: liga o transporte (PeerJS ou local) à lógica pura da sala.
// No host: guarda o RoomState, aplica as ações (reduce) e manda a visão de cada um. No jogador: mantém a conexão,
// reconecta quando cai e guarda a última visão recebida. A tela lê `online` e chama as funções daqui.
import { useSyncExternalStore } from 'react';
import type { ClientMsg, HostEndpoint, HostMsg, Link, OnlineConfig, RoomState, RoomView, Transport } from './types';
import { TransportError } from './types';
import { createRoom, canJoin, reduce, DEFAULT_CONFIG } from './room';
import { viewFor } from './view';
import { parseClientMsg, parseHostMsg, cleanName } from './protocol';
import { pickTransport } from './transport';
import { app, setOnlineKey } from '../state/app';

// ---------- parâmetros da página ----------
const params = new URLSearchParams(location.search);
const LOCAL = params.get('transporte') === 'local';
/** `?jogador=N` separa a identidade de várias abas no mesmo navegador (só pra testes com o transporte local). */
const SUFIXO = LOCAL && params.get('jogador') ? '-' + params.get('jogador') : '';
const T = LOCAL
  ? { ping: 400, timeout: 2500, retry: 400, tries: 8 }
  : { ping: 4000, timeout: 12000, retry: 2000, tries: 25 };

const ID_KEY = 'pdx-online-id' + SUFIXO, NAME_KEY = 'pdx-online-nome' + SUFIXO, CFG_KEY = 'pdx-online-cfg';
const ls = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } },
};
function myId() {
  let id = ls.get(ID_KEY);
  if (!id) { id = crypto.randomUUID().slice(0, 18); ls.set(ID_KEY, id); }
  return id;
}

// ---------- estado da tela ----------
export type Stage = 'fora' | 'conectando' | 'host' | 'jogador';
export const online = {
  stage: 'fora' as Stage,
  /** erro na tela de entrada */
  error: '',
  /** aviso de conexão dentro da sala (reconectando, sem servidor de convites) */
  banner: '',
  /** motivo de a sala ter acabado pra este jogador (host saiu, removido...) */
  ended: '',
  view: null as RoomView | null,
  code: params.get('sala')?.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) ?? '',
  name: ls.get(NAME_KEY) ?? '',
  transport: (LOCAL ? 'local' : 'peerjs') as Transport['name'],
};
let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function useOnline() { useSyncExternalStore(subscribe, () => version); return online; }

const transport = pickTransport();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const newCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
export const roomLink = (code: string) => {
  const u = new URL(location.href);
  u.search = '';
  if (LOCAL) u.searchParams.set('transporte', 'local');
  u.searchParams.set('sala', code);
  return u.toString();
};
function setUrlRoom(code: string | null) {
  const u = new URL(location.href);
  if (code) u.searchParams.set('sala', code); else u.searchParams.delete('sala');
  history.replaceState(null, '', u.toString());
}

/** Texto de erro de transporte pra quem está tentando entrar. */
export function errorText(e: unknown, code: string): string {
  const kind = e instanceof TransportError ? e.kind : null;
  switch (kind) {
    case 'sala-nao-existe': return `Não achei a sala ${code}. Confira o código. Se a sala existia, o host fechou a página e ela acabou.`;
    case 'p2p-bloqueado': return 'Achei a sala, mas não consegui conectar ao aparelho do host. Algumas redes (Wi-Fi de empresa ou escola, alguns 4G) bloqueiam conexão direta entre aparelhos. Tente outra rede (por exemplo, trocar o Wi-Fi pelo 4G) ou configure um servidor TURN em "Problemas de conexão?".';
    case 'rede': return 'Não consegui falar com o servidor de convites (PeerJS). Confira a internet e tente de novo.';
    case 'navegador': return 'Este navegador não tem suporte a conexão direta (WebRTC). Tente o Chrome, o Firefox ou o Safari atualizados.';
    case 'codigo-em-uso': return 'Não consegui criar a sala (código em uso). Tente de novo.';
    default: return 'Não consegui conectar: ' + (e instanceof Error ? e.message : String(e));
  }
}

// ---------- host ----------
let room: RoomState | null = null;
let endpoint: HostEndpoint | null = null;
const links = new Map<string, Link>();       // id do jogador -> conexão
const lastSeen = new Map<string, number>();  // id do jogador -> última mensagem
let hostTimer: ReturnType<typeof setInterval> | null = null;

const ctx = () => ({ rand: Math.random, now: Date.now(), lists: app.lists });
function loadCfg(): OnlineConfig {
  try { return { ...DEFAULT_CONFIG, ...(JSON.parse(ls.get(CFG_KEY) ?? 'null') as Partial<OnlineConfig> | null ?? {}) }; } catch { return DEFAULT_CONFIG; }
}
function send(link: Link, msg: HostMsg) { try { link.send(msg); } catch { /* conexão já caiu */ } }
function broadcast() {
  if (!room) return;
  const now = Date.now();
  for (const [pid, link] of links) send(link, { t: 'state', view: viewFor(room, pid, now) });
  online.view = viewFor(room, room.hostId, now);
  emit();
}
function dispatch(a: Parameters<typeof reduce>[1]) {
  if (!room) return;
  room = reduce(room, a, ctx());
  broadcast();
}

function acceptLink(link: Link) {
  let pid: string | null = null;
  link.onMessage(raw => {
    const msg = parseClientMsg(raw);
    if (!msg || !room) return;
    if (pid) lastSeen.set(pid, Date.now());
    if (msg.t === 'hello') {
      const check = canJoin(room, msg.id, msg.name);
      if (!check.ok) { send(link, { t: 'reject', reason: check.reason }); setTimeout(() => link.close(), 300); return; }
      if (check.id === room.hostId) { send(link, { t: 'reject', reason: 'Esse aparelho já é o host desta sala.' }); setTimeout(() => link.close(), 300); return; }
      pid = check.id;
      const old = links.get(pid);
      if (old && old !== link) old.close();
      links.set(pid, link);
      lastSeen.set(pid, Date.now());
      send(link, { t: 'welcome', id: pid });
      dispatch({ type: 'join', id: pid, name: cleanName(msg.name) });
      return;
    }
    if (!pid) return;
    if (msg.t === 'vote') dispatch({ type: 'vote', id: pid, seq: msg.seq, idx: msg.idx });
    else if (msg.t === 'pick') dispatch({ type: 'pick', id: pid, round: msg.round, att: msg.att, idx: msg.idx });
    else if (msg.t === 'leave') { links.delete(pid); dispatch({ type: 'leave', id: pid }); link.close(); }
  });
  link.onClose(() => {
    if (pid && links.get(pid) === link) { links.delete(pid); dispatch({ type: 'online', id: pid, online: false }); }
  });
}

export async function hostRoom(name: string) {
  const nome = cleanName(name);
  if (!nome) { online.error = 'Escolha um apelido.'; emit(); return; }
  online.name = nome; ls.set(NAME_KEY, nome);
  online.stage = 'conectando'; online.error = ''; online.ended = ''; emit();
  let lastErr: unknown = null;
  for (let tentativa = 0; tentativa < 5 && !endpoint; tentativa++) {
    try { endpoint = await transport.host(newCode()); } catch (e) {
      lastErr = e;
      if (!(e instanceof TransportError && e.kind === 'codigo-em-uso')) break;
    }
  }
  if (!endpoint) { online.stage = 'fora'; online.error = errorText(lastErr, ''); emit(); return; }
  room = createRoom(endpoint.code, { id: myId(), name: nome }, loadCfg());
  online.code = endpoint.code; online.stage = 'host'; online.banner = '';
  endpoint.onLink(acceptLink);
  endpoint.onTrouble(ok => {
    online.banner = ok ? '' : 'Sem conexão com o servidor de convites. Quem já está na sala continua jogando, mas ninguém novo consegue entrar até a conexão voltar.';
    emit();
  });
  hostTimer = setInterval(() => {
    const now = Date.now();
    for (const [pid, link] of links) {
      send(link, { t: 'ping' });
      if (now - (lastSeen.get(pid) ?? now) > T.timeout) link.close();
    }
  }, T.ping);
  broadcast();
}

/** Ações do host (a tela só mostra os botões pro host). */
export const host = {
  config: (patch: Partial<OnlineConfig>) => {
    dispatch({ type: 'config', patch });
    if (room) ls.set(CFG_KEY, JSON.stringify(room.cfg));
  },
  start: () => dispatch({ type: 'start' }),
  lobby: () => dispatch({ type: 'lobby' }),
  close: () => dispatch({ type: 'close' }),
  spin: () => dispatch({ type: 'spin' }),
  next: () => dispatch({ type: 'next' }),
  /** Draft: segue sem quem ainda não terminou de escolher */
  skip: () => dispatch({ type: 'skip' }),
  kick: (pid: string) => {
    const link = links.get(pid);
    if (link) { send(link, { t: 'kicked' }); links.delete(pid); setTimeout(() => link.close(), 300); }
    dispatch({ type: 'kick', id: pid });
  },
};

function endHost() {
  for (const link of links.values()) send(link, { t: 'closed' });
  const ep = endpoint;
  setTimeout(() => { ep?.close(); }, 150);
  links.clear(); lastSeen.clear();
  if (hostTimer) clearInterval(hostTimer);
  hostTimer = null; endpoint = null; room = null;
}

// ---------- jogador ----------
let link: Link | null = null;
let clientTimer: ReturnType<typeof setInterval> | null = null;
let lastHostMsg = 0;
let retrying = false;
let leaving = false;

function clientSend(msg: ClientMsg) { if (link) { try { link.send(msg); } catch { /* caiu */ } } }

async function connect(code: string): Promise<void> {
  const l = await transport.join(code);
  link = l;
  lastHostMsg = Date.now();
  l.onMessage(raw => {
    const msg = parseHostMsg(raw);
    if (!msg || link !== l) return;
    lastHostMsg = Date.now();
    switch (msg.t) {
      case 'welcome': ls.set(ID_KEY, msg.id); break;
      case 'state': online.view = msg.view; online.stage = 'jogador'; online.banner = ''; emit(); break;
      case 'reject': finish('', msg.reason); break;
      case 'kicked': finish('O host removeu você da sala.'); break;
      case 'closed': finish('O host encerrou a sala.'); break;
      case 'ping': break;
    }
  });
  l.onClose(() => { if (link === l) { link = null; if (!leaving && online.stage === 'jogador') lost(); } });
  clientSend({ t: 'hello', id: myId(), name: online.name });
}

/** Sai da sala do lado do jogador. `ended` = aviso na tela da sala; `error` = erro na tela de entrada. */
function finish(ended: string, error = '') {
  leaving = true;
  const l = link; link = null;
  l?.close();
  if (clientTimer) clearInterval(clientTimer);
  clientTimer = null;
  online.ended = ended; online.error = error; online.banner = '';
  if (!ended) { online.stage = 'fora'; online.view = null; }
  setUrlRoom(null);
  emit();
}

async function lost() {
  if (retrying) return;
  retrying = true;
  online.banner = 'A conexão com o host caiu. Tentando reconectar…'; emit();
  for (let i = 0; i < T.tries && !leaving && !link; i++) {
    await new Promise(r => setTimeout(r, i ? T.retry : 100));
    if (leaving || link) break;
    try { await connect(online.code); break; } catch (e) {
      if (e instanceof TransportError && e.kind === 'sala-nao-existe') { retrying = false; finish('A sala acabou: o host saiu ou fechou a página.'); return; }
    }
  }
  retrying = false;
  if (!link && !leaving) { online.banner = ''; finish('Não consegui reconectar. O host pode ter saído ou a internet caiu.'); }
}

export async function joinRoom(code: string, name: string) {
  const c = code.toUpperCase().replace(/[^A-Z]/g, '');
  const nome = cleanName(name);
  if (c.length !== 4) { online.error = 'O código da sala tem 4 letras.'; emit(); return; }
  if (!nome) { online.error = 'Escolha um apelido.'; emit(); return; }
  online.code = c; online.name = nome; ls.set(NAME_KEY, nome);
  online.stage = 'conectando'; online.error = ''; online.ended = ''; online.banner = ''; leaving = false; emit();
  try { await connect(c); } catch (e) {
    online.stage = 'fora'; online.error = errorText(e, c); emit(); return;
  }
  setUrlRoom(c);
  clientTimer = setInterval(() => {
    if (!link) return;
    clientSend({ t: 'ping' });
    if (Date.now() - lastHostMsg > T.timeout) { const l = link; link = null; l.close(); lost(); }
  }, T.ping);
}

export const player = {
  vote: (seq: number, idx: number) => {
    if (online.stage === 'host' && room) dispatch({ type: 'vote', id: room.hostId, seq, idx });
    else clientSend({ t: 'vote', seq, idx });
  },
  /** Draft: escolha secreta */
  pick: (round: number, att: number, idx: number) => {
    if (online.stage === 'host' && room) dispatch({ type: 'pick', id: room.hostId, round, att, idx });
    else clientSend({ t: 'pick', round, att, idx });
  },
};

/** Sair (jogador) ou encerrar a sala (host). */
export function leave() {
  if (online.stage === 'host') endHost();
  else { clientSend({ t: 'leave' }); finish(''); }
  online.stage = 'fora'; online.view = null; online.ended = ''; online.banner = '';
  setUrlRoom(null);
  emit();
}
/** Depois de a sala acabar: volta pra tela de entrada. */
export function dismiss() { online.stage = 'fora'; online.view = null; online.ended = ''; emit(); }

// fechar a página: o host avisa todo mundo que a sala acabou; o jogador avisa que saiu do ar
addEventListener('pagehide', () => {
  if (online.stage === 'host') endHost();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && online.stage === 'jogador' && !link && !leaving) lost();
});

/** Entrar automático quando a página abre com ?sala= e já tem apelido salvo. */
export function autoJoin() {
  if (online.code && online.name && online.stage === 'fora') joinRoom(online.code, online.name);
}
export const IS_LOCAL = LOCAL;

// teclado na aba Online: 1-9 votam; R gira a roleta (host, com a roleta nas rodadas ligada)
setOnlineKey(e => {
  const v = online.view;
  const g = v?.game;
  if (g?.mode === 'draft' && g.step === 'pick') {
    const n = +e.key;
    if (g.me && !g.me.skipped && g.me.fi != null && n >= 1 && n <= g.me.opts.length) player.pick(g.round, g.me.att, n - 1);
    return;
  }
  if (!v?.vote || v.vote.result) return;
  const n = +e.key;
  if (n >= 1 && n <= v.vote.items.length) player.vote(v.vote.seq, n - 1);
  if ((e.key === 'r' || e.key === 'R') && online.stage === 'host' && v.cfg.roulette) host.spin();
});
