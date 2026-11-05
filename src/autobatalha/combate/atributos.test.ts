import { beforeAll, describe, expect, it } from 'vitest';
import { ATRIBUTOS_EM_FRACAO, type Atributos, type FormaDados } from '../tipos';
import {
  ALCANCE_PROPRIO, BONUS_SEM_HABILIDADE, VIDA_DE_PERTO, aplicarBonus, alcanceDaForma, atributosBase, atributosDaUnidadeCom, bonusZero,
  NOMES_ATRIBUTOS, papelDe,
} from './atributos';
import { conteudoFalso, unidade, usarSetTeste } from './test-helpers';

const f = (classes: string[]): FormaDados => ({ id: 'x:y', nome: 'y', img: '', fr: 'pokemon', classes, info: [] });

describe('atributos', () => {
  beforeAll(usarSetTeste);

  it('papel: a classe de maior prioridade; só elemento = o 1º elemento; sem classe = Únicos', () => {
    expect(papelDe(f(['dragao', 'fogo']))).toBe('dragao');
    expect(papelDe(f(['fogo', 'tanque']))).toBe('tanque');
    expect(papelDe(f(['vento', 'assassino', 'porradeiro']))).toBe('porradeiro');
    expect(papelDe(f(['agua']))).toBe('agua');
    expect(papelDe(f(['gelo', 'raio']))).toBe('gelo');
    expect(papelDe(f(['unicos', 'terra']))).toBe('unicos');
    expect(papelDe(f([]))).toBe('unicos');
  });

  it('alcance da forma: a tabela manda; fora dela, o do papel', () => {
    expect(alcanceDaForma(f(['atirador']))).toBe(4);
    expect(alcanceDaForma(f(['fogo']))).toBe(2);
    expect(ALCANCE_PROPRIO['lol:Akali']).toBe(1);
    expect(alcanceDaForma({ ...f(['safada']), id: 'lol:Akali' })).toBe(1);
    expect(VIDA_DE_PERTO).toBeGreaterThan(1);
  });

  it('base: custo × estrela × papel', () => {
    const p = atributosBase(1, 2, 'porradeiro');
    expect(p.vida).toBeCloseTo(450 * 1.8 * 1.15);
    expect(p.dano).toBeCloseTo(42 * 1.5 * 1.05);
    expect(p).toMatchObject({ armadura: 20, resist: 20, alcance: 1, mana: 70, manaInicial: 0, critChance: 0.25, critDano: 1.4, poder: 1 });
    const t = atributosBase(5, 3, 'tanque');
    expect(t.vida).toBeCloseTo(1000 * 3.24 * 1.25);
    expect(t.dano).toBeCloseTo(90 * 2.25 * 0.75);
    expect(t).toMatchObject({ armadura: 70, resist: 70, alcance: 1, mana: 70, manaInicial: 0 });
    const at = atributosBase(1, 1, 'atirador');
    expect(at.velAtaque).toBeCloseTo(0.65 * 1.1);
    expect(at.alcance).toBe(4);
    expect(atributosBase(2, 1, 'assassino').critChance).toBeCloseTo(0.4);
    expect(atributosBase(3, 1, 'terra').vida).toBeCloseTo(720 * 1.1);
    expect(atributosBase(3, 1, 'raio').alcance).toBe(3);
  });

  it('soma de bônus segue ATRIBUTOS_EM_FRACAO: fração multiplica o base, o resto soma pontos', () => {
    const base: Atributos = {
      vida: 1000, dano: 100, armadura: 50, resist: 50, velAtaque: 1, alcance: 2, mana: 50, manaInicial: 10, critChance: 0.25,
      critDano: 1.4, rouboVida: 0.1, desvio: 0.1, poder: 1,
    };
    for (const k of NOMES_ATRIBUTOS) {
      const b = bonusZero();
      const v = k === 'alcance' ? 1 : 0.1;
      b[k] = v;
      const esperado = ATRIBUTOS_EM_FRACAO.includes(k) ? base[k] * (1 + v) : base[k] + v;
      expect(aplicarBonus(base, b)[k], k).toBeCloseTo(esperado);
    }
  });

  it('unidade: base + papel + bônus da partida + itens; a habilidade define a mana', () => {
    const c = conteudoFalso({ itens: { pyrus: { id: 'pyrus', nome: 'Pyrus', texto: '', atributos: { dano: 0.15, manaInicial: 15 } } } });
    const u = unidade('pokemon:brigao', 2, { itens: ['pyrus', 'nao-existe'], bonus: { vida: 0.1 } });
    const at = atributosDaUnidadeCom(u, c);
    expect(at.vida).toBeCloseTo(450 * 1.8 * 1.15 * 1.1);
    expect(at.dano).toBeCloseTo(42 * 1.5 * 1.05 * 1.15);
    expect(at.mana).toBe(60); // golpe falso
    expect(at.manaInicial).toBe(15);
    // tanque: começa sem mana (a habilidade falsa não diz a inicial, e o papel não dá)
    expect(atributosDaUnidadeCom(unidade('smt:muralha'), c).manaInicial).toBe(0);
    // forma não final sem habilidade: mana do papel, e vida e dano a mais no lugar da habilidade
    const lerdo = atributosDaUnidadeCom(unidade('pokemon:lerdo'), c);
    expect(lerdo.mana).toBe(80);
    expect(lerdo.vida).toBeCloseTo(450 * (1 + BONUS_SEM_HABILIDADE[1]));
    expect(lerdo.dano).toBeCloseTo(42 * (1 + BONUS_SEM_HABILIDADE[1]));
  });
});
