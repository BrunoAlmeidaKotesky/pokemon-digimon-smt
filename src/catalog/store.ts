// Estado da aba Catálogo: as marcações do Set 1 (salvas no localStorage em pdx-set1), o planejamento (classes,
// habilidades e linhas, em pdx-set1-plano), a base (catalogo/set1-base.json), os catálogos já baixados e o que a aba
// está mostrando (franquia, grupo, filtros de cada franquia, quantos personagens). Fica fora do componente pra
// sobreviver à troca de aba. Toda mudança avisa quem assinou (useSyncExternalStore).
import { readJSON, writeJSON } from '../core/storage';
import { filtrosVazios, juntarMarcas, limparMarcas, parseCatalogo, type Catalogo, type Filtros, type Marcas } from './model';
import * as pl from './plano';
import type { Base, Classe, LinhaEvo, Plano, Unidades } from './plano';

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

// ---------- base (public/catalogo/set1-base.json) ----------
/** null = sem base (arquivo ausente ou inválido): sem grupo base, classes e linhas começam vazias */
export type EstadoBase = Base | null | 'carregando';
export const BASE_URL = 'catalogo/set1-base.json';
let baseEstado: EstadoBase | undefined;
let basePedido: Promise<Base | null> | null = null;
/** grupo base por franquia, como Set (montado uma vez quando a base chega) */
let baseSets = new Map<string, ReadonlySet<string>>();
/** Como está a base; undefined = ainda não foi pedida. */
export const base = (): EstadoBase | undefined => baseEstado;
const baseOk = (): Base | null => (baseEstado && baseEstado !== 'carregando' ? baseEstado : null);
/** Baixa a base uma vez por sessão; qualquer falha vira null (a aba segue sem o grupo base). */
export function pedirBase(): Promise<Base | null> {
  if (!basePedido) {
    baseEstado = 'carregando';
    basePedido = fetch(BASE_URL)
      .then(r => (r.ok ? r.json() : null))
      .then(j => pl.parseBase(j))
      .catch(() => null)
      .then(b => {
        baseEstado = b;
        baseSets = new Map(Object.entries(b?.selecao ?? {}).map(([k, v]) => [k, new Set(v)]));
        mudou();
        return b;
      });
  }
  return basePedido;
}
/** Quem está no grupo "Set 1 (base)" da franquia. */
export const grupoBase = (k: string): ReadonlySet<string> => baseSets.get(k) ?? VAZIO;
/** Esquece a base baixada (testes). */
export function esquecerBase(): void {
  baseEstado = undefined;
  basePedido = null;
  baseSets = new Map();
}

// ---------- planejamento (pdx-set1-plano) ----------
/** Chave nova, só do planejamento: { versao, classes?, unidades, linhas }. */
export const PLANO_KEY = 'pdx-set1-plano';
let planoAtual: Plano | null = null;
const lerPlano = (): Plano => (planoAtual ??= pl.limparPlano(readJSON(PLANO_KEY)));
function gravarPlano(p: Plano): void {
  planoAtual = p;
  writeJSON(PLANO_KEY, p);
  mudou();
}
/** O plano como está salvo (sem a base por cima). */
export const plano = (): Plano => lerPlano();
/** Esquece o que está na memória e relê do localStorage na próxima consulta. */
export function recarregarPlano(): void {
  planoAtual = null;
  mudou();
}
/** As classes que valem agora (as do plano, senão as da base). Mesmo array enquanto não mudar. */
export const classes = (): Classe[] => pl.classesEfetivas(lerPlano(), baseOk());
/** As linhas da franquia que valem agora. Mesmo array enquanto não mudar. */
export const linhasDe = (k: string): LinhaEvo[] => pl.linhasEfetivas(lerPlano(), baseOk(), k);
/** As linhas da franquia já foram mexidas (não seguem mais a base)? */
export const linhasMexidas = (k: string): boolean => k in lerPlano().linhas;
// sem protótipo, como as do plano: unidades["constructor"] não acha nada herdado
const SEM_UNIDADES: Unidades = Object.freeze(Object.create(null) as Unidades);
/** Classes e habilidade de cada personagem da franquia. Mesmo objeto enquanto não mudar. */
export const unidadesDe = (k: string): Unidades => lerPlano().unidades[k] ?? SEM_UNIDADES;

