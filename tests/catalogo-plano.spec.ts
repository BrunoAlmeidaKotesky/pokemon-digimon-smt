// Aba Catálogo, planejamento do Set 1: grupo "Set 1 (base)" (public/catalogo/set1-base.json, aqui a fixture
// catalogo-set1-base.json), classes de cada personagem, habilidade, linhas evolutivas, subaba Classes, filtros de
// classe e de linha, e o planejamento no set1.json exportado e importado. Tudo salvo em pdx-set1-plano.
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { prepare, abrir, aba, fixture, lerStorage, type MockOpts } from './helpers';

test.use({ reducedMotion: 'reduce' });

interface Classe { id: string; nome: string; descricao?: string }
interface LinhaEvo { id: string; nome: string; niveis: string[][]; confirmada?: boolean }
interface Plano {
  versao: 1;
  classes?: Classe[];
  unidades: Record<string, Record<string, { classes?: string[]; habilidade?: string }>>;
  linhas: Record<string, LinhaEvo[]>;
}
const BASE = fixture<{ classes: Classe[]; linhas: { pokemon: LinhaEvo[] } }>('catalogo-set1-base.json');
/** o grupo base do Pokémon que está na lista do site (a fixture tem também "Fora da Lista"), na ordem da lista */
const BASE_POKEMON = ['Bulbasaur', 'Ivysaur', 'Venusaur', 'Charmander', 'Charmeleon', 'Charizard', 'Squirtle', 'Wartortle', 'Pikachu', 'Raichu', 'Clefairy', 'Clefable'];

const linha = (page: Page, nome: string) => page.locator(`#catList .cat-row[data-nome="${nome}"]`);
const chip = (page: Page, k: string) => page.locator(`#catFr .cat-fr[data-fr="${k}"]`);
const nomes = async (page: Page) => (await page.locator('#catList .cat-row .nm').allTextContents()).map(s => s.trim());
const plano = (page: Page) => lerStorage<Plano>(page, 'pdx-set1-plano');
const grupo = (page: Page, g: 'base' | 'marcados' | 'todos') => page.locator(`#catGrupo button[data-n="${g}"]`);
const vista = (page: Page, v: 'personagens' | 'linhas') => page.locator(`#catVista button[data-n="${v}"]`);
const carta = (page: Page, id: string) => page.locator(`#catLinhas .lin-card[data-id="${id}"]`);
const opcoes = (page: Page, sel: string) => page.locator(`${sel} option`).allTextContents();
/** Os níveis da linha como aparecem na carta: [[nomes do nível 1], [nível 2], ...] */
const niveis = (page: Page, id: string) => carta(page, id).locator('.lin-nivel').evaluateAll(els =>
  els.map(e => [...e.querySelectorAll('.lin-membro')].map(b => b.getAttribute('data-nome'))));
const semRolagemLateral = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

/** Abre o site com tudo carregado e vai pra aba Catálogo (com a base, a não ser que peça semBase). */
async function inicio(page: Page, opts: MockOpts & { storage?: Record<string, unknown> } = {}) {
  const calls = await prepare(page, opts);
  await abrir(page);
  await aba(page, 'Catálogo');
  await expect(page.locator('#catList .cat-row').first()).toBeVisible();
  return calls;
}

