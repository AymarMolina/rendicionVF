<template>
  <div class="page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Gestión de Tesoreros</h1>
        <p class="page-sub">Importación masiva desde Excel · Asignación automática por código modular</p>
      </div>
      <button class="btn secondary btn-sm" @click="cargarTesoreros" :disabled="loadingTabla">
        <RefreshCw class="btn-ico" :class="{ spinning: loadingTabla }" />
        Actualizar lista
      </button>
    </div>

    <div class="import-card mb">
      <div class="import-card-header">
        <div class="import-title-wrap">
          <Users class="import-icon" />
          <div>
            <div class="import-title">Importar Tesoreros desde Excel</div>
            <div class="import-sub">
              El Excel debe contener: columna F (Código modular) · columna R (Tesorero) · columna S (DNI)
            </div>
          </div>
        </div>
        <div class="formato-badge">
          <FileSpreadsheet style="width:12px;height:12px" />
          Formato PAE 2026
        </div>
      </div>

      <div class="import-body">
        <div
          class="drop-zone"
          :class="{ 'drag-over': dragging, 'has-file': archivoSeleccionado }"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
          @click="fileInput?.click()"
        >
          <input ref="fileInput" type="file" accept=".xlsx" style="display:none" @change="onFileChange" />
          <template v-if="!archivoSeleccionado">
            <FileSpreadsheet class="drop-ico" />
            <div class="drop-text"><strong>Arrastra el Excel aquí</strong> o haz clic para seleccionar</div>
            <div class="drop-hint">Solo archivos .xlsx · Máx. 10 MB</div>
          </template>
          <template v-else>
            <CheckCircle class="drop-ico green" />
            <div class="drop-text file-name">{{ archivoSeleccionado.name }}</div>
            <div class="drop-hint">{{ (archivoSeleccionado.size / 1024).toFixed(0) }} KB · Listo para importar</div>
          </template>
        </div>

        <div v-if="preview.length > 0" class="preview-wrap">
          <div class="preview-header">
            <Eye style="width:13px;height:13px" />
            Vista previa — {{ preview.length }} módulos detectados
            <span v-if="preview.filter(r=>!r.tiene_tesorero).length > 0" class="warn-badge">
              <AlertTriangle style="width:11px;height:11px" />
              {{ preview.filter(r=>!r.tiene_tesorero).length }} sin tesorero
            </span>
          </div>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>Cód. Modular</th>
                  <th>Nivel</th>
                  <th>Nombre IE</th>
                  <th>Tesorero</th>
                  <th>DNI</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in preview.slice(0, 10)" :key="i"
                    :class="{ 'row-warn': !row.tiene_tesorero }">
                  <td class="mono">{{ row.cod_modular }}</td>
                  <td>
                    <span class="nivel-badge" :class="row.nivel_norm">
                      {{ nivelLabel(row.nivel_norm) }}
                    </span>
                  </td>
                  <td class="nombre-ie">{{ row.nombre_ie }}</td>
                  <td>{{ row.tesorero || '—' }}</td>
                  <td class="mono">{{ row.dni || '—' }}</td>
                  <td>
                    <span v-if="row.tiene_tesorero" class="chip-ok">
                      <CheckCircle style="width:10px;height:10px" /> OK
                    </span>
                    <span v-else class="chip-warn">
                      <AlertTriangle style="width:10px;height:10px" /> Sin tesorero
                    </span>
                  </td>
                </tr>
                <tr v-if="preview.length > 10">
                  <td colspan="6" class="more-rows">
                    + {{ preview.length - 10 }} filas más...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="import-actions">
          <button v-if="archivoSeleccionado" class="btn secondary btn-sm" @click="limpiarArchivo" :disabled="importando">
            <X class="btn-ico" /> Quitar
          </button>
          <button
            class="btn primary"
            :disabled="!archivoSeleccionado || importando"
            @click="importar"
          >
            <div v-if="importando" class="spinner" />
            <Upload v-else class="btn-ico" />
            {{ importando ? 'Importando...' : 'Importar tesoreros' }}
          </button>
        </div>

        <div v-if="resultado" class="resultado-wrap">
          <div class="resultado-header" :class="resultado.ok ? 'ok' : 'error'">
            <CheckCircle v-if="resultado.ok" style="width:15px;height:15px;flex-shrink:0" />
            <AlertCircle v-else style="width:15px;height:15px;flex-shrink:0" />
            <template v-if="resultado.ok">
              {{ resultado.resumen.usuarios_creados }} usuarios creados ·
              {{ resultado.resumen.asignaciones_nuevas }} asignados ·
              {{ resultado.resumen.sin_tesorero }} sin tesorero
            </template>
            <template v-else>{{ resultado.error }}</template>
          </div>

          <div v-if="resultado.ok" class="resultado-stats">
            <div class="rstat">
              <UserCheck style="width:16px;height:16px;color:#2c4fd4" />
              <div>
                <div class="rstat-val">{{ resultado.resumen.usuarios_creados }}</div>
                <div class="rstat-label">Usuarios creados</div>
              </div>
            </div>
            <div class="rstat">
              <Link2 style="width:16px;height:16px;color:#16a34a" />
              <div>
                <div class="rstat-val green">{{ resultado.resumen.asignaciones_nuevas }}</div>
                <div class="rstat-label">Asignaciones nuevas</div>
              </div>
            </div>
            <div class="rstat">
              <AlertTriangle style="width:16px;height:16px;color:#b45309" />
              <div>
                <div class="rstat-val amber">{{ resultado.resumen.sin_tesorero }}</div>
                <div class="rstat-label">Sin tesorero</div>
              </div>
            </div>
            <div class="rstat">
              <XCircle style="width:16px;height:16px;color:#dc2626" />
              <div>
                <div class="rstat-val red">{{ resultado.resumen.omitidos }}</div>
                <div class="rstat-label">Omitidos</div>
              </div>
            </div>
          </div>

          <div v-if="resultado.ok" class="clave-notice">
            <KeyRound style="width:13px;height:13px" />
            Contraseña temporal para nuevos tesoreros: <strong>Pae2026</strong>
          </div>

          <div v-if="resultado.errores?.length" class="errores-list">
            <div v-for="e in resultado.errores" :key="e" class="error-item">
              <XCircle style="width:11px;height:11px;flex-shrink:0" /> {{ e }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title-row mb-sm">
      <h2 class="section-title">Tesoreros asignados actualmente</h2>
      <div class="search-wrap">
        <Search class="search-ico" />
        <input v-model="filtro" class="search-input" placeholder="Buscar por IE, código o nombre..." />
      </div>
    </div>

    <div v-if="loadingTabla" class="loading-row">
      <div class="spinner-lg" /> Cargando tesoreros...
    </div>

    <div v-else-if="tesorerosFiltrados.length === 0" class="empty-state">
      <Users style="width:32px;height:32px;opacity:.3;margin-bottom:8px" />
      <div>{{ filtro ? 'No hay resultados para tu búsqueda.' : 'Aún no hay tesoreros asignados.' }}</div>
    </div>

    <div v-else class="tabla-wrap">
      <table class="tabla">
        <thead>
          <tr>
            <th>Cód. Modular</th>
            <th>Nivel</th>
            <th>Institución Educativa</th>
            <th>Tesorero</th>
            <th>Email</th>
            <th>Asignado desde</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tesorerosFiltrados" :key="t.modulo_id">
            <td class="mono">{{ t.codigo_modular }}</td>
            <td>
              <span class="nivel-badge" :class="t.nivel">{{ nivelLabel(t.nivel) }}</span>
            </td>
            <td class="nombre-ie">{{ t.nombre_institucion }}</td>
            <td>
              <template v-if="t.tesorero_nombres">
                <div class="persona-nombre">{{ t.tesorero_nombres }} {{ t.tesorero_apellidos }}</div>
              </template>
              <span v-else class="sin-asignar">Sin tesorero</span>
            </td>
            <td class="email-cell">{{ t.tesorero_email || '—' }}</td>
            <td class="fecha-cell">{{ t.fecha_inicio ? fmtFecha(t.fecha_inicio) : '—' }}</td>
            <td>
              <span v-if="t.tesorero_nombres" class="chip-ok">
                <CheckCircle style="width:10px;height:10px" /> Asignado
              </span>
              <span v-else class="chip-pendiente">Pendiente</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="tabla-footer">
        Mostrando {{ tesorerosFiltrados.length }} de {{ tesoreros.length }} módulos
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Users, FileSpreadsheet, CheckCircle, AlertCircle, AlertTriangle,
  X, Upload, RefreshCw, Eye, Search, UserCheck, Link2,
  XCircle, KeyRound
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'

const BASE  = 'http://localhost:3000/api'
const auth  = useAuthStore()
const toast = useToastStore()

const fileInput           = ref<HTMLInputElement>()
const archivoSeleccionado = ref<File | null>(null)
const dragging            = ref(false)
const importando          = ref(false)
const resultado           = ref<any>(null)
const preview             = ref<any[]>([])

const tesoreros    = ref<any[]>([])
const loadingTabla = ref(false)
const filtro       = ref('')

function headers() {
  return { Authorization: `Bearer ${auth.token}` }
}
function fmtFecha(f: string) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
function nivelLabel(n: string) {
  return ({ inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' })[n] ?? n
}

const tesorerosFiltrados = computed(() => {
  if (!filtro.value) return tesoreros.value
  const q = filtro.value.toLowerCase()
  return tesoreros.value.filter(t =>
    t.codigo_modular?.toLowerCase().includes(q) ||
    t.nombre_institucion?.toLowerCase().includes(q) ||
    t.tesorero_nombres?.toLowerCase().includes(q) ||
    t.tesorero_apellidos?.toLowerCase().includes(q)
  )
})

onMounted(() => cargarTesoreros())

async function cargarTesoreros() {
  loadingTabla.value = true
  try {
    const res = await fetch(`${BASE}/importar/tesoreros`, { headers: headers() })
    tesoreros.value = await res.json()
  } catch {
    toast.error('Error', 'No se pudo cargar la lista de tesoreros')
  } finally {
    loadingTabla.value = false
  }
}

function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) seleccionarArchivo(f)
}
function onDrop(e: DragEvent) {
  dragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) seleccionarArchivo(f)
}

