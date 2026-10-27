// Gera public/catalogo/set1-base.json: o ponto de partida do planejamento do Set 1 na aba Catálogo.
// Seleção = exportação v1 do usuário, menos o que ele tirou no doc, mais as sugestões aceitas; linhas propostas no doc.
// Uso (na pasta do repositório): node docs/tft/base/gerar.mjs
// Entradas: docs/tft/set1-escolhas-v1.json, docs/tft/sugestoes-catalogo.json, docs/tft/base/linhas-pokemon.json (cadeias
// evolutivas da PokéAPI dos Pokémon escolhidos), docs/tft/base/receitas-bakugan.json e public/catalogo/*.json (nomes).
// O planejamento que o usuário faz na aba Catálogo fica no navegador dele e passa por cima da base.
import fs from 'node:fs';
const cat = k => JSON.parse(fs.readFileSync(`public/catalogo/${k}.json`, 'utf8')).itens;
const v1 = JSON.parse(fs.readFileSync('docs/tft/set1-escolhas-v1.json', 'utf8')).franquias;
const sug = JSON.parse(fs.readFileSync('docs/tft/sugestoes-catalogo.json', 'utf8'));
const poke = JSON.parse(fs.readFileSync('docs/tft/base/linhas-pokemon.json', 'utf8'));

const tirar = { persona: ['Polydeuces', 'Caesar', 'Messiah Picaro'], digimon: ['Botamon', 'Koromon'] };
const somar = { digimon: sug.digimon, persona: [...sug.persona, 'Orpheus Picaro'], ygo: sug.ygo };
const selecao = {};
for (const k of [...new Set([...Object.keys(v1), ...Object.keys(somar)])]) {
  const base = (v1[k]?.personagens ?? []).map(p => p.nome).filter(n => !(tirar[k] ?? []).includes(n));
  selecao[k] = [...new Set([...base, ...(somar[k] ?? [])])];
}

