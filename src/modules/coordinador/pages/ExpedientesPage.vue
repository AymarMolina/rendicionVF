<template>
  <div class="page">
    <template v-if="!selected">
      <div class="page-header">
        <div>
          <h1 class="page-title">Expedientes</h1>
          <p class="page-sub">Revisión y descarga de expedientes por institución</p>
        </div>
      </div>
      <div class="filters">
        <select v-model="filtroUT" class="form-input">
          <option>Todas las UT</option>
          <option>UT-Ayacucho</option>
          <option>UT-Tumbes</option>
          <option>UT-Cusco</option>
          <option>UT-Piura</option>
        </select>
        <select v-model="filtroEstado" class="form-input">
          <option>Todos</option>
          <option>Aprobado</option>
          <option>Pendiente</option>
          <option>Observado</option>
        </select>
      </div>

      <div
        v-for="exp in filtrados"
        :key="exp.id"
        class="exp-card"
        @click="selected = exp.id"
      >
        <div class="exp-info">
          <div class="exp-name">{{ exp.ie }}</div>
          <div class="exp-sub">Aquí los detalles de la rendición de cuentas, en base a la Transferencia {{ exp.transf }}</div>
          <div class="exp-meta">Tesorera: {{ exp.tesorera }} · {{ exp.ut }}</div>
        </div>
        <div class="exp-right">
          <StatusBadge :status="exp.estado" />
          <button class="icon-btn" title="Descargar" @click.stop="toast.success('Descargando', exp.ie)">
            <Download class="btn-ico2" />
          </button>
        </div>
      </div>
    </template>

    <!-- Detalle expediente -->
    <template v-else>
      <div class="back-row">
        <button class="btn secondary btn-sm" @click="selected=null">
          <ArrowLeft class="btn-ico" /> Volver
        </button>
        <span class="detail-title">Expedientes {{ expDetalle?.ie }}</span>
      </div>

      <div class="card mb">
        <div class="card-header">
          <div class="card-title-sm">{{ expDetalle?.ie }}</div>
          <StatusBadge :status="expDetalle?.estado ?? ''" />
        </div>
        <div class="card-body">
          <div class="meta-row">Tesorera: {{ expDetalle?.tesorera }}</div>
          <div v-for="(doc, i) in expDetalle?.docs" :key="i" class="doc-row">
            <div class="doc-icon"><CheckCircle class="doc-ico" /></div>
            <div class="doc-info">
              <div class="doc-name">{{ doc }}</div>
              <div class="doc-state">Archivo adjunto</div>
            </div>
            <button class="icon-btn" @click="toast.info('Visualizando', doc)"><Eye class="btn-ico2" /></button>
            <button class="icon-btn ml6" @click="toast.success('Descargando', doc)"><Download class="btn-ico2" /></button>
          </div>
        </div>
      </div>

      <!-- Verificación comprobantes (Coordinador también co-firma) -->
      <div class="card">
        <div class="card-header"><span class="card-title-sm">Verificación de Comprobantes – Observaciones del ATC (co-autoría)</span></div>
        <div class="card-body">
          <div class="comp-row">
            <div class="comp-icon ok"><CheckCircle class="comp-ico" /></div>
            <div class="comp-info"><div class="comp-name">Boleta 001-0034 — Verduras – Mercado</div><div class="comp-state">Imagen adjunta</div></div>
            <span class="comp-monto">S/ 320</span>
            <StatusBadge status="VALIDO" label="Completado" />
            <button class="btn danger btn-sm ml8" @click="toast.warning('Observación registrada')">Observar</button>
          </div>
          <div class="comp-row">
            <div class="comp-icon ok"><CheckCircle class="comp-ico" /></div>
            <div class="comp-info"><div class="comp-name">Boleta 003-0021 — Gas GLP 10kg</div><div class="comp-state">Imagen adjunta</div></div>
            <span class="comp-monto">S/ 45</span>
            <StatusBadge status="VALIDO" label="Completado" />
            <button class="btn danger btn-sm ml8" @click="toast.warning('Observación registrada')">Observar</button>
          </div>
          <div class="divider" />
          <div class="form-actions">
            <button class="btn primary" @click="toast.success('Firmado', 'Co-autoría firmada y validada exitosamente')">
              <CheckSquare class="btn-ico" /> Firmar como Co-Autor y Validar
            </button>
            <button class="btn secondary" @click="toast.info('Devuelto', 'Expediente devuelto con observaciones')">
              Devolver con devoluciones
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, Download, Eye, CheckCircle, CheckSquare } from 'lucide-vue-next'
import { useExpedienteStore } from '@/stores/expediente.store'
import { useToastStore }      from '@/stores/toast.store'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'

