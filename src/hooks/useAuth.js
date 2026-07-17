'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/services/authService'

const DEMO_STORAGE_KEY = 'neocanteiro_demo_session'
const DEMO_CONTROL_URL = '/demo-access.json'

// O acesso investidor@nc.com passa pelo Supabase para enxergar obras reais.
// Mantemos apenas o acesso temporário do Lucas como sessão local demonstrativa.
const DEMO_ACCOUNTS = [
  {
    id: 'demo-lucas',
    email: 'lucas.demo@nc.com',
    password: 'lucas.demo',
    nome: 'Lucas — Acesso Demo',
    role: 'investidor',
    enabled: true,
    tokenVersion: 1,
    remoteControl: true,
  },
]

function identidadeDemo(account) {
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

  // Remove o formato antigo que usava investidor@nc.com como sessão local.
  if (valor === 'true') {
    window.localStorage.removeItem(DEMO_STORAGE_KEY)
    return null
  }

  try {
    const sessao = JSON.parse(valor)
    if (!sessao?.accountId) throw new Error('Sessão inválida')

    if (sessao.accountId === 'demo-investidor') {
      window.localStorage.removeItem(DEMO_STORAGE_KEY)
      return null
    }

    return sessao
  } catch {
    window.localStorage.removeItem(DEMO_STORAGE_KEY)
    return null
  }
}

function obterContaDaSessao() {
  const sessao = lerSessaoDemo()
  if (!sessao) return null

  const account = DEMO_ACCOUNTS.find((item) => item.id === sessao.accountId)

  if (
    !account ||
    !account.enabled ||
    Number(sessao.tokenVersion || 1) !== Number(account.tokenVersion || 1)
  ) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DEMO_STORAGE_KEY)
    }
    return null
  }

  return { account, sessao, ...identidadeDemo(account) }
}

function salvarSessaoDemo(account) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify({
      accountId: account.id,
      tokenVersion: account.tokenVersion || 1,
      createdAt: Date.now(),
    }),
  )
}

async function acessoRemotoLucasContinuaValido(sessao) {
  try {
    const resposta = await fetch(`${DEMO_CONTROL_URL}?v=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })

    if (!resposta.ok) return true

    const controle = await resposta.json()
    const registro = controle?.['demo-lucas']

    if (!registro) return true

    return (
      registro.enabled === true &&
      Number(registro.tokenVersion || 1) === Number(sessao?.tokenVersion || 1)
    )
  } catch {
    return true
  }
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
      const sessaoDemo = obterContaDaSessao()
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

      if (sessionUser) {
        carregarPerfilSemBloquear(sessionUser.id)
      } else {
        setUserProfile(null)
      }
    })

    const revocationTimer = window.setInterval(async () => {
      const sessao = lerSessaoDemo()
      if (!sessao || sessao.accountId !== 'demo-lucas') return

      const continuaValido = await acessoRemotoLucasContinuaValido(sessao)

      if (!continuaValido && ativo) {
        window.localStorage.removeItem(DEMO_STORAGE_KEY)
        setUser(null)
        setUserProfile(null)
        setError('Este acesso demonstrativo foi encerrado.')
      }
    }, 15000)

    const onStorage = (event) => {
      if (event.key !== DEMO_STORAGE_KEY) return

      if (!aplicarSessaoDemo()) {
        setUser(null)
        setUserProfile(null)
      }
    }

    window.addEventListener('storage', onStorage)

    return () => {
      ativo = false
      window.clearInterval(revocationTimer)
      window.removeEventListener('storage', onStorage)
      subscription?.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      const normalizedEmail = String(email || '').trim().toLowerCase()
      const normalizedPassword = String(password || '').trim()
      const demoAccount = DEMO_ACCOUNTS.find(
        (account) => account.email === normalizedEmail,
      )

      if (demoAccount) {
        if (demoAccount.password !== normalizedPassword) {
          throw new Error('E-mail ou senha do acesso demo estão incorretos.')
        }

        if (!demoAccount.enabled) {
          throw new Error('Este acesso demonstrativo foi encerrado.')
        }

        salvarSessaoDemo(demoAccount)
        const identidade = identidadeDemo(demoAccount)

        setUser(identidade.user)
        setUserProfile(identidade.profile)

        return {
          user: identidade.user,
          session: {
            user: identidade.user,
            access_token: `demo-${demoAccount.id}-v${demoAccount.tokenVersion || 1}`,
          },
        }
      }

      const data = await authService.login(normalizedEmail, normalizedPassword)

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
