import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { obterVotacao, obterResultados, votar } from "../api.js";
import Resultados from "../components/Resultados.jsx";

export default function Votacao() {
  const { id } = useParams(); // o número que vem no endereço /votacao/:id
  const [votacao, setVotacao] = useState(null);
  const [resultados, setResultados] = useState(null);
  const [escolhida, setEscolhida] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregar() {
    setErro("");
    try {
      const v = await obterVotacao(id);
      setVotacao(v);
      if (v.estado === "fechada") {
        setResultados(await obterResultados(id, true));
      }
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    carregar();
  }, [id]);

  async function submeter() {
    setErro("");
    setMensagem("");
    try {
      const r = await votar(id, escolhida);
      setMensagem(r.mensagem);
    } catch (e) {
      setErro(e.message);
    }
  }

  if (erro && !votacao) return <p className="erro">{erro}</p>;
  if (!votacao) return <p>A carregar...</p>;
  if (votacao.estado === "rascunho") return <p>Esta votação não está disponível.</p>;

  return (
    <section>
      <Link to="/">← Voltar</Link>
      <div className="topo">
        <h2>{votacao.pergunta}</h2>
        <button onClick={carregar}>Atualizar</button>
      </div>

      {votacao.estado === "aberta" && (
        <>
          <ul className="opcoes">
            {votacao.opcoes.map((o) => (
              <li key={o.id}>
                <label>
                  <input
                    type="radio"
                    name="opcao"
                    checked={escolhida === o.id}
                    onChange={() => setEscolhida(o.id)}
                  />
                  {o.texto}
                </label>
              </li>
            ))}
          </ul>
          <button onClick={submeter} disabled={escolhida === null}>
            Votar
          </button>
          <p className="info">Os resultados ficam visíveis quando a votação fechar.</p>
        </>
      )}

      {votacao.estado === "fechada" && resultados && (
        <>
          <p className="info">Votação fechada.</p>
          <Resultados dados={resultados} />
        </>
      )}

      {mensagem && <p className="sucesso">{mensagem}</p>}
      {erro && <p className="erro">{erro}</p>}
    </section>
  );
}
