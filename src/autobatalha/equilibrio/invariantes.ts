// Invariantes da partida e da luta, conferidos enquanto o playtest simula (partidas.ts): o que precisa ser verdade em
// qualquer jogo, além de "não estourou erro". Violação vira uma linha no relatório (equilibrio.md, seção "Invariantes")
// com quantas vezes aconteceu e um exemplo, em vez de parar a simulação.
import { S } from '../dados';
import { ehComponente, ITENS } from '../conteudo';
import { DURACAO_MAX } from '../combate';
import { deChave, igual, vizinhas } from '../hex';
import * as P from '../partida';
import { COLUNAS, LINHAS, LINHAS_DONO, type EntradaTime, type Jogador, type Partida, type ResultadoLuta, type Unidade } from '../tipos';

/** categoria da violação → quantas vezes e o primeiro exemplo */
export type Violacoes = Map<string, { n: number; exemplo: string }>;

function anotar(v: Violacoes, categoria: string, detalhe: string): void {
  const x = v.get(categoria);
  if (x) x.n++;
  else v.set(categoria, { n: 1, exemplo: detalhe });
}

const inteiro = (x: number) => Number.isInteger(x);
const finitoNaoNegativo = (x: number) => Number.isFinite(x) && x >= 0;

/** Quantos componentes valem os itens do jogador (componente = 1, completo = 2), nas unidades e soltos. */
export function massaDeItens(j: Jogador): number {
  const valor = (id: string) => (ehComponente(id) ? 1 : 2);
  let n = j.itens.reduce((s, i) => s + valor(i), 0);
  for (const u of Object.values(j.unidades)) n += u.itens.reduce((s, i) => s + valor(i), 0);
  return n;
}

function conferirUnidade(v: Violacoes, j: Jogador, u: Unidade, onde: string): void {
  const rotulo = `${j.id} uid ${u.uid} (${u.campeao}) ${onde}`;
  if (![1, 2, 3].includes(u.estrela)) anotar(v, 'unidade: estrela inválida', `${rotulo}: ${u.estrela}`);
  let formas: readonly string[] = [];
  try {
    const c = S().campeao(u.campeao);
    formas = c.niveis[Math.min(u.estrela, c.niveis.length) - 1] ?? [];
  } catch { anotar(v, 'unidade: campeão desconhecido', rotulo); }
  if (formas.length && !formas.includes(u.forma)) anotar(v, 'unidade: forma não é da estrela', `${rotulo}: ${u.forma} (★${u.estrela})`);
  if (u.itens.length > P.MAX_ITENS) anotar(v, 'unidade: mais itens que o máximo', `${rotulo}: ${u.itens.join(',')}`);
  for (const i of u.itens) if (!ITENS[i]) anotar(v, 'item: id desconhecido na unidade', `${rotulo}: ${i}`);
  if (u.bonus) for (const x of [u.bonus.vida, u.bonus.dano]) {
    if (x !== undefined && !Number.isFinite(x)) anotar(v, 'unidade: bônus inválido', `${rotulo}: ${JSON.stringify(u.bonus)}`);
  }
}

function conferirTabuleiro(v: Violacoes, j: Jogador): void {
  const vistos = new Set<number>();
  const ocupar = (uid: number, onde: string) => {
    if (vistos.has(uid)) anotar(v, 'unidade em dois lugares', `${j.id} uid ${uid}: ${onde}`);
    vistos.add(uid);
    if (!j.unidades[uid]) anotar(v, 'lugar aponta pra unidade que não existe', `${j.id} uid ${uid}: ${onde}`);
  };
  if (j.banco.length !== P.VAGAS_BANCO) anotar(v, 'banco com tamanho errado', `${j.id}: ${j.banco.length}`);
  for (const uid of j.banco) if (uid != null) ocupar(uid, 'banco');
  for (const [k, uid] of Object.entries(j.tabuleiro)) {
    const c = deChave(k);
    if (!inteiro(c.col) || !inteiro(c.lin) || c.col < 0 || c.col >= COLUNAS || c.lin < 0 || c.lin >= LINHAS_DONO) anotar(v, 'casa fora da metade do tabuleiro', `${j.id}: ${k}`);
    ocupar(uid, `tabuleiro ${k}`);
  }
  for (const u of Object.values(j.unidades)) {
    conferirUnidade(v, j, u, vistos.has(u.uid) ? '' : '(fora do banco e do tabuleiro)');
    if (!vistos.has(u.uid)) anotar(v, 'unidade fora do banco e do tabuleiro', `${j.id} uid ${u.uid} ${u.campeao}`);
    if (u.uid !== Number(Object.keys(j.unidades).find(k => j.unidades[Number(k)] === u))) anotar(v, 'uid não bate com a chave', `${j.id} uid ${u.uid}`);
  }
}

