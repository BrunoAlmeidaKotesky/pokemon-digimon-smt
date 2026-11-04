// Carrossel do começo do estágio (fase 'carrossel'): as opções girando devagar num círculo, cada uma com a foto
// redonda da cor do custo e o item que ela segura (dica no hover, como no resto da aba), quem pegou cada uma (avatar em
// cima, opção apagada) e, ao lado, a ordem de escolha em duplas. Clicar numa opção pega (o controle confere se é a sua
// vez e avisa se não for). O estado vem pronto do controle (EstadoTela.carrossel); as regras estão em
// src/autobatalha/partida/carrossel.ts.
import type { CSSProperties } from 'react';
import type { EstadoCarrossel } from '../../autobatalha/api';
import type { Jogador, OpcaoCarrossel, Partida } from '../../autobatalha/tipos';
import { S } from '../../autobatalha/dados';
import { acoes } from '../../autobatalha/sessao';
import { propsDica } from './interacao';
import { avatarDe } from './Lateral';
import { Foto, IconeItem, custoAttr, formaOuNada, imgForma, nomeItem } from './comum';

const nomeDa = (o: OpcaoCarrossel) => formaOuNada(o.forma)?.nome ?? S().campeao(o.campeao).nome;
const segundos = (s: number) => `${Math.max(0, Math.ceil(s - 1e-6))} s`;

export function Carrossel({ c, partida }: { c: EstadoCarrossel; partida: Partida }) {
  const porId = new Map(partida.jogadores.map(j => [j.id, j]));
  const eu = partida.voce;
  const meuGrupo = c.grupos.findIndex(g => g.includes(eu));
  const minha = c.opcoes.find(o => o.pegou === eu);
  let status = '';
  if (minha) status = `Você pegou ${nomeDa(minha)}${minha.vendido ? ' (banco cheio: vendido)' : ''}`;
  else if (c.podePegar) status = 'Sua vez: clique num campeão';
  else if (meuGrupo >= c.liberados) status = `Sua vez em ${segundos(c.horarios[meuGrupo]! - c.tempo)}`;
  const n = Math.max(1, c.opcoes.length);
  return (
    <div id="abCarrossel" className={'ab-car' + (c.podePegar ? ' pode' : '')} data-liberados={c.liberados}>
      <div className="ab-car-palco">
        <div className="ab-car-roda">
          {c.opcoes.map((o, i) => (
            <Opcao key={i} o={o} i={i} angulo={(360 / n) * i} pode={c.podePegar} quem={o.pegou ? porId.get(o.pegou) : undefined} />
          ))}
        </div>
        <div className="ab-car-centro">
          <b className="tit">Carrossel</b>
          <span id="abCarStatus" className={'st' + (c.podePegar ? ' vez' : '')} role="status">{status}</span>
          <span className="tempo">fecha em <b id="abCarTempo">{segundos(c.fim - c.tempo)}</b></span>
        </div>
      </div>
      <Ordem c={c} porId={porId} eu={eu} />
    </div>
  );
}

function Opcao({ o, i, angulo, pode, quem }: { o: OpcaoCarrossel; i: number; angulo: number; pode: boolean; quem?: Jogador }) {
  const nome = nomeDa(o);
  const livre = o.pegou == null;
  const estilo = { '--a': `${angulo}deg` } as CSSProperties;
  return (
    <button type="button" className={'ab-car-op' + (livre ? '' : ' pegou') + (livre && pode ? ' pode' : '')} style={estilo}
      data-i={i} data-campeao={o.campeao} data-pegou={o.pegou ?? undefined} {...custoAttr(S().campeao(o.campeao).custo)}
      aria-disabled={!livre || !pode} aria-label={`${nome} com ${nomeItem(o.item)}${quem ? `, pego por ${quem.nome}` : ''}`}
      onClick={() => acoes.pegarCarrossel(i)}
      {...propsDica({ tipo: 'campeao', campeao: o.campeao, forma: o.forma, item: o.item, etiqueta: 'no carrossel: estrela 1' })}>
      <span className="dentro">
        <Foto src={imgForma(o.forma)} nome={nome} className="redonda retrato" />
        <IconeItem id={o.item} />
        {quem && <Foto src={avatarDe(quem)} nome={quem.nome} className="redonda quem" />}
        <span className="nm">{nome}</span>
      </span>
    </button>
  );
}

function Ordem({ c, porId, eu }: { c: EstadoCarrossel; porId: Map<string, Jogador>; eu: string }) {
  const vez = c.liberados - 1;
  return (
    <section className="ab-car-lado" aria-label="Ordem de escolha">
      <h4>Ordem de escolha</h4>
      <p className="mute">Menos vida escolhe antes, em duplas. O campeão vai pro banco; o item, pros itens soltos.</p>
      <ol id="abCarOrdem" className="ab-car-ordem">
        {c.grupos.map((g, k) => {
          const liberado = k < c.liberados;
          return (
            <li key={k} className={'ab-car-grupo' + (k === vez ? ' vez' : liberado ? ' foi' : ' espera')} data-grupo={k}>
              <span className="quando">{k === vez ? 'Vez agora' : liberado ? 'Liberados' : `Em ${segundos(c.horarios[k]! - c.tempo)}`}</span>
              {g.map(id => {
                const j = porId.get(id);
                if (!j) return null;
                const op = c.opcoes.find(o => o.pegou === id);
                return (
                  <span key={id} className={'ab-car-jog' + (id === eu ? ' eu' : '') + (op ? ' pegou' : '')} data-jogador={id}>
                    <Foto src={avatarDe(j)} nome={j.nome} className="redonda" />
                    <span className="nm">{j.nome}{id === eu && <small> (você)</small>}</span>
                    <span className="vida" title="Vida">{Math.max(0, j.vida)}</span>
                    {op ? (
                      <span className="levou" {...custoAttr(S().campeao(op.campeao).custo)} title={`Pegou ${nomeDa(op)} com ${nomeItem(op.item)}`}>
                        <Foto src={imgForma(op.forma)} nome={nomeDa(op)} className="redonda" />
                      </span>
                    ) : <span className="levou vazio" aria-hidden="true" />}
                  </span>
                );
              })}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
