import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { dataBR } from '../lib/atacado'
import type { LeadClinica } from '../types'
import { MARCA, MARCA_SUAVE } from '../lib/marca'

type Filtro = 'todos' | 'novos' | 'compraram'

export default function FollowUpsAtacado() {
  const [itens, setItens] = useState<LeadClinica[]>([])
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [dias, setDias] = useState(3); const [meses, setMeses] = useState(3)
  const [agora] = useState(() => Date.now())
  const navigate = useNavigate()
  useEffect(() => { Promise.all([supabase.from('crm_clinica').select('*'), supabase.from('configuracoes_atacado').select('*').eq('id', true).single()]).then(([leads, cfg]) => { setItens((leads.data ?? []) as LeadClinica[]); if (cfg.data) { setDias(cfg.data.dias_followup_novo_contato); setMeses(cfg.data.meses_alerta_recompra) } }) }, [])
  const pendentes = useMemo(() => {
    const limiteNovo = agora - dias * 86400000; const limiteCompra = new Date(agora); limiteCompra.setMonth(limiteCompra.getMonth() - meses)
    return itens.filter(x => {
      const comprou = x.total_pedidos > 0
      if (filtro === 'novos' && comprou) return false
      if (filtro === 'compraram' && !comprou) return false
      return comprou ? !!x.ultima_compra && new Date(`${x.ultima_compra}T12:00:00`) <= limiteCompra : new Date(x.ultima_mensagem || x.inicio_atendimento || x.created_at).getTime() <= limiteNovo
    })
  }, [itens, filtro, dias, meses, agora])
  return <div style={{ padding: '28px 36px' }}><h1 style={{ margin: 0, fontSize: 24, color: '#16232B' }}>Follow-up</h1><p style={{ color: '#6B818C' }}>Novos contatos parados há {dias} dias e revendedoras sem comprar há {meses} meses.</p>
    <div style={{ display: 'flex', gap: 8, margin: '22px 0' }}>{([['todos','Todos'],['novos','Novos contatos'],['compraram','Já compraram']] as [Filtro,string][]).map(([v,l]) => <button key={v} onClick={() => setFiltro(v)} style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid #DCE6EA', background: filtro === v ? MARCA_SUAVE : '#fff', color: filtro === v ? MARCA : '#6B818C', fontWeight: 600, cursor: 'pointer' }}>{l}</button>)}</div>
    <div style={{ display: 'grid', gap: 10 }}>{pendentes.map(x => <button key={x.id} onClick={() => navigate(`/leads/${x.id}`)} style={{ textAlign: 'left', padding: 17, borderRadius: 12, border: '1px solid #DCE6EA', background: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><strong style={{ color: '#16232B' }}>{x.nome_lead || 'Sem nome'}</strong><div style={{ color: '#6B818C', fontSize: 12.5, marginTop: 5 }}>{x.cidade || 'Cidade não informada'} · {x.interesses_atacado?.join(', ') || 'Interesse não informado'}</div></div><span style={{ color: x.total_pedidos ? '#D97706' : MARCA, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>{x.total_pedidos ? <AlertTriangle size={15}/> : <MessageCircle size={15}/>} {x.total_pedidos ? `Última compra: ${dataBR(x.ultima_compra)}` : 'Conversa sem continuidade'}</span></button>)}{pendentes.length === 0 && <div style={{ background: '#fff', border: '1px solid #DCE6EA', borderRadius: 12, padding: 40, textAlign: 'center', color: '#6B818C' }}>Nenhum follow-up pendente neste filtro.</div>}</div>
  </div>
}
