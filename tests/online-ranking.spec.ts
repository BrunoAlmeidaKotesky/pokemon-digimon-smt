// Ranking online com 2 participantes (transporte local): cada personagem vira uma votação da posição.
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { mockApis, seedRandom } from './helpers';

test.use({ reducedMotion: 'reduce' });

async function abrir(ctx: BrowserContext, n: number, sala?: string) {
  const p = await ctx.newPage();
  await p.goto(`./?transporte=local&jogador=${n}${sala ? '&sala=' + sala : ''}`);
  await expect(p.locator('#status')).not.toContainText('carregando', { timeout: 15000 });
  return p;
}
/** Host "Ana" cria a sala e "Beto" entra pelo link; a sala fica no modo Ranking. */
async function salaRanking(ctx: BrowserContext): Promise<[Page, Page]> {
  await mockApis(ctx);
  await seedRandom(ctx, 7);
  const ana = await abrir(ctx, 1);
  await ana.locator('nav button', { hasText: 'Online' }).click();
  await ana.locator('#onName').fill('Ana');
  await ana.locator('#onCreate').click();
  await expect(ana.locator('#onRoomCode')).toHaveText(/^[A-Z]{4}$/);
  const code = (await ana.locator('#onRoomCode').textContent())!;
  const beto = await abrir(ctx, 2, code);
  await beto.locator('#onName').fill('Beto');
  await beto.locator('#onJoin').click();
  await expect(ana.locator('#onPlayers .chip')).toHaveCount(2);
  await ana.locator('#onLobby [data-modo="rank"]').click();
  for (const p of [ana, beto]) {
    await expect(p.locator('#onLobby [data-modo="rank"]')).toHaveClass(/on/);
    await expect(p.locator('#onLobby [data-modo="rank"] b')).toHaveText('Ranking');
    await expect(p.locator('#onRankSize')).toHaveValue('10');
    await expect(p.locator('#onRank_pokemon')).toBeChecked();
    await expect(p.locator('#onRank_digimon')).toBeChecked();
    await expect(p.locator('#onRankMix')).not.toBeChecked();
  }
  // só o host muda a configuração
  await expect(beto.locator('#onRankSize')).toBeDisabled();
  await expect(beto.locator('#onRankMix')).toBeDisabled();
  return [ana, beto];
}
const vaga = (p: Page, pos: number) => p.locator(`#onRankBoard li[data-pos="${pos}"]`);
const nomeAtual = async (p: Page) => (await p.locator('#onRankNow .card .name').textContent())!.trim();
async function votar(p: Page, pos: number) {
  await vaga(p, pos).locator('button').click();
  await expect(vaga(p, pos).locator('.rank-slot')).toHaveClass(/mine/);
}
/** Posição (data-pos) que ganhou a votação. */
const vencedora = async (p: Page) => Number(await p.locator('#onRankBoard li', { has: p.locator('.rank-slot.win') }).getAttribute('data-pos'));

test('Ranking misturado de 3: votação da posição, empate decidido na roleta e o top pronto pra todos', async ({ context }) => {
  test.setTimeout(120_000);
  const [ana, beto] = await salaRanking(context);
  const todos = [ana, beto];
  await ana.locator('#onRankSize').fill('3');
  await ana.locator('#onRankMix').check();
  for (const p of todos) {
    await expect(p.locator('#onRankSize')).toHaveValue('3');
    await expect(p.locator('#onRankMix')).toBeChecked();
    await expect(p.locator('#onStartBar .resumo b')).toHaveText('Ranking · top de 3 misturado · Pokémon, Digimon');
  }
  await ana.locator('#onStart').click();

  for (const p of todos) {
    await expect(p.locator('#onTitle')).toHaveText('Ranking');
    await expect(p.locator('#onRankTitle')).toHaveText('Top 3 misturado');
    await expect(p.locator('#onRankCount')).toHaveText('1 de 3');
    await expect(p.locator('#onRankBoard li')).toHaveCount(3);
    await expect(p.locator('#onRankBoard li.free button')).toHaveCount(3);
  }
  const top: string[] = [];

  // 1º personagem: os dois votam no 2º lugar
  const n1 = await nomeAtual(ana);
  expect(await nomeAtual(beto)).toBe(n1);
  await votar(ana, 1);
  await expect(beto.locator('#onVoteInfo')).toContainText('Votaram 1 de 2. Falta: Beto.');
  await expect(ana.locator('#onVoteInfo')).toContainText('Voto registrado no 2º lugar');
  await expect(ana.locator('#onResult')).toHaveCount(0);
  await votar(beto, 1);
  for (const p of todos) {
    await expect(p.locator('#onResult')).toContainText(`${n1}`);
    await expect(p.locator('#onResult')).toContainText('fica no 2º lugar com 2 votos.');
    await expect(vaga(p, 1).locator('.rank-slot')).toHaveClass(/win/);
    await expect(vaga(p, 1).locator('.nm')).toHaveText(n1);
    await expect(vaga(p, 1).locator('.tally .who')).toHaveText('Ana, Beto');
    await expect(vaga(p, 0).locator('.tally')).toContainText('0 votos');
    await expect(p.locator('#onRankBoard button')).toHaveCount(0);
  }
  await expect(beto.locator('#onNext')).toHaveCount(0);
  await ana.locator('#onNext').click();
  top[1] = n1;
  for (const p of todos) {
    await expect(p.locator('#onRankCount')).toHaveText('2 de 3');
    await expect(vaga(p, 1)).toHaveClass(/filled/);
    await expect(vaga(p, 1).locator('.nm')).toHaveText(n1);
    // posição ocupada não vira botão de voto
    await expect(vaga(p, 1).locator('button')).toHaveCount(0);
    await expect(p.locator('#onRankBoard li.free button')).toHaveCount(2);
  }

  // 2º personagem: Ana no 1º lugar, Beto (pelo teclado) no 3º: empate, a roleta decide entre os dois
  const n2 = await nomeAtual(ana);
  expect(n2).not.toBe(n1);
  await votar(ana, 0);
  await beto.keyboard.press('3');
  await expect(vaga(beto, 2).locator('.rank-slot')).toHaveClass(/mine/);
  for (const p of todos) {
    await expect(p.locator('#onResult')).toContainText('pela roleta, depois de um empate entre 1º e 3º lugar.', { timeout: 15000 });
    await expect(p.locator('#onRankBoard .rank-slot.win')).toHaveCount(1);
  }
  const w = await vencedora(ana);
  expect([0, 2]).toContain(w);
  expect(await vencedora(beto)).toBe(w);
  await expect(ana.locator('#onResult')).toContainText(`fica no ${w + 1}º lugar`);
  await ana.locator('#onNext').click();
  top[w] = n2;
  const livre = w === 0 ? 2 : 0;
  for (const p of todos) {
    await expect(p.locator('#onRankCount')).toHaveText('3 de 3');
    await expect(vaga(p, w).locator('.nm')).toHaveText(n2);
    await expect(p.locator('#onRankBoard li.free button')).toHaveCount(1);
  }

  // 3º personagem: só a Ana vota e o host encerra a votação
  const n3 = await nomeAtual(ana);
  await votar(ana, livre);
  await ana.locator('#onClose').click();
  for (const p of todos) await expect(p.locator('#onResult')).toContainText(`fica no ${livre + 1}º lugar com 1 voto.`);
  await ana.locator('#onNext').click();
  top[livre] = n3;

  // fim: o top pronto, igual pra todos, sem votação aberta
  for (const p of todos) {
    await expect(p.locator('#onRankEnd')).toBeVisible();
    await expect(p.locator('#onRankTops .rank-top h3')).toHaveText(['Top 3 misturado']);
    expect((await p.locator('#onRankTops li .nm').allTextContents()).map(s => s.trim())).toEqual(top);
    const frs = await p.locator('#onRankTops li').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.fr));
    expect(frs.filter(f => f === 'pokemon').length + frs.filter(f => f === 'digimon').length).toBe(3);
    expect(new Set(frs).size).toBe(2);
    await expect(p.locator('#onVoteInfo')).toHaveCount(0);
  }
});

