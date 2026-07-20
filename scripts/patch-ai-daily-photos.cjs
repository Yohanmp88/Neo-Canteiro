const fs = require('fs')

const path = 'src/app/page.js'
let source = fs.readFileSync(path, 'utf8')

function replaceRequired(search, replacement, label) {
  if (source.includes(replacement)) return
  if (!source.includes(search)) throw new Error(`Trecho não encontrado: ${label}`)
  source = source.replace(search, replacement)
}

replaceRequired(
  "import { ScheduleExcelImport } from '@/components/platform/ScheduleExcelImport'",
  "import { ScheduleExcelImport } from '@/components/platform/ScheduleExcelImport'\nimport { AIWorkspace } from '@/components/platform/AIWorkspace'",
  'importação da IA',
)

replaceRequired(
  "              {['materiais', 'financeiro', 'orcamento', 'ia'].includes(tela) && <ModulePlaceholder tela={tela} setTela={setTela} />}",
  "              {tela === 'ia' && <AIWorkspace obra={obraAtualSegura} user={user} />}\n              {['materiais', 'financeiro', 'orcamento'].includes(tela) && <ModulePlaceholder tela={tela} setTela={setTela} />}",
  'renderização da IA',
)

fs.writeFileSync(path, source)
