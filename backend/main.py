import os
from datetime import datetime
import pytz  # <--- BIBLIOTECA DE FUSO HORÁRIO
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# ==========================================
# 1. CONFIGURAÇÃO DO BANCO DE DADOS
# ==========================================

DATABASE_URL = os.getenv("POSTGRES_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./banco_local.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================
# 2. FUNÇÃO PARA PEGAR HORA DO BRASIL 🇧🇷
# ==========================================
def agora_brasil():
    fuso = pytz.timezone('America/Sao_Paulo')
    data_hora = datetime.now(fuso)
    return data_hora.strftime("%d/%m/%Y %H:%M")

# ==========================================
# 3. MODELOS (TABELAS)
# ==========================================

class UsuarioDB(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, index=True)
    senha = Column(String)
    funcao = Column(String)

class AtendimentoDB(Base):
    __tablename__ = "atendimentos"
    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String)
    categoria = Column(String)
    tempo = Column(String)
    usuario = Column(String)
    data_registro = Column(String)

Base.metadata.create_all(bind=engine)

# ==========================================
# 4. SCHEMAS (PYDANTIC)
# ==========================================

class LoginData(BaseModel):
    username: str
    password: str

class AtendimentoCreate(BaseModel):
    descricao: str
    categoria: str
    tempo: str
    usuario: str

class UsuarioCreate(BaseModel):
    nome: str
    senha: str
    funcao: str

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    funcao: str
    class Config:
        orm_mode = True

# ==========================================
# 5. SENHAS
# ==========================================
class TrocarSenhaData(BaseModel):
    username: str
    senha_atual: str
    nova_senha: str
# ==========================================
# 6. APP E ROTAS
# ==========================================

app = FastAPI(
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ROTA SEED ---
@app.get("/api/criar-admin-inicial")
def criar_admin_inicial(db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.nome == "admin").first()
    if usuario:
        return {"mensagem": "O usuário 'admin' já existe!"}
    
    novo_admin = UsuarioDB(nome="admin", senha="123", funcao="gestor")
    db.add(novo_admin)
    db.commit()
    return {"mensagem": "Sucesso! Usuário 'admin' criado com senha '123'."}

# --- LOGIN ---
@app.post("/api/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.nome == data.username).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    if usuario.senha != data.password:
        raise HTTPException(status_code=401, detail="Senha incorreta") 
    return { "status": "ok", "usuario": usuario.nome, "tipo": usuario.funcao }

# --- ATENDIMENTOS ---
@app.get("/api/atendimentos")
def ler_atendimentos(db: Session = Depends(get_db)):
    return db.query(AtendimentoDB).all()

@app.post("/api/atendimentos")
def criar_atendimento(item: AtendimentoCreate, db: Session = Depends(get_db)):
    novo_atendimento = AtendimentoDB(
        descricao=item.descricao,
        categoria=item.categoria,
        tempo=item.tempo,
        usuario=item.usuario,
        data_registro=agora_brasil()  # <--- AQUI USA A HORA CERTA
    )
    db.add(novo_atendimento)
    db.commit()
    db.refresh(novo_atendimento)
    return {"msg": "Salvo", "id": novo_atendimento.id}

# --- USUÁRIOS ---
@app.get("/api/usuarios", response_model=List[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(UsuarioDB).all()

@app.post("/api/usuarios")
def criar_usuario(item: UsuarioCreate, db: Session = Depends(get_db)):
    existente = db.query(UsuarioDB).filter(UsuarioDB.nome == item.nome).first()
    if existente:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    novo_user = UsuarioDB(nome=item.nome, senha=item.senha, funcao=item.funcao)
    db.add(novo_user)
    db.commit()
    return {"msg": "Usuário criado"}

@app.delete("/api/usuarios/{user_id}")
def deletar_usuario(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UsuarioDB).filter(UsuarioDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    db.delete(user)
    db.commit()
    return {"msg": "Deletado"}

@app.put("/api/minha-senha")
def trocar_senha(data: TrocarSenhaData, db: Session = Depends(get_db)):
    # 1. Busca o usuário
    usuario = db.query(UsuarioDB).filter(UsuarioDB.nome == data.username).first()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # 2. Verifica se a senha atual está certa (Segurança básica)
    if usuario.senha != data.senha_atual:
        raise HTTPException(status_code=400, detail="A senha atual está incorreta!")
    
    # 3. Salva a nova senha
    usuario.senha = data.nova_senha
    db.commit()
    
    return {"msg": "Senha alterada com sucesso!"}