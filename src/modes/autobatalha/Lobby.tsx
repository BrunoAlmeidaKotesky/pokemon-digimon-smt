// Lobby da Autobatalha: a sala antes da partida, no lugar da antiga tela inicial. À esquerda, os 8 jogadores (você,
// o anfitrião, e os 7 bots com o ícone e o estilo de tabuleiro que vão ter na partida); à direita, as suas escolhas
// (nome, ícone, tabuleiro), as regras da sala (só o anfitrião muda) e as suas preferências. Embaixo, começar ou
// continuar a partida salva.
//
// O estado separa a sala do jogador (api.ts: RegrasSala × EscolhasJogador × Preferencias), pensando num modo online:
// hoje o jogo é solo e você é sempre o anfitrião.
import { useState } from 'react';
import type { EstadoTela } from '../../autobatalha/api';
import type { LugarSala } from '../../autobatalha/tipos';
import { S, setCarregado } from '../../autobatalha/dados';
import { acoes } from '../../autobatalha/controle';
import { ESTILOS_TABULEIRO, nomeEstilo } from '../../autobatalha/estilos';
import { MAX_NOME, NOME_PADRAO } from '../../autobatalha/partida';
import { NOME_DIFICULDADE, Preferencias, RegrasDaSala, souAnfitriao } from './Configuracao';
import { JanelaIcones } from './Icones';
import { Foto, avatarDe, plural } from './comum';

// ---------- prévia do estilo do tabuleiro ----------
/** casas da prévia (caixa 100 × 60): 3 linhas de 4, as ímpares meia casa pra direita, como o tabuleiro */
const LARG_MINI = 22;
const CASAS_MINI = Array.from({ length: 12 }, (_, i) => {
  const lin = Math.floor(i / 4), col = i % 4;
  const cx = 1 + col * LARG_MINI + (lin & 1 ? LARG_MINI / 2 : 0) + LARG_MINI / 2;
  const cy = 4 + lin * LARG_MINI * 0.75 + LARG_MINI / 2;
  const r = (LARG_MINI / 2) * 0.92;
  const pts = [[0, -r], [r, -r / 2], [r, r / 2], [0, r], [-r, r / 2], [-r, -r / 2]].map(([x, y]) => `${(cx + x!).toFixed(1)},${(cy + y!).toFixed(1)}`).join(' ');
  return { pts, cx, cy: cy - r * 0.15 };
});

/** Prévia pequena de um estilo de tabuleiro: o fundo e algumas casas, com as cores do CSS do estilo. */
export function MiniEstilo({ id, className }: { id: string; className?: string }) {
  return (
    <span className={'ab-mini-tab' + (className ? ' ' + className : '')} data-estilo={id} aria-hidden="true">
      <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice">
        {CASAS_MINI.map((c, i) => (
          <g key={i}>
            <polygon className="c" points={c.pts} />
            <circle className="l" cx={c.cx} cy={c.cy} r={LARG_MINI * 0.24} />
          </g>
        ))}
      </svg>
    </span>
  );
}

/** Coroa do anfitrião. */
function Coroa() {
  return (
    <svg className="ab-coroa" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3 15l1-9 4 4 2-6 2 6 4-4 1 9z" fill="currentColor" />
    </svg>
  );
}

