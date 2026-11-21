// Aba Adivinha, sozinho: desafio do dia em percurso (Clássico → Imagem → Blur → Emoji, determinístico pela data em
// Brasília), etapas opcionais, próxima franquia, livre (submodo solto e "Todos"), autocompletar, pistas, legenda,
// estatísticas em pdx-adivinha-v1 (com a migração do formato antigo) e os filtros (Pokémon só espécies).
import { test, expect, type Page } from '@playwright/test';
import { abrir, fixture, lerStorage, pokemonDeVariasGeracoes, prepare, type MockOpts } from './helpers';
import { indiceDoDia } from '../src/adivinha/dia';

test.use({ reducedMotion: 'reduce' });

// 21/11/2026, 15:30 em Brasília: faltam 8h30 pro próximo desafio
const AGORA = new Date('2026-11-21T15:30:00-03:00');
const HOJE = '2026-11-21';
type Info = Record<string, string | number | string[]>;
const LOL = fixture<{ itens: Record<string, Info> }>('adivinha-catalogo-lol.json').itens;
const porNome = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const NOMES_LOL = Object.keys(LOL).sort(porNome);
type Sub = 'classico' | 'imagem' | 'blur' | 'emoji';
const doDia = (sub: Sub) => NOMES_LOL[indiceDoDia(HOJE, 'lol', sub, NOMES_LOL.length)]!;
const errados = (sub: Sub) => NOMES_LOL.filter(n => n !== doDia(sub));

async function inicio(page: Page, opts: MockOpts & { seed?: number; storage?: Record<string, unknown>; rotas?: (p: Page) => Promise<void> } = {}, path = './?aba=adivinha') {
  await page.clock.setFixedTime(AGORA);
  await prepare(page, { adivinha: true, ...opts });
  // rotas próprias do teste: depois das de helpers.ts, pra valerem antes delas
  await opts.rotas?.(page);
  await abrir(page, path);
  await expect(page.locator('#adivinha')).toBeVisible();
}
const chip = (page: Page, g: string) => page.locator(`#advGrupos [data-grupo="${g}"]`);
const sub = (page: Page, s: Sub | 'todos') => page.locator(`#advSubmodo button[data-n="${s}"]`);
const rodada = (page: Page, r: 'dia' | 'livre') => page.locator(`#advRodada button[data-n="${r}"]`);
const etapa = (page: Page, s: Sub) => page.locator(`#advPercurso li[data-etapa="${s}"]`);
const tg = (page: Page, s: Sub) => page.locator(`#advEtapas [data-etapa="${s}"]`);
const sugestoes = async (page: Page) => (await page.locator('#advChuteLista li .nm').allTextContents()).map(s => s.trim());
/** Digita e escolhe a primeira sugestão com Enter. */
async function chutar(page: Page, nome: string) {
  await page.locator('#advChute').fill(nome);
  await expect(page.locator('#advChuteLista li').first()).toHaveAttribute('data-nome', nome);
  await page.locator('#advChute').press('Enter');
}
const linhas = (page: Page) => page.locator('#advTabela tbody tr');
/** Desafio de hoje já resolvido de uma etapa (pra montar o localStorage). */
const feito = (alvo: string) => ({ data: HOJE, alvo, chutes: [alvo], acertou: true });

