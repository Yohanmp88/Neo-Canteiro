const fs = require('fs')

const path = 'src/lib/operationalData.js'
let source = fs.readFileSync(path, 'utf8')

const oldReceived = `export function statusRecebidoOperacional(status) {
  const texto = normalizarTextoOperacional(status)
  return texto.includes('recebido') || texto.includes('entregue') || texto.includes('concluido')
}`

const newReceived = `export function statusRecebidoOperacional(status) {
  const texto = normalizarTextoOperacional(status).trim()
  if (!texto || texto.includes('nao recebido') || texto.includes('parcial')) return false
  return /^(recebido|entregue|concluido)(\\b|$)/.test(texto)
}

export function statusCanceladoOperacional(status) {
  const texto = normalizarTextoOperacional(status)
  return texto.includes('cancelad') || texto.includes('excluid')
}

export function dataPrevistaPedidoOperacional(pedido) {
  return pedido?.data_prevista || pedido?.entrega_prevista || pedido?.data_reprogramada || pedido?.data_prevista_original || pedido?.data
}

export function diasAtrasoEntregaOperacional(pedido, referencia = new Date()) {
  const previsao = parseDataOperacional(dataPrevistaPedidoOperacional(pedido))
  if (!previsao) return 0

  const hoje = new Date(referencia)
  hoje.setHours(12, 0, 0, 0)
  return Math.max(0, Math.floor((hoje - previsao) / 86400000))
}`

const oldImpact = `export function diasImpactoPedidoOperacional(pedido, referencia = new Date()) {
  const previsao = pedido?.data_prevista || pedido?.data_reprogramada || pedido?.data
  const necessidade = pedido?.data_necessidade
  const dataPrevisao = parseDataOperacional(previsao)

  if (!dataPrevisao) return 0

  if (necessidade) {
    const dataNecessidade = parseDataOperacional(necessidade)
    if (!dataNecessidade) return 0
    return Math.max(0, Math.ceil((dataPrevisao - dataNecessidade) / 86400000))
  }

  const hoje = new Date(referencia)
  hoje.setHours(12, 0, 0, 0)
  return Math.max(0, Math.ceil((hoje - dataPrevisao) / 86400000))
}

export function pedidoAtrasadoOperacional(pedido, referencia = new Date()) {
  if (statusRecebidoOperacional(pedido?.status) || pedido?.data_entrega) return false

  const status = normalizarTextoOperacional(pedido?.status)
  return status.includes('atrasad') || status.includes('vencid') || status.includes('fora do prazo') || diasImpactoPedidoOperacional(pedido, referencia) > 0
}`

const newImpact = `export function diasImpactoPedidoOperacional(pedido, referencia = new Date()) {
  const dataPrevisao = parseDataOperacional(dataPrevistaPedidoOperacional(pedido))
  const necessidade = parseDataOperacional(pedido?.data_necessidade || pedido?.necessario_em)
  const atrasoEntrega = diasAtrasoEntregaOperacional(pedido, referencia)

  if (!dataPrevisao || !necessidade) return atrasoEntrega
  const impactoCronograma = Math.max(0, Math.ceil((dataPrevisao - necessidade) / 86400000))
  return Math.max(atrasoEntrega, impactoCronograma)
}

export function pedidoAtrasadoOperacional(pedido, referencia = new Date()) {
  const status = normalizarTextoOperacional(pedido?.status)
  const statusRecebimento = pedido?.recebimento_status || pedido?.status_recebimento
  const temDataRecebimento = Boolean(pedido?.data_entrega || pedido?.data_recebimento || pedido?.recebido_em)

  if (statusCanceladoOperacional(status)) return false
  if (statusRecebidoOperacional(status) || statusRecebidoOperacional(statusRecebimento) || temDataRecebimento) return false
  if (status.includes('atrasad') || status.includes('vencid') || status.includes('fora do prazo')) return true

  // Regra principal: venceu a entrega prevista e não existe confirmação de recebimento.
  return diasAtrasoEntregaOperacional(pedido, referencia) > 0
}`

if (!source.includes(newReceived)) {
  if (!source.includes(oldReceived)) throw new Error('Função de recebimento não encontrada.')
  source = source.replace(oldReceived, newReceived)
}

if (!source.includes(newImpact)) {
  if (!source.includes(oldImpact)) throw new Error('Funções de atraso não encontradas.')
  source = source.replace(oldImpact, newImpact)
}

fs.writeFileSync(path, source)
