// Adivinha online, vez de cada um (transporte local): o host sorteia o secreto, que nunca vai pro convidado enquanto
// a rodada está aberta; um chute por vez, tempo esgotado passa a vez, quem acerta ganha a rodada; placar no fim.
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { fixture, mockApis, pokemonDeVariasGeracoes, seedRandom } from './helpers';

test.use({ reducedMotion: 'reduce' });

const porNome = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const NOMES_LOL = Object.keys(fixture<{ itens: Record<string, unknown> }>('adivinha-catalogo-lol.json').itens).sort(porNome);

async function abrir(ctx: BrowserContext, n: number, sala?: string, espiar = false) {
  const p = await ctx.newPage();
  // o convidado anota tudo o que chega pelo canal do transporte local (pra conferir que o secreto não veio)
  if (espiar) {
    await p.addInitScript(() => {
      const w = window as unknown as { __msgs: string[] };
      w.__msgs = [];
      const Orig = BroadcastChannel;
      window.BroadcastChannel = class extends Orig {
        constructor(nome: string) {
          super(nome);
          this.addEventListener('message', e => { w.__msgs.push(JSON.stringify((e as MessageEvent).data)); });
        }
      };
    });
  }
  await p.goto(`./?transporte=local&jogador=${n}${sala ? '&sala=' + sala : ''}`);
  await expect(p.locator('#status')).not.toContainText('carregando', { timeout: 15000 });
  return p;
}
const linhas = (p: Page) => p.locator('#onAdv #advTabela tbody tr');

