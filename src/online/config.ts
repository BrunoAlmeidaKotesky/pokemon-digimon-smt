// Rede do modo online: servidores ICE (STUN/TURN), prefixo do id no PeerJS e tempos de espera.

/** prefixo do id do host no servidor de convites do PeerJS (o código da sala vem depois) */
export const PEER_PREFIX = 'qvp-sala-';
/** quanto quem entra espera a conexão abrir antes de desistir (cada tentativa) */
export const JOIN_TIMEOUT_MS = 15000;
/** tentativas de abrir a conexão direta antes de mostrar o erro: ela às vezes falha numa e abre na seguinte */
export const JOIN_TENTATIVAS = 3;
/** chave do localStorage com o TURN configurado neste navegador */
export const TURN_KEY = 'pdx-turn';

/**
 * STUN de quatro empresas: cada aparelho descobre o próprio endereço público mesmo se um deles falhar ou demorar.
 * O padrão do PeerJS 1.5.5 trazia um TURN público (eu-0/us-0.turn.peerjs.com) que não existe mais (o DNS não
 * resolve, conferido em 18/11/2026), e o Open Relay da Metered também foi desligado: TURN de graça só com conta.
 */
export const ICE_PADRAO: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

/**
 * TURN fixo no código, pra todo mundo que abrir o site.
 *
 * Quando a rede de alguém bloqueia a conexão direta (4G de algumas operadoras, Wi-Fi de empresa ou faculdade), o
 * WebRTC só funciona passando por um servidor TURN, que retransmite o tráfego. Sem nenhum, essas pessoas só conectam
 * quando a rede deixa (por isso o erro parece intermitente).
 *
 * A credencial NÃO fica no repositório: vem das variáveis do build VITE_TURN_URLS (uma ou mais URLs separadas por
 * vírgula), VITE_TURN_USERNAME e VITE_TURN_CREDENTIAL. No GitHub são os secrets TURN_URLS, TURN_USERNAME e
 * TURN_CREDENTIAL (o workflow repassa pro build); no PC, um arquivo .env.local (fora do git). Sem elas, segue só com
 * STUN. Atenção: o navegador de quem joga precisa da credencial, então ela vai no JavaScript publicado e qualquer um
 * pode ver no site; por isso, conta com limite de uso (o plano grátis do ExpressTURN, em 18/11/2026).
 * Também dá pra configurar um TURN só no próprio navegador, sem mexer no build (saveTurn, guardado em 'pdx-turn').
 */
export const TURN_SERVERS: RTCIceServer[] = turnDoAmbiente(
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {},
);

/** TURN das variáveis do build: [] se faltar alguma, ou se uma URL não for turn:/turns:. */
export function turnDoAmbiente(env: Record<string, string | undefined>): RTCIceServer[] {
  const urls = (env.VITE_TURN_URLS ?? '').split(/[\s,]+/).filter(Boolean);
  const username = env.VITE_TURN_USERNAME ?? '';
  const credential = env.VITE_TURN_CREDENTIAL ?? '';
  if (!urls.length || !username || !credential || !urls.every((u) => /^turns?:\S+$/i.test(u))) return [];
  return [{ urls, username, credential }];
}

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

/** Servidores ICE pro RTCPeerConnection: os STUN padrão + TURN_SERVERS + o TURN guardado neste navegador. */
export function iceServers(): RTCIceServer[] {
  const saved = loadTurn();
  return [...ICE_PADRAO, ...TURN_SERVERS, ...(saved ? [saved] : [])].map(copy);
}
