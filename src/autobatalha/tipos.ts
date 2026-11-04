// Contrato do modo Autobatalha (jogo de montar time com sinergias, luta automática em casas hexagonais).
// Este arquivo é a interface entre as partes: dados do set (gerados por autobatalha.mjs), motor de combate
// (src/autobatalha/combate), conteúdo (habilidades, traços e itens em src/autobatalha/conteudo), partida
// (loja, economia, rodadas, bots em src/autobatalha/partida) e a tela (src/modes/autobatalha).
// Design e decisões: docs/tft/autobatalha.md.

// ===================================================================================================
// Dados do set: public/autobatalha/set1.json (gerado por `node autobatalha.mjs`)
// ===================================================================================================

/** Origem = franquia. Final Fantasy (monstros) e Bakugan (itens) não são origem. */
export type Origem = 'pokemon' | 'digimon' | 'smt' | 'persona' | 'jojo' | 'ygo' | 'lol' | 'overwatch' | 'deadlock' | 'sujimon';
export const ORIGENS: readonly Origem[] = ['pokemon', 'digimon', 'smt', 'persona', 'jojo', 'ygo', 'lol', 'overwatch', 'deadlock', 'sujimon'];
export type Custo = 1 | 2 | 3 | 4 | 5;
export type Estrela = 1 | 2 | 3;
/** Uma linha de informação pro tooltip, já formatada ("Tipo" → "Grass, Poison"). */
export interface InfoCampo { rotulo: string; valor: string }

/** Uma forma (carta) de um personagem: o que aparece no tabuleiro. */
export interface FormaDados {
  /** `${fr}:${nome}`, único no set */
  id: string;
  nome: string;
  /** URL absoluta, ou caminho relativo à pasta public ("smt/abaddon.webp") */
  img: string;
  fr: Origem;
  /** ids de traço (classes, elementos e "unicos"), na ordem do Catálogo */
  classes: string[];
  /** id da habilidade própria (chave em conteudo/habilidades.ts HABILIDADES_PROPRIAS), quando a forma tem uma */
  habilidade?: string;
  /** texto da habilidade como veio do Catálogo (referência; a tela mostra o texto do conteúdo) */
  habilidadeOriginal?: string;
  /** forma não final de Pokémon/Digimon: não lança nada, só ataca */
  semUlt?: true;
  /** a ult é virar outra forma (Mega, Gigantamax, Primal, Hisui, Paradox, 4ª forma do Digimon): ids das formas
   *  possíveis (mais de uma = o jogador escolhe) */
  transforma?: string[];
  /** forma que só existe como resultado de transformação (não é vendida nem é nível de linha) */
  soUlt?: true;
  /** campos do catálogo pro tooltip */
  info: InfoCampo[];
}

/** O que a loja vende: uma linha evolutiva ou um personagem solto. */
export interface CampeaoDados {
  /** id da linha ("pokemon:bulbasaur") ou `${fr}:${slug(nome)}` pro solto */
  id: string;
  fr: Origem;
  /** nome mostrado na loja (o da forma de nível 1) */
  nome: string;
  /** nome da linha evolutiva, quando é linha */
  linha?: string;
  custo: Custo;
  /** Stand de JoJo: entra preso a uma unidade de outra origem e não conta no limite do tabuleiro */
  stand?: true;
  /** ids de forma por nível da linha (1 a 3 níveis; cada nível pode ter alternativas). Solto: [[id]].
   *  Estrela s usa niveis[min(s, niveis.length) - 1]. */
  niveis: string[][];
  /** nível 3 com alternativa que depende do nível 2 (Eevee): forma do nível 3 → forma do nível 2 de onde vem */
  de?: Record<string, string>;
}

export interface MonstroDados { nome: string; jogo: string; img: string; nivel?: number }

export interface SetDados {
  versao: 1;
  geradoEm: string;
  /** exportação do Catálogo usada */
  fonte: string;
  /** traços que existem no set (id e nome), na ordem do plano */
  tracos: { id: string; nome: string }[];
  campeoes: CampeaoDados[];
  formas: Record<string, FormaDados>;
  /** imagem de cada Bakugan usado como item (nome → URL), e o símbolo de cada atributo ("Pyrus"…) pros componentes */
  bakugan: Record<string, string>;
  /** monstros do Final Fantasy: inimigos comuns (categoria Inimigo) e chefes (categoria Chefe) */
  ff: { inimigos: MonstroDados[]; chefes: MonstroDados[] };
}

