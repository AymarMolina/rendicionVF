<template>
  <div class="page">

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Panel ATC</h1>
        <p class="page-sub">Revisión y aprobación de rendiciones</p>
      </div>
      <div class="header-tabs" v-if="!detalleId">
        <button
          v-for="tab in tabs" :key="tab.key"
          class="tab-pill" :class="{ active: tabActivo === tab.key }"
          @click="tabActivo = tab.key"
        >
          {{ tab.label }}
          <span v-if="conteo(tab.key) > 0" class="tab-badge" :class="tab.key">
            {{ conteo(tab.key) }}
          </span>
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         DASHBOARD (lista)
         ══════════════════════════════════════════════════════════ -->
    <template v-if="!detalleId">

      <!-- KPI strip -->
      <div class="kpi-strip">
        <div class="kpi-tile urgente">
          <div class="kpi-tile-val">{{ conteo('enviada') }}</div>
          <div class="kpi-tile-label">Por revisar</div>
          <div class="kpi-tile-icon">⏳</div>
        </div>
        <div class="kpi-tile observada">
          <div class="kpi-tile-val">{{ conteo('observada') }}</div>
          <div class="kpi-tile-label">Observadas</div>
          <div class="kpi-tile-icon">⚠️</div>
        </div>
        <div class="kpi-tile aprobada">
          <div class="kpi-tile-val">{{ conteo('aprobada') }}</div>
          <div class="kpi-tile-label">Aprobadas</div>
          <div class="kpi-tile-icon">✅</div>
        </div>
        <div class="kpi-tile sin">
          <div class="kpi-tile-val">{{ conteo('sin_rendicion') }}</div>
          <div class="kpi-tile-label">Sin rendición</div>
          <div class="kpi-tile-icon">📋</div>
        </div>
        <div class="kpi-tile total">
          <div class="kpi-tile-val">{{ atcStore.rendiciones.length }}</div>
          <div class="kpi-tile-label">Transferencias total</div>
          <div class="kpi-tile-icon">🏦</div>
        </div>
      </div>

      <!-- Institutions summary -->
      <div class="inst-grid" v-if="atcStore.instituciones.length">
        <div
          v-for="inst in atcStore.instituciones" :key="inst.id"
          class="inst-card"
          :class="{ 'inst-card--urgente': inst.pendientes_revision > 0 }"
        >
          <div class="inst-header">
            <div class="inst-nombre">{{ inst.nombre }}</div>
            <div class="inst-urgente-dot" v-if="inst.pendientes_revision > 0">
              {{ inst.pendientes_revision }} por revisar
            </div>
          </div>
          <div class="inst-meta">{{ inst.ugel }} · {{ inst.distrito }}</div>
          <div class="inst-progress-wrap">
            <div class="inst-progress-bg">
              <div
                class="inst-progress-fill"
                :style="{
                  width: inst.total_transferencias > 0
                    ? Math.round((inst.aprobadas / inst.total_transferencias) * 100) + '%'
                    : '0%'
                }"
              ></div>
            </div>
            <span class="inst-progress-pct">
              {{ inst.total_transferencias > 0
                  ? Math.round((inst.aprobadas / inst.total_transferencias) * 100)
                  : 0 }}%
            </span>
          </div>
          <div class="inst-stats">
            <div class="istat">
              <span class="istat-n orange">{{ inst.pendientes_revision }}</span>
              <span class="istat-l">Por revisar</span>
            </div>
            <div class="istat">
              <span class="istat-n green">{{ inst.aprobadas }}</span>
              <span class="istat-l">Aprobadas</span>
            </div>
            <div class="istat">
              <span class="istat-n">{{ inst.total_transferencias }}</span>
              <span class="istat-l">Transferencias</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="atcStore.loadingLista" class="loading-row">
        <div class="spinner-lg" /> Cargando rendiciones...
      </div>

      <template v-else>
        <!-- Urgentes banner -->
        <div v-if="conteo('enviada') > 0 && tabActivo !== 'enviada'" class="urgentes-banner" @click="tabActivo = 'enviada'">
          <span class="urgentes-dot"></span>
          Tienes <strong>{{ conteo('enviada') }}</strong> rendición(es) esperando tu revisión —
          <span class="urgentes-link">revisar ahora →</span>
        </div>

        <!-- Empty -->
        <div v-if="porEstado(tabActivo).length === 0" class="empty-state">
          <div class="empty-icon">{{ emptyIcon }}</div>
          <div class="empty-msg">No hay rendiciones en estado <strong>{{ tabs.find(t => t.key === tabActivo)?.label }}</strong></div>
        </div>

        <!-- Lista de rendiciones -->
        <div
          v-for="r in porEstado(tabActivo)"
          :key="r.rendicion_id ?? r.transferencia_id"
          class="rend-card"
          :class="r.estado"
          @click="abrirDetalle(r)"
        >
          <div class="rc-urgente-strip" v-if="r.estado === 'enviada'">
            <span class="rc-dot enviada-dot"></span>
            Por revisar
          </div>
          <div class="rc-observada-strip" v-if="r.estado === 'observada'">
            <AlertCircle style="width:12px;height:12px" />
            Devuelta con observaciones
          </div>

          <div class="rc-body">
            <div class="rc-left">
              <div class="rc-top">
                <span class="nivel-badge" :class="r.nivel">{{ nivelLabel(r.nivel) }}</span>
                <span class="rc-codigo">{{ r.codigo_transferencia }}</span>
                <span class="transf-num">{{ r.numero }}/{{ r.num_transferencias }}</span>
                <span class="rc-ciclo">{{ r.ciclo }}</span>
              </div>
              <div class="rc-mid">
                <span class="cod-mod">{{ r.codigo_modular }}</span>
                <span class="sep">·</span>
                <span class="ie-name">{{ r.nombre_institucion }}</span>
              </div>
              <div class="rc-bot">
                <span v-if="r.tesorero" class="tesorero-chip">
                  <UserCheck style="width:11px;height:11px" />
                  {{ r.tesorero }}
                </span>
                <span v-if="r.enviada_en" class="fecha-chip">
                  Enviada {{ fmtFecha(r.enviada_en) }}
                </span>
              </div>
            </div>
            <div class="rc-right">
              <div class="montos-trio">
                <div class="mt-item">
                  <div class="mt-l">Transferido</div>
                  <div class="mt-v">{{ fmt(r.monto_transferencia) }}</div>
                </div>
                <div class="mt-item">
                  <div class="mt-l">Gastado</div>
                  <div class="mt-v red">{{ fmt(r.total_gastos_registrados) }}</div>
                </div>
                <div class="mt-item">
                  <div class="mt-l">Saldo</div>
                  <div class="mt-v" :class="(r.saldo ?? 0) >= 0 ? 'green' : 'red'">
                    {{ fmt(r.saldo ?? 0) }}
                  </div>
                </div>
              </div>
              <StatusBadge :status="r.estado" />
              <div class="rc-arrow">
                <ChevronRight style="width:16px;height:16px" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         DETALLE DE RENDICIÓN
         ══════════════════════════════════════════════════════════ -->
    <template v-else>
      <div class="back-row">
        <button class="btn secondary btn-sm" @click="cerrarDetalle">
          <ArrowLeft class="ico" /> Volver
        </button>
        <span class="detail-title">{{ resumen?.codigo_transferencia }}</span>
        <StatusBadge v-if="resumen" :status="resumen.estado" />
      </div>

      <div class="info-bar" v-if="resumen">
        <span class="nivel-badge" :class="resumen.nivel">{{ nivelLabel(resumen.nivel) }}</span>
        <span class="cod-mod">{{ resumen.codigo_modular }}</span>
        <span class="sep">·</span>
        <span class="ie-name fw">{{ resumen.nombre_institucion }}</span>
        <span class="sep">·</span>
        <span class="ciclo-txt">{{ resumen.ciclo }}</span>
        <span class="sep" v-if="resumen.enviada_en">·</span>
        <span class="fecha-txt" v-if="resumen.enviada_en">Enviada el {{ fmtFecha(resumen.enviada_en) }}</span>
      </div>

      <div v-if="rendicionStore.loading" class="loading-row">
        <div class="spinner-lg" /> Cargando detalle...
      </div>

      <template v-else>
        <div v-if="resumen?.estado === 'aprobada'" class="banner aprobada">
          <CheckCircle style="width:16px;height:16px;flex-shrink:0" />
          Rendición aprobada el {{ fmtFecha(resumen.aprobada_en) }}.
        </div>

        <!-- KPIs financieros -->
        <div class="kpi-grid">
          <div class="kpi-card left-green">
            <div class="kpi-lbl">(+) Transferencia recibida</div>
            <div class="kpi-val green">{{ fmt(resumen?.monto_transferencia ?? 0) }}</div>
          </div>
          <div class="kpi-card left-red">
            <div class="kpi-lbl">(–) Total gastos</div>
            <div class="kpi-val red">{{ fmt(resumen?.total_gastos_registrados ?? 0) }}</div>
            <div class="divider-sm" />
            <div class="kpi-sub">
              <span>Efectivo en caja</span>
              <span class="kpi-sub-v">{{ fmt(resumen?.efectivo_en_caja ?? 0) }}</span>
            </div>
          </div>
          <div class="kpi-card left-blue">
            <div class="kpi-lbl">(=) Saldo calculado</div>
            <div class="kpi-val" :class="saldoFinal < 0 ? 'red' : 'green'">{{ fmt(saldoFinal) }}</div>
            <div class="divider-sm" />
            <div class="kpi-sub">
              <span>Comprobantes</span>
              <span class="kpi-sub-v">{{ totalComprobantes }}</span>
            </div>
          </div>
        </div>

        <!-- Tabla de gastos -->
        <div class="card mb">
          <div class="card-header">
            <span class="card-title-sm">Comprobantes y Gastos</span>
            <span class="card-sub">{{ rendicionStore.datos?.gastos?.length ?? 0 }} líneas</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>Concepto</th><th>Rubro</th>
                  <th>Tipo</th><th>Nº Doc.</th><th>Adjunto</th>
                  <th>Monto</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in rendicionStore.datos?.gastos" :key="g.id">
                  <td class="nowrap">{{ fmtFecha(g.fecha_documento) }}</td>
                  <td class="fw">
                    {{ g.concepto }}
                    <div v-if="g.dj_nombre_proveedor" class="sub-info">
                      <span class="tag-dj">DJ</span>
                      {{ g.dj_nombre_proveedor }}
                      <span v-if="g.dni_proveedor" class="dni-txt">· DNI {{ g.dni_proveedor }}</span>
                    </div>
                    <div v-if="g.punto_partida" class="sub-info">
                      <span class="tag-mov">MOV</span>
                      {{ g.punto_partida }} → {{ g.punto_llegada }}
                    </div>
                  </td>
                  <td><span class="chip-rubro">{{ g.rubro }}</span></td>
                  <td class="tipo-td">{{ fmtTipo(g.tipo_comprobante) }}</td>
                  <td class="mono-td">{{ g.num_comprobante || '—' }}</td>
                  <td>
                    <a v-if="g.archivo_url" :href="`http://localhost:3000${g.archivo_url}`" target="_blank" class="ver-btn">
                      <Paperclip style="width:11px;height:11px" /> Ver
                    </a>
                    <span v-else class="sin-arch">—</span>
                  </td>
                  <td class="monto-td">{{ fmt(g.monto) }}</td>
                  <td><StatusBadge :status="g.estado" /></td>
                </tr>
                <tr v-if="!rendicionStore.datos?.gastos?.length">
                  <td colspan="8" class="empty-td">Sin gastos registrados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Nota del tesorero -->
        <div class="card mb" v-if="resumen?.observaciones">
          <div class="card-header"><span class="card-title-sm">Nota del Tesorero</span></div>
          <div class="card-body">
            <p class="nota-txt">{{ resumen.observaciones }}</p>
          </div>
        </div>

        <!-- Historial observaciones -->
        <div class="card mb" v-if="rendicionStore.datos?.observaciones?.length">
          <div class="card-header">
            <span class="card-title-sm">Historial de Observaciones</span>
            <span class="card-sub">{{ rendicionStore.datos.observaciones.length }} entrada(s)</span>
          </div>
          <div class="card-body obs-list">
            <div v-for="o in rendicionStore.datos.observaciones" :key="o.id" class="obs-item">
              <div class="obs-head">
                <span class="obs-autor">{{ o.autor }}</span>
                <span class="obs-rol">{{ o.rol }}</span>
                <span class="obs-fecha">{{ fmtFecha(o.creado_en) }}</span>
              </div>
              <div class="obs-txt">{{ o.comentario }}</div>
            </div>
          </div>
        </div>

        <!-- Documentos descargables -->
        <div class="dl-bar">
          <div class="dl-bar-title"><FileDown style="width:15px;height:15px" /> Documentos de la Rendición</div>
          <div class="dl-btns">
            <button class="dl-btn blue"   @click="descargarAnexo3"    :disabled="desc.anexo">
              <FileSpreadsheet class="ico" />{{ desc.anexo  ? 'Generando...'   : 'Balance de Gastos' }}
            </button>
            <button class="dl-btn orange" @click="descargarDJ"        :disabled="desc.dj">
              <FileText class="ico" />{{ desc.dj     ? 'Generando...'   : 'Declaraciones Juradas' }}
            </button>
            <button class="dl-btn teal"   @click="descargarMovilidad" :disabled="desc.mov">
              <MapPin class="ico" />{{ desc.mov    ? 'Generando...'   : 'Planilla de Movilidad' }}
            </button>
            <button class="dl-btn green"  @click="descargarZip"       :disabled="desc.zip">
              <Archive class="ico" />{{ desc.zip    ? 'Comprimiendo...' : 'ZIP Comprobantes' }}
            </button>
          </div>
        </div>

        <!-- Panel de decisión -->
        <div class="decision-panel" v-if="resumen?.estado === 'enviada'">
          <div class="dp-title"><Scale style="width:18px;height:18px" /> Decisión del ATC</div>
          <div class="dp-grid">
            <div class="dp-card aprobar">
              <div class="dp-h">Aprobar Rendición</div>
              <div class="dp-desc">Los comprobantes y montos son correctos. La rendición quedará cerrada como aprobada.</div>
              <button class="action-btn green-btn" @click="handleAprobar" :disabled="atcStore.loadingAccion">
                <CheckCircle class="ico" />
                {{ atcStore.loadingAccion ? 'Procesando...' : 'Confirmar Aprobación' }}
              </button>
            </div>
            <div class="dp-card observar">
              <div class="dp-h">Devolver con Observaciones</div>
              <div class="dp-desc">El tesorero deberá corregir lo indicado y reenviar la rendición.</div>
              <textarea v-model="comentario" class="obs-ta" placeholder="Describe qué debe corregir o adjuntar el tesorero…" rows="3" />
              <button class="action-btn orange-btn" @click="handleObservar" :disabled="atcStore.loadingAccion || !comentario.trim()">
                <AlertCircle class="ico" />
                {{ atcStore.loadingAccion ? 'Enviando...' : 'Devolver al Tesorero' }}
              </button>
            </div>
          </div>
        </div>

        <div class="bloqueado" v-else-if="resumen?.estado && resumen.estado !== 'borrador'">
          <Info style="width:16px;height:16px" />
          Esta rendición está en estado <strong>{{ resumen.estado }}</strong> — no requiere acción.
        </div>
      </template>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import {
  ArrowLeft, CheckCircle, AlertCircle, ChevronRight,
  FileSpreadsheet, Archive, FileDown, FileText,
  Paperclip, Scale, Info, UserCheck, MapPin
} from 'lucide-vue-next'
import { useAtcStore }       from '@/stores/atc.store'
import { useRendicionStore } from '@/stores/rendicion.store'
import { useToastStore }     from '@/stores/toast.store'
import { useAuthStore }      from '@/stores/auth.store'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'

