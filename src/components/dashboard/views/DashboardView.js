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
    <div className="space-y-6">
      {/* Banner Principal */}
      <section className="overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-slate-300">
              Controle Executivo
            </span>
            <StatusBadge status={obraAtual.status} />
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
            {obraAtual.nome}
          </h1>
          
          <p className="text-slate-400 max-w-2xl text-lg mb-8">
            {obraAtual.cliente} · {obraAtual.endereco}. Etapa atual: <strong className="text-white">{obraAtual.etapa || 'Em execução'}</strong>.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-slate-400 text-sm font-bold mb-1">Progresso Físico</p>
              <p className="text-2xl font-black text-white">{progressoMedio}%</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-slate-400 text-sm font-bold mb-1">Previsão</p>
              <p className="text-2xl font-black text-white">
                {obraAtual.previsao_entrega ? new Date(obraAtual.previsao_entrega).toLocaleDateString('pt-BR') : 'A definir'}
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-slate-400 text-sm font-bold mb-1">Responsável</p>
              <p className="text-xl font-black text-white truncate">{obraAtual.responsavel || 'A definir'}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-red-500/30">
              <p className="text-red-300 text-sm font-bold mb-1">Atrasos</p>
              <p className="text-2xl font-black text-red-400">{atrasadas}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Métricas Secundárias */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard 
          title="Atividades Concluídas" 
          value={`${concluidas}/${tarefas.length}`} 
          detail="tarefas entregues" 
          icon="✅" 
        />
        <MetricCard 
          title="Diários de Obra" 
          value={diarios.length} 
          detail="registros no sistema" 
          icon="📝" 
        />
        <MetricCard 
          title="Materiais Recebidos" 
          value={recebidosHoje} 
          detail="total de entregas" 
          icon="📦" 
        />
      </section>

      {/* Área de Alertas */}
      {atrasadas > 0 && (
        <PanelClean className="border-red-200 bg-red-50/50">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🔴</div>
            <div>
              <h3 className="text-red-800 font-black text-lg">Atenção: Há {atrasadas} atividades em atraso</h3>
              <p className="text-red-600 text-sm mt-1">Verifique o cronograma para realocar esforços e evitar impactos no prazo final.</p>
            </div>
          </div>
        </PanelClean>
      )}
    </div>
  )
}
