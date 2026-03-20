<template>
  <div class="page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Centro de Documentos</h1>
        <p class="page-sub">Vista Coordinador · Todas las instituciones</p>
      </div>
      <div class="header-actions">
        <button class="btn-outline" @click="expandirTodo">
          <ChevronsDown style="width:14px;height:14px" />
          Expandir todo
        </button>
        <button class="btn-outline" @click="colapsarTodo">
          <ChevronsUp style="width:14px;height:14px" />
          Colapsar todo
        </button>
        <button class="btn-refresh" @click="recargar" :disabled="cargando">
          <RefreshCw style="width:14px;height:14px" :class="{ spin: cargando }" />
          Actualizar
        </button>
      </div>
    </div>

    <!-- Stats globales clickeables -->
    <div class="global-stats" v-if="!cargando">
      <div
        class="gstat"
        :class="{ active: filtroEstado === '' }"
        @click="filtroEstado = ''"
        title="Ver todas"
      >
        <span class="gstat-num" style="color:#1a2340">{{ instituciones.length }}</span>
        <span class="gstat-lbl">Instituciones</span>
      </div>
      <div
        class="gstat"
        :class="{ active: filtroEstado === '' }"
        @click="filtroEstado = ''"
        title="Ver todas"
      >
        <span class="gstat-num" style="color:#2c4fd4">{{ transferencias.length }}</span>
        <span class="gstat-lbl">Transferencias</span>
      </div>
      <div
        class="gstat gstat-clickable"
        :class="{ active: filtroEstado === 'enviada' }"
        @click="toggleFiltroEstado('enviada')"
        title="Filtrar por: En revisión"
      >
        <span class="gstat-num" style="color:#1d4ed8">{{ transferencias.filter(r => r.estado === 'enviada').length }}</span>
        <span class="gstat-lbl">Por revisar</span>
      </div>
      <div
        class="gstat gstat-clickable"
        :class="{ active: filtroEstado === 'observada' }"
        @click="toggleFiltroEstado('observada')"
        title="Filtrar por: Observadas"
      >
        <span class="gstat-num" style="color:#f59e0b">{{ transferencias.filter(r => r.estado === 'observada').length }}</span>
        <span class="gstat-lbl">Observadas</span>
      </div>
      <div
        class="gstat gstat-clickable"
        :class="{ active: filtroEstado === 'aprobada' }"
        @click="toggleFiltroEstado('aprobada')"
        title="Filtrar por: Aprobadas"
      >
        <span class="gstat-num" style="color:#16a34a">{{ transferencias.filter(r => r.estado === 'aprobada').length }}</span>
        <span class="gstat-lbl">Aprobadas</span>
      </div>
      <div
        class="gstat gstat-clickable"
        :class="{ active: filtroEstado === 'sin_rendicion' }"
        @click="toggleFiltroEstado('sin_rendicion')"
        title="Filtrar por: Sin rendición"
      >
        <span class="gstat-num" style="color:#dc2626">{{ transferencias.filter(r => r.estado === 'sin_rendicion').length }}</span>
        <span class="gstat-lbl">Sin rendición</span>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filter-bar">
      <select class="filter-select" v-model="filtroCiclo">
        <option value="">Todos los ciclos</option>
        <option v-for="c in ciclosDisponibles" :key="c" :value="c">{{ c }}</option>
      </select>

      <div class="nivel-pills">
        <button class="pill" :class="{ active: filtroNivel === '' }" @click="filtroNivel = ''">Todos</button>
        <button
          v-for="n in ['inicial','primaria','secundaria']" :key="n"
          class="pill" :class="[{ active: filtroNivel === n }, n]"
          @click="filtroNivel = filtroNivel === n ? '' : n"
        >{{ nivelLabel(n) }}</button>
      </div>

      <!-- Filtro estado como pills -->
      <div class="estado-pills">
        <button
          class="pill estado-pill"
          :class="{ active: filtroEstado === '', 'all-active': filtroEstado === '' }"
          @click="filtroEstado = ''"
        >Todos los estados</button>
        <button
          v-for="e in estadosDisponibles" :key="e.val"
          class="pill estado-pill"
          :class="[{ active: filtroEstado === e.val }, e.val]"
          @click="toggleFiltroEstado(e.val)"
        >
          <component :is="e.icon" style="width:11px;height:11px" />
          {{ e.label }}
          <span class="pill-count">{{ transferencias.filter(r => r.estado === e.val).length }}</span>
        </button>
      </div>

      <div class="search-wrap">
        <Search style="width:14px;height:14px;position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#6b7597" />
        <input v-model="q" class="search-input" placeholder="Buscar institución, código, tesorero…" />
      </div>
    </div>

    <!-- Indicador de filtro activo -->
    <div v-if="filtroEstado" class="filtro-activo-bar">
      <component :is="estadoActualInfo?.icon" style="width:13px;height:13px" />
      Mostrando solo transferencias: <strong>{{ estadoActualInfo?.label }}</strong>
      <button class="clear-filtro" @click="filtroEstado = ''">✕ Quitar filtro</button>
    </div>

    <div v-if="cargando" class="loading-row">
      <div class="spinner-lg" /> Cargando instituciones…
    </div>

    <div v-else-if="institucionesFiltradas.length === 0" class="empty-state">
      <div style="font-size:40px;margin-bottom:12px">🔍</div>
      No hay instituciones que coincidan con los filtros
      <button v-if="filtroEstado" class="btn-clear-all" @click="limpiarFiltros">Limpiar filtros</button>
    </div>

    <template v-else>
      <div
        v-for="inst in institucionesFiltradas"
        :key="inst.id"
        class="inst-block"
        :class="{ expanded: expandidos.has(inst.id) }"
      >
        <div class="inst-header" @click="toggle(inst.id)">
          <div class="inst-chevron">
            <ChevronRight
              style="width:16px;height:16px;transition:transform .2s"
              :style="expandidos.has(inst.id) ? 'transform:rotate(90deg)' : ''"
            />
          </div>

          <div class="inst-info">
            <div class="inst-top">
              <span class="inst-codigo">{{ inst.codigo }}</span>
              <span class="inst-nombre">{{ inst.nombre }}</span>
            </div>
            <div class="inst-meta">
              <span>{{ inst.ugel }}</span>
              <span class="sep">·</span>
              <span>{{ inst.distrito }}</span>
              <span class="sep">·</span>
              <span>{{ inst.total_modulos }} módulo(s)</span>
              <!-- Mini resumen de estados de la institución -->
              <span class="sep">·</span>
              <span class="inst-mini-stats">
                <span v-if="instConteo(inst, 'aprobada')" class="mini-badge aprobada">✓ {{ instConteo(inst, 'aprobada') }}</span>
                <span v-if="instConteo(inst, 'enviada')"  class="mini-badge enviada">⏳ {{ instConteo(inst, 'enviada') }}</span>
                <span v-if="instConteo(inst, 'observada')" class="mini-badge observada">⚠ {{ instConteo(inst, 'observada') }}</span>
                <span v-if="instConteo(inst, 'sin_rendicion')" class="mini-badge sin_rendicion">– {{ instConteo(inst, 'sin_rendicion') }}</span>
              </span>
            </div>
          </div>

          <div class="inst-stats">
            <div class="istat" v-for="s in instStats(inst)" :key="s.label">
              <span class="istat-num" :class="s.cls">{{ s.val }}</span>
              <span class="istat-lbl">{{ s.label }}</span>
            </div>
          </div>

          <div class="inst-atc" v-if="inst.atc">
            <UserCheck style="width:12px;height:12px;color:#6b7597" />
            <span>{{ inst.atc }}</span>
          </div>
          <div class="inst-atc sin-atc" v-else>Sin ATC</div>

          <button
            class="btn-zip-inst"
            @click.stop="descargarZipInstitucion(inst)"
            :disabled="descargandoZip[inst.id]"
            title="Descargar ZIP con todos los documentos"
          >
            <Archive style="width:13px;height:13px" />
            {{ descargandoZip[inst.id] ? 'Generando…' : 'ZIP Total' }}
          </button>
        </div>

        <div v-if="expandidos.has(inst.id)" class="inst-body">
          <div
            v-for="r in transferenciasDeInst(inst.id)"
            :key="r.transferencia_id"
            class="transf-row"
            :class="[`estado-row-${r.estado}`, { 'sin-rendicion': !r.rendicion_id }]"
          >
            <!-- Banner aprobada en la fila -->
            <div v-if="r.estado === 'aprobada'" class="row-aprobada-mark">
              <CheckCircle style="width:12px;height:12px" /> Aprobada
            </div>

            <div class="tr-left">
              <div class="tr-top">
                <span class="nivel-badge" :class="r.nivel">{{ nivelLabel(r.nivel) }}</span>
                <span class="tr-codigo">{{ r.codigo_transferencia }}</span>
                <span class="transf-num">{{ r.numero }}/{{ r.num_transferencias }}</span>
                <span class="tr-ciclo">{{ r.ciclo }}</span>
                <StatusBadge :status="r.estado" />
              </div>
              <div class="tr-meta">
                <span class="cod-mod">{{ r.codigo_modular }}</span>
                <span class="sep">·</span>
                <span class="tr-monto">S/ {{ fmtMonto(r.monto_transferencia) }}</span>
                <span v-if="r.tesorero" class="tr-tesorero">
                  <UserCheck style="width:10px;height:10px" />
                  {{ r.tesorero }}
                </span>
              </div>
              <div class="progress-bar-wrap" v-if="r.rendicion_id">
                <div class="progress-bar-fill" :style="{ width: pctEjecucion(r) + '%', background: colorEjecucion(r) }"></div>
                <span class="progress-lbl">{{ pctEjecucion(r) }}% ejecutado</span>
              </div>
            </div>

            <div class="tr-docs" v-if="r.rendicion_id">
              <button class="doc-btn doc-btn--download" @click="descargar(r.transferencia_id, 'anexo3', `balance-${r.transferencia_id}.pdf`)" :disabled="descargando[`anexo3-${r.transferencia_id}`]" title="Balance de Gastos">
                <FileText style="width:11px;height:11px" />
                {{ descargando[`anexo3-${r.transferencia_id}`] ? '…' : 'Balance' }}
              </button>
              <button class="doc-btn doc-btn--download" @click="descargar(r.transferencia_id, 'dj-pdf', `dj-${r.transferencia_id}.pdf`)" :disabled="descargando[`dj-pdf-${r.transferencia_id}`]" title="Declaraciones Juradas">
                <FileText style="width:11px;height:11px" />
                {{ descargando[`dj-pdf-${r.transferencia_id}`] ? '…' : 'DJ' }}
              </button>
              <button class="doc-btn doc-btn--download" @click="descargar(r.transferencia_id, 'movilidad-pdf', `movilidad-${r.transferencia_id}.pdf`)" :disabled="descargando[`movilidad-pdf-${r.transferencia_id}`]" title="Planilla de Movilidad">
                <FileText style="width:11px;height:11px" />
                {{ descargando[`movilidad-pdf-${r.transferencia_id}`] ? '…' : 'Movilidad' }}
              </button>
              <button class="doc-btn doc-btn--download" @click="descargar(r.transferencia_id, 'recibo-egreso', `recibo-egreso-${r.transferencia_id}.pdf`)" :disabled="descargando[`recibo-egreso-${r.transferencia_id}`]" title="Recibo de Egreso">
                <FileText style="width:11px;height:11px" />
                {{ descargando[`recibo-egreso-${r.transferencia_id}`] ? '…' : 'Egreso' }}
              </button>
              <button class="doc-btn doc-btn--zip" @click="descargar(r.transferencia_id, 'comprobantes-zip', `comprobantes-${r.transferencia_id}.zip`)" :disabled="descargando[`comprobantes-zip-${r.transferencia_id}`]" title="ZIP comprobantes">
                <Archive style="width:11px;height:11px" />
                {{ descargando[`comprobantes-zip-${r.transferencia_id}`] ? '…' : 'ZIP' }}
              </button>
              <button v-if="actasPorAsig[r.asignacion_id]?.length" class="doc-btn doc-btn--acta" @click="descargarActa(r, actasPorAsig[r.asignacion_id][0].id)" :disabled="descargando[`acta-${r.transferencia_id}`]" title="Acta de Comité">
                <FileText style="width:11px;height:11px" />
                {{ descargando[`acta-${r.transferencia_id}`] ? '…' : 'Acta' }}
              </button>
            </div>

            <div v-else class="tr-sin-rend">Sin rendición registrada</div>
          </div>

          <div v-if="transferenciasDeInst(inst.id).length === 0" class="tr-empty">
            <span v-if="filtroEstado">Sin transferencias con estado "{{ estadoActualInfo?.label }}" en esta institución</span>
            <span v-else>Sin transferencias para los filtros seleccionados</span>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import {
  Search, Archive, UserCheck, RefreshCw,
  ChevronRight, ChevronsDown, ChevronsUp, FileText,
  CheckCircle, Clock, AlertCircle, FileEdit, XCircle
} from 'lucide-vue-next'
import { useAuthStore }  from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'

