const fs = require('fs')

const path = 'src/app/page.js'
let source = fs.readFileSync(path, 'utf8')

const oldHeader = "          <Header userProfile={{ ...userProfile, nome: userProfile?.nome || user.email?.split('@')[0], tipo: role }} obras={obrasVisiveis} obraSelecionadaId={obraAtualSegura.id} onObraChange={setObraId} />"
const newHeader = "          <Header obras={obrasVisiveis} obraSelecionadaId={obraAtualSegura.id} onObraChange={setObraId} canCreateWork={permissaoAdmin} onCreateWork={() => setTela('usuarios')} />"

if (source.includes(oldHeader)) source = source.replace(oldHeader, newHeader)
else if (!source.includes(newHeader)) throw new Error('Cabeçalho principal não encontrado')

const oldSection = `          <section className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 custom-scrollbar">
            <div className="mb-4 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div />
                {permissaoAdmin && <button onClick={() => setTela('usuarios')} className={buttonPrimaryClass}>Nova Obra</button>}
              </div>
            </div>

            <div className="animate-fade-in">`

const newSection = `          <section className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 lg:px-8 lg:py-5">
            <div className="animate-fade-in">`

if (source.includes(oldSection)) source = source.replace(oldSection, newSection)
else if (!source.includes(newSection)) throw new Error('Área de conteúdo principal não encontrada')

fs.writeFileSync(path, source)
console.log('Cabeçalho e espaçamento do dashboard atualizados.')
