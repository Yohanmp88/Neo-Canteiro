'use client'

import { useState, useEffect } from 'react'
import { PanelClean, StatusBadge } from '@/components/ui/Cards'
import { EmptyState } from '@/components/ui/EmptyState'

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
  BarChart3
} from 'lucide-react'

export function DashboardView({
  obraAtual,
  tarefas = [],
  materiais = [],
  diarios = [],
  onNavigate
}) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!obraAtual) {
    return (
      <EmptyState
        title="Nenhuma obra selecionada"
        description="Selecione uma obra para visualizar o dashboard executivo."
      />
    )
  }

  // --- LÓGICA DE INDICADORES ---
  const concluidas = tarefas.filter(t => Number(t.progresso) === 100).length
  const totalTarefas = tarefas.length || 0
  const progressoMedio = totalTarefas > 0 
    ? Math.round(tarefas.reduce((acc, t) => acc + (Number(t.progresso) || 0), 0) / totalTarefas) 
    : 0

  const atrasosCronograma = tarefas.filter(t => {
    if (!t.termino && !t.data_termino) return false
    const hoje = new Date()
    const termino = new Date(t.termino || t.data_termino)
    return termino < hoje && Number(t.progresso) < 100
  }).length

  const materiaisAtrasados = materiais.filter(m => !m.recebido && m.data_prevista && new Date(m.data_prevista) < new Date()).length
  const ultimoDiario = diarios?.[0] || null

  const dadosEvolucao = [
    { name: 'S1', previsto: 10, realizado: 8 },
    { name: 'S2', previsto: 25, realizado: 22 },
    { name: 'S3', previsto: 40, realizado: 42 },
    { name: 'S4', previsto: 55, realizado: 50 },
    { name: 'S5', previsto: 70, realizado: 68 },
    { name: 'S6', previsto: 85, realizado: 82 },
    { name: 'S7', previsto: 100, realizado: 95 },
  ]

  const MiniCard = ({ title, value, detail, icon: Icon, color = "blue", onClick }) => (
    <button 
      onClick={onClick}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/60 bg-white p-2.5 text-left transition-all hover:border-blue-400 hover:shadow-sm active:scale-95"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`rounded bg-${color}-50 p-1 text-${color}-600`}>
          <Icon size={12} />
        </div>
        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 truncate">{title}</p>
      </div>
      <div>
        <h4 className="text-base font-black text-slate-900 leading-none">{value}</h4>
        {detail && <p className="text-[7px] font-bold text-slate-500 truncate mt-0.5">{detail}</p>}
      </div>
    </button>
  )

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto animate-fade-in px-2">
      {/* HEADER COMPACTO DE MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <MiniCard title="Progresso" value={`${progressoMedio}%`} detail="Evolução Geral" icon={TrendingUp} onClick={() => onNavigate('cronograma')} />
        <MiniCard title="Entrega" value={obraAtual.prazo_final ? new Date(obraAtual.prazo_final).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '---'} detail="Prazo Final" icon={Calendar} color="indigo" onClick={() => onNavigate('cronograma')} />
        <MiniCard title="Concluídas" value={`${concluidas}/${totalTarefas}`} detail="Tarefas Totais" icon={CheckCircle2} color="emerald" onClick={() => onNavigate('cronograma')} />
        <MiniCard title="Atrasos" value={atrasosCronograma} detail="Críticos" icon={AlertCircle} color={atrasosCronograma > 0 ? "red" : "emerald"} onClick={() => onNavigate('cronograma')} />
        <MiniCard title="Suprimentos" value={materiaisAtrasados} detail="Em atraso" icon={ShoppingBag} color={materiaisAtrasados > 0 ? "orange" : "slate"} onClick={() => onNavigate('compras')} />
        <MiniCard title="Registros" value={diarios.length} detail="Diários enviados" icon={FileText} color="blue" onClick={() => onNavigate('diario')} />
        <MiniCard title="Fotos" value="Galeria" detail="Registros" icon={Camera} color="purple" onClick={() => onNavigate('fotos')} />
        <button className="flex items-center justify-center p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors" onClick={() => onNavigate('cronograma')}>
          <Layers size={14} className="mr-1.5" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Timeline</span>
        </button>
      </div>

      {/* ÁREA CENTRAL - MÁXIMA DENSIDADE HORIZONTAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Curva S - Desempenho (5/12) */}
        <PanelClean className="lg:col-span-5 !p-3 min-h-[220px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Análise de Performance</p>
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
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
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', fontSize: '9px', padding: '4px'}} />
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

        {/* Cronograma Físico - Live View (4/12) */}
        <PanelClean className="lg:col-span-4 !p-3 min-h-[220px] cursor-pointer hover:border-blue-300 transition-colors" onClick={() => onNavigate('cronograma')}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Acompanhamento</p>
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <BarChart3 size={12} className="text-indigo-600" />
                Cronograma Físico
              </h3>
            </div>
            <div className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">LIVE</div>
          </div>
          
          <div className="space-y-2.5">
            {tarefas.slice(0, 4).map((t, idx) => (
              <div key={t.id || idx} className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-slate-700 truncate max-w-[120px]">{t.nome}</span>
                  <span className="text-slate-400">{t.progresso}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${Number(t.progresso) === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                    style={{ width: `${t.progresso}%` }}
                  />
                </div>
              </div>
            ))}
            {tarefas.length > 4 && (
              <p className="text-[8px] font-bold text-slate-400 text-center mt-1 uppercase tracking-tighter">
                + {tarefas.length - 4} atividades ativas
              </p>
            )}
          </div>
        </PanelClean>

        {/* Última Ocorrência + Fotos (3/12) - MOVIDOS PARA O MEIO */}
        <div className="lg:col-span-3 space-y-3">
          {/* Relato Diário */}
          <button 
            onClick={() => onNavigate('diario')}
            className="w-full group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-3 text-left transition-all hover:border-blue-400 hover:shadow-sm h-[105px]"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-slate-900 p-1.5 text-white">
                <FileText size={14} />
              </div>
              <ArrowRight size={12} className="text-slate-300 group-hover:text-blue-500" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Última Ocorrência</p>
              <h4 className="text-[10px] font-bold text-slate-900 line-clamp-2 leading-tight">
                {ultimoDiario?.servicos_executados || "Sem relatos registrados."}
              </h4>
            </div>
          </button>

          {/* Fotos Canteiro */}
          <button 
            onClick={() => onNavigate('fotos')}
            className="w-full group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-3 text-left transition-all hover:border-blue-400 hover:shadow-sm h-[105px]"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-purple-50 p-1.5 text-purple-600">
                <Camera size={14} />
              </div>
              <div className="flex -space-x-1.5">
                {[1,2,3].map(i => <div key={i} className="w-4 h-4 rounded-full border border-white bg-slate-100" />)}
              </div>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Fotos da Obra</p>
              <h4 className="text-[10px] font-bold text-slate-900 leading-tight">Canteiro e Registros</h4>
            </div>
          </button>
        </div>

      </div>
    </div>
  )
}