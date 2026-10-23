// Modo online com 3 participantes: várias páginas do mesmo contexto, transporte local (BroadcastChannel).
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { mockApis, seedRandom } from './helpers';

test.use({ reducedMotion: 'reduce' });

interface Sala { code: string; host: Page; outros: Page[] }

async function abrirJogador(ctx: BrowserContext, n: number, sala?: string): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`./?transporte=local&jogador=${n}${sala ? '&sala=' + sala : ''}`);
  await expect(page.locator('#status')).not.toContainText('carregando', { timeout: 15000 });
  return page;
}
async function entrar(page: Page, nome: string) {
  await page.locator('#onName').fill(nome);
  await page.locator('#onJoin').click();
  await expect(page.locator('#onRoom')).toBeVisible();
}
/** Host "Ana" cria a sala; "Beto" e "Caio" entram pelo link. */
async function criarSala(ctx: BrowserContext, nomes = ['Ana', 'Beto', 'Caio']): Promise<Sala> {
  await mockApis(ctx);
  await seedRandom(ctx, 7);
  const host = await abrirJogador(ctx, 1);
  await host.locator('nav button', { hasText: 'Online' }).click();
  await host.locator('#onName').fill(nomes[0]!);
  await host.locator('#onCreate').click();
  await expect(host.locator('#onRoomCode')).toHaveText(/^[A-Z]{4}$/);
  const code = (await host.locator('#onRoomCode').textContent())!;
  const outros: Page[] = [];
  for (const [i, nome] of nomes.slice(1).entries()) {
    const p = await abrirJogador(ctx, i + 2, code);
    await expect(p.locator('#onCode')).toHaveValue(code);
    await entrar(p, nome);
    outros.push(p);
  }
  await expect(host.locator('#onPlayers .chip')).toHaveCount(nomes.length);
  return { code, host, outros };
}
const todos = (s: Sala) => [s.host, ...s.outros];
const chip = (p: Page, nome: string) => p.locator(`#onPlayers .chip[data-nome="${nome}"]`);
async function votar(p: Page, i: number) {
  await p.locator('#onArena .card').nth(i).click();
  await expect(p.locator('#onArena .card').nth(i)).toHaveClass(/mine/);
}
async function nomesDasCartas(p: Page) { return (await p.locator('#onArena .card .name').allTextContents()).map(s => s.trim()); }
async function modo(host: Page, m: 'duel' | 'trio' | 'cup') { await host.locator(`#onLobby .seg button[data-modo="${m}"]`).click(); }

