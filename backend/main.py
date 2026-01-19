import os
from datetime import datetime
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

# Pega a URL do banco das variáveis de ambiente da Vercel
DATABASE_URL = os.getenv("POSTGRES_URL")

# Correção necessária: A Vercel entrega "postgres://", mas o SQLAlchemy quer "postgresql://"
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Se não tiver URL (rodando no seu PC sem docker), cria um arquivo local
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./banco_local.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Configuração para Postgres (Vercel)
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================
# 2. MODELOS (TABELAS DO BANCO)
# ==========================================

class UsuarioDB(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, index=True)
    senha = Column(String)
    funcao = Column(String)  # 'gestor' ou 'funcionario'

class AtendimentoDB(Base):
    __tablename__ = "atendimentos"
    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String)
    categoria = Column(String)
    tempo = Column(String)
    usuario = Column(String)
    data_registro = Column(String)

# Cria as tabelas se elas não existirem
Base.metadata.create_all(bind=engine)

# ==========================================
# 3. SCHEMAS (PYDANTIC - VALIDAÇÃO DE DADOS)
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
# 4. APP E DEPENDÊNCIAS
# ==========================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Função para pegar a conexão com o banco a cada requisição
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 5. ROTAS
# ==========================================

# --- ROTA ESPECIAL: CRIAR O PRIMEIRO ADMIN (Seed) ---
@app.get("/api/criar-admin-inicial")
def criar_admin_inicial(db: Session = Depends(get_db)):
    # Verifica se já existe alguém com nome 'admin'
    usuario = db.query(UsuarioDB).filter(UsuarioDB.nome == "admin").first()
    if usuario:
        return {"mensagem": "O usuário 'admin' já existe!"}
    
    novo_admin = UsuarioDB(nome="admin", senha="123", funcao="gestor")
    db.add(novo_admin)
    db.commit()
    return {"mensagem": "Sucesso! Usuário 'admin' criado com senha '123'."}

# --- LOGIN ---
@app.post("/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    # Busca o usuário no banco
    usuario = db.query(UsuarioDB).filter(UsuarioDB.nome == data.username).first()
    
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    if usuario.senha != data.password:
        raise HTTPException(status_code=401, detail="Senha incorreta")
        
    return {
        "status": "ok", 
        "usuario": usuario.nome, 
        "tipo": usuario.funcao 
    }

# --- ATENDIMENTOS ---
@app.get("/atendimentos")
def ler_atendimentos(db: Session = Depends(get_db)):
    return db.query(AtendimentoDB).all()

@app.post("/atendimentos")
def criar_atendimento(item: AtendimentoCreate, db: Session = Depends(get_db)):
    novo_atendimento = AtendimentoDB(
        descricao=item.descricao,
        categoria=item.categoria,
        tempo=item.tempo,
        usuario=item.usuario,
        data_registro=datetime.now().strftime("%d/%m/%Y %H:%M")
    )
    db.add(novo_atendimento)
    db.commit()
    db.refresh(novo_atendimento)
    return {"msg": "Salvo", "id": novo_atendimento.id}

# --- USUÁRIOS (GESTÃO) ---
@app.get("/usuarios", response_model=List[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(UsuarioDB).all()

@app.post("/usuarios")
def criar_usuario(item: UsuarioCreate, db: Session = Depends(get_db)):
    # Verifica duplicidade
    existente = db.query(UsuarioDB).filter(UsuarioDB.nome == item.nome).first()
    if existente:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    novo_user = UsuarioDB(nome=item.nome, senha=item.senha, funcao=item.funcao)
    db.add(novo_user)
    db.commit()
    return {"msg": "Usuário criado"}

@app.delete("/usuarios/{user_id}")
def deletar_usuario(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UsuarioDB).filter(UsuarioDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    db.delete(user)
    db.commit()
    return {"msg": "Deletado"}