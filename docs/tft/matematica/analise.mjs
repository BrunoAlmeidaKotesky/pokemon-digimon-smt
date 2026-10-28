// Equilíbrio do Set 1 com os campeões que temos: quantas classes e elementos, de que tamanho, e com que breakpoints
// cada origem, pra fechar um breakpoint custar o mesmo em qualquer traço. Lê public/catalogo/set1-base.json e
// docs/tft/set1-escolhas-v2.json (as classes que o usuário deu no Catálogo) e grava resultado.md.
// Uso (na pasta do repositório): node docs/tft/matematica/analise.mjs
import fs from 'node:fs';
import * as m from './lib.mjs';

const ler = c => JSON.parse(fs.readFileSync(c, 'utf8'));
const base = ler('public/catalogo/set1-base.json');
const v2 = ler('docs/tft/set1-escolhas-v2.json');
const SAIDA = 'docs/tft/matematica/resultado.md';

// Escolhas de design que entram na conta (mude aqui):
// breakpoints das classes e elementos, como no doc
const ESCADA = [2, 4, 6];
// campeões no tabuleiro: ainda não decidido no doc; limita o maior breakpoint possível
const TABULEIRO = 9;
// vagas por loja: só multiplica todos os custos (não muda nenhuma comparação)
const VAGAS = 5;

const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '∞');
const x = r => `${f(r, 2)}×`;
const tabela = (cab, linhas) => [`| ${cab.join(' | ')} |`, `|${cab.map(() => '---').join('|')}|`, ...linhas.map(l => `| ${l.join(' | ')} |`)].join('\n');
const out = [];
const p = (...s) => out.push(...s, '');

// ---------- os campeões ----------
const ORIGENS = { pokemon: 'Pokémon', digimon: 'Digimon', smt: 'SMT', persona: 'Persona', jojo: 'JoJo', lol: 'LoL', overwatch: 'Overwatch', deadlock: 'Deadlock', sujimon: 'Sujimon', ygo: 'Yu-Gi-Oh!' };
const nomeClasse = Object.fromEntries(base.classes.map(c => [c.id, c.nome]));
const ehElemento = c => /^Elemento/.test(c.descricao ?? '');
const ELEMENTOS = base.classes.filter(ehElemento).map(c => c.nome);
const GERAIS = base.classes.filter(c => !ehElemento(c) && c.id !== 'unicos').map(c => c.nome);
const campeoes = [];
const porFranquia = [];
for (const [k, origem] of Object.entries(ORIGENS)) {
  const linhas = base.linhas[k] ?? [];
  const naLinha = new Set(linhas.flatMap(l => l.niveis.flat()));
  const soltos = (base.selecao[k] ?? []).filter(n => !naLinha.has(n));
  const us = v2.plano.unidades[k] ?? {};
  let semClasse = 0;
  // a linha é um campeão (cada forma é um nível); as classes dele são as de qualquer forma
  for (const formas of [...linhas.map(l => l.niveis.flat()), ...soltos.map(s => [s])]) {
    const classes = [...new Set(formas.flatMap(n => us[n]?.classes ?? []))].map(id => nomeClasse[id] ?? id).filter(c => c !== 'Únicos');
    if (!classes.length) semClasse++;
    campeoes.push({ nome: formas.at(-1), franquia: k, origem, classes });
  }
  porFranquia.push({ origem, formas: (base.selecao[k] ?? []).length, linhas: linhas.length, soltos: soltos.length, campeoes: linhas.length + soltos.length, semClasse });
}
const U = campeoes.length;
const O = porFranquia.length;
const comClasse = campeoes.filter(c => c.classes.length);
const c = m.soma(comClasse.map(x => x.classes.length)) / comClasse.length;
const histClasses = {};
for (const x of comClasse) histClasses[x.classes.length] = (histClasses[x.classes.length] ?? 0) + 1;
const exagero = comClasse.filter(x => x.classes.length > 3);
const semYgo = { u: U - porFranquia.find(x => x.origem === 'Yu-Gi-Oh!').campeoes, o: O - 1 };

p('# Resultado: equilíbrio do Set 1', '',
  `Gerado por \`node docs/tft/matematica/analise.mjs\` em ${new Date().toISOString().slice(0, 10)}. Método e fórmulas: [README.md](README.md). Escolhas que entram na conta: breakpoints ${ESCADA.join('/')}, tabuleiro de ${TABULEIRO}, loja de ${VAGAS} vagas.`);

