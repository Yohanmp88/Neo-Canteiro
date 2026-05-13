'use client'

import { Bell, ChevronDown, Search, Plus } from 'lucide-react'

export function Header({ userProfile, obras, obraSelecionadaId, onObraChange }) {
  const obraAtual = obras.find(o => o.id === Number(obraSelecionadaId))

  return (
    <header className="h-20 lg:h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20 transition-all flex items-center px-4 lg:px-8">
      <div className="w-full max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Mobile Title / Desktop Breadcrumb */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-[8px]">NC</span>
            </div>
            <span className="text-slate-900 font-bold tracking-tight text-sm">NeoCanteiro</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Obras</span>
            <span className="opacity-40">/</span>
          </div>

          <div className="relative group">
            <select
              value={obraSelecionadaId || ''}
              onChange={(e) => onObraChange(e.target.value)}
              disabled={obras.length === 0}
              className="appearance-none bg-transparent text-slate-900 text-sm font-black rounded-lg focus:outline-none cursor-pointer disabled:opacity-50 transition-all pr-8 hover:text-blue-600"
            >
              {obras.length === 0 ? (
                <option value="">Nenhuma obra</option>
              ) : (
                obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.nome}
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 group-hover:text-blue-600 transition-colors">
              <ChevronDown size={14} strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Center: Search (Desktop only) */}
        <div className="hidden xl:flex items-center flex-1 max-w-md mx-auto relative group">
          <Search size={16} className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar documentos, materiais, tarefas..." 
            className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl py-2 pl-12 pr-4 text-xs font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          <button className="hidden sm:flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-slate-200/60 text-slate-500 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all shadow-sm active:scale-95">
            <Plus size={18} />
          </button>
          
          <button className="relative h-10 w-10 flex items-center justify-center rounded-2xl bg-white border border-slate-200/60 text-slate-500 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all shadow-sm active:scale-95">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="h-8 w-px bg-slate-200/60 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-3 pl-1 group cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-black shadow-sm group-hover:border-blue-200 transition-all">
                {userProfile?.iniciais || 'NC'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
