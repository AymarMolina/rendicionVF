<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Gastos y Comprobantes</h1>
        <p class="page-sub">Registre los gastos de la transferencia seleccionada</p>
      </div>
    </div>

    <RendicionStepper
      v-if="transfActual?.estado"
      :estado="transfActual?.estado ?? ''"
      :tiene-gastos="gastosActivos.length > 0"
    />

    <!-- Selector de transferencia -->
    <div class="transf-selector-bar">
      <div class="nivel-pills">
        <button class="pill" :class="{ active: nivelFiltro === '' }" @click="nivelFiltro = ''">Todos</button>
        <button
          v-for="n in nivelesDisponibles" :key="n"
          class="pill" :class="[{ active: nivelFiltro === n }, n]"
          @click="nivelFiltro = nivelFiltro === n ? '' : n"
        >
          {{ nivelLabel(n) }}<span class="pill-cod">{{ codigoModularDe(n) }}</span>
        </button>
      </div>
      <select v-model="selectedTransfId" class="transf-select">
        <option v-for="t in transfFiltradas" :key="t.id" :value="t.id">
          {{ t.codigo }} · Transf. {{ t.numero }}/{{ t.num_transferencias }}
          · {{ nivelLabel(t.nivel) }} · {{ fmt(t.monto) }} ({{ t.estado }})
        </option>
      </select>
    </div>

    <!-- Info bar -->
    <div class="transf-info-bar" v-if="transfActual">
      <span class="nivel-badge" :class="transfActual.nivel">{{ nivelLabel(transfActual.nivel) }}</span>
      <span class="cod-modular">{{ transfActual.codigo_modular }}</span>
      <span class="sep">·</span>
      <span class="transf-cod">{{ transfActual.codigo }}</span>
      <span class="transf-counter">Transferencia {{ transfActual.numero }}/{{ transfActual.num_transferencias }}</span>
      <span class="sep">·</span>
      <span class="ciclo-txt">{{ transfActual.ciclo }}</span>
      <span class="sep">·</span>
      <span class="monto-txt">{{ fmt(transfActual.monto) }}</span>
      <StatusBadge :status="transfActual.estado" style="margin-left:auto" />
    </div>

    <!-- Banner de bloqueo cuando la transferencia está aprobada -->
    <div v-if="bloqueado" class="aprobada-banner">
      <CheckCircle style="width:16px;height:16px;flex-shrink:0" />
      Esta transferencia ya fue <strong>aprobada</strong> — no se pueden registrar, editar ni eliminar gastos.
    </div>

    <!-- ══════════════════════════════════════════════════
         FORMULARIO PRINCIPAL
         ══════════════════════════════════════════════════ -->
    <div class="card mb" v-if="!bloqueado">
      <div class="card-header">
        <span class="card-title-sm">
          {{ editandoId ? 'Editando Gasto' : 'Registrar Nuevo Gasto' }}
        </span>
        <!-- Toggle modo factura (solo en modo nuevo) -->
        <label v-if="!editandoId" class="factura-toggle" :class="{ active: modoFactura }">
          <input type="checkbox" v-model="modoFactura" style="display:none" />
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span style="font-size:12.5px">Varios productos, un comprobante</span>
        </label>
      </div>

      <div class="card-body">

        <!-- ── MODO FACTURA MÚLTIPLE ──────────────────────────────── -->
        <template v-if="modoFactura">
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
                <Upload style="width:13px;height:13px" /> {{ selectedFile || 'Adjuntar...' }}
              </button>
              <input ref="fileInput" type="file" accept="image/*,.pdf" style="display:none" @change="onFileChange" />
            </div>
          </div>
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
                <input v-model.number="itemActual.monto" type="number" class="form-input monto-input" placeholder="0.00" step="0.01" @keyup.enter="agregarItem" />
              </div>
            </div>
            <div class="form-group" style="padding-top:20px;flex-shrink:0">
              <button class="btn secondary btn-sm" @click="agregarItem"><Plus class="btn-ico" /> Añadir</button>
            </div>
          </div>
          <div v-if="itemsFactura.length > 0" class="items-factura">
            <div class="items-header">
              <span>{{ itemsFactura.length }} producto(s)</span>
              <strong>Total: {{ fmt(itemsFactura.reduce((s, i) => s + i.monto, 0)) }}</strong>
            </div>
            <div v-for="(item, idx) in itemsFactura" :key="idx" class="item-row">
              <span class="chip-rubro">{{ item.rubro }}</span>
              <span class="item-concepto">{{ item.concepto }}</span>
              <span class="item-monto">{{ fmt(item.monto) }}</span>
              <button class="item-del" @click="itemsFactura.splice(idx, 1)"><X style="width:12px;height:12px" /></button>
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

        <!-- ── FORMULARIO SIMPLE (modo normal) ───────────────────── -->
        <template v-else>

          <!-- Fila 1: fecha · detalle · rubro -->
          <div class="form-row r3">
            <div class="form-group">
              <label class="form-label required">Fecha de documento</label>
              <input v-model="form.fecha" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label required">
                {{ form.rubro === 'transporte' ? 'Motivo del viaje' : 'Detalle / Producto' }}
              </label>
              <input
                v-model="form.concepto"
                type="text"
                class="form-input"
                :placeholder="form.rubro === 'transporte'
                  ? 'Ej: Traslado de insumos al mercado'
                  : 'Ej: Verduras mercado central'"
              />
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

          <!-- ── SECCIÓN TRANSPORTE (inline) ──────────────────────── -->
          <transition name="slide-in">
            <div v-if="form.rubro === 'transporte'" class="inline-section transport-section">
              <div class="inline-section-header">
                <MapPin style="width:14px;height:14px" />
                Planilla de Movilidad
              </div>
              <div class="form-row r3">
                <div class="form-group">
                  <label class="form-label required">Punto de Partida</label>
                  <input v-model="form.mov_punto_partida" class="form-input" placeholder="Ej: Pasaje 15 - Av. San Juan" />
                </div>
                <div class="form-group">
                  <label class="form-label required">Punto de Llegada</label>
                  <input v-model="form.mov_punto_llegada" class="form-input" placeholder="Ej: IE N° 20124 - Inicial" />
                </div>
                <div class="form-group">
                  <label class="form-label required">Módulo</label>
                  <select v-model="form.mov_modulo_id" class="form-input">
                    <option :value="0" disabled>Seleccionar...</option>
                    <option v-for="m in auth.modulos" :key="m.modulo_id" :value="m.modulo_id">
                      {{ nivelLabel(m.nivel) }} · {{ m.codigo_modular }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </transition>

          <!-- Fila 2: ¿Tiene RUC? · tipo · N° · monto -->
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
            <template v-if="form.tieneRuc">
              <div class="form-group">
                <label class="form-label">Tipo Comprobante</label>
                <select v-model="form.tipoComprobante" class="form-input">
                  <option value="boleta_venta">Boleta de Venta</option>
                  <option value="recibo_gasto">Recibo de Gasto</option>
                  <option value="factura">Factura</option>
                  <option value="ticket">Ticket</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">N° de Comprobante</label>
                <input v-model="form.nComprobante" class="form-input" placeholder="Ej: E001-582" />
              </div>
            </template>
            <div class="form-group" :style="form.tieneRuc ? '' : 'grid-column: 2 / span 3'">
              <label class="form-label required">Monto (S/)</label>
              <div class="monto-wrap">
                <span class="monto-prefix">S/</span>
                <input v-model.number="form.monto" type="number" class="form-input monto-input" placeholder="0.00" step="0.01" />
              </div>
              <div v-if="montoError" class="form-error">⚠ Estás excediendo el monto por rubro establecido</div>
            </div>
          </div>

          <!-- ── SECCIÓN DJ (inline, cuando NO tiene RUC) ───────────── -->
          <transition name="slide-in">
            <div v-if="!form.tieneRuc" class="inline-section dj-section">
              <div class="inline-section-header">
                <FileSignature style="width:14px;height:14px" />
                Declaración Jurada — proveedor sin RUC
              </div>

              <!-- Progress bar DJ -->
              <div v-if="djPresupInfo" class="dj-progress-wrap">
                <div class="dj-progress-header">
                  <span class="dj-progress-label">
                    DJs acumuladas en <strong>{{ form.rubro || '—' }}</strong>
                  </span>
                  <span class="dj-progress-pct"
                    :class="{
                      'pct-ok':   djPresupInfo.pctProyectado < 80,
                      'pct-warn': djPresupInfo.pctProyectado >= 80 && !djPresupInfo.excedeDJ,
                      'pct-over': djPresupInfo.excedeDJ
                    }"
                  >{{ djPresupInfo.pctProyectado.toFixed(0) }}%</span>
                </div>
                <div class="dj-progress-bar-bg">
                  <div class="dj-progress-bar-fill"
                    :class="{
                      'fill-ok':   djPresupInfo.pctProyectado < 80,
                      'fill-warn': djPresupInfo.pctProyectado >= 80 && !djPresupInfo.excedeDJ,
                      'fill-over': djPresupInfo.excedeDJ
                    }"
                    :style="{ width: Math.min(djPresupInfo.pctProyectado, 100) + '%' }"
                  ></div>
                </div>
                <div class="dj-progress-legend">
                  <span>Gastado DJ: <strong>{{ fmt(djPresupInfo.gastadoDJ) }}</strong></span>
                  <span>+Este gasto: <strong>{{ fmt(form.monto || 0) }}</strong></span>
                  <span>Límite 10%: <strong>{{ fmt(djPresupInfo.limiteDP) }}</strong></span>
                </div>
                <div v-if="djPresupInfo.excedeDJ" class="dj-over-alert">
                  <span>✕</span> Límite DJ excedido — no se puede registrar este gasto sin RUC
                </div>
                <div v-else-if="djPresupInfo.pctProyectado >= 80" class="dj-warn-alert">
                  <span>⚠</span> Usando más del 80% del límite permitido para DJ en este rubro
                </div>
              </div>

              <div class="form-row r3">
                <div class="form-group">
                  <label class="form-label required">Nombre del Proveedor</label>
                  <input v-model="form.dj_nombre_proveedor" class="form-input" placeholder="Nombre completo" />
                </div>
                <div class="form-group">
                  <label class="form-label">DNI del Proveedor</label>
                  <input v-model="form.dj_dni_proveedor" class="form-input" placeholder="Ej: 12345678" maxlength="8" />
                </div>
                <div class="form-group">
                  <label class="form-label">Lugar</label>
                  <input v-model="form.dj_lugar" class="form-input" placeholder="Ej: Mercado Central Pasaje 8" />
                </div>
              </div>
            </div>
          </transition>

          <!-- Upload comprobante (solo si tiene RUC y rubro no es transporte) -->
          <template v-if="form.tieneRuc">
            <div
              class="upload-zone"
              :class="{ 'upload-required': intentoGuardar && !selectedFile && !editandoId }"
              @click="fileInput?.click()"
              style="margin-top:16px"
            >
              <Upload class="upload-ico" />
              <div class="upload-text">
                <strong>Fotografía / PDF del comprobante</strong><br/>
                Haga clic o arrastre el archivo aquí
              </div>
              <input ref="fileInput" type="file" accept="image/*,.pdf" style="display:none" @change="onFileChange" />
            </div>
            <div v-if="previewUrl" class="preview-wrap">
              <button class="preview-close" @click="limpiarArchivo"><X style="width:14px;height:14px" /></button>
              <img v-if="previewTipo === 'imagen'" :src="previewUrl" class="preview-img" alt="Vista previa" />
              <iframe v-else :src="previewUrl" class="preview-pdf" />
              <div class="preview-label"><Paperclip style="width:13px;height:13px" /> {{ selectedFile }}</div>
            </div>
            <div v-else-if="selectedFile" class="file-ok">
              <CheckCircle class="file-ico" /> Archivo seleccionado: <strong>{{ selectedFile }}</strong>
            </div>
          </template>

          <!-- Acciones -->
          <div class="form-actions">
            <div v-if="editandoId" class="edit-banner">
              <Pencil style="width:14px;height:14px" /> Editando gasto — los cambios reemplazarán el registro actual
            </div>
            <button
              class="btn primary"
              @click="agregarGasto"
              :disabled="!form.tieneRuc && (djPresupInfo?.excedeDJ ?? false)"
            >
              <component :is="editandoId ? Pencil : Plus" class="btn-ico" />
              {{ editandoId ? 'Actualizar Gasto' : 'Agregar Gasto' }}
            </button>
            <button v-if="editandoId" class="btn secondary" @click="cancelarEdicion">Cancelar Edición</button>
          </div>
        </template>

      </div>
    </div>

    <!-- Tabla de gastos -->
    <div class="card">
      <div class="card-header">
        <span class="card-title-sm">Gastos Registrados</span>
        <span style="font-size:12px;color:#6b7597">Ordenados cronológicamente</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Rubro</th>
              <th>Comprobante</th>
              <th>Monto</th>
              <th>Transferencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in gastosActivos" :key="g.id">
              <td>{{ fmtFecha(g.fecha_documento) }}</td>
              <td class="fw">{{ g.concepto }}</td>
              <td><span class="chip-rubro">{{ g.rubro }}</span></td>
              <td>
                <a v-if="g.archivo_url" :href="`http://localhost:3000${g.archivo_url}`" target="_blank" class="comp-link">
                  <Paperclip class="comp-ico" />{{ g.num_comprobante || 'DJ' }}
                </a>
                <span v-else style="color:#6b7597;font-size:12px">{{ g.num_comprobante || 'DJ' }}</span>
              </td>
              <td class="fw">{{ fmt(g.monto) }}</td>
              <td>
                <div class="transf-cell-mini">
                  <span class="nivel-badge sm" :class="g.nivel">{{ nivelLabel(g.nivel) }}</span>
                  <span class="transf-cod-sm">{{ g.codigo_transferencia }}</span>
                </div>
              </td>
              <td><StatusBadge :status="g.estado" /></td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="icon-btn edit" @click="editarGasto(g)" title="Editar" :disabled="bloqueado || g.estado === 'aprobado'"><Pencil class="btn-ico" /></button>
                  <button class="icon-btn" @click="eliminarGasto(g.id)" title="Eliminar" :disabled="bloqueado || g.estado === 'aprobado'">
                    <Trash2 class="btn-ico" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="gastosActivos.length === 0">
              <td colspan="8" class="empty">No hay gastos registrados para esta transferencia</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Trash2, Upload, CheckCircle, X, Paperclip, Pencil, MapPin } from 'lucide-vue-next'
