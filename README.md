# Live Pulse

Aplicação web de votação em direto, com duas interfaces: o **público** (vota) e o **anfitrião** (cria votações, muda o estado e vê os resultados).

## Como executar localmente

Requisitos: Python 3.10+ e Node.js 18+.

### Backend (FastAPI + SQLite)

Na pasta raiz do projeto:

```bash
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn livepulse.main:app --reload
```

A API fica em `http://localhost:8000` (documentação interativa em `http://localhost:8000/docs`). A base de dados `livepulse.db` é criada automaticamente no primeiro arranque.

### Frontend (React + Vite)

Noutro terminal:

```bash
cd frontend
npm install
npm run dev
```

- Público: `http://localhost:5173/`
- Anfitrião: `http://localhost:5173/host`

## Níveis completados

- **Nível 1**: completo (criar votações com 2 a 5 opções, mudar o estado Rascunho → Aberta → Fechada, votar, ver resultados; o público só vê resultados de votações fechadas).
- **Nível 2**: completo.
  - *Um voto por pessoa*: o browser gera um token aleatório guardado no `localStorage` e envia-o com cada voto. A tabela `voto` tem `UNIQUE (votacao_id, token)`, por isso é a base de dados que garante que o mesmo token não vota duas vezes.
  - *Votações fechadas rejeitam votos*: a verificação é feita no backend (resposta 409), não apenas no frontend.
- **Nível 3**: não feito. Os resultados atualizam-se com um botão "Atualizar".

## Decisões técnicas

- **FastAPI**: simples, rápido de pôr a funcionar, valida os dados de entrada com Pydantic e gera documentação automática (`/docs`).
- **SQLite (módulo `sqlite3` sem ORM)**: não precisa de servidor nem configuração, o que cumpre o requisito de correr localmente com o mínimo de passos. O esquema é pequeno, por isso SQL direto é claro e fácil de explicar.
- **React + Vite com `fetch` e `useState`/`useEffect`**: o sistema é pequeno, por isso não usei bibliotecas de estado nem de pedidos. Usei `react-router-dom` para separar a página do público (`/`) da do anfitrião (`/host`).
- **CSS simples**: a funcionalidade e a estrutura têm prioridade sobre a estética.
- **Separação de responsabilidades**: o frontend centraliza todos os pedidos em `src/api.js`; as páginas ficam em `src/pages` e componentes reutilizáveis em `src/components`.

### Modelo de dados

- `votacao` (id, pergunta, estado, criada_em)
- `opcao` (id, texto, votacao_id)
- `voto` (id, opcao_id, votacao_id, token, criado_em), com `UNIQUE (votacao_id, token)`

### API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/votacoes?publico=true\|false` | Lista votações (público: só abertas e fechadas) |
| POST | `/votacoes` | Cria votação com opções |
| GET | `/votacoes/{id}` | Pergunta e opções de uma votação |
| PATCH | `/votacoes/{id}/estado` | Muda o estado |
| POST | `/votacoes/{id}/votos` | Submete um voto |
| GET | `/votacoes/{id}/resultados?publico=true\|false` | Resultados (público: só se fechada) |

Códigos usados: 201 (criado), 400 (dados inválidos), 403 (resultados ainda não públicos), 404 (não encontrado), 409 (votação não aberta ou voto repetido).

## Limitações conhecidas

- **O voto único pode ser contornado**: apagar o `localStorage`, usar uma janela anónima ou outro browser gera um token novo. Impedir isto a sério exigiria autenticação.
- **Sem autenticação no painel do anfitrião** (dispensada no enunciado): qualquer pessoa que conheça `/host` ou chame a API sem `publico=true` tem acesso de anfitrião.
- `GET /votacoes/{id}` devolve também votações em rascunho: o frontend esconde-as, mas o backend não.

## O que melhoraria com mais tempo

- Tempo real com Server-Sent Events (fluxo unidirecional servidor → cliente, mais simples que WebSockets para este caso).
- Autenticação para o anfitrião e proteção dos endpoints de gestão.
- Testes automáticos do backend.
- Docker / docker-compose para arrancar tudo com um comando.
- Migrar para PostgreSQL se houvesse muitos utilizadores em simultâneo.
