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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-white font-black text-sm">NC</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">NeoCanteiro</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">Gestão Inteligente de Obras</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-8 shadow-xl shadow-slate-200/40">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900">Bem-vindo de volta</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">Acesse sua conta para gerenciar suas obras.</p>
          </div>

          {/* Erros */}
          {(errorMsg || error) && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
              <p className="text-red-600 text-xs font-bold">{errorMsg || error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-premium text-sm font-medium"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Senha</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-premium text-sm font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-premium disabled:opacity-50 shadow-lg shadow-blue-600/10 active:scale-[0.98] text-sm"
            >
              {loading ? 'Autenticando...' : 'Entrar na Plataforma'}
            </button>
          </form>

          {/* Link para Sign Up */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-slate-500 text-xs font-medium">
            Ainda não tem uma conta?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-blue-600 hover:text-blue-700 font-bold transition-premium"
            >
              Criar conta gratuita
            </button>
          </div>
        </div>

        {/* Info de Demo */}
        <div className="mt-8 p-4 bg-white/50 border border-slate-200/50 rounded-xl text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Ambiente de Demonstração
          </p>
        </div>
      </div>
    </div>
  )

}
