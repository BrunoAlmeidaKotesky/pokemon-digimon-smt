import type { Item, Source } from '../types';
import formas from './pokemon-formas.json';
import { nice } from './text';

interface Species { name: string; url: string }
interface SpeciesPage { results: Species[] }

export const POKEMON_URL = 'https://pokeapi.co/api/v2/pokemon-species?limit=2000';
/** Todos os pokémon da API, inclusive as variedades (Megas e formas regionais), que não são espécies. */
export const POKEMON_FORMS_URL = 'https://pokeapi.co/api/v2/pokemon?limit=2000';

const art = (url: string) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${url.split('/').filter(Boolean).pop()}.png`;

const REGIAO: Record<string, string> = { alola: 'Alolan', galar: 'Galarian', hisui: 'Hisuian', paldea: 'Paldean' };
/**
 * As outras formas que mudam de verdade (aparência e quase sempre tipo), com o nome no site: 'giratina-origin' ->
 * 'Giratina (Origin)'. As que só trocam de cor, tamanho, gênero ou roupa (Minior, Squawkabilly, Pumpkaboo, Pikachu de
 * fantasia...) ficam de fora. O catálogo (catalogo/pokemon.mjs) lê a mesma lista.
 */
const OUTRAS = new Map(Object.entries(formas));

/**
 * Nome oficial (em inglês) de uma Mega, Gigantamax, forma Primal, forma regional ou outra forma da lista OUTRAS, ou
 * null pras outras variedades (totem, bonés do Pikachu, cores do Minior...): 'charizard-mega-x' -> 'Mega Charizard X',
 * 'machamp-gmax' -> 'Gigantamax Machamp', 'raichu-alola' -> 'Alolan Raichu', 'kyogre-primal' -> 'Primal Kyogre',
 * 'tauros-paldea-combat-breed' -> 'Paldean Tauros (Combat Breed)', 'rotom-wash' -> 'Rotom (Wash)'.
 * Nome de espécie igual ao do site (nice): 'mr-mime-galar' -> 'Galarian Mr Mime'.
 */
export function formName(name: string): string | null {
  const outra = OUTRAS.get(name);
  if (outra) return outra;
  if (/totem|-cap|cosplay|starter|busted|eternamax/.test(name)) return null;
  const p = name.split('-');
  if (p.at(-1) === 'gmax') return `Gigantamax ${nice(p.slice(0, -1).join('-'))}`;
  const mega = p.indexOf('mega');
  if (mega > 0) return `Mega ${nice(p.slice(0, mega).join('-'))}${p.slice(mega + 1).map(s => ' ' + s.toUpperCase()).join('')}`;
  if (p.at(-1) === 'primal') return `Primal ${nice(p.slice(0, -1).join('-'))}`;
  const r = p.findIndex(s => s in REGIAO);
  if (r <= 0) return null;
  const extra = p.slice(r + 1).filter(s => s !== 'standard');
  return `${REGIAO[p[r] as string]} ${nice(p.slice(0, r).join('-'))}${extra.length ? ` (${nice(extra.join('-'))})` : ''}`;
}

// Pokémon: as espécies (com a arte oficial pelo id) e, no fim, as Megas, Gigantamax, formas Primais, formas regionais e
// as outras formas da lista OUTRAS.
// Se a lista das formas falhar, ficam só as espécies.
async function load(): Promise<Item[]> {
  const [j, formas] = await Promise.all([
    fetch(POKEMON_URL).then(r => r.json() as Promise<SpeciesPage>),
    fetch(POKEMON_FORMS_URL).then(r => r.json() as Promise<SpeciesPage>).catch(() => null),
  ]);
  const list = j.results.map(x => ({ name: nice(x.name), img: art(x.url) }));
  const nomes = new Set(list.map(x => x.name));
  for (const x of formas?.results ?? []) {
    const name = formName(x.name);
    if (!name || nomes.has(name)) continue;
    nomes.add(name);
    list.push({ name, img: art(x.url) });
  }
  return list;
}

export const pokemon: Source = { key: 'pokemon', label: 'Pokémon', load };
