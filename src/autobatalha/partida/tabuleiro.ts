// Banco (9 vagas) e tabuleiro (metade 8 × 4 de cada jogador): mover, trocar, limite e as regras dos Stands.
import { chave, deChave, igual, vizinhas } from '../hex';
import { COLUNAS, LINHAS_DONO, type CasaDono, type Jogador, type Onde, type Unidade } from '../tipos';
import {
  ehStand, forca, limiteTabuleiro, noTabuleiro, ocupante, ondeEsta, origemDe, standDe, standsForaDaVaga, unidadesNoBanco,
  unidadesNoTabuleiro, vagaLivreBanco,
} from './consultas';
import { alcanceDe } from './motor';

// ---------- primitivas (sem regra nenhuma) ----------

/** Tira a unidade de onde estiver (banco ou tabuleiro). */
export function tirar(j: Jogador, uid: number): void {
  const i = j.banco.indexOf(uid);
  if (i >= 0) j.banco[i] = null;
  for (const [k, v] of Object.entries(j.tabuleiro)) if (v === uid) delete j.tabuleiro[k];
}
/** Põe a unidade no lugar (que tem de estar livre). */
export function colocar(j: Jogador, uid: number, onde: Onde): void {
  if (onde.tipo === 'banco') j.banco[onde.i] = uid;
  else j.tabuleiro[chave(onde.casa)] = uid;
}
/** Põe na primeira vaga livre do banco; false = banco cheio (a unidade não muda de lugar). */
export function paraOBanco(j: Jogador, uid: number): boolean {
  const i = vagaLivreBanco(j);
  if (i < 0) return false;
  tirar(j, uid);
  j.banco[i] = uid;
  return true;
}

export const casaLivre = (j: Jogador, c: CasaDono): boolean => j.tabuleiro[chave(c)] == null;
export const dentroDaMetade = (c: CasaDono): boolean =>
  Number.isInteger(c.col) && Number.isInteger(c.lin) && c.col >= 0 && c.col < COLUNAS && c.lin >= 0 && c.lin < LINHAS_DONO;

/** Casas vizinhas livres na metade do jogador, preferindo as de trás (linha maior). */
export function casasLivresAoLado(j: Jogador, c: CasaDono): CasaDono[] {
  return vizinhas(c, LINHAS_DONO).filter(v => casaLivre(j, v)).sort((a, b) => b.lin - a.lin);
}

/** Vagas que o tabuleiro gasta: as unidades normais e os Stands além dos que não ocupam vaga. */
export function contaNoLimite(j: Jogador): number {
  const stands = unidadesNoTabuleiro(j).filter(ehStand).length;
  return unidadesNoTabuleiro(j, false).length + Math.max(0, stands - standsForaDaVaga(j));
}

// ---------- Stands ----------

/** A unidade pode segurar este Stand: não é Stand, é de outra origem e não tem outro Stand. */
export function podeSegurar(j: Jogador, usuario: Unidade, stand: Unidade): boolean {
  if (ehStand(usuario) || origemDe(usuario) === origemDe(stand)) return false;
  const outro = standDe(j, usuario.uid);
  return !outro || outro.uid === stand.uid;
}

/** Stand sai do tabuleiro: solta do usuário e vai pro banco (banco cheio: fica onde está, solto, e não luta). */
export function soltarStand(j: Jogador, s: Unidade): void {
  s.usuario = undefined;
  if (noTabuleiro(j, s.uid)) paraOBanco(j, s.uid);
}

/** Leva o Stand (fora do tabuleiro ou longe) pra uma casa livre ao lado do usuário; sem casa, vai pro banco. */
function standPertoDoUsuario(j: Jogador, s: Unidade): void {
  const casaUsuario = s.usuario != null ? ondeEsta(j, s.usuario) : null;
  if (!casaUsuario || casaUsuario.tipo !== 'tabuleiro') { soltarStand(j, s); return; }
  const livre = casasLivresAoLado(j, casaUsuario.casa)[0];
  if (!livre) { soltarStand(j, s); return; }
  tirar(j, s.uid);
  colocar(j, s.uid, { tipo: 'tabuleiro', casa: livre });
}

/** Confere todos os Stands do tabuleiro: sem usuário válido voltam pro banco; longe do usuário vão pra casa livre
 *  ao lado dele (ou pro banco); dois no mesmo usuário, o segundo volta. Stand no banco nunca tem usuário. */
