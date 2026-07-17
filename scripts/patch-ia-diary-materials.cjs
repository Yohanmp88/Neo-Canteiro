const fs = require('fs')

const file = 'src/app/ia/page.js'
let source = fs.readFileSync(file, 'utf8')

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    if (source.includes(replacement)) return
    throw new Error(`Trecho não encontrado: ${label}`)
  }
  source = source.replace(search, replacement)
}

replaceOnce(
  "import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'\nimport '@/lib/coreModuleDefinitions'",
  "import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'\nimport { deliveriesForDate, formatDeliveryQuantity, mergeMaterialDeliveries } from '@/lib/materialDelivery'\nimport '@/lib/coreModuleDefinitions'",
  'importações de materiais',
)

replaceOnce(
  "    proximas_atividades: diario.proximas_atividades || diario.proximos_servicos || '',\n    status: diario.status || diario.situacao || '',",
  "    proximas_atividades: diario.proximas_atividades || diario.proximos_servicos || '',\n    materiais_entregues: Array.isArray(diario.materiais_entregues) ? diario.materiais_entregues : [],\n    materiais_entregues_observacoes: diario.materiais_entregues_observacoes || '',\n    status: diario.status || diario.situacao || '',",
  'normalização do diário',
)

replaceOnce(
  "function formatarBlocoDiario(diario, indice = null) {\n  const cabecalho = indice === null ? '' : `Registro ${indice + 1}\\n`\n  const linhas = [\n    diario.status ? `Status: ${diario.status}` : null,\n    diario.clima ? `Clima: ${diario.clima}` : null,\n    diario.equipe_total !== '' && diario.equipe_total !== null && diario.equipe_total !== undefined\n      ? `Equipe presente: ${diario.equipe_total} trabalhador(es)`\n      : null,\n    diario.responsavel ? `Responsável: ${diario.responsavel}` : null,\n    `\\nServiços executados:\\n${diario.servicos_executados || 'Nenhum serviço informado.'}`,\n    diario.ocorrencias ? `\\nOcorrências e interferências:\\n${diario.ocorrencias}` : null,\n    diario.visitas ? `\\nVisitas e fiscalizações:\\n${diario.visitas}` : null,\n    diario.proximas_atividades ? `\\nPróximas atividades:\\n${diario.proximas_atividades}` : null,\n  ].filter(Boolean)\n\n  return `${cabecalho}${linhas.join('\\n')}`\n}",
  "function formatarMateriaisEntregues(materiais = []) {\n  if (!Array.isArray(materiais) || !materiais.length) return ''\n\n  return materiais.map((material, indice) => {\n    const quantidade = formatDeliveryQuantity(material) || 'não informada'\n    const detalhes = [\n      `${indice + 1}. ${material.item || material.material || 'Material sem identificação'}`,\n      `Quantidade recebida: ${quantidade}`,\n      material.fornecedor ? `Fornecedor: ${material.fornecedor}` : null,\n      material.status ? `Status: ${material.status}` : null,\n      material.recebido_por ? `Recebido por: ${material.recebido_por}` : null,\n      material.observacoes ? `Observações: ${material.observacoes}` : null,\n    ].filter(Boolean)\n\n    return detalhes.join('\\n')\n  }).join('\\n\\n')\n}\n\nfunction formatarBlocoDiario(diario, indice = null) {\n  const cabecalho = indice === null ? '' : `Registro ${indice + 1}\\n`\n  const materiais = formatarMateriaisEntregues(diario.materiais_entregues)\n  const linhas = [\n    diario.status ? `Status: ${diario.status}` : null,\n    diario.clima ? `Clima: ${diario.clima}` : null,\n    diario.equipe_total !== '' && diario.equipe_total !== null && diario.equipe_total !== undefined\n      ? `Equipe presente: ${diario.equipe_total} trabalhador(es)`\n      : null,\n    diario.responsavel ? `Responsável: ${diario.responsavel}` : null,\n    `\\nServiços executados:\\n${diario.servicos_executados || 'Nenhum serviço informado.'}`,\n    `\\nMateriais entregues no dia:\\n${materiais || 'Nenhum material entregue foi informado.'}`,\n    diario.materiais_entregues_observacoes\n      ? `\\nObservações sobre os materiais entregues:\\n${diario.materiais_entregues_observacoes}`\n      : null,\n    diario.ocorrencias ? `\\nOcorrências e interferências:\\n${diario.ocorrencias}` : null,\n    diario.visitas ? `\\nVisitas e fiscalizações:\\n${diario.visitas}` : null,\n    diario.proximas_atividades ? `\\nPróximas atividades:\\n${diario.proximas_atividades}` : null,\n  ].filter(Boolean)\n\n  return `${cabecalho}${linhas.join('\\n')}`\n}",
  'formatação completa do diário',
)

replaceOnce(
  "  } = useWorkspaceRecords('diario', obraAtual?.id, user)\n\n  const tarefas = useMemo",
  "  } = useWorkspaceRecords('diario', obraAtual?.id, user)\n  const {\n    records: materiaisWorkspaceRaw = [],\n    loading: materiaisWorkspaceLoading,\n    error: materiaisWorkspaceError,\n  } = useWorkspaceRecords('materiais', obraAtual?.id, user)\n\n  const tarefas = useMemo",
  'consulta dos materiais da obra',
)

replaceOnce(
  "    const combinados = [...diariosWorkspace, ...diariosBanco].map(normalizarDiario)\n    const unicos = new Map()",
  "    const combinados = [...diariosWorkspace, ...diariosBanco]\n      .map(normalizarDiario)\n      .map((diario) => ({\n        ...diario,\n        materiais_entregues: mergeMaterialDeliveries(\n          diario.materiais_entregues || [],\n          deliveriesForDate(materiaisWorkspaceRaw, diario.data),\n        ),\n      }))\n    const unicos = new Map()",
  'vínculo dos materiais por data',
)

replaceOnce(
  "  }, [diariosWorkspaceRaw, diariosBanco, usandoDemo, workspaceSource])",
  "  }, [diariosWorkspaceRaw, diariosBanco, materiaisWorkspaceRaw, usandoDemo, workspaceSource])",
  'dependências do diário',
)

replaceOnce(
  "  const carregando = authLoading || obrasLoading || tarefasLoading || comprasLoading || diariosLoading || workspaceLoading\n  const diarioError = diariosError || workspaceError",
  "  const carregando = authLoading || obrasLoading || tarefasLoading || comprasLoading || diariosLoading || workspaceLoading || materiaisWorkspaceLoading\n  const diarioError = diariosError || workspaceError || materiaisWorkspaceError",
  'estado de carregamento da IA',
)

fs.writeFileSync(file, source)
console.log('IA atualizada para ler materiais e quantidades do diário completo.')
