// Planejamento do Set 1 do modo estilo TFT: classes, habilidade de cada personagem e linhas evolutivas. Lógica pura,
// sem React nem localStorage. O ponto de partida é public/catalogo/set1-base.json (a "base": classes, o grupo
// "Set 1 (base)" e as linhas propostas); o que o usuário muda fica no plano (pdx-set1-plano). As classes só entram no
// plano quando o usuário mexe nelas; as linhas, uma por uma (ver mesclarLinhas): até lá vale a base, e uma base nova
// aparece sozinha. (sem importar nada do model.ts: ele importa daqui)

export interface Classe { id: string; nome: string; descricao?: string }
/** O que o plano guarda de um personagem. */
export interface Unidade {
  /** ids das classes */
  classes?: string[];
  habilidade?: string;
  /**
   * Forma em que a unidade vira na ult (nome de outro personagem da franquia, ex.: "Mega Venusaur"); não é uma
   * unidade à parte. Ausente = a da base; '' = sem ult, mesmo que a base tenha uma.
   */
  ult?: string;
}
/** nome do personagem -> unidade */
export type Unidades = Record<string, Unidade>;
/**
 * Linha evolutiva: niveis[i] = quem fica no nível i + 1. Mais de um no mesmo nível = alternativas (Gardevoir ou
 * Gallade). Nunca tem nível vazio; um personagem fica em uma linha só por franquia.
 */
export interface LinhaEvo {
  id: string;
  nome: string;
  niveis: string[][];
  /**
   * Quem vem de quem: nome -> alguém do nível anterior (pra quando ele tem alternativas: Loup-garou vira Moloch,
   * Siegfried vira Fionn). Quem não está aqui vem de qualquer um do nível anterior.
   */
  de?: Record<string, string>;
  confirmada?: boolean;
  /** na lista que vale: a linha é a do plano (o usuário mexeu nela ou a criou), não a da base */
  editada?: boolean;
}
/**
 * Como o plano guarda uma linha. Linha da base que o usuário só confirmou: { id, confirmada } (nome e níveis seguem a
 * base). Linha da base que ele mexeu (nome, membros, níveis) ou que ele criou: inteira, com editada. Formato antigo
 * (a lista inteira copiada, sem editada): nas linhas da base só a confirmação vale; as outras são do usuário.
 */
