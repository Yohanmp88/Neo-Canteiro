'use client'

export function PanelClean({ children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm shadow-slate-200/50 ${className}`}>
      {children}
    </section>
  )
}

export function MetricCard({ title, value, detail, icon, onClick }) {
  return (
    <button 
      onClick={onClick} 
      disabled={!onClick}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 text-left shadow-sm shadow-slate-200/50 transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-blue-200/60' : ''}`}
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
          {detail && <p className="mt-2 text-xs text-slate-500 font-medium">{detail}</p>}
        </div>
        {icon && (
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-lg font-bold text-slate-600 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
            {icon}
          </div>
        )}
      </div>
    </button>
  )
}

export function StatusBadge({ status }) {
  const statusLower = status?.toLowerCase() || ''
  const isWarning = statusLower.includes('atenção') || statusLower.includes('atraso') || statusLower.includes('alerta')
  const isNeutral = statusLower.includes('nova') || statusLower.includes('planejamento')
  
  const color = isWarning 
    ? 'bg-amber-50 text-amber-700 ring-amber-100' 
    : isNeutral
    ? 'bg-slate-100 text-slate-700 ring-slate-200'
    : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ring-1 ${color}`}>
      {status || 'Em andamento'}
    </span>
  )
}

