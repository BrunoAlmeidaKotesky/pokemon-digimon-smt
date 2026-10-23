import type { Item, Source } from '../types';

interface DigimonSummary { name: string; href: string; image: string | null }
interface DigimonPage {
  content: DigimonSummary[];
  pageable?: { totalPages?: number };
}

export const DIGIMON_URL = 'https://digi-api.com/api/v1/digimon';

// 1ª página primeiro (diz quantas páginas há); as outras em paralelo, e uma página que falha vira [].
async function load(): Promise<Item[]> {
  const base = DIGIMON_URL;
  const first = (await (await fetch(base + '?pageSize=100&page=0')).json()) as DigimonPage;
  const pages = first.pageable?.totalPages || 1;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) =>
    fetch(`${base}?pageSize=100&page=${i + 1}`)
      .then(r => r.json() as Promise<DigimonPage>)
      .then(j => j.content || [])
      .catch((): DigimonSummary[] => [])));
  return first.content.concat(...rest).map(d => ({ name: d.name, img: d.image ?? '', href: d.href }));
}

export const digimon: Source = { key: 'digimon', label: 'Digimon', load };