const L = (k, nome, ...niveis) => ({ id: `${k}:${niveis[0][0].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, nome, niveis });
const d = (...n) => n.map(x => (Array.isArray(x) ? x : [x]));
const linhas = {
  pokemon: poke.linhas.map(l => ({ ...l, nome: l.niveis[0][0] })),
  digimon: [
    L('digimon', 'Agumon', ...d('Agumon', 'Greymon', 'Metal Greymon', 'War Greymon')),
    L('digimon', 'Gabumon', ...d('Gabumon', 'Garurumon', 'Were Garurumon', 'Metal Garurumon')),
    L('digimon', 'Tentomon', ...d('Tentomon', 'Kabuterimon', 'Atlur Kabuterimon (Red)', 'Herakle Kabuterimon')),
    L('digimon', 'Palmon', ...d('Palmon', 'Togemon', 'Lilimon', 'Rosemon')),
    L('digimon', 'Patamon', ...d('Patamon', 'Angemon', 'Holy Angemon', 'Seraphimon')),
    L('digimon', 'Tailmon', ...d('Plotmon', 'Tailmon', 'Angewomon', 'Ofanimon')),
    L('digimon', 'Lucemon', ...d('Lucemon', 'Lucemon(Falldown Mode)', 'Lucemon(Satan Mode)', 'Lucemon(Larva)')),
    L('digimon', 'Pico Devimon', ...d('Pico Devimon', 'Devimon', 'Neo Devimon', 'Demon')),
    L('digimon', 'Elecmon', ...d('Elecmon', 'Leomon', 'Grappu Leomon', 'Saber Leomon')),
    L('digimon', 'Clear Agumon', ...d('Clear Agumon', 'Clockmon', 'Andromon', 'Hi Andromon')),
    L('digimon', 'Candmon', ...d('Candmon', 'Bakemon', 'Fantomon', 'Necromon')),
    L('digimon', 'Tyumon', ...d('Tyumon', 'Sukamon', 'Etemon', 'Metal Etemon')),
  ],
  persona: [
    L('persona', 'Joker (P5)', ...d('Arsène', 'Satanael', 'Raoul')),
    L('persona', 'Ryuji (P5)', ...d('Captain Kidd', 'Seiten Taisei - P5', 'William')),
    L('persona', 'Ann (P5)', ...d('Carmen', 'Hecate', 'Célestine')),
    L('persona', 'Morgana (P5)', ...d('Zorro', 'Mercurius', 'Diego')),
    L('persona', 'Sumire (P5)', ...d('Cendrillon', 'Vanadis', 'Ella')),
    L('persona', 'Yu (P4)', ...d('Izanagi', 'Izanagi-no-Okami', 'Izanagi-no-Okami Picaro')),
    L('persona', 'Rise (P4)', ...d('Himiko', 'Kanzeon', 'Kouzeon')),
    L('persona', 'Teddie (P4)', ...d('Kintoki-Douji', 'Kamui', 'Kamui-Moshiri')),
    L('persona', 'Naoto (P4)', ...d('Sukuna-Hikona - P4', 'Yamato-Takeru', 'Yamato Sumeragi')),
    L('persona', 'Protagonista (P3)', ...d(['Orpheus', 'Orpheus F'], 'Messiah', 'Orpheus Telos')),
    L('persona', 'Aigis (P3)', ...d('Palladion', 'Athena', 'Athena Picaro')),
    L('persona', 'Thanatos', ...d('Orpheus Picaro', 'Thanatos', 'Thanatos Picaro')),
  ],
  sujimon: [
    ['Hammered Man', 'Knight of the Cask', 'Urbane Legend'],
    ['Pro Pickpocket', 'Break-and-Entryman', 'King of Thieves'],
    ['Dine-and-Dasher', 'Chomp-and-Charger', 'Noblesse Obesity'],
    ['Escapist', 'Feral Felon', 'Twisted Mind'],
    ['City Slicker', 'Grease Monk', 'Pornogra-Pharoah'],
    ['Crabby Sentinel', 'Pier Reviewer', 'Captain Cruncher'],
    ['Wild Hog', "Feast 'n Flyer", "Gorgin' Gourmand"],
    ['Sham Man Shaman', 'False Prophet', 'Monster Monastic'],
    ['Chucklehead', 'Warhead', "Death's-head"],
    ['Beach Baller', 'Basket Case', 'Stress Tester'],
    ['Masked Demonling', 'Profaner Demon', 'Weeping Archdemon'],
    ['Baseball Diehard', 'Massacre Mascot'],
    ['Pseudotrash', 'Gifted Gatherer'],
    ['Shaman', 'High Necromancer'],
  ].map(ns => L('sujimon', ns[0], ...d(...ns))),
};

// Itens: os 7 atributos dos Bakugan são os componentes; 2 componentes formam um Bakugan (item completo)
const receitas = JSON.parse(fs.readFileSync('docs/tft/base/receitas-bakugan.json', 'utf8'));
const BONUS = { Pyrus: 'Mais dano de ataque', Aquos: 'Mais mana', Haos: 'Cura ou escudo', Darkus: 'Roubo de vida', Subterra: 'Mais armadura', Ventus: 'Mais velocidade de ataque', Aurelus: 'Mais vida' };
const itens = {
  componentes: Object.entries(BONUS).map(([nome, bonus]) => ({ id: nome.toLowerCase(), nome, bonus })),
  receitas: receitas.map(([a, b, bakugan]) => ({ a: a.toLowerCase(), b: b.toLowerCase(), bakugan })),
};
selecao.bakugan = receitas.map(r => r[2]);

// Pokémon, decidido pelo usuário em 27/10: linha de 2 ganha a Mega (ou o Gigantamax) como 3ª forma; Mew vira o
// começo da linha do Mewtwo; nas outras, a Mega (ou o Gigantamax, ou a forma Primal) é a ult da forma final
const pk = linhas.pokemon;
const linhaDe = n => pk.find(l => l.niveis.flat().includes(n));
for (const [final, forma] of Object.entries({ Raichu: 'Mega Raichu X', Sharpedo: 'Mega Sharpedo', Banette: 'Mega Banette', Lopunny: 'Mega Lopunny' })) {
  linhaDe(final).niveis.push([forma]);
  selecao.pokemon.push(forma);
}
pk.push({ id: 'pokemon:mew', nome: 'Mew', niveis: [['Mew'], ['Mewtwo'], ['Mega Mewtwo X']] });
selecao.pokemon.push('Mega Mewtwo X');
const ults = {
  pokemon: Object.fromEntries([
    'Venusaur', ['Charizard', 'Mega Charizard X'], 'Blastoise', 'Alakazam', 'Dragonite', 'Meganium', 'Feraligatr', 'Sceptile',
    'Blaziken', 'Swampert', 'Gardevoir', 'Gallade', 'Aggron', 'Garchomp', 'Emboar', 'Eelektross', 'Chesnaught', 'Delphox',
    'Greninja', 'Rayquaza', 'Darkrai', 'Zygarde', 'Magearna',
  ].map(x => (Array.isArray(x) ? x : [x, `Mega ${x}`]))
    .concat([['Machamp', 'Gigantamax Machamp'], ['Corviknight', 'Gigantamax Corviknight'], ['Hatterene', 'Gigantamax Hatterene'],
      ['Kyogre', 'Primal Kyogre'], ['Groudon', 'Primal Groudon']])),
};

const classes = ['Demoníacos', 'Criaturinha Bizarra', 'Fadinhas', 'Safada', 'Atirador', 'Anjo', 'Robô', 'Dragão', 'Temporais', 'Únicos']
  .map(nome => ({ id: nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'), nome }));

// conferência: todo nome existe no catálogo da franquia, e todo membro de linha está na seleção
const erros = [];
for (const [k, ns] of Object.entries(selecao)) { const c = cat(k); ns.forEach(n => c[n] || erros.push(`${k}: ${n} não existe`)); }
for (const [k, ls] of Object.entries(linhas)) {
  const c = cat(k), s = new Set(selecao[k]);
  ls.flatMap(l => l.niveis.flat()).forEach(n => { if (!c[n]) erros.push(`${k}: ${n} não existe`); else if (!s.has(n)) erros.push(`${k}: ${n} está numa linha mas não na seleção`); });
}
for (const [k, m] of Object.entries(ults)) {
  const c = cat(k), s = new Set(selecao[k]);
  for (const [u, f] of Object.entries(m)) {
    if (!s.has(u)) erros.push(`${k}: ${u} tem ult mas não está na seleção`);
    if (!c[f]) erros.push(`${k}: ult ${f} não existe`);
  }
}
if (erros.length) { console.error(erros.join('\n')); process.exit(1); }

const out = { versao: 1, geradoEm: new Date().toISOString().slice(0, 10), classes, selecao, linhas, ults, itens };
fs.writeFileSync('public/catalogo/set1-base.json', JSON.stringify(out, null, 1) + '\n');
console.log('seleção:', Object.entries(selecao).map(([k, v]) => `${k} ${v.length}`).join(', '));
console.log('linhas:', Object.entries(linhas).map(([k, v]) => `${k} ${v.length}`).join(', '));