function conferirStands(v: Violacoes, j: Jogador): void {
  const presos = new Set<number>();
  for (const u of Object.values(j.unidades)) {
    const stand = S().campeao(u.campeao).stand === true;
    const naoTabuleiro = !Object.values(j.tabuleiro).includes(u.uid);
    if (!stand) {
      if (u.usuario != null) anotar(v, 'unidade normal com usuário', `${j.id} uid ${u.uid}`);
      continue;
    }
    if (naoTabuleiro) {
      if (u.usuario != null) anotar(v, 'Stand fora do tabuleiro preso a alguém', `${j.id} uid ${u.uid}`);
      continue;
    }
    const usuario = u.usuario != null ? j.unidades[u.usuario] : undefined;
    if (!usuario) { anotar(v, 'Stand no tabuleiro sem usuário', `${j.id} uid ${u.uid} ${u.campeao}`); continue; }
    if (S().campeao(usuario.campeao).stand) anotar(v, 'Stand preso a outro Stand', `${j.id} uid ${u.uid}`);
    if (P.origemDe(usuario) === P.origemDe(u)) anotar(v, 'Stand preso a unidade da mesma origem', `${j.id} uid ${u.uid}`);
    if (presos.has(usuario.uid)) anotar(v, 'dois Stands no mesmo usuário', `${j.id} usuário ${usuario.uid}`);
    presos.add(usuario.uid);
    const casas = Object.entries(j.tabuleiro);
    const casaS = casas.find(([, id]) => id === u.uid)?.[0];
    const casaU = casas.find(([, id]) => id === usuario.uid)?.[0];
    if (!casaU || !casaS) anotar(v, 'usuário do Stand fora do tabuleiro', `${j.id} uid ${u.uid}`);
    else if (!vizinhas(deChave(casaU), LINHAS_DONO).some(c => igual(c, deChave(casaS)))) anotar(v, 'Stand longe do usuário', `${j.id} uid ${u.uid}: ${casaS} / ${casaU}`);
  }
}

