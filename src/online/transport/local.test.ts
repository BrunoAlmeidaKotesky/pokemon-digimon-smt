// Transporte local de verdade: host e convidados no mesmo processo, falando por BroadcastChannel (Node 24 tem global).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TransportError, type HostEndpoint, type Link } from '../types';
import { localTransport, pickTransport, peerTransport } from './index';
import { LOCAL_JOIN_MS } from './local';

/** Link com o que chegou e quantas vezes fechou */
interface Probe {
  link: Link;
  got: unknown[];
  closes: number;
}

const opened: { close(): void }[] = [];
let n = 0;
const newCode = (): string => `T${++n}${Math.floor(Math.random() * 1e6)}`;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function probe(link: Link): Probe {
  const p: Probe = { link, got: [], closes: 0 };
  link.onMessage((m) => p.got.push(m));
  link.onClose(() => p.closes++);
  opened.push(link);
  return p;
}

async function host(code = newCode()): Promise<{ ep: HostEndpoint; links: Probe[] }> {
  const ep = await localTransport.host(code);
  opened.push(ep);
  const links: Probe[] = [];
  ep.onLink((l) => links.push(probe(l)));
  return { ep, links };
}

async function join(code: string): Promise<Probe> {
  return probe(await localTransport.join(code));
}

async function errorOf(p: Promise<unknown>): Promise<TransportError> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(TransportError);
    return e as TransportError;
  }
  throw new Error('devia ter falhado');
}

afterEach(() => {
  for (const o of opened.splice(0)) o.close();
  vi.unstubAllGlobals();
});

