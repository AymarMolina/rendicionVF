<template>
  <div class="page">
    <h1 class="page-title">Rendición de Cuentas</h1>
    <p class="page-sub">Conciliación financiera por transferencia</p>

    <!-- Lista de rendiciones -->
    <div v-if="!detalleActivo">
      <div
        v-for="t in store.transferencias"
        :key="t.id"
        class="rendicion-card"
        @click="abrirRendicion(t.id)"
      >
        <div class="rc-left">
          <div class="rc-title">Rendición de cuenta – Transferencia {{ t.codigo }}</div>
          <div class="rc-sub">Aquí los detalles de la rendición de cuentas, en base a la Transferencia {{ t.codigo }}</div>
        </div>
        <div class="rc-right">
          <div>
            <div class="rc-saldo-label">Saldo Restante</div>
            <div class="rc-saldo" :class="t.saldo > 0 ? 'orange' : 'green'">{{ fmt(t.saldo) }}</div>
          </div>
          <StatusBadge :status="t.estado" />
          <button class="icon-btn"><Eye class="btn-ico" /></button>
        </div>
      </div>
    </div>

    <!-- Detalle de rendición -->
    <div v-else>
      <div class="back-row">
        <button class="btn secondary btn-sm" @click="detalleActivo=null">
          <ArrowLeft class="btn-ico" /> Volver
        </button>
        <span class="detail-title">Rendición – Transferencia {{ detalleTransf?.codigo }}</span>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card left-gray">
          <div class="kpi-label">Saldo arrastrado período anterior</div>
          <div class="kpi-val">{{ fmt(0) }}</div>
          <div class="divider-sm" />
          <div class="kpi-sub-row">
            <span>Dinero en efectivo</span>
            <input
              v-model.number="efectivo"
              type="number"
              class="mini-input"
              placeholder="0.00"
              @input="calcSaldo"
            />
          </div>
        </div>
        <div class="kpi-card left-green">
          <div class="kpi-label">(+) Transferencia recibida</div>
          <div class="kpi-val green">{{ fmt(detalleTransf?.monto ?? 0) }}</div>
        </div>
        <div class="kpi-card left-blue">
          <div class="kpi-label">(–) Total gastos registrados</div>
          <div class="kpi-val">{{ fmt(totalGastos) }}</div>
          <div class="divider-sm" />
          <div class="kpi-sub-row">
            <span>Saldo final calculado</span>
            <strong>{{ fmt(saldoFinal) }}</strong>
          </div>
        </div>
      </div>

      <!-- Estado de cuenta -->
      <div class="card mb">
        <div class="card-header">
          <div>
            <div class="card-title-sm">Estado de Cuenta / Pantallazo Bancario</div>
          </div>
          <span style="font-size:12px;color:#6b7597">Debe coincidir con el saldo calculado</span>
        </div>
        <div class="card-body">
          <div class="upload-zone" @click="estadoInput?.click()">
            <ImageIcon class="upload-ico" />
            <div class="upload-text">
              <strong>Subir estado de cuenta o pantallazo</strong><br/>
              PNG, JPG o PDF – desde app, cajero o ventanilla BN
            </div>
            <input ref="estadoInput" type="file" accept="image/*,.pdf" style="display:none" @change="onEstadoChange" />
          </div>
          <div v-if="estadoFile" class="file-ok">
            <CheckCircle class="file-ico" /> Estado de cuenta adjunto: <strong>{{ estadoFile }}</strong>
          </div>
        </div>
      </div>

      <!-- Observaciones -->
      <div class="card mb">
        <div class="card-header"><div class="card-title-sm">Observaciones / Justificación de diferencia</div></div>
        <div class="card-body">
          <textarea v-model="observaciones" class="form-textarea" rows="4" placeholder="Detallar cualquier diferencia encontrada entre el saldo calculado y el estado de cuenta..." />
        </div>
      </div>

      <div class="form-actions">
        <button class="btn secondary" @click="guardar">
          <Save class="btn-ico" /> Guardar Rendición
        </button>
        <button class="btn primary" @click="enviar">
          <Send class="btn-ico" /> Enviar al ATC
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Eye, ArrowLeft, ImageIcon, CheckCircle, Save, Send } from 'lucide-vue-next'
import { useTransferenciaStore } from '@/stores/transferencia.store'
import { useToastStore }         from '@/stores/toast.store'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'

const store = useTransferenciaStore()
const toast = useToastStore()

