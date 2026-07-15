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
    bloqueio: 'O cimento tem nova previsão posterior à data necessária para a concretagem.',
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
    impacto: 'A entrega ainda não foi confirmada e pode prolongar o atraso da montagem das formas.',
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
  'Quais materiais não foram entregues?',
  'O cimento pode impactar a concretagem das vigas V101 a V108?',
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
  if (pedido.data_necessidade && pedido.data_prevista) {
    return diasEntre(pedido.data_prevista, pedido.data_necessidade)
  }

  const prevista = parseData(pedido.data_prevista || pedido.data)
  if (!prevista) return 0
  const hoje = new Date()
  hoje.setHours(12, 0, 0, 0)
  return Math.max(0, Math.ceil((hoje - prevista) / 86400000))
}

function pedidoAtrasado(pedido) {
  return !statusRecebido(pedido.status) && (statusAtrasado(pedido.status) || diasImpactoPedido(pedido) > 0)
}

function listarServicos(servicos) {
  if (!servicos.length) return 'Não encontrei serviços atrasados no cronograma desta obra.'

  return `Encontrei ${servicos.length} serviço${servicos.length === 1 ? '' : 's'} atrasado${servicos.length === 1 ? '' : 's'}:\n\n${servicos.map((tarefa, indice) => {
    const prazo = tarefa.data_termino || tarefa.termino
    const responsavel = tarefa.responsavel || tarefa.responsavel_nome || 'não informado'
    return `${indice + 1}. ${tarefa.nome}\nPrazo: ${formatarData(prazo)}\nAtraso: ${diasAtrasoServico(prazo)} dia(s)\nProgresso: ${Number(tarefa.progresso || 0)}%\nResponsável: ${responsavel}`
  }).join('\n\n')}`
}

function listarMateriais(pedidos) {
  if (!pedidos.length) return 'Não encontrei materiais pendentes de entrega nesta obra.'

  return `Encontrei ${pedidos.length} material${pedidos.length === 1 ? '' : 'is'} ainda não entregue${pedidos.length === 1 ? '' : 's'}:\n\n${pedidos.map((pedido, indice) => {
    const atraso = diasImpactoPedido(pedido)
    const situacao = pedidoAtrasado(pedido)
      ? `${atraso || pedido.impacto_dias || 1} dia(s) de impacto no prazo`
      : `previsão para ${formatarData(pedido.data_prevista || pedido.data)}`

    return `${indice + 1}. ${pedido.item || pedido.material}\nQuantidade: ${pedido.quantidade || 'não informada'} ${pedido.unidade || ''}\nFornecedor: ${pedido.fornecedor || 'não informado'}\nSituação: ${situacao}\nServiço relacionado: ${pedido.tarefa_relacionada || 'não informado'}`
  }).join('\n\n')}`
}

function analisarCimento(cimento) {
  if (!cimento) return 'Não encontrei um pedido de cimento pendente nesta obra.'

  const impacto = cimento.impacto_dias || diasImpactoPedido(cimento)
  const sucessoras = cimento.atividades_sucessoras?.length
    ? cimento.atividades_sucessoras.map((atividade, indice) => `${indice + 1}. ${atividade}`).join('\n')
    : 'Nenhuma atividade sucessora cadastrada.'

  return `Sim. O atraso do cimento pode impactar a concretagem das vigas V101 a V108.\n\nMaterial: ${cimento.item || 'Cimento'}\nQuantidade: ${cimento.quantidade || 'não informada'} ${cimento.unidade || ''}\nFornecedor: ${cimento.fornecedor || 'não informado'}\nData necessária: ${formatarData(cimento.data_necessidade)}\nPrevisão original: ${formatarData(cimento.data_prevista_original)}\nNova previsão: ${formatarData(cimento.data_prevista)}\nImpacto mínimo estimado: ${impacto} dia(s)\n\nMotivo: ${cimento.impacto || 'A entrega ocorre depois da data necessária para o serviço.'}\n\nAtividades sucessoras sob risco:\n${sucessoras}\n\nRecomendação:\n1. Confirmar imediatamente a entrega com o fornecedor.\n2. Verificar estoque e compra emergencial.\n3. Atualizar a concretagem e as atividades sucessoras no cronograma.\n4. Registrar o risco no diário de obra.`
}

function gerarPlanoAcao({ servicosAtrasados, materiaisAtrasados, tarefasBloqueadas }) {
  const acoes = []

  if (materiaisAtrasados.length) {
    acoes.push('Confirmar hoje a nova previsão de entrega dos materiais críticos e registrar a resposta do fornecedor.')
  }
  if (tarefasBloqueadas.length) {
    acoes.push('Definir quais serviços podem ser antecipados enquanto o bloqueio não for resolvido.')
  }
  if (servicosAtrasados.length) {
    acoes.push('Reunir os responsáveis pelos serviços atrasados e estabelecer metas diárias de recuperação.')
  }
  acoes.push('Atualizar o cronograma sempre que houver alteração de entrega, produtividade ou sequência executiva.')

  return `Plano de ação sugerido:\n\n${acoes.map((acao, indice) => `${indice + 1}. ${acao}`).join('\n')}\n\nPrioridade: garantir o cimento antes da concretagem das vigas V101 a V108.`
}

