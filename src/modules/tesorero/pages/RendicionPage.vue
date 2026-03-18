<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Rendición de Cuentas</h1>
        <p class="page-sub">Conciliación financiera por transferencia</p>
      </div>
    </div>

    <!-- ── Lista de transferencias ─────────────────────────────────────── -->
    <div v-if="!detalleId">
      <div v-if="loadingTransf" class="loading-row">
        <div class="spinner-lg" /> Cargando transferencias...
      </div>

      <template v-else>
        <!-- Filtro de nivel -->
        <div class="nivel-bar">
          <button class="pill" :class="{ active: nivelFiltro === '' }" @click="nivelFiltro = ''">Todos</button>
          <button
            v-for="n in nivelesDisponibles"
            :key="n"
            class="pill"
            :class="[{ active: nivelFiltro === n }, n]"
            @click="nivelFiltro = nivelFiltro === n ? '' : n"
          >
            {{ nivelLabel(n) }}
            <span class="pill-cod">{{ codigoModularDe(n) }}</span>
          </button>
        </div>

        <div
          v-for="t in transfFiltradas"
          :key="t.id"
          class="rendicion-card"
          @click="abrirRendicion(t.id)"
        >
          <div class="rc-left">
            <div class="rc-title">
              <span class="nivel-badge" :class="t.nivel">{{ nivelLabel(t.nivel) }}</span>
              {{ t.codigo }}
              <span class="rc-ciclo">{{ t.ciclo }}</span>
              <span class="transf-counter">{{ t.numero }}/{{ t.num_transferencias }}</span>
            </div>
            <div class="rc-sub">
              <span class="cod-modular">{{ t.codigo_modular }}</span>
              · {{ t.institucion }}
            </div>
          </div>
          <div class="rc-right">
            <div class="rc-monto-wrap">
              <div class="rc-monto-label">Transferido</div>
              <div class="rc-monto">{{ fmt(t.monto) }}</div>
            </div>
            <div class="rc-monto-wrap">
              <div class="rc-monto-label">Gastado</div>
              <div class="rc-monto">{{ fmt(t.total_gastado ?? 0) }}</div>
            </div>
            <div class="rc-monto-wrap">
              <div class="rc-saldo-label">Saldo</div>
              <div class="rc-saldo" :class="(t.saldo ?? 0) > 0 ? 'orange' : 'green'">
                {{ fmt(t.saldo ?? 0) }}
              </div>
            </div>
            <StatusBadge :status="t.estado" />
            <button class="icon-btn"><Eye class="btn-ico" /></button>
          </div>
        </div>

        <div v-if="transfFiltradas.length === 0" class="empty-state">
          Sin transferencias para el nivel seleccionado
        </div>
      </template>
    </div>

    <!-- ── Detalle de rendición ─────────────────────────────────────────── -->
    <div v-else>
      <div class="back-row">
        <button class="btn secondary btn-sm" @click="cerrarDetalle">
          <ArrowLeft class="btn-ico" /> Volver
        </button>
        <span class="detail-title">
          Rendición — {{ resumen?.codigo_transferencia ?? detalleId }}
        </span>
        <StatusBadge v-if="resumen" :status="resumen.estado" />
      </div>

      <!-- Info bar de la transferencia -->
      <div class="transf-info-bar" v-if="resumen">
        <span class="nivel-badge" :class="resumen.nivel">{{ nivelLabel(resumen.nivel) }}</span>
        <span class="cod-modular">{{ resumen.codigo_modular }}</span>
        <span class="sep">·</span>
        <span class="t-cod">{{ resumen.codigo_transferencia }}</span>
        <span class="transf-counter">{{ resumen.numero }}/{{ resumen.num_transferencias }}</span>
        <span class="sep">·</span>
        <span class="ciclo-txt">{{ resumen.ciclo }}</span>
        <span class="sep">·</span>
        <span class="ie-txt">{{ resumen.nombre_institucion }}</span>
      </div>

      <div v-if="rendicionStore.loading" class="loading-row">
        <div class="spinner-lg" /> Cargando rendición...
      </div>

      <template v-else>
        <!-- Banners de estado -->
        <div v-if="resumen?.estado === 'enviada'" class="estado-banner enviada">
          <Send style="width:16px;height:16px;flex-shrink:0" />
          Rendición enviada al ATC — en espera de revisión.
        </div>
        <div v-if="resumen?.estado === 'observada'" class="estado-banner observada">
          <AlertCircle style="width:16px;height:16px;flex-shrink:0" />
          El ATC devolvió esta rendición con observaciones. Corrige y reenvía.
        </div>
        <div v-if="resumen?.estado === 'aprobada'" class="estado-banner aprobada">
          <CheckCircle style="width:16px;height:16px;flex-shrink:0" />
          Rendición aprobada por el ATC.
        </div>

        <!-- KPIs financieros -->
        <div class="kpi-grid">
          <div class="kpi-card left-green">
            <div class="kpi-label">(+) Transferencia recibida</div>
            <div class="kpi-val green">{{ fmt(resumen?.monto_transferencia ?? 0) }}</div>
          </div>
          <div class="kpi-card left-red">
            <div class="kpi-label">(–) Total gastos registrados</div>
            <div class="kpi-val red">{{ fmt(resumen?.total_gastos_registrados ?? 0) }}</div>
            <div class="divider-sm" />
            <div class="kpi-sub-row">
              <span>Efectivo en caja</span>
              <div class="mini-input-wrap">
                <span class="mini-prefix">S/</span>
                <input v-model.number="efectivo" type="number" class="mini-input"
                  placeholder="0.00" step="0.01" :disabled="bloqueado" />
              </div>
            </div>
          </div>
          <div class="kpi-card left-blue">
            <div class="kpi-label">(=) Saldo calculado</div>
            <div class="kpi-val" :class="saldoFinal < 0 ? 'red' : saldoFinal === 0 ? 'green' : ''">
              {{ fmt(saldoFinal) }}
            </div>
            <div class="divider-sm" />
            <div class="kpi-sub-row">
              <span>Estado rendición</span>
              <StatusBadge :status="resumen?.estado ?? 'borrador'" />
            </div>
          </div>
        </div>

        <!-- Ejecución por rubro -->
        <div class="card mb">
          <div class="card-header">
            <span class="card-title-sm">Ejecución por Rubro</span>
          </div>
          <div class="card-body rubros-body">
            <div v-for="rubro in rubrosResumen" :key="rubro.nombre" class="rubro-row">
              <div class="rubro-nombre">{{ rubro.nombre }}</div>
              <div class="rubro-bar-wrap">
                <div class="rubro-bar">
                  <div class="rubro-fill" :style="{
                    width: Math.min(rubro.pct, 100) + '%',
                    background: rubro.pct > 100 ? '#dc2626' : rubro.pct > 90 ? '#f59e0b' : '#2c4fd4'
                  }" />
                </div>
                <span class="rubro-pct">{{ rubro.pct }}%</span>
              </div>
              <div class="rubro-montos">
                <span>{{ fmt(rubro.gastado) }}</span>
                <span class="rubro-sep">/</span>
                <span style="color:#6b7597">{{ fmt(rubro.presupuesto) }}</span>
              </div>
            </div>
            <div v-if="rubrosResumen.length === 0" class="empty-rubros">
              Sin gastos registrados aún
            </div>
          </div>
        </div>

        <!-- Tabla de gastos -->
        <div class="card mb">
          <div class="card-header">
            <span class="card-title-sm">Gastos Incluidos en la Rendición</span>
            <span style="font-size:12px;color:#6b7597">
              {{ rendicionStore.datos?.gastos?.length ?? 0 }} registros
            </span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>Concepto</th><th>Rubro</th>
                  <th>Tipo</th><th>Comprobante</th><th>Monto</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in rendicionStore.datos?.gastos" :key="g.id">
                  <td>{{ fmtFecha(g.fecha_documento) }}</td>
                  <td class="fw">{{ g.concepto }}</td>
                  <td><span class="chip-rubro">{{ g.rubro }}</span></td>
                  <td style="font-size:12px;color:#6b7597">{{ fmtTipo(g.tipo_comprobante) }}</td>
                  <td>
                    <a v-if="g.archivo_url" :href="`http://localhost:3000${g.archivo_url}`"
                      target="_blank" class="comp-link">
                      {{ g.num_comprobante || 'Ver' }}
                    </a>
                    <span v-else style="color:#6b7597;font-size:12px">
                      {{ g.num_comprobante || '—' }}
                    </span>
                  </td>
                  <td class="fw">{{ fmt(g.monto) }}</td>
                  <td><StatusBadge :status="g.estado" /></td>
                </tr>
                <tr v-if="!rendicionStore.datos?.gastos?.length">
                  <td colspan="7" class="empty">No hay gastos registrados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Estado de cuenta -->
        <div class="card mb">
          <div class="card-header">
            <div class="card-title-sm">Estado de Cuenta / Pantallazo Bancario</div>
            <span style="font-size:12px;color:#6b7597">Debe coincidir con el saldo calculado</span>
          </div>
          <div class="card-body">
            <div class="upload-zone" @click="!bloqueado && estadoInput?.click()">
              <ImageIcon class="upload-ico" />
              <div class="upload-text">
                <strong>Subir estado de cuenta o pantallazo</strong><br/>
                PNG, JPG o PDF — desde app, cajero o ventanilla BN
              </div>
              <input ref="estadoInput" type="file" accept="image/*,.pdf"
                style="display:none" @change="onEstadoChange" :disabled="bloqueado" />
            </div>
            <div v-if="estadoFile" class="file-ok">
              <CheckCircle class="file-ico" /> Adjunto: <strong>{{ estadoFile }}</strong>
            </div>
          </div>
        </div>

        <!-- Observaciones del tesorero -->
        <div class="card mb">
          <div class="card-header">
            <div class="card-title-sm">Observaciones / Justificación</div>
          </div>
          <div class="card-body">
            <textarea v-model="observaciones" class="form-textarea" rows="3"
              placeholder="Detallar cualquier diferencia entre el saldo calculado y el estado de cuenta..."
              :disabled="bloqueado" />
          </div>
        </div>

        <!-- Observaciones del ATC -->
        <div class="card mb" v-if="rendicionStore.datos?.observaciones?.length">
          <div class="card-header">
            <div class="card-title-sm">Observaciones del ATC</div>
          </div>
          <div class="card-body obs-list">
            <div v-for="o in rendicionStore.datos.observaciones" :key="o.id" class="obs-item">
              <div class="obs-header">
                <span class="obs-autor">{{ o.autor }}</span>
                <span class="obs-fecha">{{ fmtFecha(o.creado_en) }}</span>
              </div>
              <div class="obs-texto">{{ o.comentario }}</div>
            </div>
          </div>
        </div>

        <!-- Documentos descargables -->
        <div class="download-bar">
          <div class="download-bar-title">
            <FileDown style="width:15px;height:15px" />
            Documentos de la Rendición
          </div>
          <div class="download-btns">
            <button class="btn download-btn" @click="descargarAnexo3" :disabled="descargandoAnexo">
              <FileSpreadsheet class="btn-ico" />
              {{ descargandoAnexo ? 'Generando PDF...' : 'Balance de Gastos' }}
            </button>
            <button class="btn download-btn orange-btn" @click="descargarDJPdf" :disabled="descargandoDJ">
              <FileText class="btn-ico" />
              {{ descargandoDJ ? 'Generando...' : 'DJ de Gastos' }}
            </button>
            <button class="btn download-btn green-btn" @click="descargarZip" :disabled="descargandoZip">
              <Archive class="btn-ico" />
              {{ descargandoZip ? 'Comprimiendo...' : 'ZIP de Comprobantes' }}
            </button>
          </div>
        </div>

        <!-- Acciones -->
        <div class="form-actions" v-if="!bloqueado">
          <button class="btn secondary" @click="guardar" :disabled="guardando">
            <Save class="btn-ico" />
            {{ guardando ? 'Guardando...' : 'Guardar Borrador' }}
          </button>
          <button class="btn primary" @click="enviar" :disabled="guardando">
            <Send class="btn-ico" />
            {{ resumen?.estado === 'observada' ? 'Reenviar al ATC' : 'Enviar al ATC' }}
          </button>
        </div>
        <div v-else class="bloqueado-msg">
          <CheckCircle style="width:16px;height:16px" />
          Esta rendición está en estado <strong>{{ resumen?.estado }}</strong> y no puede modificarse.
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  Eye, ArrowLeft, ImageIcon, CheckCircle, Save, Send, AlertCircle,
  FileSpreadsheet, Archive, FileDown, FileText
} from 'lucide-vue-next'
import { useTransferenciasStore } from '@/stores/transferencias.store'
import { useRendicionStore }      from '@/stores/rendicion.store'
import { useToastStore }          from '@/stores/toast.store'
import { useAuthStore }           from '@/stores/auth.store'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'