const detalleActivo = ref<string | null>(null)
const efectivo      = ref(0)
const observaciones = ref('')
const estadoFile    = ref('')
const estadoInput   = ref<HTMLInputElement>()

const detalleTransf = computed(() =>
  detalleActivo.value ? store.porId(detalleActivo.value) : null
)
const totalGastos = computed(() =>
  detalleActivo.value
    ? store.gastosPorTransferencia(detalleActivo.value).reduce((s, g) => s + g.monto, 0)
    : 0
)
const saldoFinal = computed(() =>
  (detalleTransf.value?.monto ?? 0) - totalGastos.value
)

function fmt(n: number) {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits:2, maximumFractionDigits:2 })
}
function abrirRendicion(id: string) { detalleActivo.value = id }
function calcSaldo() {}
function onEstadoChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) estadoFile.value = f.name
}
function guardar() { toast.info('Rendición guardada', 'Guardada como borrador') }
function enviar()  { toast.success('Rendición enviada', 'Enviada al ATC correctamente') }
</script>

<style scoped>
.page { width:100%; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0 0 4px; }
.page-sub { font-size:13px; color:#6b7597; margin-bottom:24px; }
.rendicion-card {
  background:#fff; border:1px solid #d4dae8; border-radius:14px;
  padding:18px 22px; margin-bottom:12px;
  display:flex; align-items:center; justify-content:space-between;
  cursor:pointer; transition:all .2s;
}
.rendicion-card:hover { border-color:#2c4fd4; box-shadow:0 2px 12px rgba(44,79,212,.1); }
.rc-left { flex:1; }
.rc-title { font-size:15px; font-weight:700; color:#1a2340; }
.rc-sub { font-size:12.5px; color:#6b7597; margin-top:3px; }
.rc-right { display:flex; align-items:center; gap:14px; }
.rc-saldo-label { font-size:11px; font-weight:700; text-transform:uppercase; color:#6b7597; text-align:right; }
.rc-saldo { font-size:16px; font-weight:800; }
.rc-saldo.green  { color:#16a34a; }
.rc-saldo.orange { color:#ea580c; }
.icon-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:7px; padding:6px; cursor:pointer; display:flex; align-items:center; color:#6b7597; }
.btn-ico { width:15px; height:15px; }
/* Detalle */
.back-row { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
.detail-title { font-size:14px; font-weight:700; color:#1a2340; }
.kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:20px; }
.kpi-card { background:#fff; border:1px solid #d4dae8; border-radius:14px; padding:18px 20px; }
.kpi-card.left-gray  { border-left:3px solid #d4dae8; }
.kpi-card.left-green { border-left:3px solid #16a34a; }
.kpi-card.left-blue  { border-left:3px solid #2c4fd4; }
.kpi-label { font-size:11px; font-weight:700; text-transform:uppercase; color:#6b7597; margin-bottom:6px; }
.kpi-val { font-size:24px; font-weight:800; color:#1a2340; }
.kpi-val.green { color:#16a34a; }
.divider-sm { height:1px; background:#d4dae8; margin:12px 0; }
.kpi-sub-row { display:flex; align-items:center; justify-content:space-between; font-size:12.5px; color:#6b7597; }
.mini-input { width:100px; padding:5px 8px; border:1.5px solid #d4dae8; border-radius:6px; font-size:13px; outline:none; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; }
.mb { margin-bottom:20px; }
.card-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; }
.card-body { padding:20px; }
.upload-zone { border:2px dashed #d4dae8; border-radius:10px; padding:24px; text-align:center; cursor:pointer; transition:all .2s; }
.upload-zone:hover { border-color:#2c4fd4; background:#f0f4ff; }
.upload-ico { width:28px; height:28px; color:#6b7597; margin:0 auto 8px; }
.upload-text { font-size:13px; color:#6b7597; }
.upload-text strong { color:#2c4fd4; }
.file-ok { margin-top:10px; font-size:13px; color:#16a34a; font-weight:600; display:flex; align-items:center; gap:6px; }
.file-ico { width:16px; height:16px; }
.form-textarea { width:100%; padding:10px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13.5px; outline:none; resize:vertical; min-height:80px; }
.form-textarea:focus { border-color:#2c4fd4; }
.form-actions { display:flex; gap:10px; }
.btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn-sm { padding:6px 12px; font-size:12.5px; }
.btn.primary { background:#1a2f6e; color:#fff; }
.btn.primary:hover { background:#2c4fd4; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
</style>
