'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

export default function DefinirSenhaPage() {
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const title = useMemo(() => {
    if (typeof window === 'undefined') return 'Defina sua senha'
    const params = new URLSearchParams(window.location.search)
    return params.get('tipo') === 'recuperacao' ? 'Crie uma nova senha' : 'Finalize seu acesso'
  }, [])

  useEffect(() => {
    let active = true

    const checkSession = async () => {
      const params = new URLSearchParams(window.location.search)
      const queryError = params.get('error_description') || params.get('error')
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const hashError = hashParams.get('error_description') || hashParams.get('error')

      if (queryError || hashError) {
        if (active) {
          setError(decodeURIComponent(queryError || hashError || 'O link não é mais válido.'))
          setChecking(false)
        }
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!active) return

      setSessionReady(Boolean(data?.session?.user))
      setChecking(false)
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      if (session?.user) {
        setSessionReady(true)
        setChecking(false)
        setError('')
      }
    })

    const timeout = window.setTimeout(() => {
      if (!active) return
      setChecking(false)
    }, 7000)

    return () => {
      active = false
      window.clearTimeout(timeout)
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const savePassword = async (event) => {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmation) {
      setError('As senhas digitadas não são iguais.')
      return
    }

    setSaving(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      setSuccess(true)
      await supabase.auth.signOut()

      window.setTimeout(() => {
        window.location.replace('/?senha=criada')
      }, 1400)
    } catch (saveError) {
      setError(saveError?.message || 'Não foi possível definir a senha.')
      setSaving(false)
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-3 text-sm font-black text-blue-600">
          <Loader2 size={20} className="animate-spin" /> Validando convite...
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <section className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          {success ? <CheckCircle2 size={29} /> : <KeyRound size={28} />}
        </div>

        <div className="mt-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">NeoCanteiro</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{success ? 'Senha criada com sucesso' : title}</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            {success
              ? 'Você será direcionado à tela de login para entrar com sua nova senha.'
              : 'Crie uma senha pessoal para acessar somente as obras autorizadas para o seu usuário.'}
          </p>
        </div>

        {!success && sessionReady && (
          <form onSubmit={savePassword} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Nova senha</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={`${inputClass} pr-12`}
                  placeholder="Mínimo de 8 caracteres"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Confirme a senha</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
                placeholder="Digite novamente"
              />
            </label>

            <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-800">
              <ShieldCheck size={17} className="mt-0.5 shrink-0" /> Sua senha é enviada diretamente ao Supabase e não fica visível para o administrador da obra.
            </div>

            {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold leading-5 text-red-700">{error}</p>}

            <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white shadow-lg hover:bg-slate-800 disabled:opacity-60">
              {saving ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />}
              {saving ? 'Salvando senha...' : 'Criar senha e continuar'}
            </button>
          </form>
        )}

        {!success && !sessionReady && (
          <div className="mt-7 space-y-4">
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
              {error || 'Este link expirou, já foi utilizado ou não contém uma sessão válida.'}
            </p>
            <a href="/" className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white hover:bg-slate-800">Voltar ao login</a>
          </div>
        )}
      </section>
    </main>
  )
}
