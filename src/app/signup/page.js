'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function SignupPage() {
  const router = useRouter()
  const { signup, loading, error } = useAuth()
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    tipo_usuario: 'estagiario',
    empresa: '',
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

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('As senhas não correspondem')
      return
    }

    if (formData.password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (!formData.nome) {
      setErrorMsg('Nome é obrigatório')
      return
    }

    try {
      await signup(formData.email, formData.password, {
        nome: formData.nome,
        tipo_usuario: formData.tipo_usuario,
        empresa: formData.empresa,
      })

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

        {/* Card de Signup */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Criar Conta</h2>

          {/* Erros */}
          {(errorMsg || error) && (
            <div className="bg-red-500/15 border border-red-500/30 rounded p-4 mb-4">
              <p className="text-red-300 text-sm">{errorMsg || error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Nome</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition"
                placeholder="Seu nome"
              />
            </div>

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
              <label className="block text-sm font-medium text-zinc-300 mb-2">Tipo de Usuário</label>
              <select
                name="tipo_usuario"
                value={formData.tipo_usuario}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-yellow-400 transition"
              >
                <option value="estagiario">Estagiário</option>
                <option value="engenheiro">Engenheiro</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Empresa</label>
              <input
                type="text"
                name="empresa"
                value={formData.empresa}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition"
                placeholder="Sua empresa (opcional)"
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

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Confirmar Senha</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
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
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          {/* Link para Login */}
          <p className="text-center text-zinc-400 text-sm mt-6">
            Já tem conta?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-yellow-400 hover:text-yellow-300 font-medium transition"
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
