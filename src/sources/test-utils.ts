// Só para os testes (*.test.ts): fetch falso que responde com as fixtures reais de tests/fixtures/,
// seguindo as mesmas regras de tests/helpers.ts, e um localStorage em memória.
import fs from 'node:fs';
import { vi } from 'vitest';
import { sujidexResponse, type SujidexFixture } from '../../tests/sujidex-mock';
import { rendersResponse, type RendersFixture } from '../../tests/wiki-renders-mock';

const FIX = new URL('../../tests/fixtures/', import.meta.url);
export const fixture = <T = unknown>(name: string): T => JSON.parse(fs.readFileSync(new URL(name, FIX), 'utf8')) as T;

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
export const text = (body: string, status: number): Response => new Response(body, { status, headers: { 'content-type': 'text/plain' } });

/** Rota própria de um teste: devolve a resposta, ou undefined para cair nas fixtures. */
export type Route = (u: URL, raw: string) => Response | Promise<Response> | undefined;

function fixtureRoute(u: URL): Response | undefined {
  if (u.hostname === 'localhost' && u.pathname === '/sujimon/list.json') return json(fixture('sujimon-list.json'));
  if (u.hostname === 'pokeapi.co') return json(fixture('pokemon-species.json'));
  if (u.hostname === 'digi-api.com' && u.pathname.startsWith('/api/v1/digimon')) {
    const id = /\/digimon\/(\d+)$/.exec(u.pathname)?.[1];
    if (id) return json(fixture(`digimon-detail-${id}.json`));
    return json(fixture(`digimon-page${u.searchParams.get('page') === '1' ? 1 : 0}.json`));
  }
  if (u.hostname === 'jojowiki.com' && u.pathname === '/api.php') {
    const jojo = fixture<Record<string, unknown[]>>('jojo.json');
    const cat = (u.searchParams.get('gcmtitle') ?? '').replace(/^Category:/, '');
    const pages = jojo[cat] ?? [{ batchcomplete: '', query: { pages: {} } }];
    return json(pages[u.searchParams.get('gcmcontinue') ? 1 : 0]);
  }
  if (u.hostname === 'db.ygoprodeck.com') return json(fixture('ygo-cardinfo.json'));
  if (u.hostname === 'bakugan.fandom.com' && u.pathname === '/api.php') {
    return json(fixture<unknown[]>('bakugan.json')[u.searchParams.get('geicontinue') ? 1 : 0]);
  }
  if (u.hostname === 'ddragon.leagueoflegends.com') {
    if (u.pathname === '/api/versions.json') return json(fixture('lol-versions.json'));
    if (u.pathname.endsWith('/data/en_US/champion.json')) return json(fixture('lol-champions.json'));
  }
  if (u.hostname === 'overfast-api.tekrop.fr' && u.pathname === '/heroes') return json(fixture('overwatch-heroes.json'));
  if (u.hostname === 'api.deadlock-api.com' && u.pathname === '/v1/assets/heroes') return json(fixture('deadlock-heroes.json'));
  const renders = rendersResponse(u, fixture<RendersFixture>('wiki-renders.json'));
  if (renders !== undefined) return json(renders);
  if (u.hostname === 'yakuza.fandom.com' && u.pathname === '/api.php') {
    const body = sujidexResponse(u, fixture<SujidexFixture>('sujidex.json'));
    return body === undefined ? undefined : json(body);
  }
  return undefined;
}

/** Troca o fetch global. URLs relativas valem como http://localhost/. O que não tiver rota é rejeitado. */
export function stubFetch(route?: Route) {
  const fn = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const raw = String(input);
    const u = new URL(raw, 'http://localhost/');
    const r = (await route?.(u, raw)) ?? fixtureRoute(u);
    if (!r) throw new TypeError(`fetch bloqueado: ${raw}`);
    return r;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** URLs (como string) de todas as chamadas feitas ao fetch falso. */
export const urls = (fn: ReturnType<typeof stubFetch>): string[] => fn.mock.calls.map(c => String(c[0]));

/** localStorage em memória (só o que as fontes usam). */
export function stubStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => { data.set(k, String(v)); }),
    removeItem: vi.fn((k: string) => { data.delete(k); }),
    clear: vi.fn(() => { data.clear(); }),
    data,
  };
  vi.stubGlobal('localStorage', storage);
  return storage;
}
