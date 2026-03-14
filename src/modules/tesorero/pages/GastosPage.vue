<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Gastos y Comprobantes</h1>
        <p class="page-sub">Registre los gastos de la transferencia activa</p>
      </div>
      <select v-model="selectedTransfId" class="transf-select">
        <option v-for="t in store.transferencias" :key="t.id" :value="t.id">
          {{ t.codigo }} – {{ fmt(t.monto) }} ({{ t.estado }})
        </option>
      </select>
    </div>

    <!-- Formulario -->
    <div class="card mb">
      <div class="card-header">
        <span class="card-title-sm">Registrar Nuevo Gasto</span>
      </div>
      <div class="card-body">
        <div class="form-row r3">
          <div class="form-group">
            <label class="form-label required">Fecha de documento</label>
            <input v-model="form.fecha" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label required">Detalle / Producto</label>
            <input v-model="form.concepto" type="text" class="form-input" placeholder="Ej: Verduras mercado central" />
          </div>
          <div class="form-group">
            <label class="form-label required">Rubro</label>
            <select v-model="form.rubro" class="form-input">
              <option value="">Seleccionar...</option>
              <option value="alimentos">Alimentos</option>
              <option value="transporte">Transporte</option>
              <option value="gas">Gas</option>
              <option value="estipendio">Estipendio</option>
              <option value="limpieza">Limpieza</option>
              <option value="otros">Otros</option>
            </select>
          </div>
        </div>
        <div class="form-row r4" style="margin-top:14px">
          <div class="form-group">
            <label class="form-label">¿Tiene RUC?</label>
            <div class="radio-group">
              <label class="radio-opt" :class="{ active: form.tieneRuc }">
                <input type="radio" :value="true" v-model="form.tieneRuc" /> Sí
              </label>
              <label class="radio-opt" :class="{ active: !form.tieneRuc }">
                <input type="radio" :value="false" v-model="form.tieneRuc" /> No
              </label>
            </div>
          </div>
          <div class="form-group" v-if="form.tieneRuc">
            <label class="form-label">Tipo Comprobante</label>
            <select v-model="form.tipoComprobante" class="form-input">
              <option>Boleta de Venta</option>
              <option>Recibo de Gasto</option>
              <option>Factura</option>
              <option>Ticket</option>
            </select>
          </div>
          <div class="form-group" v-if="form.tieneRuc">
            <label class="form-label">N° de Comprobante</label>
            <input v-model="form.nComprobante" class="form-input" placeholder="Ej: E001-582" />
          </div>
          <div class="form-group">
            <label class="form-label required">Monto (S/)</label>
            <div class="monto-wrap">
              <span class="monto-prefix">S/</span>
              <input v-model.number="form.monto" type="number" class="form-input monto-input" placeholder="0.00" step="0.01" />
            </div>
            <div v-if="montoError" class="form-error">⚠ Estás excediendo el monto por rubro establecido</div>
          </div>
        </div>

        <div class="upload-zone" @click="fileInput?.click()">
          <Upload class="upload-ico" />
          <div class="upload-text">
            <strong>Fotografía / PDF del comprobante</strong><br/>
            Haga clic o arrastre el archivo aquí
          </div>
          <input ref="fileInput" type="file" accept="image/*,.pdf" style="display:none" @change="onFileChange" />
        </div>
        <div v-if="selectedFile" class="file-ok">
          <CheckCircle class="file-ico" /> Archivo seleccionado: <strong>{{ selectedFile }}</strong>
        </div>

        <div class="form-actions">
          <button class="btn primary" @click="agregarGasto">
            <Plus class="btn-ico" /> Agregar Gasto
          </button>
          <button class="btn secondary" @click="showDJ = true">Declaración Jurada</button>
          <button class="btn secondary" @click="showMovilidad = true">Planilla Movilidad</button>
        </div>
      </div>
    </div>

    <!-- Tabla gastos -->
    <div class="card">
      <div class="card-header">
        <span class="card-title-sm">Gastos Registrados</span>
        <span style="font-size:12px;color:#6b7597">Ordenados cronológicamente</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Concepto</th><th>Rubro</th><th>Comprobante</th><th>Monto</th><th>Transferencia</th><th>Acciones</th><th>Estado</th></tr>
          </thead>
          <tbody>
            <tr v-for="g in gastosActivos" :key="g.id">
              <td>{{ g.fecha }}</td>
              <td class="fw">{{ g.concepto }}</td>
              <td><span class="chip-rubro">{{ g.rubro }}</span></td>
              <td style="color:#2c4fd4;font-size:12px">{{ g.comprobante }}</td>
              <td class="fw">{{ fmt(g.monto) }}</td>
              <td style="color:#6b7597">{{ g.transferenciaId }}</td>
              <td>
                <button class="icon-btn" @click="store.eliminarGasto(g.id)" title="Eliminar">
                  <Trash2 class="btn-ico" />
                </button>
              </td>
              <td><StatusBadge :status="g.estado" /></td>
            </tr>
            <tr v-if="gastosActivos.length === 0">
              <td colspan="8" class="empty">No hay gastos registrados para esta transferencia</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal DJ -->
    <BaseModal :open="showDJ" @close="showDJ=false">
      <div class="modal-inner">
        <div class="modal-hd">
          <div class="modal-title">Declaración Jurada de Gastos</div>
          <button class="modal-close" @click="showDJ=false"><X /></button>
        </div>
        <div class="info-alert">
          <Info class="alert-ico" />
          <span>Use este formulario solo cuando el proveedor no pueda emitir comprobante SUNAT.</span>
        </div>
        <div class="form-row r4" style="margin-bottom:14px">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input v-model="dj.fecha" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Rubro</label>
            <select v-model="dj.rubro" class="form-input">
              <option value="alimentos">Alimentos</option>
              <option value="transporte">Transporte</option>
              <option value="gas">Gas</option>
              <option value="estipendio">Estipendio</option>
              <option value="limpieza">Limpieza</option>
              <option value="otros">Otros</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Detalle</label>
            <input v-model="dj.detalle" class="form-input" placeholder="Descripción del gasto" />
          </div>
          <div class="form-group">
            <label class="form-label">Monto (S/)</label>
            <input v-model.number="dj.monto" type="number" class="form-input" placeholder="0.00" />
          </div>
        </div>
        <button class="btn primary btn-sm" @click="agregarDJ">
          <Plus class="btn-ico" /> Agregar gasto
        </button>
        <table style="margin-top:14px;width:100%;border-collapse:collapse">
          <thead><tr><th>Fecha</th><th>Rubro</th><th>Detalle</th><th>Monto</th></tr></thead>
          <tbody>
            <tr v-for="(r,i) in djRegistros" :key="i">
              <td>{{ r.fecha }}</td>
              <td style="text-transform:capitalize">{{ r.rubro }}</td>
              <td>{{ r.detalle }}</td>
              <td>S/ {{ r.monto }}</td>
            </tr>
            <tr v-if="djRegistros.length===0"><td colspan="4" class="empty">Sin registros</td></tr>
          </tbody>
        </table>
        <div class="modal-footer">
          <button class="btn secondary" @click="showDJ=false">Cerrar</button>
          <button class="btn primary"><Download class="btn-ico" /> Exportar DJ</button>
        </div>
      </div>
    </BaseModal>

    <!-- Modal Movilidad -->
    <BaseModal :open="showMovilidad" @close="showMovilidad=false">
      <div class="modal-inner">
        <div class="modal-hd">
          <div class="modal-title">Planilla de Movilidad</div>
          <button class="modal-close" @click="showMovilidad=false"><X /></button>
        </div>
        <div class="form-row" style="grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:12px;margin-bottom:14px">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input v-model="mov.fecha" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Punto Partida</label>
            <input v-model="mov.partida" class="form-input" placeholder="Ej: Pasaje 15" />
          </div>
          <div class="form-group">
            <label class="form-label">Punto Llegada</label>
            <input v-model="mov.llegada" class="form-input" placeholder="Ej: Mercado" />
          </div>
          <div class="form-group">
            <label class="form-label">IIEE</label>
            <select v-model="mov.iiee" class="form-input">
              <option>IE N° 20124</option>
              <option>IE N° 20089</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Monto (S/)</label>
            <input v-model.number="mov.monto" type="number" class="form-input" placeholder="0.00" />
          </div>
        </div>
        <button class="btn primary btn-sm" @click="agregarMov">
          <Plus class="btn-ico" /> Agregar
        </button>
        <table style="margin-top:14px;width:100%;border-collapse:collapse">
          <thead><tr><th>Fecha</th><th>Partida</th><th>Llegada</th><th>IIEE</th><th>Monto</th></tr></thead>
          <tbody>
            <tr v-for="(r,i) in movRegistros" :key="i">
              <td>{{ r.fecha }}</td><td>{{ r.partida }}</td><td>{{ r.llegada }}</td>
              <td>{{ r.iiee }}</td><td>S/ {{ r.monto }}</td>
            </tr>
            <tr v-if="movRegistros.length===0"><td colspan="5" class="empty">Sin registros</td></tr>
          </tbody>
        </table>
        <div class="modal-footer">
          <button class="btn secondary" @click="showMovilidad=false">Cerrar</button>
          <button class="btn primary"><Download class="btn-ico" /> Exportar DJ</button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Trash2, Upload, CheckCircle, Info, Download, X } from 'lucide-vue-next'
