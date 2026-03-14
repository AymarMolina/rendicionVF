<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Validación & Co-Autoría</h1>
        <p class="page-sub">Período: Junio 2025 · {{ store.instituciones.length }} instituciones educativas</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-section-title">Co-autoría Conciliación — Anexo 2</div>
          <div class="card-meta">IE N° 20124 · Tesorera: María Torres</div>
        </div>
      </div>
      <div class="card-body">
        <div class="kpi-grid">
          <KpiCard label="Transferencia Recibida"    value="S/ 4,280.00" />
          <KpiCard label="Total Gastos Registrados"  value="S/ 3,610.50" />
          <KpiCard label="Saldo Declarado Tesorera"  value="S/ 669.50"   color="orange" />
        </div>

        <div class="section-title">Verificación de comprobantes</div>

        <div v-for="(comp, i) in comprobantes" :key="i" class="comp-row">
          <div class="comp-icon" :class="comp.ok ? 'ok' : 'err'">
            <CheckCircle v-if="comp.ok" class="comp-ico" />
            <XCircle v-else class="comp-ico" />
          </div>
          <div class="comp-info">
            <div class="comp-name">{{ comp.nombre }}</div>
            <div class="comp-state" :class="comp.ok ? '' : 'red-txt'">{{ comp.estado }}</div>
          </div>
          <span class="comp-monto">{{ comp.monto }}</span>
          <StatusBadge :status="comp.ok ? 'VALIDO' : 'Pendiente'" :label="comp.ok ? 'Completado' : 'Pendiente'" />
          <button class="btn danger btn-sm ml8" @click="observar(comp.nombre)">Observar</button>
        </div>

        <div class="divider" />
        <div class="form-group">
          <label class="form-label">Observaciones del ATC (co-autoría)</label>
          <textarea v-model="observaciones" class="form-textarea" rows="4" placeholder="Registra hallazgos, recomendaciones o validaciones..." />
        </div>

        <div class="form-actions">
          <button class="btn primary" @click="firmar">
            <CheckSquare class="btn-ico" /> Firmar como Co-Autor y Validar
          </button>
          <button class="btn secondary" @click="devolver">
            Devolver con observaciones
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CheckCircle, XCircle, CheckSquare } from 'lucide-vue-next'
import { useInstitucionStore } from '@/stores/institucion.store'
import { useToastStore }       from '@/stores/toast.store'
import KpiCard     from '@/components/ui/shared/KpiCard.vue'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'

const store = useInstitucionStore()
const toast = useToastStore()

const observaciones = ref('')

const comprobantes = ref([
  { nombre:'Boleta 001-0034 — Verduras – Mercado', estado:'Imagen adjunta',               monto:'S/ 320', ok:true  },
  { nombre:'Boleta 003-0021 — Gas GLP 10kg',        estado:'Imagen adjunta',               monto:'S/ 45',  ok:true  },
  { nombre:'Recibo 01 — Transporte mercado',         estado:'Sin imagen — requiere subsanación', monto:'S/ 30',  ok:false },
])

function observar(nombre: string) {
  toast.warning('Observación registrada', nombre)
}
function firmar() {
  toast.success('Co-autoría firmada', 'El Anexo 2 fue validado exitosamente')
}
function devolver() {
  toast.info('Devuelto', 'La rendición fue devuelta con observaciones')
}
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 12px rgba(26,47,110,.08); }
.card-header { padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-section-title { font-size:15px; font-weight:700; color:#2c4fd4; }
.card-meta { font-size:12.5px; color:#6b7597; margin-top:2px; }
.card-body { padding:20px; }
.kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:20px; }
.section-title { font-size:13px; font-weight:700; color:#1a2340; margin-bottom:12px; }
.comp-row { display:flex; align-items:center; gap:10px; padding:12px 14px; border:1px solid #d4dae8; border-radius:8px; margin-bottom:8px; transition:all .15s; }
.comp-row:hover { border-color:#2c4fd4; background:#f0f4ff; }
.comp-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.comp-icon.ok  { background:#dcfce7; }
.comp-icon.err { background:#fee2e2; }
.comp-ico { width:15px; height:15px; }
.comp-icon.ok .comp-ico  { color:#16a34a; }
.comp-icon.err .comp-ico { color:#dc2626; }
.comp-info { flex:1; }
.comp-name  { font-size:13.5px; font-weight:600; color:#1a2340; }
.comp-state { font-size:11.5px; color:#6b7597; margin-top:2px; }
.comp-state.red-txt { color:#dc2626; }
.comp-monto { font-weight:700; margin-right:8px; font-size:13.5px; }
.ml8 { margin-left:8px; }
.divider { height:1px; background:#d4dae8; margin:20px 0; }
.form-group { margin-bottom:16px; }
.form-label { display:block; font-size:12.5px; font-weight:700; color:#1a2340; margin-bottom:6px; }
.form-textarea { width:100%; padding:10px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13.5px; outline:none; resize:vertical; min-height:80px; }
.form-textarea:focus { border-color:#2c4fd4; }
.form-actions { display:flex; gap:10px; }
.btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn-sm { padding:5px 11px; font-size:12px; }
.btn.primary { background:#1a2f6e; color:#fff; }
.btn.primary:hover { background:#2c4fd4; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
.btn.danger { background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; }
.btn.danger:hover { background:#dc2626; color:#fff; }
.btn-ico { width:15px; height:15px; }
</style>
