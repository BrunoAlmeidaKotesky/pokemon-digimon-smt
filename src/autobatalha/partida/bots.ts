// Bots: jogam no começo de cada planejamento, determinísticos pela semente. Não são bons, só coerentes: escolhem
// 1 ou 2 traços pelas primeiras unidades, compram o que encaixa ou evolui, sobem de nível em pontos fixos, guardam
// 50 de ouro pelos juros e depois rolam, tanques e corpo a corpo na frente e alcance atrás, itens no mais forte,
// Stand preso a um aliado. A dificuldade (Partida.dificuldade) muda o nível alvo, quanto rolam, se seguem os traços
// e se posicionam e equipam com cuidado.
import { S } from '../dados';
import type { Rng } from '../rng';
import type { Dificuldade, Jogador, Partida, Unidade } from '../tipos';
import { COLUNAS, LINHAS_DONO } from '../tipos';
import { CUSTO_ATUALIZAR, CUSTO_XP, VAGAS_BANCO } from './constantes';
import { rngDa } from './sorteio';
import {
  copias, ehStand, forca, limiteTabuleiro, ondeEsta, tracosDe, unidadesNoBanco, unidadesNoTabuleiro, vagaLivreBanco,
  vivos,
} from './consultas';
import { sortearEscolhas } from './evolucao';
import { equiparItem } from './itens';
import { atualizar, comprarVaga, comprarXpDe, venderUnidade } from './loja';
import { casaPreferida, casasLivresAoLado, colocar, podeSegurar } from './tabuleiro';

/** Pontos fixos de subir de nível (dificuldade normal): [estágio, rodada, nível]. */
export const NIVEIS_DOS_BOTS: readonly (readonly [number, number, number])[] = [
  [2, 1, 4], [2, 5, 5], [3, 2, 6], [4, 1, 7], [5, 1, 8], [6, 1, 9], [7, 1, 10],
];
/** ouro que o bot guarda pelos juros antes de rolar */
export const OURO_GUARDADO = 50;

/** O que muda com a dificuldade. */
export interface PerfilBot {
  /** somado ao nível alvo dos pontos fixos */
  nivelExtra: number;
  /** rolagens por planejamento, no máximo */
  maxRolagens: number;
  /** chance de, numa vaga da loja, ignorar o critério (traço/evolução) e comprar qualquer coisa que caiba */
  compraAoAcaso: number;
  /** chance de não comprar uma carta que ele quer */
  esquece: number;
  /** posiciona sem pensar (frente/trás ao acaso) */
  posicionaAoAcaso: boolean;
  /** itens em quem vier, não no mais forte */
  itensAoAcaso: boolean;
}
export const PERFIS_BOT: Record<Dificuldade, PerfilBot> = {
  facil: { nivelExtra: -1, maxRolagens: 2, compraAoAcaso: 0.35, esquece: 0.3, posicionaAoAcaso: true, itensAoAcaso: true },
  normal: { nivelExtra: 0, maxRolagens: 12, compraAoAcaso: 0, esquece: 0, posicionaAoAcaso: false, itensAoAcaso: false },
  dificil: { nivelExtra: 1, maxRolagens: 20, compraAoAcaso: 0, esquece: 0, posicionaAoAcaso: false, itensAoAcaso: false },
};
export const perfilDa = (p: Partida): PerfilBot => PERFIS_BOT[p.dificuldade ?? 'normal'];

export function nivelAlvo(estagio: number, rodada: number, extra = 0): number {
  let n = 1;
  for (const [e, r, nivel] of NIVEIS_DOS_BOTS) if (estagio > e || (estagio === e && rodada >= r)) n = nivel;
  return n > 1 ? Math.max(1, n + extra) : n;
}

/** Quanto o bot não gasta: nada no estágio 1 ou com pouca vida; no fim do jogo, 20; senão a dezena dos juros (até 50). */
function reserva(p: Partida, j: Jogador): number {
  if (p.estagio <= 1 || j.vida <= 30) return 0;
  if (p.estagio >= 5) return 20;
  return Math.min(OURO_GUARDADO, 10 * Math.floor(j.ouro / 10));
}
const podeRolar = (p: Partida, j: Jogador) =>
  p.estagio >= 2 && j.ouro - CUSTO_ATUALIZAR >= reserva(p, j) &&
  (j.ouro >= OURO_GUARDADO + CUSTO_ATUALIZAR || p.estagio >= 5 || j.vida <= 30);

