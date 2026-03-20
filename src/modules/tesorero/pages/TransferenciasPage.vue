<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Transferencias</h1>
        <p class="page-sub">Historial de subvenciones económicas recibidas</p>
      </div>
    </div>
    <RendicionStepper
      v-if="estadoActual"
      :estado="estadoActual"
      :tiene-gastos="tieneGastosActual"
    />
    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card left-blue">
        <div class="kpi-label">Monto Total Recibido</div>
        <div class="kpi-val">{{ fmt(store.totalRecibido) }}</div>
        <div class="kpi-sub">Período activo</div>
      </div>
      <div class="kpi-card left-green">
        <div class="kpi-label">Total Gastado</div>
        <div class="kpi-val green">{{ fmt(store.totalGastado) }}</div>
        <div class="kpi-sub">{{ store.pctSustentado }}% utilizado</div>
      </div>
      <div class="kpi-card left-orange">
        <div class="kpi-label">Saldo Por Rendir</div>
        <div class="kpi-val orange">{{ fmt(store.totalSaldo) }}</div>
        <div class="kpi-sub">{{ store.pendientes }} transferencias pendientes</div>
      </div>
    </div>
    
    <!-- Card transferencia activa -->
    <div class="card activa-card" v-if="store.activa">
      <div class="card-header">
        <div>
          <div class="activa-top">
            <span class="card-title-sm">{{ store.activa.codigo }}</span>
            <span class="transf-counter">
              Transferencia {{ store.activa.numero }} de {{ store.activa.num_transferencias }}
            </span>
            <span class="nivel-badge" :class="store.activa.nivel">
              {{ nivelLabel(store.activa.nivel) }}
            </span>
            <span class="cod-modular">{{ store.activa.codigo_modular }}</span>
          </div>
          <div class="card-meta">{{ store.activa.ciclo }}</div>
        </div>
        <StatusBadge :status="store.activa.estado" />
      </div>

      <!-- ── Ejecución por rubro ─────────────────────────────────────────── -->
      <div class="rubros-ejecucion">

        <!-- Resumen total + barra maestra -->
        <div class="ejec-resumen">
          <div class="ejec-resumen-left">
            <span class="ejec-resumen-label">Ejecución total de la transferencia</span>
            <span class="ejec-resumen-montos">
              <strong :class="claseTotal">{{ fmt(totalGastadoActiva) }}</strong>
              <span class="ejec-sep">de</span>
              {{ fmt(store.activa.monto) }}
            </span>
          </div>
          <div class="ejec-pct-ring" :class="claseTotal">
            {{ pctTotal }}%
          </div>
        </div>
        <div class="ejec-master-bar-bg">
          <div
            class="ejec-master-bar-fill"
            :class="claseTotal"
            :style="{ width: Math.min(pctTotal, 100) + '%' }"
          ></div>
        </div>

        <!-- Skeleton mientras carga -->
        <div v-if="loadingRubrosActiva" class="rubros-skeleton">
          <div v-for="i in 6" :key="i" class="skeleton-item">
            <div class="skel-line skel-label"></div>
            <div class="skel-line skel-bar"></div>
          </div>
        </div>

        <!-- Grid 3×N con una barra por rubro -->
        <div v-else class="rubros-grid-ejec">
          <div
            v-for="r in rubrosActivaDetalle"
            :key="r.rubro"
            class="rubro-ejec-item"
          >
            <div class="rubro-ejec-header">
              <span class="rubro-ejec-name">{{ capitalize(r.rubro) }}</span>
              <span class="rubro-ejec-nums">
                <span
                  class="rubro-gastado"
                  :class="claseRubro(r.total_gastado, r.presupuesto_rubro)"
                >{{ fmt(r.total_gastado) }}</span>
                <span class="rubro-slash">/</span>
                <span class="rubro-presup">{{ fmt(r.presupuesto_rubro) }}</span>
              </span>
            </div>
            <div class="rubro-bar-bg">
              <div
                class="rubro-bar-fill"
                :class="claseRubro(r.total_gastado, r.presupuesto_rubro)"
                :style="{
                  width: r.presupuesto_rubro > 0
                    ? Math.min((r.total_gastado / r.presupuesto_rubro) * 100, 100) + '%'
                    : '0%'
                }"
              ></div>
            </div>
            <div
              class="rubro-bar-pct"
              :class="claseRubro(r.total_gastado, r.presupuesto_rubro)"
            >
              {{ r.presupuesto_rubro > 0 ? Math.round((r.total_gastado / r.presupuesto_rubro) * 100) : 0 }}%
            </div>
          </div>
        </div>

      </div>
      <!-- ── Fin ejecución ──────────────────────────────────────────────── -->
    </div>

    <!-- Gráfico monto vs gastado -->
    <div class="chart-main-block">
      <div class="chart-main-title">Monto vs Gastado por Transferencia</div>
      <div class="bar-legend">
        <span class="bar-leg-item">
          <span class="bar-leg-sq" style="background:#dbeafe;border:1.5px solid #2c4fd4"></span>
          Transferido
        </span>
        <span class="bar-leg-item">
          <span class="bar-leg-sq" style="background:#dcfce7;border:1.5px solid #16a34a"></span>
          Gastado
        </span>
        <span class="bar-leg-sep">·</span>
        <span class="bar-leg-note">Cada barra es una transferencia dentro del ciclo</span>
      </div>
      <div style="position:relative;height:220px">
        <canvas ref="barMainRef"></canvas>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card">
      <div class="card-header">
        <span class="card-title-sm">Todas las Transferencias</span>
        <div class="toolbar-right">
          <div class="nivel-pills">
            <button class="pill" :class="{ active: nivelFiltro === '' }" @click="nivelFiltro = ''">
              Todos
            </button>
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
          <div class="search-wrap">
            <Search class="search-ico" />
            <input v-model="q" class="search-input" placeholder="Código o estado..." />
          </div>
        </div>
      </div>

      <div v-if="store.loading" class="loading-row">
        <div class="spinner-lg" /> Cargando transferencias...
      </div>

      <div class="table-wrap" v-else>
        <table>
          <thead>
            <tr>
              <th>Transferencia</th>
              <th>Nivel / Cód. modular</th>
              <th>Ciclo</th>
              <th>Fecha Recepción</th>
              <th>Monto (S/)</th>
              <th>Gastado (S/)</th>
              <th>Saldo (S/)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(grupo) in grupos" :key="grupo.asignacion_id">
              <tr
                v-for="t in grupo.transferencias"
                :key="t.id"
                :class="{ 'last-in-group': t === grupo.transferencias[grupo.transferencias.length - 1] }"
              >
                <td>
                  <div class="transf-cell">
                    <span class="transf-num">Transferencia {{ t.numero }}/{{ t.num_transferencias }}</span>
                    <span class="transf-cod">{{ t.codigo }}</span>
                  </div>
                </td>
                <td>
                  <div class="nivel-cell">
                    <span class="nivel-badge" :class="t.nivel">{{ nivelLabel(t.nivel) }}</span>
                    <span class="cod-modular">{{ t.codigo_modular }}</span>
                  </div>
                </td>
                <td style="color:#6b7597;font-size:12.5px">{{ t.ciclo }}</td>
                <td>{{ t.fecha_recepcion ? fmtFecha(t.fecha_recepcion) : '—' }}</td>
                <td class="fw">{{ fmt(t.monto) }}</td>
                <td>{{ fmt(t.total_gastado ?? 0) }}</td>
                <td :class="t.saldo > 0 ? 'orange' : 'green-t'">{{ fmt(t.saldo ?? 0) }}</td>
                <td><StatusBadge :status="t.estado" /></td>
                <td>
                  <div class="actions">
                    <button class="icon-btn" title="Ver rubros" @click="abrirRubros(t)">
                      <Eye class="btn-ico" />
                    </button>
                    <button class="icon-btn" title="Registrar gastos" @click="irGastos(t.id)">
                      <FileText class="btn-ico" />
                    </button>
                    <button class="icon-btn" title="Rendición" @click="irRendicion(t.id)">
                      <ClipboardCheck class="btn-ico" />
                    </button>
                    <button class="icon-btn" title="Descargar Acta PDF" @click.stop="descargarActa(t)">
                      <FileDown class="btn-ico" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="grupos.length === 0">
              <td colspan="9" class="empty">Sin transferencias encontradas</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal rubros -->
    <BaseModal :open="showModal" @close="showModal = false">
      <div class="modal-inner">
        <div class="modal-hd">
          <div>
            <div class="modal-title">
              {{ modalTransf?.codigo }}
              <span style="font-weight:400;color:#6b7597;font-size:14px">
                · Transferencia {{ modalTransf?.numero }} de {{ modalTransf?.num_transferencias }}
              </span>
            </div>
            <div class="modal-sub" v-if="modalTransf">
              <span class="nivel-badge" :class="modalTransf.nivel">{{ nivelLabel(modalTransf.nivel) }}</span>
              <span class="cod-modular">{{ modalTransf.codigo_modular }}</span>
              <span>{{ modalTransf.ciclo }}</span>
            </div>
          </div>
          <button class="modal-close" @click="showModal = false"><X /></button>
        </div>

        <div v-if="loadingRubros" style="text-align:center;padding:20px;color:#6b7597">
          Cargando rubros...
        </div>

        <table v-else style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th>Rubro</th>
              <th>Presupuesto</th>
              <th>Gastado</th>
              <th>Saldo</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rubrosDetalle" :key="r.rubro">
              <td style="text-transform:capitalize;font-weight:600">{{ r.rubro }}</td>
              <td>{{ fmt(r.presupuesto_rubro) }}</td>
              <td>{{ fmt(r.total_gastado) }}</td>
              <td :style="r.saldo_rubro < 0 ? 'color:#dc2626;font-weight:700' : 'color:#16a34a;font-weight:700'">
                {{ fmt(r.saldo_rubro) }}
              </td>
              <td>
                <div class="prog-wrap">
                  <div class="prog-bar">
                    <div class="prog-fill" :style="{
                      width: Math.min((r.total_gastado / r.presupuesto_rubro) * 100, 100) + '%',
                      background: r.saldo_rubro < 0 ? '#dc2626'
                        : r.saldo_rubro < r.presupuesto_rubro * 0.1 ? '#f59e0b'
                        : '#16a34a'
                    }"/>
                  </div>
                  <span class="prog-pct">
                    {{ r.presupuesto_rubro > 0 ? Math.round((r.total_gastado / r.presupuesto_rubro) * 100) : 0 }}%
                  </span>
                </div>
              </td>
            </tr>
            <tr v-if="rubrosDetalle.length === 0">
              <td colspan="5" style="text-align:center;color:#6b7597;padding:16px">
                Sin gastos registrados aún
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!loadingRubros" class="charts-section">
          <div class="charts-row">
            <div class="chart-block">
              <div class="chart-block-title">Distribución del presupuesto</div>
              <div class="donut-wrap"><canvas ref="donutRef"></canvas></div>
              <div class="legend-list">
                <div v-for="(r, i) in rubrosDetalle" :key="r.rubro" class="leg-item">
                  <span class="leg-sq" :style="{ background: COLORS[i % COLORS.length] }"></span>
                  <span class="leg-name">{{ capitalize(r.rubro) }}</span>
                  <span class="leg-pct">
                    {{ totalPresupuesto > 0 ? Math.round(r.presupuesto_rubro / totalPresupuesto * 100) : 0 }}%
                  </span>
                </div>
              </div>
            </div>
            <div class="chart-block">
              <div class="chart-block-title">Ejecución por rubro (%)</div>
              <div class="bars-wrap"><canvas ref="barsRef"></canvas></div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn secondary" @click="showModal = false">Cerrar</button>
          <button class="btn primary" @click="irGastos(modalTransf?.id)">
            <FileText class="btn-ico" /> Ir a Gastos
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onDeactivated, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTransferenciasStore } from '@/stores/transferencias.store'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'
import BaseModal   from '@/components/ui/overlay/BaseModal.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import { Search, Eye, X, FileText, ClipboardCheck, FileDown } from 'lucide-vue-next'
import { Chart, registerables } from 'chart.js'
import RendicionStepper from '@/components/ui/shared/RendicionStepper.vue'

