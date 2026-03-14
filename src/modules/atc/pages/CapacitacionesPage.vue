<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Capacitaciones</h1>
        <p class="page-sub">Período: Junio 2025 · {{ store.instituciones.length }} instituciones educativas</p>
      </div>
    </div>

    <!-- Formulario -->
    <div class="card mb">
      <div class="card-header"><span class="card-title-sm">Registrar Sesión de Capacitación</span></div>
      <div class="card-body">
        <div class="form-row r2 mb14">
          <div class="form-group">
            <label class="form-label required">Tema / Título</label>
            <input v-model="form.tema" class="form-input" placeholder="Ej: Rendición de cuentas – ciclo julio" />
          </div>
          <div class="form-group">
            <label class="form-label required">Fecha de ejecución</label>
            <input v-model="form.fecha" type="date" class="form-input" />
          </div>
        </div>
        <div class="form-row r2 mb14">
          <div class="form-group">
            <label class="form-label">IEEs participantes</label>
            <input v-model="form.iees" class="form-input" placeholder="Ej: IE 20124, IE 20089..." />
          </div>
          <div class="form-group">
            <label class="form-label">N° de asistentes</label>
            <input v-model.number="form.asistentes" type="number" class="form-input" placeholder="0" />
          </div>
        </div>
        <div class="form-group mb14">
          <label class="form-label">Descripción y temas tratados</label>
          <textarea v-model="form.descripcion" class="form-textarea" rows="3" placeholder="Detalle los temas abordados..." />
        </div>
        <div class="upload-zone" @click="fileInput?.click()">
          <Upload class="upload-ico" />
          <div class="upload-text"><strong>Adjuntar lista de asistencia / evidencias fotográficas</strong></div>
          <input ref="fileInput" type="file" multiple accept="image/*,.pdf" style="display:none" />
        </div>
        <button class="btn primary mt14" @click="registrar">
          <Plus class="btn-ico" /> Registrar Capacitación
        </button>
      </div>
    </div>

    <!-- Historial -->
    <div class="card">
      <div class="card-header"><span class="card-title-sm">Historial de Capacitaciones</span></div>
      <div class="hist-list">
        <div v-for="cap in store.capacitaciones" :key="cap.id" class="hist-row">
          <div class="hist-dot" :class="dotClass(cap.estado)" />
          <div class="hist-info">
            <div class="hist-tema">{{ cap.tema }}</div>
            <div class="hist-meta">{{ cap.iees }}</div>
          </div>
          <span class="hist-fecha">{{ cap.fecha }}</span>
          <StatusBadge :status="cap.estado" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Upload } from 'lucide-vue-next'
import { useInstitucionStore } from '@/stores/institucion.store'
import { useToastStore }       from '@/stores/toast.store'
import type { EstadoCapacitacion } from '@/types/rendicion'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'

const store    = useInstitucionStore()
const toast    = useToastStore()
const fileInput = ref<HTMLInputElement>()

const form = reactive({
  tema:'', fecha:'', iees:'', asistentes:0, descripcion:''
})

onMounted(() => { form.fecha = new Date().toISOString().split('T')[0] })

function registrar() {
  if (!form.tema) { toast.warning('Campo requerido', 'Ingrese el tema de la capacitación'); return }
  store.agregarCapacitacion({
    tema: form.tema,
    fecha: new Date().toLocaleDateString('es-PE'),
    iees: form.iees || 'IEEs seleccionadas',
    asistentes: form.asistentes,
    descripcion: form.descripcion,
    estado: 'Borrador' as EstadoCapacitacion,
  })
  form.tema = ''
  form.iees = ''
  form.asistentes = 0
  form.descripcion = ''
  toast.success('Capacitación registrada', 'Guardada como borrador')
}

function dotClass(estado: string) {
  if (estado === 'Realizada')  return 'green'
  if (estado === 'Programada') return 'blue'
  return 'yellow'
}
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.mb { margin-bottom:20px; }
.mb14 { margin-bottom:14px; }
.mt14 { margin-top:14px; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 12px rgba(26,47,110,.08); }
.card-header { padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; color:#1a2340; }
.card-body { padding:20px; }
.form-row { display:grid; gap:16px; }
.r2 { grid-template-columns:1fr 1fr; }
.form-group { display:flex; flex-direction:column; gap:5px; }
.form-label { font-size:12.5px; font-weight:700; color:#1a2340; }
.form-label.required::after { content:' *'; color:#dc2626; }
.form-input { padding:9px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13.5px; outline:none; background:#fafbfd; transition:border-color .15s; }
.form-input:focus { border-color:#2c4fd4; background:#fff; }
.form-textarea { width:100%; padding:9px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13.5px; outline:none; resize:vertical; }
.form-textarea:focus { border-color:#2c4fd4; }
.upload-zone { border:2px dashed #d4dae8; border-radius:10px; padding:18px; text-align:center; cursor:pointer; transition:all .2s; }
.upload-zone:hover { border-color:#2c4fd4; background:#f0f4ff; }
.upload-ico { width:24px; height:24px; color:#6b7597; margin:0 auto 6px; }
.upload-text { font-size:13px; color:#6b7597; }
.upload-text strong { color:#2c4fd4; }
.btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn.primary { background:#1a2f6e; color:#fff; }
.btn.primary:hover { background:#2c4fd4; }
.btn-ico { width:14px; height:14px; }
/* Historial */
.hist-list { }
.hist-row { display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid #d4dae8; }
.hist-row:last-child { border-bottom:none; }
.hist-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.hist-dot.green  { background:#16a34a; }
.hist-dot.blue   { background:#2c4fd4; }
.hist-dot.yellow { background:#f59e0b; }
.hist-info { flex:1; }
.hist-tema { font-size:14px; font-weight:600; color:#1a2340; }
.hist-meta { font-size:12px; color:#6b7597; margin-top:2px; }
.hist-fecha { font-size:12px; color:#6b7597; margin-right:8px; }
</style>
