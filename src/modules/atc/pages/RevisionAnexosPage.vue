<template>
  <div class="page">

    <!-- Hero Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <FolderOpen style="width:22px;height:22px;color:#fff" />
        </div>
        <div>
          <h1 class="page-title">Centro de Documentos</h1>
          <p class="page-sub">Descarga y revisión de documentos por transferencia</p>
        </div>
      </div>
      <button class="btn-refresh" @click="recargar" :disabled="atcStore.loadingLista || cargandoActas">
        <RefreshCw style="width:14px;height:14px" :class="{ spin: atcStore.loadingLista || cargandoActas }" />
        Actualizar
      </button>
    </div>

    <!-- Stats bar -->
    <div class="stats-bar">
      <div class="stat-pill stat-aprobada">
        <CheckCircle style="width:13px;height:13px" />
        <span class="stat-num">{{ atcStore.conteo('aprobada') }}</span> Aprobadas
      </div>
      <div class="stat-pill stat-enviada">
        <Clock style="width:13px;height:13px" />
        <span class="stat-num">{{ atcStore.conteo('enviada') }}</span> En revisión
      </div>
      <div class="stat-pill stat-observada">
        <AlertCircle style="width:13px;height:13px" />
        <span class="stat-num">{{ atcStore.conteo('observada') }}</span> Observadas
      </div>
      <div class="stat-pill stat-borrador">
        <FileEdit style="width:13px;height:13px" />
        <span class="stat-num">{{ atcStore.conteo('borrador') }}</span> Borrador
      </div>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar">
      <div class="nivel-pills">
        <button class="pill" :class="{ active: nivelFiltro === '' }" @click="nivelFiltro = ''">Todos</button>
        <button
          v-for="n in nivelesDisponibles" :key="n"
          class="pill" :class="[{ active: nivelFiltro === n }, n]"
          @click="nivelFiltro = nivelFiltro === n ? '' : n"
        >{{ nivelLabel(n) }}</button>
      </div>
      <div class="search-wrap">
        <Search style="width:14px;height:14px;position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#6b7597" />
        <input v-model="q" class="search-input" placeholder="Buscar por código o institución..." />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="atcStore.loadingLista" class="loading-row">
      <div class="spinner-lg" /> Cargando transferencias...
    </div>

    <template v-else>
      <div v-if="rendicionesFiltradas.length === 0" class="empty-state">
        <div style="font-size:44px;margin-bottom:12px">📂</div>
        No hay transferencias que coincidan
      </div>

      <div
        v-for="r in rendicionesFiltradas"
        :key="r.transferencia_id"
        class="transf-doc-card"
        :class="[estadoClass(r.estado), { 'sin-rendicion': !r.rendicion_id }]"
      >
        <!-- Aprobada banner -->
        <div v-if="r.estado === 'aprobada'" class="aprobada-banner">
          <CheckCircle style="width:15px;height:15px" />
          RENDICIÓN APROBADA
          <CheckCircle style="width:15px;height:15px" />
        </div>

        <!-- Card header -->
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
            <div class="estado-chip" :class="r.estado">
              <component :is="estadoIcon(r.estado)" style="width:12px;height:12px" />
              {{ estadoLabel(r.estado) }}
            </div>
            <div v-if="!r.rendicion_id" class="sin-rend-badge">Sin rendición</div>
          </div>
        </div>

        <!-- Docs grid -->
        <div class="docs-grid">

          <!-- Acta de Comité -->
          <div class="doc-tile doc-acta">
            <div class="doc-tile-info">
              <div class="doc-tile-name">Acta de Comité</div>
              <div class="doc-tile-desc">
                <span v-if="actasPorAsig[r.asignacion_id]?.length">
                  {{ actasPorAsig[r.asignacion_id].length }} acta(s) disponible(s)
                </span>
                <span v-else class="sin-acta">Sin acta generada</span>
              </div>
            </div>
            <template v-if="actasPorAsig[r.asignacion_id]?.length">
              <button class="doc-btn doc-btn--download" @click="descargarActa(r, actasPorAsig[r.asignacion_id][0].id)" :disabled="descargando[`acta-${r.transferencia_id}`]">
                <Download style="width:11px;height:11px" />
                {{ descargando[`acta-${r.transferencia_id}`] ? '...' : 'Descargar' }}
              </button>
            </template>
            <span v-else class="doc-unavail">—</span>
          </div>

          <!-- Balance de Gastos -->
          <div class="doc-tile" :class="r.rendicion_id ? 'doc-on' : 'doc-off'">
            <div class="doc-tile-info">
              <div class="doc-tile-name">Balance de Gastos</div>
              <div class="doc-tile-desc">Resumen de comprobantes</div>
            </div>
            <button v-if="r.rendicion_id" class="doc-btn doc-btn--download" @click="descargar(r.transferencia_id, 'anexo3', `balance-${r.transferencia_id}.pdf`)" :disabled="descargando[`anexo3-${r.transferencia_id}`]">
              <Download style="width:11px;height:11px" />
              {{ descargando[`anexo3-${r.transferencia_id}`] ? '...' : 'Descargar' }}
            </button>
            <span v-else class="doc-unavail">Sin rendición</span>
          </div>

          <!-- Declaraciones Juradas -->
          <div class="doc-tile" :class="r.rendicion_id ? 'doc-on' : 'doc-off'">
            <div class="doc-tile-info">
              <div class="doc-tile-name">Declaraciones Juradas</div>
              <div class="doc-tile-desc">Gastos sin comprobante SUNAT</div>
            </div>
            <button v-if="r.rendicion_id" class="doc-btn doc-btn--download" @click="descargar(r.transferencia_id, 'dj-pdf', `dj-${r.transferencia_id}.pdf`)" :disabled="descargando[`dj-pdf-${r.transferencia_id}`]">
              <Download style="width:11px;height:11px" />
              {{ descargando[`dj-pdf-${r.transferencia_id}`] ? '...' : 'Descargar' }}
            </button>
            <span v-else class="doc-unavail">Sin rendición</span>
          </div>

          <!-- Planilla de Movilidad -->
          <div class="doc-tile" :class="r.rendicion_id ? 'doc-on' : 'doc-off'">
            <div class="doc-tile-info">
              <div class="doc-tile-name">Planilla de Movilidad</div>
              <div class="doc-tile-desc">Recorridos de transporte</div>
            </div>
            <button v-if="r.rendicion_id" class="doc-btn doc-btn--download" @click="descargar(r.transferencia_id, 'movilidad-pdf', `movilidad-${r.transferencia_id}.pdf`)" :disabled="descargando[`movilidad-pdf-${r.transferencia_id}`]">
              <Download style="width:11px;height:11px" />
              {{ descargando[`movilidad-pdf-${r.transferencia_id}`] ? '...' : 'Descargar' }}
            </button>
            <span v-else class="doc-unavail">Sin rendición</span>
          </div>

          <!-- ZIP Comprobantes -->
          <div class="doc-tile" :class="r.rendicion_id ? 'doc-on' : 'doc-off'">
            <div class="doc-tile-info">
              <div class="doc-tile-name">ZIP Comprobantes</div>
              <div class="doc-tile-desc">Todos los archivos adjuntos</div>
            </div>
            <button v-if="r.rendicion_id" class="doc-btn doc-btn--zip" @click="descargar(r.transferencia_id, 'comprobantes-zip', `comprobantes-${r.transferencia_id}.zip`)" :disabled="descargando[`comprobantes-zip-${r.transferencia_id}`]">
              <Archive style="width:11px;height:11px" />
              {{ descargando[`comprobantes-zip-${r.transferencia_id}`] ? 'Comprimiendo...' : 'Descargar ZIP' }}
            </button>
            <span v-else class="doc-unavail">Sin rendición</span>
          </div>

          <!-- Recibo de Egreso -->
          <div class="doc-tile" :class="r.rendicion_id ? 'doc-on' : 'doc-off'">
            <div class="doc-tile-info">
              <div class="doc-tile-name">Recibo de Egreso</div>
              <div class="doc-tile-desc">Devolución de saldo no ejecutado</div>
            </div>
            <button v-if="r.rendicion_id" class="doc-btn doc-btn--download" @click="descargar(r.transferencia_id, 'recibo-egreso', `recibo-egreso-${r.transferencia_id}.pdf`)" :disabled="descargando[`recibo-egreso-${r.transferencia_id}`]">
              <Download style="width:11px;height:11px" />
              {{ descargando[`recibo-egreso-${r.transferencia_id}`] ? '...' : 'Descargar' }}
            </button>
            <span v-else class="doc-unavail">Sin rendición</span>
          </div>

          <!-- Ver Rendición (full width) -->
          <div class="doc-tile doc-ver-tile">
            <div class="doc-tile-info">
              <div class="doc-tile-name">Revisar Rendición</div>
              <div class="doc-tile-desc">Abrir para aprobar u observar</div>
            </div>
            <button class="doc-btn doc-btn--ver" @click="irARevision(r)">
              <ExternalLink style="width:11px;height:11px" />
              Ir a revisión
            </button>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, Download, Archive, UserCheck, ExternalLink, RefreshCw,
  CheckCircle, Clock, AlertCircle, FileEdit, FolderOpen
} from 'lucide-vue-next'
import { useAtcStore }   from '@/stores/atc.store'
import { useToastStore } from '@/stores/toast.store'
import { useAuthStore }  from '@/stores/auth.store'

