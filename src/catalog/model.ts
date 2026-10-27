// Catálogo do Set 1 (planejamento do modo estilo TFT): lógica pura, sem React nem localStorage.
// Junta a lista de personagens do site com as informações que a fonte tem de cada um (public/catalogo/<chave>.json,
// gerado pelo catalogo.mjs), filtra, conta os valores de cada campo e monta/lê o arquivo exportado (set1.json).
import type { Item } from '../types';
import { limparPlano, type ExtrasExportados, type LinhaExportada, type Plano } from './plano';

/** Valor de um campo: texto, número ou lista de textos (ex.: os dois tipos de um Pokémon). */
export type Valor = string | number | string[];
/** Informações de um personagem: id do campo -> valor. Campo sem informação fica de fora. */
export type Info = Record<string, Valor>;
export interface Campo { id: string; rotulo: string }
export interface Catalogo {
  chave: string;
  /** de onde vêm as informações ("PokeAPI (GraphQL)") */
  fonte: string;
  /** AAAA-MM-DD */
  geradoEm: string;
  campos: Campo[];
  /** nome exatamente como o site mostra -> informações */
  itens: Map<string, Info>;
  /** imagem pra quem vem sem imagem na lista do site */
  imagens: Map<string, string>;
}
/** Marcações: chave da franquia -> nomes marcados (na ordem em que foram marcados). */
export type Marcas = Record<string, string[]>;

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown) => (typeof x === 'string' ? x : '');

/** Valor válido do arquivo, ou undefined (texto vazio, lista vazia, número infinito e outros tipos não contam). */
function valor(v: unknown): Valor | undefined {
  if (typeof v === 'string') return v.trim() ? v : undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (Array.isArray(v)) {
    const l = v.filter((x): x is string => typeof x === 'string' && !!x.trim());
    return l.length ? l : undefined;
  }
  return undefined;
}

/**
 * Lê o JSON de public/catalogo/<chave>.json. Sem `campos` ou `itens` -> null (arquivo inválido).
 * Campo não declarado em `campos` e valor de tipo errado são ignorados, sem derrubar o resto.
 */
export function parseCatalogo(j: unknown): Catalogo | null {
  if (!isObj(j) || !Array.isArray(j.campos) || !isObj(j.itens)) return null;
  const campos: Campo[] = [];
  for (const c of j.campos) {
    if (isObj(c) && typeof c.id === 'string' && c.id && !campos.some(x => x.id === c.id)) campos.push({ id: c.id, rotulo: str(c.rotulo) || c.id });
  }
  const ids = new Set(campos.map(c => c.id));
  const itens = new Map<string, Info>();
  for (const [nome, info] of Object.entries(j.itens)) {
    if (!isObj(info)) continue;
    const i: Info = {};
    for (const [c, v] of Object.entries(info)) {
      const ok = ids.has(c) ? valor(v) : undefined;
      if (ok !== undefined) i[c] = ok;
    }
    itens.set(nome, i);
  }
  const imagens = new Map<string, string>();
  if (isObj(j.imagens)) for (const [nome, url] of Object.entries(j.imagens)) if (typeof url === 'string' && url) imagens.set(nome, url);
  return { chave: str(j.chave), fonte: str(j.fonte), geradoEm: str(j.geradoEm), campos, itens, imagens };
}

/** Os valores de um campo como textos (número vira texto, lista fica lista, ausente vira []). */
export function valores(v: Valor | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [String(v)];
}

/** Valor pra mostrar: lista separada por vírgula. */
export const mostrar = (v: Valor) => valores(v).join(', ');

/** "Tipo: Fire, Flying · Geração: I", na ordem dos campos; só os que o personagem tem. */
export function resumoInfo(campos: Campo[], info: Info | null | undefined): string {
  if (!info) return '';
  return campos.filter(c => info[c.id] !== undefined).map(c => `${c.rotulo}: ${mostrar(info[c.id]!)}`).join(' · ');
}

