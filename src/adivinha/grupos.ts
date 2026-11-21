// Aba Adivinha: as franquias do jogo (cada uma é um "grupo"; SMT e Persona jogam juntas), os submodos e as colunas
// do Clássico. Os ids das colunas são os campos de public/catalogo/<chave>.json.
import type { FranchiseKey } from '../types';
import type { Info } from '../catalog/model';

export type Submodo = 'classico' | 'imagem' | 'emoji';
export const SUBMODOS: { id: Submodo; rotulo: string }[] = [
  { id: 'classico', rotulo: 'Clássico' },
  { id: 'imagem', rotulo: 'Imagem' },
  { id: 'emoji', rotulo: 'Emoji' },
];
export const rotuloSubmodo = (s: Submodo) => SUBMODOS.find(x => x.id === s)?.rotulo ?? s;
export const isSubmodo = (x: unknown): x is Submodo => SUBMODOS.some(s => s.id === x);

/** texto compara por conjunto (igual, em parte, nada); número e romano mostram seta pra cima ou pra baixo */
export type TipoColuna = 'texto' | 'numero' | 'romano';
export interface Coluna {
  id: string;
  rotulo: string;
  tipo: TipoColuna;
  /** valor quando a franquia não tem o campo no catálogo (Persona não tem raça: vira "Persona") */
  fixo?: Record<FranchiseKey, string>;
}
export interface Grupo {
  id: string;
  rotulo: string;
  /** franquias do site que entram no grupo */
  frs: FranchiseKey[];
  colunas: Coluna[];
  /**
   * Quem entra no jogo, pelas informações do catálogo e pelo nome (vale em todos os submodos, no do dia, no livre, no online e no
   * autocompletar; o resto do site continua com a lista inteira). Sem isso, entra todo mundo que tem catálogo.
   */
  aceita?: (info: Info, nome: string) => boolean;
}

/** JoJo: só Stands do anime e do mangá (pelo menos uma parte de 3 a 9 ou o Kishibe Rohan). */
export const PARTES_JOJO = ['Part 3', 'Part 4', 'Part 5', 'Part 6', 'Part 7', 'Part 8', 'Part 9', 'Thus Spoke Kishibe Rohan'];
const jojoDoAnime = (info: Info) => [info.parte ?? []].flat().some(p => PARTES_JOJO.includes(String(p)));
/** Pokémon que o usuário tirou do Adivinha (21/11/2026): os Paradoxos e o Unown (28 formas de letra). */
export const POKEMON_FORA: ReadonlySet<string> = new Set([
  'Unown', 'Great Tusk', 'Scream Tail', 'Brute Bonnet', 'Flutter Mane', 'Slither Wing', 'Sandy Shocks', 'Roaring Moon', 'Walking Wake', 'Gouging Fire',
  'Raging Bolt', 'Iron Treads', 'Iron Bundle', 'Iron Hands', 'Iron Jugulis', 'Iron Moth', 'Iron Thorns', 'Iron Valiant', 'Iron Leaves', 'Iron Boulder',
  'Iron Crown',
]);
/** Pokémon: só as espécies (sem Mega, Gigantamax nem formas alternativas, que têm `variante` no catálogo), menos POKEMON_FORA. */
const soEspecie = (info: Info, nome: string) => info.variante === undefined && !POKEMON_FORA.has(nome);
/** SMT + Persona: sem as variantes Picaro do Persona 5 Royal (a mesma Persona com outra roupa). */
const semPicaro = (_info: Info, nome: string) => !/ Picaro$/.test(nome);

const t = (id: string, rotulo: string, tipo: TipoColuna = 'texto'): Coluna => ({ id, rotulo, tipo });

export const GRUPOS: Grupo[] = [
  { id: 'lol', rotulo: 'LoL', frs: ['lol'], colunas: [t('classe', 'Classe'), t('regiao', 'Região'), t('alcance', 'Alcance'), t('dano', 'Dano'), t('recurso', 'Recurso'), t('dificuldade', 'Dificuldade', 'numero')] },
  { id: 'overwatch', rotulo: 'Overwatch', frs: ['overwatch'], colunas: [t('funcao', 'Função'), t('subfuncao', 'Subfunção'), t('afiliacao', 'Afiliação'), t('pais', 'País'), t('especie', 'Espécie')] },
  { id: 'deadlock', rotulo: 'Deadlock', frs: ['deadlock'], colunas: [t('tipo', 'Tipo'), t('arma', 'Arma'), t('disparo', 'Disparo'), t('complexidade', 'Complexidade', 'numero'), t('genero', 'Gênero')] },
  {
    id: 'pokemon', rotulo: 'Pokémon', frs: ['pokemon'], aceita: soEspecie,
    colunas: [t('tipo', 'Tipo'), t('geracao', 'Geração', 'romano'), t('estagio', 'Estágio', 'numero'), t('cor', 'Cor'), t('forma', 'Forma'), t('ovo', 'Grupo de ovo')],
  },
  { id: 'jojo', rotulo: 'JoJo', frs: ['jojo'], aceita: jojoDoAnime, colunas: [t('parte', 'Parte'), t('alcance', 'Alcance'), t('forma', 'Forma'), t('mecanica', 'Mecânica')] },
  {
    id: 'megaten', rotulo: 'SMT + Persona', frs: ['smt', 'persona'], aceita: semPicaro,
    colunas: [t('jogo', 'Jogo'), { ...t('raca', 'Raça'), fixo: { persona: 'Persona' } }, t('arcana', 'Arcana'), t('mitologia', 'Mitologia'), t('nivel', 'Nível', 'numero'), t('fraco', 'Fraqueza')],
  },
];
export const GRUPO_PADRAO = 'lol';

export const grupoDe = (id: string): Grupo | undefined => GRUPOS.find(g => g.id === id);
/** Cor do grupo pra CSS: a da primeira franquia (SMT + Persona fica com a do SMT). */
export const corDoGrupo = (g: Grupo) => `var(--${g.frs[0]})`;