const auth  = useAuthStore()
const toast = useToastStore()
const BASE  = 'http://localhost:3000/api'

const instituciones  = ref<any[]>([])
const transferencias = ref<any[]>([])
const actasPorAsig   = reactive<Record<number, any[]>>({})
const descargando    = reactive<Record<string, boolean>>({})
const descargandoZip = reactive<Record<number, boolean>>({})
const cargando       = ref(false)
const expandidos     = ref(new Set<number>())

const q            = ref('')
const filtroCiclo  = ref('')
const filtroNivel  = ref('')
const filtroEstado = ref('')

const estadosDisponibles = [
  { val: 'aprobada',      label: 'Aprobadas',     icon: CheckCircle },
  { val: 'enviada',       label: 'En revisión',   icon: Clock       },
  { val: 'observada',     label: 'Observadas',    icon: AlertCircle },
  { val: 'borrador',      label: 'Borrador',      icon: FileEdit    },
  { val: 'sin_rendicion', label: 'Sin rendición', icon: XCircle     },
]

const estadoActualInfo = computed(() =>
  estadosDisponibles.find(e => e.val === filtroEstado.value) ?? null
)

function toggleFiltroEstado(val: string) {
  filtroEstado.value = filtroEstado.value === val ? '' : val
}

function limpiarFiltros() {
  filtroEstado.value = ''
  filtroNivel.value  = ''
  filtroCiclo.value  = ''
  q.value = ''
}

