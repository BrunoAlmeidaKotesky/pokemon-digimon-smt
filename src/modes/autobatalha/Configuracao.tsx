// Configuração da Autobatalha, separada como no controle (api.ts): as regras da sala (relógio, segundos, dificuldade
// dos bots), que só o anfitrião muda, e as preferências pessoais (velocidade da luta, volume). O lobby mostra as duas
// partes; na partida, a engrenagem abre a janela com as duas.
import { useEffect } from 'react';
import { Segmented, Stepper, Switch } from '../../components/Controls';
import type { Config, EstadoTela, Velocidade } from '../../autobatalha/api';
import type { Dificuldade } from '../../autobatalha/tipos';
import { acoes } from '../../autobatalha/controle';

export const VELOCIDADES: { value: Velocidade; label: string }[] = [{ value: 1, label: '1×' }, { value: 2, label: '2×' }, { value: 4, label: '4×' }];
export const DIFICULDADES: { value: Dificuldade; label: string }[] = [{ value: 'facil', label: 'Fácil' }, { value: 'normal', label: 'Normal' }, { value: 'dificil', label: 'Difícil' }];
export const NOME_DIFICULDADE: Record<Dificuldade, string> = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' };

/** você é quem muda as regras da sala (sem sala ainda: o jogo é solo, então sim) */
export const souAnfitriao = (e: EstadoTela): boolean => !e.sala || e.sala.anfitriao === e.sala.voce;

/** último volume ouvido antes do mudo (o botão de mudo volta pra ele) */
let volumeAntes = 0.6;
function alternarMudo(v: number): void {
  if (v > 0) {
    volumeAntes = v;
    acoes.configurar({ volume: 0 });
  } else acoes.configurar({ volume: volumeAntes > 0 ? volumeAntes : 0.6 });
}

/** Regras da sala: relógio, segundos e dificuldade. Quem não é o anfitrião vê, mas não muda. Na partida, a
 *  dificuldade vale pra próxima. */
export function RegrasDaSala({ cfg, anfitriao, naPartida }: { cfg: Config; anfitriao: boolean; naPartida: boolean }) {
  const travado = !anfitriao;
  return (
    <div className="ab-config">
      <Switch id="abRelogio" checked={cfg.relogio} disabled={travado} onChange={v => acoes.mudarRegras({ relogio: v })} title="Relógio no planejamento">
        Desligado, a rodada espera você apertar Pronto.
      </Switch>
      <label className="ab-config-campo">
        <span>Segundos de planejamento</span>
        <Stepper id="abSegundos" value={cfg.segundos} min={10} max={120} disabled={travado || !cfg.relogio} ariaLabel="Segundos de planejamento"
          onChange={v => acoes.mudarRegras({ segundos: v })} />
      </label>
      <div className="ab-config-campo">
        <span>Dificuldade dos bots{naPartida ? ' (vale na próxima partida)' : ''}</span>
        <Segmented id="abDificuldade" ariaLabel="Dificuldade dos bots" value={cfg.dificuldade} options={DIFICULDADES} disabled={travado}
          onChange={v => acoes.mudarRegras({ dificuldade: v })} />
      </div>
    </div>
  );
}

/** Preferências pessoais: velocidade da luta e volume (só mudam a sua tela). */
export function Preferencias({ cfg, naPartida }: { cfg: Config; naPartida: boolean }) {
  return (
    <div className="ab-config">
      <div className="ab-config-campo">
        <span>Velocidade da luta</span>
        <Segmented id={naPartida ? 'abVelConfig' : 'abVelInicio'} ariaLabel="Velocidade da luta" value={cfg.velocidade} options={VELOCIDADES}
          onChange={v => acoes.configurar({ velocidade: v })} />
      </div>
      <div className="ab-config-campo">
        <span>Volume dos sons</span>
        <span className="ab-volume">
          <BotaoMudo volume={cfg.volume} id={naPartida ? 'abMudoConfig' : 'abMudoInicio'} />
          <input id="abVolume" type="range" min={0} max={100} step={5} value={Math.round(cfg.volume * 100)} aria-label="Volume"
            onChange={ev => acoes.configurar({ volume: Number(ev.target.value) / 100 })} />
          <b>{Math.round(cfg.volume * 100)}%</b>
        </span>
      </div>
    </div>
  );
}

export function BotaoMudo({ volume, id }: { volume: number; id: string }) {
  const mudo = volume <= 0;
  return (
    <button type="button" id={id} className={'ab-ico ab-mudo' + (mudo ? ' on' : '')} aria-pressed={mudo}
      title={mudo ? 'Ligar o som' : 'Desligar o som'} aria-label={mudo ? 'Ligar o som' : 'Desligar o som'} onClick={() => alternarMudo(volume)}>
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor" />
        {mudo
          ? <path d="M13 7.5l5 5M18 7.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          : <path d="M13 7.2a4 4 0 0 1 0 5.6M15.3 5a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />}
      </svg>
    </button>
  );
}

/** Janela da engrenagem, na partida: regras da sala (se você for o anfitrião, muda) e preferências. */
export function JanelaConfig({ e, fechar }: { e: EstadoTela; fechar: () => void }) {
  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => { if (ev.key === 'Escape') fechar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [fechar]);
  const anfitriao = souAnfitriao(e);
  return (
    <div className="ab-sobreposto" onPointerDown={ev => { if (ev.target === ev.currentTarget) fechar(); }}>
      <div id="abConfig" className="ab-janela ab-janela-config panel" role="dialog" aria-modal="true" aria-label="Configuração">
        <div className="ab-janela-cab">
          <h3>Configuração</h3>
          <button type="button" id="abConfigFechar" className="btn mini" onClick={fechar}>Fechar</button>
        </div>
        <h4 className="ab-config-titulo">Regras da sala <small>{anfitriao ? 'você é o anfitrião' : 'só o anfitrião muda'}</small></h4>
        <RegrasDaSala cfg={e.config} anfitriao={anfitriao} naPartida />
        <h4 className="ab-config-titulo">Suas preferências</h4>
        <Preferencias cfg={e.config} naPartida />
      </div>
    </div>
  );
}
