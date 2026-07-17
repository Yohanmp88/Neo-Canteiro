'use client'

import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCompras } from '@/hooks/useCompras'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'
import '@/lib/coreModuleDefinitions'
import { canViewModule, normalizeRole } from '@/lib/accessControl'
import { pedidoAtrasadoOperacional, tarefaAtrasadaOperacional } from '@/lib/operationalData'

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
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  FileText,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'

const WORKSPACE_TABS = new Set(['compras', 'diario', 'fotos', 'materiais', 'equipe', 'financeiro', 'clientes'])
const SEEN_PREFIX = 'neocanteiro_module_seen_v1'

const CARD_TONES = {
  blue: {
    icon: 'bg-blue-50 text-blue-700 ring-blue-100',
    line: 'bg-blue-600',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    line: 'bg-indigo-600',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    line: 'bg-emerald-500',
  },
  red: {
    icon: 'bg-red-50 text-red-700 ring-red-100',
    line: 'bg-red-500',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    line: 'bg-amber-500',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-700 ring-violet-100',
    line: 'bg-violet-500',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    line: 'bg-slate-500',
  },
}

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

function formatDate(value, options = { day: '2-digit', month: 'short' }) {
  if (!value) return '—'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR', options)
}

function MetricCard({ title, value, detail, icon: Icon, tone = 'blue', onClick }) {
  const visual = CARD_TONES[tone] || CARD_TONES.blue

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[76px] items-center gap-3 overflow-hidden rounded-[1.15rem] border border-slate-200/80 bg-white px-3.5 py-3 text-left shadow-[0_14px_34px_-29px_rgba(15,23,42,0.68)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_18px_40px_-28px_rgba(37,99,235,0.3)]"
    >
      <span className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${visual.line}`} />
      <span className={`ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${visual.icon}`}>
        <Icon size={18} strokeWidth={2.3} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">{title}</span>
        <span className="mt-1 flex min-w-0 items-end gap-2">
          <span className="truncate text-[23px] font-black leading-none tracking-tight text-slate-950">{value}</span>
          <ArrowRight size={13} className="mb-0.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
        </span>
        <span className="mt-1 block truncate text-[9px] font-semibold text-slate-500">{detail}</span>
      </span>
    </button>
  )
}

function PanelHeader({ eyebrow, title, action, onAction }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[8px] font-black uppercase tracking-[0.16em] text-blue-600">{eyebrow}</p>
        <h3 className="mt-0.5 truncate text-[12px] font-black tracking-tight text-slate-950">{title}</h3>
      </div>
      {action && (
        <button type="button" onClick={onAction} className="inline-flex shrink-0 items-center gap-1 text-[8px] font-black uppercase tracking-wider text-slate-400 transition hover:text-blue-600">
          {action}<ArrowRight size={11} />
        </button>
      )}
    </div>
  )
}

export function DashboardView({ obraAtual, tarefas = [], diarios = [], user, role, onNavigate }) {
  const [isMounted, setIsMounted] = useState(false)
  const [seenVersion, setSeenVersion] = useState(0)
  const activeRole = normalizeRole(role)
  const { pedidos = [] } = useCompras(obraAtual?.id)
  const { records: diariosWorkspace = [] } = useWorkspaceRecords('diario', obraAtual?.id, user)
  const { records: fotosWorkspace = [] } = useWorkspaceRecords('fotos', obraAtual?.id, user)

  useEffect(() => setIsMounted(true), [])

  const diariosVisiveis = useMemo(() => {
    const unique = new Map()
    ;[...diariosWorkspace, ...(diarios || [])].forEach((record) => {
      const key = record?.id ? String(record.id) : `${record?.data || ''}:${record?.servicos_executados || record?.atividades || ''}`
      if (!unique.has(key)) unique.set(key, record)
    })
    return Array.from(unique.values()).sort((a, b) => recordTimestamp(b) - recordTimestamp(a))
  }, [diariosWorkspace, diarios])

  const fotosVisiveis = useMemo(
    () => [...fotosWorkspace].sort((a, b) => recordTimestamp(b) - recordTimestamp(a)),
    [fotosWorkspace],
  )

  if (!obraAtual) {
    return <EmptyState title="Nenhuma obra selecionada" description="Selecione uma obra para visualizar o painel executivo." />
  }

  const navigate = (tabId) => {
    if (!canViewModule(activeRole, tabId)) return

    if (tabId === 'diario' || tabId === 'fotos') {
      window.localStorage.setItem(seenKey(user, obraAtual.id, tabId), String(Date.now()))
      setSeenVersion((current) => current + 1)
    }

    if (WORKSPACE_TABS.has(tabId)) {
      window.location.href = `/workspace?module=${tabId}`
      return
    }

    onNavigate(tabId)
  }

  const totalTarefas = tarefas.length
  const concluidas = tarefas.filter((item) => Number(item.progresso) === 100).length
  const atrasadas = tarefas.filter((item) => tarefaAtrasadaOperacional(item))
  const materiaisCriticos = pedidos.filter((item) => pedidoAtrasadoOperacional(item))
  const totalAlertas = atrasadas.length + materiaisCriticos.length
  const progressoMedio = totalTarefas
    ? Math.round(tarefas.reduce((total, item) => total + (Number(item.progresso) || 0), 0) / totalTarefas)
    : Number(obraAtual.progresso || 0)

  const prazoFinal = obraAtual.prazo_final || obraAtual.previsao_entrega || obraAtual.previsaoEntrega
  const ultimoDiario = diariosVisiveis[0] || null
  const ultimaFoto = fotosVisiveis[0] || null
  const ultimaFotoUrl = ultimaFoto?.url || ultimaFoto?.url_foto || ultimaFoto?.data?.url || ultimaFoto?.data?.url_foto || ''

  const diariosNovos = useMemo(
    () => unreadCount(diariosVisiveis, user, obraAtual.id, 'diario'),
    [diariosVisiveis, user, obraAtual.id, seenVersion],
  )
  const fotosNovas = useMemo(
    () => unreadCount(fotosVisiveis, user, obraAtual.id, 'fotos'),
    [fotosVisiveis, user, obraAtual.id, seenVersion],
  )

  const tarefasOrdenadas = useMemo(() => [...tarefas]
    .sort((a, b) => new Date(a.data_termino || a.termino || '2999-12-31') - new Date(b.data_termino || b.termino || '2999-12-31')),
  [tarefas])

  const dadosEvolucao = useMemo(() => {
    const ordered = tarefasOrdenadas.slice(0, 7)
    if (!ordered.length) return [{ name: 'S1', previsto: 0, realizado: 0 }]

    return ordered.map((item, index) => {
      const sample = ordered.slice(0, index + 1)
      return {
        name: `S${index + 1}`,
        previsto: Math.round(((index + 1) / ordered.length) * 100),
        realizado: Math.round(sample.reduce((sum, current) => sum + Number(current.progresso || 0), 0) / sample.length),
      }
    })
  }, [tarefasOrdenadas])

  return (
    <div className="mx-auto w-full max-w-[1700px] animate-fade-in space-y-3 xl:grid xl:h-[calc(100vh-7.5rem)] xl:min-h-[560px] xl:grid-rows-[76px_minmax(0,1fr)_94px] xl:gap-3 xl:space-y-0 xl:overflow-hidden">
      <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Progresso da obra"
          value={`${progressoMedio}%`}
          detail="Evolução física consolidada"
          icon={TrendingUp}
          tone="blue"
          onClick={() => navigate('cronograma')}
        />
        <MetricCard
          title="Previsão de entrega"
          value={formatDate(prazoFinal)}
          detail={obraAtual.status || 'Prazo contratual'}
          icon={CalendarDays}
          tone="indigo"
          onClick={() => navigate('cronograma')}
        />
        <MetricCard
          title="Tarefas concluídas"
          value={`${concluidas}/${totalTarefas}`}
          detail="Atividades do cronograma"
          icon={CheckCircle2}
          tone="emerald"
          onClick={() => navigate('cronograma')}
        />
        <MetricCard
          title="Alertas operacionais"
          value={totalAlertas}
          detail={`${atrasadas.length} serviço(s) · ${materiaisCriticos.length} material(is)`}
          icon={AlertCircle}
          tone={totalAlertas ? 'red' : 'slate'}
          onClick={() => navigate(atrasadas.length ? 'cronograma' : 'compras')}
        />
      </section>

      <section className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-12">
        <section className="min-h-[240px] overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.72)] xl:col-span-6 xl:min-h-0">
          <PanelHeader eyebrow="Performance física" title="Curva S — previsto x realizado" action="Abrir cronograma" onAction={() => navigate('cronograma')} />
          <div className="mt-2 flex items-center gap-4 text-[8px] font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" />Previsto</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Realizado</span>
          </div>

          <div className="mt-1 h-[calc(100%-42px)] min-h-[170px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosEvolucao} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: '11px', border: '1px solid #e2e8f0', fontSize: '10px', boxShadow: '0 14px 35px -24px rgba(15,23,42,.5)' }} />
                  <Area type="monotone" dataKey="previsto" name="Previsto" stroke="#2563eb" strokeWidth={2.4} fill="url(#plannedFill)" />
                  <Area type="monotone" dataKey="realizado" name="Realizado" stroke="#10b981" strokeWidth={2.4} fill="url(#realFill)" />
                  <defs>
                    <linearGradient id="plannedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                    <linearGradient id="realFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.13}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="min-h-[240px] overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.72)] xl:col-span-6 xl:min-h-0">
          <PanelHeader eyebrow="Cronograma físico" title="Atividades e avanço da obra" action="Ver completo" onAction={() => navigate('cronograma')} />

          <div className="mt-3 grid min-h-0 gap-2.5">
            {tarefasOrdenadas.slice(0, 5).map((item, index) => {
              const progress = Math.max(0, Math.min(100, Number(item.progresso || 0)))
              const delayed = tarefaAtrasadaOperacional(item)
              const completed = progress === 100

              return (
                <button key={item.id || index} type="button" onClick={() => navigate('cronograma')} className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 text-left transition hover:border-slate-200 hover:bg-slate-50">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-black ${completed ? 'bg-emerald-50 text-emerald-700' : delayed ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-[10px] font-bold text-slate-800">{item.nome}</span>
                      <span className={`shrink-0 text-[9px] font-black ${completed ? 'text-emerald-600' : delayed ? 'text-red-600' : 'text-slate-500'}`}>{progress}%</span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full rounded-full ${completed ? 'bg-emerald-500' : delayed ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} /></span>
                      <span className="w-14 shrink-0 text-right text-[8px] font-bold text-slate-400">{formatDate(item.data_termino || item.termino)}</span>
                    </span>
                  </span>
                </button>
              )
            })}

            {!tarefasOrdenadas.length && <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-xs font-bold text-slate-400">Nenhuma atividade cadastrada no cronograma.</p>}
          </div>
        </section>
      </section>

      <section className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {canViewModule(activeRole, 'compras') && (
          <button type="button" onClick={() => navigate('compras')} className="group flex min-h-[94px] items-center gap-3 overflow-hidden rounded-[1.15rem] border border-slate-200/80 bg-white px-3.5 py-3 text-left shadow-[0_14px_34px_-29px_rgba(15,23,42,0.68)] transition hover:border-amber-300">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100"><Package size={18} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">Materiais e compras</span>
              <span className="mt-1 block text-lg font-black leading-none text-slate-950">{materiaisCriticos.length} crítico{materiaisCriticos.length === 1 ? '' : 's'}</span>
              <span className="mt-1 block truncate text-[9px] font-semibold text-slate-500">{materiaisCriticos[0]?.item || materiaisCriticos[0]?.material || materiaisCriticos[0]?.nome || 'Suprimentos sem atraso crítico'}</span>
            </span>
            <ShoppingBag size={14} className="text-slate-300 transition group-hover:text-amber-600" />
          </button>
        )}

        {canViewModule(activeRole, 'diario') && (
          <button type="button" onClick={() => navigate('diario')} className="group relative flex min-h-[94px] items-center gap-3 overflow-hidden rounded-[1.15rem] border border-slate-200/80 bg-white px-3.5 py-3 text-left shadow-[0_14px_34px_-29px_rgba(15,23,42,0.68)] transition hover:border-blue-300">
            {diariosNovos > 0 && <span className="absolute right-3 top-2.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[7px] font-black text-white">{diariosNovos} novo{diariosNovos === 1 ? '' : 's'}</span>}
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><FileText size={18} /></span>
            <span className="min-w-0 flex-1 pr-5">
              <span className="block text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">Último diário de obra</span>
              <span className="mt-1 block text-[10px] font-black text-slate-900">{ultimoDiario?.data ? formatDate(ultimoDiario.data, { day: '2-digit', month: 'long' }) : 'Sem registro'}</span>
              <span className="mt-1 block truncate text-[9px] font-semibold text-slate-500">{ultimoDiario?.servicos_executados || ultimoDiario?.atividades || 'Nenhuma informação cadastrada'}</span>
            </span>
            <ArrowRight size={14} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
          </button>
        )}

        {canViewModule(activeRole, 'fotos') && (
          <button type="button" onClick={() => navigate('fotos')} className="group relative flex min-h-[94px] items-center gap-3 overflow-hidden rounded-[1.15rem] border border-slate-200/80 bg-white px-3.5 py-3 text-left shadow-[0_14px_34px_-29px_rgba(15,23,42,0.68)] transition hover:border-violet-300">
            {fotosNovas > 0 && <span className="absolute right-3 top-2.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[7px] font-black text-white">{fotosNovas} nova{fotosNovas === 1 ? '' : 's'}</span>}
            {ultimaFotoUrl ? <img src={ultimaFotoUrl} alt="Última foto da obra" className="h-12 w-16 shrink-0 rounded-xl object-cover ring-1 ring-slate-200" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100"><Camera size={18} /></span>}
            <span className="min-w-0 flex-1 pr-5">
              <span className="block text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">Acervo fotográfico</span>
              <span className="mt-1 block text-lg font-black leading-none text-slate-950">{fotosVisiveis.length} foto{fotosVisiveis.length === 1 ? '' : 's'}</span>
              <span className="mt-1 block truncate text-[9px] font-semibold text-slate-500">Evolução visual documentada</span>
            </span>
            <ArrowRight size={14} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
          </button>
        )}
      </section>
    </div>
  )
}
