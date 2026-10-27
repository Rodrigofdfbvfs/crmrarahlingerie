export const INTERESSES_ATACADO = ['Lingerie', 'Biquíni', 'Linha Noite'] as const

export function moeda(valor: number | null | undefined) {
  return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function dataBR(data: string | null | undefined) {
  if (!data) return '—'
  const [ano, mes, dia] = data.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}