// ---------- lobby ----------
export function Lobby({ e, abrirPlanejador }: { e: EstadoTela; abrirPlanejador: () => void }) {
  const pronto = !e.carregando && !e.erro && setCarregado() && !!e.sala;
  const [icones, setIcones] = useState(false);
  const cfg = e.config;
  const anfitriao = souAnfitriao(e);
  const lugares = e.sala?.lugares ?? [];
  const eu = lugares.find(l => l.id === e.sala?.voce) ?? null;
  return (
    <div id="abLobby" className="panel ab-lobby">
      <div className="ab-lobby-cab">
        <div>
          <h2>Autobatalha <small>sala da partida</small></h2>
          <p className="mute">
            Monte um time com personagens de todas as franquias, junte cópias pra subir as estrelas, ative traços de origem e de classe e
            veja a luta acontecer sozinha nas casas hexagonais. Você contra 7 bots; ganha quem sobrar.
          </p>
        </div>
      </div>
      {e.carregando && <p id="abCarregando" className="mute">Carregando o set…</p>}
      {e.erro && (
        <p id="abErro" className="note bad">
          Não deu pra carregar o set: {e.erro}{' '}
          <button type="button" className="btn mini" onClick={() => void acoes.carregar()}>Tentar de novo</button>
        </p>
      )}

      <div className="ab-lobby-corpo">
        <section className="ab-lobby-bloco ab-sala" aria-labelledby="abSalaTitulo">
          <h3 id="abSalaTitulo">Jogadores <small>{lugares.length ? `${lugares.length}/8` : ''}</small></h3>
          <ol id="abSala" className="ab-sala-lista">
            {lugares.map(l => <Lugar key={l.id} l={l} voce={l.id === e.sala?.voce} dificuldade={NOME_DIFICULDADE[cfg.dificuldade]} />)}
            {!lugares.length && <li className="mute">{e.erro ? 'Sem o set, sem sala.' : 'Arrumando a sala…'}</li>}
          </ol>
          <p className="ab-lobby-nota">Os bots sorteiam o ícone e o tabuleiro a cada partida nova.</p>
        </section>

        <div className="ab-lobby-dir">
          <section className="ab-lobby-bloco ab-voce" aria-labelledby="abVoceTitulo">
            <h3 id="abVoceTitulo">Você <small>o que os outros jogadores veem</small></h3>
            <div className="ab-voce-topo">
              <button type="button" id="abIcone" className="ab-voce-icone" disabled={!pronto} onClick={() => setIcones(true)} title="Trocar o seu ícone">
                <Foto src={eu ? avatarDe(eu) : ''} nome={eu?.nome ?? NOME_PADRAO} className="redonda" />
                <span>Trocar ícone</span>
              </button>
              <div className="ab-voce-campos">
                <CampoNome nome={cfg.nome} />
                <p id="abIconeAtual" className="ab-voce-icone-txt">
                  <span className="mute">Ícone:</span> <b>{nomeDoIcone(cfg.avatar)}</b>
                  {cfg.avatar
                    ? <button type="button" id="abIconeSortear" className="btn mini" onClick={() => acoes.escolher({ avatar: null })}>Sortear</button>
                    : null}
                </p>
              </div>
            </div>
            <div className="ab-config-campo">
              <span>Seu tabuleiro <small>(na luta, a metade do adversário fica com o tabuleiro dele)</small></span>
              <div id="abEstilos" className="ab-estilos" role="radiogroup" aria-label="Estilo do tabuleiro">
                {ESTILOS_TABULEIRO.map(s => {
                  const on = cfg.estilo === s.id;
                  return (
                    <button key={s.id} type="button" role="radio" aria-checked={on} className={'ab-estilo-op' + (on ? ' on' : '')} data-estilo-op={s.id}
                      onClick={() => acoes.escolher({ estilo: s.id })}>
                      <MiniEstilo id={s.id} />
                      <span>{s.nome}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="ab-lobby-bloco" aria-labelledby="abRegrasTitulo">
            <h3 id="abRegrasTitulo">Regras da sala</h3>
            <p id="abRegrasNota" className="ab-lobby-nota">
              <Coroa /> {anfitriao ? 'Você é o anfitrião: só você muda as regras da sala.' : 'Só o anfitrião muda as regras da sala.'}
            </p>
            <RegrasDaSala cfg={cfg} anfitriao={anfitriao} naPartida={false} />
          </section>

          <section className="ab-lobby-bloco" aria-labelledby="abPrefsTitulo">
            <h3 id="abPrefsTitulo">Suas preferências <small>só mudam a sua tela</small></h3>
            <Preferencias cfg={cfg} naPartida={false} />
          </section>
        </div>
      </div>

      <div className="ab-lobby-acoes">
        <button type="button" id="abAbrirPlanejador" className="btn" disabled={!pronto} onClick={abrirPlanejador}>Planejador de times</button>
        <span className="grow" />
        {e.temSalva && <button type="button" id="abContinuar" className="btn" disabled={!pronto} onClick={() => acoes.continuar()}>Continuar a partida salva</button>}
        <button type="button" id="abNova" className="btn main" disabled={!pronto} onClick={() => acoes.novaPartida()}>Começar partida</button>
      </div>

      <details className="ab-ajuda">
        <summary>Como jogar</summary>
        <ul>
          <li>Clique numa carta da loja pra comprar. Três cópias iguais viram uma de estrela acima (numa linha evolutiva, a forma seguinte).</li>
          <li>Arraste do banco pro tabuleiro (o limite de unidades aparece em cima do tabuleiro), entre casas, de volta pro banco ou pra loja (vende).</li>
          <li>Arraste os itens soltos (Bakugan, à esquerda do tabuleiro) pra uma unidade; um componente solto em cima de outro vira um item completo.</li>
          <li>Passe o mouse em qualquer retrato pra ver atributos, habilidade, traços e a linha evolutiva; o botão direito deixa a dica fixa.</li>
          <li>Moedas que caem no tabuleiro durante a luta ficam lá: passe o mouse em cima pra pegar.</li>
          <li>
            Atalhos: <kbd>D</kbd> atualiza a loja, <kbd>F</kbd> compra XP, <kbd>E</kbd> vende a unidade debaixo do mouse, <kbd>W</kbd> manda a
            unidade debaixo do mouse do banco pro tabuleiro (ou de volta).
          </li>
        </ul>
      </details>

      {icones && pronto && <JanelaIcones atual={cfg.avatar} fechar={() => setIcones(false)} />}
    </div>
  );
}

/** nome do personagem do ícone escolhido (sorteado: sem escolha ou forma que saiu do set) */
function nomeDoIcone(forma: string | null): string {
  return forma && setCarregado() && S().temForma(forma) ? S().forma(forma).nome : 'sorteado a cada partida';
}

/** Um jogador na sala: ícone, nome, marcas (anfitrião, você, bot) e o estilo do tabuleiro. */
function Lugar({ l, voce, dificuldade }: { l: LugarSala; voce: boolean; dificuldade: string }) {
  return (
    <li className={'ab-lugar' + (voce ? ' eu' : '') + (l.bot ? ' bot' : '')} data-jogador={l.id} data-estilo-lugar={l.estilo}>
      <Foto src={avatarDe(l)} nome={l.nome} className="redonda" />
      <span className="txt">
        <b className="nm">{l.nome}</b>
        <span className="marcas">
          {l.anfitriao && <span className="ab-tag anfitriao" title="Muda as regras da sala"><Coroa />anfitrião</span>}
          {voce && <span className="ab-tag voce">você</span>}
          {l.bot && <span className="ab-tag" title="Dificuldade dos bots">bot · {dificuldade}</span>}
        </span>
      </span>
      <span className="estilo" title={`Tabuleiro: ${nomeEstilo(l.estilo)}`}>
        <MiniEstilo id={l.estilo} />
        <small>{nomeEstilo(l.estilo)}</small>
      </span>
    </li>
  );
}

/** Nome do jogador: o texto digitado fica como está; o salvo sai sem espaços sobrando (vazio = "Você"). */
function CampoNome({ nome }: { nome: string }) {
  const [txt, setTxt] = useState(nome);
  return (
    <label className="ab-config-campo">
      <span>Seu nome <small>(opcional)</small></span>
      <input id="abNome" type="text" value={txt} placeholder={NOME_PADRAO} maxLength={MAX_NOME} autoComplete="off" spellCheck={false}
        onChange={ev => { setTxt(ev.target.value); acoes.escolher({ nome: ev.target.value }); }}
        onBlur={() => setTxt(nome)} />
      <small className="mute">{plural(MAX_NOME, 'letra', 'letras')} no máximo</small>
    </label>
  );
}