test.describe('planejamento do Set 1 no Catálogo', () => {
  test('o grupo "Set 1 (base)" é o padrão: lista e subabas contam o grupo; Marcados e Todos; franquia sem ninguém no grupo', async ({ page }) => {
    const calls = await inicio(page, { storage: { 'pdx-set1': { pokemon: ['Pikachu', 'Rattata'] } } });
    expect(calls['set1-base']).toBe(1);
    await expect(page.locator('#catGrupo button')).toHaveText(['Set 1 (base) · 13', 'Marcados · 2', 'Todos · 40']);
    await expect(grupo(page, 'base')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#catCount')).toHaveText('12 de 40');
    expect(await nomes(page)).toEqual(BASE_POKEMON);
    await expect(page.locator('#catFora')).toHaveText('Do Set 1 (base) que não estão na lista de Pokémon: Fora da Lista.');
    // as subabas contam o grupo base; a franquia que o site não tem (franquia-futura) e a chave "itens" são ignoradas
    await expect(page.locator('#catFr .cat-fr')).toHaveText([
      'Pokémon · 13', 'Digimon · 0', 'SMT · 0', 'Persona · 4', 'JoJo · 0', 'Yu-Gi-Oh! · 0', 'Bakugan · 2', 'LoL · 2', 'Overwatch · 0',
      'Deadlock · 0', 'Final Fantasy · 0', 'Sujimon · 0',
    ]);
    await expect(page.locator('#catAbaClasses')).toHaveText('Classes · 3');

    // Marcados: as marcações de sempre (as subabas voltam a contar os marcados)
    await grupo(page, 'marcados').click();
    expect(await nomes(page)).toEqual(['Rattata', 'Pikachu']);
    await expect(chip(page, 'pokemon')).toHaveText('Pokémon · 2');
    await grupo(page, 'todos').click();
    await expect(page.locator('#catCount')).toHaveText('40 de 40');
    await expect(page.locator('#catFora')).toHaveCount(0);

    // o grupo vale pra todas as franquias
    await grupo(page, 'base').click();
    await chip(page, 'bakugan').click();
    expect((await nomes(page)).sort()).toEqual(['Drago', 'Gorem']);
    await chip(page, 'smt').click();
    await expect(page.locator('#catVazio')).toHaveText('Ninguém de SMT no Set 1 (base). Ver todos');
    await page.locator('#catVerTodos').click();
    await expect(grupo(page, 'todos')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#catCount')).toHaveText('297 de 297');
  });

  test('classes: dar e tirar pelo seletor do personagem; salvo em pdx-set1-plano; filtro de classe; a busca acha pela classe', async ({ page }) => {
    await inicio(page);
    const cz = linha(page, 'Charizard');
    await expect(cz.locator('.cls-chip')).toHaveCount(0);
    await expect(cz.locator('.cls-add')).toHaveText('+ Classe');
    await cz.locator('.cls-add').click();
    await expect(cz.locator('.cls-add')).toHaveAttribute('aria-expanded', 'true');
    await expect(cz.locator('.cls-opt')).toHaveText(['Dragão', 'Fadinhas', 'Atirador']);
    await cz.locator('.cls-opt[data-classe="dragao"]').click();
    await expect(cz.locator('.cls-opt[data-classe="dragao"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(cz.locator('.cls-chip')).toHaveText(['Dragão×']);
    await cz.locator('.cls-add').click();
    await expect(cz.locator('.cls-opts')).toHaveCount(0);
    await expect(cz.locator('.cls-add')).toHaveText('Classes');

    for (const n of ['Clefairy', 'Clefable']) {
      await linha(page, n).locator('.cls-add').click();
      await linha(page, n).locator('.cls-opt[data-classe="fadinhas"]').click();
    }
    await linha(page, 'Clefable').locator('.cls-opt[data-classe="dragao"]').click();
    // ordem da lista de classes, não a do clique
    await expect(linha(page, 'Clefable').locator('.cls-chip')).toHaveText(['Dragão×', 'Fadinhas×']);
    expect(await plano(page)).toEqual({
      versao: 1,
      unidades: { pokemon: { Charizard: { classes: ['dragao'] }, Clefairy: { classes: ['fadinhas'] }, Clefable: { classes: ['fadinhas', 'dragao'] } } },
      linhas: {},
    });
    // marcar é outra coisa: pdx-set1 nem existe
    expect(await lerStorage(page, 'pdx-set1')).toBeNull();

    expect(await opcoes(page, '#catClasse')).toEqual(['Todas', 'Dragão (2)', 'Fadinhas (2)', 'Atirador (0)', 'Sem classe (9)']);
    await page.selectOption('#catClasse', 'fadinhas');
    expect(await nomes(page)).toEqual(['Clefairy', 'Clefable']);
    // tirar pelo × do chip: sai da lista filtrada
    await linha(page, 'Clefairy').locator('.cls-chip[data-classe="fadinhas"] button').click();
    expect(await nomes(page)).toEqual(['Clefable']);
    await page.selectOption('#catClasse', '__sem__');
    await expect(page.locator('#catCount')).toHaveText('10 de 40');
    await page.selectOption('#catClasse', '');
    await page.fill('#catBusca', 'dragão');
    expect(await nomes(page)).toEqual(['Charizard', 'Clefable']);
  });

  test('habilidade: salva enquanto digita e ao sair do campo, continua depois de recarregar e entra na busca', async ({ page }) => {
    await inicio(page);
    const campo = linha(page, 'Pikachu').locator('textarea.cat-hab');
    await expect(campo).toHaveAttribute('aria-label', 'Habilidade de Pikachu');
    await campo.fill('Choque do trovão:\ndano em linha');
    await expect.poll(async () => (await plano(page))?.unidades.pokemon?.Pikachu).toEqual({ habilidade: 'Choque do trovão:\ndano em linha' });
    // sair do campo salva na hora
    const outro = linha(page, 'Raichu').locator('textarea.cat-hab');
    await outro.fill('Raio');
    await outro.blur();
    expect((await plano(page))!.unidades.pokemon!.Raichu).toEqual({ habilidade: 'Raio' });

    await page.reload();
    await expect(page.locator('#status')).not.toContainText('carregando', { timeout: 15000 });
    await aba(page, 'Catálogo');
    await expect(linha(page, 'Pikachu').locator('textarea.cat-hab')).toHaveValue('Choque do trovão:\ndano em linha');
    await expect(linha(page, 'Raichu').locator('textarea.cat-hab')).toHaveValue('Raio');
    await page.fill('#catBusca', 'trovao linha');
    expect(await nomes(page)).toEqual(['Pikachu']);
    await page.fill('#catBusca', '');
    // texto apagado = sem habilidade
    await linha(page, 'Raichu').locator('textarea.cat-hab').fill('');
    await expect.poll(async () => (await plano(page))?.unidades.pokemon?.Raichu).toBeUndefined();
  });

  test('selo da linha no personagem: nível, alternativas e ✓; leva até a linha na vista Linhas', async ({ page }) => {
    await inicio(page);
    await expect(linha(page, 'Charmeleon').locator('.lin-selo')).toHaveText('Linha Charmander · nível 2 de 3');
    await expect(linha(page, 'Clefairy').locator('.lin-selo')).toHaveCount(0);
    await expect(linha(page, 'Clefairy').locator('.lin-nova-row')).toHaveText('+ Linha');

    await linha(page, 'Charmeleon').locator('.lin-selo').click();
    await expect(vista(page, 'linhas')).toHaveAttribute('aria-checked', 'true');
    const c = carta(page, 'pokemon:charmander');
    await expect(c).toBeFocused();
    await expect(c).toBeInViewport();
    await c.locator('.lin-ok input').check();
    await vista(page, 'personagens').click();
    await expect(linha(page, 'Charmeleon').locator('.lin-selo')).toHaveText('Linha Charmander · nível 2 de 3 ✓');
    await expect(linha(page, 'Charmeleon').locator('.lin-selo')).toHaveClass(/\bok\b/);

    // alternativas (Persona: Orpheus ou Orpheus F no nível 1)
    await chip(page, 'persona').click();
    await expect(linha(page, 'Orpheus').locator('.lin-selo')).toHaveText('Linha Protagonista (P3) · nível 1 de 3 · ou Orpheus F');
    await expect(linha(page, 'Messiah').locator('.lin-selo')).toHaveText('Linha Protagonista (P3) · nível 2 de 3');
  });

  test('vista Linhas: progresso, confirmar, "só não confirmadas", adicionar, alternativa, mover, tirar; um personagem por linha', async ({ page }) => {
    await inicio(page);
    await expect(vista(page, 'linhas')).toHaveText('Linhas · 4');
    await vista(page, 'linhas').click();
    await expect(page.locator('#catLinhas .lin-card')).toHaveCount(4);
    await expect(page.locator('#catLinProg')).toHaveText('0 de 4 linhas confirmadas');
    expect(await niveis(page, 'pokemon:bulbasaur')).toEqual([['Bulbasaur'], ['Ivysaur'], ['Venusaur']]);
    await expect(carta(page, 'pokemon:bulbasaur').locator('.lin-membro .th img')).toHaveCount(3);

    await carta(page, 'pokemon:bulbasaur').locator('.lin-ok input').check();
    await expect(page.locator('#catLinProg')).toHaveText('1 de 4 linhas confirmadas');
    await expect(carta(page, 'pokemon:bulbasaur')).toHaveClass(/\bok\b/);
    await page.locator('#catSoPendentes').check();
    await expect(page.locator('#catLinhas .lin-card')).toHaveCount(3);
    await page.locator('#catSoPendentes').uncheck();
    await page.fill('#catLinBusca', 'wartortle');
    await expect(page.locator('#catLinhas .lin-card')).toHaveCount(1);
    await page.fill('#catLinBusca', '');

    // adicionar: busca na lista da franquia; Enter põe o primeiro, num nível novo no fim (o padrão)
    const sq = carta(page, 'pokemon:squirtle');
    await expect(sq.locator('.lin-busca')).toHaveCount(0);
    await sq.locator('.lin-add-btn').click();
    await expect(sq.locator('.lin-busca')).toBeFocused();
    await sq.locator('.lin-busca').fill('blast');
    await expect(sq.locator('.lin-res-it')).toHaveText(['Blastoise']);
    await sq.locator('.lin-busca').press('Enter');
    expect(await niveis(page, 'pokemon:squirtle')).toEqual([['Squirtle'], ['Wartortle'], ['Blastoise']]);
    await expect(sq.locator('.lin-busca')).toHaveValue('');
    await expect(sq.locator('.lin-busca')).toBeFocused();
    // num nível que já tem alguém: alternativa
    await sq.locator('.lin-destino').selectOption('1');
    await sq.locator('.lin-busca').fill('caterpie');
    await sq.locator('.lin-res-it').first().click();
    expect(await niveis(page, 'pokemon:squirtle')).toEqual([['Squirtle'], ['Wartortle', 'Caterpie'], ['Blastoise']]);
    await expect(sq.locator('.lin-nivel[data-nivel="2"] .lin-nl')).toHaveText('Nível 2 · alternativas');

    // mover: escolhe o membro, depois o destino
    const pk = carta(page, 'pokemon:pikachu');
    await pk.locator('.lin-membro[data-nome="Raichu"]').click();
    await expect(pk.locator('.lin-membro[data-nome="Raichu"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(pk.locator('.lin-acoes button[data-destino]')).toHaveText(['Nível 1 (alternativa)', 'Novo nível no começo', 'Novo nível no fim']);
    await pk.locator('.lin-acoes button[data-destino="1"]').click();
    expect(await niveis(page, 'pokemon:pikachu')).toEqual([['Pikachu', 'Raichu']]);
    await pk.locator('.lin-acoes button[data-destino="inicio"]').click();
    expect(await niveis(page, 'pokemon:pikachu')).toEqual([['Raichu'], ['Pikachu']]);
    await pk.locator('.lin-tirar').click();
    expect(await niveis(page, 'pokemon:pikachu')).toEqual([['Pikachu']]);
    await expect(pk.locator('.lin-acoes')).toHaveCount(0);

    // um personagem, uma linha: pôr o Charizard na linha do Pikachu tira ele da do Charmander
    await pk.locator('.lin-add-btn').click();
    await pk.locator('.lin-busca').fill('chari');
    await expect(pk.locator('.lin-res-it[data-nome="Charizard"] small')).toHaveText('no grupo · sai da linha Charmander');
    await pk.locator('.lin-res-it[data-nome="Charizard"]').click();
    expect(await niveis(page, 'pokemon:pikachu')).toEqual([['Pikachu'], ['Charizard']]);
    expect(await niveis(page, 'pokemon:charmander')).toEqual([['Charmander'], ['Charmeleon']]);

    // salvo: as linhas do Pokémon entraram no plano; as da Persona continuam seguindo a base
    const p = (await plano(page))!;
    expect(Object.keys(p.linhas)).toEqual(['pokemon']);
    expect(p.linhas.pokemon!.find(l => l.id === 'pokemon:bulbasaur')).toEqual({ ...BASE.linhas.pokemon[0], confirmada: true });
    expect(p.linhas.pokemon!.find(l => l.id === 'pokemon:squirtle')!.niveis).toEqual([['Squirtle'], ['Wartortle', 'Caterpie'], ['Blastoise']]);
  });

  test('nova linha a partir de um personagem, renomear e apagar; nova linha vazia; voltar pra base', async ({ page }) => {
    await inicio(page);
    await linha(page, 'Clefairy').locator('.lin-nova-row').click();
    await expect(vista(page, 'linhas')).toHaveAttribute('aria-checked', 'true');
    const c = carta(page, 'pokemon:clefairy');
    await expect(c.locator('.lin-nome')).toHaveText('Clefairy');
    // já no campo de adicionar o próximo
    await expect(c.locator('.lin-busca')).toBeFocused();
    await page.keyboard.type('clefable');
    await page.keyboard.press('Enter');
    expect(await niveis(page, 'pokemon:clefairy')).toEqual([['Clefairy'], ['Clefable']]);

    await c.locator('.lin-renomear').click();
    await expect(c.locator('.lin-nome-in')).toBeFocused();
    await c.locator('.lin-nome-in').fill('Fadas');
    await c.locator('.lin-nome-in').press('Enter');
    await expect(c.locator('.lin-nome')).toHaveText('Fadas');
    await vista(page, 'personagens').click();
    await expect(linha(page, 'Clefable').locator('.lin-selo')).toHaveText('Linha Fadas · nível 2 de 2');

    // linha vazia pelo botão da vista
    await vista(page, 'linhas').click();
    await expect(page.locator('#catLinProg')).toHaveText('0 de 5 linhas confirmadas');
    await page.locator('#catNovaLinha').click();
    const nova = carta(page, 'pokemon:nova-linha');
    await expect(nova.locator('.lin-vazia')).toHaveText('Linha vazia: adicione alguém abaixo.');
    await expect(nova.locator('.lin-busca')).toBeFocused();
    await expect(nova.locator('.lin-destino option')).toHaveText(['Nível 1']);
    // apagar pede confirmação
    await nova.locator('.lin-apagar').click();
    await expect(nova.locator('.lin-apagar')).toHaveText('Confirmar: apagar');
    await nova.locator('.lin-apagar').click();
    await expect(nova).toHaveCount(0);
    await expect(page.locator('#catLinhas .lin-card')).toHaveCount(5);

    // voltar pra base desfaz tudo (dois cliques)
    await page.locator('#catLinBase').click();
    await expect(page.locator('#catLinBase')).toHaveText('Confirmar: desfazer as mudanças');
    await page.locator('#catLinBase').click();
    await expect(page.locator('#catLinhas .lin-card')).toHaveCount(4);
    await expect(page.locator('#catLinBase')).toHaveCount(0);
    expect((await plano(page))!.linhas).toEqual({});
  });

  test('subaba Classes: quem recebeu cada classe; criar, reordenar, renomear, descrever e remover; ver na lista', async ({ page }) => {
    await inicio(page, {
      storage: {
        'pdx-set1-plano': {
          versao: 1,
          unidades: { pokemon: { Charizard: { classes: ['dragao'] }, Pikachu: { classes: ['atirador'], habilidade: 'Choque' } }, lol: { Jinx: { classes: ['atirador'] } } },
          linhas: {},
        },
      },
    });
    await page.locator('#catAbaClasses').click();
    await expect(page.locator('#catAbaClasses')).toHaveAttribute('aria-selected', 'true');
    await expect(chip(page, 'pokemon')).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#catClasses')).toBeVisible();
    const nomesClasses = () => page.locator('#catClasseLista .cls-nome').evaluateAll(els => els.map(e => (e as HTMLInputElement).value));
    expect(await nomesClasses()).toEqual(['Dragão', 'Fadinhas', 'Atirador']);

    const at = page.locator('.cls-card[data-classe="atirador"]');
    await expect(at.locator('.cls-n')).toHaveText('2 personagens');
    await expect(at.locator('.cls-fr .cls-fr-btn')).toHaveText(['Pokémon · 1', 'LoL · 1']);
    await expect(at.locator('.cls-fr[data-fr="lol"] li')).toHaveText(['Jinx']);
    await expect(at.locator('.cls-fr[data-fr="pokemon"] li .th img')).toHaveAttribute('src', /official-artwork\/25\.png$/);
    await expect(page.locator('.cls-card[data-classe="fadinhas"] .cls-ninguem')).toHaveText('Ninguém com esta classe ainda.');
    await expect(page.locator('.cls-card[data-classe="fadinhas"] .cls-desc')).toHaveValue('Fofas e mágicas');
    // quanto do grupo base já tem classe, e quem falta por franquia
    await expect(page.locator('#catSemClasse p')).toHaveText('3 de 21 do Set 1 (base) já têm classe. Sem classe ainda:');
    await expect(page.locator('#catSemClasse .cls-fr-btn')).toHaveText(['Pokémon · 11', 'Persona · 4', 'Bakugan · 2', 'LoL · 1']);

    // criar (Enter no campo); nome repetido não cria outra
    await page.fill('#catClasseNome', 'Robô');
    await page.locator('#catClasseNome').press('Enter');
    await expect(page.locator('#catClasseMsg')).toHaveText('Classe Robô criada.');
    await page.fill('#catClasseNome', 'robo');
    await page.locator('#catClasseAdd').click();
    await expect(page.locator('#catClasseMsg')).toHaveText('Já existe uma classe chamada robo.');
    expect(await nomesClasses()).toEqual(['Dragão', 'Fadinhas', 'Atirador', 'Robô']);
    await expect(page.locator('#catAbaClasses')).toHaveText('Classes · 4');
    await page.locator('.cls-card[data-classe="robo"] button[aria-label="Subir Robô"]').click();
    expect(await nomesClasses()).toEqual(['Dragão', 'Fadinhas', 'Robô', 'Atirador']);

    // renomear (Enter) e descrever (salva enquanto digita)
    const dr = page.locator('.cls-card[data-classe="dragao"]');
    await dr.locator('.cls-nome').fill('Dragões');
    await dr.locator('.cls-nome').press('Enter');
    await dr.locator('.cls-desc').fill('Voam e cospem fogo');
    await expect.poll(async () => (await plano(page))?.classes?.find(c => c.id === 'dragao')).toEqual({ id: 'dragao', nome: 'Dragões', descricao: 'Voam e cospem fogo' });

    // remover tira a classe de todo mundo (dois cliques)
    await at.locator('.cls-remover').click();
    await expect(at.locator('.cls-remover')).toHaveText('Confirmar: tirar de 2');
    await at.locator('.cls-remover').click();
    await expect(at).toHaveCount(0);
    const p = (await plano(page))!;
    expect(p.classes!.map(c => c.id)).toEqual(['dragao', 'fadinhas', 'robo']);
    expect(p.unidades).toEqual({ pokemon: { Charizard: { classes: ['dragao'] }, Pikachu: { habilidade: 'Choque' } } });

    // "ver na lista": a franquia com o filtro da classe
    await dr.locator('.cls-fr[data-fr="pokemon"] .cls-fr-btn').click();
    await expect(chip(page, 'pokemon')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#catClasse')).toHaveValue('dragao');
    expect(await nomes(page)).toEqual(['Charizard']);
    await expect(linha(page, 'Charizard').locator('.cls-chip')).toHaveText(['Dragões×']);
  });

  test('filtros de linha (com, sem, confirmada, não confirmada) por cima do grupo e da classe', async ({ page }) => {
    const linhas = BASE.linhas.pokemon.map(l => (l.id === 'pokemon:bulbasaur' ? { ...l, confirmada: true } : l));
    await inicio(page, { storage: { 'pdx-set1-plano': { versao: 1, unidades: { pokemon: { Venusaur: { classes: ['fadinhas'] } } }, linhas: { pokemon: linhas } } } });
    expect(await opcoes(page, '#catLinha')).toEqual(['Todas', 'Com linha (10)', 'Sem linha (2)', 'Linha confirmada (3)', 'Linha não confirmada (7)']);
    await page.selectOption('#catLinha', 'confirmada');
    expect(await nomes(page)).toEqual(['Bulbasaur', 'Ivysaur', 'Venusaur']);
    await page.selectOption('#catClasse', 'fadinhas');
    expect(await nomes(page)).toEqual(['Venusaur']);
    expect(await opcoes(page, '#catLinha')).toEqual(['Todas', 'Com linha (1)', 'Sem linha (0)', 'Linha confirmada (1)', 'Linha não confirmada (0)']);
    await page.selectOption('#catClasse', '');
    await page.selectOption('#catLinha', 'sem');
    expect(await nomes(page)).toEqual(['Clefairy', 'Clefable']);
    await page.selectOption('#catLinha', 'pendente');
    await expect(page.locator('#catCount')).toHaveText('7 de 40');
    // no grupo Todos, as contagens são da franquia inteira
    await grupo(page, 'todos').click();
    expect(await opcoes(page, '#catLinha')).toEqual(['Todas', 'Com linha (10)', 'Sem linha (30)', 'Linha confirmada (3)', 'Linha não confirmada (7)']);
    // "Limpar filtros" não mexe no grupo
    await page.locator('#catLimparFiltros').click();
    await expect(page.locator('#catLinha')).toHaveValue('');
    await expect(grupo(page, 'todos')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#catCount')).toHaveText('40 de 40');
  });

  test('Exportar leva classes, habilidade, linha e o plano; "Exportar o grupo base"; Importar restaura o planejamento', async ({ page }) => {
    const linhas = BASE.linhas.pokemon.map(l => (l.id === 'pokemon:charmander' ? { ...l, confirmada: true } : l));
    await inicio(page, {
      storage: {
        'pdx-set1': { pokemon: ['Charizard', 'Clefairy'] },
        'pdx-set1-plano': { versao: 1, unidades: { pokemon: { Charizard: { classes: ['dragao'], habilidade: 'Voa alto' } } }, linhas: { pokemon: linhas } },
      },
    });
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#catExport').click()]);
    const arqMarcados = fs.readFileSync((await dl.path())!);
    const set1 = JSON.parse(arqMarcados.toString('utf8'));
    expect(set1.grupo).toBe('marcados');
    const [cz, cf] = set1.franquias.pokemon.personagens;
    expect(cz).toEqual({
      nome: 'Charizard', img: expect.stringMatching(/official-artwork\/6\.png$/), tipo: ['Fire', 'Flying'], geracao: 'I', habitat: 'mountain',
      classes: ['Dragão'], habilidade: 'Voa alto', linha: { nome: 'Charmander', nivel: 3, de: 3, confirmada: true },
    });
    // sem planejamento: só nome e imagem (a fixture do catálogo não tem o Clefairy)
    expect(cf).toStrictEqual({ nome: 'Clefairy', img: expect.stringMatching(/official-artwork\/35\.png$/) });
    // o plano inteiro: classes e linhas que valem agora (da base ou mudadas)
    expect(set1.plano.classes).toEqual(BASE.classes);
    expect(set1.plano.unidades).toEqual({ pokemon: { Charizard: { classes: ['dragao'], habilidade: 'Voa alto' } } });
    expect(Object.keys(set1.plano.linhas)).toEqual(['pokemon', 'persona']);
    expect(set1.plano.linhas.pokemon).toEqual(linhas);

    // grupo base: todo mundo do Set 1 (base), sem precisar marcar
    const [dl2] = await Promise.all([page.waitForEvent('download'), page.locator('#catExportBase').click()]);
    expect(dl2.suggestedFilename()).toBe('set1-grupo-base.json');
    await expect(page.locator('#catMsg')).toHaveText('Baixado o set1-grupo-base.json: 21 personagens em 4 franquias do Set 1 (base), com o planejamento.');
    const arqBase = fs.readFileSync((await dl2.path())!);
    const base = JSON.parse(arqBase.toString('utf8'));
    expect(base.grupo).toBe('base');
    expect(Object.keys(base.franquias)).toEqual(['pokemon', 'persona', 'bakugan', 'lol']);
    expect(base.franquias.pokemon.personagens.map((x: { nome: string }) => x.nome)).toEqual([...BASE_POKEMON, 'Fora da Lista']);
    expect(base.franquias.persona.personagens.find((x: { nome: string }) => x.nome === 'Orpheus F').linha)
      .toEqual({ nome: 'Protagonista (P3)', nivel: 1, de: 3, confirmada: false, alternativas: ['Orpheus'] });

    // apaga tudo e importa o set1.json: voltam as marcações e o planejamento
    await page.evaluate(() => { localStorage.removeItem('pdx-set1'); localStorage.removeItem('pdx-set1-plano'); });
    await page.reload();
    await expect(page.locator('#status')).not.toContainText('carregando', { timeout: 15000 });
    await aba(page, 'Catálogo');
    await expect(linha(page, 'Charizard').locator('.cls-chip')).toHaveCount(0);
    await expect(linha(page, 'Charizard').locator('.lin-selo')).toHaveText('Linha Charmander · nível 3 de 3');
    await page.setInputFiles('#catImportFile', { name: 'set1.json', mimeType: 'application/json', buffer: arqMarcados });
    await expect(page.locator('#catMsg')).toHaveText(
      'Importado set1.json: 2 personagens em 1 franquia, 2 novos. Planejamento restaurado: 3 classes, 1 personagem com classe ou habilidade e as linhas de 2 franquias.');
    await expect(linha(page, 'Charizard').locator('.cls-chip')).toHaveText(['Dragão×']);
    await expect(linha(page, 'Charizard').locator('textarea.cat-hab')).toHaveValue('Voa alto');
    await expect(linha(page, 'Charizard').locator('.lin-selo')).toHaveText('Linha Charmander · nível 3 de 3 ✓');
    expect(await lerStorage(page, 'pdx-set1')).toEqual({ pokemon: ['Charizard', 'Clefairy'] });
    // o que é igual à base volta a seguir a base: as classes e as linhas da Persona não ficam no plano
    expect(await plano(page)).toEqual({ versao: 1, unidades: { pokemon: { Charizard: { classes: ['dragao'], habilidade: 'Voa alto' } } }, linhas: { pokemon: linhas } });

    // o arquivo do grupo base restaura o planejamento sem marcar ninguém
    await page.setInputFiles('#catImportFile', { name: 'set1-grupo-base.json', mimeType: 'application/json', buffer: arqBase });
    await expect(page.locator('#catMsg')).toHaveText(
      'Importado set1-grupo-base.json. Planejamento restaurado: 3 classes, 1 personagem com classe ou habilidade e as linhas de 2 franquias.');
    await expect(page.locator('#catMsg')).not.toHaveClass(/\bbad\b/);
    expect(await lerStorage(page, 'pdx-set1')).toEqual({ pokemon: ['Charizard', 'Clefairy'] });
  });

  test('sem o set1-base.json: grupo "Todos", sem classes nem linhas; dá pra criar classe e linha', async ({ page }) => {
    const calls = await inicio(page, { semBase: true });
    expect(calls['set1-base']).toBe(1);
    await expect(page.locator('#catGrupo button')).toHaveText(['Marcados · 0', 'Todos · 40']);
    await expect(grupo(page, 'todos')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#catCount')).toHaveText('40 de 40');
    await expect(page.locator('#catExportBase')).toBeDisabled();
    await expect(page.locator('#catAbaClasses')).toHaveText('Classes · 0');
    await linha(page, 'Pikachu').locator('.cls-add').click();
    await expect(linha(page, 'Pikachu').locator('.cls-opts')).toHaveText('Nenhuma classe ainda: crie na subaba Classes.');

    await expect(vista(page, 'linhas')).toHaveText('Linhas · 0');
    await vista(page, 'linhas').click();
    await expect(page.locator('#catLinVazio')).toContainText('Nenhuma linha em Pokémon ainda.');
    await expect(page.locator('#catLinProg')).toHaveText('0 de 0 linhas confirmadas');
    await page.locator('#catNovaLinha').click();
    await expect(page.locator('#catLinhas .lin-card')).toHaveCount(1);
    await expect(page.locator('#catLinBase')).toHaveCount(0);

    await page.locator('#catAbaClasses').click();
    await expect(page.locator('#catClasseVazio')).toBeVisible();
    await expect(page.locator('#catSemClasse')).toHaveCount(0);
    await page.fill('#catClasseNome', 'Dragão');
    await page.locator('#catClasseAdd').click();
    expect((await plano(page))!.classes).toEqual([{ id: 'dragao', nome: 'Dragão' }]);
    await chip(page, 'pokemon').click();
    await vista(page, 'personagens').click();
    await linha(page, 'Pikachu').locator('.cls-add').click();
    await linha(page, 'Pikachu').locator('.cls-opt[data-classe="dragao"]').click();
    await expect(linha(page, 'Pikachu').locator('.cls-chip')).toHaveText(['Dragão×']);
  });

  test('teclado e tela: seletor de classes e busca de adicionar pelo teclado; níveis lado a lado; sem rolagem lateral', async ({ page }) => {
    await inicio(page);
    const pk = linha(page, 'Pikachu');
    await pk.locator('.cls-add').focus();
    await page.keyboard.press('Enter');
    await expect(pk.locator('.cls-opts')).toBeVisible();
    await pk.locator('.cls-opt[data-classe="atirador"]').focus();
    await page.keyboard.press('Space');
    await expect(pk.locator('.cls-opt[data-classe="atirador"]')).toHaveAttribute('aria-pressed', 'true');
    expect(await semRolagemLateral(page)).toBe(true);

    await vista(page, 'linhas').click();
    const sq = carta(page, 'pokemon:squirtle');
    await sq.locator('.lin-add-btn').focus();
    await page.keyboard.press('Enter');
    await expect(sq.locator('.lin-busca')).toBeFocused();
    await page.keyboard.type('pid');
    await expect(sq.locator('.lin-res-it')).toHaveText(['Pidgey', 'Pidgeotto', 'Pidgeot']);
    await page.keyboard.press('ArrowDown');
    await expect(sq.locator('.lin-res-it').first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(sq.locator('.lin-res-it').nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    expect(await niveis(page, 'pokemon:squirtle')).toEqual([['Squirtle'], ['Wartortle'], ['Pidgeotto']]);
    await expect(sq.locator('.lin-busca')).toBeFocused();
    // Esc com o campo vazio fecha
    await page.keyboard.press('Escape');
    await expect(sq.locator('.lin-add')).toHaveCount(0);

    await carta(page, 'pokemon:bulbasaur').locator('.lin-membro[data-nome="Ivysaur"]').click();
    const xs = await carta(page, 'pokemon:bulbasaur').locator('.lin-nivel').evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().x)));
    expect(new Set(xs).size).toBe(3);
    expect(await semRolagemLateral(page)).toBe(true);

    await page.locator('#catAbaClasses').click();
    await expect(page.locator('.cls-card[data-classe="atirador"] .cls-pers li')).toHaveText(['Pikachu']);
    expect(await semRolagemLateral(page)).toBe(true);
  });
});