function seleccionarArchivo(f: File) {
  if (!f.name.endsWith('.xlsx')) {
    toast.error('Formato inválido', 'Solo se aceptan archivos .xlsx')
    return
  }
  archivoSeleccionado.value = f
  resultado.value = null
  generarPreview(f)
}

function limpiarArchivo() {
  archivoSeleccionado.value = null
  resultado.value = null
  preview.value = []
  if (fileInput.value) fileInput.value.value = ''
}

function generarPreview(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = e.target?.result
      if (!data) return
      // @ts-ignore
      if (typeof XLSX !== 'undefined') {
        // @ts-ignore
        const wb   = XLSX.read(data, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        // @ts-ignore
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
        const dataRows = rows.slice(1).filter((r: any) => r[5] != null)
        preview.value = dataRows.map((r: any) => ({
          cod_modular:   String(r[5] || '').trim(),
          nivel_norm:    String(r[6] || '').trim().toLowerCase().replace(' ', ''),
          nombre_ie:     String(r[3] || '').trim(),
          tesorero:      String(r[17] || '').trim() || null,
          dni:           String(r[18] || '').trim() || null,
          tiene_tesorero: !!(r[17] && r[18]),
        }))
      }
    } catch {  }
  }
  reader.readAsArrayBuffer(file)
}

