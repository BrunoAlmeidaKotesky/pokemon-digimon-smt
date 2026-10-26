// Sujimon: os nomes e números de public/sujimon/list.json (a Sujidex do jogo, a mesma lista do site). Não existe API
// nem wiki com o elemento e a raridade de cada Sujimon do Infinite Wealth (a ficha da Yakuza Wiki é do Like a
// Dragon, e a gamerguides.com bloqueia agentes: não acessar). A melhor lista achada é o artigo do TheGamer com uma
// tabela por elemento (número do dossiê, nome, raridade): só cobre os ~150 recrutáveis, tem erros de digitação nos
// nomes (por isso a comparação tolera até 2 letras de diferença) e pode mudar de formato. Se o artigo falhar, sai só
// o número, com aviso.

import fs from 'node:fs/promises';
import { UA } from './util.mjs';

const LISTA = 'public/sujimon/list.json';
const ARTIGO = 'https://www.thegamer.com/like-a-dragon-infinite-wealth-complete-sujimon-dossier-complete-list/';

const ELEMENTO = { Fire: 'Fogo', Nature: 'Natureza', Frost: 'Gelo', Light: 'Luz', Shadow: 'Sombra' };
const RARIDADE = { Rookie: 'Novato', Bronze: 'Bronze', Silver: 'Prata', Gold: 'Ouro', Platinum: 'Platina' };

const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const texto = s => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#x27;|&#39;|&rsquo;/g, "'").replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();

function distancia(a, b) {
  let ant = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(ant[j] + 1, cur[j - 1] + 1, ant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    ant = cur;
  }
  return ant[b.length];
}

/** Linhas das tabelas do artigo: { elemento, nome, raridade }. A seção (h2) diz o elemento. */
async function artigo() {
  const r = await fetch(ARTIGO, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status} em ${ARTIGO}`);
  const html = await r.text();
  const linhas = [];
  for (const secao of html.split(/<h2[^>]*>/).slice(1)) {
    const el = /All (\w+) Element/.exec(texto(secao.slice(0, 400)))?.[1];
    const tabela = /<table[\s\S]*?<\/table>/.exec(secao)?.[0];
    if (!ELEMENTO[el] || !tabela) continue;
    for (const tr of tabela.match(/<tr[\s\S]*?<\/tr>/g) ?? []) {
      const [, nome, raridade] = (tr.match(/<td[\s\S]*?<\/td>/g) ?? []).map(texto);
      if (nome) linhas.push({ elemento: ELEMENTO[el], nome, raridade: RARIDADE[raridade] });
    }
  }
  if (linhas.length < 100) throw new Error(`o artigo veio com ${linhas.length} linhas (mudou de formato?)`);
  return linhas;
}

export default {
  chave: 'sujimon',
  fonte: 'Sujidex do jogo; elemento e raridade: TheGamer (só os recrutáveis)',
  campos: [
    { id: 'numero', rotulo: 'Nº na Sujidex' },
    { id: 'elemento', rotulo: 'Elemento' },
    { id: 'raridade', rotulo: 'Raridade' },
  ],
  async gerar() {
    const lista = JSON.parse(await fs.readFile(LISTA, 'utf8'));
    const itens = Object.fromEntries(lista.map(([nome, num]) => [nome, { numero: num }]));

    let linhas = [];
    try {
      linhas = await artigo();
    } catch (e) {
      console.warn(`  sujimon: sem elemento e raridade (${e.message})`);
    }
    // nome igual primeiro; depois, o que sobrou, com até 2 letras de diferença e um só candidato
    const porNome = new Map(lista.map(([nome]) => [norm(nome), nome]));
    const usados = new Set();
    const sobra = [];
    const aplicar = (nome, l) => {
      usados.add(nome);
      itens[nome].elemento = l.elemento;
      if (l.raridade) itens[nome].raridade = l.raridade;
    };
    for (const l of linhas) {
      const nome = porNome.get(norm(l.nome));
      if (nome && !usados.has(nome)) aplicar(nome, l);
      else sobra.push(l);
    }
    for (const l of sobra) {
      const perto = [...porNome].filter(([n, nome]) => !usados.has(nome) && distancia(n, norm(l.nome)) <= 2);
      if (perto.length === 1) aplicar(perto[0][1], l);
    }
    return { itens };
  },
};
