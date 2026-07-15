import { Inter } from 'next/font/google'
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
  themeColor: '#f8fafc',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`h-full antialiased ${inter.className}`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  )
}
