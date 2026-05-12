'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

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
        router.push('/login')
      } else if (user && isPublicRoute) {
        router.push('/')
      }
    }
  }, [user, loading, pathname, isPublicRoute, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner message="Autenticando sessão..." />
      </div>
    )
  }

  if (isPublicRoute) return children
  if (user) return children

  return null
}
