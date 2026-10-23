// Teste de fumaça contra o site publicado, com as APIs de verdade (internet).
// Roda à parte: npx playwright test -c playwright.real.config.ts
import { test, expect } from '@playwright/test';

test('site real: abre, carrega as franquias e faz um duelo', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', e => erros.push(e.message));
  await page.goto('./');
  await expect(page).toHaveTitle('Quem Você Prefere');
  await expect(page.locator('#status')).not.toContainText('carregando', { timeout: 90_000 });
  const status = await page.locator('#status').textContent();
  console.log('status:', status);
  expect(status).not.toContain('falhou');
  const partes = Object.fromEntries(status!.split(' · ').map(p => p.split(': ') as [string, string]));
  for (const f of ['Pokémon', 'Digimon', 'SMT/Persona', 'JoJo', 'Yu-Gi-Oh!', 'Bakugan', 'Sujimon']) expect(Number(partes[f]), f).toBeGreaterThan(0);
  await expect(page.locator('#h1suji')).toBeVisible();

  const cards = page.locator('#duelRow .card');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0).locator('img')).toBeVisible({ timeout: 30_000 });
  await expect(cards.nth(1).locator('img')).toBeVisible({ timeout: 30_000 });
  const nome = (await cards.nth(0).locator('.name').textContent())!.trim();
  await cards.nth(0).click();
  await expect(cards.nth(0).locator('.name')).toHaveText(nome);
  await expect(cards.nth(0).locator('.crown')).toHaveText('♛ 1 vitória');
  await page.locator('nav button', { hasText: 'Placar' }).click();
  await expect(page.locator('#histList li').first()).toContainText(`${nome} (Pokémon) venceu`);
  expect(erros).toEqual([]);
});