test('Ranking separado com voto secreto e roleta do host: top de Pokémon e depois o de Digimon', async ({ context }) => {
  test.setTimeout(120_000);
  const [ana, beto] = await salaRanking(context);
  const todos = [ana, beto];
  await ana.locator('#onRankSizeMenos').click();
  await ana.locator('#onRankSize').fill('3');
  await ana.locator('#onSecret').check();
  await ana.locator('#onRoulette').check();
  for (const p of todos) await expect(p.locator('#onStartBar .resumo b')).toHaveText('Ranking · 2 tops de 3 · Pokémon, Digimon');
  await ana.locator('#onStart').click();

  for (const [t, fr] of [[0, 'pokemon'], [1, 'digimon']] as const) {
    for (let i = 0; i < 3; i++) {
      for (const p of todos) {
        await expect(p.locator('#onRankTitle')).toHaveText(`Top 3 de ${fr === 'pokemon' ? 'Pokémon' : 'Digimon'}`);
        await expect(p.locator('#onRankHead')).toContainText(`${i + 1} de 3 · top ${t + 1} de 2`);
        await expect(p.locator('#onRankNow .card')).toHaveAttribute('data-fr', fr);
      }
      if (i === 0) {
        // o host gira a roleta sem esperar os votos: ela escolhe uma das posições livres
        await ana.locator('#onVoteInfo').waitFor();
        await ana.locator('.host-ctl .spin').click();
        for (const p of todos) await expect(p.locator('#onResult')).toContainText('pela roleta do host.', { timeout: 15000 });
      } else {
        const livre = Number(await ana.locator('#onRankBoard li.free').first().getAttribute('data-pos'));
        await votar(ana, livre);
        await votar(beto, livre);
        for (const p of todos) {
          await expect(p.locator('#onResult')).toContainText('com 2 votos.');
          await expect(p.locator('#onResult')).toContainText('Voto secreto');
          await expect(vaga(p, livre).locator('.tally')).toContainText('2 votos');
          await expect(p.locator('#onRankBoard .tally .who')).toHaveCount(0);
        }
      }
      await ana.locator('#onNext').click();
    }
    if (t === 0) for (const p of todos) await expect(p.locator('#onRankDone summary')).toHaveText('Top pronto');
  }
  for (const p of todos) {
    await expect(p.locator('#onRankEnd h2')).toHaveText('Tops prontos');
    await expect(p.locator('#onRankTops .rank-top h3')).toHaveText(['Top 3 de Pokémon', 'Top 3 de Digimon']);
    await expect(p.locator('#onRankTops .rank-top').nth(0).locator('li.filled')).toHaveCount(3);
    expect(await p.locator('#onRankTops .rank-top').nth(1).locator('li').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.fr))).toEqual(['digimon', 'digimon', 'digimon']);
  }
  // de volta ao lobby, a configuração continua a do Ranking
  await ana.locator('#onLobbyBtn').click();
  for (const p of todos) await expect(p.locator('#onLobby [data-modo="rank"]')).toHaveClass(/on/);
});
