// Equilíbrio do Set 1 com os campeões que o usuário marcou no Catálogo: o tamanho certo de cada traço, que classes e
// elementos estão fora da faixa (e quem dá pra mexer), a cota de uma franquia que ainda não tenha ninguém marcado e a
// escada de cada origem. Lê a exportação do Catálogo e grava resultado.md.
// Uso (na pasta do repositório): node docs/tft/matematica/analise.mjs
import fs from 'node:fs';
import * as m from './lib.mjs';

const ler = c => JSON.parse(fs.readFileSync(c, 'utf8'));
const EXPORTACAO = 'docs/tft/set1-escolhas-v4.json';
const SAIDA = 'docs/tft/matematica/resultado.md';
const ex = ler(EXPORTACAO);

// Escolhas de design que entram na conta (mude aqui):
// breakpoints das classes e elementos, como no doc
const ESCADA = [2, 4, 6];
// campeões no tabuleiro: ainda não decidido no doc; limita o maior breakpoint possível
const TABULEIRO = 9;
// vagas por loja: só multiplica todos os custos (não muda nenhuma comparação)
const VAGAS = 5;
// quanto o custo de fechar o último breakpoint pode fugir do de um traço do tamanho certo: 0,25 = até 25% mais caro
// ou 20% mais barato
const TOLERANCIA = 0.25;
// elementos que o usuário não quer
const FORA = ['luz', 'trevas'];

const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '∞');
const x = r => `${f(r, 2)}×`;
const tabela = (cab, linhas) => [`| ${cab.join(' | ')} |`, `|${cab.map(() => '---').join('|')}|`, ...linhas.map(l => `| ${l.join(' | ')} |`)].join('\n');
const lista = xs => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} e ${xs.at(-1)}` : (xs[0] ?? ''));
const out = [];
const p = (...s) => out.push(...s, '');

// ---------- os campeões ----------
const ORIGENS = { pokemon: 'Pokémon', digimon: 'Digimon', smt: 'SMT', persona: 'Persona', jojo: 'JoJo', ygo: 'Yu-Gi-Oh!', lol: 'LoL', overwatch: 'Overwatch', deadlock: 'Deadlock', sujimon: 'Sujimon' };
const ehElemento = c => /^Elemento/.test(c.descricao ?? '');
const usadas = ex.plano.classes.filter(c => c.id !== 'unicos' && !FORA.includes(c.id));
const ELEMENTOS = usadas.filter(ehElemento);
const GERAIS = usadas.filter(c => !ehElemento(c));
const campeoes = [];
const porFranquia = [];
for (const [k, origem] of Object.entries(ORIGENS)) {
  const fr = ex.franquias[k];
  if (!fr) continue;
  const linhas = ex.linhas[k] ?? [];
  const naLinha = new Set(linhas.flatMap(l => l.niveis.flat()));
  const soltos = fr.personagens.map(x => x.nome).filter(n => !naLinha.has(n));
  const us = ex.plano.unidades[k] ?? {};
  const daqui = [];
  // a linha é um campeão (cada forma é um nível); as classes dele são as de qualquer forma
  for (const formas of [...linhas.map(l => l.niveis.flat()), ...soltos.map(s => [s])]) {
    const ids = new Set(formas.flatMap(n => us[n]?.classes ?? []));
    daqui.push({
      nome: formas.at(-1), origem,
      classes: GERAIS.filter(c => ids.has(c.id)).map(c => c.nome),
      elementos: ELEMENTOS.filter(c => ids.has(c.id)).map(c => c.nome),
      unico: ids.has('unicos'),
    });
  }
  campeoes.push(...daqui);
  porFranquia.push({
    origem, formas: new Set([...fr.personagens.map(x => x.nome), ...naLinha]).size, linhas: linhas.length, soltos: soltos.length,
    campeoes: daqui.length, soElemento: daqui.filter(c => !c.classes.length && c.elementos.length).length,
    soUnicos: daqui.filter(c => !c.classes.length && !c.elementos.length && c.unico).length,
    nada: daqui.filter(c => !c.classes.length && !c.elementos.length && !c.unico).length,
  });
}
const U0 = campeoes.length;
const O0 = porFranquia.length;
// franquia ainda sem ninguém marcado entra com o tamanho de uma origem média, e aí a média continua a mesma
const faltam = Object.entries(ORIGENS).filter(([k]) => !ex.franquias[k]).map(([, o]) => o);
const Y = faltam.length ? Math.round(U0 / O0) : 0;
const U = U0 + Y * faltam.length;
const O = O0 + faltam.length;
const nAlvo = U / O;
const c = m.soma(campeoes.map(x => x.classes.length)) / U0;
const e = m.soma(campeoes.map(x => x.elementos.length)) / U0;
const fx = m.faixa(nAlvo, ESCADA.at(-1), U, TOLERANCIA, VAGAS);
const r6 = (n, alvo = nAlvo) => m.custoFechar(ESCADA.at(-1), n, U, VAGAS) / m.custoFechar(ESCADA.at(-1), alvo, U, VAGAS);
const conta = nomes => Object.fromEntries(nomes.map(nome => [nome, campeoes.filter(ch => ch.classes.includes(nome) || ch.elementos.includes(nome)).length]));
const nClasse = conta(GERAIS.map(c => c.nome));
const nElemento = conta(ELEMENTOS.map(c => c.nome));
const histClasses = {};
for (const ch of campeoes) histClasses[ch.classes.length] = (histClasses[ch.classes.length] ?? 0) + 1;

p('# Resultado: equilíbrio do Set 1', '',
  `Gerado por \`node docs/tft/matematica/analise.mjs\` em ${new Date().toISOString().slice(0, 10)}, com a exportação do Catálogo de ${ex.geradoEm.slice(0, 10)}. Método e fórmulas: [README.md](README.md). Escolhas que entram na conta: breakpoints ${ESCADA.join('/')}, tabuleiro de ${TABULEIRO}, loja de ${VAGAS} vagas, tolerância de ${f(TOLERANCIA * 100, 0)}% no custo.`);

