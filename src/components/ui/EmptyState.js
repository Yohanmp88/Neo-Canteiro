// src/components/ui/EmptyState.js
export function EmptyState({ icon = "📦", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50">
      <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-3xl mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  )
}
