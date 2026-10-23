// Fumaça do modo online com PeerJS de verdade (servidor de convites público + WebRTC) entre dois contextos.
// Precisa de internet e pode falhar por causa da rede. Roda à parte:
//   REAL_URL=http://localhost:4173/ npx playwright test -c playwright.real.config.ts peerjs
import { test, expect, type Page } from '@playwright/test';

async function abrir(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator('#status')).not.toContainText('carregando', { timeout: 90_000 });
}

test('PeerJS: host cria a sala, outro navegador entra e os dois votam', async ({ browser }, info) => {
  test.skip(info.project.name !== 'computador', 'um projeto basta');
  const a = await browser.newContext(), b = await browser.newContext();
  const host = await a.newPage(), guest = await b.newPage();
  await abrir(host, './');
  await host.locator('nav button', { hasText: 'Online' }).click();
  await host.locator('#onName').fill('Host');
  await host.locator('#onCreate').click();
  await expect(host.locator('#onRoomCode')).toHaveText(/^[A-Z]{4}$/, { timeout: 30_000 });
  const code = (await host.locator('#onRoomCode').textContent())!;
  console.log('sala', code);

  await abrir(guest, `./?sala=${code}`);
  await guest.locator('#onName').fill('Visita');
  await guest.locator('#onJoin').click();
  await expect(guest.locator('#onPlayers .chip')).toHaveCount(2, { timeout: 30_000 });
  await expect(host.locator('#onPlayers .chip')).toHaveCount(2);

  await host.locator('#onStart').click();
  await expect(guest.locator('#onArena .card')).toHaveCount(2, { timeout: 15_000 });
  await host.locator('#onArena .card').nth(0).click();
  await guest.locator('#onArena .card').nth(0).click();
  await expect(guest.locator('#onResult')).toContainText('venceu com 2 votos', { timeout: 15_000 });
  await a.close(); await b.close();
});
