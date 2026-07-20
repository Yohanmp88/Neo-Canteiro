import { supabase } from '@/lib/supabase'

const CUSTOM_PERMISSIONS_STORAGE_KEY = 'neocanteiro_custom_permissions_v1'

function syncCustomPermissions(customPermissions) {
  if (typeof window === 'undefined') return

  if (customPermissions?.enabled === true) {
    window.sessionStorage.setItem(CUSTOM_PERMISSIONS_STORAGE_KEY, JSON.stringify(customPermissions))
  } else {
    window.sessionStorage.removeItem(CUSTOM_PERMISSIONS_STORAGE_KEY)
  }
}

export const authService = {
  // Login real com e-mail e senha do Supabase Auth
  async login(email, password) {
    syncCustomPermissions(null)

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
    syncCustomPermissions(null)
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
    syncCustomPermissions(null)
    if (error) throw new Error(error.message)
  },

  // Obter usuário atual
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw new Error(error.message)
    if (!data.user) syncCustomPermissions(null)
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
    const [{ data: profile, error: profileError }, { data: authData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(),
      supabase.auth.getUser(),
    ])

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Não foi possível carregar profiles:', profileError.message)
    }

    const authUser = authData?.user?.id === userId ? authData.user : null
    const customPermissions = authUser?.user_metadata?.custom_permissions || null
    syncCustomPermissions(customPermissions)

    if (profile) {
      return {
        ...profile,
        tipo_usuario: profile.role,
        custom_permissions: customPermissions,
      }
    }

    // Compatibilidade com instalações antigas.
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    return usuario ? { ...usuario, custom_permissions: customPermissions } : null
  },

  // Subscribe para mudanças de autenticação
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
