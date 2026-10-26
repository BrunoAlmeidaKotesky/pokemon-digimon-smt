// Catálogo pro planejamento do Set 1 do modo estilo TFT: pra cada franquia, as informações que a fonte dela tem de
// cada personagem (tipo, classe, região...), gravadas em public/catalogo/<chave>.json. A aba "Catálogo" do site junta
// isso com a lista de personagens (nome e imagem) e deixa marcar quem entra no set.
//
// Uso (na pasta do repositório, Node 22 ou mais novo):
//   node catalogo.mjs              -> gera todas as franquias que têm coletor em catalogo/
//   node catalogo.mjs pokemon lol  -> só essas
//
// Cada franquia é um módulo catalogo/<chave>.mjs que exporta por padrão:
//   {
//     chave: 'pokemon',                       // a mesma chave do site (src/sources)
//     fonte: 'PokeAPI (GraphQL)',             // de onde vêm as informações, pra mostrar na aba
//     campos: [{ id: 'tipo', rotulo: 'Tipo' }, ...],   // na ordem em que aparecem
//     async gerar() {                         // -> { itens, imagens? }
//       return {
//         itens: { 'Bulbasaur': { tipo: ['Grass', 'Poison'], geracao: 'I' }, ... },
//         imagens: { 'Agumon': 'https://...' },   // opcional: imagem pra quem vem sem imagem na lista do site
//       };
//     },
//   }
// A chave de `itens` é o nome EXATAMENTE como o site mostra (o nome é a chave do saco de sorteio e das marcações).
// Valor de campo: texto, número ou lista de textos; campo sem informação fica de fora do item.
//
// Saída (public/catalogo/<chave>.json):
//   { "chave", "fonte", "geradoEm": "AAAA-MM-DD", "campos": [...], "itens": {...}, "imagens"?: {...} }

import fs from 'node:fs/promises';

const DIR = 'catalogo';
const OUT = 'public/catalogo';

const pedidas = process.argv.slice(2);
const todas = (await fs.readdir(DIR)).filter(f => f.endsWith('.mjs') && f !== 'util.mjs').map(f => f.slice(0, -4));
const chaves = pedidas.length ? pedidas : todas;
const faltam = chaves.filter(k => !todas.includes(k));
if (faltam.length) {
  console.error(`sem coletor em ${DIR}/: ${faltam.join(', ')}`);
  process.exit(1);
}

await fs.mkdir(OUT, { recursive: true });
let erros = 0;
for (const k of chaves) {
  const t0 = Date.now();
  try {
    const mod = (await import(`./${DIR}/${k}.mjs`)).default;
    if (mod.chave !== k) throw new Error(`o módulo diz chave "${mod.chave}", o arquivo é ${k}.mjs`);
    const { itens, imagens } = await mod.gerar();
    const ids = new Set(mod.campos.map(c => c.id));
    const nomes = Object.keys(itens);
    // conferência: campo que não foi declarado, valor de tipo errado
    for (const [nome, info] of Object.entries(itens)) {
      for (const [c, v] of Object.entries(info)) {
        if (!ids.has(c)) throw new Error(`${nome}: campo "${c}" não está em campos`);
        const ok = typeof v === 'string' || typeof v === 'number' || (Array.isArray(v) && v.every(x => typeof x === 'string'));
        if (!ok) throw new Error(`${nome}: valor inválido em "${c}"`);
      }
    }
    const cobertura = mod.campos.map(c => `${c.rotulo} ${Math.round((100 * nomes.filter(n => itens[n][c.id] !== undefined).length) / (nomes.length || 1))}%`).join(', ');
    const saida = { chave: k, fonte: mod.fonte, geradoEm: new Date().toISOString().slice(0, 10), campos: mod.campos, itens, ...(imagens && Object.keys(imagens).length ? { imagens } : {}) };
    await fs.writeFile(`${OUT}/${k}.json`, JSON.stringify(saida) + '\n');
    console.log(`${k}: ${nomes.length} personagens em ${((Date.now() - t0) / 1000).toFixed(0)} s (${cobertura})`);
  } catch (e) {
    erros++;
    console.error(`${k}: ERRO ${e.message}`);
  }
}
if (erros) process.exit(1);
