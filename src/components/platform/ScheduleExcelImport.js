'use client'

import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react'
import { parseScheduleExcel } from '@/lib/importScheduleExcel'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
}

export function ScheduleExcelImport({ canEdit, onImport }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [reading, setReading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const chooseFile = () => {
    setError('')
    setSuccess('')
    inputRef.current?.click()
  }

  const readFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setReading(true)
    setError('')
    setSuccess('')

    try {
      setPreview(await parseScheduleExcel(file))
    } catch (readError) {
      setPreview(null)
      setError(readError?.message || 'Não foi possível interpretar a planilha.')
    } finally {
      setReading(false)
    }
  }

  const confirmImport = async () => {
    if (!preview?.tasks?.length || !onImport) return

    setImporting(true)
    setError('')
    setSuccess('')

    try {
      const result = await onImport(preview.tasks)
      setSuccess(`${result?.created || 0} atividade(s) adicionada(s) e ${result?.updated || 0} atualizada(s).`)
      setPreview(null)
    } catch (importError) {
      setError(importError?.message || 'Não foi possível importar o cronograma.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={readFile} className="hidden" />

      <button
        type="button"
        onClick={chooseFile}
        disabled={!canEdit || reading || importing}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        title={!canEdit ? 'Seu perfil possui acesso somente para leitura.' : 'Importar cronograma do Excel'}
      >
        {reading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {reading ? 'Lendo planilha...' : 'Importar Excel'}
      </button>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold leading-4 text-red-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {success && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold leading-4 text-emerald-700">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> {success}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm md:items-center md:p-6">
          <div className="max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:max-w-4xl md:rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"><FileSpreadsheet size={19} /></span>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">Prévia da importação</p>
                  <h2 className="mt-1 truncate text-base font-black text-slate-950">{preview.fileName}</h2>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Aba: {preview.sheetName} · {preview.tasks.length} atividade(s) encontrada(s)</p>
                </div>
              </div>
              <button type="button" onClick={() => setPreview(null)} disabled={importing} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"><X size={19} /></button>
            </div>

            <div className="max-h-[calc(92vh-150px)] overflow-y-auto px-5 py-5 md:px-7">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[10px] font-semibold leading-5 text-blue-800">
                O NeoCanteiro reconhece colunas como Atividade, Serviço, Tarefa, Descrição, Início, Término e Progresso. Atividades com o mesmo ID ou nome serão atualizadas; as demais serão adicionadas.
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>{['#', 'Atividade', 'Início', 'Término', 'Progresso'].map((header) => <th key={header} className="whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">{header}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.tasks.slice(0, 12).map((task, index) => (
                      <tr key={`${task.external_id || task.nome}-${index}`} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2.5 text-[10px] font-bold text-slate-400">{index + 1}</td>
                        <td className="min-w-72 px-3 py-2.5 text-[11px] font-bold text-slate-800">{task.nome}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold text-slate-500">{formatDate(task.data_inicio)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold text-slate-500">{formatDate(task.data_termino)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[10px] font-black text-blue-600">{task.progresso}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.tasks.length > 12 && <p className="mt-3 text-center text-[9px] font-black uppercase tracking-wider text-slate-400">+ {preview.tasks.length - 12} atividade(s) não exibida(s) na prévia</p>}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 md:px-7">
              <button type="button" onClick={() => setPreview(null)} disabled={importing} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={confirmImport} disabled={importing} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60">
                {importing ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                {importing ? 'Importando...' : `Importar ${preview.tasks.length} atividade(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
