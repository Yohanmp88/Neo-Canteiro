'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bot, Building2, Send, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useObras } from '@/hooks/useObras'
import { useTarefas } from '@/hooks/useTarefas'
import { useCompras } from '@/hooks/useCompras'

const OBRA_DEMO = {
  id: 'demo-1',
  nome: 'Residencial Aurora',
  cliente: 'Aurora Empreendimentos',
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
    bloqueio: 'Existe um material vinculado ao serviço com previsão posterior à data necessária.',
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
    impacto: 'A previsão atual ocorre depois da data necessária para o serviço.',
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

const PERGUNTAS_CHAVE = [
  'Quais serviços estão atrasados?',
  'Quais materiais estão atrasados?',
  'Quais materiais ainda não foram entregues?',
  'Quais tarefas estão bloqueadas?',
  'Monte um plano de ação para recuperar o prazo',
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

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function contemAlgum(texto, termos) {
  return termos.some((termo) => texto.includes(termo))
}

function statusRecebido(status) {
  return contemAlgum(normalizarTexto(status), ['recebido', 'entregue', 'concluido'])
}

function statusAtrasado(status) {
  return contemAlgum(normalizarTexto(status), ['atrasado', 'vencido', 'fora do prazo'])
}

function statusBloqueado(status) {
  return contemAlgum(normalizarTexto(status), ['bloqueado', 'impedido'])
}

function diasEntre(dataFinal, dataInicial) {
  const final = parseData(dataFinal)
  const inicial = parseData(dataInicial)
  if (!final || !inicial) return 0
  return Math.max(0, Math.ceil((final - inicial) / 86400000))
}

function diasAtrasoServico(valor) {
  const termino = parseData(valor)
  if (!termino) return 0
  const hoje = new Date()
  hoje.setHours(12, 0, 0, 0)
  return Math.max(0, Math.ceil((hoje - termino) / 86400000))
}

function diasImpactoPedido(pedido) {
  const previsao = pedido.data_prevista || pedido.data_reprogramada || pedido.data

  if (pedido.data_necessidade && previsao) {
    return diasEntre(previsao, pedido.data_necessidade)
  }

  const prevista = parseData(previsao)
  if (!prevista) return 0

  const hoje = new Date()
  hoje.setHours(12, 0, 0, 0)
  return Math.max(0, Math.ceil((hoje - prevista) / 86400000))
}

function pedidoAtrasado(pedido) {
  return !statusRecebido(pedido.status) && (statusAtrasado(pedido.status) || diasImpactoPedido(pedido) > 0)
}

function nomeMaterial(pedido) {
  return pedido.item || pedido.material || 'Material sem nome'
}

function listarServicos(servicos) {
  if (!servicos.length) return 'Não encontrei serviços atrasados no cronograma da obra selecionada.'

  return `Encontrei ${servicos.length} serviço${servicos.length === 1 ? '' : 's'} atrasado${servicos.length === 1 ? '' : 's'}:\n\n${servicos.map((tarefa, indice) => {
    const prazo = tarefa.data_termino || tarefa.termino
    return `${indice + 1}. ${tarefa.nome}\nPrazo: ${formatarData(prazo)}\nAtraso: ${diasAtrasoServico(prazo)} dia(s)\nProgresso: ${Number(tarefa.progresso || 0)}%\nResponsável: ${tarefa.responsavel || tarefa.responsavel_nome || 'não informado'}`
  }).join('\n\n')}`
}

function listarMateriais(pedidos, tipo) {
  if (!pedidos.length) {
    return tipo === 'atrasados'
      ? 'Não encontrei materiais com entrega atrasada na obra selecionada.'
      : 'Não encontrei materiais pendentes de entrega na obra selecionada.'
  }

  const titulo = tipo === 'atrasados'
    ? `Encontrei ${pedidos.length} material${pedidos.length === 1 ? '' : 'is'} com atraso ou impacto no prazo:`
    : `Encontrei ${pedidos.length} material${pedidos.length === 1 ? '' : 'is'} ainda não entregue${pedidos.length === 1 ? '' : 's'}:`

  return `${titulo}\n\n${pedidos.map((pedido, indice) => {
    const impacto = diasImpactoPedido(pedido)
    const situacao = pedidoAtrasado(pedido)
      ? `${impacto || 1} dia(s) de atraso ou impacto`
      : `previsão para ${formatarData(pedido.data_prevista || pedido.data)}`

    return `${indice + 1}. ${nomeMaterial(pedido)}\nQuantidade: ${pedido.quantidade || 'não informada'} ${pedido.unidade || ''}\nFornecedor: ${pedido.fornecedor || 'não informado'}\nStatus: ${pedido.status || 'não informado'}\nSituação: ${situacao}\nServiço relacionado: ${pedido.tarefa_relacionada || 'não informado'}`
  }).join('\n\n')}`
}

function encontrarPedido(pergunta, pedidos) {
  return pedidos.find((pedido) => {
    const palavras = normalizarTexto(nomeMaterial(pedido))
      .split(' ')
      .filter((palavra) => palavra.length > 4)

    return palavras.some((palavra) => pergunta.includes(palavra))
  })
}

function analisarPedido(pedido) {
  if (!pedido) return 'Não encontrei esse material nos pedidos da obra selecionada.'

  const impacto = diasImpactoPedido(pedido)
  const servico = pedido.tarefa_relacionada

  let resposta = `Material: ${nomeMaterial(pedido)}\nQuantidade: ${pedido.quantidade || 'não informada'} ${pedido.unidade || ''}\nFornecedor: ${pedido.fornecedor || 'não informado'}\nStatus: ${pedido.status || 'não informado'}\nData necessária: ${formatarData(pedido.data_necessidade)}\nPrevisão atual: ${formatarData(pedido.data_prevista || pedido.data)}\nServiço relacionado: ${servico || 'não cadastrado'}`

  if (servico && impacto > 0) {
    resposta += `\n\nA previsão atual ocorre ${impacto} dia(s) depois da data necessária e pode atrasar o serviço “${servico}”.`
  } else if (servico && pedidoAtrasado(pedido)) {
    resposta += `\n\nO pedido está marcado como atrasado e pode afetar o serviço “${servico}”.`
  } else if (!servico) {
    resposta += '\n\nNão consigo determinar qual serviço será afetado porque o pedido não possui atividade vinculada.'
  } else {
    resposta += `\n\nCom os dados atuais, não identifiquei atraso em relação à necessidade do serviço “${servico}”.`
  }

  if (pedido.impacto) resposta += `\n\nObservação cadastrada: ${pedido.impacto}`
  return resposta
}

function gerarPlanoAcao({ servicosAtrasados, materiaisAtrasados, tarefasBloqueadas }) {
  const acoes = []

  materiaisAtrasados.forEach((pedido) => {
    const vinculo = pedido.tarefa_relacionada ? `, vinculado a “${pedido.tarefa_relacionada}”` : ''
    acoes.push(`Confirmar a entrega de ${nomeMaterial(pedido)} com ${pedido.fornecedor || 'o fornecedor'}${vinculo}.`)
  })

  tarefasBloqueadas.forEach((tarefa) => {
    acoes.push(`Resolver o bloqueio de “${tarefa.nome}”: ${tarefa.bloqueio || 'motivo não informado'}.`)
  })

  servicosAtrasados.forEach((tarefa) => {
    acoes.push(`Definir recuperação de prazo para “${tarefa.nome}” com ${tarefa.responsavel || tarefa.responsavel_nome || 'o responsável'}.`)
  })

  if (!acoes.length) return 'Não encontrei ocorrências que exijam um plano de recuperação neste momento.'

  acoes.push('Atualizar o cronograma e os pedidos após cada confirmação de prazo.')
  return `Plano de ação sugerido:\n\n${acoes.map((acao, indice) => `${indice + 1}. ${acao}`).join('\n')}`
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
    comprasError,
  } = contexto

  const perguntaMaterial = contemAlgum(texto, [
    'material', 'materiais', 'insumo', 'insumos', 'cimento', 'aco', 'madeira',
    'compra', 'compras', 'pedido', 'pedidos', 'entrega', 'entregue',
    'fornecedor', 'suprimento', 'suprimentos',
  ])
  const perguntaServico = contemAlgum(texto, [
    'servico', 'servicos', 'cronograma', 'atividade', 'atividades', 'tarefa', 'tarefas', 'prazo',
  ])
  const perguntaAtraso = contemAlgum(texto, ['atrasado', 'atrasados', 'atrasada', 'atrasadas', 'vencido', 'vencidos', 'fora do prazo'])
  const perguntaPendencia = contemAlgum(texto, ['nao entregue', 'nao entregues', 'pendente', 'pendentes', 'faltando', 'falta'])

  if (perguntaMaterial) {
    if (!pedidos.length) {
      if (comprasError) {
        return `Não consegui acessar os pedidos de compra da obra “${obra.nome}”. O cronograma foi carregado, mas a leitura de compras e materiais falhou.`
      }

      return `Não há pedidos de compra cadastrados para a obra “${obra.nome}”.`
    }

    const pedido = encontrarPedido(texto, pedidos)

    if (pedido && contemAlgum(texto, ['impacto', 'afeta', 'afetar', 'detalhe', 'situacao', 'status', 'quando', 'qual servico'])) {
      return analisarPedido(pedido)
    }

    if (perguntaAtraso) return listarMateriais(materiaisAtrasados, 'atrasados')
    if (perguntaPendencia) return listarMateriais(materiaisNaoEntregues, 'pendentes')
    if (pedido) return analisarPedido(pedido)

    return listarMateriais(materiaisNaoEntregues, 'pendentes')
  }

  if (contemAlgum(texto, ['plano', 'acao', 'recuperar', 'providencia'])) {
    return gerarPlanoAcao(contexto)
  }

  if (contemAlgum(texto, ['bloqueado', 'bloqueados', 'bloqueada', 'bloqueadas', 'impedido', 'impedida'])) {
    if (!tarefasBloqueadas.length) return 'Não encontrei tarefas bloqueadas na obra selecionada.'

    return `Encontrei ${tarefasBloqueadas.length} tarefa(s) bloqueada(s):\n\n${tarefasBloqueadas.map((tarefa, indice) => `${indice + 1}. ${tarefa.nome}\nMotivo: ${tarefa.bloqueio || 'não informado'}`).join('\n\n')}`
  }

  if (perguntaServico || perguntaAtraso) return listarServicos(servicosAtrasados)

  if (contemAlgum(texto, ['risco', 'riscos', 'impacto', 'prioridade', 'resumo'])) {
    const riscos = []

    materiaisAtrasados.forEach((pedido) => {
      riscos.push(`${nomeMaterial(pedido)} pode afetar ${pedido.tarefa_relacionada || 'um serviço ainda não vinculado'}`)
    })
    tarefasBloqueadas.forEach((tarefa) => riscos.push(`${tarefa.nome} está bloqueada`))
    servicosAtrasados.forEach((tarefa) => riscos.push(`${tarefa.nome} está fora do prazo`))

    if (!riscos.length) return 'Não identifiquei riscos operacionais relevantes na obra selecionada.'

    return `Riscos identificados na obra “${obra.nome}”:\n\n${riscos.map((risco, indice) => `${indice + 1}. ${risco}.`).join('\n')}`
  }

  const tarefa = tarefas.find((item) => {
    const palavras = normalizarTexto(item.nome).split(' ').filter((palavra) => palavra.length > 4)
    return palavras.some((palavra) => texto.includes(palavra))
  })

  if (tarefa) {
    return `Serviço: ${tarefa.nome}\nInício: ${formatarData(tarefa.data_inicio || tarefa.inicio)}\nTérmino: ${formatarData(tarefa.data_termino || tarefa.termino)}\nProgresso: ${Number(tarefa.progresso || 0)}%\nResponsável: ${tarefa.responsavel || tarefa.responsavel_nome || 'não informado'}\nSituação: ${tarefa.status_operacional || tarefa.status || 'calculada pelo cronograma'}${tarefa.bloqueio ? `\nBloqueio: ${tarefa.bloqueio}` : ''}`
  }

  return `Posso consultar o cronograma e os pedidos da obra “${obra.nome}”. Pergunte sobre serviços atrasados, materiais, entregas, bloqueios ou riscos.`
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
      texto: 'Olá. Selecione a obra e faça uma pergunta sobre cronograma, compras, materiais ou bloqueios.',
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
  const tarefas = useMemo(() => (tarefasBanco.length ? tarefasBanco : usandoDemo ? TAREFAS_DEMO : []), [tarefasBanco, usandoDemo])
  const pedidos = useMemo(() => (pedidosBanco.length ? pedidosBanco : usandoDemo ? PEDIDOS_DEMO : []), [pedidosBanco, usandoDemo])

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
    () => materiaisNaoEntregues.filter(pedidoAtrasado),
    [materiaisNaoEntregues]
  )

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
        comprasError,
      })

      setMensagens((atuais) => [...atuais, { tipo: 'assistente', texto: resposta }])
      setRespondendo(false)
    }, 250)
  }

  function enviar(event) {
    event.preventDefault()
    perguntar(pergunta)
  }

  function mudarObra(novoId) {
    setObraId(novoId)
    setMensagens([
      {
        tipo: 'assistente',
        texto: 'Obra alterada. As próximas respostas usarão somente os dados da obra selecionada.',
      },
    ])
  }

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-blue-600">Carregando IA da obra...</div>
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.push('/')} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-blue-600">
              <ArrowLeft size={19} />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Bot size={23} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">IA da Obra</h1>
              <p className="text-xs font-medium text-slate-500">Respostas limitadas aos dados da obra selecionada</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 md:flex">
            <Building2 size={16} className="text-blue-600" />
            <select value={obraAtual?.id || ''} onChange={(event) => mudarObra(event.target.value)} className="bg-transparent text-sm font-bold text-slate-700 outline-none">
              {obrasVisiveis.map((obra) => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5 lg:px-8">
        <div className="mb-4 md:hidden">
          <select value={obraAtual?.id || ''} onChange={(event) => mudarObra(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none">
            {obrasVisiveis.map((obra) => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
          </select>
        </div>

        <section className="flex min-h-[calc(100vh-145px)] flex-col overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600"><Sparkles size={20} /></div>
              <div>
                <h2 className="font-black">Chat operacional</h2>
                <p className="text-xs font-medium text-slate-500">Pergunte e a resposta será montada com os dados desta obra</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {PERGUNTAS_CHAVE.map((sugestao) => (
                <button
                  type="button"
                  key={sugestao}
                  onClick={() => perguntar(sugestao)}
                  className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100"
                >
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
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-400 shadow-sm">Consultando cronograma e pedidos da obra...</div>
              </div>
            )}

            {carregando && <p className="text-xs font-bold text-slate-400">Atualizando dados da obra...</p>}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={enviar} className="border-t border-slate-100 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={pergunta}
                onChange={(event) => setPergunta(event.target.value)}
                placeholder="Ex.: Qual material está atrasado nesta obra?"
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
              />
              <button
                type="submit"
                disabled={!pergunta.trim() || respondendo}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={18} /> Enviar
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
