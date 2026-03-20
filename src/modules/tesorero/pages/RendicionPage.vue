<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Rendición de Cuentas</h1>
        <p class="page-sub">Conciliación financiera por transferencia</p>
      </div>
    </div>
    <RendicionStepper
      v-if="estadoActual"
      :estado="estadoActual"
      :tiene-gastos="(rendicionStore.datos?.gastos?.length ?? 0) > 0"
      :tiene-rendicion="!!resumen?.rendicion_id"
    />

    <!-- ══════════════════════════════════════════════════════════
         LISTA DE TRANSFERENCIAS
         ══════════════════════════════════════════════════════════ -->
    <div v-if="!detalleId">
      <div v-if="loadingTransf" class="loading-row">
        <div class="spinner-lg" /> Cargando transferencias...
      </div>

      <template v-else>
        <div class="nivel-bar">
          <button class="pill" :class="{ active: nivelFiltro === '' }" @click="nivelFiltro = ''">Todos</button>
          <button
            v-for="n in nivelesDisponibles" :key="n"
            class="pill" :class="[{ active: nivelFiltro === n }, n]"
            @click="nivelFiltro = nivelFiltro === n ? '' : n"
          >
            {{ nivelLabel(n) }}<span class="pill-cod">{{ codigoModularDe(n) }}</span>
          </button>
        </div>

        <!-- Alerta global de vencimientos próximos -->
        <div
          v-for="t in transfConAlerta"
          :key="`alerta-${t.id}`"
          class="deadline-banner"
          :class="t.diasRestantes <= 0 ? 'deadline-vencida' : 'deadline-proxima'"
        >
          <Clock style="width:16px;height:16px;flex-shrink:0" />
          <span>
            <strong>{{ t.codigo }}</strong>
            <template v-if="t.diasRestantes <= 0">
              — Plazo de rendición <strong>VENCIDO</strong> hace {{ Math.abs(t.diasRestantes) }} día(s).
            </template>
            <template v-else>
              — Faltan <strong>{{ t.diasRestantes }} día(s)</strong> para vencer el plazo de rendición
              <span class="deadline-fecha">({{ fmtFecha(t.fecha_limite_rendicion) }})</span>.
            </template>
          </span>
          <button class="deadline-btn" @click="abrirRendicion(t.id)">
            Rendir ahora
          </button>
        </div>

        <div
          v-for="t in transfFiltradas" :key="t.id"
          class="rendicion-card"
          @click="abrirRendicion(t.id)"
        >
          <div class="rc-left">
            <div class="rc-title">
              <span class="nivel-badge" :class="t.nivel">{{ nivelLabel(t.nivel) }}</span>
              {{ t.codigo }}
              <span class="rc-ciclo">{{ t.ciclo }}</span>
              <span class="transf-counter">{{ t.numero }}/{{ t.num_transferencias }}</span>
            </div>
            <div class="rc-sub">
              <span class="cod-modular">{{ t.codigo_modular }}</span>
              · {{ t.institucion }}
            </div>
            <!-- Indicador de fecha límite dentro de la card -->
            <div v-if="t.fecha_limite_rendicion" class="rc-deadline" :class="deadlineClass(t)">
              <Clock style="width:11px;height:11px" />
              Límite: {{ fmtFecha(t.fecha_limite_rendicion) }}
              <span v-if="diasRestantes(t) < 999">
                ({{ (diasRestantes(t) ?? 0) <= 0 ? 'vencido' : (diasRestantes(t) ?? 0) + ' días' }})
              </span>
            </div>
          </div>
          <div class="rc-right">
            <div class="rc-monto-wrap">
              <div class="rc-monto-label">Transferido</div>
              <div class="rc-monto">{{ fmt(t.monto) }}</div>
            </div>
            <div class="rc-monto-wrap">
              <div class="rc-monto-label">Gastado</div>
              <div class="rc-monto">{{ fmt(t.total_gastado ?? 0) }}</div>
            </div>
            <div class="rc-monto-wrap">
              <div class="rc-saldo-label">Saldo</div>
              <div class="rc-saldo" :class="(t.saldo ?? 0) > 0 ? 'orange' : 'green'">{{ fmt(t.saldo ?? 0) }}</div>
            </div>
            <StatusBadge :status="t.estado" />
            <button class="icon-btn"><Eye class="btn-ico" /></button>
          </div>
        </div>
        <div v-if="transfFiltradas.length === 0" class="empty-state">Sin transferencias para el nivel seleccionado</div>
      </template>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         DETALLE DE RENDICIÓN
         ══════════════════════════════════════════════════════════ -->
    <div v-else>
      <div class="back-row">
        <button class="btn secondary btn-sm" @click="cerrarDetalle">
          <ArrowLeft class="btn-ico" /> Volver
        </button>
        <span class="detail-title">Rendición — {{ resumen?.codigo_transferencia ?? detalleId }}</span>
        <StatusBadge v-if="resumen" :status="resumen.estado" />
      </div>

      <!-- Info bar -->
      <div class="transf-info-bar" v-if="resumen">
        <span class="nivel-badge" :class="resumen.nivel">{{ nivelLabel(resumen.nivel) }}</span>
        <span class="cod-modular">{{ resumen.codigo_modular }}</span>
        <span class="sep">·</span>
        <span class="t-cod">{{ resumen.codigo_transferencia }}</span>
        <span class="transf-counter">{{ resumen.numero }}/{{ resumen.num_transferencias }}</span>
        <span class="sep">·</span>
        <span class="ciclo-txt">{{ resumen.ciclo }}</span>
        <span class="sep">·</span>
        <span class="ie-txt">{{ resumen.nombre_institucion }}</span>
      </div>

      <!-- Alerta de fecha límite en detalle -->
      <div
        v-if="resumen?.fecha_limite_rendicion && resumen?.estado !== 'aprobada'"
        class="deadline-banner-detail"
        :class="diasResumenRestantes <= 0 ? 'deadline-vencida' : diasResumenRestantes <= 3 ? 'deadline-proxima' : 'deadline-ok'"
      >
        <Clock style="width:15px;height:15px;flex-shrink:0" />
        <div class="deadline-detail-content">
          <span class="deadline-detail-label">Fecha límite de rendición</span>
          <span class="deadline-detail-fecha">{{ fmtFecha(resumen.fecha_limite_rendicion) }}</span>
        </div>
        <div class="deadline-detail-badge" :class="diasResumenRestantes <= 0 ? 'badge-vencida' : diasResumenRestantes <= 3 ? 'badge-proxima' : 'badge-ok'">
          {{ diasResumenRestantes <= 0
              ? `Vencido hace ${Math.abs(diasResumenRestantes)} día(s)`
              : `Faltan ${diasResumenRestantes} día(s)` }}
        </div>
      </div>

      <div v-if="rendicionStore.loading" class="loading-row">
        <div class="spinner-lg" /> Cargando rendición...
      </div>

      <template v-else>
        <!-- Banners de estado -->
        <div v-if="resumen?.estado === 'enviada'" class="estado-banner enviada">
          <Send style="width:16px;height:16px;flex-shrink:0" />
          Rendición enviada al ATC — en espera de revisión.
        </div>
        <div v-if="resumen?.estado === 'observada'" class="estado-banner observada">
          <AlertCircle style="width:16px;height:16px;flex-shrink:0" />
          El ATC devolvió esta rendición con observaciones. Corrige y reenvía.
        </div>
        <div v-if="resumen?.estado === 'aprobada'" class="estado-banner aprobada">
          <CheckCircle style="width:16px;height:16px;flex-shrink:0" />
          Rendición aprobada por el ATC.
        </div>

        <!-- KPIs financieros -->
        <div class="kpi-grid">
          <div class="kpi-card left-green">
            <div class="kpi-label">(+) Transferencia recibida</div>
            <div class="kpi-val green">{{ fmt(resumen?.monto_transferencia ?? 0) }}</div>
          </div>
          <div class="kpi-card left-red">
            <div class="kpi-label">(–) Total gastos registrados</div>
            <div class="kpi-val red">{{ fmt(resumen?.total_gastos_registrados ?? 0) }}</div>
            <div class="divider-sm" />
            <div class="kpi-sub-row">
              <span>Efectivo en caja</span>
              <div class="mini-input-wrap">
                <span class="mini-prefix">S/</span>
                <input v-model.number="efectivo" type="number" class="mini-input" placeholder="0.00" step="0.01" :disabled="bloqueado" />
              </div>
            </div>
          </div>
          <div class="kpi-card left-blue">
            <div class="kpi-label">(=) Saldo calculado</div>
            <div class="kpi-val" :class="saldoFinal < 0 ? 'red' : saldoFinal === 0 ? 'green' : ''">{{ fmt(saldoFinal) }}</div>
            <div class="divider-sm" />
            <div class="kpi-sub-row">
              <span>Estado rendición</span>
              <StatusBadge :status="resumen?.estado ?? 'borrador'" />
            </div>
          </div>
        </div>

        <!-- ── Fecha límite de rendición ───────────────────────── -->
        <div class="ventana-card mb" v-if="resumen">
          <div class="ventana-header">
            <Clock style="width:16px;height:16px" />
            <span class="ventana-title">Ventana de Rendición</span>
            <span class="ventana-transf">
              Transferencia {{ resumen.numero }} de {{ resumen.num_transferencias }}
            </span>
          </div>

          <div class="ventana-body">
            <!-- Período que le corresponde a esta transferencia -->
            <div class="ventana-periodo">
              <div class="ventana-item">
                <span class="ventana-label">Inicio del período</span>
                <span class="ventana-val">{{ fmtFecha(transfActual?.ventana_inicio) }}</span>
              </div>
              <div class="ventana-arrow">→</div>
              <div class="ventana-item">
                <span class="ventana-label">Fin del período</span>
                <span class="ventana-val">{{ fmtFecha(transfActual?.ventana_fin) }}</span>
              </div>
              <div class="ventana-divider"></div>
              <div class="ventana-item">
                <span class="ventana-label">Fecha límite (con gracia)</span>
                <span class="ventana-val bold">{{ fmtFecha(transfActual?.fecha_limite_rendicion) }}</span>
              </div>
            </div>

            <!-- Countdown visual -->
            <div class="countdown-wrap" :class="`countdown-${transfActual?.deadline?.estado ?? 'ok'}`">
              <div class="countdown-numero">
                {{ deadlineTexto }}
              </div>
              <div class="countdown-barra-bg">
                <div
                  class="countdown-barra-fill"
                  :class="`barra-${transfActual?.deadline?.estado ?? 'ok'}`"
                  :style="{ width: porcentajeTiempoTranscurrido + '%' }"
                ></div>
              </div>
              <div class="countdown-sub">
                Ciclo: {{ fmtFecha(resumen.ciclo_fecha_inicio) }} — {{ fmtFecha(resumen.ciclo_fecha_fin) }}
              </div>
            </div>
          </div>
        </div>

        <!-- ── Ejecución por rubro — gráfico mejorado ─────────── -->
        <div class="card mb">
          <div class="card-header">
            <span class="card-title-sm">Ejecución por Rubro</span>
            <div class="chart-legend">
              <span class="leg-item"><span class="leg-sq gastado"></span>Gastado</span>
              <span class="leg-item"><span class="leg-sq disponible"></span>Disponible</span>
            </div>
          </div>
          <div class="card-body rubros-chart-body">
            <div v-if="rubrosResumen.length === 0" class="empty-rubros">Sin gastos registrados aún</div>
            <div v-else class="rubros-chart-grid">
              <div
                v-for="rubro in rubrosResumen"
                :key="rubro.nombre"
                class="rubro-chart-item"
              >
                <!-- Nombre y montos -->
                <div class="rubro-chart-header">
                  <span class="rubro-chip" :class="`chip-${rubro.key}`">{{ rubro.nombre }}</span>
                  <span class="rubro-chart-pct" :class="pctClass(rubro.pct)">{{ rubro.pct }}%</span>
                </div>

                <!-- Barra segmentada con capas -->
                <div class="rubro-stacked-bar">
                  <div
                    class="rubro-fill-gastado"
                    :class="pctFillClass(rubro.pct)"
                    :style="{ width: Math.min(rubro.pct, 100) + '%' }"
                  >
                    <span v-if="rubro.pct >= 15" class="bar-label-inside">{{ fmt(rubro.gastado) }}</span>
                  </div>
                  <div
                    v-if="rubro.pct < 100"
                    class="rubro-fill-disponible"
                    :style="{ width: (100 - Math.min(rubro.pct, 100)) + '%' }"
                  >
                    <span v-if="(100 - rubro.pct) >= 20" class="bar-label-inside disponible-label">
                      {{ fmt(rubro.presupuesto - rubro.gastado) }}
                    </span>
                  </div>
                  <!-- Desborde -->
                  <div v-if="rubro.pct > 100" class="rubro-overflow-indicator">
                    +{{ fmt(rubro.gastado - rubro.presupuesto) }}
                  </div>
                </div>

                <!-- Pie: presupuesto total -->
                <div class="rubro-chart-footer">
                  <span class="rubro-footer-label">Presupuesto:</span>
                  <span class="rubro-footer-val">{{ fmt(rubro.presupuesto) }}</span>
                </div>
              </div>
            </div>

            <!-- Totalizador -->
            <div v-if="rubrosResumen.length > 0" class="rubros-total-row">
              <span class="rubros-total-label">Total gastado</span>
              <span class="rubros-total-val">{{ fmt(rubrosResumen.reduce((s,r) => s + r.gastado, 0)) }}</span>
              <span class="rubros-total-sep">de</span>
              <span class="rubros-total-presup">{{ fmt(rubrosResumen.reduce((s,r) => s + r.presupuesto, 0)) }}</span>
            </div>
          </div>
        </div>

        <!-- Tabla de gastos -->
        <div class="card mb">
          <div class="card-header">
            <span class="card-title-sm">Gastos Incluidos en la Rendición</span>
            <span style="font-size:12px;color:#6b7597">{{ rendicionStore.datos?.gastos?.length ?? 0 }} registros</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>Concepto</th><th>Rubro</th>
                  <th>Tipo</th><th>Comprobante</th><th>Monto</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in rendicionStore.datos?.gastos" :key="g.id">
                  <td>{{ fmtFecha(g.fecha_documento) }}</td>
                  <td class="fw">{{ g.concepto }}</td>
                  <td><span class="chip-rubro">{{ g.rubro }}</span></td>
                  <td style="font-size:12px;color:#6b7597">{{ fmtTipo(g.tipo_comprobante) }}</td>
                  <td>
                    <a v-if="g.archivo_url" :href="`http://localhost:3000${g.archivo_url}`" target="_blank" class="comp-link">{{ g.num_comprobante || 'Ver' }}</a>
                    <span v-else style="color:#6b7597;font-size:12px">{{ g.num_comprobante || '—' }}</span>
                  </td>
                  <td class="fw">{{ fmt(g.monto) }}</td>
                  <td><StatusBadge :status="g.estado" /></td>
                </tr>
                <tr v-if="!rendicionStore.datos?.gastos?.length">
                  <td colspan="7" class="empty">No hay gastos registrados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Estado de cuenta -->
        <div class="card mb">
          <div class="card-header">
            <div class="card-title-sm">Estado de Cuenta / Pantallazo Bancario</div>
            <span style="font-size:12px;color:#6b7597">Debe coincidir con el saldo calculado</span>
          </div>
          <div class="card-body">
            <div class="upload-zone" @click="!bloqueado && estadoInput?.click()">
              <ImageIcon class="upload-ico" />
              <div class="upload-text">
                <strong>Subir estado de cuenta o pantallazo</strong><br/>
                PNG, JPG o PDF — desde app, cajero o ventanilla BN
              </div>
              <input ref="estadoInput" type="file" accept="image/*,.pdf" style="display:none" @change="onEstadoChange" :disabled="bloqueado" />
            </div>
            <div v-if="estadoFile" class="file-ok">
              <CheckCircle class="file-ico" /> Adjunto: <strong>{{ estadoFile }}</strong>
            </div>
          </div>
        </div>

        <!-- Observaciones del ATC -->
        <div class="card mb" v-if="rendicionStore.datos?.observaciones?.length">
          <div class="card-header"><div class="card-title-sm">Observaciones del ATC</div></div>
          <div class="card-body obs-list">
            <div v-for="o in rendicionStore.datos.observaciones" :key="o.id" class="obs-item">
              <div class="obs-header">
                <span class="obs-autor">{{ o.autor }}</span>
                <span class="obs-fecha">{{ fmtFecha(o.creado_en) }}</span>
              </div>
              <div class="obs-texto">{{ o.comentario }}</div>
            </div>
          </div>
        </div>

        <!-- Documentos descargables -->
        <div class="download-bar">
          <div class="download-bar-title"><FileDown style="width:15px;height:15px" /> Documentos de la Rendición</div>
          <div class="download-btns">
            <button class="btn download-btn" @click="descargarAnexo3" :disabled="descargandoAnexo">
              <FileSpreadsheet class="btn-ico" />{{ descargandoAnexo ? 'Generando PDF...' : 'Balance de Gastos' }}
            </button>
            <button class="btn download-btn orange-btn" @click="descargarDJPdf" :disabled="descargandoDJ">
              <FileText class="btn-ico" />{{ descargandoDJ ? 'Generando...' : 'DJ de Gastos' }}
            </button>
            <button class="btn download-btn green-btn" @click="descargarZip" :disabled="descargandoZip">
              <Archive class="btn-ico" />{{ descargandoZip ? 'Comprimiendo...' : 'ZIP de Comprobantes' }}
            </button>
            <button class="btn download-btn purple-btn" @click="descargarRecibo" :disabled="descargandoRecibo">
              <Receipt class="btn-ico" />{{ descargandoRecibo ? 'Generando...' : 'Recibo de Egreso' }}
            </button>
          </div>
        </div>

        <!-- Acciones -->
        <div class="form-actions" v-if="!bloqueado">
          <button class="btn secondary" @click="guardar" :disabled="guardando">
            <Save class="btn-ico" />{{ guardando ? 'Guardando...' : 'Guardar Borrador' }}
          </button>
          <button class="btn primary" @click="enviar" :disabled="guardando">
            <Send class="btn-ico" />{{ resumen?.estado === 'observada' ? 'Reenviar al ATC' : 'Enviar al ATC' }}
          </button>
        </div>
        <div v-else class="bloqueado-msg">
          <CheckCircle style="width:16px;height:16px" />
          Esta rendición está en estado <strong>{{ resumen?.estado }}</strong> y no puede modificarse.
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  Eye, ArrowLeft, ImageIcon, CheckCircle, Save, Send, AlertCircle,
  FileSpreadsheet, Archive, FileDown, FileText, Clock
} from 'lucide-vue-next'
import { useTransferenciasStore } from '@/stores/transferencias.store'
import { useRendicionStore }      from '@/stores/rendicion.store'
import { useToastStore }          from '@/stores/toast.store'
import { useAuthStore }           from '@/stores/auth.store'
import StatusBadge      from '@/components/ui/shared/StatusBadge.vue'
import RendicionStepper from '@/components/ui/shared/RendicionStepper.vue'

