// Equilíbrio do Set 1 com os campeões que o usuário marcou no Catálogo: o tamanho certo de cada traço, quantas cartas
// do Yu-Gi-Oh! (a franquia que falta) e quanto de cada classe e elemento dar a elas, e a escada de cada origem. Lê a
// exportação do Catálogo e grava resultado.md.
// Uso (na pasta do repositório): node docs/tft/matematica/analise.mjs
import fs from 'node:fs';
import * as m from './lib.mjs';

const ler = c => JSON.parse(fs.readFileSync(c, 'utf8'));
const EXPORTACAO = 'docs/tft/set1-escolhas-v3.json';
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
// franquia ainda sem ninguém marcado: entra com o tamanho de uma origem média
const FALTA = { chave: 'ygo', origem: 'Yu-Gi-Oh!' };
// elementos que o usuário não quer
const FORA = ['luz', 'trevas'];

const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '∞');
const x = r => `${f(r, 2)}×`;
const tabela = (cab, linhas) => [`| ${cab.join(' | ')} |`, `|${cab.map(() => '---').join('|')}|`, ...linhas.map(l => `| ${l.join(' | ')} |`)].join('\n');
const lista = xs => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} e ${xs.at(-1)}` : (xs[0] ?? ''));
const out = [];
const p = (...s) => out.push(...s, '');

// ---------- os campeões ----------
const ORIGENS = { pokemon: 'Pokémon', digimon: 'Digimon', smt: 'SMT', persona: 'Persona', jojo: 'JoJo', lol: 'LoL', overwatch: 'Overwatch', deadlock: 'Deadlock', sujimon: 'Sujimon' };
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
// a franquia que falta entra com o tamanho de uma origem média, e aí a média continua a mesma
const Y = Math.round(U0 / O0);
const U = U0 + Y;
const O = O0 + 1;
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
  `Campeão = uma linha evolutiva (cada forma é um nível: o Ivysaur é o nível 2 do Bulbasaur) ou um personagem solto. As ${m.soma(porFranquia.map(x => x.formas))} formas marcadas dão **${U0} campeões** em ${O0} franquias. ${FALTA.origem} ainda não tem ninguém marcado; nas contas entra com ${Y} (seção 3).`);
p(tabela(['Origem', 'Formas', 'Linhas', 'Soltos', 'Campeões', 'Só com elemento', 'Só Únicos', 'Sem nada'], [
  ...porFranquia.map(o => [o.origem, o.formas, o.linhas, o.soltos, o.campeoes, o.soElemento, o.soUnicos, o.nada]),
  ['**Total**', ...['formas', 'linhas', 'soltos'].map(k => m.soma(porFranquia.map(o => o[k]))), `**${U0}**`, ...['soElemento', 'soUnicos', 'nada'].map(k => m.soma(porFranquia.map(o => o[k])))],
]));
p(`Traços: ${O0} origens (${O} com ${FALTA.origem}), ${GERAIS.length} classes, ${ELEMENTOS.length} elementos (${ELEMENTOS.map(c => c.nome).join(', ')}; ${FORA.length} ficaram de fora) e Únicos, que não junta ninguém. Por campeão: **${f(c, 2)} classes** (${Object.entries(histClasses).map(([q, n]) => `${n} com ${q}`).join(', ')}) e **${f(e, 2)} elementos**.`);

// ---------- a régua ----------
p('## 2. A régua: quanto custa fechar um breakpoint',
  `Pra ter b campeões diferentes de um traço que tem n, num pool de ${U}, esperam-se (${U}/${VAGAS})·Σ_{j<b} 1/(n − j) lojas (cada vaga mostra um campeão qualquer; a conta está no README e a simulação loja a loja confere). O custo só depende de n: **equilíbrio é todo traço com a mesma escada ter o mesmo n**. O tamanho certo é o de uma origem média, n* = ${U} ÷ ${O} = **${f(nAlvo, 1)}**. Lojas pra fechar cada breakpoint, por tamanho do traço:`);
const amostras = [...new Set([12, 16, fx.min, Math.round(nAlvo), fx.max, 40, 55])].sort((a, b) => a - b);
p(tabela(['Campeões no traço', ...ESCADA.map(b => `Fechar ${b}`), `Custo de fechar ${ESCADA.at(-1)} (1 = tamanho certo)`],
  amostras.map(n => [n, ...ESCADA.map(b => f(m.custoFechar(b, n, U, VAGAS), 1)), x(r6(n))])));
p(`**Faixa aceitável: de ${fx.min} a ${fx.max} campeões por traço.** Abaixo de ${fx.min}, fechar ${ESCADA.at(-1)} custa mais de ${f(1 + TOLERANCIA, 2)}× o de um traço do tamanho certo; acima de ${fx.max}, menos de ${f(1 / (1 + TOLERANCIA), 2)}×. Traço grande demais não obriga breakpoint maior (o tabuleiro tem ${TABULEIRO}): ele só fica barato, e a comp dele fica forte demais.`);

// ---------- o que falta ----------
const vagasClasse = Math.round(Y * c);
const vagasElemento = Math.round(Y * e);
const ganhoClasse = m.encher(nClasse, vagasClasse);
const ganhoElemento = m.encher(nElemento, vagasElemento);
const precisaFaixa = m.soma(Object.values(nClasse).map(n => Math.max(0, fx.min - n)));
const precisaCentro = m.soma(Object.values(nClasse).map(n => Math.max(0, Math.round(nAlvo) - n)));
const comOutra = nome => campeoes.filter(ch => ch.classes.includes(nome) && ch.classes.length > 1).length;
const depois = Object.fromEntries(Object.entries(nClasse).map(([nome, n]) => [nome, n + ganhoClasse[nome]]));
const acima = Object.entries(depois).filter(([, n]) => n > fx.max);
const recebem = obj => Object.entries(obj).filter(([, g]) => g > 0).sort((a, b) => b[1] - a[1]).map(([nome, g]) => `${nome} ${g}`);
p(`## 3. ${FALTA.origem}: quantas cartas e que classes`,
  `**Cartas:** ${Y} campeões (tamanho de uma origem média, ${U0} ÷ ${O0}); qualquer número de ${fx.min} a ${fx.max} fica na faixa. Carta com evolução (uma linha) conta como um.`,
  `**Classes:** com ${f(c, 2)} classes por campeão, como o resto do set, as ${Y} cartas dão **${vagasClasse} vagas de classe** (quase todas com 1 classe, uma em cada ${f(1 / Math.max(c - 1, 1e-9), 0)} com 2). A conta dá cada vaga pra classe que estiver menor no momento: é a divisão que deixa a classe mais cara de fechar o mais barata possível.`);
