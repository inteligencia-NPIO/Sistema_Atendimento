import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Clock, Calendar, CheckCircle, 
  TrendingUp, ChevronDown, ChevronRight, Filter, Users 
} from 'lucide-react';
import API_URL from './api'; // <--- CONEXÃO COM O BANCO DE DADOS

// --- COMPONENTE: DROPDOWN DO CABEÇALHO (Estilo Unimed) ---
const HeaderDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha ao clicar fora
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
    <div ref={dropdownRef} style={{position: 'relative', minWidth: '220px'}}>
      {/* O BOTÃO (Visual Branco Limpo) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          cursor: 'pointer', 
          backgroundColor: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          transition: '0.2s',
          border: isOpen ? '1px solid #00995D' : '1px solid transparent'
        }}
      >
        <div style={{display:'flex', alignItems:'center', gap: 8}}>
          <Users size={16} color="#00995D"/>
          <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#333', fontWeight: 'bold', fontSize: '13px'}}>
            {value === 'TODOS' ? 'TODOS OS USUÁRIOS' : value.toUpperCase()}
          </span>
        </div>
        <ChevronDown 
          size={18} 
          color="#00995D" 
          style={{transition: '0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}} 
        />
      </div>

      {/* A LISTA SUSPENSA (Estilo Unimed) */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: '115%', left: 0, width: '100%',
          background: 'white', border: '1px solid #ddd', borderRadius: '8px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.15)', zIndex: 1000,
          overflow: 'hidden', animation: 'fadeIn 0.2s', maxHeight: '300px', overflowY: 'auto'
        }}>
          {options.map((opt) => (
            <div 
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              style={{
                padding: '10px 15px', cursor: 'pointer', fontSize: '13px',
                background: value === opt ? '#e6fff3' : 'white', 
                color: value === opt ? '#004E4B' : '#444',       
                fontWeight: value === opt ? 'bold' : 'normal',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex', alignItems: 'center', gap: 8
              }}
              onMouseEnter={(e) => { 
                if (value !== opt) { 
                  e.currentTarget.style.background = '#f9f9f9'; 
                  e.currentTarget.style.color = '#00995D'; 
                } 
              }}
              onMouseLeave={(e) => { 
                if (value !== opt) { 
                  e.currentTarget.style.background = 'white'; 
                  e.currentTarget.style.color = '#444'; 
                } 
              }}
            >
              {opt === 'TODOS' ? 'TODOS OS USUÁRIOS' : opt.toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE DE SESSÃO (ACORDEÃO) ---
const MesSection = ({ titulo, dados, totalHoras, isOpenDefault = false, mostrarUsuario }) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  return (
    <div style={{marginBottom: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden'}}>
      
      {/* CABEÇALHO DA SESSÃO */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '15px 20px', 
          background: isOpen ? '#004E4B' : 'white', 
          color: isOpen ? 'white' : '#333',
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          transition: '0.2s',
          borderBottom: isOpen ? 'none' : '1px solid #eee'
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          {isOpen ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
          <span style={{fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase'}}>{titulo}</span>
        </div>
        <div style={{fontSize: '13px', opacity: 0.9, fontWeight: '500'}}>
          TOTAL: {dados.length} | TEMPO: {totalHoras}
        </div>
      </div>

      {/* TABELA */}
      {isOpen && (
        <div style={{animation: 'fadeIn 0.3s'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #eee'}}>
                <th style={{padding: '12px 20px', color: '#666', fontSize: '12px'}}>DIA</th>
                {mostrarUsuario && <th style={{padding: '12px 20px', color: '#666', fontSize: '12px'}}>USUÁRIO</th>}
                <th style={{padding: '12px 20px', color: '#666', fontSize: '12px'}}>CATEGORIA</th>
                <th style={{padding: '12px 20px', color: '#666', fontSize: '12px'}}>DESCRIÇÃO</th>
                <th style={{padding: '12px 20px', color: '#666', fontSize: '12px'}}>TEMPO</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((item, i) => (
                <tr key={i} style={{borderBottom: '1px solid #f0f0f0'}}>
                  <td style={{padding: '12px 20px', color: '#333', fontSize: '13px', fontWeight: 'bold'}}>
                    {item.data_registro && item.data_registro.split(' ')[0].split('/')[0]} 
                    <span style={{color:'#999', fontWeight:'normal', fontSize:'11px', marginLeft:5}}>
                      ({item.data_registro && item.data_registro.split(' ')[1]}) 
                    </span>
                  </td>
                  
                  {mostrarUsuario && (
                     <td style={{padding: '12px 20px', fontSize: '12px', fontWeight: 'bold', color: '#555'}}>
                       {item.usuario}
                     </td>
                  )}

                  <td style={{padding: '12px 20px'}}>
                    <span style={{background: '#E8F5E9', color: '#2E7D32', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 'bold'}}>
                      {item.categoria}
                    </span>
                  </td>
                  <td style={{padding: '12px 20px', color: '#555', fontSize: '14px'}}>{item.descricao}</td>
                  <td style={{padding: '12px 20px', color: '#00995D', fontWeight:'bold', fontSize: '13px'}}>{item.tempo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default function UserPerformance() {
  const navigate = useNavigate();
  
  const usuarioLogado = localStorage.getItem('usuario');
  const tipoUsuario = localStorage.getItem('tipo_usuario');
  const isAdmin = tipoUsuario === 'gestor';

  const [listaCompleta, setListaCompleta] = useState([]); 
  const [listaFiltrada, setListaFiltrada] = useState([]); 
  
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState([]);
  const [filtroUsuario, setFiltroUsuario] = useState(isAdmin ? 'TODOS' : usuarioLogado);

  // --- CARREGAR DADOS (AGORA DO BANCO REAL) ---
  useEffect(() => {
    // <--- AQUI MUDOU: Usa API_URL em vez de localhost
    fetch(`${API_URL}/api/atendimentos`)
      .then(res => res.json())
      .then(data => {
        // Ordenação Cronológica (Mantida igualzinha)
        data.sort((a, b) => {
          if (!a.data_registro || !b.data_registro) return 0;
          const [diaA, mesA, anoA] = a.data_registro.split(' ')[0].split('/');
          const [horaA, minA] = a.data_registro.split(' ')[1].split(':');
          const dataA = new Date(anoA, mesA - 1, diaA, horaA, minA);

          const [diaB, mesB, anoB] = b.data_registro.split(' ')[0].split('/');
          const [horaB, minB] = b.data_registro.split(' ')[1].split(':');
          const dataB = new Date(anoB, mesB - 1, diaB, horaB, minB);
          return dataA - dataB;
        });

        // Extrair usuários para o filtro
        const usersUnicos = [...new Set(data.map(item => item.usuario))];
        setUsuariosDisponiveis(usersUnicos);

        setListaCompleta(data);
      })
      .catch(err => console.error("Erro ao buscar dados"));
  }, []);

  // --- APLICAR FILTRO (Mantido igual) ---
  useEffect(() => {
    if (listaCompleta.length === 0) return;

    let dados = [];
    if (isAdmin) {
      if (filtroUsuario === 'TODOS') {
        dados = listaCompleta;
      } else {
        dados = listaCompleta.filter(item => item.usuario === filtroUsuario);
      }
    } else {
      dados = listaCompleta.filter(item => item.usuario === usuarioLogado);
    }
    setListaFiltrada(dados);

  }, [listaCompleta, filtroUsuario, isAdmin, usuarioLogado]);


  // --- CÁLCULOS (Mantido igual) ---
  const tempoParaSegundos = (t) => {
    if (!t) return 0;
    const [h, m, s] = t.split(':').map(Number);
    return (h * 3600) + (m * 60) + s;
  };

  const segundosParaHora = (totalSeg) => {
    const h = Math.floor(totalSeg / 3600);
    const m = Math.floor((totalSeg % 3600) / 60);
    const s = Math.round(totalSeg % 60); 
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const calcularTotalLista = (itens) => {
    const total = itens.reduce((acc, item) => acc + tempoParaSegundos(item.tempo), 0);
    return segundosParaHora(total);
  };

  const tempoTotalGeral = useMemo(() => calcularTotalLista(listaFiltrada), [listaFiltrada]);

  // --- AGRUPAMENTO (Mantido igual) ---
  const dadosAgrupados = useMemo(() => {
    const grupos = {};
    listaFiltrada.forEach(item => {
      if(!item.data_registro) return;
      const [dia, mes, ano] = item.data_registro.split(' ')[0].split('/');
      const chave = `${mes}/${ano}`;
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(item);
    });

    const nomesMeses = {
      "01": "JANEIRO", "02": "FEVEREIRO", "03": "MARÇO", "04": "ABRIL",
      "05": "MAIO", "06": "JUNHO", "07": "JULHO", "08": "AGOSTO",
      "09": "SETEMBRO", "10": "OUTUBRO", "11": "NOVEMBRO", "12": "DEZEMBRO"
    };

    return Object.keys(grupos).map(chave => {
      const [mes, ano] = chave.split('/');
      return {
        titulo: `${nomesMeses[mes]} ${ano}`,
        dados: grupos[chave],
        totalHoras: calcularTotalLista(grupos[chave])
      };
    });
  }, [listaFiltrada]);

  return (
    <div style={{minHeight: '100vh', background: '#F4F6F9', fontFamily: 'Segoe UI, sans-serif'}}>
      
      {/* HEADER */}
      <div style={{background: 'linear-gradient(135deg, #B1D14B 0%, #004E4B 100%)', padding: '30px 40px 100px 40px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}>
        
        <div style={{display:'flex', flexDirection:'column', gap: 10}}>
          <div>
            <h1 style={{margin:0, fontSize: '24px'}}>
              {isAdmin && filtroUsuario === 'TODOS' ? 'Desempenho Geral' : 'Desempenho Individual'}
            </h1>
            <p style={{margin: '5px 0 0 0', opacity: 0.9}}>
              {isAdmin ? 'Visão Gerencial' : 'Histórico detalhado por período'}
            </p>
          </div>

          {/* --- DROPDOWN CUSTOMIZADO --- */}
          {isAdmin && (
            <div style={{marginTop: 5}}>
               <HeaderDropdown 
                 value={filtroUsuario} 
                 options={['TODOS', ...usuariosDisponiveis]} 
                 onChange={setFiltroUsuario}
               />
            </div>
          )}
        </div>

        <button onClick={() => navigate('/app')} style={{background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold', backdropFilter: 'blur(5px)'}}>
          <ArrowLeft size={18}/> Voltar
        </button>
      </div>

      <div style={{padding: '0 40px', marginTop: '-70px'}}>
        
        {/* CARDS */}
        <div style={{display: 'flex', gap: '20px', marginBottom: '30px'}}>
          <div className="card" style={{flex: 1, display: 'flex', alignItems: 'center', gap: '15px', padding: '25px', background: 'white', borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
            <div style={{background: '#e6fff3', padding: '15px', borderRadius: '12px'}}> <FileText size={32} color="#00995D" /> </div>
            <div> <small style={{color: '#666', fontWeight: 'bold'}}>TOTAL ATENDIMENTO</small> <div style={{fontSize: '28px', fontWeight: 'bold', color: '#333'}}>{listaFiltrada.length}</div> </div>
          </div>

          <div className="card" style={{flex: 1, display: 'flex', alignItems: 'center', gap: '15px', padding: '25px', background: 'white', borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
            <div style={{background: '#e8fffe', padding: '15px', borderRadius: '12px'}}> <Clock size={32} color="#004E4B" /> </div>
            <div> <small style={{color: '#666', fontWeight: 'bold'}}>HORAS TRABALHADAS</small> <div style={{fontSize: '28px', fontWeight: 'bold', color: '#333'}}>{tempoTotalGeral}</div> </div>
          </div>
        </div>

        {/* LISTA DE MESES */}
        <div style={{marginBottom: 50}}>
          <h3 style={{color: '#444', display:'flex', alignItems:'center', gap:10, margin: '0 0 20px 0'}}>
             <Filter size={20} color="#00995D"/> Detalhamento Mensal (Cronológico)
          </h3>

          {dadosAgrupados.map((grupo, index) => (
            <MesSection 
              key={index} 
              titulo={grupo.titulo} 
              dados={grupo.dados} 
              totalHoras={grupo.totalHoras}
              isOpenDefault={index === 0}
              mostrarUsuario={filtroUsuario === 'TODOS'} 
            />
          ))}

          {dadosAgrupados.length === 0 && (
            <div style={{background:'white', padding:40, borderRadius:12, textAlign:'center', color:'#999', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
              Nenhum registro encontrado para este filtro.
            </div>
          )}
        </div>

      </div>
    </div>
  );

}
