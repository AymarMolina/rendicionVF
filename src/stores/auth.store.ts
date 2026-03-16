import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref<any>(JSON.parse(localStorage.getItem('user') ?? 'null'))
  const token   = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)

  // ✅ Propiedades que usan el Sidebar y TopBar
  const rol            = computed(() => {
    if (user.value?.rol === 'tesorero')                   return 'Tesorero'
    if (user.value?.rol === 'atc')                        return 'ATC'
    if (user.value?.rol === 'coordinador_administrativo') return 'Coordinador'
    return user.value?.rol ?? ''
  })
  const nombreCompleto = computed(() =>
    user.value ? `${user.value.nombres} ${user.value.apellidos}` : ''
  )
  const ie   = computed(() => user.value?.ie   ?? '')
  const zona = computed(() => user.value?.zona ?? '')

  async function login(credentials: { Usuario: string; Clave: string }) {
    loading.value = true
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    credentials.Usuario,
          password: credentials.Clave
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error de autenticación')

      token.value = data.token
      user.value  = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user',  JSON.stringify(data.user))

      return {
        NombreCompleto: `${data.user.nombres} ${data.user.apellidos}`,
        Rol: data.user.rol
      }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value  = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { user, token, loading, rol, nombreCompleto, ie, zona, login, logout }
})