p('## 1. O que temos',
  `Campeão = uma linha evolutiva (cada forma é um nível: o Ivysaur é o nível 2 do Bulbasaur) ou um personagem solto (que sobe de estrela, como os do LoL e as cartas do Yu-Gi-Oh!). As ${m.soma(porFranquia.map(x => x.formas))} formas marcadas dão **${U0} campeões** em ${O0} franquias.${faltam.length ? ` ${lista(faltam)} ainda não ${faltam.length > 1 ? 'têm' : 'tem'} ninguém marcado; nas contas ${faltam.length > 1 ? 'entram' : 'entra'} com ${Y} cada (seção 3).` : ''}`);
p(tabela(['Origem', 'Formas', 'Linhas', 'Soltos', 'Campeões', 'Só com elemento', 'Só Únicos', 'Sem nada'], [
  ...porFranquia.map(o => [o.origem, o.formas, o.linhas, o.soltos, o.campeoes, o.soElemento, o.soUnicos, o.nada]),
  ['**Total**', ...['formas', 'linhas', 'soltos'].map(k => m.soma(porFranquia.map(o => o[k]))), `**${U0}**`, ...['soElemento', 'soUnicos', 'nada'].map(k => m.soma(porFranquia.map(o => o[k])))],
]));
const semNada = campeoes.filter(ch => !ch.classes.length && !ch.elementos.length && !ch.unico);
p(`Traços: ${O} origens, ${GERAIS.length} classes, ${ELEMENTOS.length} elementos (${ELEMENTOS.map(c => c.nome).join(', ')}; ${FORA.length} ficaram de fora) e Únicos, que não junta ninguém. Por campeão: **${f(c, 2)} classes** (${Object.entries(histClasses).map(([q, n]) => `${n} com ${q}`).join(', ')}) e **${f(e, 2)} elementos**.${semNada.length ? ` Sem classe, elemento nem Únicos: ${lista(semNada.map(ch => `${ch.nome} (${ch.origem})`))}.` : ''}`);

// ---------- a régua ----------
p('## 2. A régua: quanto custa fechar um breakpoint',
  `Pra ter b campeões diferentes de um traço que tem n, num pool de ${U}, esperam-se (${U}/${VAGAS})·Σ_{j<b} 1/(n − j) lojas (cada vaga mostra um campeão qualquer; a conta está no README e a simulação loja a loja confere). O custo só depende de n: **equilíbrio é todo traço com a mesma escada ter o mesmo n**. O tamanho certo é o de uma origem média, n* = ${U} ÷ ${O} = **${f(nAlvo, 1)}**. Lojas pra fechar cada breakpoint, por tamanho do traço:`);
