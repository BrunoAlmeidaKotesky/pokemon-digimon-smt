// Draft online com 3 participantes (transporte local): 2 rodadas × 3 franquias, do começo ao fim,
// com um personagem repetido forçado pela semente (a lista de Sujimon é pequena e a semente é fixa).
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { mockApis, seedRandom } from './helpers';

test.use({ reducedMotion: 'reduce' });

const SUJIMON: [string, string][] = Array.from({ length: 8 }, (_, i) => [`Sujimon ${i + 1}`, String(i + 1).padStart(3, '0')]);
const FRS = ['JoJo', 'SMT/Persona', 'Sujimon'];

async function abrir(ctx: BrowserContext, n: number, sala?: string) {
  const p = await ctx.newPage();
  await p.goto(`./?transporte=local&jogador=${n}${sala ? '&sala=' + sala : ''}`);
  await expect(p.locator('#status')).not.toContainText('carregando', { timeout: 15000 });
  return p;
}
const opcoes = async (p: Page) => (await p.locator('#onDraftOpts .card .name').allTextContents()).map(s => s.trim());
async function escolher(p: Page, nome: string) {
  const att = await p.locator('#onDraftOpts').getAttribute('data-att');
  const fi = await p.locator('#onDraftOpts').getAttribute('data-fi');
  await p.locator('#onDraftOpts .card', { has: p.locator('.name', { hasText: new RegExp(`^${nome}$`) }) }).click();
  // a tela avança pra próxima franquia (ou pro "time pronto")
  await expect(p.locator(`#onDraftOpts[data-att="${att}"][data-fi="${fi}"]`)).toHaveCount(0);
}

