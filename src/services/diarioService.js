import { supabase } from '@/lib/supabase'

export const diarioService = {
  // Listar diários de uma obra
  async listar(obraId) {
    const { data, error } = await supabase
      .from('diario_obra')
      .select('*')
      .eq('obra_id', obraId)
      .order('data', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  // Obter diário específico
  async obter(id) {
    const { data, error } = await supabase
      .from('diario_obra')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  // Criar diário
  async criar(diarioData) {
    const { data, error } = await supabase
      .from('diario_obra')
      .insert([diarioData])
      .select()

    if (error) throw new Error(error.message)
    return data[0]
  },

  // Atualizar diário
  async atualizar(id, updates) {
    const { data, error } = await supabase
      .from('diario_obra')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw new Error(error.message)
    return data[0]
  },

  // Deletar diário
  async deletar(id) {
    const { error } = await supabase.from('diario_obra').delete().eq('id', id)

    if (error) throw new Error(error.message)
  },

  // Upload de foto para um diário
  async uploadFoto(obraId, diarioId, arquivo) {
    const nomeArquivo = `obra-${obraId}/diario-${diarioId}/${Date.now()}-${arquivo.name}`

    const { error } = await supabase.storage
      .from('diarios')
      .upload(nomeArquivo, arquivo)

    if (error) throw new Error(error.message)

    // Retornar URL pública
    const { data } = supabase.storage
      .from('diarios')
      .getPublicUrl(nomeArquivo)

    return data.publicUrl
  },

  // Deletar foto
  async deletarFoto(caminhoFoto) {
    const { error } = await supabase.storage
      .from('diarios')
      .remove([caminhoFoto])

    if (error) throw new Error(error.message)
  },
}
