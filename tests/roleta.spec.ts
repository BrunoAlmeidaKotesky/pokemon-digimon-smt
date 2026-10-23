import { test, expect, type Page } from '@playwright/test';
import { prepare, abrir, aba, nomes, lerStorage, LABEL, type Stats } from './helpers';

// Roleta (função spin) e atalhos de teclado (1, 2, 3 e R).
// Sem movimento reduzido: as cartas acendem em sequência, desacelerando; a escolhida ganha .picked e ~1 s depois conta como escolha.
// Com movimento reduzido: vai direto ao resultado (uma carta só acende).

test.use({ reducedMotion: 'no-preference' });

const historico = async (page: Page) => (await lerStorage<Stats>(page, 'pdx-stats'))?.hist ?? [];
const esperarHist = (page: Page, n: number, timeout = 8000) =>
  expect.poll(async () => (await historico(page)).length, { timeout }).toBe(n);
const coroas = (page: Page, row: string) =>
  page.locator(`${row} .card`).evaluateAll(els => els.map(e => e.querySelector('.crown')?.textContent?.trim() ?? ''));
const girando = (page: Page) => page.evaluate(() => document.body.classList.contains('spinning'));
const UMA = '♛ 1 vitória';

async function iniciarCampeonato(page: Page) {
  await aba(page, 'Campeonato');
  await page.selectOption('#cupSize', '8');
  await page.locator('#cupStart').click();
  await expect(page.locator('#cupCount')).toHaveText('confronto 1 de 4');
  await expect(page.locator('#cupRow .card')).toHaveCount(2);
}

// ---------- gravação do giro ----------
// Um MutationObserver anota, com performance.now(), quando o body ganha/perde .spinning, qual carta da fileira
// está acesa (.lit) a cada passo e qual ganhou .picked. Assim dá pra conferir ordem e tempos sem depender de polling.
interface Evento { t: number; e: 'inicio' | 'fim' | 'lit' | 'picked'; i?: number; nome?: string; anim?: string | null; dis?: boolean }

async function gravar(page: Page, row: string) {
  await page.evaluate((sel) => {
    const w = window as unknown as { __roleta: unknown[]; __obs?: MutationObserver };
    w.__obs?.disconnect();
    w.__roleta = [];
    const cartas = () => [...document.querySelectorAll(`${sel} .card`)];
    let g0 = document.body.classList.contains('spinning');
    let lit = cartas().findIndex(c => c.classList.contains('lit'));
    let picked = cartas().findIndex(c => c.classList.contains('picked'));
    const ver = () => {
      const t = performance.now();
      const cards = cartas();
      const l = cards.findIndex(c => c.classList.contains('lit'));
      const p = cards.findIndex(c => c.classList.contains('picked'));
      const g = document.body.classList.contains('spinning');
      if (g !== g0) {
        if (g) {
          const roda = document.querySelector(sel)?.closest('section')?.querySelector('.spin .wheel');
          w.__roleta.push({ t, e: 'inicio', anim: roda ? getComputedStyle(roda).animationName : null,
            dis: [...document.querySelectorAll<HTMLButtonElement>('.spin')].every(b => b.disabled) });
        } else w.__roleta.push({ t, e: 'fim' });
        g0 = g;
      }
      if (l !== lit) { if (l >= 0) w.__roleta.push({ t, e: 'lit', i: l }); lit = l; }
      if (p !== picked) { if (p >= 0) w.__roleta.push({ t, e: 'picked', i: p, nome: cards[p]!.querySelector('.name')?.textContent?.trim() }); picked = p; }
    };
    w.__obs = new MutationObserver(ver);
    w.__obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'disabled'] });
  }, row);
}
const eventos = (page: Page) => page.evaluate(() => (window as unknown as { __roleta: Evento[] }).__roleta);

