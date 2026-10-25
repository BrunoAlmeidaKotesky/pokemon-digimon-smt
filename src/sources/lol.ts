import type { Item, Source } from '../types';
import { pageThumbs } from './mediawiki';

interface Champion { id: string; key: string; name: string }

export const LOL_VERSIONS = 'https://ddragon.leagueoflegends.com/api/versions.json';
export const lolChampions = (v: string) => `https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion.json`;
export const LOL_WIKI = 'https://leagueoflegends.fandom.com/api.php';

// League of Legends: campeões do Data Dragon (Riot) na versão mais nova. A imagem é o render de corpo inteiro da
// LoL Wiki (imagem principal da página "{nome}/LoL"); quem não tem render, ou se a wiki falhar, fica com o quadrado do
// CommunityDragon pelo número do campeão (o do Data Dragon falta pra alguns, como o Fiddlesticks).
async function load(): Promise<Item[]> {
  const [v] = (await (await fetch(LOL_VERSIONS)).json()) as string[];
  if (!v) throw new Error('vazio');
  const j = (await (await fetch(lolChampions(v))).json()) as { data?: Record<string, Champion> };
  const champs = Object.values(j.data ?? {});
  if (!champs.length) throw new Error('vazio');
  const renders = await pageThumbs(LOL_WIKI, champs.map(c => c.name + '/LoL'), 600).catch(() => new Map<string, string>());
  return champs.map(c => {
    const r = renders.get(c.name + '/LoL');
    return { name: c.name, img: r && /_Render\./i.test(r) ? r : `https://cdn.communitydragon.org/latest/champion/${c.key}/tile` };
  });
}

export const lol: Source = { key: 'lol', label: 'LoL', load };
