'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Building2,
  CalendarClock,
  CheckCircle2,
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

function dataRelativa(dias) {
  const data = new Date()
  data.setHours(12, 0, 0, 0)
  data.setDate(data.getDate() + dias)
  return data.toISOString().slice(0, 10)
}

function criarTarefasDemo(obraId) {
  return [
    {
      id: 'tarefa-demo-1',
      obra_id: obraId,
      nome: 'Concretagem das vigas 101 a 108',
      data_inicio: dataRelativa(-12),
      data_termino: dataRelativa(-3),
      progresso: 45,
      responsavel: 'Equipe estrutural',
    },
    {
      id: 'tarefa-demo-2',
      obra_id: obraId,
      nome: 'Alvenaria do pavimento térreo',
      data_inicio: dataRelativa(-10),
      data_termino: dataRelativa(-1),
      progresso: 70,
      responsavel: 'Equipe de alvenaria',
    },
    {
      id: 'tarefa-demo-3',
      obra_id: obraId,
      nome: 'Infraestrutura elétrica do térreo',
      data_inicio: dataRelativa(1),
      data_termino: dataRelativa(8),
      progresso: 10,
      responsavel: 'Eletricista',
    },
    {
      id: 'tarefa-demo-4',
      obra_id: obraId,
      nome: 'Fundação e blocos',
      data_inicio: dataRelativa(-35),
      data_termino: dataRelativa(-18),
      progresso: 100,
      responsavel: 'Equipe estrutural',
    },
  ]
}

function criarPedidosDemo(obraId) {
  return [
    {
      id: 'pedido-demo-1',
      obra_id: obraId,
      item: 'Cimento CP-II',
      fornecedor: 'Votorantim',
      quantidade: 100,
      unidade: 'sacos',
      data_prevista: dataRelativa(-2),
      status: 'Atrasado',
      tarefa_relacionada: 'Concretagem das vigas 101 a 108',
      impacto: 'Pode interromper ou adiar a concretagem das vigas 101 a 108.',
    },
    {
      id: 'pedido-demo-2',
      obra_id: obraId,
      item: 'Madeira para formas',
      fornecedor: 'Madeireira Norte',
      quantidade: 2,
      unidade: 'm³',
      data_prevista: dataRelativa(-1),
      status: 'Pendente',
      tarefa_relacionada: 'Concretagem das vigas 101 a 108',
      impacto: 'Pode reduzir a produtividade da montagem de formas.',
    },
    {
      id: 'pedido-demo-3',
      obra_id: obraId,
      item: 'Blocos cerâmicos',
      fornecedor: 'Cerâmica Joinville',
      quantidade: 1800,
      unidade: 'unidades',
      data_prevista: dataRelativa(3),
      status: 'Pendente',
      tarefa_relacionada: 'Alvenaria do pavimento térreo',
      impacto: 'A entrega ainda está no prazo, mas deve ser acompanhada.',
    },
    {
      id: 'pedido-demo-4',
      obra_id: obraId,
      item: 'Aço CA-50 10 mm',
      fornecedor: 'Gerdau',
      quantidade: 500,
      unidade: 'kg',
      data_prevista: dataRelativa(-5),
      data_entrega: dataRelativa(-5),
      status: 'Recebido',
      tarefa_relacionada: 'Concretagem das vigas 101 a 108',
    },
  ]
}

function parseData(valor) {
  if (!valor) return null
  const partes = String(valor).slice(0, 10).split('-').map(Number)
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null
  return new Date(partes[0], partes[1] - 1, partes[2], 12, 0, 0, 0)
}

function formatarData(valor) {
  const data = parseData(valor)
  return data ? data.toLocaleDateString('pt-BR') : 'Sem data'
}

