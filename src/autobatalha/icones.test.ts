// Ícones do lobby (icones.ts) com o set de verdade (public/autobatalha/set1.json): todos os personagens, sem repetir,
// com o custo de cada um, e os filtros da janela.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { indexar } from './dados';
import { FILTRO_ICONES_VAZIO, filtrarIcones, iconesDoSet } from './icones';
import { ORIGENS, type SetDados } from './tipos';

const dados = JSON.parse(readFileSync(new URL('../../public/autobatalha/set1.json', import.meta.url), 'utf8')) as SetDados;
const set = indexar(dados);
const icones = iconesDoSet(set);

describe('ícones do lobby', () => {
  it('todas as formas do set, cada uma uma vez, inclusive as de transformação', () => {
    const formas = Object.values(dados.formas);
    expect(new Set(icones.map(i => i.forma)).size).toBe(icones.length);
    expect(new Set(icones.map(i => i.img)).size).toBe(icones.length);
    expect(icones.length).toBe(new Set(formas.map(f => f.img)).size);
    expect(icones.filter(i => i.transformacao).length).toBe(formas.filter(f => f.soUlt).length);
    expect(icones.filter(i => i.transformacao).length).toBeGreaterThan(0);
  });

  it('cada ícone tem o custo do campeão (a transformação, o de quem transforma), na ordem das origens', () => {
    for (const i of icones) expect(i.custo, i.forma).not.toBeNull();
    for (const c of dados.campeoes) {
      const f1 = c.niveis[0]![0]!;
      expect(icones.find(i => i.forma === f1)!.custo! <= c.custo).toBe(true);
    }
    const ordem = icones.map(i => ORIGENS.indexOf(i.fr));
    expect(ordem).toEqual([...ordem].sort((a, b) => a - b));
  });

  it('filtros: busca sem acento nem maiúscula, origem e custos', () => {
    expect(filtrarIcones(icones, FILTRO_ICONES_VAZIO)).toHaveLength(icones.length);
    const digimon = filtrarIcones(icones, { ...FILTRO_ICONES_VAZIO, origem: 'digimon' });
    expect(digimon.length).toBeGreaterThan(0);
    expect(digimon.every(i => i.fr === 'digimon')).toBe(true);
    const caros = filtrarIcones(icones, { ...FILTRO_ICONES_VAZIO, custos: [4, 5] });
    expect(caros.length).toBeGreaterThan(0);
    expect(caros.every(i => i.custo === 4 || i.custo === 5)).toBe(true);
    const pika = filtrarIcones(icones, { ...FILTRO_ICONES_VAZIO, busca: 'PIKÁ' });
    expect(pika.length).toBeGreaterThan(0);
    expect(pika.every(i => i.nome.toLowerCase().includes('pika'))).toBe(true);
    expect(filtrarIcones(icones, { busca: 'pika', origem: 'smt', custos: [] })).toHaveLength(0);
    expect(filtrarIcones(icones, { ...FILTRO_ICONES_VAZIO, busca: 'zzzz-ninguem' })).toHaveLength(0);
  });
});
