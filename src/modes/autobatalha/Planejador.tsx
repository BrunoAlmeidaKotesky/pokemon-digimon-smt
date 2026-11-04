// Planejador de times (painel sobreposto): escolher até 10 campeões com busca e filtros, ver os traços que ativam
// (cada um contado pela forma de maior estrela), salvar, renomear, apagar e escolher o plano marcado na loja.
import { useEffect, useMemo, useState } from 'react';
import { ORIGENS, type Custo, type Origem } from '../../autobatalha/tipos';
import { S } from '../../autobatalha/dados';
import {
  FILTRO_VAZIO, MAX_CAMPEOES, alternarCampeao, apagarPlano, definirAtivo, filtrarCampeoes, nomeLivre, planoAtivo, salvarPlano, tracosDoPlano,
  type FiltroPlanejador, type Plano,
} from '../../autobatalha/planejador';
import { mudarPlanos, planosAtuais, usePlanos } from './planos';
import { propsDica } from './interacao';
import { ListaTracos } from './Lateral';
import { Foto, Moeda, custoAttr, ehOrigem, imgForma, nomeTraco, plural } from './comum';

interface Rascunho { id: string | null; nome: string; campeoes: string[] }
const CUSTOS: Custo[] = [1, 2, 3, 4, 5];
const deRascunho = (p: Plano | null): Rascunho => (p ? { id: p.id, nome: p.nome, campeoes: [...p.campeoes] } : { id: null, nome: '', campeoes: [] });

