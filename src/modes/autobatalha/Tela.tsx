// Tela da Autobatalha (carregada sob demanda pela aba, src/modes/autobatalha/Autobatalha.tsx): início, partida e
// fim. O estado da partida fica em src/autobatalha/controle.ts; a tela só lê EstadoTela e chama as ações
// (src/autobatalha/api.ts). Design: docs/tft/autobatalha.md.
import { useCallback, useEffect, useState } from 'react';
import { Segmented, Stepper, Switch } from '../../components/Controls';
import type { EstadoTela, Velocidade } from '../../autobatalha/api';
import type { Jogador, Partida as PartidaDados } from '../../autobatalha/tipos';
import { setCarregado } from '../../autobatalha/dados';
import { acoes, useAutobatalha } from '../../autobatalha/controle';
import { limiteTabuleiro, rodadasDoEstagio, unidadesNoTabuleiro } from '../../autobatalha/partida';
import { alvoSobMouse, fecharDica, propsDica } from './interacao';
import { Dica } from './Dica';
import { Banco, Fantasma, ItensSoltos, TabuleiroDono, TabuleiroLuta, lembrarVida } from './Tabuleiro';
import { Loja } from './Loja';
import { Jogadores, Tracos } from './Lateral';
import { Planejador } from './Planejador';
import { Carrossel } from './Carrossel';
import { Foto, IconeRodada, formaOuNada, imgForma, nomeTraco, rotuloRodada } from './comum';

const VELOCIDADES: { value: Velocidade; label: string }[] = [{ value: 1, label: '1×' }, { value: 2, label: '2×' }, { value: 4, label: '4×' }];
const FASE: Record<PartidaDados['fase'], string> = {
  carrossel: 'Carrossel', planejamento: 'Planejamento', luta: 'Luta', resultado: 'Resultado', fim: 'Fim',
};

export function Conteudo() {
  const e = useAutobatalha();
  const [planejador, setPlanejador] = useState(false);
  const abrirPlanejador = useCallback(() => setPlanejador(true), []);
  const fecharPlanejador = useCallback(() => setPlanejador(false), []);
  useEffect(() => { void acoes.carregar(); }, []);
  // fechar a aba no meio de um arrasto ou com a dica aberta
  useEffect(() => () => fecharDica(0, true), []);
  const p = e.partida;
  const eu = p?.jogadores.find(j => j.id === p.voce);
  // eliminado, o placar da última luta ainda aparece; o controle passa pra 'fim' depois
  const fim = p?.fase === 'fim';
  return (
    <>
      {!p || !eu ? <Inicio e={e} abrirPlanejador={abrirPlanejador} /> : fim ? <Fim partida={p} eu={eu} /> : (
        <Jogo e={e} p={p} eu={eu} abrirPlanejador={abrirPlanejador} />
      )}
      {planejador && setCarregado() && <Planejador fechar={fecharPlanejador} />}
      {p && eu && !fim && p.fase !== 'carrossel' && <Janelas eu={eu} />}
      <Aviso texto={e.aviso} />
      <Fantasma />
      <Dica estado={e} />
    </>
  );
}