// ---------- ordem dos valores ----------
const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
// romanos de 1 a 39 (gerações, jogos de Final Fantasy): "IX" antes de "X", "FF IV" antes de "FF IX"
const ROMANO = /^(X{0,3})(IX|IV|V?I{0,3})$/;
const ROM: Record<string, number> = { I: 1, V: 5, X: 10 };
function romano(s: string): number | null {
  if (!s || !ROMANO.test(s)) return null;
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const v = ROM[s[i]!]!, w = ROM[s[i + 1] ?? ''] ?? 0;
    n += v < w ? -v : v;
  }
  return n;
}
/** Ordem "natural": números pelo valor ("2" antes de "10"), algarismos romanos pelo valor, o resto alfabético. */
export function compararNatural(a: string, b: string): number {
  const ta = a.split(/\s+/), tb = b.split(/\s+/);
  for (let i = 0; i < Math.min(ta.length, tb.length); i++) {
    const x = ta[i]!, y = tb[i]!;
    const rx = romano(x), ry = romano(y);
    const d = rx !== null && ry !== null ? rx - ry : collator.compare(x, y);
    if (d) return d;
  }
  return ta.length - tb.length || collator.compare(a, b);
}

// ---------- linhas e filtros ----------
/** Um personagem da lista do site, com as informações da fonte (se houver). */
export interface Linha {
  nome: string;
  /** o item da lista do site (o Digimon sem imagem é completado nele pelo resolve) */
  item: Item;
  /** null = a fonte não tem esse personagem (ou a franquia não tem catálogo) */
  info: Info | null;
  /** imagem do catálogo, pra quem vem sem imagem na lista */
  imgFonte: string;
  /** nome e valores normalizados, pra busca */
  busca: string;
}

/** Minúsculas e sem acento ("Pokémon" -> "pokemon"). */
export const normalizar = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Junta a lista do site com o catálogo pelo nome exato. Personagem que só existe no catálogo fica de fora. */
export function montarLinhas(lista: readonly Item[], cat: Catalogo | null): Linha[] {
  return lista.map(item => {
    const info = cat?.itens.get(item.name) ?? null;
    const vals = info ? Object.values(info).flatMap(valores) : [];
    return { nome: item.name, item, info, imgFonte: cat?.imagens.get(item.name) ?? '', busca: normalizar([item.name, ...vals].join('\n')) };
  });
}

/** Valor do filtro de campo que pega quem não tem informação nesse campo (e, no filtro de classe, quem não tem classe). */
export const SEM = '__sem__';
/** Filtro de linha evolutiva: com linha, sem linha, linha confirmada, linha ainda não confirmada. */
export type FiltroLinha = '' | 'com' | 'sem' | 'confirmada' | 'pendente';
/** Filtro de ult: com forma de ult, sem. */
export type FiltroUlt = '' | 'com' | 'sem';
export interface Filtros {
  /** busca no nome, nos valores, na habilidade e nas classes */
  q: string;
  /** id do campo -> valor escolhido ('' ou ausente = todos; SEM = sem informação) */
  campos: Record<string, string>;
  /** id da classe do plano ('' = todas; SEM = sem classe) */
  classe: string;
  linha: FiltroLinha;
  ult: FiltroUlt;
}
export const filtrosVazios = (): Filtros => ({ q: '', campos: {}, classe: '', linha: '', ult: '' });
export const temFiltro = (f: Filtros) => !!f.q.trim() || !!f.classe || !!f.linha || !!f.ult || Object.values(f.campos).some(Boolean);

/** O que o filtro precisa saber de fora da lista: o grupo e o planejamento de cada personagem. */
export interface Contexto {
  /** quem está no grupo escolhido (Set 1 base ou marcados); null = todos */
  grupo: ReadonlySet<string> | null;
  /** ids das classes do personagem */
  classes?: (nome: string) => readonly string[] | undefined;
  /** a linha do personagem (undefined = sem linha) */
  linha?: (nome: string) => { confirmada?: boolean } | undefined;
  /** a forma da ult do personagem ('' ou undefined = sem) */
  ult?: (nome: string) => string | undefined;
  /** texto a mais pra busca (habilidade, nomes das classes, ult), já normalizado */
  texto?: (nome: string) => string;
}
/** Sem grupo nem planejamento. */
export const TODOS: Contexto = { grupo: null };
/** Ids pro `ignorar` do filtrar: deixam de fora o filtro de classe ou o de linha (pra contar as opções deles). */
export const F_CLASSE = '#classe';
export const F_LINHA = '#linha';
export const F_ULT = '#ult';

