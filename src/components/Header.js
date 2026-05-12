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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-500 shadow-lg shadow-cyan-950/40 ring-1 ring-white/20">
            <span className="text-slate-950 font-black text-lg">N</span>
          </div>
          <span className="hidden text-lg font-black tracking-tight text-white sm:inline">NeoCanteiro</span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4">
          {userProfile && (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{userProfile.nome}</p>
                <p className="text-xs text-slate-400">
                  {userProfile.tipo_usuario === 'engenheiro'
                    ? 'Engenheiro'
                    : userProfile.tipo_usuario === 'estagiario'
                      ? 'Estagiário'
                      : 'Cliente'}
                </p>
              </div>

              {/* Avatar */}
              <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 font-black text-slate-950 shadow-lg shadow-cyan-950/30 ring-1 ring-white/20 transition hover:from-cyan-200 hover:to-blue-400">
                {userProfile.nome.charAt(0).toUpperCase()}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-cyan-300/40 hover:bg-white/10 hover:text-white disabled:opacity-50"
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
