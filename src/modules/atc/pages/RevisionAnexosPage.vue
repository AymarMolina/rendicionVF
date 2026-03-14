<template>
  <div class="page">
    <template v-if="!detalleIE">
      <div class="page-header">
        <div>
          <h1 class="page-title">Revisión Anexos</h1>
          <p class="page-sub">Período: Junio 2025 · {{ store.instituciones.length }} instituciones educativas</p>
        </div>
      </div>

      <div v-for="ie in expedientesData" :key="ie.id" class="card mb">
        <div class="card-body">
          <div class="exp-header">
            <div>
              <div class="exp-name">{{ ie.nombre }}</div>
              <div class="exp-meta">Tesorera: {{ ie.tesorera }} · Enviado el {{ ie.fecha }}</div>
              <div class="chips-row">
                <span v-for="(doc, i) in ie.docs" :key="i" class="chip" :class="doc.ok ? 'done' : 'miss'">
                  <CheckCircle v-if="doc.ok" class="chip-ico" />
                  {{ doc.label }}
                </span>
              </div>
            </div>
            <StatusBadge :status="ie.estado" />
          </div>
          <div class="exp-footer">
            <div class="progress-row">
              <ProgressBar :value="ie.progreso" />
              <span class="pct-label">{{ ie.progreso }}%</span>
            </div>
            <div class="exp-actions">
              <button class="btn secondary btn-sm" @click="abrirDetalle(ie.id)">Revisar</button>
              <button v-if="ie.estado === 'LISTO'" class="btn primary btn-sm" @click="aprobar(ie.nombre)">
                Aprobar y enviar a Coord.
              </button>
              <button v-else class="btn warning btn-sm" @click="observarIE(ie.nombre)">Observar</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Detalle de un expediente -->
    <template v-else>
      <div class="back-row">
        <button class="btn secondary btn-sm" @click="detalleIE=null">
          <ArrowLeft class="btn-ico" /> Volver
        </button>
        <span class="detail-title">{{ ieDetalleData?.nombre }} – Detalle de Anexos</span>
      </div>
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title-sm">IIEE N° {{ detalleIE }}</div>
            <div class="card-meta">Tesorera: {{ ieDetalleData?.tesorera }} · Enviado el 08/06/2025</div>
          </div>
          <StatusBadge :status="ieDetalleData?.estado ?? ''" />
        </div>
        <div class="card-body">
          <div v-for="(doc, i) in ieDetalleData?.docs" :key="i" class="comp-row">
            <div class="comp-icon ok">
              <CheckCircle v-if="doc.ok" class="comp-ico" style="color:#16a34a" />
              <AlertCircle v-else class="comp-ico" style="color:#dc2626" />
            </div>
            <div class="comp-info">
              <div class="comp-name">{{ doc.label }}</div>
              <div class="comp-state">{{ doc.ok ? 'Archivo adjunto' : 'Pendiente' }}</div>
            </div>
            <template v-if="doc.ok">
              <button class="icon-btn" @click="toast.info('Visualizando', doc.label)"><Eye class="btn-ico2" /></button>
              <button class="icon-btn ml6" @click="toast.success('Descargando', doc.label)"><Download class="btn-ico2" /></button>
            </template>
            <StatusBadge v-else status="Pendiente" />
          </div>
          <div class="divider" />
          <div class="form-group">
            <label class="form-label">Observaciones / Hallazgos</label>
            <textarea class="form-textarea" rows="3" placeholder="Registra hallazgos, recomendaciones o validaciones..." />
          </div>
          <div class="form-actions">
            <button class="btn secondary" @click="toast.info('Observación enviada al tesorero')">Mandar Observación</button>
            <button class="btn primary" @click="aprobar(ieDetalleData?.nombre ?? '')">Aprobar y enviar a Coord.</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, CheckCircle, AlertCircle, Eye, Download } from 'lucide-vue-next'
