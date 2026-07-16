'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/services/authService'

const DEMO_STORAGE_KEY = 'neocanteiro_demo_session'
const DEMO_CONTROL_URL = '/demo-access.json'

const DEMO_ACCOUNTS = [
  {
    id: 'demo-investidor',
    email: 'investidor@nc.com',
    password: 'nc123',
    nome: 'Investidor NeoCanteiro',
    role: 'investidor',
    remoteControl: false,
  },
  {
    id: 'demo-lucas',
    email: 'lucas.demo@nc.com',
    password: 'lucas.demo',
    nome: 'Lucas — Acesso Demo',
    role: 'investidor',
    remoteControl: true,
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

function lerSessaoDemoLocal() {
  if (typeof window === 'undefined') return null

  const valor = window.localStorage.getItem(DEMO_STORAGE_KEY)
  if (!valor) return null

  // Compatibilidade com a sessão antiga do investidor.
  if (valor === 'true') {
    return { accountId: 'demo-investidor', tokenVersion: null }
  }

  try {
    const sessao = JSON.parse(valor)
    if (!sessao?.accountId) throw new Error('Sessão inválida')
    return sessao
  } catch {
    window.localStorage.removeItem(DEMO_STORAGE_KEY)
    return null
  }
}

function removerSessaoDemoLocal() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(DEMO_STORAGE_KEY)
  }
}

async function carregarControleDemo() {
  const resposta = await fetch(`${DEMO_CONTROL_URL}?v=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  if (!resposta.ok) {
    throw new Error('Não foi possível validar o acesso demonstrativo.')
  }

  return resposta.json()
}

async function validarContaDemo(account, tokenVersion = null) {
  if (!account?.remoteControl) {
    return { enabled: true, tokenVersion: null }
  }

  const controle = await carregarControleDemo()
  const registro = controle?.[account.id]

  if (!registro?.enabled) {
    return { enabled: false, tokenVersion: registro?.tokenVersion ?? null }
  }

  if (tokenVersion !== null && Number(tokenVersion) !== Number(registro.tokenVersion)) {
    return { enabled: false, tokenVersion: registro.tokenVersion }
  }

  return {
    enabled: true,
    tokenVersion: Number(registro.tokenVersion || 1),
  }
}

async function obterSessaoDemoValida() {
  const sessaoLocal = lerSessaoDemoLocal()
  if (!sessaoLocal) return null

  const account = DEMO_ACCOUNTS.find((item) => item.id === sessaoLocal.accountId)
  if (!account) {
    removerSessaoDemoLocal()
    return null
  }

  try {
    const controle = await validarContaDemo(account, sessaoLocal.tokenVersion ?? null)

    if (!controle.enabled) {
      removerSessaoDemoLocal()
      return null
    }

    return {
      account,
      tokenVersion: controle.tokenVersion,
      ...criarIdentidadeDemo(account),
    }
  } catch {
    // O acesso controlado falha fechado: sem validar no servidor, não permanece conectado.
    if (account.remoteControl) {
      removerSessaoDemoLocal()
      return null
    }

    return {
      account,
      tokenVersion: null,
      ...criarIdentidadeDemo(account),
    }
  }
}

function salvarSessaoDemo(account, tokenVersion = null) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify({
      accountId: account.id,
      tokenVersion,
      createdAt: Date.now(),
    }),
  )
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

    const aplicarSessaoDemo = async () => {
      const sessaoDemo = await obterSessaoDemoValida()
      if (!sessaoDemo || !ativo) return false

      setUser(sessaoDemo.user)
      setUserProfile(sessaoDemo.profile)
      return true
    }

    const checkUser = async () => {
      try {
        if (await aplicarSessaoDemo()) return

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

      if (!sessionUser && lerSessaoDemoLocal()) {
        aplicarSessaoDemo().then((aplicada) => {
          if (!aplicada && ativo) {
            setUser(null)
            setUserProfile(null)
          }
        })
        return
      }

      setUser(sessionUser)

      if (!sessionUser) {
        setUserProfile(null)
      }
    })

    // Consulta o controle remoto para revogar o login e a sessão quando solicitado.
    const revocationTimer = window.setInterval(async () => {
      const sessaoLocal = lerSessaoDemoLocal()
      if (!sessaoLocal || sessaoLocal.accountId !== 'demo-lucas') return

      const sessaoValida = await obterSessaoDemoValida()
      if (!sessaoValida && ativo) {
        setUser(null)
        setUserProfile(null)
        setError('Este acesso demonstrativo foi encerrado.')
      }
    }, 15000)

    const onStorage = async (event) => {
      if (event.key !== DEMO_STORAGE_KEY) return

      const sessaoDemo = await obterSessaoDemoValida()
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
        (account) => account.email === normalizedEmail && account.password === normalizedPassword,
      )

      if (demoAccount) {
        const controle = await validarContaDemo(demoAccount)

        if (!controle.enabled) {
          throw new Error('Este acesso demonstrativo foi encerrado.')
        }

        salvarSessaoDemo(demoAccount, controle.tokenVersion)
        const identidade = criarIdentidadeDemo(demoAccount)

        setUser(identidade.user)
        setUserProfile(identidade.profile)

        return {
          user: identidade.user,
          session: {
            user: identidade.user,
            access_token: `demo-${demoAccount.id}-v${controle.tokenVersion || 1}`,
          },
        }
      }

      // Um e-mail demo correto com senha incorreta não deve cair no Supabase.
      if (DEMO_ACCOUNTS.some((account) => account.email === normalizedEmail)) {
        throw new Error('E-mail ou senha do acesso demo estão incorretos.')
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

      const sessaoDemo = lerSessaoDemoLocal()
      removerSessaoDemoLocal()

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
