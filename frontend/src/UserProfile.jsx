import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Save, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import API_URL from './api';

export default function UserProfile() {
  const navigate = useNavigate();
  const usuario = localStorage.getItem('usuario');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState(''); // <--- NOVO ESTADO
  
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!usuario) navigate('/');
  }, [usuario, navigate]);

  const handleSalvar = async () => {
    // 1. Valida se tudo está preenchido
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    // 2. Valida se as senhas batem (NOVA REGRA)
    if (novaSenha !== confirmarSenha) {
      setErro("A confirmação de senha não confere!");
      return;
    }

    setLoading(true);
    setMsg('');
    setErro('');

    try {
      const res = await fetch(`${API_URL}/api/minha-senha`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usuario,
          senha_atual: senhaAtual,
          nova_senha: novaSenha
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMsg("Senha alterada com sucesso!");
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha(''); // Limpa o campo de confirmação também
      } else {
        setErro(data.detail || "Erro ao alterar senha.");
      }
    } catch (error) {
      setErro("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight: '100vh', background: '#F4F6F9', fontFamily: 'Segoe UI, sans-serif'}}>
      
      {/* HEADER */}
      <div style={{background: 'linear-gradient(135deg, #B1D14B 0%, #004E4B 100%)', padding: '30px 40px', color: 'white', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}>
        <button onClick={() => navigate('/app')} style={{background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex'}}>
          <ArrowLeft size={20}/>
        </button>
        <h1 style={{margin:0, fontSize: '24px'}}>Meu Perfil</h1>
      </div>

      <div style={{padding: '40px', maxWidth: '600px', margin: '0 auto', marginTop: '-40px'}}>
        
        <div className="card" style={{background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
          
          <div style={{textAlign: 'center', marginBottom: 30}}>
            <div style={{width: 80, height: 80, background: '#e6fff3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto'}}>
              <User size={40} color="#00995D"/>
            </div>
            <h2 style={{margin: 0, color: '#333'}}>{usuario}</h2>
            <p style={{margin: '5px 0 0 0', color: '#888', fontSize: 14}}>Usuário do Sistema</p>
          </div>

          <div style={{borderTop: '1px solid #eee', paddingTop: 20}}>
            <h3 style={{color: '#004E4B', display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 20px 0'}}>
              <Shield size={20}/> Alterar Senha
            </h3>

            {msg && <div style={{background: '#e6fff3', color: '#00995D', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 14, textAlign: 'center', border: '1px solid #bcebc9'}}>{msg}</div>}
            {erro && <div style={{background: '#ffebe6', color: '#d32f2f', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 14, textAlign: 'center', border: '1px solid #ffbdad'}}>{erro}</div>}

            {/* SENHA ATUAL */}
            <div style={{marginBottom: 15}}>
              <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5, display: 'block'}}>SENHA ATUAL</label>
              <div style={{position: 'relative'}}>
                <Lock size={18} color="#999" style={{position: 'absolute', left: 12, top: 12}}/>
                <input 
                  type="password" 
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  style={{width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box'}}
                />
              </div>
            </div>

            {/* NOVA SENHA */}
            <div style={{marginBottom: 15}}>
              <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5, display: 'block'}}>NOVA SENHA</label>
              <div style={{position: 'relative'}}>
                <Lock size={18} color="#00995D" style={{position: 'absolute', left: 12, top: 12}}/>
                <input 
                  type="password" 
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Crie uma nova senha"
                  style={{width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #00995D', borderRadius: 8, boxSizing: 'border-box', outline: 'none'}}
                />
              </div>
            </div>

            {/* CONFIRMAR NOVA SENHA (NOVO CAMPO) */}
            <div style={{marginBottom: 25}}>
              <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5, display: 'block'}}>CONFIRMAR NOVA SENHA</label>
              <div style={{position: 'relative'}}>
                <CheckCircle size={18} color="#00995D" style={{position: 'absolute', left: 12, top: 12}}/>
                <input 
                  type="password" 
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  style={{width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #00995D', borderRadius: 8, boxSizing: 'border-box', outline: 'none'}}
                />
              </div>
            </div>

            <button 
              onClick={handleSalvar}
              disabled={loading}
              style={{
                width: '100%', padding: 12, background: '#004E4B', color: 'white', border: 'none', borderRadius: 8, 
                fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
              }}
            >
              {loading ? 'Salvando...' : <><Save size={18}/> ATUALIZAR SENHA</>}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}