function nivelLabel(n: string) {
  return ({ inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' }[n] ?? n)
}
function fmtMonto(n: any) {
  return Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })
}
function pctEjecucion(r: any) {
  const pct = (Number(r.total_gastos_registrados) / Number(r.monto_transferencia)) * 100
  return Math.min(Math.round(pct), 100)
}
function colorEjecucion(r: any) {
  const p = pctEjecucion(r)
  if (p >= 95) return '#16a34a'
  if (p >= 70) return '#2c4fd4'
  if (p >= 40) return '#f59e0b'
  return '#dc2626'
}

function transferenciasDeInst(instId: number) {
  let lista = transferencias.value.filter(r => r.institucion_id === instId)
  if (filtroCiclo.value)  lista = lista.filter(r => r.ciclo === filtroCiclo.value)
  if (filtroNivel.value)  lista = lista.filter(r => r.nivel === filtroNivel.value)
  if (filtroEstado.value) lista = lista.filter(r => (r.estado ?? 'sin_rendicion') === filtroEstado.value)
  return lista
}

function instConteo(inst: any, estado: string) {
  return transferencias.value.filter(r =>
    r.institucion_id === inst.id &&
    (r.estado ?? 'sin_rendicion') === estado
  ).length
}

const ciclosDisponibles = computed(() => {
  const set = new Set<string>()
  transferencias.value.forEach(r => { if (r.ciclo) set.add(r.ciclo) })
  return [...set].sort()
})

