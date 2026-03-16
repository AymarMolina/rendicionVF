<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Transferencias</h1>
        <p class="page-sub">Historial de subvenciones económicas recibidas</p>
      </div>
    </div>

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

    <div class="card activa-card" v-if="store.activa">
      <div class="card-header">
        <div>
          <span class="card-title-sm">Transferencia más reciente — {{ store.activa.codigo }}</span>
          <div class="card-meta">{{ store.activa.ciclo }} · {{ store.activa.institucion }}</div>
        </div>
        <StatusBadge :status="store.activa.estado" />
      </div>
      <div class="rubros-grid">
        <div v-for="(val, key) in store.activa.rubros" :key="key" class="rubro-item">
          <div class="rubro-label">{{ capitalize(String(key)) }}</div>
          <div class="rubro-val">{{ fmt(val as number) }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title-sm">Todas las Transferencias</span>
        <div class="toolbar-right">
          <div class="search-wrap">
            <Search class="search-ico" />
            <input v-model="q" class="search-input" placeholder="Buscar por código o estado..." />
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
              <th>Código</th>
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
            <tr v-for="t in filtered" :key="t.id">
              <td class="mono">{{ t.codigo }}</td>
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

    <BaseModal :open="showModal" @close="showModal = false">
      <div class="modal-inner">
        <div class="modal-hd">
          <div class="modal-title">{{ modalTransf?.codigo }} — Presupuesto por Rubro</div>
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
                    <div
                      class="prog-fill"
                      :style="{
                        width: Math.min((r.total_gastado / r.presupuesto_rubro) * 100, 100) + '%',
                        background: r.saldo_rubro < 0 ? '#dc2626' : r.saldo_rubro < r.presupuesto_rubro * 0.1 ? '#f59e0b' : '#16a34a'
                      }"
                    />
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Eye, X, FileText, ClipboardCheck } from 'lucide-vue-next'
import { useTransferenciasStore } from '@/stores/transferencias.store'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'
import BaseModal   from '@/components/ui/overlay/BaseModal.vue'

const store  = useTransferenciasStore()
const router = useRouter()

const q             = ref('')
const showModal     = ref(false)
const modalTransf   = ref<any>(null)
const rubrosDetalle = ref<any[]>([])
const loadingRubros = ref(false)

onMounted(() => store.cargar())

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return store.transferencias
  return store.transferencias.filter(t =>
    t.codigo.toLowerCase().includes(term) ||
    t.estado.toLowerCase().includes(term) ||
    (t.ciclo ?? '').toLowerCase().includes(term)
  )
})

function fmt(n: number) {
  return 'S/ ' + (n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

async function abrirRubros(t: any) {
  modalTransf.value   = t
  rubrosDetalle.value = []
  showModal.value     = true
  loadingRubros.value = true
  try {
    rubrosDetalle.value = await store.getRubros(t.id)
  } finally {
    loadingRubros.value = false
  }
}

function irGastos(id: any) {
  router.push({ name: 'gastos', query: { transf: id } })
}

function irRendicion(id: any) {
  router.push({ name: 'rendicion', query: { transf: id } })
}
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
.loading-row { display:flex; align-items:center; gap:10px; padding:32px; justify-content:center; color:#6b7597; font-size:13.5px; }
.spinner-lg { width:20px; height:20px; border:3px solid #d4dae8; border-top-color:#2c4fd4; border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
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
.modal-inner { }
.modal-hd { display:flex; align-items:center; justify-content:space-between; padding-bottom:14px; border-bottom:1px solid #d4dae8; margin-bottom:16px; }
.modal-title { font-size:16px; font-weight:700; color:#1a2340; }
.modal-close { background:none; border:none; cursor:pointer; color:#6b7597; padding:4px; }
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
</style>