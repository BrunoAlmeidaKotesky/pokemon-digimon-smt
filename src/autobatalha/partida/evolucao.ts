// Unidades e evolução: 3 do mesmo campeão e da mesma estrela (banco e tabuleiro) viram 1 da estrela acima, na
// hora, e a estrela 2 nova pode fechar outra evolução em cadeia. Formas alternativas: com `de` (Eevee) a forma vem
// da do nível anterior; sem `de`, o jogador escolhe (bot sorteia).
import { S } from '../dados';
import type { Rng } from '../rng';
import type { CampeaoDados, Estrela, Jogador, Partida, Unidade } from '../tipos';
import { ondeEsta, todasUnidades } from './consultas';
import { juntarItens } from './itens';
import { rngDa } from './sorteio';
import { arrumarStands, paraOBanco, tirar } from './tabuleiro';

/** Unidade nova (sem lugar ainda), estrela 1. */
export function criarUnidade(p: Partida, campeao: string, forma?: string): Unidade {
  const u: Unidade = { uid: p.proximoUid++, campeao, estrela: 1, forma: forma ?? S().formaPadrao(campeao, 1), itens: [] };
  return u;
}

/** Forma de nível 1 sorteada (campeão com alternativas no nível 1); null = só tem uma. */
export function sortearFormaNivel1(campeao: string, rng: Rng): string | null {
  const opcoes = S().campeao(campeao).niveis[0] ?? [];
  return opcoes.length > 1 ? opcoes[rng.int(opcoes.length)]! : null;
}

/** Formas possíveis da unidade que nasce de 3 com estas formas, na estrela nova. */
export function formasDaEvolucao(c: CampeaoDados, formas: string[], nova: Estrela): string[] {
  const nivelNovo = Math.min(nova, c.niveis.length) - 1;
  const nivelAntes = Math.min(nova - 1, c.niveis.length) - 1;
  const opcoes = c.niveis[nivelNovo] ?? [];
  if (opcoes.length <= 1) return opcoes.length ? [...opcoes] : [formas[0]!];
  const presentes = [...new Set(formas)];
  if (nivelNovo === nivelAntes) {
    // a estrela repete o nível (linha de 2 níveis, solto): continua a forma que já era
    const mesmas = presentes.filter(f => opcoes.includes(f));
    return mesmas.length ? mesmas : [...opcoes];
  }
  if (c.de) {
    const de = c.de;
    const possiveis = opcoes.filter(o => de[o] != null && presentes.includes(de[o]!));
    if (possiveis.length) return possiveis;
  }
  return [...opcoes];
}

/** A ult escolhida deixa de valer se a forma nova não tem aquela classe nem aquela transformação. */
function ajustarUlt(u: Unidade): void {
  if (!u.ult || !S().temForma(u.forma)) return;
  const f = S().forma(u.forma);
  if (!f.classes.includes(u.ult) && !(f.transforma ?? []).includes(u.ult)) u.ult = undefined;
}

const uidsPendentes = (j: Jogador): Set<number> =>
  new Set([j.escolhaPendente, ...(j.escolhasFila ?? [])].filter(e => e != null).map(e => e.uid));

/** A que fica: a do tabuleiro, senão a do banco mais à esquerda (a recém-comprada, sem lugar, por último). */
function ordemDeFicar(j: Jogador, us: Unidade[]): Unidade[] {
  const pos = (u: Unidade) => {
    const o = ondeEsta(j, u.uid);
    if (!o) return 1000;
    return o.tipo === 'tabuleiro' ? -1 : o.i;
  };
  return [...us].sort((a, b) => pos(a) - pos(b));
}

function fundir(p: Partida, j: Jogador, tres: Unidade[], nova: Estrela): void {
  const ordem = ordemDeFicar(j, tres);
  const fica = ordem[0]!;
  const itens = ordem.flatMap(u => u.itens);
  const formas = ordem.map(u => u.forma);
  let vida = 0, dano = 0;
  for (const u of ordem) { vida += u.bonus?.vida ?? 0; dano += u.bonus?.dano ?? 0; }
  for (const u of ordem.slice(1)) { tirar(j, u.uid); delete j.unidades[u.uid]; }
  if (!ondeEsta(j, fica.uid)) paraOBanco(j, fica.uid);
  fica.estrela = nova;
  fica.itens = [];
  juntarItens(j, fica, itens);
  if (vida || dano) fica.bonus = { vida, dano };
  const opcoes = formasDaEvolucao(S().campeao(fica.campeao), formas, nova);
  if (opcoes.length === 1) fica.forma = opcoes[0]!;
  else if (j.bot) fica.forma = opcoes[rngDa(p).int(opcoes.length)]!;
  else {
    fica.forma = opcoes[0]!;
    const escolha = { uid: fica.uid, opcoes };
    if (!j.escolhaPendente) j.escolhaPendente = escolha;
    else (j.escolhasFila ??= []).push(escolha);
  }
  ajustarUlt(fica);
}

/** Faz todas as evoluções possíveis, em cadeia. Unidade esperando escolha de forma não evolui até escolher. */
export function verificarEvolucoes(p: Partida, j: Jogador): void {
  for (let guarda = 0; guarda < 50; guarda++) {
    const pendentes = uidsPendentes(j);
    let fundiu = false;
    for (const estrela of [1, 2] as const) {
      const grupos = new Map<string, Unidade[]>();
      for (const u of todasUnidades(j)) {
        if (u.estrela !== estrela || pendentes.has(u.uid)) continue;
        const g = grupos.get(u.campeao);
        if (g) g.push(u); else grupos.set(u.campeao, [u]);
      }
      for (const us of grupos.values()) {
        if (us.length < 3) continue;
        fundir(p, j, ordemDeFicar(j, us).slice(0, 3), (estrela + 1) as Estrela);
        fundiu = true;
        break;
      }
      if (fundiu) break;
    }
    if (!fundiu) break;
  }
  arrumarStands(j);
}

/** Tira das escolhas pendentes as unidades que não existem mais (vendidas). */
export function limparEscolhas(j: Jogador): void {
  const existe = (e: { uid: number }) => j.unidades[e.uid] != null;
  const todas = [j.escolhaPendente, ...(j.escolhasFila ?? [])].filter(e => e != null).filter(existe);
  j.escolhaPendente = todas.shift();
  j.escolhasFila = todas.length ? todas : undefined;
}

/** O jogador escolhe a forma da evolução pendente; a cadeia de evolução continua. */
export function escolherForma(p: Partida, j: Jogador, forma: string): string | null {
  limparEscolhas(j);
  const e = j.escolhaPendente;
  if (!e) return 'Nenhuma evolução pra escolher';
  if (!e.opcoes.includes(forma)) return 'Essa forma não é uma das opções';
  const u = j.unidades[e.uid]!;
  u.forma = forma;
  ajustarUlt(u);
  j.escolhaPendente = j.escolhasFila?.shift();
  if (!j.escolhasFila?.length) j.escolhasFila = undefined;
  verificarEvolucoes(p, j);
  return null;
}

/** Sorteia as escolhas que ficaram sem resposta (fim do planejamento). */
export function sortearEscolhas(p: Partida, j: Jogador): void {
  for (let guarda = 0; guarda < 20; guarda++) {
    limparEscolhas(j);
    const e = j.escolhaPendente;
    if (!e) return;
    escolherForma(p, j, e.opcoes[rngDa(p).int(e.opcoes.length)]!);
  }
}
