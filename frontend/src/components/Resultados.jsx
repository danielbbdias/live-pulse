export default function Resultados({ dados }) {
  return (
    <div>
      <h3>{dados.pergunta}</h3>
      <p>Total de votos: {dados.total}</p>
      <ul className="resultados">
        {dados.opcoes.map((o) => {
          const pct = dados.total ? Math.round((o.votos / dados.total) * 100) : 0;
          return (
            <li key={o.id}>
              <div className="linha">
                <span>{o.texto}</span>
                <span>
                  {o.votos} ({pct}%)
                </span>
              </div>
              <div className="barra">
                <div className="barra-cheia" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