export function Planejador({ fechar }: { fechar: () => void }) {
  const planos = usePlanos();
  const [filtro, setFiltro] = useState<FiltroPlanejador>(FILTRO_VAZIO);
  const [r, setR] = useState<Rascunho>(() => deRascunho(planoAtivo(planos) ?? planos.planos[0] ?? null));
  const [msg, setMsg] = useState('');
  const [apagando, setApagando] = useState(false);
  const set = S();
  const lista = useMemo(() => filtrarCampeoes(set, filtro), [set, filtro]);
  const tracos = useMemo(() => tracosDoPlano(r.campeoes, set), [r.campeoes, set]);
  const classes = useMemo(() => set.dados.tracos.filter(t => !ehOrigem(t.id) && t.id !== 'unicos'), [set]);
  const salvo = r.id ? planos.planos.find(p => p.id === r.id) ?? null : null;
  const mudou = !salvo || salvo.nome !== r.nome.trim() || salvo.campeoes.join() !== r.campeoes.join();
  const ativo = !!r.id && planos.ativo === r.id;

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [fechar]);

  function alternar(id: string) {
    const novo = alternarCampeao(r.campeoes, id);
    if (!novo) { setMsg(`O plano tem no máximo ${MAX_CAMPEOES} campeões.`); return; }
    setMsg('');
    setR({ ...r, campeoes: novo });
  }
  function salvar(comoNovo: boolean): string {
    const s = salvarPlano(planos, { id: comoNovo ? null : r.id, nome: r.nome, campeoes: r.campeoes });
    mudarPlanos(s.planos);
    const p = s.planos.planos.find(x => x.id === s.id)!;
    setR(deRascunho(p));
    setMsg(comoNovo || !r.id ? `Plano "${p.nome}" criado.` : `Plano "${p.nome}" salvo.`);
    return s.id;
  }
  function usarNaLoja() {
    if (ativo) { mudarPlanos(definirAtivo(planos, null)); setMsg('Nenhum plano marcado na loja.'); return; }
    const id = mudou ? salvar(false) : r.id!;
    // salvar() já trocou os planos: marca em cima dos novos
    mudarPlanos(definirAtivo(planosAtuais(), id));
    setMsg('Os campeões deste plano ganham marca na loja.');
  }
  function apagar() {
    if (!r.id) return;
    if (!apagando) { setApagando(true); return; }
    mudarPlanos(apagarPlano(planos, r.id));
    setApagando(false);
    setR(deRascunho(null));
    setMsg('Plano apagado.');
  }
  function abrir(p: Plano | null) { setR(deRascunho(p)); setApagando(false); setMsg(''); }

  return (
    <div className="ab-sobreposto" onPointerDown={e => { if (e.target === e.currentTarget) fechar(); }}>
      <div id="abPlanejadorPainel" className="ab-plan panel" role="dialog" aria-modal="true" aria-label="Planejador de times">
        <div className="ab-plan-esq">
          <div className="ab-plan-cab">
            <h2>Planejador de times</h2>
            <span className="mute">{plural(lista.length, 'campeão', 'campeões')}</span>
          </div>
          <div className="ab-plan-filtros">
            <input id="abPlanBusca" type="search" placeholder="Buscar pelo nome (ou forma da linha)" value={filtro.busca} aria-label="Buscar campeão"
              onChange={e => setFiltro({ ...filtro, busca: e.target.value })} />
            <select id="abPlanOrigem" aria-label="Origem" value={filtro.origem} onChange={e => setFiltro({ ...filtro, origem: e.target.value as Origem | '' })}>
              <option value="">Todas as origens</option>
              {ORIGENS.map(o => <option key={o} value={o}>{nomeTraco(o)}</option>)}
            </select>
            <select id="abPlanClasse" aria-label="Classe" value={filtro.classe} onChange={e => setFiltro({ ...filtro, classe: e.target.value })}>
              <option value="">Todas as classes</option>
              {classes.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
            <span className="ab-plan-custos" role="group" aria-label="Custo">
              {CUSTOS.map(c => {
                const on = filtro.custos.includes(c);
                return (
                  <button key={c} type="button" className={'ab-chip custo' + (on ? ' on' : '')} {...custoAttr(c)} aria-pressed={on}
                    onClick={() => setFiltro({ ...filtro, custos: on ? filtro.custos.filter(x => x !== c) : [...filtro.custos, c] })}>
                    <Moeda />{c}
                  </button>
                );
              })}
            </span>
          </div>
          <ul id="abPlanGrade" className="ab-plan-grade">
            {lista.map(c => {
              const on = r.campeoes.includes(c.id);
              const f1 = c.niveis[0]![0]!;
              return (
                <li key={c.id}>
                  <button type="button" className={'ab-plan-c' + (on ? ' on' : '')} {...custoAttr(c.custo)} data-campeao={c.id} aria-pressed={on}
                    onClick={() => alternar(c.id)} {...propsDica({ tipo: 'campeao', campeao: c.id, forma: f1 })}>
                    <Foto src={imgForma(f1)} nome={c.nome} className="redonda" />
                    <span className="nm">{c.nome}</span>
                  </button>
                </li>
              );
            })}
            {!lista.length && <li className="mute">Ninguém com esses filtros.</li>}
          </ul>
        </div>

        <div className="ab-plan-dir">
          <div className="ab-plan-cab">
            <h3>Planos</h3>
            <button type="button" className="btn mini" id="abPlanFechar" onClick={fechar} aria-label="Fechar o planejador">Fechar</button>
          </div>
          <div className="ab-plan-salvos" role="list">
            {planos.planos.map(p => (
              <button key={p.id} type="button" role="listitem" className={'ab-chip' + (p.id === r.id ? ' on' : '')} onClick={() => abrir(p)}
                title={planos.ativo === p.id ? 'Marcado na loja' : undefined}>
                {planos.ativo === p.id && <span className="ab-ponto" aria-label="marcado na loja" />}{p.nome} <small>{p.campeoes.length}</small>
              </button>
            ))}
            <button type="button" className="ab-chip novo" onClick={() => abrir(null)}>+ Novo</button>
          </div>
          <label className="ab-plan-nome">
            <span className="mute">Nome</span>
            <input id="abPlanNome" type="text" value={r.nome} placeholder={nomeLivre(planos)} maxLength={40} onChange={e => setR({ ...r, nome: e.target.value })} />
          </label>
          <div className="ab-plan-escolhidos" aria-label="Campeões do plano">
            {r.campeoes.map(id => {
              const c = set.dados.campeoes.find(x => x.id === id);
              if (!c) return null;
              const f1 = c.niveis[0]![0]!;
              return (
                <button key={id} type="button" className="ab-plan-c mini on" {...custoAttr(c.custo)} title={`Tirar ${c.nome}`} onClick={() => alternar(id)}
                  {...propsDica({ tipo: 'campeao', campeao: id, forma: f1 })}>
                  <Foto src={imgForma(f1)} nome={c.nome} className="redonda" />
                </button>
              );
            })}
            <span className="mute ab-plan-conta">{r.campeoes.length}/{MAX_CAMPEOES}</span>
          </div>
          <div className="ab-plan-tracos">
            <h4>Traços (na estrela máxima)</h4>
            <ListaTracos tracos={tracos} vazio="Clique nos campeões pra montar o plano." />
          </div>
          <div className="ab-plan-acoes">
            <button type="button" id="abPlanSalvar" className="btn main" disabled={!mudou && !!r.id} onClick={() => salvar(false)}>{r.id ? 'Salvar' : 'Salvar plano'}</button>
            {r.id && <button type="button" className="btn" onClick={() => salvar(true)}>Salvar como novo</button>}
            <button type="button" id="abPlanAtivo" className={'btn' + (ativo ? ' on' : '')} aria-pressed={ativo} disabled={!r.campeoes.length && !ativo} onClick={usarNaLoja}>
              {ativo ? 'Tirar a marca da loja' : 'Marcar na loja'}
            </button>
            {r.id && <button type="button" className="btn danger" onClick={apagar} onBlur={() => setApagando(false)}>{apagando ? 'Confirmar: apagar' : 'Apagar'}</button>}
          </div>
          <p className="ab-plan-msg" role="status">{msg}</p>
        </div>
      </div>
    </div>
  );
}