const atcStore       = useAtcStore()
const rendicionStore = useRendicionStore()
const toast          = useToastStore()
const auth           = useAuthStore()
const BASE           = 'http://localhost:3000/api'

const detalleId  = ref<any>(null)
const comentario = ref('')
const tabActivo  = ref('enviada')
const desc       = reactive({ anexo: false, dj: false, mov: false, zip: false })

const tabs = [
  { key: 'enviada',       label: 'Por revisar'   },
  { key: 'observada',     label: 'Observadas'    },
  { key: 'aprobada',      label: 'Aprobadas'     },
  { key: 'sin_rendicion', label: 'Sin rendición' },
  { key: 'borrador',      label: 'Borrador'      },
]

const emptyIcons: Record<string, string> = {
  enviada: '📥', observada: '🔍', aprobada: '🎉', sin_rendicion: '📋', borrador: '✏️'
}
const emptyIcon = computed(() => emptyIcons[tabActivo.value] ?? '📋')

const resumen = computed(() => rendicionStore.datos?.resumen ?? null)

const saldoFinal = computed(() => {
  const m = Number(resumen.value?.monto_transferencia      ?? 0)
  const g = Number(resumen.value?.total_gastos_registrados ?? 0)
  const c = Number(resumen.value?.efectivo_en_caja         ?? 0)
  return m - g - c
})

