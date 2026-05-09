'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const router = useRouter()
  const { login, loading, error } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    try {
      await login(formData.email, formData.password)
      router.push('/dashboard')
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">NeoCanteiro</h1>
          <p className="text-zinc-400">Gestão Profissional de Obras</p>
        </div>

        {/* Card de Login */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Entrar</h2>

          {/* Erros */}
          {(errorMsg || error) && (
            <div className="bg-red-500/15 border border-red-500/30 rounded p-4 mb-4">
              <p className="text-red-300 text-sm">{errorMsg || error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Senha</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-yellow-400 text-zinc-950 font-bold rounded hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Link para Sign Up */}
          <p className="text-center text-zinc-400 text-sm mt-6">
            Não tem conta?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-yellow-400 hover:text-yellow-300 font-medium transition"
            >
              Criar conta
            </button>
          </p>
        </div>

        {/* Info de Demo */}
        <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded text-center">
          <p className="text-xs text-zinc-400">
            <strong>Demo:</strong> Use credenciais de teste para explorar
          </p>
        </div>
      </div>
    </div>
  )
}
