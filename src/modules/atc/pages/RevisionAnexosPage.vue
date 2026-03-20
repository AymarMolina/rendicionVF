<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Centro de Documentos</h1>
        <p class="page-sub">Descarga y revisión de documentos por transferencia</p>
      </div>
      <button class="btn-refresh" @click="recargar" :disabled="atcStore.loadingLista || cargandoActas">
        <RefreshCw style="width:14px;height:14px" :class="{ spin: atcStore.loadingLista || cargandoActas }" />
        Actualizar
      </button>
    </div>

    <div class="filter-bar">
      <div class="nivel-pills">
        <button class="pill" :class="{ active: nivelFiltro === '' }" @click="nivelFiltro = ''">Todos</button>
        <button
          v-for="n in nivelesDisponibles" :key="n"
          class="pill" :class="[{ active: nivelFiltro === n }, n]"
          @click="nivelFiltro = nivelFiltro === n ? '' : n"
        >
          {{ nivelLabel(n) }}
        </button>
      </div>
      <div class="search-wrap">
        <Search style="width:14px;height:14px;position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#6b7597" />
        <input v-model="q" class="search-input" placeholder="Buscar por código o institución..." />
      </div>
    </div>

    <div v-if="atcStore.loadingLista" class="loading-row">
      <div class="spinner-lg" /> Cargando transferencias...
    </div>

    <template v-else>
      <div v-if="rendicionesFiltradas.length === 0" class="empty-state">
        <div style="font-size:40px;margin-bottom:12px">📂</div>
        No hay transferencias que coincidan
      </div>

      <div
        v-for="r in rendicionesFiltradas"
        :key="r.transferencia_id"
        class="transf-doc-card"
        :class="{ 'has-rendicion': r.rendicion_id, 'sin-rendicion': !r.rendicion_id }"
      >
        <!-- Cabecera -->
        <div class="tdc-header">
          <div class="tdc-info">
            <div class="tdc-top">
              <span class="nivel-badge" :class="r.nivel">{{ nivelLabel(r.nivel) }}</span>
              <span class="tdc-codigo">{{ r.codigo_transferencia }}</span>
              <span class="transf-num">{{ r.numero }}/{{ r.num_transferencias }}</span>
              <span class="tdc-ciclo">{{ r.ciclo }}</span>
            </div>
            <div class="tdc-mid">
              <span class="cod-mod">{{ r.codigo_modular }}</span>
              <span class="sep">·</span>
              <span class="ie-name">{{ r.nombre_institucion }}</span>
            </div>
            <div class="tdc-bot" v-if="r.tesorero">
              <UserCheck style="width:11px;height:11px" />
              {{ r.tesorero }}
            </div>
          </div>
          <div class="tdc-estado-wrap">
            <StatusBadge :status="r.estado" />
            <div v-if="!r.rendicion_id" class="sin-rend-badge">Sin rendición</div>
          </div>
        </div>

        <div class="docs-grid">
          <div class="doc-tile doc-acta">
            <div class="doc-tile-info">
              <div class="doc-tile-name">Acta de Comité</div>
              <div class="doc-tile-desc">
                <span v-if="actasPorAsig[r.asignacion_id]?.length">
                  {{ actasPorAsig[r.asignacion_id].length }} acta(s) disponible(s)
                </span>
                <span v-else class="sin-acta">Sin acta generada aún</span>
              </div>
            </div>
            <template v-if="actasPorAsig[r.asignacion_id]?.length">
              <button
                class="doc-btn doc-btn--download"
                @click="descargarActa(r, actasPorAsig[r.asignacion_id][0].id)"
                :disabled="descargando[`acta-${r.transferencia_id}`]"
              >
                <Download style="width:12px;height:12px" />
                {{ descargando[`acta-${r.transferencia_id}`] ? '...' : 'Descargar' }}
              </button>
            </template>
            <span v-else class="doc-btn--unavail">—</span>
          </div>

          <div class="doc-tile" :class="r.rendicion_id ? 'doc-disponible' : 'doc-no-disponible'">
            <div class="doc-tile-info">
              <div class="doc-tile-name">Balance de Gastos</div>
              <div class="doc-tile-desc">Resumen de comprobantes</div>
            </div>
            <button
              v-if="r.rendicion_id"
              class="doc-btn doc-btn--download"
              @click="descargar(r.transferencia_id, 'anexo3', `balance-${r.transferencia_id}.pdf`)"
              :disabled="descargando[`anexo3-${r.transferencia_id}`]"
            >
              <Download style="width:12px;height:12px" />
              {{ descargando[`anexo3-${r.transferencia_id}`] ? '...' : 'Descargar' }}
            </button>
            <span v-else class="doc-btn--unavail">Sin rendición</span>
          </div>

          <div class="doc-tile" :class="r.rendicion_id ? 'doc-disponible' : 'doc-no-disponible'">
            <div class="doc-tile-info">
              <div class="doc-tile-name">Declaraciones Juradas</div>
              <div class="doc-tile-desc">Gastos sin comprobante SUNAT</div>
            </div>
            <button
              v-if="r.rendicion_id"
              class="doc-btn doc-btn--download"
              @click="descargar(r.transferencia_id, 'dj-pdf', `dj-${r.transferencia_id}.pdf`)"
              :disabled="descargando[`dj-pdf-${r.transferencia_id}`]"
            >
              <Download style="width:12px;height:12px" />
              {{ descargando[`dj-pdf-${r.transferencia_id}`] ? '...' : 'Descargar' }}
            </button>
            <span v-else class="doc-btn--unavail">Sin rendición</span>
          </div>

          <div class="doc-tile" :class="r.rendicion_id ? 'doc-disponible' : 'doc-no-disponible'">
            <div class="doc-tile-info">
              <div class="doc-tile-name">Planilla de Movilidad</div>
              <div class="doc-tile-desc">Recorridos de transporte</div>
            </div>
            <button
              v-if="r.rendicion_id"
              class="doc-btn doc-btn--download"
              @click="descargar(r.transferencia_id, 'movilidad-pdf', `movilidad-${r.transferencia_id}.pdf`)"
              :disabled="descargando[`movilidad-pdf-${r.transferencia_id}`]"
            >
              <Download style="width:12px;height:12px" />
              {{ descargando[`movilidad-pdf-${r.transferencia_id}`] ? '...' : 'Descargar' }}
            </button>
            <span v-else class="doc-btn--unavail">Sin rendición</span>
          </div>

          <div class="doc-tile" :class="r.rendicion_id ? 'doc-disponible' : 'doc-no-disponible'">
            <div class="doc-tile-info">
              <div class="doc-tile-name">ZIP Comprobantes</div>
              <div class="doc-tile-desc">Todos los archivos adjuntos</div>
            </div>
            <button
              v-if="r.rendicion_id"
              class="doc-btn doc-btn--zip"
              @click="descargar(r.transferencia_id, 'comprobantes-zip', `comprobantes-${r.transferencia_id}.zip`)"
              :disabled="descargando[`comprobantes-zip-${r.transferencia_id}`]"
            >
              <Archive style="width:12px;height:12px" />
              {{ descargando[`comprobantes-zip-${r.transferencia_id}`] ? 'Comprimiendo...' : 'Descargar ZIP' }}
            </button>
            <span v-else class="doc-btn--unavail">Sin rendición</span>
          </div>
          <div class="doc-tile" :class="r.rendicion_id ? 'doc-disponible' : 'doc-no-disponible'">
          <div class="doc-tile-info">
            <div class="doc-tile-name">Recibo de Egreso</div>
            <div class="doc-tile-desc">Devolución de saldo no ejecutado</div>
          </div>
          <button
            v-if="r.rendicion_id"
            class="doc-btn doc-btn--download"
            @click="descargar(r.transferencia_id, 'recibo-egreso', `recibo-egreso-${r.transferencia_id}.pdf`)"
            :disabled="descargando[`recibo-egreso-${r.transferencia_id}`]"
          >
            <Download style="width:12px;height:12px" />
            {{ descargando[`recibo-egreso-${r.transferencia_id}`] ? '...' : 'Descargar' }}
          </button>
          <span v-else class="doc-btn--unavail">Sin rendición</span>
        </div>
          <div class="doc-tile doc-ver">
            <div class="doc-tile-info">
              <div class="doc-tile-name">Ver Rendición</div>
              <div class="doc-tile-desc">Revisar y aprobar/observar</div>
            </div>
            <button
              class="doc-btn doc-btn--ver"
              @click="irARevision(r)"
            >
              <ExternalLink style="width:12px;height:12px" />
              Ir a revisión
            </button>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Download, Archive, UserCheck, ExternalLink, RefreshCw } from 'lucide-vue-next'