const transferenciaStore = useTransferenciasStore()
const rendicionStore     = useRendicionStore()
const toast              = useToastStore()
const auth               = useAuthStore()
const route              = useRoute()

const detalleId        = ref<any>(null)
const nivelFiltro      = ref('')
const efectivo         = ref(0)
const observaciones    = ref('')
const estadoFile       = ref('')
const estadoInput      = ref<HTMLInputElement>()
const guardando        = ref(false)
const loadingTransf    = ref(false)
const descargandoAnexo = ref(false)
const descargandoZip   = ref(false)
const descargandoDJ    = ref(false)

// ── Helpers ────────────────────────────────────────────────────────────────
function nivelLabel(nivel: string) {
  return ({ inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' } as Record<string,string>)[nivel] ?? nivel
}
function fmt(n: number) {
  return 'S/ ' + (n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtFecha(f: string | null | undefined) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTipo(t: string) {
  const map: Record<string, string> = {
    boleta_venta: 'Boleta', recibo_gasto: 'Recibo', factura: 'Factura',
    ticket: 'Ticket', declaracion_jurada: 'DJ', planilla_movilidad: 'Movilidad'
  }
  return map[t] ?? t
}

// Días restantes hasta fecha_limite_rendicion (negativo = vencido, 999 = sin fecha)
function diasRestantes(t: any): number {
  if (!t?.fecha_limite_rendicion) return 999
  const hoy    = new Date(); hoy.setHours(0, 0, 0, 0)
  const limite = new Date(t.fecha_limite_rendicion); limite.setHours(0, 0, 0, 0)
  return Math.round((limite.getTime() - hoy.getTime()) / 86400000)
}

function deadlineClass(t: any) {
  const d = diasRestantes(t)
  if (d >= 999) return ''
  if (d <= 0)   return 'deadline-rc-vencida'
  if (d <= 3)   return 'deadline-rc-proxima'
  return 'deadline-rc-ok'
}

// ── Computed ───────────────────────────────────────────────────────────────
// UNA sola declaración de transfActual
const transfActual = computed(() =>
  transferenciaStore.transferencias.find((t: any) => t.id == detalleId.value) ?? null
)

const estadoActual = computed(() =>
  resumen.value?.estado ?? transfActual.value?.estado ?? ''
)

const nivelesDisponibles = computed(() => {
  const set = new Set<string>()
  transferenciaStore.transferencias.forEach((t: any) => { if (t.nivel) set.add(t.nivel) })
  return ['inicial', 'primaria', 'secundaria'].filter(n => set.has(n))
})

function codigoModularDe(nivel: string) {
  return transferenciaStore.transferencias.find((t: any) => t.nivel === nivel)?.codigo_modular ?? ''
}

const transfFiltradas = computed(() =>
  nivelFiltro.value
    ? transferenciaStore.transferencias.filter((t: any) => t.nivel === nivelFiltro.value)
    : transferenciaStore.transferencias
)

// Alertas: vencidas o ≤3 días, no aprobadas
const transfConAlerta = computed(() =>
  transferenciaStore.transferencias
    .filter((t: any) => {
      if (!t.fecha_limite_rendicion) return false
      if (t.estado === 'aprobada')   return false
      const d = diasRestantes(t)
      return d < 999 && d <= 3
    })
    .sort((a: any, b: any) => diasRestantes(a) - diasRestantes(b))
)

const resumen = computed(() => rendicionStore.datos?.resumen ?? null)

const saldoFinal = computed(() => {
  const monto  = resumen.value?.monto_transferencia      ?? 0
  const gastos = resumen.value?.total_gastos_registrados ?? 0
  return monto - gastos - efectivo.value
})

const bloqueado = computed(() => resumen.value?.estado === 'aprobada')

// Días restantes para el resumen actual (detalle)
const diasResumenRestantes = computed(() => diasRestantes(resumen.value))

// ── Deadline del detalle (viene del store de transferencias, ya calculado) ─
const deadlineTexto = computed(() => {
  const d = transfActual.value?.deadline
  if (!d || d.dias_restantes === null) return '—'
  if (d.dias_restantes < 0)  return `Vencido hace ${Math.abs(d.dias_restantes)} días`
  if (d.dias_restantes === 0) return 'Vence HOY'
  if (d.dias_restantes === 1) return 'Vence mañana'
  return `Faltan ${d.dias_restantes} días`
})

// Barra: porcentaje del período de esta transferencia que ya transcurrió
const porcentajeTiempoTranscurrido = computed(() => {
  const t = transfActual.value
  if (!t?.ventana_inicio || !t?.ventana_fin) return 0
  const inicio = new Date(t.ventana_inicio).getTime()
  const fin    = new Date(t.ventana_fin).getTime()
  const hoy    = Date.now()
  const pct    = Math.round(((hoy - inicio) / (fin - inicio)) * 100)
  return Math.min(Math.max(pct, 0), 100)
})

// ── Rubros para el gráfico ─────────────────────────────────────────────────
const RUBROS_META = [
  { key: 'alimentos',  nombre: 'Alimentos'  },
  { key: 'transporte', nombre: 'Transporte' },
  { key: 'gas',        nombre: 'Gas'        },
  { key: 'estipendio', nombre: 'Estipendio' },
  { key: 'limpieza',   nombre: 'Limpieza'   },
  { key: 'otros',      nombre: 'Otros'      },
]

const rubrosResumen = computed(() => {
  const gastos = rendicionStore.datos?.gastos ?? []
  const t = transfActual.value
  if (!t) return []
  return RUBROS_META.map(r => {
    const gastado     = gastos.filter((g: any) => g.rubro === r.key)
                              .reduce((s: number, g: any) => s + Number(g.monto), 0)
    const presupuesto = t.rubros?.[r.key] ?? 0
    return { ...r, gastado, presupuesto, pct: presupuesto > 0 ? Math.round((gastado / presupuesto) * 100) : 0 }
  }).filter(r => r.presupuesto > 0)
})

function pctClass(pct: number) {
  if (pct >= 100) return 'pct-over'
  if (pct >= 90)  return 'pct-warn'
  if (pct >= 70)  return 'pct-mid'
  return 'pct-ok'
}
function pctFillClass(pct: number) {
  if (pct >= 100) return 'fill-over'
  if (pct >= 90)  return 'fill-warn'
  if (pct >= 70)  return 'fill-mid'
  return 'fill-ok'
}

// ── Acciones ───────────────────────────────────────────────────────────────
onMounted(async () => {
  loadingTransf.value = true
  await transferenciaStore.cargar()
  loadingTransf.value = false
  if (route.query.transf) await abrirRendicion(route.query.transf)
})

async function abrirRendicion(id: any) {
  detalleId.value = id
  await rendicionStore.cargar(id)
  if (resumen.value) {
    efectivo.value      = resumen.value.efectivo_en_caja ?? 0
    observaciones.value = resumen.value.observaciones    ?? ''
    // fecha_limite_rendicion ya viene calculada del backend — no hay ref manual
  }
}

function cerrarDetalle() {
  detalleId.value     = null
  rendicionStore.datos = null
  efectivo.value      = 0
  observaciones.value = ''
  estadoFile.value    = ''
}

function onEstadoChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) estadoFile.value = f.name
}

async function guardar() {
  guardando.value = true
  try {
    await rendicionStore.guardar(detalleId.value, efectivo.value, observaciones.value)
    await rendicionStore.cargar(detalleId.value)
    await transferenciaStore.cargar()
    toast.success('Borrador guardado', 'La rendición fue guardada correctamente')
  } catch (e: any) {
    toast.error('Error', e.message)
  } finally {
    guardando.value = false
  }
}

async function enviar() {
  guardando.value = true
  try {
    let rendicionId = resumen.value?.rendicion_id
    if (!rendicionId) {
      const saved = await rendicionStore.guardar(detalleId.value, efectivo.value, observaciones.value)
      rendicionId = saved.rendicion_id
    }
    await rendicionStore.enviar(rendicionId)
    await rendicionStore.cargar(detalleId.value)
    await transferenciaStore.cargar()
    toast.success('Rendición enviada', 'El ATC fue notificado para revisión')
  } catch (e: any) {
    toast.error('Error', e.message)
  } finally {
    guardando.value = false
  }
}

async function descarga(url: string, filename: string, loadingRef: { value: boolean }) {
  loadingRef.value = true
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error('Error', d.error || 'Error al descargar')
      return
    }
    const blob = await res.blob()
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  } finally {
    loadingRef.value = false
  }
}
import { Receipt } from 'lucide-vue-next'  // agregar al import