/** O personagem tem esse valor no campo (campo com lista: qualquer um dos valores serve). */
function casaCampo(l: Linha, id: string, v: string): boolean {
  const vs = valores(l.info?.[id]);
  return v === SEM ? vs.length === 0 : vs.includes(v);
}
function casaClasse(cs: readonly string[] | undefined, v: string): boolean {
  return v === SEM ? !cs?.length : !!cs?.includes(v);
}
function casaLinha(pos: { confirmada?: boolean } | undefined, v: FiltroLinha): boolean {
  if (v === 'com') return !!pos;
  if (v === 'sem') return !pos;
  if (v === 'confirmada') return !!pos?.confirmada;
  if (v === 'pendente') return !!pos && !pos.confirmada;
  return true;
}

/**
 * Personagens que passam em todos os filtros (grupo E busca E cada campo E classe E linha), na ordem da lista.
 * `ignorar` deixa um campo de fora (ou F_CLASSE, F_LINHA), pra contar as opções dele.
 */
export function filtrar(linhas: readonly Linha[], f: Filtros, ctx: Contexto, ignorar?: string): Linha[] {
  const termos = normalizar(f.q).split(/\s+/).filter(Boolean);
  const campos = Object.entries(f.campos).filter(([id, v]) => v && id !== ignorar);
  const classe = ignorar === F_CLASSE ? '' : f.classe;
  const linha = ignorar === F_LINHA ? '' : f.linha;
  const ult = ignorar === F_ULT ? '' : f.ult;
  return linhas.filter(l => {
    if (ctx.grupo && !ctx.grupo.has(l.nome)) return false;
    if (termos.length) {
      const extra = ctx.texto?.(l.nome) ?? '';
      if (!termos.every(t => l.busca.includes(t) || extra.includes(t))) return false;
    }
    return campos.every(([id, v]) => casaCampo(l, id, v))
      && (!classe || casaClasse(ctx.classes?.(l.nome), classe))
      && (!linha || casaLinha(ctx.linha?.(l.nome), linha))
      && (!ult || (ult === 'com') === !!ctx.ult?.(l.nome));
  });
}

export interface Opcao { valor: string; n: number }

/** Quantos valores diferentes o campo tem na franquia inteira e quantos personagens têm o campo. */
export function distintos(linhas: readonly Linha[], id: string): { valores: number; com: number } {
  const s = new Set<string>();
  let com = 0;
  for (const l of linhas) {
    const vs = valores(l.info?.[id]);
    if (vs.length) com++;
    for (const v of vs) s.add(v);
  }
  return { valores: s.size, com };
}

/** Acima disso o seletor fica comprido demais (o Arquétipo do Yu-Gi-Oh! tem uns 450 e ainda vale). */
export const MAX_OPCOES = 500;
/**
 * O campo ganha seletor? Não quando tem valores demais ou quando quase cada personagem tem um valor só seu
 * (número da Sujidex, local do Final Fantasy, usuário do Stand): aí filtrar não agrupa nada, e a busca acha.
 */
export function filtravel(linhas: readonly Linha[], id: string): boolean {
  const d = distintos(linhas, id);
  return d.valores > 0 && d.valores <= MAX_OPCOES && (d.valores <= 30 || d.valores < 0.9 * d.com);
}

/**
 * Opções do filtro de um campo: cada valor com quantos personagens o têm entre os que passam nos OUTROS filtros
 * (a contagem acompanha a busca e os outros campos). Valor sem ninguém some, menos o escolhido. "Sem informação"
 * (SEM) vem por último, se houver alguém sem esse campo.
 */
export function opcoes(linhas: readonly Linha[], id: string, f: Filtros, ctx: Contexto): Opcao[] {
  const conta = new Map<string, number>();
  let sem = 0;
  for (const l of filtrar(linhas, f, ctx, id)) {
    const vs = new Set(valores(l.info?.[id]));
    if (!vs.size) sem++;
    for (const v of vs) conta.set(v, (conta.get(v) ?? 0) + 1);
  }
  const atual = f.campos[id];
  if (atual && atual !== SEM && !conta.has(atual)) conta.set(atual, 0);
  const l = [...conta].map(([valor, n]) => ({ valor, n })).sort((a, b) => compararNatural(a.valor, b.valor));
  if (sem || atual === SEM) l.push({ valor: SEM, n: sem });
  return l;
}

