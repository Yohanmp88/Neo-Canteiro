const fs = require('fs')

const path = 'src/app/page.js'
let source = fs.readFileSync(path, 'utf8')

const marker = `  useEffect(() => {
    if (!user || !profileReady) return
    if (!canViewModule(role, tela)) setTela('dashboard')
  }, [user, profileReady, role, tela])`

const replacement = `${marker}

  // A Gestão de Compras profissional usa os registros reais do workspace.
  useEffect(() => {
    if (tela === 'compras') window.location.replace('/workspace?module=compras')
  }, [tela])`

if (!source.includes("window.location.replace('/workspace?module=compras')")) {
  if (!source.includes(marker)) throw new Error('Ponto de integração da rota de compras não encontrado.')
  source = source.replace(marker, replacement)
}

fs.writeFileSync(path, source)
