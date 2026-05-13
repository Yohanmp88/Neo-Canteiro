'use client'

import { MetricCard, PanelClean, StatusBadge } from '@/components/ui/Cards'
import { EmptyState } from '@/components/ui/EmptyState'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { TrendingUp, Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

export function DashboardView({ obraAtual, tarefas = [], materiais = [], diarios = [], isClient }) {
  if (!obraAtual) {
    return <EmptyState title="Nenhuma obra selecionada" description="Selecione ou crie uma nova obra para visualizar o dashboard." icon="🏗️" />
  }

  // Cálculos baseados nos dados reais
  const concluidas = tarefas.filter(t => t.status === 'concluida' || Number(t.progresso) === 100).length
  const totalTarefas = tarefas.length || 1
  const progressoMedio = Math.round(tarefas.reduce((acc, t) => acc + (Number(t.progresso) || 0), 0) / totalTarefas)
  
  const atrasadas = tarefas.filter(t => {
    if (!t.termino) return false
    const hoje = new Date()
    const termino = new Date(t.termino)
    return termino < hoje && Number(t.progresso) < 100
  }).length

  const recebidosHoje = materiais.filter(m => m.recebido).length

  // Dados fictícios para os gráficos (baseados no contexto da obra)
  const dadosEvolucao = [
    { name: 'Sem 1', previsto: 10, realizado: 8 },
    { name: 'Sem 2', previsto: 25, realizado: 22 },
    { name: 'Sem 3', previsto: 40, realizado: 42 },
    { name: 'Sem 4', previsto: 55, realizado: 50 },
    { name: 'Sem 5', previsto: 70, realizado: 68 },
    { name: 'Sem 6', previsto: 85, realizado: 82 },
    { name: 'Sem 7', previsto: 100, realizado: 95 },
  ]

  const dadosMensais = [
    { name: 'Jan', valor: 4000 },
    { name: 'Fev', valor: 3000 },
    { name: 'Mar', valor: 2000 },
    { name: 'Abr', valor: 2780 },
    { name: 'Mai', valor: 1890 },
    { name: 'Jun', valor: 2390 },
  ]

  return (
    <div className="space-y-6">
      {/* Executive Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 lg:p-8 shadow-premium animate-fade-in">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Executivo</p>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{obraAtual.nome}</h2>
                </div>
              </div>
              <StatusBadge status={obraAtual.status} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Progresso Geral</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900">{progressoMedio}%</span>
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <TrendingUp size={12} /> +2.4%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-1000" 
                    style={{ width: `${progressoMedio}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Data de Entrega</p>
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-400" />
                  <span className="text-lg font-black text-slate-900">
                    {obraAtual.previsao_entrega ? new Date(obraAtual.previsao_entrega).toLocaleDateString('pt-BR') : '12 Jul 2026'}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Faltam 18 dias úteis</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Atrasos Críticos</p>
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className={atrasadas > 0 ? 'text-red-500' : 'text-emerald-500'} />
                  <span className={`text-2xl font-black ${atrasadas > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {atrasadas}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Atividades em alerta</p>
              </div>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-50/30 rounded-full blur-3xl -z-0"></div>
        </section>

        {/* Mini Stats Column */}
        <div className="space-y-6">
          <MetricCard 
            title="Cronograma" 
            value={`${concluidas}/${totalTarefas}`} 
            detail="Tarefas finalizadas" 
            icon={<CheckCircle2 size={24} />} 
          />
          <MetricCard 
            title="Diários" 
            value={diarios.length} 
            detail="Enviados esta semana" 
            icon={<FileText size={24} />} 
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PanelClean className="min-h-[350px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evolução da Obra</p>
              <h3 className="text-lg font-black text-slate-900">Previsto vs Realizado</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Previsto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Realizado</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrevisto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="previsto" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPrevisto)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="realizado" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRealizado)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PanelClean>

        <PanelClean className="min-h-[350px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Suprimentos</p>
              <h3 className="text-lg font-black text-slate-900">Entregas e Recebimentos</h3>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-500">
              <Clock size={16} />
            </div>
          </div>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosMensais} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {dadosMensais.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === dadosMensais.length - 1 ? '#2563eb' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Total Recebido Hoje</p>
            <span className="text-sm font-black text-slate-900">{recebidosHoje} materiais</span>
          </div>
        </PanelClean>
      </div>

      {/* Alert Section (More compact) */}
      {atrasadas > 0 && (
        <div className="bg-red-50/50 border border-red-100 rounded-3xl p-4 flex items-center gap-4 animate-fade-in shadow-sm shadow-red-100/50">
          <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm shadow-red-200/50">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-red-900 font-black text-sm">Alerta de Atraso</h4>
            <p className="text-red-600/80 text-[10px] font-bold uppercase tracking-tight mt-0.5">
              Identificamos {atrasadas} atividades críticas com prazo excedido.
            </p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-sm active:scale-95">
            Agir agora
          </button>
        </div>
      )}
    </div>
  )
}

