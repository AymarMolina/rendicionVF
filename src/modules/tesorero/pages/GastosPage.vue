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

    <div class="card mb">
      <div class="card-header">
        <span class="card-title-sm">Registrar Nuevo Gasto</span>
      </div>
      <div class="card-body">
          <!-- Toggle modo comprobante múltiple -->
          <div class="factura-toggle-wrap">
            <label class="factura-toggle" :class="{ active: modoFactura }">
              <input type="checkbox" v-model="modoFactura" style="display:none" />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
              Registrar varios productos bajo un mismo comprobante
            </label>
          </div>

          <!-- ══════════════ MODO COMPROBANTE MÚLTIPLE ══════════════ -->
          <template v-if="modoFactura">
            <!-- Datos del comprobante (fijos para todos los ítems) -->
            <div class="form-row r4" style="margin-bottom:16px">
              <div class="form-group">
                <label class="form-label required">Fecha del comprobante</label>
                <input v-model="form.fecha" type="date" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label required">Tipo Comprobante</label>
                <select v-model="form.tipoComprobante" class="form-input">
                  <option value="boleta_venta">Boleta de Venta</option>
                  <option value="factura">Factura</option>
                  <option value="recibo_gasto">Recibo de Gasto</option>
                  <option value="ticket">Ticket</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">N° de Comprobante</label>
                <input v-model="form.nComprobante" class="form-input" placeholder="Ej: F001-0234" />
              </div>
              <div class="form-group">
                <label class="form-label">Archivo (opcional)</label>
                <button class="btn secondary btn-sm" style="height:38px" @click="fileInput?.click()">
                  <Upload style="width:13px;height:13px" />
                  {{ selectedFile || 'Adjuntar...' }}
                </button>
                <input ref="fileInput" type="file" accept="image/*,.pdf" style="display:none" @change="onFileChange" />
              </div>
            </div>

            <!-- Fila para agregar un ítem -->
            <div class="factura-item-row">
              <div class="form-group" style="flex:2">
                <label class="form-label required">Detalle / Producto</label>
                <input v-model="itemActual.concepto" class="form-input" placeholder="Ej: Arroz 50kg" @keyup.enter="agregarItem" />
              </div>
              <div class="form-group" style="flex:1">
                <label class="form-label required">Rubro</label>
                <select v-model="itemActual.rubro" class="form-input">
                  <option value="">Seleccionar...</option>
                  <option value="alimentos">Alimentos</option>
                  <option value="transporte">Transporte</option>
                  <option value="gas">Gas</option>
                  <option value="estipendio">Estipendio</option>
                  <option value="limpieza">Limpieza</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div class="form-group" style="flex:1">
                <label class="form-label required">Monto (S/)</label>
                <div class="monto-wrap">
                  <span class="monto-prefix">S/</span>
                  <input v-model.number="itemActual.monto" type="number" class="form-input monto-input"
                    placeholder="0.00" step="0.01" @keyup.enter="agregarItem" />
                </div>
              </div>
              <div class="form-group" style="padding-top:20px;flex-shrink:0">
                <button class="btn secondary btn-sm" @click="agregarItem">
                  <Plus class="btn-ico" /> Añadir
                </button>
              </div>
            </div>

            <!-- Lista acumulada de ítems -->
            <div v-if="itemsFactura.length > 0" class="items-factura">
              <div class="items-header">
                <span>{{ itemsFactura.length }} producto(s)</span>
                <strong>Total: {{ fmt(itemsFactura.reduce((s, i) => s + i.monto, 0)) }}</strong>
              </div>
              <div v-for="(item, idx) in itemsFactura" :key="idx" class="item-row">
                <span class="chip-rubro">{{ item.rubro }}</span>
                <span class="item-concepto">{{ item.concepto }}</span>
                <span class="item-monto">{{ fmt(item.monto) }}</span>
                <button class="item-del" @click="itemsFactura.splice(idx, 1)" title="Quitar">
                  <X style="width:12px;height:12px" />
                </button>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn primary" @click="registrarComprobante" :disabled="itemsFactura.length === 0 || guardandoMultiple">
                <Plus class="btn-ico" />
                {{ guardandoMultiple ? 'Registrando...' : `Registrar ${itemsFactura.length} gasto(s)` }}
              </button>
              <button class="btn secondary" @click="cancelarModoFactura">Cancelar</button>
            </div>
          </template>

          <!-- ══════════════ MODO NORMAL (sin cambios) ══════════════ -->
          <template v-else>
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
                  <option value="boleta_venta">Boleta de Venta</option>
                  <option value="recibo_gasto">Recibo de Gasto</option>
                  <option value="factura">Factura</option>
                  <option value="ticket">Ticket</option>
                </select>
              </div>
              <div class="form-group" v-if="form.tieneRuc">
                <label class="form-label required">N° de Comprobante</label>
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

            <div class="upload-zone" :class="{ 'upload-required': intentoGuardar && form.tieneRuc && !selectedFile }" @click="fileInput?.click()">
              <Upload class="upload-ico" />
              <div class="upload-text">
                <strong>Fotografía / PDF del comprobante</strong><br/>
                Haga clic o arrastre el archivo aquí
              </div>
              <input ref="fileInput" type="file" accept="image/*,.pdf" style="display:none" @change="onFileChange" />
            </div>

            <div v-if="previewUrl" class="preview-wrap">
              <button class="preview-close" @click="limpiarArchivo" title="Quitar archivo">
                <X style="width:14px;height:14px" />
              </button>
              <img v-if="previewTipo === 'imagen'" :src="previewUrl" class="preview-img" alt="Vista previa" />
              <iframe v-else :src="previewUrl" class="preview-pdf" />
              <div class="preview-label">
                <Paperclip style="width:13px;height:13px" /> {{ selectedFile }}
              </div>
            </div>
            <div v-if="selectedFile" class="file-ok">
              <CheckCircle class="file-ico" /> Archivo seleccionado: <strong>{{ selectedFile }}</strong>
            </div>

            <div class="form-actions">
              <div v-if="editandoId" class="edit-banner">
                <Pencil style="width:14px;height:14px" /> Editando gasto — los cambios reemplazarán el registro actual
              </div>
              <button class="btn primary" @click="agregarGasto">
                <component :is="editandoId ? Pencil : Plus" class="btn-ico" />
                {{ editandoId ? 'Actualizar Gasto' : 'Agregar Gasto' }}
              </button>
              <button v-if="editandoId && form.rubro === 'transporte'" class="btn secondary" @click="abrirEditarMovilidad">
                <MapPin class="btn-ico" /> Editar Puntos de Movilidad
              </button>
              <button v-if="editandoId" class="btn secondary" @click="cancelarEdicion">
                Cancelar Edición
              </button>
            </div>
          </template>
        </div>
    </div>

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
              <td>{{ g.fecha_documento }}</td>
              <td class="fw">{{ g.concepto }}</td>
              <td><span class="chip-rubro">{{ g.rubro }}</span></td>
              <td>
                <a
                  v-if="g.archivo_url"
                  :href="`http://localhost:3000${g.archivo_url}`"
                  target="_blank"
                  class="comp-link"
                  :title="`Descargar ${g.num_comprobante || 'comprobante'}`"
                >
                  <Paperclip class="comp-ico" />
                  {{ g.num_comprobante || 'DJ' }}
                </a>
                <span v-else style="color:#6b7597;font-size:12px">
                  {{ g.num_comprobante || 'DJ' }}
                </span>
              </td>
              <td class="fw">{{ fmt(g.monto) }}</td>
              <td style="color:#6b7597">{{ g.transferencia_id }}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="icon-btn edit" @click="editarGasto(g)" title="Editar">
                    <Pencil class="btn-ico" />
                  </button>
                  <button class="icon-btn" @click="eliminarGasto(g.id)" title="Eliminar"
                    :disabled="g.estado === 'aprobado'">
                    <Trash2 class="btn-ico" />
                  </button>
                </div>
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

    <BaseModal :open="showDJ" @close="cerrarDJ">
      <div class="modal-inner">
        <div class="modal-hd">
          <div class="modal-title">Declaración Jurada de Gastos</div>
          <button class="modal-close" @click="cerrarDJ"><X /></button>

        </div>
        <div class="info-alert">
          <Info class="alert-ico" />
          <span>Use este formulario cuando el proveedor no pueda emitir comprobante SUNAT.</span>
        </div>
        <div class="form-row r3" style="margin-bottom:14px">
          <div class="form-group">
            <label class="form-label required">Fecha</label>
            <input v-model="dj.fecha" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label required">Rubro</label>
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
            <label class="form-label required">Monto (S/)</label>
            <div class="monto-wrap">
              <span class="monto-prefix">S/</span>
              <input v-model.number="dj.monto" type="number" class="form-input monto-input" placeholder="0.00" step="0.01" />
            </div>
          </div>
        </div>

        <div class="form-row r3" style="margin-bottom:14px">
          <div class="form-group">
            <label class="form-label required">Nombre del Proveedor</label>
            <input v-model="dj.nombre_proveedor" class="form-input" placeholder="Nombre completo" />
          </div>
          <div class="form-group">
            <label class="form-label">DNI del Proveedor</label>
            <input v-model="dj.dni_proveedor" class="form-input" placeholder="Ej: 12345678" maxlength="8" />
          </div>
          <div class="form-group">
            <label class="form-label">Lugar</label>
            <input v-model="dj.lugar" class="form-input" placeholder="Ej: Mercado Central Pasaje 8" />
          </div>
        </div>

        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label required">Detalle / Descripción</label>
          <input v-model="dj.detalle" class="form-input" placeholder="Ej: Verduras y frutas de temporada" />
        </div>

        <button class="btn primary btn-sm" @click="agregarDJ" :disabled="store.loading">
          <Plus class="btn-ico" /> Registrar Gasto DJ
        </button>

        <table style="margin-top:14px;width:100%;border-collapse:collapse" v-if="djRegistros.length > 0">
          <thead>
            <tr><th>Fecha</th><th>Rubro</th><th>Proveedor</th><th>Detalle</th><th>Monto</th></tr>
          </thead>
          <tbody>
            <tr v-for="(r,i) in djRegistros" :key="i">
              <td>{{ r.fecha }}</td>
              <td style="text-transform:capitalize">{{ r.rubro }}</td>
              <td>{{ r.nombre_proveedor }}</td>
              <td>{{ r.detalle }}</td>
              <td>S/ {{ r.monto }}</td>
            </tr>
          </tbody>
        </table>

        <div class="modal-footer">
          <button class="btn secondary" @click="showDJ=false">Cerrar</button>
        </div>
      </div>
    </BaseModal>

    <BaseModal :open="showMovilidad" @close="cerrarMovilidad">
      <div class="modal-inner">
        <div class="modal-hd">
          <div class="modal-title">Planilla de Movilidad</div>
          <button class="modal-close" @click="cerrarMovilidad"><X /></button>
        </div>

        <div class="info-alert">
          <Info class="alert-ico" />
          <span>Complete los datos del recorrido. Fecha y monto se toman del formulario principal.</span>
        </div>

        <div class="form-row r3" style="margin-bottom:14px">
          <div class="form-group">
            <label class="form-label required">Punto Partida</label>
            <input v-model="mov.partida" class="form-input" placeholder="Ej: Pasaje 15" />
          </div>
          <div class="form-group">
            <label class="form-label required">Punto Llegada</label>
            <input v-model="mov.llegada" class="form-input" placeholder="Ej: Mercado Central" />
          </div>
          <div class="form-group">
            <label class="form-label required">IIEE</label>
            <select v-model="mov.iiee" class="form-input">
              <option>IE N° 20124</option>
              <option>IE N° 20089</option>
              <option>IE N° 30015</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label">Motivo del viaje</label>
          <input v-model="mov.motivo" class="form-input" placeholder="Ej: Traslado de insumos al mercado" />
        </div>

        <table style="margin-top:14px;width:100%;border-collapse:collapse" v-if="movRegistros.length > 0">
          <thead>
            <tr><th>Partida</th><th>Llegada</th><th>IIEE</th><th>Motivo</th></tr>
          </thead>
          <tbody>
            <tr v-for="(r,i) in movRegistros" :key="i">
              <td>{{ r.partida }}</td>
              <td>{{ r.llegada }}</td>
              <td>{{ r.iiee }}</td>
              <td>{{ r.motivo }}</td>
            </tr>
          </tbody>
        </table>

        <div class="modal-footer">
          <button class="btn secondary" @click="cerrarMovilidad">Cancelar</button>
          <button class="btn primary" @click="agregarMov">
            <Plus class="btn-ico" /> Confirmar y Registrar
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'

