import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn } from 'lucide-react';
import API_URL from './api';

export default function Login() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // Conexão blindada usando o API_URL correto
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usuario, password: senha })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('usuario', data.usuario);
        localStorage.setItem('tipo_usuario', data.tipo);
        
        // Redirecionamento baseado no cargo
        if (data.tipo === 'gestor') {
          navigate('/admin');
        } else {
          navigate('/app');
        }
      } else {
        // Tenta ler a mensagem de erro do backend, se houver
        const errorData = await response.json().catch(() => ({}));
        setErro(errorData.detail || 'Usuário ou senha incorretos!');
      }

    } catch (error) {
      console.error("Erro de login:", error);
      setErro('Erro de conexão. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', fontFamily: 'Segoe UI, sans-serif'}}>
      
      <div className="card" style={{background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center'}}>
        <img src="/logo.png" alt="Unimed" style={{maxWidth: '180px', marginBottom: '20px'}} />
        
        <h2 style={{color: '#00995D', margin: '0 0 10px 0'}}>Atendimento</h2>
        <p style={{color: '#666', fontSize: '14px', marginBottom: '30px'}}>Bem-vindo. Faça login para continuar</p>

        {erro && (
          <div style={{
            padding: '10px', 
            background: '#ffebe6', 
            color: '#bf2c24', 
            borderRadius: '5px', 
            marginBottom: '20px', 
            fontSize: '13px',
            border: '1px solid #ffbdad'
          }}>
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{marginBottom: '15px', position: 'relative'}}>
            <User size={20} color="#00995D" style={{position: 'absolute', left: '12px', top: '12px'}} />
            <input 
              className="input-filter" // Usa a classe do seu CSS global se existir, ou o estilo inline abaixo
              type="text" 
              placeholder="Usuário" 
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              style={{width: '100%', padding: '12px 12px 12px 45px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', outline: 'none', transition: '0.2s'}}
              onFocus={(e) => e.target.style.borderColor = '#00995D'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{marginBottom: '25px', position: 'relative'}}>
            <Lock size={20} color="#00995D" style={{position: 'absolute', left: '12px', top: '12px'}} />
            <input 
              type="password" 
              placeholder="Senha" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={{width: '100%', padding: '12px 12px 12px 45px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', outline: 'none', transition: '0.2s'}}
              onFocus={(e) => e.target.style.borderColor = '#00995D'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%', padding: '12px', background: loading ? '#ccc' : '#00995D', color: 'white', 
              border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', 
              transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#007f4d')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#00995D')}
          >
            {loading ? 'Entrando...' : <><LogIn size={20} /> ACESSAR SISTEMA</>}
          </button>
        </form>
      </div>
      
      <p style={{marginTop: '30px', color: '#999', fontSize: '12px'}}>© 2026 Gestão de Atendimentos</p>
    </div>
  );
}