import { useGastosStore } from '@/stores/gastos.store'
import { useAuthStore }   from '@/stores/auth.store'
import { useToastStore }  from '@/stores/toast.store'
import type { RubroGasto } from '@/types/rendicion'
import StatusBadge      from '@/components/ui/shared/StatusBadge.vue'
import RendicionStepper from '@/components/ui/shared/RendicionStepper.vue'

// FileSignature no existe en lucide-vue-next, usamos FileText como fallback
import { FileText as FileSignature } from 'lucide-vue-next'

const store = useGastosStore()
const auth  = useAuthStore()
const toast = useToastStore()
const route = useRoute()

const selectedTransfId  = ref<any>(null)
const nivelFiltro       = ref('')
const intentoGuardar    = ref(false)
const selectedFile      = ref('')
const archivoFile       = ref<File | null>(null)
const fileInput         = ref<HTMLInputElement>()
const montoError        = ref(false)
const presupInfo        = ref<any>(null)
const editandoId        = ref<number | null>(null)
const modoFactura       = ref(false)
const guardandoMultiple = ref(false)
const itemsFactura      = ref<{ concepto: string; rubro: string; monto: number }[]>([])
const itemActual        = reactive({ concepto: '', rubro: '', monto: 0 })
const previewUrl        = ref('')
const previewTipo       = ref<'imagen' | 'pdf'>('imagen')