export function arrumarStands(j: Jogador): void {
  for (const u of unidadesNoBanco(j)) if (ehStand(u)) u.usuario = undefined;
  const usados = new Set<number>();
  for (const s of unidadesNoTabuleiro(j).filter(ehStand)) {
    const usuario = s.usuario != null ? j.unidades[s.usuario] : undefined;
    if (!usuario || !noTabuleiro(j, usuario.uid) || ehStand(usuario) || origemDe(usuario) === origemDe(s) ||
      usados.has(usuario.uid)) {
      soltarStand(j, s);
      continue;
    }
    usados.add(usuario.uid);
    const cs = ondeEsta(j, s.uid), cu = ondeEsta(j, usuario.uid);
    if (cs?.tipo !== 'tabuleiro' || cu?.tipo !== 'tabuleiro') continue;
    const juntos = vizinhas(cu.casa, LINHAS_DONO).some(v => igual(v, cs.casa));
    if (!juntos) standPertoDoUsuario(j, s);
  }
}

/** Stand que acabou de ser posto na casa c: prende no usuário atual (se ainda está ao lado) ou na primeira unidade
 *  elegível em volta. */
function prenderNaCasa(j: Jogador, s: Unidade, c: CasaDono): string | null {
  const candidatos = vizinhas(c, LINHAS_DONO)
    .map(v => j.tabuleiro[chave(v)])
    .filter((uid): uid is number => uid != null)
    .map(uid => j.unidades[uid]!)
    .filter(u => podeSegurar(j, u, s));
  if (!candidatos.length) return 'O Stand tem de ficar ao lado de uma unidade de outra franquia sem Stand';
  s.usuario = (candidatos.find(u => u.uid === s.usuario) ?? candidatos[0]!).uid;
  return null;
}

// ---------- mover ----------

interface Foto { banco: (number | null)[]; tabuleiro: Record<string, number>; usuarios: [Unidade, number | undefined][] }
const fotografar = (j: Jogador): Foto => ({
  banco: [...j.banco], tabuleiro: { ...j.tabuleiro },
  usuarios: Object.values(j.unidades).map(u => [u, u.usuario]),
});
function restaurar(j: Jogador, f: Foto): void {
  j.banco = f.banco;
  j.tabuleiro = f.tabuleiro;
  for (const [u, usuario] of f.usuarios) u.usuario = usuario;
}
const mesmoLugar = (a: Onde, b: Onde) =>
  a.tipo === 'banco' ? b.tipo === 'banco' && a.i === b.i : b.tipo === 'tabuleiro' && igual(a.casa, b.casa);

export const MSG_LIMITE = 'Limite do tabuleiro: suba de nível';

/** Move uma unidade (banco ⇄ tabuleiro, troca com a ocupada). Devolve a mensagem de erro ou null. Nada muda se
 *  der erro. */
export function moverUnidade(j: Jogador, uid: number, para: Onde): string | null {
  const u = j.unidades[uid];
  const de = ondeEsta(j, uid);
  if (!u || !de) return 'Unidade não encontrada';
  if (para.tipo === 'banco' ? !(para.i >= 0 && para.i < j.banco.length) : !dentroDaMetade(para.casa)) return 'Lugar inválido';
  if (mesmoLugar(de, para)) return null;
  const foto = fotografar(j);
  const antes = contaNoLimite(j);
  const erro = ehStand(u) ? moverStand(j, u, de, para) : moverNormal(j, u, de, para);
  if (!erro) arrumarStands(j);
  const depois = contaNoLimite(j);
  const final = erro ?? (depois > limiteTabuleiro(j) && depois > antes ? MSG_LIMITE : null);
  if (final) restaurar(j, foto);
  return final;
}

function moverNormal(j: Jogador, u: Unidade, de: Onde, para: Onde): string | null {
  const outroUid = ocupante(j, para);
  const outro = outroUid != null ? j.unidades[outroUid]! : null;
  tirar(j, u.uid);
  if (outro) tirar(j, outro.uid);
  colocar(j, u.uid, para);
  if (!outro) return null;
  if (ehStand(outro) && para.tipo === 'tabuleiro') {
    // a unidade tomou a casa do Stand: o Stand procura outra casa ao lado do usuário dele
    standPertoDoUsuario(j, outro);
    return null;
  }
  // troca: o outro vai pra onde a unidade estava
  colocar(j, outro.uid, de);
  if (ehStand(outro)) {
    outro.usuario = undefined;
    if (de.tipo === 'tabuleiro') return prenderNaCasa(j, outro, de.casa);
  }
  return null;
}

