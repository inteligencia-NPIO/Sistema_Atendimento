import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, ListChecks, LogOut, Users, UserPlus, 
  Trash2, ShieldCheck, User, ChevronDown, Eye, EyeOff 
} from 'lucide-react';
import API_URL from './api'; // <--- IMPORTANTE: Conexão com o Backend

// --- COMPONENTE DROPDOWN CUSTOMIZADO ---
const CustomDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const opcoes = [
    { valor: 'funcionario', texto: 'FUNCIONÁRIO (Acesso Padrão)' },
    { valor: 'gestor', texto: 'GESTOR (Acesso Total)' }
  ];

  const itemSelecionado = opcoes.find(op => op.valor === value) || opcoes[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{position: 'relative', width: '100%'}}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="input-filter" 
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          cursor: 'pointer', backgroundColor: 'white', paddingRight: '12px'
        }}
      >
        <span style={{color: '#333', fontSize: '14px'}}>{itemSelecionado.texto}</span>
        <ChevronDown size={20} color="#00995D" style={{transition: '0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, width: '100%',
          background: 'white', border: '1px solid #ddd', borderRadius: '8px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden', animation: 'fadeIn 0.2s'
        }}>
          {opcoes.map((op) => (
            <div 
              key={op.valor}
              onClick={() => { onChange(op.valor); setIsOpen(false); }}
              style={{
                padding: '12px 15px', cursor: 'pointer', fontSize: '14px',
                background: value === op.valor ? '#e6fff3' : 'white', 
                color: value === op.valor ? '#004E4B' : '#444',       
                fontWeight: value === op.valor ? 'bold' : 'normal',
                borderBottom: '1px solid #f0f0f0'
              }}
              onMouseEnter={(e) => { if (value !== op.valor) { e.currentTarget.style.background = '#f9f9f9'; e.currentTarget.style.color = '#00995D'; } }}
              onMouseLeave={(e) => { if (value !== op.valor) { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#444'; } }}
            >
              {op.texto}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function UserManagement() {
  const navigate = useNavigate();
  const usuarioLogado = localStorage.getItem('usuario');
  const tipoUsuario = localStorage.getItem('tipo_usuario');

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [funcao, setFuncao] = useState('funcionario');
  
  // Estados de Visualização (Olhinho)
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // Estados de Dados e UI
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Carrega usuários ao iniciar
  useEffect(() => {
    // Proteção de Rota: Só gestor acessa
    if (!usuarioLogado || tipoUsuario !== 'gestor') {
      alert("Acesso restrito a Gestores.");
      navigate('/app');
      return;
    }
    carregarUsuarios();
  }, [navigate, usuarioLogado, tipoUsuario]);

  const carregarUsuarios = async () => {
    try {
      // <--- CONECTADO NO BANCO REAL AGORA
      const res = await fetch(`${API_URL}/api/usuarios`);
      if (res.ok) {
        const data = await res.json();
        setListaUsuarios(data);
      }
    } catch (error) { 
      console.error("Erro ao carregar usuários:", error); 
    }
  };

  const handleSalvar = async () => {
    // Validações
    if (!nome || !senha || !confirmarSenha) return setMsg("Preencha todos os campos!");
    if (senha !== confirmarSenha) return setMsg("As senhas não conferem!");

    setLoading(true);
    try {
      // <--- ENVIA PARA O BANCO REAL
      const res = await fetch(`${API_URL}/api/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, senha, funcao })
      });

      if (res.ok) {
        setMsg("Usuário cadastrado com sucesso!");
        // Limpa formulário
        setNome(''); 
        setSenha(''); 
        setConfirmarSenha('');
        setFuncao('funcionario');
        carregarUsuarios(); // Atualiza a lista na hora
        setTimeout(() => setMsg(''), 3000);
      } else { 
        const erroData = await res.json();
        setMsg(`Erro: ${erroData.detail || 'Falha ao criar usuário'}`); 
      }
    } catch (error) { 
      setMsg("Erro de conexão com o servidor."); 
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id) => {
    if(!window.confirm("Tem certeza que deseja excluir este usuário?")) return;
    
    try {
      // <--- DELETA DO BANCO REAL
      const res = await fetch(`${API_URL}/api/usuarios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        carregarUsuarios();
      } else {
        alert("Erro ao excluir usuário.");
      }
    } catch (error) {
      alert("Erro de conexão.");
    }
  };

  const linkStyle = { color: 'white', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '5px', transition: '0.2s', background: 'rgba(255,255,255,0.1)' };
  const inputClass = "input-filter"; 

  return (
    <div style={{minHeight: '100vh', background: '#F4F6F9', fontFamily: 'Segoe UI, sans-serif'}}>
      
      {/* HEADER */}
      <div style={{background: 'linear-gradient(135deg, #B1D14B 0%, #004E4B 100%)', padding: '30px 40px 80px 40px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}>
        <div><h1 style={{margin:0, fontSize:'28px'}}>Gestão de Usuários</h1><p style={{margin:0, opacity:0.9}}>Controle de Acesso</p></div>
        <div style={{display:'flex', alignItems:'center', gap:'25px'}}>
          <nav style={{display:'flex', gap:'15px'}}>
            <Link to="/app" style={linkStyle}><ListChecks size={18}/> ATENDIMENTOS</Link>
            <Link to="/admin" style={linkStyle}><LayoutDashboard size={18}/> PAINEL</Link>
            <Link to="/usuarios" style={{...linkStyle, background: 'rgba(255,255,255,0.3)'}}><Users size={18}/> USUÁRIOS</Link>
          </nav>
          <div style={{width:1, height:30, background:'rgba(255,255,255,0.3)'}}></div>
          <img src="/logo.png" style={{maxWidth:180, maxHeight:60}} alt="Logo" />
          <button onClick={() => navigate('/')} style={{background:'transparent', border:'1px solid rgba(255,255,255,0.5)', padding:8, borderRadius:8, color:'white', cursor:'pointer'}} title="Sair"><LogOut size={16}/></button>
        </div>
      </div>

      <div style={{padding: '0 40px', marginTop: '-50px', display: 'flex', gap: 30, alignItems: 'flex-start'}}>
        
        {/* FORMULÁRIO */}
        <div className="card" style={{flex: 1, padding: 25, background: 'white', borderRadius: 12}}>
          <h3 style={{color: '#444', display:'flex', gap:10, margin: '0 0 20px 0', borderBottom: '1px solid #eee', paddingBottom: 15}}><UserPlus size={22} color="#00995D"/> Novo Usuário</h3>
          
          {msg && <div style={{padding: 10, background: msg.includes('sucesso') ? '#e6fff3' : '#FFEBEE', color: msg.includes('sucesso') ? '#00995D' : '#D32F2F', borderRadius: 6, marginBottom: 15, fontSize: 13, border: '1px solid', borderColor: msg.includes('sucesso') ? '#bcebc9' : '#FFCDD2'}}>{msg}</div>}
          
          <div style={{marginBottom: 15}}>
            <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', display: 'block', marginBottom: 5}}>NOME DE USUÁRIO</label>
            <input className={inputClass} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: gustavo.silva" />
          </div>
          
          {/* SENHA */}
          <div style={{marginBottom: 15}}>
            <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', display: 'block', marginBottom: 5}}>SENHA</label>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <input 
                type={mostrarSenha ? "text" : "password"} 
                className={inputClass} 
                value={senha} 
                onChange={e => setSenha(e.target.value)} 
                placeholder="••••••"
                style={{width: '100%', paddingRight: '40px'}} 
              />
              <button onClick={() => setMostrarSenha(!mostrarSenha)} type="button" style={{position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center'}}>
                {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* CONFIRMAR SENHA */}
          <div style={{marginBottom: 15}}>
            <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', display: 'block', marginBottom: 5}}>CONFIRMAR SENHA</label>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <input 
                type={mostrarConfirmarSenha ? "text" : "password"} 
                className={inputClass} 
                value={confirmarSenha} 
                onChange={e => setConfirmarSenha(e.target.value)} 
                placeholder="Repita a senha"
                style={{width: '100%', paddingRight: '40px'}} 
              />
              <button onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)} type="button" style={{position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center'}}>
                {mostrarConfirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div style={{marginBottom: 25}}>
            <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', display: 'block', marginBottom: 5}}>FUNÇÃO (PERMISSÃO)</label>
            <CustomDropdown value={funcao} onChange={setFuncao} />
          </div>
          
          <button onClick={handleSalvar} disabled={loading} className="btn" style={{background: loading ? '#ccc' : '#004E4B', color: 'white', width: '100%', padding: 12, borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: 8}}>
            {loading ? 'SALVANDO...' : <><UserPlus size={18}/> CADASTRAR</>}
          </button>
        </div>

        {/* LISTA DE USUÁRIOS */}
        <div className="card" style={{flex: 2, padding: 25, background: 'white', borderRadius: 12, minHeight: 400}}>
          <h3 style={{color: '#444', display:'flex', gap:10, margin: '0 0 20px 0', borderBottom: '1px solid #eee', paddingBottom: 15}}><ShieldCheck size={22} color="#00995D"/> Usuários Ativos</h3>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead><tr style={{background: '#f8f9fa', textAlign: 'left'}}><th style={{padding: 12, color: '#666'}}>Usuário</th><th style={{padding: 12, color: '#666'}}>Função</th><th style={{padding: 12, textAlign: 'right'}}>Ações</th></tr></thead>
            <tbody>
              {listaUsuarios.map((u, i) => (
                <tr key={i} style={{borderBottom: '1px solid #eee'}}>
                  <td style={{padding: 12, fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: 10}}><div style={{background: '#f0f0f0', padding: 8, borderRadius: '50%'}}><User size={16} color="#666"/></div>{u.nome}</td>
                  <td style={{padding: 12}}>
                    <span style={{
                      background: u.funcao === 'gestor' ? '#E3F2FD' : '#E8F5E9', 
                      color: u.funcao === 'gestor' ? '#1565C0' : '#2E7D32', 
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase',
                      border: '1px solid', borderColor: u.funcao === 'gestor' ? '#90CAF9' : '#A5D6A7'
                    }}>
                      {u.funcao}
                    </span>
                  </td>
                  <td style={{padding: 12, textAlign: 'right'}}>
                    {/* Impede que o admin se exclua ou exclua o admin principal se quiser colocar essa regra depois */}
                    <button onClick={() => handleExcluir(u.id)} style={{background: 'transparent', border: 'none', cursor: 'pointer'}} title="Excluir"><Trash2 size={18} color="#d32f2f"/></button>
                  </td>
                </tr>
              ))}
              {listaUsuarios.length === 0 && <tr><td colSpan="3" style={{padding:30, textAlign:'center', color:'#999'}}>Nenhum usuário encontrado (além de você).</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}