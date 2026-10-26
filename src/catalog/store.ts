// Estado da aba Catálogo: as marcações do Set 1 (salvas no localStorage em pdx-set1), os catálogos já baixados e o
// que a aba está mostrando (franquia, filtros de cada franquia, quantos personagens). Fica fora do componente pra
// sobreviver à troca de aba. Toda mudança avisa quem assinou (useSyncExternalStore).
import { readJSON, writeJSON } from '../core/storage';
import { filtrosVazios, juntarMarcas, limparMarcas, parseCatalogo, type Catalogo, type Filtros, type Marcas } from './model';

/** Chave nova, só do Catálogo: { chave: [nomes marcados] }. */
export const SET1_KEY = 'pdx-set1';
/** Quantos personagens a lista mostra de cada vez (o resto vem no "Mostrar mais"). */
export const PAGINA = 60;

let ver = 0;
const subs = new Set<() => void>();
function mudou(): void {
  ver++;
  for (const fn of Array.from(subs)) fn();
}
export function assinar(fn: () => void): () => void {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
/** Número que muda a cada alteração (snapshot pro useSyncExternalStore). */
export const versao = () => ver;

// ---------- marcações ----------
// Cada franquia tem um Set novo a cada mudança: dá pra usar como dependência de useMemo.
let marcas: Map<string, ReadonlySet<string>> | null = null;
const VAZIO: ReadonlySet<string> = new Set();
function todas(): Map<string, ReadonlySet<string>> {
  marcas ??= new Map(Object.entries(limparMarcas(readJSON(SET1_KEY))).map(([k, v]) => [k, new Set(v)]));
  return marcas;
}
/** Esquece o que está na memória e relê do localStorage na próxima consulta. */
export function recarregarMarcas(): void {
  marcas = null;
  mudou();
}
export const marcados = (k: string): ReadonlySet<string> => todas().get(k) ?? VAZIO;
/** Todas as marcações, no formato salvo. */
export const marcasSalvas = (): Marcas => Object.fromEntries([...todas()].map(([k, s]) => [k, [...s]]));
function gravar(k: string, s: Set<string>): void {
  const m = todas();
  if (s.size) m.set(k, s);
  else m.delete(k);
  writeJSON(SET1_KEY, marcasSalvas());
  mudou();
}
export function alternar(k: string, nome: string): void {
  const s = new Set(marcados(k));
  if (!s.delete(nome)) s.add(nome);
  gravar(k, s);
}
/** Marca (on) ou desmarca vários de uma vez. */
export function marcar(k: string, nomes: readonly string[], on: boolean): void {
  const s = new Set(marcados(k));
  for (const n of nomes) {
    if (on) s.add(n);
    else s.delete(n);
  }
  gravar(k, s);
}
/** Desmarca todo mundo da franquia. */
export const limpar = (k: string) => gravar(k, new Set());
/** Soma as marcações importadas às atuais. Devolve quantas eram novas. */
export function importar(novas: Marcas): number {
  const r = juntarMarcas(marcasSalvas(), novas);
  marcas = new Map(Object.entries(r.marcas).map(([k, v]) => [k, new Set(v)]));
  writeJSON(SET1_KEY, r.marcas);
  mudou();
  return r.novas;
}

// ---------- catálogos (public/catalogo/<chave>.json) ----------
/** null = a franquia não tem catálogo (arquivo ausente ou inválido) */
export type EstadoCatalogo = Catalogo | null | 'carregando';
export const catalogoUrl = (k: string) => `catalogo/${encodeURIComponent(k)}.json`;
const catalogos = new Map<string, EstadoCatalogo>();
const pedidos = new Map<string, Promise<Catalogo | null>>();
/** Como está o catálogo da franquia; undefined = ainda não foi pedido. */
export const catalogo = (k: string): EstadoCatalogo | undefined => catalogos.get(k);
/**
 * Baixa o catálogo da franquia uma vez por sessão. Arquivo que não existe (404, ou a página do site que o servidor
 * de desenvolvimento devolve no lugar), JSON inválido ou erro de rede viram null: a aba lista só nome e imagem.
 */
export function pedirCatalogo(k: string): Promise<Catalogo | null> {
  let p = pedidos.get(k);
  if (!p) {
    catalogos.set(k, 'carregando');
    p = fetch(catalogoUrl(k))
      .then(r => (r.ok ? r.json() : null))
      .then(j => parseCatalogo(j))
      .catch(() => null)
      .then(c => {
        catalogos.set(k, c);
        mudou();
        return c;
      });
    pedidos.set(k, p);
  }
  return p;
}
/** Esquece os catálogos baixados (testes). */
export function esquecerCatalogos(): void {
  catalogos.clear();
  pedidos.clear();
}

// ---------- o que a aba mostra ----------
let atual = '';
const filtros = new Map<string, Filtros>();
const SEM_FILTRO = filtrosVazios();
let quantos = PAGINA;

/** Franquia escolhida ('' = nenhuma ainda: a aba usa a primeira). */
export const franquiaAtual = () => atual;
export function escolherFranquia(k: string): void {
  if (k === atual) return;
  atual = k;
  quantos = PAGINA;
  mudou();
}
/** Filtros da franquia (cada uma guarda os seus). Mesmo objeto enquanto não mudar. */
export const filtrosDe = (k: string): Filtros => filtros.get(k) ?? SEM_FILTRO;
export function mudarFiltros(k: string, patch: Partial<Filtros>): void {
  filtros.set(k, { ...filtrosDe(k), ...patch });
  quantos = PAGINA;
  mudou();
}
/** Muda o filtro de um campo ('' = todos). */
export const mudarCampo = (k: string, id: string, v: string) => mudarFiltros(k, { campos: { ...filtrosDe(k).campos, [id]: v } });
export const limparFiltros = (k: string) => mudarFiltros(k, filtrosVazios());
export const quantosMostrar = () => quantos;
export function mostrarMais(): void {
  quantos += PAGINA;
  mudou();
}
