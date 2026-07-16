'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/services/authService'

const DEMO_STORAGE_KEY = 'neocanteiro_demo_session'

const DEMO_ACCOUNTS = [
  {
    id: 'demo-investidor',
    email: 'investidor@nc.com',
    password: 'nc123',
    nome: 'Investidor NeoCanteiro',
    role: 'investidor',
    enabled: true,
    sessionHours: null,
  },
  {
    id: 'demo-lucas',
    email: 'lucas.demo@nc.com',
    password: 'lucas.demo',
    nome: 'Lucas — Acesso Demo',
    role: 'investidor',
    enabled: true,
    sessionHours: 72,
  },
]

function criarIdentidadeDemo(account) {
  const user = {
    id: account.id,
    email: account.email,
    app_metadata: { provider: 'demo' },
    user_metadata: { nome: account.nome },
  }

  const profile = {
    id: account.id,
    nome: account.nome,
    email: account.email,
    role: account.role,
    tipo_usuario: account.role,
  }

  return { user, profile }
}

function lerSessaoDemo() {
  if (typeof window === 'undefined') return null

  const valor = window.localStorage.getItem(DEMO_STORAGE_KEY)
  if (!valor) return null

  // Compatibilidade com a sessão demo antiga, que armazenava apenas "true".
  if (valor === 'true') {
    const account = DEMO_ACCOUNTS.find((item) => item.id === 'demo-investidor' && item.enabled)
    if (!account) {
      window.localStorage.removeItem(DEMO_STORAGE_KEY)
      return null
    }

    return {
      account,
      expiresAt: null,
      ...criarIdentidadeDemo(account),
    }
  }

  try {
    const sessao = JSON.parse(valor)
    const account = DEMO_ACCOUNTS.find((item) => item.id === sessao?.accountId)

    if (!account || !account.enabled) {
      window.localStorage.removeItem(DEMO_STORAGE_KEY)
      return null
    }

    if (sessao.expiresAt && Date.now() >= Number(sessao.expiresAt)) {
      window.localStorage.removeItem(DEMO_STORAGE_KEY)
      return null
    }

    return {
      account,
      expiresAt: sessao.expiresAt || null,
      ...criarIdentidadeDemo(account),
    }
  } catch {
    window.localStorage.removeItem(DEMO_STORAGE_KEY)
    return null
  }
}

function salvarSessaoDemo(account) {
  if (typeof window === 'undefined') return null

  const expiresAt = account.sessionHours
    ? Date.now() + account.sessionHours * 60 * 60 * 1000
    : null

  window.localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify({ accountId: account.id, expiresAt }),
  )

  return expiresAt
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
      console.error('Erro ao carregar perfil:', err)
      setUserProfile(null)
    }
  }

  useEffect(() => {
    let ativo = true

    const aplicarSessaoDemo = () => {
      const sessaoDemo = lerSessaoDemo()
      if (!sessaoDemo || !ativo) return false

      setUser(sessaoDemo.user)
      setUserProfile(sessaoDemo.profile)
      return true
    }

    const checkUser = async () => {
      try {
        if (aplicarSessaoDemo()) return

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

    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, session) => {
      const sessionUser = session?.user || null

      if (!sessionUser && aplicarSessaoDemo()) return

      setUser(sessionUser)

      if (!sessionUser) {
        setUserProfile(null)
      }
    })

    // Expira automaticamente acessos temporários, mesmo com a página aberta.
    const expirationTimer = window.setInterval(() => {
      const valor = window.localStorage.getItem(DEMO_STORAGE_KEY)
      if (!valor) return

      const sessaoDemo = lerSessaoDemo()
      if (!sessaoDemo) {
        setUser(null)
        setUserProfile(null)
      }
    }, 30000)

    // Mantém o logout sincronizado entre abas abertas no mesmo aparelho.
    const onStorage = (event) => {
      if (event.key !== DEMO_STORAGE_KEY) return

      const sessaoDemo = lerSessaoDemo()
      if (sessaoDemo) {
        setUser(sessaoDemo.user)
        setUserProfile(sessaoDemo.profile)
      } else {
        setUser(null)
        setUserProfile(null)
      }
    }

    window.addEventListener('storage', onStorage)

    return () => {
      ativo = false
      window.clearInterval(expirationTimer)
      window.removeEventListener('storage', onStorage)
      subscription?.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      const normalizedEmail = email.trim().toLowerCase()
      const demoAccount = DEMO_ACCOUNTS.find(
        (account) => account.email === normalizedEmail && account.password === password,
      )

      if (demoAccount) {
        if (!demoAccount.enabled) {
          throw new Error('Este acesso demonstrativo foi encerrado.')
        }

        salvarSessaoDemo(demoAccount)
        const identidade = criarIdentidadeDemo(demoAccount)

        setUser(identidade.user)
        setUserProfile(identidade.profile)

        return {
          user: identidade.user,
          session: { user: identidade.user, access_token: `demo-${demoAccount.id}` },
        }
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

      const sessaoDemo = lerSessaoDemo()

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