import { useRoute } from 'vue-router'
import { Plus, Trash2, Upload, CheckCircle, Info, Download, X, Paperclip, Pencil } from 'lucide-vue-next'
import { useGastosStore } from '@/stores/gastos.store'
import { useToastStore }  from '@/stores/toast.store'
import type { RubroGasto } from '@/types/rendicion'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'
import BaseModal   from '@/components/ui/overlay/BaseModal.vue'

const store = useGastosStore()
const toast = useToastStore()
const route = useRoute()
const intentoGuardar = ref(false)
const selectedTransfId = ref<any>(null)
const showDJ           = ref(false)
const showMovilidad    = ref(false)
const selectedFile     = ref('')
const archivoFile      = ref<File | null>(null)
const fileInput        = ref<HTMLInputElement>()
const montoError       = ref(false)
const presupInfo       = ref<any>(null)
const movilFlow = ref<'ruc' | 'dj' | null>(null)
const editandoId = ref<number | null>(null)

  const modoFactura      = ref(false)
const guardandoMultiple = ref(false)
const itemsFactura     = ref<{ concepto: string; rubro: string; monto: number }[]>([])
const itemActual       = reactive({ concepto: '', rubro: '', monto: 0 })

function agregarItem() {
  if (!itemActual.concepto || !itemActual.rubro || !itemActual.monto) {
    toast.warning('Completa el ítem', 'Detalle, rubro y monto son requeridos')
    return
  }
  itemsFactura.value.push({ ...itemActual })
  itemActual.concepto = ''
  itemActual.rubro    = ''
  itemActual.monto    = 0
}

