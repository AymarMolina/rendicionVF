<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Menú Semanal</h1>
        <p class="page-sub">Período: Junio 2025 · {{ store.instituciones.length }} instituciones educativas</p>
      </div>
      <div class="header-actions">
        <button class="btn secondary" @click="fileInput?.click()">
          <Upload class="btn-ico" /> Importar Archivo
          <input ref="fileInput" type="file" accept=".csv,.xls,.xlsx" style="display:none" @change="importar" />
        </button>
        <button class="btn primary" @click="generarMenu">Generar Menú Semanal</button>
      </div>
    </div>

    <!-- Formulario registro -->
    <div class="card mb">
      <div class="card-header"><span class="card-title-sm">Registrar Menú Semanal</span></div>
      <div class="card-body">
        <div class="form-row r4 mb14">
          <div class="form-group">
            <label class="form-label">Fecha inicio</label>
            <input v-model="form.fechaInicio" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Fecha fin</label>
            <input v-model="form.fechaFin" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Ámbito</label>
            <select v-model="form.ambito" class="form-input">
              <option>Rural</option><option>Urbana</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nivel</label>
            <select v-model="form.nivel" class="form-input">
              <option>Inicial</option><option>Primaria</option><option>Secundaria</option>
            </select>
          </div>
        </div>

        <!-- Grid días -->
        <div class="menu-grid mb14">
          <div v-for="dia in dias" :key="dia" class="menu-day">
            <div class="day-header">{{ dia }}</div>
            <div class="day-slot">
              <div class="slot-label">Desayuno</div>
              <div class="slot-edit">
                <input class="slot-input" placeholder="Nombre del plato" />
                <button class="slot-btn" @click="toast.info('Editar plato')"><Pencil class="slot-ico" /></button>
              </div>
            </div>
            <div class="day-slot">
              <div class="slot-label">Almuerzo</div>
              <div class="slot-edit">
                <input class="slot-input" placeholder="Nombre del plato" />
                <button class="slot-btn" @click="toast.info('Editar plato')"><Pencil class="slot-ico" /></button>
              </div>
            </div>
          </div>
        </div>

        <button class="btn primary" @click="registrarMenu">Registrar Menú</button>
      </div>
    </div>

    <!-- Historial -->
    <div class="card">
      <div class="card-header"><span class="card-title-sm">Historial de Menús</span></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Fecha Inicio</th><th>Fecha Fin</th><th>Ámbito</th><th>Nivel</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="m in instStore.menus" :key="m.id">
              <td>{{ m.fechaInicio }}</td>
              <td>{{ m.fechaFin }}</td>
              <td>{{ m.ambito }}</td>
              <td>{{ m.nivel }}</td>
              <td><StatusBadge :status="m.estado" /></td>
              <td>
                <button class="icon-btn" @click="toast.info('Editando menú')"><Pencil class="btn-ico2" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Upload, Pencil } from 'lucide-vue-next'
import { useInstitucionStore } from '@/stores/institucion.store'
import { useToastStore }       from '@/stores/toast.store'
import type { AmbitoMenu, NivelMenu, EstadoMenu } from '@/types/rendicion'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'

const store     = useInstitucionStore()
const instStore = useInstitucionStore()
const toast     = useToastStore()
const fileInput = ref<HTMLInputElement>()

const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes']

const form = reactive({
  fechaInicio:'', fechaFin:'', ambito:'Rural' as AmbitoMenu, nivel:'Inicial' as NivelMenu
})

onMounted(() => {
  form.fechaInicio = new Date().toISOString().split('T')[0]
  form.fechaFin    = new Date().toISOString().split('T')[0]
})

function importar() { toast.info('Archivo importado', 'El menú fue cargado desde el archivo') }
function generarMenu() { toast.success('Menú generado', 'El menú semanal fue generado correctamente') }
function registrarMenu() {
  store.agregarMenu({
    fechaInicio: new Date().toLocaleDateString('es-PE'),
    fechaFin: new Date().toLocaleDateString('es-PE'),
    ambito: form.ambito,
    nivel: form.nivel,
    estado: 'En curso' as EstadoMenu,
  })
  toast.success('Menú registrado', `${form.ambito} · ${form.nivel}`)
}
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.header-actions { display:flex; gap:10px; }
.mb { margin-bottom:20px; }
.mb14 { margin-bottom:14px; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 12px rgba(26,47,110,.08); }
.card-header { padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; }
.card-body { padding:20px; }
.form-row { display:grid; gap:14px; }
.r4 { grid-template-columns:1fr 1fr 1fr 1fr; }
.form-group { display:flex; flex-direction:column; gap:5px; }
.form-label { font-size:12.5px; font-weight:700; color:#1a2340; }
.form-input { padding:8px 11px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13px; outline:none; background:#fafbfd; }
.form-input:focus { border-color:#2c4fd4; }
/* Menu grid */
.menu-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; }
.menu-day { border:1px solid #d4dae8; border-radius:10px; overflow:hidden; }
.day-header { background:#1a2f6e; color:#fff; text-align:center; padding:8px; font-size:12px; font-weight:700; }
.day-slot { padding:8px 10px; border-bottom:1px solid #f0f2f8; }
.day-slot:last-child { border-bottom:none; }
.slot-label { font-size:10px; font-weight:700; text-transform:uppercase; color:#6b7597; letter-spacing:.4px; margin-bottom:4px; }
.slot-edit { display:flex; align-items:center; gap:4px; }
.slot-input { flex:1; padding:5px 7px; border:1.5px solid #d4dae8; border-radius:6px; font-size:12px; outline:none; min-width:0; }
.slot-input:focus { border-color:#2c4fd4; }
.slot-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:5px; padding:4px; cursor:pointer; display:flex; align-items:center; color:#6b7597; flex-shrink:0; }
.slot-ico { width:11px; height:11px; }
/* Buttons */
.btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; font-size:13.5px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn.primary { background:#1a2f6e; color:#fff; }
.btn.primary:hover { background:#2c4fd4; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
.btn-ico { width:14px; height:14px; }
/* Table */
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
thead th { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#6b7597; padding:10px 16px; border-bottom:1px solid #d4dae8; background:#fafbfd; text-align:left; }
tbody td { padding:11px 16px; font-size:13.5px; border-bottom:1px solid #f0f2f8; }
tbody tr:last-child td { border-bottom:none; }
tbody tr:hover { background:#f0f4ff; }
.icon-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:6px; padding:5px; cursor:pointer; display:flex; align-items:center; color:#6b7597; }
.icon-btn:hover { background:#e8edf9; color:#2c4fd4; }
.btn-ico2 { width:13px; height:13px; }
</style>