test('Adivinha online: vez de cada um, secreto só no host, tempo esgotado, revelar e placar final', async ({ context }) => {
  test.setTimeout(150_000);
  await mockApis(context, { adivinha: true });
  await seedRandom(context, 3);
  const ana = await abrir(context, 1);
  await ana.locator('nav button', { hasText: 'Online' }).click();
  await ana.locator('#onName').fill('Ana');
  await ana.locator('#onCreate').click();
  await expect(ana.locator('#onRoomCode')).toHaveText(/^[A-Z]{4}$/);
  const code = (await ana.locator('#onRoomCode').textContent())!;
  const beto = await abrir(context, 2, code, true);
  await beto.locator('#onName').fill('Beto');
  await beto.locator('#onJoin').click();
  await expect(ana.locator('#onPlayers .chip')).toHaveCount(2);

  // lobby: modo Adivinha, LoL, Clássico, 2 rodadas, 15 s por vez (o convidado vê, sem mudar)
  await ana.locator('#onLobby [data-modo="adivinha"]').click();
  await expect(ana.locator('#onAdvGrupos [data-grupo="lol"]')).toHaveAttribute('aria-checked', 'true');
  for (let i = 0; i < 3; i++) await ana.locator('#onAdvRodadasMenos').click();
  await ana.locator('#onAdvTempo button[data-n="15"]').click();
  await expect(beto.locator('#onAdvRodadas')).toHaveValue('2');
  await expect(beto.locator('#onAdvTempo button[data-n="15"]')).toHaveAttribute('aria-checked', 'true');
  await expect(beto.locator('#onAdvGrupos [data-grupo="lol"]')).toBeDisabled();
  await expect(ana.locator('#onStartBar .resumo b')).toHaveText('Adivinha · LoL · Clássico · 2 rodadas · 15 s por vez');
  await ana.locator('#onStart').click();

  // rodada 1: começa a Ana (primeira da sala); o campo do Beto fica travado
  for (const p of [ana, beto]) await expect(p.locator('#onAdvRodada')).toContainText('Rodada 1 de 2');
  await expect(ana.locator('#onAdvVezNome')).toHaveText('Sua vez!');
  await expect(beto.locator('#onAdvVezNome')).toHaveText('Vez de Ana');
  await expect(beto.locator('#onAdvChute')).toBeDisabled();
  await expect(ana.locator('#onAdvChute')).toBeEnabled();
  await expect(ana.locator('#onAdvChute')).toBeFocused();
  await expect(ana.locator('#onPlayers .chip[data-nome="Ana"] .tag.vez')).toHaveText('na vez');

  // cada um chuta na sua vez, um nome diferente, até alguém acertar
  let feitos = 0;
  let vencedor = '';
  for (const nome of NOMES_LOL) {
    const daAna = (await ana.locator('#onAdvVezNome').textContent()) === 'Sua vez!';
    const p = daAna ? ana : beto;
    await p.locator('#onAdvChute').fill(nome);
    await expect(p.locator('#onAdvChuteLista li').first()).toHaveAttribute('data-nome', nome);
    await p.locator('#onAdvChute').press('Enter');
    feitos++;
    for (const q of [ana, beto]) await expect(linhas(q)).toHaveCount(feitos);
    await expect(linhas(beto).first()).toHaveAttribute('data-nome', nome);
    await expect(linhas(beto).first().locator('small')).toHaveText(daAna ? 'Ana' : 'você');
    if (await ana.locator('#onAdv[data-passo="resultado"]').count()) { vencedor = daAna ? 'Ana' : 'Beto'; break; }
    // errou: a vez passa pro outro
    await expect((daAna ? beto : ana).locator('#onAdvVezNome')).toHaveText('Sua vez!');
  }
  expect(vencedor).not.toBe('');
  const secreto = (await linhas(ana).first().getAttribute('data-nome'))!;
  await expect(linhas(ana).first()).toHaveClass(/certo/);
  await expect(beto.locator('#onAdvFim h3')).toHaveText(vencedor === 'Beto' ? 'Você acertou! +1 ponto' : 'Ana acertou! +1 ponto');
  await expect(beto.locator('#onAdvFim .card .name')).toHaveText(secreto);
  await expect(beto.locator('#onAdvPlacar li').first()).toHaveAttribute('data-nome', vencedor);
  await expect(beto.locator('#onAdvPlacar li').first().locator('b')).toHaveText('1');
  await expect(beto.locator('#onAdvProxima')).toHaveCount(0);

  // o secreto não veio em nenhuma visão da rodada aberta (o convidado só recebeu as pistas)
  const msgs: string[] = await beto.evaluate(() => (window as unknown as { __msgs: string[] }).__msgs);
  const abertas = msgs.map(m => JSON.parse(m) as { data?: { t?: string; view?: { game?: { mode?: string; passo?: string; rodada?: number } } } })
    .filter(m => m.data?.t === 'state' && m.data.view?.game?.mode === 'adivinha' && m.data.view.game.passo === 'chute' && m.data.view.game.rodada === 1);
  expect(abertas.length).toBeGreaterThan(feitos - 1);
  for (const m of abertas) expect(JSON.stringify(m)).not.toContain(`"name":${JSON.stringify(secreto)}`);

  // rodada 2: começa o Beto; ele deixa o tempo acabar e a vez passa pra Ana
  await ana.locator('#onAdvProxima').click();
  for (const p of [ana, beto]) await expect(p.locator('#onAdvRodada')).toContainText('Rodada 2 de 2');
  await expect(beto.locator('#onAdvVezNome')).toHaveText('Sua vez!');
  await expect(ana.locator('#onAdvTempoResta')).toHaveText(/^1[0-5] s$/);
  await expect(ana.locator('#onAdvVezNome')).toHaveText('Sua vez!', { timeout: 20_000 });
  await expect(linhas(beto)).toHaveCount(1);
  await expect(linhas(beto).first()).toHaveClass(/adv-tempo/);
  await expect(linhas(beto).first()).toContainText('Você deixou o tempo acabar');
  await expect(linhas(ana).first()).toContainText('Beto deixou o tempo acabar');

  // o host revela (com confirmação): ninguém ganha a rodada
  await ana.locator('#onAdvRevelar').click();
  await expect(ana.locator('#onAdvRevelar')).toHaveText('Revelar mesmo?');
  await ana.locator('#onAdvRevelar').click();
  await expect(beto.locator('#onAdvFim h3')).toHaveText('Ninguém acertou. Era este:');
  await expect(ana.locator('#onAdvProxima')).toHaveText('Ver o placar final');
  await ana.locator('#onAdvProxima').click();

  // placar final e as rodadas
  for (const p of [ana, beto]) {
    await expect(p.locator('#onAdvFinal h3')).toHaveText(`${vencedor} venceu com 1 ponto!`);
    await expect(p.locator('#onAdvHistorico li')).toHaveCount(2);
    await expect(p.locator('#onAdvHistorico li').first()).toContainText(secreto);
    await expect(p.locator('#onAdvHistorico li').first()).toContainText(`acertado por ${vencedor}`);
    await expect(p.locator('#onAdvHistorico li').nth(1)).toContainText('ninguém acertou');
  }
  await ana.locator('#onLobbyBtn').click();
  await expect(beto.locator('#onLobby')).toBeVisible();
});

