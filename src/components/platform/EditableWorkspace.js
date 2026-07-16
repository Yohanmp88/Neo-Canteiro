'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArchiveRestore,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Edit3,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { getModuleDefinition } from '@/lib/moduleDefinitions'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400'

function textValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function formatField(field, value) {
  if (value === null || value === undefined || value === '') return '—'

  if (field.type === 'currency') {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  if (field.type === 'date') {
    const date = new Date(`${value}T12:00:00`)
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR')
  }

  if (field.type === 'number') {
    return Number(value).toLocaleString('pt-BR')
  }

  return String(value)
}

function statusClass(status) {
  const normalized = String(status || '').toLowerCase()

  if (/(conclu|recebid|pago|aprovad|ativo|homologado|disponível|vigente|fechado|atualizada)/.test(normalized)) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  }

  if (/(atras|vencid|bloquead|rejeitad|perdido|esgotado|cancelado)/.test(normalized)) {
    return 'bg-red-50 text-red-700 ring-red-200'
  }

  if (/(revis|baixo|aguardando|cotação|conferência|parcial|rascunho)/.test(normalized)) {
    return 'bg-amber-50 text-amber-700 ring-amber-200'
  }

  if (normalized === 'a') return 'bg-red-50 text-red-700 ring-red-200'
  if (normalized === 'b') return 'bg-amber-50 text-amber-700 ring-amber-200'
  if (normalized === 'c') return 'bg-blue-50 text-blue-700 ring-blue-200'

  return 'bg-blue-50 text-blue-700 ring-blue-200'
}

function needsAttention(record, statusField) {
  const value = String(record?.[statusField] || '').toLowerCase()
  return /(atras|vencid|bloquead|rejeitad|perdido|esgotado|revis|baixo)/.test(value)
}

function isCompleted(record, statusField) {
  const value = String(record?.[statusField] || '').toLowerCase()
  return /(conclu|recebid|pago|aprovad|ativo|homologado|vigente|fechado|atualizada)/.test(value)
}

function emptyForm(definition) {
  return Object.fromEntries(definition.fields.map((field) => [field.key, field.type === 'number' || field.type === 'currency' ? '' : '']))
}