Chart.register(...registerables)

const store  = useTransferenciasStore()
const router = useRouter()
const auth   = useAuthStore()
const toast  = useToastStore()

const q           = ref('')
const nivelFiltro = ref('')
const showModal     = ref(false)
const modalTransf   = ref<any>(null)
const rubrosDetalle = ref<any[]>([])
const loadingRubros = ref(false)

// ── Rubros de la transferencia activa (para las barras de la card) ─────────
const rubrosActivaDetalle  = ref<any[]>([])
const loadingRubrosActiva  = ref(false)

const donutRef   = ref<HTMLCanvasElement | null>(null)
const barsRef    = ref<HTMLCanvasElement | null>(null)
const barMainRef = ref<HTMLCanvasElement | null>(null)

let donutChart:   Chart | null = null
let barsChart:    Chart | null = null
let barMainChart: Chart | null = null

const COLORS = ['#2c4fd4','#16a34a','#ea580c','#7c3aed','#0891b2','#6b7597','#db2777']

const totalPresupuesto = computed(() =>
  rubrosDetalle.value.reduce((a, r) => a + r.presupuesto_rubro, 0)
)

const estadoActual = computed(() =>
  store.activa?.estado ?? store.transferencias[0]?.estado ?? ''
)

const tieneGastosActual = computed(() =>
  (store.activa?.total_gastado ?? 0) > 0
)

