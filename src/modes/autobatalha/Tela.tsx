// Tela da Autobatalha (carregada sob demanda pela aba, src/modes/autobatalha/Autobatalha.tsx): lobby (Lobby.tsx),
// partida e fim. O estado vem da sessão (src/autobatalha/sessao.ts: o controle no solo e no anfitrião online, ou o
// convidado online); a tela só lê EstadoTela e chama as ações
// (src/autobatalha/api.ts). Design: docs/tft/autobatalha.md.
//
// A partida ocupa a janela inteira (abaixo das abas do site) e escala com ela: `--k` no #autobatalha (1 = 1280×720)
// multiplica os tamanhos do CSS, e o tabuleiro mede o espaço que sobra pra escolher o tamanho das casas.
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Segmented } from '../../components/Controls';
import type { EstadoOnline, EstadoTela, EstadoVotacao } from '../../autobatalha/api';
import type { CasaDono, Jogador, Partida as PartidaDados } from '../../autobatalha/tipos';
import { COLUNAS, LINHAS_DONO } from '../../autobatalha/tipos';
import { setCarregado } from '../../autobatalha/dados';
import { chave } from '../../autobatalha/hex';
import { acoes, estadoAutobatalha, useAutobatalha } from '../../autobatalha/sessao';
import { estaVivo, humano, limiteTabuleiro, ondeEsta, rodadasDoEstagio, unidadesNoTabuleiro } from '../../autobatalha/partida';
import { alvoSobMouse, fecharDica, propsDica } from './interacao';
import { Dica, ImagemGrandeJanela } from './Dica';
import {
  Banco, DanoDaLuta, Fantasma, ItensSoltos, TabuleiroDono, TabuleiroLuta, atributosDe, estiloDoAdversario, ladoAdversario, lembrarVida, type Espaco,
  type LutaVista,
} from './Tabuleiro';
import { Loja } from './Loja';
import { Jogadores, Tracos } from './Lateral';
import { Planejador } from './Planejador';
import { Carrossel } from './Carrossel';
import { Informacoes, type AbaInfo } from './Info';
import { useSons } from './sons';
import { BotaoMudo, JanelaConfig, VELOCIDADES } from './Configuracao';
import { Coroa, Lobby } from './Lobby';
import { Foto, IconeRodada, avatarDe, estiloDe, formaOuNada, imgForma, nomeTraco, rotuloRodada } from './comum';

const FASE: Record<PartidaDados['fase'], string> = {
  carrossel: 'Carrossel', planejamento: 'Planejamento', luta: 'Luta', resultado: 'Resultado', fim: 'Fim',
};

/** Escala da aba pelo tamanho da janela: --k = 1 em 1280×720, até 2,4 (telas grandes). */
function useEscala(): void {
  useEffect(() => {
    const el = document.getElementById('autobatalha');
    if (!el) return;
    const medir = () => {
      const k = Math.min(2.4, Math.max(0.75, Math.min(window.innerWidth / 1280, window.innerHeight / 720)));
      el.style.setProperty('--k', k.toFixed(3));
    };
    medir();
    window.addEventListener('resize', medir);
    return () => {
      window.removeEventListener('resize', medir);
      el.style.removeProperty('--k');
    };
  }, []);
}

