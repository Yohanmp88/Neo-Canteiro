export const TAREFAS_OPERACIONAIS_DEMO = [
  {
    id: 'tarefa-demo-1',
    obra_id: 'demo-1',
    nome: 'Montagem das formas das vigas V101 a V108',
    data_inicio: '2026-07-08',
    data_termino: '2026-07-14',
    progresso: 80,
    responsavel: 'Equipe de carpintaria',
    status_operacional: 'Atrasado',
  },
  {
    id: 'tarefa-demo-2',
    obra_id: 'demo-1',
    nome: 'Armação das vigas V101 a V108',
    data_inicio: '2026-07-09',
    data_termino: '2026-07-13',
    progresso: 90,
    responsavel: 'Equipe de armação',
    status_operacional: 'Atrasado',
  },
  {
    id: 'tarefa-demo-3',
    obra_id: 'demo-1',
    nome: 'Concretagem das vigas V101 até V108',
    data_inicio: '2026-07-27',
    data_termino: '2026-07-27',
    progresso: 0,
    responsavel: 'Equipe estrutural',
    status_operacional: 'Bloqueado',
    bloqueio: 'O pedido de cimento vinculado ao serviço possui previsão posterior à data necessária.',
  },
  {
    id: 'tarefa-demo-4',
    obra_id: 'demo-1',
    nome: 'Desforma e cura das vigas V101 a V108',
    data_inicio: '2026-07-30',
    data_termino: '2026-08-05',
    progresso: 0,
    responsavel: 'Equipe estrutural',
    status_operacional: 'Planejado',
  },
]

export const PEDIDOS_OPERACIONAIS_DEMO = [
  {
    id: 'pedido-demo-1',
    obra_id: 'demo-1',
    item: 'Cimento CP-II F-32, saco de 50 kg',
    fornecedor: 'Votorantim',
    quantidade: 150,
    unidade: 'sacos',
    data_necessidade: '2026-07-27',
    data_prevista_original: '2026-07-25',
    data_prevista: '2026-07-29',
    status: 'Atrasado',
    tarefa_relacionada: 'Concretagem das vigas V101 até V108',
    impacto: 'A nova previsão ocorre depois da data em que o material é necessário para o serviço.',
    atividades_sucessoras: [
      'Desforma e cura das vigas V101 a V108',
      'Infraestrutura elétrica do pavimento',
    ],
  },
  {
    id: 'pedido-demo-2',
    obra_id: 'demo-1',
    item: 'Madeira para formas',
    fornecedor: 'Madeireira Norte',
    quantidade: 2,
    unidade: 'm³',
    data_necessidade: '2026-07-16',
    data_prevista: '2026-07-16',
    status: 'Pendente',
    tarefa_relacionada: 'Montagem das formas das vigas V101 a V108',
    impacto: 'A entrega ainda não foi confirmada.',
  },
  {
    id: 'pedido-demo-3',
    obra_id: 'demo-1',
    item: 'Espaçadores plásticos 25 mm',
    fornecedor: 'Casa do Construtor',
    quantidade: 500,
    unidade: 'unidades',
    data_necessidade: '2026-07-18',
    data_prevista: '2026-07-18',
    status: 'Comprado',
    tarefa_relacionada: 'Armação das vigas V101 a V108',
  },
  {
    id: 'pedido-demo-4',
    obra_id: 'demo-1',
    item: 'Aço CA-50 10 mm',
    fornecedor: 'Gerdau',
    quantidade: 500,
    unidade: 'kg',
    data_prevista: '2026-07-11',
    data_entrega: '2026-07-11',
    status: 'Recebido',
    tarefa_relacionada: 'Armação das vigas V101 a V108',
  },
]

export function normalizarTextoOperacional(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function parseDataOperacional(valor) {
  if (!valor) return null
  const partes = String(valor).slice(0, 10).split('-').map(Number)
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null
  return new Date(partes[0], partes[1] - 1, partes[2], 12, 0, 0, 0)
}

export function statusRecebidoOperacional(status) {
  const texto = normalizarTextoOperacional(status)
  return texto.includes('recebido') || texto.includes('entregue') || texto.includes('concluido')
}

export function tarefaAtrasadaOperacional(tarefa, referencia = new Date()) {
  const status = normalizarTextoOperacional(tarefa?.status_operacional || tarefa?.status)
  if (status.includes('atrasad') || status.includes('fora do prazo') || status.includes('vencid')) return true

  const termino = parseDataOperacional(tarefa?.data_termino || tarefa?.termino)
  if (!termino) return false

  const hoje = new Date(referencia)
  hoje.setHours(12, 0, 0, 0)
  return termino < hoje && Number(tarefa?.progresso || 0) < 100
}

export function diasImpactoPedidoOperacional(pedido, referencia = new Date()) {
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
}

export function obterTarefasDemoPorObra(obraId) {
  return TAREFAS_OPERACIONAIS_DEMO.filter((tarefa) => String(tarefa.obra_id) === String(obraId))
}

export function obterPedidosDemoPorObra(obraId) {
  return PEDIDOS_OPERACIONAIS_DEMO.filter((pedido) => String(pedido.obra_id) === String(obraId))
}
