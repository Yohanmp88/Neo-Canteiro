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
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center hover:bg-slate-800 transition shadow-xl"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* Sidebar Desktop/Mobile */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col
          transform transition-transform duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
          ${mobileOpen ? 'translate-x-0 z-50' : '-translate-x-full z-30'}
          lg:translate-x-0 lg:static
        `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
              <span className="text-white font-black text-sm">NC</span>
            </div>
            <span className="text-slate-900 font-black tracking-tight text-lg">NeoCanteiro</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="px-3 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Plataforma</p>
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
                  w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <span className={`text-lg transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                <span className={`text-sm ${isActive ? 'font-black' : 'font-semibold'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
