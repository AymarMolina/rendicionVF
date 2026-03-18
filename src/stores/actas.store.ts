// stores/actas.store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

export interface Acta {
  id: number
  asignacion_id: number
  fecha_comite: string
  pdf_nombre: string
  creado_en: string
  generada_por_nombre: string
}

export const useActasStore = defineStore('actas', () => {
  const auth    = useAuthStore()
  const actas   = ref<Acta[]>([])
  const loading = ref(false)

  async function cargar(asignacion_id: number) {
    loading.value = true
    try {
      const res = await fetch(
        `http://localhost:3000/api/actas?asignacion_id=${asignacion_id}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      actas.value = res.ok ? await res.json() : []
    } finally {
      loading.value = false
    }
  }

  async function generarYDescargar(asignacion_id: number, fecha_comite: string): Promise<boolean> {
    try {
      const res = await fetch('http://localhost:3000/api/actas/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({ asignacion_id, fecha_comite })
      })

      if (!res.ok) return false

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `acta-${asignacion_id}-${fecha_comite}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      await cargar(asignacion_id)
      return true
    } catch {
      return false
    }
  }

  return { actas, loading, cargar, generarYDescargar }
})