// Progress bar DJ (calculado en tiempo real)
const djPresupInfo = ref<{
  gastadoDJ: number
  limiteDP: number
  pctProyectado: number
  excedeDJ: boolean
} | null>(null)

const form = reactive({
  fecha: '',
  concepto: '',
  rubro: '' as RubroGasto,
  tieneRuc: true,
  tipoComprobante: 'boleta_venta',
  nComprobante: '',
  monto: 0,
  // DJ
  dj_nombre_proveedor: '',
  dj_dni_proveedor: '',
  dj_descripcion: '',
  dj_lugar: '',
  // Movilidad
  mov_punto_partida: '',
  mov_punto_llegada: '',
  mov_modulo_id: 0,
  mov_motivo: ''
})

// ── Watchers ───────────────────────────────────────────────────────────────

// Presupuesto del rubro (para el error de exceso)
watch([() => form.rubro, () => form.monto], async ([rubro, monto]) => {
  if (!rubro || !monto || !selectedTransfId.value) {
    presupInfo.value = null; montoError.value = false; return
  }
  const info = await store.checkPresupuesto(selectedTransfId.value, rubro, monto)
  presupInfo.value = info
  montoError.value = info.excede
})

// DJ progress bar: se recalcula cuando cambia rubro, monto o tieneRuc
watch(
  [() => form.rubro, () => form.monto, () => form.tieneRuc],
  async ([rubro, monto, tieneRuc]) => {
    if (tieneRuc || !rubro || !selectedTransfId.value) {
      djPresupInfo.value = null; return
    }
    const info = await store.checkPresupuesto(selectedTransfId.value, rubro, 0)
    const proyectado = info.gastadoDJ + (monto || 0)
    const pct        = info.limiteDP > 0 ? (proyectado / info.limiteDP) * 100 : 0
    djPresupInfo.value = {
      gastadoDJ:     info.gastadoDJ,
      limiteDP:      info.limiteDP,
      pctProyectado: pct,
      excedeDJ:      proyectado > info.limiteDP
    }
  }
)

