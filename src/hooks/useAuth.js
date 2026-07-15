'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/services/authService'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Verificar usuário atual ao montar
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)

        if (currentUser) {
          const profile = await authService.getUserProfile(currentUser.id)
          setUserProfile(profile)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // O callback precisa permanecer síncrono.
    // Consultas ao Supabase dentro de um callback async podem travar o signInWithPassword.
    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, session) => {
      setUser(session?.user || null)

      if (!session?.user) {
        setUserProfile(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      const data = await authService.login(email, password)
      setUser(data.user)

      const profile = await authService.getUserProfile(data.user.id)
      setUserProfile(profile)

      return data
    } catch (err) {
      setError(err.message)
      throw err
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

      const profile = await authService.getUserProfile(data.user.id)
      setUserProfile(profile)

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