function calcularDiasAtraso(valor) {
  const data = parseData(valor)
  if (!data) return 0
  const hoje = new Date()
  hoje.setHours(12, 0, 0, 0)
  return Math.max(0, Math.ceil((hoje - data) / 86400000))
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

function listarServicos(servicos) {
  if (!servicos.length) return 'Não encontrei serviços atrasados no cronograma desta obra.'

  const linhas = servicos.map((tarefa, indice) => {
    const dias = calcularDiasAtraso(tarefa.data_termino || tarefa.termino)
    return `${indice + 1}. ${tarefa.nome}: ${dias} dia${dias === 1 ? '' : 's'} de atraso, com ${Number(tarefa.progresso || 0)}% executado.`
  })

  return `Encontrei ${servicos.length} serviço${servicos.length === 1 ? '' : 's'} atrasado${servicos.length === 1 ? '' : 's'}:\n\n${linhas.join('\n')}`
}

function listarMateriais(pedidos) {
  if (!pedidos.length) return 'Não encontrei materiais pendentes de entrega nesta obra.'

  const linhas = pedidos.map((pedido, indice) => {
    const atraso = calcularDiasAtraso(pedido.data_prevista)
    const situacao = atraso > 0 ? `${atraso} dia${atraso === 1 ? '' : 's'} de atraso` : `previsão para ${formatarData(pedido.data_prevista)}`
    return `${indice + 1}. ${pedido.item || pedido.material}: ${pedido.quantidade || ''} ${pedido.unidade || ''}, fornecedor ${pedido.fornecedor || 'não informado'}, ${situacao}.`
  })

  return `Há ${pedidos.length} material${pedidos.length === 1 ? '' : 'is'} ainda não entregue${pedidos.length === 1 ? '' : 's'}:\n\n${linhas.join('\n')}`
}

function gerarResposta(pergunta, contexto) {
  const texto = normalizarTexto(pergunta)
  const { obra, servicosAtrasados, materiaisNaoEntregues, materiaisAtrasados } = contexto
  const cimento = materiaisNaoEntregues.find((pedido) => normalizarTexto(pedido.item || pedido.material).includes('cimento'))

  if (texto.includes('cimento')) {
    if (!cimento) return 'Não há pedido de cimento pendente identificado nesta obra.'

    const atraso = calcularDiasAtraso(cimento.data_prevista)
    const situacao = atraso > 0 ? `está com ${atraso} dia${atraso === 1 ? '' : 's'} de atraso` : 'ainda está dentro da data prevista'
    return `O ${cimento.item || 'cimento'} ${situacao}. ${cimento.impacto || 'Esse insumo deve ser acompanhado porque pode afetar serviços estruturais.'}\n\nAção recomendada: confirmar imediatamente a entrega com o fornecedor, avaliar estoque disponível e reprogramar a concretagem somente depois de garantir o volume necessário.`
  }

  if (texto.includes('servico') || texto.includes('cronograma') || texto.includes('atividade') || texto.includes('atrasad')) {
    return listarServicos(servicosAtrasados)
  }

  if (texto.includes('material') || texto.includes('entrega') || texto.includes('compra') || texto.includes('pedido')) {
    return listarMateriais(materiaisNaoEntregues)
  }

  if (texto.includes('risco') || texto.includes('impacto') || texto.includes('critico') || texto.includes('prioridade')) {
    const riscos = []

    if (materiaisAtrasados.length) {
      riscos.push(`${materiaisAtrasados.length} material${materiaisAtrasados.length === 1 ? '' : 'is'} com entrega atrasada`)
    }

    if (servicosAtrasados.length) {
      riscos.push(`${servicosAtrasados.length} serviço${servicosAtrasados.length === 1 ? '' : 's'} fora do prazo`)
    }

    if (cimento) {
      riscos.push('o atraso do cimento pode impactar a concretagem das vigas 101 a 108')
    }

    if (!riscos.length) return 'Não identifiquei riscos operacionais críticos com os dados atuais.'

    return `Prioridades operacionais da obra ${obra.nome}:\n\n${riscos.map((risco, indice) => `${indice + 1}. ${risco}.`).join('\n')}\n\nRecomendo tratar primeiro os insumos ligados aos serviços já atrasados e registrar uma nova previsão de entrega.`
  }

  return `Resumo operacional da obra ${obra.nome}:\n\n${listarServicos(servicosAtrasados)}\n\n${listarMateriais(materiaisNaoEntregues)}\n\nA prioridade é resolver os materiais vencidos que estejam bloqueando atividades do cronograma.`
}

function CardIndicador({ icon: Icon, titulo, valor, texto, alerta }) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${alerta ? 'border-red-100 bg-red-50' : 'border-slate-200/70 bg-white'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${alerta ? 'text-red-500' : 'text-slate-400'}`}>{titulo}</p>
          <p className={`mt-2 text-3xl font-black ${alerta ? 'text-red-600' : 'text-slate-900'}`}>{valor}</p>
          <p className={`mt-1 text-xs font-medium ${alerta ? 'text-red-500' : 'text-slate-500'}`}>{texto}</p>
        </div>
        <div className={`rounded-2xl p-3 ${alerta ? 'bg-white text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

export default function IAOperacionalPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { obras = [], loading: obrasLoading } = useObras()
  const [obraId, setObraId] = useState(null)
  const [pergunta, setPergunta] = useState('')
  const [mensagens, setMensagens] = useState([
    {
      tipo: 'assistente',
      texto: 'Estou analisando o cronograma e os pedidos de compra. Pergunte sobre serviços atrasados, materiais não entregues ou riscos para a obra.',
    },
  ])

  const obrasVisiveis = useMemo(() => (obras.length ? obras : [OBRA_DEMO]), [obras])

  useEffect(() => {
    if (!obraId && obrasVisiveis.length) setObraId(obrasVisiveis[0].id)
  }, [obraId, obrasVisiveis])

  const obraAtual = useMemo(
    () => obrasVisiveis.find((obra) => String(obra.id) === String(obraId)) || obrasVisiveis[0] || OBRA_DEMO,
    [obraId, obrasVisiveis]
  )

  const { tarefas: tarefasBanco = [], loading: tarefasLoading } = useTarefas(obraAtual?.id)
  const { pedidos: pedidosBanco = [], loading: comprasLoading, error: comprasError } = useCompras(obraAtual?.id)

  const tarefas = useMemo(() => {
    if (tarefasBanco.length) return tarefasBanco
    if (String(obraAtual?.id).startsWith('demo')) return criarTarefasDemo(obraAtual.id)
    return []
  }, [tarefasBanco, obraAtual])

  const pedidos = useMemo(() => {
    if (pedidosBanco.length) return pedidosBanco
    if (String(obraAtual?.id).startsWith('demo')) return criarPedidosDemo(obraAtual.id)
    return []
  }, [pedidosBanco, obraAtual])

  const hoje = useMemo(() => {
    const data = new Date()
    data.setHours(12, 0, 0, 0)
    return data
  }, [])

  const servicosAtrasados = useMemo(
    () => tarefas.filter((tarefa) => {
      const termino = parseData(tarefa.data_termino || tarefa.termino)
      return termino && termino < hoje && Number(tarefa.progresso || 0) < 100
    }),
    [tarefas, hoje]
  )

  const materiaisNaoEntregues = useMemo(
    () => pedidos.filter((pedido) => !statusRecebido(pedido.status) && !pedido.data_entrega),
    [pedidos]
  )

  const materiaisAtrasados = useMemo(
    () => materiaisNaoEntregues.filter((pedido) => {
      const prevista = parseData(pedido.data_prevista || pedido.data)
      return prevista && prevista < hoje
    }),
    [materiaisNaoEntregues, hoje]
  )

  const cimentoCritico = materiaisAtrasados.find((pedido) => normalizarTexto(pedido.item || pedido.material).includes('cimento'))
  const carregando = authLoading || obrasLoading || tarefasLoading || comprasLoading

  function perguntar(textoPergunta) {
    const texto = textoPergunta.trim()
    if (!texto) return

    const resposta = gerarResposta(texto, {
      obra: obraAtual,
      servicosAtrasados,
      materiaisNaoEntregues,
      materiaisAtrasados,
    })

    setMensagens((atuais) => [
      ...atuais,
      { tipo: 'usuario', texto },
      { tipo: 'assistente', texto: resposta },
    ])
    setPergunta('')
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
            <button onClick={() => router.push('/')} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-blue-600">
              <ArrowLeft size={19} />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Bot size={23} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">IA Operacional</h1>
              <p className="text-xs font-medium text-slate-500">Análise automática de prazo, compras e riscos</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 md:flex">
            <Building2 size={16} className="text-blue-600" />
            <select
              value={obraAtual?.id || ''}
              onChange={(event) => {
                setObraId(event.target.value)
                setMensagens([{ tipo: 'assistente', texto: 'Obra alterada. Os indicadores e as respostas foram atualizados com os dados selecionados.' }])
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
          <CardIndicador icon={CalendarClock} titulo="Cronograma" valor={servicosAtrasados.length} texto="serviços atrasados" alerta={servicosAtrasados.length > 0} />
          <CardIndicador icon={PackageX} titulo="Suprimentos" valor={materiaisNaoEntregues.length} texto="materiais não entregues" alerta={materiaisAtrasados.length > 0} />
          <CardIndicador icon={Clock3} titulo="Entregas vencidas" valor={materiaisAtrasados.length} texto="pedidos fora da data" alerta={materiaisAtrasados.length > 0} />
          <CardIndicador icon={cimentoCritico ? AlertTriangle : CheckCircle2} titulo="Risco estrutural" valor={cimentoCritico ? 'Crítico' : 'Normal'} texto={cimentoCritico ? 'cimento pode afetar as vigas' : 'sem bloqueio identificado'} alerta={Boolean(cimentoCritico)} />
        </section>

        {cimentoCritico && (
          <section className="rounded-3xl border border-red-100 bg-red-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white p-3 text-red-600"><AlertTriangle size={22} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Alerta operacional prioritário</p>
                  <h2 className="mt-1 text-lg font-black text-red-700">Cimento atrasado pode impactar a concretagem das vigas 101 a 108</h2>
                  <p className="mt-1 text-sm font-medium text-red-600">Confirme a entrega, verifique o estoque disponível e atualize a programação do serviço.</p>
                </div>
              </div>
              <button onClick={() => perguntar('Qual é o impacto do atraso do cimento?')} className="rounded-xl bg-red-600 px-5 py-3 text-xs font-black uppercase text-white shadow-sm">
                Analisar impacto
              </button>
            </div>
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="flex min-h-[620px] flex-col overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600"><Sparkles size={20} /></div>
                <div>
                  <h2 className="font-black">Assistente da obra</h2>
                  <p className="text-xs font-medium text-slate-500">Pergunte usando os dados operacionais da obra selecionada</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Quais serviços estão atrasados?',
                  'Quais materiais não foram entregues?',
                  'Qual é o impacto do atraso do cimento?',
                  'Faça um resumo dos riscos da obra',
                ].map((sugestao) => (
                  <button key={sugestao} onClick={() => perguntar(sugestao)} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100">
                    {sugestao}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-5">
              {mensagens.map((mensagem, indice) => (
                <div key={`${mensagem.tipo}-${indice}`} className={`flex ${mensagem.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${mensagem.tipo === 'usuario' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700 shadow-sm'}`}>
                    {mensagem.texto}
                  </div>
                </div>
              ))}
              {carregando && <p className="text-xs font-bold text-slate-400">Atualizando dados operacionais...</p>}
            </div>

            <form onSubmit={enviar} className="border-t border-slate-100 bg-white p-4">
              <div className="flex gap-3">
                <input value={pergunta} onChange={(event) => setPergunta(event.target.value)} placeholder="Pergunte sobre atrasos, materiais ou riscos..." className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" />
                <button type="submit" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                  <Send size={18} />
                </button>
              </div>
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
                  <div key={tarefa.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-900">{tarefa.nome}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>{calcularDiasAtraso(tarefa.data_termino || tarefa.termino)} dias de atraso</span>
                      <span>{Number(tarefa.progresso || 0)}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(100, Number(tarefa.progresso || 0))}%` }} />
                    </div>
                  </div>
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
                  const dias = calcularDiasAtraso(pedido.data_prevista || pedido.data)
                  return (
                    <div key={pedido.id} className={`rounded-2xl border p-4 ${dias > 0 ? 'border-red-100 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
                      <p className="text-sm font-black text-slate-900">{pedido.item || pedido.material}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">{pedido.fornecedor || 'Fornecedor não informado'}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                        <span className={dias > 0 ? 'text-red-600' : 'text-slate-500'}>{dias > 0 ? `${dias} dias de atraso` : `Previsto para ${formatarData(pedido.data_prevista || pedido.data)}`}</span>
                        <span className="text-slate-500">{pedido.quantidade || ''} {pedido.unidade || ''}</span>
                      </div>
                    </div>
                  )
                }) : <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Nenhum material pendente.</p>}
              </div>
              {comprasError && !String(obraAtual?.id).startsWith('demo') && (
                <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-700">A tabela de pedidos de compra ainda precisa ser ativada no Supabase.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
