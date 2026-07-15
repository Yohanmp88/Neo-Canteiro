'use client'

import {
  LayoutDashboard,
  HardHat,
  Calendar,
  DollarSign,
  FileText,
  User,
  Bot,
} from 'lucide-react'

export function BottomNav({ activeTab, onTabChange, userProfile }) {
  const tipoUsuario = userProfile?.tipo_usuario || userProfile?.tipo
  const isClient = tipoUsuario === 'cliente'

  const tabs = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard, visible: true },
    { id: 'cronograma', label: 'Cronograma', icon: Calendar, visible: true },
    { id: 'equipe', label: 'Equipe', icon: HardHat, visible: !isClient },
    { id: 'ia', label: 'IA da Obra', icon: Bot, visible: !isClient, destaque: true },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, visible: !isClient },
    { id: 'diario', label: 'Diário', icon: FileText, visible: !isClient },
    { id: 'usuarios', label: 'Perfil', icon: User, visible: true },
  ]

  const visibleTabs = tabs.filter((tab) => tab.visible)

  function navegar(tabId) {
    if (tabId === 'ia') {
      window.location.href = '/ia'
      return
    }

    onTabChange(tabId)
  }

  return (
    <nav className="glass fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/60 px-1 pb-safe-area-inset-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.03)] lg:hidden">
      <div className="mx-auto flex h-[68px] w-full max-w-lg items-stretch justify-around">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          if (tab.destaque) {
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => navegar(tab.id)}
                className="relative flex min-w-0 flex-1 flex-col items-center justify-center px-0.5 text-blue-600"
                aria-label="Abrir IA da Obra"
              >
                <div className="absolute -top-5 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-white bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                  <Bot size={22} strokeWidth={2.5} />
                </div>
                <span className="mt-7 max-w-full truncate text-[8px] font-black tracking-tight sm:text-[9px]">
                  IA da Obra
                </span>
              </button>
            )
          }

          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => navegar(tab.id)}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition-all duration-300 ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <div className={`rounded-xl p-1.5 transition-all duration-300 ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`max-w-full truncate text-[7px] font-bold tracking-tight sm:text-[8px] ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
              {isActive && <div className="absolute left-1/2 top-0 h-0.5 w-7 -translate-x-1/2 rounded-b-full bg-blue-600" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
