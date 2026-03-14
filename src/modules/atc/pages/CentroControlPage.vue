<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Centro de Control</h1>
        <p class="page-sub">Período: Junio 2025 · {{ store.instituciones.length }} instituciones educativas</p>
      </div>
    </div>

    <div class="kpi-grid">
      <KpiCard label="IEEs a Cargo"         :value="store.instituciones.length" />
      <KpiCard label="Expedientes Listos"   :value="store.listos"   color="green" />
      <KpiCard label="IEEs Observadas"      :value="observadas"     color="orange" />
      <KpiCard label="IEEs Críticas"        :value="store.criticos" color="red" />
    </div>

    <div class="panels-grid">
      <!-- Estado IEEs -->
      <div class="card">
        <div class="card-header">
          <span class="card-title-sm">Estado de IEEs — Junio 2025</span>
        </div>
        <div class="card-body">
          <div v-for="ie in store.instituciones" :key="ie.id" class="ie-row">
            <div class="ie-row-top">
              <span class="ie-name">{{ ie.nombre }}</span>
              <span class="ie-pct" :class="pctColor(ie.progreso)">{{ ie.progreso }}%</span>
            </div>
            <ProgressBar :value="ie.progreso" />
          </div>
        </div>
      </div>

      <!-- Alertas activas -->
      <div class="card">
        <div class="card-header">
          <span class="card-title-sm">Alertas Activas</span>
        </div>
        <div class="card-body">
          <div class="alert-item danger">
            <div class="alert-ie">IE N° 20089</div>
            <div class="alert-msg">⚠ No registra conciliación desde hace 12 días</div>
          </div>
          <div class="alert-item warning">
            <div class="alert-ie" style="color:#b45309">IE N° 38267</div>
            <div class="alert-msg">Expediente completo – pendiente tu firma</div>
          </div>
          <div class="alert-item info">
            <div class="alert-ie" style="color:#2c4fd4">IE N° 00347</div>
            <div class="alert-msg">Expediente completo – pendiente tu firma</div>
          </div>
          <div class="alert-item warning">
            <div class="alert-ie" style="color:#b45309">IE N° 10521</div>
            <div class="alert-msg">Comprobante Boleta 003-021 requiere subsanación</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useInstitucionStore } from '@/stores/institucion.store'
import KpiCard    from '@/components/ui/shared/KpiCard.vue'
import ProgressBar from '@/components/ui/shared/ProgressBar.vue'

const store    = useInstitucionStore()
const observadas = computed(() => store.instituciones.filter(i => i.estado === 'observado').length)

function pctColor(v: number) {
  return v >= 100 ? 'green' : v >= 70 ? 'yellow' : 'red'
}
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:20px; }
.panels-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 12px rgba(26,47,110,.08); }
.card-header { padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; color:#1a2340; }
.card-body { padding:16px 20px; }
.ie-row { margin-bottom:14px; }
.ie-row:last-child { margin-bottom:0; }
.ie-row-top { display:flex; justify-content:space-between; margin-bottom:4px; }
.ie-name { font-size:13px; font-weight:600; color:#1a2340; }
.ie-pct { font-size:11px; font-weight:700; }
.ie-pct.green  { color:#16a34a; }
.ie-pct.yellow { color:#f59e0b; }
.ie-pct.red    { color:#dc2626; }
.alert-item { padding:12px 14px; border-radius:8px; border:1px solid #d4dae8; border-left:3px solid #dc2626; margin-bottom:8px; }
.alert-item:last-child { margin-bottom:0; }
.alert-item.warning { border-left-color:#f59e0b; }
.alert-item.info    { border-left-color:#2c4fd4; }
.alert-ie  { font-size:11px; font-weight:700; color:#dc2626; text-transform:uppercase; letter-spacing:.3px; }
.alert-msg { font-size:12.5px; color:#1a2340; margin-top:2px; }
</style>
