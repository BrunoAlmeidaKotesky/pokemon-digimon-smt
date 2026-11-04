// Set pequeno feito à mão e motor falso pros testes da partida.
import { definirSet, S } from '../dados';
import { criarRng } from '../rng';
import type {
  Atributos, CampeaoDados, Custo, EntradaTime, FormaDados, Jogador, Origem, Partida, ResultadoLuta, SetDados,
  SimularLuta, Unidade,
} from '../tipos';
import { definirMotor, type TracoContado } from './motor';

function forma(fr: Origem, nome: string, classes: string[]): FormaDados {
  return { id: `${fr}:${nome}`, nome, img: `${fr}/${nome}.webp`, fr, classes, info: [] };
}

interface Def { id: string; fr: Origem; custo: Custo; niveis: [string, string[]][][]; stand?: true; de?: Record<string, string> }

/** [nome, classes] por nível; cada nível pode ter alternativas */
const DEFS: Def[] = [
  // custo 1
  { id: 'pokemon:squirtle', fr: 'pokemon', custo: 1, niveis: [[['Squirtle', ['tanque', 'agua']]], [['Wartortle', ['tanque', 'agua']]], [['Blastoise', ['tanque', 'agua']]]] },
  { id: 'pokemon:ralts', fr: 'pokemon', custo: 1, niveis: [[['Ralts', ['fadinhas']]], [['Kirlia', ['fadinhas']]], [['Gardevoir', ['fadinhas']], ['Gallade', ['porradeiro']]]] },
  { id: 'pokemon:rotom', fr: 'pokemon', custo: 1, niveis: [[['Rotom-W', ['agua']], ['Rotom-H', ['fogo']]]] },
  { id: 'sujimon:a', fr: 'sujimon', custo: 1, niveis: [[['Suji A', ['porradeiro']]]] },
  { id: 'sujimon:b', fr: 'sujimon', custo: 1, niveis: [[['Suji B', ['tanque']]]] },
  { id: 'overwatch:tracer', fr: 'overwatch', custo: 1, niveis: [[['Tracer', ['assassino']]]] },
  { id: 'deadlock:haze', fr: 'deadlock', custo: 1, niveis: [[['Haze', ['assassino']]]] },
  { id: 'jojo:jotaro', fr: 'jojo', custo: 1, niveis: [[['Jotaro', ['porradeiro']]]] },
  // custo 2
  {
    id: 'pokemon:eevee', fr: 'pokemon', custo: 2,
    niveis: [[['Eevee', ['unicos']]], [['Vaporeon', ['agua']], ['Jolteon', ['raio']]], [['Suicune', ['agua']], ['Raikou', ['raio']]]],
    de: { 'pokemon:Suicune': 'pokemon:Vaporeon', 'pokemon:Raikou': 'pokemon:Jolteon' },
  },
  { id: 'jojo:star-platinum', fr: 'jojo', custo: 2, stand: true, niveis: [[['Star Platinum', ['porradeiro']]]] },
  { id: 'overwatch:mercy', fr: 'overwatch', custo: 2, niveis: [[['Mercy', ['anjo']]]] },
  { id: 'deadlock:infernus', fr: 'deadlock', custo: 2, niveis: [[['Infernus', ['fogo']]]] },
  { id: 'sujimon:c', fr: 'sujimon', custo: 2, niveis: [[['Suji C', ['atirador']]]] },
  // custo 3
  { id: 'overwatch:reinhardt', fr: 'overwatch', custo: 3, niveis: [[['Reinhardt', ['tanque']]]] },
  { id: 'deadlock:abrams', fr: 'deadlock', custo: 3, niveis: [[['Abrams', ['tanque']]]] },
  { id: 'sujimon:d', fr: 'sujimon', custo: 3, niveis: [[['Suji D', ['fadinhas']]]] },
  { id: 'ygo:mago', fr: 'ygo', custo: 3, niveis: [[['Mago Negro', ['fadinhas']]]] },
  { id: 'digimon:agumon', fr: 'digimon', custo: 3, niveis: [[['Agumon', ['dragao']]], [['Greymon', ['dragao']]], [['MetalGreymon', ['dragao']]]] },
  // custo 4
  { id: 'smt:pixie', fr: 'smt', custo: 4, niveis: [[['Pixie', ['fadinhas']]]] },
  { id: 'lol:jinx', fr: 'lol', custo: 4, niveis: [[['Jinx', ['atirador']]]] },
  { id: 'ygo:olhos-azuis', fr: 'ygo', custo: 4, niveis: [[['Olhos Azuis', ['dragao']]]] },
  // custo 5
  { id: 'lol:aurelion', fr: 'lol', custo: 5, niveis: [[['Aurelion', ['dragao']]]] },
  { id: 'sujimon:e', fr: 'sujimon', custo: 5, niveis: [[['Suji E', ['anjo']]]] },
  { id: 'overwatch:genji', fr: 'overwatch', custo: 5, niveis: [[['Genji', ['assassino']]]] },
  { id: 'persona:arsene', fr: 'persona', custo: 5, niveis: [[['Arsene', ['assassino']]]] },
];

