'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  PackageX,
  Send,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useObras } from '@/hooks/useObras'
import { useTarefas } from '@/hooks/useTarefas'
import { useCompras } from '@/hooks/useCompras'

const OBRA_DEMO = {
  id: 'demo-1',
  nome: 'Residencial Aurora',
  cliente: 'Aurora Empreendimentos',
  status: 'Em andamento',
  progresso: 65,
}

const TAREFAS_DEMO = [
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
    bloqueio: 'Cimento com nova previsão posterior à data necessária para a concretagem.',
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
  {
    id: 'tarefa-demo-5',
    obra_id: 'demo-1',
    nome: 'Infraestrutura elétrica do pavimento',
    data_inicio: '2026-08-06',
    data_termino: '2026-08-12',
    progresso: 0,
    responsavel: 'Equipe elétrica',
    status_operacional: 'Planejado',
  },
]

const PEDIDOS_DEMO = [
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
    impacto_dias: 2,
    impacto: 'A nova previsão de 29/07/2026 ocorre dois dias depois da concretagem programada para 27/07/2026.',
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
    impacto: 'Sem confirmação de entrega. Pode prolongar o atraso atual da montagem das formas.',
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
    impacto: 'A entrega deve ser confirmada antes da liberação final da armação.',
  },
  {
    id: 'pedido-demo-4',
    obra_id: 'demo-1',
    item: 'Aço CA-50 10 mm',
    fornecedor: 'Gerdau',
    quantidade: 500,
    unidade: 'kg',
    data_necessidade: '2026-07-12',
    data_prevista: '2026-07-11',
    data_entrega: '2026-07-11',
    status: 'Recebido',
    tarefa_relacionada: 'Armação das vigas V101 a V108',
  },
]

function parseData(valor) {
  if (!valor) return null
  const partes = String(valor).slice(0, 10).split('-').map(Number)
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null
  return new Date(partes[0], partes[1] - 1, partes[2], 12, 0, 0, 0)
}

function formatarData(valor) {
  const data = parseData(valor)
  return data ? data.toLocaleDateString('pt-BR') : 'não informada'
}

function diferencaDias(dataFinal, dataInicial) {
  const final = parseData(dataFinal)
  const inicial = parseData(dataInicial)
  if (!final || !inicial) return 0
  return Math.max(0, Math.ceil((final - inicial) / 86400000))
}

function calcularDiasAtrasoServico(valor) {
  const termino = parseData(valor)
  if (!termino) return 0
  const hoje = new Date()
  hoje.setHours(12, 0, 0, 0)
  return Math.max(0, Math.ceil((hoje - termino) / 86400000))
}

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function statusRecebido(status) {
  const texto = normalizarTexto(status)
  return texto.includes('recebido') || texto.includes('entregue') || texto.includes('concluido')
}

function statusAtrasado(status) {
  return normalizarTexto(status).includes('atrasad')
}

function statusBloqueado(status) {
  return normalizarTexto(status).includes('bloquead')
}

function calcularAtrasoPedido(pedido) {
  const necessidade = pedido.data_necessidade
  const novaPrevisao = pedido.data_prevista || pedido.data_reprogramada || pedido.data

  if (necessidade && novaPrevisao) {
    return diferencaDias(novaPrevisao, necessidade)
  }

  const prevista = parseData(novaPrevisao)
  if (!prevista) return 0
  const hoje = new Date()
  hoje.setHours(12, 0, 0, 0)
  return Math.max(0, Math.ceil((hoje - prevista) / 86400000))
}

function pedidoEstaAtrasado(pedido) {
  if (statusRecebido(pedido.status)) return false
  if (statusAtrasado(pedido.status)) return true
  return calcularAtrasoPedido(pedido) > 0
}

function listarServicos(servicos) {
  if (!servicos.length) return 'Não encontrei serviços com prazo vencido e progresso abaixo de 100% nesta obra.'

  const linhas = servicos.map((tarefa, indice) => {
    const dias = calcularDiasAtrasoServico(tarefa.data_termino || tarefa.termino)
    const responsavel = tarefa.responsavel || tarefa.responsavel_nome || 'responsável não informado'
    return `${indice + 1}. ${tarefa.nome}\n   Prazo: ${formatarData(tarefa.data_termino || tarefa.termino)} | Atraso: ${dias} dia${dias === 1 ? '' : 's'} | Executado: ${Number(tarefa.progresso || 0)}% | Responsável: ${responsavel}.`
  })

  return `SERVIÇOS ATRASADOS (${servicos.length})\n\n${linhas.join('\n\n')}\n\nPrioridade: concluir primeiro as atividades que liberam a concretagem das vigas V101 a V108.`
}

