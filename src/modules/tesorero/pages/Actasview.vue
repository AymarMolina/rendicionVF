<template>
  <div class="page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Generar Acta</h1>
        <p class="page-sub">Acta de Asamblea del CGAE — Rendición de Cuentas</p>
      </div>
    </div>

    <div class="card selector-card" v-if="!asignacionSeleccionada">
      <div class="card-header">
        <span class="card-title-sm">Selecciona la Asignación</span>
      </div>
      <div class="selector-body">
        <p class="hint">Elige el ciclo y la institución para la cual deseas generar el acta.</p>
        <div v-if="loadingAsig" class="loading-row">
          <div class="spinner-lg" /> Cargando asignaciones...
        </div>
        <div class="asig-grid" v-else>
          <button
            v-for="a in asignaciones"
            :key="a.id"
            class="asig-card"
            @click="seleccionar(a)"
          >
            <div class="asig-ciclo">{{ a.ciclo }}</div>
            <div class="asig-ie">{{ a.institucion }}</div>
            <div class="asig-monto">S/ {{ fmt(a.monto_total) }}</div>
            <div class="asig-meta">{{ a.num_transferencias }} transferencia(s)</div>
          </button>
        </div>
      </div>
    </div>
    <template v-else>

      <div class="asig-banner">
        <div class="asig-banner-info">
          <span class="asig-banner-ciclo">{{ asignacionSeleccionada.ciclo }}</span>
          <span class="asig-banner-sep">·</span>
          <span class="asig-banner-ie">{{ asignacionSeleccionada.institucion }}</span>
          <span class="asig-banner-sep">·</span>
          <span class="asig-banner-monto">S/ {{ fmt(asignacionSeleccionada.monto_total) }}</span>
        </div>
        <button class="btn-cambiar" @click="asignacionSeleccionada = null">
          <RefreshCw class="ico14" /> Cambiar asignación
        </button>
      </div>

      <div class="two-col">

        <div class="card form-card">
          <div class="card-header">
            <span class="card-title-sm">
              <FilePlus class="ico14" /> Nueva Acta
            </span>
          </div>
          <div class="form-body">

            <div class="field">
              <label class="field-label">Fecha de la Asamblea del Comité</label>
              <input
                type="date"
                v-model="fechaComite"
                class="field-input"
                :max="hoy"
              />
              <span class="field-hint">
                Fecha en que se realiza la reunión del CGAE
              </span>
            </div>

            <div class="preview-block" v-if="asignacionSeleccionada">
              <div class="preview-title">Transferencias del ciclo</div>
              <div
                v-for="(t, i) in transferencias"
                :key="t.id"
                class="preview-row"
              >
                <span class="prev-ord">{{ ordinal[i] }}</span>
                <span class="prev-monto">S/ {{ fmt(t.monto) }}</span>
                <StatusBadge :status="t.estado" />
                <span class="prev-fecha">
                  {{ t.fecha_recepcion ? fmtFecha(t.fecha_recepcion) : 'Sin fecha' }}
                </span>
              </div>
              <div v-if="transferencias.length === 0" class="prev-empty">
                No hay transferencias registradas aún
              </div>
            </div>

            <div class="tesorero-block">
              <div class="tesorero-label">Tesorero firmante</div>
              <div class="tesorero-name">{{ auth.nombreCompleto }}</div>
              <div class="tesorero-rol">Tesorero del CGAE · {{ auth.ie || asignacionSeleccionada?.institucion }}</div>
            </div>

            <button
              class="btn primary full"
              :disabled="!fechaComite || generando"
              @click="generar"
            >
              <span v-if="generando" class="spinner-sm" />
              <FileDown v-else class="ico14" />
              {{ generando ? 'Generando PDF…' : 'Generar y Descargar Acta' }}
            </button>

            <div v-if="errorMsg" class="error-banner">
              {{ errorMsg }}
            </div>
            <div v-if="successMsg" class="success-banner">
              {{ successMsg }}
            </div>

          </div>
        </div>

        <div class="card historial-card">
          <div class="card-header">
            <span class="card-title-sm">
              <History class="ico14" /> Actas Generadas
            </span>
          </div>

          <div v-if="actasStore.loading" class="loading-row">
            <div class="spinner-lg" /> Cargando historial...
          </div>

          <div v-else-if="actasStore.actas.length === 0" class="empty-hist">
            <FileX class="empty-ico" />
            <p>Aún no se ha generado ninguna acta para esta asignación.</p>
          </div>

          <div v-else class="historial-list">
            <div
              v-for="a in actasStore.actas"
              :key="a.id"
              class="hist-item"
            >
              <div class="hist-ico-wrap">
                <FileText class="hist-ico" />
              </div>
              <div class="hist-info">
                <div class="hist-nombre">{{ a.pdf_nombre }}</div>
                <div class="hist-meta">
                  Comité: {{ fmtFecha(a.fecha_comite) }} ·
                  Generada por {{ a.generada_por_nombre }}
                </div>
                <div class="hist-fecha">{{ fmtDateTime(a.creado_en) }}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore }  from '@/stores/auth.store'
