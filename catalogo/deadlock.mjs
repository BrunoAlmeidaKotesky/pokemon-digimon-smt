// Deadlock: heróis jogáveis da Deadlock API (os nomes são os do site, src/sources/deadlock.ts), com tipo, arma,
// complexidade e gênero. A Deadlock Wiki completa com as categorias "Heroes with ..." da página do herói: estamina,
// velocidade do dash e o tipo de disparo da arma (1 pedido pra todos).

import { chunks, getJson, wiki } from './util.mjs';

const API = 'https://api.deadlock-api.com/v1/assets/heroes?only_active=true';
const WIKI = 'https://deadlock.wiki/api.php';

const TIPO = { assassin: 'Assassino', brawler: 'Brigão', marksman: 'Atirador', mystic: 'Místico' };
const ARMA = {
  'Beam Weapon': 'Feixe', 'Bow': 'Arco', 'Burst Fire': 'Rajada', 'Close Range': 'Curto alcance', 'Crossbow': 'Besta',
  'Heavy Artillery': 'Artilharia pesada', 'Heavy Hitter': 'Tiro pesado', 'Long Range': 'Longo alcance', 'Pistol': 'Pistola',
  'Projectile': 'Projétil', 'Rapid Fire': 'Tiro rápido', 'Shotgun': 'Escopeta', 'Spreadshot': 'Tiro espalhado',
};
const GENERO = { male: 'Masculino', female: 'Feminino' };
const DASH = { slow: 'Lento', medium: 'Médio', fast: 'Rápido' };
const DISPARO = { automatic: 'Automático', spreadshot: 'Espalhado', burst: 'Rajada' };

const umOuLista = a => (a.length > 1 ? a : a[0]);

export default {
  chave: 'deadlock',
  fonte: 'Deadlock API e Deadlock Wiki',
  campos: [
    { id: 'tipo', rotulo: 'Tipo' },
    { id: 'arma', rotulo: 'Arma' },
    { id: 'disparo', rotulo: 'Disparo' },
    { id: 'complexidade', rotulo: 'Complexidade (1 a 4)' },
    { id: 'estamina', rotulo: 'Estamina' },
    { id: 'dash', rotulo: 'Velocidade do dash' },
    { id: 'genero', rotulo: 'Gênero' },
  ],
  async gerar() {
    const herois = (await getJson(API)).filter(h => h.player_selectable && !h.disabled);

    const cats = new Map();
    for (const lote of chunks(herois.map(h => h.name), 50)) {
      let cont = {};
      do {
        const j = await wiki(WIKI, { action: 'query', prop: 'categories', cllimit: 'max', titles: lote.join('|'), formatversion: '2', ...cont });
        const volta = new Map((j.query.normalized ?? []).map(r => [r.to, r.from]));
        for (const p of j.query.pages) {
          const n = volta.get(p.title) ?? p.title;
          if (!cats.has(n)) cats.set(n, []);
          cats.get(n).push(...(p.categories ?? []).map(c => c.title.replace(/^Category:/, '')));
        }
        cont = j.continue ?? null;
      } while (cont);
    }

    const itens = {};
    for (const h of herois) {
      const info = {};
      if (h.hero_type) info.tipo = TIPO[h.hero_type] ?? h.hero_type;
      if (h.gun_tag) info.arma = ARMA[h.gun_tag] ?? h.gun_tag;
      const c = cats.get(h.name) ?? [];
      if (!c.length) console.warn(`  deadlock: ${h.name} sem página na wiki`);
      const disparo = c.map(k => /^Heroes with (\w+) weapons$/.exec(k)?.[1]).filter(k => DISPARO[k]).map(k => DISPARO[k]);
      if (disparo.length) info.disparo = umOuLista(disparo);
      if (h.complexity) info.complexidade = h.complexity;
      const estamina = c.map(k => /^Heroes with (\d+) stamina$/.exec(k)?.[1]).find(Boolean);
      if (estamina) info.estamina = Number(estamina);
      const dash = c.map(k => /^Heroes with (\w+) dash speed$/.exec(k)?.[1]).find(k => DASH[k]);
      if (dash) info.dash = DASH[dash];
      if (GENERO[h.gender]) info.genero = GENERO[h.gender];
      itens[h.name] = info;
    }
    return { itens };
  },
};
