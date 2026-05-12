'use client'

export function PanelClean({ children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </section>
  )
}

export function MetricCard({ title, value, detail, icon, onClick }) {
  return (
    <button 
      onClick={onClick} 
      disabled={!onClick}
      className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-blue-200' : ''}`}
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-3 text-sm text-slate-400 font-medium">{detail}</p>
        </div>
        {icon && (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-xl font-black text-slate-700 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
            {icon}
          </div>
        )}
      </div>
    </button>
  )
}

export function StatusBadge({ status }) {
  const isWarning = status?.toLowerCase().includes('atenção') || status?.toLowerCase().includes('atraso')
  const color = isWarning 
    ? 'bg-amber-50 text-amber-700 ring-amber-200' 
    : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${color}`}>
      {status || 'Em andamento'}
    </span>
  )
}