// ---------- início ----------
function Inicio({ e, abrirPlanejador }: { e: EstadoTela; abrirPlanejador: () => void }) {
  const pronto = !e.carregando && !e.erro && setCarregado();
  const cfg = e.config;
  return (
    <div className="panel stack ab-inicio">
      <div>
        <h2>Autobatalha</h2>
        <p className="mute">
          Monte um time com personagens de todas as franquias, junte cópias pra subir as estrelas, ative traços de origem e
          de classe e veja a luta acontecer sozinha nas casas hexagonais. Você contra 7 bots; ganha quem sobrar.
        </p>
      </div>
      {e.carregando && <p id="abCarregando" className="mute">Carregando o set…</p>}
      {e.erro && (
        <p id="abErro" className="note bad">
          Não deu pra carregar o set: {e.erro}{' '}
          <button type="button" className="btn mini" onClick={() => void acoes.carregar()}>Tentar de novo</button>
        </p>
      )}
      <div className="ab-inicio-acoes">
        <button type="button" id="abNova" className="btn main" disabled={!pronto} onClick={() => acoes.novaPartida()}>Nova partida</button>
        {e.temSalva && <button type="button" id="abContinuar" className="btn" disabled={!pronto} onClick={() => acoes.continuar()}>Continuar a partida salva</button>}
        <button type="button" id="abAbrirPlanejador" className="btn" disabled={!pronto} onClick={abrirPlanejador}>Planejador de times</button>
      </div>
      <div className="ab-config">
        <Switch id="abRelogio" checked={cfg.relogio} onChange={v => acoes.configurar({ relogio: v })} title="Relógio no planejamento">
          Desligado, a rodada espera você apertar Pronto.
        </Switch>
        <label className="ab-config-campo">
          <span>Segundos de planejamento</span>
          <Stepper id="abSegundos" value={cfg.segundos} min={10} max={120} disabled={!cfg.relogio} ariaLabel="Segundos de planejamento"
            onChange={v => acoes.configurar({ segundos: v })} />
        </label>
        <div className="ab-config-campo">
          <span>Velocidade da luta</span>
          <Segmented id="abVelInicio" ariaLabel="Velocidade da luta" value={cfg.velocidade} options={VELOCIDADES} onChange={v => acoes.configurar({ velocidade: v })} />
        </div>
      </div>
      <details className="ab-ajuda">
        <summary>Como jogar</summary>
        <ul>
          <li>Clique numa carta da loja pra comprar. Três cópias iguais viram uma de estrela acima (numa linha evolutiva, a forma seguinte).</li>
          <li>Arraste do banco pro tabuleiro (o nível é o limite de unidades), entre casas, de volta pro banco ou pra loja (vende).</li>
          <li>Arraste os itens soltos (Bakugan) pra uma unidade; dois componentes viram um item completo.</li>
          <li>Passe o mouse em qualquer retrato pra ver atributos, habilidade, traços e a linha evolutiva.</li>
          <li>Atalhos: <kbd>D</kbd> atualiza a loja, <kbd>F</kbd> compra XP, <kbd>E</kbd> vende a unidade debaixo do mouse.</li>
        </ul>
      </details>
    </div>
  );
}