async function registrarComprobante() {
  if (!form.nComprobante.trim() || !form.fecha) {
    toast.warning('Campos incompletos', 'Fecha y número de comprobante son requeridos')
    return
  }
  if (itemsFactura.value.length === 0) return

  guardandoMultiple.value = true
  try {
    for (const item of itemsFactura.value) {
      await store.registrarGasto({
        transferencia_id: selectedTransfId.value,
        fecha_documento:  form.fecha,
        concepto:         item.concepto,
        rubro:            item.rubro,
        tiene_ruc:        true,
        tipo_comprobante: form.tipoComprobante,
        num_comprobante:  form.nComprobante,
        monto:            item.monto,
      }, archivoFile.value)
    }
    toast.success('Gastos registrados', `${itemsFactura.value.length} ítems bajo comprobante ${form.nComprobante}`)
    await store.cargarGastos(selectedTransfId.value)
    cancelarModoFactura()
  } catch (e: any) {
    toast.error('Error', e.message)
  } finally {
    guardandoMultiple.value = false
  }
}

function cancelarModoFactura() {
  modoFactura.value      = false
  itemsFactura.value     = []
  itemActual.concepto    = ''
  itemActual.rubro       = ''
  itemActual.monto       = 0
  form.nComprobante      = ''
  limpiarArchivo()
}

