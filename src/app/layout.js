import { Inter } from 'next/font/google'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'NeoCanteiro SaaS',
  description: 'Plataforma de gestão de obras com design premium.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
}

const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem('neocanteiro_theme');
    var theme = saved === 'dark' || saved === 'light'
      ? saved
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (error) {}
})();
`

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`h-full antialiased ${inter.className}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
        <ThemeToggle />
      </body>
    </html>
  )
}