const amostras = [...new Set([12, 16, fx.min, Math.round(nAlvo), fx.max, 40, 55])].sort((a, b) => a - b);
p(tabela(['Campeões no traço', ...ESCADA.map(b => `Fechar ${b}`), `Custo de fechar ${ESCADA.at(-1)} (1 = tamanho certo)`],
  amostras.map(n => [n, ...ESCADA.map(b => f(m.custoFechar(b, n, U, VAGAS), 1)), x(r6(n))])));
p(`**Faixa aceitável: de ${fx.min} a ${fx.max} campeões por traço.** Abaixo de ${fx.min}, fechar ${ESCADA.at(-1)} custa mais de ${f(1 + TOLERANCIA, 2)}× o de um traço do tamanho certo; acima de ${fx.max}, menos de ${f(1 / (1 + TOLERANCIA), 2)}×. Traço grande demais não obriga breakpoint maior (o tabuleiro tem ${TABULEIRO}): ele só fica barato, e a comp dele fica forte demais.`);

// ---------- classes ----------
// franquia que falta: as vagas de classe dela vão, uma por vez, pra classe menor no momento
const vagasClasse = Math.round(Y * faltam.length * c);
const vagasElemento = Math.round(Y * faltam.length * e);
const ganhoClasse = m.encher(nClasse, vagasClasse);
const ganhoElemento = m.encher(nElemento, vagasElemento);
const depois = Object.fromEntries(Object.entries(nClasse).map(([nome, n]) => [nome, n + ganhoClasse[nome]]));
const recebem = obj => Object.entries(obj).filter(([, g]) => g > 0).sort((a, b) => b[1] - a[1]).map(([nome, g]) => `${nome} ${g}`);
const sobra = Object.entries(depois).filter(([, n]) => n > fx.max).map(([nome, n]) => [nome, n - fx.max]);
const falta = Object.entries(depois).filter(([, n]) => n < fx.min).map(([nome, n]) => [nome, fx.min - n]);
const totSobra = m.soma(sobra.map(([, q]) => q));
const totFalta = m.soma(falta.map(([, q]) => q));
const comOutra = nome => campeoes.filter(ch => ch.classes.includes(nome) && ch.classes.length > 1);
const soElemento = campeoes.filter(ch => !ch.classes.length);
p(`## 3. Classes contra a faixa (${fx.min} a ${fx.max})`,
  faltam.length
    ? `**${lista(faltam)}:** ${Y} campeões cada (tamanho de uma origem média, ${U0} ÷ ${O0}). Com ${f(c, 2)} classes por campeão, como o resto do set, dão **${vagasClasse} vagas de classe**; a conta dá cada vaga pra classe que estiver menor no momento, a divisão que deixa a classe mais cara de fechar o mais barata possível. A coluna "Recebe" é essa cota.`
    : `Todas as franquias têm campeões marcados. Cada classe contra a faixa, e o que mexer pra ela entrar:`);
p(tabela(['Classe', 'Campeões', ...(faltam.length ? ['Recebe', 'Depois'] : []), `Custo de fechar ${ESCADA.at(-1)}`, 'Situação'],
  Object.entries(nClasse).sort((a, b) => a[1] - b[1]).map(([nome, n]) => {
    const d = depois[nome];
    const sit = d < fx.min ? `faltam ${fx.min - d}` : d > fx.max ? `sobram ${d - fx.max} (${comOutra(nome).length} têm outra classe)` : 'na faixa';
    return [nome, n, ...(faltam.length ? [ganhoClasse[nome] || '—', d] : []), x(r6(d)), sit];
  })));
