import { supabase } from '@/lib/supabase'

export const authService = {
  // Login com email e senha
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw new Error(error.message)
    return data
  },

  // Registrar novo usuário
  async signup(email, password, userData) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw new Error(authError.message)

    // Criar registro do usuário na tabela usuarios
    if (authData.user) {
      const { error: dbError } = await supabase.from('usuarios').insert([
        {
          id: authData.user.id,
          nome: userData.nome,
          email,
          tipo_usuario: userData.tipo_usuario,
          empresa: userData.empresa,
        },
      ])

      if (dbError) throw new Error(dbError.message)
    }

    return authData
  },

  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },

  // Obter usuário atual
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw new Error(error.message)
    return data.user
  },

  // Obter sessão
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw new Error(error.message)
    return data.session
  },

  // Obter dados do usuário logado
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  // Subscribe para mudanças de autenticação
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
