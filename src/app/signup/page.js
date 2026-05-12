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

      router.push('/')
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 mb-4">
            <span className="text-white font-black text-2xl">NC</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">NeoCanteiro</h1>
          <p className="text-slate-500 font-medium mt-1">Gestão Profissional de Obras</p>
        </div>

        {/* Card de Signup */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Criar Workspace</h2>

          {/* Erros */}
          {(errorMsg || error) && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
              <p className="text-red-600 text-sm font-bold text-center">{errorMsg || error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome Completo</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail corporativo</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                placeholder="seu@email.com.br"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Perfil de Acesso</label>
                <select
                  name="tipo_usuario"
                  value={formData.tipo_usuario}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium appearance-none"
                >
                  <option value="estagiario">Estagiário</option>
                  <option value="engenheiro">Engenheiro</option>
                  <option value="cliente">Cliente</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Empresa</label>
                <input
                  type="text"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                  placeholder="Nome da construtora"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Senha</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirmar Senha</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          {/* Link para Login */}
          <p className="text-center text-slate-500 font-medium text-sm mt-6">
            Já possui conta?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-700 font-black transition-colors"
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
