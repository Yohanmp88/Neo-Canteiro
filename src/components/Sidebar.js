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
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-yellow-400 text-zinc-950 font-bold flex items-center justify-center hover:bg-yellow-300 transition shadow-lg"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-16 bottom-0 w-64 bg-zinc-900 border-r border-zinc-800 p-4
          transform transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:top-0
          z-30
        `}
      >
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id)
                setMobileOpen(false)
              }}
              className={`
                w-full px-4 py-3 rounded-lg flex items-center gap-3 transition
                ${
                  activeTab === tab.id
                    ? 'bg-yellow-400 text-zinc-950 font-bold'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
