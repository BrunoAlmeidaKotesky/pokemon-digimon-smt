import { lazy, Suspense } from 'react';
import './autobatalha.css';
import { app } from '../../state/app';

// o jogo (motor, conteúdo, partida e tela) só baixa quando a aba abre
const Conteudo = lazy(() => import('./Tela').then(m => ({ default: m.Conteudo })));

/**
 * Aba Autobatalha: jogo de montar time com personagens de todas as franquias, em casas hexagonais, com luta
 * automática. Só monta o conteúdo com a aba aberta (como o Catálogo).
 */
export function Autobatalha() {
  return (
    <section id="autobatalha" hidden={app.mode !== 'autobatalha'}>
      {app.mode === 'autobatalha' && (
        <Suspense fallback={<p className="mute" id="abCarregandoTela">Carregando a Autobatalha…</p>}>
          <Conteudo />
        </Suspense>
      )}
    </section>
  );
}
