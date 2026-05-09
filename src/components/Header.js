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
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center">
            <span className="text-zinc-950 font-bold text-lg">N</span>
          </div>
          <span className="text-white font-bold text-lg hidden sm:inline">NeoCanteiro</span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4">
          {userProfile && (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-white text-sm font-medium">{userProfile.nome}</p>
                <p className="text-zinc-400 text-xs">
                  {userProfile.tipo_usuario === 'engenheiro'
                    ? 'Engenheiro'
                    : userProfile.tipo_usuario === 'estagiario'
                      ? 'Estagiário'
                      : 'Cliente'}
                </p>
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-zinc-950 font-bold cursor-pointer hover:from-yellow-300 hover:to-yellow-400 transition">
                {userProfile.nome.charAt(0).toUpperCase()}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="px-4 py-2 text-zinc-300 hover:text-white transition text-sm font-medium disabled:opacity-50"
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