import { useAtcStore }   from '@/stores/atc.store'
import { useToastStore } from '@/stores/toast.store'
import { useAuthStore }  from '@/stores/auth.store'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'

const atcStore  = useAtcStore()
const toast     = useToastStore()
const auth      = useAuthStore()
const router    = useRouter()
const BASE      = 'http://localhost:3000/api'

const q           = ref('')
const nivelFiltro = ref('')
const descargando    = reactive<Record<string, boolean>>({})
const actasPorAsig   = reactive<Record<number, any[]>>({})

function nivelLabel(n: string) {
  return ({ inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' }[n] ?? n)
}
function fmtFecha(f: string) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const nivelesDisponibles = computed(() => {
  const set = new Set<string>()
  atcStore.rendiciones.forEach((r: any) => { if (r.nivel) set.add(r.nivel) })
  return ['inicial','primaria','secundaria'].filter(n => set.has(n))
})

const rendicionesFiltradas = computed(() => {
  let lista = atcStore.rendiciones
  if (nivelFiltro.value) lista = lista.filter((r: any) => r.nivel === nivelFiltro.value)
  if (q.value.trim()) {
    const t = q.value.trim().toLowerCase()
    lista = lista.filter((r: any) =>
      r.codigo_transferencia?.toLowerCase().includes(t) ||
      r.nombre_institucion?.toLowerCase().includes(t) ||
      r.ciclo?.toLowerCase().includes(t)
    )
  }
  return lista
})

const cargandoActas = ref(false)

onMounted(async () => {
  await atcStore.cargarTodo()
  await cargarActas()
})

async function recargar() {
  await atcStore.cargarTodo()
  await cargarActas()
}

async function cargarActas() {
  cargandoActas.value = true
  try {
    const asigIds = [...new Set(atcStore.rendiciones.map((r: any) => r.asignacion_id).filter(Boolean))]
    await Promise.all(asigIds.map(async (aid: number) => {
      try {
        const res = await fetch(`${BASE}/actas?asignacion_id=${aid}`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        })
        if (res.ok) actasPorAsig[aid] = await res.json()
        else actasPorAsig[aid] = []
      } catch { actasPorAsig[aid] = [] }
    }))
  } finally {
    cargandoActas.value = false
  }
}

async function descargar(tid: any, endpoint: string, filename: string) {
  const key = `${endpoint}-${tid}`
  descargando[key] = true
  try {
    const res = await fetch(`${BASE}/rendiciones/${tid}/${endpoint}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error('Error', d.error || 'Error al descargar')
      return
    }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href)
  } finally {
    descargando[key] = false
  }
}

async function descargarActa(r: any, actaId: number) {
  const key = `acta-${r.transferencia_id}`
  descargando[key] = true
  try {
    const res = await fetch(`${BASE}/actas/${actaId}/descargar`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error('Error', d.error || 'Error al descargar acta')
      return
    }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `acta-${r.codigo_transferencia}.pdf`
    a.click(); URL.revokeObjectURL(a.href)
    toast.success('Acta descargada', `${r.codigo_transferencia}`)
  } finally {
    descargando[key] = false
  }
}

function irARevision(r: any) {
  router.push({ name: 'revision' })
}
</script>

<style scoped>
.page { width:100%; }
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.page-title { font-size:26px; font-weight:800; color:#1a2340; margin:0; }
.page-sub { font-size:13px; color:#6b7597; margin-top:2px; }

.btn-refresh {
  display:inline-flex; align-items:center; gap:7px;
  padding:8px 16px; border-radius:8px; font-size:13px; font-weight:700;
  cursor:pointer; border:1.5px solid #d4dae8; background:#fff; color:#1a2340;
  transition:all .15s;
}
.btn-refresh:hover:not(:disabled) { border-color:#2c4fd4; color:#2c4fd4; background:#f0f4ff; }
.btn-refresh:disabled { opacity:.5; cursor:not-allowed; }
.spin { animation:spin .7s linear infinite; }

/* Filter bar */
.filter-bar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
.nivel-pills { display:flex; gap:6px; align-items:center; }
.pill { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:20px; border:1.5px solid #d4dae8; background:#f9fafb; font-size:12px; font-weight:600; color:#6b7597; cursor:pointer; transition:all .15s; }
.pill:hover { border-color:#2c4fd4; color:#2c4fd4; background:#f0f4ff; }
.pill.active { background:#1a2f6e; color:#fff; border-color:#1a2f6e; }
.pill.active.inicial    { background:#0369a1; border-color:#0369a1; }
.pill.active.primaria   { background:#16a34a; border-color:#16a34a; }
.pill.active.secundaria { background:#b45309; border-color:#b45309; }
.search-wrap { position:relative; flex:1; min-width:240px; }
.search-input { width:100%; padding:8px 12px 8px 32px; border:1.5px solid #d4dae8; border-radius:8px; font-size:13px; outline:none; }
.search-input:focus { border-color:#2c4fd4; }

/* Loading / empty */
.loading-row { display:flex; align-items:center; gap:10px; padding:40px; justify-content:center; color:#6b7597; }
.spinner-lg { width:20px; height:20px; border:3px solid #d4dae8; border-top-color:#2c4fd4; border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.empty-state { text-align:center; padding:48px; color:#6b7597; font-size:14px; }

/* Transfer doc card */
.transf-doc-card {
  background:#fff; border:1.5px solid #d4dae8; border-radius:16px;
  margin-bottom:16px; overflow:hidden;
  box-shadow:0 2px 10px rgba(26,47,110,.06);
}
.transf-doc-card.has-rendicion { border-color:#d4dae8; }
.transf-doc-card.sin-rendicion { border-color:#e5e8f0; opacity:.85; }

/* Card header */
.tdc-header {
  display:flex; align-items:flex-start; justify-content:space-between;
  padding:16px 20px; border-bottom:1px solid #f0f2f8; gap:12px;
}
.tdc-info { display:flex; flex-direction:column; gap:5px; flex:1; }
.tdc-top { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.tdc-codigo { font-size:14px; font-weight:800; color:#2c4fd4; font-family:monospace; }
.transf-num { background:#f0f4ff; color:#2c4fd4; font-weight:700; font-size:11px; padding:2px 8px; border-radius:20px; }
.tdc-ciclo { font-size:11px; font-weight:600; background:#e8edf9; color:#2c4fd4; padding:2px 8px; border-radius:6px; }
.tdc-mid { font-size:12.5px; color:#6b7597; display:flex; align-items:center; gap:6px; }
.tdc-bot { font-size:11.5px; color:#9ba6c0; display:flex; align-items:center; gap:5px; }
.tdc-estado-wrap { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
.sin-rend-badge { font-size:10.5px; font-weight:700; background:#f0f2f8; color:#6b7597; padding:2px 9px; border-radius:20px; }

/* Badges */
.nivel-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; }
.nivel-badge.inicial    { background:#e0f2fe; color:#0369a1; }
.nivel-badge.primaria   { background:#dcfce7; color:#16a34a; }
.nivel-badge.secundaria { background:#fef3c7; color:#b45309; }
.cod-mod { font-size:11px; color:#9ba6c0; font-family:monospace; }
.ie-name { font-size:12.5px; color:#1a2340; }
.sep { color:#d4dae8; }

/* Documents grid */
.docs-grid {
  display:grid; grid-template-columns:repeat(3,1fr);
  gap:0;
}
.doc-tile {
  display:flex; align-items:center; gap:12px;
  padding:14px 18px; border-right:1px solid #f0f2f8; border-bottom:1px solid #f0f2f8;
  transition:background .15s;
}
.doc-tile:nth-child(3n) { border-right:none; }
.doc-tile:nth-last-child(-n+3) { border-bottom:none; }
.doc-tile:hover { background:#fafbfd; }

.doc-tile-icon { font-size:22px; flex-shrink:0; }
.doc-tile-info { flex:1; min-width:0; }
.doc-tile-name { font-size:13px; font-weight:700; color:#1a2340; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.doc-tile-desc { font-size:11px; color:#9ba6c0; margin-top:2px; }

/* Doc buttons */
.doc-btn {
  display:inline-flex; align-items:center; gap:5px; padding:6px 12px;
  border-radius:7px; font-size:11.5px; font-weight:700; cursor:pointer;
  border:none; white-space:nowrap; flex-shrink:0; transition:all .15s;
}
.doc-btn:disabled { opacity:.5; cursor:not-allowed; }

.doc-btn--generate { background:#1a2f6e; color:#fff; }
.doc-btn--generate:hover:not(:disabled) { background:#2c4fd4; }

.doc-btn--download { background:#e8edf9; color:#2c4fd4; }
.doc-btn--download:hover:not(:disabled) { background:#2c4fd4; color:#fff; }

.doc-btn--zip { background:#dcfce7; color:#15803d; }
.doc-btn--zip:hover:not(:disabled) { background:#15803d; color:#fff; }

.doc-btn--ver { background:#f0f4ff; color:#2c4fd4; border:1.5px solid #c5d0f0; }
.doc-btn--ver:hover { background:#2c4fd4; color:#fff; border-color:#2c4fd4; }

.doc-btn--unavail { font-size:11px; color:#9ba6c0; padding:6px 10px; }
.sin-acta { color:#dc2626; font-size:11px; font-style:italic; }

/* Tile variants */
.doc-acta { background:#f8faff; }
.doc-disponible { background:#fff; }
.doc-no-disponible { background:#fafbfd; }
.doc-ver { background:#f0f7ff; }
</style>