if (sobra.length || falta.length) {
  const trocas = Math.min(totSobra, totFalta);
  p(`**O que mexer:** ${trocas ? `trocar a classe de ${trocas} campeões, de ${lista(sobra.map(([nome, q]) => `${nome} (${q})`))} pra ${lista(falta.map(([nome, q]) => `${nome} (${q})`))}` : ''}${totFalta > totSobra ? `${trocas ? '; e ' : ''}dar ${lista(falta.map(([nome]) => nome))} a mais ${totFalta - totSobra} campeões que hoje não têm classe (${soElemento.length})` : ''}${totSobra > totFalta ? `${trocas ? '; e ' : ''}tirar a classe de mais ${totSobra - totFalta} que têm outra` : ''}. Quem dá pra trocar sem ficar sem classe (tem outra):`);
  for (const [nome] of sobra) p(`- **${nome}:** ${comOutra(nome).map(ch => `${ch.nome} (${ch.origem}: ${ch.classes.filter(cl => cl !== nome).join(', ')})`).join('; ')}`);
  if (totFalta > totSobra) p(`Sem classe (só elemento ou Únicos), candidatos pra ${lista(falta.map(([nome]) => nome))}: ${soElemento.map(ch => `${ch.nome} (${ch.origem}${ch.elementos.length ? `: ${ch.elementos.join(', ')}` : ''})`).join('; ')}.`);
}

// ---------- elementos ----------
const elemDepois = Object.fromEntries(Object.entries(nElemento).map(([nome, n]) => [nome, n + ganhoElemento[nome]]));
const mediaElem = m.media(Object.values(elemDepois));
const escadaElem = m.escadaEquivalente(Math.round(mediaElem), nAlvo, ESCADA, U, TABULEIRO, 2);
const fxElem = m.faixa(mediaElem, escadaElem.degraus.at(-1), U, TOLERANCIA, VAGAS);
const elementosIdeais = (U0 * e + vagasElemento) / nAlvo;
p('## 4. Elementos',
  `Com ${f(e, 2)} elemento por campeão, cada elemento fica com uns ${f(mediaElem, 0)} campeões, abaixo da faixa das classes: com ${ESCADA.join('/')}, fechar ${ESCADA.at(-1)} custa ${x(r6(Math.round(mediaElem)))} o de uma classe. Duas saídas: (a) elementos com escada própria, **${escadaElem.degraus.join('/')}** (custo de cada degrau contra o da classe: ${escadaElem.razoes.map(v => x(v)).join(' · ')}); ou (b) menos elementos: com as vagas de hoje, o número que deixa cada um do tamanho de uma classe é ${f(elementosIdeais, 1)}.`,
  `Com a escada própria, entre si os elementos ficam iguais quando cada um tem de ${fxElem.min} a ${fxElem.max} (fechar ${escadaElem.degraus.at(-1)} até ${f(TOLERANCIA * 100, 0)}% longe da média deles).`);
p(tabela(['Elemento', 'Campeões', ...(faltam.length ? ['Recebe', 'Depois'] : []), 'Situação'],
  Object.entries(nElemento).sort((a, b) => a[1] - b[1]).map(([nome, n]) => {
    const d = elemDepois[nome];
    return [nome, n, ...(faltam.length ? [ganhoElemento[nome] || '—', d] : []), d < fxElem.min ? `faltam ${fxElem.min - d}` : d > fxElem.max ? `sobram ${d - fxElem.max}` : 'na faixa'];
  })));
const elemFora = Object.entries(elemDepois).filter(([, d]) => d < fxElem.min || d > fxElem.max).map(([nome, d]) => `${nome} (${d < fxElem.min ? `faltam ${fxElem.min - d}` : `sobram ${d - fxElem.max}`})`);

// ---------- quantos traços ----------
p('## 5. Quantas classes e quantos elementos',
  `Cada campeão entra em 1 origem, c classes e e elementos, então as vagas somam U·(1 + c + e). Com todo traço do tamanho n*: **classes = origens × c** e **elementos = origens × e**.`);
p(tabela(['', 'Valor'], [
  ['Origens', O],
  ['n* (campeões por traço)', f(nAlvo, 1)],
  [`Classes ideais (${f(c, 2)} por campeão)`, f(O * c, 1)],
  [`Elementos ideais (${f(e, 2)} por campeão)`, f(O * e, 1)],
  [`Elementos ideais se todo campeão tiver 1`, O],
]));
p(`**${GERAIS.length} classes estão certas** (a conta pede ${f(O * c, 1)}). Os ${ELEMENTOS.length} elementos pedem mais campeões com elemento (${f(ELEMENTOS.length / O, 2)} por campeão, hoje ${f(e, 2)}) ou a escada própria da seção 4.`);

