import { supabase } from '@/lib/supabase'

export const obraService = {
  // Listar todas as obras (ou apenas as do cliente)
  async listar(userId, tipoUsuario) {
    let query = supabase.from('obras').select('*')

    // Se for cliente, mostrar apenas suas obras
    if (tipoUsuario === 'cliente') {
      query = query.eq('cliente_id', userId)
    }

    const { data, error } = await query.order('data_criacao', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  // Obter obra específica
  async obter(id) {
    const { data, error } = await supabase
      .from('obras')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  // Criar nova obra
  async criar(obraData) {
    const { data, error } = await supabase.from('obras').insert([obraData]).select()

    if (error) throw new Error(error.message)
    return data[0]
  },

  // Atualizar obra
  async atualizar(id, updates) {
    const { data, error } = await supabase
      .from('obras')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw new Error(error.message)
    return data[0]
  },

  // Deletar obra
  async deletar(id) {
    const { error } = await supabase.from('obras').delete().eq('id', id)

    if (error) throw new Error(error.message)
  },

  // Atualizar progresso
  async atualizarProgresso(id, progresso) {
    return this.atualizar(id, { progresso })
  },

  // Calcular status
  async obterComStatus(id) {
    const obra = await this.obter(id)

    const hoje = new Date()
    const prazoDate = new Date(obra.prazo_final)
    const diasRestantes = Math.ceil((prazoDate - hoje) / (1000 * 60 * 60 * 24))

    let status = 'No prazo'
    if (obra.progresso === 100) {
      status = 'Finalizada'
    } else if (diasRestantes <= 0) {
      status = 'Atrasada'
    } else if (diasRestantes <= 7 || obra.progresso < 50) {
      status = 'Atenção'
    }

    return { ...obra, status, diasRestantes }
  },
}