p(tabela(['Classe', 'Hoje', `${FALTA.origem} recebe`, 'Depois', `Custo de fechar ${ESCADA.at(-1)}`, 'Situação'],
  Object.entries(nClasse).sort((a, b) => a[1] - b[1]).map(([nome, n]) => {
    const d = depois[nome];
    const sit = d < fx.min ? `abaixo da faixa: faltam ${fx.min - d}` : d > fx.max ? `acima da faixa: sobram ${d - fx.max} (${comOutra(nome)} têm outra classe)` : 'na faixa';
    return [nome, n, ganhoClasse[nome] || '—', d, x(r6(d)), sit];
  })));
p(`Pra todas as classes entrarem na faixa só com ${FALTA.origem}, são ${precisaFaixa} vagas; pra todas chegarem a ${Math.round(nAlvo)} (o centro), ${precisaCentro}, ou ${f(precisaCentro / Y, 1)} classes por carta.${acima.length ? ` ${lista(acima.map(([nome]) => nome))} já passa${acima.length > 1 ? 'm' : ''} da faixa sem o ${FALTA.origem}: carta nova não resolve, só tirar a classe de quem tem outra (a coluna diz quantos).` : ''}`);
p(`Uma classe que fica quase toda numa franquia vira uma segunda origem e não cruza com as outras (seção 6). Se a cota de uma classe pequena ficar grande demais pro ${FALTA.origem}, o resto dela pode vir dos campeões das outras franquias que hoje só têm elemento (${m.soma(porFranquia.map(o => o.soElemento))}).`);

const elemDepois = Object.fromEntries(Object.entries(nElemento).map(([nome, n]) => [nome, n + ganhoElemento[nome]]));
const mediaElem = m.media(Object.values(elemDepois));
const escadaElem = m.escadaEquivalente(Math.round(mediaElem), nAlvo, ESCADA, U, TABULEIRO, 2);
const elementosIdeais = (U0 * e + vagasElemento) / nAlvo;
p(`**Elementos:** com ${f(e, 2)} elemento por campeão, as ${Y} cartas dão **${vagasElemento} vagas de elemento**, divididas do mesmo jeito.`);
p(tabela(['Elemento', 'Hoje', `${FALTA.origem} recebe`, 'Depois'],
  Object.entries(nElemento).sort((a, b) => a[1] - b[1]).map(([nome, n]) => [nome, n, ganhoElemento[nome] || '—', elemDepois[nome]])));
p(`Mesmo assim cada elemento fica com uns ${f(mediaElem, 0)} campeões, abaixo da faixa: com ${ESCADA.join('/')}, fechar ${ESCADA.at(-1)} custa ${x(r6(Math.round(mediaElem)))} o de uma classe. Duas saídas: (a) elementos com escada própria, **${escadaElem.degraus.join('/')}** (custo de cada degrau: ${escadaElem.razoes.map(v => x(v)).join(' · ')}); ou (b) menos elementos: com as vagas de hoje, o número que deixa cada um do tamanho certo é ${f(elementosIdeais, 1)}.`);

// ---------- quantos traços ----------
p('## 4. Quantas classes e quantos elementos',
  `Cada campeão entra em 1 origem, c classes e e elementos, então as vagas somam U·(1 + c + e). Com todo traço do tamanho n*: **classes = origens × c** e **elementos = origens × e**.`);