/** Confere pool, ouro, vida, nível e os lugares de cada jogador. `momento` só entra no texto do exemplo. */
export function conferirPartida(p: Partida, v: Violacoes, momento: string): void {
  const donos = new Map<string, number>();
  for (const j of p.jogadores) {
    const vivo = P.estaVivo(j);
    const quem = `${momento} ${p.estagio}-${p.rodada} ${j.id}`;
    if (!Number.isFinite(j.vida) || j.vida > P.VIDA_INICIAL) anotar(v, 'vida inválida', `${quem}: ${j.vida}`);
    // o vencedor (colocação 1) termina com vida e com as unidades; quem foi eliminado devolveu tudo ao pool
    if (j.colocacao != null && j.colocacao !== 1 && j.vida > 0) anotar(v, 'eliminado com vida', `${quem}: ${j.vida}`);
    if (!inteiro(j.ouro) || j.ouro < 0) anotar(v, 'ouro inválido', `${quem}: ${j.ouro}`);
    if (!inteiro(j.nivel) || j.nivel < 1 || j.nivel > P.NIVEL_MAXIMO) anotar(v, 'nível inválido', `${quem}: ${j.nivel}`);
    if (!Number.isFinite(j.xp) || j.xp < 0 || (j.nivel < P.NIVEL_MAXIMO && j.xp >= P.xpParaProximo(j.nivel))) anotar(v, 'xp inválido', `${quem}: nível ${j.nivel}, xp ${j.xp}`);
    if (!inteiro(j.almas) || j.almas < 0) anotar(v, 'almas inválidas', `${quem}: ${j.almas}`);
    if (!inteiro(j.sequencia)) anotar(v, 'sequência inválida', `${quem}: ${j.sequencia}`);
    for (const i of j.itens) if (!ITENS[i]) anotar(v, 'item: id desconhecido nos soltos', `${quem}: ${i}`);
    if (!vivo) continue;
    if (j.vida <= 0) anotar(v, 'vivo sem vida', `${quem}: ${j.vida}`);
    conferirTabuleiro(v, j);
    conferirStands(v, j);
    for (const u of Object.values(j.unidades)) donos.set(u.campeao, (donos.get(u.campeao) ?? 0) + P.COPIAS_POR_ESTRELA[u.estrela]);
    if (j.loja.length && j.loja.length !== P.VAGAS_LOJA) anotar(v, 'loja com tamanho errado', `${quem}: ${j.loja.length}`);
    for (const id of j.loja) if (id != null && (() => { try { return !S().campeao(id); } catch { return true; } })()) anotar(v, 'loja com campeão desconhecido', `${quem}: ${id}`);
  }
  if (P.acabou(p)) return; // fim de jogo: o vencedor não devolve as unidades, e a conta do pool não vale mais
  // pool: cada campeão soma o que está no pool, com os vivos e no carrossel aberto; nada negativo nem a mais
  const noCarrossel = new Map<string, number>();
  for (const o of p.carrossel?.opcoes ?? []) if (o.pegou == null) noCarrossel.set(o.campeao, (noCarrossel.get(o.campeao) ?? 0) + 1);
  for (const c of S().dados.campeoes) {
    if (c.id.includes('~')) continue; // sintéticos do playtest nunca estão no pool
    const noPool = p.pool[c.id] ?? 0;
    if (!inteiro(noPool) || noPool < 0) anotar(v, 'pool inválido', `${momento} ${c.id}: ${noPool}`);
    const total = noPool + (donos.get(c.id) ?? 0) + (noCarrossel.get(c.id) ?? 0);
    if (total !== P.COPIAS_POR_CUSTO[c.custo]) {
      anotar(v, 'pool não fecha', `${momento} ${p.estagio}-${p.rodada} ${c.id}: pool ${noPool} + jogadores ${donos.get(c.id) ?? 0} + carrossel ${noCarrossel.get(c.id) ?? 0} ≠ ${P.COPIAS_POR_CUSTO[c.custo]}`);
    }
  }
}

/** Antes da luta: o que entra em campo respeita o limite e os Stands lutam com o usuário. */
export function conferirTimes(p: Partida, v: Violacoes): void {
  for (const j of P.vivos(p)) {
    const t = P.montarTime(j);
    const quem = `${p.estagio}-${p.rodada} ${j.id}`;
    if (t.lutadores.length > P.limiteTabuleiro(j)) anotar(v, 'unidades em campo acima do limite', `${quem}: ${t.lutadores.length} > ${P.limiteTabuleiro(j)}`);
    const uids = new Set(t.lutadores.flatMap(l => (l.unidade ? [l.unidade.uid] : [])));
    for (const l of t.lutadores) {
      const u = l.unidade;
      if (u && S().campeao(u.campeao).stand && (u.usuario == null || !uids.has(u.usuario))) anotar(v, 'Stand lutando sem usuário no time', `${quem} uid ${u.uid}`);
    }
    if (Object.keys(j.tabuleiro).length > P.limiteTabuleiro(j) && j.bot) anotar(v, 'bot com tabuleiro acima do limite', `${quem}: ${Object.keys(j.tabuleiro).length}`);
  }
}