// ── Totales para el ring y barra maestra ──────────────────────────────────
// Calculamos desde rubrosActivaDetalle para ser consistentes con los datos reales
const totalGastadoActiva = computed(() => {
  // Si ya tenemos el detalle de rubros, sumamos de ahí (más preciso)
  if (rubrosActivaDetalle.value.length > 0) {
    return rubrosActivaDetalle.value.reduce((s, r) => s + (r.total_gastado ?? 0), 0)
  }
  // Fallback al campo del store mientras carga
  return (store.activa as any)?.total_gastado ?? 0
})

const pctTotal = computed(() => {
  const monto = store.activa?.monto ?? 0
  if (!monto) return 0
  return Math.min(Math.round((totalGastadoActiva.value / monto) * 100), 999)
})

// Semáforo: verde → amarillo (≥70%) → naranja (≥90%) → rojo (≥100%)
function claseRubro(gastado: number, presupuesto: number): string {
  if (!presupuesto) return 'ejec-ok'
  const r = gastado / presupuesto
  if (r >= 1)   return 'ejec-over'
  if (r >= 0.9) return 'ejec-warn'
  if (r >= 0.7) return 'ejec-mid'
  return 'ejec-ok'
}

const claseTotal = computed(() =>
  claseRubro(totalGastadoActiva.value, store.activa?.monto ?? 0)
)