import { useActasStore } from '@/stores/actas.store'
import { useTransferenciasStore } from '@/stores/transferencias.store'
import StatusBadge from '@/components/ui/shared/StatusBadge.vue'
import {
  FilePlus, FileDown, FileText, FileX,
  History, RefreshCw
} from 'lucide-vue-next'

const auth          = useAuthStore()
const actasStore    = useActasStore()
const transfStore   = useTransferenciasStore()

const loadingAsig            = ref(false)
const asignaciones           = ref<any[]>([])
const asignacionSeleccionada = ref<any>(null)
const transferencias         = ref<any[]>([])
const fechaComite            = ref('')
const generando              = ref(false)
const errorMsg               = ref('')
const successMsg             = ref('')

const hoy     = new Date().toISOString().split('T')[0]
const ordinal = ['Primera','Segunda','Tercera','Cuarta']

onMounted(async () => {
  loadingAsig.value = true
  try {
    await transfStore.cargar()
    const vistas = transfStore.transferencias

    const map = new Map<number, any>()
    vistas.forEach((t: any) => {
      if (!map.has(t.asignacion_id)) {
        map.set(t.asignacion_id, {
          id:               t.asignacion_id,
          ciclo:            t.ciclo,
          institucion:      t.institucion,
          monto_total:      t.monto,       
          num_transferencias: 0
        })
      }
      map.get(t.asignacion_id).num_transferencias++
    })
    asignaciones.value = [...map.values()]
  } finally {
    loadingAsig.value = false
  }
})

async function seleccionar(a: any) {
  asignacionSeleccionada.value = a
  fechaComite.value            = ''
  errorMsg.value               = ''
  successMsg.value             = ''

  actasStore.cargar(a.id)

  transferencias.value = transfStore.transferencias.filter(
    (t: any) => t.asignacion_id === a.id
  )
}

async function generar() {
  errorMsg.value   = ''
  successMsg.value = ''
  generando.value  = true

  const ok = await actasStore.generarYDescargar(
    asignacionSeleccionada.value.id,
    fechaComite.value
  )

  generando.value = false
  if (ok) {
    successMsg.value = '✓ Acta generada y descargada correctamente. El registro fue guardado.'
    fechaComite.value = ''
  } else {
    errorMsg.value = 'Ocurrió un error al generar el acta. Intenta nuevamente.'
  }
}

