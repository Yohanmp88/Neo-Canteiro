import * as XLSX from 'xlsx'

function cleanText(value) {
  return String(value ?? '').trim()
}

function safeFileName(value) {
  return cleanText(value || 'obra')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function dateOnly(value) {
  const raw = cleanText(value)
  if (!raw) return ''
  const date = new Date(`${raw.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? raw : date
}

function durationInDays(startValue, endValue) {
  const start = dateOnly(startValue)
  const end = dateOnly(endValue)
  if (!(start instanceof Date) || !(end instanceof Date)) return ''
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1)
}

function taskStatus(task) {
  const progress = Number(task?.progresso || 0)
  const endValue = task?.data_termino || task?.termino
  const end = endValue ? new Date(`${String(endValue).slice(0, 10)}T23:59:59`) : null

  if (progress >= 100) return 'Concluída'
  if (end && !Number.isNaN(end.getTime()) && end < new Date()) return 'Atrasada'
  if (progress > 0) return 'Em andamento'
  return 'Não iniciada'
}

function applySheetLayout(sheet, widths) {
  sheet['!cols'] = widths.map((wch) => ({ wch }))
  sheet['!autofilter'] = { ref: sheet['!ref'] }
  sheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' }
}

function setDateFormats(sheet, range, columns) {
  if (!range) return
  const decoded = XLSX.utils.decode_range(range)
  for (let row = decoded.s.r + 1; row <= decoded.e.r; row += 1) {
    columns.forEach((column) => {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })]
      if (cell?.v instanceof Date || cell?.t === 'd') cell.z = 'dd/mm/yyyy'
    })
  }
}

export function exportScheduleToExcel({ obra, tarefas = [] }) {
  const tasks = Array.isArray(tarefas) ? tarefas : []
  const progress = tasks.length
    ? Math.round(tasks.reduce((total, task) => total + Number(task?.progresso || 0), 0) / tasks.length)
    : Number(obra?.progresso || 0)

  const completed = tasks.filter((task) => Number(task?.progresso || 0) >= 100).length
  const delayed = tasks.filter((task) => taskStatus(task) === 'Atrasada').length
  const inProgress = tasks.filter((task) => taskStatus(task) === 'Em andamento').length

  const summaryRows = [
    ['NEOCANTEIRO — CRONOGRAMA DA OBRA', ''],
    ['Obra', cleanText(obra?.nome) || 'Não informada'],
    ['Cliente', cleanText(obra?.cliente) || 'Não informado'],
    ['Responsável técnico', cleanText(obra?.responsavel) || 'Não informado'],
    ['Endereço', cleanText(obra?.endereco) || 'Não informado'],
    ['Etapa atual', cleanText(obra?.etapa) || 'Não informada'],
    ['Status da obra', cleanText(obra?.status) || 'Não informado'],
    ['Data de início', dateOnly(obra?.data_inicio)],
    ['Prazo final', dateOnly(obra?.prazo_final || obra?.previsao_entrega || obra?.previsaoEntrega)],
    ['', ''],
    ['INDICADORES', 'VALOR'],
    ['Total de atividades', tasks.length],
    ['Atividades concluídas', completed],
    ['Atividades em andamento', inProgress],
    ['Atividades atrasadas', delayed],
    ['Progresso físico médio', progress / 100],
    ['', ''],
    ['Exportado em', new Date()],
    ['Origem', 'NeoCanteiro — Gestão inteligente de obras com IA'],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows, { cellDates: true })
  summarySheet['!cols'] = [{ wch: 29 }, { wch: 54 }]
  summarySheet['!merges'] = [XLSX.utils.decode_range('A1:B1')]
  ;['B8', 'B9', 'B18'].forEach((address) => {
    if (summarySheet[address]) summarySheet[address].z = 'dd/mm/yyyy'
  })
  if (summarySheet.B16) summarySheet.B16.z = '0%'

  const scheduleRows = tasks.map((task, index) => {
    const start = task?.data_inicio || task?.inicio
    const end = task?.data_termino || task?.termino
    const taskProgress = Math.max(0, Math.min(100, Number(task?.progresso || 0)))

    return {
      Ordem: index + 1,
      ID: cleanText(task?.id),
      Atividade: cleanText(task?.nome) || 'Atividade sem nome',
      'Data de início': dateOnly(start),
      'Data de término': dateOnly(end),
      'Duração (dias)': Number(task?.duracao || durationInDays(start, end) || 0) || '',
      'Progresso (%)': taskProgress / 100,
      Situação: taskStatus(task),
      Responsável: cleanText(task?.responsavel || task?.responsavel_nome),
      Etapa: cleanText(task?.etapa || task?.categoria),
      Observações: cleanText(task?.observacoes || task?.descricao),
    }
  })

  const scheduleSheet = XLSX.utils.json_to_sheet(scheduleRows, {
    header: [
      'Ordem',
      'ID',
      'Atividade',
      'Data de início',
      'Data de término',
      'Duração (dias)',
      'Progresso (%)',
      'Situação',
      'Responsável',
      'Etapa',
      'Observações',
    ],
    cellDates: true,
  })

  if (!tasks.length) {
    XLSX.utils.sheet_add_aoa(scheduleSheet, [['Nenhuma atividade cadastrada.']], { origin: 'A2' })
  }

  applySheetLayout(scheduleSheet, [8, 38, 44, 15, 15, 15, 15, 18, 24, 22, 42])
  setDateFormats(scheduleSheet, scheduleSheet['!ref'], [3, 4])

  const scheduleRange = scheduleSheet['!ref'] ? XLSX.utils.decode_range(scheduleSheet['!ref']) : null
  if (scheduleRange) {
    for (let row = 1; row <= scheduleRange.e.r; row += 1) {
      const progressCell = scheduleSheet[XLSX.utils.encode_cell({ r: row, c: 6 })]
      if (progressCell && typeof progressCell.v === 'number') progressCell.z = '0%'
    }
  }

  const workbook = XLSX.utils.book_new()
  workbook.Props = {
    Title: `Cronograma — ${cleanText(obra?.nome) || 'Obra'}`,
    Subject: 'Cronograma físico de obra exportado pelo NeoCanteiro',
    Author: 'NeoCanteiro',
    Company: 'NeoCanteiro',
    CreatedDate: new Date(),
  }

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo')
  XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Cronograma')

  const today = new Date().toISOString().slice(0, 10)
  const fileName = `cronograma-${safeFileName(obra?.nome)}-${today}.xlsx`
  XLSX.writeFile(workbook, fileName, { compression: true, cellDates: true })
}
