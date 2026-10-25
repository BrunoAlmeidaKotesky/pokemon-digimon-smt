// Ajudantes dos testes de ponta a ponta: APIs falsas (sem internet), sorteio com semente e atalhos.
import { expect, type BrowserContext, type Page, type Route } from '@playwright/test';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { sujidexResponse, type SujidexFixture } from './sujidex-mock';
import { RENDER_HOSTS, rendersResponse, type RendersFixture } from './wiki-renders-mock';

const FIX = new URL('./fixtures/', import.meta.url);
export const fixture = <T = unknown>(name: string): T => JSON.parse(fs.readFileSync(new URL(name, FIX), 'utf8')) as T;

// PNG 1×1 cinza, gerado na hora (as imagens externas viram isto).
function pngPixel(r: number, g: number, b: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf: Buffer) => { let c = 0xffffffff; for (const x of buf) c = crcTable[(c ^ x) & 0xff]! ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.from([0, r, g, b]))), chunk('IEND', Buffer.alloc(0))]);
}
export const PNG = pngPixel(150, 150, 160);

export type Franquia = 'pokemon' | 'digimon' | 'smt' | 'jojo' | 'ygo' | 'bakugan' | 'lol' | 'overwatch' | 'deadlock' | 'ff' | 'sujimon';
export const LABEL: Record<Franquia, string> = {
  pokemon: 'Pokémon', digimon: 'Digimon', smt: 'SMT/Persona', jojo: 'JoJo', ygo: 'Yu-Gi-Oh!', bakugan: 'Bakugan',
  lol: 'LoL', overwatch: 'Overwatch', deadlock: 'Deadlock', ff: 'Final Fantasy', sujimon: 'Sujimon',
};
export const CONTAGEM: Record<Franquia, number> = {
  pokemon: 40, digimon: 40, smt: 392, jojo: 41, ygo: 45, bakugan: 49, lol: 40, overwatch: 54, deadlock: 44, ff: 40, sujimon: 40,
};

export interface MockOpts {
  /** franquias cuja API responde erro 500 */
  falha?: Franquia[];
  /** 'fixture' (padrão), 'ausente' (404) ou uma lista própria [[nome, "NNN"]] */
  sujimon?: 'fixture' | 'ausente' | [string, string][];
  /** responde a API da Yakuza Wiki (Sujidex) com a fixture; sem isso ela fica bloqueada */
  sujimonWiki?: boolean;
  /** as wikis dos renders (Overwatch, Deadlock) respondem erro 500: fica a imagem da API */
  semRenders?: boolean;
  /** atraso (ms) antes de responder cada franquia */
  atraso?: Partial<Record<Franquia, number>>;
}
export interface Chamadas { [k: string]: number }

const json = (route: Route, body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body), headers: { 'access-control-allow-origin': '*' } });
const sleep = (ms = 0) => new Promise(r => setTimeout(r, ms));