const temAlvo = (j: Jogador, campeao: string) => (j.alvos ?? []).some(t => tracosDe(campeao).includes(t));

/** Escolhe (ou troca) os traços do bot pelos campeões que ele tem. */
export function escolherAlvos(j: Jogador): void {
  const campeoes = new Set(Object.values(j.unidades).map(u => u.campeao));
  if (campeoes.size < 3 && !j.alvos?.length) return;
  const conta = new Map<string, number>();
  for (const c of campeoes) for (const t of tracosDe(c)) conta.set(t, (conta.get(t) ?? 0) + 1);
  const ordem = [...conta].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const melhor = ordem[0];
  if (!melhor) return;
  const atual = j.alvos ?? [];
  const forcaAtual = atual.length ? conta.get(atual[0]!) ?? 0 : -1;
  if (!atual.length || (!atual.includes(melhor[0]) && melhor[1] >= forcaAtual + 2)) {
    const segundo = ordem[1];
    j.alvos = segundo && segundo[1] >= 2 ? [melhor[0], segundo[0]] : [melhor[0]];
  }
}

/** Nota do bot pra uma unidade: força, traço que ele quer e par pra evoluir. */
function nota(j: Jogador, u: Unidade): number {
  return forca(u) + (temAlvo(j, u.campeao) ? 2 : 0) + (copias(j, u.campeao, u.estrela) >= 2 ? 1 : 0);
}

/** Vende a unidade mais fraca do banco que o bot não quer (pra abrir vaga). */
function abrirVaga(p: Partida, j: Jogador, exceto: string): boolean {
  const descartaveis = unidadesNoBanco(j)
    .filter(u => u.campeao !== exceto && !temAlvo(j, u.campeao) && copias(j, u.campeao, u.estrela) < 2)
    .sort((a, b) => nota(j, a) - nota(j, b));
  const u = descartaveis[0];
  if (!u) return false;
  venderUnidade(p, j, u.uid);
  return true;
}

function comprarDaLoja(p: Partida, j: Jogador, perfil: PerfilBot, rng: Rng): void {
  const temUsuario = () => Object.values(j.unidades).some(u => !ehStand(u) && S().campeao(u.campeao).fr !== 'jojo');
  for (let i = 0; i < j.loja.length; i++) {
    const id = j.loja[i];
    if (id == null) continue;
    const c = S().campeao(id);
    const meus = Object.values(j.unidades).filter(u => u.campeao === id);
    if (meus.some(u => u.estrela === 3)) continue;
    const evolui = copias(j, id, 1) >= 2;
    const aoAcaso = perfil.compraAoAcaso > 0 && rng.chance(perfil.compraAoAcaso);
    const quer = aoAcaso || evolui || meus.length > 0 || temAlvo(j, id) ||
      (!j.alvos?.length && Object.keys(j.unidades).length < j.nivel + 3);
    if (!quer || (c.stand && !temUsuario())) continue;
    if (perfil.esquece > 0 && rng.chance(perfil.esquece)) continue;
    if (j.ouro - c.custo < (evolui ? 0 : reserva(p, j))) continue;
    if (vagaLivreBanco(j) < 0 && !evolui && !abrirVaga(p, j, id)) continue;
    comprarVaga(p, j, i);
  }
}

/** Monta o tabuleiro do zero: os melhores até o limite (corpo a corpo na frente, alcance atrás), Stands presos a
 *  um aliado, o resto no banco (sem vaga, vende o mais fraco). */