/** Confere um giro animado completo de n cartas e devolve a carta escolhida e a duração. */
function conferirGiro(ev: Evento[], n: number) {
  const inicio = ev.filter(e => e.e === 'inicio'), fim = ev.filter(e => e.e === 'fim'), picked = ev.filter(e => e.e === 'picked');
  expect(inicio, 'um início de giro').toHaveLength(1);
  expect(fim, 'um fim de giro').toHaveLength(1);
  expect(picked, 'uma carta marcada').toHaveLength(1);
  expect(inicio[0]!.dis, 'botões .spin desabilitados ao começar').toBe(true);
  expect(inicio[0]!.anim, 'roda do botão gira').not.toBe('none');
  const acesas = ev.filter(e => e.e === 'lit' && e.t >= inicio[0]!.t && e.t <= picked[0]!.t);
  const idx = acesas.map(e => e.i!);
  // acende em sequência: sempre a carta seguinte, dando a volta
  for (let j = 1; j < idx.length; j++) expect(idx[j], `passo ${j}: ${idx.join(',')}`).toBe((idx[j - 1]! + 1) % n);
  // 3 a 4 voltas completas + deslocamento (0..n-1)
  const passos = idx.length - 1;
  expect(passos).toBeGreaterThanOrEqual(3 * n);
  expect(passos).toBeLessThanOrEqual(5 * n - 1);
  // para na carta marcada
  expect(idx.at(-1)).toBe(picked[0]!.i);
  // desacelera: o último passo (~475 ms) é bem mais lento que os primeiros (~55 ms)
  const gaps = acesas.slice(1).map((e, j) => e.t - acesas[j]!.t);
  expect(gaps.at(-1)!).toBeGreaterThan(2 * Math.min(...gaps.slice(0, 3)));
  expect(gaps.at(-1)!).toBeGreaterThan(250);
  // ~1 s entre marcar a carta e a escolha acontecer
  const espera = fim[0]!.t - picked[0]!.t;
  expect(espera).toBeGreaterThan(850);
  expect(espera).toBeLessThan(2500);
  const total = fim[0]!.t - inicio[0]!.t;
  expect(total).toBeGreaterThan(500);
  expect(total).toBeLessThan(6000);
  return { escolhida: picked[0]! as Evento & { i: number; nome: string }, total, passos };
}

/** Giro com movimento reduzido: uma carta só acende, marcada, e a escolha vem logo. */
function conferirGiroCalmo(ev: Evento[]) {
  const inicio = ev.filter(e => e.e === 'inicio'), fim = ev.filter(e => e.e === 'fim'), picked = ev.filter(e => e.e === 'picked');
  expect(inicio).toHaveLength(1);
  expect(fim).toHaveLength(1);
  expect(picked).toHaveLength(1);
  expect(inicio[0]!.anim, 'roda parada com movimento reduzido').toBe('none');
  const acesas = ev.filter(e => e.e === 'lit');
  expect(acesas, 'só a escolhida acende').toHaveLength(1);
  expect(acesas[0]!.i).toBe(picked[0]!.i);
  expect(fim[0]!.t - inicio[0]!.t).toBeLessThan(1500);
  return picked[0]! as Evento & { i: number; nome: string };
}