/** Tamanho do conteúdo de um elemento (ResizeObserver); 0 × 0 até a primeira medida. */
function useMedida(ref: RefObject<HTMLElement | null>): Espaco {
  const [m, setM] = useState<Espaco>({ largura: 0, altura: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entradas => {
      const r = entradas[0]?.contentRect;
      if (!r) return;
      setM(x => (Math.abs(x.largura - r.width) < 1 && Math.abs(x.altura - r.height) < 1 ? x : { largura: r.width, altura: r.height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return m;
}

export function Conteudo() {
  const e = useAutobatalha();
  const [planejador, setPlanejador] = useState(false);
  const [info, setInfo] = useState<{ aba?: AbaInfo; traco?: string } | null>(null);
  const [config, setConfig] = useState(false);
  const abrirPlanejador = useCallback(() => setPlanejador(true), []);
  const fecharPlanejador = useCallback(() => setPlanejador(false), []);
  const abrirInfo = useCallback((aba?: AbaInfo, traco?: string) => setInfo({ aba, traco }), []);
  const fecharInfo = useCallback(() => setInfo(null), []);
  useEscala();
  useSons(e);
  useEffect(() => { void acoes.carregar(); }, []);
  // fechar a aba no meio de um arrasto ou com a dica aberta
  useEffect(() => () => fecharDica(0, true), []);
  const p = e.partida;
  const eu = p?.jogadores.find(j => j.id === p.voce);
  const on = e.online;
  // eliminado, o placar da última luta ainda aparece; no solo o controle passa pra 'fim' depois. Online, a partida
  // continua pros outros: quem saiu vê a colocação (e o placar ao vivo) enquanto ela corre.
  const fora = !!on && !!p && !!eu && p.fase !== 'fim' && !estaVivo(eu) && !e.reproducao;
  const fim = p?.fase === 'fim' || fora;
  return (
    <>
      {on && <FaixaOnline on={on} />}
      {!p || !eu ? <Lobby e={e} abrirPlanejador={abrirPlanejador} /> : fim ? <Fim partida={p} eu={eu} online={on} /> : (
        <Jogo key={p.semente} e={e} p={p} eu={eu} abrirPlanejador={abrirPlanejador} abrirInfo={abrirInfo} abrirConfig={() => setConfig(true)} />
      )}
      {planejador && setCarregado() && <Planejador fechar={fecharPlanejador} />}
      {info && setCarregado() && <Informacoes eu={eu ?? null} fechar={fecharInfo} aba={info.aba} traco={info.traco} />}
      {config && <JanelaConfig e={e} fechar={() => setConfig(false)} />}
      {p && eu && !fim && p.fase !== 'carrossel' && <Janelas eu={eu} />}
      <Aviso texto={e.aviso} />
      {on?.situacao === 'encerrada' && <SalaEncerrada on={on} />}
      <Fantasma />
      <Dica estado={e} />
      <ImagemGrandeJanela />
    </>
  );
}

// ---------- partida ----------
/** Ordem das colunas pra achar casa livre: do meio pras pontas. */
const COLUNAS_DO_MEIO = Array.from({ length: COLUNAS }, (_, i) => i).sort((a, b) => Math.abs(a - (COLUNAS - 1) / 2) - Math.abs(b - (COLUNAS - 1) / 2) || a - b);

/** Primeira casa livre pra unidade: corpo a corpo na frente, quem ataca de longe atrás; do meio pras pontas. */
function casaLivre(j: Jogador, uid: number): CasaDono | null {
  const u = j.unidades[uid];
  const longe = u ? (atributosDe(u)?.alcance ?? 1) > 1 : false;
  const linhas = Array.from({ length: LINHAS_DONO }, (_, i) => (longe ? LINHAS_DONO - 1 - i : i));
  for (const lin of linhas) for (const col of COLUNAS_DO_MEIO) if (j.tabuleiro[chave({ col, lin })] == null) return { col, lin };
  return null;
}

/** Tecla W: a unidade debaixo do mouse vai do banco pro tabuleiro (primeira casa livre) ou do tabuleiro pro banco. */
function trocarComW(uid: number): void {
  const p = estadoAutobatalha().partida;
  if (!p) return;
  const j = humano(p);
  const onde = ondeEsta(j, uid);
  if (onde?.tipo === 'banco') {
    const casa = casaLivre(j, uid);
    if (casa) acoes.mover(uid, { tipo: 'tabuleiro', casa });
  } else if (onde?.tipo === 'tabuleiro') {
    const i = j.banco.indexOf(null);
    if (i >= 0) acoes.mover(uid, { tipo: 'banco', i });
  }
}

function Jogo({ e, p, eu, abrirPlanejador, abrirInfo, abrirConfig }: {
  e: EstadoTela; p: PartidaDados; eu: Jogador; abrirPlanejador: () => void; abrirInfo: (aba?: AbaInfo, traco?: string) => void; abrirConfig: () => void;
}) {
  const olhando = e.olhando && e.olhando !== p.voce ? p.jogadores.find(j => j.id === e.olhando) ?? null : null;
  const visto = olhando ?? eu;
  const rep = e.reproducao;
  const naLuta = !!rep && !olhando;
  const carrossel = p.fase === 'carrossel' && !olhando ? e.carrossel : null;
  const palco = useRef<HTMLDivElement>(null);
  const espaco = useMedida(palco);
  // a última luta terminada, pro painel de dano (fica até a próxima terminar)
  const [ultima, setUltima] = useState<LutaVista | null>(null);
  if (rep?.acabou && ultima?.rep.resultado !== rep.resultado) {
    setUltima({ rep, rotulo: `${p.estagio}-${p.rodada}`, adversario: ladoAdversario(p, rep.adversario).nome });
  }

  // a vida no planejamento, pra mostrar no fim da luta quanto ela custou
  useEffect(() => { if (p.fase === 'planejamento') lembrarVida(p, eu.vida); });
  // a partida ocupa a janela: volta pro topo da página
  useEffect(() => { window.scrollTo(0, 0); }, []);
  // atalhos: D atualiza, F compra XP, E vende e W troca banco ⇄ tabuleiro a unidade debaixo do mouse, Esc volta pro
  // seu tabuleiro
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
      else if (k === 'e' || k === 'w') {
        const a = alvoSobMouse();
        if (a?.tipo !== 'unidade' || !a.editavel) return;
        if (k === 'e') acoes.vender(a.uid);
        else trocarComW(a.uid);
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
  const planejando = !naLuta && !carrossel;
  const total = (p.estagio === 1 ? 2 / 3 : 1) * e.config.segundos;
  return (
    <div className={'ab-jogo fase-' + p.fase + (naLuta ? ' na-luta' : '') + (carrossel ? ' no-carrossel' : '')} data-fase={p.fase} data-estilo={estiloDe(eu)}>
      <Topo e={e} p={p} abrirPlanejador={abrirPlanejador} abrirInfo={abrirInfo} abrirConfig={abrirConfig} />
      <Tracos j={visto} eu={eu} abrirInfo={abrirInfo} />
      <div className="ab-centro">
        <ItensSoltos j={visto} editavel={!olhando} />
        {/* o estilo do tabuleiro de quem está sendo visto; na luta, a metade de cima é do adversário */}
        <div className="ab-area" data-estilo={estiloDe(visto)}>
          {naLuta && <span className="ab-campo-deles" data-estilo={estiloDoAdversario(p, rep.adversario)} aria-hidden="true" />}
          {planejando && (
            <div className="ab-area-cab">
              <span id="abLimite" className={'ab-limite' + (noTab > limite ? ' acima' : noTab < limite ? ' sobra' : '')}
                title="Unidades no tabuleiro / limite (o seu nível; Stands não contam)">
                <small>Unidades</small><b>{noTab}/{limite}</b>
              </span>
              {olhando ? (
                <span className="ab-olhando">
                  Tabuleiro de <b>{olhando.nome}</b> ({olhando.vida} de vida)
                  <button type="button" id="abVoltar" className="btn mini" onClick={() => acoes.olhar(null)}>Voltar pro meu</button>
                </span>
              ) : <span className="ab-frente">Frente: o adversário vem de cima</span>}
              {e.relogio != null && p.fase === 'planejamento' && !olhando
                ? <Contagem s={Math.max(0, Math.ceil(e.relogio))} total={total} />
                : <span className="ab-contagem-vazia" />}
            </div>
          )}
          <div className="ab-palco" ref={palco}>
            {espaco.largura > 0 && (naLuta ? <TabuleiroLuta partida={p} rep={rep} velocidade={e.config.velocidade} espaco={espaco} />
              : carrossel ? <Carrossel c={carrossel} partida={p} />
                : <TabuleiroDono j={visto} editavel={!olhando && p.fase === 'planejamento'} espaco={espaco} />)}
          </div>
        </div>
        <Banco j={visto} editavel={!olhando} />
      </div>
      <Jogadores partida={p} olhando={olhando?.id ?? null}>
        {ultima && !(rep && !rep.acabou) && <DanoDaLuta luta={ultima} />}
      </Jogadores>
      <Loja eu={eu} editavel={p.fase !== 'fim'} />
    </div>
  );
}

/** Contagem grande do planejamento, na área do tabuleiro: pulsa nos últimos 5 segundos. */
function Contagem({ s, total }: { s: number; total: number }) {
  const fim = s <= 5;
  return (
    <span id="abContagem" key={fim ? s : 'n'} className={'ab-contagem' + (fim ? ' fim' : '')} role="timer" aria-label={`${s} segundos pra luta`}
      title="Segundos até a luta começar">
      <small>luta em</small>
      <b>{s}</b>
      <i style={{ width: `${Math.max(0, Math.min(100, (s / Math.max(1, total)) * 100))}%` }} />
    </span>
  );
}

function Topo({ e, p, abrirPlanejador, abrirInfo, abrirConfig }: {
  e: EstadoTela; p: PartidaDados; abrirPlanejador: () => void; abrirInfo: (aba?: AbaInfo) => void; abrirConfig: () => void;
}) {
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
      {e.online && (
        <span id="abSalaTopo" className={'ab-sala-topo' + (e.online.situacao === 'reconectando' ? ' caiu' : '')}
          title={e.online.papel === 'anfitriao' ? 'Você é o anfitrião: a partida de todos roda nesta página (deixe ela aberta)' : 'Partida online'}>
          {e.online.papel === 'anfitriao' && <Coroa />}Sala <b>{e.online.codigo}</b>
        </span>
      )}
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
      {p.fase === 'planejamento' && <Votacao v={e.votacao} />}
      <button type="button" id="abInfoBtn" className="btn" title="Traços, receitas dos Bakugan, chances da loja e regras" onClick={() => abrirInfo()}>Informações</button>
      <button type="button" id="abPlanejador" className="btn" onClick={abrirPlanejador}>Planejador</button>
      <BotaoMudo volume={e.config.volume} id="abMudo" />
      <button type="button" id="abConfigBtn" className="ab-ico ab-engrenagem" title="Configuração" aria-label="Configuração" onClick={abrirConfig}>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 6.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zm7.2 4.5l-1.6-.4a5.7 5.7 0 0 0 0-1.4l1.6-.4-.9-2.5-1.5.7a6 6 0 0 0-1-1l.7-1.5L12 3l-.4 1.6a5.7 5.7 0 0 0-1.4 0L9.7 3l-2.5.9.7 1.5a6 6 0 0 0-1 1l-1.5-.7-.9 2.5 1.6.4a5.7 5.7 0 0 0 0 1.4l-1.6.4.9 2.5 1.5-.7a6 6 0 0 0 1 1l-.7 1.5 2.5.9.4-1.6a5.7 5.7 0 0 0 1.4 0l.4 1.6 2.5-.9-.7-1.5a6 6 0 0 0 1-1l1.5.7z" fill="currentColor" fillRule="evenodd" />
        </svg>
      </button>
      <BotaoSair online={e.online} />
    </div>
  );
}

/** "Pronto" do planejamento como votação: o placar (prontos/vivos, um ponto por jogador) e o botão que vota ou desfaz o
 *  voto. Quando todos votam, a luta começa na hora (no solo os bots já votaram: o seu voto fecha). */
function Votacao({ v }: { v: EstadoVotacao | null }) {
  const voce = !!v?.voce;
  const n = v?.prontos.length ?? 0;
  const total = v?.total ?? 0;
  return (
    <span className="ab-votacao">
      <span id="abVotos" className="ab-votos" role="status" title="Jogadores prontos pra luta: quando todos votam, ela começa na hora">
        Prontos <b>{n}/{total}</b>
        <span className="pontos" aria-hidden="true">{Array.from({ length: total }, (_, k) => <i key={k} className={k < n ? 'on' : undefined} />)}</span>
      </span>
      <button type="button" id="abPronto" className={'btn main ab-pronto' + (voce ? ' on' : '')} aria-pressed={voce}
        title={voce ? 'Você votou pronto. Clique pra desfazer o voto' : 'Votar pronto: quando todos votam, a luta começa na hora'}
        onClick={() => acoes.votarPronto()}>
        {voce ? '✓ Pronto' : 'Pronto'}
      </button>
    </span>
  );
}

function BotaoSair({ online }: { online: EstadoOnline | null }) {
  const [conf, setConf] = useState(false);
  // online: o convidado sai da sala (um bot joga no lugar dele); o anfitrião acaba a partida pra todos (a sala fica)
  const [titulo, confirmar] = !online ? ['Abandonar a partida e voltar pro início', 'Confirmar: abandonar']
    : online.papel === 'convidado' ? ['Sair da sala (um bot joga no seu lugar até o fim)', 'Confirmar: sair da sala']
      : ['Acabar a partida pra todos e voltar pra sala', 'Confirmar: acabar pra todos'];
  return (
    <button type="button" id="abSair" className={'btn' + (conf ? ' danger' : '')} onBlur={() => setConf(false)}
      title={titulo} onClick={() => (conf ? acoes.abandonar() : setConf(true))}>
      {conf ? confirmar : 'Sair'}
    </button>
  );
}

/** Aviso da conexão da sala online (reconectando, sem servidor de convites), em cima de tudo. */
function FaixaOnline({ on }: { on: EstadoOnline }) {
  if (on.situacao === 'encerrada' || !on.aviso) return null;
  return <div id="abOnlineAviso" className={'ab-online-aviso' + (on.situacao === 'reconectando' ? ' caiu' : '')} role="status">{on.aviso}</div>;
}

/** A sala acabou (o anfitrião saiu, tirou você, a conexão não voltou) ou não deu pra criar: o motivo e voltar pro solo. */
function SalaEncerrada({ on }: { on: EstadoOnline }) {
  return (
    <div className="ab-sobreposto">
      <div id="abSalaEncerrada" className="ab-janela panel" role="alertdialog" aria-modal="true" aria-label="A sala acabou">
        <h3>{on.papel === 'anfitriao' && !on.codigo ? 'Não deu pra criar a sala' : 'A sala acabou'}</h3>
        <p id="abSalaMotivo">{on.aviso}</p>
        <div className="ab-inicio-acoes">
          {on.versaoDiferente && <button type="button" className="btn" onClick={() => location.reload()}>Recarregar a página</button>}
          <button type="button" id="abSalaVoltar" className="btn main" onClick={() => acoes.sairDaSala()}>Voltar pro jogo sozinho</button>
        </div>
      </div>
    </div>
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
          <h3>{esc.motivo === 'compra'
            ? `${nome ? `${nome}: ` : ''}qual forma você leva?`
            : nome ? `${nome} vai evoluir: escolha a forma` : 'Escolha a forma da evolução'}</h3>
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
function Fim({ partida, eu, online }: { partida: PartidaDados; eu: Jogador; online: EstadoOnline | null }) {
  const col = eu.colocacao ?? partida.jogadores.filter(j => j.vida > eu.vida).length + 1;
  const ordem = [...partida.jogadores].sort((a, b) => (a.colocacao ?? 0) - (b.colocacao ?? 0) || b.vida - a.vida);
  const acabou = partida.fase === 'fim';
  return (
    <div id="abFim" className="panel stack ab-fim" data-acabou={acabou}>
      <h2>{!acabou ? `Você foi eliminado: ${col}º lugar` : col === 1 ? 'Você venceu a partida!' : `Você ficou em ${col}º lugar`}</h2>
      {!acabou && (
        <p id="abFimSegue" className="mute">
          A partida continua pros outros{online?.papel === 'anfitriao'
            ? ': deixe esta página aberta até ela acabar, porque é ela que roda a partida de todos.'
            : '. O placar aqui embaixo vai mudando até o fim.'}
        </p>
      )}
      <ol className="ab-fim-lista">
        {ordem.map(j => (
          <li key={j.id} className={j.id === eu.id ? 'eu' : undefined}>
            <Foto src={avatarDe(j)} nome={j.nome} className="redonda" />
            <span>{j.colocacao ? `${j.colocacao}º` : '—'}</span>
            <b>{j.nome}</b>
            <span className="mute">{j.vida > 0 ? `${j.vida} de vida` : 'eliminado'}</span>
          </li>
        ))}
      </ol>
      <div className="ab-inicio-acoes">
        {!online && (
          <>
            <button type="button" id="abDeNovo" className="btn main" onClick={() => acoes.novaPartida()}>Jogar de novo</button>
            <button type="button" id="abVoltarInicio" className="btn" onClick={() => acoes.abandonar()}>Voltar ao início</button>
          </>
        )}
        {online?.papel === 'anfitriao' && acabou && (
          <>
            <button type="button" id="abDeNovo" className="btn main" onClick={() => acoes.novaPartida()}>Jogar de novo com a sala</button>
            <button type="button" id="abVoltarInicio" className="btn" onClick={() => acoes.abandonar()}>Voltar pra sala</button>
          </>
        )}
        {online?.papel === 'convidado' && (
          <>
            {acabou && <span id="abEsperandoAnfitriao" className="mute">Esperando o anfitrião começar outra partida…</span>}
            <button type="button" id="abSairSalaFim" className="btn" onClick={() => acoes.sairDaSala()}>Sair da sala</button>
          </>
        )}
      </div>
    </div>
  );
}
