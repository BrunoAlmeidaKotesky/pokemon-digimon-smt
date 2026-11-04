// Transporte de mentira pros testes da Autobatalha online: anfitrião e convidados no mesmo processo, mensagens
// entregues numa microtarefa (como a rede, nunca no meio de quem mandou). `derrubar` simula a queda da conexão.
import { createLink, type LinkCore } from '../../online/transport/link';
import { TransportError, type HostEndpoint, type Link, type Transport } from '../../online/types';

export interface Conexao { convidado: LinkCore; anfitriao: LinkCore }

export interface TransporteDeTeste extends Transport {
  conexoes: Conexao[];
  /** derruba a conexão (os dois lados veem fechar) */
  derrubar(c: Conexao): void;
  /** fecha o anfitrião do código, como a página fechando sem avisar */
  sumirAnfitriao(code: string): void;
}

export function transporteDeTeste(): TransporteDeTeste {
  const hosts = new Map<string, { entrar(l: Link): void; links: Set<LinkCore> }>();
  const conexoes: Conexao[] = [];
  const t: TransporteDeTeste = {
    name: 'local',
    conexoes,
    async host(code: string): Promise<HostEndpoint> {
      if (hosts.has(code)) throw new TransportError('codigo-em-uso');
      let ouvir: ((l: Link) => void) | null = null;
      const fila: Link[] = [];
      const links = new Set<LinkCore>();
      hosts.set(code, { entrar: l => (ouvir ? ouvir(l) : fila.push(l)), links });
      return {
        code,
        onLink(cb) { ouvir = cb; for (const l of fila.splice(0)) cb(l); },
        onTrouble() { /* sem servidor de convites */ },
        close() {
          hosts.delete(code);
          for (const l of links) l.link.close();
        },
      };
    },
    async join(code: string): Promise<Link> {
      const h = hosts.get(code);
      if (!h) throw new TransportError('sala-nao-existe');
      const outro: { lado: LinkCore | null } = { lado: null };
      const convidado = createLink({ send: m => queueMicrotask(() => outro.lado?.deliver(m)), close: () => queueMicrotask(() => outro.lado?.end()) });
      const anfitriao = createLink({ send: m => queueMicrotask(() => convidado.deliver(m)), close: () => queueMicrotask(() => convidado.end()) });
      outro.lado = anfitriao;
      const c = { convidado, anfitriao };
      conexoes.push(c);
      h.links.add(anfitriao);
      h.entrar(anfitriao.link);
      return convidado.link;
    },
    derrubar(c) { c.convidado.end(); c.anfitriao.end(); },
    sumirAnfitriao(code) {
      const h = hosts.get(code);
      hosts.delete(code);
      for (const l of h?.links ?? []) l.end();
      for (const c of conexoes) if (h?.links.has(c.anfitriao)) c.convidado.end();
    },
  };
  return t;
}
