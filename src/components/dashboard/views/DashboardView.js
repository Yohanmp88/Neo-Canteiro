'use client'

import { useEffect, useMemo, useState } from 'react'
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
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  Package,
  ShoppingBag,
  Target,
  TrendingUp,
} from 'lucide-react'

const WORKSPACE_TABS = new Set(['compras', 'diario', 'fotos', 'materiais', 'equipe', 'financeiro', 'clientes'])
const SEEN_PREFIX = 'neocanteiro_module_seen_v1'

const TONES = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
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

function KpiTile({ icon: Icon, label, value, tone = 'blue', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[70px] items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 text-left shadow-[0_12px_30px_-25px_rgba(15,23,42,0.65)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_16px_34px_-24px_rgba(37,99,235,0.28)]"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${TONES[tone] || TONES.blue}`}>
        <Icon size={16} strokeWidth={2.4} />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-black leading-none tracking-tight text-slate-950">{value}</span>
        <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
      </span>
      <ArrowRight size={13} className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
    </button>
  )
}

function SectionHeader({ eyebrow, title, action, onAction }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p>
        <h3 className="mt-1 text-sm font-black tracking-tight text-slate-950">{title}</h3>
      </div>
      {action && (
        <button type="button" onClick={onAction} className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-slate-400 transition hover:text-blue-600">
          {action}<ArrowRight size={12} />
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

  const diariosNovos = useMemo(
    () => unreadCount(diariosVisiveis, user, obraAtual?.id, 'diario'),
    [diariosVisiveis, user, obraAtual?.id, seenVersion],
  )

  if (!obraAtual) {
    return <EmptyState title="Nenhuma obra selecionada" description="Selecione uma obra para visualizar o painel executivo." />
  }

  const navigate = (tabId) => {
    if (!canViewModule(activeRole, tabId)) return
    if (tabId === 'diario' || tabId === 'fotos') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(seenKey(user, obraAtual?.id, tabId), String(Date.now()))
        setSeenVersion((current) => current + 1)
      }
    }

    if (WORKSPACE_TABS.has(tabId)) {
      window.location.href = `/workspace?module=${tabId}`
      return
    }

    onNavigate(tabId)
  }

  const totalTarefas = tarefas.length
  const concluidas = tarefas.filter((item) => Number(item.progresso) === 100).length
  const emAndamento = tarefas.filter((item) => Number(item.progresso) > 0 && Number(item.progresso) < 100).length
  const atrasadas = tarefas.filter((item) => tarefaAtrasadaOperacional(item))
  const atrasosCronograma = atrasadas.length
  const materiaisCriticos = pedidos.filter((item) => pedidoAtrasadoOperacional(item))
  const progressoMedio = totalTarefas
    ? Math.round(tarefas.reduce((total, item) => total + (Number(item.progresso) || 0), 0) / totalTarefas)
    : Number(obraAtual.progresso || 0)

  const prazoFinal = obraAtual.prazo_final || obraAtual.previsao_entrega || obraAtual.previsaoEntrega
  const diasRestantes = prazoFinal
    ? Math.ceil((new Date(`${String(prazoFinal).slice(0, 10)}T23:59:59`).getTime() - Date.now()) / 86400000)
    : null
  const totalAlertas = atrasosCronograma + materiaisCriticos.length
  const ultimoDiario = diariosVisiveis[0] || null
  const ultimaFoto = fotosVisiveis[0] || null
  const ultimaFotoUrl = ultimaFoto?.url || ultimaFoto?.url_foto || ultimaFoto?.data?.url || ultimaFoto?.data?.url_foto || ''

  const proximasAtividades = useMemo(() => tarefas
    .filter((item) => Number(item.progresso) < 100)
    .sort((a, b) => {
      const dateA = new Date(a.data_termino || a.termino || '2999-12-31').getTime()
      const dateB = new Date(b.data_termino || b.termino || '2999-12-31').getTime()
      return dateA - dateB
    })
    .slice(0, 4), [tarefas])

  const dadosEvolucao = useMemo(() => {
    const ordered = [...tarefas]
      .sort((a, b) => new Date(a.data_termino || a.termino || 0) - new Date(b.data_termino || b.termino || 0))
      .slice(0, 7)

    if (!ordered.length) return [{ name: 'M1', previsto: 0, realizado: 0 }]

    return ordered.map((item, index) => {
      const sample = ordered.slice(0, index + 1)
      const realizado = Math.round(sample.reduce((sum, current) => sum + Number(current.progresso || 0), 0) / sample.length)
      return {
        name: `M${index + 1}`,
        previsto: Math.round(((index + 1) / ordered.length) * 100),
        realizado,
      }
    })
  }, [tarefas])

  const statusTone = totalAlertas > 0
    ? 'border-amber-200 bg-amber-50 text-amber-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  return (
    <div className="mx-auto w-full max-w-[1700px] animate-fade-in space-y-3.5">
      <section className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white shadow-[0_18px_45px_-38px_rgba(15,23,42,0.65)]">
        <div className="flex flex-col gap-4 px-4 py-3.5 xl:flex-row xl:items-center">
          <div className="min-w-0 xl:w-[310px]">
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-wider ${statusTone}`}>{obraAtual.status || 'Em andamento'}</span>
              <span className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{obraAtual.etapa || 'Planejamento'}</span>
            </div>
            <h1 className="mt-2 truncate text-base font-black tracking-tight text-slate-950">{obraAtual.nome}</h1>
            <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{obraAtual.cliente || obraAtual.responsavel || 'Gestão executiva da obra'}</p>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
              <span>Evolução física</span>
              <span className="text-slate-950">{progressoMedio}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, progressoMedio))}%` }} />
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:w-[430px]">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5">
              <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Entrega</p>
              <p className="mt-1 text-xs font-black text-slate-900">{formatDate(prazoFinal, { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5">
              <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Prazo</p>
              <p className="mt-1 text-xs font-black text-slate-900">{diasRestantes == null ? 'Não informado' : diasRestantes >= 0 ? `${diasRestantes} dias` : `${Math.abs(diasRestantes)} dias atrasada`}</p>
            </div>
            <div className={`col-span-2 rounded-xl border px-3 py-2.5 sm:col-span-1 ${totalAlertas > 0 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className={`text-[8px] font-black uppercase tracking-wider ${totalAlertas > 0 ? 'text-red-500' : 'text-emerald-600'}`}>Alertas</p>
              <p className={`mt-1 text-xs font-black ${totalAlertas > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{totalAlertas} {totalAlertas === 1 ? 'item' : 'itens'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3.5 xl:grid-cols-12">
        <div className="space-y-3.5 xl:col-span-4">
          <section className="rounded-[1.4rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_38px_-32px_rgba(15,23,42,0.65)]">
            <SectionHeader eyebrow="Visão executiva" title="Status geral da obra" />
            <div className="mt-4 flex items-center gap-4">
              <div
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full p-2"
                style={{ background: `conic-gradient(#2563eb ${Math.max(0, Math.min(100, progressoMedio)) * 3.6}deg, #e2e8f0 0deg)` }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white shadow-inner">
                  <span className="text-2xl font-black tracking-tight text-slate-950">{progressoMedio}%</span>
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">executado</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">{obraAtual.etapa || 'Etapa atual'}</p>
                <h2 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-950">{obraAtual.nome}</h2>
                <p className="mt-1.5 text-[10px] font-semibold leading-4 text-slate-500">{concluidas} de {totalTarefas} atividades concluídas no cronograma.</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2.5">
            <KpiTile icon={CheckCircle2} label="Concluídas" value={concluidas} tone="emerald" onClick={() => navigate('cronograma')} />
            <KpiTile icon={Clock3} label="Em andamento" value={emAndamento} tone="blue" onClick={() => navigate('cronograma')} />
            <KpiTile icon={AlertCircle} label="Atrasadas" value={atrasosCronograma} tone={atrasosCronograma ? 'red' : 'slate'} onClick={() => navigate('cronograma')} />
            <KpiTile icon={Package} label="Materiais críticos" value={materiaisCriticos.length} tone={materiaisCriticos.length ? 'amber' : 'slate'} onClick={() => navigate('compras')} />
          </div>
        </div>

        <div className="space-y-3.5 xl:col-span-5">
          <section className="rounded-[1.4rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_38px_-32px_rgba(15,23,42,0.65)]">
            <SectionHeader eyebrow="Performance física" title="Evolução planejada x realizada" action="Cronograma" onAction={() => navigate('cronograma')} />
            <div className="mt-3 flex items-center gap-4 text-[9px] font-bold text-slate-500">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" />Planejado</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Realizado</span>
            </div>
            <div className="mt-1 h-[175px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosEvolucao} margin={{ top: 10, right: 6, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '10px', boxShadow: '0 16px 35px -24px rgba(15,23,42,.45)' }} />
                    <Area type="monotone" dataKey="previsto" name="Planejado" stroke="#2563eb" strokeWidth={2.5} fill="url(#plannedFill)" />
                    <Area type="monotone" dataKey="realizado" name="Realizado" stroke="#10b981" strokeWidth={2.5} fill="url(#realFill)" />
                    <defs>
                      <linearGradient id="plannedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.16}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                      <linearGradient id="realFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.14}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="rounded-[1.4rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_38px_-32px_rgba(15,23,42,0.65)]">
            <SectionHeader eyebrow="Planejamento imediato" title="Próximas atividades" action="Ver todas" onAction={() => navigate('cronograma')} />
            <div className="mt-3 divide-y divide-slate-100">
              {proximasAtividades.map((item) => {
                const progress = Math.max(0, Math.min(100, Number(item.progresso || 0)))
                const delayed = tarefaAtrasadaOperacional(item)
                return (
                  <button key={item.id} type="button" onClick={() => navigate('cronograma')} className="group flex w-full items-center gap-3 py-2.5 text-left">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${delayed ? 'bg-red-500' : progress > 0 ? 'bg-blue-600' : 'bg-slate-300'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-bold text-slate-800">{item.nome}</span>
                      <span className="mt-0.5 block text-[8px] font-black uppercase tracking-wider text-slate-400">{delayed ? 'Atrasada' : progress > 0 ? 'Em execução' : 'Programada'}</span>
                    </span>
                    <span className="shrink-0 text-[9px] font-bold text-slate-400">{formatDate(item.data_termino || item.termino)}</span>
                    <span className="w-12 shrink-0">
                      <span className="block h-1.5 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full rounded-full ${delayed ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} /></span>
                    </span>
                  </button>
                )
              })}
              {!proximasAtividades.length && <p className="py-7 text-center text-xs font-bold text-slate-400">Nenhuma atividade pendente.</p>}
            </div>
          </section>
        </div>

        <div className="space-y-3.5 xl:col-span-3">
          {canViewModule(activeRole, 'diario') && (
            <section className="rounded-[1.4rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_38px_-32px_rgba(15,23,42,0.65)]">
              <SectionHeader eyebrow="Último diário" title={ultimoDiario?.data ? formatDate(ultimoDiario.data, { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sem registro'} action="Abrir" onAction={() => navigate('diario')} />
              <div className="mt-3 flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100"><FileText size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-4 text-[11px] font-semibold leading-5 text-slate-700">{ultimoDiario?.servicos_executados || ultimoDiario?.atividades || 'Nenhuma informação registrada no diário.'}</p>
                  {ultimoDiario?.equipe_total !== undefined && ultimoDiario?.equipe_total !== '' && <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Equipe: {ultimoDiario.equipe_total} trabalhador(es)</p>}
                </div>
              </div>
              {diariosNovos > 0 && <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-red-600">{diariosNovos} novo{diariosNovos === 1 ? '' : 's'} registro{diariosNovos === 1 ? '' : 's'}</div>}
            </section>
          )}

          {canViewModule(activeRole, 'compras') && (
            <section className="rounded-[1.4rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_38px_-32px_rgba(15,23,42,0.65)]">
              <SectionHeader eyebrow="Suprimentos" title="Materiais críticos" action="Compras" onAction={() => navigate('compras')} />
              <div className="mt-3 divide-y divide-slate-100">
                {(materiaisCriticos.length ? materiaisCriticos : pedidos.filter((item) => String(item.status || '').toLowerCase() !== 'recebido')).slice(0, 4).map((item) => (
                  <button key={item.id} type="button" onClick={() => navigate('compras')} className="flex w-full items-center gap-3 py-2.5 text-left">
                    <ShoppingBag size={14} className="shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-slate-700">{item.item || item.material || item.nome}</span>
                    <span className={`shrink-0 text-[8px] font-black uppercase tracking-wider ${pedidoAtrasadoOperacional(item) ? 'text-red-600' : 'text-blue-600'}`}>{pedidoAtrasadoOperacional(item) ? 'Crítico' : item.status || 'Pendente'}</span>
                  </button>
                ))}
                {!pedidos.length && <p className="py-7 text-center text-xs font-bold text-slate-400">Nenhum material cadastrado.</p>}
              </div>
            </section>
          )}

          {canViewModule(activeRole, 'fotos') && (
            <button type="button" onClick={() => navigate('fotos')} className="group flex w-full items-center gap-3 overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white p-3.5 text-left shadow-[0_16px_38px_-32px_rgba(15,23,42,0.65)] transition hover:-translate-y-0.5 hover:border-violet-300">
              {ultimaFotoUrl ? <img src={ultimaFotoUrl} alt="Última foto da obra" className="h-14 w-20 shrink-0 rounded-xl object-cover ring-1 ring-slate-200" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100"><Camera size={18} /></span>}
              <span className="min-w-0 flex-1">
                <span className="block text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">Acervo fotográfico</span>
                <span className="mt-1 block text-sm font-black text-slate-950">{fotosVisiveis.length} foto{fotosVisiveis.length === 1 ? '' : 's'}</span>
                <span className="mt-0.5 block text-[9px] font-semibold text-slate-500">Evolução visual da obra</span>
              </span>
              <ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
            </button>
          )}
        </div>
      </section>

      <section className={`overflow-hidden rounded-[1.4rem] border bg-white shadow-[0_16px_38px_-32px_rgba(15,23,42,0.65)] ${totalAlertas ? 'border-red-200' : 'border-emerald-200'}`}>
        <div className={`flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${totalAlertas ? 'border-red-100 bg-red-50/70' : 'border-emerald-100 bg-emerald-50/70'}`}>
          <div className="flex items-center gap-2.5">
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${totalAlertas ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}><Gauge size={16} /></span>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${totalAlertas ? 'text-red-600' : 'text-emerald-600'}`}>Inteligência operacional</p>
              <h3 className="mt-0.5 text-xs font-black text-slate-950">{totalAlertas ? 'Itens que podem impactar o cronograma' : 'Nenhum risco crítico identificado'}</h3>
            </div>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-wider ${totalAlertas ? 'text-red-600' : 'text-emerald-600'}`}>{totalAlertas} {totalAlertas === 1 ? 'alerta' : 'alertas'}</span>
        </div>

        {totalAlertas > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50/80">
                <tr>{['Origem', 'Item crítico', 'Prazo / situação', 'Impacto', 'Ação'].map((header) => <th key={header} className="whitespace-nowrap border-b border-slate-100 px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">{header}</th>)}</tr>
              </thead>
              <tbody>
                {atrasadas.slice(0, 3).map((item) => (
                  <tr key={`task-${item.id}`} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-[9px] font-black uppercase text-blue-600">Cronograma</td>
                    <td className="min-w-64 px-4 py-3 text-[11px] font-bold text-slate-800">{item.nome}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[10px] font-semibold text-red-600">{formatDate(item.data_termino || item.termino)}</td>
                    <td className="px-4 py-3 text-[10px] font-semibold text-slate-500">Atividade atrasada</td>
                    <td className="px-4 py-3"><button onClick={() => navigate('cronograma')} className="text-[9px] font-black uppercase tracking-wider text-blue-600">Revisar</button></td>
                  </tr>
                ))}
                {materiaisCriticos.slice(0, 3).map((item) => (
                  <tr key={`material-${item.id}`} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-[9px] font-black uppercase text-amber-600">Compras</td>
                    <td className="min-w-64 px-4 py-3 text-[11px] font-bold text-slate-800">{item.item || item.material || item.nome}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[10px] font-semibold text-red-600">{item.status || 'Atrasado'}</td>
                    <td className="px-4 py-3 text-[10px] font-semibold text-slate-500">Pode afetar a execução</td>
                    <td className="px-4 py-3"><button onClick={() => navigate('compras')} className="text-[9px] font-black uppercase tracking-wider text-blue-600">Abrir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-4 text-[11px] font-semibold text-slate-600">
            <CheckCircle2 size={17} className="text-emerald-600" /> Cronograma e suprimentos sem alertas críticos no momento.
          </div>
        )}
      </section>
    </div>
  )
}