function gerarResposta(pergunta, contexto) {
  const texto = normalizarTexto(pergunta)
  const {
    tarefas,
    pedidos,
    servicosAtrasados,
    materiaisNaoEntregues,
    materiaisAtrasados,
    tarefasBloqueadas,
  } = contexto

  const cimento = materiaisNaoEntregues.find((pedido) => normalizarTexto(pedido.item || pedido.material).includes('cimento'))

  if (texto.includes('cimento') || texto.includes('v101') || texto.includes('viga 101') || texto.includes('vigas 101')) {
    return analisarCimento(cimento)
  }

  if (texto.includes('plano') || texto.includes('acao') || texto.includes('recuperar') || texto.includes('providencia')) {
    return gerarPlanoAcao(contexto)
  }

  if (texto.includes('bloquead') || texto.includes('impedid')) {
    if (!tarefasBloqueadas.length) return 'Não encontrei tarefas bloqueadas nesta obra.'
    return `Encontrei ${tarefasBloqueadas.length} tarefa(s) bloqueada(s):\n\n${tarefasBloqueadas.map((tarefa, indice) => `${indice + 1}. ${tarefa.nome}\nMotivo: ${tarefa.bloqueio || 'não informado'}`).join('\n\n')}`
  }

  if (texto.includes('responsavel') || texto.includes('quem')) {
    if (!servicosAtrasados.length) return 'Não encontrei serviços atrasados com responsáveis cadastrados.'
    return servicosAtrasados.map((tarefa, indice) => `${indice + 1}. ${tarefa.nome}: ${tarefa.responsavel || tarefa.responsavel_nome || 'responsável não informado'}`).join('\n')
  }

  const tarefaEncontrada = tarefas.find((tarefa) => {
    const palavras = normalizarTexto(tarefa.nome).split(' ').filter((palavra) => palavra.length > 4)
    return palavras.some((palavra) => texto.includes(palavra))
  })

  if (tarefaEncontrada && (texto.includes('detalh') || texto.includes('situacao') || texto.includes('status'))) {
    return `Serviço: ${tarefaEncontrada.nome}\nInício: ${formatarData(tarefaEncontrada.data_inicio || tarefaEncontrada.inicio)}\nTérmino: ${formatarData(tarefaEncontrada.data_termino || tarefaEncontrada.termino)}\nProgresso: ${Number(tarefaEncontrada.progresso || 0)}%\nResponsável: ${tarefaEncontrada.responsavel || tarefaEncontrada.responsavel_nome || 'não informado'}\nSituação: ${tarefaEncontrada.status_operacional || tarefaEncontrada.status || 'calculada pelo cronograma'}${tarefaEncontrada.bloqueio ? `\nBloqueio: ${tarefaEncontrada.bloqueio}` : ''}`
  }

  const pedidoEncontrado = pedidos.find((pedido) => {
    const palavras = normalizarTexto(pedido.item || pedido.material).split(' ').filter((palavra) => palavra.length > 4)
    return palavras.some((palavra) => texto.includes(palavra))
  })

  if (pedidoEncontrado && (texto.includes('detalh') || texto.includes('situacao') || texto.includes('status') || texto.includes('quando'))) {
    return `Material: ${pedidoEncontrado.item || pedidoEncontrado.material}\nQuantidade: ${pedidoEncontrado.quantidade || 'não informada'} ${pedidoEncontrado.unidade || ''}\nFornecedor: ${pedidoEncontrado.fornecedor || 'não informado'}\nStatus: ${pedidoEncontrado.status || 'não informado'}\nData necessária: ${formatarData(pedidoEncontrado.data_necessidade)}\nPrevisão atual: ${formatarData(pedidoEncontrado.data_prevista || pedidoEncontrado.data)}\nServiço relacionado: ${pedidoEncontrado.tarefa_relacionada || 'não informado'}\nImpacto: ${pedidoEncontrado.impacto || 'não cadastrado'}`
  }

  if (texto.includes('servico') || texto.includes('cronograma') || texto.includes('atividade') || texto.includes('atrasad')) {
    return listarServicos(servicosAtrasados)
  }

  if (texto.includes('material') || texto.includes('entrega') || texto.includes('compra') || texto.includes('pedido')) {
    return listarMateriais(materiaisNaoEntregues)
  }

  if (texto.includes('risco') || texto.includes('impacto') || texto.includes('prioridade') || texto.includes('resumo')) {
    return `Os principais riscos identificados são:\n\n1. ${servicosAtrasados.length} serviço(s) atrasado(s).\n2. ${materiaisAtrasados.length} material(is) com impacto no prazo.\n3. ${tarefasBloqueadas.length} tarefa(s) bloqueada(s).\n\nO risco mais crítico é o cimento, porque a nova previsão ocorre depois da data programada para a concretagem das vigas V101 a V108.`
  }

  return `Posso analisar o cronograma, os pedidos e os bloqueios desta obra. Faça uma pergunta mais específica, por exemplo:\n\n• Quais serviços estão atrasados?\n• Quais materiais não foram entregues?\n• O cimento pode impactar a concretagem?\n• Quais tarefas estão bloqueadas?\n• Monte um plano de ação.`
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
      texto: 'Olá. Sou a IA operacional desta obra. Pergunte sobre serviços atrasados, materiais pendentes, bloqueios ou impacto no cronograma.',
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
  const { pedidos: pedidosBanco = [], loading: comprasLoading } = useCompras(obraAtual?.id)

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

  function mudarObra(novoId) {
    setObraId(novoId)
    setMensagens([
      {
        tipo: 'assistente',
        texto: 'Obra alterada. Faça uma pergunta para analisar os dados da nova obra.',
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
        <button type="button" onClick={() => router.push('/')} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white">Voltar ao login</button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200/70 bg-white">
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
              <p className="text-xs font-medium text-slate-500">Converse com os dados operacionais da obra selecionada</p>
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
                <p className="text-xs font-medium text-slate-500">As informações só aparecem depois que você fizer uma pergunta</p>
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
                placeholder="Pergunte sobre atrasos, entregas, bloqueios ou riscos da obra..."
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
