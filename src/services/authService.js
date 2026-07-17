import { supabase } from '@/lib/supabase'

export const authService = {
  // Login real com e-mail e senha do Supabase Auth
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw new Error(error.message)
    return data
  },

  // Registrar usuário real. O perfil é criado pelo trigger do arquivo
  // NEOCANTEIRO_AUTH_REAL_SUPABASE.sql.
  async signup(email, password, userData = {}) {
    const role = userData.tipo_usuario || userData.role || 'engenheiro'

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: userData.nome || '',
          empresa: userData.empresa || '',
          role,
          tipo_usuario: role,
        },
      },
    })

    if (error) throw new Error(error.message)
    return data
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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Não foi possível carregar profiles:', profileError.message)
    }

    if (profile) {
      return { ...profile, tipo_usuario: profile.role }
    }

    // Compatibilidade com instalações antigas.
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    return usuario || null
  },

  // Subscribe para mudanças de autenticação
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
