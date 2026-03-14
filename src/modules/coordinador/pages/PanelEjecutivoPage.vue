<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Panel Ejecutivo</h1>
        <p class="page-sub">Seguimiento nacional del proceso de rendición de cuentas</p>
      </div>
    </div>

    <!-- KPIs nacionales -->
    <div class="kpi-grid4">
      <KpiCard label="Total IIEEs Nacionales"   value="22"          sub="4 regiones activas" color="blue" />
      <KpiCard label="Expedientes Aprobados"     value="17/22"       sub="Este ciclo"          color="green" />
      <KpiCard label="Monto Total Transferido"   value="S/ 430,000"  sub="Marzo 2026"          color="orange" />
      <KpiCard label="Avance Promedio"           value="78%"         sub="Todas las UT"        color="green" />
    </div>

    <!-- Grid UTs -->
    <div class="card mb">
      <div class="card-header"><span class="card-title-sm">Ejecución por UT — Marzo 2026</span></div>
      <div class="card-body">
        <div class="ut-grid">
          <div
            v-for="ut in uts"
            :key="ut.nombre"
            class="ut-card"
            @click="router.push({ name: 'coord-expedientes', query: { ut: ut.nombre } })"
          >
            <div class="ut-name">{{ ut.nombre }}</div>
            <div class="ut-atc">ATC: María Torres · 5IIEEs</div>
            <div class="ut-pct" :class="ut.pct >= 85 ? 'green' : 'yellow'">{{ ut.pct }}%</div>
            <div class="prog-bar"><div class="prog-fill" :style="{ width: ut.pct+'%', background: ut.pct>=85?'#16a34a':'#f59e0b' }" /></div>
            <div class="ut-monto">S/ 16,500.00</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla resumen -->
    <div class="card">
      <div class="card-header">
        <div class="kpi-row">
          <div>
            <div class="kpi-sm-label">Monto Total Enviado</div>
            <div class="kpi-sm-val">S/ 30,000,000</div>
            <div class="kpi-sm-sub">Período 2024</div>
          </div>
          <div>
            <div class="kpi-sm-label">Total Sustentado por UT</div>
            <div class="kpi-sm-val green">98%</div>
            <div class="kpi-sm-sub">% utilizado</div>
          </div>
          <div style="text-align:right">
            <div class="kpi-sm-label">Saldo por Rendir por UT</div>
            <div class="kpi-sm-val orange">S/ 5,000,000</div>
            <div class="kpi-sm-sub">5 transferencias pendientes</div>
          </div>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Ciclo</th><th>UT</th><th>Rendiciones</th><th>Saldo x Rendir</th><th>Monto (S/)</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in tablaData" :key="row.ut">
              <td><StatusBadge :status="'En proceso'" :label="row.ciclo" /></td>
              <td class="fw">{{ row.ut }}</td>
              <td>
                <div class="pct-cell">
                  <div class="mini-bar"><div class="mini-fill" :style="{ width: row.pct+'%' }" /></div>
                  <span>{{ row.pct }}%</span>
                </div>
              </td>
              <td :class="row.pct < 90 ? 'orange-t' : 'green-t'">{{ row.pct }}%</td>
              <td class="fw">S/ 30,000,000</td>
              <td>
                <div class="actions">
                  <button class="icon-btn" @click="toast.info('Ver', row.ut)"><Eye class="btn-ico2" /></button>
                  <button class="icon-btn" @click="toast.info('Editar', row.ut)"><Pencil class="btn-ico2" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Eye, Pencil } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast.store'
import KpiCard     from '@/components/ui/shared/KpiCard.vue'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'

const router = useRouter()
const toast  = useToastStore()

const uts = [
  { nombre:'UT– Ayacucho', pct:88 },
  { nombre:'UT– Tumbes',   pct:88 },
  { nombre:'UT– Cusco',    pct:72 },
  { nombre:'UT– Piura',    pct:88 },
]
const tablaData = [
  { ciclo:'1ER CICLO', ut:'PIURA',    pct:78 },
  { ciclo:'1ER CICLO', ut:'AYACUCHO', pct:88 },
  { ciclo:'1ER CICLO', ut:'TUMBES',   pct:72 },
]
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.kpi-grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:20px; }
.mb { margin-bottom:20px; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 12px rgba(26,47,110,.08); }
.card-header { padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; }
.card-body { padding:20px; }
.ut-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.ut-card { border:1px solid #d4dae8; border-radius:12px; padding:16px; cursor:pointer; transition:all .2s; }
.ut-card:hover { border-color:#2c4fd4; box-shadow:0 4px 14px rgba(44,79,212,.1); transform:translateY(-2px); }
.ut-name { font-size:15px; font-weight:700; color:#1a2340; }
.ut-atc  { font-size:12px; color:#6b7597; margin-top:2px; }
.ut-pct  { font-size:22px; font-weight:800; margin:8px 0 2px; }
.ut-pct.green  { color:#16a34a; }
.ut-pct.yellow { color:#f59e0b; }
.prog-bar { height:5px; border-radius:99px; background:#e8edf9; overflow:hidden; }
.prog-fill { height:100%; border-radius:99px; transition:width .4s; }
.ut-monto { font-size:12px; color:#6b7597; margin-top:6px; }
.kpi-row { display:flex; justify-content:space-between; align-items:center; width:100%; }
.kpi-sm-label { font-size:10px; font-weight:700; text-transform:uppercase; color:#6b7597; letter-spacing:.5px; margin-bottom:2px; }
.kpi-sm-val { font-size:20px; font-weight:800; color:#1a2340; }
.kpi-sm-val.green  { color:#16a34a; }
.kpi-sm-val.orange { color:#ea580c; }
.kpi-sm-sub { font-size:11px; color:#6b7597; margin-top:1px; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
thead th { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#6b7597; padding:10px 16px; border-bottom:1px solid #d4dae8; background:#fafbfd; text-align:left; }
tbody td { padding:12px 16px; font-size:13.5px; border-bottom:1px solid #f0f2f8; }
tbody tr:last-child td { border-bottom:none; }
tbody tr:hover { background:#f0f4ff; }
td.fw { font-weight:700; }
td.orange-t { color:#ea580c; font-weight:700; }
td.green-t  { color:#16a34a; font-weight:700; }
.pct-cell { display:flex; align-items:center; gap:8px; }
.mini-bar { width:70px; height:5px; border-radius:99px; background:#e8edf9; overflow:hidden; }
.mini-fill { height:100%; border-radius:99px; background:#16a34a; transition:width .4s; }
.actions { display:flex; gap:6px; }
.icon-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:7px; padding:5px; cursor:pointer; display:flex; align-items:center; color:#6b7597; transition:all .15s; }
.icon-btn:hover { background:#e8edf9; color:#2c4fd4; }
.btn-ico2 { width:13px; height:13px; }
</style>