/** Muda as linhas da franquia; na primeira vez, copia as da base pro plano. Função que devolve o mesmo array = nada muda. */
export function editarLinhas(k: string, fn: (l: LinhaEvo[]) => LinhaEvo[]): void {
  const antes = linhasDe(k);
  const depois = fn(antes);
  if (depois === antes) return;
  const p = lerPlano();
  gravarPlano({ ...p, linhas: { ...p.linhas, [k]: depois } });
}
/** Cria uma linha (com o personagem no nível 1, se vier) e devolve o id. */
export function criarLinha(k: string, nome: string, membro?: string): string {
  let id = '';
  editarLinhas(k, l => {
    const r = pl.criarLinha(l, k, nome, membro);
    id = r.id;
    return r.linhas;
  });
  return id;
}
/** Joga fora as mudanças nas linhas da franquia: volta a seguir a base. */
export function voltarLinhasDaBase(k: string): void {
  const p = lerPlano();
  if (!(k in p.linhas)) return;
  const linhas = { ...p.linhas };
  delete linhas[k];
  gravarPlano({ ...p, linhas });
}

/** Muda a lista de classes; na primeira vez, copia as da base pro plano. */
export function editarClasses(fn: (c: Classe[]) => Classe[]): void {
  const antes = classes();
  const depois = fn(antes);
  if (depois === antes) return;
  gravarPlano({ ...lerPlano(), classes: depois });
}
/** Cria uma classe e devolve o id ('' = nome vazio; nome repetido devolve a que já existe). */
export function adicionarClasse(nome: string, descricao = ''): string {
  let id = '';
  editarClasses(c => {
    const r = pl.adicionarClasse(c, nome, descricao);
    id = r.id;
    return r.classes;
  });
  return id;
}
/** Tira a classe da lista e de todo personagem que a tinha. */
export function removerClasse(id: string): void {
  const p = lerPlano();
  gravarPlano({ ...p, classes: classes().filter(c => c.id !== id), unidades: pl.tirarClasseDeTodos(p.unidades, id) });
}
/** Liga ou desliga uma classe do personagem. */
export function alternarClasse(k: string, nome: string, id: string): void {
  const p = lerPlano();
  gravarPlano({ ...p, unidades: pl.alternarClasse(p.unidades, k, nome, id) });
}
const SEM_ULTS: Readonly<Record<string, string>> = Object.freeze(Object.create(null) as Record<string, string>);
/** As ults que a base dá na franquia: nome -> forma. */
export const ultsBase = (k: string): Readonly<Record<string, string>> => baseOk()?.ults[k] ?? SEM_ULTS;
/** A forma da ult do personagem que vale agora ('' = sem). */
export const ultDe = (k: string, nome: string): string => pl.ultEfetiva(lerPlano().unidades[k]?.[nome], ultsBase(k)[nome]);
/**
 * Muda a ult do personagem ('' tira). Igual à da base = volta a seguir a base; tirar a que a base dá fica gravado
 * (vazio), pra não voltar.
 */