// ---------- botão ----------
test.describe('roleta: botão', () => {
  test('botão Roleta (com a roda) fica embaixo das cartas no Duelo, no Trio e no Campeonato', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    const conferir = async (secao: string, row: string) => {
      const btn = page.locator(`#${secao} .spin`);
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
      await expect(btn).toHaveText('Roleta');
      await expect(btn).toHaveAttribute('title', 'Roleta (tecla R)');
      await expect(btn.locator('svg .wheel')).toHaveCount(1);
      await expect(btn.locator('svg')).toBeVisible();
      const b = (await btn.boundingBox())!, r = (await page.locator(row).boundingBox())!;
      expect(b.y, 'botão abaixo da fileira de cartas').toBeGreaterThanOrEqual(r.y + r.height - 1);
      const meio = b.x + b.width / 2;
      expect(meio).toBeGreaterThan(r.x);
      expect(meio).toBeLessThan(r.x + r.width);
    };
    await conferir('duel', '#duelRow');
    await aba(page, 'Trio');
    await expect(page.locator('#trioRow .card')).toHaveCount(3);
    await conferir('trio', '#trioRow');
    await aba(page, 'Campeonato');
    await expect(page.locator('#cup .spin')).toBeHidden(); // só aparece com o campeonato em andamento
    await iniciarCampeonato(page);
    await conferir('cup', '#cupRow');
  });

  test('sem cartas na tela a roleta e as teclas não fazem nada', async ({ page }) => {
    await prepare(page, { atraso: { pokemon: 2500 } });
    await page.goto('./');
    await expect(page.locator('#duelRow')).toContainText('Esperando as listas carregarem…');
    await page.locator('#duel .spin').click();
    expect(await girando(page)).toBe(false);
    for (const k of ['r', 'R', '1', '2']) { await page.keyboard.press(k); expect(await girando(page)).toBe(false); }
    await expect(page.locator('#duel .spin')).toBeEnabled();
    await expect(page.locator('#duelRow .card')).toHaveCount(2, { timeout: 10000 });
    // Placar e campeonato ainda não iniciado: nada a sortear
    await aba(page, 'Placar');
    for (const k of ['r', 'R', '1', '2']) { await page.keyboard.press(k); expect(await girando(page)).toBe(false); }
    await aba(page, 'Campeonato');
    await expect(page.locator('#cupSetup')).toBeVisible();
    for (const k of ['r', 'R', '1', '2']) { await page.keyboard.press(k); expect(await girando(page)).toBe(false); }
    await page.waitForTimeout(300);
    expect(await historico(page)).toHaveLength(0);
    await expect(page.locator('.card.lit, .card.picked')).toHaveCount(0);
  });
});