// ===================================================================================================
// Hexágonos
// ===================================================================================================

/** Casa no tabuleiro inteiro da luta: col 0..7, lin 0..7 (linhas ímpares deslocadas meia casa pra direita,
 *  "odd-r"). Na luta, o time A fica nas linhas 4..7 (4 = frente) e o B nas 0..3 (3 = frente). */
export interface Casa { col: number; lin: number }
/** Casa na metade de um jogador: col 0..7, lin 0..3 (0 = linha da frente). */
export type CasaDono = Casa;
export const COLUNAS = 8;
export const LINHAS_DONO = 4;
export const LINHAS = 8;

// ===================================================================================================
// Atributos de combate
// ===================================================================================================

export interface Atributos {
  vida: number;
  /** dano de ataque */
  dano: number;
  armadura: number;
  /** resistência mágica */
  resist: number;
  /** ataques por segundo */
  velAtaque: number;
  /** alcance em casas (1 = corpo a corpo) */
  alcance: number;
  mana: number;
  manaInicial: number;
  /** 0..1 */
  critChance: number;
  /** multiplicador do crítico (1.4 = +40%) */
  critDano: number;
  /** 0..1 */
  rouboVida: number;
  /** 0..1, chance de desviar de ataque básico */
  desvio: number;
  /** multiplicador do efeito das habilidades (dano, cura, escudo); 1 = normal */
  poder: number;
}
export type NomeAtributo = keyof Atributos;
/** Atributos que somam fração do valor base (0.2 = +20%). Os outros somam pontos direto. */
export const ATRIBUTOS_EM_FRACAO: readonly NomeAtributo[] = ['vida', 'dano', 'armadura', 'resist', 'velAtaque', 'poder'];

// ===================================================================================================
// Conteúdo: habilidades, traços e itens (src/autobatalha/conteudo) — interpretado pelo motor via contexto
// ===================================================================================================

export type Status =
  | 'atordoado'   // não age (atordoar, congelar, encantar, medo, sono contam como atordoado)
  | 'lento'       // valor = fração de lentidão (velocidade de ataque e de movimento)
  | 'queimando'   // valor = fração da vida máxima por segundo; recebe 33% menos cura
  | 'provocado'   // ataca quem provocou (fonte)
  | 'semMana'     // não ganha mana
  | 'intocavel'   // não pode ser alvo
  | 'vulneravel'  // valor = fração de dano a mais recebido
  | 'fraco'       // valor = fração a menos de dano causado
  | 'refletir'    // valor = fração do dano recebido devolvida a quem atacou
  | 'semCura'     // não recebe cura
  | 'invulneravel'; // não perde vida

export type Lado = 'a' | 'b';

/** Referência opaca a um lutador vivo ou morto na luta (o motor implementa). */
export interface Lutador {
  readonly id: string;
  readonly lado: Lado;
  readonly forma: string;
  readonly campeao: string;
  readonly fr: Origem | 'ff';
  readonly classes: readonly string[];
  readonly estrela: Estrela;
  readonly custo: Custo;
  readonly casa: Casa;
  readonly vivo: boolean;
  readonly vida: number;
  readonly escudo: number;
  readonly mana: number;
  /** atributos atuais (base + estrela + traços + itens + buffs ativos) */
  readonly at: Readonly<Atributos>;
  /** quantas vezes já lançou a habilidade nesta luta */
  readonly lancamentos: number;
  /** é um Stand de JoJo; usuario = quem ele acompanha */
  readonly stand: boolean;
  readonly usuario: Lutador | null;
  /** Stand que acompanha este lutador */
  readonly standDele: Lutador | null;
  /** monstro invocado (SMT) ou monstro do Final Fantasy */
  readonly invocado: boolean;
  /** a unidade do jogador por trás deste lutador (itens, ult escolhida, posição do Yu-Gi-Oh!); null em monstro */
  readonly unidade: Unidade | null;
  /** memória livre pra habilidade/traço/item guardar estado durante a luta */
  readonly memoria: Record<string, number>;
  temStatus(s: Status): boolean;
}