const totalComprobantes = computed(() => {
  const gastos = rendicionStore.datos?.gastos ?? []
  return new Set(gastos.map((g: any) => g.comprobante_id)).size
})

function nivelLabel(n: string) {
  return ({ inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' }[n] ?? n)
}
function fmt(n: number | string) {
  return 'S/ ' + Number(n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtFecha(f: string) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTipo(t: string) {
  return ({ boleta_venta: 'Boleta', recibo_gasto: 'Recibo', factura: 'Factura',
    ticket: 'Ticket', declaracion_jurada: 'DJ', planilla_movilidad: 'Movilidad' }[t] ?? t)
}

function porEstado(estado: string) { return atcStore.rendiciones.filter(r => r.estado === estado) }
function conteo(estado: string)    { return atcStore.rendiciones.filter(r => r.estado === estado).length }

onMounted(() => atcStore.cargarTodo())

async function abrirDetalle(r: any) {
  detalleId.value = r.transferencia_id
  await rendicionStore.cargar(r.transferencia_id)
}
function cerrarDetalle() {
  detalleId.value = null; rendicionStore.datos = null; comentario.value = ''
}

async function handleAprobar() {
  if (!resumen.value?.rendicion_id) return
  try {
    await atcStore.aprobar(resumen.value.rendicion_id)
    await rendicionStore.cargar(detalleId.value)
    toast.success('Rendición aprobada', 'El tesorero ha sido notificado')
  } catch (e: any) { toast.error('Error', e.message) }
}
async function handleObservar() {
  if (!resumen.value?.rendicion_id || !comentario.value.trim()) return
  try {
    await atcStore.observar(resumen.value.rendicion_id, comentario.value)
    await rendicionStore.cargar(detalleId.value)
    comentario.value = ''
    toast.success('Observación enviada', 'El tesorero deberá corregir y reenviar')
  } catch (e: any) { toast.error('Error', e.message) }
}

async function descarga(url: string, filename: string, key: keyof typeof desc) {
  desc[key] = true
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } })
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error('Error', d.error || 'Error al descargar'); return }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href)
  } finally { desc[key] = false }
}

