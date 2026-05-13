'use client'

import { useState } from 'react'
import { 
  LayoutDashboard, 
  Calendar, 
  Camera, 
  HardHat, 
  FileText, 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Ruler, 
  ClipboardList, 
  Layers, 
  TrendingUp, 
  FileCode, 
  Bot, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react'

export function Sidebar({ activeTab, onTabChange, userProfile, logout }) {
  // Ocultar tabs baseado no tipo de usuário
  const isClient = userProfile?.tipo_usuario === 'cliente'

  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'cronograma', label: 'Cronograma', icon: Calendar, visible: true },
    { id: 'fotos', label: 'Fotos', icon: Camera, visible: true },
    { id: 'equipe', label: 'Equipe', icon: HardHat, visible: !isClient },
    { id: 'diario', label: 'Diário de Obra', icon: FileText, visible: !isClient },
    { id: 'materiais', label: 'Materiais', icon: Package, visible: !isClient },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, visible: !isClient },
    { id: 'compras', label: 'Gestão de Compras', icon: ShoppingCart, visible: !isClient },
    { id: 'orcamento', label: 'Orçamento', icon: ClipboardList, visible: !isClient },
    { id: 'composicoes', label: 'Composições', icon: Layers, visible: !isClient },
    { id: 'abc', label: 'Curva ABC', icon: TrendingUp, visible: !isClient },
    { id: 'medicoes', label: 'Medições', icon: Ruler, visible: true },
    { id: 'templates', label: 'Templates', icon: FileCode, visible: true },
    { id: 'ia', label: 'IA da Obra', icon: Bot, visible: !isClient },
    { id: 'usuarios', label: 'Usuários', icon: Settings, visible: !isClient },
  ]

  const visibleTabs = allTabs.filter(tab => tab.visible)

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200/60 flex-col z-30 transition-all duration-300">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 mb-2">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300">
            <span className="text-white font-black text-xs">NC</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-900 font-black tracking-tight text-base leading-none">NeoCanteiro</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestão inteligente de obras com IA</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 custom-scrollbar pb-10">
        <div className="px-3 py-3 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Plataforma</p>
        </div>
        
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <div className={`p-1 rounded-lg transition-colors duration-200 ${isActive ? 'bg-white shadow-sm' : 'group-hover:bg-white group-hover:shadow-sm'}`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-sm tracking-tight ${isActive ? 'font-bold' : 'font-medium opacity-80 group-hover:opacity-100'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute right-2 text-blue-400">
                  <ChevronRight size={14} strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-900 shadow-sm">
              {userProfile?.iniciais || 'NC'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">{userProfile?.nome}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
                {userProfile?.tipo_usuario || 'Membro'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all duration-200 shadow-sm active:scale-95"
          >
            <LogOut size={14} />
            <span>Sair da Plataforma</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

