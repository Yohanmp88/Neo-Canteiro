import { supabase } from '@/lib/supabase'

export const materialService = {
  // Listar materiais de um diário
  async listarPorDiario(diarioId) {
    const { data, error } = await supabase
      .from('materiais_recebidos')
      .select('*')
      .eq('diario_id', diarioId)
      .order('horario_entrega', { ascending: true })

    if (error) throw new Error(error.message)
    return data
  },

  // Listar todos os materiais de uma obra
  async listarPorObra(obraId) {
    // Busca através da relação com diário
    const { data, error } = await supabase
      .from('materiais_recebidos')
      .select('*, diario_obra(obra_id)')
      .eq('diario_obra.obra_id', obraId)
      .order('horario_entrega', { ascending: true })

    if (error) throw new Error(error.message)
    return data
  },

  // Obter material específico
  async obter(id) {
    const { data, error } = await supabase
      .from('materiais_recebidos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  // Criar material
  async criar(materialData) {
    const { data, error } = await supabase
      .from('materiais_recebidos')
      .insert([materialData])
      .select()

    if (error) throw new Error(error.message)
    return data[0]
  },

  // Atualizar material
  async atualizar(id, updates) {
    const { data, error } = await supabase
      .from('materiais_recebidos')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw new Error(error.message)
    return data[0]
  },

  // Deletar material
  async deletar(id) {
    const { error } = await supabase
      .from('materiais_recebidos')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  // Obter resumo de materiais
  async obterResumo(obraId) {
    const materiais = await this.listarPorObra(obraId)

    const totalItens = materiais.length
    const totalQtde = materiais.reduce((sum, m) => sum + (parseInt(m.quantidade) || 0), 0)
    const fornecedores = [...new Set(materiais.map((m) => m.fornecedor))]

    return { totalItens, totalQtde, fornecedores: fornecedores.length }
  },
}
