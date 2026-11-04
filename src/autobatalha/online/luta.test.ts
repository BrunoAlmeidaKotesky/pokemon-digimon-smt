// A luta reproduzida no convidado é a mesma que o anfitrião calculou: o set, o motor e o conteúdo de verdade, partidas
// com dois humanos (que jogam como bots pra ter tabuleiros cheios), e cada luta mandada pela rede (JSON, como
// online/protocolo.ts faz) e simulada de novo com gravação, dos dois lados (o lado B espelhado).
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { atributosDaUnidade, simularLuta } from '../combate';
import { combinar, contarTracos, ehComponente } from '../conteudo';
import { definirSet } from '../dados';
import * as P from '../partida';
import type { Casa, ResultadoLuta, SetDados } from '../tipos';
import { daRede, lerMsgAnfitriao, paraRede } from './protocolo';
import { espelharLuta, girarCasa, lutaPraVer, reproduzirLuta, trocarId } from './visao';

beforeAll(() => {
  definirSet(JSON.parse(readFileSync('public/autobatalha/set1.json', 'utf8')) as SetDados);
  P.definirMotor({ simularLuta, atributosDaUnidade, contarTracos, combinar, ehComponente });
});

/** o que decide a rodada (sem a gravação, que só o convidado pede) */
const essencial = (r: ResultadoLuta) => ({
  vencedor: r.vencedor, vivosA: [...r.vivosA].sort(), vivosB: [...r.vivosB].sort(), duracao: r.duracao, dano: r.dano,
  abates: r.abates, ouro: r.ouro, moedas: r.moedas ?? [],
});

describe('luta reproduzida no convidado', () => {
  it('pela rede e com gravação, dá o mesmo resultado do anfitrião, dos dois lados', () => {
    let lutas = 0, ladoB = 0;
    for (const semente of [11, 12]) {
      const p = P.novaPartidaComHumanos(semente, [{ id: 'h1', escolhas: {} }, { id: 'h2', escolhas: {} }], 'normal', 'h1');
      for (let rodada = 0; rodada < 16 && !P.acabou(p); rodada++) {
        P.jogarBots(p);
        for (const j of p.jogadores) if (!j.bot && P.estaVivo(j)) P.jogarBot(p, j);
        P.fimDoPlanejamento(p);
        const rr = P.simularRodada(p);
        for (const l of rr.lutas) {
          for (const id of [l.a, l.b]) {
            if (!p.jogadores.some(j => j.id === id)) continue; // monstros e fantasmas não veem nada
            const vista = lutaPraVer(rr.lutas, id, `${rr.estagio}-${rr.rodada}`)!;
            // pela rede: texto JSON e conferência do protocolo
            const msg = lerMsgAnfitriao(daRede(paraRede({ t: 'luta', luta: vista }), 4_000_000));
            expect(msg?.t).toBe('luta');
            if (msg?.t !== 'luta') continue;
            const visto = reproduzirLuta(msg.luta);
            expect(visto.gravacao?.quadros.length).toBeGreaterThan(0);
            const doAnfitriao = vista.lado === 'a' ? l.resultado : espelharLuta(l.resultado);
            expect(essencial(visto)).toEqual(essencial(doAnfitriao));
            lutas++;
            if (vista.lado === 'b') ladoB++;
          }
        }
        P.aplicarRodada(p, rr);
        if (P.acabou(p)) break;
        P.avancarRodada(p);
        P.terminarCarrossel(p);
      }
    }
    expect(lutas).toBeGreaterThan(30);
    expect(ladoB).toBeGreaterThan(5);
  }, 60_000);

  it('espelhar: lados e ids trocados, tabuleiro girado; duas vezes volta ao original', () => {
    const p = P.novaPartidaComHumanos(13, [{ id: 'h1', escolhas: {} }, { id: 'h2', escolhas: {} }], 'normal', 'h1');
    P.jogarBots(p);
    for (const j of p.jogadores) if (!j.bot) P.jogarBot(p, j);
    P.fimDoPlanejamento(p);
    const l = P.simularRodada(p).lutas[0]!;
    const r = simularLuta(l.entradaA, l.entradaB, l.semente, true);
    const e = espelharLuta(r);
    expect(espelharLuta(e)).toEqual(r);
    expect(e.vivosA).toEqual(r.vivosB.map(trocarId));
    const ida = r.gravacao!.inicial[0]!;
    const volta = e.gravacao!.inicial.find(x => x.id === trocarId(ida.id))!;
    expect(volta.lado).not.toBe(ida.lado);
    expect(volta.casa).toEqual(girarCasa(ida.casa));
    // o time A (linhas 4 a 7) vai pra cima (0 a 3) e vice-versa
    const linhas = (cs: Casa[]) => new Set(cs.map(c => (c.lin >= 4 ? 'baixo' : 'cima')));
    expect(linhas(r.gravacao!.inicial.filter(x => x.lado === 'a').map(x => x.casa))).toEqual(new Set(['baixo']));
    expect(linhas(e.gravacao!.inicial.filter(x => x.lado === 'b').map(x => x.casa))).toEqual(new Set(['cima']));
  });
});
