'use client'

export function Header({ userProfile, obras, obraSelecionadaId, onObraChange, logout }) {
  const isClient = userProfile?.tipo_usuario === 'cliente'

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 transition-all">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Side: Obra Selector */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Workspace</span>
          </div>
          
          <div className="relative">
            <select
              value={obraSelecionadaId || ''}
              onChange={(e) => onObraChange(e.target.value)}
              disabled={obras.length === 0}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block w-full px-4 py-2 pr-10 cursor-pointer disabled:opacity-50 transition-colors hover:bg-slate-100 outline-none"
            >
              {obras.length === 0 ? (
                <option value="">Nenhuma obra disponível</option>
              ) : (
                obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.nome}
                  </option>
                ))
              )}
            </select>
            {/* Custom chevron icon */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Side: User Profile */}
        <div className="flex items-center gap-4">
          {userProfile && (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-slate-900 text-sm font-bold">{userProfile.nome}</p>
                <p className="text-slate-500 text-xs font-medium capitalize">
                  {userProfile.tipo_usuario}
                </p>
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black cursor-pointer hover:bg-slate-200 transition-colors shadow-sm">
                {userProfile.nome.charAt(0).toUpperCase()}
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="ml-2 px-3 py-1.5 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