// Módulo por defecto al seleccionar transporte
watch(() => form.rubro, (rubro) => {
  if (rubro === 'transporte' && !form.mov_modulo_id) {
    form.mov_modulo_id = auth.moduloPrimario?.modulo_id ?? 0
  }
})

// Sincronizar concepto → mov_motivo (son el mismo campo)
// El "detalle" ya sirve como motivo del viaje para transporte

watch(() => form.tieneRuc, (val) => {
  if (val) {
    // Limpiar datos DJ al volver a RUC
    form.dj_nombre_proveedor = ''
    form.dj_dni_proveedor    = ''
    form.dj_descripcion      = ''
    form.dj_lugar            = ''
    djPresupInfo.value       = null
  }
})

// ── Helpers ────────────────────────────────────────────────────────────────
function nivelLabel(nivel: string) {
  return ({ inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' })[nivel] ?? nivel
}
function fmt(n: number) {
  return 'S/ ' + (n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtFecha(f: string) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const nivelesDisponibles = computed(() => {
  const set = new Set<string>()
  store.transferencias.forEach(t => { if (t.nivel) set.add(t.nivel) })
  return ['inicial', 'primaria', 'secundaria'].filter(n => set.has(n))
})
function codigoModularDe(nivel: string) {
  return store.transferencias.find(t => t.nivel === nivel)?.codigo_modular ?? ''
}
const transfFiltradas = computed(() =>
  nivelFiltro.value
    ? store.transferencias.filter(t => t.nivel === nivelFiltro.value)
    : store.transferencias
)
const transfActual = computed(() =>
  store.transferencias.find(t => t.id == selectedTransfId.value) ?? null
)
const gastosActivos = computed(() => store.gastos)

// Bloquear todo el formulario si la transferencia ya fue aprobada
const bloqueado = computed(() =>
  transfActual.value?.estado === 'aprobada'
)

function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  selectedFile.value = f.name
  archivoFile.value  = f
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value  = URL.createObjectURL(f)
  previewTipo.value = f.type === 'application/pdf' ? 'pdf' : 'imagen'
}
function limpiarArchivo() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''; selectedFile.value = ''; archivoFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// ── Modo factura múltiple ──────────────────────────────────────────────────
function agregarItem() {
  if (!itemActual.concepto || !itemActual.rubro || !itemActual.monto) {
    toast.warning('Completa el ítem', 'Detalle, rubro y monto son requeridos'); return
  }
  itemsFactura.value.push({ ...itemActual })
  itemActual.concepto = ''; itemActual.rubro = ''; itemActual.monto = 0
}
async function registrarComprobante() {
  if (!form.nComprobante.trim() || !form.fecha) {
    toast.warning('Campos incompletos', 'Fecha y número de comprobante son requeridos'); return
  }
  if (itemsFactura.value.length === 0) return
  guardandoMultiple.value = true
  try {
    await store.registrarGasto({
      transferencia_id: selectedTransfId.value,
      fecha_documento:  form.fecha,
      tiene_ruc:        true,
      tipo_comprobante: form.tipoComprobante,
      num_comprobante:  form.nComprobante,
      items:            itemsFactura.value,
    }, archivoFile.value)
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
  modoFactura.value = false; itemsFactura.value = []
  itemActual.concepto = ''; itemActual.rubro = ''; itemActual.monto = 0
  form.nComprobante = ''; limpiarArchivo()
}

// ── Guardar gasto simple ───────────────────────────────────────────────────
async function agregarGasto() {
  intentoGuardar.value = true

  if (!form.concepto || !form.rubro || !form.monto) {
    toast.warning('Campos incompletos', 'Complete todos los campos obligatorios'); return
  }
  if (form.tieneRuc && !form.nComprobante.trim()) {
    toast.warning('Comprobante requerido', 'Ingrese el número de comprobante'); return
  }
  if (form.tieneRuc && !archivoFile.value && !editandoId.value) {
    toast.warning('Archivo requerido', 'Debe adjuntar la foto o PDF del comprobante'); return
  }
  if (montoError.value) {
    toast.error('Presupuesto excedido', 'El monto supera el saldo disponible del rubro'); return
  }
  if (form.rubro === 'transporte' && (!form.mov_punto_partida || !form.mov_punto_llegada)) {
    toast.warning('Movilidad incompleta', 'Complete punto de partida y llegada'); return
  }
  if (!form.tieneRuc) {
    if (!form.dj_nombre_proveedor.trim()) {
      toast.warning('DJ incompleta', 'Ingrese el nombre del proveedor'); return
    }
    if (djPresupInfo.value?.excedeDJ) {
      toast.error('Límite DJ excedido', 'Las DJs del rubro no pueden superar el 10% del presupuesto'); return
    }
  }

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
      num_comprobante: form.nComprobante || '',
      monto:           form.monto,
    }
    if (!form.tieneRuc) {
      payload.dj_nombre_proveedor = form.dj_nombre_proveedor
      payload.dj_dni_proveedor    = form.dj_dni_proveedor
      // El detalle/concepto ya es la descripción del gasto
      payload.dj_descripcion      = form.concepto
      payload.dj_lugar            = form.dj_lugar
    }
    if (form.rubro === 'transporte') {
      payload.mov_punto_partida  = form.mov_punto_partida
      payload.mov_punto_llegada  = form.mov_punto_llegada
      payload.mov_institucion_id = form.mov_modulo_id
      // El campo concepto/detalle ya es el motivo del viaje
      payload.mov_motivo         = form.concepto
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

// ── Editar ─────────────────────────────────────────────────────────────────
function editarGasto(g: any) {
  editandoId.value         = g.id
  form.fecha               = g.fecha_documento?.split('T')[0] ?? ''
  form.concepto            = g.concepto
  form.rubro               = g.rubro
  form.tieneRuc            = g.tiene_ruc === true || g.tiene_ruc === 1
  form.tipoComprobante     = g.tipo_comprobante ?? 'boleta_venta'
  form.nComprobante        = g.num_comprobante ?? ''
  form.monto               = g.monto
  form.dj_nombre_proveedor = g.dj_nombre_proveedor ?? ''
  form.dj_descripcion      = g.dj_descripcion      ?? ''
  form.dj_dni_proveedor    = g.dni_proveedor        ?? ''
  form.dj_lugar            = g.dj_lugar             ?? ''
  form.mov_punto_partida   = g.punto_partida        ?? ''
  form.mov_punto_llegada   = g.punto_llegada        ?? ''
  form.mov_modulo_id       = g.modulo_id            ?? auth.moduloPrimario?.modulo_id ?? 0
  form.mov_motivo          = g.mov_motivo           ?? ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
  toast.success('Modo edición', `Editando: ${g.concepto}`)
}

function cancelarEdicion() {
  editandoId.value = null
  form.concepto = ''; form.monto = 0; form.nComprobante = ''
  form.rubro = '' as RubroGasto; form.tieneRuc = true
  form.dj_nombre_proveedor = ''; form.dj_dni_proveedor = ''
  form.dj_descripcion = ''; form.dj_lugar = ''
  form.mov_punto_partida = ''; form.mov_punto_llegada = ''
  form.mov_modulo_id = 0; form.mov_motivo = ''
  intentoGuardar.value = false
  limpiarArchivo()
  djPresupInfo.value = null
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
watch(nivelFiltro, () => {
  if (nivelFiltro.value && transfActual.value?.nivel !== nivelFiltro.value) {
    selectedTransfId.value = transfFiltradas.value[0]?.id ?? null
  }
})
watch(selectedTransfId, async (id) => {
  if (id) await store.cargarGastos(id)
}, { immediate: true })

onMounted(async () => {
  form.fecha = new Date().toISOString().split('T')[0]
  form.mov_modulo_id = auth.moduloPrimario?.modulo_id ?? 0

  await store.cargarTransferencias()

  if (route.query.transf) {
    selectedTransfId.value = Number(route.query.transf)
  } else if (store.transferencias.length > 0) {
    selectedTransfId.value = store.transferencias[0].id
  }
})
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }

/* Selector bar */
.transf-selector-bar {
  display:flex; align-items:center; gap:12px; flex-wrap:wrap;
  background:#fff; border:1px solid #d4dae8; border-radius:12px;
  padding:12px 16px; margin-bottom:12px;
  box-shadow:0 1px 4px rgba(26,47,110,.05);
}
.transf-select { flex:1; min-width:260px; padding:8px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13px; outline:none; color:#1a2340; }
.transf-select:focus { border-color:#2c4fd4; }

/* Info bar */
.transf-info-bar {
  display:flex; align-items:center; gap:8px; flex-wrap:wrap;
  background:#f7f8fc; border:1px solid #e5e8f0; border-radius:10px;
  padding:8px 14px; margin-bottom:16px; font-size:12.5px; color:#1a2340;
}
.sep { color:#d4dae8; }
.transf-cod { font-weight:700; color:#2c4fd4; font-family:monospace; font-size:12px; }
.transf-counter { background:#f0f4ff; color:#2c4fd4; font-weight:700; font-size:11px; padding:2px 8px; border-radius:20px; }
.ciclo-txt { color:#6b7597; }
.monto-txt { font-weight:700; color:#1a2340; }

/* Nivel pills */
.nivel-pills { display:flex; gap:6px; align-items:center; }
.pill { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:20px; border:1.5px solid #d4dae8; background:#f9fafb; font-size:12px; font-weight:600; color:#6b7597; cursor:pointer; transition:all .15s; white-space:nowrap; }
.pill:hover { border-color:#2c4fd4; color:#2c4fd4; background:#f0f4ff; }
.pill.active { background:#1a2f6e; color:#fff; border-color:#1a2f6e; }
.pill.active.inicial    { background:#0369a1; border-color:#0369a1; }
.pill.active.primaria   { background:#16a34a; border-color:#16a34a; }
.pill.active.secundaria { background:#b45309; border-color:#b45309; }
.pill-cod { font-size:10px; font-weight:400; opacity:.75; font-family:monospace; }

/* Nivel badges */
.nivel-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; }
.nivel-badge.inicial    { background:#e0f2fe; color:#0369a1; }
.nivel-badge.primaria   { background:#dcfce7; color:#16a34a; }
.nivel-badge.secundaria { background:#fef3c7; color:#b45309; }
.nivel-badge.sm { padding:1px 6px; font-size:9.5px; }
.cod-modular { font-size:11px; color:#9ba6c0; font-family:monospace; }
.transf-cell-mini { display:flex; align-items:center; gap:5px; }
.transf-cod-sm { font-size:11px; color:#6b7597; font-family:monospace; }

/* Card */
.mb { margin-bottom:20px; }
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 12px rgba(26,47,110,.08); margin-bottom:20px; }
.card-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #d4dae8; gap:12px; }
.card-title-sm { font-size:14px; font-weight:700; color:#1a2340; }
.card-body { padding:20px; }

/* Form */
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

/* Radio */
.radio-group { display:flex; }
.radio-opt { display:flex; align-items:center; gap:5px; padding:8px 14px; border:1.5px solid #d4dae8; font-size:13px; cursor:pointer; transition:all .15s; }
.radio-opt:first-child { border-radius:8px 0 0 8px; }
.radio-opt:last-child  { border-radius:0 8px 8px 0; margin-left:-1.5px; }
.radio-opt input { display:none; }
.radio-opt.active { background:#2c4fd4; border-color:#2c4fd4; color:white; }

/* ── Secciones inline (transporte / DJ) ──────────────────────────────────── */
.inline-section {
  margin-top: 16px;
  border-radius: 10px;
  padding: 14px 16px;
  border: 1.5px solid;
}
.transport-section {
  background: #f0f7ff;
  border-color: #bfdbfe;
}
.dj-section {
  background: #fefce8;
  border-color: #fde68a;
}
.inline-section-header {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
  margin-bottom: 14px;
  color: #1a2340;
}
.transport-section .inline-section-header { color: #1d4ed8; }
.dj-section        .inline-section-header { color: #92400e; }

/* Transición slide-in */
.slide-in-enter-active { transition: all .25s ease; }
.slide-in-leave-active { transition: all .2s ease; }
.slide-in-enter-from { opacity:0; transform:translateY(-8px); }
.slide-in-leave-to  { opacity:0; transform:translateY(-8px); }

/* Upload */
.upload-zone { border:2px dashed #d4dae8; border-radius:10px; padding:24px; text-align:center; cursor:pointer; transition:all .2s; }
.upload-zone:hover { border-color:#2c4fd4; background:#f0f4ff; }
.upload-zone.upload-required { border-color:#dc2626; background:#fff5f5; }
.upload-ico { width:28px; height:28px; color:#6b7597; margin:0 auto 8px; }
.upload-text { font-size:13px; color:#6b7597; }
.upload-text strong { color:#2c4fd4; }
.file-ok { margin-top:8px; font-size:13px; color:#16a34a; font-weight:600; display:flex; align-items:center; gap:6px; }
.file-ico { width:16px; height:16px; }
.preview-wrap { position:relative; margin-top:12px; border:1.5px solid #d4dae8; border-radius:10px; overflow:hidden; background:#fafbfd; }
.preview-close { position:absolute; top:8px; right:8px; background:rgba(220,38,38,.9); border:none; border-radius:6px; color:#fff; cursor:pointer; padding:4px; display:flex; align-items:center; z-index:10; }
.preview-img { width:100%; max-height:320px; object-fit:contain; display:block; background:#f0f2f8; }
.preview-pdf { width:100%; height:340px; border:none; display:block; }
.preview-label { display:flex; align-items:center; gap:6px; padding:8px 12px; font-size:12px; color:#6b7597; font-weight:600; border-top:1px solid #d4dae8; background:#fff; }

/* Acciones */
.form-actions { display:flex; gap:10px; margin-top:16px; flex-wrap:wrap; }
.btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; font-size:13.5px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn-sm { padding:6px 12px; font-size:12.5px; }
.btn.primary { background:#1a2f6e; color:#fff; box-shadow:0 2px 8px rgba(26,47,110,.25); }
.btn.primary:hover:not(:disabled) { background:#2c4fd4; }
.btn.primary:disabled { opacity:.6; cursor:not-allowed; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
.btn-ico { width:14px; height:14px; }
.edit-banner { display:flex; align-items:center; gap:6px; background:#fef3c7; border:1px solid #f59e0b; color:#b45309; border-radius:8px; padding:7px 12px; font-size:12.5px; font-weight:600; width:100%; margin-bottom:8px; }

/* Toggle modo factura */
.factura-toggle { display:inline-flex; align-items:center; gap:8px; font-size:12.5px; font-weight:600; color:#1a2340; cursor:pointer; background:#f0f4ff; border:1.5px solid #d4dae8; border-radius:8px; padding:6px 12px; transition:all .2s; }
.factura-toggle.active { background:#dbeafe; border-color:#2c4fd4; color:#1a2f6e; }
.toggle-track { width:30px; height:16px; background:#d4dae8; border-radius:8px; position:relative; transition:background .2s; flex-shrink:0; }
.factura-toggle.active .toggle-track { background:#2c4fd4; }
.toggle-thumb { position:absolute; top:2px; left:2px; width:12px; height:12px; background:#fff; border-radius:50%; transition:left .2s; }
.factura-toggle.active .toggle-thumb { left:16px; }

/* Modo factura */
.factura-item-row { display:flex; gap:12px; align-items:flex-end; margin-top:16px; background:#fafbfd; border:1px solid #d4dae8; border-radius:10px; padding:14px; }
.items-factura { margin-top:14px; border:1.5px solid #2c4fd4; border-radius:10px; overflow:hidden; }
.items-header { display:flex; justify-content:space-between; align-items:center; background:#e8edf9; padding:8px 14px; font-size:12.5px; color:#1a2f6e; }
.item-row { display:flex; align-items:center; gap:10px; padding:9px 14px; border-top:1px solid #f0f2f8; font-size:13px; }
.item-concepto { flex:1; color:#1a2340; font-weight:600; }
.item-monto { color:#1a2340; font-weight:700; min-width:90px; text-align:right; }
.item-del { background:#fee2e2; border:none; border-radius:5px; padding:4px; cursor:pointer; display:flex; color:#dc2626; transition:all .15s; }
.item-del:hover { background:#dc2626; color:#fff; }

/* Tabla */
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
thead th { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#6b7597; padding:10px 16px; border-bottom:1px solid #d4dae8; background:#fafbfd; text-align:left; }
tbody tr { border-bottom:1px solid #f0f2f8; transition:background .12s; }
tbody tr:last-child td { border-bottom:none; }
tbody tr:hover { background:#f0f4ff; }
tbody td { padding:11px 16px; font-size:13.5px; color:#1a2340; }
td.fw { font-weight:700; }
td.empty { text-align:center; color:#6b7597; padding:24px; }
.icon-btn { background:#fee2e2; border:none; border-radius:7px; padding:5px; cursor:pointer; display:flex; align-items:center; color:#dc2626; transition:all .15s; }
.icon-btn:hover:not(:disabled) { background:#dc2626; color:#fff; }
.icon-btn:disabled { opacity:.4; cursor:not-allowed; }
.icon-btn.edit { background:#e8edf9; color:#2c4fd4; }
.icon-btn.edit:hover { background:#2c4fd4; color:#fff; }
.chip-rubro { background:#e8edf9; color:#2c4fd4; padding:2px 8px; border-radius:6px; font-size:11.5px; font-weight:700; text-transform:capitalize; }
.comp-link { display:inline-flex; align-items:center; gap:4px; color:#2c4fd4; font-size:12px; font-weight:600; text-decoration:none; padding:3px 8px; background:#e8edf9; border-radius:6px; transition:all .15s; }
.comp-link:hover { background:#2c4fd4; color:#fff; }
.comp-ico { width:12px; height:12px; }

.aprobada-banner {
  display:flex; align-items:center; gap:10px;
  background:#dcfce7; border:1.5px solid #86efac;
  border-radius:10px; padding:12px 16px; margin-bottom:16px;
  font-size:13px; font-weight:600; color:#15803d;
}
.aprobada-banner strong { color:#14532d; }

/* ── Progress bar DJ ─────────────────────────────────────────────────────── */
.dj-progress-wrap { background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px 14px; margin-bottom:14px; }
.dj-progress-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:7px; }
.dj-progress-label { font-size:12px; color:#92400e; }
.dj-progress-label strong { color:#78350f; }
.dj-progress-pct { font-size:13px; font-weight:800; min-width:40px; text-align:right; }
.pct-ok   { color:#16a34a; }
.pct-warn { color:#b45309; }
.pct-over { color:#dc2626; }
.dj-progress-bar-bg { height:7px; background:#fef3c7; border-radius:99px; overflow:hidden; margin-bottom:7px; }
.dj-progress-bar-fill { height:100%; border-radius:99px; transition:width .3s ease; }
.fill-ok   { background:#16a34a; }
.fill-warn { background:#f59e0b; }
.fill-over { background:#dc2626; }
.dj-progress-legend { display:flex; gap:14px; font-size:11px; color:#92400e; }
.dj-progress-legend strong { color:#78350f; }
.dj-over-alert { display:flex; align-items:center; gap:7px; margin-top:8px; padding:7px 11px; background:#fee2e2; border:1px solid #dc2626; border-radius:7px; font-size:12px; font-weight:700; color:#dc2626; }
.dj-warn-alert { display:flex; align-items:center; gap:7px; margin-top:8px; padding:7px 11px; background:#fef3c7; border:1px solid #f59e0b; border-radius:7px; font-size:12px; font-weight:700; color:#b45309; }
</style>