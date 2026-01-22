import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, ListChecks, LogOut, Filter, Calendar, 
  FileText, Clock, Users, ChevronDown, Layers, User 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

import API_URL from './api'; // <--- CONEXÃO COM O BANCO DE DADOS

import DatePicker, { registerLocale } from "react-datepicker";
import ptBR from 'date-fns/locale/pt-BR';
import "react-datepicker/dist/react-datepicker.css";

registerLocale('pt-BR', ptBR);

// --- COMPONENTE CUSTOM DROPDOWN ---
const CustomDropdown = ({ value, onChange, options, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    <div style={{flex: 1.5, minWidth: '200px'}}>
      <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5, display: 'block'}}>{label}</label>
      <div ref={dropdownRef} style={{position: 'relative', width: '100%'}}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="input-filter" 
          style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', backgroundColor: 'white'}}
        >
          <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#333'}}>{value}</span>
          <ChevronDown size={20} color="#00995D" style={{transition: '0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}} />
        </div>
        {isOpen && (
          <div style={{
            position: 'absolute', top: '110%', left: 0, width: '100%',
            background: 'white', border: '1px solid #ddd', borderRadius: '8px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden', animation: 'fadeIn 0.2s'
          }}>
            {options.map((opt) => (
              <div 
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                style={{
                  padding: '12px 15px', cursor: 'pointer', fontSize: '14px',
                  background: value === opt ? '#e6fff3' : 'white', 
                  color: value === opt ? '#004E4B' : '#444',       
                  fontWeight: value === opt ? 'bold' : 'normal',
                  borderBottom: '1px solid #f0f0f0'
                }}
                onMouseEnter={(e) => { if (value !== opt) { e.currentTarget.style.background = '#f9f9f9'; e.currentTarget.style.color = '#00995D'; } }}
                onMouseLeave={(e) => { if (value !== opt) { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#444'; } }}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const usuario = localStorage.getItem('usuario');
  const tipoUsuario = localStorage.getItem('tipo_usuario');

  const [listaCompleta, setListaCompleta] = useState([]);
  const [listaFiltrada, setListaFiltrada] = useState([]);

  // Filtros
  const [dataIni, setDataIni] = useState(null);
  const [dataFim, setDataFim] = useState(null);
  const [catFiltro, setCatFiltro] = useState('TODAS AS CATEGORIAS');

  const opcoesCategoria = ["TODAS AS CATEGORIAS", "1 - LIBERAÇÃO", "2 - BOLETO", "3 - OUTROS SETORES", "4 - I.R."];

  useEffect(() => {
    if (!usuario || tipoUsuario !== 'gestor') {
      alert("Acesso Negado.");
      navigate('/app');
    }
  }, [navigate, usuario, tipoUsuario]);

  // --- CARREGAR DADOS DO BANCO REAL ---
  useEffect(() => {
    // <--- AQUI MUDOU: Usa API_URL em vez de localhost
    fetch(`${API_URL}/api/atendimentos`)
      .then(res => res.json())
      .then(data => {
        setListaCompleta(data);
        setListaFiltrada(data); 
      })
      .catch(err => console.error("Erro ao buscar dados"));
  }, []);

  useEffect(() => {
    let dados = [...listaCompleta];
    if (dataIni && dataFim) {
      const inicio = new Date(dataIni); inicio.setHours(0,0,0,0);
      const fim = new Date(dataFim); fim.setHours(23,59,59,999);
      dados = dados.filter(item => {
        if (!item.data_registro) return false;
        const [dia, mes, ano] = item.data_registro.split(' ')[0].split('/');
        const dataItem = new Date(`${ano}-${mes}-${dia}`);
        return dataItem >= inicio && dataItem <= fim;
      });
    }
    if (catFiltro !== 'TODAS AS CATEGORIAS') {
      dados = dados.filter(item => item.categoria.includes(catFiltro));
    }
    setListaFiltrada(dados);
  }, [dataIni, dataFim, catFiltro, listaCompleta]);

  // --- CÁLCULOS ---
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

  const calcularTempoTotal = (lista) => {
    const total = lista.reduce((acc, item) => acc + tempoParaSegundos(item.tempo), 0);
    return segundosParaHora(total);
  };

  // --- DADOS PARA GRÁFICOS ---
  const dadosGraficoMes = useMemo(() => {
    const grupos = {};
    listaFiltrada.forEach(item => {
      if(!item.data_registro) return;
      const [dia, mes, ano] = item.data_registro.split(' ')[0].split('/');
      const chave = `${mes}/${ano}`;
      if (!grupos[chave]) grupos[chave] = { name: chave, qtd: 0, minutos: 0 };
      grupos[chave].qtd += 1;
      grupos[chave].minutos += (tempoParaSegundos(item.tempo) / 60);
    });
    return Object.values(grupos);
  }, [listaFiltrada]);

  // CÁLCULO DA MÉDIA EM SEGUNDOS PARA ATENDENTES
  const dadosPorUsuario = useMemo(() => {
    const grupos = {};
    listaFiltrada.forEach(item => {
      const user = item.usuario || 'Desconhecido';
      if (!grupos[user]) grupos[user] = { nome: user, qtd: 0, segundos: 0 };
      grupos[user].qtd += 1;
      grupos[user].segundos += tempoParaSegundos(item.tempo);
    });
    return Object.values(grupos).map(g => ({
      ...g,
      tempoFormatado: segundosParaHora(g.segundos),
      // Calcula a média exata em segundos (ex: 148 / 5 = 29.6)
      mediaSegundos: g.qtd > 0 ? (g.segundos / g.qtd) : 0,
      minutosGrafico: parseFloat((g.segundos / 60).toFixed(1))
    }));
  }, [listaFiltrada]);

  // CÁLCULO DA MÉDIA EM SEGUNDOS PARA ASSUNTOS
  const dadosPorAssunto = useMemo(() => {
    const grupos = {
      "1 - LIBERAÇÃO": { categoria: "1 - LIBERAÇÃO", qtd: 0, segundos: 0 },
      "2 - BOLETO": { categoria: "2 - BOLETO", qtd: 0, segundos: 0 },
      "3 - OUTROS SETORES": { categoria: "3 - OUTROS SETORES", qtd: 0, segundos: 0 },
      "4 - I.R.": { categoria: "4 - I.R.", qtd: 0, segundos: 0 }
    };

    listaFiltrada.forEach(item => {
      const cat = item.categoria || 'Sem Categoria';
      if (!grupos[cat]) grupos[cat] = { categoria: cat, qtd: 0, segundos: 0 };
      grupos[cat].qtd += 1;
      grupos[cat].segundos += tempoParaSegundos(item.tempo);
    });

    return Object.values(grupos).map(g => ({
      ...g,
      tempoFormatado: segundosParaHora(g.segundos),
      // Calcula a média exata em segundos
      mediaSegundos: g.qtd > 0 ? (g.segundos / g.qtd) : 0
    }));
  }, [listaFiltrada]);

  const linkStyle = { color: 'white', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '5px', transition: '0.2s', background: 'rgba(255,255,255,0.1)' };
  const inputClass = "input-filter"; 

  return (
    <div style={{minHeight: '100vh', background: '#F4F6F9', fontFamily: 'Segoe UI, sans-serif'}}>
      
      {/* HEADER */}
      <div style={{background: 'linear-gradient(135deg, #B1D14B 0%, #004E4B 100%)', padding: '30px 40px 80px 40px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}>
        <div>
          <h1 style={{margin:0, fontSize: '28px'}}>Painel Gerencial</h1>
          <p style={{margin: '5px 0 0 0', opacity: 0.9}}>Gestão de Performance</p>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '25px'}}>
          <nav style={{display: 'flex', gap: '15px'}}>
            <Link to="/app" style={linkStyle}><ListChecks size={18}/> ATENDIMENTOS</Link>
            <Link to="/admin" style={{...linkStyle, background: 'rgba(255,255,255,0.3)'}}><LayoutDashboard size={18}/> PAINEL</Link>
            <Link to="/usuarios" style={linkStyle}><Users size={18}/> USUÁRIOS</Link>
             {/* --- ÍCONE DE PERFIL --- */}
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
          <img src="/logo.png" alt="Logo" style={{maxWidth: '180px', maxHeight: '60px', objectFit: 'contain'}} />
          <button onClick={() => navigate('/')} style={{background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: 'white', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex'}} title="Sair"><LogOut size={16}/></button>
        </div>
      </div>

      <div style={{padding: '0 40px', marginTop: '-50px'}}>
        
        {/* CARDS DE FILTRO */}
        <div style={{display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap'}}>
          <div className="card" style={{flex: 2, padding: '25px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: '#004E4B', borderBottom: '1px solid #eee', paddingBottom: 10}}>
              <Filter size={20}/> <h3 style={{margin:0}}>Filtros Avançados</h3>
            </div>
            <div style={{display: 'flex', gap: 20, flexWrap: 'wrap'}}>
              <div style={{flex: 1, minWidth: '150px'}}>
                <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5, display: 'block'}}>DATA INICIAL</label>
                <DatePicker selected={dataIni} onChange={(date) => setDataIni(date)} dateFormat="dd/MM/yyyy" locale="pt-BR" placeholderText="Selecione início" className={inputClass} />
              </div>
              <div style={{flex: 1, minWidth: '150px'}}>
                <label style={{fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5, display: 'block'}}>DATA FINAL</label>
                <DatePicker selected={dataFim} onChange={(date) => setDataFim(date)} dateFormat="dd/MM/yyyy" locale="pt-BR" placeholderText="Selecione fim" className={inputClass} />
              </div>
              <CustomDropdown label="CATEGORIA" value={catFiltro} options={opcoesCategoria} onChange={setCatFiltro} />
            </div>
          </div>

          <div className="card" style={{flex: 1, display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: 'white'}}>
            <div style={{background: '#e6fff3', padding: '15px', borderRadius: '12px'}}> <FileText size={32} color="#00995d" /> </div>
            <div> <small style={{color: '#666', fontWeight: 'bold'}}>TOTAL ATENDIMENTOS</small> <div style={{fontSize: '28px', fontWeight: 'bold', color: '#333'}}>{listaFiltrada.length}</div> </div>
          </div>

          <div className="card" style={{flex: 1, display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: 'white'}}>
            <div style={{background: '#e8fffe', padding: '15px', borderRadius: '12px'}}> <Clock size={32} color="#004e4b" /> </div>
            <div> <small style={{color: '#666', fontWeight: 'bold'}}>TEMPO TOTAL</small> <div style={{fontSize: '28px', fontWeight: 'bold', color: '#333'}}>{calcularTempoTotal(listaFiltrada)}</div> </div>
          </div>
        </div>

        {/* --- GRÁFICOS SUPERIORES --- */}
        <div style={{display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 30}}>
          <div className="card" style={{flex: 1, minWidth: '300px', height: '350px'}}>
            <h4 style={{textAlign:'center', color:'#666', marginTop:0}}>Atendimentos por Mês</h4>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={dadosGraficoMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 'dataMax + 2']} />
                <Tooltip />
                <Legend />
                <Bar dataKey="qtd" name="Quantidade" fill="#00995D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{flex: 1, minWidth: '300px', height: '350px'}}>
            <h4 style={{textAlign:'center', color:'#666', marginTop:0}}>Tempo Total</h4>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={dadosGraficoMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => segundosParaHora(val * 60)} width={80} />
                <Tooltip formatter={(value) => [segundosParaHora(value * 60), "Tempo Total"]} />
                <Legend />
                <Bar dataKey="minutos" name="Tempo Total (Visual)" fill="#004E4B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- GRÁFICO PERFORMANCE + TABELA ATENDENTES --- */}
        <div style={{display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 30}}>
          <div className="card" style={{flex: 1, minWidth: '300px', height: '400px'}}>
            <h4 style={{textAlign:'center', color:'#666', marginTop:0}}>Performance por Atendente</h4>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={dadosPorUsuario} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nome" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="qtd" name="Atendimentos" fill="#B1D14B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{flex: 2, minWidth: '400px', height: '400px', overflowY: 'auto'}}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:20, borderBottom:'1px solid #eee', paddingBottom:15}}>
               <Users size={20} color="#00995D"/> <h3 style={{margin:0}}>Detalhamento por Atendente</h3>
            </div>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#f8f9fa', textAlign: 'left'}}>
                  <th style={{padding: 12, borderBottom: '2px solid #ddd', color: '#666'}}>Atendente</th>
                  <th style={{padding: 12, borderBottom: '2px solid #ddd', color: '#666'}}>Qtd.</th>
                  <th style={{padding: 12, borderBottom: '2px solid #ddd', color: '#666'}}>Tempo Total</th>
                  <th style={{padding: 12, borderBottom: '2px solid #ddd', color: '#666'}}>Média</th>
                </tr>
              </thead>
              <tbody>
                {dadosPorUsuario.map((user, i) => (
                  <tr key={i} style={{borderBottom: '1px solid #eee'}}>
                    <td style={{padding: 12, fontWeight:'bold', color: '#333'}}>{user.nome}</td>
                    <td style={{padding: 12}}>{user.qtd}</td>
                    <td style={{padding: 12, color: '#00995D', fontWeight:'bold'}}>{user.tempoFormatado}</td>
                    <td style={{padding: 12, color: '#666'}}>
                      {user.qtd > 0 ? segundosParaHora(user.mediaSegundos) : "00:00:00"}
                    </td>
                  </tr>
                ))}
                {dadosPorUsuario.length === 0 && (<tr><td colSpan={4} style={{padding: 20, textAlign: 'center', color: '#999'}}>Nenhum dado encontrado.</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- TABELA POR ASSUNTO --- */}
        <div className="card" style={{marginBottom: 50}}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:20, borderBottom:'1px solid #eee', paddingBottom:15}}>
             <Layers size={20} color="#00995D"/> <h3 style={{margin:0}}>Detalhamento por Assunto (Categoria)</h3>
          </div>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#f8f9fa', textAlign: 'left'}}>
                <th style={{padding: 12, borderBottom: '2px solid #ddd', color: '#666'}}>Assunto</th>
                <th style={{padding: 12, borderBottom: '2px solid #ddd', color: '#666'}}>Quantidade</th>
                <th style={{padding: 12, borderBottom: '2px solid #ddd', color: '#666'}}>Tempo Total</th>
                <th style={{padding: 12, borderBottom: '2px solid #ddd', color: '#666'}}>Média</th>
              </tr>
            </thead>
            <tbody>
              {dadosPorAssunto.map((item, i) => (
                <tr key={i} style={{borderBottom: '1px solid #eee'}}>
                  <td style={{padding: 12, fontWeight:'bold', color: '#333'}}>{item.categoria}</td>
                  <td style={{padding: 12}}>{item.qtd}</td>
                  <td style={{padding: 12, color: '#004E4B', fontWeight:'bold'}}>{item.tempoFormatado}</td>
                  <td style={{padding: 12, color: '#666'}}>
                    {item.qtd > 0 ? segundosParaHora(item.mediaSegundos) : "00:00:00"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );

}
