// Interface entre a tela (src/modes/autobatalha) e o controle da partida (src/autobatalha/controle.ts).
// O controle guarda a partida em andamento, roda o relógio, os bots e as lutas, e avisa a tela a cada mudança
// (useSyncExternalStore, como src/state/app.ts). A tela só lê EstadoTela e chama Acoes.
import type { Componente, Onde, Partida, ResultadoLuta } from './tipos';

export type Velocidade = 1 | 2 | 4;

export interface Config {
  /** relógio da fase de planejamento ligado (senão espera o "Pronto") */
  relogio: boolean;
  /** segundos de planejamento (estágio 1 usa 2/3 disso) */
  segundos: number;
  velocidade: Velocidade;
}

export interface Reproducao {
  /** luta do humano nesta rodada, com gravação */
  resultado: ResultadoLuta;
  /** dono do lado B (adversário, 'monstros' ou fantasma) */
  adversario: string;
  /** o humano é o lado A */
  /** segundos de luta já mostrados */
  t: number;
  acabou: boolean;
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
  /** existe partida salva pra continuar */
  temSalva: boolean;
  /** presente do começo do estágio: 3 componentes pra escolher um (null = nada pendente) */
  presente: Componente[] | null;
  /** jogador cujo tabuleiro a tela está mostrando (olhar o adversário); null = o próprio */
  olhando: string | null;
  /** última mensagem curta pro jogador ("Banco cheio", "Ouro insuficiente") */
  aviso: string | null;
}

export interface Acoes {
  /** baixa o set (a tela chama ao abrir a aba) */
  carregar(): Promise<void>;
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
  escolherEvolucao(forma: string): void;
  escolherPresente(c: Componente): void;
  /** qual ult a unidade usa (id de classe ou de forma de transformação) */
  escolherUlt(uid: number, ult: string): void;
  /** Yu-Gi-Oh!: alterna ataque/defesa */
  alternarPosicao(uid: number): void;
  /** termina o planejamento agora */
  pronto(): void;
  velocidade(v: Velocidade): void;
  /** mostra o fim da luta direto */
  pularLuta(): void;
  configurar(c: Partial<Config>): void;
  /** mostra o tabuleiro de outro jogador (null = volta pro seu) */
  olhar(id: string | null): void;
}