// ---------- origens ----------
const origens = [...porFranquia, ...faltam.map(o => ({ origem: `${o} (a escolher)`, campeoes: Y }))];
p('## 6. Origens: o tamanho é fixo, então a escada muda',
  `Uma franquia com mais campeões fecha ${ESCADA.join('/')} mais barato. Pra igualar, a escada de cada origem sobe ou desce até o custo de cada degrau ficar o mais perto do de uma origem média (${f(nAlvo, 1)} campeões com ${ESCADA.join('/')}), sem passar do tabuleiro (${TABULEIRO}).`);
const escadas = new Map(origens.map(o => [o.origem, m.escadaEquivalente(o.campeoes, nAlvo, ESCADA, U, TABULEIRO)]));
p(tabela(['Origem', 'Campeões', `Custo de fechar ${ESCADA.at(-1)} com ${ESCADA.join('/')}`, 'Escada que iguala', 'Custo de cada degrau (1 = igual)'],
  origens.map(o => {
    const esc = escadas.get(o.origem);
    return [o.origem, o.campeoes, o.campeoes >= ESCADA.at(-1) ? x(r6(o.campeoes)) : 'não fecha', esc.degraus.join('/'), esc.razoes.map(v => x(v)).join(' · ')];
  })));
const grandes = origens.filter(o => {
  const esc = escadas.get(o.origem);
  return esc.degraus.at(-1) === TABULEIRO && (esc.degraus.length < ESCADA.length || esc.razoes.at(-1) < 0.9);
}).map(o => o.origem);
const pequenas = origens.filter(o => escadas.get(o.origem).degraus[0] === 1).map(o => o.origem);
p(`${grandes.length ? `${lista(grandes)} não se iguala${grandes.length > 1 ? 'm' : ''} nem com a escada no limite do tabuleiro. ` : ''}${pequenas.length ? `${lista(pequenas)} só se iguala${pequenas.length > 1 ? 'm' : ''} com um degrau 1 (ativo com um campeão só). ` : ''}A alternativa à escada é mexer no tamanho: de ${fx.min} a ${fx.max} campeões, a origem usa ${ESCADA.join('/')}.`);

// ---------- comps que fecham dois traços ----------
p('## 7. Comps que fecham origem e classe juntas',
  `Pra fechar 6 de uma origem e 4 de uma classe em ${TABULEIRO} vagas, pelo menos ${6 + 4 - TABULEIRO} campeão precisa ter as duas; pra 6 e 6, ${6 + 6 - TABULEIRO}. Com as classes de hoje, em quantas das ${GERAIS.length} classes cada origem consegue isso:`);
p(tabela(['Origem', `6 + 4 (≥ ${6 + 4 - TABULEIRO} em comum)`, `6 + 6 (≥ ${6 + 6 - TABULEIRO} em comum)`, 'Classe mais concentrada nela'],
  porFranquia.map(o => {
    const daqui = campeoes.filter(ch => ch.origem === o.origem);
    const sobrep = GERAIS.map(cl => [cl.nome, daqui.filter(ch => ch.classes.includes(cl.nome)).length]);
    const [cn, cq] = sobrep.reduce((a, b) => (b[1] / (nClasse[b[0]] || 1) > a[1] / (nClasse[a[0]] || 1) ? b : a));
    return [o.origem, sobrep.filter(([, v]) => v >= 6 + 4 - TABULEIRO).length, sobrep.filter(([, v]) => v >= 6 + 6 - TABULEIRO).length, `${cn}: ${cq} de ${nClasse[cn]}`];
  })));
const emComum = nAlvo * nAlvo / U;
p(`Com tudo do tamanho certo e as classes espalhadas, uma origem e uma classe têm em média n*·n*/${U} = ${f(emComum, 1)} campeões em comum. ${emComum >= 6 + 6 - TABULEIRO ? `Dá 6 + 6 em ${TABULEIRO} vagas com quase qualquer par.` : `Dá 6 + 4 com quase qualquer par; 6 + 6 (${6 + 6 - TABULEIRO} em comum) fica no limite: sai quando a classe tem um pouco mais daquela origem que a média.`}`);

