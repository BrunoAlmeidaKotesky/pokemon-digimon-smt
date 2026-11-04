// Estilos do tabuleiro: os ids de estilos.ts e as cores no CSS (claro e escuro) andam juntos.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ehEstilo, ESTILO_PADRAO, ESTILOS_TABULEIRO, estiloOuPadrao, nomeEstilo } from './estilos';

const css = readFileSync(new URL('../modes/autobatalha/autobatalha.css', import.meta.url), 'utf8');
const VARIAVEIS = ['--campo1', '--campo2', '--campo-borda', '--casa', '--casa-luz', '--casa-aro', '--casa-deles', '--casa-deles-luz'];

/** corpo do bloco que começa logo depois de `seletor` (até o primeiro "}") */
function bloco(seletor: string, de = 0): { corpo: string; fim: number } | null {
  const i = css.indexOf(seletor, de);
  if (i < 0) return null;
  const a = css.indexOf('{', i + seletor.length);
  const b = css.indexOf('}', a);
  return { corpo: css.slice(a + 1, b), fim: b };
}

describe('estilos do tabuleiro', () => {
  it('ids únicos, nomes em português, o padrão é o gramado', () => {
    expect(ESTILOS_TABULEIRO.length).toBeGreaterThanOrEqual(6);
    expect(new Set(ESTILOS_TABULEIRO.map(e => e.id)).size).toBe(ESTILOS_TABULEIRO.length);
    expect(ESTILO_PADRAO).toBe('gramado');
    expect(ehEstilo(ESTILO_PADRAO)).toBe(true);
    expect(nomeEstilo('vulcao')).toBe('Vulcão');
  });

  it('id desconhecido ou que não é texto vira o padrão', () => {
    expect(estiloOuPadrao('neve')).toBe('neve');
    for (const x of ['lava', '', undefined, null, 3]) expect(estiloOuPadrao(x)).toBe(ESTILO_PADRAO);
  });

  it('cada estilo tem as cores no CSS, no claro e no escuro', () => {
    for (const { id } of ESTILOS_TABULEIRO) {
      const seletor = `[data-estilo="${id}"]`;
      const claro = bloco(seletor);
      expect(claro, id).not.toBeNull();
      const escuro = bloco(seletor, css.indexOf('prefers-color-scheme:dark', claro!.fim));
      expect(escuro, `${id} (escuro)`).not.toBeNull();
      for (const v of VARIAVEIS) {
        expect(claro!.corpo, `${id}: ${v}`).toContain(`${v}:`);
        expect(escuro!.corpo, `${id} (escuro): ${v}`).toContain(`${v}:`);
      }
    }
  });
});
