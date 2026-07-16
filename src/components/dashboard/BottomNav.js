'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  Calendar,
  Bot,
  Menu,
  X,
  Handshake,
  UsersRound,
  FileText,
  Camera,
  HardHat,
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  ClipboardList,
  Layers,
  TrendingUp,
  Ruler,
  FolderKanban,
  FileCode,
  Settings,
} from 'lucide-react'

const WORKSPACE_TABS = new Set([
  'crm',
  'clientes',
  'materiais',
  'compras',
  'fornecedores',
  'financeiro',
  'orcamento',
  'composicoes',
  'abc',
  'medicoes',
  'documentos',
  'templates',
  'usuarios',
])

const ALL_MODULES = [
  { id: 'crm', label: 'CRM Comercial', icon: Handshake, visible: true },
  { id: 'clientes', label: 'Clientes', icon: UsersRound, visible: true },
  { id: 'diario', label: 'Diário de Obra', icon: FileText, restricted: true },
  { id: 'fotos', label: 'Fotos', icon: Camera, visible: true },
  { id: 'equipe', label: 'Equipe', icon: HardHat, restricted: true },
  { id: 'materiais', label: 'Materiais', icon: Package, restricted: true },
  { id: 'compras', label: 'Compras', icon: ShoppingCart, restricted: true },
  { id: 'fornecedores', label: 'Fornecedores', icon: Truck, restricted: true },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, restricted: true },
  { id: 'orcamento', label: 'Orçamento', icon: ClipboardList, restricted: true },
  { id: 'composicoes', label: 'Composições', icon: Layers, restricted: true },
  { id: 'abc', label: 'Curva ABC', icon: TrendingUp, restricted: true },
  { id: 'medicoes', label: 'Medições', icon: Ruler, visible: true },
  { id: 'documentos', label: 'Documentos', icon: FolderKanban, visible: true },
  { id: 'templates', label: 'Templates', icon: FileCode, visible: true },
  { id: 'usuarios', label: 'Usuários', icon: Settings, restricted: true },
]

export function BottomNav({ activeTab, onTabChange, userProfile }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const tipoUsuario = userProfile?.tipo_usuario || userProfile?.tipo
  const isClient = tipoUsuario === 'cliente'

  const coreTabs = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'crm', label: 'CRM', icon: Handshake },
    { id: 'ia', label: 'IA da Obra', icon: Bot, destaque: true },
    { id: 'cronograma', label: 'Cronograma', icon: Calendar },
    { id: 'more', label: 'Mais', icon: Menu },
  ]

  const modules = ALL_MODULES.filter((item) => !item.restricted || !isClient)

  function navegar(tabId) {
    setMenuOpen(false)

    if (tabId === 'ia') {
      window.location.href = '/ia'
      return
    }

    if (tabId === 'more') {
      setMenuOpen(true)
      return
    }

    if (WORKSPACE_TABS.has(tabId)) {
      window.location.href = `/workspace?module=${tabId}`
      return
    }

    onTabChange(tabId)
  }

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex items-end bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)}>
          <section className="max-h-[78vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">NeoCanteiro</p>
                <h2 className="mt-1 text-lg font-black text-slate-900">Todos os módulos</h2>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar menu">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(78vh-76px)] overflow-y-auto p-4 pb-8">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {modules.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => navegar(item.id)}
                      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition ${
                        isActive
                          ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? 'bg-white' : 'bg-slate-100'}`}>
                        <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span className="text-[9px] font-black leading-tight">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      <nav className="glass fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/60 px-1 pb-safe-area-inset-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.03)] lg:hidden">
        <div className="mx-auto flex h-[68px] w-full max-w-lg items-stretch justify-around">
          {coreTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id || (tab.id === 'more' && menuOpen)

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
                  <span className="mt-7 max-w-full truncate text-[8px] font-black tracking-tight">IA da Obra</span>
                </button>
              )
            }

            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => navegar(tab.id)}
                className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition-all duration-300 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
              >
                <div className={`rounded-xl p-1.5 transition-all duration-300 ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`max-w-full truncate text-[8px] font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
                {isActive && <div className="absolute left-1/2 top-0 h-0.5 w-7 -translate-x-1/2 rounded-b-full bg-blue-600" />}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