test.describe('Adivinha sozinho', () => {
  test('link direto; Clássico do dia: autocompletar, pistas com seta grande, legenda, acertar e o mesmo desafio depois de recarregar', async ({ page }) => {
    await inicio(page);
    await expect(page.locator('nav button.on')).toHaveText('Adivinha');
    await expect(chip(page, 'lol')).toHaveAttribute('aria-checked', 'true');
    await expect(rodada(page, 'dia')).toHaveAttribute('aria-checked', 'true');
    // no dia não se escolhe submodo solto: é o percurso
    await expect(page.locator('#advSubmodo')).toHaveCount(0);
    await expect(page.locator('#advPercurso li')).toHaveCount(4);
    await expect(etapa(page, 'classico')).toHaveAttribute('data-estado', 'atual');
    for (const s of ['imagem', 'blur', 'emoji'] as const) {
      await expect(etapa(page, s)).toHaveAttribute('data-estado', 'trancada');
      await expect(etapa(page, s).locator('button')).toBeDisabled();
    }
    await expect(page.locator('#advEtapa')).toHaveText('Etapa 1 de 4: Clássico');
    await expect(page.locator('#advTitulo')).toHaveText('Desafio do dia');
    await expect(page.locator('#advChute')).toBeFocused();
    // legenda no estilo de quadrados com o nome embaixo
    await expect(page.locator('#advLegenda .item small')).toHaveText(['Correto', 'Parcial', 'Incorreto', 'Mais alto', 'Mais baixo', 'Sem informação']);
    await expect(page.locator('#advLegenda .item').nth(3).locator('svg.adv-seta')).toHaveCount(1);

    // autocompletar: sem diferenciar maiúscula, começa-com primeiro, com miniatura
    await page.locator('#advChute').fill('AK');
    expect(await sugestoes(page)).toEqual(['Akali', 'Akshan']);
    await expect(page.locator('#advChuteLista li').first().locator('.adv-th img')).toHaveCount(1);
    await page.locator('#advChute').fill('sol');
    expect(await sugestoes(page)).toEqual(['Aurelion Sol']);
    await page.locator('#advChute').fill('xyz');
    await expect(page.locator('#advChuteNada')).toBeVisible();

    const alvo = doDia('classico');
    const [e1, e2] = errados('classico');
    await chutar(page, e1!);
    await expect(linhas(page)).toHaveCount(1);
    await expect(linhas(page).first().locator('td.adv-c')).toHaveCount(7);
    await expect(page.locator('#advTabela thead th')).toHaveText(['Personagem', 'Classe', 'Região', 'Alcance', 'Dano', 'Recurso', 'Lançamento', 'Gênero']);
    // número diferente: seta grande (atrás do valor) pra onde está o secreto
    const dif = (n: string) => LOL[n]!.ano as number;
    const celDif = linhas(page).first().locator('td').nth(6);
    if (dif(e1!) === dif(alvo)) await expect(celDif).toHaveAttribute('data-cor', 'certo');
    else {
      await expect(celDif).toHaveAttribute('data-seta', dif(e1!) < dif(alvo) ? 'cima' : 'baixo');
      await expect(celDif.locator('svg.adv-seta')).toHaveCount(1);
      await expect(celDif.locator('.adv-v')).toHaveText(String(dif(e1!)));
    }
    // quem já foi chutado sai do autocompletar
    await page.locator('#advChute').fill(e1!);
    expect(await sugestoes(page)).not.toContain(e1);
    await chutar(page, e2!);
    await chutar(page, alvo);
    await expect(linhas(page)).toHaveCount(3);
    await expect(linhas(page).first()).toHaveClass(/certo/);
    await expect(linhas(page).first().locator('td.adv-c[data-cor="certo"]')).toHaveCount(7);
    await expect(page.locator('#advFim h3')).toHaveText('Acertou em 3 chutes!');
    await expect(page.locator('#advFim .card .name')).toHaveText(alvo);
    await expect(page.locator('#advProximaEtapa')).toHaveText('Próxima etapa: Imagem');
    await expect(etapa(page, 'classico')).toHaveAttribute('data-estado', 'feita');
    await expect(etapa(page, 'imagem')).toHaveAttribute('data-estado', 'atual');
    await expect(page.locator('#advStatsEtapa')).toHaveText('Clássico: média de 3 chutes por desafio.');
    // o dia só conta no fim do percurso
    await expect(page.locator('#advStats [data-n="jogos"]')).toHaveText('0');

    const salvo = await lerStorage<{ v: number; dia: Record<string, unknown>; stats: Record<string, unknown> }>(page, 'pdx-adivinha-v1');
    expect(salvo!.v).toBe(2);
    expect(salvo!.dia).toEqual({ 'lol:classico': { data: HOJE, alvo, chutes: [e1, e2, alvo], acertou: true } });
    expect(salvo!.stats).toEqual({ 'lol:classico': { jogos: 1, chutes: 3, seq: 1, melhor: 1, ultimo: HOJE } });
    // o Adivinha não mexe no placar
    expect(await lerStorage(page, 'pdx-stats')).toBeNull();

    // recarregar: o Clássico continua feito e o percurso abre na Imagem
    await page.reload();
    await expect(page.locator('#status')).not.toContainText('carregando', { timeout: 15000 });
    await expect(page.locator('#advEtapa')).toHaveText('Etapa 2 de 4: Imagem');
    await etapa(page, 'classico').locator('button').click();
    await expect(page.locator('#advFim h3')).toHaveText('Acertou em 3 chutes!');
    await expect(linhas(page)).toHaveCount(3);
  });

  test('percurso do dia de ponta a ponta: Clássico → Imagem → Blur → Emoji, e a próxima franquia (pulando a já feita)', async ({ page }) => {
    // Overwatch já fez o percurso hoje (sem emojis nos testes: são 3 etapas)
    const ow = Object.keys(fixture<{ itens: Record<string, Info> }>('catalogo-overwatch.json').itens).sort(porNome);
    const owDia = (s: Sub) => ow[indiceDoDia(HOJE, 'overwatch', s, ow.length)]!;
    await inicio(page, { storage: { 'pdx-adivinha-v1': { v: 2, dia: { 'overwatch:classico': feito(owDia('classico')), 'overwatch:imagem': feito(owDia('imagem')), 'overwatch:blur': feito(owDia('blur')) }, stats: {}, cfg: null } } });
    const passos: [Sub, string][] = [['classico', 'Imagem'], ['imagem', 'Blur'], ['blur', 'Emoji'], ['emoji', '']];
    for (const [i, [s, prox]] of passos.entries()) {
      await expect(page.locator('#advEtapa')).toHaveText(`Etapa ${i + 1} de 4: ${['Clássico', 'Imagem', 'Blur', 'Emoji'][i]}`);
      await expect(page.locator('#advJogo')).toHaveAttribute('data-submodo', s);
      if (s === 'imagem' || s === 'blur') await expect(page.locator('#advImagem')).toHaveAttribute('data-modo', s);
      if (s === 'emoji') await expect(page.locator('#advEmoji .vis')).toHaveCount(1);
      await chutar(page, errados(s)[0]!);
      await chutar(page, doDia(s));
      await expect(page.locator('#advFim h3')).toHaveText('Acertou em 2 chutes!');
      if (prox) {
        await expect(page.locator('#advPercursoFeito')).toHaveCount(0);
        await page.locator('#advProximaEtapa').click();
      }
    }
    await expect(page.locator('#advProximaEtapa')).toHaveCount(0);
    await expect(page.locator('#advPercursoFeito')).toHaveText('Percurso de LoL concluído: 8 chutes em 4 etapas.');
    await expect(page.locator('#advRelogio')).toHaveText('08:30:00');
    await expect(page.locator('#advPercurso li[data-estado="feita"]')).toHaveCount(4);
    await expect(page.locator('#advStats [data-n="seq"]')).toHaveText('1');
    await expect(page.locator('#advStats [data-n="jogos"]')).toHaveText('1');
    await expect(page.locator('#advStats [data-n="media"]')).toHaveText('8');
    expect((await lerStorage<{ stats: Record<string, unknown> }>(page, 'pdx-adivinha-v1'))!.stats['lol:percurso']).toEqual({ jogos: 1, chutes: 8, seq: 1, melhor: 1, ultimo: HOJE });
    // Overwatch já está feito: a próxima é Deadlock
    await expect(page.locator('#advProximaFranquia')).toHaveText('Próxima franquia: Deadlock');
    await page.locator('#advProximaFranquia').click();
    await expect(chip(page, 'deadlock')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#advEtapa')).toHaveText('Etapa 1 de 3: Clássico');
    await expect(page.locator('#advFora')).toContainText('Emoji (sem emojis de Deadlock)');
  });

  test('etapas opcionais: sem o Blur, o percurso tem 3 etapas e o dia conta quando elas terminam; com tudo feito, o resumo do dia', async ({ page }) => {
    // as outras franquias já fizeram Clássico e Imagem hoje (nos testes só o LoL tem emojis)
    const dia: Record<string, unknown> = {};
    for (const g of ['overwatch', 'deadlock', 'pokemon', 'jojo', 'megaten']) for (const s of ['classico', 'imagem']) dia[`${g}:${s}`] = feito('Alguém');
    await inicio(page, { storage: { 'pdx-adivinha-v1': { v: 2, dia, stats: {}, cfg: null } } });
    await expect(page.locator('#advPercurso li')).toHaveCount(4);
    await expect(page.locator('#advFora')).toHaveCount(0);
    await tg(page, 'blur').click();
    await expect(tg(page, 'blur')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#advPercurso li')).toHaveCount(3);
    await expect(page.locator('#advFora')).toHaveText('Fora do percurso: Blur (desligado). O dia conta quando as etapas ligadas terminam.');
    expect((await lerStorage<{ etapas: string[] }>(page, 'pdx-adivinha-v1'))!.etapas).toEqual(['classico', 'imagem', 'emoji']);
    // a última ligada não desliga
    await tg(page, 'imagem').click();
    await tg(page, 'emoji').click();
    await expect(tg(page, 'classico')).toBeDisabled();
    await expect(page.locator('#advPercurso li')).toHaveCount(1);
    await tg(page, 'imagem').click();
    await tg(page, 'emoji').click();
    await expect(page.locator('#advPercurso li')).toHaveCount(3);
    for (const s of ['classico', 'imagem', 'emoji'] as const) {
      await chutar(page, doDia(s));
      if (s !== 'emoji') await page.locator('#advProximaEtapa').click();
    }
    await expect(page.locator('#advPercursoFeito')).toHaveText('Percurso de LoL concluído: 3 chutes em 3 etapas.');
    // as outras já terminaram (sem Blur e sem Emoji): resumo do dia, sem "Próxima franquia"
    await expect(page.locator('#advResumoDia')).toBeVisible();
    await expect(page.locator('#advResumoDia li')).toHaveCount(6);
    await expect(page.locator('#advResumoDia li[data-grupo="lol"]')).toContainText('3 chutes em 3 etapas');
    await expect(page.locator('#advProximaFranquia')).toHaveCount(0);
    await expect(page.locator('#advRelogio')).toHaveText('08:30:00');
  });

  test('livre: submodo solto e "Todos" (Clássico → Imagem → Blur → Emoji, recomeça o ciclo, próxima franquia)', async ({ page }) => {
    await inicio(page);
    await rodada(page, 'livre').click();
    await expect(page.locator('#advSubmodo button')).toHaveText(['Clássico', 'Imagem', 'Blur', 'Emoji', 'Todos']);
    await expect(page.locator('#advEtapas')).toHaveCount(0);
    await sub(page, 'blur').click();
    await expect(page.locator('#advTitulo')).toHaveText('Livre');
    await expect(page.locator('#advImagem')).toHaveAttribute('data-modo', 'blur');
    await page.locator('#advDesistir').click();
    await expect(page.locator('#advFim h3')).toHaveText('Era este personagem:');
    await expect(page.locator('#advProximo')).toBeVisible();

    await sub(page, 'todos').click();
    await expect(page.locator('#advTitulo')).toHaveText('Livre · Todos');
    await expect(page.locator('#advEtapas')).toBeVisible();
    const vistos: string[] = [];
    for (const [i, s] of (['classico', 'imagem', 'blur', 'emoji'] as const).entries()) {
      await expect(page.locator('#advJogo')).toHaveAttribute('data-submodo', s);
      await expect(page.locator('#advEtapa')).toHaveText(`Etapa ${i + 1} de 4: ${['Clássico', 'Imagem', 'Blur', 'Emoji'][i]}`);
      await page.locator('#advDesistir').click();
      vistos.push((await page.locator('#advFim .card .name').textContent())!.trim());
      if (s !== 'emoji') await page.locator('#advProximaEtapa').click();
    }
    await expect(page.locator('#advCicloFeito')).toHaveText('Ciclo completo!');
    await expect(page.locator('#advProximaFranquia')).toHaveText('Próxima franquia: Overwatch');
    await page.locator('#advRecomecar').click();
    await expect(page.locator('#advJogo')).toHaveAttribute('data-submodo', 'classico');
    await expect(page.locator('#advChute')).toBeVisible();
    // desligar o Blur tira ele do ciclo
    await tg(page, 'blur').click();
    await expect(page.locator('#advPercurso li')).toHaveCount(3);
    await page.locator('#advDesistir').click();
    await page.locator('#advProximaEtapa').click();
    await page.locator('#advDesistir').click();
    await expect(page.locator('#advProximaEtapa')).toHaveText('Próxima etapa: Emoji');
    await page.locator('#advProximaEtapa').click();
    await page.locator('#advDesistir').click();
    await page.locator('#advProximaFranquia').click();
    await expect(chip(page, 'overwatch')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#advJogo')).toHaveAttribute('data-submodo', 'classico');
    expect(vistos).toHaveLength(4);
  });

  test('Imagem (recorte nítido que abre aos poucos) e Blur (zoom desfocado, 10 passos até a imagem limpa)', async ({ page }) => {
    await inicio(page);
    await rodada(page, 'livre').click();
    await sub(page, 'imagem').click();
    const img = page.locator('#advImagem img');
    await expect(page.locator('#advImagem')).toHaveAttribute('data-modo', 'imagem');
    await expect(page.locator('#advImagem')).toHaveAttribute('data-nivel', '0');
    await expect(page.locator('#advImagem')).toHaveAttribute('data-total', '10');
    await expect(page.locator('#advImagem')).toHaveAttribute('data-escala', '5');
    await expect(img).toHaveAttribute('style', /width: 500%/);
    await expect(img).toHaveAttribute('style', /filter: none/);
    await expect(img).toHaveAttribute('alt', '');
    let feitos = 0;
    for (const n of NOMES_LOL) {
      if (feitos === 3) break;
      await page.locator('#advChute').fill(n);
      await expect(page.locator('#advChuteLista li').first()).toHaveAttribute('data-nome', n);
      await page.locator('#advChute').press('Enter');
      if (await page.locator('#advFim').count()) break;
      feitos++;
      await expect(page.locator('#advImagem')).toHaveAttribute('data-nivel', String(feitos));
    }
    if (feitos === 3) {
      await expect(page.locator('#advImagem')).toHaveAttribute('data-escala', '3.35');
      await expect(page.locator('#advErrados li')).toHaveCount(3);
    }

    await sub(page, 'blur').click();
    await expect(page.locator('#advImagem')).toHaveAttribute('data-modo', 'blur');
    await expect(page.locator('#advImagem')).toHaveAttribute('data-escala', '6');
    await expect(img).toHaveAttribute('style', /blur\(/);
    await page.locator('#advDesistir').click();
    await expect(page.locator('#advImagem')).toHaveAttribute('data-escala', '1');
    await expect(img).toHaveAttribute('style', /width: 100%/);
    await expect(img).toHaveAttribute('style', /filter: none/);
  });

  test('Emoji: 1 emoji no começo e mais 1 a cada erro; franquia sem arquivo de emojis fica fora (livre: aviso)', async ({ page }) => {
    await inicio(page);
    await rodada(page, 'livre').click();
    await sub(page, 'emoji').click();
    await expect(page.locator('#advEmoji .vis')).toHaveCount(1);
    const total = await page.locator('#advEmoji span').count();
    expect(total).toBeGreaterThanOrEqual(3);
    await page.locator('#advDesistir').click();
    await expect(page.locator('#advEmoji .vis')).toHaveCount(total);
    await chip(page, 'deadlock').click();
    await expect(page.locator('#advAviso')).toContainText('Deadlock ainda não tem os emojis prontos');
    await sub(page, 'classico').click();
    await page.locator('#advChute').fill('inf');
    expect(await sugestoes(page)).toEqual(['Infernus']);
  });

  test('Pokémon só com as espécies (em todos os modos), 9 colunas sem rolagem na página; SMT + Persona juntos', async ({ page }) => {
    await inicio(page, { pokemonFormas: true });
    await expect(page.locator('#status')).toContainText('Pokémon: 47');
    await chip(page, 'pokemon').click();
    await page.locator('#advChute').fill('char');
    expect(await sugestoes(page)).toEqual(['Charizard', 'Charmander', 'Charmeleon']);
    await page.locator('#advChute').fill('raichu');
    expect(await sugestoes(page)).toEqual(['Raichu']);
    await page.locator('#advChute').fill('pikachu');
    await page.locator('#advChute').press('Enter');
    await expect(page.locator('#advTabela thead th')).toHaveText(['Personagem', 'Tipo 1', 'Tipo 2', 'Geração', 'Estágio', 'Cor', 'Forma', 'Habitat', 'Altura', 'Peso']);
    const cel = linhas(page).last().locator('td');
    await expect(cel.nth(2).locator('.adv-v')).toHaveText('Nenhum');
    await expect(cel.nth(8).locator('.adv-v')).toHaveText('0,4 m');
    await expect(cel.nth(9).locator('.adv-v')).toHaveText('6 kg');
    // a tabela cabe (ou rola sozinha): a página não rola de lado
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await rodada(page, 'livre').click();
    await sub(page, 'imagem').click();
    await page.locator('#advChute').fill('mega');
    await expect(page.locator('#advChuteNada')).toBeVisible();
    await page.locator('#advChute').fill('Gigantamax');
    await expect(page.locator('#advChuteNada')).toBeVisible();

    await sub(page, 'classico').click();
    await chip(page, 'megaten').click();
    await page.locator('#advChute').fill('jack fr');
    await expect(page.locator('#advChuteLista li').first()).toHaveAttribute('data-nome', 'Jack Frost');
    await expect(page.locator('#advChuteLista li').first().locator('.fr')).toHaveText('SMT');
    await page.locator('#advChute').fill('arsen');
    await expect(page.locator('#advChuteLista li').first().locator('.fr')).toHaveText('Persona');
    await page.locator('#advChute').press('Enter');
    await expect(page.locator('#advTabela thead th')).toHaveText(['Personagem', 'Raça', 'Arcana', 'Mitologia', 'Nível', 'Fraqueza', 'Resiste', 'Atributo mais forte']);
    await expect(linhas(page).first().locator('td').nth(1)).toContainText('Persona');
  });

  test('salvo antigo: o "Imagem" de antes vira o Blur e a sequência de dias continua no percurso', async ({ page }) => {
    await inicio(page, { storage: { 'pdx-adivinha-v1': {
      dia: { 'lol:imagem': { data: '2026-11-20', alvo: 'Ahri', chutes: ['Ahri'], acertou: true } },
      stats: { 'lol:imagem': { jogos: 6, chutes: 18, seq: 3, melhor: 5, ultimo: '2026-11-20' } },
      cfg: { grupo: 'lol', submodo: 'imagem', rodada: 'dia' },
    } } });
    await expect(page.locator('#advStats [data-n="seq"]')).toHaveText('3');
    await expect(page.locator('#advStats [data-n="melhor"]')).toHaveText('5');
    await rodada(page, 'livre').click();
    // a escolha antiga "imagem" era o desfoque: virou Blur
    await expect(sub(page, 'blur')).toHaveAttribute('aria-checked', 'true');
    const s = await lerStorage<{ v: number; stats: Record<string, unknown> }>(page, 'pdx-adivinha-v1');
    expect(s!.v).toBe(2);
    expect(s!.stats['lol:blur']).toEqual({ jogos: 6, chutes: 18, seq: 3, melhor: 5, ultimo: '2026-11-20' });
    expect(s!.stats['lol:imagem']).toBeUndefined();
  });

  test('recorte no livre: Pokémon só com a geração II (secreto e sugestões respeitam); o dia continua com tudo', async ({ page }) => {
    await inicio(page, { rotas: pokemonDeVariasGeracoes });
    await chip(page, 'pokemon').click();
    // no dia: chips desligados, com o motivo; o autocompletar tem a franquia inteira
    await expect(page.locator('#advRecorte [data-valor]')).toHaveCount(9);
    await expect(page.locator('#advRecorte [data-valor="I"]')).toBeDisabled();
    await expect(page.locator('#advRecorteNota')).toContainText('No desafio do dia entra Pokémon inteiro');
    await page.locator('#advChute').fill('bul');
    expect(await sugestoes(page)).toEqual(['Bulbasaur']);
    await page.locator('#advChute').fill('');

    await rodada(page, 'livre').click();
    await expect(page.locator('#advRecorteNota')).toHaveCount(0);
    await expect(page.locator('#advRecorteN')).toHaveText('10 personagens entram');
    for (const g of ['I', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']) await page.locator(`#advRecorte [data-valor="${g}"]`).click();
    await expect(page.locator('#advRecorteN')).toHaveText('4 personagens entram');
    // a última ligada não desliga
    await page.locator('#advRecorte [data-valor="IX"]').click();
    await expect(page.locator('#advRecorte [data-valor="II"]')).toBeDisabled();
    await expect(page.locator('#advRecorte [data-valor="II"]')).toHaveAttribute('aria-pressed', 'true');
    expect((await lerStorage<{ recortes: Record<string, string[]> }>(page, 'pdx-adivinha-v1'))!.recortes).toEqual({ pokemon: ['II'] });
    // sugestões só da geração II
    await page.locator('#advChute').fill('bul');
    await expect(page.locator('#advChuteNada')).toBeVisible();
    await page.locator('#advChute').fill('to');
    expect(await sugestoes(page)).toEqual(['Togepi', 'Totodile']);
    await page.locator('#advChute').fill('');
    // o secreto é sempre da geração II
    for (let i = 0; i < 4; i++) {
      await page.locator('#advDesistir').click();
      const nome = (await page.locator('#advFim .card .name').textContent())!.trim();
      expect(GERACAO_II).toContain(nome);
      await page.locator('#advProximo').click();
    }
    // "Todas" volta ao padrão e recomeça com personagem novo
    await page.locator('#advRecorteTodas').click();
    await expect(page.locator('#advRecorteN')).toHaveText('10 personagens entram');
    await expect(page.locator('#advChute')).toBeVisible();
  });

  test('recorte no livre: JoJo só com a Parte 4 (vale no "Todos" também)', async ({ page }) => {
    await inicio(page, { storage: { 'pdx-adivinha-v1': { v: 2, dia: {}, stats: {}, cfg: { grupo: 'jojo', submodo: 'todos', rodada: 'livre' }, recortes: { jojo: ['Part 4'] } } } });
    await expect(page.locator('#advRecorte [data-valor] .rt')).toHaveText(['Parte 3', 'Parte 4', 'Parte 5', 'Parte 6', 'Parte 7', 'Parte 8', 'Parte 9', 'Kishibe Rohan']);
    await expect(page.locator('#advRecorte [data-valor="Part 4"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#advRecorte [data-valor="Part 3"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#advRecorteN')).toHaveText(`${PARTE_4.length} personagens entram`);
    await page.locator('#advChute').fill('gold');
    await expect(page.locator('#advChuteNada')).toBeVisible();
    await page.locator('#advChute').fill('echo');
    expect(await sugestoes(page)).toEqual(['Echoes']);
    await page.locator('#advChute').fill('');
    // sem emojis de JoJo nos testes: o ciclo é Clássico, Imagem e Blur
    for (const s of ['classico', 'imagem', 'blur'] as const) {
      await expect(page.locator('#advJogo')).toHaveAttribute('data-submodo', s);
      await page.locator('#advDesistir').click();
      expect(PARTE_4).toContain((await page.locator('#advFim .card .name').textContent())!.trim());
      if (s !== 'blur') await page.locator('#advProximaEtapa').click();
    }
    await expect(page.locator('#advCicloFeito')).toBeVisible();
  });

  test('skins no Imagem do LoL: a arte é a splash de uma skin do campeão, e o nome dela aparece no fim', async ({ page }) => {
    await inicio(page, { skins: true });
    await rodada(page, 'livre').click();
    await sub(page, 'imagem').click();
    const img = page.locator('#advImagem img');
    await expect(img).toHaveAttribute('src', /ddragon\.leagueoflegends\.com\/cdn\/img\/champion\/splash\/[\w.]+_\d+\.jpg$/);
    await expect(page.locator('#advSkin')).toHaveCount(0);
    // no Blur e no Clássico nada muda: a arte padrão do site
    await sub(page, 'blur').click();
    await expect(img).not.toHaveAttribute('src', /champion\/splash/);
    await sub(page, 'imagem').click();
    await page.getByRole('button', { name: 'Desistir e ver quem era' }).click();
    await expect(page.locator('#advSkin')).toHaveText(/^Skin: .+/);
  });

  test('sem arquivo de skins, o Imagem do LoL usa a arte padrão', async ({ page }) => {
    await inicio(page);
    await rodada(page, 'livre').click();
    await sub(page, 'imagem').click();
    await expect(page.locator('#advImagem img')).not.toHaveAttribute('src', /champion\/splash/);
  });
});

const GERACAO_II = ['Chikorita', 'Cyndaquil', 'Totodile', 'Togepi'];
const JOJO_FIX = fixture<{ itens: Record<string, Info> }>('catalogo-jojo.json').itens;
const PARTE_4 = Object.keys(JOJO_FIX).filter(n => [JOJO_FIX[n]!.parte ?? []].flat().includes('Part 4'));
