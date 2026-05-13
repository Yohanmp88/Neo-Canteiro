'use client'

export function PanelClean({ children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-slate-200/60 bg-white p-6 lg:p-8 shadow-premium transition-premium hover:shadow-premium-lg animate-fade-in ${className}`}>
      {children}
    </section>
  )
}

export function MetricCard({ title, value, detail, icon, onClick }) {
  return (
    <button 
      onClick={onClick} 
      disabled={!onClick}
      className={`group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 text-left shadow-premium transition-all duration-300 animate-fade-in ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-premium-lg hover:border-blue-200/60 active:scale-[0.98]' : ''}`}
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">{title}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">{value}</p>
          </div>
          {detail && <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">{detail}</p>}
        </div>
        {icon && (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-xl font-bold text-slate-600 border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:rotate-6 transition-all duration-300">
            {icon}
          </div>
        )}
      </div>
      
      {/* Subtle Background Glow on Hover */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </button>
  )
}

export function StatusBadge({ status }) {
  const statusLower = status?.toLowerCase() || ''
  const isWarning = statusLower.includes('atenção') || statusLower.includes('atraso') || statusLower.includes('alerta')
  const isNeutral = statusLower.includes('nova') || statusLower.includes('planejamento')
  
  const color = isWarning 
    ? 'bg-amber-50 text-amber-700 ring-amber-200/60' 
    : isNeutral
    ? 'bg-slate-100 text-slate-700 ring-slate-200/60'
    : 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
    
  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1 shadow-sm ${color}`}>
      {status || 'Em andamento'}
    </span>
  )
}

export function InfoCard({ titulo, valor, detalhe, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4 lg:p-5 transition-premium hover:bg-white hover:shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        {Icon && (
          <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400">
            <Icon size={14} />
          </div>
        )}
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{titulo}</p>
      </div>
      <p className="text-lg font-black text-slate-900 tracking-tight">{valor}</p>
      {detalhe && <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{detalhe}</p>}
    </div>
  )
}

export function MiniTimeline({ tarefas }) {
  if (!tarefas || tarefas.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sem dados de cronograma</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progresso Recente</p>
      </div>
      <div className="space-y-5">
        {tarefas.slice(0, 4).map((item) => (
          <div key={item.id} className="group">
            <div className="mb-2 flex justify-between text-[11px] font-black text-slate-900">
              <span className="group-hover:text-blue-600 transition-colors">{item.nome}</span>
              <span className="text-slate-400">{item.progresso}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div 
                className="h-full rounded-full bg-blue-600 transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.3)]" 
                style={{ width: `${item.progresso}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProgressRing({ value }) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  
  return (
    <div className="relative grid h-32 w-32 place-items-center drop-shadow-sm">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} stroke="#f1f5f9" strokeWidth="8" fill="none" />
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          stroke="#2563eb" 
          strokeWidth="8" 
          fill="none" 
          strokeLinecap="round" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute text-center"> 
        <p className="text-2xl font-black text-slate-900">{value}<span className="text-xs text-slate-400 font-bold">%</span></p> 
      </div>
    </div>
  )
}