test.describe('modo online (3 participantes, transporte local)', () => {
  test('sala: link, lobby com a lista de jogadores e configuração só do host', async ({ context }) => {
    const s = await criarSala(context);
    for (const p of todos(s)) {
      await expect(p.locator('#onRoomCode')).toHaveText(s.code);
      await expect(p.locator('#onPlayers .chip')).toHaveCount(3);
    }
    await expect(chip(s.host, 'Ana').locator('.tag', { hasText: 'host' })).toBeVisible();
    // só o host muda a configuração; os outros veem a mesma coisa
    await expect(s.outros[0]!.locator('#onSecret')).toBeDisabled();
    await expect(s.outros[0]!.locator('#onStart')).toHaveCount(0);
    await modo(s.host, 'trio');
    await s.host.locator('#onSecret').check();
    for (const p of s.outros) {
      await expect(p.locator('#onLobby .seg button[data-modo="trio"]')).toHaveClass(/on/);
      await expect(p.locator('#onSecret')).toBeChecked();
      await expect(p.locator('#onWaiting')).toBeVisible();
    }
    // o link da sala leva o código
    await expect(s.host.locator('.room-link')).toHaveValue(new RegExp(`sala=${s.code}`));
  });

  test('votação comum: resultado só quando todos votam, com a contagem e quem votou em quem', async ({ context }) => {
    const s = await criarSala(context);
    await s.host.locator('#onStart').click();
    for (const p of todos(s)) await expect(p.locator('#onArena .card')).toHaveCount(2);
    const cartas = await nomesDasCartas(s.host);
    for (const p of s.outros) expect(await nomesDasCartas(p)).toEqual(cartas);
    await votar(s.host, 0);
    await votar(s.outros[0]!, 0);
    // ainda falta o Caio: sem resultado, e todos veem quem já votou
    await expect(s.host.locator('#onResult')).toHaveCount(0);
    await expect(s.outros[1]!.locator('#onVoteInfo')).toContainText('Votaram 2 de 3');
    await expect(chip(s.outros[1]!, 'Ana')).toHaveClass(/voted/);
    await expect(chip(s.outros[1]!, 'Caio')).not.toHaveClass(/voted/);
    await votar(s.outros[1]!, 1);
    for (const p of todos(s)) {
      await expect(p.locator('#onResult')).toContainText(`${cartas[0]}`);
      await expect(p.locator('#onResult')).toContainText('venceu com 2 votos');
      await expect(p.locator('#onArena .card').nth(0)).toHaveClass(/win/);
      await expect(p.locator('#onArena .card').nth(0).locator('.tally')).toContainText('2 votos');
      await expect(p.locator('#onArena .card').nth(0).locator('.tally .who')).toHaveText('Ana, Beto');
      await expect(p.locator('#onArena .card').nth(1).locator('.tally .who')).toHaveText('Caio');
    }
    // host avança: rei do morro, o vencedor fica com a coroa
    await s.host.locator('#onNext').click();
    for (const p of todos(s)) {
      await expect(p.locator('#onArena .card').nth(0).locator('.name')).toHaveText(cartas[0]!);
      await expect(p.locator('#onArena .card').nth(0).locator('.crown')).toHaveText('♛ 1 vitória');
      await expect(p.locator('#onArena .card').nth(1).locator('.name')).not.toHaveText(cartas[1]!);
    }
  });

  test('voto secreto: o resultado mostra só a contagem', async ({ context }) => {
    const s = await criarSala(context);
    await s.host.locator('#onSecret').check();
    await s.host.locator('#onStart').click();
    await votar(s.host, 1); await votar(s.outros[0]!, 1); await votar(s.outros[1]!, 0);
    for (const p of todos(s)) {
      await expect(p.locator('#onResult')).toContainText('venceu com 2 votos');
      await expect(p.locator('#onArena .card').nth(1).locator('.tally')).toContainText('2 votos');
      await expect(p.locator('#onArena .tally .who')).toHaveCount(0);
    }
  });

  test('empate no Trio: a roleta gira só entre os empatados', async ({ context }) => {
    const s = await criarSala(context);
    await modo(s.host, 'trio');
    await s.host.locator('#onStart').click();
    for (const p of todos(s)) await expect(p.locator('#onArena .card')).toHaveCount(3);
    const cartas = await nomesDasCartas(s.host);
    await votar(s.host, 0); await votar(s.outros[0]!, 1); await votar(s.outros[1]!, 2);
    for (const p of todos(s)) {
      await expect(p.locator('#onResult')).toContainText('venceu na roleta, depois de um empate entre');
      await expect(p.locator('#onArena .card.win')).toHaveCount(1);
    }
    const vencedor = (await s.host.locator('#onArena .card.win .name').textContent())!.trim();
    expect(cartas).toContain(vencedor);
    for (const p of s.outros) await expect(p.locator('#onArena .card.win .name')).toHaveText(vencedor);
  });

  test('empate 1 a 1 no Duelo (host encerra sem o terceiro voto): a roleta decide entre os dois', async ({ context }) => {
    const s = await criarSala(context);
    await s.host.locator('#onStart').click();
    await votar(s.host, 0); await votar(s.outros[0]!, 1);
    await s.host.locator('#onClose').click();
    for (const p of todos(s)) await expect(p.locator('#onResult')).toContainText('venceu na roleta');
  });

  test('roleta do host: só aparece com a opção ligada e decide sem esperar os votos', async ({ context }) => {
    const s = await criarSala(context);
    await s.host.locator('#onStart').click();
    await expect(s.host.locator('#onArena .card')).toHaveCount(2);
    await expect(s.host.locator('.host-ctl .spin')).toHaveCount(0);
    await s.host.locator('#onLobbyBtn').click();
    await s.host.locator('#onRoulette').check();
    await s.host.locator('#onStart').click();
    await votar(s.outros[0]!, 0);
    await s.host.locator('.host-ctl .spin').click();
    for (const p of todos(s)) {
      await expect(p.locator('#onResult')).toContainText('foi escolhido pela roleta do host');
      await expect(p.locator('#onArena .card.win')).toHaveCount(1);
    }
    await expect(s.outros[1]!.locator('.host-ctl')).toHaveCount(0);
  });

  test('jogador que cai e volta recupera o lugar (e o voto)', async ({ context }) => {
    const s = await criarSala(context);
    await s.host.locator('#onStart').click();
    await votar(s.outros[1]!, 1);
    await s.outros[1]!.close();
    await expect(chip(s.host, 'Caio')).toHaveClass(/off/, { timeout: 10000 });
    await expect(chip(s.host, 'Caio').locator('.tag.off')).toHaveText('fora do ar');
    // volta pelo mesmo aparelho (mesmo id salvo): entra direto, no mesmo lugar
    const volta = await abrirJogador(context, 3, s.code);
    await expect(volta.locator('#onRoom')).toBeVisible();
    await expect(chip(s.host, 'Caio')).not.toHaveClass(/off/);
    await expect(s.host.locator('#onPlayers .chip')).toHaveCount(3);
    await expect(volta.locator('#onArena .card').nth(1)).toHaveClass(/mine/);
    await votar(s.host, 1); await votar(s.outros[0]!, 0);
    await expect(volta.locator('#onResult')).toContainText('venceu com 2 votos');
  });

  test('jogador que caiu não trava a votação: o host vê quem falta e remove', async ({ context }) => {
    const s = await criarSala(context);
    await s.host.locator('#onStart').click();
    await votar(s.host, 0); await votar(s.outros[0]!, 0);
    await expect(s.host.locator('#onVoteInfo')).toContainText('Falta: Caio');
    const caio = s.outros[1]!;
    const remover = chip(s.host, 'Caio').locator('.x');
    await remover.click();
    await expect(remover).toHaveText('remover?');
    await remover.click();
    await expect(caio.locator('#onEnded')).toContainText('O host removeu você da sala.');
    await expect(s.host.locator('#onPlayers .chip')).toHaveCount(2);
    await expect(s.host.locator('#onResult')).toContainText('venceu com 2 votos');
  });

  test('host que sai: a sala acaba pra todo mundo', async ({ context }) => {
    const s = await criarSala(context);
    await s.host.close();
    for (const p of s.outros) await expect(p.locator('#onEnded')).toContainText(/sala acabou|encerrou a sala/, { timeout: 15000 });
  });

  test('campeonato online até o fim, com o chaveamento pra todos', async ({ context }) => {
    test.setTimeout(120_000);
    const s = await criarSala(context);
    await modo(s.host, 'cup');
    await s.host.locator('#onCupSize').selectOption('8');
    await s.host.locator('#onStart').click();
    for (const p of todos(s)) {
      await expect(p.locator('#onTitle')).toHaveText('Quartas de final');
      await expect(p.locator('#onCount')).toHaveText('confronto 1 de 4');
      await expect(p.locator('#onBracket .match.now')).toHaveCount(1);
      await expect(p.locator('#onBracket .match[data-r="0"] .slot.empty')).toHaveCount(6);
    }
    let jogos = 0;
    while (await s.host.locator('#onArena').count() && jogos < 10) {
      const seq = await s.host.locator('#onArena').getAttribute('data-seq');
      for (const p of todos(s)) await votar(p, 0);
      await expect(s.host.locator('#onNext')).toBeVisible();
      await s.host.locator('#onNext').click();
      await expect(s.host.locator(`#onArena[data-seq="${seq}"]`)).toHaveCount(0);
      jogos++;
    }
    expect(jogos).toBe(7);
    for (const p of todos(s)) {
      await expect(p.locator('#onTitle')).toHaveText('Campeão');
      await expect(p.locator('#onCupEnd .crown')).toHaveText('♛ campeão');
      await expect(p.locator('#onCupEnd')).toContainText('2º lugar:');
      await expect(p.locator('#onCupEnd')).toContainText('Semifinalistas:');
      await expect(p.locator('#onBracket .match.champ .nm')).toHaveText((await p.locator('#onCupEnd .card .name').textContent())!.trim());
    }
    // partidas online não mexem no placar local
    expect(await s.host.evaluate(() => localStorage.getItem('pdx-stats'))).toBeNull();
  });
});