test('Adivinha online no Imagem (recorte): o mesmo recorte pra todos, que abre a cada chute errado de qualquer um', async ({ context }) => {
  test.setTimeout(90_000);
  await mockApis(context, { adivinha: true });
  await seedRandom(context, 5);
  const ana = await abrir(context, 1);
  await ana.locator('nav button', { hasText: 'Online' }).click();
  await ana.locator('#onName').fill('Ana');
  await ana.locator('#onCreate').click();
  await expect(ana.locator('#onRoomCode')).toHaveText(/^[A-Z]{4}$/);
  const code = (await ana.locator('#onRoomCode').textContent())!;
  const beto = await abrir(context, 2, code);
  await beto.locator('#onName').fill('Beto');
  await beto.locator('#onJoin').click();
  await expect(ana.locator('#onPlayers .chip')).toHaveCount(2);
  await ana.locator('#onLobby [data-modo="adivinha"]').click();
  await expect(ana.locator('#onAdvSubmodo button')).toHaveText(['Clássico', 'Imagem', 'Blur', 'Emoji']);
  // os modos são de marcar vários: liga a Imagem e desliga o Clássico (o último ligado não sai)
  await ana.locator('#onAdvSubmodo button[data-n="imagem"]').click();
  await ana.locator('#onAdvSubmodo button[data-n="classico"]').click();
  await expect(beto.locator('#onAdvSubmodo button[data-n="imagem"]')).toHaveAttribute('aria-checked', 'true');
  await expect(beto.locator('#onAdvSubmodo button[data-n="classico"]')).toHaveAttribute('aria-checked', 'false');
  await expect(ana.locator('#onAdvSubmodo button[data-n="imagem"]')).toBeDisabled();
  await expect(ana.locator('#onStartBar .resumo b')).toContainText('Adivinha · LoL · Imagem');
  await ana.locator('#onStart').click();

  const quadro = (p: Page) => p.locator('#onAdv #advImagem');
  for (const p of [ana, beto]) {
    await expect(quadro(p)).toHaveAttribute('data-modo', 'imagem');
    await expect(quadro(p)).toHaveAttribute('data-nivel', '0');
    await expect(quadro(p)).toHaveAttribute('data-escala', '5');
  }
  // o mesmo recorte: mesma posição da imagem dentro da moldura
  const origem = async (p: Page) => (await quadro(p).locator('img').getAttribute('style'))!.match(/left: [^;]+; top: [^;]+/)![0];
  expect(await origem(beto)).toBe(await origem(ana));

  // cada chute errado (de qualquer um) abre um nível, igual nas duas telas
  let erros = 0;
  for (const nome of NOMES_LOL) {
    const p = (await ana.locator('#onAdvVezNome').textContent()) === 'Sua vez!' ? ana : beto;
    await p.locator('#onAdvChute').fill(nome);
    await expect(p.locator('#onAdvChuteLista li').first()).toHaveAttribute('data-nome', nome);
    await p.locator('#onAdvChute').press('Enter');
    await expect(beto.locator('#onAdv #advErrados li, #onAdv #onAdvFim')).toHaveCount(erros + 1);
    if (await ana.locator('#onAdv[data-passo="resultado"]').count()) break;
    erros++;
    for (const q of [ana, beto]) await expect(quadro(q)).toHaveAttribute('data-nivel', String(erros));
    if (erros === 2) break;
  }
  if (erros === 2) await expect(quadro(beto)).toHaveAttribute('data-escala', '3.85');
});

