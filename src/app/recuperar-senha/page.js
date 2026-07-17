'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const sendRecovery = async (event) => {
    event.preventDefault()
    setSending(true)
    setError('')

    try {
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/definir-senha?tipo=recuperacao` },
      )

      if (recoveryError) throw recoveryError
      setSent(true)
    } catch (sendError) {
      setError(sendError?.message || 'Não foi possível enviar o e-mail de recuperação.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <section className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          {sent ? <CheckCircle2 size={29} /> : <KeyRound size={28} />}
        </div>

        <div className="mt-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">NeoCanteiro</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{sent ? 'Confira seu e-mail' : 'Recuperar ou criar senha'}</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            {sent
              ? 'Enviamos um link seguro. Abra o e-mail e crie uma nova senha para entrar no NeoCanteiro.'
              : 'Informe o e-mail cadastrado para receber um link seguro de criação de senha.'}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={sendRecovery} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">E-mail cadastrado</span>
              <div className="relative">
                <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className={`${inputClass} pl-10`}
                  placeholder="cliente@email.com"
                />
              </div>
            </label>

            {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold leading-5 text-red-700">{error}</p>}

            <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white shadow-lg hover:bg-slate-800 disabled:opacity-60">
              {sending ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
              {sending ? 'Enviando...' : 'Enviar link para criar senha'}
            </button>
          </form>
        ) : (
          <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
            O link pode levar alguns minutos para chegar. Verifique também a caixa de spam.
          </div>
        )}

        <a href="/" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-50">
          <ArrowLeft size={16} /> Voltar ao login
        </a>
      </section>
    </main>
  )
}
