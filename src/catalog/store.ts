// Estado da aba Catálogo: as marcações do Set 1 (salvas no localStorage em pdx-set1), o planejamento (classes,
// habilidades e linhas, em pdx-set1-plano), a base (catalogo/set1-base.json), os catálogos já baixados e o que a aba
// está mostrando (franquia, grupo, filtros de cada franquia, quantos personagens). Fica fora do componente pra
// sobreviver à troca de aba. Toda mudança avisa quem assinou (useSyncExternalStore).
import { readJSON, writeJSON } from '../core/storage';
import { filtrosVazios, juntarMarcas, limparMarcas, parseCatalogo, type Catalogo, type Filtros, type Marcas } from './model';
import * as pl from './plano';
import type { Base, Classe, LinhaEvo, LinhaSalva, Plano, Unidades } from './plano';

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
/** Chave nova, só do planejamento: { versao, classes?, classesVistas?, unidades, linhas }. */
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
/** As classes que valem agora (as do plano, senão as da base; ver classesEfetivas). Mesmo array enquanto não mudar. */
let classesCache: { c: Classe[] | undefined; v: string[] | undefined; b: Base | null; r: Classe[] } | null = null;
export function classes(): Classe[] {
  const p = lerPlano();
  const b = baseOk();
  const m = classesCache;
  if (m && m.c === p.classes && m.v === p.classesVistas && m.b === b) return m.r;
  const r = pl.classesEfetivas(p, b);
  classesCache = { c: p.classes, v: p.classesVistas, b, r };
  return r;
}
/** Grava as classes do plano lembrando quais a base tem agora: as que ela ganhar depois aparecem sozinhas no fim. */
function gravarClasses(p: Plano, classes: Classe[], unidades = p.unidades): void {
  const vistas = pl.classesVistasAgora(p, baseOk());
  gravarPlano({ ...p, classes, ...(vistas ? { classesVistas: vistas } : {}), unidades });
}
/** As linhas da franquia que valem agora. Mesmo array enquanto não mudar. */
// a mistura das linhas da base com as do plano, por franquia: refeita só quando um dos três muda
const linhasCache = new Map<string, { s: LinhaSalva[] | undefined; a: string[] | undefined; b: LinhaEvo[] | undefined; r: LinhaEvo[] }>();
const SEM_LINHAS: LinhaEvo[] = [];
export function linhasDe(k: string): LinhaEvo[] {
  const p = lerPlano();
  const s = p.linhas[k];
  const a = p.apagadas?.[k];
  const b = baseOk()?.linhas[k];
  const c = linhasCache.get(k);
  if (c && c.s === s && c.a === a && c.b === b) return c.r;
  const r = pl.mesclarLinhas(b ?? SEM_LINHAS, s ?? [], a ?? []);
  linhasCache.set(k, { s, a, b, r });
  return r;
}
/** O usuário mudou alguma linha da franquia (mexeu, criou ou apagou; confirmar não conta)? */
export const linhasMexidas = (k: string): boolean => {
  const p = lerPlano();
  return pl.linhasMudadas(p.linhas[k] ?? [], p.apagadas?.[k] ?? [], baseOk()?.linhas[k] ?? SEM_LINHAS);
};
/** A linha existe na base (dá pra voltar pra ela)? */
export const linhaNaBase = (k: string, id: string): boolean => !!baseOk()?.linhas[k]?.some(l => l.id === id);
// sem protótipo, como as do plano: unidades["constructor"] não acha nada herdado
const SEM_UNIDADES: Unidades = Object.freeze(Object.create(null) as Unidades);
/** Classes e habilidade de cada personagem da franquia. Mesmo objeto enquanto não mudar. */
export const unidadesDe = (k: string): Unidades => lerPlano().unidades[k] ?? SEM_UNIDADES;

/** Grava o que o plano guarda das linhas da franquia (lista vazia e apagadas vazias saem). */
function gravarLinhas(k: string, salvas: LinhaSalva[], apag: string[]): void {
  const p = lerPlano();
  const linhas = { ...p.linhas };
  const apagadas = { ...p.apagadas };
  if (salvas.length) linhas[k] = salvas;
  else delete linhas[k];
  if (apag.length) apagadas[k] = apag;
  else delete apagadas[k];
  const { apagadas: _, ...resto } = p;
  gravarPlano({ ...resto, linhas, ...(Object.keys(apagadas).length ? { apagadas } : {}) });
}
/**
 * Muda as linhas da franquia, linha por linha: `fn` recebe as que valem e devolve as novas (mesmo array = nada muda).
 * `mexidas`: as linhas que o usuário mudou de verdade (nome, membros, níveis); essas passam a valer como estão, sem
 * seguir a base. Das outras linhas da base só a confirmação vai pro plano; linha da base que sumiu foi apagada.
 */
export function editarLinhas(k: string, fn: (l: LinhaEvo[]) => LinhaEvo[], mexidas: readonly string[] = []): void {
  const antes = linhasDe(k);
  const depois = fn(antes);
  if (depois === antes) return;
  const b = baseOk();
  const g = pl.guardarLinhas(depois, b?.linhas[k] ?? SEM_LINHAS, new Set(mexidas));
  // sem base não dá pra saber o que foi apagado: fica o que estava
  gravarLinhas(k, g.salvas, b ? g.apagadas : lerPlano().apagadas?.[k] ?? []);
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
  if (!(k in p.linhas) && !p.apagadas?.[k]) return;
  // as confirmações das linhas da base ficam
  const naBase = new Set((baseOk()?.linhas[k] ?? SEM_LINHAS).map(l => l.id));
  gravarLinhas(k, (p.linhas[k] ?? []).filter(s => s.confirmada && naBase.has(s.id)).map(s => ({ id: s.id, confirmada: true })), []);
}
/** Joga fora as mudanças numa linha da base (nome, membros, níveis): ela volta a seguir a base; a confirmação fica. */
export function voltarLinhaDaBase(k: string, id: string): void {
  const p = lerPlano();
  const salvas = p.linhas[k] ?? [];
  const s = salvas.find(x => x.id === id);
  if (!s || !linhaNaBase(k, id)) return;
  gravarLinhas(k, salvas.flatMap(x => (x !== s ? [x] : x.confirmada ? [{ id, confirmada: true }] : [])), p.apagadas?.[k] ?? []);
}

