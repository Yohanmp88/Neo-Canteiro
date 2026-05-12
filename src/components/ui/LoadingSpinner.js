// src/components/ui/LoadingSpinner.js
export function LoadingSpinner({ message = "Carregando..." }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm font-bold text-slate-500 animate-pulse">{message}</p>
    </div>
  )
}
