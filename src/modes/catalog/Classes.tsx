// Subaba "Classes": a lista de classes do Set 1 (nome, descrição, ult padrão, ordem; criar e remover) e, em cada uma, quem já
// a recebeu em todas as franquias. É aqui que se vê "o que vai receber cada classe".
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { label } from '../../state/app';
import * as cat from '../../catalog/store';
import * as pl from '../../catalog/plano';
import { SEM } from '../../catalog/model';
import { BotaoConfirmar, Thumb, catalogoPronto, itemDe, linhaAvulsa, plural, posicaoDe, style, useTextoSalvo } from './comum';

/** Quem tem cada classe: id -> franquia -> nomes (na ordem da lista do site). */
type Resumo = Map<string, Map<string, string[]>>;

/** Abre a franquia na lista, com o filtro de classe (e o grupo que mostra todos eles). */
function verNaLista(k: string, classe: string, nomes: readonly string[]) {
  cat.mudarFiltros(k, { classe });
  cat.escolherVista('personagens');
  const g = cat.grupoDe(k);
  if (g && nomes.some(n => !g.has(n))) cat.escolherGrupo('todos');
  cat.escolherFranquia(k);
}

export function PainelClasses({ frs }: { frs: readonly string[] }) {
  const classes = cat.classes();
  const unidades = cat.plano().unidades;
  const [novo, setNovo] = useState('');
  const [msg, setMsg] = useState('');

  const resumo = useMemo<Resumo>(() => {
    const r: Resumo = new Map(classes.map(c => [c.id, new Map()]));
    for (const k of frs) {
      const us = unidades[k];
      if (!us) continue;
      const nomes = Object.keys(us).sort((a, b) => posicaoDe(k, a) - posicaoDe(k, b));
      for (const nome of nomes) {
        for (const c of us[nome]!.classes ?? []) {
          const porFr = r.get(c);
          if (!porFr) continue;
          if (!porFr.has(k)) porFr.set(k, []);
          porFr.get(k)!.push(nome);
        }
      }
    }
    return r;
  }, [classes, unidades, frs]);

  // miniaturas de quem vem sem imagem na lista (Digimon): o catálogo pode trazer a imagem, e só depois dele o detalhe
  const precisam = frs.filter(k => Object.keys(unidades[k] ?? {}).some(n => { const it = itemDe(k, n); return it && !it.img; })).join(',');
  useEffect(() => {
    for (const k of precisam.split(',').filter(Boolean)) void cat.pedirCatalogo(k);
  }, [precisam]);

  // grupo base sem classe, por franquia
  const semClasse = frs.map(k => {
    const g = cat.grupoBase(k);
    const ids = new Set(classes.map(c => c.id));
    const com = [...g].filter(n => unidades[k]?.[n]?.classes?.some(c => ids.has(c))).length;
    return { k, total: g.size, sem: g.size - com };
  }).filter(x => x.total);
  const totalBase = semClasse.reduce((n, x) => n + x.total, 0);
  const comClasse = totalBase - semClasse.reduce((n, x) => n + x.sem, 0);

  function adicionar(e: FormEvent) {
    e.preventDefault();
    const nome = novo.trim();
    if (!nome) return;
    const antes = classes.length;
    cat.adicionarClasse(nome);
    setNovo('');
    setMsg(cat.classes().length > antes ? `Classe ${nome} criada.` : `Já existe uma classe chamada ${nome}.`);
  }

  return (
    <div id="catClasses" className="panel stack cat-classes" role="tabpanel" aria-label="Classes">
      <div>
        <h2 style={{ margin: 0 }}>Classes do Set 1</h2>
        <p className="mute" style={{ margin: 0 }}>
          Classes gerais, que cruzam franquias. Dê a classe a cada personagem na lista da franquia (botão Classes de cada
          um); aqui fica a lista de classes, a ult padrão de cada uma (a de quem não tem habilidade própria: só JoJo e
          Únicos têm) e quem já recebeu cada classe.
        </p>
      </div>
      {totalBase > 0 && (
        <div className="cls-sem" id="catSemClasse">
          <p style={{ margin: 0 }}><b>{comClasse}</b> de {totalBase} do Set 1 (base) já têm classe. Sem classe ainda:</p>
          <div className="cls-sem-frs">
            {semClasse.filter(x => x.sem).map(x => (
              <button key={x.k} type="button" className="cls-fr-btn" style={style(x.k)} data-fr={x.k}
                onClick={() => { cat.escolherGrupo('base'); verNaLista(x.k, SEM, []); }}>
                <span className="dot" aria-hidden="true" />{label(x.k)} · {x.sem}
              </button>
            ))}
            {comClasse === totalBase && <span className="mute">ninguém.</span>}
          </div>
        </div>
      )}
      <form className="cls-nova" onSubmit={adicionar}>
        <input id="catClasseNome" placeholder="Nome da classe nova" aria-label="Nome da classe nova" value={novo} onChange={e => setNovo(e.target.value)} />
        <button type="submit" id="catClasseAdd" className="btn main" disabled={!novo.trim()}>Criar classe</button>
        <span id="catClasseMsg" role="status" className="mute">{msg}</span>
      </form>
      {classes.length ? (
        <ol id="catClasseLista" className="cls-lista">
          {classes.map((c, i) => (
            <CartaoClasse key={c.id} c={c} primeira={i === 0} ultima={i === classes.length - 1} porFr={resumo.get(c.id)!} />
          ))}
        </ol>
      ) : (
        <p id="catClasseVazio" className="mute">Nenhuma classe ainda: crie a primeira acima.</p>
      )}
    </div>
  );
}

