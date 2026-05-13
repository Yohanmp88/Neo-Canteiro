'use client'

import { MetricCard, PanelClean, StatusBadge } from '@/components/ui/Cards'
import { EmptyState } from '@/components/ui/EmptyState'

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

  const recebidosHoje = materiais.filter(m => m.recebido).length // simplificado

  return (
    <div className="space-y-8">
      {/* Header Executive Section */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm shadow-slate-200/50">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 ring-1 ring-slate-200">
              Controle Executivo
            </span>
            <StatusBadge status={obraAtual.status} />
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 mb-3">
                {obraAtual.nome}
              </h1>
              <p className="text-slate-500 max-w-2xl text-sm font-medium">
                {obraAtual.cliente} · {obraAtual.endereco}. Etapa: <span className="text-slate-900 font-bold">{obraAtual.etapa || 'Em execução'}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-10 px-4 rounded-xl border border-slate-200 flex items-center gap-2 bg-slate-50/50">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-600 tracking-tight">Obra Ativa</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Progresso Físico</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-slate-900">{progressoMedio}%</p>
                <div className="flex-1 h-1.5 mb-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progressoMedio}%` }}></div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Previsão de Entrega</p>
              <p className="text-xl font-bold text-slate-900">
                {obraAtual.previsao_entrega ? new Date(obraAtual.previsao_entrega).toLocaleDateString('pt-BR') : 'A definir'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Responsável Técnico</p>
              <p className="text-lg font-bold text-slate-900 truncate">{obraAtual.responsavel || 'A definir'}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50/50 border border-red-100/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">Atrasos Críticos</p>
              <p className="text-2xl font-black text-red-600">{atrasadas}</p>
            </div>
          </div>
        </div>
        
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-0"></div>
      </section>

      {/* Primary Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Cronograma" 
          value={`${concluidas}/${totalTarefas}`} 
          detail="atividades concluídas" 
          icon="📅" 
        />
        <MetricCard 
          title="Relatórios Diários" 
          value={diarios.length} 
          detail="diários enviados" 
          icon="📝" 
        />
        <MetricCard 
          title="Suprimentos" 
          value={recebidosHoje} 
          detail="materiais recebidos" 
          icon="📦" 
        />
      </section>

      {/* Attention Section */}
      {atrasadas > 0 && (
        <PanelClean className="border-red-100 bg-red-50/30">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-xl shadow-sm shadow-red-200/50">⚠️</div>
            <div>
              <h3 className="text-red-900 font-bold text-base">Alerta de Atraso Detectado</h3>
              <p className="text-red-600/80 text-xs font-medium mt-1 leading-relaxed max-w-xl">
                Identificamos {atrasadas} atividades com prazo expirado. Recomendamos a revisão imediata do cronograma para mitigar riscos de entrega.
              </p>
            </div>
            <div className="ml-auto hidden sm:block">
              <button className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-premium shadow-sm active:scale-95">
                Ver Detalhes
              </button>
            </div>
          </div>
        </PanelClean>
      )}
    </div>
  )
}