/**
 * Opções do filtro de classe: toda classe (na ordem dada, mesmo sem ninguém) com quantos a têm entre os que passam
 * nos outros filtros, e "sem classe" (SEM) no fim.
 */
export function opcoesClasse(linhas: readonly Linha[], ids: readonly string[], f: Filtros, ctx: Contexto): Opcao[] {
  const conta = new Map(ids.map(id => [id, 0]));
  let sem = 0;
  for (const l of filtrar(linhas, f, ctx, F_CLASSE)) {
    const cs = ctx.classes?.(l.nome)?.filter(c => conta.has(c));
    if (!cs?.length) sem++;
    else for (const c of new Set(cs)) conta.set(c, conta.get(c)! + 1);
  }
  return [...[...conta].map(([valor, n]) => ({ valor, n })), { valor: SEM, n: sem }];
}

/** Opções do filtro de linha, cada uma com quantos passam nos outros filtros. */
export function opcoesLinha(linhas: readonly Linha[], f: Filtros, ctx: Contexto): { valor: Exclude<FiltroLinha, ''>; n: number }[] {
  const n = { com: 0, sem: 0, confirmada: 0, pendente: 0 };
  for (const l of filtrar(linhas, f, ctx, F_LINHA)) {
    const pos = ctx.linha?.(l.nome);
    if (!pos) n.sem++;
    else {
      n.com++;
      if (pos.confirmada) n.confirmada++;
      else n.pendente++;
    }
  }
  return (['com', 'sem', 'confirmada', 'pendente'] as const).map(valor => ({ valor, n: n[valor] }));
}

/** Opções do filtro de ult (com, sem), cada uma com quantos passam nos outros filtros. */
export function opcoesUlt(linhas: readonly Linha[], f: Filtros, ctx: Contexto): { valor: Exclude<FiltroUlt, ''>; n: number }[] {
  let com = 0;
  const l = filtrar(linhas, f, ctx, F_ULT);
  for (const x of l) if (ctx.ult?.(x.nome)) com++;
  return [{ valor: 'com', n: com }, { valor: 'sem', n: l.length - com }];
}

// ---------- marcações ----------
/** Limpa o que veio do localStorage: só listas de textos, sem repetidos e sem franquia vazia. */
export function limparMarcas(j: unknown): Marcas {
  const m: Marcas = {};
  if (!isObj(j)) return m;
  for (const [k, v] of Object.entries(j)) {
    if (!Array.isArray(v)) continue;
    const nomes = [...new Set(v.filter((x): x is string => typeof x === 'string' && !!x))];
    if (nomes.length) m[k] = nomes;
  }
  return m;
}

/** Soma as marcações novas às atuais (as atuais ficam na frente). Devolve também quantas eram novas. */
export function juntarMarcas(atual: Marcas, novas: Marcas): { marcas: Marcas; novas: number } {
  const m: Marcas = { ...atual };
  let n = 0;
  for (const [k, nomes] of Object.entries(novas)) {
    const s = new Set(m[k] ?? []);
    const antes = s.size;
    nomes.forEach(x => s.add(x));
    n += s.size - antes;
    if (s.size) m[k] = [...s];
  }
  return { marcas: m, novas: n };
}

// ---------- exportar e importar ----------
export interface PersonagemExportado {
  nome: string;
  img: string;
  /** do planejamento: nomes das classes, habilidade, linha evolutiva e forma da ult */
  classes?: string[];
  habilidade?: string;
  linha?: LinhaExportada;
  ult?: string;
  [campo: string]: Valor | LinhaExportada | undefined;
}
export interface FranquiaExportada {
  rotulo: string;
  /** null = a franquia não tem catálogo (só nome e imagem) */
  fonte: string | null;
  /** os campos das informações, pra saber o rótulo de cada id */
  campos: Campo[];
  personagens: PersonagemExportado[];
}
export interface Exportacao {
  geradoEm: string;
  /** quem foi exportado: os marcados ou o grupo "Set 1 (base)" (importar este não marca ninguém) */
  grupo?: 'marcados' | 'base';
  franquias: Record<string, FranquiaExportada>;
  /** o planejamento inteiro (classes, unidades e linhas), pra Importar restaurar */
  plano?: Plano;
}
/** O planejamento na exportação: os campos a mais de cada personagem e o plano inteiro. */
export interface PlanoNaExportacao {
  grupo: 'marcados' | 'base';
  extras: (k: string, nome: string) => ExtrasExportados;
  plano: Plano;
}
/** Campos da exportação que não vêm da fonte: informação da fonte com o mesmo id não entra. */
const RESERVADOS = new Set(['nome', 'img', 'classes', 'habilidade', 'linha', 'ult']);

