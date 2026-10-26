import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { prepare, abrir, aba, mockApis, seedRandom } from './helpers';

const DIR = process.env.SHOTDIR!;
async function estavel(page: Page) {
  await page.mouse.move(0, 0);
  await expect(page.locator('.card .img', { hasText: 'carregando' })).toHaveCount(0);
  await page.waitForFunction(() => [...document.images].every(i => i.complete));
  await page.waitForTimeout(250);
}
async function foto(page: Page, nome: string) { await estavel(page); await page.screenshot({ path: `${DIR}/${nome}.png`, fullPage: true }); }

for (const scheme of ['claro', 'escuro'] as const) {
  test.describe(scheme, () => {
    test.use({ colorScheme: scheme === 'claro' ? 'light' : 'dark', reducedMotion: 'reduce' });
    test(`solo ${scheme}`, async ({ page }, info) => {
      const p = `${info.project.name}-${scheme}`;
      await prepare(page); await abrir(page); await aba(page, 'Ranking');
      await foto(page, `${p}-1-config`);
      await page.locator('#rankStart').click();
      for (const pos of [3, 0, 7, 1]) await page.locator(`#rankBoard li[data-pos="${pos}"] button`).click();
      await page.locator('#rankBoard li[data-pos="5"] button').hover();
      await foto(page, `${p}-2-jogo`);
      for (let i = 0; i < 16; i++) await page.locator('#rankBoard li.free button').first().click();
      await foto(page, `${p}-3-fim`);
    });
    test(`online ${scheme}`, async ({ context }, info) => {
      const p = `${info.project.name}-${scheme}`;
      await mockApis(context); await seedRandom(context, 7);
      const abrirJ = async (ctx: BrowserContext, n: number, sala?: string) => { const pg = await ctx.newPage(); await pg.goto(`./?transporte=local&jogador=${n}${sala ? '&sala=' + sala : ''}`); await expect(pg.locator('#status')).not.toContainText('carregando', { timeout: 15000 }); return pg; };
      const ana = await abrirJ(context, 1);
      await ana.locator('nav button', { hasText: 'Online' }).click();
      await ana.locator('#onName').fill('Ana'); await ana.locator('#onCreate').click();
      const code = (await ana.locator('#onRoomCode').textContent())!;
      const beto = await abrirJ(context, 2, code);
      await beto.locator('#onName').fill('Beto'); await beto.locator('#onJoin').click();
      await expect(ana.locator('#onPlayers .chip')).toHaveCount(2);
      await ana.locator('#onLobby [data-modo="rank"]').click();
      await ana.locator('#onRankSize').fill('5');
      await ana.locator('#onRankMix').check();
      await ana.locator('#onRoulette').check();
      await foto(ana, `${p}-4-online-lobby`);
      await ana.locator('#onStart').click();
      await ana.locator('#onRankBoard li[data-pos="0"] button').click();
      await beto.locator('#onRankBoard li[data-pos="2"] button').click();
      await ana.locator('#onNext').click();
      await ana.locator('#onRankBoard li[data-pos="1"] button').click();
      await foto(ana, `${p}-5-online-voto`);
      await beto.locator('#onRankBoard li[data-pos="1"] button').click();
      await expect(beto.locator('#onResult')).toBeVisible();
      await foto(beto, `${p}-6-online-resultado`);
      await ana.locator('#onNext').click();
      for (let i = 0; i < 3; i++) { await ana.locator('#onRankBoard li.free button').first().click(); await ana.locator('#onClose').click(); await ana.locator('#onNext').click(); }
      await expect(beto.locator('#onRankEnd')).toBeVisible();
      await foto(beto, `${p}-7-online-fim`);
    });
  });
}
