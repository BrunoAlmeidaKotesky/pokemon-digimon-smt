// Planejador de times da Autobatalha: planos de até 10 campeões salvos no localStorage (pdx-autobatalha-planos),
// o plano ativo (os campeões dele ganham marca na loja) e os traços que cada plano ativa, contando cada campeão pela
// forma de maior estrela. Funções puras: o armazenamento entra como parâmetro (a tela usa o localStorage).
import type { CampeaoDados, Custo, Origem } from './tipos';
import type { SetIndex } from './dados';
import { contarTracos, type TracoAtivo } from './conteudo';

export const CHAVE_PLANOS = 'pdx-autobatalha-planos';
export const MAX_CAMPEOES = 10;

export interface Plano { id: string; nome: string; campeoes: string[] }
export interface Planos {
  planos: Plano[];
  /** id do plano marcado na loja (null = nenhum) */
  ativo: string | null;
}
export const SEM_PLANOS: Planos = { planos: [], ativo: null };

type Armazem = Pick<Storage, 'getItem' | 'setItem'>;

function armazemPadrao(): Armazem | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const ehTexto = (x: unknown): x is string => typeof x === 'string';

/** Lê o que veio do armazenamento; o que não tiver o formato certo some (sem quebrar a tela). */
export function validarPlanos(j: unknown): Planos {
  if (!j || typeof j !== 'object') return SEM_PLANOS;
  const o = j as { planos?: unknown; ativo?: unknown };
  const planos: Plano[] = [];
  const ids = new Set<string>();
  for (const p of Array.isArray(o.planos) ? o.planos : []) {
    if (!p || typeof p !== 'object') continue;
    const { id, nome, campeoes } = p as { id?: unknown; nome?: unknown; campeoes?: unknown };
    if (!ehTexto(id) || !id || ids.has(id) || !ehTexto(nome)) continue;
    ids.add(id);
    const cs = Array.isArray(campeoes) ? [...new Set(campeoes.filter(ehTexto))].slice(0, MAX_CAMPEOES) : [];
    planos.push({ id, nome, campeoes: cs });
  }
  const ativo = ehTexto(o.ativo) && ids.has(o.ativo) ? o.ativo : null;
  return { planos, ativo };
}

export function lerPlanos(armazem: Armazem | null = armazemPadrao()): Planos {
  try {
    const bruto = armazem?.getItem(CHAVE_PLANOS);
    return bruto ? validarPlanos(JSON.parse(bruto)) : SEM_PLANOS;
  } catch {
    return SEM_PLANOS;
  }
}

/** Grava os planos; false se o navegador não deixou (modo privado, cota cheia). */
export function salvarPlanos(p: Planos, armazem: Armazem | null = armazemPadrao()): boolean {
  try {
    if (!armazem) return false;
    armazem.setItem(CHAVE_PLANOS, JSON.stringify({ versao: 1, planos: p.planos, ativo: p.ativo }));
    return true;
  } catch {
    return false;
  }
}

/** Põe ou tira um campeão da lista; null quando já tem 10 e ele não está nela. */
export function alternarCampeao(campeoes: readonly string[], id: string): string[] | null {
  if (campeoes.includes(id)) return campeoes.filter(c => c !== id);
  if (campeoes.length >= MAX_CAMPEOES) return null;
  return [...campeoes, id];
}

/** "Plano 1", "Plano 2"... o primeiro número que não está em uso. */
export function nomeLivre(p: Planos): string {
  const usados = new Set(p.planos.map(x => x.nome));
  let n = p.planos.length + 1;
  for (let i = 1; i <= n; i++) if (!usados.has(`Plano ${i}`)) { n = i; break; }
  return `Plano ${n}`;
}

let contador = 0;
export const gerarIdPlano = () => `p${Date.now().toString(36)}${(contador++).toString(36)}`;

/**
 * Salva um plano: com `id` de um plano existente, substitui (renomear é isso); sem, cria um novo (no fim da lista).
 * Nome vazio vira o nome livre. Devolve os planos novos e o id do plano salvo.
 */
export function salvarPlano(p: Planos, plano: { id?: string | null; nome: string; campeoes: readonly string[] }, novoId: () => string = gerarIdPlano): { planos: Planos; id: string } {
  const nome = plano.nome.trim() || nomeLivre(p);
  const campeoes = [...new Set(plano.campeoes)].slice(0, MAX_CAMPEOES);
  const existe = plano.id ? p.planos.some(x => x.id === plano.id) : false;
  if (existe) {
    return { planos: { ...p, planos: p.planos.map(x => (x.id === plano.id ? { id: x.id, nome, campeoes } : x)) }, id: plano.id! };
  }
  const id = novoId();
  return { planos: { ...p, planos: [...p.planos, { id, nome, campeoes }] }, id };
}

export function apagarPlano(p: Planos, id: string): Planos {
  return { planos: p.planos.filter(x => x.id !== id), ativo: p.ativo === id ? null : p.ativo };
}

/** Marca o plano da loja (null desmarca; id que não existe também). */
export function definirAtivo(p: Planos, id: string | null): Planos {
  return { ...p, ativo: id && p.planos.some(x => x.id === id) ? id : null };
}

export function planoAtivo(p: Planos): Plano | null {
  return p.planos.find(x => x.id === p.ativo) ?? null;
}

/** Cada campeão do plano como unidade de estrela 3 (a forma de maior estrela, primeira alternativa). */
export function unidadesDoPlano(campeoes: readonly string[], set: SetIndex): { campeao: string; forma: string }[] {
  const out: { campeao: string; forma: string }[] = [];
  for (const id of campeoes) {
    try {
      out.push({ campeao: id, forma: set.formaPadrao(id, 3) });
    } catch {
      // campeão que saiu do set: fica fora da conta
    }
  }
  return out;
}

/** Traços que o plano ativa (ativos e inativos), como na lateral da partida. */
export function tracosDoPlano(campeoes: readonly string[], set: SetIndex, contar: (u: { campeao: string; forma: string }[]) => TracoAtivo[] = contarTracos): TracoAtivo[] {
  return contar(unidadesDoPlano(campeoes, set));
}

// ---------- busca e filtros da grade ----------
export interface FiltroPlanejador {
  busca: string;
  origem: Origem | '';
  /** id de classe ou elemento */
  classe: string;
  /** custos marcados (vazio = todos) */
  custos: Custo[];
}
export const FILTRO_VAZIO: FiltroPlanejador = { busca: '', origem: '', classe: '', custos: [] };

/** minúsculas e sem acento, pra busca */
export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Campeões do set que passam no filtro, por custo e depois por nome. A busca olha o nome, a linha e as formas. */
export function filtrarCampeoes(set: SetIndex, f: FiltroPlanejador): CampeaoDados[] {
  const q = normalizar(f.busca);
  return set.dados.campeoes
    .filter(c => {
      if (f.origem && c.fr !== f.origem) return false;
      if (f.custos.length && !f.custos.includes(c.custo)) return false;
      if (f.classe && !set.tracosDoCampeao(c.id).includes(f.classe)) return false;
      if (!q) return true;
      const nomes = [c.nome, c.linha ?? '', ...c.niveis.flat().map(id => (set.temForma(id) ? set.forma(id).nome : ''))];
      return nomes.some(n => normalizar(n).includes(q));
    })
    .sort((a, b) => a.custo - b.custo || a.nome.localeCompare(b.nome, 'pt-BR'));
}
