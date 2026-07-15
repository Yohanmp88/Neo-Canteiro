'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/services/authService'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const carregarPerfilSemBloquear = async (userId) => {
    try {
      const profile = await authService.getUserProfile(userId)
      setUserProfile(profile || null)
    } catch (err) {
      // O login não deve ficar travado caso o perfil/RLS apresente erro.
      console.error('Erro ao carregar perfil:', err)
      setUserProfile(null)
    }
  }

  useEffect(() => {
    let ativo = true

    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()

        if (!ativo) return
        setUser(currentUser)

        if (currentUser) {
          carregarPerfilSemBloquear(currentUser.id)
        }
      } catch (err) {
        if (ativo) setError(err.message)
      } finally {
        if (ativo) setLoading(false)
      }
    }

    checkUser()

    // O callback precisa permanecer síncrono. Fazer consultas ao Supabase
    // dentro de um callback async pode bloquear o signInWithPassword.
    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, session) => {
      const sessionUser = session?.user || null
      setUser(sessionUser)

      if (!sessionUser) {
        setUserProfile(null)
      }
    })

    return () => {
      ativo = false
      subscription?.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      const data = await authService.login(email.trim(), password)

      if (!data?.user) {
        throw new Error('Não foi possível iniciar a sessão. Tente novamente.')
      }

      setUser(data.user)

      // Não bloqueia o redirecionamento aguardando a consulta da tabela profiles.
      carregarPerfilSemBloquear(data.user.id)

      return data
    } catch (err) {
      const message = err?.message || 'Erro ao entrar. Verifique os dados e tente novamente.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email, password, userData) => {
    try {
      setLoading(true)
      setError(null)
      const data = await authService.signup(email, password, userData)
      setUser(data.user)

      if (data?.user) {
        carregarPerfilSemBloquear(data.user.id)
      }

      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      setError(null)
      await authService.logout()
      setUser(null)
      setUserProfile(null)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    userProfile,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isEngineer: userProfile?.tipo_usuario === 'engenheiro',
    isIntern: userProfile?.tipo_usuario === 'estagiario',
    isClient: userProfile?.tipo_usuario === 'cliente',
  }
}
