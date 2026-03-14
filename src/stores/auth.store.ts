import { defineStore } from 'pinia'
import type { Usuario } from '@/types/usuario'

const TOKEN_KEY   = 'token_pae_web'
const USER_KEY    = 'usuario_pae_web'
const USE_MOCK    = import.meta.env.VITE_USE_MOCK === 'true'

type UsuarioApp = Usuario & {
  Rol: 'Tesorero' | 'ATC' | 'Coordinador'
  IE?: string
  Zona?: string
}

const MOCK_USERS: Record<string, UsuarioApp> = {
  tesorero: {
    Operacion: 1, Autenticado: true, Token: 'mock-token-tesorero',
    Mensaje: 'OK', Correo: null, PersonaId: 1, NumeroDocumento: null,
    FotografiaDriveUrl: null, NombreCompleto: 'Pedro Muñez', UsuarioId: 1,
    Rol: 'Tesorero', IE: 'IE N° 20124', Zona: 'Lima Este · Zona A',
  },
  atc: {
    Operacion: 1, Autenticado: true, Token: 'mock-token-atc',
    Mensaje: 'OK', Correo: null, PersonaId: 2, NumeroDocumento: null,
    FotografiaDriveUrl: null, NombreCompleto: 'María Torres', UsuarioId: 2,
    Rol: 'ATC', Zona: 'Lima Este · Zona A',
  },
  coordinador: {
    Operacion: 1, Autenticado: true, Token: 'mock-token-coordinador',
    Mensaje: 'OK', Correo: null, PersonaId: 3, NumeroDocumento: null,
    FotografiaDriveUrl: null, NombreCompleto: 'Carlos Ramos', UsuarioId: 3,
    Rol: 'Coordinador',
  },
}

function loadSaved(): UsuarioApp | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    usuario: loadSaved() as UsuarioApp | null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (s) => !!s.usuario?.Token,
    token:           (s) => s.usuario?.Token ?? null,
    nombreCompleto:  (s) => s.usuario?.NombreCompleto ?? null,
    rol:             (s) => s.usuario?.Rol ?? null,
    ie:              (s) => (s.usuario as UsuarioApp | null)?.IE ?? null,
    zona:            (s) => (s.usuario as UsuarioApp | null)?.Zona ?? null,
  },

  actions: {
    async login(payload: { Usuario: string; Clave: string }) {
      this.loading = true
      try {
        if (USE_MOCK) {
          const key = payload.Usuario.toLowerCase().trim()
          const u   = MOCK_USERS[key]
          if (!u || payload.Clave.toLowerCase().trim() !== key) {
            throw new Error('Usuario o contraseña incorrectos')
          }
          this.usuario = u
          localStorage.setItem(TOKEN_KEY, u.Token)
          localStorage.setItem(USER_KEY, JSON.stringify(u))
          return u
        }
        throw new Error('API no disponible en modo mock')
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.usuario = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})
