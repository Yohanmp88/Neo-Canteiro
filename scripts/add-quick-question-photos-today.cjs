const fs = require('fs')

const path = 'src/components/platform/AIWorkspace.js'
const source = fs.readFileSync(path, 'utf8')
const search = "const QUICK_QUESTIONS = [\n  'O que foi feito hoje?',"
const replacement = "const QUICK_QUESTIONS = [\n  'Fotos do dia',\n  'O que foi feito hoje?',"

if (source.includes("  'Fotos do dia',")) process.exit(0)
if (!source.includes(search)) throw new Error('Lista de perguntas rápidas não encontrada.')

fs.writeFileSync(path, source.replace(search, replacement))
