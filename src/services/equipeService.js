import { supabase } from '@/lib/supabase'

export const equipeService = {
  // Listar membros da equipe de uma obra
  async listar(obraId) {
    if (!obraId || String(obraId).startsWith('demo')) {
      return []
    }

    const { data, error } = await supabase
      .from('equipe')
      .select('*')
      .eq('obra_id', obraId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
  },

  // Adicionar membro à equipe
  async criar(membroData) {
    const { data, error } = await supabase
      .from('equipe')
      .insert([membroData])
      .select()

    if (error) throw new Error(error.message)
    return data[0]
  },

  // Atualizar membro da equipe
  async atualizar(id, updates) {
    const { data, error } = await supabase
      .from('equipe')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw new Error(error.message)
    return data[0]
  },

  // Deletar membro da equipe
  async deletar(id) {
    const { error } = await supabase
      .from('equipe')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  }
}
