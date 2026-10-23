// Escolha do transporte: PeerJS de verdade, ou BroadcastChannel com ?transporte=local (testes).
import type { Transport } from '../types';
import { localTransport } from './local';
import { peerTransport } from './peer';

export { localTransport, peerTransport };

export function pickTransport(search: string = globalThis.location?.search ?? ''): Transport {
  return new URLSearchParams(search).get('transporte') === 'local' ? localTransport : peerTransport;
}
