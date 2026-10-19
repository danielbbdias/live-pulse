import { useEffect, useState } from "react";
import {
  listarVotacoes,
  criarVotacao,
  mudarEstado,
  obterResultados,
} from "../api.js";
import Resultados from "../components/Resultados.jsx";

export default function Anfitriao() {
  const [votacoes, setVotacoes] = useState([]);
  const [pergunta, setPergunta] = useState("");
  const [opcoes, setOpcoes] = useState(["", ""]);
  const [selecionada, setSelecionada] = useState(null); // id da votação cujos resultados se veem
  const [resultados, setResultados] = useState(null);
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      setVotacoes(await listarVotacoes(false));
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // ----- Formulário de criação -----
  function mudarOpcao(indice, texto) {
    setOpcoes(opcoes.map((o, i) => (i === indice ? texto : o)));
  }

  function adicionarOpcao() {
    if (opcoes.length < 5) setOpcoes([...opcoes, ""]);
  }

  function removerOpcao(indice) {
    if (opcoes.length  q> 2) setOpcoes(opcoes.filter((_, i) => i !== indice));
  }

  async function criar(e) {
    e.preventDefault(); // evita que o browser recarregue a página  
    setErro("");
    try {
      await criarVotacao(pergunta, opcoes);
      setPergunta("");
      setOpcoes(["", ""]);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  // ----- Estado e resultados -----
  async function mudar(id, estado) {
    setErro("");
    try {
      await mudarEstado(id, estado);
      await carregar();
      if (selecionada === id) await verResultados(id);
    } catch (e) {
      setErro(e.message);
    }
  }

  async function verResultados(id) {
    setErro("");
    try {
      setSelecionada(id);
      setResultados(await obterResultados(id, false));
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <section>
      <h2>Painel do anfitrião</h2>
      {erro && <p className="erro">{erro}</p>}

      <h3>Nova votação</h3>
      <form onSubmit={criar}>
        <input
          placeholder="Pergunta"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
        />
        {opcoes.map((o, i) => (
          <div className="linha-opcao" key={i}>
            <input
              placeholder={`Opção ${i + 1}`}
              value={o}
              onChange={(e) => mudarOpcao(i, e.target.value)}
            />
            {opcoes.length > 2 && (
              <button type="button" onClick={() => removerOpcao(i)}>
                ✕
              </button>
            )}
          </div>
        ))}
        <div className="acoes">
          {opcoes.length < 5 && (
            <button type="button" onClick={adicionarOpcao}>
              + Opção
            </button>
          )}
          <button type="submit">Criar votação</button>
        </div>
      </form>

      <div className="topo">
        <h3>Votações</h3>
        <button onClick={carregar}>Atualizar</button>
      </div>
      {votacoes.length === 0 && <p>Ainda não criaste nenhuma votação.</p>}

      <ul className="lista">
        {votacoes.map((v) => (
          <li key={v.id}>
            <div>
              {v.pergunta}
              <span className={`estado ${v.estado}`}>{v.estado}</span>
            </div>
            <div className="acoes">
              {v.estado === "rascunho" && (
                <button onClick={() => mudar(v.id, "aberta")}>Abrir</button>
              )}
              {v.estado === "aberta" && (
                <button onClick={() => mudar(v.id, "fechada")}>Fechar</button>
              )}
              <button onClick={() => verResultados(v.id)}>Resultados</button>
            </div>
          </li>
        ))}
      </ul>

      {resultados && (
        <div className="caixa">
          <div className="topo">
            <strong>Resultados</strong>
            <button onClick={() => verResultados(selecionada)}>Atualizar</button>
          </div>
          <Resultados dados={resultados} />
        </div>
      )}
    </section>
  );
}
