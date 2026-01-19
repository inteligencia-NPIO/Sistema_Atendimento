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

    const urlCompleta = `${API_URL}/api/login`;
    console.log("Tentando conectar em:", urlCompleta);

    try {
      const response = await fetch(urlCompleta, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usuario, password: senha })
      });

      console.log("Status da resposta:", response.status);

      // 1. Verificar se a resposta é JSON válido
      const textoResposta = await response.text();
      console.log("Conteúdo da resposta:", textoResposta);

      let data;
      try {
        data = JSON.parse(textoResposta);
      } catch (jsonError) {
        // Se der erro aqui, é porque o Vercel devolveu HTML (Erro 404 ou 500) em vez de JSON
        if (response.status === 404) {
             throw new Error("Erro 404: A rota de login não foi encontrada no Backend.");
        } else if (response.status === 500) {
             throw new Error("Erro 500: O Backend quebrou (Verifique os Logs na Vercel).");
        } else {
             throw new Error(`Erro Técnico: Recebi HTML em vez de dados. Status: ${response.status}`);
        }
      }

      // 2. Se for JSON, verificar se o login funcionou
      if (response.ok) {
        localStorage.setItem('usuario', data.usuario);
        localStorage.setItem('tipo_usuario', data.tipo);
        
        if (data.tipo === 'gestor') {
          navigate('/admin');
        } else {
          navigate('/app');
        }
      } else {
        setErro(data.detail || 'Usuário ou senha incorretos!');
      }

    } catch (error) {
      console.error("Erro capturado:", error);
      setErro(error.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', fontFamily: 'Segoe UI, sans-serif'}}>
      
      <div style={{background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center'}}>
        <img src="/logo.png" alt="Unimed" style={{maxWidth: '180px', marginBottom: '20px'}} />
        
        <h2 style={{color: '#00995D', margin: '0 0 10px 0'}}>Atendimento</h2>
        <p style={{color: '#666', fontSize: '14px', marginBottom: '30px'}}>Bem-vindo. Faça login para continuar</p>

        {/* ÁREA DE MENSAGEM DE ERRO MELHORADA */}
        {erro && (
          <div style={{
            padding: '10px', 
            background: '#ffebe6', 
            color: '#bf2c24', 
            borderRadius: '5px', 
            marginBottom: '20px', 
            fontSize: '13px', 
            textAlign: 'left',
            border: '1px solid #ffbdad'
          }}>
            <strong>Atenção:</strong> {erro}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{marginBottom: '15px', position: 'relative'}}>
            <User size={20} color="#00995D" style={{position: 'absolute', left: '10px', top: '12px'}} />
            <input 
              type="text" 
              placeholder="Usuário (ex: admin)" 
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              style={{width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '15px', boxSizing: 'border-box'}}
            />
          </div>

          <div style={{marginBottom: '25px', position: 'relative'}}>
            <Lock size={20} color="#00995D" style={{position: 'absolute', left: '10px', top: '12px'}} />
            <input 
              type="password" 
              placeholder="Senha" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={{width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '15px', boxSizing: 'border-box'}}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%', padding: '12px', background: loading ? '#ccc' : '#00995D', color: 'white', 
              border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', 
              transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            {loading ? 'Conectando...' : <><LogIn size={20} /> ENTRAR</>}
          </button>
        </form>
      </div>
      
      <p style={{marginTop: '30px', color: '#999', fontSize: '12px'}}>Sistema de Gestão de Senhas - Versão 1.0</p>
    </div>
  );
}