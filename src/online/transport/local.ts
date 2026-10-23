// Transporte local, só pra testes (?transporte=local): BroadcastChannel entre páginas do mesmo navegador, sem rede.
//
// Protocolo (todas as mensagens têm qvp: 1 e `from` = id de quem mandou; o BroadcastChannel entrega pra todo mundo,
// então cada um ignora o que não é endereçado a ele):
//   probe  {code}       host novo pergunta se o código já tem dono; quem já hospeda responde 'taken'
//   taken  {code, to}   o código é de outro: quem perguntou desiste
//   join   {code}       convidado pede pra entrar; o host do código responde 'accept'
//   accept {code, to}   aceito: o Link liga o convidado (`to`) ao host (`from`)
//   msg    {to, data}   mensagem do Link
//   bye    {to}         o Link fechou
import { TransportError, type HostEndpoint, type Link, type Transport } from '../types';
import { createLink, linkQueue, type LinkCore } from './link';

export const LOCAL_CHANNEL = 'qvp-local';
/** quanto o convidado espera o aceite do host */
export const LOCAL_JOIN_MS = 1500;
/** quanto o host novo espera pra ver se alguém já tem o código */
export const LOCAL_PROBE_MS = 300;

type Kind = 'probe' | 'taken' | 'join' | 'accept' | 'msg' | 'bye';
const KINDS: readonly string[] = ['probe', 'taken', 'join', 'accept', 'msg', 'bye'];

interface Env {
  qvp: 1;
  k: Kind;
  from: string;
  to?: string;
  code?: string;
  data?: unknown;
}

function readEnv(x: unknown): Env | null {
  if (typeof x !== 'object' || x === null) return null;
  const e = x as Record<string, unknown>;
  if (e.qvp !== 1 || typeof e.k !== 'string' || !KINDS.includes(e.k) || typeof e.from !== 'string') return null;
  if (e.to !== undefined && typeof e.to !== 'string') return null;
  if (e.code !== undefined && typeof e.code !== 'string') return null;
  return e as unknown as Env;
}

/** id aleatório (crypto.getRandomValues funciona até fora de HTTPS e não depende de Math.random) */
function uid(): string {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16).padStart(8, '0')).join('');
}

interface Channel {
  post(env: Omit<Env, 'qvp' | 'from'>): void;
  close(): void;
}

/** Abre o canal com o id `me`: entrega só o que tem formato de envelope e não foi mandado por mim. */
function openChannel(me: string, onEnv: (env: Env) => void): Channel {
  let ch: BroadcastChannel;
  try {
    ch = new BroadcastChannel(LOCAL_CHANNEL);
  } catch (e) {
    throw new TransportError('navegador', `sem BroadcastChannel: ${String(e)}`);
  }
  let open = true;
  ch.onmessage = (ev: MessageEvent) => {
    const env = readEnv(ev.data);
    if (open && env && env.from !== me) onEnv(env);
  };
  return {
    // postMessage lança com mensagem que não dá pra clonar (o Link avisa no console)
    post: (env) => {
      if (open) ch.postMessage({ ...env, qvp: 1, from: me });
    },
    close: () => {
      if (!open) return;
      open = false;
      ch.close();
    },
  };
}

/** Chama `fn` quando a página sai (pagehide). Devolve a função que para de ouvir. */
function onPageHide(fn: () => void): () => void {
  const w: EventTarget | undefined = typeof window === 'undefined' ? undefined : window;
  if (!w) return () => {};
  w.addEventListener('pagehide', fn);
  return () => w.removeEventListener('pagehide', fn);
}

