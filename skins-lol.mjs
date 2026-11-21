// Skins dos campeões de League of Legends pro modo Imagem da aba Adivinha: gera public/adivinha/skins/lol.json.
//
// O Data Dragon lista as skins de cada campeão (championFull.json) e serve a splash art de cada uma em
// cdn/img/champion/splash/<id>_<num>.jpg, com CORS liberado. No Imagem, o jogo sorteia uma das skins do campeão
// secreto e mostra um recorte dela. Chroma não tem splash própria e fica de fora.
//
// Uso (na pasta do repositório, Node 18 ou mais novo):
//   node skins-lol.mjs          -> grava public/adivinha/skins/lol.json
//
// Formato: { "base": "<url até splash/>", "itens": { "Wukong": ["MonkeyKing", [[0, "Wukong"], [1, "Volcanic Wukong"]]] } }
// A chave é o nome do campeão como o site mostra; depois vêm o id do Data Dragon e as skins [número, nome].
// O championFull lista junto as cromas (milhares), que não têm splash: cada número é conferido com HEAD e só entra o
// que existe. São ~9 mil pedidos ao CDN da Riot, 16 por vez.

import fs from 'node:fs/promises';
import { getJson, pool } from './catalogo/util.mjs';

const DD = 'https://ddragon.leagueoflegends.com';
const BASE = `${DD}/cdn/img/champion/splash/`;
const OUT = 'public/adivinha/skins/lol.json';

async function existe(url) {
  for (let t = 1; t <= 3; t++) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (r.ok) return true;
      if (r.status === 403 || r.status === 404) return false;
    } catch { /* tenta de novo */ }
    await new Promise(res => setTimeout(res, 800 * t));
  }
  return false;
}

const [v] = await getJson(`${DD}/api/versions.json`);
const full = await getJson(`${DD}/cdn/${v}/data/en_US/championFull.json`);
const champs = Object.values(full.data);
const todas = champs.flatMap(c => c.skins.map(s => ({ c, num: s.num, nome: s.name === 'default' ? c.name : s.name })));
const ok = await pool(todas, 16, s => existe(`${BASE}${s.c.id}_${s.num}.jpg`));
const fora = todas.filter((_, i) => !ok[i]);
const itens = {};
for (const c of champs.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
  const skins = todas.filter((s, i) => s.c === c && ok[i]).map(s => [s.num, s.nome]);
  if (skins.length) itens[c.name] = [c.id, skins];
  else console.warn(`sem nenhuma splash: ${c.name}`);
}
await fs.mkdir('public/adivinha/skins', { recursive: true });
await fs.writeFile(OUT, JSON.stringify({ base: BASE, versao: v, itens }) + '\n');
const total = Object.values(itens).reduce((n, x) => n + x[1].length, 0);
console.log(`${total} skins de ${Object.keys(itens).length} campeões em ${OUT} (Data Dragon ${v}).`);
console.log(`${fora.length} números sem splash ficaram de fora (cromas).`);