function FormField({ field, value, onChange, disabled }) {
  const common = {
    id: field.key,
    value: value ?? '',
    disabled,
    required: field.required,
    onChange: (event) => onChange(field.key, event.target.value),
    className: inputClass,
  }

  if (field.type === 'textarea') {
    return <textarea {...common} rows={4} placeholder={field.label} />
  }

  if (field.type === 'select') {
    return (
      <select {...common}>
        <option value="">Selecione</option>
        {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    )
  }

  return (
    <input
      {...common}
      type={field.type === 'currency' ? 'number' : field.type}
      min={field.min}
      max={field.max}
      step={field.step || (field.type === 'currency' ? '0.01' : undefined)}
      placeholder={field.label}
    />
  )
}

function RecordModal({ definition, record, open, saving, onClose, onSave }) {
  const [form, setForm] = useState(() => record ? { ...record } : emptyForm(definition))

  if (!open) return null

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    await onSave(form)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm md:items-center md:p-6">
      <form onSubmit={submit} className="max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:max-w-4xl md:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{record ? 'Editar registro' : 'Novo registro'}</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">{definition.singular}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-150px)] overflow-y-auto px-5 py-5 md:px-7">
          <div className="grid gap-4 md:grid-cols-2">
            {definition.fields.map((field) => (
              <label key={field.key} className={field.full ? 'md:col-span-2' : ''}>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  {field.label}{field.required ? ' *' : ''}
                </span>
                <FormField field={field} value={form[field.key]} onChange={change} disabled={saving} />
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 md:px-7">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Salvando...' : 'Salvar registro'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ConfirmDelete({ record, open, saving, onClose, onConfirm }) {
  if (!open || !record) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Trash2 size={22} />
        </div>
        <h2 className="mt-5 text-xl font-black text-slate-900">Excluir este registro?</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">A exclusão remove o item da visualização. No banco profissional, o registro permanece arquivado no histórico de auditoria.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Cancelar</button>
          <button onClick={onConfirm} disabled={saving} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-60">{saving ? 'Excluindo...' : 'Excluir'}</button>
        </div>
      </div>
    </div>
  )
}

export function EditableWorkspace({ moduleKey, obra, user, canEdit = true }) {
  const definition = getModuleDefinition(moduleKey)
  const {
    records,
    loading,
    saving,
    error,
    source,
    create,
    update,
    remove,
    duplicate,
    reload,
    resetDemo,
  } = useWorkspaceRecords(moduleKey, obra?.id, user)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [sort, setSort] = useState('updated_desc')
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const statusField = definition?.statusField
  const valueField = definition?.valueField

  const statusOptions = useMemo(() => {
    if (!statusField) return []
    const fromRecords = records.map((record) => record[statusField]).filter(Boolean)
    const field = definition.fields.find((item) => item.key === statusField)
    return Array.from(new Set([...(field?.options || []), ...fromRecords]))
  }, [definition, records, statusField])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const result = records.filter((record) => {
      const matchesSearch = !term || definition.fields.some((field) => String(record[field.key] ?? '').toLowerCase().includes(term))
      const matchesStatus = statusFilter === 'todos' || String(record[statusField] || '') === statusFilter
      return matchesSearch && matchesStatus
    })

    return [...result].sort((a, b) => {
      if (sort === 'updated_asc') return String(a.updated_at || '').localeCompare(String(b.updated_at || ''))
      if (sort === 'name_asc') {
        const key = definition.fields[0]?.key
        return String(a[key] || '').localeCompare(String(b[key] || ''), 'pt-BR')
      }
      if (sort === 'value_desc' && valueField) return Number(b[valueField] || 0) - Number(a[valueField] || 0)
      return String(b.updated_at || '').localeCompare(String(a.updated_at || ''))
    })
  }, [records, search, statusFilter, sort, definition, statusField, valueField])

  const metrics = useMemo(() => ({
    total: records.length,
    attention: records.filter((record) => needsAttention(record, statusField)).length,
    completed: records.filter((record) => isCompleted(record, statusField)).length,
    totalValue: valueField ? records.reduce((sum, record) => sum + Number(record[valueField] || 0), 0) : null,
  }), [records, statusField, valueField])

  if (!definition) return null

  const visibleFields = definition.fields.filter((field) => field.type !== 'textarea').slice(0, 6)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    setModalOpen(true)
  }

  const save = async (form) => {
    if (editing) await update(editing.id, form)
    else await create(form)
    setModalOpen(false)
    setEditing(null)
  }

  const exportCsv = () => {
    const headers = definition.fields.map((field) => field.label)
    const lines = filtered.map((record) => definition.fields.map((field) => {
      const value = String(record[field.key] ?? '').replaceAll('"', '""')
      return `"${value}"`
    }).join(';'))
    const csv = `\ufeff${headers.join(';')}\n${lines.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${moduleKey}-${obra?.nome || 'neocanteiro'}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <RecordModal
        key={`${moduleKey}-${editing?.id || 'new'}-${modalOpen}`}
        definition={definition}
        record={editing}
        open={modalOpen}
        saving={saving}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={save}
      />
      <ConfirmDelete
        record={deleting}
        open={Boolean(deleting)}
        saving={saving}
        onClose={() => setDeleting(null)}
        onConfirm={async () => { await remove(deleting.id); setDeleting(null) }}
      />

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{obra?.nome || 'NeoCanteiro'}</p>
              <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ring-1 ${source === 'supabase' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>
                {source === 'supabase' ? 'Banco sincronizado' : 'Modo demonstração'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{definition.title}</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">{definition.description}</p>
          </div>

          {canEdit && (
            <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98]">
              <Plus size={18} /> Novo {definition.singular}
            </button>
          )}
        </div>

        <div className="grid gap-3 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4 md:p-5">
          <Metric label="Registros" value={metrics.total} icon={<FileSpreadsheet size={17} />} />
          <Metric label="Precisam de atenção" value={metrics.attention} tone={metrics.attention > 0 ? 'danger' : 'default'} icon={<AlertTriangle size={17} />} />
          <Metric label="Concluídos / ativos" value={metrics.completed} tone="success" icon={<CheckCircle2 size={17} />} />
          <Metric label={valueField ? 'Valor acumulado' : 'Última atualização'} value={valueField ? metrics.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : (records[0]?.updated_at ? new Date(records[0].updated_at).toLocaleDateString('pt-BR') : '—')} icon={<RefreshCw size={17} />} />
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar em ${definition.title.toLowerCase()}...`} className={`${inputClass} pl-10`} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:flex">
            {statusField && (
              <div className="relative">
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={`${inputClass} min-w-44 appearance-none pr-9`}>
                  <option value="todos">Todos os status</option>
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            )}

            <select value={sort} onChange={(event) => setSort(event.target.value)} className={`${inputClass} min-w-44`}>
              <option value="updated_desc">Mais recentes</option>
              <option value="updated_asc">Mais antigos</option>
              <option value="name_asc">Ordem alfabética</option>
              {valueField && <option value="value_desc">Maior valor</option>}
            </select>

            <button onClick={reload} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50" title="Atualizar">
              <RefreshCw size={16} /> Atualizar
            </button>
            <button onClick={exportCsv} disabled={!filtered.length} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <Download size={16} /> Exportar CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
            <AlertTriangle size={17} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center text-sm font-black text-blue-600"><RefreshCw className="mr-2 animate-spin" size={18} /> Carregando registros...</div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><FileSpreadsheet size={24} /></div>
            <h3 className="mt-4 text-base font-black text-slate-900">Nenhum registro encontrado</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Ajuste os filtros ou cadastre um novo item.</p>
            {source === 'local' && records.length === 0 && canEdit && (
              <button onClick={resetDemo} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600"><ArchiveRestore size={15} /> Restaurar dados demonstrativos</button>
            )}
          </div>
        ) : (
          <>
            <div className="mt-5 hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-500">
                    {visibleFields.map((field) => <th key={field.key} className="px-3 py-3">{field.label}</th>)}
                    <th className="px-3 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((record) => (
                    <tr key={record.id} className="group hover:bg-slate-50/80">
                      {visibleFields.map((field, index) => (
                        <td key={field.key} className={`max-w-56 px-3 py-4 text-sm ${index === 0 ? 'font-black text-slate-900' : 'font-medium text-slate-600'}`}>
                          {field.key === statusField ? (
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase ring-1 ${statusClass(record[field.key])}`}>{textValue(record[field.key])}</span>
                          ) : (
                            <span className="block truncate" title={textValue(record[field.key])}>{formatField(field, record[field.key])}</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-1">
                          {canEdit && <ActionButton label="Editar" onClick={() => openEdit(record)} icon={<Edit3 size={15} />} />}
                          {canEdit && <ActionButton label="Duplicar" onClick={() => duplicate(record)} icon={<Copy size={15} />} />}
                          {canEdit && <ActionButton label="Excluir" danger onClick={() => setDeleting(record)} icon={<Trash2 size={15} />} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 lg:hidden">
              {filtered.map((record) => (
                <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{textValue(record[visibleFields[0]?.key])}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-400">Atualizado em {record.updated_at ? new Date(record.updated_at).toLocaleString('pt-BR') : '—'}</p>
                    </div>
                    {statusField && record[statusField] && <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black uppercase ring-1 ${statusClass(record[statusField])}`}>{record[statusField]}</span>}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {visibleFields.slice(1, 5).map((field) => (
                      <div key={field.key} className="min-w-0">
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{field.label}</p>
                        <p className="mt-1 truncate text-xs font-bold text-slate-700">{formatField(field, record[field.key])}</p>
                      </div>
                    ))}
                  </div>

                  {canEdit && (
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                      <button onClick={() => openEdit(record)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-50 px-2 py-2 text-[10px] font-black text-blue-700"><Edit3 size={13} /> Editar</button>
                      <button onClick={() => duplicate(record)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-2 py-2 text-[10px] font-black text-slate-600"><Copy size={13} /> Copiar</button>
                      <button onClick={() => setDeleting(record)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-50 px-2 py-2 text-[10px] font-black text-red-600"><Trash2 size={13} /> Excluir</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function Metric({ label, value, icon, tone = 'default' }) {
  const toneClass = tone === 'danger'
    ? 'bg-red-50 text-red-700 ring-red-100'
    : tone === 'success'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      : 'bg-white text-slate-900 ring-slate-200'

  return (
    <div className={`rounded-2xl p-4 ring-1 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-wider opacity-60">{label}</p>
        <span className="opacity-60">{icon}</span>
      </div>
      <p className="mt-2 truncate text-xl font-black tracking-tight">{value}</p>
    </div>
  )
}

function ActionButton({ label, icon, onClick, danger = false }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className={`rounded-xl p-2 transition ${danger ? 'text-slate-400 hover:bg-red-50 hover:text-red-600' : 'text-slate-400 hover:bg-blue-50 hover:text-blue-700'}`}>
      {icon}
    </button>
  )
}
