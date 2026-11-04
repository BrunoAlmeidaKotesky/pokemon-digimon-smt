// Ícones do jogador no lobby da Autobatalha: todos os personagens do set (cada forma uma vez, inclusive as que só
// aparecem na transformação), com busca por nome, origem e custo. O ícone escolhido vira Jogador.avatar.
import type { SetIndex } from './dados';
import { normalizar } from './planejador';
import { ORIGENS, type Custo, type Origem } from './tipos';

export interface Icone {
  /** id da forma (o que fica salvo na configuração) */
  forma: string;
  nome: string;
  /** como FormaDados.img */
  img: string;
  fr: Origem;
  /** custo do campeão da forma (o menor, se mais de um a usa); a forma de transformação usa o de quem transforma */
  custo: Custo | null;
  /** só existe como resultado da transformação (Mega, Gigantamax...) */
  transformacao: boolean;
}

export interface FiltroIcones {
  busca: string;
  /** '' = todas */
  origem: Origem | '';
  /** custos marcados (vazio = todos) */
  custos: Custo[];
}
export const FILTRO_ICONES_VAZIO: FiltroIcones = { busca: '', origem: '', custos: [] };

/** Todos os ícones do set, sem repetir forma nem imagem: por origem (a ordem das franquias), custo e nome. */
export function iconesDoSet(set: SetIndex): Icone[] {
  const custo = new Map<string, Custo>();
  const menor = (id: string, c: Custo) => { const x = custo.get(id); if (x == null || c < x) custo.set(id, c); };
  for (const c of set.dados.campeoes) for (const nivel of c.niveis) for (const f of nivel) menor(f, c.custo);
  // forma de transformação: o custo de quem transforma
  for (const f of Object.values(set.dados.formas)) {
    const c = custo.get(f.id);
    if (c != null) for (const t of f.transforma ?? []) menor(t, c);
  }
  const imgs = new Set<string>();
  const out: Icone[] = [];
  for (const f of Object.values(set.dados.formas)) {
    if (!f.img || imgs.has(f.img)) continue;
    imgs.add(f.img);
    out.push({ forma: f.id, nome: f.nome, img: f.img, fr: f.fr, custo: custo.get(f.id) ?? null, transformacao: !!f.soUlt });
  }
  const ordem = (o: Origem) => ORIGENS.indexOf(o);
  return out.sort((a, b) => ordem(a.fr) - ordem(b.fr) || (a.custo ?? 9) - (b.custo ?? 9) || a.nome.localeCompare(b.nome, 'pt-BR'));
}

/** Os ícones que passam no filtro (a busca ignora maiúsculas e acentos). */
export function filtrarIcones(icones: readonly Icone[], f: FiltroIcones): Icone[] {
  const q = normalizar(f.busca);
  return icones.filter(i => {
    if (f.origem && i.fr !== f.origem) return false;
    if (f.custos.length && (i.custo == null || !f.custos.includes(i.custo))) return false;
    return !q || normalizar(i.nome).includes(q);
  });
}