export function posicionar(p: Partida, j: Jogador, perfil: PerfilBot = PERFIS_BOT.normal, rng?: Rng): void {
  const todas = Object.values(j.unidades);
  const normais = todas.filter(u => !ehStand(u)).sort((a, b) => nota(j, b) - nota(j, a) || a.uid - b.uid);
  const stands = todas.filter(ehStand).sort((a, b) => nota(j, b) - nota(j, a) || a.uid - b.uid);
  const titulares = normais.slice(0, limiteTabuleiro(j));
  const reservas = normais.slice(limiteTabuleiro(j));
  j.tabuleiro = {};
  j.banco = Array<number | null>(VAGAS_BANCO).fill(null);
  for (const u of titulares) {
    const casa = perfil.posicionaAoAcaso && rng ? casaAoAcaso(j, rng) ?? casaPreferida(j, u) : casaPreferida(j, u);
    if (casa) colocar(j, u.uid, { tipo: 'tabuleiro', casa });
    else reservas.push(u);
  }
  for (const s of stands) {
    s.usuario = undefined;
    let preso = false;
    for (const u of titulares) {
      const onde = ondeEsta(j, u.uid);
      if (onde?.tipo !== 'tabuleiro' || !podeSegurar(j, u, s)) continue;
      const livre = casasLivresAoLado(j, onde.casa)[0];
      if (!livre) continue;
      colocar(j, s.uid, { tipo: 'tabuleiro', casa: livre });
      s.usuario = u.uid;
      preso = true;
      break;
    }
    if (!preso) reservas.push(s);
  }
  reservas.sort((a, b) => nota(j, b) - nota(j, a) || a.uid - b.uid);
  for (const u of reservas) {
    const i = vagaLivreBanco(j);
    if (i >= 0) j.banco[i] = u.uid;
    else venderUnidade(p, j, u.uid);
  }
}

/** Casa livre qualquer da metade do jogador (bot do fácil). */
function casaAoAcaso(j: Jogador, rng: Rng): { col: number; lin: number } | null {
  const livres: { col: number; lin: number }[] = [];
  for (let lin = 0; lin < LINHAS_DONO; lin++) for (let col = 0; col < COLUNAS; col++) {
    if (j.tabuleiro[`${col},${lin}`] == null) livres.push({ col, lin });
  }
  return livres.length ? livres[rng.int(livres.length)]! : null;
}

/** Itens soltos no mais forte do tabuleiro (até 3 cada; componentes viram completos); no fácil, em quem vier. */
export function equiparItens(j: Jogador, perfil: PerfilBot = PERFIS_BOT.normal, rng?: Rng): void {
  const alvos = [...unidadesNoTabuleiro(j, false), ...unidadesNoTabuleiro(j).filter(ehStand)]
    .sort((a, b) => forca(b) - forca(a) || a.uid - b.uid);
  if (perfil.itensAoAcaso && rng) {
    for (let i = alvos.length - 1; i > 0; i--) { const k = rng.int(i + 1); [alvos[i], alvos[k]] = [alvos[k]!, alvos[i]!]; }
  }
  for (let guarda = 0; j.itens.length && guarda < 30; guarda++) {
    let pos = false;
    for (let i = 0; i < j.itens.length && !pos; i++) {
      for (const u of alvos) if (equiparItem(j, i, u.uid) == null) { pos = true; break; }
    }
    if (!pos) break;
  }
}

/** Um bot joga o planejamento inteiro. */
export function jogarBot(p: Partida, j: Jogador): void {
  const perfil = perfilDa(p);
  const rng = rngDa(p);
  sortearEscolhas(p, j);
  escolherAlvos(j);
  const alvo = nivelAlvo(p.estagio, p.rodada, perfil.nivelExtra);
  while (j.nivel < alvo && j.ouro >= CUSTO_XP && comprarXpDe(j) == null) { /* sobe */ }
  comprarDaLoja(p, j, perfil, rng);
  for (let n = 0; n < perfil.maxRolagens && podeRolar(p, j); n++) {
    if (atualizar(p, j)) break;
    comprarDaLoja(p, j, perfil, rng);
  }
  sortearEscolhas(p, j);
  escolherAlvos(j);
  posicionar(p, j, perfil, rng);
  equiparItens(j, perfil, rng);
}

/** Todos os bots vivos jogam. */
export function jogarBots(p: Partida): void {
  for (const j of vivos(p)) if (j.bot) jogarBot(p, j);
}