// ---------- movimento reduzido ----------
test.describe('roleta com movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('Duelo: o botão vai direto ao resultado e conta como uma escolha normal', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    const antes = await nomes(page, '#duelRow');
    await gravar(page, '#duelRow');
    await page.locator('#duel .spin').click();
    await esperarHist(page, 1, 3000);
    const pk = conferirGiroCalmo(await eventos(page));
    expect(antes[pk.i]).toBe(pk.nome);
    // quem foi escolhido fica no seu lado com a coroa; o outro lado ganha novo desafiante
    await expect(page.locator('#duelRow .card').nth(pk.i).locator('.name')).toHaveText(pk.nome);
    expect(await coroas(page, '#duelRow')).toEqual(pk.i === 0 ? [UMA, ''] : ['', UMA]);
    const outro = antes[1 - pk.i]!;
    const fr = pk.i === 0 ? ['pokemon', 'digimon'] as const : ['digimon', 'pokemon'] as const;
    const stats = (await lerStorage<Stats>(page, 'pdx-stats'))!;
    expect(stats.hist).toEqual([`${pk.nome} (${LABEL[fr[0]]}) venceu ${outro} (${LABEL[fr[1]]})`]);
    expect(stats.w).toEqual({ [fr[0]]: 1 });
    expect(stats.n).toEqual({ pokemon: 1, digimon: 1 });
    expect(stats.best).toEqual({ name: pk.nome, fr: fr[0], streak: 1 });
    await expect(page.locator('body')).not.toHaveClass(/spinning/);
    await expect(page.locator('#duel .spin')).toBeEnabled();
    await expect(page.locator('#duelRow .card.lit, #duelRow .card.picked')).toHaveCount(0);
  });

  test('teclas r e R giram a roleta (Duelo e Trio)', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await gravar(page, '#duelRow');
    await page.keyboard.press('r');
    await esperarHist(page, 1, 3000);
    conferirGiroCalmo(await eventos(page));
    await gravar(page, '#duelRow');
    await page.keyboard.press('R');
    await esperarHist(page, 2, 3000);
    conferirGiroCalmo(await eventos(page));
    // duas vitórias distribuídas entre os lados
    const c = await coroas(page, '#duelRow');
    expect(c.filter(Boolean).length).toBeGreaterThanOrEqual(1);
    await aba(page, 'Trio');
    await expect(page.locator('#trioRow .card')).toHaveCount(3);
    await gravar(page, '#trioRow');
    await page.keyboard.press('r');
    await esperarHist(page, 3, 3000);
    conferirGiroCalmo(await eventos(page));
  });

  test('Trio: a roleta escolhe uma das três cartas', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await aba(page, 'Trio');
    await expect(page.locator('#trioRow .card')).toHaveCount(3);
    const antes = await nomes(page, '#trioRow');
    await gravar(page, '#trioRow');
    await page.locator('#trio .spin').click();
    await esperarHist(page, 1, 3000);
    const pk = conferirGiroCalmo(await eventos(page));
    expect(antes[pk.i]).toBe(pk.nome);
    await expect(page.locator('#trioRow .card').nth(pk.i).locator('.name')).toHaveText(pk.nome);
    const esperado = ['', '', '']; esperado[pk.i] = UMA;
    expect(await coroas(page, '#trioRow')).toEqual(esperado);
    const frs = ['pokemon', 'digimon', 'smt'] as const;
    const h = await historico(page);
    expect(h).toHaveLength(1);
    expect(h[0]).toBe(`${pk.nome} (${LABEL[frs[pk.i]]}) venceu ` +
      [0, 1, 2].filter(i => i !== pk.i).map(i => `${antes[i]} (${LABEL[frs[i]]})`).join(', '));
  });

  test('Campeonato: a roleta (botão e tecla R) avança o confronto e não entra no placar', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await iniciarCampeonato(page);
    await expect(page.locator('#cupRound')).toHaveText('Quartas de final');
    const par = await nomes(page, '#cupRow');
    await gravar(page, '#cupRow');
    await page.locator('#cup .spin').click();
    await expect(page.locator('#cupCount')).toHaveText('confronto 2 de 4', { timeout: 3000 });
    const pk = conferirGiroCalmo(await eventos(page));
    expect(par[pk.i]).toBe(pk.nome);
    await expect(page.locator('#cupLogBody .match[data-r="0"][data-m="0"] .slot.win .nm')).toHaveText(pk.nome);
    await expect(page.locator('#cupLogBody .match[data-r="0"][data-m="0"] .slot.lose .nm')).toHaveText(par[1 - pk.i]!);
    const par2 = await nomes(page, '#cupRow');
    await page.keyboard.press('R');
    await expect(page.locator('#cupCount')).toHaveText('confronto 3 de 4', { timeout: 3000 });
    await expect(page.locator('#cupLogBody .match[data-r="0"][data-m="1"] .slot.win .nm')).toHaveCount(1);
    expect(par2).toContain(await page.locator('#cupLogBody .match[data-r="0"][data-m="1"] .slot.win .nm').textContent());
    expect(await historico(page)).toHaveLength(0); // campeonato não conta no placar
  });
});