const descargarAnexo3    = () => descarga(`${BASE}/rendiciones/${detalleId.value}/anexo3`,              `balance-${detalleId.value}.pdf`,     'anexo')
const descargarDJ        = () => descarga(`${BASE}/rendiciones/${detalleId.value}/dj-pdf`,              `dj-${detalleId.value}.pdf`,          'dj')
const descargarMovilidad = () => descarga(`${BASE}/rendiciones/${detalleId.value}/movilidad-pdf`,       `movilidad-${detalleId.value}.pdf`,   'mov')
const descargarZip       = () => descarga(`${BASE}/rendiciones/${detalleId.value}/comprobantes-zip`,    `comprobantes-${detalleId.value}.zip`,'zip')
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }

/* Tabs */
.header-tabs { display:flex; gap:6px; flex-wrap:wrap; }
.tab-pill { display:inline-flex; align-items:center; gap:6px; padding:7px 16px; border-radius:20px; border:1.5px solid #d4dae8; background:#f9fafb; font-size:13px; font-weight:600; color:#6b7597; cursor:pointer; transition:all .15s; }
.tab-pill:hover { border-color:#2c4fd4; color:#2c4fd4; background:#f0f4ff; }
.tab-pill.active { background:#1a2f6e; color:#fff; border-color:#1a2f6e; }
.tab-badge { font-size:11px; font-weight:800; padding:1px 7px; border-radius:20px; }
.tab-pill.active .tab-badge { background:rgba(255,255,255,.25); color:#fff; }
.tab-pill:not(.active) .tab-badge { background:#e8edf9; color:#2c4fd4; }
.tab-badge.enviada   { background:#fef3c7 !important; color:#b45309 !important; }
.tab-badge.observada { background:#fee2e2 !important; color:#dc2626 !important; }

/* KPI Strip */
.kpi-strip {
  display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:20px;
}
.kpi-tile {
  border-radius:14px; padding:18px 16px; position:relative; overflow:hidden;
  display:flex; flex-direction:column; gap:4px;
  border:1.5px solid transparent;
}
.kpi-tile-val  { font-size:32px; font-weight:900; line-height:1; }
.kpi-tile-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; opacity:.8; }
.kpi-tile-icon { position:absolute; right:12px; top:12px; font-size:24px; opacity:.25; }

.kpi-tile.urgente  { background:#fffbeb; border-color:#fcd34d; color:#b45309; }
.kpi-tile.urgente .kpi-tile-val { color:#d97706; }
.kpi-tile.observada { background:#fff1f2; border-color:#fecdd3; color:#be123c; }
.kpi-tile.observada .kpi-tile-val { color:#e11d48; }
.kpi-tile.aprobada { background:#f0fdf4; border-color:#86efac; color:#15803d; }
.kpi-tile.aprobada .kpi-tile-val { color:#16a34a; }
.kpi-tile.sin      { background:#f8fafc; border-color:#d4dae8; color:#6b7597; }
.kpi-tile.sin .kpi-tile-val { color:#374151; }
.kpi-tile.total    { background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
.kpi-tile.total .kpi-tile-val { color:#2563eb; }

/* Institutions grid */
.inst-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; margin-bottom:24px; }
.inst-card {
  background:#fff; border:1.5px solid #d4dae8; border-radius:14px; padding:16px 18px;
  box-shadow:0 2px 8px rgba(26,47,110,.05); transition:all .2s;
}
.inst-card--urgente { border-color:#fbbf24; box-shadow:0 0 0 3px rgba(251,191,36,.15); }
.inst-header { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:3px; }
.inst-nombre { font-size:13px; font-weight:700; color:#1a2340; line-height:1.3; }
.inst-urgente-dot { font-size:10.5px; font-weight:700; background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:20px; white-space:nowrap; flex-shrink:0; }
.inst-meta { font-size:11.5px; color:#6b7597; margin-bottom:12px; }

.inst-progress-wrap { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
.inst-progress-bg { flex:1; height:6px; background:#f0f2f8; border-radius:99px; overflow:hidden; }
.inst-progress-fill { height:100%; background:linear-gradient(90deg,#2c4fd4,#16a34a); border-radius:99px; transition:width .5s ease; }
.inst-progress-pct { font-size:11px; font-weight:700; color:#6b7597; min-width:30px; text-align:right; }

.inst-stats { display:flex; gap:16px; }
.istat { text-align:center; }
.istat-n { display:block; font-size:20px; font-weight:800; color:#1a2340; }
.istat-n.orange { color:#ea580c; }
.istat-n.green  { color:#16a34a; }
.istat-l { font-size:10px; font-weight:600; color:#9ba6c0; text-transform:uppercase; }

/* Urgentes banner */
.urgentes-banner {
  background:#fffbeb; border:1.5px solid #fcd34d; border-radius:10px;
  padding:12px 18px; margin-bottom:16px; font-size:13px; color:#92400e;
  cursor:pointer; transition:background .15s;
}
.urgentes-banner:hover { background:#fef3c7; }
.urgentes-dot { display:inline-block; width:8px; height:8px; background:#f59e0b; border-radius:50%; margin-right:8px; animation:pulse 1.5s infinite; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
.urgentes-link { font-weight:700; text-decoration:underline; }

/* Empty state */
.empty-state { text-align:center; padding:48px 16px; color:#6b7597; }
.empty-icon { font-size:40px; margin-bottom:12px; }
.empty-msg { font-size:14px; }

/* Loading */
.loading-row { display:flex; align-items:center; gap:10px; padding:40px; justify-content:center; color:#6b7597; }
.spinner-lg { width:20px; height:20px; border:3px solid #d4dae8; border-top-color:#2c4fd4; border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Rendicion cards */
.rend-card {
  background:#fff; border:1.5px solid #d4dae8; border-radius:14px; margin-bottom:12px;
  cursor:pointer; transition:all .2s; box-shadow:0 2px 8px rgba(26,47,110,.05); overflow:hidden;
}
.rend-card:hover { border-color:#2c4fd4; box-shadow:0 4px 16px rgba(44,79,212,.12); transform:translateY(-1px); }
.rend-card.enviada   { border-color:#fbbf24; }
.rend-card.observada { border-color:#fca5a5; }
.rend-card.aprobada  { border-color:#86efac; }

.rc-urgente-strip {
  background:#fffbeb; border-bottom:1px solid #fde68a;
  padding:5px 18px; font-size:11.5px; font-weight:700; color:#b45309;
  display:flex; align-items:center; gap:6px;
}
.rc-dot { display:inline-block; width:7px; height:7px; border-radius:50%; }
.enviada-dot { background:#f59e0b; animation:pulse 1.5s infinite; }
.rc-observada-strip {
  background:#fff1f2; border-bottom:1px solid #fecdd3;
  padding:5px 18px; font-size:11.5px; font-weight:700; color:#be123c;
  display:flex; align-items:center; gap:6px;
}

.rc-body { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; }
.rc-left { flex:1; display:flex; flex-direction:column; gap:5px; }
.rc-top { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.rc-codigo { font-size:14px; font-weight:800; color:#2c4fd4; font-family:monospace; }
.transf-num { background:#f0f4ff; color:#2c4fd4; font-weight:700; font-size:11px; padding:2px 8px; border-radius:20px; }
.rc-ciclo { font-size:11px; font-weight:600; background:#e8edf9; color:#2c4fd4; padding:2px 8px; border-radius:6px; }
.rc-mid { font-size:12.5px; color:#6b7597; display:flex; align-items:center; gap:6px; }
.rc-bot { font-size:11.5px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.tesorero-chip { display:inline-flex; align-items:center; gap:4px; background:#f0f4ff; color:#2c4fd4; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; }
.fecha-chip { background:#f0f2f8; color:#6b7597; padding:2px 8px; border-radius:6px; font-size:11px; }
.rc-right { display:flex; align-items:center; gap:16px; }
.rc-arrow { color:#d4dae8; }

/* Montos */
.montos-trio { display:flex; gap:16px; }
.mt-item { text-align:right; }
.mt-l { font-size:10px; font-weight:700; text-transform:uppercase; color:#9ba6c0; }
.mt-v { font-size:14px; font-weight:700; color:#1a2340; }
.mt-v.red   { color:#dc2626; }
.mt-v.green { color:#16a34a; }

/* Badges */
.nivel-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; }
.nivel-badge.inicial    { background:#e0f2fe; color:#0369a1; }
.nivel-badge.primaria   { background:#dcfce7; color:#16a34a; }
.nivel-badge.secundaria { background:#fef3c7; color:#b45309; }
.cod-mod { font-size:11px; color:#9ba6c0; font-family:monospace; }
.ie-name { font-size:12.5px; color:#1a2340; }
.ie-name.fw { font-weight:700; }
.sep { color:#d4dae8; }

/* ── Detalle ──────────────────────────────────────────────────────────────── */
.back-row { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
.detail-title { font-size:15px; font-weight:800; color:#2c4fd4; font-family:monospace; }
.info-bar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; background:#f7f8fc; border:1px solid #e5e8f0; border-radius:10px; padding:8px 14px; margin-bottom:16px; font-size:12.5px; }
.ciclo-txt { color:#6b7597; font-size:12px; }
.fecha-txt { color:#9ba6c0; font-size:12px; }

.kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:20px; }
.kpi-card { background:#fff; border:1px solid #d4dae8; border-radius:14px; padding:18px 20px; box-shadow:0 2px 8px rgba(26,47,110,.05); }
.kpi-card.left-green { border-left:4px solid #16a34a; }
.kpi-card.left-red   { border-left:4px solid #dc2626; }
.kpi-card.left-blue  { border-left:4px solid #2c4fd4; }
.kpi-lbl { font-size:11px; font-weight:700; text-transform:uppercase; color:#6b7597; margin-bottom:6px; }
.kpi-val { font-size:24px; font-weight:800; color:#1a2340; }
.kpi-val.green { color:#16a34a; }
.kpi-val.red   { color:#dc2626; }
.divider-sm { height:1px; background:#d4dae8; margin:12px 0; }
.kpi-sub { display:flex; align-items:center; justify-content:space-between; font-size:12.5px; color:#6b7597; }
.kpi-sub-v { font-weight:700; color:#1a2340; }

.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 8px rgba(26,47,110,.05); }
.mb { margin-bottom:20px; }
.card-header { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; color:#1a2340; }
.card-sub { font-size:12px; color:#6b7597; }
.card-body { padding:18px 20px; }

.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
thead th { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#6b7597; padding:10px 14px; border-bottom:1px solid #d4dae8; background:#fafbfd; text-align:left; white-space:nowrap; }
tbody td { padding:10px 14px; font-size:13px; color:#1a2340; border-bottom:1px solid #f0f2f8; vertical-align:top; }
tbody tr:last-child td { border-bottom:none; }
tbody tr:hover { background:#f7f8fc; }
td.fw { font-weight:600; }
td.tipo-td { font-size:12px; color:#6b7597; white-space:nowrap; }
td.mono-td { font-family:monospace; font-size:12px; }
td.monto-td { font-weight:700; text-align:right; white-space:nowrap; }
td.empty-td { text-align:center; color:#6b7597; padding:24px; }
td.nowrap { white-space:nowrap; }
.chip-rubro { background:#e8edf9; color:#2c4fd4; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700; text-transform:capitalize; }
.sub-info { display:flex; align-items:center; gap:5px; margin-top:4px; font-size:11px; color:#6b7597; flex-wrap:wrap; }
.tag-dj  { background:#fef3c7; color:#b45309; font-size:10px; font-weight:700; padding:1px 5px; border-radius:4px; }
.tag-mov { background:#e0f2fe; color:#0369a1; font-size:10px; font-weight:700; padding:1px 5px; border-radius:4px; }
.dni-txt { font-family:monospace; color:#9ba6c0; }
.ver-btn { display:inline-flex; align-items:center; gap:4px; background:#e8edf9; color:#2c4fd4; font-size:11.5px; font-weight:700; padding:3px 9px; border-radius:6px; text-decoration:none; }
.ver-btn:hover { background:#2c4fd4; color:#fff; }
.sin-arch { color:#9ba6c0; font-size:12px; }

.nota-txt { margin:0; font-size:13.5px; color:#1a2340; line-height:1.6; background:#fafbfd; border-left:3px solid #2c4fd4; padding:10px 16px; border-radius:0 8px 8px 0; }
.obs-list { display:flex; flex-direction:column; gap:10px; }
.obs-item { background:#fafbfd; border:1px solid #d4dae8; border-radius:8px; padding:12px 16px; }
.obs-head { display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap; }
.obs-autor { font-size:12.5px; font-weight:700; color:#1a2340; }
.obs-rol { font-size:11px; background:#e8edf9; color:#2c4fd4; padding:1px 7px; border-radius:10px; font-weight:600; }
.obs-fecha { font-size:11.5px; color:#9ba6c0; margin-left:auto; }
.obs-txt { font-size:13px; color:#1a2340; line-height:1.5; }

/* Download bar */
.dl-bar { background:#f0f4ff; border:1.5px solid #c5d0f0; border-radius:12px; padding:14px 20px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.dl-bar-title { font-size:13px; font-weight:700; color:#1a2340; display:flex; align-items:center; gap:6px; }
.dl-btns { display:flex; gap:8px; flex-wrap:wrap; }
.dl-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.dl-btn:disabled { opacity:.5; cursor:not-allowed; }
.dl-btn.blue   { background:#1a2f6e; color:#fff; }
.dl-btn.blue:hover:not(:disabled)   { background:#2c4fd4; }
.dl-btn.orange { background:#c2410c; color:#fff; }
.dl-btn.orange:hover:not(:disabled) { background:#ea580c; }
.dl-btn.teal   { background:#0f6e56; color:#fff; }
.dl-btn.teal:hover:not(:disabled)   { background:#0d9488; }
.dl-btn.green  { background:#15803d; color:#fff; }
.dl-btn.green:hover:not(:disabled)  { background:#16a34a; }

/* Decision panel */
.decision-panel { background:#fff; border:1.5px solid #d4dae8; border-radius:16px; padding:24px; margin-bottom:20px; box-shadow:0 4px 16px rgba(26,47,110,.08); }
.dp-title { display:flex; align-items:center; gap:8px; font-size:16px; font-weight:800; color:#1a2340; margin-bottom:20px; }
.dp-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.dp-card { border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:12px; }
.dp-card.aprobar  { background:#f0fdf4; border:1.5px solid #86efac; }
.dp-card.observar { background:#fffbeb; border:1.5px solid #fcd34d; }
.dp-icon { font-size:28px; }
.dp-h { font-size:14px; font-weight:800; color:#1a2340; }
.dp-desc { font-size:12.5px; color:#6b7597; line-height:1.5; }
.obs-ta { width:100%; padding:10px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13px; outline:none; resize:vertical; min-height:72px; box-sizing:border-box; font-family:inherit; }
.obs-ta:focus { border-color:#2c4fd4; }
.action-btn { display:inline-flex; align-items:center; gap:7px; padding:11px 20px; border-radius:8px; font-size:13.5px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.action-btn:disabled { opacity:.5; cursor:not-allowed; }
.green-btn  { background:#15803d; color:#fff; }
.green-btn:hover:not(:disabled)  { background:#16a34a; }
.orange-btn { background:#b45309; color:#fff; }
.orange-btn:hover:not(:disabled) { background:#d97706; }

.banner { display:flex; align-items:center; gap:10px; border-radius:10px; padding:12px 16px; font-size:13px; font-weight:600; margin-bottom:20px; }
.banner.aprobada { background:#dcfce7; border:1px solid #86efac; color:#15803d; }
.bloqueado { display:flex; align-items:center; gap:8px; background:#f0f4ff; border:1px solid #c5d0f0; border-radius:8px; padding:12px 16px; font-size:13px; color:#2c4fd4; font-weight:600; margin-bottom:20px; }
.btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn-sm { padding:6px 12px; font-size:12px; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
.ico { width:15px; height:15px; }
</style>