function host(code: string): Promise<HostEndpoint> {
  return new Promise<HostEndpoint>((resolve, reject) => {
    const me = uid();
    let state: 'probing' | 'open' | 'closed' = 'probing';
    let stopPageHide = (): void => {};
    const links = new Map<string, LinkCore>();
    const queue = linkQueue();

    const ch = openChannel(me, (env) => {
      if (state === 'closed') return;
      switch (env.k) {
        case 'probe':
          if (env.code !== code) return;
          // já hospedo, ou também estou sondando e ganho no desempate (menor id): o outro desiste.
          // Perdi o desempate: desisto eu (o outro pode nem ter ouvido a minha sondagem).
          if (state === 'open' || me < env.from) ch.post({ k: 'taken', code, to: env.from });
          else giveUp();
          return;
        case 'taken':
          if (env.to === me) giveUp();
          return;
        case 'join':
          if (state === 'open' && env.code === code && !links.has(env.from)) accept(env.from);
          return;
        case 'msg':
          if (env.to === me) links.get(env.from)?.deliver(env.data);
          return;
        case 'bye': {
          const l = env.to === me ? links.get(env.from) : undefined;
          if (l) {
            links.delete(env.from);
            l.end();
          }
          return;
        }
        case 'accept':
          return;
      }
    });

    function giveUp(): void {
      if (state !== 'probing') return;
      state = 'closed';
      clearTimeout(timer);
      ch.close();
      reject(new TransportError('codigo-em-uso'));
    }

    function accept(guest: string): void {
      const core = createLink({
        send: (data) => ch.post({ k: 'msg', to: guest, data }),
        close: () => {
          links.delete(guest);
          ch.post({ k: 'bye', to: guest });
        },
      });
      links.set(guest, core);
      ch.post({ k: 'accept', code, to: guest });
      queue.push(core.link);
    }

    const endpoint: HostEndpoint = {
      code,
      onLink: (cb) => queue.listen(cb),
      // sem servidor de convites: nunca tem problema
      onTrouble: () => {},
      close() {
        if (state === 'closed') return;
        state = 'closed';
        clearTimeout(timer);
        stopPageHide();
        for (const l of [...links.values()]) l.link.close();
        links.clear();
        ch.close();
      },
    };

    ch.post({ k: 'probe', code });
    const timer = setTimeout(() => {
      if (state !== 'probing') return;
      state = 'open';
      stopPageHide = onPageHide(() => endpoint.close());
      resolve(endpoint);
    }, LOCAL_PROBE_MS);
  });
}

function join(code: string): Promise<Link> {
  return new Promise<Link>((resolve, reject) => {
    const me = uid();
    let state: 'waiting' | 'open' | 'closed' = 'waiting';
    let hostId = '';
    let core: LinkCore | null = null;
    let stopPageHide = (): void => {};

    const shutdown = (): void => {
      state = 'closed';
      clearTimeout(timer);
      stopPageHide();
      ch.close();
    };

    const ch = openChannel(me, (env) => {
      if (env.to !== me) return;
      if (env.k === 'accept' && state === 'waiting' && env.code === code) {
        state = 'open';
        hostId = env.from;
        clearTimeout(timer);
        const c = createLink({
          send: (data) => ch.post({ k: 'msg', to: hostId, data }),
          close: () => {
            ch.post({ k: 'bye', to: hostId });
            shutdown();
          },
        });
        core = c;
        stopPageHide = onPageHide(() => c.link.close());
        resolve(c.link);
      } else if (env.k === 'accept' && env.from !== hostId) {
        // aceite de outro host (ou atrasado): avisa que não vai ficar
        ch.post({ k: 'bye', to: env.from });
      } else if (state === 'open' && env.from === hostId && core) {
        if (env.k === 'msg') core.deliver(env.data);
        else if (env.k === 'bye') {
          shutdown();
          core.end();
        }
      }
    });

    ch.post({ k: 'join', code });
    const timer = setTimeout(() => {
      if (state !== 'waiting') return;
      shutdown();
      reject(new TransportError('sala-nao-existe'));
    }, LOCAL_JOIN_MS);
  });
}

export const localTransport: Transport = { name: 'local', host, join };