function listarMateriais(pedidos) {
  if (!pedidos.length) return 'Não encontrei materiais pendentes de entrega nesta obra.'

  const linhas = pedidos.map((pedido, indice) => {
    const atraso = calcularAtrasoPedido(pedido)
    const situacao = pedidoEstaAtrasado(pedido)
      ? `${atraso || pedido.impacto_dias || 1} dia${(atraso || pedido.impacto_dias || 1) === 1 ? '' : 's'} de impacto/atraso`
      : `previsão em ${formatarData(pedido.data_prevista || pedido.data)}`

    return `${indice + 1}. ${pedido.item || pedido.material}\n   Quantidade: ${pedido.quantidade || 'não informada'} ${pedido.unidade || ''} | Fornecedor: ${pedido.fornecedor || 'não informado'} | Situação: ${situacao} | Serviço vinculado: ${pedido.tarefa_relacionada || 'não informado'}.`
  })

  return `MATERIAIS NÃO ENTREGUES (${pedidos.length})\n\n${linhas.join('\n\n')}`
}

function detalharCimento(cimento) {
  if (!cimento) return 'Não encontrei um pedido de cimento pendente nesta obra.'

  const sucessoras = cimento.atividades_sucessoras?.length
    ? cimento.atividades_sucessoras.map((atividade, indice) => `${indice + 1}. ${atividade}`).join('\n')
    : 'Nenhuma atividade sucessora cadastrada.'

  return `ANÁLISE DO CIMENTO\n\nMaterial: ${cimento.item || 'Cimento'}\nQuantidade: ${cimento.quantidade || 'não informada'} ${cimento.unidade || ''}\nFornecedor: ${cimento.fornecedor || 'não informado'}\nData necessária na obra: ${formatarData(cimento.data_necessidade)}\nEntrega originalmente prevista: ${formatarData(cimento.data_prevista_original)}\nNova previsão de entrega: ${formatarData(cimento.data_prevista)}\nServiço dependente: ${cimento.tarefa_relacionada || 'não informado'}\n\nImpacto identificado: ${cimento.impacto || 'O material pode bloquear o serviço relacionado.'}\nImpacto mínimo estimado: ${cimento.impacto_dias || calcularAtrasoPedido(cimento)} dias.\n\nATIVIDADES SUCESSORAS SOB RISCO\n${sucessoras}\n\nAÇÃO RECOMENDADA\n1. Confirmar por escrito a nova entrega com o fornecedor.\n2. Verificar estoque disponível e possibilidade de compra emergencial.\n3. Atualizar a concretagem e as atividades sucessoras no cronograma.\n4. Registrar o risco no diário de obra e comunicar os responsáveis.`
}

function gerarPlanoAcao(contexto) {
  const { servicosAtrasados, materiaisAtrasados, tarefasBloqueadas } = contexto
  const acoes = []

  if (materiaisAtrasados.length) {
    acoes.push('Contatar hoje os fornecedores dos materiais com impacto no prazo e registrar uma nova data confirmada.')
  }
  if (tarefasBloqueadas.length) {
    acoes.push('Validar quais tarefas podem ser antecipadas enquanto os bloqueios não forem resolvidos.')
  }
  if (servicosAtrasados.length) {
    acoes.push('Reunir os responsáveis pelos serviços atrasados e definir recuperação de prazo com metas diárias.')
  }
  acoes.push('Atualizar o cronograma após cada confirmação de entrega ou mudança de produtividade.')

  return `PLANO DE AÇÃO OPERACIONAL\n\n${acoes.map((acao, indice) => `${indice + 1}. ${acao}`).join('\n')}\n\nA prioridade imediata é garantir o cimento antes da concretagem das vigas V101 a V108.`
}

