from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

# Permite que o React (porta 5173) converse com o Python (porta 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- BANCO DE DADOS NA MEMÓRIA (FAKE) ---
fake_db_atendimentos = []

class LoginData(BaseModel):
    username: str
    password: str

class Atendimento(BaseModel):
    descricao: str
    categoria: str
    tempo: str
    usuario: str

# --- ROTAS ---
@app.post("/login")
def login(data: LoginData):
    # Dicionário mais completo: Senha e Tipo
    usuarios_db = {
        "GUSTAVO":   {"senha": "1234", "tipo": "gestor"},    # Exemplo de outro gestor
        "atendente": {"senha": "1234", "tipo": "atendente"},
    }
    
    # 1. Verifica se usuário existe
    if data.username in usuarios_db:
        info_usuario = usuarios_db[data.username]
        
        # 2. Verifica se a senha bate
        if info_usuario["senha"] == data.password:
            # RETORNA O TIPO (GESTOR OU ATENDENTE) PARA O FRONT
            return {
                "status": "ok", 
                "usuario": data.username, 
                "tipo": info_usuario["tipo"] 
            }
            
    # Se falhar
    raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")

@app.get("/atendimentos")
def ler_atendimentos():
    return fake_db_atendimentos

@app.post("/atendimentos")
def criar_atendimento(item: Atendimento):
    dados = item.dict()
    dados["data_registro"] = datetime.now().strftime("%d/%m/%Y %H:%M")
    fake_db_atendimentos.append(dados)
    return {"msg": "Salvo"}