// ---------- loja ----------
// ainda sem tabela de chances própria: o custo 1 no nível 4 do TFT (55% das vagas), só de referência
const CUSTOS = 5;
const CHANCE = 0.55;
// jogador simulado: tabuleiro de 7 campeões de um traço com pelo menos 8
const TAB_LOJA = 7;
const RODADAS = 20000;
// critério do melhor desenho: m3 em pelo menos 75% do da loja normal; empate = menos de 2% de diferença em m1 + m2
const VARIEDADE = 0.75;
const EMPATE = 0.02;
// desenhos: vagas × peso do dono × (nada, vaga do time, peso 2 pra quem divide traço com o tabuleiro)
const desenhos = [];
for (const vagas of [5, 6, 7]) {
  for (const [vagaDoTime, pesoTime] of [[0, 1], [1, 1], [0, 2]]) {
    for (const pesoDono of [1, 2, 3, 4]) desenhos.push({ vagas, pesoDono, vagaDoTime, pesoTime });
  }
}
const setLoja = campeoes.map(ch => ({ tracos: [ch.origem, ...ch.classes] }));
const opLoja = { chance: CHANCE, custos: CUSTOS, tabuleiro: TAB_LOJA, minTraco: TAB_LOJA + 1, rodadas: RODADAS, semente: 1 };
const loja = desenhos.map(d => ({ ...d, ...m.simularLoja(setLoja, d, opLoja) }));
const acha = d => loja.find(r => r.vagas === d.vagas && r.pesoDono === d.pesoDono && r.vagaDoTime === (d.vagaDoTime ?? 0) && r.pesoTime === (d.pesoTime ?? 1));
const normal = acha({ vagas: 5, pesoDono: 1 });
const pedido = acha({ vagas: 6, pesoDono: 3 });
const pedidoTime = acha({ vagas: 6, pesoDono: 3, vagaDoTime: 1 });
const criterio = { variedade: VARIEDADE, empate: EMPATE };
const melhor = m.melhorDesenho(loja, normal, criterio);
const melhorCom = v => m.melhorDesenho(loja.filter(d => d.vagas === v), normal, criterio);
const nomeLoja = d => [`${d.vagas} vagas`, d.pesoDono > 1 ? `peso ${d.pesoDono} pro dono` : '', d.vagaDoTime ? 'vaga do time' : '', d.pesoTime > 1 ? `peso ${d.pesoTime} pro time` : ''].filter(Boolean).join(' + ');
const somaM = d => d.m1 + d.m2;
const menos = (a, b) => `${f((1 - somaM(a) / somaM(b)) * 100, 0)}%`;
const pct = v => `${f(v * 100, 0)}%`;
// o que cada mecânica faz, comparando cada desenho com o mesmo sem ela
const semIsso = (ds, chave, valor) => ds.map(d => [d, acha({ ...d, [chave]: valor })]);
const comVagaTime = semIsso(loja.filter(d => d.vagaDoTime), 'vagaDoTime', 0);
const ganhoTime = m.media(comVagaTime.map(([d, s]) => 1 - somaM(d) / somaM(s)));
const perdaTime = m.media(comVagaTime.map(([d, s]) => 1 - d.m3 / s.m3));
const comPesoTime = semIsso(loja.filter(d => d.pesoTime > 1), 'pesoTime', 1);
const m1PesoTime = m.media(comPesoTime.map(([d, s]) => d.m1 / s.m1 - 1));
const m2PesoTime = m.media(comPesoTime.map(([d, s]) => 1 - d.m2 / s.m2));
const pesoTimePiora = comPesoTime.every(([d, s]) => somaM(d) > somaM(s));
// mais vaga e mais peso do dono sempre baixam m1 + m2? e algum desenho perde variedade a ponto de sair?
const maisEhMelhor = loja.every(d => [acha({ ...d, vagas: d.vagas + 1 }), acha({ ...d, pesoDono: d.pesoDono + 1 })].every(o => !o || somaM(o) < somaM(d)));
const menorM3 = loja.reduce((a, d) => (d.m3 < a.m3 ? d : a));
const foraVariedade = loja.filter(d => d.m3 < VARIEDADE * normal.m3);
const tamanhosCusto = m.porCusto(U0, new Array(CUSTOS).fill(1));
const isolado = m.rolagensEsperadas({ chance: CHANCE, campeoes: m.campeoesComPeso(U0 / CUSTOS, 3), copias: 1e9, alvo: 2, vagas: 6 });
const vagasLoja = [...new Set(desenhos.map(d => d.vagas))];
p('## 8. Loja: que desenho junta cópias e acha o traço mais rápido',
  `Os custos ainda não existem, então cada rodada divide os ${U0} campeões ao acaso em ${CUSTOS} custos de tamanho igual (${lista([...new Set(tamanhosCusto)].map(String))}) e olha um deles; cada vaga cai nesse custo com ${f(CHANCE * 100, 0)}% de chance (o custo 1 no nível 4 do TFT, de referência). O jogador simulado escolhe um traço T (origem ou classe com pelo menos ${TAB_LOJA + 1} campeões) e tem ${TAB_LOJA} campeões de T ao acaso no tabuleiro, de qualquer custo; os que caíram no custo olhado são os **donos**. Em média, ${pct(normal.fracaoTime)} do custo divide origem ou classe com o tabuleiro. **Cópias infinitas: o pool não esvazia.** Média de ${RODADAS} rodadas, as mesmas em todos os desenhos (semente fixa; trocar a semente muda m1 + m2 em uns 1%); m1 conta só as ${normal.rodadasM1} com dono no custo, m2 só as ${normal.rodadasM2} com algum campeão de T fora do tabuleiro no custo.`);