/** Intercepta tudo o que sairia pra internet. Devolve um contador de chamadas por API. */
export async function mockApis(ctx: BrowserContext | Page, opts: MockOpts = {}): Promise<Chamadas> {
  const calls: Chamadas = {};
  const count = (k: string) => { calls[k] = (calls[k] ?? 0) + 1; };
  const falha = new Set(opts.falha ?? []);
  const espera = (k: Franquia) => sleep(opts.atraso?.[k] ?? 0);
  const jojo = fixture<Record<string, unknown[]>>('jojo.json');
  const bakugan = fixture<unknown[]>('bakugan.json');

  await ctx.route('**/*', async route => {
    const req = route.request();
    const u = new URL(req.url());
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      if (u.pathname.endsWith('/sujimon/list.json')) {
        count('sujimon');
        const s = opts.sujimon ?? 'fixture';
        await espera('sujimon');
        if (s === 'ausente') return route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
        return json(route, s === 'fixture' ? fixture('sujimon-list.json') : s);
      }
      if (/\/sujimon\/\d+\.webp$/.test(u.pathname)) return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
      // Final Fantasy: a lista é um arquivo do próprio site (public/ff/list.json, milhares de monstros); aqui vira a fixture
      if (u.pathname.endsWith('/ff/list.json')) {
        count('ff'); await espera('ff');
        return falha.has('ff') ? route.fulfill({ status: 500, body: 'erro' }) : json(route, fixture('ff-list.json'));
      }
      return route.continue();
    }
    if (u.hostname === 'pokeapi.co') {
      count('pokemon'); await espera('pokemon');
      return falha.has('pokemon') ? route.fulfill({ status: 500, body: 'erro' }) : json(route, fixture('pokemon-species.json'));
    }
    if (u.hostname === 'digi-api.com' && u.pathname.startsWith('/api/v1/digimon')) {
      const id = u.pathname.match(/\/digimon\/(\d+)$/)?.[1];
      if (id) { count('digimon-detalhe'); return json(route, fixture(`digimon-detail-${id}.json`)); }
      count('digimon'); await espera('digimon');
      if (falha.has('digimon')) return route.fulfill({ status: 500, body: 'erro' });
      return json(route, fixture(`digimon-page${u.searchParams.get('page') === '1' ? 1 : 0}.json`));
    }
    if (u.hostname === 'jojowiki.com' && u.pathname === '/api.php') {
      count('jojo'); await espera('jojo');
      if (falha.has('jojo')) return route.fulfill({ status: 500, body: 'erro' });
      const cat = (u.searchParams.get('gcmtitle') ?? '').replace(/^Category:/, '');
      const pages = jojo[cat] ?? [{ batchcomplete: '', query: { pages: {} } }];
      return json(route, pages[u.searchParams.get('gcmcontinue') ? 1 : 0]);
    }
    if (u.hostname === 'db.ygoprodeck.com') {
      count('ygo'); await espera('ygo');
      return falha.has('ygo') ? route.fulfill({ status: 500, body: 'erro' }) : json(route, fixture('ygo-cardinfo.json'));
    }
    if (u.hostname === 'bakugan.fandom.com' && u.pathname === '/api.php') {
      count('bakugan'); await espera('bakugan');
      if (falha.has('bakugan')) return route.fulfill({ status: 500, body: 'erro' });
      return json(route, bakugan[u.searchParams.get('geicontinue') ? 1 : 0]);
    }
    if (u.hostname === 'ddragon.leagueoflegends.com') {
      // duas chamadas: a lista de versões (é ela que falha) e os campeões da versão mais nova
      if (u.pathname === '/api/versions.json') {
        count('lol'); await espera('lol');
        return falha.has('lol') ? route.fulfill({ status: 500, body: 'erro' }) : json(route, fixture('lol-versions.json'));
      }
      if (u.pathname.endsWith('/data/en_US/champion.json')) { count('lol-campeoes'); return json(route, fixture('lol-champions.json')); }
    }
    if (u.hostname === 'overfast-api.tekrop.fr' && u.pathname === '/heroes') {
      count('overwatch'); await espera('overwatch');
      return falha.has('overwatch') ? route.fulfill({ status: 500, body: 'erro' }) : json(route, fixture('overwatch-heroes.json'));
    }
    if (u.hostname === 'api.deadlock-api.com' && u.pathname === '/v1/assets/heroes') {
      count('deadlock'); await espera('deadlock');
      return falha.has('deadlock') ? route.fulfill({ status: 500, body: 'erro' }) : json(route, fixture('deadlock-heroes.json'));
    }
    if (RENDER_HOSTS.includes(u.hostname) && u.pathname === '/api.php') {
      count('renders');
      if (opts.semRenders) return route.fulfill({ status: 500, body: 'erro' });
      const body = rendersResponse(u, fixture<RendersFixture>('wiki-renders.json'));
      if (body !== undefined) return json(route, body);
    }
    if (u.hostname === 'yakuza.fandom.com' && u.pathname === '/api.php' && opts.sujimonWiki) {
      count('sujidex');
      const body = sujidexResponse(u, fixture<SujidexFixture>('sujidex.json'));
      if (body !== undefined) return json(route, body);
    }
    if (u.hostname === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    // a splash do CommunityDragon (LoL) não tem extensão: /latest/champion/{key}/splash-art/centered
    const cdragon = u.hostname === 'cdn.communitydragon.org';
    if (req.resourceType() === 'image' || cdragon || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(u.pathname)) {
      count('imagem');
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    }
    count('bloqueado');
    return route.abort();
  });
  return calls;
}

/** Troca Math.random por um gerador com semente (mulberry32). window.__reseed(n) recomeça a sequência. */
export async function seedRandom(ctx: BrowserContext | Page, seed = 42) {
  await ctx.addInitScript((s: number) => {
    let a = s >>> 0;
    const w = window as unknown as { __reseed: (n: number) => void };
    w.__reseed = (n: number) => { a = n >>> 0; };
    Math.random = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, seed);
}

/** Preenche o localStorage antes de a página carregar (só na primeira carga de cada página). */
export async function presetStorage(ctx: BrowserContext | Page, data: Record<string, unknown>) {
  await ctx.addInitScript((d: Record<string, string>) => {
    if (sessionStorage.getItem('__preset')) return;
    sessionStorage.setItem('__preset', '1');
    for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v);
  }, Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])));
}

export async function prepare(page: Page, opts: MockOpts & { seed?: number; storage?: Record<string, unknown> } = {}) {
  const calls = await mockApis(page, opts);
  await seedRandom(page, opts.seed ?? 42);
  if (opts.storage) await presetStorage(page, opts.storage);
  return calls;
}

export const statusEsperado = (sem: Franquia[] = [], extra: Partial<Record<Franquia, string | number>> = {}) =>
  (Object.keys(LABEL) as Franquia[]).filter(k => !sem.includes(k)).map(k => `${LABEL[k]}: ${extra[k] ?? CONTAGEM[k]}`).join(' · ');

/** Abre o site e espera todas as franquias terminarem de carregar. */
export async function abrir(page: Page, path = './') {
  await page.goto(path);
  await expect(page.locator('#status')).not.toContainText('carregando', { timeout: 15000 });
}

export async function aba(page: Page, nome: 'Duelo' | 'Trio' | 'Quarteto' | 'Campeonato' | 'Placar' | 'Personalizar' | 'Online') {
  await page.locator('nav button', { hasText: nome }).click();
}

export const nomes = async (page: Page, sel: string) => (await page.locator(`${sel} .card .name`).allTextContents()).map(s => s.trim());
export const franquias = async (page: Page, sel: string) => page.locator(`${sel} .card`).evaluateAll(els => els.map(e => (e as HTMLElement).dataset.fr ?? ''));

export async function lerStorage<T = unknown>(page: Page, key: string): Promise<T | null> {
  return page.evaluate(k => { const v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); }, key) as Promise<T | null>;
}

export interface Stats { w: Record<string, number>; n: Record<string, number>; hist: string[]; best: { name: string; fr: string; streak: number } | null }
