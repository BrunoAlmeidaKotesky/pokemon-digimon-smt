import { beforeEach, describe, expect, it } from 'vitest';
import { comprar, escolherEvolucao, fimDoPlanejamento, humano, jogadorDe, novaPartida } from './index';
import { dar, limpar, prepararTeste } from './test-helpers';

beforeEach(() => prepararTeste());

/** Partida com a loja do jogador só com o Rotom (nível 1 com duas formas), na forma Rotom-H. */
function cenario(id: string) {
  const p = novaPartida(12);
  const j = jogadorDe(p, id);
  limpar(j);
  j.ouro = 10;
  j.loja = ['pokemon:rotom', 'pokemon:rotom', 'pokemon:rotom'];
  j.lojaFormas = ['pokemon:Rotom-H', 'pokemon:Rotom-H', 'pokemon:Rotom-W'];
  return { p, j };
}

describe('compra de campeão com forma alternativa no nível 1', () => {
  it('o humano escolhe qual forma leva; a da loja vem primeiro', () => {
    const { p, j } = cenario(humano(novaPartida(1)).id);
    expect(comprar(p, j.id, 0)).toBeNull();
    const uid = Number(Object.keys(j.unidades)[0]);
    expect(j.escolhaPendente).toEqual({ uid, opcoes: ['pokemon:Rotom-H', 'pokemon:Rotom-W'], motivo: 'compra' });
    expect(j.unidades[uid]!.forma).toBe('pokemon:Rotom-H');
    expect(escolherEvolucao(p, j.id, 'pokemon:Rotom-W')).toBeNull();
    expect(j.unidades[uid]!.forma).toBe('pokemon:Rotom-W');
    expect(j.escolhaPendente).toBeUndefined();
  });

  it('sem resposta no fim do planejamento, fica a forma que veio da loja', () => {
    const { p, j } = cenario(humano(novaPartida(1)).id);
    comprar(p, j.id, 0);
    const uid = j.escolhaPendente!.uid;
    fimDoPlanejamento(p);
    expect(j.unidades[uid]!.forma).toBe('pokemon:Rotom-H');
    expect(j.escolhaPendente).toBeUndefined();
  });

  it('compra que evolui na hora não pergunta; escolha da compra não trava a evolução; bot nunca pergunta', () => {
    const { p, j } = cenario(humano(novaPartida(1)).id);
    dar(p, j, 'pokemon:rotom', { banco: 0, forma: 'pokemon:Rotom-H' });
    dar(p, j, 'pokemon:rotom', { banco: 1, forma: 'pokemon:Rotom-H' });
    comprar(p, j.id, 0);
    expect(j.escolhaPendente).toBeUndefined();
    expect(Object.values(j.unidades).map(u => u.estrela)).toEqual([2]);
    // duas compras com a escolha pendente, a 3ª funde mesmo assim
    const outro = cenario(humano(novaPartida(1)).id);
    comprar(outro.p, outro.j.id, 0);
    comprar(outro.p, outro.j.id, 1);
    comprar(outro.p, outro.j.id, 2);
    expect(Object.values(outro.j.unidades).map(u => u.estrela)).toEqual([2]);
    const bot = cenario('pyrus');
    comprar(bot.p, 'pyrus', 2);
    expect(bot.j.escolhaPendente).toBeUndefined();
    expect(Object.values(bot.j.unidades)[0]!.forma).toBe('pokemon:Rotom-W');
  });
});