// ---------- partida ----------
function Jogo({ e, p, eu, abrirPlanejador }: { e: EstadoTela; p: PartidaDados; eu: Jogador; abrirPlanejador: () => void }) {
  const olhando = e.olhando && e.olhando !== p.voce ? p.jogadores.find(j => j.id === e.olhando) ?? null : null;
  const visto = olhando ?? eu;
  const rep = e.reproducao;
  const naLuta = !!rep && !olhando;
  const carrossel = p.fase === 'carrossel' && !olhando ? e.carrossel : null;

  // a vida no planejamento, pra mostrar no fim da luta quanto ela custou
  useEffect(() => { if (p.fase === 'planejamento') lembrarVida(p, eu.vida); });
  // a partida ocupa a tela: rola até o topo dela ao começar
  useEffect(() => { document.getElementById('autobatalha')?.scrollIntoView({ block: 'start' }); }, []);
  // atalhos: D atualiza, F compra XP, E vende a unidade debaixo do mouse, Esc volta pro seu tabuleiro
  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null;
      if (t && (['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName) || t.isContentEditable)) return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat) return;
      // planejador ou janelinha aberta: sem atalhos (o Esc é deles)
      if (document.querySelector('#autobatalha .ab-sobreposto')) return;
      const k = ev.key.toLowerCase();
      if (k === 'd') acoes.atualizarLoja();
      else if (k === 'f') acoes.comprarXp();
      else if (k === 'e') {
        const a = alvoSobMouse();
        if (a?.tipo !== 'unidade' || !a.editavel) return;
        acoes.vender(a.uid);
        fecharDica(0, true);
      } else if (k === 'escape') acoes.olhar(null);
      else return;
      ev.preventDefault();
    };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, []);

  const noTab = unidadesNoTabuleiro(visto, false).length;
  const limite = limiteTabuleiro(visto);
  return (
    <div className={'ab-jogo fase-' + p.fase + (naLuta ? ' na-luta' : '') + (carrossel ? ' no-carrossel' : '')} data-fase={p.fase}>
      <Topo e={e} p={p} abrirPlanejador={abrirPlanejador} />
      <Tracos j={visto} />
      <div className="ab-centro">
        <div className="ab-area">
          {naLuta ? <TabuleiroLuta partida={p} rep={rep} velocidade={e.config.velocidade} /> : carrossel ? <Carrossel c={carrossel} partida={p} /> : (
            <>
              <div className="ab-area-cab">
                {olhando ? (
                  <span className="ab-olhando">
                    Tabuleiro de <b>{olhando.nome}</b> ({olhando.vida} de vida)
                    <button type="button" id="abVoltar" className="btn mini" onClick={() => acoes.olhar(null)}>Voltar pro meu</button>
                  </span>
                ) : <span className="mute">Frente do seu lado (o adversário vem de cima)</span>}
                <span id="abLimite" className={'ab-limite' + (noTab > limite ? ' acima' : noTab < limite ? ' sobra' : '')}
                  title="Unidades no tabuleiro / limite do nível (Stands não contam)">{noTab}/{limite}</span>
              </div>
              <TabuleiroDono j={visto} editavel={!olhando && p.fase === 'planejamento'} />
            </>
          )}
        </div>
        <div className="ab-baixo">
          <Banco j={visto} editavel={!olhando} />
          <ItensSoltos j={visto} editavel={!olhando} />
        </div>
      </div>
      <Jogadores partida={p} olhando={olhando?.id ?? null} />
      <Loja eu={eu} editavel={p.fase !== 'fim'} />
    </div>
  );
}

function Topo({ e, p, abrirPlanejador }: { e: EstadoTela; p: PartidaDados; abrirPlanejador: () => void }) {
  const rodadas = rodadasDoEstagio(p.estagio);
  const rep = e.reproducao;
  const total = (p.estagio === 1 ? 2 / 3 : 1) * e.config.segundos;
  return (
    <div id="abTopo" className="ab-topo">
      <div id="abRodada" className="ab-rodada" data-rodada={`${p.estagio}-${p.rodada}`}>
        <b>{p.estagio}-{p.rodada}</b>
        <span className="mute">{rotuloRodada(p.tipo)}</span>
      </div>
      <ol className="ab-rodadas" aria-label="Rodadas do estágio">
        {rodadas.map((t, i) => (
          <li key={i} className={i + 1 === p.rodada ? 'atual' : i + 1 < p.rodada ? 'feita' : undefined} title={`${p.estagio}-${i + 1}: ${rotuloRodada(t)}`}>
            <IconeRodada tipo={t} />
          </li>
        ))}
      </ol>
      <span className="ab-fase">{FASE[p.fase]}</span>
      {e.relogio != null && (
        <span id="abRelogioTopo" className={'ab-relogio' + (e.relogio <= 5 ? ' fim' : '')} title="Tempo de planejamento">
          <b>{Math.max(0, Math.ceil(e.relogio))}</b>s
          <i style={{ width: `${Math.max(0, Math.min(100, (e.relogio / Math.max(1, total)) * 100))}%` }} />
        </span>
      )}
      <span className="grow" />
      {rep && !rep.acabou && (
        <>
          <Segmented id="abVelocidade" ariaLabel="Velocidade da luta" value={e.config.velocidade} options={VELOCIDADES} onChange={v => acoes.velocidade(v)} />
          <button type="button" id="abPular" className="btn" onClick={() => acoes.pularLuta()}>Pular luta</button>
        </>
      )}
      {p.fase === 'planejamento' && <button type="button" id="abPronto" className="btn main" onClick={() => acoes.pronto()}>Pronto</button>}
      <button type="button" id="abPlanejador" className="btn" onClick={abrirPlanejador}>Planejador</button>
      <BotaoSair />
    </div>
  );
}

function BotaoSair() {
  const [conf, setConf] = useState(false);
  return (
    <button type="button" id="abSair" className={'btn' + (conf ? ' danger' : '')} onBlur={() => setConf(false)}
      title="Abandonar a partida e voltar pro início" onClick={() => (conf ? acoes.abandonar() : setConf(true))}>
      {conf ? 'Confirmar: abandonar' : 'Sair'}
    </button>
  );
}

// ---------- janelinha da evolução (fora do carrossel) ----------
function Janelas({ eu }: { eu: Jogador }) {
  const esc = eu.escolhaPendente;
  if (esc) {
    const u = eu.unidades[esc.uid];
    const nome = u ? formaOuNada(u.forma)?.nome ?? '' : '';
    return (
      <div className="ab-sobreposto">
        <div id="abEscolha" className="ab-janela panel" role="dialog" aria-modal="true" aria-label="Escolha da evolução">
          <h3>{nome ? `${nome} vai evoluir: escolha a forma` : 'Escolha a forma da evolução'}</h3>
          <div className="ab-opcoes">
            {esc.opcoes.map(f => {
              const fd = formaOuNada(f);
              return (
                <button key={f} type="button" className="ab-opcao" data-forma={f} onClick={() => acoes.escolherEvolucao(f)}
                  {...(u ? propsDica({ tipo: 'campeao', campeao: u.campeao, forma: f, estrela: u.estrela }) : {})}>
                  <Foto src={imgForma(f)} nome={fd?.nome ?? f} className="redonda" />
                  <b>{fd?.nome ?? f}</b>
                  <small>{(fd?.classes ?? []).map(nomeTraco).join(', ')}</small>
                </button>
              );
            })}
          </div>
          <p className="mute">Sem resposta até o fim do relógio, sai uma ao acaso.</p>
        </div>
      </div>
    );
  }
  return null;
}

/** Mensagem curta do controle ("Ouro insuficiente"): some sozinha. */
function Aviso({ texto }: { texto: string | null }) {
  const [escondido, setEscondido] = useState<string | null>(null);
  const [antes, setAntes] = useState(texto);
  if (antes !== texto) {
    setAntes(texto);
    setEscondido(null);
  }
  useEffect(() => {
    if (!texto) return;
    const t = setTimeout(() => setEscondido(texto), 2600);
    return () => clearTimeout(t);
  }, [texto]);
  if (!texto || escondido === texto) return null;
  return <div id="abAviso" className="ab-aviso" role="status">{texto}</div>;
}

// ---------- fim ----------
function Fim({ partida, eu }: { partida: PartidaDados; eu: Jogador }) {
  const col = eu.colocacao ?? partida.jogadores.filter(j => j.vida > eu.vida).length + 1;
  const ordem = [...partida.jogadores].sort((a, b) => (a.colocacao ?? 0) - (b.colocacao ?? 0) || b.vida - a.vida);
  return (
    <div id="abFim" className="panel stack ab-fim">
      <h2>{col === 1 ? 'Você venceu a partida!' : `Você ficou em ${col}º lugar`}</h2>
      <ol className="ab-fim-lista">
        {ordem.map(j => (
          <li key={j.id} className={j.id === eu.id ? 'eu' : undefined}>
            <Foto src={formaOuNada(j.avatar) ? imgForma(j.avatar) : ''} nome={j.nome} className="redonda" />
            <span>{j.colocacao ? `${j.colocacao}º` : '—'}</span>
            <b>{j.nome}</b>
            <span className="mute">{j.vida > 0 ? `${j.vida} de vida` : 'eliminado'}</span>
          </li>
        ))}
      </ol>
      <div className="ab-inicio-acoes">
        <button type="button" id="abDeNovo" className="btn main" onClick={() => acoes.novaPartida()}>Jogar de novo</button>
        <button type="button" id="abVoltarInicio" className="btn" onClick={() => acoes.abandonar()}>Voltar ao início</button>
      </div>
    </div>
  );
}
