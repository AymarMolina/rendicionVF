<template>
  <div class="page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Panel del Coordinador</h1>
        <p class="page-sub">Resumen general · {{ anioActual }}</p>
      </div>
      <button class="btn-refresh" @click="cargarDatos" :disabled="loading">
        <RefreshCw style="width:14px;height:14px" :class="{ spinning: loading }" />
        Actualizar
      </button>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">
          <ArrowRightLeft style="width:13px;height:13px" /> Transferencias
        </div>
        <div class="kpi-val">{{ stats.totalTransferencias }}</div>
        <div class="kpi-sub blue">Este año</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">
          <Banknote style="width:13px;height:13px" /> Monto total
        </div>
        <div class="kpi-val">{{ fmt(stats.montoTotal) }}</div>
        <div class="kpi-sub green">Liberado</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">
          <School style="width:13px;height:13px" /> Módulos activos
        </div>
        <div class="kpi-val">{{ stats.modulosActivos }}</div>
        <div class="kpi-sub teal">Con tesorero</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">
          <FileCheck style="width:13px;height:13px" /> Rendiciones
        </div>
        <div class="kpi-val">{{ stats.pctRendiciones }}%</div>
        <div class="kpi-sub amber">Enviadas</div>
      </div>
    </div>

    <!-- Fila 1: Transferencias por ciclo + Estado de rendiciones -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">Transferencias por ciclo</div>
          <div class="chart-sub">Transferencias liberadas — {{ anioActual }}</div>
        </div>
        <div class="chart-wrap" style="height:220px">
          <canvas ref="c1Ref"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">Estado de rendiciones</div>
          <div class="chart-sub">Distribución por estado actual</div>
        </div>
        <div class="legend-row">
          <span v-for="l in legendRendiciones" :key="l.label" class="legend-item">
            <span class="legend-sq" :style="{ background: l.color }"></span>
            {{ l.label }} {{ l.pct }}%
          </span>
        </div>
        <div class="chart-wrap" style="height:180px">
          <canvas ref="c2Ref"></canvas>
        </div>
      </div>
    </div>

    <!-- Fila 2: Gasto por rubro + Módulos por nivel -->
    <div class="charts-row2">
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">Gasto por rubro</div>
          <div class="chart-sub">Presupuesto asignado vs gasto registrado (S/)</div>
        </div>
        <div class="legend-row">
          <span class="legend-item"><span class="legend-sq" style="background:#185FA5"></span>Presupuesto</span>
          <span class="legend-item"><span class="legend-sq" style="background:#1D9E75"></span>Gastado</span>
        </div>
        <div class="chart-wrap" style="height:220px">
          <canvas ref="c3Ref"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">Módulos por nivel</div>
          <div class="chart-sub">Distribución de módulos activos</div>
        </div>
        <div class="legend-row">
          <span v-for="l in legendNiveles" :key="l.label" class="legend-item">
            <span class="legend-sq" :style="{ background: l.color }"></span>
            {{ l.label }} {{ l.pct }}%
          </span>
        </div>
        <div class="chart-wrap" style="height:180px">
          <canvas ref="c4Ref"></canvas>
        </div>
      </div>
    </div>

    <!-- Fila 3: Transferencias mensuales -->
    <div class="chart-card mb">
      <div class="chart-header">
        <div class="chart-title">Monto liberado por mes</div>
        <div class="chart-sub">Evolución mensual del monto total de transferencias (S/)</div>
      </div>
      <div class="chart-wrap" style="height:200px">
        <canvas ref="c5Ref"></canvas>
      </div>
    </div>

    <!-- Tabla ciclos -->
    <div class="tabla-card">
      <div class="tabla-card-header">
        <div>
          <div class="tabla-title">Resumen de ciclos — {{ anioActual }}</div>
          <div class="tabla-sub">Estado de liberación y montos por ciclo</div>
        </div>
      </div>

      <div v-if="loading" class="loading-row">
        <div class="spinner-lg" /> Cargando...
      </div>

      <div v-else class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Ciclo</th>
              <th>Período</th>
              <th>Módulos</th>
              <th>Transferencias</th>
              <th>Monto total</th>
              <th>Liberación</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in ciclos" :key="c.id">
              <td class="td-bold">{{ c.nombre }}</td>
              <td class="td-muted">{{ fmtFecha(c.fecha_inicio) }} – {{ fmtFecha(c.fecha_fin) }}</td>
              <td>{{ c.total_asignaciones }}</td>
              <td class="blue">{{ c.total_transferencias }}</td>
              <td class="green td-bold">{{ fmt(c.monto_total) }}</td>
              <td>
                <div class="prog-wrap">
                  <div class="prog-bar">
                    <div class="prog-fill" :style="{
                      width: pct(c) + '%',
                      background: pct(c) === 100 ? '#1D9E75' : '#378ADD'
                    }" />
                  </div>
                  <span class="prog-label">{{ c.asignaciones_liberadas }}/{{ c.total_asignaciones }}</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="badgeClass(c)">{{ estadoLabel(c) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import {
  RefreshCw, ArrowRightLeft, Banknote,
  School, FileCheck
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'

Chart.register(...registerables)

const BASE  = 'http://localhost:3000/api'
const auth  = useAuthStore()
const toast = useToastStore()

const anioActual = new Date().getFullYear()
const loading    = ref(false)
const ciclos     = ref<any[]>([])

// ── canvas refs ──────────────────────────────────────────────────────────────
const c1Ref = ref<HTMLCanvasElement>()
const c2Ref = ref<HTMLCanvasElement>()
const c3Ref = ref<HTMLCanvasElement>()
const c4Ref = ref<HTMLCanvasElement>()
const c5Ref = ref<HTMLCanvasElement>()

let charts: Chart[] = []

// ── KPI state ─────────────────────────────────────────────────────────────────
const stats = ref({
  totalTransferencias: 0,
  montoTotal:          0,
  modulosActivos:      0,
  pctRendiciones:      0,
})

// ── Leyendas ──────────────────────────────────────────────────────────────────
const legendRendiciones = [
  { label: 'Aprobada',      color: '#378ADD', pct: 32 },
  { label: 'Enviada',       color: '#1D9E75', pct: 29 },
  { label: 'Borrador',      color: '#BA7517', pct: 22 },
  { label: 'Sin rendición', color: '#888780', pct: 17 },
]

const legendNiveles = [
  { label: 'Inicial',     color: '#0369a1', pct: 34 },
  { label: 'Primaria',    color: '#16a34a', pct: 41 },
  { label: 'Secundaria',  color: '#b45309', pct: 25 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (!n) return 'S/ 0'
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(f: string) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function pct(c: any) {
  if (!c.total_asignaciones) return 0
  return Math.round((c.asignaciones_liberadas / c.total_asignaciones) * 100)
}

function estadoLabel(c: any) {
  if (!c.total_asignaciones)          return 'Sin datos'
  if (c.asignaciones_liberadas === 0) return 'Pendiente'
  if (pct(c) < 100)                   return 'Parcial'
  return 'Liberado'
}

function badgeClass(c: any) {
  const e = estadoLabel(c)
  if (e === 'Liberado')  return 'badge-ok'
  if (e === 'Parcial')   return 'badge-warn'
  if (e === 'Pendiente') return 'badge-info'
  return 'badge-neutral'
}

function headers(json = false) {
  const h: Record<string, string> = { Authorization: `Bearer ${auth.token}` }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

const isDark = computed(() =>
  window.matchMedia('(prefers-color-scheme: dark)').matches
)

// ── Colores Chart.js ──────────────────────────────────────────────────────────
function chartColors() {
  return {
    grid:    isDark.value ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    txt:     isDark.value ? '#9b9b92'                : '#6b6b66',
    blue:    '#378ADD',
    green:   '#1D9E75',
    amber:   '#BA7517',
    gray:    '#888780',
    teal:    '#0F6E56',
    initial: '#0369a1',
    prim:    '#16a34a',
    sec:     '#b45309',
  }
}

// ── Carga de datos ────────────────────────────────────────────────────────────
async function cargarDatos() {
  loading.value = true
  try {
    const res  = await fetch(`${BASE}/importar/ciclos`, { headers: headers() })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: any[] = await res.json()
    ciclos.value = data

    // Calcular KPIs desde los ciclos
    stats.value.totalTransferencias = data.reduce((s, c) => s + (c.total_transferencias ?? 0), 0)
    stats.value.montoTotal          = data.reduce((s, c) => s + (c.monto_total ?? 0), 0)
    stats.value.modulosActivos      = data.reduce((s, c) => s + (c.asignaciones_liberadas ?? 0), 0)
    const totalAsig                 = data.reduce((s, c) => s + (c.total_asignaciones ?? 0), 0)
    stats.value.pctRendiciones      = totalAsig
      ? Math.round((stats.value.modulosActivos / totalAsig) * 100)
      : 0

    await nextTick()
    destruirCharts()
    construirCharts(data)
  } catch (err: any) {
    toast.error('Error', 'No se pudieron cargar los datos del panel')
  } finally {
    loading.value = false
  }
}

// ── Destruir charts antes de recrear ─────────────────────────────────────────
function destruirCharts() {
  charts.forEach(ch => ch.destroy())
  charts = []
}

// ── Construir todos los charts ────────────────────────────────────────────────
function construirCharts(data: any[]) {
  const col = chartColors()

  Chart.defaults.font.family = 'inherit'
  Chart.defaults.font.size   = 11
  Chart.defaults.color       = col.txt

  const opts = (extra: object = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { cornerRadius: 6, padding: 8 },
    },
    ...extra,
  })

  // C1 — Barras: transferencias por ciclo
  const c1Labels = data.map(c => c.nombre ?? `Ciclo ${c.id}`)
  const c1Data   = data.map(c => c.total_transferencias ?? 0)

  if (c1Ref.value) {
    charts.push(new Chart(c1Ref.value, {
      type: 'bar',
      data: {
        labels: c1Labels,
        datasets: [{
          label: 'Transferencias',
          data: c1Data,
          backgroundColor: col.blue + 'cc',
          borderColor: col.blue,
          borderWidth: 1,
          borderRadius: 5,
        }],
      },
      options: opts({
        scales: {
          x: { grid: { display: false }, ticks: { color: col.txt } },
          y: {
            grid: { color: col.grid },
            ticks: { color: col.txt, stepSize: 1 },
            beginAtZero: true,
          },
        },
      }),
    }))
  }

  // C2 — Dona: estados de rendiciones (datos mock representativos)
  if (c2Ref.value) {
    charts.push(new Chart(c2Ref.value, {
      type: 'doughnut',
      data: {
        labels: ['Aprobada', 'Enviada', 'Borrador', 'Sin rendición'],
        datasets: [{
          data: [32, 29, 22, 17],
          backgroundColor: [col.blue, col.green, col.amber, col.gray],
          borderWidth: 2,
          borderColor: isDark.value ? '#1c1c1a' : '#ffffff',
          hoverOffset: 6,
        }],
      },
      options: opts({ cutout: '68%' }),
    }))
  }

  // C3 — Barras agrupadas: presupuesto vs gasto por rubro
  const rubros      = ['Alimentos', 'Transporte', 'Gas', 'Estipendio', 'Limpieza', 'Otros']
  const presupuesto = [48000, 22000, 15000, 38000, 12000, 8000]
  const gastado     = [43200, 19500, 11300, 35800, 9600, 6100]

  if (c3Ref.value) {
    charts.push(new Chart(c3Ref.value, {
      type: 'bar',
      data: {
        labels: rubros,
        datasets: [
          {
            label: 'Presupuesto',
            data: presupuesto,
            backgroundColor: '#185FA5cc',
            borderColor: '#185FA5',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Gastado',
            data: gastado,
            backgroundColor: col.green + 'cc',
            borderColor: col.green,
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: opts({
        scales: {
          x: { grid: { display: false }, ticks: { color: col.txt } },
          y: {
            grid: { color: col.grid },
            ticks: {
              color: col.txt,
              callback: (v: any) => 'S/' + (v / 1000).toFixed(0) + 'k',
            },
            beginAtZero: true,
          },
        },
      }),
    }))
  }

  // C4 — Dona: módulos por nivel
  if (c4Ref.value) {
    charts.push(new Chart(c4Ref.value, {
      type: 'doughnut',
      data: {
        labels: ['Inicial', 'Primaria', 'Secundaria'],
        datasets: [{
          data: [34, 41, 25],
          backgroundColor: [col.initial, col.prim, col.sec],
          borderWidth: 2,
          borderColor: isDark.value ? '#1c1c1a' : '#ffffff',
          hoverOffset: 6,
        }],
      },
      options: opts({ cutout: '68%' }),
    }))
  }

  // C5 — Línea: monto liberado por mes
  const meses    = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
  const montoMes = [0, 0, 95000, 0, 210000, 0, 0, 315000, 0, 180000, 0, 0]

  if (c5Ref.value) {
    charts.push(new Chart(c5Ref.value, {
      type: 'line',
      data: {
        labels: meses,
        datasets: [{
          label: 'Monto (S/)',
          data: montoMes,
          borderColor: col.blue,
          backgroundColor: col.blue + '18',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: col.blue,
          borderWidth: 2,
        }],
      },
      options: opts({
        scales: {
          x: { grid: { display: false }, ticks: { color: col.txt } },
          y: {
            grid: { color: col.grid },
            ticks: {
              color: col.txt,
              callback: (v: any) => v === 0 ? '0' : 'S/' + (v / 1000).toFixed(0) + 'k',
            },
            beginAtZero: true,
          },
        },
      }),
    }))
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => cargarDatos())
onBeforeUnmount(() => destruirCharts())
</script>

<style scoped>
.page { width: 100%; }

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 22px;
}
.page-title { font-size: 26px; font-weight: 800; color: #1a2340; margin: 0; }
.page-sub   { font-size: 13px; color: #6b7597; margin-top: 2px; }

/* KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
@media (max-width: 800px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

.kpi-card {
  background: #fff;
  border: 1px solid #d4dae8;
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 2px 8px rgba(26,47,110,.04);
}
.kpi-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: #6b7597;
  margin-bottom: 8px;
}
.kpi-val { font-size: 28px; font-weight: 800; color: #1a2340; line-height: 1; }
.kpi-sub { font-size: 11.5px; font-weight: 600; margin-top: 6px; }
.kpi-sub.blue  { color: #2c4fd4; }
.kpi-sub.green { color: #16a34a; }
.kpi-sub.teal  { color: #0F6E56; }
.kpi-sub.amber { color: #b45309; }

/* Charts rows */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}
.charts-row2 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}
@media (max-width: 900px) {
  .charts-row, .charts-row2 { grid-template-columns: 1fr; }
}

.chart-card {
  background: #fff;
  border: 1px solid #d4dae8;
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 2px 8px rgba(26,47,110,.04);
}
.chart-header  { margin-bottom: 12px; }
.chart-title   { font-size: 14px; font-weight: 800; color: #1a2340; }
.chart-sub     { font-size: 12px; color: #6b7597; margin-top: 2px; }
.chart-wrap    { position: relative; width: 100%; }

/* Leyenda */
.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: #6b7597;
  font-weight: 600;
}
.legend-sq {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* Tabla ciclos */
.mb { margin-bottom: 14px; }

.tabla-card {
  background: #fff;
  border: 1px solid #d4dae8;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(26,47,110,.04);
}
.tabla-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #d4dae8;
  background: linear-gradient(135deg, #f0f4ff, #fafbfd);
}
.tabla-title { font-size: 14px; font-weight: 800; color: #1a2340; }
.tabla-sub   { font-size: 12px; color: #6b7597; margin-top: 2px; }

.tabla-wrap { overflow-x: auto; }
.tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
.tabla thead th {
  background: #fafbfd;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: #6b7597;
  padding: 10px 14px;
  border-bottom: 1px solid #d4dae8;
  text-align: left;
  white-space: nowrap;
}
.tabla tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f2f8;
  color: #1a2340;
  vertical-align: middle;
}
.tabla tbody tr:last-child td { border-bottom: none; }
.tabla tbody tr:hover td { background: #f7f9ff; }

.td-bold  { font-weight: 700; }
.td-muted { color: #6b7597; font-size: 12px; }
.blue  { color: #2c4fd4; font-weight: 600; }
.green { color: #15803d; font-weight: 600; }

/* Progress */
.prog-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.prog-bar {
  width: 80px;
  height: 5px;
  background: #e8edf9;
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}
.prog-fill { height: 100%; border-radius: 3px; transition: width .4s; }
.prog-label { font-size: 11.5px; color: #6b7597; font-weight: 600; white-space: nowrap; }

/* Badges */
.badge {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}
.badge-ok      { background: #dcfce7; color: #15803d; }
.badge-warn    { background: #fef3c7; color: #b45309; }
.badge-info    { background: #eff6ff; color: #2c4fd4; }
.badge-neutral { background: #f0f2f8; color: #9ba6c0; }

/* Loading */
.loading-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 36px;
  justify-content: center;
  color: #6b7597;
  font-size: 13px;
}
.spinner-lg {
  width: 20px;
  height: 20px;
  border: 3px solid #d4dae8;
  border-top-color: #2c4fd4;
  border-radius: 50%;
  animation: spin .6s linear infinite;
}

/* Refresh button */
.btn-refresh {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #fff;
  border: 1.5px solid #d4dae8;
  border-radius: 9px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  color: #6b7597;
  cursor: pointer;
  transition: all .15s;
}
.btn-refresh:hover:not(:disabled) {
  border-color: #2c4fd4;
  color: #2c4fd4;
  background: #f0f4ff;
}
.btn-refresh:disabled { opacity: .5; cursor: not-allowed; }

.spinning   { animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>