export type TipoDano = 'fisico' | 'magico' | 'verdadeiro';
export interface OpcoesDano {
  /** físico usa armadura, mágico usa resistência; padrão: 'magico' em habilidade, 'fisico' em ataque */
  tipo?: TipoDano;
  critico?: 'pode' | 'sempre' | 'nunca';
  /** ignora escudo e armadura/resistência */
  ignoraDefesa?: boolean;
  /** valor fixo somado antes das defesas */
  extra?: number;
}
export type EfeitoVisual = 'explosao' | 'raio' | 'feixe' | 'cura' | 'escudo' | 'golpe' | 'sopro' | 'gelo' | 'fogo' | 'veneno' | 'luz' | 'trevas' | 'tempo' | 'vento' | 'terra' | 'agua' | 'charme' | 'transformar' | 'invocar';

/** O que o motor oferece às habilidades, traços e itens. Valores em fração (0.3 = 30%). */
export interface Contexto {
  /** número aleatório 0..1 da semente da luta (sempre use este, nunca Math.random) */
  aleatorio(): number;
  chance(p: number): boolean;
  sortear<T>(xs: readonly T[], n: number): T[];
  /** segundos desde o começo da luta */
  readonly tempo: number;

  inimigosDe(u: Lutador): Lutador[];
  aliadosDe(u: Lutador, incluirSi?: boolean): Lutador[];
  /** vivos a até `raio` casas de `centro` (raio 1 = em volta), do lado pedido em relação a `de` */
  emVolta(centro: Lutador | Casa, raio: number, de: Lutador, quem: 'inimigos' | 'aliados'): Lutador[];
  /** vivos na reta de `de` até a borda passando por `para` */
  emLinha(de: Lutador, para: Lutador | Casa, quem: 'inimigos' | 'aliados'): Lutador[];
  /** vivos num leque de `alcance` casas à frente de `de`, na direção de `para` */
  emCone(de: Lutador, para: Lutador | Casa, alcance: number, quem: 'inimigos' | 'aliados'): Lutador[];
  maisProximo(de: Lutador, quem: 'inimigos' | 'aliados'): Lutador | null;
  maisLonge(de: Lutador, quem: 'inimigos' | 'aliados', alcanceMax?: number): Lutador | null;
  /** menor fração de vida; aliados: incluirSi controla se `de` entra */
  menosVida(de: Lutador, quem: 'inimigos' | 'aliados', incluirSi?: boolean): Lutador | null;
  maisVida(de: Lutador, quem: 'inimigos' | 'aliados'): Lutador | null;
  distancia(a: Lutador | Casa, b: Lutador | Casa): number;

  /** dano = fração do dano de ataque de `de` (2.0 = 200%), com defesas, crítico, escudo, vulnerável e roubo de vida;
   *  devolve o dano causado (depois das defesas) */
  dano(de: Lutador, para: Lutador, fracaoDoDano: number, opcoes?: OpcoesDano): number;
  /** dano fixo (já em pontos de vida) */
  danoFixo(de: Lutador, para: Lutador, valor: number, opcoes?: OpcoesDano): number;
  curar(de: Lutador, para: Lutador, valor: number): number;
  escudo(para: Lutador, valor: number, duracao: number): void;
  status(de: Lutador, para: Lutador, s: Status, duracao: number, valor?: number): void;
  limparStatusRuins(u: Lutador): void;
  /** soma ao atributo: fração do base nos ATRIBUTOS_EM_FRACAO (0.3 = +30%), pontos nos outros. Sem duração = luta toda. */
  buff(u: Lutador, atributo: NomeAtributo, fracao: number, duracao?: number): void;
  /** soma pontos de mana (negativo tira) */
  mana(u: Lutador, delta: number): void;
  matar(de: Lutador, para: Lutador): void;
  /** troca a vida atual por uma fração da vida máxima */
  definirFracaoVida(u: Lutador, fracao: number): void;

  casaLivreAoLado(c: Lutador | Casa): Casa | null;
  mover(u: Lutador, para: Casa): void;
  /** empurra `u` `casas` casas pra longe de `origem` (para se bater) */
  empurrar(u: Lutador, origem: Lutador | Casa, casas: number): void;

  /** vira outra forma: troca imagem/nome e multiplica vida máxima, vida, dano, armadura e resistência */
  transformar(u: Lutador, forma: string, multiplicador: number): void;
  /** invoca um monstro do Final Fantasy (sorteado) do lado de `dono`, com uma fração dos atributos dele */
  invocarFF(dono: Lutador, fracaoAtributos: number, casa?: Casa): Lutador | null;
  /** traz de volta (Anjo, D4C) com uma fração da vida máxima */
  reviver(u: Lutador, fracaoVida: number): void;