const atcStore  = useAtcStore()
const toast     = useToastStore()
const auth      = useAuthStore()
const router    = useRouter()
const BASE      = 'http://localhost:3000/api'

const q              = ref('')
const nivelFiltro    = ref('')
const descargando    = reactive<Record<string, boolean>>({})
const actasPorAsig   = reactive<Record<number, any[]>>({})
const cargandoActas  = ref(false)

function nivelLabel(n: string) {
  return ({ inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' }[n] ?? n)
}

function estadoLabel(e: string) {
  return ({
    aprobada:      'Aprobada',
    enviada:       'En Revisión',
    observada:     'Observada',
    borrador:      'Borrador',
    sin_rendicion: 'Sin Rendición',
  }[e] ?? e)
}

function estadoClass(e: string) {
  return `estado-${e ?? 'sin_rendicion'}`
}

function estadoIcon(e: string) {
  return ({
    aprobada:      CheckCircle,
    enviada:       Clock,
    observada:     AlertCircle,
    borrador:      FileEdit,
    sin_rendicion: FileEdit,
  }[e] ?? FileEdit)
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
        actasPorAsig[aid] = res.ok ? await res.json() : []
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
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error('Error', d.error || 'Error al descargar'); return }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href)
  } finally { descargando[key] = false }
}

