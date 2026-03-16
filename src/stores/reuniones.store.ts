import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth.store'

const BASE = 'http://localhost:3000/api'

export const useReunionesStore = defineStore('reuniones', () => {
  const auth     = useAuthStore()
  const reuniones = ref<any[]>([])
  const loading   = ref(false)

  function headers() {
    return { 'Authorization': `Bearer ${auth.token}` }
  }

  async function cargar() {
    loading.value = true
    try {
      const res  = await fetch(`${BASE}/reuniones`, { headers: headers() })
      reuniones.value = await res.json()
    } finally {
      loading.value = false
    }
  }

  async function registrar(payload: any, acta?: File | null) {
    const fd = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== null && v !== undefined) fd.append(k, String(v))
    })
    if (acta) fd.append('acta', acta)
    const res  = await fetch(`${BASE}/reuniones`, { method: 'POST', headers: headers(), body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return data
  }

  async function actualizar(id: number, payload: any, acta?: File | null) {
    const fd = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== null && v !== undefined) fd.append(k, String(v))
    })
    if (acta) fd.append('acta', acta)
    const res  = await fetch(`${BASE}/reuniones/${id}`, { method: 'PATCH', headers: headers(), body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return data
  }

  async function eliminar(id: number) {
    const res = await fetch(`${BASE}/reuniones/${id}`, {
      method: 'DELETE',
      headers: { ...headers(), 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    reuniones.value = reuniones.value.filter(r => r.id !== id)
  }

  return { reuniones, loading, cargar, registrar, actualizar, eliminar }
})