// SMT: demônios do pacote npm megaten@2.3.1 (o mesmo de onde vieram src/sources/smt.json e as imagens). O arquivo
// demonData.js é baixado do jsDelivr e lido como TEXTO por um leitor de literal JS daqui (sem require/import/eval:
// código baixado é dado, não programa). persona.mjs usa o mesmo leitor.

import fs from 'node:fs/promises';
import { sleep, UA } from './util.mjs';

const URL_DADOS = 'https://cdn.jsdelivr.net/npm/megaten@2.3.1/dist/demonData.js';

export const JOGOS = { smt5: 'SMT V', p3: 'Persona 3', p4: 'Persona 4', p5: 'Persona 5' };

/** Lê o primeiro `Object.freeze(<literal>)` do texto: objetos, listas, textos, números, null/true/false/undefined. */
function lerLiteral(src) {
  const BS = String.fromCharCode(92);
  let i = src.indexOf('Object.freeze(');
  if (i < 0) throw new Error('demonData.js sem Object.freeze(');
  i += 'Object.freeze('.length;
  const ws = () => { while (/\s/.test(src[i])) i++; };
  const str = () => {
    const q = src[i++];
    let s = '';
    while (src[i] !== q) {
      if (i >= src.length) throw new Error('texto sem fim');
      if (src[i] === BS) {
        i++;
        const e = src[i++];
        s += e === 'n' ? '\n' : e === 't' ? '\t' : e === 'u' ? String.fromCharCode(parseInt(src.slice(i, (i += 4)), 16)) : e;
      } else s += src[i++];
    }
    i++;
    return s;
  };
  const val = () => {
    ws();
    const c = src[i];
    if (c === '{') {
      i++;
      const o = {};
      for (;;) {
        ws();
        if (src[i] === '}') { i++; return o; }
        let k;
        if (src[i] === "'" || src[i] === '"') k = str();
        else {
          const m = /^[A-Za-z_$][\w$]*/.exec(src.slice(i, i + 100));
          if (!m) throw new Error('chave inesperada em ' + i);
          k = m[0];
          i += k.length;
        }
        ws();
        if (src[i] !== ':') throw new Error('esperava ":" em ' + i);
        i++;
        o[k] = val();
        ws();
        if (src[i] === ',') i++;
      }
    }
    if (c === '[') {
      i++;
      const a = [];
      for (;;) {
        ws();
        if (src[i] === ']') { i++; return a; }
        a.push(val());
        ws();
        if (src[i] === ',') i++;
      }
    }
    if (c === "'" || c === '"') return str();
    const m = /^(-?\d+(\.\d+)?|null|true|false|undefined)/.exec(src.slice(i, i + 30));
    if (!m) throw new Error('valor inesperado em ' + i + ': ' + src.slice(i, i + 40));
    i += m[0].length;
    return m[0] === 'null' || m[0] === 'undefined' ? null : m[0] === 'true' ? true : m[0] === 'false' ? false : Number(m[0]);
  };
  return val();
}

let cache;
/** Lista de demônios/personas do megaten (baixada uma vez por execução). */
export function megaten() {
  cache ??= (async () => {
    let ultimo = '';
    for (let t = 1; t <= 4; t++) {
      try {
        const r = await fetch(URL_DADOS, { headers: { 'User-Agent': UA } });
        if (r.ok) {
          const dados = lerLiteral(await r.text());
          if (!Array.isArray(dados) || !dados.length) throw new Error('demonData.js vazio');
          return dados;
        }
        ultimo = String(r.status);
      } catch (e) {
        ultimo = String(e);
      }
      await sleep(1000 * t * t);
    }
    throw new Error(`falhou: ${URL_DADOS} (${ultimo})`);
  })();
  return cache;
}

/** Nomes da lista do site (src/sources/<arquivo>.json, linhas [nome, imagem]) -> registro do megaten. */
export async function porNome(arquivo) {
  const nomes = JSON.parse(await fs.readFile(`src/sources/${arquivo}.json`, 'utf8')).map(r => r[0]);
  const mapa = new Map((await megaten()).map(d => [d.name, d]));
  return nomes.map(n => [n, mapa.get(n)]).filter(([, d]) => d);
}

/** Tira os campos vazios (undefined, null, '', lista vazia). */
export const enxuto = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && !v.length)));

const conhecido = v => (v && v !== 'Unknown' ? v : undefined);

export default {
  chave: 'smt',
  fonte: 'Pacote megaten 2.3.1 (dados de SMT V, Persona 3, 4 e 5)',
  campos: [
    { id: 'jogo', rotulo: 'Jogo' },
    { id: 'raca', rotulo: 'Raça' },
    { id: 'mitologia', rotulo: 'Mitologia' },
    { id: 'etico', rotulo: 'Alinhamento (Lei/Caos)' },
    { id: 'moral', rotulo: 'Alinhamento (Luz/Trevas)' },
    { id: 'arcana', rotulo: 'Arcana' },
    { id: 'afinidade', rotulo: 'Afinidade herdada' },
    { id: 'nivel', rotulo: 'Nível' },
    { id: 'fraco', rotulo: 'Fraqueza' },
  ],
  async gerar() {
    const itens = {};
    for (const [nome, d] of await porNome('smt')) {
      itens[nome] = enxuto({
        jogo: JOGOS[d.game] ?? d.game,
        raca: d.race,
        mitologia: d.origin,
        etico: conhecido(d.alignment?.ethical),
        moral: conhecido(d.alignment?.moral),
        arcana: d.arcana,
        afinidade: d.affinities?.inherit,
        nivel: d.level,
        fraco: d.resistances?.weak,
      });
    }
    return { itens };
  },
};
