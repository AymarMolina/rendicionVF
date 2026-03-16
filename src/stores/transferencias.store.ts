import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth.store'

const BASE = 'http://localhost:3000/api'

export const useTransferenciasStore = defineStore('transferencias', () => {
  const auth          = useAuthStore()
  const transferencias = ref<any[]>([])
  const loading        = ref(false)

  function headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    }
  }

  async function cargar() {
    loading.value = true
    try {
      const res  = await fetch(`${BASE}/transferencias`, { headers: headers() })
      const data = await res.json()
      transferencias.value = Array.isArray(data) ? data : []
    } finally {
      loading.value = false
    }
  }

  async function getRubros(id: number) {
    const res  = await fetch(`${BASE}/transferencias/${id}/rubros`, { headers: headers() })
    return await res.json()
  }

  const totalRecibido   = computed(() => transferencias.value.reduce((s, t) => s + t.monto, 0))
  const totalGastado    = computed(() => transferencias.value.reduce((s, t) => s + (t.total_gastado ?? 0), 0))
  const totalSaldo      = computed(() => transferencias.value.reduce((s, t) => s + (t.saldo ?? 0), 0))
  const pendientes      = computed(() => transferencias.value.filter(t => t.saldo > 0).length)
  const pctSustentado   = computed(() =>
    totalRecibido.value > 0 ? Math.round((totalGastado.value / totalRecibido.value) * 100) : 0
  )
  const activa = computed(() =>
    transferencias.value.find(t => ['recibida', 'en_rendicion'].includes(t.estado))
    ?? transferencias.value[0]
    ?? null
  )

  return {
    transferencias, loading,
    totalRecibido, totalGastado, totalSaldo, pendientes, pctSustentado, activa,
    cargar, getRubros
  }
})