function fmt(n: number) {
  return (n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function fmtDateTime(f: string) {
  return new Date(f).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<style scoped>
.page { width: 100%; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-title  { font-size: 26px; font-weight: 800; color: #1a2340; margin: 0; }
.page-sub    { font-size: 13px; color: #6b7597; margin-top: 2px; }

.card {
  background: #fff;
  border: 1px solid #d4dae8;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(26,47,110,.08);
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #d4dae8;
  gap: 8px;
}
.card-title-sm {
  font-size: 14px;
  font-weight: 700;
  color: #1a2340;
  display: flex;
  align-items: center;
  gap: 6px;
}

.selector-card {}
.selector-body { padding: 20px; }
.hint { font-size: 13px; color: #6b7597; margin-bottom: 16px; }
.asig-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.asig-card {
  background: #fafbfd;
  border: 1.5px solid #d4dae8;
  border-radius: 12px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: all .15s;
}
.asig-card:hover {
  border-color: #2c4fd4;
  background: #f0f4ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(44,79,212,.12);
}
.asig-ciclo  { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #2c4fd4; margin-bottom: 4px; }
.asig-ie     { font-size: 13px; font-weight: 700; color: #1a2340; margin-bottom: 8px; line-height: 1.3; }
.asig-monto  { font-size: 18px; font-weight: 800; color: #1a2340; }
.asig-meta   { font-size: 11px; color: #6b7597; margin-top: 4px; }

.asig-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f0f4ff;
  border: 1.5px solid #c5d0f0;
  border-radius: 10px;
  padding: 12px 18px;
  margin-bottom: 20px;
}
.asig-banner-info  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.asig-banner-ciclo { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #2c4fd4; }
.asig-banner-ie    { font-size: 13px; font-weight: 600; color: #1a2340; }
.asig-banner-monto { font-size: 13px; font-weight: 700; color: #16a34a; }
.asig-banner-sep   { color: #c5d0f0; font-weight: 300; }
.btn-cambiar {
  display: flex; align-items: center; gap: 5px;
  background: #fff; border: 1.5px solid #d4dae8; border-radius: 8px;
  padding: 7px 12px; font-size: 12.5px; font-weight: 600; color: #6b7597;
  cursor: pointer; transition: all .15s;
}
.btn-cambiar:hover { border-color: #2c4fd4; color: #2c4fd4; background: #f0f4ff; }

.two-col {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  align-items: start;
}

.form-card {}
.form-body  { padding: 20px; display: flex; flex-direction: column; gap: 18px; }
.field-label { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #6b7597; display: block; margin-bottom: 6px; }
.field-input {
  width: 100%; padding: 10px 12px;
  border: 1.5px solid #d4dae8; border-radius: 9px;
  font-size: 14px; color: #1a2340; outline: none;
  transition: border-color .15s; box-sizing: border-box;
}
.field-input:focus { border-color: #2c4fd4; }
.field-hint { font-size: 11.5px; color: #6b7597; margin-top: 5px; display: block; }

.preview-block {
  background: #fafbfd;
  border: 1px solid #d4dae8;
  border-radius: 10px;
  padding: 14px;
}
.preview-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7597; margin-bottom: 10px; letter-spacing: .4px; }
.preview-row   { display: flex; align-items: center; gap: 10px; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #f0f2f8; }
.preview-row:last-child { border-bottom: none; }
.prev-ord   { font-size: 11px; color: #6b7597; min-width: 58px; }
.prev-monto { font-weight: 700; color: #1a2340; min-width: 90px; }
.prev-fecha { font-size: 12px; color: #6b7597; margin-left: auto; }
.prev-empty { font-size: 12.5px; color: #6b7597; text-align: center; padding: 10px 0; }

.tesorero-block {
  background: #f0f4ff;
  border: 1px solid #c5d0f0;
  border-radius: 10px;
  padding: 12px 14px;
}
.tesorero-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: #2c4fd4; margin-bottom: 4px; letter-spacing: .4px; }
.tesorero-name  { font-size: 14px; font-weight: 700; color: #1a2340; }
.tesorero-rol   { font-size: 12px; color: #6b7597; margin-top: 2px; }

.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 18px; border-radius: 9px;
  font-size: 14px; font-weight: 700; cursor: pointer;
  border: none; transition: all .15s;
}
.btn.primary { background: #1a2f6e; color: #fff; }
.btn.primary:hover:not(:disabled) { background: #2c4fd4; }
.btn.primary:disabled { opacity: .55; cursor: not-allowed; }
.btn.full { width: 100%; justify-content: center; }

.error-banner   { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #dc2626; }
.success-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #16a34a; }

.historial-card {}
.historial-list { padding: 8px 0; }
.hist-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #f0f2f8;
  transition: background .12s;
}
.hist-item:last-child { border-bottom: none; }
.hist-item:hover { background: #f8f9fd; }
.hist-ico-wrap { background: #f0f4ff; border-radius: 8px; padding: 8px; flex-shrink: 0; }
.hist-ico { width: 18px; height: 18px; color: #2c4fd4; }
.hist-info { flex: 1; min-width: 0; }
.hist-nombre { font-size: 13px; font-weight: 700; color: #1a2340; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hist-meta   { font-size: 12px; color: #6b7597; margin-top: 3px; }
.hist-fecha  { font-size: 11px; color: #a0a8bf; margin-top: 2px; }

.empty-hist {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 24px; gap: 10px; color: #a0a8bf;
  font-size: 13px; text-align: center;
}
.empty-ico { width: 36px; height: 36px; opacity: .4; }

.loading-row {
  display: flex; align-items: center; gap: 10px;
  padding: 32px; justify-content: center; color: #6b7597; font-size: 13.5px;
}
.spinner-lg {
  width: 20px; height: 20px;
  border: 3px solid #d4dae8; border-top-color: #2c4fd4;
  border-radius: 50%; animation: spin .6s linear infinite;
}
.spinner-sm {
  width: 14px; height: 14px;
  border: 2.5px solid rgba(255,255,255,.4); border-top-color: #fff;
  border-radius: 50%; animation: spin .6s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
.ico14 { width: 14px; height: 14px; }
</style>