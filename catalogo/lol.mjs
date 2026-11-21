// League of Legends: campeões do Data Dragon na versão mais nova (os nomes em inglês são os do site, src/sources/lol.ts).
// Classe, alcance e dificuldade vêm do champion.json em inglês; o recurso, do champion.json em português; a região,
// do índice do Universe da Riot (em português); o tipo de dano e o estilo (as etiquetas da tela de seleção), do JSON
// de cada campeão no CommunityDragon (em português, ~170 pedidos). O gênero não existe em nenhuma dessas fontes: sai
// dos pronomes da história em inglês (championFull.json), com GENERO_FIXO pros casos em que a contagem não decide.

import { getJson, pool } from './util.mjs';

const DD = 'https://ddragon.leagueoflegends.com';
const UNIVERSE = 'https://universe-meeps.leagueoflegends.com/v1/pt_br/search/index.json';
// data de lançamento de cada campeão (a Riot não publica em JSON): projeto Meraki Analytics, um arquivo só (~13 MB)
const MERAKI = 'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json';
/** Ano de lançamento de quem o Meraki ainda não tem (os campeões mais novos). */
const ANO_FIXO = { Zaahen: 2025, Locke: 2026 };
const CDRAGON = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/pt_br/v1/champions';

const CLASSES = { Assassin: 'Assassino', Fighter: 'Lutador', Mage: 'Mago', Marksman: 'Atirador', Support: 'Suporte', Tank: 'Tanque' };
/** Gênero quando os pronomes da história não decidem (texto curto, "it", dois personagens) ou decidem errado. */
const GENERO_FIXO = {
  "Cho'Gath": 'Masculino', Kalista: 'Feminino', Karthus: 'Masculino', "Kha'Zix": 'Masculino', "Kog'Maw": 'Masculino', Naafiri: 'Feminino',
  Nocturne: 'Masculino', 'Nunu & Willump': 'Masculino', Rakan: 'Masculino', Shen: 'Masculino', Taric: 'Masculino', Zac: 'Masculino', Locke: 'Masculino',
  Fiddlesticks: 'Masculino', Blitzcrank: 'Masculino', Kindred: 'Outro',
};
/** 'Masculino' ou 'Feminino' se um pronome aparece pelo menos 2 vezes e o dobro do outro; senão undefined. */
export function generoPelaHistoria(lore) {
  const n = re => (String(lore ?? '').match(re) ?? []).length;
  const m = n(/\b(he|him|his|himself)\b/gi), f = n(/\b(she|her|hers|herself)\b/gi);
  return m >= 2 && m > f * 2 ? 'Masculino' : f >= 2 && f > m * 2 ? 'Feminino' : undefined;
}
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
    { id: 'genero', rotulo: 'Gênero' },
    { id: 'ano', rotulo: 'Ano de lançamento' },
  ],
  async gerar() {
    const [v] = await getJson(`${DD}/api/versions.json`);
    const [en, completo, pt, uni] = await Promise.all([
      getJson(`${DD}/cdn/${v}/data/en_US/champion.json`),
      getJson(`${DD}/cdn/${v}/data/en_US/championFull.json`),
      getJson(`${DD}/cdn/${v}/data/pt_BR/champion.json`),
      getJson(UNIVERSE),
    ]);
    const meraki = await getJson(MERAKI).catch(e => {
      console.warn('  lol: sem as datas de lançamento do Meraki (' + e.message + ')');
      return {};
    });
    const lancamento = new Map(Object.values(meraki).map(m => [m.name, Number(String(m.releaseDate ?? '').slice(0, 4)) || undefined]));
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
      const genero = GENERO_FIXO[c.name] ?? generoPelaHistoria(completo.data[c.id]?.lore);
      if (genero) info.genero = genero;
      else console.warn(`  lol: sem gênero pra ${c.name} (ponha em GENERO_FIXO)`);
      const ano = lancamento.get(c.name) ?? ANO_FIXO[c.name];
      if (ano) info.ano = ano;
      else console.warn(`  lol: sem ano de lançamento pra ${c.name} (ponha em ANO_FIXO)`);
      itens[c.name] = info;
    });
    return { itens };
  },
};
