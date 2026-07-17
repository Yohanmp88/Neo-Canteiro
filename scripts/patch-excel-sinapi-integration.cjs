const fs = require('fs')

function patch(path, operations) {
  let source = fs.readFileSync(path, 'utf8')
  for (const operation of operations) {
    if (!source.includes(operation.search)) {
      if (operation.already && source.includes(operation.already)) continue
      throw new Error(`${path}: trecho não encontrado — ${operation.label}`)
    }
    source = source.replace(operation.search, operation.replace)
  }
  fs.writeFileSync(path, source)
}

patch('src/lib/moduleDefinitions.js', [
  {
    label: 'definição planilhas',
    search: "  documentos: {\n    title: 'Documentos',",
    already: "  planilhas: {\n    title: 'Planilhas Excel',",
    replace: "  planilhas: {\n    title: 'Planilhas Excel',\n    singular: 'planilha',\n    description: 'Importação, visualização, atualização e histórico de planilhas Excel por obra.',\n    statusField: 'status',\n    fields: [\n      { key: 'nome', label: 'Nome da planilha', type: 'text', required: true },\n      { key: 'descricao', label: 'Descrição', type: 'textarea', full: true },\n      { key: 'versao', label: 'Versão', type: 'text' },\n      { key: 'status', label: 'Status', type: 'select', options: ['Publicada', 'Em revisão', 'Arquivada'] },\n    ],\n    seed: [],\n  },\n  documentos: {\n    title: 'Documentos',",
  },
])

patch('src/lib/accessControl.js', [
  {
    label: 'planilhas acesso geral',
    search: "  'dashboard', 'clientes', 'cronograma', 'ia', 'diario', 'fotos',\n  'equipe', 'materiais', 'compras', 'fornecedores', 'financeiro', 'orcamento',",
    already: "  'dashboard', 'clientes', 'cronograma', 'ia', 'diario', 'fotos', 'planilhas',",
    replace: "  'dashboard', 'clientes', 'cronograma', 'ia', 'diario', 'fotos', 'planilhas',\n  'equipe', 'materiais', 'compras', 'fornecedores', 'financeiro', 'orcamento',",
  },
  {
    label: 'planilhas compras financeiro',
    search: "  'dashboard', 'materiais', 'compras', 'fornecedores', 'documentos', 'financeiro',\n  'orcamento', 'composicoes', 'abc', 'medicoes',",
    already: "  'dashboard', 'materiais', 'compras', 'fornecedores', 'documentos', 'planilhas', 'financeiro',",
    replace: "  'dashboard', 'materiais', 'compras', 'fornecedores', 'documentos', 'planilhas', 'financeiro',\n  'orcamento', 'composicoes', 'abc', 'medicoes',",
  },
  {
    label: 'planilhas cliente',
    search: "  'dashboard', 'cronograma', 'ia', 'diario', 'fotos', 'medicoes', 'documentos',\n  'financeiro', 'orcamento', 'abc',",
    already: "  'dashboard', 'cronograma', 'ia', 'diario', 'fotos', 'medicoes', 'documentos', 'planilhas',",
    replace: "  'dashboard', 'cronograma', 'ia', 'diario', 'fotos', 'medicoes', 'documentos', 'planilhas',\n  'financeiro', 'orcamento', 'abc',",
  },
])

patch('src/components/dashboard/Sidebar.js', [
  {
    label: 'ícone planilhas sidebar',
    search: "  History,\n} from 'lucide-react'",
    already: "  TableProperties,\n} from 'lucide-react'",
    replace: "  History,\n  TableProperties,\n} from 'lucide-react'",
  },
  {
    label: 'workspace planilhas sidebar',
    search: "  'documentos',\n  'templates',",
    already: "  'planilhas',\n  'documentos',",
    replace: "  'planilhas',\n  'documentos',\n  'templates',",
  },
  {
    label: 'menu planilhas sidebar',
    search: "      { id: 'documentos', label: 'Documentos', icon: FolderKanban },",
    already: "      { id: 'planilhas', label: 'Planilhas Excel', icon: TableProperties },",
    replace: "      { id: 'planilhas', label: 'Planilhas Excel', icon: TableProperties },\n      { id: 'documentos', label: 'Documentos', icon: FolderKanban },",
  },
])

patch('src/components/dashboard/BottomNav.js', [
  {
    label: 'ícone planilhas bottom nav',
    search: "  History,\n} from 'lucide-react'",
    already: "  TableProperties,\n} from 'lucide-react'",
    replace: "  History,\n  TableProperties,\n} from 'lucide-react'",
  },
  {
    label: 'workspace planilhas bottom nav',
    search: "  'documentos',\n  'templates',",
    already: "  'planilhas',\n  'documentos',",
    replace: "  'planilhas',\n  'documentos',\n  'templates',",
  },
  {
    label: 'lista planilhas bottom nav',
    search: "  { id: 'documentos', label: 'Documentos', icon: FolderKanban },",
    already: "  { id: 'planilhas', label: 'Planilhas Excel', icon: TableProperties },",
    replace: "  { id: 'planilhas', label: 'Planilhas Excel', icon: TableProperties },\n  { id: 'documentos', label: 'Documentos', icon: FolderKanban },",
  },
])

