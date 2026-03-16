<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Reuniones</h1>
        <p class="page-sub">Registro de asambleas y capacitaciones</p>
      </div>
      <button class="btn primary" @click="abrirFormulario()">
        <Plus class="btn-ico" /> Nueva Reunión
      </button>
    </div>

    <!-- Filtros -->
    <div class="filtros-row">
      <div class="filter-tabs">
        <button
          v-for="f in filtros" :key="f.val"
          class="filter-tab"
          :class="{ active: filtroActivo === f.val }"
          @click="filtroActivo = f.val"
        >
          <component :is="f.icon" style="width:13px;height:13px" />
          {{ f.label }}
        </button>
      </div>
      <div class="search-wrap">
        <Search class="search-ico" />
        <input v-model="q" class="search-input" placeholder="Buscar reunión..." />
      </div>
    </div>

    <!-- Lista -->
    <div v-if="store.loading" class="loading-row">
      <div class="spinner-lg" /> Cargando reuniones...
    </div>

    <div v-else-if="filtradas.length === 0" class="empty-state">
      <Users style="width:40px;height:40px;color:#d4dae8;margin-bottom:12px" />
      <div>No hay reuniones registradas</div>
      <button class="btn primary btn-sm" style="margin-top:12px" @click="abrirFormulario()">
        Registrar primera reunión
      </button>
    </div>

    <div v-else class="reuniones-grid">
      <div v-for="r in filtradas" :key="r.id" class="reunion-card" :class="r.tipo">
        <div class="card-tipo-badge" :class="r.tipo">
          <component :is="r.tipo === 'asamblea' ? Users : GraduationCap" style="width:12px;height:12px" />
          {{ r.tipo === 'asamblea' ? 'Asamblea' : 'Capacitación' }}
        </div>

        <div class="card-body-inner">
          <div class="card-titulo">{{ r.titulo }}</div>
          <div class="card-desc" v-if="r.descripcion">{{ r.descripcion }}</div>

          <div class="card-meta-row">
            <span class="meta-item">
              <Calendar style="width:13px;height:13px" />
              {{ fmtFecha(r.fecha) }}
            </span>
            <span class="meta-item">
              <Clock style="width:13px;height:13px" />
              {{ r.hora?.substring(0,5) }}
            </span>
            <span class="meta-item" v-if="r.num_asistentes > 0">
              <Users2 style="width:13px;height:13px" />
              {{ r.num_asistentes }} asistentes
            </span>
          </div>

          <div class="meta-item" v-if="r.institucion_nombre" style="margin-top:6px">
            <Building2 style="width:13px;height:13px;color:#6b7597" />
            <span style="color:#6b7597;font-size:12px">{{ r.institucion_nombre }}</span>
          </div>
        </div>

        <div class="card-footer">
          <span class="estado-badge" :class="r.estado">
            {{ estadoLabel(r.estado) }}
          </span>
          <div class="card-actions">
            <a v-if="r.acta_url"
              :href="`http://localhost:3000${r.acta_url}`"
              target="_blank"
              class="icon-btn green"
              title="Ver acta"
            >
              <FileText class="btn-ico" />
            </a>
            <button class="icon-btn edit" @click="abrirFormulario(r)" title="Editar">
              <Pencil class="btn-ico" />
            </button>
            <button class="icon-btn delete" @click="eliminar(r.id)" title="Eliminar">
              <Trash2 class="btn-ico" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal formulario -->
    <BaseModal :open="showForm" @close="cerrarFormulario">
      <div class="modal-inner">
        <div class="modal-hd">
          <div class="modal-title">
            {{ editandoId ? 'Editar Reunión' : 'Registrar Nueva Reunión' }}
          </div>
          <button class="modal-close" @click="cerrarFormulario"><X /></button>
        </div>

        <!-- Tipo -->
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label required">Tipo de Reunión</label>
          <div class="tipo-tabs">
            <button
              type="button"
              class="tipo-tab"
              :class="{ active: form.tipo === 'asamblea' }"
              @click="form.tipo = 'asamblea'"
            >
              <Users style="width:16px;height:16px" /> Asamblea de Padres
            </button>
            <button
              type="button"
              class="tipo-tab"
              :class="{ active: form.tipo === 'capacitacion' }"
              @click="form.tipo = 'capacitacion'"
            >
              <GraduationCap style="width:16px;height:16px" /> Capacitación ATC
            </button>
          </div>
        </div>

        <div class="form-row r2" style="margin-bottom:14px">
          <div class="form-group">
            <label class="form-label required">Fecha</label>
            <input v-model="form.fecha" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label required">Hora</label>
            <input v-model="form.hora" type="time" class="form-input" />
          </div>
        </div>

        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label required">Título / Tema</label>
          <input v-model="form.titulo" class="form-input" placeholder="Ej: Asamblea mensual de padres de familia" />
        </div>

        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label">Descripción</label>
          <textarea v-model="form.descripcion" class="form-textarea" rows="2" placeholder="Temas tratados, acuerdos, etc." />
        </div>

        <div class="form-row r2" style="margin-bottom:14px">
          <div class="form-group">
            <label class="form-label">Institución Educativa</label>
            <select v-model="form.institucion_id" class="form-input">
              <option value="">Sin institución específica</option>
              <option value="1">IE N° 20124 - Señor de los Milagros</option>
              <option value="2">IE N° 20089 - Divino Maestro</option>
              <option value="3">IE N° 30015 - Los Andes</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">N° de Asistentes</label>
            <input v-model.number="form.num_asistentes" type="number" class="form-input" placeholder="0" min="0" />
          </div>
        </div>

        <div class="form-group" style="margin-bottom:14px" v-if="editandoId">
          <label class="form-label">Estado</label>
          <select v-model="form.estado" class="form-input">
            <option value="programada">Programada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <!-- Acta -->
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label">Acta / Foto de la reunión</label>
          <div class="upload-zone" @click="actaInput?.click()">
            <FileText class="upload-ico" />
            <div class="upload-text">
              <strong>Subir acta o foto</strong><br/>
              PNG, JPG o PDF
            </div>
            <input ref="actaInput" type="file" accept="image/*,.pdf" style="display:none" @change="onActaChange" />
          </div>
          <div v-if="actaFile" class="file-ok">
            <CheckCircle class="file-ico" /> {{ actaFile }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn secondary" @click="cerrarFormulario">Cancelar</button>
          <button class="btn primary" @click="guardar" :disabled="guardando">
            <Save class="btn-ico" />
            {{ guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Registrar' }}
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import {
  Plus, Search, Users, GraduationCap, Calendar, Clock,
  Users2, Building2, FileText, Pencil, Trash2, X, Save, CheckCircle
} from 'lucide-vue-next'
import { useReunionesStore } from '@/stores/reuniones.store'
import { useToastStore }     from '@/stores/toast.store'
import BaseModal from '@/components/ui/overlay/BaseModal.vue'

const store   = useReunionesStore()
const toast   = useToastStore()

const q             = ref('')
const filtroActivo  = ref('todos')
const showForm      = ref(false)
const editandoId    = ref<number | null>(null)
const guardando     = ref(false)
const actaFile      = ref('')
const actaFileObj   = ref<File | null>(null)
const actaInput     = ref<HTMLInputElement>()

const filtros = [
  { val: 'todos',       label: 'Todos',        icon: Users },
  { val: 'asamblea',    label: 'Asambleas',    icon: Users },
  { val: 'capacitacion',label: 'Capacitaciones', icon: GraduationCap },
]

const form = reactive({
  tipo: 'asamblea',
  titulo: '',
  descripcion: '',
  fecha: '',
  hora: '08:00',
  institucion_id: '',
  num_asistentes: 0,
  estado: 'programada'
})

onMounted(() => store.cargar())

const filtradas = computed(() => {
  let lista = store.reuniones
  if (filtroActivo.value !== 'todos') lista = lista.filter(r => r.tipo === filtroActivo.value)
  if (q.value.trim()) {
    const t = q.value.toLowerCase()
    lista = lista.filter(r =>
      r.titulo.toLowerCase().includes(t) ||
      r.descripcion?.toLowerCase().includes(t) ||
      r.institucion_nombre?.toLowerCase().includes(t)
    )
  }
  return lista
})

function abrirFormulario(r?: any) {
  if (r) {
    editandoId.value     = r.id
    form.tipo            = r.tipo
    form.titulo          = r.titulo
    form.descripcion     = r.descripcion ?? ''
    form.fecha           = r.fecha?.split('T')[0] ?? ''
    form.hora            = r.hora?.substring(0, 5) ?? '08:00'
    form.institucion_id  = r.institucion_id ?? ''
    form.num_asistentes  = r.num_asistentes ?? 0
    form.estado          = r.estado
  } else {
    editandoId.value     = null
    form.tipo            = 'asamblea'
    form.titulo          = ''
    form.descripcion     = ''
    form.fecha           = new Date().toISOString().split('T')[0]
    form.hora            = '08:00'
    form.institucion_id  = ''
    form.num_asistentes  = 0
    form.estado          = 'programada'
  }
  actaFile.value    = ''
  actaFileObj.value = null
  showForm.value    = true
}

function cerrarFormulario() {
  showForm.value = false
}

function onActaChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) { actaFile.value = f.name; actaFileObj.value = f }
}

async function guardar() {
  if (!form.titulo || !form.fecha || !form.hora) {
    toast.warning('Campos incompletos', 'Complete título, fecha y hora')
    return
  }
  guardando.value = true
  try {
    if (editandoId.value) {
      await store.actualizar(editandoId.value, { ...form }, actaFileObj.value)
      toast.success('Reunión actualizada')
    } else {
      await store.registrar({ ...form }, actaFileObj.value)
      toast.success('Reunión registrada')
    }
    await store.cargar()
    cerrarFormulario()
  } catch (e: any) {
    toast.error('Error', e.message)
  } finally {
    guardando.value = false
  }
}

async function eliminar(id: number) {
  try {
    await store.eliminar(id)
    toast.success('Reunión eliminada')
  } catch (e: any) {
    toast.error('Error', e.message)
  }
}

function fmtFecha(f: string) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function estadoLabel(e: string) {
  return { programada: 'Programada', realizada: 'Realizada', cancelada: 'Cancelada' }[e] ?? e
}
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }

