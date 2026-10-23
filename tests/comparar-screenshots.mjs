// Compara relatorio/antes/*.png com relatorio/depois/*.png pixel a pixel.
// Gera relatorio/diff/<nome>.png (pixels diferentes em vermelho) e um resumo em relatorio/diferencas.md.
// Uso: node tests/comparar-screenshots.mjs [tolerância em % de pixels, padrão 0.5]
import fs from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const TOL = Number(process.argv[2] ?? 0.5);
const A = 'relatorio/antes', B = 'relatorio/depois', D = 'relatorio/diff';
fs.mkdirSync(D, { recursive: true });

const linhas = [];
let ruins = 0;
for (const nome of fs.readdirSync(A).filter(f => f.endsWith('.png')).sort()) {
  if (!fs.existsSync(`${B}/${nome}`)) { linhas.push(`| ${nome} | falta em depois/ | — |`); ruins++; continue; }
  const a = PNG.sync.read(fs.readFileSync(`${A}/${nome}`));
  const b = PNG.sync.read(fs.readFileSync(`${B}/${nome}`));
  // tamanhos diferentes: compara a área em comum e conta o resto como diferença
  const w = Math.max(a.width, b.width), h = Math.max(a.height, b.height);
  const pad = img => { const p = new PNG({ width: w, height: h }); p.data.fill(0); PNG.bitblt(img, p, 0, 0, img.width, img.height, 0, 0); return p; };
  const pa = pad(a), pb = pad(b), diff = new PNG({ width: w, height: h });
  const n = pixelmatch(pa.data, pb.data, diff.data, w, h, { threshold: 0.1 });
  const pct = (n / (w * h)) * 100;
  fs.writeFileSync(`${D}/${nome}`, PNG.sync.write(diff));
  const tam = a.width === b.width && a.height === b.height ? `${a.width}×${a.height}` : `${a.width}×${a.height} → ${b.width}×${b.height}`;
  linhas.push(`| ${nome} | ${tam} | ${pct.toFixed(3)}% |`);
  if (pct > TOL) ruins++;
}
const md = `# Diferenças visuais (antes × depois)\n\nTolerância: ${TOL}% dos pixels.\n\n| Tela | Tamanho | Pixels diferentes |\n|---|---|---|\n${linhas.join('\n')}\n`;
fs.writeFileSync('relatorio/diferencas.md', md);
console.log(md);
if (ruins) { console.log(`${ruins} tela(s) acima da tolerância.`); process.exit(1); }