const descargandoRecibo = ref(false)

function descargarRecibo() {
  descarga(
    `http://localhost:3000/api/rendiciones/${detalleId.value}/recibo-egreso`,
    `recibo-egreso-transf${detalleId.value}.pdf`,
    descargandoRecibo
  )
}
function descargarAnexo3() {
  descarga(`http://localhost:3000/api/rendiciones/${detalleId.value}/anexo3`,         `anexo3-transf${detalleId.value}.pdf`,       descargandoAnexo)
}
function descargarDJPdf() {
  descarga(`http://localhost:3000/api/rendiciones/${detalleId.value}/dj-pdf`,          `dj-transf${detalleId.value}.pdf`,           descargandoDJ)
}
function descargarZip() {
  descarga(`http://localhost:3000/api/rendiciones/${detalleId.value}/comprobantes-zip`, `comprobantes-transf${detalleId.value}.zip`, descargandoZip)
}
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }
.loading-row { display:flex; align-items:center; gap:10px; padding:40px; justify-content:center; color:#6b7597; }
.spinner-lg { width:20px; height:20px; border:3px solid #d4dae8; border-top-color:#2c4fd4; border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.empty-state { text-align:center; color:#6b7597; padding:32px; font-size:13.5px; }

/* Pills */
.nivel-bar { display:flex; align-items:center; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
.pill { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:20px; border:1.5px solid #d4dae8; background:#f9fafb; font-size:12px; font-weight:600; color:#6b7597; cursor:pointer; transition:all .15s; white-space:nowrap; }
.pill:hover { border-color:#2c4fd4; color:#2c4fd4; background:#f0f4ff; }
.pill.active { background:#1a2f6e; color:#fff; border-color:#1a2f6e; }
.pill.active.inicial    { background:#0369a1; border-color:#0369a1; }
.pill.active.primaria   { background:#16a34a; border-color:#16a34a; }
.pill.active.secundaria { background:#b45309; border-color:#b45309; }
.pill-cod { font-size:10px; font-weight:400; opacity:.75; font-family:monospace; }

/* Badges */
.nivel-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; }
.nivel-badge.inicial    { background:#e0f2fe; color:#0369a1; }
.nivel-badge.primaria   { background:#dcfce7; color:#16a34a; }
.nivel-badge.secundaria { background:#fef3c7; color:#b45309; }
.cod-modular { font-size:11px; color:#9ba6c0; font-family:monospace; }

/* ── Alertas de deadline ─────────────────────────────────────────────────── */
.deadline-banner {
  display:flex; align-items:center; gap:12px; border-radius:10px;
  padding:12px 16px; margin-bottom:10px; font-size:13px; flex-wrap:wrap;
}
.deadline-proxima { background:#fef3c7; border:1.5px solid #fcd34d; color:#92400e; }
.deadline-vencida { background:#fee2e2; border:1.5px solid #fca5a5; color:#991b1b; }
.deadline-btn {
  margin-left:auto; padding:5px 14px; border-radius:7px; font-size:12px; font-weight:700;
  border:none; cursor:pointer; background:#1a2f6e; color:#fff; transition:background .15s;
}
.deadline-btn:hover { background:#2c4fd4; }

/* Indicador inline en la card */
.rc-deadline {
  display:inline-flex; align-items:center; gap:5px;
  margin-top:6px; font-size:11px; font-weight:600; padding:2px 8px;
  border-radius:20px;
}
.deadline-rc-ok      { background:#dcfce7; color:#15803d; }
.deadline-rc-proxima { background:#fef3c7; color:#92400e; }
.deadline-rc-vencida { background:#fee2e2; color:#991b1b; }

/* Alerta en detalle */
.deadline-banner-detail {
  display:flex; align-items:center; gap:14px; border-radius:10px;
  padding:12px 16px; margin-bottom:16px; flex-wrap:wrap;
}
.deadline-ok      { background:#f0fdf4; border:1.5px solid #86efac; color:#15803d; }
.deadline-proxima { background:#fef3c7; border:1.5px solid #fcd34d; color:#92400e; }
.deadline-vencida { background:#fee2e2; border:1.5px solid #fca5a5; color:#991b1b; }
.deadline-detail-content { display:flex; flex-direction:column; gap:2px; flex:1; }
.deadline-detail-label { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; opacity:.75; }
.deadline-detail-fecha { font-size:14px; font-weight:700; }
.deadline-detail-badge {
  padding:4px 14px; border-radius:20px; font-size:12px; font-weight:700;
}
.badge-ok      { background:#dcfce7; color:#15803d; }
.badge-proxima { background:#fef3c7; color:#92400e; }
.badge-vencida { background:#fee2e2; color:#991b1b; }

/* Preview fecha límite en formulario */
.fecha-limite-preview {
  display:inline-flex; align-items:center; gap:7px;
  padding:8px 14px; border-radius:8px; font-size:13px; font-weight:700;
}
.preview-ok      { background:#dcfce7; color:#15803d; border:1px solid #86efac; }
.preview-cercana { background:#eff6ff; color:#1d4ed8; border:1px solid #93c5fd; }
.preview-proxima { background:#fef3c7; color:#92400e; border:1px solid #fcd34d; }
.preview-vencida { background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; }

/* Info bar */
.transf-info-bar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; background:#f7f8fc; border:1px solid #e5e8f0; border-radius:10px; padding:8px 14px; margin-bottom:16px; font-size:12.5px; color:#1a2340; }
.sep { color:#d4dae8; }
.t-cod { font-weight:700; color:#2c4fd4; font-family:monospace; font-size:12px; }
.transf-counter { background:#f0f4ff; color:#2c4fd4; font-weight:700; font-size:11px; padding:2px 8px; border-radius:20px; }
.ciclo-txt { color:#6b7597; }
.ie-txt { font-weight:600; color:#1a2340; }

/* Cards lista */
.rendicion-card { background:#fff; border:1px solid #d4dae8; border-radius:14px; padding:18px 22px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all .2s; box-shadow:0 2px 8px rgba(26,47,110,.05); }
.rendicion-card:hover { border-color:#2c4fd4; box-shadow:0 4px 16px rgba(44,79,212,.12); transform:translateY(-1px); }
.rc-left { flex:1; }
.rc-title { font-size:15px; font-weight:700; color:#1a2340; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.rc-ciclo { font-size:11px; font-weight:600; background:#e8edf9; color:#2c4fd4; padding:2px 8px; border-radius:6px; }
.rc-sub { font-size:12.5px; color:#6b7597; margin-top:4px; display:flex; align-items:center; gap:6px; }
.rc-right { display:flex; align-items:center; gap:20px; }
.rc-monto-wrap { text-align:right; }
.rc-monto-label { font-size:10px; font-weight:700; text-transform:uppercase; color:#6b7597; }
.rc-monto { font-size:14px; font-weight:700; color:#1a2340; }
.rc-saldo-label { font-size:10px; font-weight:700; text-transform:uppercase; color:#6b7597; text-align:right; }
.rc-saldo { font-size:16px; font-weight:800; }
.rc-saldo.green  { color:#16a34a; }
.rc-saldo.orange { color:#ea580c; }
.icon-btn { background:#f0f2f8; border:1px solid #d4dae8; border-radius:7px; padding:6px; cursor:pointer; display:flex; color:#6b7597; }
.btn-ico { width:15px; height:15px; }

/* Detalle */
.back-row { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
.detail-title { font-size:15px; font-weight:700; color:#1a2340; }
.kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:20px; }
.kpi-card { background:#fff; border:1px solid #d4dae8; border-radius:14px; padding:18px 20px; box-shadow:0 2px 8px rgba(26,47,110,.05); }
.kpi-card.left-green { border-left:4px solid #16a34a; }
.kpi-card.left-red   { border-left:4px solid #dc2626; }
.kpi-card.left-blue  { border-left:4px solid #2c4fd4; }
.kpi-label { font-size:11px; font-weight:700; text-transform:uppercase; color:#6b7597; margin-bottom:6px; }
.kpi-val { font-size:24px; font-weight:800; color:#1a2340; }
.kpi-val.green { color:#16a34a; }
.kpi-val.red   { color:#dc2626; }
.divider-sm { height:1px; background:#d4dae8; margin:12px 0; }
.kpi-sub-row { display:flex; align-items:center; justify-content:space-between; font-size:12.5px; color:#6b7597; }
.mini-input-wrap { position:relative; }
.mini-prefix { position:absolute; left:7px; top:50%; transform:translateY(-50%); font-size:12px; font-weight:700; color:#6b7597; }
.mini-input { width:110px; padding:5px 8px 5px 22px; border:1.5px solid #d4dae8; border-radius:6px; font-size:13px; outline:none; }
.mini-input:focus { border-color:#2c4fd4; }
.mini-input:disabled { background:#f0f2f8; color:#6b7597; }

.form-group { display:flex; flex-direction:column; gap:5px; }
.form-label { font-size:12.5px; font-weight:700; color:#1a2340; }
.form-input { padding:9px 12px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13.5px; outline:none; background:#fafbfd; transition:border-color .15s; }
.form-input:focus { border-color:#2c4fd4; background:#fff; }

/* ── Gráfico de rubros ───────────────────────────────────────────────────── */
.card { background:#fff; border:1px solid #d4dae8; border-radius:14px; box-shadow:0 2px 8px rgba(26,47,110,.05); }
.mb { margin-bottom:20px; }
.card-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #d4dae8; }
.card-title-sm { font-size:14px; font-weight:700; color:#1a2340; }
.card-body { padding:20px; }

.chart-legend { display:flex; gap:14px; align-items:center; }
.leg-item { display:flex; align-items:center; gap:5px; font-size:12px; color:#6b7597; }
.leg-sq { width:12px; height:8px; border-radius:2px; }
.leg-sq.gastado    { background:#2c4fd4; }
.leg-sq.disponible { background:#e8edf9; }

.rubros-chart-body { padding:20px; }
.rubros-chart-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px 28px; margin-bottom:20px; }

.rubro-chart-item { display:flex; flex-direction:column; gap:8px; }

.rubro-chart-header { display:flex; align-items:center; justify-content:space-between; }
.rubro-chip {
  font-size:10.5px; font-weight:700; text-transform:uppercase;
  letter-spacing:.35px; padding:3px 10px; border-radius:20px;
}
/* Colores por rubro */
.chip-alimentos  { background:#dbeafe; color:#1d4ed8; }
.chip-transporte { background:#fce7f3; color:#be185d; }
.chip-gas        { background:#fef3c7; color:#92400e; }
.chip-estipendio { background:#d1fae5; color:#065f46; }
.chip-limpieza   { background:#ede9fe; color:#5b21b6; }
.chip-otros      { background:#f0f2f8; color:#6b7597; }

.rubro-chart-pct { font-size:14px; font-weight:800; }
.pct-ok   { color:#16a34a; }
.pct-mid  { color:#d97706; }
.pct-warn { color:#ea580c; }
.pct-over { color:#dc2626; }

/* Barra segmentada */
.rubro-stacked-bar {
  position:relative; display:flex; height:28px;
  border-radius:6px; overflow:hidden;
  background:#f0f2f8;
}
.rubro-fill-gastado {
  display:flex; align-items:center; justify-content:flex-end;
  padding-right:6px; height:100%; border-radius:6px 0 0 6px;
  transition:width .5s ease; min-width:0; overflow:hidden;
}
.rubro-fill-gastado.fill-ok   { background:#2c4fd4; }
.rubro-fill-gastado.fill-mid  { background:#d97706; }
.rubro-fill-gastado.fill-warn { background:#ea580c; }
.rubro-fill-gastado.fill-over { background:#dc2626; border-radius:6px; }

.rubro-fill-disponible {
  display:flex; align-items:center; justify-content:flex-start;
  padding-left:6px; height:100%; min-width:0; overflow:hidden;
}
.bar-label-inside { font-size:10px; font-weight:700; white-space:nowrap; color:#fff; }
.disponible-label { color:#6b7597; }

.rubro-overflow-indicator {
  position:absolute; right:6px; top:50%; transform:translateY(-50%);
  font-size:9.5px; font-weight:700; color:#dc2626; white-space:nowrap;
}

.rubro-chart-footer { display:flex; align-items:center; gap:6px; }
.rubro-footer-label { font-size:10.5px; color:#9ba6c0; }
.rubro-footer-val   { font-size:11px; font-weight:700; color:#1a2340; }

/* Totalizador */
.rubros-total-row {
  display:flex; align-items:center; gap:8px;
  padding:12px 16px; background:#f7f8fc; border-radius:8px;
  font-size:13px;
}
.rubros-total-label  { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:#6b7597; flex:1; }
.rubros-total-val    { font-size:16px; font-weight:800; color:#1a2340; }
.rubros-total-sep    { color:#d4dae8; }
.rubros-total-presup { font-size:13px; color:#6b7597; }

.empty-rubros { text-align:center; color:#6b7597; padding:16px; font-size:13px; }

/* Tabla */
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
thead th { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#6b7597; padding:10px 16px; border-bottom:1px solid #d4dae8; background:#fafbfd; text-align:left; }
tbody td { padding:11px 16px; font-size:13.5px; color:#1a2340; border-bottom:1px solid #f0f2f8; }
tbody tr:last-child td { border-bottom:none; }
tbody tr:hover { background:#f0f4ff; }
td.fw { font-weight:700; }
td.empty { text-align:center; color:#6b7597; padding:24px; }
.chip-rubro { background:#e8edf9; color:#2c4fd4; padding:2px 8px; border-radius:6px; font-size:11.5px; font-weight:700; text-transform:capitalize; }
.comp-link { color:#2c4fd4; font-size:12px; font-weight:600; text-decoration:none; background:#e8edf9; padding:2px 8px; border-radius:6px; }
.comp-link:hover { background:#2c4fd4; color:#fff; }

/* Upload */
.upload-zone { border:2px dashed #d4dae8; border-radius:10px; padding:24px; text-align:center; cursor:pointer; transition:all .2s; }
.upload-zone:hover { border-color:#2c4fd4; background:#f0f4ff; }
.upload-ico { width:28px; height:28px; color:#6b7597; margin:0 auto 8px; display:block; }
.upload-text { font-size:13px; color:#6b7597; }
.upload-text strong { color:#2c4fd4; }
.file-ok { margin-top:10px; font-size:13px; color:#16a34a; font-weight:600; display:flex; align-items:center; gap:6px; }
.file-ico { width:16px; height:16px; }

/* Observaciones */
.obs-list { display:flex; flex-direction:column; gap:12px; }
.obs-item { background:#fafbfd; border:1px solid #d4dae8; border-radius:8px; padding:12px 16px; }
.obs-header { display:flex; justify-content:space-between; margin-bottom:6px; }
.obs-autor { font-size:12.5px; font-weight:700; color:#1a2340; }
.obs-fecha { font-size:11.5px; color:#6b7597; }
.obs-texto { font-size:13.5px; color:#1a2340; line-height:1.5; }

/* Download bar */
.download-bar { background:#f0f4ff; border:1.5px solid #c5d0f0; border-radius:12px; padding:14px 20px; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.download-bar-title { font-size:13px; font-weight:700; color:#1a2340; display:flex; align-items:center; gap:6px; }
.download-btns { display:flex; gap:10px; flex-wrap:wrap; }

/* Botones */
.btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.btn-sm { padding:6px 12px; font-size:12.5px; }
.btn.primary { background:#1a2f6e; color:#fff; box-shadow:0 2px 8px rgba(26,47,110,.25); }
.btn.primary:hover:not(:disabled) { background:#2c4fd4; }
.btn.secondary { background:#fff; color:#1a2340; border:1.5px solid #d4dae8; }
.btn.secondary:hover:not(:disabled) { background:#f0f4ff; border-color:#2c4fd4; color:#2c4fd4; }
.btn:disabled { opacity:.5; cursor:not-allowed; }
.download-btn { background:#1a2f6e; color:#fff; border:none; padding:9px 16px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:background .15s; }
.download-btn:hover:not(:disabled) { background:#2c4fd4; }
.download-btn.orange-btn { background:#c2410c; }
.download-btn.orange-btn:hover:not(:disabled) { background:#ea580c; }
.download-btn.green-btn { background:#15803d; }
.download-btn.green-btn:hover:not(:disabled) { background:#16a34a; }
.download-btn:disabled { opacity:.55; cursor:not-allowed; }
.form-actions { display:flex; gap:10px; margin-bottom:20px; }
.bloqueado-msg { display:flex; align-items:center; gap:8px; background:#dcfce7; border:1px solid #86efac; border-radius:8px; padding:12px 16px; font-size:13px; color:#15803d; font-weight:600; margin-bottom:20px; }
.estado-banner { display:flex; align-items:center; gap:10px; border-radius:10px; padding:12px 16px; font-size:13px; font-weight:600; margin-bottom:20px; }
.estado-banner.enviada   { background:#eff6ff; border:1px solid #93c5fd; color:#1d4ed8; }
.estado-banner.observada { background:#fef3c7; border:1px solid #fcd34d; color:#b45309; }
.estado-banner.aprobada  { background:#dcfce7; border:1px solid #86efac; color:#15803d; }
/* ── Ventana de rendición ─────────────────────────────────────── */
.ventana-card {
  background: #fff;
  border: 1px solid #d4dae8;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(26,47,110,.05);
  overflow: hidden;
}
.ventana-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: #f7f8fc;
  border-bottom: 1px solid #d4dae8;
  font-size: 13px;
  font-weight: 700;
  color: #1a2340;
}
.ventana-title { flex: 1; }
.ventana-transf {
  font-size: 11px;
  font-weight: 700;
  background: #e8edf9;
  color: #2c4fd4;
  padding: 2px 10px;
  border-radius: 20px;
}
.ventana-body { padding: 18px 20px; display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; }

.ventana-periodo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}
.ventana-item { display: flex; flex-direction: column; gap: 3px; }
.ventana-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #9ba6c0; }
.ventana-val { font-size: 13.5px; color: #1a2340; }
.ventana-val.bold { font-weight: 800; color: #2c4fd4; }
.ventana-arrow { color: #d4dae8; font-size: 18px; }
.ventana-divider { width: 1px; height: 36px; background: #d4dae8; }

/* Countdown */
.countdown-wrap {
  min-width: 220px;
  flex: 0 0 auto;
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.countdown-ok      { background: #f0fdf4; border: 1.5px solid #86efac; }
.countdown-proxima { background: #eff6ff; border: 1.5px solid #93c5fd; }
.countdown-critica { background: #fef3c7; border: 1.5px solid #fcd34d; }
.countdown-vencida { background: #fee2e2; border: 1.5px solid #fca5a5; }
.countdown-sin_fecha { background: #f7f8fc; border: 1.5px solid #d4dae8; }

.countdown-numero {
  font-size: 20px;
  font-weight: 800;
  color: #1a2340;
}
.countdown-ok      .countdown-numero { color: #15803d; }
.countdown-proxima .countdown-numero { color: #1d4ed8; }
.countdown-critica .countdown-numero { color: #92400e; }
.countdown-vencida .countdown-numero { color: #991b1b; }

.countdown-barra-bg {
  height: 6px;
  background: rgba(0,0,0,.08);
  border-radius: 99px;
  overflow: hidden;
}
.countdown-barra-fill {
  height: 100%;
  border-radius: 99px;
  transition: width .5s ease;
}
.barra-ok      { background: #16a34a; }
.barra-proxima { background: #2c4fd4; }
.barra-critica { background: #d97706; }
.barra-vencida { background: #dc2626; }
.barra-sin_fecha { background: #9ba6c0; }

.countdown-sub {
  font-size: 10.5px;
  color: #9ba6c0;
}.download-btn.purple-btn { background: #6d28d9; }
.download-btn.purple-btn:hover:not(:disabled) { background: #7c3aed; }
</style>