const form = reactive({
  fecha: '', concepto: '', rubro: '' as RubroGasto,
  tieneRuc: true, tipoComprobante: 'boleta_venta', nComprobante: '', monto: 0,
  dj_nombre_proveedor: '', dj_dni_proveedor: '', dj_descripcion: '', dj_lugar: '',
  mov_punto_partida: '', mov_punto_llegada: '', mov_institucion_id: '',
  mov_motivo: '', mov_iiee: 'IE N° 20124'  
})

const dj = reactive({
  fecha: '',
  rubro: 'alimentos',
  detalle: '',
  monto: 0,
  nombre_proveedor: '',  
  dni_proveedor: '',    
  lugar: ''             
})
const mov = reactive({ 
  fecha: '', partida: '', llegada: '', 
  iiee: 'IE N° 20124', monto: 0,
  motivo: ''  
})
const djRegistros  = ref<any[]>([])
const movRegistros = ref<any[]>([])
const gastosActivos = computed(() => store.gastos)

const previewUrl  = ref<string>('')
const previewTipo = ref<'imagen' | 'pdf'>('imagen')

function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) {
    selectedFile.value = f.name
    archivoFile.value  = f

    // Revocar URL anterior si existe
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)

    previewUrl.value  = URL.createObjectURL(f)
    previewTipo.value = f.type === 'application/pdf' ? 'pdf' : 'imagen'
  }
}

