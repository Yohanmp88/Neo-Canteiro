import { supabase } from '@/lib/supabase'

export const tarefaService = {
  // Listar tarefas de uma obra
  async listar(obraId) {
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('obra_id', obraId)
      .order('data_inicio', { ascending: true })

    if (error) throw new Error(error.message)
    return data
  },

  // Obter tarefa específica
  async obter(id) {
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  // Criar tarefa
  async criar(tarefaData) {
    const { data, error } = await supabase
      .from('tarefas')
      .insert([tarefaData])
      .select()

    if (error) throw new Error(error.message)
    return data[0]
  },

  // Atualizar tarefa
  async atualizar(id, updates) {
    const { data, error } = await supabase
      .from('tarefas')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw new Error(error.message)
    return data[0]
  },

  // Deletar tarefa
  async deletar(id) {
    const { error } = await supabase.from('tarefas').delete().eq('id', id)

    if (error) throw new Error(error.message)
  },

  // Obter estatísticas da obra
  async obterEstatisticas(obraId) {
    const tarefas = await this.listar(obraId)

    const total = tarefas.length
    const concluidas = tarefas.filter((t) => t.progresso === 100).length
    const atrasadas = tarefas.filter((t) => {
      const hoje = new Date()
      return new Date(t.data_termino) < hoje && t.progresso < 100
    }).length

    const progressoMedio = total > 0 ? Math.round(tarefas.reduce((sum, t) => sum + t.progresso, 0) / total) : 0

    return { total, concluidas, atrasadas, progressoMedio }
  },
}