async function descargarActa(r: any, actaId: number) {
  const key = `acta-${r.transferencia_id}`
  descargando[key] = true
  try {
    const res = await fetch(`${BASE}/actas/${actaId}/descargar`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error('Error', d.error || 'Error al descargar acta'); return }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `acta-${r.codigo_transferencia}.pdf`
    a.click(); URL.revokeObjectURL(a.href)
    toast.success('Acta descargada', `${r.codigo_transferencia}`)
  } finally { descargando[key] = false }
}

function irARevision(r: any) {
  router.push({ name: 'revision' })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

* { font-family: 'Plus Jakarta Sans', sans-serif; }

.page { width: 100%; padding-bottom: 40px; }

/* ── Header ─────────────────────────────────────────────── */
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px; gap: 16px;
}
.header-left { display: flex; align-items: center; gap: 14px; }
.header-icon {
  width: 48px; height: 48px; border-radius: 14px;
  background: linear-gradient(135deg, #1a2f6e 0%, #2c4fd4 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 20px rgba(44,79,212,.35);
  flex-shrink: 0;
}
.page-title { font-size: 24px; font-weight: 900; color: #0f1733; margin: 0; letter-spacing: -.4px; }
.page-sub { font-size: 12.5px; color: #8896b3; margin-top: 2px; }

.btn-refresh {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 700;
  cursor: pointer; border: 2px solid #e2e8f5; background: #fff; color: #1a2340;
  transition: all .18s; letter-spacing: -.1px;
}
.btn-refresh:hover:not(:disabled) { border-color: #2c4fd4; color: #2c4fd4; background: #f0f4ff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(44,79,212,.15); }
.btn-refresh:disabled { opacity: .45; cursor: not-allowed; }
.spin { animation: spin .7s linear infinite; }

/* ── Stats bar ───────────────────────────────────────────── */
.stats-bar {
  display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px;
}
.stat-pill {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 14px; border-radius: 30px; font-size: 12px; font-weight: 700;
  border: 2px solid transparent;
}
.stat-num { font-size: 16px; font-weight: 900; }
.stat-aprobada { background: #ecfdf5; color: #15803d; border-color: #bbf7d0; }
.stat-enviada  { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.stat-observada{ background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
.stat-borrador { background: #f8fafc; color: #475569; border-color: #e2e8f0; }

/* ── Filter bar ──────────────────────────────────────────── */
.filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
.nivel-pills { display: flex; gap: 6px; }
.pill {
  padding: 6px 14px; border-radius: 20px; border: 2px solid #e2e8f5;
  background: #f9fafb; font-size: 12px; font-weight: 700; color: #6b7597; cursor: pointer; transition: all .15s;
}
.pill:hover { border-color: #2c4fd4; color: #2c4fd4; background: #f0f4ff; }
.pill.active { background: #0f1733; color: #fff; border-color: #0f1733; }
.pill.active.inicial    { background: #0369a1; border-color: #0369a1; }
.pill.active.primaria   { background: #16a34a; border-color: #16a34a; }
.pill.active.secundaria { background: #b45309; border-color: #b45309; }
.search-wrap { position: relative; flex: 1; min-width: 240px; }
.search-input {
  width: 100%; padding: 9px 12px 9px 34px; border: 2px solid #e2e8f5;
  border-radius: 10px; font-size: 13px; outline: none; font-family: inherit;
  transition: border-color .15s; background: #fff;
}
.search-input:focus { border-color: #2c4fd4; box-shadow: 0 0 0 3px rgba(44,79,212,.08); }

/* ── Loading / Empty ─────────────────────────────────────── */
.loading-row { display: flex; align-items: center; gap: 10px; padding: 60px; justify-content: center; color: #6b7597; font-weight: 600; }
.spinner-lg { width: 20px; height: 20px; border: 3px solid #e2e8f5; border-top-color: #2c4fd4; border-radius: 50%; animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 60px; color: #6b7597; font-size: 14px; font-weight: 600; }

/* ── Card ────────────────────────────────────────────────── */
.transf-doc-card {
  background: #fff; border: 2px solid #e2e8f5; border-radius: 18px;
  margin-bottom: 16px; overflow: hidden;
  box-shadow: 0 2px 12px rgba(15,23,51,.05);
  transition: box-shadow .2s, border-color .2s;
}
.transf-doc-card:hover { box-shadow: 0 6px 24px rgba(15,23,51,.10); }

/* State-specific card styles */
.estado-aprobada {
  border-color: #86efac !important;
  box-shadow: 0 4px 24px rgba(21,128,61,.12) !important;
  background: linear-gradient(180deg, #f0fdf4 0%, #fff 60px) !important;
}
.estado-enviada   { border-color: #93c5fd !important; }
.estado-observada { border-color: #fdba74 !important; background: linear-gradient(180deg, #fff7ed 0%, #fff 60px) !important; }
.estado-borrador  { border-color: #e2e8f0 !important; opacity: .9; }
.sin-rendicion    { border-color: #e9ecf2 !important; opacity: .75; }

/* ── Aprobada banner ─────────────────────────────────────── */
.aprobada-banner {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: linear-gradient(90deg, #15803d 0%, #16a34a 50%, #15803d 100%);
  color: #fff; font-size: 11.5px; font-weight: 900; letter-spacing: 2px;
  padding: 7px 20px; text-transform: uppercase;
  animation: shimmer 2.5s infinite;
  background-size: 200% 100%;
}
@keyframes shimmer {
  0%   { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}

/* ── Card header ─────────────────────────────────────────── */
.tdc-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1.5px solid #f0f2f8; gap: 12px;
}
.tdc-info { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.tdc-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tdc-codigo { font-size: 13.5px; font-weight: 800; color: #2c4fd4; font-family: 'JetBrains Mono', monospace; letter-spacing: .3px; }
.transf-num { background: #eef2ff; color: #4f46e5; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 20px; }
.tdc-ciclo { font-size: 11px; font-weight: 700; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; }
.tdc-mid { font-size: 12.5px; color: #64748b; display: flex; align-items: center; gap: 6px; }
.tdc-bot { font-size: 11.5px; color: #94a3b8; display: flex; align-items: center; gap: 5px; }
.tdc-estado-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }

/* Estado chip */
.estado-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 800;
}
.estado-chip.aprobada  { background: #dcfce7; color: #15803d; border: 1.5px solid #86efac; }
.estado-chip.enviada   { background: #dbeafe; color: #1d4ed8; border: 1.5px solid #93c5fd; }
.estado-chip.observada { background: #ffedd5; color: #c2410c; border: 1.5px solid #fdba74; }
.estado-chip.borrador  { background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; }
.estado-chip.sin_rendicion { background: #f8fafc; color: #94a3b8; border: 1.5px solid #e2e8f0; }

.sin-rend-badge { font-size: 10.5px; font-weight: 700; background: #f1f5f9; color: #94a3b8; padding: 2px 9px; border-radius: 20px; }

/* Badges nivel */
.nivel-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: .3px; }
.nivel-badge.inicial    { background: #e0f2fe; color: #0369a1; }
.nivel-badge.primaria   { background: #dcfce7; color: #16a34a; }
.nivel-badge.secundaria { background: #fef3c7; color: #b45309; }
.cod-mod { font-size: 11px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
.ie-name { font-size: 12.5px; color: #1e293b; font-weight: 600; }
.sep { color: #e2e8f0; }

/* ── Docs grid ───────────────────────────────────────────── */
.docs-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
}
.doc-tile {
  display: flex; align-items: center; gap: 11px;
  padding: 14px 16px; border-right: 1.5px solid #f0f2f8; border-bottom: 1.5px solid #f0f2f8;
  transition: background .15s;
}
.doc-tile:nth-child(3n)     { border-right: none; }
.doc-tile:nth-last-child(-n+3) { border-bottom: none; }
.doc-tile:hover { background: #f8fafc; }

.doc-icon-wrap { font-size: 20px; flex-shrink: 0; line-height: 1; }
.doc-tile-info { flex: 1; min-width: 0; }
.doc-tile-name { font-size: 12.5px; font-weight: 800; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.doc-tile-desc { font-size: 11px; color: #94a3b8; margin-top: 1px; }

/* Full-width ver tile */
.doc-ver-tile {
  grid-column: 1 / -1;
  background: linear-gradient(90deg, #f8faff 0%, #f0f4ff 100%);
  border-right: none !important;
}
.doc-ver-tile:hover { background: linear-gradient(90deg, #eef2ff 0%, #e0e7ff 100%) !important; }

/* On/off states */
.doc-on  { background: #fff; }
.doc-off { background: #fafbfd; }
.doc-off .doc-tile-name { color: #94a3b8; }
.doc-acta { background: #fafbff; }

/* Buttons */
.doc-btn {
  display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px;
  border-radius: 8px; font-size: 11.5px; font-weight: 800; cursor: pointer;
  border: none; white-space: nowrap; flex-shrink: 0; transition: all .15s;
  letter-spacing: -.1px; font-family: inherit;
}
.doc-btn:disabled { opacity: .45; cursor: not-allowed; }

.doc-btn--download { background: #eef2ff; color: #4f46e5; }
.doc-btn--download:hover:not(:disabled) { background: #4f46e5; color: #fff; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(79,70,229,.25); }

.doc-btn--zip { background: #dcfce7; color: #15803d; }
.doc-btn--zip:hover:not(:disabled) { background: #15803d; color: #fff; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(21,128,61,.25); }

.doc-btn--ver { background: #eef2ff; color: #4f46e5; border: 2px solid #c7d2fe; }
.doc-btn--ver:hover:not(:disabled) { background: #4f46e5; color: #fff; border-color: #4f46e5; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(79,70,229,.3); }

.doc-unavail { font-size: 11px; color: #cbd5e1; padding: 6px 10px; font-weight: 600; }
.sin-acta { color: #ef4444; font-size: 11px; font-weight: 700; }
</style>