p(tabela(['', 'Valor'], [
  ['Origens', O],
  ['n* (campeões por traço)', f(nAlvo, 1)],
  [`Classes ideais (${f(c, 2)} por campeão)`, f(O * c, 1)],
  [`Elementos ideais (${f(e, 2)} por campeão)`, f(O * e, 1)],
  [`Elementos ideais se todo campeão tiver 1`, O],
]));
p(`**${GERAIS.length} classes estão certas** (a conta pede ${f(O * c, 1)}). Os ${ELEMENTOS.length} elementos pedem mais campeões com elemento (${f(ELEMENTOS.length / O, 2)} por campeão, hoje ${f(e, 2)}) ou a escada própria da seção 3.`);

// ---------- origens ----------
const origens = [...porFranquia, { origem: `${FALTA.origem} (a escolher)`, campeoes: Y }];
p('## 5. Origens: o tamanho é fixo, então a escada muda',
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
p('## 6. Comps que fecham origem e classe juntas',
  `Pra fechar 6 de uma origem e 4 de uma classe em ${TABULEIRO} vagas, pelo menos ${6 + 4 - TABULEIRO} campeão precisa ter as duas; pra 6 e 6, ${6 + 6 - TABULEIRO}. Com as classes de hoje (sem o ${FALTA.origem}), em quantas das ${GERAIS.length} classes cada origem consegue isso:`);
p(tabela(['Origem', `6 + 4 (≥ ${6 + 4 - TABULEIRO} em comum)`, `6 + 6 (≥ ${6 + 6 - TABULEIRO} em comum)`, 'Classe mais concentrada nela'],
  porFranquia.map(o => {
    const daqui = campeoes.filter(ch => ch.origem === o.origem);
    const sobrep = GERAIS.map(cl => [cl.nome, daqui.filter(ch => ch.classes.includes(cl.nome)).length]);
    const [cn, cq] = sobrep.reduce((a, b) => (b[1] / (nClasse[b[0]] || 1) > a[1] / (nClasse[a[0]] || 1) ? b : a));
    return [o.origem, sobrep.filter(([, v]) => v >= 6 + 4 - TABULEIRO).length, sobrep.filter(([, v]) => v >= 6 + 6 - TABULEIRO).length, `${cn}: ${cq} de ${nClasse[cn]}`];
  })));
const emComum = nAlvo * nAlvo / U;
p(`Com tudo do tamanho certo e as classes espalhadas, uma origem e uma classe têm em média n*·n*/${U} = ${f(emComum, 1)} campeões em comum. ${emComum >= 6 + 6 - TABULEIRO ? `Dá 6 + 6 em ${TABULEIRO} vagas com quase qualquer par.` : `Dá 6 + 4 com quase qualquer par; 6 + 6 (${6 + 6 - TABULEIRO} em comum) fica no limite: sai quando a classe tem um pouco mais daquela origem que a média.`}`);

// resumo no topo, depois do título e da linha de geração
const foraDoTamanho = porFranquia.filter(o => o.campeoes < fx.min || o.campeoes > fx.max).map(o => `${o.origem} (${o.campeoes})`);
out.splice(4, 0, '## Resumo', '', [
  `- **Tamanho certo de um traço:** ${f(nAlvo, 1)} campeões; aceitável de ${fx.min} a ${fx.max} (custo de fechar ${ESCADA.at(-1)} até ${f(TOLERANCIA * 100, 0)}% longe).`,
  `- **${FALTA.origem}:** ${Y} cartas (${fx.min} a ${fx.max}), com ${vagasClasse} vagas de classe: ${lista(recebem(ganhoClasse))}; nada nas outras. E ${vagasElemento} de elemento: ${lista(recebem(ganhoElemento))} (seção 3).`,
  `- **Classes depois disso:** de ${Math.min(...Object.values(depois))} a ${Math.max(...Object.values(depois))}.${acima.length ? ` Acima da faixa: ${lista(acima.map(([nome, n]) => `${nome} (${n}, sobram ${n - fx.max})`))}; só tirando a classe de quem tem outra.` : ''}`,
  `- **Elementos:** uns ${f(mediaElem, 0)} cada; com ${ESCADA.join('/')} custam ${x(r6(Math.round(mediaElem)))} pra fechar ${ESCADA.at(-1)}. Escada própria ${escadaElem.degraus.join('/')}, ou ${f(elementosIdeais, 0)} elementos.`,
  `- **Origens fora da faixa:** ${foraDoTamanho.length ? `${lista(foraDoTamanho)}: escada própria ou mudar o tamanho (seção 5).` : 'nenhuma.'}`,
].join('\n'), '');

fs.writeFileSync(SAIDA, out.join('\n'));
console.log(`gravado ${SAIDA}: ${U0} campeões + ${Y} do ${FALTA.origem}, n* ${f(nAlvo, 1)}, faixa ${fx.min}–${fx.max}`);