const institucionesFiltradas = computed(() => {
  let lista = instituciones.value
  if (q.value.trim()) {
    const t = q.value.trim().toLowerCase()
    lista = lista.filter(i =>
      i.nombre?.toLowerCase().includes(t) ||
      i.codigo?.toLowerCase().includes(t) ||
      i.ugel?.toLowerCase().includes(t)   ||
      i.atc?.toLowerCase().includes(t)
    )
  }
  // Si hay filtros activos, solo mostrar institciones que tengan transferencias que coincidan
  if (filtroCiclo.value || filtroNivel.value || filtroEstado.value) {
    lista = lista.filter(i => transferenciasDeInst(i.id).length > 0)
  }
  return lista
})

function instStats(inst: any) {
  const ts = transferencias.value.filter(r => r.institucion_id === inst.id)
  return [
    { label: 'Total',      val: ts.length,                                                    cls: '' },
    { label: 'Revisión',   val: ts.filter(r => r.estado === 'enviada').length,                cls: 'azul' },
    { label: 'Aprobadas',  val: ts.filter(r => r.estado === 'aprobada').length,               cls: 'verde' },
    { label: 'Sin rend.',  val: ts.filter(r => (r.estado ?? 'sin_rendicion') === 'sin_rendicion').length, cls: 'rojo' },
  ]
}

