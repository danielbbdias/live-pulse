import sqlite3
 
 
def ligar():
    conn = sqlite3.connect("livepulse.db")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn
 
 
def criar_tabelas():
    conn = ligar()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS votacao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pergunta TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'rascunho',
            criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
 
        CREATE TABLE IF NOT EXISTS opcao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            texto TEXT NOT NULL,
            votacao_id INTEGER NOT NULL REFERENCES votacao(id)
        );
 
        CREATE TABLE IF NOT EXISTS voto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            opcao_id INTEGER NOT NULL REFERENCES opcao(id),
            votacao_id INTEGER NOT NULL REFERENCES votacao(id),
            token TEXT NOT NULL,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (votacao_id, token)
        );
    """)
    conn.commit()
    conn.close()
 