p(`Desenhos: ${lista(vagasLoja.map(String))} vagas; **peso do dono** (o campeão que o jogador já tem pesa isso no sorteio do custo, os outros 1); **vaga do time** (uma das vagas sorteia só entre os campeões do custo que dividem origem ou classe com o tabuleiro); e, de ideia extra, **peso 2 pro time** (quem divide origem ou classe com o tabuleiro pesa 2 em toda vaga). Medidas: **m1** = lojas pra juntar 2 cópias a mais de um dono (a 2 estrelas); **m2** = lojas até aparecer um campeão de T que não está no tabuleiro; **m3** = campeões diferentes fora do tabuleiro por loja, nesse custo (opção de mudar de comp). Ordenado por m1 + m2; em negrito, a loja normal, a de 6 vagas + peso 3 e a melhor.`);
p(tabela(['Desenho', 'm1', 'm2', 'm1 + m2', 'm3', 'm3 contra a loja normal'],
  [...loja].sort((a, b) => somaM(a) - somaM(b)).map(d => {
    const b = s => ([normal, pedido, melhor].includes(d) ? `**${s}**` : s);
    return [b(nomeLoja(d)), f(d.m1), f(d.m2), b(f(somaM(d))), f(d.m3, 2), pct(d.m3 / normal.m3)];
  })));
p(`**Melhor pelo critério (README, conta 10): ${nomeLoja(melhor)}.** m1 + m2 = ${f(somaM(melhor))} lojas (m1 ${f(melhor.m1)}, m2 ${f(melhor.m2)}), ${menos(melhor, pedido)} menos que a de 6 vagas + peso 3 (${f(somaM(pedido))}: m1 ${f(pedido.m1)}, m2 ${f(pedido.m2)}) e ${menos(melhor, normal)} menos que a loja normal de 5 vagas (${f(somaM(normal))}: m1 ${f(normal.m1)}, m2 ${f(normal.m2)}), com m3 em ${pct(melhor.m3 / normal.m3)} do da loja normal.`);
p(`Por quê: ${maisEhMelhor ? 'cada vaga e cada ponto de peso do dono a mais baixam m1 + m2' : `é a menor soma entre os desenhos que passam`}, e ${foraVariedade.length ? `${foraVariedade.length} desenhos ficam de fora por variedade (m3 abaixo de ${pct(VARIEDADE)} do da loja normal)` : `nenhum desenho perde variedade a ponto de sair (o menor m3, de ${nomeLoja(menorM3)}, é ${pct(menorM3.m3 / normal.m3)} do da loja normal; o corte é ${pct(VARIEDADE)})`}${maisEhMelhor && !foraVariedade.length ? ', então o critério vai pro canto da grade' : ''}. A vaga do time tira em média ${pct(ganhoTime)} de m1 + m2 e ${pct(perdaTime)} de m3. O peso 2 pro time ${pesoTimePiora ? 'piora m1 + m2 em todo desenho' : 'não compensa sempre'}: o dono divide o sorteio com quem divide traço com o tabuleiro e sai menos (m1 ${pct(m1PesoTime)} maior), e m2 cai só ${pct(m2PesoTime)}.`);
if (maisEhMelhor) p(`O critério não cobra nada por acelerar, então vai pro máximo da grade; o teto de verdade vem da economia (ouro por rodada, 2 de ouro por loja), que ainda não tem conta aqui. Com o número de vagas fixado, o melhor de cada um: ${vagasLoja.map(v => `${nomeLoja(melhorCom(v))} (m1 + m2 = ${f(somaM(melhorCom(v)))})`).join('; ')}. Na de 6 vagas + peso 3, só ligar a vaga do time baixa m1 + m2 de ${f(somaM(pedido))} pra ${f(somaM(pedidoTime))} (${menos(pedidoTime, pedido)}).`);
p(`Conferência: a conta 9 do README (um dono sozinho num custo de ${f(U0 / CUSTOS, 0)}) dá ${f(isolado)} lojas de m1 pra 6 vagas + peso 3; a simulação com o set dá ${f(pedido.m1)}. Ter mais de um campeão no mesmo custo divide o peso, mas acontece pouco e muda pouco.`);