describe('localTransport', () => {
  it('nome', () => {
    expect(localTransport.name).toBe('local');
  });

  it('host + 2 convidados: mensagens nos dois sentidos, cada uma pro destino certo', async () => {
    const { ep, links } = await host();
    const a = await join(ep.code);
    const b = await join(ep.code);
    await vi.waitFor(() => expect(links).toHaveLength(2));
    const [ha, hb] = links as [Probe, Probe];

    a.link.send({ t: 'hello', id: '', name: 'Ana' });
    b.link.send({ t: 'hello', id: '', name: 'Bia' });
    await vi.waitFor(() => {
      expect(ha.got).toEqual([{ t: 'hello', id: '', name: 'Ana' }]);
      expect(hb.got).toEqual([{ t: 'hello', id: '', name: 'Bia' }]);
    });

    hb.link.send({ t: 'welcome', id: 'b' });
    ha.link.send({ t: 'welcome', id: 'a' });
    ha.link.send({ t: 'state', view: { deep: { list: [1, 2, { x: 'y' }] } } });
    await vi.waitFor(() => {
      expect(a.got).toEqual([{ t: 'welcome', id: 'a' }, { t: 'state', view: { deep: { list: [1, 2, { x: 'y' }] } } }]);
      expect(b.got).toEqual([{ t: 'welcome', id: 'b' }]);
    });

    await sleep(50);
    expect(ha.got).toHaveLength(1);
    expect(hb.got).toHaveLength(1);
    expect(a.got).toHaveLength(2);
    expect(b.got).toHaveLength(1);
  });

  it('salas diferentes não se misturam', async () => {
    const s1 = await host();
    const s2 = await host();
    const a = await join(s1.ep.code);
    const b = await join(s2.ep.code);
    await vi.waitFor(() => {
      expect(s1.links).toHaveLength(1);
      expect(s2.links).toHaveLength(1);
    });
    s1.links[0]?.link.send('só pra A');
    s2.links[0]?.link.send('só pra B');
    a.link.send('de A');
    await vi.waitFor(() => {
      expect(a.got).toEqual(['só pra A']);
      expect(b.got).toEqual(['só pra B']);
      expect(s1.links[0]?.got).toEqual(['de A']);
    });
    await sleep(50);
    expect(s2.links[0]?.got).toEqual([]);
  });

  it('mensagem que chega antes do onMessage fica guardada', async () => {
    const code = newCode();
    const ep = await localTransport.host(code);
    opened.push(ep);
    ep.onLink((l) => {
      l.send({ t: 'ping' });
      l.send({ t: 'welcome', id: 'x' });
    });
    const link = await localTransport.join(code);
    opened.push(link);
    await sleep(50);
    const got: unknown[] = [];
    link.onMessage((m) => got.push(m));
    expect(got).toEqual([{ t: 'ping' }, { t: 'welcome', id: 'x' }]);
  });

  it('código inexistente -> sala-nao-existe', async () => {
    const t0 = Date.now();
    const e = await errorOf(localTransport.join(newCode()));
    expect(e.kind).toBe('sala-nao-existe');
    expect(Date.now() - t0).toBeGreaterThanOrEqual(LOCAL_JOIN_MS - 50);
  });

  it('código repetido -> codigo-em-uso', async () => {
    const { ep } = await host();
    const e = await errorOf(localTransport.host(ep.code));
    expect(e.kind).toBe('codigo-em-uso');
    // o primeiro continua aceitando gente
    await join(ep.code);
  });

  it('dois hosts ao mesmo tempo com o mesmo código: só um fica', async () => {
    // ids aleatórios: repete pra cair nas duas ordens do desempate
    const rounds = await Promise.all(
      Array.from({ length: 6 }, async () => {
        const code = newCode();
        return Promise.allSettled([localTransport.host(code), localTransport.host(code)]);
      }),
    );
    for (const r of rounds) {
      for (const x of r) if (x.status === 'fulfilled') opened.push(x.value);
      expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
      const bad = r.find((x) => x.status === 'rejected');
      expect((bad as PromiseRejectedResult).reason).toBeInstanceOf(TransportError);
      expect(((bad as PromiseRejectedResult).reason as TransportError).kind).toBe('codigo-em-uso');
    }
  });

  it('convidado fecha: onClose dos dois lados, uma vez só', async () => {
    const { ep, links } = await host();
    const a = await join(ep.code);
    const b = await join(ep.code);
    await vi.waitFor(() => expect(links).toHaveLength(2));
    a.link.close();
    a.link.close();
    expect(a.closes).toBe(1);
    await vi.waitFor(() => expect(links[0]?.closes).toBe(1));
    expect(links[1]?.closes).toBe(0);
    expect(b.closes).toBe(0);
    // depois de fechado, enviar não faz nada
    a.link.send('perdida');
    links[0]?.link.send('perdida');
    b.link.send('ainda aqui');
    await vi.waitFor(() => expect(links[1]?.got).toEqual(['ainda aqui']));
    await sleep(50);
    expect(links[0]?.got).toEqual([]);
    expect(a.got).toEqual([]);
  });

  it('host fecha um link: o convidado recebe onClose', async () => {
    const { ep, links } = await host();
    const a = await join(ep.code);
    const b = await join(ep.code);
    await vi.waitFor(() => expect(links).toHaveLength(2));
    links[1]?.link.close();
    expect(links[1]?.closes).toBe(1);
    await vi.waitFor(() => expect(b.closes).toBe(1));
    await sleep(50);
    expect(a.closes).toBe(0);
    expect(b.closes).toBe(1);
  });

  it('host.close fecha todos os links e a sala some', async () => {
    const { ep, links } = await host();
    const a = await join(ep.code);
    const b = await join(ep.code);
    await vi.waitFor(() => expect(links).toHaveLength(2));
    ep.close();
    ep.close();
    expect(links.map((l) => l.closes)).toEqual([1, 1]);
    await vi.waitFor(() => {
      expect(a.closes).toBe(1);
      expect(b.closes).toBe(1);
    });
    expect((await errorOf(localTransport.join(ep.code))).kind).toBe('sala-nao-existe');
  });

  it('onClose registrado depois de fechado ainda é chamado', async () => {
    const { ep, links } = await host();
    const a = await join(ep.code);
    await vi.waitFor(() => expect(links).toHaveLength(1));
    a.link.close();
    let late = 0;
    a.link.onClose(() => late++);
    await vi.waitFor(() => expect(late).toBe(1));
  });

  it('mensagem que não dá pra clonar não derruba o link', async () => {
    const { ep, links } = await host();
    const a = await join(ep.code);
    await vi.waitFor(() => expect(links).toHaveLength(1));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    a.link.send({ f: () => 1 });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    a.link.send('ok');
    await vi.waitFor(() => expect(links[0]?.got).toEqual(['ok']));
  });

  it('pagehide do convidado avisa o host', async () => {
    const { ep, links } = await host();
    const page = new EventTarget();
    vi.stubGlobal('window', page);
    const a = await join(ep.code);
    vi.unstubAllGlobals();
    await vi.waitFor(() => expect(links).toHaveLength(1));
    page.dispatchEvent(new Event('pagehide'));
    expect(a.closes).toBe(1);
    await vi.waitFor(() => expect(links[0]?.closes).toBe(1));
  });

  it('pagehide do host fecha a sala e avisa os convidados', async () => {
    const page = new EventTarget();
    vi.stubGlobal('window', page);
    const { ep, links } = await host();
    vi.unstubAllGlobals();
    const a = await join(ep.code);
    await vi.waitFor(() => expect(links).toHaveLength(1));
    page.dispatchEvent(new Event('pagehide'));
    expect(links[0]?.closes).toBe(1);
    await vi.waitFor(() => expect(a.closes).toBe(1));
  });
});

describe('pickTransport', () => {
  it('local só com transporte=local', () => {
    expect(pickTransport('?transporte=local')).toBe(localTransport);
    expect(pickTransport('?x=1&transporte=local')).toBe(localTransport);
    expect(pickTransport('transporte=local')).toBe(localTransport);
    expect(pickTransport('')).toBe(peerTransport);
    expect(pickTransport('?transporte=peer')).toBe(peerTransport);
    expect(pickTransport('?transporte=LOCAL')).toBe(peerTransport);
  });

  it('sem argumento usa location.search (e sem location, peer)', () => {
    expect(pickTransport()).toBe(peerTransport);
    vi.stubGlobal('location', { search: '?transporte=local' });
    expect(pickTransport()).toBe(localTransport);
  });
});
