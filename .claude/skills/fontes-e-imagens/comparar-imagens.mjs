// Monta uma grade de imagens em caixas quadradas do tamanho de uma carta do site e tira um screenshot, pra comparar
// opções de arte (ex.: ícone x splash x render) antes de escolher. Abre o Chromium COM janela, porque a Fandom
// (static.wikia.nocookie.net) bloqueia o navegador sem janela e as imagens de lá falham no modo headless.
//
// Uso (na pasta do repositório, que tem o @playwright/test):
//   node .claude/skills/fontes-e-imagens/comparar-imagens.mjs grade.json saida.png
//
// grade.json:
//   {
//     "colunas": ["A) ícone (API)", "B) splash", "C) render (wiki)"],
//     "linhas": [
//       { "nome": "Ahri", "imagens": [
//         { "src": "https://.../tile" },
//         { "src": "https://.../splash.jpg", "fit": "cover" },
//         { "src": "https://.../render.png" }
//       ] }
//     ]
//   }
// "fit" é o object-fit da imagem na caixa: "contain" (padrão, como as cartas) ou "cover" (recorta pra preencher).
// O script imprime "ok" ou "FALHOU" por imagem.

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';

const [entrada, saida] = process.argv.slice(2);
if (!entrada || !saida) {
  console.error('uso: node comparar-imagens.mjs grade.json saida.png');
  process.exit(1);
}
const grade = JSON.parse(fs.readFileSync(entrada, 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const html = `<!doctype html><meta charset="utf-8"><meta name="referrer" content="no-referrer">
<style>
  body { font: 13px sans-serif; background: #eef; margin: 8px }
  table { border-spacing: 8px }
  td div { width: 220px; height: 220px; display: flex; align-items: center; justify-content: center; border-radius: 6px;
    overflow: hidden; background: radial-gradient(circle, #dde, #fff) }
  img { width: 100%; height: 100%; filter: drop-shadow(0 4px 6px rgba(0,0,0,.25)) }
</style>
<table>
  <tr><th></th>${grade.colunas.map(c => `<th>${esc(c)}</th>`).join('')}</tr>
  ${grade.linhas.map(l => `<tr><th>${esc(l.nome)}</th>${l.imagens.map(i =>
    `<td><div><img style="object-fit:${i.fit === 'cover' ? 'cover' : 'contain'}" src="${esc(i.src)}"></div></td>`).join('')}</tr>`).join('\n')}
</table>`;

const tmp = path.join(os.tmpdir(), `comparar-imagens-${process.pid}.html`);
fs.writeFileSync(tmp, html);
const b = await chromium.launch({ headless: false });
const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
await p.goto(pathToFileURL(tmp).href);
await p.waitForLoadState('networkidle');
await p.waitForTimeout(2000);
const status = await p.locator('img').evaluateAll(is => is.map(i => (i.naturalWidth ? `ok ${i.naturalWidth}x${i.naturalHeight}` : 'FALHOU') + '  ' + i.src));
console.log(status.join('\n'));
await p.screenshot({ path: saida, fullPage: true });
await b.close();
fs.rmSync(tmp);
console.log('screenshot:', saida);
