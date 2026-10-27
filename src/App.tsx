import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/DashboardAtacado'
import CRM from './pages/CRM'
import Conversas from './pages/Conversas'
import Agenda from './pages/Agenda'
import Profissionais from './pages/Profissionais'
import NovosContatos from './pages/NovosContatos'
import Revendedoras from './pages/Revendedoras'
import RevendedoraDetail from './pages/RevendedoraDetail'
import FollowUpsAtacado from './pages/FollowUpsAtacado'
import ConfiguracoesComerciais from './pages/ConfiguracoesComerciais'
import Configuracoes from './pages/Configuracoes'
import Procedimentos from './pages/Procedimentos'
import SecretariaIA from './pages/SecretariaIA'
import TokenApi from './pages/TokenApi'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/conversas" element={<Conversas />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/profissionais" element={<Profissionais />} />
            <Route path="/servicos" element={<Procedimentos />} />
            <Route path="/atendente-ia" element={<SecretariaIA />} />
            <Route path="/token-api" element={<TokenApi />} />
            <Route path="/leads" element={<NovosContatos />} />
            <Route path="/clientes" element={<Revendedoras />} />
            <Route path="/leads/:id" element={<RevendedoraDetail />} />
            <Route path="/follow-ups" element={<FollowUpsAtacado />} />
            <Route path="/configuracoes-comerciais" element={<ConfiguracoesComerciais />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