// ---------- animação ----------
test.describe('roleta animada', () => {
  test('Duelo: acende as cartas em sequência, desacelera, trava a tela e escolhe a carta onde parou', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    const antes = await nomes(page, '#duelRow');
    const roda = page.locator('#duel .spin svg .wheel');
    expect(await roda.evaluate(e => getComputedStyle(e).animationName)).toBe('none');
    await gravar(page, '#duelRow');
    await page.locator('#duel .spin').click();
    await expect(page.locator('body')).toHaveClass(/\bspinning\b/);
    await expect(page.locator('#duel .spin')).toBeDisabled();
    for (const b of await page.locator('.spin').all()) await expect(b).toBeDisabled();
    await expect(page.locator('#duelRow .card.lit')).toHaveCount(1);
    // a carta marcada aparece antes de a escolha contar
    await expect(page.locator('#duelRow .card.picked')).toHaveCount(1, { timeout: 8000 });
    await expect(page.locator('#duelRow .card.picked')).toHaveClass(/\blit\b/);
    expect(await historico(page)).toHaveLength(0);
    await expect(page.locator('body')).toHaveClass(/\bspinning\b/);
    await esperarHist(page, 1);
    await expect(page.locator('body')).not.toHaveClass(/spinning/);
    for (const b of await page.locator('.spin').all()) await expect(b).toBeEnabled();
    expect(await roda.evaluate(e => getComputedStyle(e).animationName)).toBe('none');
    await expect(page.locator('#duelRow .card.lit, #duelRow .card.picked')).toHaveCount(0);

    const { escolhida } = conferirGiro(await eventos(page), 2);
    expect(antes[escolhida.i]).toBe(escolhida.nome);
    await expect(page.locator('#duelRow .card').nth(escolhida.i).locator('.name')).toHaveText(escolhida.nome);
    expect(await coroas(page, '#duelRow')).toEqual(escolhida.i === 0 ? [UMA, ''] : ['', UMA]);
    expect((await historico(page))[0]).toMatch(new RegExp(`^${escolhida.nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(`));
  });

  test('Trio: percorre as três cartas em ordem e escolhe uma', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await aba(page, 'Trio');
    await expect(page.locator('#trioRow .card')).toHaveCount(3);
    const antes = await nomes(page, '#trioRow');
    await gravar(page, '#trioRow');
    await page.keyboard.press('r');
    await expect(page.locator('body')).toHaveClass(/\bspinning\b/);
    await esperarHist(page, 1);
    const { escolhida } = conferirGiro(await eventos(page), 3);
    expect(antes[escolhida.i]).toBe(escolhida.nome);
    const esperado = ['', '', '']; esperado[escolhida.i] = UMA;
    expect(await coroas(page, '#trioRow')).toEqual(esperado);
  });

  test('Campeonato: gira entre as duas cartas e avança o confronto', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await iniciarCampeonato(page);
    const par = await nomes(page, '#cupRow');
    await gravar(page, '#cupRow');
    await page.locator('#cup .spin').click();
    await expect(page.locator('#cup .spin')).toBeDisabled();
    await expect(page.locator('#cupCount')).toHaveText('confronto 2 de 4', { timeout: 8000 });
    const { escolhida } = conferirGiro(await eventos(page), 2);
    expect(par[escolhida.i]).toBe(escolhida.nome);
    await expect(page.locator('#cupLogBody .match[data-r="0"][data-m="0"] .slot.win .nm')).toHaveText(escolhida.nome);
    await expect(page.locator('#cup .spin')).toBeEnabled();
  });

  test('durante o giro, cliques nas cartas, no botão e as teclas 1, 2 e R são ignorados', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await gravar(page, '#duelRow');
    await page.locator('#duel .spin').click();
    await expect(page.locator('body')).toHaveClass(/\bspinning\b/);
    const cards = page.locator('#duelRow .card');
    await cards.nth(0).click({ force: true });
    await cards.nth(1).click({ force: true });
    for (const k of ['1', '2', 'r', 'R', '1']) await page.keyboard.press(k);
    await page.locator('#duel .spin').click({ force: true });
    // tudo isso aconteceu com a roleta ainda girando e sem escolha registrada
    expect(await girando(page)).toBe(true);
    expect(await historico(page)).toHaveLength(0);
    await esperarHist(page, 1);
    // nenhuma escolha extra nem giro enfileirado depois
    await page.waitForTimeout(1500);
    expect(await historico(page)).toHaveLength(1);
    expect(await girando(page)).toBe(false);
    const ev = await eventos(page);
    const { escolhida } = conferirGiro(ev, 2);
    expect(await coroas(page, '#duelRow')).toEqual(escolhida.i === 0 ? [UMA, ''] : ['', UMA]);
  });

  test('trocar de aba durante o giro cancela; voltar pro Duelo funciona normalmente', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    const antes = await nomes(page, '#duelRow');
    await page.locator('#duel .spin').click();
    await expect(page.locator('body')).toHaveClass(/\bspinning\b/);
    await expect(page.locator('#duelRow .card.lit')).toHaveCount(1);
    await aba(page, 'Trio');
    await expect(page.locator('#trioRow .card')).toHaveCount(3);
    expect(await girando(page)).toBe(false);
    for (const b of await page.locator('.spin').all()) await expect(b).toBeEnabled();
    // espera mais que o giro mais longo de duas cartas (~2,7 s): nada é escolhido
    await page.waitForTimeout(4000);
    expect(await historico(page)).toHaveLength(0);
    expect(await girando(page)).toBe(false);
    await expect(page.locator('#trioRow .card.lit, #trioRow .card.picked, #trioRow .crown')).toHaveCount(0);
    // volta: mesmas cartas, sem destaque nem coroa, e escolher funciona
    await aba(page, 'Duelo');
    expect(await nomes(page, '#duelRow')).toEqual(antes);
    await expect(page.locator('#duelRow .card.lit, #duelRow .card.picked, #duelRow .crown')).toHaveCount(0);
    await expect(page.locator('#duel .spin')).toBeEnabled();
    await page.locator('#duelRow .card').nth(1).click();
    await esperarHist(page, 1);
    expect(await coroas(page, '#duelRow')).toEqual(['', UMA]);
    // e a roleta gira de novo, com uma escolha só
    await gravar(page, '#duelRow');
    await page.keyboard.press('r');
    await esperarHist(page, 2);
    conferirGiro(await eventos(page), 2);
    await page.waitForTimeout(1200);
    expect(await historico(page)).toHaveLength(2);
  });

  test('trocar de aba com a carta já marcada (antes de a escolha contar) também cancela', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    const antes = await nomes(page, '#duelRow');
    // troca pro Placar 300 ms depois de a carta ganhar .picked (a escolha só viria ~1 s depois)
    await page.evaluate(() => {
      const obs = new MutationObserver(() => {
        if (!document.querySelector('#duelRow .card.picked')) return;
        obs.disconnect();
        setTimeout(() => ([...document.querySelectorAll<HTMLElement>('nav button')].find(b => b.textContent?.trim() === 'Placar'))!.click(), 300);
      });
      obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    });
    await page.locator('#duel .spin').click();
    await expect(page.locator('#stats')).toBeVisible({ timeout: 8000 });
    expect(await girando(page)).toBe(false);
    await page.waitForTimeout(1500);
    expect(await historico(page)).toHaveLength(0);
    await expect(page.locator('#histList')).toHaveText('Nada ainda.');
    await aba(page, 'Duelo');
    expect(await nomes(page, '#duelRow')).toEqual(antes);
    await expect(page.locator('#duelRow .card.lit, #duelRow .card.picked, #duelRow .crown')).toHaveCount(0);
    await page.keyboard.press('1');
    await esperarHist(page, 1);
    expect(await coroas(page, '#duelRow')).toEqual([UMA, '']);
  });

  test('Campeonato: sair e voltar durante o giro mantém o mesmo confronto', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await iniciarCampeonato(page);
    const par = await nomes(page, '#cupRow');
    await page.locator('#cup .spin').click();
    await expect(page.locator('body')).toHaveClass(/\bspinning\b/);
    await aba(page, 'Duelo');
    await aba(page, 'Campeonato');
    expect(await girando(page)).toBe(false);
    await page.waitForTimeout(3500);
    await expect(page.locator('#cupCount')).toHaveText('confronto 1 de 4');
    expect(await nomes(page, '#cupRow')).toEqual(par);
    await expect(page.locator('#cupLogBody .slot.win')).toHaveCount(0);
    await expect(page.locator('#cupRow .card.lit, #cupRow .card.picked')).toHaveCount(0);
    await page.keyboard.press('2');
    await expect(page.locator('#cupCount')).toHaveText('confronto 2 de 4');
    await expect(page.locator('#cupLogBody .match[data-r="0"][data-m="0"] .slot.win .nm')).toHaveText(par[1]!);
  });
});

