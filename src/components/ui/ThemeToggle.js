'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'neocanteiro_theme'

function resolveInitialTheme() {
  if (typeof window === 'undefined') return 'light'

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export function ThemeToggle() {
  const [theme, setTheme] = useState('light')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const initial = resolveInitialTheme()
    setTheme(initial)
    applyTheme(initial)
    setReady(true)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  const dark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Ativar visualização clara' : 'Ativar visualização escura'}
      title={dark ? 'Visualização clara' : 'Visualização escura'}
      className="fixed bottom-20 right-4 z-[85] inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 px-3 text-slate-700 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.55)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 lg:bottom-6 lg:right-6"
    >
      <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${dark ? 'bg-slate-800 text-amber-300' : 'bg-blue-50 text-blue-700'}`}>
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </span>
      <span className="hidden text-[10px] font-black uppercase tracking-[0.12em] sm:block">
        {dark ? 'Modo claro' : 'Modo escuro'}
      </span>
    </button>
  )
}
