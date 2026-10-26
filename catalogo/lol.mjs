// League of Legends: campeões do Data Dragon na versão mais nova (os nomes em inglês são os do site, src/sources/lol.ts).
// Classe, alcance e dificuldade vêm do champion.json em inglês; o recurso, do champion.json em português; a região,
// do índice do Universe da Riot (em português); o tipo de dano e o estilo (as etiquetas da tela de seleção), do JSON
// de cada campeão no CommunityDragon (em português, ~170 pedidos).

import { getJson, pool } from './util.mjs';

const DD = 'https://ddragon.leagueoflegends.com';
const UNIVERSE = 'https://universe-meeps.leagueoflegends.com/v1/pt_br/search/index.json';
const CDRAGON = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/pt_br/v1/champions';

const CLASSES = { Assassin: 'Assassino', Fighter: 'Lutador', Mage: 'Mago', Marksman: 'Atirador', Support: 'Suporte', Tank: 'Tanque' };
const DANO = { kMagic: 'Mágico', kPhysical: 'Físico', kMixed: 'Misto' };
// o champion.json em português tem algumas traduções estranhas ou vazias
const RECURSO = { '': 'Nenhum', 'de Aquecimento': 'Calor' };

const norm = s => s.normalize('NFD').toLowerCase().replace(/[^a-z]/g, '');

export default {
  chave: 'lol',
  fonte: 'Data Dragon, Universe e CommunityDragon (Riot)',
  campos: [
    { id: 'classe', rotulo: 'Classe' },
    { id: 'regiao', rotulo: 'Região' },
    { id: 'alcance', rotulo: 'Alcance' },
    { id: 'dano', rotulo: 'Dano' },
    { id: 'estilo', rotulo: 'Estilo' },
    { id: 'recurso', rotulo: 'Recurso' },
    { id: 'dificuldade', rotulo: 'Dificuldade (0 a 10)' },
  ],
  async gerar() {
    const [v] = await getJson(`${DD}/api/versions.json`);
    const [en, pt, uni] = await Promise.all([
      getJson(`${DD}/cdn/${v}/data/en_US/champion.json`),
      getJson(`${DD}/cdn/${v}/data/pt_BR/champion.json`),
      getJson(UNIVERSE),
    ]);
    const faccoes = new Map(uni.factions.map(f => [f.slug, f.name]));
    const porSlug = new Map(uni.champions.map(c => [norm(c.slug), c]));
    const porNome = new Map(uni.champions.map(c => [norm(c.name), c]));
    const champs = Object.values(en.data);

    const cd = await pool(champs, 6, c => getJson(`${CDRAGON}/${c.key}.json`).catch(e => {
      console.warn(`  lol: sem CommunityDragon pra ${c.name} (${e.message})`);
      return null;
    }));

    const itens = {};
    champs.forEach((c, i) => {
      const info = {};
      const classe = c.tags.map(t => CLASSES[t] ?? t);
      if (classe.length) info.classe = classe.length > 1 ? classe : classe[0];
      const u = porSlug.get(norm(c.id)) ?? porNome.get(norm(c.name));
      const f = u?.['associated-faction-slug'];
      if (f) info.regiao = faccoes.get(f) ?? 'Sem região';
      else console.warn(`  lol: ${c.name} não achado no Universe`);
      info.alcance = c.stats.attackrange >= 300 ? 'À distância' : 'Corpo a corpo';
      const j = cd[i];
      if (DANO[j?.tacticalInfo?.damageType]) info.dano = DANO[j.tacticalInfo.damageType];
      const estilo = [j?.championTagInfo?.championTagPrimary, j?.championTagInfo?.championTagSecondary].filter(Boolean);
      if (estilo.length) info.estilo = estilo.length > 1 ? estilo : estilo[0];
      const recurso = pt.data[c.id]?.partype ?? c.partype;
      info.recurso = RECURSO[recurso] ?? recurso;
      info.dificuldade = c.info.difficulty;
      itens[c.name] = info;
    });
    return { itens };
  },
};
