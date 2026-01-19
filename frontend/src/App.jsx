import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel'; 
import UserPerformance from './UserPerformance';
import UserManagement from './UserManagement';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/meu-desempenho" element={<UserPerformance />} />
        <Route path="/usuarios" element={<UserManagement />} />
      </Routes>
    </BrowserRouter>
  );
}