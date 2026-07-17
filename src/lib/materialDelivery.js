export function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

export function isReceivedStatus(value) {
  return /^recebido/i.test(String(value || '').trim())
}

export function materialDeliveryFromRecord(record = {}) {
  return {
    material_id: String(record.id || record.material_id || ''),
    item: String(record.item || record.material || 'Material sem identificação'),
    quantidade: Number(record.quantidade_recebida || record.quantidade || 0),
    unidade: String(record.unidade || ''),
    fornecedor: String(record.fornecedor || ''),
    status: String(record.recebimento_status || 'Recebido'),
    data_recebimento: String(record.data_recebimento || todayDate()).slice(0, 10),
    recebido_por: String(record.recebido_por || ''),
    observacoes: String(record.observacoes_recebimento || ''),
  }
}

export function mergeMaterialDeliveries(...groups) {
  const byId = new Map()

  groups.flat().filter(Boolean).forEach((entry) => {
    const normalized = materialDeliveryFromRecord(entry)
    const key = normalized.material_id || `${normalized.item}:${normalized.data_recebimento}`
    byId.set(key, { ...(byId.get(key) || {}), ...normalized })
  })

  return Array.from(byId.values()).sort((a, b) => a.item.localeCompare(b.item, 'pt-BR'))
}

export function deliveriesForDate(materials = [], date) {
  const target = String(date || '').slice(0, 10)
  if (!target) return []

  return mergeMaterialDeliveries(
    materials.filter((material) => (
      isReceivedStatus(material.recebimento_status) &&
      String(material.data_recebimento || '').slice(0, 10) === target
    )),
  )
}

export function cleanWorkspaceRecord(record = {}) {
  const payload = { ...record }
  ;[
    'id',
    'obra_id',
    'created_at',
    'updated_at',
    'created_by',
    'updated_by',
    'created_by_name',
    'storage_source',
  ].forEach((key) => delete payload[key])
  return payload
}

export function formatDeliveryQuantity(delivery = {}) {
  const quantity = Number(delivery.quantidade || 0)
  const formatted = quantity.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  return [formatted, delivery.unidade].filter(Boolean).join(' ')
}
