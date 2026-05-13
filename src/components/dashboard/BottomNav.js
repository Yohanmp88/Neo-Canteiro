'use client'

import { LayoutDashboard, HardHat, Calendar, DollarSign, FileText, User } from 'lucide-react'

export function BottomNav({ activeTab, onTabChange, userProfile }) {
  const isClient = userProfile?.tipo_usuario === 'cliente'

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'cronograma', label: 'Cronograma', icon: Calendar, visible: true },
    { id: 'equipe', label: 'Equipe', icon: HardHat, visible: !isClient },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, visible: !isClient },
    { id: 'diario', label: 'Diário', icon: FileText, visible: !isClient },
    { id: 'usuarios', label: 'Perfil', icon: User, visible: true },
  ]

  const visibleTabs = tabs.filter(tab => tab.visible)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-200/60 px-2 pb-safe-area-inset-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-all duration-300 relative ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                isActive ? 'bg-blue-50' : 'bg-transparent'
              }`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${
                isActive ? 'opacity-100 scale-100' : 'opacity-60 scale-95'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-b-full"></div>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
