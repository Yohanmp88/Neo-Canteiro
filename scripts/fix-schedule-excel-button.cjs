const fs = require('fs')

const path = 'src/app/page.js'
let source = fs.readFileSync(path, 'utf8')

const oldButton = `        <button
          type="button"
          onClick={exportarCronograma}
          disabled={!tarefas.length}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-[0_12px_28px_-18px_rgba(5,150,105,0.8)] transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >`

const newButton = `        <button
          type="button"
          onClick={exportarCronograma}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-[0_12px_28px_-18px_rgba(5,150,105,0.8)] transition hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0"
        >`

if (!source.includes(oldButton)) {
  if (!source.includes(newButton)) throw new Error('Botão de exportação Excel não encontrado.')
} else {
  source = source.replace(oldButton, newButton)
}

fs.writeFileSync(path, source)
console.log('Botão de exportação Excel liberado mesmo sem atividades.')
