function normalizeHeader(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function cleanText(value) {
  return String(value ?? '').trim()
}

const HEADER_ALIASES = {
  id: ['id', 'codigo', 'código', 'cod', 'identificador'],
  nome: ['atividade', 'tarefa', 'servico', 'serviço', 'descricao', 'descrição', 'nome', 'item', 'etapa'],
  data_inicio: ['data de inicio', 'data início', 'inicio', 'início', 'start', 'data inicial', 'inicio previsto'],
  data_termino: ['data de termino', 'data término', 'termino', 'término', 'fim', 'finish', 'data final', 'termino previsto'],
  progresso: ['progresso', 'progresso %', 'percentual', 'percentual concluido', 'concluido', 'concluído', '% concluido', '% concluído'],
}

const NORMALIZED_ALIASES = Object.fromEntries(
  Object.entries(HEADER_ALIASES).map(([key, aliases]) => [key, aliases.map(normalizeHeader)]),
)

function findHeaderIndex(row, aliases) {
  return row.findIndex((cell) => aliases.includes(normalizeHeader(cell)))
}

function detectHeaderRow(rows) {
  const limit = Math.min(rows.length, 25)
  let best = null

  for (let index = 0; index < limit; index += 1) {
    const row = Array.isArray(rows[index]) ? rows[index] : []
    const mapping = Object.fromEntries(
      Object.entries(NORMALIZED_ALIASES).map(([key, aliases]) => [key, findHeaderIndex(row, aliases)]),
    )
    const score = Object.values(mapping).filter((value) => value >= 0).length
    const hasName = mapping.nome >= 0

    if (hasName && (!best || score > best.score)) best = { index, mapping, score }
  }

  return best
}

function pad(number) {
  return String(number).padStart(2, '0')
}

function excelDateToIso(value, XLSX) {
  if (value === null || value === undefined || value === '') return ''

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed?.y && parsed?.m && parsed?.d) return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`
  }

  const raw = cleanText(value)
  if (!raw) return ''

  const isoMatch = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (isoMatch) return `${isoMatch[1]}-${pad(isoMatch[2])}-${pad(isoMatch[3])}`

  const brMatch = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/)
  if (brMatch) {
    const year = brMatch[3].length === 2 ? `20${brMatch[3]}` : brMatch[3]
    return `${year}-${pad(brMatch[2])}-${pad(brMatch[1])}`
  }

  const parsedDate = new Date(raw)
  if (!Number.isNaN(parsedDate.getTime())) {
    return `${parsedDate.getFullYear()}-${pad(parsedDate.getMonth() + 1)}-${pad(parsedDate.getDate())}`
  }

  return ''
}

function parseProgress(value) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') {
    const percent = value > 0 && value <= 1 ? value * 100 : value
    return Math.max(0, Math.min(100, Math.round(percent)))
  }

  const numeric = Number(String(value).replace('%', '').replace(',', '.').trim())
  if (Number.isNaN(numeric)) return 0
  const percent = numeric > 0 && numeric <= 1 ? numeric * 100 : numeric
  return Math.max(0, Math.min(100, Math.round(percent)))
}

function cell(row, index) {
  return index >= 0 ? row[index] : ''
}

function normalizeTask(row, mapping, XLSX, order) {
  const nome = cleanText(cell(row, mapping.nome))
  if (!nome) return null

  return {
    import_order: order,
    external_id: cleanText(cell(row, mapping.id)),
    nome,
    data_inicio: excelDateToIso(cell(row, mapping.data_inicio), XLSX),
    data_termino: excelDateToIso(cell(row, mapping.data_termino), XLSX),
    progresso: parseProgress(cell(row, mapping.progresso)),
  }
}

export async function parseScheduleExcel(file) {
  if (!file) throw new Error('Selecione um arquivo do Excel.')

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(extension)) {
    throw new Error('Formato inválido. Use um arquivo .xlsx, .xls ou .csv.')
  }

  const XLSX = await import('xlsx')
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })

  if (!workbook.SheetNames.length) throw new Error('A planilha não possui abas legíveis.')

  const preferredName = workbook.SheetNames.find((name) => normalizeHeader(name).includes('cronograma'))
  const sheetName = preferredName || workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true })
  const detected = detectHeaderRow(rows)

  if (!detected) {
    throw new Error('Não encontrei uma coluna de Atividade, Serviço, Tarefa ou Descrição. Revise os títulos da primeira linha da tabela.')
  }

  const tasks = rows
    .slice(detected.index + 1)
    .map((row, index) => normalizeTask(Array.isArray(row) ? row : [], detected.mapping, XLSX, index + 1))
    .filter(Boolean)

  if (!tasks.length) throw new Error('Nenhuma atividade válida foi encontrada na planilha.')

  return {
    fileName: file.name,
    sheetName,
    headerRow: detected.index + 1,
    tasks,
    detectedColumns: Object.fromEntries(
      Object.entries(detected.mapping).filter(([, index]) => index >= 0),
    ),
  }
}