function toggle(id: number) {
  const s = new Set(expandidos.value)
  if (s.has(id)) s.delete(id); else s.add(id)
  expandidos.value = s
}
function expandirTodo() {
  expandidos.value = new Set(institucionesFiltradas.value.map(i => i.id))
}
function colapsarTodo() {
  expandidos.value = new Set()
}

async function cargarInstituciones() {
  const res = await fetch(`${BASE}/coordinador/instituciones`, {
    headers: { Authorization: `Bearer ${auth.token}` }
  })
  if (!res.ok) throw new Error('Error al cargar instituciones')
  instituciones.value = await res.json()
}

async function cargarTransferencias() {
  const res = await fetch(`${BASE}/coordinador/transferencias`, {
    headers: { Authorization: `Bearer ${auth.token}` }
  })
  if (!res.ok) throw new Error('Error al cargar transferencias')
  transferencias.value = await res.json()
}

async function cargarActas() {
  const asigIds = [...new Set(transferencias.value.map(r => r.asignacion_id).filter(Boolean))] as number[]
  await Promise.all(asigIds.map(async (aid) => {
    try {
      const res = await fetch(`${BASE}/actas?asignacion_id=${aid}`, { headers: { Authorization: `Bearer ${auth.token}` } })
      actasPorAsig[aid] = res.ok ? await res.json() : []
    } catch { actasPorAsig[aid] = [] }
  }))
}

async function recargar() {
  cargando.value = true
  try {
    await Promise.all([cargarInstituciones(), cargarTransferencias()])
    await cargarActas()
  } catch (err: any) {
    toast.error('Error', err.message)
  } finally {
    cargando.value = false
  }
}

onMounted(recargar)

async function descargar(tid: any, endpoint: string, filename: string) {
  const key = `${endpoint}-${tid}`
  descargando[key] = true
  try {
    const res = await fetch(`${BASE}/rendiciones/${tid}/${endpoint}`, { headers: { Authorization: `Bearer ${auth.token}` } })
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error('Error', d.error || 'Error al descargar'); return }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href)
  } catch { toast.error('Error', 'No se pudo descargar') } finally { descargando[key] = false }
}

