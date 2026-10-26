// Pokémon: todas as espécies num pedido só à API GraphQL da PokéAPI (que limita a 100 pedidos por hora: nada de laço).
// O nome passa pelo mesmo nice() do site (src/core/text.ts): 'mr-mime' -> 'Mr Mime'.

import { getJson } from './util.mjs';

const API = 'https://graphql.pokeapi.co/v1beta2';

const QUERY = `query catalogo {
  pokemonspecies(order_by: {id: asc}) {
    id name evolves_from_species_id is_legendary is_mythical is_baby
    generation { name }
    pokemoncolor { name }
    pokemonshape { name }
    pokemonhabitat { name }
    pokemonegggroups { egggroup { name } }
    pokemons(where: {is_default: {_eq: true}}) { pokemontypes(order_by: {slot: asc}) { type { name } } }
  }
}`;

/** Igual ao nice() de src/core/text.ts. */
const nice = s => s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

/** Grupos de ovo e habitat com o nome que os jogos usam em inglês (a API usa um id interno). */
const NOMES = {
  water1: 'Water 1', water2: 'Water 2', water3: 'Water 3', ground: 'Field', plant: 'Grass', humanshape: 'Human-Like',
  indeterminate: 'Amorphous', 'no-eggs': 'Undiscovered', 'waters-edge': "Water's Edge",
};
const nome = s => NOMES[s] ?? nice(s);

export default {
  chave: 'pokemon',
  fonte: 'PokéAPI (GraphQL)',
  campos: [
    { id: 'tipo', rotulo: 'Tipo' },
    { id: 'geracao', rotulo: 'Geração' },
    { id: 'estagio', rotulo: 'Estágio da evolução' },
    { id: 'evolucao', rotulo: 'Papel na evolução' },
    { id: 'especial', rotulo: 'Categoria especial' },
    { id: 'cor', rotulo: 'Cor' },
    { id: 'forma', rotulo: 'Forma' },
    { id: 'ovo', rotulo: 'Grupo de ovo' },
    { id: 'habitat', rotulo: 'Habitat' },
  ],
  async gerar() {
    const j = await getJson(API, { body: { query: QUERY, variables: null, operationName: 'catalogo' } });
    if (j.errors) throw new Error('GraphQL: ' + JSON.stringify(j.errors).slice(0, 200));
    const L = j.data.pokemonspecies;
    const porId = new Map(L.map(s => [s.id, s]));
    const temFilho = new Set(L.map(s => s.evolves_from_species_id).filter(Boolean));
    const estagio = s => {
      let d = 1;
      for (let c = s; c.evolves_from_species_id; c = porId.get(c.evolves_from_species_id)) d++;
      return d;
    };
    const itens = {};
    for (const s of L) {
      const e = estagio(s);
      const tipos = (s.pokemons[0]?.pokemontypes ?? []).map(t => nice(t.type.name));
      const info = {
        tipo: tipos.length ? tipos : undefined,
        geracao: s.generation?.name.replace(/^generation-/, '').toUpperCase(),
        estagio: e,
        evolucao: !s.evolves_from_species_id && !temFilho.has(s.id) ? 'Sem evolução'
          : !temFilho.has(s.id) ? 'Final' : e === 1 ? 'Básico' : 'Intermediário',
        especial: s.is_legendary ? 'Lendário' : s.is_mythical ? 'Mítico' : s.is_baby ? 'Bebê' : undefined,
        cor: s.pokemoncolor && nice(s.pokemoncolor.name),
        forma: s.pokemonshape && nice(s.pokemonshape.name),
        ovo: s.pokemonegggroups.length ? s.pokemonegggroups.map(g => nome(g.egggroup.name)) : undefined,
        habitat: s.pokemonhabitat && nome(s.pokemonhabitat.name),
      };
      itens[nice(s.name)] = Object.fromEntries(Object.entries(info).filter(([, v]) => v !== undefined && v !== null));
    }
    return { itens };
  },
};
