import type { Item, Source } from '../types';

interface Champion { id: string; key: string; name: string }

export const LOL_VERSIONS = 'https://ddragon.leagueoflegends.com/api/versions.json';
export const lolChampions = (v: string) => `https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion.json`;

// League of Legends: campeões do Data Dragon (Riot) na versão mais nova, com a splash art oficial na versão
// centralizada do CommunityDragon, pelo número do campeão (a do Data Dragon falta pra alguns, como o Fiddlesticks).
// A splash é horizontal: o CSS recorta pra preencher a carta (object-fit: cover em [data-fr=lol]).
async function load(): Promise<Item[]> {
  const [v] = (await (await fetch(LOL_VERSIONS)).json()) as string[];
  if (!v) throw new Error('vazio');
  const j = (await (await fetch(lolChampions(v))).json()) as { data?: Record<string, Champion> };
  const list = Object.values(j.data ?? {}).map(c => ({ name: c.name, img: `https://cdn.communitydragon.org/latest/champion/${c.key}/splash-art/centered` }));
  if (!list.length) throw new Error('vazio');
  return list;
}

export const lol: Source = { key: 'lol', label: 'LoL', load };