function limpiarArchivo() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value   = ''
  selectedFile.value = ''
  archivoFile.value  = null
  if (fileInput.value) fileInput.value.value = ''
}

onMounted(async () => {
  form.fecha = new Date().toISOString().split('T')[0]
  dj.fecha   = form.fecha
  mov.fecha  = form.fecha

  await store.cargarTransferencias()

  if (route.query.transf) {
    selectedTransfId.value = route.query.transf
  } else if (store.transferencias.length > 0) {
    selectedTransfId.value = store.transferencias[0].id
  }
})

watch(selectedTransfId, async (id) => {
  if (id) await store.cargarGastos(id)
}, { immediate: true })

watch(() => form.tieneRuc, (val) => {
  if (!val) showDJ.value = true
})
watch(() => form.tieneRuc, (val) => {
  if (val) {
    form.dj_nombre_proveedor = ''
    form.dj_descripcion = ''
    form.dj_dni_proveedor = ''
    form.dj_lugar = ''
  }
})
watch([() => form.rubro, () => form.monto], async ([rubro, monto]) => {
  if (!rubro || !monto || !selectedTransfId.value) {
    presupInfo.value = null
    montoError.value = false
    return
  }
  const info = await store.checkPresupuesto(selectedTransfId.value, rubro, monto)
  presupInfo.value = info
  montoError.value = info.excede
})

