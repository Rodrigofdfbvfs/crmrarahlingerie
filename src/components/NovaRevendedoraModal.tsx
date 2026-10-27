import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { INTERESSES_ATACADO } from '../lib/atacado'
import CampoTelefone from './CampoTelefone'
import { MARCA, MARCA_CLARO, MARCA_SUAVE } from '../lib/marca'

interface Props {
  comPrimeiroPedido?: boolean
  onClose: () => void
  onSaved: () => void
}

export default function NovaRevendedoraModal({ comPrimeiroPedido = false, onClose, onSaved }: Props) {
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [whatsappValido, setWhatsappValido] = useState(false)
  const [cidade, setCidade] = useState('')
  const [inicio, setInicio] = useState(new Date().toISOString().slice(0, 16))
  const [interesses, setInteresses] = useState<string[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [dataPedido, setDataPedido] = useState(new Date().toISOString().slice(0, 10))
  const [valorPedido, setValorPedido] = useState('')
  const [observacaoPedido, setObservacaoPedido] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function salvar() {
    if (!nome.trim()) { setError('Informe o nome da revendedora.'); return }
    if (!whatsappValido) { setError('Informe um WhatsApp válido, com DDD.'); return }
    const valor = Number(valorPedido.replace(',', '.'))
    if (comPrimeiroPedido && (!dataPedido || !Number.isFinite(valor) || valor < 0)) {
      setError('Informe a data e o valor do primeiro pedido.'); return
    }
    setSaving(true); setError('')
    const { data: pessoa, error: pessoaError } = await supabase.from('crm_clinica').insert({
      nome_lead: nome.trim(),
      whatsapp_lead: whatsapp,
      cidade: cidade.trim() || null,
      inicio_atendimento: new Date(inicio).toISOString(),
      interesses_atacado: interesses,
      anotacoes: observacoes.trim() || null,
      status: comPrimeiroPedido ? 'consulta_realizada' : 'iniciou_conversa',
    }).select('id').single()
    if (pessoaError || !pessoa) {
      setSaving(false)
      setError(pessoaError?.code === '23505' ? 'Este WhatsApp já está cadastrado.' : 'Não foi possível salvar o cadastro.')
      return
    }
    if (comPrimeiroPedido) {
      const { error: pedidoError } = await supabase.from('pedidos_revendedora').insert({
        lead_id: pessoa.id, data_pedido: dataPedido, valor, observacoes: observacaoPedido.trim() || null,
      })
      if (pedidoError) {
        setSaving(false)
        setError('O cadastro foi criado, mas o primeiro pedido não foi salvo. Abra a ficha para registrá-lo.')
        return
      }
    }
    setSaving(false); onSaved(); onClose()
  }

  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid #DCE6EA', borderRadius: 9, fontFamily: 'inherit' }
  return <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,.32)', display:'grid', placeItems:'center', padding:20 }}>
    <div style={{ width:'100%', maxWidth:620, maxHeight:'90vh', overflowY:'auto', background:'#fff', borderRadius:16, padding:25, boxSizing:'border-box' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}><div><h2 style={{ margin:0, fontSize:18 }}>{comPrimeiroPedido ? 'Nova revendedora' : 'Novo contato'}</h2><p style={{ margin:'5px 0 0', color:'#6B818C', fontSize:12.5 }}>{comPrimeiroPedido ? 'Cadastre a cliente e sua primeira compra.' : 'Cadastre uma potencial revendedora que ainda não comprou.'}</p></div><button onClick={onClose} style={{ border:0, background:'none', cursor:'pointer' }}><X size={19}/></button></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:14, marginTop:20 }}>
        <label>Nome *<input value={nome} onChange={e=>setNome(e.target.value)} style={input}/></label>
        <CampoTelefone valor={whatsapp} onChange={(v, ok)=>{setWhatsapp(v);setWhatsappValido(ok)}} rotulo="WhatsApp *" />
        <label>Cidade<input value={cidade} onChange={e=>setCidade(e.target.value)} placeholder="Cidade / UF" style={input}/></label>
        <label>Início da conversa<input type="datetime-local" value={inicio} onChange={e=>setInicio(e.target.value)} style={input}/></label>
      </div>
      <div style={{ marginTop:16 }}><span style={{ fontSize:13, fontWeight:600 }}>Interesses</span><div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>{INTERESSES_ATACADO.map(i=><button type="button" key={i} onClick={()=>setInteresses(interesses.includes(i)?interesses.filter(x=>x!==i):[...interesses,i])} style={{ border:'1px solid #DCE6EA', borderRadius:20, padding:'7px 12px', background:interesses.includes(i)?MARCA_SUAVE:'#fff', color:interesses.includes(i)?MARCA:'#6B818C', cursor:'pointer' }}>{i}</button>)}</div></div>
      <label style={{ display:'block', marginTop:16 }}>Observações<textarea value={observacoes} onChange={e=>setObservacoes(e.target.value)} rows={3} style={{...input,resize:'vertical'}}/></label>
      {comPrimeiroPedido && <div style={{ marginTop:18, paddingTop:18, borderTop:'1px solid #EDF2F4' }}><strong style={{ fontSize:14 }}>Primeiro pedido</strong><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:12 }}><label>Data da compra *<input type="date" value={dataPedido} onChange={e=>setDataPedido(e.target.value)} style={input}/></label><label>Valor do pedido (R$) *<input type="number" min="0" step="0.01" value={valorPedido} onChange={e=>setValorPedido(e.target.value)} style={input}/></label></div><label style={{ display:'block',marginTop:12 }}>Observação do pedido<textarea value={observacaoPedido} onChange={e=>setObservacaoPedido(e.target.value)} rows={2} style={{...input,resize:'vertical'}}/></label></div>}
      {error && <div style={{ marginTop:14, padding:10, borderRadius:8, background:'#FEF2F2', color:'#DC2626', fontSize:13 }}>{error}</div>}
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}><button onClick={onClose} style={{ padding:'10px 16px', border:'1px solid #DCE6EA', borderRadius:9, background:'#fff', cursor:'pointer' }}>Cancelar</button><button onClick={salvar} disabled={saving} style={{ padding:'10px 18px', border:0, borderRadius:9, background:saving?MARCA_CLARO:MARCA, color:'#fff', fontWeight:700, cursor:'pointer' }}>{saving?'Salvando...':comPrimeiroPedido?'Cadastrar revendedora':'Cadastrar contato'}</button></div>
    </div>
  </div>
}