/* Filtros */
.filtros-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; gap:12px; }
.filter-tabs { display:flex; gap:6px; }
.filter-tab { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; border:1.5px solid #d4dae8; background:#fff; font-size:13px; font-weight:600; cursor:pointer; color:#6b7597; transition:all .15s; }
.filter-tab:hover { border-color:#2c4fd4; color:#2c4fd4; }
.filter-tab.active { background:#1a2f6e; border-color:#1a2f6e; color:#fff; }
.search-wrap { position:relative; }
.search-ico { position:absolute; left:10px; top:50%; transform:translateY(-50%); width:14px; height:14px; color:#6b7597; }
.search-input { padding:8px 12px 8px 32px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13px; outline:none; width:240px; }
.search-input:focus { border-color:#2c4fd4; }

/* Grid */
.reuniones-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px; }
.reunion-card { background:#fff; border:1px solid #d4dae8; border-radius:14px; overflow:hidden; box-shadow:0 2px 8px rgba(26,47,110,.06); transition:all .2s; display:flex; flex-direction:column; }
.reunion-card:hover { box-shadow:0 4px 16px rgba(26,47,110,.12); transform:translateY(-2px); }
.reunion-card.asamblea     { border-top:3px solid #2c4fd4; }
.reunion-card.capacitacion { border-top:3px solid #16a34a; }

.card-tipo-badge { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; }
.card-tipo-badge.asamblea     { background:#e8edf9; color:#1a2f6e; }
.card-tipo-badge.capacitacion { background:#dcfce7; color:#15803d; }

.card-body-inner { padding:12px 16px; flex:1; }
.card-titulo { font-size:14px; font-weight:700; color:#1a2340; margin-bottom:4px; }
.card-desc { font-size:12.5px; color:#6b7597; margin-bottom:8px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.card-meta-row { display:flex; gap:12px; flex-wrap:wrap; }
.meta-item { display:inline-flex; align-items:center; gap:4px; font-size:12px; color:#6b7597; }

.card-footer { padding:10px 16px; border-top:1px solid #f0f2f8; display:flex; align-items:center; justify-content:space-between; }
.estado-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
.estado-badge.programada  { background:#e8edf9; color:#2c4fd4; }
.estado-badge.realizada   { background:#dcfce7; color:#16a34a; }
.estado-badge.cancelada   { background:#fee2e2; color:#dc2626; }

.card-actions { display:flex; gap:6px; }
.icon-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:7px; padding:5px; cursor:pointer; display:flex; align-items:center; color:#6b7597; transition:all .15s; }
.icon-btn:hover { background:#e8edf9; color:#2c4fd4; border-color:#2c4fd4; }
.icon-btn.edit { background:#e8edf9; color:#2c4fd4; border-color:#c7d2f0; }
.icon-btn.edit:hover { background:#2c4fd4; color:#fff; }
.icon-btn.delete { background:#fee2e2; color:#dc2626; border-color:#fca5a5; }
.icon-btn.delete:hover { background:#dc2626; color:#fff; }
.icon-btn.green { background:#dcfce7; color:#16a34a; border-color:#86efac; }
.icon-btn.green:hover { background:#16a34a; color:#fff; }
.btn-ico { width:14px; height:14px; }

/* Empty / loading */
.loading-row { display:flex; align-items:center; gap:10px; padding:40px; justify-content:center; color:#6b7597; }
.spinner-lg { width:20px; height:20px; border:3px solid #d4dae8; border-top-color:#2c4fd4; border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.empty-state { text-align:center; padding:60px 20px; color:#6b7597; font-size:13.5px; display:flex; flex-direction:column; align-items:center; }

/* Modal */
.modal-inner { }
.modal-hd { display:flex; align-items:center; justify-content:space-between; padding-bottom:14px; border-bottom:1px solid #d4dae8; margin-bottom:16px; }
.modal-title { font-size:16px; font-weight:700; color:#1a2340; }
.modal-close { background:none; border:none; cursor:pointer; color:#6b7597; }
.modal-footer { display:flex; gap:8px; justify-content:flex-end; margin-top:16px; padding-top:14px; border-top:1px solid #d4dae8; }

.tipo-tabs { display:flex; gap:8px; }
.tipo-tab { flex:1; display:flex; align-items:center; justify-content:center; gap:8px; padding:10px; border:1.5px solid #d4dae8; border-radius:10px; background:#fff; font-size:13px; font-weight:600; cursor:pointer; color:#6b7597; transition:all .15s; }
.tipo-tab:hover { border-color:#2c4fd4; color:#2c4fd4; }
.tipo-tab.active.asamblea    { background:#e8edf9; border-color:#2c4fd4; color:#1a2f6e; }
.tipo-tab.active.capacitacion { background:#dcfce7; border-color:#16a34a; color:#15803d; }
.tipo-tab.active { background:#1a2f6e; border-color:#1a2f6e; color:#fff; }

.form-row { display:grid; gap:14px; }
.r2 { grid-template-columns:1fr 1fr; }
.form-group { display:flex; flex-direction:column; gap:5px; }
.form-label { font-size:12.5px; font-weight:700; color:#1a2340; }
.form-label.required::after { content:' *'; color:#dc2626; }
.form-input { padding:9px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13.5px; outline:none; background:#fafbfd; }
.form-input:focus { border-color:#2c4fd4; background:#fff; }
.form-textarea { width:100%; padding:9px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13.5px; outline:none; resize:vertical; min-height:60px; box-sizing:border-box; }
.form-textarea:focus { border-color:#2c4fd4; }

.upload-zone { border:2px dashed #d4dae8; border-radius:10px; padding:16px; text-align:center; cursor:pointer; transition:all .2s; }
.upload-zone:hover { border-color:#2c4fd4; background:#f0f4ff; }
.upload-ico { width:22px; height:22px; color:#6b7597; margin:0 auto 6px; display:block; }
.upload-text { font-size:12.5px; color:#6b7597; }
.upload-text strong { color:#2c4fd4; }
.file-ok { margin-top:8px; font-size:12.5px; color:#16a34a; font-weight:600; display:flex; align-items:center; gap:5px; }
.file-ico { width:14px; height:14px; }

.btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn-sm { padding:6px 12px; font-size:12.5px; }
.btn.primary { background:#1a2f6e; color:#fff; box-shadow:0 2px 8px rgba(26,47,110,.25); }
.btn.primary:hover:not(:disabled) { background:#2c4fd4; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
.btn:disabled { opacity:.5; cursor:not-allowed; }
</style>