// ── Carga de rubros de la transferencia activa ────────────────────────────
async function cargarRubrosActiva() {
  const id = (store.activa as any)?.id
  if (!id) return
  loadingRubrosActiva.value = true
  try {
    rubrosActivaDetalle.value = await store.getRubros(id)
  } catch {
    rubrosActivaDetalle.value = []
  } finally {
    loadingRubrosActiva.value = false
  }
}

// Re-carga cuando cambia la transferencia activa
watch(() => (store.activa as any)?.id, (id) => {
  if (id) cargarRubrosActiva()
}, { immediate: false })

// ── Helpers ────────────────────────────────────────────────────────────────
function nivelLabel(nivel: string) {
  const map: Record<string, string> = { inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' }
  return map[nivel] ?? nivel
}
function fmt(n: number) {
  return 'S/ ' + (n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
function colorEjecucion(gastado: number, presupuesto: number) {
  const p = presupuesto > 0 ? gastado / presupuesto : 0
  if (p > 1)    return '#dc2626'
  if (p >= 0.9) return '#ea580c'
  if (p >= 0.7) return '#f59e0b'
  return '#16a34a'
}

// ── Niveles disponibles ────────────────────────────────────────────────────
const nivelesDisponibles = computed(() => {
  const set = new Set<string>()
  store.transferencias.forEach(t => { if (t.nivel) set.add(t.nivel) })
  return ['inicial','primaria','secundaria'].filter(n => set.has(n))
})

function codigoModularDe(nivel: string) {
  return store.transferencias.find(t => t.nivel === nivel)?.codigo_modular ?? ''
}

// ── Agrupación + filtro ────────────────────────────────────────────────────
const grupos = computed(() => {
  const term = q.value.trim().toLowerCase()
  let lista  = store.transferencias

  if (nivelFiltro.value) lista = lista.filter(t => t.nivel === nivelFiltro.value)
  if (term) lista = lista.filter(t =>
    t.codigo.toLowerCase().includes(term) ||
    t.estado.toLowerCase().includes(term) ||
    (t.ciclo ?? '').toLowerCase().includes(term)
  )

  const mapa = new Map<number, any>()
  for (const t of lista) {
    if (!mapa.has(t.asignacion_id)) {
      mapa.set(t.asignacion_id, { asignacion_id: t.asignacion_id, nivel: t.nivel, codigo_modular: t.codigo_modular, ciclo: t.ciclo, monto_total: t.monto_total, num_transferencias: t.num_transferencias, transferencias: [] })
    }
    mapa.get(t.asignacion_id).transferencias.push(t)
  }
  for (const g of mapa.values()) g.transferencias.sort((a: any, b: any) => a.numero - b.numero)
  return [...mapa.values()]
})

// ── Navegación ─────────────────────────────────────────────────────────────
function irGastos(id: any)    { router.push({ name: 'gastos',    query: { transf: id } }) }
function irRendicion(id: any) { router.push({ name: 'rendicion', query: { transf: id } }) }

// ── Descarga acta ──────────────────────────────────────────────────────────
async function descargarActa(t: any) {
  const res = await fetch(
    `http://localhost:3000/api/transferencias/acta?asignacion_id=${t.asignacion_id}`,
    { headers: { Authorization: `Bearer ${auth.token}` } }
  )
  if (!res.ok) { toast.error('Error', 'No se pudo generar el acta'); return }
  const blob = await res.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `acta-${t.codigo}.pdf`
  link.click()
}

// ── Modal rubros ───────────────────────────────────────────────────────────
async function abrirRubros(t: any) {
  modalTransf.value   = t
  rubrosDetalle.value = []
  showModal.value     = true
  loadingRubros.value = true
  try { rubrosDetalle.value = await store.getRubros(t.id) }
  finally { loadingRubros.value = false }
  await nextTick()
  initModalCharts()
}

function initModalCharts() {
  const rubros = rubrosDetalle.value
  if (!rubros.length) return

  if (donutRef.value) {
    donutChart?.destroy()
    donutChart = new Chart(donutRef.value, {
      type: 'doughnut',
      data: { labels: rubros.map(r => capitalize(r.rubro)), datasets: [{ data: rubros.map(r => r.presupuesto_rubro), backgroundColor: COLORS.slice(0, rubros.length), borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fmt(ctx.raw as number) } } } }
    })
  }
  if (barsRef.value) {
    barsChart?.destroy()
    barsChart = new Chart(barsRef.value, {
      type: 'bar',
      data: { labels: rubros.map(r => capitalize(r.rubro)), datasets: [
        { label: 'Ejecutado', data: rubros.map(r => r.presupuesto_rubro > 0 ? Math.min(Math.round(r.total_gastado / r.presupuesto_rubro * 100), 100) : 0), backgroundColor: rubros.map(r => colorEjecucion(r.total_gastado, r.presupuesto_rubro)), borderRadius: 4, barPercentage: 0.6 },
        { label: 'Disponible', data: rubros.map(r => r.presupuesto_rubro > 0 ? Math.max(0, 100 - Math.round(r.total_gastado / r.presupuesto_rubro * 100)) : 100), backgroundColor: '#f0f2f8', borderRadius: 4, barPercentage: 0.6 }
      ]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 }, color: '#6b7597' } }, y: { stacked: true, max: 100, ticks: { callback: v => v + '%', font: { size: 10 }, color: '#6b7597' } } } }
    })
  }
}

