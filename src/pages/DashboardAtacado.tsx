import { useEffect, useState } from 'react'
import { AlertTriangle, DollarSign, MessageCircle, ShoppingBag, Target, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../lib/supabase'
import { moeda } from '../lib/atacado'
import { ROTULO_LEAD } from '../lib/statusLead'
import { MARCA, MARCA_SUAVE } from '../lib/marca'
import type { LeadStatus } from '../types'
import FiltroPeriodo from '../components/FiltroPeriodo'
import { getPeriodRange, type DateRange, type PeriodKey } from '../lib/periodo'

interface Resumo { faturamento_mes:number; pedidos_mes:number; revendedoras:number; novos_contatos:number; recompra_pendente:number; ticket_medio:number }
interface Mes { periodo:string; faturamento:number; pedidos:number; rotulo?:string }
interface Interesse { interesse:string; quantidade:number }
interface Funil { status:LeadStatus; quantidade:number; etapa?:string }
interface Cidade { cidade:string; faturamento:number; revendedoras:number }
const CORES=[MARCA,'#7C3AED','#D97706','#1A7A48','#DC2626','#4F46E5','#0891B2','#DB2777','#65A30D']
const CARTAO:React.CSSProperties={background:'#fff',border:'1px solid #DCE6EA',borderRadius:14,padding:20}

export default function DashboardAtacado(){
  const [periodo,setPeriodo]=useState<PeriodKey>('last30')
  const [faixa,setFaixa]=useState<DateRange>(()=>getPeriodRange('last30'))
  const [resumo,setResumo]=useState<Resumo>({faturamento_mes:0,pedidos_mes:0,revendedoras:0,novos_contatos:0,recompra_pendente:0,ticket_medio:0})
  const [meses,setMeses]=useState<Mes[]>([]);const [interesses,setInteresses]=useState<Interesse[]>([]);const [funil,setFunil]=useState<Funil[]>([]);const [cidades,setCidades]=useState<Cidade[]>([]);const [loading,setLoading]=useState(true)
  useEffect(()=>{
    const recorte=getPeriodRange(periodo,faixa)
    const local=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const p={p_inicio:local(recorte.start),p_fim:local(recorte.end)}
    setLoading(true)
    void Promise.all([supabase.rpc('dashboard_atacado_resumo_periodo',p),supabase.rpc('dashboard_atacado_serie_periodo',p),supabase.rpc('dashboard_atacado_interesses_periodo',p),supabase.rpc('dashboard_atacado_funil_periodo',p),supabase.rpc('dashboard_atacado_cidades_periodo',{...p,p_limite:8})]).then(([r,m,i,f,c])=>{
    if(r.data?.[0])setResumo(r.data[0] as Resumo)
    setMeses(((m.data??[]) as Mes[]).map(x=>({...x,rotulo:new Date(`${x.periodo}T12:00:00`).toLocaleDateString('pt-BR',recorte.end.getTime()-recorte.start.getTime()<=62*86400000?{day:'2-digit',month:'2-digit'}:{month:'short',year:'2-digit'})})))
    setInteresses((i.data??[]) as Interesse[]);setFunil(((f.data??[]) as Funil[]).map(x=>({...x,etapa:ROTULO_LEAD[x.status]??x.status})));setCidades((c.data??[]) as Cidade[]);setLoading(false)
  })},[periodo,faixa])
  const cards=[['Faturamento do mês',moeda(Number(resumo.faturamento_mes)),DollarSign,'#1A7A48'],['Pedidos no mês',resumo.pedidos_mes,ShoppingBag,MARCA],['Ticket médio',moeda(Number(resumo.ticket_medio)),Target,'#7C3AED'],['Revendedoras',resumo.revendedoras,Users,'#4F46E5'],['Novos contatos',resumo.novos_contatos,MessageCircle,'#0891B2'],['Recompra pendente',resumo.recompra_pendente,AlertTriangle,'#D97706']] as const
  return <div style={{padding:'28px 36px'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:18,flexWrap:'wrap'}}><div><h1 style={{margin:0,fontSize:24,color:'#16232B'}}>Dashboard comercial</h1><p style={{color:'#6B818C',marginTop:6}}>Faturamento, carteira e desempenho da jornada das revendedoras.</p></div><FiltroPeriodo periodo={periodo} onPeriodo={setPeriodo} faixa={faixa} onFaixa={setFaixa}/></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14,marginTop:22}}>{cards.map(([label,value,Icon,color])=><div key={label} style={CARTAO}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:12.5,color:'#6B818C'}}>{label}</span><span style={{display:'grid',placeItems:'center',width:32,height:32,borderRadius:9,background:MARCA_SUAVE}}><Icon size={16} color={color}/></span></div><div style={{fontSize:24,fontWeight:800,color:'#16232B',marginTop:13}}>{loading?'—':value}</div></div>)}</div>
    <div className="graficos-atacado" style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:16,marginTop:16}}>
      <Grafico titulo="Faturamento e pedidos" subtitulo="Evolução dentro do período selecionado"><ResponsiveContainer width="100%" height="100%"><BarChart data={meses}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="rotulo"/><YAxis yAxisId="valor" tickFormatter={v=>`R$ ${Number(v)/1000}k`}/><YAxis yAxisId="pedidos" orientation="right" allowDecimals={false}/><Tooltip formatter={(v,n)=>n==='Faturamento'?moeda(Number(v)):Number(v)}/><Legend/><Bar yAxisId="valor" dataKey="faturamento" name="Faturamento" fill={MARCA} radius={[5,5,0,0]}/><Bar yAxisId="pedidos" dataKey="pedidos" name="Pedidos" fill="#D97706" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></Grafico>
      <Grafico titulo="Interesses das clientes" subtitulo="Lingerie, biquíni e linha noite">{interesses.length?<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={interesses} dataKey="quantidade" nameKey="interesse" innerRadius={55} outerRadius={95} paddingAngle={3} label>{interesses.map((_,i)=><Cell key={i} fill={CORES[i%CORES.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer>:<Vazio/>}</Grafico>
      <Grafico titulo="Jornada comercial" subtitulo="Quantidade de contatos em cada etapa"><ResponsiveContainer width="100%" height="100%"><BarChart data={funil} layout="vertical" margin={{left:18}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="etapa" width={125} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="quantidade" name="Contatos" radius={[0,5,5,0]}>{funil.map((_,i)=><Cell key={i} fill={CORES[i%CORES.length]}/>)}</Bar></BarChart></ResponsiveContainer></Grafico>
      <Grafico titulo="Faturamento por cidade" subtitulo="Cidades com maior volume de compras">{cidades.length?<ResponsiveContainer width="100%" height="100%"><BarChart data={cidades} layout="vertical" margin={{left:20}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tickFormatter={v=>`R$ ${Number(v)/1000}k`}/><YAxis type="category" dataKey="cidade" width={105} tick={{fontSize:11}}/><Tooltip formatter={v=>moeda(Number(v))}/><Bar dataKey="faturamento" name="Faturamento" fill="#7C3AED" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer>:<Vazio/>}</Grafico>
    </div><style>{`@media(max-width:900px){.graficos-atacado{grid-template-columns:1fr!important}}`}</style>
  </div>
}

function Grafico({titulo,subtitulo,children}:{titulo:string;subtitulo:string;children:React.ReactNode}){return <section style={CARTAO}><h2 style={{fontSize:15,margin:'0 0 3px'}}>{titulo}</h2><p style={{fontSize:12,color:'#6B818C',margin:'0 0 14px'}}>{subtitulo}</p><div style={{height:300}}>{children}</div></section>}
function Vazio(){return <div style={{height:'100%',display:'grid',placeItems:'center',color:'#6B818C',fontSize:13,textAlign:'center'}}>O gráfico aparecerá conforme os dados forem cadastrados.</div>}