p('## 1. O que temos',
  `Campeão = uma linha evolutiva (cada forma é um nível: o Ivysaur é o nível 2 do Bulbasaur) ou um personagem solto. As ${m.soma(porFranquia.map(x => x.formas))} formas do grupo "Set 1 (base)" dão **${U} campeões** (${semYgo.u} sem os ${U - semYgo.u} candidatos do Yu-Gi-Oh!, que ainda não têm classe). Bakugan (itens) e Final Fantasy (monstros) não são campeões.`);
p(tabela(['Origem', 'Formas', 'Linhas', 'Soltos', 'Campeões', 'Sem classe'], [
  ...porFranquia.map(x => [x.origem, x.formas, x.linhas, x.soltos, x.campeoes, x.semClasse]),
  ['**Total**', m.soma(porFranquia.map(x => x.formas)), m.soma(porFranquia.map(x => x.linhas)), m.soma(porFranquia.map(x => x.soltos)), `**${U}**`, m.soma(porFranquia.map(x => x.semClasse))],
]));
p(`Traços: ${O} origens, ${GERAIS.length} classes (${GERAIS.join(', ')}), ${ELEMENTOS.length} elementos e Únicos (que não junta ninguém: cada um é um traço próprio). Quem tem classe tem em média **${f(c, 2)} classes** (${Object.entries(histClasses).map(([q, n]) => `${n} com ${q}`).join(', ')}).${exagero.length ? ` ${exagero.map(x => `${x.nome} (${x.origem}) tem ${x.classes.length}`).join('; ')}: provavelmente marcado por engano, e puxa a média pra cima.` : ''}`);

// ---------- a régua ----------
const nAlvo = U / O;
p('## 2. A régua: quanto custa fechar um breakpoint',
  `Pra ter b campeões diferentes de um traço que tem n, num pool de ${U}, esperam-se (${U}/${VAGAS})·Σ_{j<b} 1/(n − j) lojas (cada vaga mostra um campeão qualquer; a conta está no README e a simulação loja a loja confere). O custo só depende de n: **equilíbrio é todo traço com a mesma escada ter o mesmo n**. Lojas pra fechar cada breakpoint, por tamanho do traço:`);
const amostras = [...new Set([12, 20, Math.round(nAlvo), 40, 57, 70])].sort((a, b) => a - b);
p(tabela(['Campeões no traço', ...ESCADA.map(b => `Fechar ${b}`)], amostras.map(n => [n, ...ESCADA.map(b => f(m.custoFechar(b, n, U, VAGAS), 1))])));

// ---------- quantos traços ----------
const cenario = (u, o) => {
  const n = u / o;
  return { u, o, n, classes1: o * 1, classesC: o * c, porClasse: (u * c) / GERAIS.length, elementos: o, porElemento: u / ELEMENTOS.length, reserva: (u * c) / (GERAIS.length + ELEMENTOS.length) };
};
const A = cenario(U, O);
const B = cenario(semYgo.u, semYgo.o);
const r6 = (n, alvo) => m.custoFechar(6, n, U, VAGAS) / m.custoFechar(6, alvo, U, VAGAS);
p('## 3. Quantas classes e quantos elementos',
  `As origens são fixas (uma por franquia), então o tamanho certo de um traço é o tamanho médio de uma origem: n* = campeões ÷ origens = ${U} ÷ ${O} = **${f(nAlvo, 1)}**. Cada campeão entra em 1 origem, c classes e e elementos, então as vagas somam ${U}·(1 + c + e). Com todo traço do tamanho n*: **classes = origens × c** e **elementos = origens × e**.`);