import { useTransferenciaStore } from '@/stores/transferencia.store'
import { useToastStore }         from '@/stores/toast.store'
import type { RubroGasto }       from '@/types/rendicion'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'
import BaseModal   from '@/components/ui/overlay/BaseModal.vue'

const store = useTransferenciaStore()
const toast = useToastStore()
const route = useRoute()

const selectedTransfId = ref(store.activa?.id ?? store.transferencias[0]?.id)
const showDJ           = ref(false)
const showMovilidad    = ref(false)
const selectedFile     = ref('')
const fileInput        = ref<HTMLInputElement>()
const montoError       = ref(false)

const form = reactive({
  fecha:'', concepto:'', rubro:'' as RubroGasto,
  tieneRuc:true, tipoComprobante:'Boleta de Venta', nComprobante:'', monto:0
})
const dj  = reactive({ fecha:'', rubro:'alimentos', detalle:'', monto:0 })
const mov = reactive({ fecha:'', partida:'', llegada:'', iiee:'IE N° 20124', monto:0 })
const djRegistros  = ref<any[]>([])
const movRegistros = ref<any[]>([])

onMounted(() => {
  form.fecha = new Date().toISOString().split('T')[0]
  dj.fecha   = form.fecha
  mov.fecha  = form.fecha
  if (route.query.transf) selectedTransfId.value = route.query.transf as string
})