test('Adivinha online com recorte: só a geração II do Pokémon no sorteio, no chute e no autocompletar de todos', async ({ context }) => {
  test.setTimeout(90_000);
  await mockApis(context, { adivinha: true });
  await pokemonDeVariasGeracoes(context);
  await seedRandom(context, 8);
  const ana = await abrir(context, 1);
  await ana.locator('nav button', { hasText: 'Online' }).click();
  await ana.locator('#onName').fill('Ana');
  await ana.locator('#onCreate').click();
  await expect(ana.locator('#onRoomCode')).toHaveText(/^[A-Z]{4}$/);
  const code = (await ana.locator('#onRoomCode').textContent())!;
  const beto = await abrir(context, 2, code);
  await beto.locator('#onName').fill('Beto');
  await beto.locator('#onJoin').click();
  await expect(ana.locator('#onPlayers .chip')).toHaveCount(2);
  await ana.locator('#onLobby [data-modo="adivinha"]').click();
  // franquia sem recorte: nada de chips
  await expect(ana.locator('#onAdvRecorte')).toHaveCount(0);
  // as franquias também: liga o Pokémon e desliga o LoL
  await ana.locator('#onAdvGrupos [data-grupo="pokemon"]').click();
  await ana.locator('#onAdvGrupos [data-grupo="lol"]').click();
  await expect(ana.locator('#onAdvRecorteN')).toHaveText('10 personagens entram');
  for (const g of ['I', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']) await ana.locator(`#onAdvRecorte [data-valor="${g}"]`).click();
  await expect(ana.locator('#onAdvRecorteN')).toHaveText('4 personagens entram');
  await expect(ana.locator('#onStartBar .resumo b')).toHaveText('Adivinha · Pokémon (geração II) · Clássico · 5 rodadas · 40 s por vez');
  // o convidado vê a escolha, sem mudar
  await expect(beto.locator('#onAdvRecorte [data-valor="II"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(beto.locator('#onAdvRecorte [data-valor="I"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(beto.locator('#onAdvRecorte [data-valor="I"]')).toBeDisabled();
  await ana.locator('#onStart').click();
  for (const p of [ana, beto]) await expect(p.locator('#onAdvFranquia')).toContainText('Pokémon (geração II)');

  // autocompletar só com a geração II (na vez da Ana; depois, na do Beto)
  await ana.locator('#onAdvChute').fill('bul');
  await expect(ana.locator('#onAdvChuteNada')).toBeVisible();
  await ana.locator('#onAdvChute').fill('to');
  const sug = async (p: Page) => (await p.locator('#onAdvChuteLista li .nm').allTextContents()).map(s => s.trim());
  expect(await sug(ana)).toEqual(['Togepi', 'Totodile']);
  await ana.locator('#onAdvChute').press('Enter');
  if (!(await ana.locator('#onAdv[data-passo="resultado"]').count())) {
    await expect(beto.locator('#onAdvVezNome')).toHaveText('Sua vez!');
    await beto.locator('#onAdvChute').fill('char');
    await expect(beto.locator('#onAdvChuteNada')).toBeVisible();
    await beto.locator('#onAdvChute').fill('chi');
    expect(await sug(beto)).toEqual(['Chikorita']);
  }
  // o secreto (revelado pelo host) é da geração II
  if (!(await ana.locator('#onAdv[data-passo="resultado"]').count())) {
    await ana.locator('#onAdvRevelar').click();
    await ana.locator('#onAdvRevelar').click();
  }
  await expect(beto.locator('#onAdvFim .card .name')).toHaveText(/^(Chikorita|Cyndaquil|Totodile|Togepi)$/);
});

test('Adivinha online com duas franquias, dois modos e sem limite de tempo: cada rodada diz a franquia e o modo', async ({ context }) => {
  test.setTimeout(90_000);
  await mockApis(context, { adivinha: true });
  await pokemonDeVariasGeracoes(context);
  await seedRandom(context, 11);
  const ana = await abrir(context, 1);
  await ana.locator('nav button', { hasText: 'Online' }).click();
  await ana.locator('#onName').fill('Ana');
  await ana.locator('#onCreate').click();
  await expect(ana.locator('#onRoomCode')).toHaveText(/^[A-Z]{4}$/);
  const code = (await ana.locator('#onRoomCode').textContent())!;
  const beto = await abrir(context, 2, code);
  await beto.locator('#onName').fill('Beto');
  await beto.locator('#onJoin').click();
  await expect(ana.locator('#onPlayers .chip')).toHaveCount(2);
  await ana.locator('#onLobby [data-modo="adivinha"]').click();
  await ana.locator('#onAdvGrupos [data-grupo="pokemon"]').click();
  await ana.locator('#onAdvSubmodo button[data-n="blur"]').click();
  await expect(ana.locator('#onAdvTempo button')).toHaveText(['15 s', '20 s', '30 s', '40 s', '60 s', '90 s', 'Sem limite']);
  await ana.locator('#onAdvTempo button[data-n="0"]').click();
  for (const p of [ana, beto]) {
    await expect(p.locator('#onStartBar .resumo b')).toContainText('Adivinha · LoL + Pokémon · Clássico + Blur · 5 rodadas (10 partidas) · ');
    await expect(p.locator('#onStartBar .resumo b')).toContainText('sem limite de tempo');
  }
  await expect(beto.locator('#onAdvGrupos [data-grupo="pokemon"]')).toHaveAttribute('aria-checked', 'true');
  await ana.locator('#onStart').click();

  // rodada 1 = Clássico (o primeiro modo), numa das duas franquias; sem relógio
  for (const p of [ana, beto]) {
    await expect(p.locator('#onAdvFranquia')).toHaveText(/^(LoL|Pokémon) · Clássico$/);
    await expect(p.locator('#onAdvTempoResta')).toHaveText('sem limite');
    await expect(p.locator('#onAdvVez .adv-barra')).toHaveCount(0);
  }
  await expect(ana.locator('#onAdvVezNome')).toHaveText('Sua vez!');
  // a vez não passa sozinha
  await ana.waitForTimeout(2500);
  await expect(ana.locator('#onAdvVezNome')).toHaveText('Sua vez!');
  // o host revela e segue: a rodada 2 é Blur
  await ana.locator('#onAdvRevelar').click();
  await ana.locator('#onAdvRevelar').click();
  await expect(ana.locator('#onAdvProxima')).toHaveText('Próximo modo');
  await ana.locator('#onAdvProxima').click();
  for (const p of [ana, beto]) await expect(p.locator('#onAdvFranquia')).toHaveText(/^(LoL|Pokémon) · Blur$/);
  // com dois modos, uma rodada passa pelos dois: ainda é a rodada 1, no segundo modo
  for (const p of [ana, beto]) await expect(p.locator('#onAdvRodada')).toContainText('Rodada 1 de 5 · modo 2 de 2');
  await expect(beto.locator('#onAdv .adv-quadro, #onAdv [data-modo="blur"]').first()).toBeVisible();
});
