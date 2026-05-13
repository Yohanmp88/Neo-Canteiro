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
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-white font-black text-sm">NC</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">NeoCanteiro</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">Crie seu workspace de gestão</p>
        </div>

        {/* Card de Signup */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-8 shadow-xl shadow-slate-200/40">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900">Começar agora</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">Preencha os dados abaixo para criar sua conta.</p>
          </div>

          {/* Erros */}
          {(errorMsg || error) && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
              <p className="text-red-600 text-xs font-bold">{errorMsg || error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nome Completo</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-premium text-sm font-medium"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-mail corporativo</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-premium text-sm font-medium"
                placeholder="seu@email.com.br"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Perfil de Acesso</label>
                <div className="relative">
                  <select
                    name="tipo_usuario"
                    value={formData.tipo_usuario}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-premium text-sm font-medium appearance-none"
                  >
                    <option value="estagiario">Estagiário</option>
                    <option value="engenheiro">Engenheiro</option>
                    <option value="cliente">Cliente</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <span className="text-[10px]">▼</span>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Empresa</label>
                <input
                  type="text"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-premium text-sm font-medium"
                  placeholder="Nome da construtora"
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

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Confirmar</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-premium text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-premium disabled:opacity-50 shadow-lg shadow-blue-600/10 active:scale-[0.98] text-sm"
            >
              {loading ? 'Criando conta...' : 'Criar Conta Gratuita'}
            </button>
          </form>

          {/* Link para Login */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-slate-500 text-xs font-medium">
            Já possui uma conta?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-700 font-bold transition-premium"
            >
              Fazer login
            </button>
          </div>
        </div>
      </div>
    </div>
  )

}