export function mudarUlt(k: string, nome: string, ult: string): void {
  if (ult.trim() === ultDe(k, nome)) return;
  const p = lerPlano();
  gravarPlano({ ...p, unidades: pl.mudarUnidade(p.unidades, k, nome, { ult: pl.ultPraGravar(ult, ultsBase(k)[nome]) }) });
}
/** Habilidade do personagem (texto vazio apaga). */
export function mudarHabilidade(k: string, nome: string, habilidade: string): void {
  const p = lerPlano();
  if ((p.unidades[k]?.[nome]?.habilidade ?? '') === (habilidade.trim() ? habilidade : '')) return;
  gravarPlano({ ...p, unidades: pl.mudarUnidade(p.unidades, k, nome, { habilidade }) });
}
/** Restaura o plano de um set1.json (ver restaurarPlano). Espera a base, pra saber o que é igual a ela. */
export async function importarPlano(arq: Plano, validas: readonly string[]): Promise<void> {
  const b = await pedirBase();
  gravarPlano(pl.restaurarPlano(lerPlano(), arq, b, validas));
}
/** O plano completo pro set1.json (classes e linhas que valem agora, das franquias `ks`). */
export const planoParaExportar = (ks: readonly string[]): Plano => pl.planoCompleto(lerPlano(), baseOk(), ks);

// ---------- o que a aba mostra ----------
let atual = '';
const filtros = new Map<string, Filtros>();
const SEM_FILTRO = filtrosVazios();
let quantos = PAGINA;
/** Grupo da lista: Set 1 (base), marcados ou todos. */
export type Grupo = 'base' | 'marcados' | 'todos';
let grupo: Grupo | null = null;
/** Personagens (lista com filtros) ou Linhas (linhas evolutivas da franquia). */
export type Vista = 'personagens' | 'linhas';
let vista: Vista = 'personagens';
let naClasses = false;
let soPendentes = false;
let foco: { k: string; id: string } | null = null;

/** Franquia escolhida ('' = nenhuma ainda: a aba usa a primeira). */
export const franquiaAtual = () => atual;
export function escolherFranquia(k: string): void {
  if (k === atual && !naClasses) return;
  atual = k;
  naClasses = false;
  quantos = PAGINA;
  mudou();
}
/** A subaba Classes (o painel de todas as classes) está aberta? */
export const classesAbertas = () => naClasses;
export function abrirClasses(): void {
  naClasses = true;
  mudou();
}
/**
 * Grupo escolhido. Até o usuário escolher: o Set 1 (base), menos quando não há base (arquivo ausente ou sem ninguém),
 * aí todos.
 */
export function grupoAtual(): Grupo {
  if (grupo) return grupo;
  const b = baseEstado;
  return b === null || (b && b !== 'carregando' && !Object.keys(b.selecao).length) ? 'todos' : 'base';
}
export function escolherGrupo(g: Grupo): void {
  grupo = g;
  quantos = PAGINA;
  mudou();
}
/** Quem está no grupo atual da franquia; null = todos. */
export function grupoDe(k: string): ReadonlySet<string> | null {
  const g = grupoAtual();
  return g === 'base' ? grupoBase(k) : g === 'marcados' ? marcados(k) : null;
}
export const vistaAtual = () => vista;
export function escolherVista(v: Vista): void {
  if (v === vista) return;
  vista = v;
  mudou();
}
/** Na vista Linhas: só as não confirmadas. */
export const soNaoConfirmadas = () => soPendentes;
export function mudarSoNaoConfirmadas(on: boolean): void {
  soPendentes = on;
  mudou();
}
/** Abre a franquia na vista Linhas, rolando até a linha `id` (a vista avisa com focoFeito quando chega lá). */
export function irParaLinha(k: string, id: string): void {
  atual = k;
  naClasses = false;
  vista = 'linhas';
  foco = { k, id };
  // a linha procurada pode estar escondida pelo "só não confirmadas"
  if (soPendentes && linhasDe(k).find(l => l.id === id)?.confirmada) soPendentes = false;
  mudou();
}
/** A linha que a vista Linhas da franquia deve mostrar, se houver. */
export const focoEm = (k: string): string | null => (foco?.k === k ? foco.id : null);
/** A vista já rolou até a linha (não avisa ninguém: nada muda na tela). */
export function focoFeito(): void {
  foco = null;
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