function moverStand(j: Jogador, s: Unidade, de: Onde, para: Onde): string | null {
  const outroUid = ocupante(j, para);
  const outro = outroUid != null ? j.unidades[outroUid]! : null;
  if (para.tipo === 'banco') {
    tirar(j, s.uid);
    s.usuario = undefined;
    if (outro) {
      tirar(j, outro.uid);
      colocar(j, outro.uid, de);
      if (ehStand(outro) && de.tipo === 'tabuleiro') {
        const e = prenderNaCasa(j, outro, de.casa);
        if (e) return e;
      }
    }
    colocar(j, s.uid, para);
    return null;
  }
  // para o tabuleiro
  if (!outro) {
    tirar(j, s.uid);
    colocar(j, s.uid, para);
    return prenderNaCasa(j, s, para.casa);
  }
  if (!ehStand(outro)) {
    // solto em cima de uma unidade: prende nela e vai pra uma casa livre ao lado
    if (!podeSegurar(j, outro, s)) return 'O Stand precisa de uma unidade de outra franquia sem Stand';
    tirar(j, s.uid);
    const livre = casasLivresAoLado(j, para.casa)[0];
    if (!livre) return 'Não há casa livre ao lado';
    colocar(j, s.uid, { tipo: 'tabuleiro', casa: livre });
    s.usuario = outro.uid;
    return null;
  }
  // em cima de outro Stand: só troca vindo do banco (o outro volta pro banco no lugar deste)
  if (de.tipo !== 'banco') return 'Casa ocupada';
  tirar(j, s.uid);
  tirar(j, outro.uid);
  outro.usuario = undefined;
  colocar(j, outro.uid, de);
  colocar(j, s.uid, para);
  return prenderNaCasa(j, s, para.casa);
}

// ---------- casas preferidas e preencher antes da luta ----------

/** ordem das colunas: do meio pras bordas */
export const COLUNAS_DO_MEIO = [3, 4, 2, 5, 1, 6, 0, 7] as const;

/** Linhas preferidas pelo alcance: corpo a corpo na frente, alcance 2 no meio, quem atira de longe atrás. */
export function linhasPorAlcance(alcance: number): number[] {
  if (alcance <= 1) return [0, 1, 2, 3];
  if (alcance === 2) return [1, 0, 2, 3];
  return [3, 2, 1, 0];
}

/** Primeira casa livre boa pra unidade (pelo alcance). */
export function casaPreferida(j: Jogador, u: Unidade): CasaDono | null {
  for (const lin of linhasPorAlcance(alcanceDe(u))) {
    for (const col of COLUNAS_DO_MEIO) if (casaLivre(j, { col, lin })) return { col, lin };
  }
  return null;
}

/** Antes da luta: Stands sem usuário voltam pro banco, o excesso (acima do limite) volta pro banco e as vagas
 *  sobrando são preenchidas com o banco (maior custo/estrela primeiro). */
export function prepararTabuleiro(j: Jogador): void {
  arrumarStands(j);
  const lim = limiteTabuleiro(j);
  // excesso: os mais fracos voltam (Stand só entra na conta quando passa dos que não ocupam vaga)
  while (contaNoLimite(j) > lim) {
    const stands = unidadesNoTabuleiro(j).filter(ehStand);
    const candidatos = [...unidadesNoTabuleiro(j, false), ...(stands.length > standsForaDaVaga(j) ? stands : [])];
    const u = candidatos.sort((a, b) => forca(a) - forca(b))[0];
    if (!u || !paraOBanco(j, u.uid)) break;
    arrumarStands(j);
  }
  // preencher
  const banco = unidadesNoBanco(j).filter(u => !ehStand(u)).sort((a, b) => forca(b) - forca(a));
  for (const u of banco) {
    if (contaNoLimite(j) >= lim) break;
    const casa = casaPreferida(j, u);
    if (!casa) break;
    tirar(j, u.uid);
    colocar(j, u.uid, { tipo: 'tabuleiro', casa });
  }
  arrumarStands(j);
}

/** Lista as casas ocupadas como CasaDono (pra tela e testes). */
export const casasOcupadas = (j: Jogador): CasaDono[] => Object.keys(j.tabuleiro).map(deChave);