  /** agenda `fn` daqui a `segundos` (some se a luta acabar) */
  depois(segundos: number, fn: () => void): void;
  /** chama `fn` a cada `intervalo` segundos durante `duracao` */
  aCada(intervalo: number, duracao: number, fn: () => void): void;

  /** efeito só visual (a tela desenha): nas casas ou em cima de lutadores */
  visual(tipo: EfeitoVisual, onde: (Lutador | Casa)[], de?: Lutador): void;
  /** texto flutuante curto em cima de um lutador ("ORA ORA!", "+1 ouro") */
  texto(u: Lutador, texto: string): void;
  /** soma ouro achado na luta pro dono do lado (Harvest) */
  ouro(lado: Lado, n: number): void;
}

/** Valor por estrela: [★1, ★2, ★3]. */
export type PorEstrela = readonly [number, number, number];

export interface Habilidade {
  /** id de classe (ult da classe) ou chave da habilidade própria */
  id: string;
  nome: string;
  /** texto pro tooltip, em português, com os números "a/b/c" por estrela */
  texto: string;
  /** mana pra lançar */
  mana: number;
  manaInicial?: number;
  /** lança: o alvo é o alvo atual do lançador (pode ser null se não houver inimigo à vista) */
  lancar(ctx: Contexto, eu: Lutador, alvo: Lutador | null): void;
}

/** Ganchos de combate de traços e itens. `nivel` = índice do degrau ativo (0 = primeiro). */
export interface Ganchos<N> {
  /** no começo da luta, depois dos atributos; `membros` = lutadores vivos do lado com esse traço/item */
  aoComecar?(ctx: Contexto, n: N, membros: Lutador[]): void;
  /** depois de um ataque básico de `de` acertar `alvo` */
  aoAtacar?(ctx: Contexto, n: N, de: Lutador, alvo: Lutador, dano: number): void;
  /** depois de `u` lançar a habilidade */
  aoLancar?(ctx: Contexto, n: N, u: Lutador): void;
  /** depois de `u` receber dano (de ataque ou habilidade) */
  aoReceberDano?(ctx: Contexto, n: N, u: Lutador, de: Lutador | null, dano: number): void;
  /** `morto` morreu; `abatedor` é quem matou (se houver) */
  aoMorrer?(ctx: Contexto, n: N, morto: Lutador, abatedor: Lutador | null): void;
  /** a cada segundo de luta */
  porSegundo?(ctx: Contexto, n: N, membros: Lutador[]): void;
}

export interface Traco extends Ganchos<number> {
  id: string;
  nome: string;
  tipo: 'origem' | 'classe' | 'elemento' | 'unicos';
  /** quantos campeões diferentes ativam cada degrau (Únicos: []) */
  degraus: number[];
  /** o que o traço faz, em uma frase */
  descricao: string;
  /** texto de cada degrau, na ordem de `degraus` */
  textos: string[];
  /** quem recebe os ganchos: 'membros' (padrão) = só quem tem o traço; 'time' = o time inteiro */
  alcance?: 'membros' | 'time';
  /** atributos somados a cada membro no começo da luta, por degrau (regra de ATRIBUTOS_EM_FRACAO) */
  atributos?: (n: number) => Partial<Record<NomeAtributo, number>>;
}

export type Componente = 'pyrus' | 'aquos' | 'haos' | 'darkus' | 'subterra' | 'ventus' | 'aurelus';
export const COMPONENTES: readonly Componente[] = ['pyrus', 'aquos', 'haos', 'darkus', 'subterra', 'ventus', 'aurelus'];

export interface Item extends Ganchos<Lutador> {
  /** componente: o próprio nome do atributo; completo: `${a}+${b}` em ordem de COMPONENTES */
  id: string;
  nome: string;
  /** nome do Bakugan (chave em SetDados.bakugan), pros completos */
  bakugan?: string;
  componentes?: [Componente, Componente];
  texto: string;
  /** atributos somados (regra de ATRIBUTOS_EM_FRACAO) */
  atributos: Partial<Record<NomeAtributo, number>>;
}

// ===================================================================================================
// Partida: o que cada jogador tem (src/autobatalha/partida)
// ===================================================================================================

