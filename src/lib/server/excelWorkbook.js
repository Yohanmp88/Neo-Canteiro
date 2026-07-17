import 'server-only'
import * as XLSX from 'xlsx'

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function cleanCell(value) {
  if (value instanceof Date) return value.toISOString()
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' || typeof value === 'boolean') return value
  return String(value).trim()
}

function isEmptyRow(row) {
  return !Array.isArray(row) || row.every((cell) => normalizeText(cell) === '')
}

function uniqueHeaders(values) {
  const counts = new Map()

  return values.map((value, index) => {
    const base = String(value || '').trim() || `Coluna ${index + 1}`
    const key = normalizeText(base)
    const count = (counts.get(key) || 0) + 1
    counts.set(key, count)
    return count === 1 ? base : `${base} (${count})`
  })
}

function findGenericHeaderIndex(rows) {
  let bestIndex = -1
  let bestScore = 0

  rows.slice(0, 30).forEach((row, index) => {
    if (!Array.isArray(row)) return
    const nonEmpty = row.filter((cell) => normalizeText(cell) !== '').length
    const textCells = row.filter((cell) => typeof cell === 'string' && normalizeText(cell) !== '').length
    const score = nonEmpty + Math.min(textCells, 5)

    if (nonEmpty >= 2 && score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return bestIndex
}

function sheetRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []

  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  })
}

export function parseGenericWorkbook(buffer) {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true,
    dense: true,
  })

  for (const sheetName of workbook.SheetNames) {
    const rows = sheetRows(workbook, sheetName)
    if (!rows.length) continue

    const headerIndex = findGenericHeaderIndex(rows)
    if (headerIndex < 0) continue

    const rawHeaders = rows[headerIndex].map(cleanCell)
    const lastHeader = rawHeaders.reduce((last, value, index) => normalizeText(value) ? index : last, -1)
    if (lastHeader < 0) continue

    const headers = uniqueHeaders(rawHeaders.slice(0, lastHeader + 1))
    const dataRows = []

    rows.slice(headerIndex + 1).forEach((row) => {
      if (isEmptyRow(row)) return
      const data = {}
      headers.forEach((header, index) => {
        data[header] = cleanCell(row[index])
      })
      if (Object.values(data).some((value) => normalizeText(value) !== '')) dataRows.push(data)
    })

    if (dataRows.length || headers.length) {
      return {
        sheetName,
        headers,
        rows: dataRows,
      }
    }
  }

  throw new Error('Não encontrei uma tabela legível no arquivo. Verifique se a primeira linha da tabela contém os títulos das colunas.')
}

function parseNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const text = String(value ?? '').trim()
  if (!text) return null

  let normalized = text.replace(/R\$/gi, '').replace(/\s/g, '')
  const comma = normalized.lastIndexOf(',')
  const dot = normalized.lastIndexOf('.')

  if (comma > dot) normalized = normalized.replace(/\./g, '').replace(',', '.')
  else if (dot > comma && comma >= 0) normalized = normalized.replace(/,/g, '')
  else if (comma >= 0) normalized = normalized.replace(',', '.')

  normalized = normalized.replace(/[^0-9.-]/g, '')
  const number = Number(normalized)
  return Number.isFinite(number) ? number : null
}

const ALIASES = {
  compositionCode: [
    'codigo da composicao', 'codigo composicao', 'cod composicao', 'codigo do servico',
    'codigo servico', 'codigo sinapi', 'codigo',
  ],
  compositionDescription: [
    'descricao da composicao', 'descricao composicao', 'descricao do servico',
    'descricao servico', 'servico', 'descricao',
  ],
  compositionUnit: ['unidade da composicao', 'unidade composicao', 'unidade do servico', 'unidade'],
  compositionCost: [
    'custo total da composicao', 'custo total composicao', 'preco unitario',
    'valor unitario', 'custo unitario', 'custo total', 'preco', 'valor',
  ],
  category: ['classe', 'grupo', 'categoria', 'tipo de servico'],
  itemType: ['tipo item', 'tipo do item', 'tipo de insumo', 'tipo insumo', 'tipo'],
  itemCode: ['codigo do item', 'codigo item', 'codigo do insumo', 'codigo insumo', 'cod item'],
  itemDescription: ['descricao do item', 'descricao item', 'descricao do insumo', 'descricao insumo', 'insumo'],
  itemUnit: ['unidade do item', 'unidade item', 'unidade do insumo', 'unidade insumo'],
  coefficient: ['coeficiente', 'coef', 'consumo', 'quantidade do item'],
  itemPrice: ['preco unitario do item', 'preco item', 'preco unitario insumo', 'valor unitario item'],
  itemCost: ['custo total do item', 'custo item', 'valor total item', 'custo parcial'],
}

function headerMatches(value, aliases) {
  const normalized = normalizeText(value)
  if (!normalized) return false
  return aliases.some((alias) => normalized === alias || normalized.includes(alias))
}

function findColumn(headers, aliases, excluded = new Set()) {
  for (let index = 0; index < headers.length; index += 1) {
    if (excluded.has(index)) continue
    if (headerMatches(headers[index], aliases)) return index
  }
  return -1
}

