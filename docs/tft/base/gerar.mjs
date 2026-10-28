// Gera public/catalogo/set1-base.json: o ponto de partida do planejamento do Set 1 na aba Catálogo.
// Seleção = exportação v1 do usuário, menos o que ele tirou no doc, mais as sugestões aceitas; linhas propostas no doc.
// Uso (na pasta do repositório): node docs/tft/base/gerar.mjs
// Entradas: docs/tft/set1-escolhas-v1.json, docs/tft/sugestoes-catalogo.json, docs/tft/base/linhas-pokemon.json (cadeias
// evolutivas da PokéAPI dos Pokémon escolhidos), docs/tft/base/receitas-bakugan.json, docs/tft/set1-escolhas-v2.json
// (classes e linhas que o usuário montou na aba Catálogo) e public/catalogo/*.json (nomes).
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
for (const [final, forma] of Object.entries({ Sharpedo: 'Mega Sharpedo', Banette: 'Mega Banette', Lopunny: 'Mega Lopunny' })) {
  linhaDe(final).niveis.push([forma]);
  selecao.pokemon.push(forma);
}
pk.push({ id: 'pokemon:mew', nome: 'Mew', niveis: [['Mew'], ['Mewtwo'], ['Mega Mewtwo X']] });
selecao.pokemon.push('Mega Mewtwo X');
// Pikachu (27/10): o Pichu entra como 1ª forma e a Mega Raichu X é a ult do Raichu (não uma 3ª forma)
linhaDe('Pikachu').niveis.unshift(['Pichu']);
selecao.pokemon.push('Pichu');
// Paradox (27/10): linha de 2 ganha o Paradox como 3ª forma (Volcarona tem dois: ficam como alternativas)
linhaDe('Volcarona').niveis.push(['Slither Wing', 'Iron Moth']);
selecao.pokemon.push('Slither Wing', 'Iron Moth');
const ults = {
  pokemon: Object.fromEntries([
    'Venusaur', ['Charizard', 'Mega Charizard X'], ['Raichu', 'Mega Raichu X'], 'Blastoise', 'Alakazam', 'Dragonite', 'Meganium', 'Feraligatr', 'Sceptile',
    'Blaziken', 'Swampert', 'Gardevoir', 'Gallade', 'Aggron', 'Garchomp', 'Emboar', 'Eelektross', 'Chesnaught', 'Delphox',
    'Greninja', 'Rayquaza', 'Darkrai', 'Zygarde', 'Magearna',
  ].map(x => (Array.isArray(x) ? x : [x, `Mega ${x}`]))
    .concat([['Machamp', 'Gigantamax Machamp'], ['Corviknight', 'Gigantamax Corviknight'], ['Hatterene', 'Gigantamax Hatterene'],
      ['Kyogre', 'Primal Kyogre'], ['Groudon', 'Primal Groudon'],
      // formas de Hisui e Paradox como ult (27/10); Gardevoir e Gallade ficam com a Mega
      ['Typhlosion', 'Hisuian Typhlosion'], ['Samurott', 'Hisuian Samurott'], ['Decidueye', 'Hisuian Decidueye'],
      ['Hydreigon', 'Iron Jugulis'], ['Suicune', 'Walking Wake'], ['Entei', 'Gouging Fire'], ['Raikou', 'Raging Bolt']])),
};

// Pokémon (27/10): saem as linhas que ficaram com menos de 3 formas e os soltos (sem evolução) que não ganharam ult.
// Só a forma final tem ult; virar a ult só melhora todos os atributos.
{
  const curtas = linhas.pokemon.filter(l => l.niveis.length < 3);
  const fora = new Set(curtas.flatMap(l => l.niveis.flat()));
  const naLinha = new Set(linhas.pokemon.flatMap(l => l.niveis.flat()));
  selecao.pokemon.filter(n => !naLinha.has(n) && !ults.pokemon[n]).forEach(n => fora.add(n));
  linhas.pokemon = linhas.pokemon.filter(l => l.niveis.length >= 3);
  selecao.pokemon = selecao.pokemon.filter(n => !fora.has(n));
}