const transferenciaStore = useTransferenciasStore()
const rendicionStore     = useRendicionStore()
const toast              = useToastStore()
const auth               = useAuthStore()
const route              = useRoute()

const detalleId        = ref<any>(null)
const nivelFiltro      = ref('')
const efectivo         = ref(0)
const observaciones    = ref('')
const estadoFile       = ref('')
const estadoInput      = ref<HTMLInputElement>()
const guardando        = ref(false)
const loadingTransf    = ref(false)
const descargandoAnexo = ref(false)
const descargandoZip   = ref(false)
const descargandoDJ    = ref(false)

// ── Helpers ────────────────────────────────────────────────────────────────
function nivelLabel(nivel: string) {
  return ({ inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' })[nivel] ?? nivel
}
function fmt(n: number) {
  return 'S/ ' + (n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtFecha(f: string) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTipo(t: string) {
  const map: Record<string, string> = {
    boleta_venta: 'Boleta', recibo_gasto: 'Recibo', factura: 'Factura',
    ticket: 'Ticket', declaracion_jurada: 'DJ', planilla_movilidad: 'Movilidad'
  }
  return map[t] ?? t
}

// ── Filtro de nivel ────────────────────────────────────────────────────────
const nivelesDisponibles = computed(() => {
  const set = new Set<string>()
  transferenciaStore.transferencias.forEach((t: any) => { if (t.nivel) set.add(t.nivel) })
  return ['inicial', 'primaria', 'secundaria'].filter(n => set.has(n))
})

function codigoModularDe(nivel: string) {
  return transferenciaStore.transferencias.find((t: any) => t.nivel === nivel)?.codigo_modular ?? ''
}

const transfFiltradas = computed(() =>
  nivelFiltro.value
    ? transferenciaStore.transferencias.filter((t: any) => t.nivel === nivelFiltro.value)
    : transferenciaStore.transferencias
)

// ── Computeds de la rendición activa ──────────────────────────────────────
const resumen = computed(() => rendicionStore.datos?.resumen ?? null)

const saldoFinal = computed(() => {
  const monto  = resumen.value?.monto_transferencia       ?? 0
  const gastos = resumen.value?.total_gastos_registrados  ?? 0
  return monto - gastos - efectivo.value
})

const bloqueado = computed(() => resumen.value?.estado === 'aprobada')

const rubrosResumen = computed(() => {
  const gastos = rendicionStore.datos?.gastos ?? []
  const t = transferenciaStore.transferencias.find((t: any) => t.id == detalleId.value)
  if (!t) return []

  return ['alimentos', 'transporte', 'gas', 'estipendio', 'limpieza', 'otros'].map(r => {
    const gastado     = gastos.filter((g: any) => g.rubro === r).reduce((s: number, g: any) => s + Number(g.monto), 0)
    const presupuesto = t.rubros?.[r] ?? 0
    return {
      nombre:      r.charAt(0).toUpperCase() + r.slice(1),
      gastado, presupuesto,
      pct: presupuesto > 0 ? Math.round((gastado / presupuesto) * 100) : 0
    }
  }).filter(r => r.presupuesto > 0)
})

// ── Ciclo de vida ──────────────────────────────────────────────────────────
onMounted(async () => {
  loadingTransf.value = true
  await transferenciaStore.cargar()
  loadingTransf.value = false
  if (route.query.transf) await abrirRendicion(route.query.transf)
})

// ── Acciones ───────────────────────────────────────────────────────────────
async function abrirRendicion(id: any) {
  detalleId.value = id
  await rendicionStore.cargar(id)
  if (resumen.value) {
    efectivo.value      = resumen.value.efectivo_en_caja ?? 0
    observaciones.value = resumen.value.observaciones    ?? ''
  }
}

function cerrarDetalle() {
  detalleId.value = null; rendicionStore.datos = null
  efectivo.value = 0; observaciones.value = ''; estadoFile.value = ''
}

function onEstadoChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) estadoFile.value = f.name
}

async function guardar() {
  guardando.value = true
  try {
    await rendicionStore.guardar(detalleId.value, efectivo.value, observaciones.value)
    await rendicionStore.cargar(detalleId.value)
    toast.success('Borrador guardado', 'La rendición fue guardada correctamente')
  } catch (e: any) {
    toast.error('Error', e.message)
  } finally {
    guardando.value = false
  }
}

async function enviar() {
  guardando.value = true
  try {
    let rendicionId = resumen.value?.rendicion_id

    if (!rendicionId) {
      const saved = await rendicionStore.guardar(detalleId.value, efectivo.value, observaciones.value)
      rendicionId = saved.rendicion_id  // ← usar el id retornado, no esperar recarga
    }

    await rendicionStore.enviar(rendicionId)
    await rendicionStore.cargar(detalleId.value)
    await transferenciaStore.cargar()
    toast.success('Rendición enviada', 'El ATC fue notificado para revisión')
  } catch (e: any) {
    toast.error('Error', e.message)
  } finally {
    guardando.value = false
  }
}
// ── Descargas ──────────────────────────────────────────────────────────────
async function descarga(url: string, filename: string, loadingRef: { value: boolean }) {
  loadingRef.value = true
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } })
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error('Error', d.error || 'Error al descargar'); return }
    const blob = await res.blob()
    const a    = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = filename; a.click()
    URL.revokeObjectURL(a.href)
  } finally { loadingRef.value = false }
}