import { useInstitucionStore } from '@/stores/institucion.store'
import { useToastStore }       from '@/stores/toast.store'
import StatusBadge  from '@/components/ui/shared/StatusBadge.vue'
import ProgressBar  from '@/components/ui/shared/ProgressBar.vue'

const store = useInstitucionStore()
const toast = useToastStore()
const detalleIE = ref<string | null>(null)

const docLabels = ['Anexo 1','Anexo 2','Anexo 3','DJ','Movilidad','Acta de Asamblea']

const expedientesData = computed(() =>
  store.instituciones.map(ie => ({
    id: ie.id,
    nombre: ie.nombre,
    tesorera: ie.tesorera,
    fecha: '08/06/2025',
    progreso: ie.progreso,
    estado: ie.progreso >= 100 ? 'LISTO' : 'OBSERVADO',
    docs: docLabels.map((label, i) => ({ label, ok: ie.progreso > i * 17 })),
  }))
)

const ieDetalleData = computed(() =>
  expedientesData.value.find(e => e.id === detalleIE.value) ?? null
)

function abrirDetalle(id: string)    { detalleIE.value = id }
function aprobar(nombre: string)     { toast.success('Aprobado', nombre + ' enviado al Coordinador') }
function observarIE(nombre: string)  { toast.warning('Observado', 'Observación registrada para '+nombre) }
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.mb { margin-bottom:16px; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 12px rgba(26,47,110,.08); }
.card-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; }
.card-meta { font-size:12px; color:#6b7597; margin-top:2px; }
.card-body { padding:18px 20px; }
.exp-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
.exp-name { font-size:15px; font-weight:700; color:#1a2340; }
.exp-meta { font-size:12px; color:#6b7597; margin:3px 0 8px; }
.chips-row { display:flex; gap:6px; flex-wrap:wrap; }
.chip { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:6px; font-size:11.5px; font-weight:700; }
.chip.done { background:#dcfce7; color:#16a34a; }
.chip.miss { background:#f1f3f8; color:#6b7597; }
.chip-ico { width:11px; height:11px; }
.exp-footer { display:flex; align-items:center; gap:12px; }
.progress-row { flex:1; display:flex; align-items:center; gap:8px; }
.pct-label { font-size:11.5px; font-weight:700; color:#6b7597; min-width:32px; }
.exp-actions { display:flex; gap:8px; }
.back-row { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
.detail-title { font-size:14px; font-weight:700; color:#1a2340; }
.comp-row { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid #f0f2f8; }
.comp-row:last-child { border-bottom:none; }
.comp-icon { width:30px; height:30px; border-radius:7px; background:#dcfce7; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.comp-ico { width:14px; height:14px; }
.comp-info { flex:1; }
.comp-name  { font-size:13.5px; font-weight:600; color:#1a2340; }
.comp-state { font-size:11.5px; color:#6b7597; margin-top:1px; }
.icon-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:7px; padding:5px; cursor:pointer; display:flex; align-items:center; color:#6b7597; transition:all .15s; }
.icon-btn:hover { background:#e8edf9; color:#2c4fd4; }
.btn-ico2 { width:13px; height:13px; }
.ml6 { margin-left:6px; }
.divider { height:1px; background:#d4dae8; margin:16px 0; }
.form-group { margin-bottom:14px; }
.form-label { display:block; font-size:12.5px; font-weight:700; color:#1a2340; margin-bottom:5px; }
.form-textarea { width:100%; padding:9px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13.5px; outline:none; resize:vertical; }
.form-textarea:focus { border-color:#2c4fd4; }
.form-actions { display:flex; gap:8px; }
.btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn-sm { padding:5px 11px; font-size:12px; }
.btn.primary   { background:#1a2f6e; color:#fff; }
.btn.primary:hover { background:#2c4fd4; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
.btn.warning   { background:#fef3c7; color:#b45309; border:1px solid #fcd34d; }
.btn.warning:hover { background:#f59e0b; color:#fff; }
.btn-ico { width:14px; height:14px; }
</style>