// ── Gráfico principal ──────────────────────────────────────────────────────
function initMainChart() {
  if (barMainChart) { barMainChart.destroy(); barMainChart = null }
  const ts = [...store.transferencias].reverse().slice(0, 8)
  if (!ts.length || !barMainRef.value) return
  barMainChart = new Chart(barMainRef.value, {
    type: 'bar',
    data: {
      labels: ts.map(t => `${t.numero}/${t.num_transferencias} ${nivelLabel(t.nivel)}`),
      datasets: [
        { label: 'Transferido', data: ts.map(t => t.monto), backgroundColor: '#dbeafe', borderColor: '#2c4fd4', borderWidth: 1.5, borderRadius: 4, barPercentage: 0.7 },
        { label: 'Gastado', data: ts.map(t => t.total_gastado ?? 0), backgroundColor: '#dcfce7', borderColor: '#16a34a', borderWidth: 1.5, borderRadius: 4, barPercentage: 0.7 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: {
        title: items => { const t = ts[items[0].dataIndex]; return `${t.codigo} · Transf. ${t.numero}/${t.num_transferencias} · ${nivelLabel(t.nivel)}` },
        label: ctx => ` ${ctx.dataset.label}: S/ ${Number(ctx.raw).toLocaleString('es-PE')}`
      }}},
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#6b7597', autoSkip: false } },
        y: { grid: { color: '#f0f2f8' }, ticks: { callback: v => 'S/ ' + Number(v).toLocaleString('es-PE', { notation: 'compact' }), font: { size: 10 }, color: '#6b7597' } }
      }
    }
  })
}