function descargarAnexo3() {
  descarga(`http://localhost:3000/api/rendiciones/${detalleId.value}/anexo3`,
    `anexo3-transf${detalleId.value}.pdf`, descargandoAnexo)
}
function descargarDJPdf() {
  descarga(`http://localhost:3000/api/rendiciones/${detalleId.value}/dj-pdf`,
    `dj-transf${detalleId.value}.pdf`, descargandoDJ)
}
function descargarZip() {
  descarga(`http://localhost:3000/api/rendiciones/${detalleId.value}/comprobantes-zip`,
    `comprobantes-transf${detalleId.value}.zip`, descargandoZip)
}
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.loading-row { display:flex; align-items:center; gap:10px; padding:40px; justify-content:center; color:#6b7597; }
.spinner-lg { width:20px; height:20px; border:3px solid #d4dae8; border-top-color:#2c4fd4; border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.empty-state { text-align:center; color:#6b7597; padding:32px; font-size:13.5px; }

/* Nivel pills */
.nivel-bar { display:flex; align-items:center; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
.pill { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:20px; border:1.5px solid #d4dae8; background:#f9fafb; font-size:12px; font-weight:600; color:#6b7597; cursor:pointer; transition:all .15s; white-space:nowrap; }
.pill:hover { border-color:#2c4fd4; color:#2c4fd4; background:#f0f4ff; }
.pill.active { background:#1a2f6e; color:#fff; border-color:#1a2f6e; }
.pill.active.inicial    { background:#0369a1; border-color:#0369a1; }
.pill.active.primaria   { background:#16a34a; border-color:#16a34a; }
.pill.active.secundaria { background:#b45309; border-color:#b45309; }
.pill-cod { font-size:10px; font-weight:400; opacity:.75; font-family:monospace; }

/* Nivel badges */
.nivel-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; }
.nivel-badge.inicial    { background:#e0f2fe; color:#0369a1; }
.nivel-badge.primaria   { background:#dcfce7; color:#16a34a; }
.nivel-badge.secundaria { background:#fef3c7; color:#b45309; }
.cod-modular { font-size:11px; color:#9ba6c0; font-family:monospace; }

/* Info bar */
.transf-info-bar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; background:#f7f8fc; border:1px solid #e5e8f0; border-radius:10px; padding:8px 14px; margin-bottom:16px; font-size:12.5px; color:#1a2340; }
.sep { color:#d4dae8; }
.t-cod { font-weight:700; color:#2c4fd4; font-family:monospace; font-size:12px; }
.transf-counter { background:#f0f4ff; color:#2c4fd4; font-weight:700; font-size:11px; padding:2px 8px; border-radius:20px; }
.ciclo-txt { color:#6b7597; }
.ie-txt { font-weight:600; color:#1a2340; }

/* Lista de transferencias */
.rendicion-card { background:#fff; border:1px solid #d4dae8; border-radius:14px; padding:18px 22px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all .2s; box-shadow:0 2px 8px rgba(26,47,110,.05); }
.rendicion-card:hover { border-color:#2c4fd4; box-shadow:0 4px 16px rgba(44,79,212,.12); transform:translateY(-1px); }
.rc-left { flex:1; }
.rc-title { font-size:15px; font-weight:700; color:#1a2340; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.rc-ciclo { font-size:11px; font-weight:600; background:#e8edf9; color:#2c4fd4; padding:2px 8px; border-radius:6px; }
.rc-sub { font-size:12.5px; color:#6b7597; margin-top:4px; display:flex; align-items:center; gap:6px; }
.rc-right { display:flex; align-items:center; gap:20px; }
.rc-monto-wrap { text-align:right; }
.rc-monto-label { font-size:10px; font-weight:700; text-transform:uppercase; color:#6b7597; }
.rc-monto { font-size:14px; font-weight:700; color:#1a2340; }
.rc-saldo-label { font-size:10px; font-weight:700; text-transform:uppercase; color:#6b7597; text-align:right; }
.rc-saldo { font-size:16px; font-weight:800; }
.rc-saldo.green  { color:#16a34a; }
.rc-saldo.orange { color:#ea580c; }
.icon-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:7px; padding:6px; cursor:pointer; display:flex; color:#6b7597; }
.btn-ico { width:15px; height:15px; }

/* Detalle */
.back-row { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
.detail-title { font-size:15px; font-weight:700; color:#1a2340; }
.kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:20px; }
.kpi-card { background:#fff; border:1px solid #d4dae8; border-radius:14px; padding:18px 20px; box-shadow:0 2px 8px rgba(26,47,110,.05); }
.kpi-card.left-green { border-left:4px solid #16a34a; }
.kpi-card.left-red   { border-left:4px solid #dc2626; }
.kpi-card.left-blue  { border-left:4px solid #2c4fd4; }
.kpi-label { font-size:11px; font-weight:700; text-transform:uppercase; color:#6b7597; margin-bottom:6px; }
.kpi-val { font-size:24px; font-weight:800; color:#1a2340; }
.kpi-val.green { color:#16a34a; }
.kpi-val.red   { color:#dc2626; }
.divider-sm { height:1px; background:#d4dae8; margin:12px 0; }
.kpi-sub-row { display:flex; align-items:center; justify-content:space-between; font-size:12.5px; color:#6b7597; }
.mini-input-wrap { position:relative; }
.mini-prefix { position:absolute; left:7px; top:50%; transform:translateY(-50%); font-size:12px; font-weight:700; color:#6b7597; }
.mini-input { width:110px; padding:5px 8px 5px 22px; border:1.5px solid #d4dae8; border-radius:6px; font-size:13px; outline:none; }
.mini-input:focus { border-color:#2c4fd4; }
.mini-input:disabled { background:#f0f2f8; color:#6b7597; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 8px rgba(26,47,110,.05); }
.mb { margin-bottom:20px; }
.card-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; color:#1a2340; }
.card-body { padding:20px; }
.rubros-body { display:flex; flex-direction:column; gap:12px; }
.rubro-row { display:grid; grid-template-columns:100px 1fr 200px; align-items:center; gap:12px; }
.rubro-nombre { font-size:13px; font-weight:600; color:#1a2340; }
.rubro-bar-wrap { display:flex; align-items:center; gap:8px; }
.rubro-bar { flex:1; height:8px; background:#f0f2f8; border-radius:4px; overflow:hidden; }
.rubro-fill { height:100%; border-radius:4px; transition:width .4s; }
.rubro-pct { font-size:11px; font-weight:700; color:#6b7597; width:32px; text-align:right; }
.rubro-montos { font-size:12.5px; font-weight:700; color:#1a2340; display:flex; gap:4px; justify-content:flex-end; }
.rubro-sep { color:#d4dae8; }
.empty-rubros { text-align:center; color:#6b7597; padding:16px; font-size:13px; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
thead th { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#6b7597; padding:10px 16px; border-bottom:1px solid #d4dae8; background:#fafbfd; text-align:left; }
tbody td { padding:11px 16px; font-size:13.5px; color:#1a2340; border-bottom:1px solid #f0f2f8; }
tbody tr:last-child td { border-bottom:none; }
tbody tr:hover { background:#f0f4ff; }
td.fw { font-weight:700; }
td.empty { text-align:center; color:#6b7597; padding:24px; }
.chip-rubro { background:#e8edf9; color:#2c4fd4; padding:2px 8px; border-radius:6px; font-size:11.5px; font-weight:700; text-transform:capitalize; }
.comp-link { color:#2c4fd4; font-size:12px; font-weight:600; text-decoration:none; background:#e8edf9; padding:2px 8px; border-radius:6px; }
.comp-link:hover { background:#2c4fd4; color:#fff; }
.upload-zone { border:2px dashed #d4dae8; border-radius:10px; padding:24px; text-align:center; cursor:pointer; transition:all .2s; }
.upload-zone:hover { border-color:#2c4fd4; background:#f0f4ff; }
.upload-ico { width:28px; height:28px; color:#6b7597; margin:0 auto 8px; display:block; }
.upload-text { font-size:13px; color:#6b7597; }
.upload-text strong { color:#2c4fd4; }
.file-ok { margin-top:10px; font-size:13px; color:#16a34a; font-weight:600; display:flex; align-items:center; gap:6px; }
.file-ico { width:16px; height:16px; }
.form-textarea { width:100%; padding:10px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13.5px; outline:none; resize:vertical; min-height:80px; box-sizing:border-box; }
.form-textarea:focus { border-color:#2c4fd4; }
.form-textarea:disabled { background:#f0f2f8; color:#6b7597; }
.obs-list { display:flex; flex-direction:column; gap:12px; }
.obs-item { background:#fafbfd; border:1px solid #d4dae8; border-radius:8px; padding:12px 16px; }
.obs-header { display:flex; justify-content:space-between; margin-bottom:6px; }
.obs-autor { font-size:12.5px; font-weight:700; color:#1a2340; }
.obs-fecha { font-size:11.5px; color:#6b7597; }
.obs-texto { font-size:13.5px; color:#1a2340; line-height:1.5; }
.download-bar { background:#f0f4ff; border:1.5px solid #c5d0f0; border-radius:12px; padding:14px 20px; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.download-bar-title { font-size:13px; font-weight:700; color:#1a2340; display:flex; align-items:center; gap:6px; }
.download-btns { display:flex; gap:10px; flex-wrap:wrap; }
.btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn-sm { padding:6px 12px; font-size:12.5px; }
.btn.primary { background:#1a2f6e; color:#fff; box-shadow:0 2px 8px rgba(26,47,110,.25); }
.btn.primary:hover:not(:disabled) { background:#2c4fd4; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover:not(:disabled) { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
.btn:disabled { opacity:.5; cursor:not-allowed; }
.download-btn { background:#1a2f6e; color:#fff; border:none; padding:9px 16px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:background .15s; }
.download-btn:hover:not(:disabled) { background:#2c4fd4; }
.download-btn.orange-btn { background:#c2410c; }
.download-btn.orange-btn:hover:not(:disabled) { background:#ea580c; }
.download-btn.green-btn { background:#15803d; }
.download-btn.green-btn:hover:not(:disabled) { background:#16a34a; }
.download-btn:disabled { opacity:.55; cursor:not-allowed; }
.form-actions { display:flex; gap:10px; margin-bottom:20px; }
.bloqueado-msg { display:flex; align-items:center; gap:8px; background:#dcfce7; border:1px solid #86efac; border-radius:8px; padding:12px 16px; font-size:13px; color:#15803d; font-weight:600; margin-bottom:20px; }
.estado-banner { display:flex; align-items:center; gap:10px; border-radius:10px; padding:12px 16px; font-size:13px; font-weight:600; margin-bottom:20px; }
.estado-banner.enviada   { background:#eff6ff; border:1px solid #93c5fd; color:#1d4ed8; }
.estado-banner.observada { background:#fef3c7; border:1px solid #fcd34d; color:#b45309; }
.estado-banner.aprobada  { background:#dcfce7; border:1px solid #86efac; color:#15803d; }
</style>