test('Draft de 2 rodadas e 3 franquias, do começo ao fim, com repetido refeito em segredo', async ({ context }) => {
  test.setTimeout(180_000);
  await mockApis(context, { sujimon: SUJIMON });
  await seedRandom(context, 11);
  const ana = await abrir(context, 1);
  await ana.locator('nav button', { hasText: 'Online' }).click();
  await ana.locator('#onName').fill('Ana');
  await ana.locator('#onCreate').click();
  await expect(ana.locator('#onRoomCode')).toHaveText(/^[A-Z]{4}$/);
  const code = (await ana.locator('#onRoomCode').textContent())!;
  const beto = await abrir(context, 2, code);
  await beto.locator('#onName').fill('Beto'); await beto.locator('#onJoin').click();
  const caio = await abrir(context, 3, code);
  await caio.locator('#onName').fill('Caio'); await caio.locator('#onJoin').click();
  const todos = [ana, beto, caio];
  await expect(ana.locator('#onPlayers .chip')).toHaveCount(3);

  // configuração: JoJo, SMT e Sujimon, nessa ordem; 3 opções; 2 rodadas
  await ana.locator('#onLobby [data-modo="draft"]').click();
  await ana.getByRole('button', { name: 'Tirar Pokémon' }).click();
  await ana.getByRole('button', { name: 'Tirar Digimon' }).click();
  await ana.locator('#onDraftAdd button[data-add="sujimon"]').click();
  await ana.getByRole('button', { name: 'Descer JoJo' }).click();
  await ana.getByRole('button', { name: 'Subir JoJo' }).click();
  await ana.locator('#onDraftRounds button[data-n="2"]').click();
  await ana.locator('#onDraftX button[data-n="3"]').click();
  for (const p of todos) {
    await expect(p.locator('#onDraftFrs li .nm')).toHaveText(FRS);
    await expect(p.locator('#onDraftRounds button[data-n="2"]')).toHaveClass(/on/);
  }
  await ana.locator('#onStart').click();

  const usados: Record<string, Set<string>> = { JoJo: new Set(), 'SMT/Persona': new Set(), Sujimon: new Set() };
  let repetido: string | null = null;
  for (const rodada of [1, 2]) {
    for (const p of todos) await expect(p.locator('#onDraftRound')).toContainText(`Rodada ${rodada} de 2`);
    const escolhas: Record<string, string[]> = {};
    for (const fr of FRS) {
      const ops = await Promise.all(todos.map(async p => { await expect(p.locator('#onDraftAsk')).toContainText(fr); return opcoes(p); }));
      ops.forEach(o => expect(o).toHaveLength(3));
      // personagem escolhido numa rodada anterior não aparece mais
      if (rodada === 2) ops.flat().forEach(n => expect(usados[fr]!.has(n), `${n} já foi escolhido`).toBe(false));
      const comum = ops[0]!.find(n => ops[1]!.includes(n));
      let picks: string[];
      if (rodada === 1 && !repetido && comum) {
        repetido = comum;
        picks = [comum, comum, ops[2]!.find(n => n !== comum)!];
      } else {
        picks = [];
        for (const o of ops) picks.push(o.find(n => !picks.includes(n))!);
      }
      escolhas[fr] = picks;
      for (const [i, p] of todos.entries()) await escolher(p, picks[i]!);
    }
    if (rodada === 1) {
      expect(repetido, 'a semente precisa dar um personagem em comum pra Ana e o Beto').not.toBeNull();
      const fr = FRS.find(f => escolhas[f]!.filter(n => n === repetido).length > 1)!;
      // aviso pra todos, sem dizer qual personagem nem quem escolheu
      for (const p of todos) {
        await expect(p.locator('#onNotice')).toContainText(`${fr} vai ser refeita por todos`);
        await expect(p.locator('#onNotice')).not.toContainText(repetido!);
        for (const nome of ['Ana', 'Beto', 'Caio']) await expect(p.locator('#onNotice')).not.toContainText(nome);
        await expect(p.locator('#onDraftAsk')).toContainText(fr);
      }
      // todo mundo refaz aquela franquia com opções novas, sem o repetido
      const ops = await Promise.all(todos.map(opcoes));
      ops.flat().forEach(n => expect(n).not.toBe(repetido));
      const picks: string[] = [];
      for (const o of ops) picks.push(o.find(n => !picks.includes(n))!);
      escolhas[fr] = picks;
      for (const [i, p] of todos.entries()) await escolher(p, picks[i]!);
    }
    for (const fr of FRS) escolhas[fr]!.forEach(n => usados[fr]!.add(n));

    // revelação: uma votação por franquia, com o nome de quem escolheu
    for (const [fi, fr] of FRS.entries()) {
      for (const p of todos) {
        await expect(p.locator('#onDraftRound')).toContainText(`Revelação: ${fr} (${fi + 1} de 3)`);
        await expect(p.locator('#onArena .card')).toHaveCount(3);
      }
      await expect(ana.locator('#onArena .card .crown')).toHaveText(['de Ana', 'de Beto', 'de Caio']);
      expect(await ana.locator('#onArena .card .name').allTextContents()).toEqual(escolhas[fr]);
      await ana.locator('#onArena .card').nth(1).click(); // dá pra votar em qualquer um, inclusive no próprio
      await beto.locator('#onArena .card').nth(1).click();
      await caio.locator('#onArena .card').nth(2).click();
      for (const p of todos) await expect(p.locator('#onResult')).toContainText(`${escolhas[fr]![1]}`);
      await ana.locator('#onNext').click();
    }
    await expect(ana.locator('#onQualified li')).toHaveCount(rodada * 3);
  }

  // final entre os 6 classificados: 8 vagas, 2 byes (passam direto, sem votação)
  for (const p of todos) await expect(p.locator('#onDraftRound')).toContainText('Final');
  let votacoes = 0;
  while (await ana.locator('#onDraft[data-step="final"]').count() && votacoes < 8) {
    const seq = await ana.locator('#onArena').getAttribute('data-seq');
    for (const p of todos) await p.locator('#onArena .card').nth(0).click();
    await expect(ana.locator('#onNext')).toBeVisible();
    await ana.locator('#onNext').click();
    await expect(ana.locator(`#onArena[data-seq="${seq}"]`)).toHaveCount(0);
    votacoes++;
  }
  expect(votacoes).toBe(5);

  // fim: campeão, quem escolheu e em qual rodada, e o que cada um escolheu em cada rodada
  for (const p of todos) {
    await expect(p.locator('#onDraftEnd .crown')).toHaveText('♛ campeão');
    await expect(p.locator('#onDraftChampion')).toContainText(/Escolhido por (Ana|Beto|Caio) na rodada [12]\./);
    await expect(p.locator('#onDraftHistory [data-round]')).toHaveCount(2);
    // os 2 byes aparecem na chave (passaram direto, sem votação)
    await expect(p.locator('#onBracket .slot .nm', { hasText: /^bye$/ })).toHaveCount(2);
    await expect(p.locator('#onDraftHistory [data-round="1"] li')).toHaveCount(3);
    await expect(p.locator('#onDraftHistory [data-round="2"] li[data-jogador="Caio"]')).toContainText('Sujimon');
  }
});
