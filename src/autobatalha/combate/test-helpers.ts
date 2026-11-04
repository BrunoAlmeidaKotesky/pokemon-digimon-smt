// Set pequeno montado à mão e conteúdo falso pros testes do motor de combate.
import { S, definirSet } from '../dados';
import type {
  Atributos, CampeaoDados, Custo, EntradaLutador, EntradaTime, Estrela, FormaDados, Habilidade, Item, MonstroDados, Origem,
  SetDados, Traco, Unidade,
} from '../tipos';
import type { Conteudo, TracoAtivo } from './contrato';

const forma = (fr: Origem, nome: string, classes: string[], extra: Partial<FormaDados> = {}): FormaDados =>
  ({ id: `${fr}:${nome}`, nome, img: `${fr}/${nome}.webp`, fr, classes, info: [], ...extra });

const FORMAS: FormaDados[] = [
  forma('pokemon', 'Brigao1', ['porradeiro']),
  forma('pokemon', 'Brigao2', ['porradeiro']),
  forma('pokemon', 'Brigao3', ['porradeiro']),
  forma('pokemon', 'Charizard', ['dragao', 'fogo'], { transforma: ['pokemon:Mega Charizard X'] }),
  forma('pokemon', 'Mega Charizard X', ['dragao', 'fogo'], { soUlt: true }),
  forma('pokemon', 'Lerdo', ['agua'], { semUlt: true }),
  forma('overwatch', 'Mira', ['atirador']),
  forma('smt', 'Muralha', ['tanque']),
  forma('lol', 'Ahri', ['fadinhas'], { habilidade: 'lol:Ahri' }),
  forma('jojo', 'Jotaro', ['porradeiro']),
  forma('jojo', 'Star Platinum', ['porradeiro']),
  forma('deadlock', 'Faca', ['assassino', 'vento']),
  forma('persona', 'Raio', ['raio']),
];

const camp = (id: string, custo: Custo, niveis: string[][], extra: Partial<CampeaoDados> = {}): CampeaoDados =>
  ({ id, fr: id.split(':')[0] as Origem, nome: niveis[0]![0]!.split(':')[1]!, custo, niveis, ...extra });

const CAMPEOES: CampeaoDados[] = [
  camp('pokemon:brigao', 1, [['pokemon:Brigao1'], ['pokemon:Brigao2'], ['pokemon:Brigao3']]),
  camp('pokemon:charizard', 3, [['pokemon:Charizard']]),
  camp('pokemon:lerdo', 1, [['pokemon:Lerdo']]),
  camp('overwatch:mira', 1, [['overwatch:Mira']]),
  camp('smt:muralha', 2, [['smt:Muralha']]),
  camp('lol:ahri', 3, [['lol:Ahri']]),
  camp('jojo:jotaro', 4, [['jojo:Jotaro']]),
  camp('jojo:star-platinum', 4, [['jojo:Star Platinum']], { stand: true }),
  camp('deadlock:faca', 2, [['deadlock:Faca']]),
  camp('persona:raio', 3, [['persona:Raio']]),
];

export const GOBLIN: MonstroDados = { nome: 'Goblin', jogo: 'Final Fantasy', img: 'ff/goblin.webp' };
export const BAHAMUT: MonstroDados = { nome: 'Bahamut', jogo: 'Final Fantasy', img: 'ff/bahamut.webp' };

export const SET_TESTE: SetDados = {
  versao: 1,
  geradoEm: '2026-11-04T00:00:00.000Z',
  fonte: 'teste',
  tracos: [],
  campeoes: CAMPEOES,
  formas: Object.fromEntries(FORMAS.map(f => [f.id, f])),
  bakugan: {},
  ff: { inimigos: [GOBLIN], chefes: [BAHAMUT] },
};

export const usarSetTeste = () => definirSet(SET_TESTE);

// ---------------------------------------------------------------------------------------------------------------
// Conteúdo falso
// ---------------------------------------------------------------------------------------------------------------

export interface ConteudoFalso extends Conteudo {
  /** quantas vezes cada lutador (id da luta) chamou `lancar` */
  chamadas: Record<string, number>;
  /** maior `lancamentos` visto dentro do `lancar` de cada lutador */
  lancamentos: Record<string, number>;
}

