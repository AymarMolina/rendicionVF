<template>
  <div class="page">

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Panel del Coordinador</h1>
        <p class="page-sub">Importación y liberación de transferencias PAE · {{ anioActual }}</p>
      </div>
    </div>

    <!-- ── Import card ────────────────────────────────────────────────── -->
    <div class="import-card mb">
      <div class="import-card-header">
        <div class="import-title-wrap">
          <Upload class="import-icon" />
          <div>
            <div class="import-title">Importar Excel de Subvención</div>
            <div class="import-sub">Carga ciclos y presupuestos por rubro · Las transferencias se liberan después por ciclo</div>
          </div>
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
            <div class="drop-hint">{{ (archivoSeleccionado.size / 1024).toFixed(0) }} KB · Listo</div>
          </template>
        </div>

        <div class="import-actions">
          <button v-if="archivoSeleccionado" class="btn secondary btn-sm" @click="limpiarArchivo" :disabled="importando">
            <X class="btn-ico" /> Quitar
          </button>
          <button class="btn primary" :disabled="!archivoSeleccionado || importando" @click="importar">
            <div v-if="importando" class="spinner" />
            <Upload v-else class="btn-ico" />
            {{ importando ? 'Importando...' : 'Importar' }}
          </button>
        </div>

        <!-- Resultado import -->
        <div v-if="resultadoImport" class="resultado-wrap">
          <div class="resultado-header" :class="resultadoImport.ok ? 'ok' : 'error'">
            <CheckCircle v-if="resultadoImport.ok" style="width:15px;height:15px;flex-shrink:0" />
            <AlertCircle v-else style="width:15px;height:15px;flex-shrink:0" />
            {{ resultadoImport.ok
              ? `${resultadoImport.resumen.modulos_procesados} módulos importados · ${resultadoImport.resumen.asignaciones_creadas} asignaciones creadas`
              : resultadoImport.error }}
          </div>
          <div v-if="resultadoImport.errores?.length" class="errores-list">
            <div v-for="e in resultadoImport.errores" :key="e" class="error-item">{{ e }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Ciclos ──────────────────────────────────────────────────────── -->
    <div class="section-title-row mb-sm">
      <h2 class="section-title">Ciclos del año {{ anioActual }}</h2>
      <button class="btn secondary btn-sm" @click="cargarCiclos" :disabled="loadingCiclos">
        <RefreshCw class="btn-ico" :class="{ spinning: loadingCiclos }" />
      </button>
    </div>

    <div v-if="loadingCiclos" class="loading-row">
      <div class="spinner-lg" /> Cargando ciclos...
    </div>

    <div v-else-if="ciclos.length === 0" class="empty-state">
      No hay ciclos aún. Importa un Excel para comenzar.
    </div>

    <div v-else class="ciclos-grid mb">
      <div v-for="ciclo in ciclos" :key="ciclo.id" class="ciclo-card">
        <div class="ciclo-header">
          <div class="ciclo-nombre">{{ ciclo.nombre }}</div>
          <span class="ciclo-estado" :class="estadoCiclo(ciclo)">
            {{ estadoCicloLabel(ciclo) }}
          </span>
        </div>

        <div class="ciclo-dates">
          <CalendarDays style="width:12px;height:12px" />
          {{ fmtFecha(ciclo.fecha_inicio) }} – {{ fmtFecha(ciclo.fecha_fin) }}
        </div>

        <div class="ciclo-stats">
          <div class="ciclo-stat">
            <span class="ciclo-stat-val">{{ ciclo.total_asignaciones }}</span>
            <span class="ciclo-stat-label">Módulos</span>
          </div>
          <div class="ciclo-stat">
            <span class="ciclo-stat-val blue">{{ ciclo.total_transferencias }}</span>
            <span class="ciclo-stat-label">Transferencias</span>
          </div>
          <div class="ciclo-stat">
            <span class="ciclo-stat-val green">{{ fmt(ciclo.monto_total) }}</span>
            <span class="ciclo-stat-label">Monto total</span>
          </div>
        </div>

        <!-- Barra de progreso de liberación -->
        <div class="progress-wrap" v-if="ciclo.total_asignaciones > 0">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: pctLiberado(ciclo) + '%' }" />
          </div>
          <span class="progress-label">{{ ciclo.asignaciones_liberadas }}/{{ ciclo.total_asignaciones }} liberadas</span>
        </div>

        <button
          class="btn-liberar"
          :class="{ 'fully-liberated': estadoCiclo(ciclo) === 'liberado' }"
          :disabled="ciclo.total_asignaciones === 0 || estadoCiclo(ciclo) === 'liberado'"
          @click="abrirModalLiberar(ciclo)"
        >
          <Unlock v-if="estadoCiclo(ciclo) !== 'liberado'" class="btn-ico" />
          <Lock v-else class="btn-ico" />
          {{ estadoCiclo(ciclo) === 'liberado' ? 'Ciclo liberado' :
             estadoCiclo(ciclo) === 'parcial'  ? 'Continuar liberación' : 'Liberar ciclo' }}
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- MODAL DE LIBERACIÓN                                               -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="modalVisible" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal">

          <div class="modal-header">
            <div>
              <div class="modal-title">Liberar ciclo — {{ cicloActivo?.nombre }}</div>
              <div class="modal-sub">Revisa y ajusta los valores antes de confirmar</div>
            </div>
            <button class="modal-close" @click="cerrarModal"><X /></button>
          </div>

          <!-- Fecha de envío global -->
          <div class="modal-fecha-row">
            <label class="field-label">
              <CalendarDays style="width:14px;height:14px" />
              Fecha de envío para todas las transferencias
            </label>
            <input v-model="fechaEnvio" type="date" class="date-input" />
          </div>

          <div v-if="loadingModulos" class="loading-row">
            <div class="spinner-lg" /> Cargando módulos...
          </div>

          <template v-else>
            <!-- Tabla editable de módulos -->
            <div class="modal-table-wrap">
              <table class="modal-table">
                <thead>
                  <tr>
                    <th class="th-modulo">Módulo / IE</th>
                    <th class="th-nivel">Nivel</th>
                    <th class="th-num">N° Transf.</th>
                    <th class="th-monto">Monto x Transf.</th>
                    <th class="th-rubro">Alimentos</th>
                    <th class="th-rubro">Transporte</th>
                    <th class="th-rubro">Gas</th>
                    <th class="th-rubro">Estipendio</th>
                    <th class="th-rubro">Limpieza</th>
                    <th class="th-rubro">Otros</th>
                    <th class="th-estado">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(mod, idx) in modulosEditables" :key="mod.asignacion_id"
                      :class="{ 'row-liberado': mod.transferencias_creadas > 0 }">
                    <td class="td-modulo">
                      <div class="mod-cod">{{ mod.codigo_modular }}</div>
                      <div class="mod-nombre">{{ mod.nombre_ie }}</div>
                    </td>
                    <td>
                      <span class="nivel-badge" :class="mod.nivel">{{ nivelLabel(mod.nivel) }}</span>
                    </td>
                    <td>
                      <input
                        v-model.number="modulosEditables[idx].num_transferencias"
                        type="number" min="1" max="10"
                        class="num-input"
                        :disabled="mod.transferencias_creadas > 0"
                      />
                    </td>
                    <td>
                      <div class="money-input-wrap">
                        <span class="money-prefix">S/</span>
                        <input
                          v-model.number="modulosEditables[idx].monto_x_transferencia"
                          type="number" step="0.01" min="0"
                          class="money-input"
                          :disabled="mod.transferencias_creadas > 0"
                        />
                      </div>
                    </td>
                    <!-- Rubros -->
                    <td v-for="rubro in RUBROS" :key="rubro.key">
                      <div class="money-input-wrap">
                        <span class="money-prefix">S/</span>
                        <input
                          v-model.number="modulosEditables[idx][rubro.key]"
                          type="number" step="0.01" min="0"
                          class="money-input rubro-input"
                          :disabled="mod.transferencias_creadas > 0"
                        />
                      </div>
                    </td>
                    <td>
                      <span v-if="mod.transferencias_creadas > 0" class="chip-ok">
                        <CheckCircle style="width:11px;height:11px" /> Liberado
                      </span>
                      <span v-else class="chip-pendiente">Pendiente</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Resumen del total -->
            <div class="modal-resumen">
              <div class="resumen-item-sm">
                <span class="r-label">Módulos a liberar</span>
                <span class="r-val">{{ modulosPendientes.length }}</span>
              </div>
              <div class="resumen-item-sm">
                <span class="r-label">Transferencias a crear</span>
                <span class="r-val blue">{{ totalTransfACrear }}</span>
              </div>
              <div class="resumen-item-sm">
                <span class="r-label">Monto total a liberar</span>
                <span class="r-val green">{{ fmt(montoTotalALiberar) }}</span>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn secondary" @click="cerrarModal" :disabled="liberando">Cancelar</button>
              <button
                class="btn primary"
                :disabled="liberando || modulosPendientes.length === 0 || !fechaEnvio"
                @click="confirmarLiberacion"
              >
                <div v-if="liberando" class="spinner" />
                <Unlock v-else class="btn-ico" />
                {{ liberando ? 'Liberando...' : `Liberar ${modulosPendientes.length} módulos` }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle,
  X, CalendarDays, RefreshCw, Unlock, Lock
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'

const BASE  = 'http://localhost:3000/api'
const auth  = useAuthStore()
const toast = useToastStore()

const RUBROS = [
  { key: 'presup_alimentos',  label: 'Alimentos'  },
  { key: 'presup_transporte', label: 'Transporte' },
  { key: 'presup_gas',        label: 'Gas'        },
  { key: 'presup_estipendio', label: 'Estipendio' },
  { key: 'presup_limpieza',   label: 'Limpieza'   },
  { key: 'presup_otros',      label: 'Otros'      },
]

// ── Estado general ────────────────────────────────────────────────────────
const anioActual      = new Date().getFullYear()
const fileInput       = ref<HTMLInputElement>()
const archivoSeleccionado = ref<File | null>(null)
const dragging        = ref(false)
const importando      = ref(false)
const resultadoImport = ref<any>(null)

const ciclos       = ref<any[]>([])
const loadingCiclos = ref(false)

// ── Estado modal ──────────────────────────────────────────────────────────
const modalVisible      = ref(false)
const cicloActivo       = ref<any>(null)
const modulosEditables  = ref<any[]>([])
const loadingModulos    = ref(false)
const liberando         = ref(false)
const fechaEnvio        = ref(hoyISO())

// ── Helpers ───────────────────────────────────────────────────────────────
function hoyISO() {
  return new Date().toISOString().split('T')[0]
}
function fmt(n: number) {
  return 'S/ ' + (n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtFecha(f: string) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })
}
function nivelLabel(n: string) {
  return ({ inicial:'Inicial', primaria:'Primaria', secundaria:'Secundaria' })[n] ?? n
}
function headers() {
  return { Authorization: `Bearer ${auth.token}` }
}
function estadoCiclo(c: any) {
  if (!c.total_asignaciones)          return 'sin_datos'
  if (c.asignaciones_liberadas === 0) return 'pendiente'
  if (c.asignaciones_liberadas < c.total_asignaciones) return 'parcial'
  return 'liberado'
}
function estadoCicloLabel(c: any) {
  return ({ sin_datos:'Sin datos', pendiente:'Pendiente', parcial:'Parcialmente liberado', liberado:'Liberado' })[estadoCiclo(c)] ?? ''
}
function pctLiberado(c: any) {
  if (!c.total_asignaciones) return 0
  return Math.round((c.asignaciones_liberadas / c.total_asignaciones) * 100)
}

