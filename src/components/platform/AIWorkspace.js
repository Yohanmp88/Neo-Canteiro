'use client'

import { useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Camera,
  ExternalLink,
  Image as ImageIcon,
  PackageCheck,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useDiarios } from '@/hooks/useDiarios'
import { useTimeline } from '@/hooks/useTimeline'
import { useObraPhotos } from '@/hooks/useObraPhotos'
import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'
import { formatDeliveryQuantity, isReceivedStatus, materialDeliveryFromRecord } from '@/lib/materialDelivery'

const QUICK_QUESTIONS = [
  'O que foi feito hoje?',
  'O que foi feito ontem?',
  'O que foi feito no dia 17/07?',
]

function dateKey(value) {
  const raw = String(value || '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : ''
}

function localToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(value, amount) {
  const date = new Date(`${value}T12:00:00`)
  date.setDate(date.getDate() + amount)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function resolveQuestionDate(question) {
  const normalized = normalizeText(question)
  const today = localToday()

  if (normalized.includes('anteontem')) return addDays(today, -2)
  if (normalized.includes('ontem')) return addDays(today, -1)
  if (normalized.includes('hoje')) return today

  const iso = normalized.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/)
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, '0')}-${String(iso[3]).padStart(2, '0')}`

  const brazilian = normalized.match(/\b(?:dia\s+)?(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/)
  if (brazilian) {
    const day = String(brazilian[1]).padStart(2, '0')
    const month = String(brazilian[2]).padStart(2, '0')
    let year = brazilian[3] || String(new Date().getFullYear())
    if (year.length === 2) year = `20${year}`
    return `${year}-${month}-${day}`
  }

  return today
}

function formatLongDate(value) {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function cleanText(value) {
  return String(value || '').trim()
}

function uniqueBy(items, getKey) {
  const map = new Map()
  items.forEach((item) => {
    const key = getKey(item)
    if (key && !map.has(key)) map.set(key, item)
  })
  return Array.from(map.values())
}

function diarySummary(diaries) {
  const services = uniqueBy(
    diaries
      .map((diary) => cleanText(diary.servicos_executados || diary.atividades))
      .filter(Boolean),
    (value) => value.toLowerCase(),
  )

  const occurrences = uniqueBy(
    diaries
      .map((diary) => cleanText(diary.ocorrencias || diary.observacoes))
      .filter(Boolean),
    (value) => value.toLowerCase(),
  )

  const visits = uniqueBy(
    diaries
      .map((diary) => cleanText(diary.visitas || diary.visitas_fiscalizacoes))
      .filter(Boolean),
    (value) => value.toLowerCase(),
  )

  return { services, occurrences, visits }
}

function materialDate(record) {
  return dateKey(record.data_recebimento || record.recebido_em || record.data_entrega || record.updated_at)
}

function materialLabel(record) {
  const delivery = materialDeliveryFromRecord(record)
  const quantity = formatDeliveryQuantity(delivery)
  return [quantity, delivery.item].filter(Boolean).join(' de ')
}

function buildDailyAnswer({ date, diaries, materials, photos }) {
  const summary = diarySummary(diaries)
  const lines = []

  if (summary.services.length) {
    lines.push(summary.services.length === 1 ? summary.services[0] : summary.services.map((service) => `• ${service}`).join('\n'))
  } else {
    lines.push('Não encontrei serviços executados registrados no diário desta data.')
  }

  if (materials.length) {
    lines.push(`Materiais recebidos: ${materials.map(materialLabel).join('; ')}.`)
  }

  if (summary.occurrences.length) {
    lines.push(`Ocorrências: ${summary.occurrences.join(' ')}`)
  }

  if (summary.visits.length) {
    lines.push(`Visitas e fiscalizações: ${summary.visits.join(' ')}`)
  }

  if (photos.length) {
    lines.push(`${photos.length} ${photos.length === 1 ? 'foto foi vinculada' : 'fotos foram vinculadas'} a esse dia e ${photos.length === 1 ? 'está exibida' : 'estão exibidas'} abaixo.`)
  } else {
    lines.push('Não encontrei registro fotográfico vinculado a essa data.')
  }

  return {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    date,
    title: `Resumo de ${formatLongDate(date)}`,
    text: lines.join('\n\n'),
    photos,
    materials,
  }
}

function PhotoGallery({ photos }) {
  const [selected, setSelected] = useState(null)
  if (!photos.length) return null

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.slice(0, 6).map((photo, index) => (
          <button
            key={photo.id || photo.url || index}
            type="button"
            onClick={() => setSelected(photo)}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left shadow-sm"
          >
            <img src={photo.url} alt={photo.title || `Foto ${index + 1} da obra`} className="h-28 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-32" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent px-2.5 pb-2 pt-8 text-[9px] font-bold text-white">
              <span className="block truncate">{photo.title || `Registro fotográfico ${index + 1}`}</span>
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => { window.location.href = '/workspace?module=fotos' }}
        className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-700 hover:text-blue-800"
      >
        Ver acervo fotográfico <ArrowRight size={13} />
      </button>

      {selected && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <div className="overflow-hidden rounded-3xl bg-slate-950 shadow-2xl">
              <img src={selected.url} alt={selected.title || 'Foto da obra'} className="max-h-[78vh] w-full object-contain" />
              <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-3 text-white">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{selected.title || 'Registro fotográfico'}</p>
                  {selected.description && <p className="mt-0.5 truncate text-xs text-slate-300">{selected.description}</p>}
                </div>
                <a href={selected.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/20">
                  Abrir imagem <ExternalLink size={14} />
                </a>
              </div>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="mx-auto mt-3 block rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-900">Fechar</button>
          </div>
        </div>
      )}
    </>
  )
}

function ChatMessage({ message }) {
  const assistant = message.role === 'assistant'

  return (
    <div className={`flex gap-3 ${assistant ? '' : 'justify-end'}`}>
      {assistant && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Bot size={18} /></span>}
      <div className={`max-w-[92%] rounded-3xl px-4 py-3 sm:max-w-[82%] ${assistant ? 'border border-slate-200 bg-white text-slate-700 shadow-sm' : 'bg-slate-900 text-white'}`}>
        {message.title && <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">{message.title}</p>}
        <p className="whitespace-pre-line text-sm font-medium leading-6">{message.text}</p>
        {assistant && <PhotoGallery photos={message.photos || []} />}
      </div>
      {!assistant && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700"><UserRound size={17} /></span>}
    </div>
  )
}

export function AIWorkspace({ obra, user }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      title: 'IA da Obra',
      text: 'Pergunte o que foi executado hoje ou em qualquer data. Vou consultar o diário, os materiais recebidos e os registros fotográficos da obra.',
      photos: [],
    },
  ])
  const inputRef = useRef(null)
  const { diarios = [], loading: diariesLoading } = useDiarios(obra?.id)
  const { records: workspaceDiaries = [], loading: workspaceDiariesLoading } = useWorkspaceRecords('diario', obra?.id, user)
  const { records: materialRecords = [], loading: materialsLoading } = useWorkspaceRecords('materiais', obra?.id, user)
  const { photos: unifiedPhotos = [], loading: unifiedPhotosLoading, reload: reloadPhotos } = useObraPhotos(obra?.id)
  const { eventos = [], loading: timelineLoading } = useTimeline(obra?.id, user)

  const photos = unifiedPhotos

  const allDiaries = useMemo(() => uniqueBy(
    [...diarios, ...workspaceDiaries]
      .filter(Boolean)
      .sort((a, b) => String(b.data || b.created_at || '').localeCompare(String(a.data || a.created_at || ''))),
    (diary) => String(diary.id || `${dateKey(diary.data || diary.created_at)}:${cleanText(diary.servicos_executados || diary.atividades)}`),
  ), [diarios, workspaceDiaries])

  const loading = diariesLoading || workspaceDiariesLoading || materialsLoading || unifiedPhotosLoading || timelineLoading

  const ask = async (value = question) => {
    const text = cleanText(value)
    if (!text || loading) return

    const targetDate = resolveQuestionDate(text)
    const freshPhotos = await reloadPhotos()
    const dayDiaries = allDiaries.filter((diary) => dateKey(diary.data || diary.created_at) === targetDate)
    const dayMaterials = materialRecords.filter((record) => isReceivedStatus(record.recebimento_status || record.status_recebimento) && materialDate(record) === targetDate)
    const dayPhotos = freshPhotos.filter((photo) => photo.date === targetDate)

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', text },
      buildDailyAnswer({ date: targetDate, diaries: dayDiaries, materials: dayMaterials, photos: dayPhotos }),
    ])
    setQuestion('')
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="flex min-h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50/70 shadow-sm">
        <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Sparkles size={20} /></span>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">Inteligência operacional</p>
              <h1 className="truncate text-lg font-black tracking-tight text-slate-950">IA da Obra · {obra?.nome || 'NeoCanteiro'}</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
        </div>

        <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
          <form onSubmit={(event) => { event.preventDefault(); ask() }} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  ask()
                }
              }}
              placeholder={loading ? 'Carregando dados da obra...' : 'Ex.: O que foi feito no dia 17/07?'}
              disabled={loading}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
            />
            <button type="submit" disabled={!question.trim() || loading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Enviar pergunta">
              <Send size={17} />
            </button>
          </form>
        </div>
      </section>

      <aside className="space-y-3">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900"><CalendarDays size={16} className="text-blue-600" /><h2 className="text-xs font-black uppercase tracking-wider">Perguntas rápidas</h2></div>
          <div className="mt-3 grid gap-2">
            {QUICK_QUESTIONS.map((item) => (
              <button key={item} type="button" onClick={() => ask(item)} disabled={loading} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50">
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Fontes consultadas</p>
          <div className="mt-3 space-y-2 text-xs font-bold text-slate-600">
            <p className="flex items-center gap-2"><Bot size={15} className="text-blue-600" /> {allDiaries.length} diário{allDiaries.length === 1 ? '' : 's'}</p>
            <p className="flex items-center gap-2"><PackageCheck size={15} className="text-emerald-600" /> {materialRecords.length} material{materialRecords.length === 1 ? '' : 'is'}</p>
            <p className="flex items-center gap-2"><Camera size={15} className="text-violet-600" /> {photos.length} foto{photos.length === 1 ? '' : 's'}</p>
          </div>
        </section>

        <button type="button" onClick={() => { window.location.href = '/workspace?module=fotos' }} className="flex w-full items-center justify-between rounded-[1.5rem] border border-violet-200 bg-violet-50 px-4 py-3 text-left text-violet-800 shadow-sm hover:bg-violet-100">
          <span className="flex items-center gap-2 text-xs font-black"><ImageIcon size={16} /> Abrir acervo de fotos</span>
          <ArrowRight size={14} />
        </button>
      </aside>
    </div>
  )
}
