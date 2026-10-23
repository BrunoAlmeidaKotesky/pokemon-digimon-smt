// Rede do modo online: servidores ICE (STUN/TURN), prefixo do id no PeerJS e tempos de espera.

/** prefixo do id do host no servidor de convites do PeerJS (o código da sala vem depois) */
export const PEER_PREFIX = 'qvp-sala-';
/** quanto quem entra espera a conexão abrir antes de desistir */
export const JOIN_TIMEOUT_MS = 15000;
/** chave do localStorage com o TURN configurado neste navegador */
export const TURN_KEY = 'pdx-turn';

/** O padrão do PeerJS 1.5.5 (util.defaultConfig): STUN do Google e o TURN público do PeerJS. */
export const PEERJS_DEFAULT_ICE: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'],
    username: 'peerjs',
    credential: 'peerjsp',
  },
];

/**
 * TURN fixo no código, pra todo mundo que abrir o site.
 *
 * Quando a rede de alguém bloqueia a conexão direta (4G de algumas operadoras, Wi-Fi de empresa ou faculdade), o
 * WebRTC só funciona passando por um servidor TURN, que retransmite o tráfego. O TURN público do PeerJS é fraco e às
 * vezes cai. Pra usar outro (Metered, Twilio, um coturn seu...), coloque aqui, por exemplo:
 *
 *   { urls: 'turn:global.relay.metered.ca:80', username: 'usuario', credential: 'senha' },
 *   { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: 'usuario', credential: 'senha' },
 *
 * Atenção: o site é estático e público, então qualquer um vê essa credencial no código. Use uma com limite de uso.
 * Também dá pra configurar um TURN só no próprio navegador, sem mexer no código (saveTurn, guardado em 'pdx-turn').
 */
export const TURN_SERVERS: RTCIceServer[] = [];

/** TURN (ou STUN) digitado pelo usuário */
export interface TurnConfig {
  urls: string;
  username: string;
  credential: string;
}

const ICE_URL = /^(stun|turns?):[^\s,]+$/i;
const STUN = /^stun:/i;
const MAX_FIELD = 500;

/** As URLs do campo (aceita várias separadas por vírgula ou espaço). */
const splitUrls = (urls: string): string[] => urls.split(/[\s,]+/).filter(Boolean);

/**
 * TURN/STUN com formato aceitável (uma URL ou várias separadas por vírgula). TURN precisa de usuário e senha: URL
 * torta ou TURN sem credencial fazem o navegador recusar a configuração inteira.
 */
export function isValidTurn(t: unknown): t is TurnConfig {
  if (typeof t !== 'object' || t === null) return false;
  const { urls, username, credential } = t as Record<string, unknown>;
  if (typeof urls !== 'string' || typeof username !== 'string' || typeof credential !== 'string') return false;
  if (urls.length > MAX_FIELD || username.length > MAX_FIELD || credential.length > MAX_FIELD) return false;
  const list = splitUrls(urls);
  if (list.length === 0 || !list.every((u) => ICE_URL.test(u))) return false;
  return list.every((u) => STUN.test(u)) || (username !== '' && credential !== '');
}

/** TURN guardado neste navegador, ou null (nada guardado, inválido ou sem localStorage). */
export function loadTurn(): RTCIceServer | null {
  try {
    const raw = localStorage.getItem(TURN_KEY);
    if (!raw) return null;
    const t: unknown = JSON.parse(raw);
    if (!isValidTurn(t)) return null;
    const list = splitUrls(t.urls);
    const urls = list.length === 1 ? (list[0] as string) : list;
    return list.every((u) => STUN.test(u)) ? { urls } : { urls, username: t.username, credential: t.credential };
  } catch {
    return null;
  }
}

/** Guarda (ou apaga, com null) o TURN deste navegador. Ignora erro de armazenamento. */
export function saveTurn(t: TurnConfig | null): void {
  try {
    if (t === null) localStorage.removeItem(TURN_KEY);
    else localStorage.setItem(TURN_KEY, JSON.stringify({ urls: t.urls.trim(), username: t.username, credential: t.credential }));
  } catch {
    /* sem armazenamento: segue sem salvar */
  }
}

const copy = (s: RTCIceServer): RTCIceServer => ({ ...s, urls: Array.isArray(s.urls) ? [...s.urls] : s.urls });

/** Servidores ICE pro RTCPeerConnection: padrão do PeerJS + TURN_SERVERS + o TURN guardado neste navegador. */
export function iceServers(): RTCIceServer[] {
  const saved = loadTurn();
  return [...PEERJS_DEFAULT_ICE, ...TURN_SERVERS, ...(saved ? [saved] : [])].map(copy);
}