// ---------- teclado ----------
test.describe('teclado', () => {
  test('Duelo: 1 e 2 escolhem a carta; 3, 0 e 9 não fazem nada', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    const a = await nomes(page, '#duelRow');
    await page.keyboard.press('1');
    await esperarHist(page, 1, 2000);
    expect((await historico(page))[0]).toBe(`${a[0]} (Pokémon) venceu ${a[1]} (Digimon)`);
    expect((await nomes(page, '#duelRow'))[0]).toBe(a[0]);
    expect(await coroas(page, '#duelRow')).toEqual([UMA, '']);
    const b = await nomes(page, '#duelRow');
    await page.keyboard.press('2');
    await esperarHist(page, 2, 2000);
    expect((await historico(page))[0]).toBe(`${b[1]} (Digimon) venceu ${b[0]} (Pokémon)`);
    expect((await nomes(page, '#duelRow'))[1]).toBe(b[1]);
    expect(await coroas(page, '#duelRow')).toEqual(['', UMA]);
    const c = await nomes(page, '#duelRow');
    for (const k of ['3', '0', '9']) await page.keyboard.press(k);
    await page.waitForTimeout(400);
    expect(await historico(page)).toHaveLength(2);
    expect(await nomes(page, '#duelRow')).toEqual(c);
  });

  test('Trio: 1, 2 e 3 escolhem a carta; 4 não faz nada', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await aba(page, 'Trio');
    await expect(page.locator('#trioRow .card')).toHaveCount(3);
    let total = 0;
    for (const [tecla, i] of [['3', 2], ['2', 1], ['1', 0]] as const) {
      const antes = await nomes(page, '#trioRow');
      await page.keyboard.press(tecla);
      await esperarHist(page, ++total, 2000);
      expect((await historico(page))[0]).toMatch(/ venceu /);
      expect((await historico(page))[0]!.startsWith(`${antes[i]} (`)).toBe(true);
      expect((await nomes(page, '#trioRow'))[i]).toBe(antes[i]);
      const esperado = ['', '', '']; esperado[i] = UMA;
      expect(await coroas(page, '#trioRow')).toEqual(esperado);
    }
    await page.keyboard.press('4');
    await page.waitForTimeout(400);
    expect(await historico(page)).toHaveLength(3);
  });

  test('Campeonato: 1 e 2 escolhem o vencedor do confronto; 3 não faz nada', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await iniciarCampeonato(page);
    const p1 = await nomes(page, '#cupRow');
    await page.keyboard.press('2');
    await expect(page.locator('#cupCount')).toHaveText('confronto 2 de 4');
    await expect(page.locator('#cupLogBody .match[data-r="0"][data-m="0"] .slot.win .nm')).toHaveText(p1[1]!);
    const p2 = await nomes(page, '#cupRow');
    await page.keyboard.press('1');
    await expect(page.locator('#cupCount')).toHaveText('confronto 3 de 4');
    await expect(page.locator('#cupLogBody .match[data-r="0"][data-m="1"] .slot.win .nm')).toHaveText(p2[0]!);
    await page.keyboard.press('3');
    await page.waitForTimeout(300);
    await expect(page.locator('#cupCount')).toHaveText('confronto 3 de 4');
  });

  test('teclas ignoradas com o foco num select ou input', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    const antes = await nomes(page, '#duelRow');
    // select do Duelo
    await page.locator('#duelA').focus();
    for (const k of ['1', '2', 'r', 'R']) { await page.keyboard.press(k); expect(await girando(page)).toBe(false); }
    await expect(page.locator('#duelA')).toHaveValue('pokemon');
    // um campo de texto qualquer na página
    await page.evaluate(() => { const i = document.createElement('input'); i.id = 'campo-teste'; document.body.prepend(i); });
    await page.locator('#campo-teste').focus();
    for (const k of ['1', '2', 'r', 'R']) { await page.keyboard.press(k); expect(await girando(page)).toBe(false); }
    await expect(page.locator('#campo-teste')).toHaveValue('12rR');
    await page.waitForTimeout(400);
    expect(await historico(page)).toHaveLength(0);
    expect(await nomes(page, '#duelRow')).toEqual(antes);
    // select do Trio com a tecla 3
    await aba(page, 'Trio');
    await expect(page.locator('#trioRow .card')).toHaveCount(3);
    await page.locator('#trio2').focus();
    for (const k of ['3', 'r']) { await page.keyboard.press(k); expect(await girando(page)).toBe(false); }
    await page.waitForTimeout(300);
    expect(await historico(page)).toHaveLength(0);
    // controle: sem foco em campo, a tecla vale
    await page.locator('#trio2').blur();
    await page.keyboard.press('3');
    await esperarHist(page, 1, 2000);
  });
});