export function setDeTeste(): SetDados {
  const formas: Record<string, FormaDados> = {};
  const campeoes: CampeaoDados[] = DEFS.map(d => {
    const niveis = d.niveis.map(nivel => nivel.map(([nome, classes]) => {
      const f = forma(d.fr, nome, classes);
      formas[f.id] = f;
      return f.id;
    }));
    const c: CampeaoDados = { id: d.id, fr: d.fr, nome: d.niveis[0]![0]![0], custo: d.custo, niveis };
    if (d.stand) c.stand = true;
    if (d.de) c.de = d.de;
    return c;
  });
  const nomes = ['tanque', 'porradeiro', 'assassino', 'atirador', 'fadinhas', 'anjo', 'dragao', 'agua', 'fogo', 'raio', 'unicos'];
  return {
    versao: 1, geradoEm: '2026-11-04', fonte: 'teste',
    tracos: nomes.map(id => ({ id, nome: id })),
    campeoes, formas, bakugan: {},
    ff: {
      inimigos: Array.from({ length: 10 }, (_, i) => ({ nome: `Inimigo ${i}`, jogo: 'FF', img: `ff/${i}.png`, nivel: i * 5 })),
      chefes: [{ nome: 'Chefe A', jogo: 'FF', img: 'ff/a.png' }, { nome: 'Chefe B', jogo: 'FF', img: 'ff/b.png' }],
    },
  };
}

const DEGRAUS_ORIGEM: Record<Origem, number[]> = {
  pokemon: [4, 8, 9], digimon: [2, 3, 5], smt: [2, 4, 6], persona: [1, 2, 3], jojo: [2, 4, 7], ygo: [2, 5, 7],
  lol: [2, 4, 7], overwatch: [2, 3, 5], deadlock: [2, 3, 5], sujimon: [2, 3, 4],
};
const ELEMENTOS = new Set(['agua', 'fogo', 'raio', 'gelo', 'terra', 'vento', 'planta']);

/** contarTracos falso: campeões diferentes por traço (origem + classes da forma atual). */
export function contarTracosFalso(us: { campeao: string; forma: string }[]): TracoContado[] {
  const por = new Map<string, Set<string>>();
  for (const u of us) {
    const f = S().forma(u.forma);
    for (const t of [f.fr, ...f.classes]) {
      if (t === 'unicos') continue;
      if (!por.has(t)) por.set(t, new Set());
      por.get(t)!.add(u.campeao);
    }
  }
  return [...por].map(([id, cs]) => {
    const degraus = (DEGRAUS_ORIGEM as Record<string, number[]>)[id] ?? (ELEMENTOS.has(id) ? [2, 3, 4] : [2, 4, 6]);
    let nivel = -1;
    degraus.forEach((d, i) => { if (cs.size >= d) nivel = i; });
    return { id, n: cs.size, nivel };
  });
}

