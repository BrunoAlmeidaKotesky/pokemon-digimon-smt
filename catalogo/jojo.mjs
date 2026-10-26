// JoJo: Stands da JoJo Wiki (jojowiki.com), as mesmas páginas da lista do site (src/sources/jojo.ts). As informações
// vêm das categorias da página e da ficha `{{Stand Infobox}}` (campo `type` com os códigos `{{ST|...}}`, normalizados
// como na `Template:ST` da wiki). bakugan.mjs usa os ajudantes de wiki daqui.

import { chunks, sleep, wiki } from './util.mjs';

const API = 'https://jojowiki.com/api.php';
const CATEGORIAS = ['Part 3 Stands', 'Part 4 Stands', 'Part 5 Stands', 'Part 6 Stands', 'Part 7 Stands', 'Part 8 Stands', 'Part 9 Stands',
  'Light Novel Stands', 'Other Stands', 'Thus Spoke Kishibe Rohan Stands', 'Evolved Stands'];

/**
 * Páginas da lista do site: segue o gerador como collectPages (src/sources/mediawiki.ts) e filtra como wikiItems (com
 * imagem, sem "/" no título, sem "List of"). Página que veio com imagem em qualquer resposta conta (o site junta as
 * respostas num Map e pode ficar com qualquer uma). Devolve Map pageid -> título.
 */
export async function paginasDoSite(api, consultas) {
  const titulos = new Map();
  const comImagem = new Set();
  for (const params of consultas) {
    let cont = {};
    do {
      const j = await wiki(api, { ...params, prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '400', pilimit: '500', ...cont });
      for (const p of Object.values(j.query?.pages ?? {})) {
        titulos.set(p.pageid, p.title);
        if (p.thumbnail) comImagem.add(p.pageid);
      }
      cont = j.continue ?? null;
      await sleep(200);
    } while (cont);
  }
  return new Map([...titulos].filter(([id, t]) => comImagem.has(id) && !t.includes('/') && !/^List of/i.test(t)));
}

/** Categorias visíveis e wikitext de cada página, 50 por pedido. Devolve Map pageid -> { cats, texto }. */
export async function detalhesWiki(api, ids) {
  const out = new Map(ids.map(id => [id, { cats: [], texto: '' }]));
  for (const lote of chunks(ids, 50)) {
    let cont = {};
    do {
      const j = await wiki(api, { action: 'query', pageids: lote.join('|'), prop: 'categories', cllimit: 'max', clshow: '!hidden', ...cont });
      for (const p of Object.values(j.query?.pages ?? {})) out.get(p.pageid)?.cats.push(...(p.categories ?? []).map(c => c.title.replace(/^Category:/, '')));
      cont = j.continue?.clcontinue ? j.continue : null;
      await sleep(200);
    } while (cont);
    const j = await wiki(api, { action: 'query', pageids: lote.join('|'), prop: 'revisions', rvprop: 'content', rvslots: 'main' });
    for (const p of Object.values(j.query?.pages ?? {})) {
      const e = out.get(p.pageid);
      if (e) e.texto = p.revisions?.[0]?.slots?.main?.['*'] ?? '';
    }
    await sleep(300);
  }
  return out;
}

/** Trecho da primeira ficha `{{<nome>` do wikitext ('' se não tiver). */
export function ficha(texto, nome) {
  const i = texto.search(new RegExp('\\{\\{\\s*' + nome, 'i'));
  return i < 0 ? '' : texto.slice(i, i + 8000);
}

/** Valor bruto do campo `|chave = ...` da ficha (pode ter várias linhas), ou null. */
export function campo(box, chave) {
  const m = new RegExp('\\n\\s*\\|\\s*' + chave + '\\s*=([\\s\\S]*?)(?=\\n\\s*\\|\\s*[\\w ]+?\\s*=|\\n\\s*\\}\\})', 'i').exec(box);
  return m ? m[1].trim() : null;
}

/** Tira <ref>, comentários e predefinições ({{...}}, de dentro pra fora). */
export function semNotas(s) {
  let t = s.replace(/<!--[\s\S]*?-->/g, '').replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '');
  for (let antes = ''; antes !== t;) { antes = t; t = t.replace(/\{\{[^{}]*\}\}/g, ''); }
  return t;
}

/** Parâmetros da primeira `{{<nome>|...}}` do texto (com as predefinições de dentro), ou ''. */
function predefinicao(texto, nome) {
  const m = new RegExp('\\{\\{\\s*' + nome + '\\s*\\|').exec(texto);
  if (!m) return '';
  const ini = m.index + m[0].length;
  let nivel = 1;
  for (let i = ini; i < texto.length - 1; i++) {
    const par = texto.slice(i, i + 2);
    if (par === '{{') { nivel++; i++; } else if (par === '}}') {
      if (--nivel === 0) return texto.slice(ini, i);
      i++;
    }
  }
  return '';
}