function gerarResposta(pergunta, contexto) {
  const texto = normalizarTexto(pergunta)
  const {
    obra,
    tarefas,
    pedidos,
    servicosAtrasados,
    materiaisNaoEntregues,
    materiaisAtrasados,
    tarefasBloqueadas,
  } = contexto

  const cimento = materiaisNaoEntregues.find((pedido) => normalizarTexto(pedido.item || pedido.material).includes('cimento'))

  if (texto.includes('cimento') || texto.includes('v101') || texto.includes('viga 101') || texto.includes('vigas 101')) {
    return detalharCimento(cimento)
  }

  if (texto.includes('plano') || texto.includes('acao') || texto.includes('resolver') || texto.includes('providencia')) {
    return gerarPlanoAcao(contexto)
  }

  if (texto.includes('bloquead') || texto.includes('impedid')) {
    if (!tarefasBloqueadas.length) return 'Não há tarefas marcadas como bloqueadas nesta obra.'
    return `TAREFAS BLOQUEADAS\n\n${tarefasBloqueadas.map((tarefa, indice) => `${indice + 1}. ${tarefa.nome}\n   Motivo: ${tarefa.bloqueio || 'bloqueio não detalhado'}.`).join('\n\n')}`
  }

  if (texto.includes('responsavel') || texto.includes('quem')) {
    if (!servicosAtrasados.length) return 'Não há responsáveis associados a serviços atrasados neste momento.'
    return `RESPONSÁVEIS POR SERVIÇOS ATRASADOS\n\n${servicosAtrasados.map((tarefa, indice) => `${indice + 1}. ${tarefa.nome}: ${tarefa.responsavel || tarefa.responsavel_nome || 'não informado'}.`).join('\n')}`
  }

  const tarefaEncontrada = tarefas.find((tarefa) => {
    const nome = normalizarTexto(tarefa.nome)
    return nome.length > 5 && (texto.includes(nome) || nome.split(' ').filter((palavra) => palavra.length > 4).some((palavra) => texto.includes(palavra)))
  })

  if (tarefaEncontrada && (texto.includes('detalh') || texto.includes('situacao') || texto.includes('status'))) {
    return `DETALHE DO SERVIÇO\n\nServiço: ${tarefaEncontrada.nome}\nInício: ${formatarData(tarefaEncontrada.data_inicio || tarefaEncontrada.inicio)}\nTérmino: ${formatarData(tarefaEncontrada.data_termino || tarefaEncontrada.termino)}\nProgresso: ${Number(tarefaEncontrada.progresso || 0)}%\nResponsável: ${tarefaEncontrada.responsavel || tarefaEncontrada.responsavel_nome || 'não informado'}\nSituação operacional: ${tarefaEncontrada.status_operacional || 'calculada pelo cronograma'}${tarefaEncontrada.bloqueio ? `\nBloqueio: ${tarefaEncontrada.bloqueio}` : ''}`
  }

  const pedidoEncontrado = pedidos.find((pedido) => {
    const nome = normalizarTexto(pedido.item || pedido.material)
    return nome.length > 4 && nome.split(' ').filter((palavra) => palavra.length > 4).some((palavra) => texto.includes(palavra))
  })

  if (pedidoEncontrado && (texto.includes('detalh') || texto.includes('situacao') || texto.includes('status') || texto.includes('quando'))) {
    return `DETALHE DO PEDIDO\n\nMaterial: ${pedidoEncontrado.item || pedidoEncontrado.material}\nQuantidade: ${pedidoEncontrado.quantidade || 'não informada'} ${pedidoEncontrado.unidade || ''}\nFornecedor: ${pedidoEncontrado.fornecedor || 'não informado'}\nStatus: ${pedidoEncontrado.status || 'não informado'}\nData necessária: ${formatarData(pedidoEncontrado.data_necessidade)}\nPrevisão atual: ${formatarData(pedidoEncontrado.data_prevista || pedidoEncontrado.data)}\nServiço vinculado: ${pedidoEncontrado.tarefa_relacionada || 'não informado'}\nImpacto: ${pedidoEncontrado.impacto || 'não cadastrado'}`
  }

  if (texto.includes('servico') || texto.includes('cronograma') || texto.includes('atividade') || texto.includes('atrasad')) {
    return listarServicos(servicosAtrasados)
  }

  if (texto.includes('material') || texto.includes('entrega') || texto.includes('compra') || texto.includes('pedido')) {
    return listarMateriais(materiaisNaoEntregues)
  }

  if (texto.includes('risco') || texto.includes('impacto') || texto.includes('critico') || texto.includes('prioridade') || texto.includes('resumo')) {
    const cimentoMensagem = cimento
      ? `O cimento está com nova previsão em ${formatarData(cimento.data_prevista)}, após a necessidade de ${formatarData(cimento.data_necessidade)}, criando impacto mínimo de ${cimento.impacto_dias || calcularAtrasoPedido(cimento)} dias na concretagem das vigas V101 a V108.`
      : 'Não há pedido de cimento pendente identificado.'

    return `RESUMO OPERACIONAL — ${obra.nome}\n\nServiços atrasados: ${servicosAtrasados.length}\nMateriais não entregues: ${materiaisNaoEntregues.length}\nMateriais com impacto no prazo: ${materiaisAtrasados.length}\nTarefas bloqueadas: ${tarefasBloqueadas.length}\n\nRISCO PRINCIPAL\n${cimentoMensagem}\n\nPRÓXIMA DECISÃO\n${materiaisAtrasados.length ? 'Tratar os fornecedores dos materiais críticos e atualizar o cronograma.' : 'Manter o acompanhamento das entregas e do avanço físico.'}`
  }

  return `Eu consigo analisar os dados operacionais desta obra, mas preciso que a pergunta indique o assunto. Exemplos:\n\n• Quais serviços estão atrasados?\n• Quais materiais não foram entregues?\n• Qual é o impacto do atraso do cimento?\n• Quais tarefas estão bloqueadas?\n• Monte um plano de ação.\n\nSituação atual: ${servicosAtrasados.length} serviços atrasados, ${materiaisNaoEntregues.length} materiais não entregues e ${tarefasBloqueadas.length} tarefa(s) bloqueada(s).`
}

