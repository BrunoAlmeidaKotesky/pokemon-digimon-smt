// O transporte da Autobatalha online é o mesmo da aba Online (src/online/transport: PeerJS no site, BroadcastChannel
// com ?transporte=local nos testes); aqui ficam a escolha dele e os textos de erro de conexão.
import { pickTransport } from '../../online/transport';
import { TransportError, type Transport } from '../../online/types';

export { TransportError, type HostEndpoint, type Link, type Transport } from '../../online/types';

/** O transporte da página (PeerJS, ou o local com ?transporte=local). */
export const transporteDaPagina = (): Transport => pickTransport();

const PROBLEMA_DE_REDE = 'Algumas redes (Wi-Fi de empresa ou escola, alguns 4G) bloqueiam a conexão direta entre aparelhos: tente outra rede (por ' +
  'exemplo, o 4G no lugar do Wi-Fi) ou configure um servidor TURN em "Problemas de conexão?", na aba Online.';

/** Texto pra quem tenta criar (sem código) ou entrar numa sala. */
export function textoDoErro(e: unknown, codigo = ''): string {
  const tipo = e instanceof TransportError ? e.kind : null;
  switch (tipo) {
    case 'sala-nao-existe': return `Não achei a sala ${codigo}. Confira o código. Se a sala existia, o anfitrião fechou a página e ela acabou.`;
    case 'p2p-bloqueado': return `Achei a sala, mas não consegui conectar ao navegador do anfitrião. ${PROBLEMA_DE_REDE}`;
    case 'rede': return 'Não consegui falar com o servidor de convites (PeerJS). Confira a internet e tente de novo.';
    case 'navegador': return 'Este navegador não tem conexão direta (WebRTC). Tente o Chrome, o Edge, o Firefox ou o Safari atualizados.';
    case 'codigo-em-uso': return 'Não consegui criar a sala (código em uso). Tente de novo.';
    default: return `Não consegui conectar: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/** A queda é de rede (vale mostrar a dica de trocar de rede ou usar TURN). */
export const ehErroDeRede = (e: unknown): boolean => e instanceof TransportError && (e.kind === 'p2p-bloqueado' || e.kind === 'rede');
