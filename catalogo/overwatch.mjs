// Overwatch: heróis da OverFast API (os nomes são os do site, src/sources/overwatch.ts), com função e subfunção. A
// Overwatch Wiki completa: afiliação e espécie pelas categorias da página do herói, mais os grupos conhecidos ligados
// na ficha (as categorias atrasam: a Ashe está na Talon e não tem a categoria); afiliação inclui as antigas (a
// Widowmaker é "Talon (formerly)"). País pela bandeira da ficha (`{{flag|xx}}`). A wiki é da Fandom: getJson repete o
// pedido se vier a página do Cloudflare.

import { chunks, getJson, wiki } from './util.mjs';

const OVERFAST = 'https://overfast-api.tekrop.fr';
const WIKI = 'https://overwatch.fandom.com/api.php';

// a OverFast traduz a função (/roles?locale=pt-br) mas não a subfunção
const SUBFUNCAO = {
  bruiser: 'Brigão', initiator: 'Iniciador', stalwart: 'Inabalável', flanker: 'Flanqueador', recon: 'Reconhecimento',
  sharpshooter: 'Atirador de elite', specialist: 'Especialista', medic: 'Médico', survivor: 'Sobrevivente', tactician: 'Tático',
};

// categoria da wiki -> afiliação; categoria terminada em " members"/" employees" fora daqui entra com o nome em inglês
const CAT_AFILIACAO = {
  'Overwatch members': 'Overwatch', 'Talon members': 'Talon', 'Junkers': 'Junkers', 'Shambali members': 'Shambali',
  'Vishkar employees': 'Vishkar', 'Deadlock members': 'Gangue Deadlock', 'Mobile Exo-Force members': 'MEKA',
  'HSI employees': 'Helix', 'Yōkai members': 'Yōkai', 'Null Sector members': 'Setor Nulo', 'The Collective members': 'O Coletivo',
  'Wayfinder Society members': 'Sociedade Wayfinder', 'Phreaks': 'Phreaks', 'Soldier Enhancement Program personnel': 'Programa Supersoldado',
  'Horizon Lunar Colony test subjects': 'Colônia Lunar Horizonte', 'Gladiators': 'Gladiadores', 'Crusaders': 'Cruzados',
};
// link da ficha (campo affiliation) -> afiliação; só os grupos que já são afiliação acima, mais Blackwatch e os clãs
const LINK_AFILIACAO = {
  'Overwatch (group)': 'Overwatch', 'Talon': 'Talon', 'Blackwatch': 'Blackwatch', 'Junkers': 'Junkers', 'Shambali': 'Shambali',
  'Vishkar Corporation': 'Vishkar', 'Deadlock Gang': 'Gangue Deadlock', 'Mobile Exo-Force': 'MEKA', 'Helix Security International': 'Helix',
  'Yōkai (group)': 'Yōkai', 'Null Sector': 'Setor Nulo', 'The Collective': 'O Coletivo', 'Wayfinder Society': 'Sociedade Wayfinder',
  'Phreaks': 'Phreaks', 'Shimada Clan': 'Clã Shimada', 'Hashimoto clan': 'Clã Hashimoto',
};

// código da bandeira ({{flag|xx}}) -> país
const PAIS = {
  au: 'Austrália', br: 'Brasil', ca: 'Canadá', ch: 'Suíça', cn: 'China', de: 'Alemanha', dk: 'Dinamarca', eg: 'Egito',
  en: 'Inglaterra', fr: 'França', gb: 'Reino Unido', ht: 'Haiti', ie: 'Irlanda', in: 'Índia', it: 'Itália', jp: 'Japão',
  japan: 'Japão', kr: 'Coreia do Sul', mx: 'México', nb: 'Numbani', ng: 'Nigéria', nl: 'Países Baixos', pe: 'Peru',
  ru: 'Rússia', scotland: 'Escócia', se: 'Suécia', th: 'Tailândia', tr: 'Turquia', us: 'Estados Unidos', ws: 'Samoa',
  zw: 'Zimbábue',
};
// nacionalidade escrita sem bandeira
const GENTILICO = { martian: 'Marte' };

// as categorias não marcam todo ômnico (o Zenyatta não tem nenhuma): correção à mão
const ESPECIE_FIXA = { Zenyatta: 'Ômnico' };

const campo = (t, n) => t.match(new RegExp(`\\n\\s*\\|\\s*${n}\\s*=([^\\n]*)`))?.[1] ?? '';
const semRef = s => s.replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '');
const umOuLista = a => (a.length > 1 ? a : a[0]);

