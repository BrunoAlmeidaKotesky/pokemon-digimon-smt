// Set carregado (public/autobatalha/set1.json) e índices pra consulta rápida. O motor, o conteúdo e a partida
// leem daqui com `S()`; a tela carrega com `carregarSet()` e os testes definem um set com `definirSet()`.
import type { CampeaoDados, Custo, Estrela, FormaDados, Origem, SetDados } from './tipos';

export interface SetIndex {
  dados: SetDados;
  campeao(id: string): CampeaoDados;
  forma(id: string): FormaDados;
  temForma(id: string): boolean;
  /** campeões vendidos em cada custo */
  porCusto: Record<Custo, CampeaoDados[]>;
  /** traços (origem + classes de todas as formas da linha) de um campeão, sem repetir */
  tracosDoCampeao(id: string): string[];
  /** nome de um traço (origem ou classe) */
  nomeTraco(id: string): string;
  /** forma da estrela s, a primeira alternativa (a partida guarda a forma escolhida na unidade) */
  formaPadrao(campeao: string, estrela: Estrela): string;
  /** origem de uma forma */
  origemDe(forma: string): Origem;
}

const NOMES_ORIGEM: Record<Origem, string> = {
  pokemon: 'Pokémon', digimon: 'Digimon', smt: 'SMT', persona: 'Persona', jojo: 'JoJo', ygo: 'Yu-Gi-Oh!',
  lol: 'LoL', overwatch: 'Overwatch', deadlock: 'Deadlock', sujimon: 'Sujimon',
};

export function indexar(dados: SetDados): SetIndex {
  const campeoes = new Map(dados.campeoes.map(c => [c.id, c]));
  const porCusto: Record<Custo, CampeaoDados[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const c of dados.campeoes) porCusto[c.custo].push(c);
  const nomes = new Map<string, string>(dados.tracos.map(t => [t.id, t.nome]));
  for (const [k, v] of Object.entries(NOMES_ORIGEM)) nomes.set(k, v);
  const tracos = new Map<string, string[]>();
  for (const c of dados.campeoes) {
    const set = new Set<string>([c.fr]);
    for (const nivel of c.niveis) for (const f of nivel) for (const cl of dados.formas[f]?.classes ?? []) set.add(cl);
    tracos.set(c.id, [...set]);
  }
  const forma = (id: string) => {
    const f = dados.formas[id];
    if (!f) throw new Error(`forma desconhecida: ${id}`);
    return f;
  };
  return {
    dados,
    campeao(id) {
      const c = campeoes.get(id);
      if (!c) throw new Error(`campeão desconhecido: ${id}`);
      return c;
    },
    forma,
    temForma: id => id in dados.formas,
    porCusto,
    tracosDoCampeao: id => tracos.get(id) ?? [],
    nomeTraco: id => nomes.get(id) ?? id,
    formaPadrao(campeao, estrela) {
      const c = campeoes.get(campeao);
      if (!c) throw new Error(`campeão desconhecido: ${campeao}`);
      return c.niveis[Math.min(estrela, c.niveis.length) - 1]![0]!;
    },
    origemDe: id => forma(id).fr,
  };
}

let atual: SetIndex | null = null;
let pedido: Promise<SetIndex> | null = null;

/** Set em uso. Lança erro se ainda não carregou. */
export function S(): SetIndex {
  if (!atual) throw new Error('set da Autobatalha não carregado');
  return atual;
}
export function setCarregado(): boolean { return atual != null; }
export function definirSet(dados: SetDados): SetIndex { atual = indexar(dados); return atual; }

/** Baixa o set uma vez (a pasta public é servida junto com o site). */
export function carregarSet(url = 'autobatalha/set1.json'): Promise<SetIndex> {
  if (atual) return Promise.resolve(atual);
  pedido ??= fetch(url)
    .then(r => { if (!r.ok) throw new Error(`set: HTTP ${r.status}`); return r.json() as Promise<SetDados>; })
    .then(definirSet)
    .catch(e => { pedido = null; throw e; });
  return pedido;
}

/** Imagem pronta pra <img>: caminho relativo vira relativo à base do site. */
export function urlImagem(img: string): string {
  return /^https?:/.test(img) ? img : `./${img.replace(/^\.?\//, '')}`;
}