/** Confere o resultado de uma luta. `fim` = ela acabou antes do tempo: o lado derrotado não tem ninguém que decide vivo. */
export function conferirLuta(a: EntradaTime, b: EntradaTime, r: ResultadoLuta, v: Violacoes): void {
  const casas = (t: EntradaTime, nome: string) => {
    const vistas = new Set<string>();
    for (const l of t.lutadores) {
      const k = `${l.casa.col},${l.casa.lin}`;
      if (vistas.has(k)) anotar(v, 'duas unidades na mesma casa na entrada', `${nome}: ${k}`);
      vistas.add(k);
    }
  };
  casas(a, 'a');
  casas(b, 'b');
  if (!['a', 'b', 'empate'].includes(r.vencedor)) anotar(v, 'luta: vencedor inválido', String(r.vencedor));
  if (!(r.duracao >= 0 && r.duracao <= DURACAO_MAX + 1e-9)) anotar(v, 'luta: duração inválida', String(r.duracao));
  const conta = (rec: Record<string, number>, nome: string) => {
    for (const [k, x] of Object.entries(rec)) if (!finitoNaoNegativo(x)) anotar(v, `luta: ${nome} inválido`, `${k}: ${x}`);
  };
  conta(r.dano, 'dano');
  conta(r.abates, 'abates');
  if (!finitoNaoNegativo(r.ouro.a) || !finitoNaoNegativo(r.ouro.b)) anotar(v, 'luta: ouro inválido', JSON.stringify(r.ouro));
  const decisivos = (ids: readonly string[]) => ids.filter(id => !id.includes('~'));
  if (r.duracao < DURACAO_MAX - 1e-9) {
    if (r.vencedor === 'a' && decisivos(r.vivosB).length) anotar(v, 'luta acabou com perdedor vivo', `vivos B: ${r.vivosB.join(',')}`);
    if (r.vencedor === 'b' && decisivos(r.vivosA).length) anotar(v, 'luta acabou com perdedor vivo', `vivos A: ${r.vivosA.join(',')}`);
    if (r.vencedor === 'empate' && (decisivos(r.vivosA).length || decisivos(r.vivosB).length)) anotar(v, 'empate antes do tempo com alguém vivo', `${r.vivosA.join(',')} / ${r.vivosB.join(',')}`);
  }
}

/** Confere a gravação de uma luta: casas dentro do tabuleiro, ninguém vivo na mesma casa, vida e mana no limite. */
export function conferirGravacao(r: ResultadoLuta, v: Violacoes): void {
  const g = r.gravacao;
  if (!g) return;
  let tAnterior = -1;
  const max = new Map(g.inicial.map(e => [e.id, e.vidaMax]));
  for (const q of g.quadros) {
    if (q.t < tAnterior) anotar(v, 'gravação: tempo volta', `${q.t} depois de ${tAnterior}`);
    tAnterior = q.t;
    for (const [id, m] of Object.entries(q.max ?? {})) max.set(id, m[0]);
    const casas = new Map<string, string>();
    for (const [id, [col, lin, vida, escudo, mana, vivo]] of Object.entries(q.u)) {
      if (col < 0 || col >= COLUNAS || lin < 0 || lin >= LINHAS) anotar(v, 'gravação: casa fora do tabuleiro', `${id} em ${col},${lin} (t=${q.t})`);
      if (!finitoNaoNegativo(vida) || !finitoNaoNegativo(escudo) || !finitoNaoNegativo(mana)) anotar(v, 'gravação: vida, escudo ou mana inválidos', `${id}: ${vida}/${escudo}/${mana} (t=${q.t})`);
      if (!vivo) continue;
      const m = max.get(id);
      if (m !== undefined && vida > m + 1) anotar(v, 'gravação: vida acima do máximo', `${id}: ${vida} > ${m} (t=${q.t})`);
      const k = `${col},${lin}`;
      const outro = casas.get(k);
      if (outro) anotar(v, 'gravação: dois vivos na mesma casa', `${outro} e ${id} em ${k} (t=${q.t})`);
      casas.set(k, id);
    }
  }
}