/** Uma unidade comprada (no banco ou no tabuleiro). */
export interface Unidade {
  uid: number;
  /** id de CampeaoDados */
  campeao: string;
  estrela: Estrela;
  /** forma atual (depende da estrela e das escolhas de evolução) */
  forma: string;
  /** ids de Item (componentes ou completos), até 3 */
  itens: string[];
  /** escolha da ult: id de classe (qual ult de classe usa) ou id de forma (transformação). Vazio = a primeira. */
  ult?: string;
  /** só Yu-Gi-Oh! */
  posicao?: 'ataque' | 'defesa';
  /** Stand: uid do usuário (no tabuleiro) */
  usuario?: number;
  /** bônus permanentes ganhos na partida (Overwatch, Deadlock), em fração */
  bonus?: { vida?: number; dano?: number };
}

export type Onde = { tipo: 'banco'; i: number } | { tipo: 'tabuleiro'; casa: CasaDono };

export interface Jogador {
  id: string;
  nome: string;
  bot: boolean;
  /** imagem do avatar (uma forma do set) */
  avatar: string;
  vida: number;
  ouro: number;
  nivel: number;
  xp: number;
  unidades: Record<number, Unidade>;
  /** 9 vagas; uid ou null */
  banco: (number | null)[];
  /** `${col},${lin}` → uid */
  tabuleiro: Record<string, number>;
  /** itens soltos (ids) */
  itens: string[];
  /** ids de CampeaoDados; null = vaga comprada */
  loja: (string | null)[];
  lojaTravada: boolean;
  /** positivo = vitórias seguidas, negativo = derrotas seguidas */
  sequencia: number;
  /** posição final (1..8) quando é eliminado ou vence */
  colocacao?: number;
  /** almas do Deadlock acumuladas */
  almas: number;
  /** id do último adversário (pra não repetir) */
  ultimosAdversarios: string[];
  /** evolução esperando escolha do jogador (forma alternativa) */
  escolhaPendente?: EscolhaEvolucao;
  /** outras escolhas de evolução esperando a vez (a primeira fica em escolhaPendente) */
  escolhasFila?: EscolhaEvolucao[];
  /** forma de nível 1 sorteada em cada vaga da loja (campeão com alternativas no nível 1); null = a padrão */
  lojaFormas?: (string | null)[];
  /** bots: traços que o bot decidiu montar (1 ou 2) */
  alvos?: string[];
}

export interface EscolhaEvolucao { uid: number; opcoes: string[] }

/** Uma opção do carrossel: campeão estrela 1 segurando um item. */
export interface OpcaoCarrossel {
  /** id de CampeaoDados */
  campeao: string;
  /** forma de nível 1 (a sorteada, quando o campeão tem alternativas no nível 1) */
  forma: string;
  /** id do item: componente nos estágios 2 a 4, completo do 5 em diante */
  item: string;
  /** id do jogador que pegou (null = ainda está no carrossel) */
  pegou: string | null;
  /** quem pegou estava com o banco cheio: o campeão foi vendido na hora pelo custo (o item ficou) */
  vendido?: true;
}

/** Carrossel do começo do estágio (fase 'carrossel'; a lógica está em partida/carrossel.ts). */
export interface Carrossel {
  opcoes: OpcaoCarrossel[];
  /** ordem de escolha: duplas de ids de jogador (da menor vida pra maior), liberadas uma a uma */
  grupos: string[][];
  /** quantos grupos já foram liberados */
  liberados: number;
}

export type TipoRodada = 'pvp' | 'monstros' | 'chefe';
export type Fase = 'carrossel' | 'planejamento' | 'luta' | 'resultado' | 'fim';

export interface Rodada { estagio: number; rodada: number; tipo: TipoRodada }

/** Força dos bots: no fácil compram e posicionam pior e sobem de nível mais tarde. */
export type Dificuldade = 'facil' | 'normal' | 'dificil';

