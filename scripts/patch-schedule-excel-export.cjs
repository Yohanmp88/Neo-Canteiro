const fs = require('fs')

const path = 'src/app/page.js'
let source = fs.readFileSync(path, 'utf8')

function replaceOnce(search, replacement, label) {
  if (source.includes(replacement)) return
  if (!source.includes(search)) throw new Error(`Trecho não encontrado: ${label}`)
  source = source.replace(search, replacement)
}

replaceOnce(
  "import { canEditModule, canViewModule, normalizeRole } from '@/lib/accessControl'",
  "import { canEditModule, canViewModule, normalizeRole } from '@/lib/accessControl'\nimport { exportScheduleToExcel } from '@/lib/exportScheduleExcel'",
  'importação do exportador Excel',
)

replaceOnce(
  "  const progressoGlobal = total > 0 ? Math.round(tarefas.reduce((a, t) => a + Number(t.progresso), 0) / total) : 0\n\n  return (\n    <div className=\"space-y-6\">",
  "  const progressoGlobal = total > 0 ? Math.round(tarefas.reduce((a, t) => a + Number(t.progresso), 0) / total) : 0\n  const exportarCronograma = () => exportScheduleToExcel({ obra: obraAtual, tarefas })\n\n  return (\n    <div className=\"space-y-6\">\n      <div className=\"flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between\">\n        <div>\n          <p className=\"text-[9px] font-black uppercase tracking-[0.16em] text-blue-600\">Planejamento da obra</p>\n          <h2 className=\"mt-1 text-xl font-black tracking-tight text-slate-950\">Cronograma físico</h2>\n          <p className=\"mt-1 text-xs font-semibold text-slate-500\">Exporte o cronograma completo para abrir, analisar ou compartilhar no Excel.</p>\n        </div>\n        <button\n          type=\"button\"\n          onClick={exportarCronograma}\n          disabled={!tarefas.length}\n          className=\"inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-[0_12px_28px_-18px_rgba(5,150,105,0.8)] transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50\"\n        >\n          Exportar Excel\n        </button>\n      </div>",
  'botão de exportação no cronograma',
)

fs.writeFileSync(path, source)
console.log('Exportação Excel adicionada ao cronograma.')
