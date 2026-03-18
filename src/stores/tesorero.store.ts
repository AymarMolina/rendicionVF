// stores/tesorero.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth.store'

const BASE = 'http://localhost:3000/api'
const TTL  = 60_000 

export const useTesoreroStore = defineStore('tesorero', () => {
  const auth = useAuthStore()

  const modulos    = ref<any[]>([])
  const tesoreros  = ref<any[]>([])
  const loadingMod = ref(false)
  const loadingTes = ref(false)
  const errorMod   = ref<string | null>(null)
  const errorTes   = ref<string | null>(null)
  const lastFetch  = ref(0)

  const loading            = computed(() => loadingMod.value || loadingTes.value)
  const modulosConTesorero = computed(() => modulos.value.filter(m => m.tesorero_nombres).length)
  const modulosSinTesorero = computed(() => modulos.value.filter(m => !m.tesorero_nombres).length)

  function h(json = false) {
    const headers: Record<string, string> = { Authorization: `Bearer ${auth.token}` }
    if (json) headers['Content-Type'] = 'application/json'
    return headers
  }

  function estaFresco() {
    return modulos.value.length > 0 && Date.now() - lastFetch.value < TTL
  }


  async function cargar(forzar = false) {
    if (!forzar && estaFresco()) return
    errorMod.value = null
    errorTes.value = null
    await Promise.all([_cargarModulos(), _cargarTesoreros()])
    lastFetch.value = Date.now()
  }

  async function _cargarModulos() {
    loadingMod.value = true
    try {
      const res = await fetch(`${BASE}/importar/modulos/dropdown`, { headers: h() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      modulos.value = await res.json()
    } catch (err: any) {
      errorMod.value = err.message
    } finally {
      loadingMod.value = false
    }
  }

  async function _cargarTesoreros() {
    loadingTes.value = true
    try {
      const res = await fetch(`${BASE}/usuarios/tesoreros`, { headers: h() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      tesoreros.value = await res.json()
    } catch (err: any) {
      errorTes.value = err.message
    } finally {
      loadingTes.value = false
    }
  }

  function actualizarModuloLocal(modulo_id: number, tesorero: any) {
    const idx = modulos.value.findIndex(m => m.modulo_id === modulo_id)
    if (idx === -1) return

    const anteriorEmail = modulos.value[idx].tesorero_email
    if (anteriorEmail && anteriorEmail !== tesorero.email) {
      const anterior = tesoreros.value.find(t => t.email === anteriorEmail)
      if (anterior && anterior.modulos_asignados > 0) anterior.modulos_asignados--
    }

    modulos.value[idx] = {
      ...modulos.value[idx],
      tesorero_nombres:   tesorero.nombres,
      tesorero_apellidos: tesorero.apellidos,
      tesorero_email:     tesorero.email,
      fecha_inicio:       new Date().toISOString().split('T')[0],
    }

    const nuevo = tesoreros.value.find(t => t.id === tesorero.id)
    if (nuevo) nuevo.modulos_asignados++
  }

  function invalidar() {
    lastFetch.value = 0
  }

  return {
    modulos, tesoreros,
    loadingMod, loadingTes, loading,
    errorMod, errorTes,
    modulosConTesorero, modulosSinTesorero,
    cargar, actualizarModuloLocal, invalidar,
  }
})