// Zelda: os inimigos e chefes de public/zelda/list.json (gerada pelo zelda.mjs da raiz), com as categorias da Zelda
// Wiki de cada página: tipo (chefe, subchefe ou inimigo), jogos da série e natureza do bicho.

import fs from 'node:fs/promises';
import { NOME } from '../zelda.mjs';
import { categoriasDe } from './util.mjs';

const API = 'https://zeldawiki.wiki/w/api.php';
const LISTA = 'public/zelda/list.json';

// Só os jogos: a wiki também tem categoria pros mangás, gibis, o desenho e as participações em outras séries.
const JOGOS = new Set([
  'The Legend of Zelda', 'The Adventure of Link', 'A Link to the Past', "Link's Awakening", 'Ocarina of Time', "Majora's Mask",
  'Oracle of Ages', 'Oracle of Seasons', 'Four Swords', 'The Wind Waker', 'Four Swords Adventures', 'The Minish Cap',
  'Twilight Princess', 'Phantom Hourglass', 'Spirit Tracks', 'Skyward Sword', 'A Link Between Worlds', 'Tri Force Heroes',
  'Breath of the Wild', 'Tears of the Kingdom', 'Echoes of Wisdom', 'Hyrule Warriors', 'Age of Calamity', 'Age of Imprisonment',
  'Cadence of Hyrule',
]);
/** Relançamento conta como o jogo original. */
const original = j => j.replace(/ (HD|3D|DX|Legends|Anniversary Edition)$|: Definitive Edition$| \(Nintendo Switch( 2)?\)$/, '');

const NATUREZA = {
  'Flying Enemies': 'Voador', 'Fire-Related Enemies': 'Fogo', 'Water-Related Enemies': 'Água', 'Ice-Related Enemies': 'Gelo',
  'Electricity-Related Enemies': 'Eletricidade', 'Wind-Related Enemies': 'Vento', 'Sand-Related Enemies': 'Areia',
  'Humanoid Enemies': 'Humanoide', 'Insect Enemies': 'Inseto', 'Mammalian Enemies': 'Mamífero', 'Plant-Like Enemies': 'Planta',
  'Ghost Enemies': 'Fantasma', 'Reptilian Enemies': 'Réptil', 'Fish Enemies': 'Peixe', 'Gelatinous Enemies': 'Gelatinoso',
  'Undead Enemies': 'Morto-vivo', Undead: 'Morto-vivo', 'Mechanical Enemies': 'Mecânico', 'Spider Enemies': 'Aranha',
  'Bat-Like Enemies': 'Morcego', 'Worm-Like Enemies': 'Verme', 'Canine Enemies': 'Canino', 'Malice Enemies': 'Malícia',
  'Twilight Enemies': 'Crepúsculo', 'Shadow Enemies': 'Sombra', 'Giant Bosses': 'Gigante',
};
const FAMILIA = { Blins: 'Blin', Stalfos: 'Stalfos', Stals: 'Stal', Chuchus: 'Chuchu', Lizalfos: 'Lizalfos', Miniblins: 'Miniblin' };

const unicos = l => [...new Set(l)].sort((a, b) => a.localeCompare(b, 'pt'));

export default {
  chave: 'zelda',
  fonte: 'Zelda Wiki',
  campos: [
    { id: 'tipo', rotulo: 'Tipo' },
    { id: 'natureza', rotulo: 'Natureza' },
    { id: 'familia', rotulo: 'Família' },
    { id: 'jogos', rotulo: 'Jogos' },
  ],
  async gerar() {
    const lista = JSON.parse(await fs.readFile(LISTA, 'utf8'));
    const titulo = Object.fromEntries(Object.entries(NOME).map(([t, n]) => [n, t]));
    const nomes = lista.map(([n]) => n);
    const cats = await categoriasDe(API, nomes.map(n => titulo[n] ?? n));
    const itens = {};
    for (const nome of nomes) {
      const c = cats.get(titulo[nome] ?? nome) ?? [];
      const info = { tipo: c.includes('Bosses') ? 'Chefe' : c.includes('Sub-Bosses') ? 'Subchefe' : 'Inimigo' };
      const natureza = unicos(c.map(x => NATUREZA[x]).filter(Boolean));
      const familia = c.map(x => FAMILIA[x]).find(Boolean);
      const jogos = unicos(c.map(x => /^(?:Enemies|Bosses|Sub-Bosses) in (.+)$/.exec(x)?.[1]).filter(Boolean).map(original).filter(j => JOGOS.has(j)));
      if (natureza.length) info.natureza = natureza;
      if (familia) info.familia = familia;
      if (jogos.length) info.jogos = jogos;
      itens[nome] = info;
    }
    return { itens };
  },
};