const gastosActivos = computed(() => store.gastosPorTransferencia(selectedTransfId.value))

function fmt(n: number) {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits:2, maximumFractionDigits:2 })
}

function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) selectedFile.value = f.name
}

function agregarGasto() {
  if (!form.concepto || !form.rubro || !form.monto) {
    toast.warning('Campos incompletos', 'Complete todos los campos obligatorios')
    return
  }
  const comp = form.tieneRuc ? (form.nComprobante || 'Sin número') : 'DJ'
  store.agregarGasto({
    transferenciaId: selectedTransfId.value,
    fecha: new Date().toLocaleDateString('es-PE'),
    concepto: form.concepto.toUpperCase(),
    rubro: form.rubro,
    tieneRuc: form.tieneRuc,
    tipoComprobante: form.tipoComprobante,
    nComprobante: comp,
    monto: form.monto,
  })
  form.concepto = ''
  form.monto    = 0
  selectedFile.value = ''
  toast.success('Gasto registrado', 'El gasto fue agregado correctamente')
}

function agregarDJ() {
  if (!dj.fecha || !dj.detalle || !dj.monto) { toast.warning('Complete todos los campos'); return }
  djRegistros.value.unshift({ ...dj })
  dj.detalle = ''
  dj.monto   = 0
  toast.success('Gasto DJ registrado')
}

