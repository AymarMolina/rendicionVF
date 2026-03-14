<template>
  <div class="page">
    <!-- Lista de IEs -->
    <template v-if="!selectedIE">
      <div class="page-header">
        <div>
          <h1 class="page-title">Instituciones</h1>
          <p class="page-sub">{{ store.instituciones.length }} instituciones a su cargo</p>
        </div>
      </div>
      <div class="ie-grid">
        <div v-for="ie in store.instituciones" :key="ie.id" class="ie-card">
          <div class="ie-card-top">
            <div class="ie-card-name">{{ ie.nombre }}</div>
            <StatusBadge :status="ie.estado" />
          </div>
          <div class="ie-card-sub">Ate · {{ ie.alumnos }} alumnos</div>
          <div class="ie-card-sub mt2">Tesorera: {{ ie.tesorera }}</div>
          <ProgressBar :value="ie.progreso" />
          <button class="btn secondary btn-sm mt12" @click="verAnexos(ie.id)">
            <FileText class="btn-ico" /> Ver Anexos
          </button>
        </div>
      </div>
    </template>

    <!-- Detalle de IE -->
    <template v-else>
      <div class="back-row">
        <button class="btn secondary btn-sm" @click="selectedIE=null">
          <ArrowLeft class="btn-ico" /> Volver
        </button>
        <span class="detail-title">{{ ieData?.nombre }}</span>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title-sm">Anexos y Documentos</div>
          <StatusBadge :status="ieData?.estado ?? ''" />
        </div>
        <div class="card-body">
          <div v-for="(doc, i) in docsList" :key="i" class="doc-row">
            <div class="doc-icon" :class="doc.ok ? 'ok' : 'miss'">
              <CheckCircle v-if="doc.ok" class="doc-ico" />
              <AlertCircle v-else class="doc-ico" />
            </div>
            <div class="doc-info">
              <div class="doc-name">{{ doc.label }}</div>
              <div class="doc-state">{{ doc.ok ? 'Archivo adjunto' : 'Pendiente de subir' }}</div>
            </div>
            <template v-if="doc.ok">
              <button class="icon-btn" title="Ver" @click="toast.info('Visualizando', doc.label)">
                <Eye class="btn-ico2" />
              </button>
              <button class="icon-btn ml6" title="Descargar" @click="toast.success('Descargando', doc.label)">
                <Download class="btn-ico2" />
              </button>
              <button class="btn success btn-sm ml8" @click="toast.success('Completado', doc.label+' marcado como completado')">Completado</button>
              <button class="btn danger btn-sm ml6" @click="toast.warning('Observado', 'Observación registrada para '+doc.label)">Observar</button>
            </template>
            <template v-else>
              <StatusBadge status="Pendiente" />
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileText, ArrowLeft, Eye, Download, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { useInstitucionStore } from '@/stores/institucion.store'
import { useToastStore }       from '@/stores/toast.store'
import StatusBadge  from '@/components/ui/shared/StatusBadge.vue'
import ProgressBar  from '@/components/ui/shared/ProgressBar.vue'

const store = useInstitucionStore()
const toast = useToastStore()

const selectedIE = ref<string | null>(null)
const ieData = computed(() => selectedIE.value ? store.porId(selectedIE.value) : null)

const docsList = computed(() => {
  const ie = ieData.value
  if (!ie) return []
  return [
    { label:'Acta de Asamblea (Anexo 1)', ok: ie.progreso >= 20 },
    { label:'Conciliación (Anexo 2)',      ok: ie.progreso >= 40 },
    { label:'Balance de Gastos (Anexo 3)', ok: ie.progreso >= 60 },
    { label:'Declaración Jurada',          ok: ie.progreso >= 80 },
    { label:'Planilla Movilidad',          ok: ie.progreso >= 90 },
    { label:'Menú Semanal',               ok: ie.progreso >= 70 },
  ]
})

function verAnexos(id: string) { selectedIE.value = id }
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.ie-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.ie-card { background:#fff; border:1px solid #d4dae8; border-radius:14px; padding:18px 20px; transition:all .2s; }
.ie-card:hover { border-color:#2c4fd4; box-shadow:0 4px 16px rgba(44,79,212,.1); }
.ie-card-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:4px; }
.ie-card-name { font-size:15px; font-weight:700; color:#1a2340; }
.ie-card-sub { font-size:12.5px; color:#6b7597; }
.mt2 { margin-top:3px; }
.mt12 { margin-top:12px; }
.back-row { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
.detail-title { font-size:14px; font-weight:700; color:#1a2340; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; }
.card-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; }
.card-body { padding:16px 20px; }
.doc-row { display:flex; align-items:center; gap:10px; padding:12px 0; border-bottom:1px solid #f0f2f8; }
.doc-row:last-child { border-bottom:none; }
.doc-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.doc-icon.ok   { background:#dcfce7; }
.doc-icon.miss { background:#fee2e2; }
.doc-ico { width:15px; height:15px; }
.doc-icon.ok .doc-ico  { color:#16a34a; }
.doc-icon.miss .doc-ico { color:#dc2626; }
.doc-info { flex:1; }
.doc-name  { font-size:13.5px; font-weight:600; color:#1a2340; }
.doc-state { font-size:11.5px; color:#6b7597; margin-top:2px; }
.icon-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:7px; padding:5px; cursor:pointer; display:flex; align-items:center; color:#6b7597; transition:all .15s; }
.icon-btn:hover { background:#e8edf9; color:#2c4fd4; }
.btn-ico2 { width:14px; height:14px; }
.ml6 { margin-left:6px; }
.ml8 { margin-left:8px; }
.btn { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn-sm { padding:6px 12px; font-size:12px; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
.btn.success { background:#dcfce7; color:#16a34a; border:1px solid #86efac; }
.btn.success:hover { background:#16a34a; color:#fff; }
.btn.danger  { background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; }
.btn.danger:hover  { background:#dc2626; color:#fff; }
.btn-ico { width:14px; height:14px; }
</style>
