// Baixa uma vez a arte dos monstros de Yu-Gi-Oh mais vistos na YGOPRODeck e guarda no repositório.
// A YGOPRODeck pede para não usar as imagens direto do site deles, então elas ficam em ygo/img.
import sharp from 'sharp';
import fs from 'node:fs/promises';

const LIMIT = Number(process.env.YGO_LIMIT || 3000);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const res = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes');
if (!res.ok) throw new Error('cardinfo ' + res.status);
const { data } = await res.json();

const views = c => c.misc_info?.[0]?.views ?? 0;
const official = c => (c.misc_info?.[0]?.formats || []).some(f => f === 'TCG' || f === 'OCG');
const monsters = data
  .filter(c => /Monster/.test(c.type) && !/Token/.test(c.type) && official(c) && c.card_images?.length)
  .sort((a, b) => views(b) - views(a));

const picked = [], seen = new Set();
for (const c of monsters) {
  if (seen.has(c.name)) continue;
  seen.add(c.name); picked.push(c);
  if (picked.length >= LIMIT) break;
}
console.log(`monstros oficiais: ${monsters.length}, escolhidos: ${picked.length}`);

await fs.mkdir('ygo/img', { recursive: true });
const have = new Set(await fs.readdir('ygo/img'));
const list = [];
let downloaded = 0;
for (const c of picked) {
  const img = c.card_images[0];
  const file = `${img.id}.webp`;
  if (!have.has(file)) {
    try {
      const r = await fetch(img.image_url_cropped);
      if (!r.ok) { console.log('falhou', c.name, r.status); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      await sharp(buf).resize(256, 256, { fit: 'inside' }).webp({ quality: 72 }).toFile('ygo/img/' + file);
      downloaded++;
    } catch (e) { console.log('falhou', c.name, e.message); continue; }
    await sleep(150); // bem abaixo do limite de 20 pedidos por segundo
  }
  list.push([c.name, img.id]);
}

const keep = new Set(list.map(([, id]) => `${id}.webp`));
for (const f of have) if (!keep.has(f)) await fs.unlink('ygo/img/' + f);

await fs.writeFile('ygo/list.json', JSON.stringify(list));
console.log(`lista: ${list.length}, baixadas agora: ${downloaded}`);