export interface OpcoesFalso {
  tracos?: Record<string, Traco>;
  itens?: Record<string, Item>;
  proprias?: Record<string, Habilidade>;
  /** ult de classe (padrão: 150% do dano no alvo, mana 60) */
  golpe?: Habilidade;
}

export function conteudoFalso(o: OpcoesFalso = {}): ConteudoFalso {
  const chamadas: Record<string, number> = {};
  const lancamentos: Record<string, number> = {};
  const contar = (h: Habilidade): Habilidade => ({
    ...h,
    lancar(ctx, eu, alvo) {
      chamadas[eu.id] = (chamadas[eu.id] ?? 0) + 1;
      lancamentos[eu.id] = Math.max(lancamentos[eu.id] ?? 0, eu.lancamentos);
      h.lancar(ctx, eu, alvo);
    },
  });
  const golpe = contar(o.golpe ?? {
    id: 'golpe', nome: 'Golpe', texto: '150% do dano no alvo', mana: 60,
    lancar(ctx, eu, alvo) { if (alvo) ctx.dano(eu, alvo, 1.5); },
  });
  const transformar = (para: string) => contar({
    id: 'transformar', nome: 'Transformar', texto: 'vira outra forma', mana: 40,
    lancar(ctx, eu) { ctx.transformar(eu, para, 1.4); },
  });
  const tracos = o.tracos ?? {};
  return {
    chamadas,
    lancamentos,
    TRACOS: tracos,
    ITENS: o.itens ?? {},
    habilidadeDa(f, escolha) {
      if (f.semUlt) return null;
      if (f.transforma?.length) return transformar(escolha && f.transforma.includes(escolha) ? escolha : f.transforma[0]!);
      if (f.soUlt) return null;
      if (f.habilidade) {
        const h = o.proprias?.[f.habilidade];
        return h ? contar(h) : golpe;
      }
      return golpe;
    },
    contarTracos(us) {
      const porTraco = new Map<string, Set<string>>();
      for (const u of us) {
        const f = S().forma(u.forma);
        for (const t of [f.fr, ...f.classes]) {
          const set = porTraco.get(t) ?? new Set<string>();
          set.add(u.campeao);
          porTraco.set(t, set);
        }
      }
      const out: TracoAtivo[] = [];
      for (const [id, set] of porTraco) {
        let nivel = -1;
        (tracos[id]?.degraus ?? []).forEach((d, i) => { if (set.size >= d) nivel = i; });
        out.push({ id, n: set.size, nivel });
      }
      return out;
    },
  };
}

/** Traço falso com degraus e ganchos. */
export const traco = (id: string, degraus: number[], resto: Partial<Traco> = {}): Traco =>
  ({ id, nome: id, tipo: 'classe', degraus, descricao: '', textos: [], ...resto });

// ---------------------------------------------------------------------------------------------------------------
// Times
// ---------------------------------------------------------------------------------------------------------------

let proximoUid = 1;
export function unidade(campeao: string, estrela: Estrela = 1, extra: Partial<Unidade> = {}): Unidade {
  return { uid: proximoUid++, campeao, estrela, forma: S().formaPadrao(campeao, estrela), itens: [], ...extra };
}

/** Entrada: unidade na casa (col, lin) da metade do dono (lin 0 = frente). */
export const em = (u: Unidade, col: number, lin: number): EntradaLutador => ({ id: String(u.uid), unidade: u, casa: { col, lin } });

export const time = (dono: string, ...lutadores: EntradaLutador[]): EntradaTime => ({ dono, lutadores });

export const atributosMonstro = (p: Partial<Atributos> = {}): Atributos => ({
  vida: 1000, dano: 50, armadura: 20, resist: 20, velAtaque: 0.7, alcance: 1, mana: 100, manaInicial: 0, critChance: 0,
  critDano: 1.4, rouboVida: 0, desvio: 0, poder: 1, ...p,
});

export const monstro = (id: string, col: number, lin: number, at: Partial<Atributos> = {}, chefe = false): EntradaLutador =>
  ({ id, monstro: { dados: chefe ? BAHAMUT : GOBLIN, chefe, atributos: atributosMonstro(at) }, casa: { col, lin } });
