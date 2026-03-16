import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth.store'

const BASE = 'http://localhost:3000/api'

export const useGastosStore = defineStore('gastos', () => {
  const auth         = useAuthStore()
  const gastos       = ref<any[]>([])
  const transferencias = ref<any[]>([])
  const loading      = ref(false)

  function headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    }
  }

  async function cargarTransferencias() {
    loading.value = true
    try {
      const res  = await fetch(`${BASE}/transferencias`, { headers: headers() })
      const data = await res.json()
      transferencias.value = data
    } finally {
      loading.value = false
    }
  }

  async function cargarGastos(transferenciaId: string | number) {
    loading.value = true
    try {
      const res  = await fetch(`${BASE}/gastos?transferencia_id=${transferenciaId}`, { headers: headers() })
      const data = await res.json()
      gastos.value = data
    } finally {
      loading.value = false
    }
  }

  async function checkPresupuesto(transferenciaId: string | number, rubro: string, monto: number) {
    const res  = await fetch(
      `${BASE}/gastos/check-presupuesto?transferencia_id=${transferenciaId}&rubro=${rubro}&monto=${monto}`,
      { headers: headers() }
    )
    return await res.json()
  }

  async function registrarGasto(payload: any, archivo?: File | null) {
    const formData = new FormData()

    Object.entries(payload).forEach(([k, v]) => {
      if (v !== null && v !== undefined) formData.append(k, String(v))
    })

    if (archivo) formData.append('archivo', archivo)

    const res = await fetch(`${BASE}/gastos`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${auth.token}` }, 
      body: formData
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al registrar gasto')
    return data
  }

  async function eliminarGasto(id: number) {
    const res = await fetch(`${BASE}/gastos/${id}`, {
      method: 'DELETE',
      headers: headers()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al eliminar')
    gastos.value = gastos.value.filter(g => g.id !== id)
    return data
  }
async function actualizarGasto(id: number, payload: any, archivo?: File | null) {
  const formData = new FormData()
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== null && v !== undefined) formData.append(k, String(v))
  })
  if (archivo) formData.append('archivo', archivo)

  const res = await fetch(`${BASE}/gastos/${id}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${auth.token}` },
    body: formData
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al actualizar')
  return data
}

return { gastos, transferencias, loading, cargarTransferencias, cargarGastos, checkPresupuesto, registrarGasto, actualizarGasto, eliminarGasto }
})