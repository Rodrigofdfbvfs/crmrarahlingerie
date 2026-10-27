import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { apagarPessoa } from '../lib/apagarPessoa'
import type { LeadClinica } from '../types'

export default function ExcluirPessoaButton({ pessoa, onDeleted }: { pessoa: LeadClinica; onDeleted: () => void }) {
  const [apagando, setApagando] = useState(false)

  async function excluir(e: React.MouseEvent) {
    e.stopPropagation()
    const nome = pessoa.nome_lead?.trim() || 'esta pessoa'
    const complemento = pessoa.total_pedidos > 0
      ? ` e seus ${pessoa.total_pedidos} pedido(s)`
      : ''
    if (!window.confirm(`Excluir ${nome}${complemento}?\n\nA ficha, a conversa e os dados relacionados serão apagados. Esta ação não pode ser desfeita.`)) return
    setApagando(true)
    try {
      await apagarPessoa(pessoa.id)
      onDeleted()
    } catch {
      window.alert('Não foi possível excluir. Atualize a página e tente novamente.')
      setApagando(false)
    }
  }

  return <button onClick={excluir} disabled={apagando} title="Excluir definitivamente" style={{ border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', width:34, height:34, borderRadius:8, display:'grid', placeItems:'center', cursor:apagando?'wait':'pointer' }}>
    <Trash2 size={15}/>
  </button>
}