function CartaoClasse({ c, primeira, ultima, porFr }: { c: pl.Classe; primeira: boolean; ultima: boolean; porFr: Map<string, string[]> }) {
  const n = [...porFr.values()].reduce((a, v) => a + v.length, 0);
  // nome: salva ao sair do campo (Enter também); vazio volta ao que era
  const [nome, setNome] = useState(c.nome);
  const [prevNome, setPrevNome] = useState(c.nome);
  if (prevNome !== c.nome) {
    setPrevNome(c.nome);
    setNome(c.nome);
  }
  const desc = useTextoSalvo(c.descricao ?? '', t => cat.editarClasses(cs => pl.descreverClasse(cs, c.id, t)));
  // a ult padrão: a de quem tem a classe e não tem habilidade própria (a base traz um rascunho)
  const ult = useTextoSalvo(cat.ultDaClasse(c), t => cat.mudarUltDaClasse(c.id, t));
  const salvarNome = () => {
    if (nome.trim()) cat.editarClasses(cs => pl.renomearClasse(cs, c.id, nome));
    setNome(c.nome);
  };

  return (
    <li className="cls-card" data-classe={c.id}>
      <div className="cls-head">
        <input className="cls-nome" value={nome} aria-label={`Nome da classe ${c.nome}`} onChange={e => setNome(e.target.value)} onBlur={salvarNome}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') setNome(c.nome);
          }} />
        <span className="cls-n">{plural(n, 'personagem', 'personagens')}</span>
        <span className="cls-acts">
          <button type="button" className="btn mini" aria-label={`Subir ${c.nome}`} title="Subir" disabled={primeira}
            onClick={() => cat.editarClasses(cs => pl.moverClasse(cs, c.id, -1))}>↑</button>
          <button type="button" className="btn mini" aria-label={`Descer ${c.nome}`} title="Descer" disabled={ultima}
            onClick={() => cat.editarClasses(cs => pl.moverClasse(cs, c.id, 1))}>↓</button>
          <BotaoConfirmar className="cls-remover" rotulo="Remover" confirmar={n ? `Confirmar: tirar de ${n}` : 'Confirmar: remover'}
            onConfirm={() => cat.removerClasse(c.id)} />
        </span>
      </div>
      <textarea className="cls-desc" rows={1} placeholder="Descrição (opcional): o que a classe faz, bônus por quantidade…"
        aria-label={`Descrição da classe ${c.nome}`} value={desc.txt} onChange={e => desc.mudar(e.target.value)} onBlur={desc.flush} />
      {c.id !== 'unicos' && (
        <label className="cls-ult">
          <span>Ult padrão</span>
          <textarea className="cls-ult-txt" rows={1} placeholder="O que faz quem tem esta classe e não tem habilidade própria…"
            aria-label={`Ult padrão da classe ${c.nome}`} value={ult.txt} onChange={e => ult.mudar(e.target.value)} onBlur={ult.flush} />
        </label>
      )}
      {n ? (
        <div className="cls-resumo">
          {[...porFr].map(([k, nomes]) => (
            <div key={k} className="cls-fr" style={style(k)} data-fr={k}>
              <button type="button" className="cls-fr-btn" onClick={() => verNaLista(k, c.id, nomes)} title={`Ver na lista de ${label(k)}`}>
                <span className="dot" aria-hidden="true" />{label(k)} · {nomes.length}
              </button>
              <ul className="cls-pers">
                {nomes.map(nome => (
                  <li key={nome} title={nome} data-nome={nome}>
                    <Thumb l={linhaAvulsa(k, nome)} pronto={catalogoPronto(k)} />
                    <span>{nome}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mute cls-ninguem">Ninguém com esta classe ainda.</p>
      )}
    </li>
  );
}
