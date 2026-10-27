import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarParaExibicao } from '../lib/telefones'
import NovaRevendedoraModal from '../components/NovaRevendedoraModal'
import type { LeadClinica } from '../types'
import { MARCA } from '../lib/marca'
import ExcluirPessoaButton from '../components/ExcluirPessoaButton'

export default function NovosContatos() {
  const [itens,setItens]=useState<LeadClinica[]>([]); const [busca,setBusca]=useState(''); const [modal,setModal]=useState(false); const navigate=useNavigate()
  async function carregar(){ const {data}=await supabase.from('crm_clinica').select('*').eq('total_pedidos',0).order('inicio_atendimento',{ascending:false}); setItens((data??[]) as LeadClinica[]) }
  useEffect(()=>{ void supabase.from('crm_clinica').select('*').eq('total_pedidos',0).order('inicio_atendimento',{ascending:false}).then(({data})=>setItens((data??[]) as LeadClinica[])) },[])
  const filtrados=useMemo(()=>itens.filter(x=>`${x.nome_lead} ${x.whatsapp_lead} ${x.cidade}`.toLowerCase().includes(busca.toLowerCase())),[itens,busca])
  return <div style={{padding:'28px 36px'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16}}><div><h1 style={{margin:0,fontSize:24,color:'#16232B'}}>Novos contatos</h1><p style={{color:'#6B818C'}}>Potenciais revendedoras que ainda não fizeram o primeiro pedido.</p></div><button onClick={()=>setModal(true)} style={{border:0,borderRadius:9,padding:'10px 15px',background:MARCA,color:'#fff',fontWeight:700,cursor:'pointer',display:'flex',gap:7}}><Plus size={16}/> Novo contato</button></div>
    <div style={{position:'relative',maxWidth:430,margin:'20px 0'}}><Search size={16} style={{position:'absolute',left:12,top:11,color:'#6B818C'}}/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por nome, WhatsApp ou cidade" style={{width:'100%',boxSizing:'border-box',padding:'10px 12px 10px 36px',border:'1px solid #DCE6EA',borderRadius:9}}/></div>
    <div style={{background:'#fff',border:'1px solid #DCE6EA',borderRadius:14,overflow:'hidden'}}>{filtrados.length===0?<div style={{padding:45,textAlign:'center',color:'#6B818C'}}><Users size={28}/><div>Nenhum contato encontrado.</div></div>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr style={{background:'#F7FAFB'}}>{['Nome','WhatsApp','Cidade','Interesses','Início da conversa',''].map(h=><th key={h} style={{textAlign:'left',padding:13,color:'#6B818C'}}>{h}</th>)}</tr></thead><tbody>{filtrados.map(x=><tr key={x.id} onClick={()=>navigate(`/leads/${x.id}`)} style={{borderTop:'1px solid #EDF2F4',cursor:'pointer'}}><td style={{padding:13,fontWeight:700}}>{x.nome_lead||'Sem nome'}</td><td style={{padding:13}}>{x.whatsapp_lead?formatarParaExibicao(x.whatsapp_lead):'—'}</td><td style={{padding:13}}>{x.cidade||'—'}</td><td style={{padding:13}}>{x.interesses_atacado?.join(', ')||'—'}</td><td style={{padding:13}}>{new Date(x.inicio_atendimento||x.created_at).toLocaleString('pt-BR')}</td><td style={{padding:10}}><ExcluirPessoaButton pessoa={x} onDeleted={()=>setItens(atual=>atual.filter(i=>i.id!==x.id))}/></td></tr>)}</tbody></table></div>}</div>
    {modal&&<NovaRevendedoraModal onClose={()=>setModal(false)} onSaved={carregar}/>}</div>
}