function paises(nome, t) {
  const nat = semRef(campo(t, 'nationality'));
  const out = [];
  for (const [, cod, texto] of nat.matchAll(/\{\{\s*flag\s*\|\s*([^}|]+?)\s*\}\}\s*([A-Za-z]*)/gi)) {
    const p = PAIS[cod.toLowerCase()];
    if (!p) console.warn(`  overwatch: bandeira desconhecida "${cod}" (${nome})`);
    out.push(p ?? texto ?? cod);
  }
  if (!out.length) {
    const g = GENTILICO[nat.replace(/[^A-Za-z]/g, '').toLowerCase()];
    if (g) out.push(g);
    else if (nat.trim()) console.warn(`  overwatch: nacionalidade sem bandeira "${nat.trim()}" (${nome})`);
  }
  return [...new Set(out)];
}

/** Grupos conhecidos ligados no campo affiliation da ficha (atuais ou antigos, como nas categorias). */
const afiliacoesDaFicha = t =>
  [...semRef(campo(t, 'affiliation')).matchAll(/\[\[([^\]|]+)/g)].map(m => LINK_AFILIACAO[m[1].trim()]).filter(Boolean);

/** Título final da página (depois de normalizar e seguir redirecionamento) -> nome pedido. */
function nomesPedidos(pedidos, q) {
  const passo = new Map([...(q.normalized ?? []), ...(q.redirects ?? [])].map(r => [r.from, r.to]));
  const out = new Map();
  for (const n of pedidos) {
    let t = n;
    for (let i = 0; i < 3 && passo.has(t); i++) t = passo.get(t);
    out.set(t, n);
  }
  return out;
}

function especie(nome, cats) {
  if (ESPECIE_FIXA[nome]) return ESPECIE_FIXA[nome];
  if (cats.has('Omnic characters') || cats.has('Omnics')) return 'Ômnico';
  if (cats.has('Robots')) return 'Robô';
  if (cats.has('Animal characters')) return 'Animal';
  if (cats.has('Cyborgs')) return 'Ciborgue';
  return 'Humano';
}

export default {
  chave: 'overwatch',
  fonte: 'OverFast API e Overwatch Wiki',
  campos: [
    { id: 'funcao', rotulo: 'Função' },
    { id: 'subfuncao', rotulo: 'Subfunção' },
    { id: 'afiliacao', rotulo: 'Afiliação' },
    { id: 'pais', rotulo: 'País de origem' },
    { id: 'especie', rotulo: 'Espécie' },
  ],
  async gerar() {
    const [herois, funcoes] = await Promise.all([getJson(`${OVERFAST}/heroes`), getJson(`${OVERFAST}/roles?locale=pt-br`)]);
    const nomeFuncao = new Map(funcoes.map(r => [r.key, r.name]));

    // páginas da wiki: categorias (sem as ocultas) e o texto, 50 títulos por pedido
    const cats = new Map();
    const texto = new Map();
    for (const lote of chunks(herois.map(h => h.name), 50)) {
      const params = { action: 'query', titles: lote.join('|'), redirects: '1', formatversion: '2' };
      let cont = {};
      do {
        const j = await wiki(WIKI, { ...params, prop: 'categories', cllimit: 'max', clshow: '!hidden', ...cont });
        const heroi = nomesPedidos(lote, j.query);
        for (const p of j.query.pages) {
          const n = heroi.get(p.title) ?? p.title;
          if (!cats.has(n)) cats.set(n, new Set());
          for (const c of p.categories ?? []) cats.get(n).add(c.title.replace(/^Category:/, ''));
        }
        cont = j.continue ?? null;
      } while (cont);
      const j = await wiki(WIKI, { ...params, prop: 'revisions', rvprop: 'content', rvslots: 'main' });
      const heroi = nomesPedidos(lote, j.query);
      for (const p of j.query.pages) texto.set(heroi.get(p.title) ?? p.title, p.revisions?.[0]?.slots?.main?.content ?? '');
    }

    const itens = {};
    for (const h of herois) {
      const info = {};
      if (h.role) info.funcao = nomeFuncao.get(h.role) ?? h.role;
      if (h.subrole) info.subfuncao = SUBFUNCAO[h.subrole] ?? h.subrole;
      const c = cats.get(h.name);
      const t = texto.get(h.name);
      if (!c?.size || !t) {
        console.warn(`  overwatch: ${h.name} sem página na wiki`);
        itens[h.name] = info;
        continue;
      }
      const afil = [];
      for (const k of c) {
        if (CAT_AFILIACAO[k]) afil.push(CAT_AFILIACAO[k]);
        else if (/ (members|employees)$/.test(k)) afil.push(k.replace(/ (members|employees)$/, ''));
      }
      afil.push(...afiliacoesDaFicha(t));
      const a = [...new Set(afil)];
      if (a.length) info.afiliacao = umOuLista(a);
      const p = paises(h.name, t);
      if (p.length) info.pais = umOuLista(p);
      info.especie = especie(h.name, c);
      itens[h.name] = info;
    }
    return { itens };
  },
};