function fmt(n: number) {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function abrirEditarMovilidad() {
  mov.partida = form.mov_punto_partida
  mov.llegada = form.mov_punto_llegada
  mov.motivo  = form.mov_motivo
  mov.iiee    = form.mov_iiee ?? 'IE N° 20124'
  movilFlow.value = 'ruc'
  showMovilidad.value = true
}

async function agregarGasto() {
  intentoGuardar.value = true

  if (!form.concepto || !form.rubro || !form.monto) {
    toast.warning('Campos incompletos', 'Complete todos los campos obligatorios')
    return
  }
  if (form.tieneRuc && !form.nComprobante.trim()) {
    toast.warning('Comprobante requerido', 'Ingrese el número de comprobante')
    return
  }
  if (form.tieneRuc && !archivoFile.value) {
    toast.warning('Archivo requerido', 'Debe adjuntar la foto o PDF del comprobante')
    return
  }
  if (montoError.value) {
    toast.error('Presupuesto excedido', 'El monto supera el saldo disponible del rubro')
    return
  }

  if (form.rubro === 'transporte' && !form.mov_punto_partida) {
    movilFlow.value = 'ruc'
    mov.fecha  = form.fecha
    mov.motivo = form.concepto
    showMovilidad.value = true
    return
  }

  if (!form.tieneRuc && !form.dj_nombre_proveedor) {
    showDJ.value = true
    toast.warning('Declaración Jurada requerida', 'Complete los datos del proveedor')
    return
  }

  await guardarGasto()
}
function cerrarDJ() {
  showDJ.value = false
  if (!form.dj_nombre_proveedor) {
    form.tieneRuc = true
  }
}

function cerrarMovilidad() {
  showMovilidad.value = false
  movilFlow.value = null
  if (!form.mov_punto_partida) {
    form.rubro = '' as RubroGasto
  }
  mov.partida = ''
  mov.llegada = ''
  mov.motivo  = ''
}
async function guardarGasto() {
  try {
    const payload: any = {
      transferencia_id: selectedTransfId.value,
      fecha_documento:  form.fecha,
      concepto:         form.concepto,
      rubro:            form.rubro,
      tiene_ruc:        form.tieneRuc,
      tipo_comprobante: form.tieneRuc
        ? (form.rubro === 'transporte' ? 'planilla_movilidad' : form.tipoComprobante)
        : 'declaracion_jurada',
      num_comprobante:  form.nComprobante || '',
      monto:            form.monto,
    }

    if (!form.tieneRuc) {
      payload.dj_nombre_proveedor = form.dj_nombre_proveedor
      payload.dj_dni_proveedor    = form.dj_dni_proveedor
      payload.dj_descripcion      = form.dj_descripcion
      payload.dj_lugar            = form.dj_lugar
    }

    if (form.rubro === 'transporte') {
      const iieeMap: Record<string, number> = {
        'IE N° 20124': 1, 'IE N° 20089': 2, 'IE N° 30015': 3,
      }
      payload.mov_punto_partida  = form.mov_punto_partida
      payload.mov_punto_llegada  = form.mov_punto_llegada
      payload.mov_institucion_id = iieeMap[form.mov_iiee ?? 'IE N° 20124'] ?? 1
      payload.mov_motivo         = form.mov_motivo
      payload.tipo_comprobante   = 'planilla_movilidad'
    }

    if (editandoId.value) {
      await store.actualizarGasto(editandoId.value, payload, archivoFile.value)
      toast.success('Gasto actualizado', 'Los cambios fueron guardados')
    } else {
      const result = await store.registrarGasto(payload, archivoFile.value)
      if (result.advertencia) toast.warning('Advertencia', result.advertencia)
      else toast.success('Gasto registrado', 'El gasto fue agregado correctamente')
    }

    await store.cargarGastos(selectedTransfId.value)
    cancelarEdicion()
    presupInfo.value = null; montoError.value = false
    movilFlow.value = null

  } catch (e: any) {
    toast.error('Error', e.message)
  }
}
async function eliminarGasto(id: number) {
  try {
    await store.eliminarGasto(id)
    toast.success('Gasto eliminado')
  } catch (e: any) {
    toast.error('Error', e.message)
  }
}

async function agregarDJ() {
  if (!dj.fecha || !dj.detalle || !dj.monto || !dj.nombre_proveedor) {
    toast.warning('Campos incompletos', 'Complete fecha, proveedor, detalle y monto')
    return
  }

  if (dj.rubro === 'transporte' && !form.mov_punto_partida) {
    movilFlow.value = 'dj'
    mov.fecha  = dj.fecha
    mov.motivo = dj.detalle
    showMovilidad.value = true
    return
  }

  await guardarDJ()
}
async function guardarDJ() {
  try {
    const iieeMap: Record<string, number> = {
      'IE N° 20124': 1, 'IE N° 20089': 2, 'IE N° 30015': 3,
    }

    const payload: any = {
      transferencia_id:    selectedTransfId.value,
      fecha_documento:     dj.fecha,
      concepto:            dj.detalle.toUpperCase(),
      rubro:               dj.rubro,
      tiene_ruc:           false,
      tipo_comprobante:    dj.rubro === 'transporte' ? 'planilla_movilidad' : 'declaracion_jurada',
      monto:               dj.monto,
      dj_nombre_proveedor: dj.nombre_proveedor,
      dj_dni_proveedor:    dj.dni_proveedor,
      dj_descripcion:      dj.detalle,
      dj_lugar:            dj.lugar,
    }

    if (dj.rubro === 'transporte') {
      payload.mov_punto_partida  = form.mov_punto_partida
      payload.mov_punto_llegada  = form.mov_punto_llegada
      payload.mov_institucion_id = iieeMap[form.mov_iiee ?? 'IE N° 20124'] ?? 1
      payload.mov_motivo         = form.mov_motivo
    }

    await store.registrarGasto(payload, null)
    djRegistros.value.unshift({ ...dj })
    await store.cargarGastos(selectedTransfId.value)

    dj.detalle = ''; dj.monto = 0
    dj.nombre_proveedor = ''; dj.dni_proveedor = ''; dj.lugar = ''
    form.mov_punto_partida = ''; form.mov_punto_llegada = ''
    movilFlow.value = null

    toast.success('Gasto DJ registrado', 'Aparece en la tabla principal')
  } catch (e: any) {
    toast.error('Error', e.message)
  }
}

async function guardarDJConMovilidad() {
  await guardarDJ()
}
function editarGasto(g: any) {
  editandoId.value = g.id
  form.fecha        = g.fecha_documento?.split('T')[0] ?? ''
  form.concepto     = g.concepto
  form.rubro        = g.rubro
  form.tieneRuc     = g.tiene_ruc === true || g.tiene_ruc === 1
  form.tipoComprobante = g.tipo_comprobante ?? 'boleta_venta'
  form.nComprobante = g.num_comprobante ?? ''
  form.monto        = g.monto

  form.dj_nombre_proveedor = g.nombre_proveedor ?? ''
  form.dj_descripcion      = g.dj_descripcion   ?? ''
  form.dj_dni_proveedor    = g.dni_proveedor     ?? ''

  form.mov_punto_partida = g.punto_partida ?? ''
  form.mov_punto_llegada = g.punto_llegada ?? ''
  form.mov_motivo        = g.mov_motivo    ?? ''

  window.scrollTo({ top: 0, behavior: 'smooth' })
  toast.success('Modo edición', `Editando: ${g.concepto}`)
}

function cancelarEdicion() {
  editandoId.value  = null
  form.concepto     = ''
  form.monto        = 0
  form.nComprobante = ''
  form.rubro        = '' as RubroGasto
  form.tieneRuc     = true
  selectedFile.value = ''
  archivoFile.value  = null
  intentoGuardar.value = false
  limpiarArchivo()
}

async function agregarMov() {
  if (!mov.partida || !mov.llegada || !mov.iiee) {
    toast.warning('Campos incompletos', 'Complete partida, llegada e IIEE')
    return
  }

  form.mov_punto_partida = mov.partida
  form.mov_punto_llegada = mov.llegada
  form.mov_iiee          = mov.iiee
  form.mov_motivo        = mov.motivo

  showMovilidad.value = false

  if (movilFlow.value === 'ruc') {
    await guardarGasto()
  } else if (movilFlow.value === 'dj') {
    await guardarDJConMovilidad()
  }

  mov.partida = ''; mov.llegada = ''; mov.motivo = ''
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
thead th { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#1a1a1b; padding:10px 16px; border-bottom:1px solid #d4dae8; background:#fafbfd; text-align:left; }
tbody td { padding:11px 16px; font-size:13.5px; border-bottom:1px solid #f0f2f8; }
tbody tr:last-child td { border-bottom:none; }
tbody tr:hover { background:#f0f4ff; }
td.fw { font-weight:700; }
td.empty { text-align:center; color:#6b7597; padding:24px; }
.icon-btn { background:#fee2e2; border:none; border-radius:7px; padding:5px; cursor:pointer; display:flex; align-items:center; color:#dc2626; transition:all .15s; }
.icon-btn:hover { background:#dc2626; color:#fff; }
.chip-rubro { background:#e8edf9; color:#2c4fd4; padding:2px 8px; border-radius:6px; font-size:11.5px; font-weight:700; text-transform:capitalize; }

.modal-inner { }
.modal-hd { display:flex; align-items:center; justify-content:space-between; padding-bottom:14px; border-bottom:1px solid #d4dae8; margin-bottom:16px; }
.modal-title { font-size:16px; font-weight:700; color:#1a2340; }
.modal-close { background:none; border:none; cursor:pointer; color:#6b7597; }
.modal-footer { display:flex; gap:8px; justify-content:flex-end; margin-top:16px; padding-top:14px; border-top:1px solid #d4dae8; }
.info-alert { display:flex; gap:10px; align-items:flex-start; background:#e8edf9; border:1px solid #93c5fd; border-radius:8px; padding:10px 14px; margin-bottom:14px; font-size:12.5px; color:#1a2f6e; }
.alert-ico { width:16px; height:16px; flex-shrink:0; margin-top:1px; }
.upload-zone.upload-required {
  border-color: #dc2626;
  background: #fff5f5;
}
td{
  color:rgb(124, 123, 123);
}
.upload-zone.upload-required .upload-text strong {
  color: #dc2626;
}
.upload-zone.upload-required::after {
  content: ' *';
  color: #dc2626;
  font-weight: 700;
}
.comp-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #2c4fd4;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  padding: 3px 8px;
  background: #e8edf9;
  border-radius: 6px;
  transition: all .15s;
}
.comp-link:hover {
  background: #2c4fd4;
  color: #fff;
}
.comp-ico {
  width: 12px;
  height: 12px;
}
.icon-btn.edit {
  background: #e8edf9;
  color: #2c4fd4;
}
.icon-btn.edit:hover {
  background: #2c4fd4;
  color: #fff;
}
.edit-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  color: #b45309;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12.5px;
  font-weight: 600;
  width: 100%;
  margin-bottom: 8px;
}
.preview-wrap {
  position: relative;
  margin-top: 12px;
  border: 1.5px solid #d4dae8;
  border-radius: 10px;
  overflow: hidden;
  background: #fafbfd;
}
.preview-close {
  position: absolute;
  top: 8px; right: 8px;
  background: rgba(220,38,38,.9);
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  z-index: 10;
  transition: background .15s;
}
.preview-close:hover { background: #b91c1c; }
.preview-img {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  display: block;
  background: #f0f2f8;
}
.preview-pdf {
  width: 100%;
  height: 340px;
  border: none;
  display: block;
}
.preview-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 12px;
  color: #6b7597;
  font-weight: 600;
  border-top: 1px solid #d4dae8;
  background: #fff;
}
.factura-toggle-wrap { margin-bottom: 18px; }
.factura-toggle {
  display: inline-flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 600; color: #1a2340; cursor: pointer;
  background: #f0f4ff; border: 1.5px solid #d4dae8;
  border-radius: 8px; padding: 8px 14px; transition: all .2s;
}
.factura-toggle.active { background: #dbeafe; border-color: #2c4fd4; color: #1a2f6e; }
.toggle-track {
  width: 34px; height: 18px; background: #d4dae8;
  border-radius: 9px; position: relative; transition: background .2s; flex-shrink: 0;
}
.factura-toggle.active .toggle-track { background: #2c4fd4; }
.toggle-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 14px; height: 14px; background: #fff;
  border-radius: 50%; transition: left .2s;
}
.factura-toggle.active .toggle-thumb { left: 18px; }
.factura-item-row {
  display: flex; gap: 12px; align-items: flex-end;
  margin-top: 16px; background: #fafbfd;
  border: 1px solid #d4dae8; border-radius: 10px; padding: 14px;
}
.items-factura {
  margin-top: 14px;
  border: 1.5px solid #2c4fd4;
  border-radius: 10px; overflow: hidden;
}
.items-header {
  display: flex; justify-content: space-between; align-items: center;
  background: #e8edf9; padding: 8px 14px;
  font-size: 12.5px; color: #1a2f6e;
}
.item-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px; border-top: 1px solid #f0f2f8;
  font-size: 13px;
}
.item-concepto { flex: 1; color: #1a2340; font-weight: 600; }
.item-monto { color: #1a2340; font-weight: 700; min-width: 90px; text-align: right; }
.item-del {
  background: #fee2e2; border: none; border-radius: 5px;
  padding: 4px; cursor: pointer; display: flex; color: #dc2626; transition: all .15s;
}
.item-del:hover { background: #dc2626; color: #fff; }
</style>
