'use client'

import { useState } from 'react'

export function Sidebar({ activeTab, onTabChange }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral', icon: '📊' },
    { id: 'obras', label: 'Obras', icon: '🏗️' },
    { id: 'cronograma', label: 'Cronograma', icon: '📅' },
    { id: 'diario', label: 'Diário', icon: '📝' },
    { id: 'materiais', label: 'Materiais', icon: '📦' },
    { id: 'relatorios', label: 'Relatórios', icon: '📈' },
  ]

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-500 font-bold text-slate-950 shadow-2xl shadow-cyan-950/40 ring-1 ring-white/20 transition hover:from-cyan-200 hover:to-blue-400 lg:hidden"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-14 bottom-0 w-60 border-r border-white/10 bg-slate-950/90 p-3 shadow-[0_14px_44px_rgba(0,0,0,0.32)] backdrop-blur-2xl
          transform transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:top-0
          z-30
        `}
      >
        <nav className="space-y-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id)
                setMobileOpen(false)
              }}
              className={`
                flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 transition
                ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-300 to-blue-500 font-semibold text-slate-950 shadow-md shadow-cyan-950/25'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="text-[13px] font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