function CardIndicador({ icon: Icon, titulo, valor, texto, alerta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${alerta ? 'border-red-100 bg-red-50' : 'border-slate-200/70 bg-white'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${alerta ? 'text-red-500' : 'text-slate-400'}`}>{titulo}</p>
          <p className={`mt-2 text-3xl font-black ${alerta ? 'text-red-600' : 'text-slate-900'}`}>{valor}</p>
          <p className={`mt-1 text-xs font-medium ${alerta ? 'text-red-500' : 'text-slate-500'}`}>{texto}</p>
          <p className={`mt-3 text-[10px] font-black uppercase tracking-wider ${alerta ? 'text-red-500' : 'text-blue-600'}`}>Clique para analisar</p>
        </div>
        <div className={`rounded-2xl p-3 transition group-hover:scale-105 ${alerta ? 'bg-white text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          <Icon size={20} />
        </div>
      </div>
    </button>
  )
}

export default function IAOperacionalPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { obras = [], loading: obrasLoading } = useObras()
  const [obraId, setObraId] = useState(null)
  const [pergunta, setPergunta] = useState('')
  const [respondendo, setRespondendo] = useState(false)
  const chatEndRef = useRef(null)
  const [mensagens, setMensagens] = useState([
    {
      tipo: 'assistente',
      texto: 'Estou conectado ao cronograma e aos pedidos da obra selecionada. Clique em um indicador ou escreva uma pergunta operacional.',
    },
  ])

  const obrasVisiveis = useMemo(() => (obras.length ? obras : [OBRA_DEMO]), [obras])

  useEffect(() => {
    if (!obraId && obrasVisiveis.length) setObraId(obrasVisiveis[0].id)
  }, [obraId, obrasVisiveis])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensagens, respondendo])

  const obraAtual = useMemo(
    () => obrasVisiveis.find((obra) => String(obra.id) === String(obraId)) || obrasVisiveis[0] || OBRA_DEMO,
    [obraId, obrasVisiveis]
  )

  const { tarefas: tarefasBanco = [], loading: tarefasLoading } = useTarefas(obraAtual?.id)
  const { pedidos: pedidosBanco = [], loading: comprasLoading, error: comprasError } = useCompras(obraAtual?.id)

  const usandoDemo = String(obraAtual?.id).startsWith('demo')

  const tarefas = useMemo(() => {
    if (tarefasBanco.length) return tarefasBanco
    return usandoDemo ? TAREFAS_DEMO : []
  }, [tarefasBanco, usandoDemo])

  const pedidos = useMemo(() => {
    if (pedidosBanco.length) return pedidosBanco
    return usandoDemo ? PEDIDOS_DEMO : []
  }, [pedidosBanco, usandoDemo])

  const hoje = useMemo(() => {
    const data = new Date()
    data.setHours(12, 0, 0, 0)
    return data
  }, [])

  const servicosAtrasados = useMemo(
    () => tarefas.filter((tarefa) => {
      const termino = parseData(tarefa.data_termino || tarefa.termino)
      return statusAtrasado(tarefa.status_operacional || tarefa.status) || (termino && termino < hoje && Number(tarefa.progresso || 0) < 100)
    }),
    [tarefas, hoje]
  )

  const tarefasBloqueadas = useMemo(
    () => tarefas.filter((tarefa) => statusBloqueado(tarefa.status_operacional || tarefa.status)),
    [tarefas]
  )

  const materiaisNaoEntregues = useMemo(
    () => pedidos.filter((pedido) => !statusRecebido(pedido.status) && !pedido.data_entrega),
    [pedidos]
  )

  const materiaisAtrasados = useMemo(
    () => materiaisNaoEntregues.filter(pedidoEstaAtrasado),
    [materiaisNaoEntregues]
  )

  const cimentoCritico = materiaisAtrasados.find((pedido) => normalizarTexto(pedido.item || pedido.material).includes('cimento'))
  const carregando = authLoading || obrasLoading || tarefasLoading || comprasLoading

  function perguntar(textoPergunta) {
    const texto = String(textoPergunta || '').trim()
    if (!texto || respondendo) return

    setMensagens((atuais) => [...atuais, { tipo: 'usuario', texto }])
    setPergunta('')
    setRespondendo(true)

    window.setTimeout(() => {
      const resposta = gerarResposta(texto, {
        obra: obraAtual,
        tarefas,
        pedidos,
        servicosAtrasados,
        materiaisNaoEntregues,
        materiaisAtrasados,
        tarefasBloqueadas,
      })

      setMensagens((atuais) => [...atuais, { tipo: 'assistente', texto: resposta }])
      setRespondendo(false)
    }, 250)
  }

  function enviar(event) {
    event.preventDefault()
    perguntar(pergunta)
  }

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-blue-600">Carregando IA operacional...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-5 p-6 text-center">
        <Bot className="text-blue-600" size={42} />
        <h1 className="text-2xl font-black text-slate-900">Sua sessão terminou</h1>
        <button onClick={() => router.push('/')} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white">Voltar ao login</button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.push('/')} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-blue-600">
              <ArrowLeft size={19} />
            </button>
            <button type="button" onClick={() => perguntar('Faça um resumo dos riscos da obra')} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700" title="Gerar resumo operacional">
              <Bot size={23} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight">IA Operacional</h1>
                <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${usandoDemo ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {usandoDemo ? 'Dados demo' : 'Dados da obra'}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500">Análise de cronograma, compras, bloqueios e impacto no prazo</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 md:flex">
            <Building2 size={16} className="text-blue-600" />
            <select
              value={obraAtual?.id || ''}
              onChange={(event) => {
                setObraId(event.target.value)
                setMensagens([{ tipo: 'assistente', texto: 'Obra alterada. Clique em um indicador ou faça uma nova pergunta para analisar os dados selecionados.' }])
              }}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none"
            >
              {obrasVisiveis.map((obra) => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 lg:px-8">
        <div className="md:hidden">
          <select value={obraAtual?.id || ''} onChange={(event) => setObraId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none">
            {obrasVisiveis.map((obra) => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
          </select>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CardIndicador icon={CalendarClock} titulo="Cronograma" valor={servicosAtrasados.length} texto="serviços atrasados" alerta={servicosAtrasados.length > 0} onClick={() => perguntar('Quais serviços estão atrasados?')} />
          <CardIndicador icon={PackageX} titulo="Suprimentos" valor={materiaisNaoEntregues.length} texto="materiais não entregues" alerta={materiaisAtrasados.length > 0} onClick={() => perguntar('Quais materiais não foram entregues?')} />
          <CardIndicador icon={Clock3} titulo="Bloqueios" valor={tarefasBloqueadas.length} texto="tarefas impedidas" alerta={tarefasBloqueadas.length > 0} onClick={() => perguntar('Quais tarefas estão bloqueadas?')} />
          <CardIndicador icon={cimentoCritico ? AlertTriangle : CheckCircle2} titulo="Risco estrutural" valor={cimentoCritico ? 'Crítico' : 'Normal'} texto={cimentoCritico ? 'cimento afeta V101–V108' : 'sem bloqueio identificado'} alerta={Boolean(cimentoCritico)} onClick={() => perguntar('Qual é o impacto do atraso do cimento nas vigas V101 a V108?')} />
        </section>

        {cimentoCritico && (
          <button type="button" onClick={() => perguntar('Qual é o impacto do atraso do cimento nas vigas V101 a V108?')} className="w-full rounded-3xl border border-red-100 bg-red-50 p-5 text-left shadow-sm transition hover:border-red-200 hover:shadow-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white p-3 text-red-600"><AlertTriangle size={22} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Alerta operacional prioritário</p>
                  <h2 className="mt-1 text-lg font-black text-red-700">150 sacos de cimento previstos para 29/07 podem atrasar a concretagem de 27/07</h2>
                  <p className="mt-1 text-sm font-medium text-red-600">Impacto mínimo estimado de 2 dias nas vigas V101 a V108 e nas atividades sucessoras.</p>
                </div>
              </div>
              <span className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-xs font-black uppercase text-white shadow-sm">
                Ver análise <ChevronRight size={15} />
              </span>
            </div>
          </button>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="flex min-h-[650px] flex-col overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600"><Sparkles size={20} /></div>
                <div>
                  <h2 className="font-black">Assistente operacional da obra</h2>
                  <p className="text-xs font-medium text-slate-500">As respostas usam os serviços e pedidos da obra selecionada</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Quais serviços estão atrasados?',
                  'Quais materiais não foram entregues?',
                  'Qual é o impacto do atraso do cimento?',
                  'Quais tarefas estão bloqueadas?',
                  'Monte um plano de ação',
                ].map((sugestao) => (
                  <button type="button" key={sugestao} onClick={() => perguntar(sugestao)} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100">
                    {sugestao}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-5">
              {mensagens.map((mensagem, indice) => (
                <div key={`${mensagem.tipo}-${indice}`} className={`flex ${mensagem.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[92%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${mensagem.tipo === 'usuario' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700 shadow-sm'}`}>
                    {mensagem.texto}
                  </div>
                </div>
              ))}
              {respondendo && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-400 shadow-sm">Analisando cronograma e compras...</div>
                </div>
              )}
              {carregando && <p className="text-xs font-bold text-slate-400">Atualizando dados operacionais...</p>}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={enviar} className="border-t border-slate-100 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={pergunta}
                  onChange={(event) => setPergunta(event.target.value)}
                  placeholder="Ex.: O cimento vai impactar a concretagem das vigas V101 a V108?"
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
                />
                <button type="submit" disabled={!pergunta.trim() || respondendo} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                  <Send size={18} /> Enviar pergunta
                </button>
              </div>
              <p className="mt-2 text-[10px] font-medium text-slate-400">Pressione Enter ou clique em “Enviar pergunta”.</p>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-black">Serviços atrasados</h2>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-600">{servicosAtrasados.length}</span>
              </div>
              <div className="space-y-3">
                {servicosAtrasados.length ? servicosAtrasados.map((tarefa) => (
                  <button type="button" onClick={() => perguntar(`Detalhe a situação do serviço ${tarefa.nome}`)} key={tarefa.id} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black text-slate-900">{tarefa.nome}</p>
                      <ChevronRight size={16} className="shrink-0 text-slate-400" />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>{calcularDiasAtrasoServico(tarefa.data_termino || tarefa.termino)} dias de atraso</span>
                      <span>{Number(tarefa.progresso || 0)}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(100, Number(tarefa.progresso || 0))}%` }} />
                    </div>
                  </button>
                )) : <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Nenhum serviço atrasado.</p>}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-black">Materiais não entregues</h2>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">{materiaisNaoEntregues.length}</span>
              </div>
              <div className="space-y-3">
                {materiaisNaoEntregues.length ? materiaisNaoEntregues.map((pedido) => {
                  const atrasado = pedidoEstaAtrasado(pedido)
                  const dias = calcularAtrasoPedido(pedido)
                  return (
                    <button type="button" onClick={() => perguntar(`Detalhe a situação do material ${pedido.item || pedido.material}`)} key={pedido.id} className={`w-full rounded-2xl border p-4 text-left transition hover:border-blue-200 ${atrasado ? 'border-red-100 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-black text-slate-900">{pedido.item || pedido.material}</p>
                        <ChevronRight size={16} className="shrink-0 text-slate-400" />
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-500">{pedido.fornecedor || 'Fornecedor não informado'}</p>
                      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-bold">
                        <span className={atrasado ? 'text-red-600' : 'text-slate-500'}>{atrasado ? `${dias || pedido.impacto_dias || 1} dias de impacto` : `Previsto para ${formatarData(pedido.data_prevista || pedido.data)}`}</span>
                        <span className="text-slate-500">{pedido.quantidade || ''} {pedido.unidade || ''}</span>
                      </div>
                    </button>
                  )
                }) : <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Nenhum material pendente.</p>}
              </div>
              {comprasError && !usandoDemo && (
                <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-700">A tabela de pedidos de compra ainda precisa ser ativada no Supabase.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
