// Interface entre a tela (src/modes/autobatalha) e o controle da partida (src/autobatalha/controle.ts).
// O controle guarda a partida em andamento, roda o relógio, os bots e as lutas, e avisa a tela a cada mudança
// (useSyncExternalStore, como src/state/app.ts). A tela só lê EstadoTela e chama Acoes.
import type { Dificuldade, EscolhasJogador, LugarSala, OpcaoCarrossel, Onde, Partida, ResultadoLuta } from './tipos';

export type Velocidade = 1 | 2 | 4;

/** Regras da sala: valem pra partida inteira e só o anfitrião muda (num modo online, valeriam pra todos). */
export interface RegrasSala {
  /** relógio da fase de planejamento ligado (senão espera todos votarem "Pronto") */
  relogio: boolean;
  /** segundos de planejamento (estágio 1 usa 2/3 disso) */
  segundos: number;
  /** força dos bots nas partidas novas */
  dificuldade: Dificuldade;
}

/** Preferências pessoais: só mudam a sua tela. */
export interface Preferencias {
  velocidade: Velocidade;
  /** volume dos sons, 0 (mudo) a 1 */
  volume: number;
}

/** O que fica salvo em `pdx-autobatalha-config`: as regras da sala (do anfitrião), as suas escolhas de jogador
 *  (nome, ícone, estilo do tabuleiro; tipos.ts) e as preferências. Num só objeto, como sempre foi salvo. */
export interface Config extends RegrasSala, EscolhasJogador, Preferencias {}

/** A sala antes da partida (o lobby). */
export interface EstadoSala {
  /** semente da próxima partida: os bots aparecem no lobby como vão estar nela */
  semente: number;
  /** id de quem muda as regras da sala */
  anfitriao: string;
  /** id do jogador desta tela */
  voce: string;
  /** os 8 lugares: você primeiro, depois os bots */
  lugares: LugarSala[];
}

export interface Reproducao {
  /** luta do humano nesta rodada, com gravação */
  resultado: ResultadoLuta;
  /** dono do lado B (adversário, 'monstros' ou fantasma) */
  adversario: string;
  /** o humano é o lado A */
  /** segundos de luta já mostrados */
  t: number;
  /** false durante a apresentação dos dois lados (o "clash", MS_CLASH no controle) antes da luta correr; t fica em 0 */
  comecou: boolean;
  acabou: boolean;
}

/** O carrossel do começo do estágio, pra tela (fase 'carrossel'). */
export interface EstadoCarrossel {
  /** as opções (campeão, forma, item e quem pegou), na ordem em que ficam no círculo */
  opcoes: OpcaoCarrossel[];
  /** ordem de escolha: duplas de ids de jogador, da menor vida pra maior */
  grupos: string[][];
  /** quantos grupos já foram liberados (os ids liberados são grupos.slice(0, liberados)) */
  liberados: number;
  /** segundo (desde o começo do carrossel) em que cada grupo é liberado */
  horarios: number[];
  /** segundos desde o começo do carrossel */
  tempo: number;
  /** segundo em que o carrossel acaba (quem não pegou leva uma ao acaso); encurta quando todos já pegaram */
  fim: number;
  /** o humano está liberado, vivo e ainda não pegou: pode clicar numa opção */
  podePegar: boolean;
}

/** A votação do "Pronto" no planejamento, pra tela (o voto de cada um fica em Jogador.pronto, na partida). Quando
 *  todos os vivos votam, o planejamento acaba na hora. Os bots votam assim que jogam (no solo, logo no começo). */
export interface EstadoVotacao {
  /** ids dos jogadores vivos que já votaram pronto */
  prontos: string[];
  /** jogadores vivos (quem vota) */
  total: number;
  /** você já votou */
  voce: boolean;
}

export interface EstadoTela {
  /** set ainda baixando */
  carregando: boolean;
  erro: string | null;
  partida: Partida | null;
  /** segundos que faltam no planejamento (null = sem relógio ou fora do planejamento) */
  relogio: number | null;
  reproducao: Reproducao | null;
  config: Config;
  /** a sala da próxima partida (lobby); null até o set carregar */
  sala: EstadoSala | null;
  /** existe partida salva pra continuar */
  temSalva: boolean;
  /** carrossel do começo do estágio (null = fora da fase 'carrossel') */
  carrossel: EstadoCarrossel | null;
  /** votação do "Pronto" (null = fora do planejamento) */
  votacao: EstadoVotacao | null;
  /** jogador cujo tabuleiro a tela está mostrando (olhar o adversário); null = o próprio */
  olhando: string | null;
  /** última mensagem curta pro jogador ("Banco cheio", "Ouro insuficiente") */
  aviso: string | null;
}

export interface Acoes {
  /** baixa o set (a tela chama ao abrir a aba) */
  carregar(): Promise<void>;
  /** começa a partida com as regras da sala e as suas escolhas; sem semente, a da sala (os bots como o lobby mostra) */
  novaPartida(semente?: number): void;
  continuar(): void;
  abandonar(): void;

  /** compra a carta da vaga i da loja */
  comprar(i: number): void;
  vender(uid: number): void;
  atualizarLoja(): void;
  comprarXp(): void;
  travarLoja(): void;
  /** move uma unidade (banco ⇄ tabuleiro, troca se a casa estiver ocupada). Stand solto numa casa ao lado de uma
   *  unidade de outra origem fica preso a ela; solto em cima dela, vai pra casa livre ao lado. */
  mover(uid: number, para: Onde): void;
  /** equipa o item da posição i dos itens soltos na unidade (2 componentes viram o Bakugan completo) */
  equipar(i: number, uid: number): void;
  /** junta dois componentes dos itens soltos (o da posição i solto em cima do da posição k) no Bakugan completo */
  juntarItens(i: number, k: number): void;
  escolherEvolucao(forma: string): void;
  /** pega a opção i do carrossel (só depois de liberado, uma vez por carrossel) */
  pegarCarrossel(i: number): void;
  /** recolhe a moeda i do chão do seu tabuleiro (Jogador.moedas) */
  pegarMoeda(i: number): void;
  /** qual ult a unidade usa (id de classe ou de forma de transformação) */
  escolherUlt(uid: number, ult: string): void;
  /** Yu-Gi-Oh!: alterna ataque/defesa */
  alternarPosicao(uid: number): void;
  /** vota pronto (ou desfaz o voto, se já votou): com todos os vivos prontos, o planejamento acaba na hora */
  votarPronto(): void;
  /** vota pronto (sem alternar; já votado, não muda nada). No solo os bots já votaram: termina o planejamento */
  pronto(): void;
  velocidade(v: Velocidade): void;
  /** mostra o fim da luta direto */
  pularLuta(): void;
  /** muda a configuração salva; as regras da sala só mudam se você for o anfitrião */
  configurar(c: Partial<Config>): void;
  /** regras da sala (relógio, segundos, dificuldade): só o anfitrião */
  mudarRegras(c: Partial<RegrasSala>): void;
  /** as suas escolhas na sala (nome, ícone, estilo do tabuleiro) */
  escolher(c: Partial<EscolhasJogador>): void;
  /** mostra o tabuleiro de outro jogador (null = volta pro seu) */
  olhar(id: string | null): void;
}