export interface Partida {
  versao: 1;
  semente: number;
  /** força dos bots (partida salva antes disto = 'normal') */
  dificuldade?: Dificuldade;
  jogadores: Jogador[];
  /** id do jogador humano */
  voce: string;
  estagio: number;
  rodada: number;
  tipo: TipoRodada;
  fase: Fase;
  /** cópias restantes de cada campeão no pool compartilhado */
  pool: Record<string, number>;
  /** confrontos desta rodada: [idA, idB] (idB pode ser 'monstros' ou fantasma `fantasma:${id}`) */
  confrontos: [string, string][];
  /** monstros da rodada (PvE) */
  monstros: MonstroRodada[];
  /** carrossel em andamento (só na fase 'carrossel'; a partida é salva no planejamento, então nunca vai pro salvo) */
  carrossel?: Carrossel;
  /** resultado da luta do humano na rodada atual (pra tela) */
  ultimaLuta?: ResultadoLuta;
  /** histórico de cada jogador: 'v' | 'd' por rodada */
  historico: Record<string, ('v' | 'd')[]>;
  proximoUid: number;
  /** quantos sorteios a partida já fez: cada sorteio usa um gerador derivado de (semente, sorteios), então a
   *  partida carregada continua igual à que foi salva */
  sorteios?: number;
}

export interface MonstroRodada { monstro: MonstroDados; chefe: boolean; casa: CasaDono; atributos: Atributos }

// ===================================================================================================
// Combate (src/autobatalha/combate): entrada, resultado e gravação pra tela
// ===================================================================================================

/** Um lutador como a partida manda pro motor. */
export interface EntradaLutador {
  /** identificador estável dentro do time (uid da unidade, ou "m0", "m1" pros monstros) */
  id: string;
  /** unidade de jogador */
  unidade?: Unidade;
  /** monstro do Final Fantasy */
  monstro?: { dados: MonstroDados; chefe: boolean; atributos: Atributos };
  casa: CasaDono;
}

export interface EntradaTime {
  /** id do jogador, 'monstros' ou `fantasma:${id}` */
  dono: string;
  lutadores: EntradaLutador[];
}

export interface EstadoVisivel {
  id: string;
  lado: Lado;
  nome: string;
  img: string;
  custo: Custo;
  estrela: Estrela;
  casa: Casa;
  vida: number;
  vidaMax: number;
  escudo: number;
  mana: number;
  manaMax: number;
  vivo: boolean;
  status: Status[];
  itens: string[];
  monstro: boolean;
  chefe: boolean;
  stand: boolean;
}

export type EventoLuta =
  | { t: number; tipo: 'ataque'; de: string; para: string; distancia: number }
  | { t: number; tipo: 'dano'; para: string; valor: number; critico: boolean; danoTipo: TipoDano }
  | { t: number; tipo: 'cura'; para: string; valor: number }
  | { t: number; tipo: 'habilidade'; de: string; nome: string }
  | { t: number; tipo: 'morte'; id: string }
  | { t: number; tipo: 'visual'; efeito: EfeitoVisual; casas: Casa[]; de?: string }
  | { t: number; tipo: 'texto'; para: string; texto: string }
  | { t: number; tipo: 'transformar'; id: string; nome: string; img: string }
  | { t: number; tipo: 'surge'; estado: EstadoVisivel };

/** Fotografia da luta a cada tick (só o que muda de tick em tick). */
export interface Quadro {
  t: number;
  /** id → [col, lin, vida, escudo, mana, vivo(0/1)] */
  u: Record<string, [number, number, number, number, number, number]>;
  /** id → status ativos (só quem tem algum) */
  s?: Record<string, Status[]>;
  /** id → [vidaMax, manaMax], só de quem mudou desde o quadro anterior (transformação, buff de vida, invocado novo
   *  não entra: vem no 'surge') */
  max?: Record<string, [number, number]>;
}

export interface ResultadoLuta {
  vencedor: Lado | 'empate';
  /** ids vivos no fim (dos lutadores originais e invocados) */
  vivosA: string[];
  vivosB: string[];
  /** segundos de luta */
  duracao: number;
  /** dano causado por lutador (id), pro Overwatch */
  dano: Record<string, number>;
  /** abates por lutador (id), pro Deadlock */
  abates: Record<string, number>;
  /** ouro achado (Harvest) por lado */
  ouro: { a: number; b: number };
  /** gravação pra tela (só quando pedida) */
  gravacao?: {
    /** segundos por tick */
    passo: number;
    inicial: EstadoVisivel[];
    quadros: Quadro[];
    eventos: EventoLuta[];
  };
}

/** Assinatura do motor de combate. */
export type SimularLuta = (a: EntradaTime, b: EntradaTime, semente: number, gravar: boolean) => ResultadoLuta;