p(tabela(['', `Com o Yu-Gi-Oh! (${A.u})`, `Sem o Yu-Gi-Oh! (${B.u})`], [
  ['Origens', A.o, B.o],
  ['n* (campeões por traço)', f(A.n, 1), f(B.n, 1)],
  ['Classes ideais, 1 classe por campeão', f(A.classes1, 0), f(B.classes1, 0)],
  [`Classes ideais, ${f(c, 2)} por campeão (como hoje)`, f(A.classesC, 1), f(B.classesC, 1)],
  [`Campeões por classe, com as ${GERAIS.length} de hoje`, f(A.porClasse, 1), f(B.porClasse, 1)],
  ['Elementos ideais, 1 por campeão (3º traço de todo mundo)', A.elementos, B.elementos],
  [`Campeões por elemento, com os ${ELEMENTOS.length} de hoje`, f(A.porElemento, 1), f(B.porElemento, 1)],
]));
p(`**${GERAIS.length} classes estão certas**: a conta pede ${f(A.classesC, 1)} (${f(B.classesC, 1)} sem o Yu-Gi-Oh!). **${ELEMENTOS.length} elementos também**, se forem o 3º traço de todo mundo: a conta pede ${A.elementos} (${B.elementos} sem o Yu-Gi-Oh!), e cada um fica com ${f(A.porElemento, 0)} campeões, custando ${x(r6(A.porElemento, nAlvo))} uma origem média pra fechar 6.`);
p(`Como **classe reserva** (só pra quem não tem classe), os elementos dividem com as classes as mesmas ${f(U * c, 0)} vagas: ${GERAIS.length + ELEMENTOS.length} traços de ${f(A.reserva, 1)} campeões, e fechar 6 custa ${x(r6(A.reserva, nAlvo))} o de uma origem. Fica desequilibrado contra as origens; pra caber como reserva, a soma de classes e elementos teria de ficar em ${f(A.classesC, 0)}.`);

// ---------- cada traço contra o alvo ----------
const nTraco = new Map();
for (const ch of campeoes) for (const t of [ch.origem, ...ch.classes]) nTraco.set(t, (nTraco.get(t) ?? 0) + 1);
const alvoClasse = A.porClasse;
p('## 4. Cada classe hoje contra o tamanho certo',
  `Com ${f(c, 2)} classes por campeão e ${GERAIS.length} classes, cada uma deveria ter **${f(alvoClasse, 0)} campeões** (quando todos os ${U} tiverem classe). A coluna da direita diz quantas vezes mais caro (ou mais barato, abaixo de 1) é fechar 6 nela do que numa classe do tamanho certo.`);
p(tabela(['Classe', 'Campeões hoje', 'Tamanho certo', 'Falta (+) ou sobra (−)', 'Custo de fechar 6'],
  GERAIS.map(nome => {
    const n = nTraco.get(nome) ?? 0;
    const falta = Math.round(alvoClasse) - n;
    return [nome, n, f(alvoClasse, 0), falta > 0 ? `+${falta}` : `${falta}`, n >= 6 ? x(r6(n, alvoClasse)) : 'não fecha'];
  })));
p(`Hoje ${m.soma(porFranquia.map(x => x.semClasse))} campeões estão sem classe: são eles que completam as classes que faltam (as ${GERAIS.filter(nome => (nTraco.get(nome) ?? 0) < alvoClasse).length} com "+" somam ${m.soma(GERAIS.map(nome => Math.max(0, Math.round(alvoClasse) - (nTraco.get(nome) ?? 0))))} vagas). Elementos: nenhum dado ainda; o tamanho certo de cada um é ${f(A.porElemento, 0)}.`);

// ---------- origens ----------
p('## 5. Origens: o tamanho é fixo, então a escada muda',
  `Uma franquia com mais campeões fecha ${ESCADA.join('/')} mais barato. Pra igualar, a escada de cada origem sobe ou desce até o custo de cada degrau ficar o mais perto do de uma origem média (${f(nAlvo, 1)} campeões com ${ESCADA.join('/')}), sem passar do tabuleiro (${TABULEIRO}).`);
p(tabela(['Origem', 'Campeões', `Custo de fechar 6 com ${ESCADA.join('/')}`, 'Escada que iguala', 'Custo de cada degrau (1 = igual)'],
  porFranquia.map(o => {
    const e = m.escadaEquivalente(o.campeoes, nAlvo, ESCADA, U, TABULEIRO);
    return [o.origem, o.campeoes, o.campeoes >= 6 ? x(r6(o.campeoes, nAlvo)) : 'não fecha', e.degraus.join('/'), e.razoes.map(v => x(v)).join(' · ')];
  })));