/**
 * Monta o set1.json: só as franquias com alguém marcado, na ordem `ordem`; personagens na ordem da lista do site
 * (marcado que não está na lista vai pro fim, na ordem das marcações). Imagem: a da lista, senão a do catálogo.
 * Com `plano`, cada personagem ganha classes, habilidade e linha, e o arquivo leva o plano inteiro.
 */
export function montarExportacao(p: {
  /** quem exportar: as marcações (ou o grupo base) */
  marcas: Marcas;
  ordem: readonly string[];
  listas: Record<string, readonly Item[] | null | undefined>;
  catalogos: Record<string, Catalogo | null | undefined>;
  rotulo: (k: string) => string;
  geradoEm: string;
  plano?: PlanoNaExportacao;
}): Exportacao {
  const franquias: Record<string, FranquiaExportada> = {};
  for (const k of p.ordem) {
    const nomes = p.marcas[k];
    if (!nomes?.length) continue;
    const cat = p.catalogos[k] ?? null;
    const lista = p.listas[k] ?? [];
    const pos = new Map(lista.map((it, i) => [it.name, i]));
    const ordenados = [...nomes].sort((a, b) => (pos.get(a) ?? Infinity) - (pos.get(b) ?? Infinity));
    const itens = new Map(lista.map(it => [it.name, it]));
    franquias[k] = {
      rotulo: p.rotulo(k),
      fonte: cat ? cat.fonte : null,
      campos: cat ? cat.campos : [],
      personagens: ordenados.map(nome => {
        const info = cat?.itens.get(nome) ?? {};
        const extra = Object.fromEntries(Object.entries(info).filter(([c]) => !RESERVADOS.has(c)));
        return { nome, img: itens.get(nome)?.img || cat?.imagens.get(nome) || '', ...extra, ...p.plano?.extras(k, nome) };
      }),
    };
  }
  if (!p.plano) return { geradoEm: p.geradoEm, franquias };
  return { geradoEm: p.geradoEm, grupo: p.plano.grupo, franquias, plano: p.plano.plano };
}

/**
 * Lê um arquivo importado: o set1.json exportado ({ franquias: { chave: { personagens: [{ nome }] } } }) ou as
 * marcações cruas ({ chave: [nomes] }). Franquia fora de `validas` é ignorada (e listada). Formato estranho -> null.
 * `plano` = o planejamento do arquivo (arquivo antigo não tem). O set1.json do grupo base (grupo: "base") não marca
 * ninguém: só traz o plano.
 */
export function lerImportacao(j: unknown, validas: readonly string[]): { marcas: Marcas; ignoradas: string[]; plano: Plano | null } | null {
  if (!isObj(j)) return null;
  const bruto: Record<string, unknown> = {};
  const plano = isObj(j.plano) ? limparPlano(j.plano) : null;
  if (isObj(j.franquias) && j.grupo === 'base') {
    return { marcas: {}, ignoradas: Object.keys(j.franquias).filter(k => !validas.includes(k)), plano };
  }
  if (isObj(j.franquias)) {
    for (const [k, fr] of Object.entries(j.franquias)) {
      const ps = isObj(fr) ? fr.personagens : undefined;
      if (Array.isArray(ps)) bruto[k] = ps.map(x => (typeof x === 'string' ? x : isObj(x) ? x.nome : undefined));
    }
  } else if (Object.values(j).every(Array.isArray)) {
    Object.assign(bruto, j);
  } else return null;
  const todas = limparMarcas(bruto);
  const marcas: Marcas = {};
  const ignoradas: string[] = [];
  for (const [k, v] of Object.entries(todas)) {
    if (validas.includes(k)) marcas[k] = v;
    else ignoradas.push(k);
  }
  return { marcas, ignoradas, plano };
}