// ── Ciclo de vida ──────────────────────────────────────────────────────────
async function cargarYGraficar() {
  await store.cargar()
  await nextTick()
  initMainChart()
  // Cargar rubros de la activa después de tener los datos del store
  await cargarRubrosActiva()
}

onMounted(cargarYGraficar)
onActivated(async () => {
  await nextTick()
  initMainChart()
  await cargarRubrosActiva()
})
onDeactivated(() => { barMainChart?.destroy(); barMainChart = null })
onUnmounted(() => {
  barMainChart?.destroy(); barMainChart = null
  donutChart?.destroy();   donutChart   = null
  barsChart?.destroy();    barsChart    = null
})
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }

.kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:20px; }
.kpi-card { background:#fff; border:1px solid #d4dae8; border-radius:14px; padding:18px 20px; box-shadow:0 2px 8px rgba(26,47,110,.06); }
.kpi-card.left-blue   { border-left:4px solid #2c4fd4; }
.kpi-card.left-green  { border-left:4px solid #16a34a; }
.kpi-card.left-orange { border-left:4px solid #ea580c; }
.kpi-label { font-size:11px; font-weight:700; text-transform:uppercase; color:#6b7597; margin-bottom:6px; }
.kpi-val { font-size:24px; font-weight:800; color:#1a2340; }
.kpi-val.green  { color:#16a34a; }
.kpi-val.orange { color:#ea580c; }
.kpi-sub { font-size:12px; color:#6b7597; margin-top:4px; }

.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 12px rgba(26,47,110,.08); margin-bottom:20px; }
.activa-card { border-left:4px solid #2c4fd4; }
.card-header { display:flex; align-items:flex-start; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #d4dae8; gap:12px; }
.card-title-sm { font-size:14px; font-weight:700; color:#1a2340; }
.card-meta { font-size:12px; color:#6b7597; margin-top:4px; }
.activa-top { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.transf-counter { font-size:12px; font-weight:700; background:#f0f4ff; color:#2c4fd4; padding:2px 8px; border-radius:20px; }

/* ── Sección ejecución ───────────────────────────────────────────────────── */
.rubros-ejecucion { padding:16px 20px 22px; }

.ejec-resumen {
  display:flex; align-items:center; justify-content:space-between;
  gap:12px; margin-bottom:10px;
}
.ejec-resumen-left { display:flex; flex-direction:column; gap:3px; }
.ejec-resumen-label {
  font-size:10.5px; font-weight:700; text-transform:uppercase;
  letter-spacing:.4px; color:#6b7597;
}
.ejec-resumen-montos { font-size:13px; color:#1a2340; }
.ejec-resumen-montos strong { font-size:20px; font-weight:800; }
.ejec-sep { font-size:12px; color:#9ba6c0; margin:0 4px; }

.ejec-pct-ring {
  width:54px; height:54px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:800;
  border:3px solid; flex-shrink:0;
  transition:color .3s, border-color .3s;
}

.ejec-master-bar-bg {
  height:10px; background:#f0f2f8; border-radius:99px;
  overflow:hidden; margin-bottom:20px;
}
.ejec-master-bar-fill {
  height:100%; border-radius:99px;
  transition:width .6s ease;
}

/* Skeleton loader */
.rubros-skeleton {
  display:grid; grid-template-columns:repeat(3,1fr);
  gap:14px 28px;
}
.skeleton-item { display:flex; flex-direction:column; gap:6px; }
.skel-line {
  background: linear-gradient(90deg, #f0f2f8 25%, #e5e8f0 50%, #f0f2f8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  border-radius: 4px;
}
.skel-label { height:10px; width:60%; }
.skel-bar   { height:5px;  width:100%; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Grid de rubros */
.rubros-grid-ejec {
  display:grid; grid-template-columns:repeat(3,1fr);
  gap:14px 28px;
}
.rubro-ejec-item { display:flex; flex-direction:column; gap:5px; }
.rubro-ejec-header {
  display:flex; align-items:baseline;
  justify-content:space-between; gap:6px;
}
.rubro-ejec-name {
  font-size:10.5px; font-weight:700;
  text-transform:uppercase; letter-spacing:.35px; color:#6b7597;
}
.rubro-ejec-nums { display:flex; align-items:baseline; gap:2px; }
.rubro-gastado { font-weight:700; font-size:11.5px; }
.rubro-slash { color:#d4dae8; font-size:10px; }
.rubro-presup { color:#9ba6c0; font-size:10.5px; }

.rubro-bar-bg {
  height:5px; background:#f0f2f8;
  border-radius:99px; overflow:hidden;
}
.rubro-bar-fill {
  height:100%; border-radius:99px;
  transition:width .5s ease;
}
.rubro-bar-pct {
  font-size:10px; font-weight:700; text-align:right;
}

/* ── Semáforo ────────────────────────────────────────────────────────────── */
.ejec-ok   { color:#16a34a; }
.ejec-mid  { color:#d97706; }
.ejec-warn { color:#ea580c; }
.ejec-over { color:#dc2626; }

.rubro-bar-fill.ejec-ok,
.ejec-master-bar-fill.ejec-ok   { background:#16a34a; }
.rubro-bar-fill.ejec-mid,
.ejec-master-bar-fill.ejec-mid  { background:#d97706; }
.rubro-bar-fill.ejec-warn,
.ejec-master-bar-fill.ejec-warn { background:#ea580c; }
.rubro-bar-fill.ejec-over,
.ejec-master-bar-fill.ejec-over { background:#dc2626; }

/* ── Resto de estilos ────────────────────────────────────────────────────── */
.nivel-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; white-space:nowrap; }
.nivel-badge.inicial    { background:#e0f2fe; color:#0369a1; }
.nivel-badge.primaria   { background:#dcfce7; color:#16a34a; }
.nivel-badge.secundaria { background:#fef3c7; color:#b45309; }
.cod-modular { font-size:11px; color:#9ba6c0; font-family:monospace; }
.nivel-cell { display:flex; align-items:center; gap:6px; }
.nivel-pills { display:flex; gap:6px; align-items:center; }
.pill { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:20px; border:1.5px solid #d4dae8; background:#f9fafb; font-size:12px; font-weight:600; color:#6b7597; cursor:pointer; transition:all .15s; white-space:nowrap; }
.pill:hover { border-color:#2c4fd4; color:#2c4fd4; background:#f0f4ff; }
.pill.active { background:#1a2f6e; color:#fff; border-color:#1a2f6e; }
.pill.active.inicial    { background:#0369a1; border-color:#0369a1; }
.pill.active.primaria   { background:#16a34a; border-color:#16a34a; }
.pill.active.secundaria { background:#b45309; border-color:#b45309; }
.pill-cod { font-size:10px; font-weight:400; opacity:.75; font-family:monospace; }
.toolbar-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.search-wrap { position:relative; }
.search-ico { position:absolute; left:10px; top:50%; transform:translateY(-50%); width:14px; height:14px; color:#6b7597; }
.search-input { padding:7px 12px 7px 32px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13px; outline:none; width:200px; }
.search-input:focus { border-color:#2c4fd4; }
.chart-main-block { background:#fff; border:1px solid #d4dae8; border-radius:14px; padding:18px 20px; box-shadow:0 2px 8px rgba(26,47,110,.06); margin-bottom:20px; }
.chart-main-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:#6b7597; margin-bottom:14px; }
.bar-legend { display:flex; align-items:center; gap:12px; margin-bottom:12px; flex-wrap:wrap; }
.bar-leg-item { display:flex; align-items:center; gap:5px; font-size:12px; color:#1a2340; }
.bar-leg-sq { width:12px; height:12px; border-radius:3px; flex-shrink:0; }
.bar-leg-sep { color:#d4dae8; font-size:14px; }
.bar-leg-note { font-size:11px; color:#6b7597; font-style:italic; }
.loading-row { display:flex; align-items:center; gap:10px; padding:32px; justify-content:center; color:#6b7597; font-size:13.5px; }
.spinner-lg { width:20px; height:20px; border:3px solid #d4dae8; border-top-color:#2c4fd4; border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
thead th { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#6b7597; padding:10px 16px; text-align:left; border-bottom:1px solid #d4dae8; background:#fafbfd; }
tbody tr { border-bottom:1px solid #f0f2f8; transition:background .12s; }
tbody tr:hover:not(.grupo-header) { background:#f0f4ff; }
tbody td { padding:12px 16px; font-size:13.5px; color:#1a2340; }
td.fw { font-weight:700; }
td.orange { color:#ea580c; font-weight:700; }
td.green-t { color:#16a34a; font-weight:700; }
td.empty { text-align:center; color:#6b7597; padding:24px; }
.grupo-header td { background:#f7f8fc; padding:7px 16px; border-top:2px solid #d4dae8; border-bottom:1px solid #e5e8f0; }
.last-in-group td { border-bottom:2px solid #e5e8f0; }
.transf-cell { display:flex; flex-direction:column; gap:2px; }
.transf-num { font-size:12px; font-weight:700; color:#2c4fd4; }
.transf-cod { font-size:11px; color:#9ba6c0; font-family:monospace; }
.actions { display:flex; gap:6px; }
.icon-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:7px; padding:6px; cursor:pointer; display:flex; align-items:center; color:#6b7597; transition:all .15s; }
.icon-btn:hover { background:#e8edf9; color:#2c4fd4; border-color:#2c4fd4; }
.btn-ico { width:14px; height:14px; }
.modal-hd { display:flex; align-items:flex-start; justify-content:space-between; padding-bottom:14px; border-bottom:1px solid #d4dae8; margin-bottom:16px; }
.modal-title { font-size:16px; font-weight:700; color:#1a2340; }
.modal-sub { display:flex; align-items:center; gap:8px; font-size:12px; color:#6b7597; margin-top:4px; flex-wrap:wrap; }
.modal-close { background:none; border:none; cursor:pointer; color:#6b7597; padding:4px; flex-shrink:0; }
table th { font-size:11px; font-weight:700; text-transform:uppercase; color:#6b7597; padding:8px 12px; border-bottom:1px solid #d4dae8; text-align:left; }
table td { padding:10px 12px; font-size:13.5px; border-bottom:1px solid #f0f2f8; }
.modal-footer { display:flex; gap:8px; justify-content:flex-end; margin-top:16px; padding-top:14px; border-top:1px solid #d4dae8; }
.btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; font-size:13.5px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn.primary { background:#1a2f6e; color:#fff; }
.btn.primary:hover { background:#2c4fd4; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
.prog-wrap { display:flex; align-items:center; gap:8px; }
.prog-bar { flex:1; height:6px; background:#f0f2f8; border-radius:3px; overflow:hidden; min-width:60px; }
.prog-fill { height:100%; border-radius:3px; transition:width .3s; }
.prog-pct { font-size:11px; font-weight:700; color:#6b7597; width:32px; text-align:right; }
.charts-section { margin-top:20px; }
.charts-row { display:grid; grid-template-columns:220px 1fr; gap:20px; align-items:start; }
.chart-block-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:#6b7597; margin-bottom:10px; }
.donut-wrap { position:relative; height:200px; }
.bars-wrap  { position:relative; height:200px; }
.legend-list { display:flex; flex-direction:column; gap:6px; margin-top:12px; }
.leg-item { display:flex; align-items:center; gap:7px; font-size:12px; color:#1a2340; }
.leg-sq   { width:10px; height:10px; border-radius:2px; flex-shrink:0; }
.leg-name { flex:1; text-transform:capitalize; }
.leg-pct  { font-weight:700; color:#6b7597; font-size:11px; }
</style>