function detectSinapiHeader(rows) {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 80); rowIndex += 1) {
    const headers = (rows[rowIndex] || []).map(cleanCell)
    const code = findColumn(headers, ALIASES.compositionCode)
    const description = findColumn(headers, ALIASES.compositionDescription, new Set([code]))
    const unit = findColumn(headers, ALIASES.compositionUnit)

    if (code >= 0 && description >= 0 && unit >= 0) {
      return { rowIndex, headers }
    }
  }

  return null
}

function buildSinapiMap(headers) {
  const compositionCode = findColumn(headers, ALIASES.compositionCode)
  const compositionDescription = findColumn(headers, ALIASES.compositionDescription, new Set([compositionCode]))
  const compositionUnit = findColumn(headers, ALIASES.compositionUnit)
  const itemCode = findColumn(headers, ALIASES.itemCode, new Set([compositionCode]))
  const itemDescription = findColumn(headers, ALIASES.itemDescription, new Set([compositionDescription]))
  const itemUnit = findColumn(headers, ALIASES.itemUnit, new Set([compositionUnit]))

  return {
    compositionCode,
    compositionDescription,
    compositionUnit,
    compositionCost: findColumn(headers, ALIASES.compositionCost),
    category: findColumn(headers, ALIASES.category),
    itemType: findColumn(headers, ALIASES.itemType),
    itemCode,
    itemDescription,
    itemUnit,
    coefficient: findColumn(headers, ALIASES.coefficient),
    itemPrice: findColumn(headers, ALIASES.itemPrice),
    itemCost: findColumn(headers, ALIASES.itemCost),
  }
}

function valueAt(row, index) {
  return index >= 0 ? cleanCell(row[index]) : ''
}

export function parseSinapiWorkbook(buffer) {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true,
    dense: true,
  })

  const compositions = new Map()

  for (const sheetName of workbook.SheetNames) {
    const rows = sheetRows(workbook, sheetName)
    const detected = detectSinapiHeader(rows)
    if (!detected) continue

    const map = buildSinapiMap(detected.headers)
    let currentCode = ''
    let currentDescription = ''
    let currentUnit = ''
    let currentCategory = ''

    rows.slice(detected.rowIndex + 1).forEach((row, relativeIndex) => {
      if (isEmptyRow(row)) return

      const codeCell = valueAt(row, map.compositionCode)
      const descriptionCell = valueAt(row, map.compositionDescription)
      const unitCell = valueAt(row, map.compositionUnit)
      const categoryCell = valueAt(row, map.category)

      if (codeCell) currentCode = String(codeCell).trim()
      if (descriptionCell) currentDescription = String(descriptionCell).trim()
      if (unitCell) currentUnit = String(unitCell).trim()
      if (categoryCell) currentCategory = String(categoryCell).trim()

      if (!currentCode || !currentDescription) return

      const key = currentCode
      if (!compositions.has(key)) {
        compositions.set(key, {
          codigo: currentCode,
          descricao: currentDescription,
          unidade: currentUnit,
          categoria: currentCategory,
          custo_total: 0,
          sheetName,
          items: [],
        })
      }

      const composition = compositions.get(key)
      if (currentDescription) composition.descricao = currentDescription
      if (currentUnit) composition.unidade = currentUnit
      if (currentCategory) composition.categoria = currentCategory

      const compositionCost = parseNumber(valueAt(row, map.compositionCost))
      if (compositionCost !== null && compositionCost >= 0) composition.custo_total = compositionCost

      const itemCode = valueAt(row, map.itemCode)
      const itemDescription = valueAt(row, map.itemDescription)
      const coefficient = parseNumber(valueAt(row, map.coefficient))
      const itemPrice = parseNumber(valueAt(row, map.itemPrice))
      const itemCost = parseNumber(valueAt(row, map.itemCost))

      if (itemCode || itemDescription || coefficient !== null || itemCost !== null) {
        composition.items.push({
          ordem: relativeIndex + 1,
          tipo: valueAt(row, map.itemType),
          codigo: String(itemCode || '').trim(),
          descricao: String(itemDescription || '').trim(),
          unidade: String(valueAt(row, map.itemUnit) || '').trim(),
          coeficiente: coefficient,
          preco_unitario: itemPrice,
          custo_total: itemCost,
        })
      }
    })
  }

  const result = Array.from(compositions.values()).map((composition) => {
    if ((!composition.custo_total || composition.custo_total <= 0) && composition.items.length) {
      const sum = composition.items.reduce((total, item) => total + (Number(item.custo_total) || 0), 0)
      composition.custo_total = sum
    }
    return composition
  }).filter((composition) => composition.codigo && composition.descricao)

  if (!result.length) {
    throw new Error('Não identifiquei as colunas de composição do SINAPI. O arquivo precisa conter código, descrição e unidade da composição.')
  }

  return result
}

export function exportWorkbookBuffer(headers, rows, sheetName = 'Planilha') {
  const normalizedRows = rows.map((row) => {
    const output = {}
    headers.forEach((header) => {
      output[header] = row?.[header] ?? ''
    })
    return output
  })

  const sheet = XLSX.utils.json_to_sheet(normalizedRows, { header: headers })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, String(sheetName || 'Planilha').slice(0, 31))

  return XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  })
}
