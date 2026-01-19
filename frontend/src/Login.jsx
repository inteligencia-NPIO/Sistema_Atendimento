import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, AlertCircle } from 'lucide-react'; // Importei o ícone de alerta
import API_URL from './api';

export default function Login() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [erro, setErro] = useState(''); // Variável para controlar a mensagem de erro
  const navigate = useNavigate();
  const usuario = localStorage.getItem('usuario');
  const tipoUsuario = localStorage.getItem('tipo_usuario');

  const isAdmin = tipoUsuario === 'gestor';

  const handleLogin = async () => {
    setErro(''); // Limpa erro anterior ao tentar de novo

    if (!user || !pass) {
      setErro('Preencha todos os campos!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usuario, password: senha })
      });

      const data = await res.json(); 

      if (res.ok) {
        // Salvamos o nome E o tipo de permissão
        localStorage.setItem('usuario', data.usuario);
        localStorage.setItem('tipo_usuario', data.tipo);
        
        navigate('/app');
      } else {
        setErro('Usuário ou senha incorretos!');
      }

    } catch (error) {
      setErro('Erro: O Sistema está desligado!');
    }
  };

  // Função para permitir apertar ENTER para entrar
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F6F9'}}>
      <div className="card" style={{width: 350, textAlign: 'center', padding: '40px 30px'}}>
        
        {/* --- 1. A LOGO AQUI --- */}
        <img 
          src="/logo.png" 
          alt="Logo Unimed" 
          style={{maxWidth: '180px', marginBottom: '20px'}} 
        />

        <h2 style={{color: '#00995D', margin: 0, fontSize: '24px'}}>Atendimento</h2>
        <p style={{color: '#666', marginTop: 5, marginBottom: 30}}>Bem-vindo. Faça login para continuar</p>
        
        {/* --- 2. MENSAGEM DE ERRO VISUAL --- */}
        {erro && (
          <div style={{
            background: '#ffebee', 
            color: '#d32f2f', 
            padding: '10px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center'
          }}>
            <AlertCircle size={16} /> {erro}
          </div>
        )}

        <div style={{marginTop: 20}}>
          <div style={{position: 'relative', marginBottom: 15}}>
            <User size={20} style={{position: 'absolute', top: 12, left: 12, color: '#00995D'}}/>
            <input 
              className="input" 
              style={{paddingLeft: 40, height: 45}} 
              placeholder="Usuário" 
              value={user} 
              onChange={e => {setUser(e.target.value); setErro('')}} 
              onKeyDown={handleKeyDown}
            />
          </div>
          <div style={{position: 'relative'}}>
            <Lock size={20} style={{position: 'absolute', top: 12, left: 12, color: '#00995D'}}/>
            <input 
              className="input" 
              style={{paddingLeft: 40, height: 45}} 
              type="password" 
              placeholder="Senha" 
              value={pass} 
              onChange={e => {setPass(e.target.value); setErro('')}} 
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <button className="btn" style={{marginTop: 30, height: 45, fontSize: 16}} onClick={handleLogin}>
          ACESSAR SISTEMA
        </button>
      </div>
    </div>
  );
}