// Exportação v2 do usuário (27/10): ele deu as classes e montou as linhas na aba Catálogo. As linhas e as ults que
// valiam no navegador dele viram as da base. Entra quem ele pôs numa linha ou deu classe fora da base; em Pokémon,
// Digimon e SMT sai quem estava na base e ficou sem nada (sem linha, classe, habilidade nem ult). Nas outras franquias
// quem ficou sem nada continua: ele só não achou a classe ainda. A classe e a habilidade de cada um ficam no plano
// dele (navegador) e no arquivo da v2.
{
  const v2 = JSON.parse(fs.readFileSync('docs/tft/set1-escolhas-v2.json', 'utf8'));
  const unidades = v2.plano.unidades;
  for (const [k, ls] of Object.entries(v2.linhas)) linhas[k] = ls.map(({ id, nome, niveis, de, confirmada }) => ({ id, nome, niveis, ...(de ? { de } : {}), ...(confirmada ? { confirmada } : {}) }));
  for (const k of Object.keys(selecao)) {
    const us = unidades[k] ?? {};
    const naLinha = new Set((linhas[k] ?? []).flatMap(l => l.niveis.flat()));
    const temAlgo = n => naLinha.has(n) || !!us[n]?.classes?.length || !!us[n]?.habilidade?.trim() || !!us[n]?.ult;
    const ficam = ['pokemon', 'digimon', 'smt'].includes(k) ? selecao[k].filter(temAlgo) : selecao[k];
    selecao[k] = [...new Set([...ficam, ...naLinha, ...Object.keys(us).filter(temAlgo)])];
  }
  for (const [k, us] of Object.entries(unidades)) {
    const fr = Object.fromEntries(Object.entries(us).filter(([, u]) => u.ult).map(([n, u]) => [n, u.ult]));
    if (Object.keys(fr).length) ults[k] = fr;
    else delete ults[k];
  }
}

// Tanque, Porradeiro, Assassino e os elementos (27/10): o efeito é proposta, em % porque os atributos ainda não têm escala. Os
// elementos são a classe reserva, pra quem não tem outra que encaixe.
const ELEMENTO = 'Elemento, classe reserva (um por unidade).';
const classes = [
  'Demoníacos', 'Criaturinha Bizarra', 'Fadinhas', 'Safada', 'Atirador', 'Anjo', 'Robô', 'Dragão', 'Temporais', 'Únicos',
  ['Tanque', 'Linha de frente que segura o dano pelo time. (2) +20% de armadura e resistência mágica; (4) +40%, e começam a luta com escudo de 15% da vida; (6) +70%, e no começo da luta provocam: os inimigos em volta atacam o Tanque por 3 segundos.'],
  ['Porradeiro', 'Briga corpo a corpo: muita vida e bate mais forte quando apanha. (2) +15% de vida máxima; (4) +30%, e abaixo de metade da vida causam 20% a mais de dano; (6) +50%, e o resto do time ganha +10% de vida.'],
  ['Assassino', 'No começo da luta saltam pra trás da linha inimiga e vão atrás de quem tem menos vida. (2) +15% de chance e +15% de dano de crítico; (4) +30% e +30%; (6) +45% e +45%, e cada abate deixa o Assassino 1 segundo sem poder ser alvo.'],
  ['Fogo', `${ELEMENTO} Os ataques queimam: o alvo perde vida aos poucos e recebe menos cura. (2) queimadura fraca; (4) média; (6) forte, e quem morre queimando passa o fogo pro inimigo mais perto.`],
  ['Água', `${ELEMENTO} Recuperam vida durante a luta. (2) 1% da vida por segundo; (4) 2%; (6) 3%, e a cada 4 segundos se livram de queimadura, lentidão e outros efeitos ruins.`],
  ['Terra', `${ELEMENTO} Pele de pedra. (2) +15% de armadura; (4) +30%; (6) +50%, e a cada 6 segundos um tremor atordoa por meio segundo os inimigos em volta.`],
  ['Vento', `${ELEMENTO} Rápidos e difíceis de acertar. (2) +15% de velocidade de ataque; (4) +30%, e desviam de 10% dos ataques; (6) +50%, e desviam de 20%.`],
  ['Raio', `${ELEMENTO} A cada 3 ataques, um raio pula do alvo pra outros inimigos. (2) pula pra 1; (4) pra 2; (6) pra 3, e atordoa por meio segundo quem leva.`],
  ['Gelo', `${ELEMENTO} Os ataques deixam o alvo mais lento. (2) ele ataca 15% mais devagar; (4) 25%; (6) 35%, e o 5º ataque seguido no mesmo alvo congela ele por 1 segundo.`],
  ['Planta', `${ELEMENTO} O primeiro ataque em cada inimigo planta uma semente que suga a vida dele e cura quem plantou. (2) semente fraca; (4) média; (6) forte, e a cura vai também pro aliado mais perto.`],
].map(c => {
  const [nome, descricao] = Array.isArray(c) ? c : [c];
  return { id: nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'), nome, ...(descricao ? { descricao } : {}) };
});

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
