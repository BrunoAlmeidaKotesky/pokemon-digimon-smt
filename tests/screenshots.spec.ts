// Screenshots de referência de cada tela (celular e computador, tema claro e escuro).
// Só roda com SHOTS=antes ou SHOTS=depois; grava em relatorio/<SHOTS>/ (pasta fora do git).
// Os dados são fixos: sacos de sorteio preenchidos, ordem de carregamento fixa e semente refeita antes do campeonato.
import { test, expect, type Page } from '@playwright/test';
import { prepare, abrir, aba, fixture } from './helpers';

const DIR = process.env.SHOTS;
test.skip(!DIR, 'defina SHOTS=antes ou SHOTS=depois pra gerar os screenshots');

const nice = (s: string) => s.split('-').map(w => w[0]!.toUpperCase() + w.slice(1)).join(' ');
const bags = {
  pokemon: fixture<{ results: { name: string }[] }>('pokemon-species.json').results.map(x => nice(x.name)).reverse(),
  digimon: [...fixture<{ content: { name: string }[] }>('digimon-page0.json').content, ...fixture<{ content: { name: string }[] }>('digimon-page1.json').content].map(x => x.name).reverse(),
  smt: ['Pixie', 'Jack Frost', "Jack-o'-Lantern", 'Alice', 'Cerberus', 'Lucifer', 'Mara', 'Odin', 'Thor', 'Zeus', 'Kali', 'Lilith', 'Metatron', 'Satan'].reverse(),
  persona: ['Arsène', 'Izanagi', 'Orpheus', 'Thanatos', 'Carmen', 'Zorro', 'Johanna'].reverse(),
};
const stats = {
  w: { pokemon: 12, digimon: 9, smt: 7, persona: 5, jojo: 3, ygo: 2, bakugan: 1, lol: 4, overwatch: 2, deadlock: 1, ff: 3 },
  n: { pokemon: 20, digimon: 18, smt: 10, persona: 9, jojo: 8, ygo: 6, bakugan: 4, lol: 7, overwatch: 5, deadlock: 3, ff: 6, sujimon: 2 },
  hist: ['Charizard (Pokémon) venceu Agumon (Digimon)', 'Jack Frost (SMT) venceu Pikachu (Pokémon), Gabumon (Digimon)', 'Arsène (Persona) venceu Pixie (SMT)', 'Star Platinum (JoJo) venceu Dark Magician (Yu-Gi-Oh!)'],
  best: { name: 'Charizard', fr: 'pokemon', streak: 6 },
};

async function estavel(page: Page) {
  await page.mouse.move(0, 0);
  await expect(page.locator('.card .img', { hasText: 'carregando' })).toHaveCount(0);
  await page.waitForFunction(() => [...document.images].every(i => i.complete));
  await page.waitForTimeout(250);
}
async function foto(page: Page, nome: string, project: string, scheme: string) {
  await estavel(page);
  await page.screenshot({ path: `relatorio/${DIR}/${project}-${scheme}-${nome}.png`, fullPage: true });
}

for (const scheme of ['claro', 'escuro'] as const) {
  test.describe(`tema ${scheme}`, () => {
    test.use({ colorScheme: scheme === 'claro' ? 'light' : 'dark', reducedMotion: 'reduce' });

    test(`telas no tema ${scheme}`, async ({ page }, info) => {
      test.setTimeout(120_000);
      // ordem de carregamento fixa: todas as outras antes, depois Pokémon, por último Digimon
      await prepare(page, { atraso: { pokemon: 700, digimon: 1200 }, storage: { 'pdx-bags': bags, 'pdx-stats': stats } });
      await abrir(page);
      const p = info.project.name;

      await page.locator('#duelRow .card').nth(0).click();
      await page.locator('#duelRow .card').nth(0).click();
      await foto(page, 'duelo', p, scheme);

      await aba(page, 'Trio');
      await page.locator('#trioRow .card').nth(2).click();
      await foto(page, 'trio', p, scheme);

      await aba(page, 'Campeonato');
      await foto(page, 'campeonato-config', p, scheme);
      await page.evaluate(() => (window as unknown as { __reseed: (n: number) => void }).__reseed(7));
      await page.locator('#cupStart').click();
      for (let i = 0; i < 3; i++) await page.locator('#cupRow .card').nth(i % 2).click();
      await foto(page, 'campeonato-meio', p, scheme);
      for (let i = 0; i < 40 && await page.locator('#cupPlay').isVisible(); i++) await page.locator('#cupRow .card').nth(i % 2).click();
      await expect(page.locator('#cupEnd')).toBeVisible();
      await foto(page, 'campeonato-fim', p, scheme);

      await aba(page, 'Placar');
      await foto(page, 'placar', p, scheme);
    });
  });
}
