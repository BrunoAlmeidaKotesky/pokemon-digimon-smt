// Parâmetros da Autobatalha online: o código da sala no link (?autobatalha=ABCD, separado do ?sala= da aba Online), os
// ids dos lugares humanos e o modo de teste com o transporte local (?transporte=local&jogador=N, várias abas do mesmo
// navegador como pessoas diferentes, como a aba Online faz). Sem efeito nenhum ao importar.

const busca = (): URLSearchParams => new URLSearchParams(globalThis.location?.search ?? '');

/** parâmetro do link da sala */
export const PARAM_SALA = 'autobatalha';
/** prefixo do código no transporte (o id no PeerJS fica `qvp-sala-ab-ABCD`): não bate com as salas da aba Online */
export const PREFIXO_TRANSPORTE = 'ab-';
/** letras do código (sem I e O, como a aba Online) */
export const LETRAS_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const TAMANHO_CODIGO = 4;

/** transporte local (BroadcastChannel), só pra testes */
export const TRANSPORTE_LOCAL = busca().get('transporte') === 'local';
/** `?jogador=N` (só com o transporte local): separa o aparelho e a configuração de cada aba nos testes */
export const SUFIXO_TESTE = TRANSPORTE_LOCAL && busca().get('jogador') ? `-${busca().get('jogador')}` : '';

/** Tempos da conexão: ping, quanto sem notícia derruba, espera entre tentativas de voltar e quantas tentativas. */
export interface TemposRede { ping: number; limite: number; espera: number; tentativas: number }
export const TEMPOS_REDE: TemposRede = TRANSPORTE_LOCAL
  ? { ping: 400, limite: 2500, espera: 400, tentativas: 8 }
  : { ping: 4000, limite: 12000, espera: 2000, tentativas: 25 };

/** O código como veio (link ou digitado) só com as letras válidas; '' se não forma um código. */
export function limparCodigo(x: unknown): string {
  if (typeof x !== 'string') return '';
  const c = x.toUpperCase().replace(/[^A-Z]/g, '');
  return c.length === TAMANHO_CODIGO && [...c].every(l => LETRAS_CODIGO.includes(l)) ? c : '';
}

export function novoCodigo(): string {
  return Array.from({ length: TAMANHO_CODIGO }, () => LETRAS_CODIGO[Math.floor(Math.random() * LETRAS_CODIGO.length)]).join('');
}

/** Código da sala no endereço da página ('' = nenhum). */
export const codigoDaUrl = (): string => limparCodigo(busca().get(PARAM_SALA));

/** Link pra mandar pros amigos: a página sem os outros parâmetros, com ?autobatalha=ABCD (e o transporte de teste). */
export function linkDaSala(codigo: string): string {
  const href = globalThis.location?.href;
  if (!href) return `?${PARAM_SALA}=${codigo}`;
  const u = new URL(href);
  u.search = '';
  u.hash = '';
  if (TRANSPORTE_LOCAL) u.searchParams.set('transporte', 'local');
  u.searchParams.set(PARAM_SALA, codigo);
  return u.toString();
}

/** Tira o código do endereço (quem sai da sala não volta pra ela ao recarregar). */
export function tirarSalaDaUrl(): void {
  try {
    const u = new URL(location.href);
    if (!u.searchParams.has(PARAM_SALA)) return;
    u.searchParams.delete(PARAM_SALA);
    history.replaceState(null, '', u.toString());
  } catch { /* sem location (testes) */ }
}

// ---------- lugares humanos ----------

/** id do anfitrião na partida online; os convidados são h2 a h8 */
export const ID_ANFITRIAO = 'h1';
export const MAX_HUMANOS = 8;
/** id do lugar humano n (1 = anfitrião) */
export const idDoLugar = (n: number): string => `h${n}`;
/** "Jogador 3": o nome de quem deixou o nome em branco numa sala online */
export const nomePadraoDoLugar = (id: string): string => `Jogador ${id.replace(/^h/, '')}`;

// ---------- armazenamento ----------

const ls = {
  get(k: string): string | null { try { return globalThis.localStorage?.getItem(k) ?? null; } catch { return null; } },
  set(k: string, v: string): void { try { globalThis.localStorage?.setItem(k, v); } catch { /* sem armazenamento */ } },
};

/** chave da senha deste aparelho (só fica aqui; o anfitrião a usa pra devolver o mesmo lugar a quem cai e volta) */
export const CHAVE_APARELHO = 'pdx-autobatalha-aparelho';

/** Senha deste aparelho na Autobatalha online (criada na primeira vez). Não é dado pessoal: é um número aleatório. */
export function senhaDoAparelho(): string {
  const k = CHAVE_APARELHO + SUFIXO_TESTE;
  let s = ls.get(k);
  if (!s || s.length < 8 || s.length > 64) {
    s = Array.from(crypto.getRandomValues(new Uint32Array(3)), n => n.toString(36)).join('');
    ls.set(k, s);
  }
  return s;
}