// ── Computed modal ────────────────────────────────────────────────────────
const modulosPendientes = computed(() =>
  modulosEditables.value.filter(m => m.transferencias_creadas === 0)
)

const totalTransfACrear = computed(() =>
  modulosPendientes.value.reduce((s, m) => s + Number(m.num_transferencias || 0), 0)
)

const montoTotalALiberar = computed(() =>
  modulosPendientes.value.reduce((s, m) =>
    s + Number(m.num_transferencias || 0) * Number(m.monto_x_transferencia || 0), 0)
)

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(() => cargarCiclos())

// ── Ciclos ────────────────────────────────────────────────────────────────
async function cargarCiclos() {
  loadingCiclos.value = true
  try {
    const res  = await fetch(`${BASE}/importar/ciclos`, { headers: headers() })
    ciclos.value = await res.json()
  } catch {
    toast.error('Error', 'No se pudieron cargar los ciclos')
  } finally {
    loadingCiclos.value = false
  }
}

// ── Import ────────────────────────────────────────────────────────────────
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
  if (!f.name.endsWith('.xlsx')) { toast.error('Formato inválido', 'Solo .xlsx'); return }
  archivoSeleccionado.value = f
  resultadoImport.value = null
}
function limpiarArchivo() {
  archivoSeleccionado.value = null
  resultadoImport.value = null
  if (fileInput.value) fileInput.value.value = ''
}
async function importar() {
  if (!archivoSeleccionado.value) return
  importando.value = true
  resultadoImport.value = null
  try {
    const form = new FormData()
    form.append('archivo', archivoSeleccionado.value)
    const res  = await fetch(`${BASE}/importar/transferencias`, { method:'POST', headers:headers(), body:form })
    const data = await res.json()
    resultadoImport.value = data
    if (data.ok) {
      toast.success('Excel importado', `${data.resumen.asignaciones_creadas} asignaciones creadas`)
      await cargarCiclos()
    } else {
      toast.error('Error al importar', data.error)
    }
  } catch (e: any) {
    toast.error('Error', e.message)
  } finally {
    importando.value = false
  }
}

