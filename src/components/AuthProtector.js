'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export function AuthProtector({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/signup']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicRoute) {
        // Usuário não autenticado tentando acessar rota protegida
        router.push('/login')
      } else if (user && isPublicRoute) {
        // Usuário autenticado tentando acessar login/signup
        router.push('/dashboard')
      }
    }
  }, [user, loading, pathname, isPublicRoute, router])

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se for rota pública, permite acesso mesmo sem autenticação
  if (isPublicRoute) {
    return children
  }

  // Se for rota protegida, mostra conteúdo apenas se autenticado
  if (user) {
    return children
  }

  return null
}