/**
 * Muda a lista de classes; na primeira vez, copia as da base pro plano. A ult padrão igual à da base não é copiada:
 * a classe segue a base (e o rascunho novo dela aparece sozinho).
 */
export function editarClasses(fn: (c: Classe[]) => Classe[]): void {
  const antes = classes();
  const depois = fn(antes);
  if (depois === antes) return;
  const b = baseOk();
  gravarClasses(lerPlano(), depois.map(c => {
    if (c.ult === undefined || c.ult !== b?.classes.find(x => x.id === c.id)?.ult) return c;
    const { ult: _, ...resto } = c;
    return resto;
  }));
}
/** A ult padrão que vale na classe (ver ultDaClasse). */
export const ultDaClasse = (c: Classe): string => pl.ultDaClasse(c, baseOk());
/** Muda a ult padrão da classe (igual à da base = volta a seguir a base). */
export const mudarUltDaClasse = (id: string, ult: string) =>
  editarClasses(cs => pl.mudarUltDaClasse(cs, id, ult, baseOk()?.classes.find(c => c.id === id)?.ult));
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
  gravarClasses(p, classes().filter(c => c.id !== id), pl.tirarClasseDeTodos(p.unidades, id));
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
/** Os rascunhos de habilidade que a base dá na franquia: nome -> texto. */
export const habilidadesBase = (k: string): Readonly<Record<string, string>> => baseOk()?.habilidades?.[k] ?? SEM_ULTS;
/** A habilidade do personagem que vale agora: a do plano, senão a da base. */
export const habilidadeDe = (k: string, nome: string): string => pl.habilidadeEfetiva(lerPlano().unidades[k]?.[nome], habilidadesBase(k)[nome]);
/** Habilidade do personagem. Texto vazio, ou igual ao da base, apaga a do plano (volta a valer a da base). */
export function mudarHabilidade(k: string, nome: string, habilidade: string): void {
  const p = lerPlano();
  const t = habilidade.trim() && habilidade.trim() !== (habilidadesBase(k)[nome] ?? '').trim() ? habilidade : '';
  if ((p.unidades[k]?.[nome]?.habilidade ?? '') === t) return;
  gravarPlano({ ...p, unidades: pl.mudarUnidade(p.unidades, k, nome, { habilidade: t }) });
}
/**
 * Custo do personagem na loja (1 a 5; undefined tira). Numa linha vale o da 1ª forma: `outros` são as alternativas
 * do nível 1, que perdem o custo delas (a linha tem um só).
 */
export function mudarCusto(k: string, nome: string, custo: number | undefined, outros: readonly string[] = []): void {
  const p = lerPlano();
  const us = p.unidades[k];
  if (us?.[nome]?.custo === custo && outros.every(n => !us?.[n]?.custo)) return;
  let unidades = pl.mudarUnidade(p.unidades, k, nome, { custo });
  for (const n of outros) if (unidades[k]?.[n]?.custo) unidades = pl.mudarUnidade(unidades, k, n, { custo: undefined });
  gravarPlano({ ...p, unidades });
}
/** Restaura o plano de um set1.json (ver restaurarPlano). Espera a base, pra saber o que é igual a ela. */
export async function importarPlano(arq: Plano, validas: readonly string[]): Promise<void> {
  const b = await pedirBase();
  gravarPlano(pl.restaurarPlano(lerPlano(), arq, b, validas));
}
/** O plano completo pro set1.json (classes e linhas que valem agora, das franquias `ks`). */
export const planoParaExportar = (ks: readonly string[]): Plano => pl.planoCompleto(lerPlano(), baseOk(), ks);
/** As linhas que valem em cada franquia de `ks` (pro set1.json). */
export const linhasParaExportar = (ks: readonly string[]): Record<string, LinhaEvo[]> => Object.fromEntries(ks.map(k => [k, linhasDe(k)]).filter(([, l]) => l!.length));

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
/** Subaba aberta no lugar da franquia: Classes ou Custos ('' = a franquia). */
let painel: '' | 'classes' | 'custos' = '';
let soPendentes = false;
let foco: { k: string; id: string } | null = null;

/** Franquia escolhida ('' = nenhuma ainda: a aba usa a primeira). */
export const franquiaAtual = () => atual;
export function escolherFranquia(k: string): void {
  if (k === atual && !painel) return;
  atual = k;
  painel = '';
  quantos = PAGINA;
  mudou();
}
/** A subaba Classes (o painel de todas as classes) está aberta? */
export const classesAbertas = () => painel === 'classes';
export function abrirClasses(): void {
  painel = 'classes';
  mudou();
}
/** A subaba Custos (quantos campeões em cada custo, no total e por origem) está aberta? */
export const custosAbertos = () => painel === 'custos';
export function abrirCustos(): void {
  painel = 'custos';
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
  painel = '';
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
