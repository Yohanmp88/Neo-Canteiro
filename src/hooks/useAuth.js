'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/services/authService'

const DEMO_EMAIL = 'investidor@nc.com'
const DEMO_PASSWORD = 'nc123'
const DEMO_STORAGE_KEY = 'neocanteiro_demo_session'

const demoUser = {
  id: 'demo-investidor',
  email: DEMO_EMAIL,
  app_metadata: { provider: 'demo' },
  user_metadata: { nome: 'Investidor NeoCanteiro' },
}

const demoProfile = {
  id: demoUser.id,
  nome: 'Investidor NeoCanteiro',
  email: DEMO_EMAIL,
  role: 'investidor',
  tipo_usuario: 'investidor',
}

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
      // O acesso ao sistema não deve depender da leitura da tabela de perfis.
      console.error('Erro ao carregar perfil:', err)
      setUserProfile(null)
    }
  }

  useEffect(() => {
    let ativo = true

    const existeSessaoDemo = () => {
      if (typeof window === 'undefined') return false
      return window.localStorage.getItem(DEMO_STORAGE_KEY) === 'true'
    }

    const checkUser = async () => {
      try {
        // O acesso de demonstração precisa funcionar mesmo se o Supabase estiver
        // pausado, sem usuário cadastrado ou com alguma regra RLS incorreta.
        if (existeSessaoDemo()) {
          if (!ativo) return
          setUser(demoUser)
          setUserProfile(demoProfile)
          return
        }

        const currentUser = await authService.getCurrentUser()

        if (!ativo) return
        setUser(currentUser)

        if (currentUser) {
          carregarPerfilSemBloquear(currentUser.id)
        }
      } catch (err) {
        if (ativo) setError(err?.message || 'Não foi possível verificar a sessão.')
      } finally {
        if (ativo) setLoading(false)
      }
    }

    checkUser()

    // O callback permanece síncrono para não bloquear o signInWithPassword.
    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, session) => {
      const sessionUser = session?.user || null

      // Eventos de sessão vazia do Supabase não podem apagar a sessão demo local.
      if (!sessionUser && existeSessaoDemo()) {
        setUser(demoUser)
        setUserProfile(demoProfile)
        return
      }

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

      const normalizedEmail = email.trim().toLowerCase()

      // O investidor usa uma sessão demo local. Assim, o acesso público não
      // quebra quando o projeto do Supabase está pausado ou sem esse usuário.
      if (normalizedEmail === DEMO_EMAIL && password === DEMO_PASSWORD) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(DEMO_STORAGE_KEY, 'true')
        }

        setUser(demoUser)
        setUserProfile(demoProfile)

        return { user: demoUser, session: { user: demoUser, access_token: 'demo' } }
      }

      const data = await authService.login(normalizedEmail, password)

      if (!data?.user) {
        throw new Error('Não foi possível iniciar a sessão. Tente novamente.')
      }

      setUser(data.user)
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

      const sessaoDemo = typeof window !== 'undefined' && window.localStorage.getItem(DEMO_STORAGE_KEY) === 'true'

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(DEMO_STORAGE_KEY)
      }

      if (!sessaoDemo) {
        await authService.logout()
      }

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