async function descargarActa(r: any, actaId: number) {
  const key = `acta-${r.transferencia_id}`
  descargando[key] = true
  try {
    const res = await fetch(`${BASE}/actas/${actaId}/descargar`, { headers: { Authorization: `Bearer ${auth.token}` } })
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error('Error', d.error || 'Error'); return }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `acta-${r.codigo_transferencia}.pdf`; a.click(); URL.revokeObjectURL(a.href)
  } finally { descargando[key] = false }
}

async function descargarZipInstitucion(inst: any) {
  descargandoZip[inst.id] = true
  try {
    const params = new URLSearchParams({ institucion_id: String(inst.id) })
    if (filtroCiclo.value) params.append('ciclo', filtroCiclo.value)
    const res = await fetch(`${BASE}/coordinador/zip-institucion?${params}`, { headers: { Authorization: `Bearer ${auth.token}` } })
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error('Error', d.error || 'Error al generar ZIP'); return }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${inst.codigo}-${inst.nombre.replace(/[^a-zA-Z0-9]/g, '-')}.zip`
    a.click(); URL.revokeObjectURL(a.href)
    toast.success('ZIP generado', inst.nombre)
  } catch { toast.error('Error', 'No se pudo generar el ZIP') } finally { descargandoZip[inst.id] = false }
}
</script>

<style scoped>
.page { width: 100%; }

/* ── Header ── */
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
.page-title { font-size: 26px; font-weight: 800; color: #1a2340; margin: 0; }
.page-sub   { font-size: 13px; color: #6b7597; margin-top: 2px; }
.header-actions { display: flex; gap: 8px; align-items: center; }

.btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer; border: 1.5px solid #d4dae8; background: #fff; color: #6b7597; transition: all .15s; }
.btn-outline:hover { border-color: #2c4fd4; color: #2c4fd4; background: #f0f4ff; }
.btn-refresh { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid #d4dae8; background: #fff; color: #1a2340; transition: all .15s; }
.btn-refresh:hover:not(:disabled) { border-color: #2c4fd4; color: #2c4fd4; background: #f0f4ff; }
.btn-refresh:disabled { opacity: .5; cursor: not-allowed; }
.spin { animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Stats globales clickeables ── */
.global-stats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.gstat {
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 18px; background: #fff; border: 2px solid #e5e8f0;
  border-radius: 12px; min-width: 88px; transition: all .15s;
}
.gstat.gstat-clickable { cursor: pointer; }
.gstat.gstat-clickable:hover { border-color: #2c4fd4; background: #f8faff; transform: translateY(-1px); }
.gstat.active { border-color: #2c4fd4 !important; background: #eef2ff !important; box-shadow: 0 3px 12px rgba(44,79,212,.15); }
.gstat-num { font-size: 22px; font-weight: 900; line-height: 1; }
.gstat-lbl { font-size: 11px; color: #6b7597; margin-top: 3px; text-align: center; }

/* ── Filtros ── */
.filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 10px; }
.filter-select { padding: 7px 10px; border: 1.5px solid #d4dae8; border-radius: 8px; font-size: 12.5px; color: #1a2340; background: #fff; outline: none; cursor: pointer; }
.filter-select:focus { border-color: #2c4fd4; }

.nivel-pills, .estado-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.pill { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 20px; border: 1.5px solid #d4dae8; background: #f9fafb; font-size: 12px; font-weight: 600; color: #6b7597; cursor: pointer; transition: all .15s; }
.pill:hover { border-color: #2c4fd4; color: #2c4fd4; background: #f0f4ff; }
.pill.active              { background: #1a2f6e; color: #fff; border-color: #1a2f6e; }
.pill.active.inicial      { background: #0369a1; border-color: #0369a1; }
.pill.active.primaria     { background: #16a34a; border-color: #16a34a; }
.pill.active.secundaria   { background: #b45309; border-color: #b45309; }
.pill.active.aprobada     { background: #15803d; border-color: #15803d; }
.pill.active.enviada      { background: #1d4ed8; border-color: #1d4ed8; }
.pill.active.observada    { background: #c2410c; border-color: #c2410c; }
.pill.active.borrador     { background: #475569; border-color: #475569; }
.pill.active.sin_rendicion{ background: #6b7280; border-color: #6b7280; }

.pill-count { background: rgba(255,255,255,.25); border-radius: 10px; padding: 0 6px; font-size: 10px; font-weight: 800; }
.pill:not(.active) .pill-count { background: #e5e8f0; color: #6b7597; }

.search-wrap { position: relative; flex: 1; min-width: 220px; }
.search-input { width: 100%; padding: 7px 12px 7px 32px; border: 1.5px solid #d4dae8; border-radius: 8px; font-size: 13px; outline: none; }
.search-input:focus { border-color: #2c4fd4; }

/* ── Banner de filtro activo ── */
.filtro-activo-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; margin-bottom: 14px; border-radius: 10px;
  background: #eef2ff; border: 1.5px solid #c7d2fe;
  font-size: 12.5px; color: #3730a3;
}
.clear-filtro { margin-left: auto; cursor: pointer; background: none; border: none; color: #6366f1; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 6px; transition: background .12s; }
.clear-filtro:hover { background: #e0e7ff; }
.btn-clear-all { display: block; margin: 12px auto 0; padding: 7px 18px; border-radius: 8px; border: 1.5px solid #d4dae8; background: #fff; color: #2c4fd4; font-size: 13px; font-weight: 700; cursor: pointer; }
.btn-clear-all:hover { background: #f0f4ff; }

/* ── Loading / Empty ── */
.loading-row { display: flex; align-items: center; gap: 10px; padding: 40px; justify-content: center; color: #6b7597; }
.spinner-lg { width: 20px; height: 20px; border: 3px solid #d4dae8; border-top-color: #2c4fd4; border-radius: 50%; animation: spin .6s linear infinite; }
.empty-state { text-align: center; padding: 48px; color: #6b7597; font-size: 14px; }

/* ── Card institución ── */
.inst-block { background: #fff; border: 1.5px solid #d4dae8; border-radius: 14px; margin-bottom: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(26,47,110,.05); transition: box-shadow .15s; }
.inst-block.expanded { box-shadow: 0 4px 18px rgba(26,47,110,.10); border-color: #b8c4e8; }
.inst-header { display: flex; align-items: center; gap: 12px; padding: 14px 18px; cursor: pointer; transition: background .15s; }
.inst-header:hover { background: #f8faff; }
.inst-chevron { flex-shrink: 0; color: #6b7597; }
.inst-info { flex: 1; min-width: 0; }
.inst-top  { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.inst-codigo { font-size: 11px; font-weight: 700; font-family: monospace; color: #9ba6c0; }
.inst-nombre { font-size: 14.5px; font-weight: 800; color: #1a2340; }
.inst-meta   { font-size: 11.5px; color: #6b7597; margin-top: 2px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.inst-mini-stats { display: flex; gap: 4px; }
.mini-badge { font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 20px; }
.mini-badge.aprobada     { background: #dcfce7; color: #15803d; }
.mini-badge.enviada      { background: #dbeafe; color: #1d4ed8; }
.mini-badge.observada    { background: #ffedd5; color: #c2410c; }
.mini-badge.sin_rendicion{ background: #f1f5f9; color: #94a3b8; }

.inst-stats { display: flex; gap: 10px; flex-shrink: 0; }
.istat { display: flex; flex-direction: column; align-items: center; min-width: 48px; }
.istat-num { font-size: 16px; font-weight: 900; color: #1a2340; line-height: 1; }
.istat-num.azul  { color: #2c4fd4; }
.istat-num.verde { color: #16a34a; }
.istat-num.rojo  { color: #dc2626; }
.istat-lbl { font-size: 10px; color: #9ba6c0; text-align: center; }

.inst-atc { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #6b7597; flex-shrink: 0; background: #f0f2f8; padding: 4px 10px; border-radius: 20px; }
.inst-atc.sin-atc { color: #dc2626; background: #fee2e2; }

.btn-zip-inst { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 9px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; background: #1a2f6e; color: #fff; flex-shrink: 0; transition: all .15s; }
.btn-zip-inst:hover:not(:disabled) { background: #2c4fd4; }
.btn-zip-inst:disabled { opacity: .5; cursor: not-allowed; }

/* ── Cuerpo expandido ── */
.inst-body { border-top: 1.5px solid #e8edf9; background: #f8faff; }

.transf-row { display: flex; align-items: center; gap: 14px; padding: 12px 22px; border-bottom: 1px solid #eef0f8; transition: background .12s; position: relative; }
.transf-row:last-child { border-bottom: none; }
.transf-row:hover { background: #f0f4ff; }
.transf-row.sin-rendicion { opacity: .72; }

/* Estado visual de la fila */
.estado-row-aprobada  { border-left: 3px solid #86efac !important; background: linear-gradient(90deg, #f0fdf4 0%, #f8faff 80px) !important; }
.estado-row-enviada   { border-left: 3px solid #93c5fd !important; }
.estado-row-observada { border-left: 3px solid #fdba74 !important; background: linear-gradient(90deg, #fff7ed 0%, #f8faff 80px) !important; }

/* Marca de aprobada en la fila */
.row-aprobada-mark {
  position: absolute; top: 6px; right: 10px;
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 800; color: #15803d;
  background: #dcfce7; padding: 2px 8px; border-radius: 20px; border: 1px solid #86efac;
}

.tr-left { flex: 1; min-width: 0; }
.tr-top  { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: 4px; }
.tr-codigo  { font-size: 13px; font-weight: 800; color: #2c4fd4; font-family: monospace; }
.transf-num { background: #e8edf9; color: #2c4fd4; font-weight: 700; font-size: 11px; padding: 1px 7px; border-radius: 20px; }
.tr-ciclo   { font-size: 11px; background: #f0f2f8; color: #6b7597; padding: 1px 7px; border-radius: 6px; }
.tr-meta    { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: #6b7597; flex-wrap: wrap; }
.cod-mod    { font-family: monospace; font-size: 11px; color: #9ba6c0; }
.tr-monto   { font-weight: 700; color: #1a2340; }
.tr-tesorero { display: flex; align-items: center; gap: 4px; color: #9ba6c0; }
.sep { color: #d4dae8; }

.progress-bar-wrap { position: relative; height: 5px; background: #e5e8f0; border-radius: 4px; margin-top: 6px; overflow: visible; }
.progress-bar-fill { height: 100%; border-radius: 4px; transition: width .3s; }
.progress-lbl { position: absolute; right: 0; top: -15px; font-size: 10px; color: #9ba6c0; }

.tr-docs { display: flex; flex-wrap: wrap; gap: 5px; flex-shrink: 0; }
.doc-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; cursor: pointer; border: none; white-space: nowrap; transition: all .15s; }
.doc-btn:disabled { opacity: .5; cursor: not-allowed; }
.doc-btn--download { background: #e8edf9; color: #2c4fd4; }
.doc-btn--download:hover:not(:disabled) { background: #2c4fd4; color: #fff; }
.doc-btn--zip { background: #dcfce7; color: #15803d; }
.doc-btn--zip:hover:not(:disabled) { background: #15803d; color: #fff; }
.doc-btn--acta { background: #fef3c7; color: #b45309; }
.doc-btn--acta:hover:not(:disabled) { background: #b45309; color: #fff; }

.tr-sin-rend { font-size: 11px; color: #9ba6c0; font-style: italic; flex-shrink: 0; }
.tr-empty { padding: 16px 22px; font-size: 12.5px; color: #9ba6c0; font-style: italic; }

.nivel-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
.nivel-badge.inicial    { background: #e0f2fe; color: #0369a1; }
.nivel-badge.primaria   { background: #dcfce7; color: #16a34a; }
.nivel-badge.secundaria { background: #fef3c7; color: #b45309; }
</style>