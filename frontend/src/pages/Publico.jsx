import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarVotacoes } from "../api.js";

export default function Publico() {
  const [votacoes, setVotacoes] = useState([]);
  const [erro, setErro] = useState("");

  async function carregar() {
    setErro("");
    try {
      setVotacoes(await listarVotacoes(true));
    } catch (e) {
      setErro(e.message);
    }
  }

  // Corre uma vez, quando a página abre
  useEffect(() => {
    carregar();
  }, []);

  return (
    <section>
      <div className="topo">
        <h2>Votações</h2>
        <button onClick={carregar}>Atualizar</button>
      </div>

      {erro && <p className="erro">{erro}</p>}
      {votacoes.length === 0 && !erro && <p>Não há votações disponíveis.</p>}

      <ul className="lista">
        {votacoes.map((v) => (
          <li key={v.id}>
            <Link to={`/votacao/${v.id}`}>{v.pergunta}</Link>
            <span className={`estado ${v.estado}`}>{v.estado}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
