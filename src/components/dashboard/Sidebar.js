'use client'

import { useState } from 'react'

export function Sidebar({ activeTab, onTabChange, userProfile }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Ocultar tabs baseado no tipo de usuário
  const isClient = userProfile?.tipo_usuario === 'cliente'

  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', visible: true },
    { id: 'cronograma', label: 'Cronograma', icon: '📅', visible: true },
    { id: 'fotos', label: 'Fotos', icon: '📷', visible: true },
    { id: 'equipe', label: 'Equipe', icon: '👷', visible: !isClient },
    { id: 'diario', label: 'Diário de Obra', icon: '📝', visible: !isClient },
    { id: 'materiais', label: 'Materiais', icon: '📦', visible: !isClient },
    { id: 'financeiro', label: 'Financeiro', icon: '💰', visible: !isClient },
    { id: 'compras', label: 'Gestão de Compras', icon: '🛒', visible: !isClient },
    { id: 'medicoes', label: 'Medições', icon: '📏', visible: true },
  ]

  const visibleTabs = allTabs.filter(tab => tab.visible)

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
      >
        <span className="text-xl">{mobileOpen ? '✕' : '☰'}</span>
      </button>

      {/* Sidebar Desktop/Mobile */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200/60 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0 z-50' : '-translate-x-full z-30'}
          lg:translate-x-0 lg:static
        `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-[10px]">NC</span>
            </div>
            <span className="text-slate-900 font-bold tracking-tight text-base">NeoCanteiro</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-0.5">
          <p className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Plataforma</p>
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id)
                  setMobileOpen(false)
                }}
                className={`
                  w-full px-3 py-2 rounded-xl flex items-center gap-3 transition-premium
                  ${isActive 
                    ? 'bg-blue-50/50 text-blue-700' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <span className={`text-base transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
                  {tab.icon}
                </span>
                <span className={`text-sm tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* User Info (Optional addition for premium feel) */}
        {userProfile && (
          <div className="p-4 border-t border-slate-100 mt-auto">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                {userProfile.nome?.substring(0, 2).toUpperCase() || 'NC'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{userProfile.nome}</p>
                <p className="text-[10px] text-slate-500 truncate capitalize">{userProfile.tipo_usuario || userProfile.tipo}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}