// ── Modal liberar ─────────────────────────────────────────────────────────
async function abrirModalLiberar(ciclo: any) {
  cicloActivo.value  = ciclo
  modalVisible.value = true
  fechaEnvio.value   = hoyISO()
  loadingModulos.value = true
  modulosEditables.value = []

  try {
    const res  = await fetch(`${BASE}/importar/ciclos/${ciclo.id}/modulos`, { headers: headers() })
    const data = await res.json()
    // Clonar para edición local
    modulosEditables.value = data.map((m: any) => ({ ...m }))
  } catch {
    toast.error('Error', 'No se pudieron cargar los módulos')
    modalVisible.value = false
  } finally {
    loadingModulos.value = false
  }
}

function cerrarModal() {
  if (liberando.value) return
  modalVisible.value = false
  cicloActivo.value  = null
  modulosEditables.value = []
}

async function confirmarLiberacion() {
  if (!fechaEnvio.value || modulosPendientes.value.length === 0) return
  liberando.value = true
  try {
    const body = {
      fecha_envio: fechaEnvio.value,
      modulos: modulosPendientes.value.map(m => ({
        asignacion_id:       m.asignacion_id,
        num_transferencias:  m.num_transferencias,
        monto_x_transferencia: m.monto_x_transferencia,
        presup_alimentos:    m.presup_alimentos,
        presup_transporte:   m.presup_transporte,
        presup_gas:          m.presup_gas,
        presup_estipendio:   m.presup_estipendio,
        presup_limpieza:     m.presup_limpieza,
        presup_otros:        m.presup_otros,
      }))
    }
    const res  = await fetch(`${BASE}/importar/ciclos/${cicloActivo.value.id}/liberar`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()

    if (data.ok) {
      toast.success('Ciclo liberado', `${data.transferencias_creadas} transferencias creadas`)
      cerrarModal()
      await cargarCiclos()
    } else {
      toast.error('Error al liberar', data.error)
    }
  } catch (e: any) {
    toast.error('Error', e.message)
  } finally {
    liberando.value = false
  }
}
</script>

<style scoped>
.page { width: 100%; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 26px; font-weight: 800; color: #1a2340; margin: 0; }
.page-sub { font-size: 13px; color: #6b7597; margin-top: 2px; }
.mb { margin-bottom: 20px; }
.mb-sm { margin-bottom: 12px; }

/* Section title */
.section-title-row { display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: 16px; font-weight: 800; color: #1a2340; margin: 0; }

/* Import card */
.import-card { background: #fff; border: 1px solid #d4dae8; border-radius: 14px; box-shadow: 0 2px 8px rgba(26,47,110,.05); overflow: hidden; }
.import-card-header { display: flex; align-items: center; padding: 16px 22px; border-bottom: 1px solid #d4dae8; background: linear-gradient(135deg,#f0f4ff,#fafbfd); }
.import-title-wrap { display: flex; align-items: center; gap: 14px; }
.import-icon { width: 26px; height: 26px; color: #2c4fd4; flex-shrink: 0; }
.import-title { font-size: 14px; font-weight: 800; color: #1a2340; }
.import-sub { font-size: 12px; color: #6b7597; margin-top: 2px; }
.import-body { padding: 18px 22px; }

.drop-zone { border: 2px dashed #c5d0f0; border-radius: 12px; padding: 28px; text-align: center; cursor: pointer; transition: all .2s; background: #f7f9ff; }
.drop-zone:hover, .drop-zone.drag-over { border-color: #2c4fd4; background: #eef2ff; }
.drop-zone.has-file { border-color: #16a34a; background: #f0fdf4; border-style: solid; }
.drop-ico { width: 34px; height: 34px; color: #6b7597; margin: 0 auto 8px; display: block; }
.drop-ico.green { color: #16a34a; }
.drop-text { font-size: 13.5px; color: #1a2340; }
.drop-text strong { color: #2c4fd4; }
.drop-text.file-name { font-weight: 700; color: #15803d; }
.drop-hint { font-size: 12px; color: #9ba6c0; margin-top: 4px; }
.import-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }

.resultado-wrap { margin-top: 14px; border: 1px solid #d4dae8; border-radius: 10px; overflow: hidden; }
.resultado-header { display: flex; align-items: center; gap: 8px; padding: 11px 14px; font-size: 13px; font-weight: 700; }
.resultado-header.ok    { background: #dcfce7; color: #15803d; }
.resultado-header.error { background: #fee2e2; color: #dc2626; }
.errores-list { padding: 10px 14px; }
.error-item { font-size: 12px; color: #7c2d12; padding: 2px 0; }

/* Ciclos grid */
.ciclos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.ciclo-card { background: #fff; border: 1px solid #d4dae8; border-radius: 14px; padding: 18px 20px; box-shadow: 0 2px 8px rgba(26,47,110,.05); display: flex; flex-direction: column; gap: 12px; }

.ciclo-header { display: flex; align-items: center; justify-content: space-between; }
.ciclo-nombre { font-size: 14px; font-weight: 800; color: #1a2340; }

.ciclo-estado { font-size: 10.5px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.ciclo-estado.pendiente   { background: #f0f4ff; color: #2c4fd4; }
.ciclo-estado.parcial     { background: #fef3c7; color: #b45309; }
.ciclo-estado.liberado    { background: #dcfce7; color: #15803d; }
.ciclo-estado.sin_datos   { background: #f0f2f8; color: #9ba6c0; }

.ciclo-dates { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #6b7597; }

.ciclo-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
.ciclo-stat { text-align: center; background: #f7f8fc; border-radius: 8px; padding: 8px 4px; }
.ciclo-stat-val { display: block; font-size: 16px; font-weight: 800; color: #1a2340; }
.ciclo-stat-val.blue  { color: #2c4fd4; }
.ciclo-stat-val.green { color: #16a34a; font-size: 12px; }
.ciclo-stat-label { font-size: 10px; color: #9ba6c0; font-weight: 600; text-transform: uppercase; }

.progress-wrap { display: flex; align-items: center; gap: 8px; }
.progress-bar { flex: 1; height: 6px; background: #e8edf9; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: #2c4fd4; border-radius: 3px; transition: width .4s; }
.progress-label { font-size: 11px; color: #6b7597; font-weight: 600; white-space: nowrap; }

.btn-liberar { width: 100%; padding: 10px; border-radius: 10px; border: none; background: #1a2f6e; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: background .15s; }
.btn-liberar:hover:not(:disabled) { background: #2c4fd4; }
.btn-liberar:disabled { opacity: .5; cursor: not-allowed; }
.btn-liberar.fully-liberated { background: #15803d; }

/* Loading / empty */
.loading-row { display: flex; align-items: center; gap: 10px; padding: 40px; justify-content: center; color: #6b7597; }
.spinner-lg { width: 20px; height: 20px; border: 3px solid #d4dae8; border-top-color: #2c4fd4; border-radius: 50%; animation: spin .6s linear infinite; }
.empty-state { text-align: center; color: #6b7597; padding: 40px; font-size: 13.5px; }
.spinning { animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Modal ── */
.modal-overlay { position: fixed; inset: 0; background: rgba(10,15,40,.55); backdrop-filter: blur(3px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal { background: #fff; border-radius: 16px; width: 100%; max-width: 1100px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 24px 80px rgba(10,15,40,.25); overflow: hidden; }

.modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid #d4dae8; flex-shrink: 0; }
.modal-title { font-size: 17px; font-weight: 800; color: #1a2340; }
.modal-sub { font-size: 12.5px; color: #6b7597; margin-top: 2px; }
.modal-close { background: #f0f2f8; border: none; border-radius: 8px; padding: 7px; cursor: pointer; color: #6b7597; display: flex; transition: background .15s; }
.modal-close:hover { background: #e0e4f0; color: #1a2340; }

.modal-fecha-row { display: flex; align-items: center; gap: 14px; padding: 14px 24px; border-bottom: 1px solid #f0f2f8; flex-shrink: 0; background: #f7f9ff; flex-wrap: wrap; }
.field-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #1a2340; }
.date-input { padding: 7px 12px; border: 1.5px solid #d4dae8; border-radius: 8px; font-size: 13px; outline: none; color: #1a2340; }
.date-input:focus { border-color: #2c4fd4; }

/* Tabla modal */
.modal-table-wrap { overflow: auto; flex: 1; }
.modal-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.modal-table thead th { position: sticky; top: 0; background: #fafbfd; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #6b7597; padding: 10px 10px; border-bottom: 1px solid #d4dae8; text-align: left; white-space: nowrap; z-index: 1; }
.th-modulo { min-width: 160px; }
.th-nivel  { min-width: 80px; }
.th-num    { min-width: 70px; }
.th-monto  { min-width: 110px; }
.th-rubro  { min-width: 100px; }
.th-estado { min-width: 90px; }

.modal-table tbody td { padding: 8px 10px; border-bottom: 1px solid #f0f2f8; vertical-align: middle; }
.modal-table tbody tr:last-child td { border-bottom: none; }
.modal-table tbody tr:hover { background: #f7f9ff; }
.modal-table tbody tr.row-liberado { background: #f0fdf4; }

.td-modulo { display: flex; flex-direction: column; gap: 2px; }
.mod-cod { font-size: 10.5px; font-family: monospace; color: #9ba6c0; }
.mod-nombre { font-size: 12.5px; font-weight: 600; color: #1a2340; }

.nivel-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
.nivel-badge.inicial    { background: #e0f2fe; color: #0369a1; }
.nivel-badge.primaria   { background: #dcfce7; color: #16a34a; }
.nivel-badge.secundaria { background: #fef3c7; color: #b45309; }

.num-input { width: 52px; padding: 5px 7px; border: 1.5px solid #d4dae8; border-radius: 6px; font-size: 12.5px; text-align: center; outline: none; }
.num-input:focus { border-color: #2c4fd4; }
.num-input:disabled { background: #f0f2f8; color: #9ba6c0; }

.money-input-wrap { position: relative; }
.money-prefix { position: absolute; left: 6px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 700; color: #9ba6c0; pointer-events: none; }
.money-input { width: 88px; padding: 5px 6px 5px 20px; border: 1.5px solid #d4dae8; border-radius: 6px; font-size: 12px; outline: none; }
.money-input:focus { border-color: #2c4fd4; }
.money-input:disabled { background: #f0f2f8; color: #9ba6c0; }
.rubro-input { width: 80px; }

.chip-ok { display: inline-flex; align-items: center; gap: 4px; background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; }
.chip-pendiente { background: #f0f4ff; color: #2c4fd4; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; }

/* Resumen modal */
.modal-resumen { display: flex; gap: 0; border-top: 1px solid #d4dae8; border-bottom: 1px solid #d4dae8; flex-shrink: 0; background: #f7f8fc; }
.resumen-item-sm { flex: 1; text-align: center; padding: 12px 10px; border-right: 1px solid #d4dae8; }
.resumen-item-sm:last-child { border-right: none; }
.r-label { display: block; font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: #6b7597; margin-bottom: 4px; }
.r-val { display: block; font-size: 20px; font-weight: 800; color: #1a2340; }
.r-val.blue  { color: #2c4fd4; }
.r-val.green { color: #16a34a; font-size: 14px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; flex-shrink: 0; }

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
</style>