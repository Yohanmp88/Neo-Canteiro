'use client'

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
  ChevronRight,
  Handshake,
  UsersRound,
  Truck,
  FolderKanban,
} from 'lucide-react'

const MENU_GROUPS = [
  {
    label: 'Gestão',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
      { id: 'crm', label: 'CRM Comercial', icon: Handshake, visible: true },
      { id: 'clientes', label: 'Clientes', icon: UsersRound, visible: true },
      { id: 'cronograma', label: 'Cronograma', icon: Calendar, visible: true },
      { id: 'ia', label: 'IA Operacional', icon: Bot, visible: true },
    ],
  },
  {
    label: 'Operação da obra',
    items: [
      { id: 'diario', label: 'Diário de Obra', icon: FileText, restricted: true },
      { id: 'fotos', label: 'Fotos', icon: Camera, visible: true },
      { id: 'equipe', label: 'Equipe', icon: HardHat, restricted: true },
      { id: 'materiais', label: 'Materiais e Estoque', icon: Package, restricted: true },
      { id: 'compras', label: 'Gestão de Compras', icon: ShoppingCart, restricted: true },
      { id: 'fornecedores', label: 'Fornecedores', icon: Truck, restricted: true },
    ],
  },
  {
    label: 'Custos e contratos',
    items: [
      { id: 'financeiro', label: 'Financeiro', icon: DollarSign, restricted: true },
      { id: 'orcamento', label: 'Orçamento', icon: ClipboardList, restricted: true },
      { id: 'composicoes', label: 'Composições', icon: Layers, restricted: true },
      { id: 'abc', label: 'Curva ABC', icon: TrendingUp, restricted: true },
      { id: 'medicoes', label: 'Medições', icon: Ruler, visible: true },
    ],
  },
  {
    label: 'Administração',
    items: [
      { id: 'documentos', label: 'Documentos', icon: FolderKanban, visible: true },
      { id: 'templates', label: 'Templates', icon: FileCode, visible: true },
      { id: 'usuarios', label: 'Usuários e Permissões', icon: Settings, restricted: true },
    ],
  },
]

export function Sidebar({ activeTab, onTabChange, userProfile, logout }) {
  const tipoUsuario = userProfile?.tipo_usuario || userProfile?.tipo
  const isClient = tipoUsuario === 'cliente'

  const navegar = (tabId) => {
    if (tabId === 'ia') {
      window.location.href = '/ia'
      return
    }

    onTabChange(tabId)
  }

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-30 hidden w-72 flex-col border-r border-slate-200/60 bg-white transition-all duration-300 lg:flex">
      <div className="flex h-20 items-center px-6">
        <button type="button" onClick={() => navegar('dashboard')} className="group flex items-center gap-3 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 transition-transform duration-300 group-hover:scale-105">
            <span className="text-xs font-black text-white">NC</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black leading-none tracking-tight text-slate-900">NeoCanteiro</span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Gestão inteligente de obras com IA</span>
          </div>
        </button>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-3 pb-8 pt-2">
        {MENU_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => !item.restricted || !isClient)
          if (!visibleItems.length) return null

          return (
            <section key={group.label}>
              <p className="px-3 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{group.label}</p>
              <div className="space-y-0.5">
                {visibleItems.map((tab) => {
                  const isActive = activeTab === tab.id
                  const Icon = tab.icon

                  return (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => navegar(tab.id)}
                      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className={`rounded-lg p-1 transition-colors duration-200 ${isActive ? 'bg-white shadow-sm' : 'group-hover:bg-white group-hover:shadow-sm'}`}>
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span className={`text-sm tracking-tight ${isActive ? 'font-bold' : 'font-medium opacity-80 group-hover:opacity-100'}`}>{tab.label}</span>
                      {isActive && <ChevronRight size={14} strokeWidth={3} className="absolute right-2 text-blue-400" />}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 bg-slate-50/50 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-900 shadow-sm">
              {userProfile?.iniciais || String(userProfile?.nome || 'NC').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-slate-900">{userProfile?.nome || 'Usuário NeoCanteiro'}</p>
              <p className="truncate text-[10px] font-bold uppercase tracking-tight text-slate-400">{tipoUsuario || 'Membro'}</p>
            </div>
          </div>

          <button type="button" onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-500 shadow-sm transition-all duration-200 hover:border-red-100 hover:bg-red-50 hover:text-red-600 active:scale-95">
            <LogOut size={14} />
            <span>Sair da Plataforma</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
