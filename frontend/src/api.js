const BASE = "http://localhost:8000";

async function pedir(caminho, opcoes = {}) {
  const resposta = await fetch(BASE + caminho, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });
  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // Erros do nosso código vêm como texto; os de validação do FastAPI (422) vêm como lista
    const detalhe = typeof dados?.detail === "string" ? dados.detail : "Dados inválidos";
    throw new Error(detalhe);
  }
  return dados;
}

// Identifica este browser (um voto por pessoa). Fica guardado no localStorage.
export function obterToken() {
  let token = localStorage.getItem("livepulse_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("livepulse_token", token);
  }
  return token;
}

export const listarVotacoes = (publico) =>
  pedir(`/votacoes?publico=${publico}`);

export const obterVotacao = (id) => pedir(`/votacoes/${id}`);

export const criarVotacao = (pergunta, opcoes) =>
  pedir("/votacoes", {
    method: "POST",
    body: JSON.stringify({ pergunta, opcoes }),
  });

export const mudarEstado = (id, estado) =>
  pedir(`/votacoes/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });

export const votar = (id, opcaoId) =>
  pedir(`/votacoes/${id}/votos`, {
    method: "POST",
    body: JSON.stringify({ opcao_id: opcaoId, token: obterToken() }),
  });

export const obterResultados = (id, publico) =>
  pedir(`/votacoes/${id}/resultados?publico=${publico}`);
