'use client'

import { useEffect, useMemo, useState } from 'react'
import { PanelClean, StatusBadge } from '@/components/ui/Cards'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCompras } from '@/hooks/useCompras'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'
import '@/lib/coreModuleDefinitions'
import { canViewModule, normalizeRole } from '@/lib/accessControl'
import {
  pedidoAtrasadoOperacional,
  tarefaAtrasadaOperacional,
} from '@/lib/operationalData'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import {
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  Camera,
  Layers,
  ShoppingBag,
  ArrowRight,
  Target,
  BarChart3,
} from 'lucide-react'

const WORKSPACE_TABS = new Set(['compras', 'diario', 'fotos', 'materiais', 'equipe', 'financeiro', 'crm', 'clientes'])
const SEEN_PREFIX = 'neocanteiro_module_seen_v1'

function recordTimestamp(record) {
  const value = record?.updated_at || record?.created_at || (record?.data ? `${record.data}T23:59:59` : '')
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function seenKey(user, obraId, moduleKey) {
  return `${SEEN_PREFIX}:${user?.id || user?.email || 'usuario'}:${obraId || 'obra'}:${moduleKey}`
}

function unreadCount(records, user, obraId, moduleKey) {
  if (typeof window === 'undefined') return 0
  const lastSeen = Number(window.localStorage.getItem(seenKey(user, obraId, moduleKey)) || 0)
  return records.filter((record) => recordTimestamp(record) > lastSeen).length
}

export function DashboardView({
  obraAtual,
  tarefas = [],
  diarios = [],
  user,
  role,
  onNavigate,
}) {
  const [isMounted, setIsMounted] = useState(false)
  const [seenVersion, setSeenVersion] = useState(0)
  const activeRole = normalizeRole(role)
  const { pedidos = [] } = useCompras(obraAtual?.id)
  const { records: diariosWorkspace = [] } = useWorkspaceRecords('diario', obraAtual?.id, user)
  const { records: fotosWorkspace = [] } = useWorkspaceRecords('fotos', obraAtual?.id, user)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const diariosVisiveis = useMemo(() => {
    const unique = new Map()

    ;[...diariosWorkspace, ...(diarios || [])].forEach((record) => {
      const key = record?.id
        ? String(record.id)
        : `${record?.data || ''}:${record?.servicos_executados || record?.atividades || ''}`
      if (!unique.has(key)) unique.set(key, record)
    })

    return Array.from(unique.values()).sort((a, b) => recordTimestamp(b) - recordTimestamp(a))
  }, [diariosWorkspace, diarios])

  const fotosVisiveis = useMemo(
    () => [...fotosWorkspace].sort((a, b) => recordTimestamp(b) - recordTimestamp(a)),
    [fotosWorkspace],
  )

  const diariosNovos = useMemo(
    () => unreadCount(diariosVisiveis, user, obraAtual?.id, 'diario'),
    [diariosVisiveis, user, obraAtual?.id, seenVersion],
  )
  const fotosNovas = useMemo(
    () => unreadCount(fotosVisiveis, user, obraAtual?.id, 'fotos'),
    [fotosVisiveis, user, obraAtual?.id, seenVersion],
  )

  if (!obraAtual) {
    return (
      <EmptyState
        title="Nenhuma obra selecionada"
        description="Selecione uma obra para visualizar o dashboard executivo."
      />
    )
  }

  const markSeen = (moduleKey) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(seenKey(user, obraAtual?.id, moduleKey), String(Date.now()))
    setSeenVersion((current) => current + 1)
  }

  const navigate = (tabId) => {
    if (!canViewModule(activeRole, tabId)) return
    if (tabId === 'diario' || tabId === 'fotos') markSeen(tabId)

    if (tabId === 'timeline') {
      window.location.href = '/timeline'
      return
    }

    if (WORKSPACE_TABS.has(tabId)) {
      window.location.href = `/workspace?module=${tabId}`
      return
    }

    onNavigate(tabId)
  }

  const concluidas = tarefas.filter((tarefa) => Number(tarefa.progresso) === 100).length
  const totalTarefas = tarefas.length || 0
  const progressoMedio = totalTarefas > 0
    ? Math.round(tarefas.reduce((acc, tarefa) => acc + (Number(tarefa.progresso) || 0), 0) / totalTarefas)
    : 0

  const atrasosCronograma = tarefas.filter((tarefa) => tarefaAtrasadaOperacional(tarefa)).length
  const materiaisAtrasados = pedidos.filter((pedido) => pedidoAtrasadoOperacional(pedido)).length
  const ultimoDiario = diariosVisiveis[0] || null
  const ultimaFoto = fotosVisiveis[0] || null

  const dadosEvolucao = [
    { name: 'S1', previsto: 10, realizado: 8 },
    { name: 'S2', previsto: 25, realizado: 22 },
    { name: 'S3', previsto: 40, realizado: 42 },
    { name: 'S4', previsto: 55, realizado: 50 },
    { name: 'S5', previsto: 70, realizado: 68 },
    { name: 'S6', previsto: 85, realizado: 82 },
    { name: 'S7', previsto: 100, realizado: 95 },
  ]

  const MiniCard = ({ title, value, detail, icon: Icon, color = 'blue', notification = 0, onClick }) => (
    <button
      onClick={onClick}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/60 bg-white p-2.5 text-left transition-all hover:border-blue-400 hover:shadow-sm active:scale-95"
    >
      {notification > 0 && (
        <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 py-0.5 text-[8px] font-black text-white shadow-sm">
          {notification > 99 ? '99+' : notification}
        </span>
      )}
      <div className="mb-1 flex items-center gap-1.5 pr-5">
        <div className={`rounded bg-${color}-50 p-1 text-${color}-600`}>
          <Icon size={12} />
        </div>
        <p className="truncate text-[8px] font-black uppercase tracking-wider text-slate-400">{title}</p>
      </div>
      <div>
        <h4 className="text-base font-black leading-none text-slate-900">{value}</h4>
        {detail && <p className="mt-0.5 truncate text-[7px] font-bold text-slate-500">{detail}</p>}
      </div>
    </button>
  )

  return (
    <div className="mx-auto max-w-[1600px] animate-fade-in space-y-3 px-2">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
        <MiniCard title="Progresso" value={`${progressoMedio}%`} detail="Evolução Geral" icon={TrendingUp} onClick={() => navigate('cronograma')} />
        <MiniCard title="Entrega" value={obraAtual.prazo_final ? new Date(obraAtual.prazo_final).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '---'} detail="Prazo Final" icon={Calendar} color="indigo" onClick={() => navigate('cronograma')} />
        <MiniCard title="Concluídas" value={`${concluidas}/${totalTarefas}`} detail="Tarefas Totais" icon={CheckCircle2} color="emerald" onClick={() => navigate('cronograma')} />
        <MiniCard title="Atrasos" value={atrasosCronograma} detail="Serviços atrasados" icon={AlertCircle} color={atrasosCronograma > 0 ? 'red' : 'emerald'} onClick={() => navigate('cronograma')} />
        {canViewModule(activeRole, 'compras') && <MiniCard title="Suprimentos" value={materiaisAtrasados} detail="Materiais em atraso" icon={ShoppingBag} color={materiaisAtrasados > 0 ? 'orange' : 'slate'} onClick={() => navigate('compras')} />}
        {canViewModule(activeRole, 'diario') && <MiniCard title="Diários" value={diariosVisiveis.length} detail={`${diariosVisiveis.length} registro${diariosVisiveis.length === 1 ? '' : 's'}`} icon={FileText} color="blue" notification={diariosNovos} onClick={() => navigate('diario')} />}
        {canViewModule(activeRole, 'fotos') && <MiniCard title="Fotos" value={fotosVisiveis.length} detail={`${fotosVisiveis.length} foto${fotosVisiveis.length === 1 ? '' : 's'}`} icon={Camera} color="purple" notification={fotosNovas} onClick={() => navigate('fotos')} />}
        {canViewModule(activeRole, 'timeline') && (
          <button className="flex items-center justify-center rounded-xl bg-slate-900 p-2 text-white transition-colors hover:bg-slate-800" onClick={() => navigate('timeline')}>
            <Layers size={14} className="mr-1.5" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Timeline</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <PanelClean className="min-h-[220px] !p-3 lg:col-span-5">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Análise de Performance</p>
              <h3 className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                <Target size={12} className="text-blue-600" />
                Curva S - Previsto vs Realizado
              </h3>
            </div>
            <StatusBadge status={obraAtual.status} />
          </div>
          <div className="h-[150px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosEvolucao}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '9px', padding: '4px' }} />
                  <Area type="monotone" dataKey="previsto" stroke="#2563eb" strokeWidth={2} fill="url(#colorPrevisto)" />
                  <Area type="monotone" dataKey="realizado" stroke="#10b981" strokeWidth={2} fill="url(#colorRealizado)" />
                  <defs>
                    <linearGradient id="colorPrevisto" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </PanelClean>

        <PanelClean className="min-h-[220px] cursor-pointer !p-3 transition-colors hover:border-blue-300 lg:col-span-4" onClick={() => navigate('cronograma')}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Acompanhamento</p>
              <h3 className="flex items-center gap-1.5 text-xs font-black text-slate-900"><BarChart3 size={12} className="text-indigo-600" />Cronograma Físico</h3>
            </div>
            <div className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] font-black text-blue-600">LIVE</div>
          </div>

          <div className="space-y-2.5">
            {tarefas.slice(0, 4).map((tarefa, index) => (
              <div key={tarefa.id || index} className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-bold"><span className="max-w-[120px] truncate text-slate-700">{tarefa.nome}</span><span className="text-slate-400">{tarefa.progresso}%</span></div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full transition-all duration-700 ${Number(tarefa.progresso) === 100 ? 'bg-emerald-500' : tarefaAtrasadaOperacional(tarefa) ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${tarefa.progresso}%` }} /></div>
              </div>
            ))}
            {tarefas.length > 4 && <p className="mt-1 text-center text-[8px] font-bold uppercase tracking-tighter text-slate-400">+ {tarefas.length - 4} atividades ativas</p>}
          </div>
        </PanelClean>

        <div className="space-y-3 lg:col-span-3">
          {canViewModule(activeRole, 'diario') && <button onClick={() => navigate('diario')} className="group relative flex h-[105px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-3 text-left transition-all hover:border-blue-400 hover:shadow-sm">
            {diariosNovos > 0 && <span className="absolute right-3 top-3 rounded-full bg-red-600 px-2 py-1 text-[8px] font-black text-white">{diariosNovos} novo{diariosNovos === 1 ? '' : 's'}</span>}
            <div className="flex items-center justify-between"><div className="rounded-lg bg-slate-900 p-1.5 text-white"><FileText size={14} /></div><ArrowRight size={12} className="text-slate-300 group-hover:text-blue-500" /></div>
            <div><p className="mb-0.5 text-[8px] font-black uppercase tracking-widest text-slate-400">Último diário</p><h4 className="line-clamp-2 text-[10px] font-bold leading-tight text-slate-900">{ultimoDiario?.servicos_executados || ultimoDiario?.atividades || 'Sem relatos registrados.'}</h4></div>
          </button>}

          {canViewModule(activeRole, 'fotos') && <button onClick={() => navigate('fotos')} className="group relative flex h-[105px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-3 text-left transition-all hover:border-blue-400 hover:shadow-sm">
            {fotosNovas > 0 && <span className="absolute right-3 top-3 rounded-full bg-red-600 px-2 py-1 text-[8px] font-black text-white">{fotosNovas} nova{fotosNovas === 1 ? '' : 's'}</span>}
            <div className="flex items-center justify-between"><div className="rounded-lg bg-purple-50 p-1.5 text-purple-600"><Camera size={14} /></div>{ultimaFoto?.url ? <img src={ultimaFoto.url} alt="Última foto da obra" className="h-7 w-10 rounded-md object-cover ring-1 ring-slate-200" /> : <ArrowRight size={12} className="text-slate-300 group-hover:text-purple-500" />}</div>
            <div><p className="mb-0.5 text-[8px] font-black uppercase tracking-widest text-slate-400">Fotos da Obra</p><h4 className="text-[10px] font-bold leading-tight text-slate-900">{fotosVisiveis.length ? `${fotosVisiveis.length} foto${fotosVisiveis.length === 1 ? '' : 's'} cadastrada${fotosVisiveis.length === 1 ? '' : 's'}` : 'Nenhuma foto cadastrada'}</h4></div>
          </button>}
        </div>
      </div>
    </div>
  )
}
