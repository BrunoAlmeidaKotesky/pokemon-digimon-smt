import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { PNG } from './helpers';

test('bookmarklet salva o screenshot da página aberta com o nome certo', async ({ page }, info) => {
  test.skip(info.project.name !== 'computador');
  const code = execFileSync('node', ['sujimon-salvar.js']).toString().trim();
  await page.route('**/database/sujidex/sujimon/007-tiny-cyclone', r => r.fulfill({ contentType: 'text/html', body:
    `<html><body><h1> Tiny  Cyclone </h1><img src="/logo.png" width="40"><div id="tab-screenshot"><img alt="Screenshot" src="/shot.png"></div></body></html>` }));
  await page.route('**/*.png', r => r.fulfill({ contentType: 'image/png', body: PNG }));
  await page.goto('http://localhost:4173/like-a-dragon-infinite-wealth/database/sujidex/sujimon/007-tiny-cyclone');
  const dl = page.waitForEvent('download');
  await page.evaluate(js => { new Function(decodeURIComponent(js.replace(/^javascript:/, '')))(); }, code);
  const d = await dl;
  expect(d.suggestedFilename()).toBe('007 Tiny Cyclone.png');
  expect(d.url()).toMatch(/^blob:/);
});
