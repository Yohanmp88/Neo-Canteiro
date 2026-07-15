import { supabase } from '@/lib/supabase'

export const compraService = {
  async listarPorObra(obraId) {
    if (!obraId || String(obraId).startsWith('demo')) return []

    const { data, error } = await supabase
      .from('pedidos_compra')
      .select('*')
      .eq('obra_id', obraId)
      .order('data_prevista', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
  },

  async criar(pedidoData) {
    const { data, error } = await supabase
      .from('pedidos_compra')
      .insert([pedidoData])
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async atualizar(id, updates) {
    const { data, error } = await supabase
      .from('pedidos_compra')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },
}