function agregarMov() {
  if (!mov.fecha || !mov.partida || !mov.llegada || !mov.monto) { toast.warning('Complete todos los campos'); return }
  movRegistros.value.unshift({ ...mov })
  mov.partida = ''
  mov.llegada = ''
  mov.monto   = 0
  toast.success('Movilidad registrada')
}
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.transf-select { padding:8px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13px; outline:none; }
.mb { margin-bottom:20px; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 12px rgba(26,47,110,.08); margin-bottom:20px; }
.card-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; color:#1a2340; }
.card-body { padding:20px; }
.form-row { display:grid; gap:16px; }
.r3 { grid-template-columns:1fr 1fr 1fr; }
.r4 { grid-template-columns:1fr 1fr 1fr 1fr; }
.form-group { display:flex; flex-direction:column; gap:5px; }
.form-label { font-size:12.5px; font-weight:700; color:#1a2340; }
.form-label.required::after { content:' *'; color:#dc2626; }
.form-input { padding:9px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13.5px; outline:none; background:#fafbfd; transition:border-color .15s; }
.form-input:focus { border-color:#2c4fd4; background:#fff; }
.form-error { font-size:11.5px; color:#dc2626; margin-top:3px; }
.monto-wrap { position:relative; }
.monto-prefix { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#6b7597; font-size:13px; font-weight:700; }
.monto-input { padding-left:26px !important; }
.radio-group { display:flex; }
.radio-opt { display:flex; align-items:center; gap:5px; padding:8px 14px; border:1.5px solid #d4dae8; font-size:13px; cursor:pointer; transition:all .15s; }
.radio-opt:first-child { border-radius:8px 0 0 8px; }
.radio-opt:last-child  { border-radius:0 8px 8px 0; margin-left:-1.5px; }
.radio-opt input { display:none; }
.radio-opt.active { background:#2c4fd4; border-color:#2c4fd4; color:white; }
.upload-zone { border:2px dashed #d4dae8; border-radius:10px; padding:24px; text-align:center; cursor:pointer; transition:all .2s; margin-top:16px; }
.upload-zone:hover { border-color:#2c4fd4; background:#f0f4ff; }
.upload-ico { width:28px; height:28px; color:#6b7597; margin:0 auto 8px; }
.upload-text { font-size:13px; color:#6b7597; }
.upload-text strong { color:#2c4fd4; }
.file-ok { margin-top:8px; font-size:13px; color:#16a34a; font-weight:600; display:flex; align-items:center; gap:6px; }
.file-ico { width:16px; height:16px; }
.form-actions { display:flex; gap:10px; margin-top:16px; }
.btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; font-size:13.5px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn-sm { padding:6px 12px; font-size:12.5px; }
.btn.primary { background:#1a2f6e; color:#fff; box-shadow:0 2px 8px rgba(26,47,110,.25); }
.btn.primary:hover { background:#2c4fd4; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
.btn-ico { width:14px; height:14px; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
thead th { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#6b7597; padding:10px 16px; border-bottom:1px solid #d4dae8; background:#fafbfd; text-align:left; }
tbody td { padding:11px 16px; font-size:13.5px; border-bottom:1px solid #f0f2f8; }
tbody tr:last-child td { border-bottom:none; }
tbody tr:hover { background:#f0f4ff; }
td.fw { font-weight:700; }
td.empty { text-align:center; color:#6b7597; padding:24px; }
.icon-btn { background:#fee2e2; border:none; border-radius:7px; padding:5px; cursor:pointer; display:flex; align-items:center; color:#dc2626; transition:all .15s; }
.icon-btn:hover { background:#dc2626; color:#fff; }
.chip-rubro { background:#e8edf9; color:#2c4fd4; padding:2px 8px; border-radius:6px; font-size:11.5px; font-weight:700; text-transform:capitalize; }
/* Modal */
.modal-inner { }
.modal-hd { display:flex; align-items:center; justify-content:space-between; padding-bottom:14px; border-bottom:1px solid #d4dae8; margin-bottom:16px; }
.modal-title { font-size:16px; font-weight:700; color:#1a2340; }
.modal-close { background:none; border:none; cursor:pointer; color:#6b7597; }
.modal-footer { display:flex; gap:8px; justify-content:flex-end; margin-top:16px; padding-top:14px; border-top:1px solid #d4dae8; }
.info-alert { display:flex; gap:10px; align-items:flex-start; background:#e8edf9; border:1px solid #93c5fd; border-radius:8px; padding:10px 14px; margin-bottom:14px; font-size:12.5px; color:#1a2f6e; }
.alert-ico { width:16px; height:16px; flex-shrink:0; margin-top:1px; }
</style>
