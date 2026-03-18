import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth.store'

const BASE = 'http://localhost:3000/api'

export const useAtcStore = defineStore('atc', () => {
  const auth = useAuthStore()

  const instituciones = ref<any[]>([])
  const rendiciones   = ref<any[]>([])
  const loadingLista  = ref(false)
  const loadingAccion = ref(false)

  function hdrs(json = true) {
    const h: Record<string, string> = {
      Authorization: `Bearer ${auth.token}`
    }
    if (json) h['Content-Type'] = 'application/json'
    return h
  }

  async function cargarInstituciones() {
    const res  = await fetch(`${BASE}/atc/instituciones`, { headers: hdrs(false) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al cargar instituciones')
    instituciones.value = data
  }

  async function cargarRendiciones() {
    const res  = await fetch(`${BASE}/atc/rendiciones`, { headers: hdrs(false) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al cargar rendiciones')
    rendiciones.value = data
  }

  async function cargarTodo() {
    loadingLista.value = true
    try {
      await Promise.all([cargarInstituciones(), cargarRendiciones()])
    } finally {
      loadingLista.value = false
    }
  }

  async function aprobar(rendicion_id: number) {
    loadingAccion.value = true
    try {
      const res  = await fetch(`${BASE}/rendiciones/${rendicion_id}/aprobar`, {
        method:  'PATCH',
        headers: hdrs(false)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al aprobar')
      _actualizarEstadoLocal(rendicion_id, 'aprobada')
      return data
    } finally {
      loadingAccion.value = false
    }
  }

  async function observar(rendicion_id: number, comentario: string) {
    if (!comentario.trim()) throw new Error('El comentario es requerido')
    loadingAccion.value = true
    try {
      const res  = await fetch(`${BASE}/rendiciones/${rendicion_id}/observar`, {
        method:  'PATCH',
        headers: hdrs(),
        body:    JSON.stringify({ comentario })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al observar')
      _actualizarEstadoLocal(rendicion_id, 'observada')
      return data
    } finally {
      loadingAccion.value = false
    }
  }

  function _actualizarEstadoLocal(rendicion_id: number, nuevoEstado: string) {
    const item = rendiciones.value.find(r => r.rendicion_id === rendicion_id)
    if (item) item.estado = nuevoEstado
    cargarInstituciones().catch(() => {})
  }

  function porEstado(estado: string) {
    return rendiciones.value.filter(r => r.estado === estado)
  }

  function conteo(estado: string) {
    return rendiciones.value.filter(r => r.estado === estado).length
  }

  return {
    instituciones,
    rendiciones,
    loadingLista,
    loadingAccion,
    cargarTodo,
    cargarInstituciones,
    cargarRendiciones,
    aprobar,
    observar,
    porEstado,
    conteo,
  }
})