patch('src/app/workspace/page.js', [
  {
    label: 'imports workspaces excel sinapi',
    search: "import { PhotoWorkspace } from '@/components/platform/PhotoWorkspace'\nimport { EDITABLE_MODULE_KEYS",
    already: "import { SpreadsheetWorkspace } from '@/components/platform/SpreadsheetWorkspace'",
    replace: "import { PhotoWorkspace } from '@/components/platform/PhotoWorkspace'\nimport { SinapiWorkspace } from '@/components/platform/SinapiWorkspace'\nimport { SpreadsheetWorkspace } from '@/components/platform/SpreadsheetWorkspace'\nimport { EDITABLE_MODULE_KEYS",
  },
  {
    label: 'render workspaces excel sinapi',
    search: "              ) : moduleKey === 'fotos' ? (\n                <PhotoWorkspace obra={obraAtual} user={user} canEdit={canEditCurrentModule} />\n              ) : (\n                <EditableWorkspace moduleKey={moduleKey} obra={obraAtual} user={user} canEdit={canEditCurrentModule} />\n              )}",
    already: "              ) : moduleKey === 'planilhas' ? (\n                <SpreadsheetWorkspace",
    replace: "              ) : moduleKey === 'fotos' ? (\n                <PhotoWorkspace obra={obraAtual} user={user} canEdit={canEditCurrentModule} />\n              ) : moduleKey === 'planilhas' ? (\n                <SpreadsheetWorkspace obra={obraAtual} user={user} canEdit={canEditCurrentModule} />\n              ) : moduleKey === 'composicoes' ? (\n                <SinapiWorkspace obra={obraAtual} user={user} canEdit={canEditCurrentModule} />\n              ) : (\n                <EditableWorkspace moduleKey={moduleKey} obra={obraAtual} user={user} canEdit={canEditCurrentModule} />\n              )}",
  },
])

patch('src/components/platform/SpreadsheetWorkspace.js', [
  {
    label: 'submitting planilha',
    search: "  const [file, setFile] = useState(null)\n  const [error, setError] = useState('')",
    already: "  const [submitting, setSubmitting] = useState(false)",
    replace: "  const [file, setFile] = useState(null)\n  const [submitting, setSubmitting] = useState(false)\n  const [error, setError] = useState('')",
  },
  {
    label: 'reset submitting planilha',
    search: "    setFile(null)\n    setError('')",
    already: "    setFile(null)\n    setSubmitting(false)\n    setError('')",
    replace: "    setFile(null)\n    setSubmitting(false)\n    setError('')",
  },
  {
    label: 'busy planilha',
    search: "  if (!open) return null\n\n  const changeDataset",
    already: "  const busy = saving || submitting",
    replace: "  if (!open) return null\n  const busy = saving || submitting\n\n  const changeDataset",
  },
  {
    label: 'start submitting planilha',
    search: "    setError('')\n\n    try {\n      validateSpreadsheetFile(file)",
    already: "    setError('')\n    setSubmitting(true)\n\n    try {\n      validateSpreadsheetFile(file)",
    replace: "    setError('')\n    setSubmitting(true)\n\n    try {\n      validateSpreadsheetFile(file)",
  },
  {
    label: 'finish submitting planilha',
    search: "    } catch (submitError) {\n      setError(submitError?.message || 'Não foi possível importar a planilha.')\n    }\n  }",
    already: "    } finally {\n      setSubmitting(false)\n    }\n  }",
    replace: "    } catch (submitError) {\n      setError(submitError?.message || 'Não foi possível importar a planilha.')\n    } finally {\n      setSubmitting(false)\n    }\n  }",
  },
])

let spreadsheet = fs.readFileSync('src/components/platform/SpreadsheetWorkspace.js', 'utf8')
spreadsheet = spreadsheet.replaceAll('disabled={saving}', 'disabled={busy}')
spreadsheet = spreadsheet.replaceAll("{saving ? <Loader2 size={16} className=\"animate-spin\" /> : <Upload size={16} />}", "{busy ? <Loader2 size={16} className=\"animate-spin\" /> : <Upload size={16} />}")
spreadsheet = spreadsheet.replaceAll("{saving ? 'Importando...' : mode === 'update' ? 'Publicar nova versão' : 'Importar planilha'}", "{busy ? 'Importando...' : mode === 'update' ? 'Publicar nova versão' : 'Importar planilha'}")
fs.writeFileSync('src/components/platform/SpreadsheetWorkspace.js', spreadsheet)

console.log('Integração Excel e SINAPI aplicada.')
