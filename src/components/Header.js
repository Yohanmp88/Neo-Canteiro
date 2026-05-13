'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export function Header() {
  const router = useRouter()
  const { userProfile, logout, loading } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 shadow-sm shadow-slate-200/20 backdrop-blur-xl">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <span className="text-white font-black text-sm">NC</span>
          </div>
          <span className="hidden text-lg font-black tracking-tight text-slate-900 sm:inline">NeoCanteiro</span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-5">
          {userProfile && (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{userProfile.nome}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {userProfile.tipo_usuario === 'engenheiro'
                    ? 'Engenheiro'
                    : userProfile.tipo_usuario === 'estagiario'
                      ? 'Estagiário'
                      : 'Cliente'}
                </p>
              </div>

              {/* Avatar */}
              <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-slate-50 border border-slate-200 font-black text-slate-900 shadow-sm transition hover:bg-slate-100 active:scale-95">
                {userProfile.nome.charAt(0).toUpperCase()}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-600 transition-premium hover:border-blue-200 hover:text-blue-600 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Saindo...' : 'Sair'}
              </button>
            </>
          )}
        </div>
      </div>
    </header>

  )
}