async function importar() {
  if (!archivoSeleccionado.value) return
  importando.value = true
  resultado.value = null
  try {
    const form = new FormData()
    form.append('archivo', archivoSeleccionado.value)
    const res  = await fetch(`${BASE}/importar/tesoreros`, {
      method: 'POST',
      headers: headers(),
      body: form,
    })
    const data = await res.json()
    resultado.value = data
    if (data.ok) {
      toast.success('Importación completada', `${data.resumen.usuarios_creados} usuarios creados`)
      await cargarTesoreros()
    } else {
      toast.error('Error al importar', data.error)
    }
  } catch (err: any) {
    toast.error('Error', err.message)
  } finally {
    importando.value = false
  }
}
</script>

<style scoped>
.page { width: 100%; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 26px; font-weight: 800; color: #1a2340; margin: 0; }
.page-sub { font-size: 13px; color: #6b7597; margin-top: 2px; }
.mb { margin-bottom: 20px; }
.mb-sm { margin-bottom: 12px; }

/* Import card */
.import-card { background: #fff; border: 1px solid #d4dae8; border-radius: 14px; box-shadow: 0 2px 8px rgba(26,47,110,.05); overflow: hidden; }
.import-card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 22px; border-bottom: 1px solid #d4dae8; background: linear-gradient(135deg, #f0f4ff, #fafbfd); flex-wrap: wrap; gap: 10px; }
.import-title-wrap { display: flex; align-items: center; gap: 14px; }
.import-icon { width: 26px; height: 26px; color: #2c4fd4; flex-shrink: 0; }
.import-title { font-size: 14px; font-weight: 800; color: #1a2340; }
.import-sub { font-size: 12px; color: #6b7597; margin-top: 2px; }
.formato-badge { display: flex; align-items: center; gap: 5px; background: #e8f0fe; color: #2c4fd4; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; }
.import-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 16px; }

/* Drop zone */
.drop-zone { border: 2px dashed #c5d0f0; border-radius: 12px; padding: 28px; text-align: center; cursor: pointer; transition: all .2s; background: #f7f9ff; }
.drop-zone:hover, .drop-zone.drag-over { border-color: #2c4fd4; background: #eef2ff; }
.drop-zone.has-file { border-color: #16a34a; background: #f0fdf4; border-style: solid; }
.drop-ico { width: 34px; height: 34px; color: #6b7597; margin: 0 auto 8px; display: block; }
.drop-ico.green { color: #16a34a; }
.drop-text { font-size: 13.5px; color: #1a2340; }
.drop-text strong { color: #2c4fd4; }
.drop-text.file-name { font-weight: 700; color: #15803d; }
.drop-hint { font-size: 12px; color: #9ba6c0; margin-top: 4px; }

/* Preview */
.preview-wrap { border: 1px solid #d4dae8; border-radius: 10px; overflow: hidden; }
.preview-header { display: flex; align-items: center; gap: 7px; padding: 10px 14px; font-size: 12.5px; font-weight: 700; color: #1a2340; background: #f7f8fc; border-bottom: 1px solid #d4dae8; }
.warn-badge { display: flex; align-items: center; gap: 4px; background: #fef3c7; color: #b45309; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; margin-left: auto; }
.preview-table-wrap { overflow-x: auto; }
.preview-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.preview-table th { background: #fafbfd; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #6b7597; padding: 8px 12px; border-bottom: 1px solid #d4dae8; text-align: left; white-space: nowrap; }
.preview-table td { padding: 7px 12px; border-bottom: 1px solid #f0f2f8; vertical-align: middle; }
.preview-table tr:last-child td { border-bottom: none; }
.preview-table tr:hover { background: #f7f9ff; }
.preview-table tr.row-warn { background: #fffbeb; }
.more-rows { text-align: center; color: #9ba6c0; font-size: 12px; font-style: italic; padding: 10px; }

/* Acciones */
.import-actions { display: flex; justify-content: flex-end; gap: 8px; }

/* Resultado */
.resultado-wrap { border: 1px solid #d4dae8; border-radius: 10px; overflow: hidden; }
.resultado-header { display: flex; align-items: center; gap: 8px; padding: 11px 16px; font-size: 13px; font-weight: 700; }
.resultado-header.ok    { background: #dcfce7; color: #15803d; }
.resultado-header.error { background: #fee2e2; color: #dc2626; }

.resultado-stats { display: flex; border-bottom: 1px solid #d4dae8; }
.rstat { flex: 1; display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-right: 1px solid #d4dae8; }
.rstat:last-child { border-right: none; }
.rstat-val { font-size: 22px; font-weight: 800; color: #1a2340; }
.rstat-val.green { color: #16a34a; }
.rstat-val.amber { color: #b45309; }
.rstat-val.red   { color: #dc2626; }
.rstat-label { font-size: 11px; color: #6b7597; font-weight: 600; text-transform: uppercase; }

.clave-notice { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #fef9c3; font-size: 12.5px; color: #713f12; border-top: 1px solid #d4dae8; }
.clave-notice strong { font-weight: 800; letter-spacing: .5px; }
.errores-list { padding: 10px 16px; border-top: 1px solid #d4dae8; display: flex; flex-direction: column; gap: 4px; }
.error-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #7c2d12; }

/* Section header */
.section-title-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.section-title { font-size: 16px; font-weight: 800; color: #1a2340; margin: 0; }
.search-wrap { position: relative; }
.search-ico { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #9ba6c0; }
.search-input { padding: 7px 12px 7px 30px; border: 1.5px solid #d4dae8; border-radius: 8px; font-size: 13px; outline: none; width: 240px; color: #1a2340; }
.search-input:focus { border-color: #2c4fd4; }

/* Loading / empty */
.loading-row { display: flex; align-items: center; gap: 10px; padding: 40px; justify-content: center; color: #6b7597; }
.spinner-lg { width: 20px; height: 20px; border: 3px solid #d4dae8; border-top-color: #2c4fd4; border-radius: 50%; animation: spin .6s linear infinite; }
.empty-state { text-align: center; color: #6b7597; padding: 48px; font-size: 13.5px; display: flex; flex-direction: column; align-items: center; }

/* Tabla */
.tabla-wrap { background: #fff; border: 1px solid #d4dae8; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(26,47,110,.05); }
.tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
.tabla thead th { background: #fafbfd; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #6b7597; padding: 11px 14px; border-bottom: 1px solid #d4dae8; text-align: left; white-space: nowrap; }
.tabla tbody td { padding: 10px 14px; border-bottom: 1px solid #f0f2f8; vertical-align: middle; }
.tabla tbody tr:last-child td { border-bottom: none; }
.tabla tbody tr:hover { background: #f7f9ff; }
.tabla-footer { padding: 10px 14px; font-size: 12px; color: #9ba6c0; font-weight: 600; border-top: 1px solid #f0f2f8; background: #fafbfd; }

/* Celdas especiales */
.mono { font-family: monospace; font-size: 12px; color: #6b7597; }
.nombre-ie { max-width: 220px; font-weight: 600; color: #1a2340; font-size: 12.5px; }
.email-cell { font-size: 12px; color: #6b7597; }
.fecha-cell { font-size: 12px; color: #6b7597; white-space: nowrap; }
.persona-nombre { font-weight: 600; color: #1a2340; font-size: 13px; }
.sin-asignar { font-size: 12px; color: #9ba6c0; font-style: italic; }

/* Nivel badges */
.nivel-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
.nivel-badge.inicial,   .nivel-badge.inicial\    { background: #e0f2fe; color: #0369a1; }
.nivel-badge.primaria,  .nivel-badge.primaria\   { background: #dcfce7; color: #16a34a; }
.nivel-badge.secundaria { background: #fef3c7; color: #b45309; }

/* Chips */
.chip-ok { display: inline-flex; align-items: center; gap: 4px; background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; }
.chip-warn { display: inline-flex; align-items: center; gap: 4px; background: #fef3c7; color: #b45309; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; }
.chip-pendiente { background: #f0f4ff; color: #2c4fd4; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; }

/* Botones */
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; font-size: 13.5px; font-weight: 700; cursor: pointer; border: none; transition: all .15s; }
.btn-sm { padding: 6px 12px; font-size: 12.5px; }
.btn.primary { background: #1a2f6e; color: #fff; box-shadow: 0 2px 8px rgba(26,47,110,.25); }
.btn.primary:hover:not(:disabled) { background: #2c4fd4; }
.btn.secondary { background: #fff; color: #1a2340; border: 1.5px solid #d4dae8; }
.btn.secondary:hover:not(:disabled) { background: #f0f4ff; border-color: #2c4fd4; color: #2c4fd4; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-ico { width: 14px; height: 14px; }
.spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
.spinning { animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>