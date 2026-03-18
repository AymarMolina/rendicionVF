<template>
  <div class="page">

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
          <span
            v-if="atcStore.conteo(tab.key) > 0"
            class="tab-count" :class="tab.key"
          >
            {{ atcStore.conteo(tab.key) }}
          </span>
        </button>
      </div>
    </div>

    <div class="inst-grid" v-if="!detalleId && atcStore.instituciones.length">
      <div class="inst-card" v-for="inst in atcStore.instituciones" :key="inst.id">
        <div class="inst-nombre">{{ inst.nombre }}</div>
        <div class="inst-meta">{{ inst.ugel }} · {{ inst.distrito }}</div>
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

    <div v-if="!detalleId">
      <div v-if="atcStore.loadingLista" class="loading-row">
        <div class="spinner-lg" /> Cargando rendiciones...
      </div>

      <template v-else>
        <div v-if="atcStore.porEstado(tabActivo).length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          No hay rendiciones en estado
          <strong>{{ tabs.find(t => t.key === tabActivo)?.label }}</strong>
        </div>

        <div
          v-for="r in atcStore.porEstado(tabActivo)"
          :key="r.rendicion_id ?? r.transferencia_id"
          class="rend-card" :class="r.estado"
          @click="abrirDetalle(r)"
        >
          <div class="rc-urgente" v-if="r.estado === 'enviada'">● Por revisar</div>
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
                <span v-if="r.tesorero">
                  <UserCheck style="width:12px;height:12px;display:inline;vertical-align:middle" />
                  {{ r.tesorero }}
                </span>
                <span v-if="r.enviada_en" class="fecha-pill">
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
              <button class="icon-btn"><ChevronRight class="ico" /></button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-else>
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
        <span class="fecha-txt" v-if="resumen.enviada_en">
          Enviada el {{ fmtFecha(resumen.enviada_en) }}
        </span>
      </div>

      <div v-if="rendicionStore.loading" class="loading-row">
        <div class="spinner-lg" /> Cargando detalle...
      </div>

      <template v-else>

        <div v-if="resumen?.estado === 'aprobada'" class="banner aprobada">
          <CheckCircle style="width:16px;height:16px;flex-shrink:0" />
          Rendición aprobada el {{ fmtFecha(resumen.aprobada_en) }}.
        </div>

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
            <div class="kpi-val" :class="saldoFinal < 0 ? 'red' : 'green'">
              {{ fmt(saldoFinal) }}
            </div>
            <div class="divider-sm" />
            <div class="kpi-sub">
              <span>Núm. comprobantes</span>
              <span class="kpi-sub-v">{{ totalComprobantes }}</span>
            </div>
          </div>
        </div>

        <div class="card mb">
          <div class="card-header">
            <span class="card-title-sm">Comprobantes y Gastos</span>
            <span class="card-sub">
              {{ rendicionStore.datos?.gastos?.length ?? 0 }} líneas de gasto
            </span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Fecha</th><th>Concepto</th>
                  <th>Rubro</th><th>Tipo</th><th>Nº Doc.</th>
                  <th>Adjunto</th><th>Monto</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(g, i) in rendicionStore.datos?.gastos" :key="g.id">
                  <td class="nowrap">{{ fmtFecha(g.fecha_documento) }}</td>
                  <td class="fw">
                    {{ g.concepto }}
                    <div v-if="g.dj_nombre_proveedor" class="sub-info">
                      <span class="tag-dj">DJ</span>
                      {{ g.dj_nombre_proveedor }}
                      <span v-if="g.dni_proveedor" class="dni-txt">
                        · DNI {{ g.dni_proveedor }}
                      </span>
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
                    <a
                      v-if="g.archivo_url"
                      :href="`http://localhost:3000${g.archivo_url}`"
                      target="_blank" class="ver-btn"
                    >
                      <Paperclip style="width:11px;height:11px" /> Ver
                    </a>
                    <span v-else class="sin-arch">—</span>
                  </td>
                  <td class="monto-td">{{ fmt(g.monto) }}</td>
                  <td><StatusBadge :status="g.estado" /></td>
                </tr>
                <tr v-if="!rendicionStore.datos?.gastos?.length">
                  <td colspan="9" class="empty-td">Sin gastos registrados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card mb" v-if="resumen?.observaciones">
          <div class="card-header">
            <span class="card-title-sm">Nota del Tesorero</span>
          </div>
          <div class="card-body">
            <p class="nota-txt">{{ resumen.observaciones }}</p>
          </div>
        </div>

        <div class="card mb" v-if="rendicionStore.datos?.observaciones?.length">
          <div class="card-header">
            <span class="card-title-sm">Historial de Observaciones</span>
            <span class="card-sub">
              {{ rendicionStore.datos.observaciones.length }} entrada(s)
            </span>
          </div>
          <div class="card-body obs-list">
            <div
              v-for="o in rendicionStore.datos.observaciones" :key="o.id"
              class="obs-item"
            >
              <div class="obs-head">
                <span class="obs-autor">{{ o.autor }}</span>
                <span class="obs-rol">{{ o.rol }}</span>
                <span class="obs-fecha">{{ fmtFecha(o.creado_en) }}</span>
              </div>
              <div class="obs-txt">{{ o.comentario }}</div>
            </div>
          </div>
        </div>

        <div class="dl-bar">
          <div class="dl-bar-title">
            <FileDown style="width:15px;height:15px" /> Documentos de la Rendición
          </div>
          <div class="dl-btns">
            <button class="dl-btn blue" @click="descargarAnexo3" :disabled="desc.anexo">
              <FileSpreadsheet class="ico" />
              {{ desc.anexo ? 'Generando...' : 'Balance de Gastos' }}
            </button>
            <button class="dl-btn orange" @click="descargarDJ" :disabled="desc.dj">
              <FileText class="ico" />
              {{ desc.dj ? 'Generando...' : 'Declaraciones Juradas' }}
            </button>
            <button class="dl-btn green" @click="descargarZip" :disabled="desc.zip">
              <Archive class="ico" />
              {{ desc.zip ? 'Comprimiendo...' : 'ZIP Comprobantes' }}
            </button>
          </div>
        </div>

        <div class="decision-panel" v-if="resumen?.estado === 'enviada'">
          <div class="dp-title">
            <Scale style="width:18px;height:18px" /> Decisión del ATC
          </div>
          <div class="dp-grid">

            <div class="dp-card aprobar">
              <div class="dp-icon">✅</div>
              <div class="dp-h">Aprobar Rendición</div>
              <div class="dp-desc">
                Los comprobantes y montos son correctos.
                La rendición quedará cerrada como aprobada.
              </div>
              <button
                class="action-btn green-btn"
                @click="handleAprobar"
                :disabled="atcStore.loadingAccion"
              >
                <CheckCircle class="ico" />
                {{ atcStore.loadingAccion ? 'Procesando...' : 'Confirmar Aprobación' }}
              </button>
            </div>

            <div class="dp-card observar">
              <div class="dp-icon">⚠️</div>
              <div class="dp-h">Devolver con Observaciones</div>
              <div class="dp-desc">
                El tesorero deberá corregir lo indicado y reenviar la rendición.
              </div>
              <textarea
                v-model="comentario"
                class="obs-ta"
                placeholder="Describe qué debe corregir o adjuntar el tesorero…"
                rows="3"
              />
              <button
                class="action-btn orange-btn"
                @click="handleObservar"
                :disabled="atcStore.loadingAccion || !comentario.trim()"
              >
                <AlertCircle class="ico" />
                {{ atcStore.loadingAccion ? 'Enviando...' : 'Devolver al Tesorero' }}
              </button>
            </div>

          </div>
        </div>

        <div class="bloqueado" v-else-if="resumen?.estado && resumen.estado !== 'borrador'">
          <Info style="width:16px;height:16px" />
          Esta rendición está en estado
          <strong>{{ resumen.estado }}</strong> — no requiere acción.
        </div>

      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import {
  ArrowLeft, CheckCircle, AlertCircle, ChevronRight,
  FileSpreadsheet, Archive, FileDown, FileText,
  Paperclip, Scale, Info, UserCheck
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
const desc       = reactive({ anexo: false, dj: false, zip: false })

const tabs = [
  { key: 'enviada',       label: 'Por revisar'   },
  { key: 'observada',     label: 'Observadas'    },
  { key: 'aprobada',      label: 'Aprobadas'     },
  { key: 'sin_rendicion', label: 'Sin rendición' },
  { key: 'borrador',      label: 'Borrador'      },
]

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

const nivelLabel = (n: string) =>
  ({ inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' }[n] ?? n)

const fmt = (n: number | string) =>
  'S/ ' + Number(n ?? 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  })

const fmtFecha = (f: string) => {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

const fmtTipo = (t: string) => ({
  boleta_venta: 'Boleta', recibo_gasto: 'Recibo', factura: 'Factura',
  ticket: 'Ticket', declaracion_jurada: 'DJ', planilla_movilidad: 'Movilidad'
}[t] ?? t)

onMounted(() => atcStore.cargarTodo())

async function abrirDetalle(r: any) {
  detalleId.value = r.transferencia_id
  await rendicionStore.cargar(r.transferencia_id)
}

function cerrarDetalle() {
  detalleId.value      = null
  rendicionStore.datos = null
  comentario.value     = ''
}

async function handleAprobar() {
  if (!resumen.value?.rendicion_id) return
  try {
    await atcStore.aprobar(resumen.value.rendicion_id)
    await rendicionStore.cargar(detalleId.value)
    toast.success('Rendición aprobada', 'El tesorero ha sido notificado')
  } catch (e: any) {
    toast.error('Error', e.message)
  }
}

async function handleObservar() {
  if (!resumen.value?.rendicion_id || !comentario.value.trim()) return
  try {
    await atcStore.observar(resumen.value.rendicion_id, comentario.value)
    await rendicionStore.cargar(detalleId.value)
    comentario.value = ''
    toast.success('Observación enviada', 'El tesorero deberá corregir y reenviar')
  } catch (e: any) {
    toast.error('Error', e.message)
  }
}

async function descarga(url: string, filename: string, key: keyof typeof desc) {
  desc[key] = true
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error('Error', d.error || 'Error al descargar')
      return
    }
    const blob = await res.blob()
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  } finally {
    desc[key] = false
  }
}

const descargarAnexo3 = () =>
  descarga(
    `${BASE}/rendiciones/${detalleId.value}/anexo3`,
    `anexo3-transf${detalleId.value}.pdf`,
    'anexo'
  )
const descargarDJ = () =>
  descarga(
    `${BASE}/rendiciones/${detalleId.value}/dj-pdf`,
    `dj-transf${detalleId.value}.pdf`,
    'dj'
  )
const descargarZip = () =>
  descarga(
    `${BASE}/rendiciones/${detalleId.value}/comprobantes-zip`,
    `comprobantes-transf${detalleId.value}.zip`,
    'zip'
  )
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.loading-row { display:flex; align-items:center; gap:10px; padding:40px; justify-content:center; color:#6b7597; }
.spinner-lg { width:20px; height:20px; border:3px solid #d4dae8; border-top-color:#2c4fd4; border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.ico { width:15px; height:15px; }

.header-tabs { display:flex; gap:6px; flex-wrap:wrap; }
.tab-pill { display:inline-flex; align-items:center; gap:6px; padding:7px 16px; border-radius:20px; border:1.5px solid #d4dae8; background:#f9fafb; font-size:13px; font-weight:600; color:#6b7597; cursor:pointer; transition:all .15s; }
.tab-pill:hover { border-color:#2c4fd4; color:#2c4fd4; background:#f0f4ff; }
.tab-pill.active { background:#1a2f6e; color:#fff; border-color:#1a2f6e; }
.tab-count { font-size:11px; font-weight:800; padding:1px 7px; border-radius:20px; min-width:20px; text-align:center; }
.tab-pill.active .tab-count { background:rgba(255,255,255,.25); color:#fff; }
.tab-pill:not(.active) .tab-count { background:#e8edf9; color:#2c4fd4; }
.tab-count.enviada   { background:#fef3c7 !important; color:#b45309 !important; }
.tab-count.observada { background:#fee2e2 !important; color:#dc2626 !important; }

.inst-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; margin-bottom:24px; }
.inst-card { background:#fff; border:1px solid #d4dae8; border-radius:12px; padding:16px 18px; box-shadow:0 2px 8px rgba(26,47,110,.05); }
.inst-nombre { font-size:13.5px; font-weight:700; color:#1a2340; margin-bottom:3px; }
.inst-meta { font-size:11.5px; color:#6b7597; margin-bottom:12px; }
.inst-stats { display:flex; gap:20px; }
.istat { text-align:center; }
.istat-n { display:block; font-size:20px; font-weight:800; color:#1a2340; }
.istat-n.orange { color:#ea580c; }
.istat-n.green  { color:#16a34a; }
.istat-l { font-size:10px; font-weight:600; color:#9ba6c0; text-transform:uppercase; }

.empty-state { text-align:center; padding:48px 16px; color:#6b7597; }
.empty-icon { font-size:36px; margin-bottom:12px; }
.rend-card { background:#fff; border:1.5px solid #d4dae8; border-radius:14px; margin-bottom:12px; cursor:pointer; transition:all .2s; box-shadow:0 2px 8px rgba(26,47,110,.05); overflow:hidden; }
.rend-card:hover { border-color:#2c4fd4; box-shadow:0 4px 16px rgba(44,79,212,.12); transform:translateY(-1px); }
.rend-card.enviada { border-color:#fbbf24; }
.rc-urgente { background:#fffbeb; border-bottom:1px solid #fde68a; padding:5px 18px; font-size:11.5px; font-weight:700; color:#b45309; }
.rc-body { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; }
.rc-left { flex:1; display:flex; flex-direction:column; gap:5px; }
.rc-top { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.rc-codigo { font-size:14px; font-weight:800; color:#2c4fd4; font-family:monospace; }
.transf-num { background:#f0f4ff; color:#2c4fd4; font-weight:700; font-size:11px; padding:2px 8px; border-radius:20px; }
.rc-ciclo { font-size:11px; font-weight:600; background:#e8edf9; color:#2c4fd4; padding:2px 8px; border-radius:6px; }
.rc-mid { font-size:12.5px; color:#6b7597; display:flex; align-items:center; gap:6px; }
.rc-bot { font-size:11.5px; color:#9ba6c0; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.fecha-pill { background:#f0f2f8; padding:2px 8px; border-radius:6px; font-size:11px; }
.rc-right { display:flex; align-items:center; gap:16px; }
.montos-trio { display:flex; gap:16px; }
.mt-item { text-align:right; }
.mt-l { font-size:10px; font-weight:700; text-transform:uppercase; color:#9ba6c0; }
.mt-v { font-size:14px; font-weight:700; color:#1a2340; }
.mt-v.red   { color:#dc2626; }
.mt-v.green { color:#16a34a; }
.icon-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:7px; padding:6px; cursor:pointer; display:flex; color:#6b7597; }

.nivel-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; }
.nivel-badge.inicial    { background:#e0f2fe; color:#0369a1; }
.nivel-badge.primaria   { background:#dcfce7; color:#16a34a; }
.nivel-badge.secundaria { background:#fef3c7; color:#b45309; }
.cod-mod { font-size:11px; color:#9ba6c0; font-family:monospace; }
.ie-name { font-size:12.5px; color:#1a2340; }
.ie-name.fw { font-weight:700; }
.sep { color:#d4dae8; }

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
td.num-td { color:#9ba6c0; font-size:12px; }
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

.dl-bar { background:#f0f4ff; border:1.5px solid #c5d0f0; border-radius:12px; padding:14px 20px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.dl-bar-title { font-size:13px; font-weight:700; color:#1a2340; display:flex; align-items:center; gap:6px; }
.dl-btns { display:flex; gap:8px; flex-wrap:wrap; }
.dl-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.dl-btn:disabled { opacity:.5; cursor:not-allowed; }
.dl-btn.blue   { background:#1a2f6e; color:#fff; }
.dl-btn.blue:hover:not(:disabled)   { background:#2c4fd4; }
.dl-btn.orange { background:#c2410c; color:#fff; }
.dl-btn.orange:hover:not(:disabled) { background:#ea580c; }
.dl-btn.green  { background:#15803d; color:#fff; }
.dl-btn.green:hover:not(:disabled)  { background:#16a34a; }

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
</style>