export function atributosFalsos(u: Unidade): Atributos {
  const atira = S().forma(u.forma).classes.includes('atirador');
  return {
    vida: 500, dano: 50, armadura: 20, resist: 20, velAtaque: 0.7, alcance: atira ? 4 : 1, mana: 80, manaInicial: 0,
    critChance: 0.25, critDano: 1.4, rouboVida: 0, desvio: 0, poder: 1,
  };
}

/** Luta falsa sorteada pela semente: vencedor ao acaso (time vazio perde), alguns sobreviventes, dano e abates. */
export const lutaSorteada: SimularLuta = (a, b, semente, gravar) => {
  const r = criarRng(semente);
  const vencedor: 'a' | 'b' = !a.lutadores.length ? 'b' : !b.lutadores.length ? 'a' : r.chance(0.5) ? 'a' : 'b';
  const time = vencedor === 'a' ? a : b;
  const vivos = time.lutadores.filter(() => r.chance(0.5)).map(l => `${vencedor}:${l.id}`);
  if (!vivos.length && time.lutadores.length) vivos.push(`${vencedor}:${time.lutadores[0]!.id}`);
  const dano: Record<string, number> = {}, abates: Record<string, number> = {};
  for (const [lado, t] of [['a', a], ['b', b]] as const) {
    for (const l of t.lutadores) { dano[`${lado}:${l.id}`] = r.int(1000); abates[`${lado}:${l.id}`] = r.int(3); }
  }
  return resultado(vencedor, vencedor === 'a' ? vivos : [], vencedor === 'b' ? vivos : [], dano, abates, gravar);
};

export function resultado(
  vencedor: ResultadoLuta['vencedor'], vivosA: string[], vivosB: string[], dano: Record<string, number> = {},
  abates: Record<string, number> = {}, gravar = false,
): ResultadoLuta {
  return {
    vencedor, vivosA, vivosB, duracao: 10, dano, abates, ouro: { a: 0, b: 0 },
    gravacao: gravar ? { passo: 0.1, inicial: [], quadros: [], eventos: [] } : undefined,
  };
}

/** Luta que o lado pedido sempre ganha, com todos os dele vivos. */
export function lutaGanha(lado: 'a' | 'b'): SimularLuta {
  return (a: EntradaTime, b: EntradaTime) => {
    const t = lado === 'a' ? a : b;
    const vivos = t.lutadores.map(l => `${lado}:${l.id}`);
    return resultado(lado, lado === 'a' ? vivos : [], lado === 'b' ? vivos : []);
  };
}

/** Liga o set de teste e o motor falso. */
export function prepararTeste(simular: SimularLuta = lutaSorteada): void {
  definirSet(setDeTeste());
  definirMotor({ simularLuta: simular, atributosDaUnidade: atributosFalsos, contarTracos: contarTracosFalso });
}

/** Dá uma unidade pronta ao jogador (sem passar pela loja), no banco ou numa casa. */
export function dar(
  p: Partida, j: Jogador, campeao: string,
  opcoes: { estrela?: 1 | 2 | 3; forma?: string; itens?: string[]; casa?: [number, number]; banco?: number } = {},
): Unidade {
  const estrela = opcoes.estrela ?? 1;
  const u: Unidade = {
    uid: p.proximoUid++, campeao, estrela, forma: opcoes.forma ?? S().formaPadrao(campeao, estrela), itens: opcoes.itens ?? [],
  };
  j.unidades[u.uid] = u;
  p.pool[campeao] = (p.pool[campeao] ?? 0) - (estrela === 1 ? 1 : estrela === 2 ? 3 : 9);
  if (opcoes.casa) j.tabuleiro[`${opcoes.casa[0]},${opcoes.casa[1]}`] = u.uid;
  else {
    const i = opcoes.banco ?? j.banco.indexOf(null);
    j.banco[i] = u.uid;
  }
  return u;
}

/** Jogador sem nada (pra montar cenários). */
export function limpar(j: Jogador): void {
  j.unidades = {};
  j.banco = Array<number | null>(9).fill(null);
  j.tabuleiro = {};
  j.itens = [];
  j.loja = [];
  j.lojaFormas = [];
}