// resumo no topo, depois do título e da linha de geração
const foraDoTamanho = origens.filter(o => o.campeoes < fx.min || o.campeoes > fx.max).map(o => `${o.origem} (${o.campeoes})`);
out.splice(4, 0, '## Resumo', '', [
  `- **Tamanho certo de um traço:** ${f(nAlvo, 1)} campeões; aceitável de ${fx.min} a ${fx.max} (custo de fechar ${ESCADA.at(-1)} até ${f(TOLERANCIA * 100, 0)}% longe).`,
  ...(faltam.length ? [`- **${lista(faltam)}:** ${Y} campeões cada, com ${vagasClasse} vagas de classe: ${lista(recebem(ganhoClasse))}; e ${vagasElemento} de elemento: ${lista(recebem(ganhoElemento))} (seção 3).`] : []),
  `- **Classes:** de ${Math.min(...Object.values(depois))} a ${Math.max(...Object.values(depois))}. ${sobra.length || falta.length ? `Fora da faixa: ${lista([...sobra.map(([nome, q]) => `${nome} (sobram ${q})`), ...falta.map(([nome, q]) => `${nome} (faltam ${q})`)])} (seção 3).` : 'Todas na faixa.'}`,
  `- **Elementos:** uns ${f(mediaElem, 0)} cada; com ${ESCADA.join('/')} custam ${x(r6(Math.round(mediaElem)))} pra fechar ${ESCADA.at(-1)}. Escada própria ${escadaElem.degraus.join('/')}, ou ${f(elementosIdeais, 0)} elementos.${elemFora.length ? ` Entre si, fora: ${lista(elemFora)} (seção 4).` : ''}`,
  `- **Origens fora da faixa:** ${foraDoTamanho.length ? `${lista(foraDoTamanho)}: escada própria ou mudar o tamanho (seção 6).` : 'nenhuma.'}`,
  `- **Loja:** pelo critério (menor m1 + m2 sem perder variedade), o melhor desenho é **${nomeLoja(melhor)}**: 2 cópias a mais de um campeão do tabuleiro em ${f(melhor.m1)} lojas e um campeão novo do traço em ${f(melhor.m2)}, contra ${f(pedido.m1)} e ${f(pedido.m2)} com 6 vagas + peso 3 e ${f(normal.m1)} e ${f(normal.m2)} na loja normal de 5.${maisEhMelhor ? ' O critério premia sempre mais vagas e mais peso; o teto vem da economia, que falta' : ''} (seção 8).`,
].join('\n'), '');

fs.writeFileSync(SAIDA, out.join('\n'));
console.log(`gravado ${SAIDA}: ${U0} campeões${faltam.length ? ` + ${Y} de cada franquia sem marcados` : ''}, n* ${f(nAlvo, 1)}, faixa ${fx.min}–${fx.max}`);
