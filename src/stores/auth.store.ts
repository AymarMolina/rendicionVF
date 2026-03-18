import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ModuloTesorero {
  modulo_id:          number
  codigo_modular:     string
  nivel:              'inicial' | 'primaria' | 'secundaria'
  nombre_modulo:      string
  institucion_id:     number
  nombre_institucion: string
  codigo_ie:          string
  ugel:               string
  distrito:           string
}

export interface UserData {
  id:        number
  nombres:   string
  apellidos: string
  rol:       string
  modulos?:              ModuloTesorero[]
  institucion_id?:       number
  nombre_institucion?:   string
  codigo_ie?:            string
  ugel?:                 string
  distrito?:             string
}

export const useAuthStore = defineStore('auth', () => {
  const user    = ref<UserData | null>(JSON.parse(localStorage.getItem('user') ?? 'null'))
  const token   = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)

  const rol = computed(() => {
    if (user.value?.rol === 'tesorero')                   return 'Tesorero'
    if (user.value?.rol === 'atc')                        return 'ATC'
    if (user.value?.rol === 'coordinador_administrativo') return 'Coordinador'
    return user.value?.rol ?? ''
  })

  const nombreCompleto = computed(() =>
    user.value ? `${user.value.nombres} ${user.value.apellidos}` : ''
  )

  const nombreInstitucion = computed(() => user.value?.nombre_institucion ?? '')
  const codigoIE          = computed(() => user.value?.codigo_ie ?? '')
  const ugel              = computed(() => user.value?.ugel ?? '')
  const distrito          = computed(() => user.value?.distrito ?? '')

  const modulos = computed<ModuloTesorero[]>(() => user.value?.modulos ?? [])

  const niveles = computed(() => modulos.value.map(m => m.nivel))

  const nivelesLabel = computed(() =>
    modulos.value
      .map(m => capitalize(m.nivel))
      .join(' · ')
  )

  const moduloPrimario = computed(() => modulos.value[0] ?? null)

  const ie   = computed(() => nombreInstitucion.value)
  const zona = computed(() => {
    if (!ugel.value && !distrito.value) return ''
    return [ugel.value, distrito.value].filter(Boolean).join(' – ')
  })

  async function login(credentials: { Usuario: string; Clave: string }) {
    loading.value = true
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.Usuario, password: credentials.Clave })
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

  return {
    user, token, loading,
    rol, nombreCompleto,
    nombreInstitucion, codigoIE, ugel, distrito,
    modulos, niveles, nivelesLabel, moduloPrimario,
    ie, zona,
    login, logout
  }
})

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}