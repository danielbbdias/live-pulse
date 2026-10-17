import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import criar_tabelas, ligar

criar_tabelas()

app = FastAPI()

# O React (Vite) corre na porta 5173; sem isto o browser bloqueia os pedidos.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Modelos de entrada (validação do corpo dos pedidos) ----------

class NovaVotacao(BaseModel):
    pergunta: str
    opcoes: list[str]


class NovoEstado(BaseModel):
    estado: str


class NovoVoto(BaseModel):
    opcao_id: int
    token: str


# ---------- Votações ----------

@app.post("/votacoes", status_code=201)
def criar_votacao(dados: NovaVotacao):
    pergunta = dados.pergunta.strip()
    opcoes = [o.strip() for o in dados.opcoes if o.strip()]

    if not pergunta:
        raise HTTPException(status_code=400, detail="A pergunta não pode estar vazia")
    if not 2 <= len(opcoes) <= 5:
        raise HTTPException(status_code=400, detail="Tem de haver entre 2 e 5 opções")

    conn = ligar()
    cur = conn.execute("INSERT INTO votacao (pergunta) VALUES (?)", (pergunta,))
    votacao_id = cur.lastrowid
    for texto in opcoes:
        conn.execute(
            "INSERT INTO opcao (texto, votacao_id) VALUES (?, ?)",
            (texto, votacao_id),
        )
    conn.commit()
    conn.close()

    return {"id": votacao_id, "pergunta": pergunta, "estado": "rascunho", "opcoes": opcoes}


@app.get("/votacoes")
def listar_votacoes(publico: bool = False):
    """Anfitrião: todas. Público (?publico=true): só abertas e fechadas."""
    conn = ligar()
    if publico:
        linhas = conn.execute(
            "SELECT id, pergunta, estado, criada_em FROM votacao "
            "WHERE estado IN ('aberta', 'fechada') ORDER BY id DESC"
        ).fetchall()
    else:
        linhas = conn.execute(
            "SELECT id, pergunta, estado, criada_em FROM votacao ORDER BY id DESC"
        ).fetchall()
    conn.close()
    return [dict(linha) for linha in linhas]


@app.get("/votacoes/{votacao_id}")
def obter_votacao(votacao_id: int):
    conn = ligar()
    votacao = conn.execute(
        "SELECT id, pergunta, estado, criada_em FROM votacao WHERE id = ?",
        (votacao_id,),
    ).fetchone()
    if votacao is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Votação não encontrada")
    opcoes = conn.execute(
        "SELECT id, texto FROM opcao WHERE votacao_id = ? ORDER BY id",
        (votacao_id,),
    ).fetchall()
    conn.close()
    return {**dict(votacao), "opcoes": [dict(o) for o in opcoes]}


@app.patch("/votacoes/{votacao_id}/estado")
def mudar_estado(votacao_id: int, dados: NovoEstado):
    if dados.estado not in ("rascunho", "aberta", "fechada"):
        raise HTTPException(status_code=400, detail="Estado inválido")

    conn = ligar()
    votacao = conn.execute(
        "SELECT id FROM votacao WHERE id = ?", (votacao_id,)
    ).fetchone()
    if votacao is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Votação não encontrada")

    conn.execute(
        "UPDATE votacao SET estado = ? WHERE id = ?", (dados.estado, votacao_id)
    )
    conn.commit()
    conn.close()
    return {"id": votacao_id, "estado": dados.estado}


# ---------- Votos ----------

@app.post("/votacoes/{votacao_id}/votos", status_code=201)
def votar(votacao_id: int, dados: NovoVoto):
    token = dados.token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Token em falta")

    conn = ligar()
    votacao = conn.execute(
        "SELECT estado FROM votacao WHERE id = ?", (votacao_id,)
    ).fetchone()
    if votacao is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Votação não encontrada")
    if votacao["estado"] != "aberta":
        conn.close()
        raise HTTPException(status_code=409, detail="Esta votação não está aberta")

    opcao = conn.execute(
        "SELECT id FROM opcao WHERE id = ? AND votacao_id = ?",
        (dados.opcao_id, votacao_id),
    ).fetchone()
    if opcao is None:
        conn.close()
        raise HTTPException(status_code=400, detail="Opção inválida para esta votação")

    try:
        conn.execute(
            "INSERT INTO voto (opcao_id, votacao_id, token) VALUES (?, ?, ?)",
            (dados.opcao_id, votacao_id, token),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=409, detail="Já votaste nesta votação")
    conn.close()
    return {"mensagem": "Obrigado, o teu voto foi registado!"}


# ---------- Resultados ----------

@app.get("/votacoes/{votacao_id}/resultados")
def resultados(votacao_id: int, publico: bool = False):
    """Anfitrião: sempre. Público (?publico=true): só se estiver fechada."""
    conn = ligar()
    votacao = conn.execute(
        "SELECT id, pergunta, estado FROM votacao WHERE id = ?", (votacao_id,)
    ).fetchone()
    if votacao is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Votação não encontrada")
    if publico and votacao["estado"] != "fechada":
        conn.close()
        raise HTTPException(
            status_code=403, detail="Resultados só disponíveis após o fecho"
        )

    linhas = conn.execute(
        """
        SELECT o.id, o.texto, COUNT(v.id) AS votos
        FROM opcao o
        LEFT JOIN voto v ON v.opcao_id = o.id
        WHERE o.votacao_id = ?
        GROUP BY o.id
        ORDER BY o.id
        """,
        (votacao_id,),
    ).fetchall()
    conn.close()

    opcoes = [dict(l) for l in linhas]
    return {
        "id": votacao["id"],
        "pergunta": votacao["pergunta"],
        "estado": votacao["estado"],
        "total": sum(o["votos"] for o in opcoes),
        "opcoes": opcoes,
    }