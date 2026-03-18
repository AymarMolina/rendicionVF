<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Asignar ATC</h1>
        <p class="page-sub">Asignación manual · Selecciona la institución y el ATC responsable</p>
      </div>
    </div>

    <div class="layout">

      <div class="form-card">
        <div class="form-card-header">
          <UserCog class="form-icon" />
          <div>
            <div class="form-title">Nueva asignación</div>
            <div class="form-sub">Un ATC puede tener múltiples instituciones asignadas</div>
          </div>
        </div>

        <div class="form-body">

          <div class="field-group">
            <label class="field-label"><School style="width:13px;height:13px" /> Institución Educativa</label>
            <div v-if="loadingInst" class="select-loading"><div class="spinner-sm" /> Cargando...</div>
            <div v-else class="custom-select-wrap">
              <Search class="select-ico" />
              <input v-model="busquedaInst" class="select-search"
                placeholder="Buscar por código o nombre de IE..."
                @focus="dropdownInstOpen = true" @blur="onBlurInst" autocomplete="off" />
              <ChevronDown class="select-arrow" :class="{ open: dropdownInstOpen }" />
              <div v-if="dropdownInstOpen && instFiltradas.length > 0" class="dropdown">
                <div v-for="ie in instFiltradas" :key="ie.id" class="dropdown-item"
                  :class="{ selected: instSeleccionada?.id === ie.id }"
                  @mousedown.prevent="seleccionarInst(ie)">
                  <div class="di-left">
                    <span class="di-cod">{{ ie.codigo }}</span>
                    <span class="di-nombre">{{ ie.nombre }}</span>
                  </div>
                  <div class="di-right">
                    <span class="ugel-badge">{{ ie.ugel }}</span>
                    <span v-if="ie.atc_nombres" class="di-actual">{{ ie.atc_nombres }} {{ ie.atc_apellidos }}</span>
                    <span v-else class="di-sin">Sin ATC</span>
                  </div>
                </div>
              </div>
              <div v-if="dropdownInstOpen && busquedaInst.length >= 2 && instFiltradas.length === 0" class="dropdown">
                <div class="dropdown-empty">Sin resultados</div>
              </div>
            </div>
            <div v-if="instSeleccionada" class="seleccion-card inst-card">
              <div class="sc-header">
                <Building2 style="width:14px;height:14px;color:#2c4fd4;flex-shrink:0" />
                <div class="sc-nombre">{{ instSeleccionada.nombre }}</div>
                <button class="sc-clear" @click="limpiarInst"><X style="width:12px;height:12px" /></button>
              </div>
              <div class="sc-meta">
                <div class="sc-meta-item">
                  <span class="sc-meta-label">Código</span>
                  <span class="sc-meta-val mono">{{ instSeleccionada.codigo }}</span>
                </div>
                <div class="sc-divider" />
                <div class="sc-meta-item">
                  <span class="sc-meta-label">UGEL</span>
                  <span class="sc-meta-val">{{ instSeleccionada.ugel || '—' }}</span>
                </div>
                <div class="sc-divider" />
                <div class="sc-meta-item">
                  <span class="sc-meta-label">ATC actual</span>
                  <span v-if="instSeleccionada.atc_nombres" class="sc-meta-val">
                    {{ instSeleccionada.atc_nombres }} {{ instSeleccionada.atc_apellidos }}
                  </span>
                  <span v-else class="sc-meta-sin">Sin asignar</span>
                </div>
              </div>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label"><UserCog style="width:13px;height:13px" /> ATC</label>
            <div v-if="loadingAtcs" class="select-loading"><div class="spinner-sm" /> Cargando ATCs...</div>
            <div v-else class="custom-select-wrap">
              <Search class="select-ico" />
              <input v-model="busquedaAtc" class="select-search"
                placeholder="Buscar por nombre o email..."
                @focus="dropdownAtcOpen = true" @blur="onBlurAtc" autocomplete="off" />
              <ChevronDown class="select-arrow" :class="{ open: dropdownAtcOpen }" />
              <div v-if="dropdownAtcOpen && atcsFiltrados.length > 0" class="dropdown">
                <div v-for="atc in atcsFiltrados" :key="atc.id" class="dropdown-item"
                  :class="{ selected: atcSeleccionado?.id === atc.id }"
                  @mousedown.prevent="seleccionarAtc(atc)">
                  <div class="di-avatar">{{ iniciales(atc) }}</div>
                  <div class="di-left">
                    <span class="di-nombre">{{ atc.nombres }} {{ atc.apellidos }}</span>
                    <span class="di-email">{{ atc.email }}</span>
                  </div>
                  <div class="di-right">
                    <span v-if="atc.instituciones_asignadas > 0" class="di-carga">
                      {{ atc.instituciones_asignadas }} IE{{ atc.instituciones_asignadas > 1 ? 's' : '' }}
                    </span>
                    <span v-else class="di-sin">Libre</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="atcSeleccionado" class="seleccion-card atc-card">
              <div class="sc-header">
                <div class="sc-avatar">{{ iniciales(atcSeleccionado) }}</div>
                <div class="sc-nombre">{{ atcSeleccionado.nombres }} {{ atcSeleccionado.apellidos }}</div>
                <button class="sc-clear" @click="limpiarAtc"><X style="width:12px;height:12px" /></button>
              </div>
              <div class="sc-meta">
                <div class="sc-meta-item">
                  <span class="sc-meta-label">Email</span>
                  <span class="sc-meta-val">{{ atcSeleccionado.email }}</span>
                </div>
                <div class="sc-divider" />
                <div class="sc-meta-item">
                  <span class="sc-meta-label">IEs asignadas</span>
                  <span class="sc-meta-val blue">{{ atcSeleccionado.instituciones_asignadas }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="instSeleccionada?.atc_nombres && atcSeleccionado &&
                     instSeleccionada.atc_email !== atcSeleccionado.email"
               class="alert-reemplazo">
            <AlertTriangle style="width:14px;height:14px;flex-shrink:0" />
            <div>
              Se reemplazará a <strong>{{ instSeleccionada.atc_nombres }} {{ instSeleccionada.atc_apellidos }}</strong>
              como ATC de esta institución.
            </div>
          </div>

          <div class="field-group">
            <label class="field-label"><CalendarDays style="width:13px;height:13px" /> Fecha de inicio</label>
            <input v-model="fechaInicio" type="date" class="date-input" />
          </div>

          <button class="btn-guardar"
            :disabled="!instSeleccionada || !atcSeleccionado || !fechaInicio || guardando"
            @click="guardar">
            <div v-if="guardando" class="spinner" />
            <Save v-else style="width:15px;height:15px" />
            {{ guardando ? 'Guardando...' : 'Guardar asignación' }}
          </button>

          <div v-if="resultadoMsg" class="resultado" :class="resultadoMsg.ok ? 'ok' : 'error'">
            <CheckCircle v-if="resultadoMsg.ok" style="width:14px;height:14px;flex-shrink:0" />
            <AlertCircle v-else style="width:14px;height:14px;flex-shrink:0" />
            {{ resultadoMsg.texto }}
          </div>
        </div>
      </div>

      <div class="panel-lista">
        <div class="lista-header">
          <h2 class="section-title">Asignaciones actuales</h2>
          <div class="lista-header-right">
            <div class="search-wrap">
              <Search class="search-ico2" />
              <input v-model="filtroTabla" class="search-input" placeholder="Buscar IE o ATC..." />
            </div>
            <button class="btn-refresh" @click="cargarDatos" :disabled="loadingInst">
              <RefreshCw style="width:13px;height:13px" :class="{ spinning: loadingInst }" />
            </button>
          </div>
        </div>

        <div v-if="loadingInst" class="loading-row"><div class="spinner-lg" /> Cargando...</div>

        <div v-else-if="asignacionesFiltradas.length === 0" class="empty-state">
          <UserCog style="width:28px;height:28px;opacity:.25;margin-bottom:6px" />
          <div>{{ filtroTabla ? 'Sin resultados.' : 'No hay asignaciones aún.' }}</div>
        </div>

        <div v-else class="tabla-wrap">
          <table class="tabla">
            <thead>
              <tr>
                <th>Código</th><th>Institución</th><th>UGEL</th>
                <th>ATC asignado</th><th>Email</th><th>Desde</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in asignacionesFiltradas" :key="a.id"
                :class="{ 'row-highlight': instSeleccionada?.id === a.institucion_id }"
                @click="preseleccionarFila(a)" style="cursor:pointer">
                <td class="mono">{{ a.codigo_ie }}</td>
                <td class="td-nombre">{{ a.nombre_institucion }}</td>
                <td class="ugel-cell">{{ a.ugel || '—' }}</td>
                <td>
                  <div class="atc-cell">
                    <div class="t-avatar-sm">{{ iniciales({ nombres: a.atc_nombres, apellidos: a.atc_apellidos }) }}</div>
                    <span>{{ a.atc_nombres }} {{ a.atc_apellidos }}</span>
                  </div>
                </td>
                <td class="email-cell">{{ a.atc_email }}</td>
                <td class="fecha-cell">{{ fmtFecha(a.fecha_inicio) }}</td>
                <td>
                  <button class="btn-desvincular" title="Desvincular" @click.stop="confirmarDesvincular(a)">
                    <Unlink style="width:13px;height:13px" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="tabla-footer">
            {{ asignacionesFiltradas.length }} asignaciones ·
            <span class="blue">{{ atcsActivos }} ATCs activos</span> ·
            <span class="amber">{{ instSinAtc }} IEs sin ATC</span>
          </div>
        </div>

        <div v-if="atcs.length > 0" class="resumen-atcs">
          <div class="resumen-title">Carga por ATC</div>
          <div class="resumen-grid">
            <div v-for="r in resumenAtcs" :key="r.id" class="resumen-card">
              <div class="rc-avatar">{{ iniciales(r) }}</div>
              <div class="rc-info">
                <div class="rc-nombre">{{ r.nombres }} {{ r.apellidos }}</div>
                <div class="rc-carga">{{ r.instituciones_asignadas }} IE{{ r.instituciones_asignadas !== 1 ? 's' : '' }}</div>
              </div>
              <div class="rc-badge" :class="r.instituciones_asignadas === 0 ? 'libre' : 'activo'">
                {{ r.instituciones_asignadas === 0 ? 'Libre' : 'Activo' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="modalDesvincular" class="modal-overlay" @click.self="modalDesvincular = null">
        <div class="modal-confirm">
          <div class="modal-confirm-ico">
            <Unlink style="width:24px;height:24px;color:#dc2626" />
          </div>
          <div class="modal-confirm-title">¿Desvincular ATC?</div>
          <div class="modal-confirm-sub">
            Se eliminará la asignación de
            <strong>{{ modalDesvincular.atc_nombres }} {{ modalDesvincular.atc_apellidos }}</strong>
            de la IE <strong>{{ modalDesvincular.nombre_institucion }}</strong>.
          </div>
          <div class="modal-confirm-actions">
            <button class="btn secondary" @click="modalDesvincular = null" :disabled="desvinculando">Cancelar</button>
            <button class="btn danger" @click="desvincular" :disabled="desvinculando">
              <div v-if="desvinculando" class="spinner" />
              <Unlink v-else class="btn-ico" />
              {{ desvinculando ? 'Desvinculando...' : 'Sí, desvincular' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  UserCog, School, Search, ChevronDown, X, Building2,
  AlertTriangle, AlertCircle, Save, CheckCircle,
  RefreshCw, CalendarDays, Unlink
} from 'lucide-vue-next'
import { useAuthStore }  from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'

const BASE  = 'http://localhost:3000/api'
const auth  = useAuthStore()
const toast = useToastStore()

const instituciones  = ref<any[]>([])
const atcs           = ref<any[]>([])
const asignaciones   = ref<any[]>([])
const loadingInst    = ref(false)
const loadingAtcs    = ref(false)
const guardando      = ref(false)
const desvinculando  = ref(false)
const resultadoMsg   = ref<{ ok: boolean; texto: string } | null>(null)
const modalDesvincular = ref<any>(null)

const busquedaInst    = ref('')
const busquedaAtc     = ref('')
const instSeleccionada = ref<any>(null)
const atcSeleccionado  = ref<any>(null)
const dropdownInstOpen = ref(false)
const dropdownAtcOpen  = ref(false)
const filtroTabla      = ref('')
const fechaInicio      = ref(hoyISO())

function hoyISO() { return new Date().toISOString().split('T')[0] }
function fmtFecha(f: string) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })
}
function iniciales(u: any) {
  return ((u.nombres?.[0] || '') + (u.apellidos?.[0] || '')).toUpperCase() || '??'
}
function headers(json = false) {
  const h: Record<string, string> = { Authorization: `Bearer ${auth.token}` }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

const instFiltradas = computed(() => {
  const q = busquedaInst.value.toLowerCase()
  if (!q) return instituciones.value.slice(0, 50)
  return instituciones.value.filter(ie =>
    ie.codigo?.toLowerCase().includes(q) ||
    ie.nombre?.toLowerCase().includes(q) ||
    ie.ugel?.toLowerCase().includes(q)
  ).slice(0, 30)
})

const atcsFiltrados = computed(() => {
  const q = busquedaAtc.value.toLowerCase()
  if (!q) return atcs.value.slice(0, 50)
  return atcs.value.filter(a =>
    a.nombres?.toLowerCase().includes(q) ||
    a.apellidos?.toLowerCase().includes(q) ||
    a.email?.toLowerCase().includes(q)
  ).slice(0, 30)
})

const asignacionesFiltradas = computed(() => {
  const q = filtroTabla.value.toLowerCase()
  if (!q) return asignaciones.value
  return asignaciones.value.filter(a =>
    a.nombre_institucion?.toLowerCase().includes(q) ||
    a.codigo_ie?.toLowerCase().includes(q) ||
    a.atc_nombres?.toLowerCase().includes(q) ||
    a.atc_apellidos?.toLowerCase().includes(q)
  )
})

const atcsActivos = computed(() => new Set(asignaciones.value.map(a => a.usuario_id)).size)
const instSinAtc  = computed(() => instituciones.value.filter(ie => !ie.atc_nombres).length)
const resumenAtcs = computed(() =>
  atcs.value.slice().sort((a, b) => b.instituciones_asignadas - a.instituciones_asignadas)
)

onMounted(() => cargarDatos())

async function cargarDatos() {
  loadingInst.value = true
  loadingAtcs.value = true
  try {
    const [asigRes, atcRes, instRes] = await Promise.all([
      fetch(`${BASE}/atc/asignaciones`, { headers: headers() }),
      fetch(`${BASE}/atc/lista`,        { headers: headers() }),
      fetch(`${BASE}/instituciones`,    { headers: headers() }),
    ])
    const asig:      any[] = asigRes.ok  ? await asigRes.json()  : []
    const listaAtcs: any[] = atcRes.ok   ? await atcRes.json()   : []
    const todasIEs:  any[] = instRes.ok  ? await instRes.json()  : []

    asignaciones.value = asig
    atcs.value         = listaAtcs

    const atcPorInst: Record<number, any> = {}
    asig.forEach(a => { atcPorInst[a.institucion_id] = a })

    instituciones.value = todasIEs.map(ie => ({
      ...ie,
      atc_nombres:   atcPorInst[ie.id]?.atc_nombres   ?? null,
      atc_apellidos: atcPorInst[ie.id]?.atc_apellidos ?? null,
      atc_email:     atcPorInst[ie.id]?.atc_email     ?? null,
      usuario_id:    atcPorInst[ie.id]?.usuario_id    ?? null,
    }))
  } catch (err: any) {
    toast.error('Error', 'No se pudieron cargar los datos')
  } finally {
    loadingInst.value = false
    loadingAtcs.value = false
  }
}

function seleccionarInst(ie: any) {
  instSeleccionada.value = ie
  busquedaInst.value     = `${ie.codigo} — ${ie.nombre}`
  dropdownInstOpen.value = false
  if (ie.usuario_id) {
    const actual = atcs.value.find(a => a.id === ie.usuario_id)
    if (actual) seleccionarAtc(actual)
  }
}
function limpiarInst() { instSeleccionada.value = null; busquedaInst.value = '' }

function seleccionarAtc(atc: any) {
  atcSeleccionado.value  = atc
  busquedaAtc.value      = `${atc.nombres} ${atc.apellidos}`
  dropdownAtcOpen.value  = false
}
function limpiarAtc() { atcSeleccionado.value = null; busquedaAtc.value = '' }

function onBlurInst() { setTimeout(() => { dropdownInstOpen.value = false }, 150) }
function onBlurAtc()  { setTimeout(() => { dropdownAtcOpen.value  = false }, 150) }

function preseleccionarFila(a: any) {
  const ie = instituciones.value.find(i => i.id === a.institucion_id)
  if (ie) seleccionarInst(ie)
}

async function guardar() {
  if (!instSeleccionada.value || !atcSeleccionado.value || !fechaInicio.value) return
  guardando.value    = true
  resultadoMsg.value = null
  try {
    const res  = await fetch(`${BASE}/atc/asignar`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify({
        usuario_id:     atcSeleccionado.value.id,
        institucion_id: instSeleccionada.value.id,
        fecha_inicio:   fechaInicio.value,
      }),
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      const anteriorId = instSeleccionada.value.usuario_id
      _parchearInstLocal(instSeleccionada.value.id, atcSeleccionado.value)
      _ajustarContadores(anteriorId, atcSeleccionado.value.id)

      resultadoMsg.value = {
        ok: true,
        texto: `${atcSeleccionado.value.nombres} ${atcSeleccionado.value.apellidos} asignado a ${instSeleccionada.value.nombre}`,
      }
      toast.success('Asignación guardada', resultadoMsg.value.texto)
      limpiarInst(); limpiarAtc()
      const asigRes = await fetch(`${BASE}/atc/asignaciones`, { headers: headers() })
      if (asigRes.ok) asignaciones.value = await asigRes.json()
    } else {
      resultadoMsg.value = { ok: false, texto: data.error || 'Error al guardar' }
      toast.error('Error', resultadoMsg.value.texto)
    }
  } catch (err: any) {
    resultadoMsg.value = { ok: false, texto: err.message }
    toast.error('Error', err.message)
  } finally {
    guardando.value = false
  }
}

function _parchearInstLocal(inst_id: number, atc: any) {
  const ie = instituciones.value.find(i => i.id === inst_id)
  if (!ie) return
  ie.atc_nombres = atc.nombres; ie.atc_apellidos = atc.apellidos
  ie.atc_email   = atc.email;   ie.usuario_id    = atc.id
}
function _ajustarContadores(anteriorId: number | null, nuevoId: number) {
  if (anteriorId) {
    const ant = atcs.value.find(a => a.id === anteriorId)
    if (ant && ant.instituciones_asignadas > 0) ant.instituciones_asignadas--
  }
  const nuevo = atcs.value.find(a => a.id === nuevoId)
  if (nuevo) nuevo.instituciones_asignadas++
}

function confirmarDesvincular(a: any) { modalDesvincular.value = a }

async function desvincular() {
  if (!modalDesvincular.value) return
  desvinculando.value = true
  try {
    const { usuario_id, institucion_id } = modalDesvincular.value
    const res = await fetch(`${BASE}/atc/desvincular`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify({ usuario_id, institucion_id }),
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      toast.success('ATC desvinculado', 'La asignación fue eliminada')
      const ie = instituciones.value.find(i => i.id === institucion_id)
      if (ie) { ie.atc_nombres = null; ie.atc_apellidos = null; ie.atc_email = null; ie.usuario_id = null }
      const atc = atcs.value.find(a => a.id === usuario_id)
      if (atc && atc.instituciones_asignadas > 0) atc.instituciones_asignadas--
      asignaciones.value = asignaciones.value.filter(
        a => !(a.usuario_id === usuario_id && a.institucion_id === institucion_id)
      )
      modalDesvincular.value = null
    } else {
      toast.error('Error', data.error)
    }
  } catch (err: any) {
    toast.error('Error', err.message)
  } finally {
    desvinculando.value = false
  }
}
</script>

<style scoped>
.page { width: 100%; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.page-title  { font-size: 26px; font-weight: 800; color: #1a2340; margin: 0; }
.page-sub    { font-size: 13px; color: #6b7597; margin-top: 2px; }
.layout { display: grid; grid-template-columns: 400px 1fr; gap: 20px; align-items: start; }
@media (max-width: 980px) { .layout { grid-template-columns: 1fr; } }
.form-card { background: #fff; border: 1px solid #d4dae8; border-radius: 14px; box-shadow: 0 2px 8px rgba(26,47,110,.05); overflow: hidden; }
.form-card-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #d4dae8; background: linear-gradient(135deg,#f0f4ff,#fafbfd); }
.form-icon  { width: 24px; height: 24px; color: #2c4fd4; flex-shrink: 0; }
.form-title { font-size: 14px; font-weight: 800; color: #1a2340; }
.form-sub   { font-size: 12px; color: #6b7597; margin-top: 2px; }
.form-body  { padding: 18px 20px; display: flex; flex-direction: column; gap: 18px; }
.field-group  { display: flex; flex-direction: column; gap: 7px; }
.field-label  { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; color: #1a2340; }
.select-loading { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6b7597; padding: 8px 0; }
.custom-select-wrap { position: relative; }
.select-ico   { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #9ba6c0; pointer-events: none; z-index: 1; }
.select-arrow { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #9ba6c0; pointer-events: none; transition: transform .2s; }
.select-arrow.open { transform: translateY(-50%) rotate(180deg); }
.select-search { width: 100%; padding: 9px 32px; border: 1.5px solid #d4dae8; border-radius: 9px; font-size: 13px; outline: none; color: #1a2340; box-sizing: border-box; background: #fff; }
.select-search:focus { border-color: #2c4fd4; }
.dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1.5px solid #d4dae8; border-radius: 10px; box-shadow: 0 8px 24px rgba(26,47,110,.12); z-index: 200; overflow: hidden; max-height: 280px; overflow-y: auto; }
.dropdown-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; cursor: pointer; border-bottom: 1px solid #f0f2f8; transition: background .1s; }
.dropdown-item:last-child { border-bottom: none; }
.dropdown-item:hover { background: #f0f4ff; }
.dropdown-item.selected { background: #eef2ff; }
.dropdown-empty { padding: 14px; text-align: center; color: #9ba6c0; font-size: 13px; }
.di-left  { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
.di-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.di-cod   { font-family: monospace; font-size: 11px; color: #9ba6c0; }
.di-nombre { font-size: 13px; font-weight: 600; color: #1a2340; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.di-email  { font-size: 11.5px; color: #6b7597; }
.di-actual { font-size: 11px; color: #6b7597; white-space: nowrap; }
.di-sin    { font-size: 11px; color: #9ba6c0; font-style: italic; }
.di-carga  { font-size: 11px; color: #2c4fd4; font-weight: 600; }
.di-avatar { width: 30px; height: 30px; border-radius: 50%; background: #1a2f6e; color: #fff; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ugel-badge { background: #e8f0fe; color: #2c4fd4; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; white-space: nowrap; }
.seleccion-card { border-radius: 10px; padding: 11px 13px; display: flex; flex-direction: column; gap: 8px; }
.inst-card { background: #f0f4ff; border: 1.5px solid #c5d0f0; }
.atc-card  { background: #fdf4ff; border: 1.5px solid #e9d5ff; }
.sc-header { display: flex; align-items: center; gap: 8px; }
.sc-nombre { font-size: 13px; font-weight: 700; color: #1a2340; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sc-clear  { background: none; border: none; cursor: pointer; color: #9ba6c0; display: flex; padding: 2px; border-radius: 4px; }
.sc-clear:hover { background: #e0e4f0; color: #1a2340; }
.sc-avatar { width: 28px; height: 28px; border-radius: 50%; background: #7c3aed; color: #fff; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sc-meta       { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sc-meta-item  { display: flex; flex-direction: column; gap: 1px; }
.sc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7597; }
.sc-meta-val   { font-size: 12.5px; font-weight: 600; color: #1a2340; }
.sc-meta-val.blue { color: #2c4fd4; }
.sc-meta-sin   { font-size: 12px; color: #9ba6c0; font-style: italic; }
.sc-divider    { width: 1px; height: 28px; background: #d4dae8; flex-shrink: 0; }
.mono { font-family: monospace; font-size: 12px; }
.date-input { padding: 8px 12px; border: 1.5px solid #d4dae8; border-radius: 8px; font-size: 13px; outline: none; color: #1a2340; width: 100%; box-sizing: border-box; }
.date-input:focus { border-color: #2c4fd4; }
.alert-reemplazo { display: flex; align-items: flex-start; gap: 10px; padding: 10px 13px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; font-size: 12.5px; color: #92400e; }
.alert-reemplazo strong { font-weight: 700; }
.btn-guardar { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 11px; border-radius: 10px; border: none; background: #1a2f6e; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .15s; box-shadow: 0 2px 8px rgba(26,47,110,.25); }
.btn-guardar:hover:not(:disabled) { background: #2c4fd4; }
.btn-guardar:disabled { opacity: .5; cursor: not-allowed; }
.resultado { display: flex; align-items: center; gap: 8px; padding: 10px 13px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.resultado.ok    { background: #dcfce7; color: #15803d; }
.resultado.error { background: #fee2e2; color: #dc2626; }
.panel-lista { display: flex; flex-direction: column; gap: 14px; }
.lista-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.lista-header-right { display: flex; align-items: center; gap: 8px; }
.section-title { font-size: 16px; font-weight: 800; color: #1a2340; margin: 0; }
.search-wrap  { position: relative; }
.search-ico2  { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); width: 13px; height: 13px; color: #9ba6c0; }
.search-input { padding: 7px 12px 7px 28px; border: 1.5px solid #d4dae8; border-radius: 8px; font-size: 13px; outline: none; color: #1a2340; width: 220px; }
.search-input:focus { border-color: #2c4fd4; }
.btn-refresh { background: #fff; border: 1.5px solid #d4dae8; border-radius: 8px; padding: 7px 9px; cursor: pointer; color: #6b7597; display: flex; transition: all .15s; }
.btn-refresh:hover:not(:disabled) { border-color: #2c4fd4; color: #2c4fd4; background: #f0f4ff; }
.btn-refresh:disabled { opacity: .5; cursor: not-allowed; }
.loading-row { display: flex; align-items: center; gap: 10px; padding: 36px; justify-content: center; color: #6b7597; }
.spinner-lg  { width: 20px; height: 20px; border: 3px solid #d4dae8; border-top-color: #2c4fd4; border-radius: 50%; animation: spin .6s linear infinite; }
.empty-state { text-align: center; color: #6b7597; padding: 44px; font-size: 13px; display: flex; flex-direction: column; align-items: center; }
.tabla-wrap { background: #fff; border: 1px solid #d4dae8; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(26,47,110,.05); }
.tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
.tabla thead th { background: #fafbfd; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #6b7597; padding: 10px 13px; border-bottom: 1px solid #d4dae8; text-align: left; white-space: nowrap; }
.tabla tbody td { padding: 9px 13px; border-bottom: 1px solid #f0f2f8; vertical-align: middle; color: black;}
.tabla tbody tr:last-child td { border-bottom: none; }
.tabla tbody tr:hover { background: #f7f9ff; }
.tabla tbody tr.row-highlight { background: #eef2ff !important; }
.tabla-footer { padding: 9px 13px; font-size: 12px; color: #9ba6c0; font-weight: 600; border-top: 1px solid #f0f2f8; background: #fafbfd; }
.tabla-footer .blue  { color: #2c4fd4; }
.tabla-footer .amber { color: #b45309; }
.td-nombre  { font-weight: 600; color: #1a2340; font-size: 12.5px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ugel-cell  { font-size: 12px; color: #6b7597; }
.email-cell { font-size: 12px; color: #6b7597; }
.fecha-cell { font-size: 12px; color: #6b7597; white-space: nowrap; }
.atc-cell   { display: flex; align-items: center; gap: 7px; }
.t-avatar-sm { width: 24px; height: 24px; border-radius: 50%; background: #7c3aed; color: #fff; font-size: 9px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.btn-desvincular { background: none; border: 1px solid #e8edf9; border-radius: 7px; padding: 5px; cursor: pointer; color: #9ba6c0; display: flex; transition: all .15s; }
.btn-desvincular:hover { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }
.resumen-atcs { background: #fff; border: 1px solid #d4dae8; border-radius: 14px; padding: 16px; box-shadow: 0 2px 8px rgba(26,47,110,.05); }
.resumen-title { font-size: 13px; font-weight: 800; color: #1a2340; margin-bottom: 12px; }
.resumen-grid { display: flex; flex-direction: column; gap: 8px; }
.resumen-card { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #f7f8fc; border-radius: 8px; }
.rc-avatar { width: 32px; height: 32px; border-radius: 50%; background: #1a2f6e; color: #fff; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rc-info { flex: 1; min-width: 0; }
.rc-nombre { font-size: 13px; font-weight: 600; color: #1a2340; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rc-carga  { font-size: 11.5px; color: #6b7597; }
.rc-badge  { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
.rc-badge.activo { background: #dcfce7; color: #15803d; }
.rc-badge.libre  { background: #f0f2f8; color: #9ba6c0; }
.modal-overlay { position: fixed; inset: 0; background: rgba(10,15,40,.55); backdrop-filter: blur(3px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-confirm { background: #fff; border-radius: 16px; max-width: 420px; width: 100%; padding: 28px; box-shadow: 0 24px 80px rgba(10,15,40,.25); display: flex; flex-direction: column; align-items: center; gap: 12px; }
.modal-confirm-ico { width: 52px; height: 52px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.modal-confirm-title { font-size: 17px; font-weight: 800; color: #1a2340; }
.modal-confirm-sub { font-size: 13.5px; color: #6b7597; text-align: center; line-height: 1.6; }
.modal-confirm-sub strong { color: #1a2340; }
.modal-confirm-actions { display: flex; gap: 10px; width: 100%; justify-content: center; margin-top: 8px; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; font-size: 13.5px; font-weight: 700; cursor: pointer; border: none; transition: all .15s; }
.btn.secondary { background: #fff; color: #1a2340; border: 1.5px solid #d4dae8; }
.btn.secondary:hover:not(:disabled) { background: #f0f4ff; border-color: #2c4fd4; color: #2c4fd4; }
.btn.danger { background: #dc2626; color: #fff; }
.btn.danger:hover:not(:disabled) { background: #b91c1c; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-ico { width: 14px; height: 14px; }
.spinner    { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
.spinner-sm { width: 14px; height: 14px; border: 2px solid #d4dae8; border-top-color: #2c4fd4; border-radius: 50%; animation: spin .6s linear infinite; }
.spinning   { animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>