// grande demais: a escada bate no tabuleiro e o último degrau (ou um degrau que falta) continua barato
const escadas = new Map(porFranquia.map(o => [o.origem, m.escadaEquivalente(o.campeoes, nAlvo, ESCADA, U, TABULEIRO)]));
const grandes = porFranquia.filter(o => {
  const e = escadas.get(o.origem);
  return e.degraus.at(-1) === TABULEIRO && (e.degraus.length < ESCADA.length || e.razoes.at(-1) < 0.9);
}).map(o => o.origem);
const pequenas = porFranquia.filter(o => escadas.get(o.origem).degraus[0] === 1).map(o => o.origem);
const lista = xs => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} e ${xs.at(-1)}` : xs[0]);
p(`${grandes.length ? `${lista(grandes)} não se iguala${grandes.length > 1 ? 'm' : ''} nem com a escada no limite do tabuleiro: o último degrau fica mais barato, ou falta degrau. ` : ''}${pequenas.length ? `${lista(pequenas)} só se iguala${pequenas.length > 1 ? 'm' : ''} com um degrau 1 (ativo com um campeão só). ` : ''}Nesses casos, a alternativa à escada é mexer no tamanho: com ${f(nAlvo, 0)} campeões por franquia, todas usam ${ESCADA.join('/')}.`);

// ---------- comps que fecham dois traços ----------
const naOrigem = new Map(porFranquia.map(o => [o.origem, campeoes.filter(ch => ch.origem === o.origem)]));
const linhasComp = porFranquia.map(o => {
  const lista = naOrigem.get(o.origem);
  const sobrep = GERAIS.map(cl => lista.filter(ch => ch.classes.includes(cl)).length);
  const esperado = GERAIS.map(cl => (o.campeoes * (nTraco.get(cl) ?? 0)) / U);
  return [o.origem, sobrep.filter(v => v >= 1).length, sobrep.filter(v => v >= 3).length, f(m.media(esperado), 1)];
});
p('## 6. Comps que fecham origem e classe juntas',
  `Pra fechar 6 de uma origem e 4 de uma classe em ${TABULEIRO} vagas, pelo menos ${6 + 4 - TABULEIRO} campeão precisa ter as duas; pra 6 e 6, ${6 + 6 - TABULEIRO}. Com as classes de hoje, em quantas das ${GERAIS.length} classes cada origem consegue isso:`);
p(tabela(['Origem', `6 + 4 (≥ ${6 + 4 - TABULEIRO} em comum)`, `6 + 6 (≥ ${6 + 6 - TABULEIRO} em comum)`, 'Em comum por classe, em média'], linhasComp));
p(`Com tudo do tamanho certo e as classes espalhadas pelas franquias, uma origem e uma classe têm em média n*·n_classe/${U} = ${f(nAlvo * alvoClasse / U, 1)} campeões em comum: dá 6 + 6 em ${TABULEIRO} vagas com quase qualquer par. Classe concentrada numa franquia só vira uma "sub-origem" e não cruza.`);

// resumo no topo, depois do título e da linha de geração
const foraDoTamanho = porFranquia.filter(o => o.campeoes >= 6 && (r6(o.campeoes, nAlvo) > 1.35 || r6(o.campeoes, nAlvo) < 0.75)).map(o => `${o.origem} (${o.campeoes})`);
out.splice(4, 0, '## Resumo', '', [
  `- **Classes:** ${GERAIS.length} é o número certo (a conta pede ${f(A.classesC, 1)}; ${f(B.classesC, 1)} sem o Yu-Gi-Oh!). Falta equilibrar o tamanho: cada uma com ${f(alvoClasse, 0)} campeões (${f(B.porClasse, 0)} sem o Yu-Gi-Oh!). Hoje vão de ${Math.min(...GERAIS.map(n => nTraco.get(n) ?? 0))} a ${Math.max(...GERAIS.map(n => nTraco.get(n) ?? 0))} (seção 4).`,
  `- **Elementos:** ${ELEMENTOS.length} é o número certo **se forem o 3º traço de todo mundo** (a conta pede ${A.elementos}; ${B.elementos} sem o Yu-Gi-Oh!), com ${f(A.porElemento, 0)} campeões cada. Como classe reserva, não: as classes ficariam com ${f(A.reserva, 0)} campeões e custariam ${x(r6(A.reserva, nAlvo))} uma origem pra fechar 6 (seção 3).`,
  `- **Origens:** a média é ${f(nAlvo, 1)} campeões. ${foraDoTamanho.length ? `Fechar 6 custa mais de 1,35× ou menos de 0,75× o da média em ${lista(foraDoTamanho)}. Ou a escada de cada uma muda, ou o tamanho (seção 5).` : 'Todas perto disso.'}`,
].join('\n'), '');

fs.writeFileSync(SAIDA, out.join('\n'));
console.log(`gravado ${SAIDA}: ${U} campeões, n* ${f(nAlvo, 1)}, classes ideais ${f(A.classesC, 1)}, elementos ideais ${A.elementos}`);
