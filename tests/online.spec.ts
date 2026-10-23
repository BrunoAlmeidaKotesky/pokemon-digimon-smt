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
async function modo(host: Page, m: 'duel' | 'trio' | 'quartet' | 'cup') { await host.locator(`#onLobby [data-modo="${m}"]`).click(); }
const caixas = (p: Page, sel: string) => p.locator(sel).evaluateAll(els => els.map(e => {
  const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
}));
/** Anota, em ordem, cada carta da votação que acende (.lit) durante a roleta. */
async function gravarAcesas(p: Page) {
  await p.evaluate(() => {
    const w = window as unknown as { __acesas: number[] };
    w.__acesas = [];
    let ultima = -1;
    new MutationObserver(() => {
      const i = [...document.querySelectorAll('#onArena .card')].findIndex(c => c.classList.contains('lit'));
      if (i >= 0 && i !== ultima) w.__acesas.push(i);
      ultima = i;
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  });
}
const acesas = (p: Page) => p.evaluate(() => (window as unknown as { __acesas: number[] }).__acesas);

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
      await expect(p.locator('#onLobby [data-modo="trio"]')).toHaveClass(/on/);
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

  test.describe('Quarteto', () => {
    // com a animação: dá pra ver por quais cartas a roleta passa
    test.use({ reducedMotion: 'no-preference' });

    test('quatro cartas pra todos; votação comum; empate 1-1-1 entre três delas decidido pela roleta só entre as empatadas', async ({ context }) => {
      test.setTimeout(90_000);
      const s = await criarSala(context);
      await modo(s.host, 'quartet');
      const PADRAO = ['pokemon', 'digimon', 'smt', 'jojo'];
      for (const p of todos(s)) {
        await expect(p.locator('#onLobby [data-modo="quartet"]')).toHaveClass(/on/);
        await expect(p.locator('#onLobby [data-modo="quartet"] b')).toHaveText('Quarteto');
        for (const [i, fr] of PADRAO.entries()) {
          await expect(p.locator(`#onQuartet${i}`)).toHaveValue(fr);
          await expect(p.locator(`#onQuartet${i}`)).toHaveAttribute('aria-label', `Franquia ${i + 1}`);
        }
      }
      // só o host muda; os outros veem a troca
      await expect(s.outros[0]!.locator('#onQuartet0')).toBeDisabled();
      await s.host.locator('#onQuartet3').selectOption('ygo');
      for (const p of s.outros) await expect(p.locator('#onQuartet3')).toHaveValue('ygo');
      await s.host.locator('#onStart').click();

      const frs = ['pokemon', 'digimon', 'smt', 'ygo'];
      for (const p of todos(s)) {
        await expect(p.locator('#onTitle')).toHaveText('Quarteto');
        await expect(p.locator('#onArena .card')).toHaveCount(4);
        await expect(p.locator('#onArena')).toHaveClass(/\bfour\b/);
        expect(await p.locator('#onArena .card').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.fr))).toEqual(frs);
      }
      const cartas = await nomesDasCartas(s.host);
      expect(new Set(cartas).size).toBe(4);
      for (const p of s.outros) expect(await nomesDasCartas(p)).toEqual(cartas);

      // layout: em linha com VS no computador; grade 2×2 sem VS no celular
      const vs = s.host.locator('#onArena .vs');
      await expect(vs).toHaveCount(3);
      await s.host.mouse.move(0, 0); await s.host.waitForTimeout(200); // carta com :hover sobe 3px (com transição)
      const c = await caixas(s.host, '#onArena .card');
      if ((s.host.viewportSize()?.width ?? 0) < 560) {
        for (let i = 0; i < 3; i++) await expect(vs.nth(i)).toBeHidden();
        expect(Math.abs(c[0]!.y - c[1]!.y)).toBeLessThan(2);
        expect(Math.abs(c[2]!.y - c[3]!.y)).toBeLessThan(2);
        expect(c[2]!.y).toBeGreaterThanOrEqual(c[0]!.y + c[0]!.h);
        expect(Math.abs(c[2]!.x - c[0]!.x)).toBeLessThan(2);
      } else {
        for (let i = 0; i < 3; i++) await expect(vs.nth(i)).toBeVisible();
        for (let i = 1; i < 4; i++) {
          expect(Math.abs(c[i]!.y - c[0]!.y)).toBeLessThan(4);
          expect(c[i]!.x).toBeGreaterThan(c[i - 1]!.x + c[i - 1]!.w);
        }
      }

      // votação comum: 2 votos na carta 3, 1 na carta 1
      await votar(s.host, 2); await votar(s.outros[0]!, 2); await votar(s.outros[1]!, 0);
      for (const p of todos(s)) {
        await expect(p.locator('#onResult')).toContainText(cartas[2]!);
        await expect(p.locator('#onResult')).toContainText('venceu com 2 votos');
        await expect(p.locator('#onArena .card').nth(2)).toHaveClass(/win/);
        await expect(p.locator('#onArena .card.lose')).toHaveCount(3);
        await expect(p.locator('#onArena .card').nth(2).locator('.tally .who')).toHaveText('Ana, Beto');
        await expect(p.locator('#onArena .card').nth(0).locator('.tally .who')).toHaveText('Caio');
        await expect(p.locator('#onArena .card').nth(1).locator('.tally')).toContainText('0 votos');
      }
      // o host avança: a carta 3 fica com a coroa; as outras três trocam, cada uma na sua franquia
      await s.host.locator('#onNext').click();
      for (const p of todos(s)) {
        await expect(p.locator('#onArena .card').nth(2).locator('.name')).toHaveText(cartas[2]!);
        await expect(p.locator('#onArena .card').nth(2).locator('.crown')).toHaveText('♛ 1 vitória');
        await expect(p.locator('#onArena .crown')).toHaveCount(1);
        for (const i of [0, 1, 3]) await expect(p.locator('#onArena .card').nth(i).locator('.name')).not.toHaveText(cartas[i]!);
        expect(await p.locator('#onArena .card').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.fr))).toEqual(frs);
      }

      // empate 1-1-1 entre as cartas 1, 2 e 4 (a campeã, carta 3, fica sem voto)
      const rodada = await nomesDasCartas(s.host);
      for (const p of s.outros) expect(await nomesDasCartas(p)).toEqual(rodada);
      const empatadas = [rodada[0]!, rodada[1]!, rodada[3]!];
      await gravarAcesas(s.host);
      await votar(s.host, 0); await votar(s.outros[0]!, 1); await votar(s.outros[1]!, 3);
      for (const p of todos(s)) {
        await expect(p.locator('#onResult')).toContainText(`venceu na roleta, depois de um empate entre ${empatadas[0]}, ${empatadas[1]} e ${empatadas[2]}.`, { timeout: 15000 });
        await expect(p.locator('#onArena .card.win')).toHaveCount(1);
        await expect(p.locator('#onArena .card').nth(2)).toHaveClass(/lose/);
      }
      const vencedor = (await s.host.locator('#onArena .card.win .name').textContent())!.trim();
      expect(empatadas).toContain(vencedor);
      for (const p of s.outros) await expect(p.locator('#onArena .card.win .name')).toHaveText(vencedor);
      // a roleta acendeu só as empatadas, em ordem, dando voltas (a carta 3 nunca acende) e parou na vencedora
      const ordem = await acesas(s.host);
      expect(ordem.length).toBeGreaterThanOrEqual(9);
      expect(new Set(ordem)).toEqual(new Set([0, 1, 3]));
      for (let j = 1; j < ordem.length; j++) {
        const a = [0, 1, 3].indexOf(ordem[j - 1]!);
        expect(ordem[j], ordem.join(',')).toBe([0, 1, 3][(a + 1) % 3]);
      }
      expect(rodada[ordem.at(-1)!]).toBe(vencedor);

      // o host avança: a vencedora da roleta fica com a coroa e a antiga campeã é trocada
      await s.host.locator('#onNext').click();
      const wi = rodada.indexOf(vencedor);
      for (const p of todos(s)) {
        await expect(p.locator('#onArena .card').nth(wi).locator('.name')).toHaveText(vencedor);
        await expect(p.locator('#onArena .card').nth(wi).locator('.crown')).toHaveText('♛ 1 vitória');
        await expect(p.locator('#onArena .card').nth(2).locator('.name')).not.toHaveText(rodada[2]!);
        await expect(p.locator('#onArena .crown')).toHaveCount(1);
      }
    });
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

  test('a mesma pessoa abre a sala em outra aba: a aba antiga sai e não fica reconectando', async ({ context }) => {
    const s = await criarSala(context);
    const velha = s.outros[0]!;
    const nova = await abrirJogador(context, 2, s.code);
    await expect(nova.locator('#onRoom')).toBeVisible();
    await expect(velha.locator('#onEnded')).toContainText('outra aba');
    await expect(s.host.locator('#onPlayers .chip')).toHaveCount(3);
    await nova.waitForTimeout(3000);
    await expect(nova.locator('#onEnded')).toHaveCount(0);
    await expect(nova.locator('#onBanner')).toHaveCount(0);
    await expect(chip(s.host, 'Beto')).not.toHaveClass(/off/);
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
    await s.host.locator('#onCupSize button[data-n="8"]').click();
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
