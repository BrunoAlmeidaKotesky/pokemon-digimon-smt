// Bakugan: páginas da Bakugan Wiki (Fandom) que usam `{{Infobox Bakugan}}`, as mesmas da lista do site
// (src/sources/bakugan.ts). Atributo sai da ficha e das categorias; série, facção e tipo, das categorias; poder, da ficha.
// Cerca de 20% das páginas são equipamento (Battle Gear, armas, armadilhas, BakuNano...), não criatura: o campo
// `classe` diz qual é qual, pra dar pra filtrar ("Bakugan e equipamento" quando a wiki põe a página nos dois tipos de
// categoria, como as armadilhas que evoluem e os Maxus). A Fandom às vezes manda o desafio do Cloudflare: getJson tenta de novo.

import { campo, detalhesWiki, enxuto, ficha, paginasDoSite, semNotas } from './jojo.mjs';

const API = 'https://bakugan.fandom.com/api.php';

const ATRIBUTOS = ['Pyrus', 'Aquos', 'Subterra', 'Haos', 'Darkus', 'Ventus', 'Aurelus', 'Gold', 'Silver', 'Copper', 'Clear'];

/** Valor -> categorias da wiki que levam a ele (a ordem daqui é a ordem na lista). */
const SERIES = {
  'Battle Brawlers': ['Season 1 Bakugan', 'Bakugan Battle Brawlers'],
  'New Vestroia': ['Season 2 Bakugan', 'New Vestroia Bakugan', 'Bakugan: New Vestroia'],
  'Gundalian Invaders': ['Season 3 Bakugan', 'Gundalian Invaders Bakugan', 'Bakugan: Gundalian Invaders'],
  'Mechtanium Surge': ['Season 4 Bakugan', 'Bakugan: Mechtanium Surge'],
  'Bakugan Dimensions': ['Bakugan Dimensions'],
  BakuTech: ['BakuTech', 'BakuTech! Bakugan', 'BakuTech TV', 'BakuTech! Bakugan Gachi'],
  'Battle Planet': ['Battle Planet Bakugan', 'Bakugan Battle Planet'],
  'Armored Alliance': ['Armored Alliance Bakugan', 'Bakugan Armored Alliance', 'Bakugan: Armored Alliance'],
  'Geogan Rising': ['Geogan Rising Bakugan', 'Bakugan Geogan Rising'],
  Evolutions: ['Evolutions Bakugan', 'Bakugan Evolutions', 'Bakugan: Evolutions'],
  Legends: ['Legends Bakugan', 'Bakugan Legends'],
  'Bakugan (2023)': ['Bakugan (2023)'],
};
const FACCOES = {
  'Battle Brawlers': ['Battle Brawlers'], Resistance: ['Bakugan Battle Brawlers Resistance'], Villains: ['Villains'],
  'Former Villains': ['Former Villains'], Vexos: ['Vexos'], 'Castle Knights': ['Castle Knights'], Gundalian: ['Gundalian Bakugan'],
  Neathian: ['Neathian Bakugan'], 'Twelve Orders': ['Twelve Orders Bakugan'], 'Chaos Army': ['Chaos Army'],
  'Doom Beings': ['Doom Beings'], 'Legendary Soldiers': ['Legendary Soldiers'], 'Team Dragaon': ['Team Dragaon'],
  'Team Anubias': ['Team Anubias'], 'Team Sellon': ['Team Sellon'], 'Supreme Council': ['Supreme Council'], Nonet: ['Nonet Bakugan'],
};
const CRIATURA = {
  Guardian: ['Guardian Bakugan'], Evolution: ['Evolution Bakugan'], 'Special Evolution': ['Special Evolution Bakugan'],
  Mechanical: ['Mechanical Bakugan'], Hybrid: ['Hybrid Bakugan'], Connecting: ['Connecting Bakugan'],
  'Super Assault': ['Super Assault Bakugan'], Maxus: ['Maxus Bakugan'], 'Attribute Changing': ['Attribute Changing Bakugan'],
  Ancient: ['Ancient Bakugan'], Chaos: ['Chaos Bakugan'], 'Special Attack': ['Special Attack'],
  Mechtogan: ['Mechtogan', 'Chaos Mechtogan', 'Mechtogan Titan', 'Mechtogan Destroyers', 'Deceased Mechtogan'],
  Nanogan: ['Nanogan'], Geogan: ['Geogan'], 'Sky Raider': ['Baku Sky Raiders'], Vehicle: ['Vehicle Bakugan'],
};
const EQUIPAMENTO = {
  'Battle Gear': ['Battle Gear'], Weapon: ['Weapons', 'Ultimate Weapons'],
  Trap: ['Bakugan Trap', 'Connecting Trap', 'BakuSteel Trap', 'Bakugan Trap Combinations'], BakuNano: ['BakuNano'],
  'Baku-Gear': ['Baku-Gear'], 'Mobile Assault Vehicle': ['Mobile Assault Vehicles'], 'Battle Suit': ['Battle Suits'],
  Armor: ['Bakugan Armors'], Item: ['Items'],
};
const pelas = (mapa, cats) => Object.keys(mapa).filter(v => mapa[v].some(c => cats.includes(c)));

export default {
  chave: 'bakugan',
  fonte: 'Bakugan Wiki (Fandom)',
  campos: [
    { id: 'classe', rotulo: 'Bakugan ou equipamento' },
    { id: 'atributo', rotulo: 'Atributo' },
    { id: 'serie', rotulo: 'Série' },
    { id: 'faccao', rotulo: 'Facção' },
    { id: 'tipo', rotulo: 'Tipo' },
    { id: 'poder', rotulo: 'Poder' },
  ],
  async gerar() {
    const paginas = await paginasDoSite(API, [
      { action: 'query', generator: 'embeddedin', geititle: 'Template:Infobox Bakugan', geilimit: '500', geinamespace: '0' }]);
    const det = await detalhesWiki(API, [...paginas.keys()]);
    const itens = {};
    for (const [id, titulo] of paginas) {
      const { cats, texto } = det.get(id);
      const box = ficha(texto, 'Infobox Bakugan');
      const attFicha = semNotas(campo(box, 'attribute') ?? '');
      const atributo = ATRIBUTOS.filter(a => new RegExp('\\b' + a + '\\b', 'i').test(attFicha) || cats.includes(a) || cats.includes(a + ' Bakugan'));
      const criatura = pelas(CRIATURA, cats);
      const equip = pelas(EQUIPAMENTO, cats);
      const poder = /\d+/.exec(semNotas(campo(box, 'power') ?? '').replace(/,(?=\d{3})/g, ''));
      itens[titulo] = enxuto({
        classe: !equip.length ? 'Bakugan' : criatura.length ? 'Bakugan e equipamento' : 'Equipamento',
        atributo,
        serie: pelas(SERIES, cats),
        faccao: pelas(FACCOES, cats),
        tipo: [...criatura, ...equip],
        poder: poder ? Number(poder[0]) : undefined,
      });
    }
    return { itens };
  },
};