export interface LinhaSalva { id: string; nome?: string; niveis?: string[][]; de?: Record<string, string>; confirmada?: boolean; editada?: boolean }
export interface Plano {
  versao: 1;
  /** ausente = as classes da base */
  classes?: Classe[];
  /**
   * ids das classes que a base tinha quando o plano gravou as classes dele. Classe da base fora desta lista e fora de
   * `classes` é nova e aparece no fim; a que está aqui e não em `classes` foi removida; a que está aqui e saiu da base
   * foi tirada da base e sai do plano também. Ausente = CLASSES_ANTIGAS.
   */
  classesVistas?: string[];
  /** chave da franquia -> nome -> unidade */
  unidades: Record<string, Unidades>;
  /** chave da franquia -> o que o usuário fez nas linhas (por linha; o resto segue a base) */
  linhas: Record<string, LinhaSalva[]>;
  /** chave da franquia -> ids das linhas da base que o usuário apagou */
  apagadas?: Record<string, string[]>;
}
/** public/catalogo/set1-base.json. Chaves que este código não conhece (ex.: itens) são ignoradas. */
export interface Base {
  versao: number;
  geradoEm: string;
  classes: Classe[];
  /** chave da franquia -> nomes do grupo "Set 1 (base)" */
  selecao: Record<string, string[]>;
  linhas: Record<string, LinhaEvo[]>;
  /** chave da franquia -> nome da unidade -> forma da ult */
  ults: Record<string, Record<string, string>>;
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const texto = (x: unknown) => (typeof x === 'string' ? x.trim() : '');
const textos = (x: unknown): string[] => (Array.isArray(x) ? [...new Set(x.filter((s): s is string => typeof s === 'string' && !!s))] : []);
/** Dicionário sem protótipo: nome de personagem como "constructor" não esbarra em nada. */
const dic = <T>(): Record<string, T> => Object.create(null) as Record<string, T>;
/** Minúsculas e sem acento (o mesmo do model.ts). */
const normalizar = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** "Criaturinha Bizarra" -> "criaturinha-bizarra" (sem acento; vazio vira "x"). */
export function slug(s: string): string {
  return normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
}
/** `base`, `base-2`, `base-3`... o primeiro que não está em uso. */
export function idUnico(base: string, usados: ReadonlySet<string>): string {
  if (!usados.has(base)) return base;
  let i = 2;
  while (usados.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

// ---------- leitura (base, localStorage, arquivo importado) ----------
/** Classes válidas: id e nome em texto, id sem repetir. Nome vazio vira o id; descrição vazia some. */
export function limparClasses(j: unknown): Classe[] {
  const r: Classe[] = [];
  if (!Array.isArray(j)) return r;
  for (const c of j) {
    if (!isObj(c)) continue;
    const id = texto(c.id);
    if (!id || r.some(x => x.id === id)) continue;
    const descricao = texto(c.descricao);
    r.push({ id, nome: texto(c.nome) || id, ...(descricao ? { descricao } : {}) });
  }
  return r;
}

/** Os pares de `de` que valem nestes níveis (quem está do nível 2 em diante, vindo de alguém do nível anterior), ou undefined. */
function deValido(de: unknown, niveis: readonly (readonly string[])[]): Record<string, string> | undefined {
  if (!isObj(de)) return undefined;
  const nivel = new Map<string, number>();
  niveis.forEach((n, i) => n.forEach(x => nivel.set(x, i)));
  const r = dic<string>();
  for (const [filho, pai] of Object.entries(de)) {
    const i = nivel.get(filho);
    if (typeof pai === 'string' && i && niveis[i - 1]!.includes(pai)) r[filho] = pai;
  }
  return Object.keys(r).length ? r : undefined;
}
/** A linha sem os pares de `de` que deixaram de valer (alguém mudou de nível ou saiu). Nada sobrando = o próprio objeto. */
function ajustarDe(l: LinhaEvo): LinhaEvo {
  if (!l.de) return l;
  const de = deValido(l.de, l.niveis);
  if (de && Object.keys(de).length === Object.keys(l.de).length) return l;
  const { de: _, ...resto } = l;
  return de ? { ...resto, de } : resto;
}
const comDe = (de: Record<string, string> | undefined) => (de ? { de } : {});

/**
 * Linhas válidas de uma franquia: níveis como listas de nomes, sem nível vazio, sem repetir personagem (fica na
 * primeira linha em que aparece) e com id único (gera um a partir do nome quando falta ou repete).
 */
export function limparLinhas(j: unknown, k = ''): LinhaEvo[] {
  const r: LinhaEvo[] = [];
  if (!Array.isArray(j)) return r;
  const vistos = new Set<string>();
  const ids = new Set<string>();
  for (const l of j) {
    if (!isObj(l) || !Array.isArray(l.niveis)) continue;
    const niveis: string[][] = [];
    for (const n of l.niveis) {
      const membros = textos(n).filter(x => !vistos.has(x));
      membros.forEach(x => vistos.add(x));
      if (membros.length) niveis.push(membros);
    }
    const nome = texto(l.nome) || niveis[0]?.[0] || 'Linha';
    let id = texto(l.id);
    if (!id || ids.has(id)) id = idUnico((k ? k + ':' : '') + slug(nome), ids);
    ids.add(id);
    r.push({ id, nome, niveis, ...comDe(deValido(l.de, niveis)), ...(l.confirmada === true ? { confirmada: true } : {}) });
  }
  return r;
}

/** Unidades válidas: classes como lista de textos, habilidade com algum texto; unidade e franquia vazias somem. */
export function limparUnidades(j: unknown): Record<string, Unidades> {
  const r: Record<string, Unidades> = {};
  if (!isObj(j)) return r;
  for (const [k, us] of Object.entries(j)) {
    if (!isObj(us)) continue;
    const fr = dic<Unidade>();
    for (const [nome, u] of Object.entries(us)) {
      if (!isObj(u) || !nome) continue;
      const limpa = unidadeLimpa({
        classes: textos(u.classes),
        habilidade: typeof u.habilidade === 'string' ? u.habilidade : '',
        ...(typeof u.ult === 'string' ? { ult: u.ult } : {}),
      });
      if (limpa) fr[nome] = limpa;
    }
    if (Object.keys(fr).length) r[k] = fr;
  }
  return r;
}

/** A unidade sem campos vazios, ou null se não sobrou nada. A habilidade fica como foi digitada. */
function unidadeLimpa(u: Unidade): Unidade | null {
  const out: Unidade = {};
  if (u.classes?.length) out.classes = [...new Set(u.classes)];
  if (u.habilidade?.trim()) out.habilidade = u.habilidade;
  // ult vazia também conta: é "sem ult" por cima da base
  if (typeof u.ult === 'string') out.ult = u.ult.trim();
  return out.classes || out.habilidade || out.ult !== undefined ? out : null;
}

/** Lê o set1-base.json. Não é objeto, ou não tem classes, seleção nem linhas -> null. */
export function parseBase(j: unknown): Base | null {
  if (!isObj(j) || !(Array.isArray(j.classes) || isObj(j.selecao) || isObj(j.linhas))) return null;
  const selecao: Record<string, string[]> = {};
  if (isObj(j.selecao)) {
    for (const [k, v] of Object.entries(j.selecao)) {
      const nomes = textos(v);
      if (nomes.length) selecao[k] = nomes;
    }
  }
  const linhas: Record<string, LinhaEvo[]> = {};
  if (isObj(j.linhas)) {
    for (const [k, v] of Object.entries(j.linhas)) {
      const l = limparLinhas(v, k);
      if (l.length) linhas[k] = l;
    }
  }
  const ults: Record<string, Record<string, string>> = {};
  if (isObj(j.ults)) {
    for (const [k, v] of Object.entries(j.ults)) {
      if (!isObj(v)) continue;
      const fr = dic<string>();
      for (const [nome, ult] of Object.entries(v)) if (nome && texto(ult)) fr[nome] = texto(ult);
      if (Object.keys(fr).length) ults[k] = fr;
    }
  }
  return {
    versao: typeof j.versao === 'number' ? j.versao : 1,
    geradoEm: texto(j.geradoEm),
    classes: limparClasses(j.classes),
    selecao,
    linhas,
    ults,
  };
}

export const planoVazio = (): Plano => ({ versao: 1, unidades: {}, linhas: {} });

/**
 * Linhas guardadas no plano: id (gerado do nome se faltar ou repetir), nome e níveis só se vierem (níveis sem nível
 * vazio nem nome repetido na mesma linha), confirmada e editada só quando true.
 */
export function limparSalvas(j: unknown, k = ''): LinhaSalva[] {
  const r: LinhaSalva[] = [];
  if (!Array.isArray(j)) return r;
  const ids = new Set<string>();
  for (const l of j) {
    if (!isObj(l)) continue;
    const niveis = Array.isArray(l.niveis) ? limparNiveis(l.niveis) : undefined;
    const nome = texto(l.nome);
    let id = texto(l.id);
    if (!id || ids.has(id)) {
      if (!niveis) continue;
      id = idUnico((k ? k + ':' : '') + slug(nome || niveis[0]?.[0] || 'linha'), ids);
    }
    ids.add(id);
    r.push({
      id,
      ...(nome ? { nome } : {}),
      ...(niveis ? { niveis, ...comDe(deValido(l.de, niveis)) } : {}),
      ...(l.confirmada === true ? { confirmada: true } : {}),
      ...(l.editada === true ? { editada: true } : {}),
    });
  }
  return r;
}
function limparNiveis(niveis: unknown[]): string[][] {
  const vistos = new Set<string>();
  const r: string[][] = [];
  for (const n of niveis) {
    const membros = textos(n).filter(x => !vistos.has(x));
    membros.forEach(x => vistos.add(x));
    if (membros.length) r.push(membros);
  }
  return r;
}

/** Lê o plano salvo (ou o "plano" de um set1.json), jogando fora o que não estiver no formato. */
export function limparPlano(j: unknown): Plano {
  const p = planoVazio();
  if (!isObj(j)) return p;
  if (Array.isArray(j.classes)) p.classes = limparClasses(j.classes);
  if (Array.isArray(j.classesVistas)) p.classesVistas = textos(j.classesVistas);
  p.unidades = limparUnidades(j.unidades);
  if (isObj(j.linhas)) for (const [k, v] of Object.entries(j.linhas)) if (Array.isArray(v)) p.linhas[k] = limparSalvas(v, k);
  if (isObj(j.apagadas)) {
    const apagadas: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(j.apagadas)) {
      const ids = textos(v);
      if (ids.length) apagadas[k] = ids;
    }
    if (Object.keys(apagadas).length) p.apagadas = apagadas;
  }
  return p;
}

// ---------- o que vale agora (plano por cima da base) ----------
const SEM_CLASSES: Classe[] = [];
const SEM_LINHAS: LinhaEvo[] = [];
/** As classes que a base tinha antes de ganhar Tanque, Porradeiro, Assassino e os elementos (27/10): as que um plano sem classesVistas já viu. */
const CLASSES_ANTIGAS = ['demoniacos', 'criaturinha-bizarra', 'fadinhas', 'safada', 'atirador', 'anjo', 'robo', 'dragao', 'temporais', 'unicos'];

/**
 * As classes que valem: as da base enquanto o plano não mexe nelas; depois, as do plano e, no fim, as que a base
 * ganhou desde então (ver classesVistas), sem as que a base tirou depois que o plano viu (Luz e Trevas, 28/10). Sem
 * mudança, devolve o próprio array.
 */
export function classesEfetivas(p: Plano, base: Base | null): Classe[] {
  if (!p.classes) return base?.classes ?? SEM_CLASSES;
  const daBase = new Set(base?.classes.map(c => c.id));
  const tiradas = base && p.classesVistas ? new Set(p.classesVistas.filter(id => !daBase.has(id))) : null;
  const ficam = tiradas?.size ? p.classes.filter(c => !tiradas.has(c.id)) : p.classes;
  const conhecidas = new Set([...p.classes.map(c => c.id), ...(p.classesVistas ?? CLASSES_ANTIGAS)]);
  const novas = base?.classes.filter(c => !conhecidas.has(c.id)) ?? [];
  return novas.length || ficam.length !== p.classes.length ? [...ficam, ...novas] : p.classes;
}
/** O que gravar em classesVistas junto com as classes do plano: os ids da base de agora (sem base, o que já estava). */
export const classesVistasAgora = (p: Plano, base: Base | null): string[] | undefined => (base ? base.classes.map(c => c.id) : p.classesVistas);

/**
 * As linhas que valem numa franquia: as da base, na ordem da base, tirando as apagadas; a linha da base que o usuário
 * mexeu (editada) vale inteira como está no plano, e as outras seguem a base (levando só a confirmação do plano). No
 * fim, as linhas que o usuário criou. Um personagem fica numa linha só: quem está numa linha do plano (mexida ou
 * criada) sai da linha da base em que também estaria. Sem nada guardado, devolve o próprio array da base.
 */
export function mesclarLinhas(base: readonly LinhaEvo[], salvas: readonly LinhaSalva[], apagadas: readonly string[] = []): LinhaEvo[] {
  if (!salvas.length && !apagadas.length) return base as LinhaEvo[];
  const porId = new Map(salvas.map(s => [s.id, s]));
  const naBase = new Set(base.map(l => l.id));
  const fora = new Set(apagadas);
  // primeiro as do plano (mexidas, na ordem da base; criadas, na ordem guardada): elas ficam com os personagens
  const vistos = new Set<string>();
  const inteira = (s: LinhaSalva, nomeBase?: string): LinhaEvo => {
    const niveis = (s.niveis ?? []).map(n => n.filter(x => !vistos.has(x))).filter(n => n.length);
    niveis.forEach(n => n.forEach(x => vistos.add(x)));
    return { id: s.id, nome: s.nome || nomeBase || niveis[0]?.[0] || 'Linha', niveis, ...comDe(deValido(s.de, niveis)), ...(s.confirmada ? { confirmada: true } : {}), editada: true };
  };
  const mexidas = new Map<string, LinhaEvo>();
  for (const b of base) {
    const s = porId.get(b.id);
    if (!fora.has(b.id) && s?.editada && s.niveis) mexidas.set(b.id, inteira(s, b.nome));
  }
  const criadas = salvas.filter(s => !naBase.has(s.id) && s.niveis).map(s => inteira(s));
  const r: LinhaEvo[] = [];
  for (const b of base) {
    if (fora.has(b.id)) continue;
    const m = mexidas.get(b.id);
    if (m) {
      r.push(m);
      continue;
    }
    const s = porId.get(b.id);
    const confirmada = s ? !!s.confirmada : !!b.confirmada;
    const niveis = b.niveis.map(n => n.filter(x => !vistos.has(x))).filter(n => n.length);
    r.push({ id: b.id, nome: b.nome, niveis, ...comDe(deValido(b.de, niveis)), ...(confirmada ? { confirmada: true } : {}) });
  }
  return [...r, ...criadas];
}

/** As linhas que valem na franquia (ver mesclarLinhas). */
export const linhasEfetivas = (p: Plano, base: Base | null, k: string): LinhaEvo[] =>
  mesclarLinhas(base?.linhas[k] ?? SEM_LINHAS, p.linhas[k] ?? [], p.apagadas?.[k] ?? []);

/**
 * O que guardar depois de uma mudança, a partir da lista que vale (`depois`): linha criada, linha já mexida e linha
 * em `mexidas` (a que o usuário acabou de mudar) vão inteiras, com editada; das outras linhas da base, só a
 * confirmação. A linha da base que sumiu da lista foi apagada.
 */
export function guardarLinhas(depois: readonly LinhaEvo[], base: readonly LinhaEvo[], mexidas: ReadonlySet<string> = new Set()): { salvas: LinhaSalva[]; apagadas: string[] } {
  const naBase = new Set(base.map(l => l.id));
  const salvas: LinhaSalva[] = [];
  for (const l of depois) {
    const conf = l.confirmada ? { confirmada: true } : {};
    if (!naBase.has(l.id) || l.editada || mexidas.has(l.id)) salvas.push({ id: l.id, nome: l.nome, niveis: l.niveis, ...comDe(l.de), ...conf, editada: true });
    else if (l.confirmada) salvas.push({ id: l.id, confirmada: true });
  }
  const ids = new Set(depois.map(l => l.id));
  return { salvas, apagadas: base.filter(b => !ids.has(b.id)).map(b => b.id) };
}

/**
 * Deixa o que está guardado no formato de agora, olhando a base: linha da base mexida fica inteira; não mexida (ou
 * do formato antigo) fica só com a confirmação, ou sai; linha fora da base fica se tiver níveis (é do usuário);
 * apagada que não existe mais na base sai.
 */
export function compactarLinhas(salvas: readonly LinhaSalva[], apagadas: readonly string[], base: readonly LinhaEvo[]): { salvas: LinhaSalva[]; apagadas: string[] } {
  const naBase = new Set(base.map(l => l.id));
  const r: LinhaSalva[] = [];
  for (const s of salvas) {
    const conf = s.confirmada ? { confirmada: true } : {};
    if (naBase.has(s.id)) {
      if (s.editada && s.niveis) r.push({ id: s.id, ...(s.nome ? { nome: s.nome } : {}), niveis: s.niveis, ...comDe(s.de), ...conf, editada: true });
      else if (s.confirmada) r.push({ id: s.id, confirmada: true });
    } else if (s.niveis) r.push({ id: s.id, nome: s.nome || s.niveis[0]?.[0] || 'Linha', niveis: s.niveis, ...comDe(s.de), ...conf, editada: true });
  }
  return { salvas: r, apagadas: apagadas.filter(id => naBase.has(id)) };
}

/** O usuário mudou alguma linha da franquia (mexeu, criou ou apagou)? Só confirmar não conta. */
export function linhasMudadas(salvas: readonly LinhaSalva[], apagadas: readonly string[], base: readonly LinhaEvo[]): boolean {
  const naBase = new Set(base.map(l => l.id));
  return apagadas.some(id => naBase.has(id)) || salvas.some(s => (naBase.has(s.id) ? !!s.editada && !!s.niveis : !!s.niveis));
}
/** A forma da ult que vale: a do plano (mesmo vazia: tirada), senão a da base. '' = sem ult. */
export const ultEfetiva = (u: Unidade | undefined, daBase: string | undefined): string => (u?.ult !== undefined ? u.ult : daBase ?? '');
/**
 * O que gravar como ult do personagem: igual à da base = nada (volta a seguir a base); diferente = o nome, ou ''
 * pra tirar a ult que a base dá.
 */
export const ultPraGravar = (ult: string, daBase: string | undefined): string | undefined => (ult.trim() === (daBase ?? '') ? undefined : ult.trim());

// ---------- linhas ----------
/** Onde um personagem está: a linha e o nível (0 = primeiro). */
export interface PosLinha { linha: LinhaEvo; nivel: number }

/** nome -> posição, pra achar a linha de cada personagem sem varrer tudo. */
export function indiceLinhas(linhas: readonly LinhaEvo[]): Map<string, PosLinha> {
  const m = new Map<string, PosLinha>();
  for (const linha of linhas) linha.niveis.forEach((n, nivel) => n.forEach(nome => { if (!m.has(nome)) m.set(nome, { linha, nivel }); }));
  return m;
}

/** Destino de um membro: o índice de um nível (vira alternativa se já tiver alguém), ou um nível novo no começo ou no fim. */
export type Destino = number | 'inicio' | 'fim';

const tirar = (l: LinhaEvo, nome: string): LinhaEvo => {
  if (!l.niveis.some(n => n.includes(nome))) return l;
  return ajustarDe({ ...l, niveis: l.niveis.map(n => n.filter(x => x !== nome)).filter(n => n.length) });
};

/**
 * Põe o personagem na linha `id`, no destino. Ele sai de onde estava antes (nesta ou em outra linha: um personagem,
 * uma linha). O destino conta os níveis de antes da mudança: levar o único membro do nível 1 pro nível 2 funciona.
 */
export function adicionarMembro(linhas: readonly LinhaEvo[], id: string, nome: string, destino: Destino): LinhaEvo[] {
  const alvo = linhas.find(l => l.id === id);
  if (!alvo || !nome) return linhas as LinhaEvo[];
  return linhas.map(l => {
    if (l !== alvo) return tirar(l, nome);
    const niveis = l.niveis.map(n => n.filter(x => x !== nome));
    if (typeof destino === 'number' && destino >= 0 && destino < niveis.length) niveis[destino]!.push(nome);
    else if (destino === 'inicio') niveis.unshift([nome]);
    else niveis.push([nome]);
    return ajustarDe({ ...l, niveis: niveis.filter(n => n.length) });
  });
}
/** Mudar de nível é pôr de novo na mesma linha. */
export const moverMembro = adicionarMembro;

/** De quem `nome` vem (alguém do nível anterior), ou '' = de qualquer um. Quem não está no nível de cima não vale. */
export function definirDe(linhas: readonly LinhaEvo[], id: string, nome: string, pai: string): LinhaEvo[] {
  const l = linhas.find(x => x.id === id);
  if (!l || (l.de?.[nome] ?? '') === pai) return linhas as LinhaEvo[];
  const de = Object.assign(dic<string>(), l.de);
  if (pai) de[nome] = pai;
  else delete de[nome];
  const { de: _, ...resto } = l;
  const nova = ajustarDe(Object.keys(de).length ? { ...resto, de } : resto);
  if ((nova.de?.[nome] ?? '') !== pai) return linhas as LinhaEvo[];
  return linhas.map(x => (x === l ? nova : x));
}

/** Tira o personagem da linha (nível que fica vazio some). */
export function removerMembro(linhas: readonly LinhaEvo[], id: string, nome: string): LinhaEvo[] {
  let mudou = false;
  const r = linhas.map(l => {
    if (l.id !== id) return l;
    const t = tirar(l, nome);
    mudou = t !== l;
    return t;
  });
  return mudou ? r : (linhas as LinhaEvo[]);
}

/**
 * Linha nova no fim da lista, com o personagem no nível 1 (ele sai da linha em que estava) ou vazia. Nome vazio vira
 * o do personagem ou "Nova linha". O id é `<chave>:<nome>`, sem repetir.
 */
export function criarLinha(linhas: readonly LinhaEvo[], k: string, nome: string, membro?: string): { linhas: LinhaEvo[]; id: string } {
  const n = nome.trim() || membro || 'Nova linha';
  const id = idUnico(`${k}:${slug(n)}`, new Set(linhas.map(l => l.id)));
  const resto = membro ? linhas.map(l => tirar(l, membro)) : [...linhas];
  return { linhas: [...resto, { id, nome: n, niveis: membro ? [[membro]] : [] }], id };
}

export function apagarLinha(linhas: readonly LinhaEvo[], id: string): LinhaEvo[] {
  return linhas.some(l => l.id === id) ? linhas.filter(l => l.id !== id) : (linhas as LinhaEvo[]);
}

/** Nome vazio ou igual não muda nada. */
export function renomearLinha(linhas: readonly LinhaEvo[], id: string, nome: string): LinhaEvo[] {
  const n = nome.trim();
  const l = linhas.find(x => x.id === id);
  if (!n || !l || l.nome === n) return linhas as LinhaEvo[];
  return linhas.map(x => (x === l ? { ...x, nome: n } : x));
}

export function confirmarLinha(linhas: readonly LinhaEvo[], id: string, on: boolean): LinhaEvo[] {
  const l = linhas.find(x => x.id === id);
  if (!l || !!l.confirmada === on) return linhas as LinhaEvo[];
  return linhas.map(x => {
    if (x !== l) return x;
    const { confirmada: _, ...resto } = x;
    return on ? { ...resto, confirmada: true } : resto;
  });
}

// ---------- classes ----------
/**
 * Classe nova no fim, com id tirado do nome. Nome vazio não cria; nome que já existe (sem ligar pra maiúscula e
 * acento) devolve a que já existe.
 */
export function adicionarClasse(classes: readonly Classe[], nome: string, descricao = ''): { classes: Classe[]; id: string } {
  const n = nome.trim();
  if (!n) return { classes: classes as Classe[], id: '' };
  const igual = classes.find(c => normalizar(c.nome) === normalizar(n));
  if (igual) return { classes: classes as Classe[], id: igual.id };
  const id = idUnico(slug(n), new Set(classes.map(c => c.id)));
  const d = descricao.trim();
  return { classes: [...classes, { id, nome: n, ...(d ? { descricao: d } : {}) }], id };
}

export function renomearClasse(classes: readonly Classe[], id: string, nome: string): Classe[] {
  const n = nome.trim();
  const c = classes.find(x => x.id === id);
  if (!n || !c || c.nome === n) return classes as Classe[];
  return classes.map(x => (x === c ? { ...x, nome: n } : x));
}

/** Descrição só com espaços some; o resto fica como foi digitado (salva enquanto digita: tirar o espaço do fim atrapalharia). */
export function descreverClasse(classes: readonly Classe[], id: string, descricao: string): Classe[] {
  const d = descricao.trim() ? descricao : '';
  const c = classes.find(x => x.id === id);
  if (!c || (c.descricao ?? '') === d) return classes as Classe[];
  return classes.map(x => {
    if (x !== c) return x;
    const { descricao: _, ...resto } = x;
    return d ? { ...resto, descricao: d } : resto;
  });
}

/** Sobe (-1) ou desce (+1) a classe na lista. */
export function moverClasse(classes: readonly Classe[], id: string, delta: -1 | 1): Classe[] {
  const i = classes.findIndex(c => c.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= classes.length) return classes as Classe[];
  const r = [...classes];
  [r[i], r[j]] = [r[j]!, r[i]!];
  return r;
}

/** Tira a classe de todo mundo (unidade que fica vazia some). */
export function tirarClasseDeTodos(unidades: Record<string, Unidades>, id: string): Record<string, Unidades> {
  return filtrarClasses(unidades, c => c !== id);
}

/** Deixa nas unidades só as classes que existem. */
export const soClassesValidas = (unidades: Record<string, Unidades>, classes: readonly Classe[]) => {
  const ids = new Set(classes.map(c => c.id));
  return filtrarClasses(unidades, c => ids.has(c));
};

function filtrarClasses(unidades: Record<string, Unidades>, fica: (id: string) => boolean): Record<string, Unidades> {
  let mudou = false;
  const r: Record<string, Unidades> = {};
  for (const [k, us] of Object.entries(unidades)) {
    const fr = dic<Unidade>();
    let mudouFr = false;
    for (const [nome, u] of Object.entries(us)) {
      if (!u.classes?.some(c => !fica(c))) { fr[nome] = u; continue; }
      mudouFr = true;
      const limpa = unidadeLimpa({ ...u, classes: u.classes.filter(fica) });
      if (limpa) fr[nome] = limpa;
    }
    mudou ||= mudouFr;
    if (Object.keys(fr).length) r[k] = mudouFr ? fr : us;
    else mudou = true;
  }
  return mudou ? r : unidades;
}

// ---------- unidades ----------
/** Muda a unidade de um personagem (patch por cima); a que fica vazia some, e a franquia sem ninguém também. */
export function mudarUnidade(unidades: Record<string, Unidades>, k: string, nome: string, patch: Unidade): Record<string, Unidades> {
  const fr = unidades[k] ?? dic<Unidade>();
  const nova = unidadeLimpa({ ...fr[nome], ...patch });
  const novaFr = Object.assign(dic<Unidade>(), fr);
  if (nova) novaFr[nome] = nova;
  else delete novaFr[nome];
  const r = { ...unidades };
  if (Object.keys(novaFr).length) r[k] = novaFr;
  else delete r[k];
  return r;
}

/** Liga ou desliga uma classe do personagem. */
export function alternarClasse(unidades: Record<string, Unidades>, k: string, nome: string, id: string): Record<string, Unidades> {
  const atuais = unidades[k]?.[nome]?.classes ?? [];
  return mudarUnidade(unidades, k, nome, { classes: atuais.includes(id) ? atuais.filter(c => c !== id) : [...atuais, id] });
}

/** As classes do personagem que existem, na ordem da lista de classes. */
export function classesDaUnidade(u: Unidade | undefined, classes: readonly Classe[]): Classe[] {
  if (!u?.classes?.length) return [];
  const s = new Set(u.classes);
  return classes.filter(c => s.has(c.id));
}

// ---------- exportar e importar ----------
export interface LinhaExportada {
  nome: string;
  /** 1 = primeiro nível */
  nivel: number;
  /** quantos níveis a linha tem */
  de: number;
  confirmada: boolean;
  /** os outros do mesmo nível (alternativas) */
  alternativas?: string[];
  /** de quem do nível anterior ele vem (ausente = de qualquer um) */
  vemDe?: string;
}
/** Campos que o planejamento acrescenta a cada personagem do set1.json. */
export interface ExtrasExportados { classes?: string[]; habilidade?: string; linha?: LinhaExportada; ult?: string }

/** `ult`: a forma da ult que vale (ultEfetiva); '' = sem. */
export function extrasDoPersonagem(nome: string, u: Unidade | undefined, classes: readonly Classe[], pos: PosLinha | undefined, ult = ''): ExtrasExportados {
  const r: ExtrasExportados = {};
  const cs = classesDaUnidade(u, classes);
  if (cs.length) r.classes = cs.map(c => c.nome);
  if (u?.habilidade?.trim()) r.habilidade = u.habilidade.trim();
  if (ult) r.ult = ult;
  if (pos) {
    const alt = pos.linha.niveis[pos.nivel]!.filter(x => x !== nome);
    const de = pos.linha.de?.[nome];
    r.linha = {
      nome: pos.linha.nome, nivel: pos.nivel + 1, de: pos.linha.niveis.length, confirmada: !!pos.linha.confirmada,
      ...(alt.length ? { alternativas: alt } : {}), ...(de ? { vemDe: de } : {}),
    };
  }
  return r;
}

/**
 * O plano pro set1.json, das franquias `ks`: as classes que valem agora, as unidades (com a ult da base escrita) e as
 * linhas como o plano guarda (por linha: mexidas, criadas, confirmações e apagadas), já no formato de agora. As linhas
 * que valem vão à parte (linhasCompletas).
 */
export function planoCompleto(p: Plano, base: Base | null, ks: readonly string[]): Plano {
  const linhas: Record<string, LinhaSalva[]> = {};
  const apagadas: Record<string, string[]> = {};
  for (const k of ks) {
    const c = base ? compactarLinhas(p.linhas[k] ?? [], p.apagadas?.[k] ?? [], base.linhas[k] ?? []) : { salvas: p.linhas[k] ?? [], apagadas: p.apagadas?.[k] ?? [] };
    if (c.salvas.length) linhas[k] = c.salvas;
    if (c.apagadas.length) apagadas[k] = c.apagadas;
  }
  // as unidades das franquias pedidas, com a ult da base escrita em quem não mexeu nela
  const unidades: Record<string, Unidades> = {};
  for (const k of ks) {
    const us = p.unidades[k];
    const daBase = base?.ults[k];
    if (!us && !daBase) continue;
    const fr = Object.assign(dic<Unidade>(), us);
    for (const [nome, ult] of Object.entries(daBase ?? {})) if (fr[nome]?.ult === undefined) fr[nome] = { ...fr[nome], ult };
    unidades[k] = fr;
  }
  const classes = classesEfetivas(p, base).map(c => (c.descricao ? { ...c, descricao: c.descricao.trim() } : c));
  const vistas = classesVistasAgora(p, base);
  return { versao: 1, classes, ...(vistas ? { classesVistas: vistas } : {}), unidades, linhas, ...(Object.keys(apagadas).length ? { apagadas } : {}) };
}

/** As linhas que valem em cada franquia de `ks` que tem alguma (pro set1.json). */
export function linhasCompletas(p: Plano, base: Base | null, ks: readonly string[]): Record<string, LinhaEvo[]> {
  const r: Record<string, LinhaEvo[]> = {};
  for (const k of ks) {
    const l = linhasEfetivas(p, base, k);
    if (l.length) r[k] = l;
  }
  return r;
}

const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Restaura o plano de um set1.json por cima do atual: as classes do arquivo substituem as atuais, o que o arquivo
 * guarda das linhas de uma franquia substitui o dela e cada personagem do arquivo substitui o atual (os outros
 * ficam). O que for igual à base (classes, ult de um personagem, linha não mexida) volta a seguir a base: arquivo
 * antigo, com as linhas inteiras, só traz as confirmações e as linhas criadas. Franquia fora de `validas` é
 * ignorada. Classe que deixou de existir sai das unidades.
 */
export function restaurarPlano(atual: Plano, arq: Plano, base: Base | null, validas: readonly string[]): Plano {
  const p: Plano = { versao: 1, unidades: { ...atual.unidades }, linhas: { ...atual.linhas } };
  const apagadas: Record<string, string[]> = { ...atual.apagadas };
  const classes = arq.classes ?? atual.classes;
  const vistas = arq.classes ? arq.classesVistas : atual.classesVistas;
  if (classes && !(base && igual(classes, base.classes))) {
    p.classes = classes;
    if (vistas) p.classesVistas = vistas;
  }
  for (const k of new Set([...Object.keys(arq.linhas), ...Object.keys(arq.apagadas ?? {})])) {
    if (!validas.includes(k)) continue;
    const salvas = arq.linhas[k] ?? [];
    const apag = arq.apagadas?.[k] ?? [];
    const c = base ? compactarLinhas(salvas, apag, base.linhas[k] ?? []) : { salvas, apagadas: apag };
    if (c.salvas.length) p.linhas[k] = c.salvas;
    else delete p.linhas[k];
    if (c.apagadas.length) apagadas[k] = c.apagadas;
    else delete apagadas[k];
  }
  if (Object.keys(apagadas).length) p.apagadas = apagadas;
  for (const [k, us] of Object.entries(arq.unidades)) {
    if (!validas.includes(k)) continue;
    const fr = Object.assign(dic<Unidade>(), p.unidades[k]);
    for (const [nome, u] of Object.entries(us)) {
      // ult igual à da base volta a seguir a base
      const n = base && u.ult !== undefined ? unidadeLimpa({ ...u, ult: ultPraGravar(u.ult, base.ults[k]?.[nome]) }) : u;
      if (n) fr[nome] = n;
      else delete fr[nome];
    }
    if (Object.keys(fr).length) p.unidades[k] = fr;
    else delete p.unidades[k];
  }
  if (p.classes || base) p.unidades = soClassesValidas(p.unidades, classesEfetivas(p, base));
  return p;
}

/** Quanto um plano tem, pra mensagem da importação. */
export function resumoPlano(p: Plano): { classes: number | null; unidades: number; franquiasComLinhas: number } {
  return {
    classes: p.classes ? p.classes.length : null,
    unidades: Object.values(p.unidades).reduce((n, us) => n + Object.keys(us).length, 0),
    franquiasComLinhas: new Set([...Object.keys(p.linhas).filter(k => p.linhas[k]!.length), ...Object.keys(p.apagadas ?? {})]).size,
  };
}
