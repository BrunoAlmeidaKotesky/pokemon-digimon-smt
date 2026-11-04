// Estilos do tabuleiro da Autobatalha: só cores e fundo. Aqui ficam os ids e os nomes; as cores de cada um estão no
// CSS (src/modes/autobatalha/autobatalha.css, em [data-estilo="id"]), como variáveis do gramado, das casas e do aro.
// Cada jogador escolhe o seu no lobby (Jogador.tabuleiro); os bots sorteiam um na partida nova.

export interface EstiloTabuleiro {
  id: string;
  nome: string;
}

export const ESTILOS_TABULEIRO: readonly EstiloTabuleiro[] = [
  { id: 'gramado', nome: 'Gramado' },
  { id: 'deserto', nome: 'Deserto' },
  { id: 'neve', nome: 'Neve' },
  { id: 'vulcao', nome: 'Vulcão' },
  { id: 'oceano', nome: 'Oceano' },
  { id: 'noite', nome: 'Noite estrelada' },
  { id: 'floresta', nome: 'Floresta' },
  { id: 'arcano', nome: 'Roxo arcano' },
];

/** o verde de sempre: quem não escolheu nada (e partida salva antes dos estilos) */
export const ESTILO_PADRAO = 'gramado';

export const ehEstilo = (id: unknown): id is string => typeof id === 'string' && ESTILOS_TABULEIRO.some(e => e.id === id);
/** o id, se for de um estilo que existe; senão o padrão */
export const estiloOuPadrao = (id: unknown): string => (ehEstilo(id) ? id : ESTILO_PADRAO);
export const nomeEstilo = (id: string): string => ESTILOS_TABULEIRO.find(e => e.id === id)?.nome ?? id;