/** Destinos dos links [[...]] do texto, sem "#seção". */
export const links = s => [...s.matchAll(/\[\[([^\]|#]+)/g)].map(m => m[1].trim()).filter(x => !/^(File|Image|Category):/i.test(x));

/** Lista sem repetidos e campos vazios fora. */
export const enxuto = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && !v.length)));

// Template:ST: código -> nome (o nome da seção de "Stand Types" pra onde o código aponta)
const ST = {
  Close: 'Close-Range', 'Close-Range': 'Close-Range', Long: 'Long-Range', 'Long-Range': 'Long-Range', Auto: 'Automatic',
  Automatic: 'Automatic', Irrelevant: 'Range Irrelevant', 'Range Irrelevant': 'Range Irrelevant', Integrated: 'Range Irrelevant',
  NH: 'Natural Humanoid', 'Natural Humanoid': 'Natural Humanoid', AH: 'Artificial Humanoid', 'Artificial Humanoid': 'Artificial Humanoid',
  NNH: 'Natural Non-Humanoid', 'Natural Non-Humanoid': 'Natural Non-Humanoid', ANH: 'Artificial Non-Humanoid',
  'Artificial Non-Humanoid': 'Artificial Non-Humanoid', PH: 'Phenomenon', Phenomenon: 'Phenomenon', Materialized: 'Materialized',
  Bound: 'Materialized', 'Psychological Assault': 'Psychological Assault', Psychological: 'Psychological Assault',
  Psycho: 'Psychological Assault', Foresight: 'Foresight', Search: 'Reconnaissance', Reconnaissance: 'Reconnaissance',
  Recon: 'Reconnaissance', 'Multi-User': 'Multi-User', Evolved: 'Evolved', Requiem: 'Evolved', Sentient: 'Sentient',
  'Multi-Unit': 'Multi-Unit',
};
const ALCANCE = ['Close-Range', 'Long-Range', 'Automatic', 'Range Irrelevant'];
const FORMA = ['Natural Humanoid', 'Artificial Humanoid', 'Natural Non-Humanoid', 'Artificial Non-Humanoid', 'Phenomenon'];
// categorias "... Stands" que são tipo de Stand, não a obra onde ele aparece
const NAO_OBRA = /^(Close-Range|Long Distance|Long-Range|Automatic|Bound|Materialized|Sentient|Multi-User|Multi-Unit|Evolved|Unnamed|Range Irrelevant|Psychological Assault|Reconnaissance|Foresight|(Natural|Artificial) (Non-)?Humanoid|Phenomenon) Stands$/;
const STATS = ['power', 'speed', 'range', 'stamina', 'precision', 'potential'];

const uniq = a => [...new Set(a)];

export default {
  chave: 'jojo',
  fonte: 'JoJo Wiki (jojowiki.com)',
  campos: [
    { id: 'parte', rotulo: 'Parte / obra' },
    { id: 'alcance', rotulo: 'Alcance' },
    { id: 'forma', rotulo: 'Forma' },
    { id: 'mecanica', rotulo: 'Mecânica' },
    { id: 'usuario', rotulo: 'Usuário' },
    { id: 'stats', rotulo: 'Stats (Poder-Velocidade-Alcance-Persistência-Precisão-Potencial)' },
  ],
  async gerar() {
    const paginas = await paginasDoSite(API, CATEGORIAS.map(c =>
      ({ action: 'query', generator: 'categorymembers', gcmtitle: 'Category:' + c, gcmlimit: '500', gcmnamespace: '0' })));
    const det = await detalhesWiki(API, [...paginas.keys()]);
    const itens = {};
    for (const [id, titulo] of paginas) {
      const { cats, texto } = det.get(id);
      const box = ficha(texto, 'Stand Infobox');
      const codigos = [...(campo(box, 'type') ?? '').matchAll(/\{\{\s*ST\s*\|([^}|]+)/g)].map(m => ST[m[1].trim()] ?? m[1].trim());
      const obras = cats.filter(c => / Stands$/.test(c) && !NAO_OBRA.test(c)).map(c => c.replace(/ Stands$/, ''));
      const partes = [...obras.filter(o => /^Part \d$/.test(o)).sort(), ...obras.filter(o => !/^Part \d$/.test(o))];
      const usuario = campo(box, 'user');
      const usuarios = usuario ? links(semNotas(usuario)) : [];
      const st = predefinicao(box, 'Stats');
      const valores = Object.fromEntries(semNotas(st).split('|').map(x => x.split('=').map(s => s.trim())).filter(x => x.length === 2));
      const stats = STATS.map(k => (valores[k] ?? '').replace(/<[^>]*>|\[\[|\]\]/g, '').trim() || '?');
      itens[titulo] = enxuto({
        parte: uniq(partes),
        alcance: uniq(codigos.filter(c => ALCANCE.includes(c))),
        forma: uniq(codigos.filter(c => FORMA.includes(c))),
        mecanica: uniq([...codigos.filter(c => !ALCANCE.includes(c) && !FORMA.includes(c)), ...(cats.includes('Evolved Stands') ? ['Evolved'] : [])]),
        usuario: uniq(usuarios),
        stats: stats.every(x => x === '?') ? undefined : stats.join('-'),
      });
    }
    return { itens };
  },
};
