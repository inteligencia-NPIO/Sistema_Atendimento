import { useState, useEffect } from 'react';
import { 
  Play, Square, Save, Clock, CheckCircle, LogOut, Calendar, FileText, Timer, 
  Headset, AlertCircle, XCircle, ChevronLeft, ChevronRight, LayoutDashboard, 
  ListChecks, BarChart2, Users, User, Trash2 // <--- ADICIONEI Trash2 AQUI
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from './api'; // <--- CONEXÃO COM O BACKEND

export default function Dashboard() {
  const navigate = useNavigate();
  
  const usuario = localStorage.getItem('usuario');
  const tipoUsuario = localStorage.getItem('tipo_usuario');

  // Se não tiver usuário salvo, manda pro login na hora!
  useEffect(() => {
    if (!usuario) {
      navigate('/');
    }
  }, [usuario, navigate]);
  
  // Verifica se o cargo é 'gestor'
  const isAdmin = tipoUsuario === 'gestor';

  // Estados
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lista, setLista] = useState([]);
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('1 - LIBERAÇÃO');
  const [showForm, setShowForm] = useState(false);
  const [erro, setErro] = useState('');
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // --- LÓGICA DO TIMER ---
  useEffect(() => {
    let interval = null;
    if (isRunning) interval = setInterval(() => setTimer(t => t + 1), 1000);
    else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isRunning]);

  // --- CARREGAR DADOS DO BANCO ---
  useEffect(() => { 
    if(usuario) carregarDados(); 
  }, [usuario]);

  const carregarDados = async () => {
    try {
      // <--- BUSCA DO BANCO REAL
      const res = await fetch(`${API_URL}/api/atendimentos`);
      if (res.ok) {
        const todosDados = await res.json();
        
        // 1. PEGA A DATA DE HOJE FORMATADA
        const hoje = new Date().toLocaleDateString('pt-BR');

        // 2. FILTRA: DATA DE HOJE + USUÁRIO LOGADO
        const dadosFiltrados = todosDados.filter(item => 
          item.data_registro && 
          item.data_registro.startsWith(hoje) && 
          item.usuario === usuario 
        );

        setLista(dadosFiltrados); 
      }
    } catch (error) {
      console.error("Erro ao carregar atendimentos:", error);
    }
  };

  // --- FORMATADORES E CÁLCULOS ---
  const formatTime = (s) => new Date(s * 1000).toISOString().substr(11, 8);

  const calcularTempoTotal = () => {
    let totalSegundos = 0;
    lista.forEach(item => {
      if (item.tempo) {
        const [h, m, s] = item.tempo.split(':').map(Number);
        totalSegundos += (h * 3600) + (m * 60) + s;
      }
    });
    return formatTime(totalSegundos);
  };

  // --- AÇÃO DE SALVAR NO BANCO ---
  const salvar = async () => {
    if (!desc.trim()) { 
      setErro("Preencha a descrição para finalizar!"); 
      return; 
    }

    const tempoFormatado = formatTime(timer);

    const novo = { 
      descricao: desc, 
      categoria: cat, 
      tempo: tempoFormatado, 
      usuario: usuario 
    };
    
    try {
      // <--- ENVIA PARA O BANCO REAL
      const res = await fetch(`${API_URL}/api/atendimentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novo),
      });

      if (res.ok) {
        setTimer(0); setDesc(''); setShowForm(false); setErro('');
        carregarDados(); // Recarrega a lista do banco
        setPaginaAtual(1);
      } else {
        setErro("Erro ao salvar. Verifique sua conexão.");
      }
    } catch (e) {
      setErro("Erro técnico ao conectar com o servidor.");
    }
  };

  // --- FUNÇÃO DE EXCLUIR (NOVA ADIÇÃO) ---
  const handleExcluir = async (id) => {
    // 1. Pergunta primeiro (Confirmação)
    if (!window.confirm("Tem certeza que deseja excluir este atendimento?")) return;

    try {
      // 2. Chama a rota de deletar no backend
      const res = await fetch(`${API_URL}/api/atendimentos/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        carregarDados(); // Atualiza a lista se deu certo
      } else {
        alert("Erro ao excluir. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  const cancelar = () => {
    setTimer(0); setDesc(''); setErro(''); setShowForm(false);
  };

  // --- LÓGICA DE PAGINAÇÃO ---
  const listaInvertida = lista.slice().reverse();
  const indexUltimo = paginaAtual * itensPorPagina;
  const indexPrimeiro = indexUltimo - itensPorPagina;
  const itensAtuais = listaInvertida.slice(indexPrimeiro, indexUltimo);
  const totalPaginas = Math.ceil(lista.length / itensPorPagina);

  // --- DATA DE HOJE ---
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  // Estilo para os links do menu
  const linkStyle = {
    color: 'white', textDecoration: 'none', fontWeight: 'bold', 
    display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '5px',
    transition: '0.2s', background: 'rgba(255,255,255,0.1)'
  };

  if (!usuario) return null;

  return (
    <div style={{minHeight: '100vh', background: '#F4F6F9', fontFamily: 'Segoe UI, sans-serif'}}>
      
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #B1D14B 0%, #004E4B 100%)', 
        padding: '30px 40px 80px 40px',
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{margin:0, fontSize: '28px'}}>Gestão de Atendimento</h1>
          <p style={{margin: '5px 0 0 0', opacity: 0.9}}>Atendente: {usuario}</p>
        </div>

        {/* MENU SUPERIOR */}
        <div style={{display: 'flex', alignItems: 'center', gap: '25px'}}>
          
          <nav style={{display: 'flex', gap: '15px'}}>
  
            <Link to="/app" style={{...linkStyle, background: 'rgba(255, 255, 255, 0.3)'}}>
              <ListChecks size={18}/> ATENDIMENTOS
            </Link>

            {isAdmin && (
              <>
                <Link to="/admin" style={linkStyle}>
                  <LayoutDashboard size={18}/> PAINEL
                </Link>

                <Link to="/usuarios" style={linkStyle}>
                  <Users size={18}/> USUÁRIOS
                </Link>
              </>
            )}

            {/* --- ÍCONE DE PERFIL (MANTIDO) --- */}
            <button 
              onClick={() => navigate('/perfil')} 
              style={{
                background: 'rgba(255,255,255,0.2)', 
                border: '1px solid rgba(255,255,255,0.4)', 
                color: 'white', 
                padding: '8px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center',
                marginRight: '5px'
              }}
              title="Meu Perfil"
            >
              <User size={18} />
            </button>

          </nav>

          <div style={{width: 1, height: 30, background: 'rgba(255,255,255,0.3)'}}></div>

          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{maxWidth: '180px', maxHeight: '60px', objectFit: 'contain'}} 
          />
          
          <button 
            onClick={() => {
              localStorage.removeItem('usuario');
              localStorage.removeItem('tipo_usuario');
              navigate('/');
            }} 
            style={{
              background: 'transparent', 
              border: '1px solid rgba(255,255,255,0.5)', 
              color: 'white', 
              padding: '8px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backdropFilter: 'blur(5px)'
            }}
            title="Sair"
          >
            <LogOut size={16}/>
          </button>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{padding: '0 40px', marginTop: '-50px'}}>
        
        {/* CARDS DE MÉTRICAS */}
        <div style={{display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap'}}>
          <div className="card" style={{flex: 1, display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'}}>
            <div style={{background: '#f9ffe7', padding: '12px', borderRadius: '10px'}}>
              <Calendar size={28} color="#b1d14b" />
            </div>
            <div>
              <small style={{color: '#666', fontWeight: 'bold'}}>DATA ATUAL</small>
              <div style={{fontSize: '22px', fontWeight: 'bold', color: '#333'}}>{dataHoje}</div>
            </div>
          </div>

          <div className="card" style={{flex: 1, display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'}}>
            <div style={{background: '#e6fff3', padding: '12px', borderRadius: '10px'}}>
              <FileText size={28} color="#00995d" />
            </div>
            <div>
              <small style={{color: '#666', fontWeight: 'bold'}}>ATENDIMENTOS HOJE</small>
              <div style={{fontSize: '22px', fontWeight: 'bold', color: '#333'}}>{lista.length}</div>
            </div>
          </div>

          <div className="card" style={{flex: 1, display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'}}>
            <div style={{background: '#e8fffe', padding: '12px', borderRadius: '10px'}}>
              <Timer size={28} color="#004e4b" />
            </div>
            <div>
              <small style={{color: '#666', fontWeight: 'bold'}}>TEMPO TOTAL HOJE</small>
              <div style={{fontSize: '22px', fontWeight: 'bold', color: '#333'}}>{calcularTempoTotal()}</div>
            </div>
          </div>
        </div>

        {/* ÁREA DE REGISTRO E LISTA */}
        <div style={{display: 'flex', gap: '30px', alignItems: 'flex-start'}}>
          
          {/* Esquerda: Cronômetro */}
          <div className="card" style={{flex: 1, textAlign: 'center', position: 'sticky', top: '20px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
            
            <h3 style={{color: '#444', display:'flex', alignItems:'center', gap:10, justifyContent:'center', marginTop: 0}}>
              <Headset size={24} color="#00995D"/> Novo Registro
            </h3>
            
            <div style={{background: '#F9FAFB', padding: '20px', borderRadius: '12px', margin: '20px 0', border: '1px solid #eee'}}>
               <div style={{fontSize: '54px', fontWeight: 'bold', color: '#222', fontFamily: 'monospace'}}>
                 {formatTime(timer)}
               </div>
            </div>

            {!showForm ? (
              <div style={{display: 'flex', gap: 10}}>
                <button 
                  className="btn" 
                  onClick={() => setIsRunning(true)} 
                  disabled={isRunning} 
                  style={{
                    background: isRunning ? '#cccccc' : '#00995D',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    color: isRunning ? '#888' : 'white',
                    flex: 1, padding: 12, border: 'none', borderRadius: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <Play size={18} style={{marginRight:5}}/> INICIAR
                </button>

                <button 
                  className="btn" 
                  onClick={() => {setIsRunning(false); setShowForm(true); setErro('')}} 
                  disabled={!isRunning} 
                  style={{
                    background: !isRunning ? '#cccccc' : '#d32f2f',
                    cursor: !isRunning ? 'not-allowed' : 'pointer',
                    color: !isRunning ? '#888' : 'white',
                    flex: 1, padding: 12, border: 'none', borderRadius: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <Square size={18} style={{marginRight:5}}/> PARAR
                </button>
              </div>
            ) : (
              <div style={{textAlign: 'left', animation: 'fadeIn 0.3s'}}>
                
                {erro && (
                  <div style={{
                    background: '#FFEBEE', color: '#D32F2F', padding: '10px 15px', borderRadius: '8px', 
                    marginBottom: '15px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px',
                    border: '1px solid #FFCDD2'
                  }}>
                    <AlertCircle size={16} /> <b>Atenção:</b> {erro}
                  </div>
                )}

                <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', display: 'block'}}>CATEGORIA</label>
                <select className="input-filter" value={cat} onChange={e => setCat(e.target.value)} style={{width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginBottom: 15}}>
                  <option>1 - LIBERAÇÃO</option>
                  <option>2 - BOLETO</option>
                  <option>3 - OUTROS SETORES</option>
                  <option>4 - I.R.</option>
                </select>

                <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', display: 'block'}}>DESCRIÇÃO</label>
                <input 
                  className="input-filter" 
                  autoFocus 
                  placeholder="Ex: Liberação de exame..." 
                  value={desc} 
                  onChange={e => {setDesc(e.target.value); setErro('')}} 
                  style={{borderColor: erro ? '#D32F2F' : '#ddd', width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box'}} 
                />

                <div style={{display: 'flex', gap: '10px', marginTop: 20}}>
                  <button className="btn" onClick={salvar} style={{background: '#004E4B', flex: 1, color: 'white', padding: 10, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <Save size={18} style={{marginRight: 5}}/> SALVAR
                  </button>
                  <button className="btn" onClick={cancelar} style={{background: '#d32f2f', flex: 1, color: 'white', padding: 10, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <XCircle size={18} style={{marginRight: 5}}/> CANCELAR
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Direita: Lista com Paginação */}
          <div className="card" style={{flex: 2, display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight: '400px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
            <div>
              
              {/* HEADER DA LISTA */}
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: '1px solid #eee', 
                paddingBottom: 15, 
                marginBottom: 15
              }}>
                <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#444'}}> 
                  <Clock size={20} color="#00995D"/> Histórico de Hoje 
                </h3>

                {/* BOTÃO MEU DESEMPENHO (MANTIDO) */}
                <button 
                  onClick={() => navigate('/meu-desempenho')} 
                  style={{
                    background: 'white', 
                    border: '1px solid #00995D', 
                    color: '#00995D', 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    transition: '0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#00995D'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#00995D'; }}
                >
                  <BarChart2 size={14}/> MEU DESEMPENHO
                </button>
              </div>
              
              {/* LISTA DE ITENS COM A LIXEIRA À DIREITA */}
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                {itensAtuais.map((item, i) => (
                  <div key={item.id || i} style={{padding: '15px', background: '#fff', border: '1px solid #eee', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 15, transition: '0.2s'}}>
                    <CheckCircle color="#00995D" size={24} />
                    
                    {/* TEXTO DO ITEM (Flex 1 empurra a lixeira pra direita) */}
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: 'bold', fontSize: 15, color: '#333'}}>{item.descricao}</div>
                      <div style={{color: '#777', fontSize: 13, marginTop: 4, display: 'flex', gap: 10, alignItems: 'center'}}>
                        <span style={{background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 'bold'}}>{item.categoria}</span>
                        <span style={{display: 'flex', alignItems: 'center', gap: 4}}><Timer size={12}/> {item.tempo}</span>
                        <span style={{display: 'flex', alignItems: 'center', gap: 4}}><Calendar size={12}/> {item.data_registro && item.data_registro.split(' ')[1]}</span>
                      </div>
                    </div>
                    
                    {/* BOTÃO EXCLUIR */}
                    <button 
                      onClick={() => handleExcluir(item.id)}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', color: '#d32f2f',
                        padding: '8px', borderRadius: '50%', transition: '0.2s', 
                        marginLeft: 'auto' // <--- A MÁGICA PARA FICAR NA DIREITA
                      }}
                      title="Excluir"
                      onMouseEnter={(e) => e.currentTarget.style.background = '#ffebee'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>
                ))}
                
                {lista.length === 0 && (
                  <div style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                    <p>Nenhum atendimento registrado hoje.</p>
                  </div>
                )}
              </div>
            </div>

            {/* CONTROLES DE PAGINAÇÃO */}
            {totalPaginas > 1 && (
              <div style={{display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', alignItems: 'center'}}>
                
                <button 
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  style={{
                    background: 'white', border: '1px solid #ddd', padding: '8px', borderRadius: '6px', 
                    cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer', opacity: paginaAtual === 1 ? 0.5 : 1
                  }}
                >
                  <ChevronLeft size={20} color="#004E4B"/>
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => setPaginaAtual(num)}
                    style={{
                      background: paginaAtual === num ? '#004E4B' : 'white',
                      color: paginaAtual === num ? 'white' : '#333',
                      border: '1px solid #ddd',
                      width: '35px', height: '35px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {num}
                  </button>
                ))}

                <button 
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  style={{
                    background: 'white', border: '1px solid #ddd', padding: '8px', borderRadius: '6px', 
                    cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer', opacity: paginaAtual === totalPaginas ? 0.5 : 1
                  }}
                >
                  <ChevronRight size={20} color="#004E4B"/>
                </button>

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}