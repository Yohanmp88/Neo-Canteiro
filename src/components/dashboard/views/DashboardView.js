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
} from 'recharts'

import {
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react'

export function DashboardView({
  obraAtual,
  tarefas = [],
  materiais = [],
  diarios = [],
  isClient,
}) {
  if (!obraAtual) {
    return (
      <EmptyState
        title="Nenhuma obra selecionada"
        description="Selecione ou crie uma nova obra para visualizar o dashboard."
        icon="🏗️"
      />
    )
  }

  const concluidas = tarefas.filter(
    (t) => t.status === 'concluida' || Number(t.progresso) === 100
  ).length

  const totalTarefas = tarefas.length || 1

  const progressoMedio = Math.round(
    tarefas.reduce((acc, t) => acc + (Number(t.progresso) || 0), 0) /
    totalTarefas
  )

  const atrasadas = tarefas.filter((t) => {
    if (!t.termino) return false

    const hoje = new Date()
    const termino = new Date(t.termino)

    return termino < hoje && Number(t.progresso) < 100
  }).length

  const recebidosHoje = materiais.filter((m) => m.recebido).length

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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm lg:col-span-2 lg:p-8">
          <div className="relative z-10">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <TrendingUp size={20} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status Executivo
                  </p>

                  <h2 className="text-xl font-black tracking-tight text-slate-900">
                    {obraAtual.nome}
                  </h2>
                </div>
              </div>

              <StatusBadge status={obraAtual.status} />
            </div>

            <div className="grid grid-cols-1 gap-8 py-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
                  Progresso Geral
                </p>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900">
                    {progressoMedio}%
                  </span>

                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                    <TrendingUp size={12} />
                    +2.4%
                  </span>
                </div>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-blue-600 transition-all duration-1000"
                    style={{ width: `${progressoMedio}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
                  Prazo Final
                </p>

                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-400" />

                  <span className="text-lg font-black text-slate-900">
                    {obraAtual.prazo_final ? new Date(obraAtual.prazo_final).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                  </span>
                </div>

                <p className="text-[10px] font-bold uppercase text-slate-500">
                  {obraAtual.prazo || 'Prazo a definir'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
                  Atrasos Críticos
                </p>

                <div className="flex items-center gap-2">
                  <AlertCircle
                    size={18}
                    className={
                      atrasadas > 0
                        ? 'text-red-500'
                        : 'text-emerald-500'
                    }
                  />

                  <span
                    className={`text-2xl font-black ${atrasadas > 0
                      ? 'text-red-600'
                      : 'text-emerald-600'
                      }`}
                  >
                    {atrasadas}
                  </span>
                </div>

                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Atividades em alerta
                </p>
              </div>
            </div>
          </div>
        </section>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PanelClean className="min-h-[350px]">
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Evolução da Obra
            </p>

            <h3 className="text-lg font-black text-slate-900">
              Previsto vs Realizado
            </h3>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosEvolucao}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="previsto"
                  stroke="#2563eb"
                  fill="#2563eb22"
                />

                <Area
                  type="monotone"
                  dataKey="realizado"
                  stroke="#10b981"
                  fill="#10b98122"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PanelClean>

        <PanelClean className="min-h-[350px]">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Suprimentos
              </p>

              <h3 className="text-lg font-black text-slate-900">
                Entregas e Recebimentos
              </h3>
            </div>

            <div className="rounded-xl bg-slate-50 p-2 text-slate-500">
              <Clock size={16} />
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosMensais}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {dadosMensais.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        index === dadosMensais.length - 1
                          ? '#2563eb'
                          : '#cbd5e1'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500">
              Total Recebido Hoje
            </p>

            <span className="text-sm font-black text-slate-900">
              {recebidosHoje} materiais
            </span>
          </div>
        </PanelClean>
      </div>
    </div>
  )
}