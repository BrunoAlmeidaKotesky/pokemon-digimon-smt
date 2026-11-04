// Versão do jogo pro aperto de mão da sala online: a luta do convidado é reproduzida no navegador dele com o mesmo
// motor e o mesmo set, então anfitrião e convidado precisam estar na mesma versão. Junta a versão do protocolo, a do
// código (carimbo do build, posto pelo vite.config.ts em __VERSAO_CODIGO__) e um hash do set (public/autobatalha/set1.json).
import { S } from '../dados';

declare const __VERSAO_CODIGO__: string | undefined;

/** sobe quando as mensagens mudam de formato */
export const VERSAO_PROTOCOLO = 1;

/** Carimbo do build (o mesmo pra quem abriu o site publicado na mesma versão); 'dev' sem o vite.config. */
export function versaoDoCodigo(): string {
  return typeof __VERSAO_CODIGO__ === 'string' && __VERSAO_CODIGO__ ? __VERSAO_CODIGO__ : 'dev';
}

/** FNV-1a de 32 bits (base 36). */
export function hashTexto(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

let doSet: unknown = null;
let hashSet = '';
/** Hash e tamanho do set carregado (calculado uma vez por set). */
export function hashDoSet(): string {
  const d = S().dados;
  if (doSet !== d) {
    const texto = JSON.stringify(d);
    hashSet = `${hashTexto(texto)}.${texto.length.toString(36)}`;
    doSet = d;
  }
  return hashSet;
}

/** A versão que vai no aperto de mão. */
export const versaoDoJogo = (): string => `p${VERSAO_PROTOCOLO}|${versaoDoCodigo()}|${hashDoSet()}`;
