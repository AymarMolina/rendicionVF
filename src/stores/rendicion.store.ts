import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth.store'

const BASE = 'http://localhost:3000/api'

export const useRendicionStore = defineStore('rendicion', () => {
  const auth         = useAuthStore()
  const datos        = ref<any>(null)
  const loading      = ref(false)

  function headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    }
  }

  async function cargar(transferenciaId: number | string) {
    loading.value = true
    try {
      const res  = await fetch(`${BASE}/rendiciones/${transferenciaId}`, { headers: headers() })
      const data = await res.json()
      datos.value = data
    } finally {
      loading.value = false
    }
  }

  async function guardar(transferencia_id: number | string, efectivo_en_caja: number, observaciones: string) {
    const res = await fetch(`${BASE}/rendiciones`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ transferencia_id, efectivo_en_caja, observaciones })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al guardar')
    return data
  }

  async function enviar(rendicion_id: number) {
    const res = await fetch(`${BASE}/rendiciones/${rendicion_id}/enviar`, {
      method: 'PATCH',
      headers: headers()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al enviar')
    return data
  }

  return { datos, loading, cargar, guardar, enviar }
})