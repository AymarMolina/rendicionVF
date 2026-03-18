<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Asignar Tesorero</h1>
        <p class="page-sub">Asignación manual · Selecciona el módulo y el tesorero</p>
      </div>
    </div>

    <div class="layout">
      <div class="form-card">
        <div class="form-card-header">
          <UserCheck class="form-icon" />
          <div>
            <div class="form-title">Nueva asignación</div>
            <div class="form-sub">El tesorero reemplazará al actual si el módulo ya tiene uno asignado</div>
          </div>
        </div>

        <div class="form-body">

          <div class="field-group">
            <label class="field-label"><School style="width:13px;height:13px" /> Código modular / IE</label>
            <div v-if="store.loadingMod" class="select-loading"><div class="spinner-sm" /> Cargando módulos...</div>
            <div v-else-if="store.errorMod" class="select-error">
              <AlertCircle style="width:13px;height:13px" /> {{ store.errorMod }}
              <button class="retry-btn" @click="store.cargar(true)">Reintentar</button>
            </div>
            <div v-else class="custom-select-wrap">
              <Search class="select-ico" />
              <input v-model="busquedaModulo" class="select-search"
                placeholder="Buscar por código o nombre de IE..."
                @focus="dropdownModuloOpen = true" @blur="onBlurModulo" autocomplete="off" />
              <ChevronDown class="select-arrow" :class="{ open: dropdownModuloOpen }" />
              <div v-if="dropdownModuloOpen && modulosFiltrados.length > 0" class="dropdown">
                <div v-for="m in modulosFiltrados" :key="m.modulo_id" class="dropdown-item"
                  :class="{ selected: moduloSeleccionado?.modulo_id === m.modulo_id }"
                  @mousedown.prevent="seleccionarModulo(m)">
                  <div class="di-left">
                    <span class="di-cod">{{ m.codigo_modular }}</span>
                    <span class="di-nombre">{{ m.nombre_institucion }}</span>
                  </div>
                  <div class="di-right">
                    <span class="nivel-badge" :class="m.nivel">{{ nivelLabel(m.nivel) }}</span>
                    <span v-if="m.tesorero_nombres" class="di-actual">{{ m.tesorero_nombres }} {{ m.tesorero_apellidos }}</span>
                    <span v-else class="di-sin">Sin tesorero</span>
                  </div>
                </div>
              </div>
              <div v-if="dropdownModuloOpen && busquedaModulo.length >= 2 && modulosFiltrados.length === 0" class="dropdown">
                <div class="dropdown-empty">Sin resultados para "{{ busquedaModulo }}"</div>
              </div>
            </div>
            <div v-if="moduloSeleccionado" class="seleccion-card modulo-card">
              <div class="sc-header">
                <Building2 style="width:14px;height:14px;color:#2c4fd4;flex-shrink:0" />
                <div class="sc-nombre">{{ moduloSeleccionado.nombre_institucion }}</div>
                <span class="nivel-badge" :class="moduloSeleccionado.nivel">{{ nivelLabel(moduloSeleccionado.nivel) }}</span>
                <button class="sc-clear" @click="limpiarModulo"><X style="width:12px;height:12px" /></button>
              </div>
              <div class="sc-meta">
                <div class="sc-meta-item">
                  <span class="sc-meta-label">Código</span>
                  <span class="sc-meta-val mono">{{ moduloSeleccionado.codigo_modular }}</span>
                </div>
                <div class="sc-divider" />
                <div class="sc-meta-item">
                  <span class="sc-meta-label">Tesorero actual</span>
                  <span v-if="moduloSeleccionado.tesorero_nombres" class="sc-meta-val">
                    {{ moduloSeleccionado.tesorero_nombres }} {{ moduloSeleccionado.tesorero_apellidos }}
                  </span>
                  <span v-else class="sc-meta-sin">Sin asignar</span>
                </div>
              </div>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label"><User style="width:13px;height:13px" /> Tesorero</label>
            <div v-if="store.loadingTes" class="select-loading"><div class="spinner-sm" /> Cargando tesoreros...</div>
            <div v-else-if="store.errorTes" class="select-error">
              <AlertCircle style="width:13px;height:13px" /> {{ store.errorTes }}
              <button class="retry-btn" @click="store.cargar(true)">Reintentar</button>
            </div>
            <div v-else class="custom-select-wrap">
              <Search class="select-ico" />
              <input v-model="busquedaTesorero" class="select-search"
                placeholder="Buscar por nombre o DNI..."
                @focus="dropdownTesoreroOpen = true" @blur="onBlurTesorero" autocomplete="off" />
              <ChevronDown class="select-arrow" :class="{ open: dropdownTesoreroOpen }" />
              <div v-if="dropdownTesoreroOpen && tesorerosFiltrados.length > 0" class="dropdown">
                <div v-for="t in tesorerosFiltrados" :key="t.id" class="dropdown-item"
                  :class="{ selected: tesoreroSeleccionado?.id === t.id }"
                  @mousedown.prevent="seleccionarTesorero(t)">
                  <div class="di-avatar">{{ iniciales(t) }}</div>
                  <div class="di-left">
                    <span class="di-nombre">{{ t.nombres }} {{ t.apellidos }}</span>
                    <span class="di-email">{{ t.email }}</span>
                  </div>
                  <div class="di-right">
                    <span v-if="t.modulos_asignados > 0" class="di-carga">
                      {{ t.modulos_asignados }} módulo{{ t.modulos_asignados > 1 ? 's' : '' }}
                    </span>
                    <span v-else class="di-sin">Libre</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="tesoreroSeleccionado" class="seleccion-card tesorero-card">
              <div class="sc-header">
                <div class="sc-avatar">{{ iniciales(tesoreroSeleccionado) }}</div>
                <div class="sc-nombre">{{ tesoreroSeleccionado.nombres }} {{ tesoreroSeleccionado.apellidos }}</div>
                <button class="sc-clear" @click="limpiarTesorero"><X style="width:12px;height:12px" /></button>
              </div>
              <div class="sc-meta">
                <div class="sc-meta-item">
                  <span class="sc-meta-label">Email</span>
                  <span class="sc-meta-val">{{ tesoreroSeleccionado.email }}</span>
                </div>
                <div class="sc-divider" />
                <div class="sc-meta-item">
                  <span class="sc-meta-label">Módulos actuales</span>
                  <span class="sc-meta-val blue">{{ tesoreroSeleccionado.modulos_asignados }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="moduloSeleccionado?.tesorero_nombres && tesoreroSeleccionado &&
                     moduloSeleccionado.tesorero_email !== tesoreroSeleccionado.email"
               class="alert-reemplazo">
            <AlertTriangle style="width:14px;height:14px;flex-shrink:0" />
            <div>
              Se reemplazará a <strong>{{ moduloSeleccionado.tesorero_nombres }} {{ moduloSeleccionado.tesorero_apellidos }}</strong>
            </div>
          </div>

          <button class="btn-guardar"
            :disabled="!moduloSeleccionado || !tesoreroSeleccionado || guardando"
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
              <input v-model="filtroTabla" class="search-input" placeholder="Buscar..." />
            </div>
            <button class="btn-refresh" @click="store.cargar(true)" :disabled="store.loading">
              <RefreshCw style="width:13px;height:13px" :class="{ spinning: store.loading }" />
            </button>
          </div>
        </div>

        <div v-if="store.loadingMod" class="loading-row"><div class="spinner-lg" /> Cargando...</div>

        <div v-else-if="modulosFiltradosTabla.length === 0" class="empty-state">
          <Users style="width:28px;height:28px;opacity:.25;margin-bottom:6px" />
          <div>{{ filtroTabla ? 'Sin resultados.' : 'No hay módulos aún.' }}</div>
        </div>

        <div v-else class="tabla-wrap">
          <table class="tabla">
            <thead>
              <tr>
                <th>Código</th><th>Institución</th><th>Nivel</th>
                <th>Tesorero asignado</th><th>Email</th><th>Desde</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in modulosFiltradosTabla" :key="m.modulo_id"
                :class="{ 'row-highlight': moduloSeleccionado?.modulo_id === m.modulo_id }"
                @click="seleccionarModulo(m); busquedaModulo = m.codigo_modular + ' — ' + m.nombre_institucion"
                style="cursor:pointer">
                <td class="mono">{{ m.codigo_modular }}</td>
                <td class="td-nombre">{{ m.nombre_institucion }}</td>
                <td><span class="nivel-badge" :class="m.nivel">{{ nivelLabel(m.nivel) }}</span></td>
                <td>
                  <div v-if="m.tesorero_nombres" class="tesorero-cell">
                    <div class="t-avatar-sm">{{ iniciales({ nombres: m.tesorero_nombres, apellidos: m.tesorero_apellidos }) }}</div>
                    <span>{{ m.tesorero_nombres }} {{ m.tesorero_apellidos }}</span>
                  </div>
                  <span v-else class="sin-asignar">Sin tesorero</span>
                </td>
                <td class="email-cell">{{ m.tesorero_email || '—' }}</td>
                <td class="fecha-cell">{{ m.fecha_inicio ? fmtFecha(m.fecha_inicio) : '—' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="tabla-footer">
            {{ modulosFiltradosTabla.length }} módulos ·
            <span class="green">{{ store.modulosConTesorero }} con tesorero</span> ·
            <span class="amber">{{ store.modulosSinTesorero }} sin asignar</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  UserCheck, School, User, Search, ChevronDown, X,
  Building2, AlertTriangle, AlertCircle, Save, CheckCircle,
  RefreshCw, Users
} from 'lucide-vue-next'
import { useTesoreroStore } from '@/stores/tesorero.store'
import { useAuthStore }     from '@/stores/auth.store'
import { useToastStore }    from '@/stores/toast.store'

const BASE  = 'http://localhost:3000/api'
const store = useTesoreroStore()
const auth  = useAuthStore()
const toast = useToastStore()

const busquedaModulo       = ref('')
const busquedaTesorero     = ref('')
const moduloSeleccionado   = ref<any>(null)
const tesoreroSeleccionado = ref<any>(null)
const dropdownModuloOpen   = ref(false)
const dropdownTesoreroOpen = ref(false)
const filtroTabla          = ref('')
const guardando            = ref(false)
const resultadoMsg         = ref<{ ok: boolean; texto: string } | null>(null)

function fmtFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })
}
function nivelLabel(n: string) {
  return ({ inicial:'Inicial', primaria:'Primaria', secundaria:'Secundaria' })[n] ?? n
}
function iniciales(u: any) {
  return ((u.nombres?.[0] || '') + (u.apellidos?.[0] || '')).toUpperCase() || '??'
}
function headers(json = false) {
  const h: Record<string, string> = { Authorization: `Bearer ${auth.token}` }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

const modulosFiltrados = computed(() => {
  const q = busquedaModulo.value.toLowerCase()
  if (!q) return store.modulos.slice(0, 50)
  return store.modulos.filter(m =>
    m.codigo_modular?.toLowerCase().includes(q) ||
    m.nombre_institucion?.toLowerCase().includes(q)
  ).slice(0, 30)
})

const tesorerosFiltrados = computed(() => {
  const q = busquedaTesorero.value.toLowerCase()
  if (!q) return store.tesoreros.slice(0, 50)
  return store.tesoreros.filter(t =>
    t.nombres?.toLowerCase().includes(q) ||
    t.apellidos?.toLowerCase().includes(q) ||
    t.email?.toLowerCase().includes(q)
  ).slice(0, 30)
})

const modulosFiltradosTabla = computed(() => {
  const q = filtroTabla.value.toLowerCase()
  if (!q) return store.modulos
  return store.modulos.filter(m =>
    m.codigo_modular?.toLowerCase().includes(q) ||
    m.nombre_institucion?.toLowerCase().includes(q) ||
    m.tesorero_nombres?.toLowerCase().includes(q) ||
    m.tesorero_apellidos?.toLowerCase().includes(q)
  )
})

onMounted(() => store.cargar())

function seleccionarModulo(m: any) {
  moduloSeleccionado.value = m
  busquedaModulo.value     = `${m.codigo_modular} — ${m.nombre_institucion}`
  dropdownModuloOpen.value = false
}
function limpiarModulo() {
  moduloSeleccionado.value = null
  busquedaModulo.value     = ''
}
function seleccionarTesorero(t: any) {
  tesoreroSeleccionado.value  = t
  busquedaTesorero.value      = `${t.nombres} ${t.apellidos}`
  dropdownTesoreroOpen.value  = false
}
function limpiarTesorero() {
  tesoreroSeleccionado.value = null
  busquedaTesorero.value     = ''
}
function onBlurModulo()   { setTimeout(() => { dropdownModuloOpen.value   = false }, 150) }
function onBlurTesorero() { setTimeout(() => { dropdownTesoreroOpen.value = false }, 150) }

async function guardar() {
  if (!moduloSeleccionado.value || !tesoreroSeleccionado.value) return
  guardando.value    = true
  resultadoMsg.value = null

  try {
    const res  = await fetch(`${BASE}/importar/tesoreros/asignar`, {
      method: 'POST', headers: headers(true),
      body: JSON.stringify({
        modulo_id:  moduloSeleccionado.value.modulo_id,
        usuario_id: tesoreroSeleccionado.value.id,
      }),
    })
    const data = await res.json()

    if (res.ok && data.ok) {
      store.actualizarModuloLocal(
        moduloSeleccionado.value.modulo_id,
        tesoreroSeleccionado.value
      )
      resultadoMsg.value = {
        ok: true,
        texto: `${tesoreroSeleccionado.value.nombres} ${tesoreroSeleccionado.value.apellidos} asignado correctamente`,
      }
      toast.success('Asignación guardada', resultadoMsg.value.texto)
      limpiarModulo()
      limpiarTesorero()
    } else {
      resultadoMsg.value = { ok: false, texto: data.error || 'Error al guardar' }
      toast.error('Error', resultadoMsg.value.texto)
      store.cargar(true) 
    }
  } catch (err: any) {
    resultadoMsg.value = { ok: false, texto: err.message }
    toast.error('Error', err.message)
    store.cargar(true)
  } finally {
    guardando.value = false
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
.select-error   { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #dc2626; padding: 8px 0; }
.retry-btn { margin-left: 6px; font-size: 12px; color: #2c4fd4; background: none; border: none; cursor: pointer; text-decoration: underline; padding: 0; }
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
.seleccion-card { border-radius: 10px; padding: 11px 13px; display: flex; flex-direction: column; gap: 8px; }
.modulo-card    { background: #f0f4ff; border: 1.5px solid #c5d0f0; }
.tesorero-card  { background: #f0fdf4; border: 1.5px solid #bbf7d0; }
.sc-header { display: flex; align-items: center; gap: 8px; }
.sc-nombre { font-size: 13px; font-weight: 700; color: #1a2340; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sc-clear  { background: none; border: none; cursor: pointer; color: #9ba6c0; display: flex; padding: 2px; border-radius: 4px; }
.sc-clear:hover { background: #e0e4f0; color: #1a2340; }
.sc-avatar { width: 28px; height: 28px; border-radius: 50%; background: #16a34a; color: #fff; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sc-meta       { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sc-meta-item  { display: flex; flex-direction: column; gap: 1px; }
.sc-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7597; }
.sc-meta-val   { font-size: 12.5px; font-weight: 600; color: #1a2340; }
.sc-meta-val.blue { color: #2c4fd4; }
.sc-meta-sin   { font-size: 12px; color: #9ba6c0; font-style: italic; }
.sc-divider    { width: 1px; height: 28px; background: #d4dae8; flex-shrink: 0; }
.mono { font-family: monospace; font-size: 12px; }
.alert-reemplazo { display: flex; align-items: flex-start; gap: 10px; padding: 10px 13px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; font-size: 12.5px; color: #92400e; }
.alert-reemplazo strong { font-weight: 700; }
.btn-guardar { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 11px; border-radius: 10px; border: none; background: #1a2f6e; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .15s; box-shadow: 0 2px 8px rgba(26,47,110,.25); }
.btn-guardar:hover:not(:disabled) { background: #2c4fd4; }
.btn-guardar:disabled { opacity: .5; cursor: not-allowed; }
.resultado { display: flex; align-items: center; gap: 8px; padding: 10px 13px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.resultado.ok    { background: #dcfce7; color: #15803d; }
.resultado.error { background: #fee2e2; color: #dc2626; }
.panel-lista { display: flex; flex-direction: column; gap: 10px; }
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
.tabla tbody td { padding: 9px 13px; border-bottom: 1px solid #f0f2f8; vertical-align: middle; color:rgb(26, 25, 25)}
.tabla tbody tr:last-child td { border-bottom: none; }
.tabla tbody tr:hover { background: #f7f9ff; }
.tabla tbody tr.row-highlight { background: #eef2ff !important; }
.tabla-footer { padding: 9px 13px; font-size: 12px; color: #9ba6c0; font-weight: 600; border-top: 1px solid #f0f2f8; background: #fafbfd; }
.tabla-footer .green { color: #16a34a; }
.tabla-footer .amber { color: #b45309; }
.td-nombre   { font-weight: 600; color: #1a2340; font-size: 12.5px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.email-cell  { font-size: 12px; color: #6b7597; }
.fecha-cell  { font-size: 12px; color: #6b7597; white-space: nowrap; }
.sin-asignar { font-size: 12px; color: #9ba6c0; font-style: italic; }
.tesorero-cell { display: flex; align-items: center; gap: 7px; }
.t-avatar-sm { width: 24px; height: 24px; border-radius: 50%; background: #1a2f6e; color: #fff; font-size: 9px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nivel-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
.nivel-badge.inicial    { background: #e0f2fe; color: #0369a1; }
.nivel-badge.primaria   { background: #dcfce7; color: #16a34a; }
.nivel-badge.secundaria { background: #fef3c7; color: #b45309; }
.spinner    { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
.spinner-sm { width: 14px; height: 14px; border: 2px solid #d4dae8; border-top-color: #2c4fd4; border-radius: 50%; animation: spin .6s linear infinite; }
.spinning   { animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>