const store   = useExpedienteStore()
const toast   = useToastStore()
const selected    = ref<string | null>(null)
const filtroUT    = ref('Todas las UT')
const filtroEstado = ref('Todos')

const filtrados = computed(() => {
  let list = store.porUT(filtroUT.value)
  if (filtroEstado.value !== 'Todos') list = list.filter(e => e.estado === filtroEstado.value)
  return list
})

const expDetalle = computed(() =>
  selected.value ? store.porId(selected.value) : null
)
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.filters { display:flex; gap:10px; margin-bottom:20px; }
.form-input { padding:8px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13px; outline:none; background:#fff; }
.exp-card { background:#fff; border:1px solid #d4dae8; border-radius:14px; padding:18px 22px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all .2s; }
.exp-card:hover { border-color:#2c4fd4; box-shadow:0 2px 12px rgba(44,79,212,.1); }
.exp-info { flex:1; }
.exp-name { font-size:15px; font-weight:700; color:#1a2340; }
.exp-sub  { font-size:12.5px; color:#6b7597; margin-top:3px; }
.exp-meta { font-size:12px; color:#6b7597; margin-top:3px; }
.exp-right { display:flex; align-items:center; gap:12px; }
.back-row { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
.detail-title { font-size:14px; font-weight:700; color:#1a2340; }
.mb { margin-bottom:20px; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 12px rgba(26,47,110,.08); }
.card-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; }
.card-body { padding:18px 20px; }
.meta-row { font-size:12.5px; color:#6b7597; margin-bottom:14px; }
.doc-row { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid #f0f2f8; }
.doc-row:last-child { border-bottom:none; }
.doc-icon { width:32px; height:32px; border-radius:8px; background:#dcfce7; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.doc-ico { width:15px; height:15px; color:#16a34a; }
.doc-info { flex:1; }
.doc-name  { font-size:13.5px; font-weight:600; color:#1a2340; }
.doc-state { font-size:11.5px; color:#6b7597; margin-top:1px; }
.icon-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:7px; padding:5px; cursor:pointer; display:flex; align-items:center; color:#6b7597; transition:all .15s; }
.icon-btn:hover { background:#e8edf9; color:#2c4fd4; }
.btn-ico2 { width:13px; height:13px; }
.ml6 { margin-left:6px; }
.comp-row { display:flex; align-items:center; gap:10px; padding:12px 14px; border:1px solid #d4dae8; border-radius:8px; margin-bottom:8px; }
.comp-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.comp-icon.ok { background:#dcfce7; }
.comp-ico { width:14px; height:14px; color:#16a34a; }
.comp-info { flex:1; }
.comp-name  { font-size:13.5px; font-weight:600; color:#1a2340; }
.comp-state { font-size:11.5px; color:#6b7597; }
.comp-monto { font-weight:700; font-size:13.5px; }
.ml8 { margin-left:8px; }
.divider { height:1px; background:#d4dae8; margin:16px 0; }
.form-actions { display:flex; gap:10px; }
.btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn-sm { padding:5px 11px; font-size:12px; }
.btn.primary   { background:#1a2f6e; color:#fff; }
.btn.primary:hover { background:#2c4fd4; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
.btn.danger { background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; }
.btn.danger:hover { background:#dc2626; color:#fff; }
.btn-ico { width:14px; height:14px; }
</style>
