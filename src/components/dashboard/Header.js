'use client'

import { ChevronDown, Search, Plus } from 'lucide-react'

export function Header({ obras, obraSelecionadaId, onObraChange, canCreateWork = false, onCreateWork }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-xl transition-all lg:px-8">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 shadow-sm shadow-blue-600/20">
              <span className="text-[8px] font-black text-white">NC</span>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-slate-400 lg:flex">
            <span className="text-[9px] font-black uppercase tracking-[0.18em]">Obras</span>
            <span className="text-slate-300">/</span>
          </div>

          <div className="group relative min-w-0">
            <select
              value={obraSelecionadaId || ''}
              onChange={(event) => onObraChange(event.target.value)}
              disabled={obras.length === 0}
              className="max-w-[230px] appearance-none truncate rounded-xl border border-transparent bg-transparent py-2 pl-1 pr-8 text-sm font-black text-slate-900 outline-none transition hover:border-slate-200 hover:bg-slate-50 hover:text-blue-700 disabled:opacity-50 sm:max-w-[320px]"
            >
              {obras.length === 0 ? (
                <option value="">Nenhuma obra</option>
              ) : (
                obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nome}</option>)
              )}
            </select>
            <ChevronDown size={14} strokeWidth={2.5} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition group-hover:text-blue-600" />
          </div>
        </div>

        <label className="relative mx-auto hidden min-w-0 max-w-lg flex-1 xl:block">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar materiais, tarefas e documentos"
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5"
          />
        </label>

        {canCreateWork && (
          <button
            type="button"
            onClick={onCreateWork}
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-[0_12px_28px_-18px_rgba(15,23,42,0.9)] transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nova obra</span>
          </button>
        )}
      </div>
    </header>
  )
}
