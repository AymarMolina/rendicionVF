<template>
  <div class="page">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Transferencias</h1>
        <p class="page-sub">Historial de subvenciones económicas recibidas</p>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <KpiCard label="Monto Total Recibido"  :value="fmt(store.totalRecibido)"    sub="Período 2026" />
      <KpiCard label="Total Sustentado"      :value="fmt(store.totalSustentado)"  color="green" :sub="`${pctSustentado}% utilizado`" />
      <KpiCard label="Saldo Por Rendir"      :value="fmt(store.totalSaldo)"       color="orange" :sub="`${pendientes} transferencias pendientes`" />
    </div>

    <!-- Transferencia activa destacada -->
    <div class="card activa-card">
      <div class="card-header">
        <div>
          <span class="card-title-sm">Transferencia más reciente — {{ activa?.codigo }}</span>
          <div class="card-meta">Fecha límite rendición: {{ activa?.fechaRendir }}</div>
        </div>
        <StatusBadge :status="activa?.estado ?? ''" />
      </div>
      <div class="rubros-grid" v-if="activa">
        <div v-for="(val, key) in activa.rubros" :key="key" class="rubro-item">
          <div class="rubro-label">{{ capitalize(key) }}</div>
          <div class="rubro-val">{{ fmt(val) }}</div>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card">
      <div class="card-header">
        <span class="card-title-sm">Todas las Transferencias</span>
        <div class="toolbar-right">
          <div class="search-wrap">
            <Search class="search-ico" />
            <input v-model="q" class="search-input" placeholder="Buscar transferencia..." />
          </div>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Fecha Transf.</th><th>Fecha a Rendir</th>
              <th>Monto (S/)</th><th>Sustentado (S/)</th><th>Saldo (S/)</th>
              <th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filtered" :key="t.id">
              <td class="mono">{{ t.codigo }}</td>
              <td>{{ t.fechaTransf }}</td>
              <td>{{ t.fechaRendir }}</td>
              <td class="fw">{{ fmt(t.monto) }}</td>
              <td>{{ fmt(t.sustentado) }}</td>
              <td :class="t.saldo > 0 ? 'orange' : 'green-t'">{{ fmt(t.saldo) }}</td>
              <td><StatusBadge :status="t.estado" /></td>
              <td>
                <div class="actions">
                  <button class="icon-btn" title="Ver rubros" @click="abrirRubros(t)">
                    <Eye class="btn-ico" />
                  </button>
                  <button class="icon-btn" title="Registrar gastos" @click="irGastos(t.id)">
                    <Pencil class="btn-ico" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="8" class="empty">Sin transferencias encontradas</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Rubros -->
    <BaseModal :open="showModal" @close="showModal = false">
      <div class="modal-inner">
        <div class="modal-hd">
          <div>
            <div class="modal-title">{{ modalTransf?.codigo }} — Rubros Asignados</div>
          </div>
          <button class="modal-close" @click="showModal=false"><X /></button>
        </div>
        <div class="modal-body" v-if="modalTransf">
          <table>
            <thead><tr><th>Rubro</th><th>Monto Asignado</th><th>Rendido</th></tr></thead>
            <tbody>
              <tr v-for="(val, key) in modalTransf.rubros" :key="key">
                <td style="text-transform:capitalize;font-weight:600">{{ key }}</td>
                <td>{{ fmt(val) }}</td>
                <td style="color:#16a34a">{{ fmt(val * 0.85) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Eye, Pencil, X } from 'lucide-vue-next'
import { useTransferenciaStore } from '@/stores/transferencia.store'
import type { Transferencia } from '@/types/rendicion'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'
import KpiCard     from '@/components/ui/shared/KpiCard.vue'
import BaseModal   from '@/components/ui/overlay/BaseModal.vue'

const store  = useTransferenciaStore()
const router = useRouter()

const q           = ref('')
const showModal   = ref(false)
const modalTransf = ref<Transferencia | null>(null)

const activa    = computed(() => store.activa)
const pendientes = computed(() => store.transferencias.filter(t => t.saldo > 0).length)
const pctSustentado = computed(() =>
  store.totalRecibido > 0 ? Math.round((store.totalSustentado / store.totalRecibido) * 100) : 0
)
const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return store.transferencias
  return store.transferencias.filter(t =>
    t.codigo.toLowerCase().includes(term) || t.estado.toLowerCase().includes(term)
  )
})

function fmt(n: number) {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
function abrirRubros(t: Transferencia) { modalTransf.value = t; showModal.value = true }
function irGastos(id: string) { router.push({ name: 'gastos', query: { transf: id } }) }
</script>

<style scoped>
.page { width: 100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:20px; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 12px rgba(26,47,110,.08); margin-bottom:20px; }
.activa-card { border-left:4px solid #2c4fd4; }
.card-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; color:#1a2340; }
.card-meta { font-size:12px; color:#6b7597; margin-top:2px; }
.rubros-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; padding:16px 20px; }
.rubro-label { font-size:10px; font-weight:700; text-transform:uppercase; color:#6b7597; margin-bottom:4px; }
.rubro-val { font-size:14px; font-weight:700; color:#1a2340; }
.toolbar-right { display:flex; gap:10px; }
.search-wrap { position:relative; }
.search-ico { position:absolute; left:10px; top:50%; transform:translateY(-50%); width:14px; height:14px; color:#6b7597; }
.search-input { padding:8px 12px 8px 32px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13px; outline:none; width:260px; }
.search-input:focus { border-color:#2c4fd4; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
thead th { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#6b7597; padding:10px 16px; text-align:left; border-bottom:1px solid #d4dae8; background:#fafbfd; }
tbody tr { border-bottom:1px solid #f0f2f8; transition:background .12s; }
tbody tr:last-child { border-bottom:none; }
tbody tr:hover { background:#f0f4ff; }
tbody td { padding:12px 16px; font-size:13.5px; color:#1a2340; }
td.mono { font-weight:700; color:#2c4fd4; font-size:12.5px; }
td.fw { font-weight:700; }
td.orange { color:#ea580c; font-weight:700; }
td.green-t { color:#16a34a; font-weight:700; }
td.empty { text-align:center; color:#6b7597; padding:24px; }
.actions { display:flex; gap:6px; }
.icon-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:7px; padding:6px; cursor:pointer; display:flex; align-items:center; color:#6b7597; transition:all .15s; }
.icon-btn:hover { background:#e8edf9; color:#2c4fd4; border-color:#2c4fd4; }
.btn-ico { width:14px; height:14px; }
/* Modal */
.modal-inner { padding:4px; }
.modal-hd { display:flex; align-items:center; justify-content:space-between; padding-bottom:14px; border-bottom:1px solid #d4dae8; margin-bottom:16px; }
.modal-title { font-size:16px; font-weight:700; color:#1a2340; }
.modal-close { background:none; border:none; cursor:pointer; color:#6b7597; padding:4px; }
.modal-body table { width:100%; border-collapse:collapse; }
.modal-body th { font-size:11px; font-weight:700; text-transform:uppercase; color:#6b7597; padding:8px 12px; border-bottom:1px solid #d4dae8; }
.modal-body td { padding:10px 12px; font-size:13.5px; border-bottom:1px solid #f0f2f8; }
</style>
