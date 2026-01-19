import { useState, useEffect } from 'react';
import { Play, Square, Save, Clock, CheckCircle, LogOut, Calendar, FileText, Timer, Headset, AlertCircle, XCircle, ChevronLeft, ChevronRight, LayoutDashboard, ListChecks, BarChart2, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lista, setLista] = useState([]);
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('1 - LIBERAÇÃO');
  const [showForm, setShowForm] = useState(false);
  
  const [erro, setErro] = useState('');
  
  // --- PAGINAÇÃO ---
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const navigate = useNavigate();
  
  const usuario = localStorage.getItem('usuario');
  const tipoUsuario = localStorage.getItem('tipo_usuario');
  
  // Verifica se o cargo é 'gestor'
  const isAdmin = tipoUsuario === 'gestor';

  // --- LÓGICA DO TIMER ---
  useEffect(() => {
    let interval = null;
    if (isRunning) interval = setInterval(() => setTimer(t => t + 1), 1000);
    else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isRunning]);

  // --- CARREGAR DADOS (AGORA COM FILTRO DE DATA E USUÁRIO) ---
  useEffect(() => { carregarDados(); }, [usuario]); // Adicionei 'usuario' na dependência

  const carregarDados = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/atendimentos');
      const todosDados = await res.json();
      
      // 1. PEGA A DATA DE HOJE FORMATADA
      const hoje = new Date().toLocaleDateString('pt-BR');

      // 2. FILTRA: DATA DE HOJE + USUÁRIO LOGADO
      const dadosFiltrados = todosDados.filter(item => 
        item.data_registro && 
        item.data_registro.startsWith(hoje) && 
        item.usuario === usuario // <--- AQUI ESTÁ A CORREÇÃO DE PRIVACIDADE
      );

      setLista(dadosFiltrados); 
    } catch {}
  };

  // --- FORMATADORES E CÁLCULOS ---
  const formatTime = (s) => new Date(s * 1000).toISOString().substr(11, 8);

  const calcularTempoTotal = () => {
    let totalSegundos = 0;
    lista.forEach(item => {
      const [h, m, s] = item.tempo.split(':').map(Number);
      totalSegundos += (h * 3600) + (m * 60) + s;
    });
    return formatTime(totalSegundos);
  };

  // --- AÇÃO DE SALVAR ---
  const salvar = async () => {
    if (!desc.trim()) { 
      setErro("Preencha a descrição para finalizar!"); 
      return; 
    }

    const novo = { descricao: desc, categoria: cat, tempo: formatTime(timer), usuario: usuario };
    
    try {
      await fetch('http://127.0.0.1:8000/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novo),
      });

      setTimer(0); setDesc(''); setShowForm(false); setErro('');
      carregarDados();
      setPaginaAtual(1);
    } catch (e) {
      setErro("Erro ao salvar no sistema. Tente novamente.");
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

  return (
    <div style={{minHeight: '100vh', background: '#F4F6F9'}}>
      
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
              <Link to="/admin" style={linkStyle}>
                <LayoutDashboard size={18}/> PAINEL
              </Link>
            )}

            <Link to="/usuarios" style={linkStyle}>
              <Users size={18}/> USUÁRIOS
            </Link>

          </nav>

          <div style={{width: 1, height: 30, background: 'rgba(255,255,255,0.3)'}}></div>

          <img 
            src="/logo.png" 
            alt="Logo Unimed" 
            style={{maxWidth: '180px', maxHeight: '60px', objectFit: 'contain'}} 
          />
          
          <button 
            onClick={() => navigate('/')} 
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
          <div className="card" style={{flex: 1, display: 'flex', alignItems: 'center', gap: '15px', padding: '20px'}}>
            <div style={{background: '#f9ffe7', padding: '12px', borderRadius: '10px'}}>
              <Calendar size={28} color="#b1d14b" />
            </div>
            <div>
              <small style={{color: '#666', fontWeight: 'bold'}}>DATA ATUAL</small>
              <div style={{fontSize: '22px', fontWeight: 'bold', color: '#333'}}>{dataHoje}</div>
            </div>
          </div>

          <div className="card" style={{flex: 1, display: 'flex', alignItems: 'center', gap: '15px', padding: '20px'}}>
            <div style={{background: '#e6fff3', padding: '12px', borderRadius: '10px'}}>
              <FileText size={28} color="#00995d" />
            </div>
            <div>
              <small style={{color: '#666', fontWeight: 'bold'}}>ATENDIMENTOS HOJE</small>
              <div style={{fontSize: '22px', fontWeight: 'bold', color: '#333'}}>{lista.length}</div>
            </div>
          </div>

          <div className="card" style={{flex: 1, display: 'flex', alignItems: 'center', gap: '15px', padding: '20px'}}>
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
          <div className="card" style={{flex: 1, textAlign: 'center', position: 'sticky', top: '20px'}}>
            
            <h3 style={{color: '#444', display:'flex', alignItems:'center', gap:10, justifyContent:'center'}}>
              <Headset size={24} color="#00995D"/> Novo Registro
            </h3>
            
            <div style={{background: '#F9FAFB', padding: '20px', borderRadius: '12px', margin: '20px 0'}}>
               <div style={{fontSize: '54px', fontWeight: 'bold', color: '#222'}}>
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
                    color: isRunning ? '#888' : 'white'
                  }}
                >
                  <Play size={18} style={{marginBottom:-4, marginRight:5}}/> INICIAR
                </button>

                <button 
                  className="btn" 
                  onClick={() => {setIsRunning(false); setShowForm(true); setErro('')}} 
                  disabled={!isRunning} 
                  style={{
                    background: !isRunning ? '#cccccc' : '#d32f2f',
                    cursor: !isRunning ? 'not-allowed' : 'pointer',
                    color: !isRunning ? '#888' : 'white'
                  }}
                >
                  <Square size={18} style={{marginBottom:-4, marginRight:5}}/> PARAR
                </button>
              </div>
            ) : (
              <div style={{textAlign: 'left', animation: 'fadeIn 0.5s'}}>
                
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
                <select className="input" value={cat} onChange={e => setCat(e.target.value)}>
                  <option>1 - LIBERAÇÃO</option>
                  <option>2 - BOLETO</option>
                  <option>3 - OUTROS SETORES</option>
                  <option>4 - I.R.</option>
                </select>

                <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', marginTop: 15, display: 'block'}}>DESCRIÇÃO</label>
                <input 
                  className="input" 
                  autoFocus 
                  placeholder="Ex: Liberação de exame..." 
                  value={desc} 
                  onChange={e => {setDesc(e.target.value); setErro('')}} 
                  style={{borderColor: erro ? '#D32F2F' : '#ddd'}} 
                />

                <div style={{display: 'flex', gap: '10px', marginTop: 15}}>
                  <button className="btn" onClick={salvar} style={{background: '#004E4B', flex: 1}}>
                    <Save size={18} style={{marginBottom:-4, marginRight: 5}}/> SALVAR
                  </button>
                  <button className="btn" onClick={cancelar} style={{background: '#d32f2f', flex: 1}}>
                    <XCircle size={18} style={{marginBottom:-4, marginRight: 5}}/> CANCELAR
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Direita: Lista com Paginação */}
          <div className="card" style={{flex: 2, display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight: '400px'}}>
            <div>
              
              {/* BOTÃO MEU DESEMPENHO */}
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: '1px solid #eee', 
                paddingBottom: 15, 
                marginBottom: 15
              }}>
                <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: 10}}> 
                  <Clock size={20} color="#00995D"/> Histórico de Hoje 
                </h3>
                
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
              
              {/* LISTA DE ITENS */}
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                {itensAtuais.map((item, i) => (
                  <div key={i} style={{padding: '15px', background: '#fff', border: '1px solid #eee', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 15, transition: '0.2s'}}>
                    <CheckCircle color="#00995D" size={24} />
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: 'bold', fontSize: 16, color: '#333'}}>{item.descricao}</div>
                      <div style={{color: '#777', fontSize: 13, marginTop: 4, display: 'flex', gap: 10}}>
                        <span style={{background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 'bold'}}>{item.categoria}</span>
                        <span>Tempo: {item.tempo}</span>
                        <span>{item.data_registro && item.data_registro.split(' ')[1]}</span>
                      </div>
                    </div>
                    <div style={{fontSize: 12, color: '#999'}}>
                      Por: {item.usuario}
                    </div>
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