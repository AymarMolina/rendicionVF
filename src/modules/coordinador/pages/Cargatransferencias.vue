<template>
  <div class="carga-wrapper">
    <div class="page-header">
      <div>
        <h1>Carga masiva de transferencias</h1>
        <p class="subtitle">Importa asignaciones y transferencias desde un archivo Excel</p>
      </div>
      <button class="btn-secondary" @click="descargarPlantilla">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v9M4 7l4 4 4-4M2 13h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Descargar plantilla
      </button>
    </div>

    <div class="info-card">
      <div class="info-header">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v5M8 5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Estructura del Excel (una sola hoja, sin filas vacías entre datos)
      </div>
      <div class="cols-grid">
        <div class="col-group">
          <span class="group-label">Identificación</span>
          <div class="col-item required">A: codigo_ie</div>
          <div class="col-item required">B: ciclo_anio</div>
          <div class="col-item required">C: ciclo_mes</div>
        </div>
        <div class="col-group">
          <span class="group-label">Presupuesto por rubro</span>
          <div class="col-item required">D: monto_total</div>
          <div class="col-item">E: presup_alimentos</div>
          <div class="col-item">F: presup_transporte</div>
          <div class="col-item">G: presup_gas</div>
          <div class="col-item">H: presup_estipendio</div>
          <div class="col-item">I: presup_limpieza</div>
          <div class="col-item">J: presup_otros</div>
        </div>
        <div class="col-group">
          <span class="group-label">Transferencias</span>
          <div class="col-item required">K: trf_codigo</div>
          <div class="col-item required">L: trf_numero</div>
          <div class="col-item required">M: trf_monto</div>
          <div class="col-item">N: trf_fecha_envio</div>
          <div class="col-item">O: trf_fecha_recepcion</div>
          <div class="col-item">P: trf_estado</div>
        </div>
      </div>
      <p class="info-note">
        Los campos marcados con <span class="required-dot"></span> son obligatorios.
        Cada fila representa una transferencia. Si una IE tiene 2 transferencias en el mismo ciclo, repetir los datos de asignación en cada fila con diferente código de transferencia.
        Los estados válidos son: <code>pendiente</code> · <code>enviada</code> · <code>recibida</code> · <code>en_rendicion</code> · <code>rendida</code> · <code>observada</code> · <code>aprobada</code>
      </p>
    </div>

    <div
      class="drop-zone"
      :class="{ 'drag-over': isDragging, 'has-file': archivo !== null }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
      @click="$refs.fileInput.click()"
    >
      <input ref="fileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="onFileSelected" />
      <template v-if="!archivo">
        <div class="drop-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" stroke-width="1.5"/><path d="M16 10v12M10 16l6-6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <p class="drop-title">Arrastra el archivo aquí o haz clic para seleccionar</p>
        <p class="drop-sub">Formatos aceptados: .xlsx, .xls — máximo 5 MB</p>
      </template>
      <template v-else>
        <div class="file-info">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" stroke-width="1.5"/><polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="1.5"/></svg>
          <div>
            <p class="file-name">{{ archivo.name }}</p>
            <p class="file-size">{{ (archivo.size / 1024).toFixed(1) }} KB</p>
          </div>
          <button class="btn-remove" @click.stop="limpiar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>
      </template>
    </div>

    <div class="action-row" v-if="archivo && estado === 'idle'">
      <button class="btn-primary" @click="procesarArchivo" :disabled="procesando">
        <span v-if="!procesando">Validar y previsualizar</span>
        <span v-else class="loading-text">
          <svg class="spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="10"/></svg>
          Procesando...
        </span>
      </button>
    </div>

    <div v-if="estado === 'con_errores'" class="result-section">
      <div class="result-header error">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M9 5v5M9 12.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Se encontraron {{ errores.length }} error{{ errores.length !== 1 ? 'es' : '' }} — corrígelos antes de continuar
      </div>
      <div class="errors-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fila</th>
              <th>Campo</th>
              <th>Valor ingresado</th>
              <th>Descripción del error</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="err in errores" :key="err.fila + err.campo" class="error-row">
              <td><span class="badge badge-danger">{{ err.fila }}</span></td>
              <td><code>{{ err.campo }}</code></td>
              <td class="val-cell">{{ err.valor || '(vacío)' }}</td>
              <td class="msg-cell">{{ err.mensaje }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="actions-bar">
        <button class="btn-secondary" @click="limpiar">Cargar otro archivo</button>
      </div>
    </div>

    <div v-if="estado === 'previsualizando'" class="result-section">
      <div class="result-header success">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 9l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        {{ filas.length }} fila{{ filas.length !== 1 ? 's' : '' }} válida{{ filas.length !== 1 ? 's' : '' }} — revisa antes de guardar
      </div>

      <div class="summary-cards">
        <div class="summary-card">
          <span class="sc-label">Transferencias</span>
          <span class="sc-value">{{ filas.length }}</span>
        </div>
        <div class="summary-card">
          <span class="sc-label">Instituciones únicas</span>
          <span class="sc-value">{{ institucionesUnicas }}</span>
        </div>
        <div class="summary-card">
          <span class="sc-label">Ciclos únicos</span>
          <span class="sc-value">{{ ciclosUnicos }}</span>
        </div>
        <div class="summary-card">
          <span class="sc-label">Monto total</span>
          <span class="sc-value">S/ {{ montoTotal }}</span>
        </div>
      </div>

      <div class="data-table-wrapper">
        <table class="data-table preview-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Código IE</th>
              <th>Ciclo</th>
              <th>Monto total</th>
              <th>Alimentos</th>
              <th>Transporte</th>
              <th>Gas</th>
              <th>Estipendio</th>
              <th>Limpieza</th>
              <th>Otros</th>
              <th>Cód. transferencia</th>
              <th>N°</th>
              <th>Monto TRF</th>
              <th>F. envío</th>
              <th>F. recepción</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(fila, i) in filas" :key="i">
              <td class="num-cell">{{ i + 2 }}</td>
              <td><strong>{{ fila.codigo_ie }}</strong></td>
              <td>{{ fila.ciclo_anio }}/{{ String(fila.ciclo_mes).padStart(2,'0') }}</td>
              <td class="money-cell">{{ fmt(fila.monto_total) }}</td>
              <td class="money-cell">{{ fmt(fila.presup_alimentos) }}</td>
              <td class="money-cell">{{ fmt(fila.presup_transporte) }}</td>
              <td class="money-cell">{{ fmt(fila.presup_gas) }}</td>
              <td class="money-cell">{{ fmt(fila.presup_estipendio) }}</td>
              <td class="money-cell">{{ fmt(fila.presup_limpieza) }}</td>
              <td class="money-cell">{{ fmt(fila.presup_otros) }}</td>
              <td><code>{{ fila.trf_codigo }}</code></td>
              <td class="num-cell">{{ fila.trf_numero }}</td>
              <td class="money-cell">{{ fmt(fila.trf_monto) }}</td>
              <td>{{ fila.trf_fecha_envio || '—' }}</td>
              <td>{{ fila.trf_fecha_recepcion || '—' }}</td>
              <td><span class="estado-badge" :class="'est-' + fila.trf_estado">{{ fila.trf_estado }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions-bar">
        <button class="btn-secondary" @click="limpiar">Cancelar</button>
        <button class="btn-primary" @click="guardar" :disabled="guardando">
          <span v-if="!guardando">Guardar en base de datos</span>
          <span v-else class="loading-text">
            <svg class="spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="10"/></svg>
            Guardando...
          </span>
        </button>
      </div>
    </div>

    <div v-if="estado === 'guardado'" class="result-section">
      <div class="result-header success">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 9l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Datos guardados correctamente — {{ resultadoGuardado.transferencias }} transferencia{{ resultadoGuardado.transferencias !== 1 ? 's' : '' }} registrada{{ resultadoGuardado.transferencias !== 1 ? 's' : '' }}
      </div>
      <div class="success-detail">
        <p>Se procesaron <strong>{{ resultadoGuardado.asignaciones }}</strong> asignación{{ resultadoGuardado.asignaciones !== 1 ? 'es' : '' }} (nuevas o actualizadas) y <strong>{{ resultadoGuardado.transferencias }}</strong> transferencia{{ resultadoGuardado.transferencias !== 1 ? 's' : '' }}.</p>
      </div>
      <div class="actions-bar">
        <button class="btn-primary" @click="limpiar">Cargar otro archivo</button>
      </div>
    </div>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'

const ESTADOS_VALIDOS = ['pendiente','enviada','recibida','en_rendicion','rendida','observada','aprobada']
const ENCABEZADOS_REQUERIDOS = [
  'codigo_ie','ciclo_anio','ciclo_mes','monto_total',
  'presup_alimentos','presup_transporte','presup_gas',
  'presup_estipendio','presup_limpieza','presup_otros',
  'trf_codigo','trf_numero','trf_monto',
  'trf_fecha_envio','trf_fecha_recepcion','trf_estado'
]

export default {
  name: 'CargaTransferencias',

  data() {
    return {
      archivo: null,
      isDragging: false,
      procesando: false,
      guardando: false,
      estado: 'idle',    
      errores: [],
      filas: [],
      resultadoGuardado: { asignaciones: 0, transferencias: 0 }
    }
  },

  computed: {
    institucionesUnicas() {
      return new Set(this.filas.map(f => f.codigo_ie)).size
    },
    ciclosUnicos() {
      return new Set(this.filas.map(f => `${f.ciclo_anio}-${f.ciclo_mes}`)).size
    },
    montoTotal() {
      const total = this.filas.reduce((s, f) => s + Number(f.trf_monto || 0), 0)
      return total.toLocaleString('es-PE', { minimumFractionDigits: 2 })
    }
  },

  methods: {
    fmt(val) {
      if (val === null || val === undefined || val === '') return '—'
      return Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2 })
    },

    limpiar() {
      this.archivo = null
      this.estado = 'idle'
      this.errores = []
      this.filas = []
      this.procesando = false
      this.guardando = false
      if (this.$refs.fileInput) this.$refs.fileInput.value = ''
    },

    onDrop(e) {
      this.isDragging = false
      const file = e.dataTransfer.files[0]
      if (file) this.setArchivo(file)
    },

    onFileSelected(e) {
      const file = e.target.files[0]
      if (file) this.setArchivo(file)
    },

    setArchivo(file) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (!['xlsx','xls'].includes(ext)) {
        alert('Solo se aceptan archivos .xlsx o .xls')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo supera el límite de 5 MB')
        return
      }
      this.archivo = file
      this.estado = 'idle'
      this.errores = []
      this.filas = []
    },

    procesarArchivo() {
      if (!this.archivo) return
      this.procesando = true
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const datos = XLSX.utils.sheet_to_json(ws, { defval: '' })

          if (!datos || datos.length === 0) {
            this.errores = [{ fila: 2, campo: '—', valor: '', mensaje: 'El archivo no contiene datos o la primera fila no es el encabezado.' }]
            this.estado = 'con_errores'
            this.procesando = false
            return
          }

          const encabezados = Object.keys(datos[0])
          const faltantes = ENCABEZADOS_REQUERIDOS.filter(h => !encabezados.includes(h))
          if (faltantes.length > 0) {
            this.errores = faltantes.map(h => ({
              fila: 1,
              campo: h,
              valor: '',
              mensaje: `Columna requerida no encontrada en el Excel`
            }))
            this.estado = 'con_errores'
            this.procesando = false
            return
          }

          const errores = []
          const filasValidas = []

          datos.forEach((row, idx) => {
            const fila = idx + 2
            const e = (campo, valor, mensaje) => errores.push({ fila, campo, valor: String(valor), mensaje })

            if (!row.codigo_ie) e('codigo_ie', row.codigo_ie, 'El código de IE es obligatorio')
            if (!row.ciclo_anio) {
              e('ciclo_anio', row.ciclo_anio, 'El año del ciclo es obligatorio')
            } else if (isNaN(row.ciclo_anio) || Number(row.ciclo_anio) < 2020 || Number(row.ciclo_anio) > 2100) {
              e('ciclo_anio', row.ciclo_anio, 'El año debe ser un número entre 2020 y 2100')
            }
            if (!row.ciclo_mes) {
              e('ciclo_mes', row.ciclo_mes, 'El mes del ciclo es obligatorio')
            } else if (isNaN(row.ciclo_mes) || Number(row.ciclo_mes) < 1 || Number(row.ciclo_mes) > 12) {
              e('ciclo_mes', row.ciclo_mes, 'El mes debe ser un número entre 1 y 12')
            }
            if (row.monto_total === '' || row.monto_total === null) {
              e('monto_total', row.monto_total, 'El monto total es obligatorio')
            } else if (isNaN(row.monto_total) || Number(row.monto_total) <= 0) {
              e('monto_total', row.monto_total, 'El monto total debe ser un número positivo')
            }

            const rubros = ['presup_alimentos','presup_transporte','presup_gas','presup_estipendio','presup_limpieza','presup_otros']
            const todosTienenValor = rubros.every(r => row[r] !== '' && row[r] !== null && !isNaN(row[r]))
            if (todosTienenValor && row.monto_total !== '') {
              const sumaRubros = rubros.reduce((s, r) => s + Number(row[r] || 0), 0)
              const diff = Math.abs(sumaRubros - Number(row.monto_total))
              if (diff > 0.01) {
                e('monto_total', row.monto_total, `La suma de rubros (${sumaRubros.toFixed(2)}) no coincide con el monto total (${Number(row.monto_total).toFixed(2)})`)
              }
            }

            if (!row.trf_codigo) {
              e('trf_codigo', row.trf_codigo, 'El código de transferencia es obligatorio')
            }
            if (row.trf_numero === '' || row.trf_numero === null) {
              e('trf_numero', row.trf_numero, 'El número de transferencia es obligatorio')
            } else if (isNaN(row.trf_numero) || Number(row.trf_numero) < 1 || Number(row.trf_numero) > 4) {
              e('trf_numero', row.trf_numero, 'El número de transferencia debe ser 1, 2, 3 o 4')
            }
            if (row.trf_monto === '' || row.trf_monto === null) {
              e('trf_monto', row.trf_monto, 'El monto de la transferencia es obligatorio')
            } else if (isNaN(row.trf_monto) || Number(row.trf_monto) <= 0) {
              e('trf_monto', row.trf_monto, 'El monto de transferencia debe ser un número positivo')
            }

            const estadoVal = String(row.trf_estado || '').trim().toLowerCase()
            if (estadoVal && !ESTADOS_VALIDOS.includes(estadoVal)) {
              e('trf_estado', row.trf_estado, `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`)
            }

            const validarFecha = (campo, val) => {
              if (!val || val === '') return null
              const d = new Date(val)
              if (isNaN(d.getTime())) {
                e(campo, val, 'Formato de fecha inválido. Use DD/MM/YYYY o YYYY-MM-DD')
                return null
              }
              return d.toISOString().split('T')[0]
            }
            const fechaEnvio = validarFecha('trf_fecha_envio', row.trf_fecha_envio)
            const fechaRecepcion = validarFecha('trf_fecha_recepcion', row.trf_fecha_recepcion)

            if (errores.filter(e => e.fila === fila).length === 0) {
              filasValidas.push({
                codigo_ie:           String(row.codigo_ie).trim(),
                ciclo_anio:          Number(row.ciclo_anio),
                ciclo_mes:           Number(row.ciclo_mes),
                monto_total:         Number(row.monto_total),
                presup_alimentos:    Number(row.presup_alimentos || 0),
                presup_transporte:   Number(row.presup_transporte || 0),
                presup_gas:          Number(row.presup_gas || 0),
                presup_estipendio:   Number(row.presup_estipendio || 0),
                presup_limpieza:     Number(row.presup_limpieza || 0),
                presup_otros:        Number(row.presup_otros || 0),
                trf_codigo:          String(row.trf_codigo).trim(),
                trf_numero:          Number(row.trf_numero),
                trf_monto:           Number(row.trf_monto),
                trf_fecha_envio:     fechaEnvio,
                trf_fecha_recepcion: fechaRecepcion,
                trf_estado:          estadoVal || 'pendiente'
              })
            }
          })

          if (errores.length > 0) {
            this.errores = errores
            this.estado = 'con_errores'
          } else {
            this.filas = filasValidas
            this.estado = 'previsualizando'
          }
        } catch (err) {
          this.errores = [{ fila: '—', campo: '—', valor: '', mensaje: 'No se pudo leer el archivo. Verifica que sea un Excel válido.' }]
          this.estado = 'con_errores'
        }
        this.procesando = false
      }
      reader.readAsArrayBuffer(this.archivo)
    },

    async guardar() {
      this.guardando = true
      try {
        const res = await fetch('/api/transferencias/carga-masiva', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filas: this.filas })
        })
        if (!res.ok) {
          const err = await res.json()
          alert('Error del servidor: ' + (err.mensaje || res.statusText))
          this.guardando = false
          return
        }
        const data = await res.json()
        this.resultadoGuardado = {
          asignaciones:   data.asignaciones_procesadas  || 0,
          transferencias: data.transferencias_procesadas || 0
        }
        this.estado = 'guardado'
      } catch (err) {
        alert('Error de conexión al guardar: ' + err.message)
      }
      this.guardando = false
    },

    descargarPlantilla() {
      const encabezado = [ENCABEZADOS_REQUERIDOS]
      const ejemplo = [[
        '20124', 2025, 1, 15000, 7000, 2000, 1500, 2500, 1500, 500,
        'TRF-2025-0001', 1, 15000, '2025-01-05', '2025-01-06', 'recibida'
      ]]
      const ws = XLSX.utils.aoa_to_sheet([...encabezado, ...ejemplo])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Transferencias')
      XLSX.writeFile(wb, 'plantilla_carga_transferencias.xlsx')
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Figtree:wght@400;500;600&display=swap');

* { box-sizing: border-box; }

.carga-wrapper {
  font-family: 'Figtree', sans-serif;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  color: #1a1a1a;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}
.page-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}
.subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.btn-primary {
  background: #1a1a2e;
  color: #fff;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-family: 'Figtree', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity .15s;
}
.btn-primary:hover:not(:disabled) { opacity: .85; }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }

.btn-secondary {
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-family: 'Figtree', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background .15s;
}
.btn-secondary:hover { background: #f9fafb; }

.info-card {
  background: #f0f7ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}
.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1d4ed8;
  margin-bottom: 0.875rem;
}
.cols-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 0.875rem;
}
.col-group { display: flex; flex-direction: column; gap: 4px; }
.group-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #6b7280;
  margin-bottom: 4px;
}
.col-item {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.78rem;
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 5px;
  padding: 3px 8px;
  color: #1e40af;
}
.col-item.required {
  border-color: #93c5fd;
  background: #eff6ff;
}
.col-item.required::after {
  content: ' *';
  color: #dc2626;
}
.required-dot {
  display: inline-block;
  width: 6px; height: 6px;
  background: #dc2626;
  border-radius: 50%;
  vertical-align: middle;
  margin: 0 2px;
}
.info-note {
  font-size: 0.8rem;
  color: #374151;
  margin: 0;
  line-height: 1.6;
}
.info-note code {
  background: #dbeafe;
  color: #1e40af;
  padding: 1px 5px;
  border-radius: 4px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.76rem;
}

.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 2.5rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color .2s, background .2s;
  background: #fafafa;
}
.drop-zone:hover, .drop-zone.drag-over {
  border-color: #6366f1;
  background: #f5f3ff;
}
.drop-zone.has-file {
  border-style: solid;
  border-color: #d1d5db;
  background: #fff;
}
.drop-icon { color: #9ca3af; margin-bottom: 0.75rem; }
.drop-title { font-size: 0.9rem; font-weight: 500; color: #374151; margin: 0 0 4px; }
.drop-sub { font-size: 0.8rem; color: #9ca3af; margin: 0; }

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  color: #374151;
}
.file-name { font-size: 0.9rem; font-weight: 500; margin: 0; }
.file-size { font-size: 0.78rem; color: #9ca3af; margin: 0; }
.btn-remove {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}
.btn-remove:hover { color: #ef4444; background: #fee2e2; }

/* ACTION ROW */
.action-row {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

/* LOADING */
.loading-text {
  display: flex;
  align-items: center;
  gap: 8px;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* RESULT SECTION */
.result-section { margin-top: 1.5rem; }

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
}
.result-header.error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
.result-header.success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

/* ERRORS TABLE */
.errors-table-wrapper {
  overflow-x: auto;
  border: 1px solid #fee2e2;
  border-radius: 8px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.data-table th {
  background: #f9fafb;
  padding: 8px 12px;
  text-align: left;
  font-weight: 500;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}
.data-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
}
.error-row td { background: #fffbfb; }
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-danger { background: #fee2e2; color: #b91c1c; }
.val-cell { font-family: 'IBM Plex Mono', monospace; color: #6b7280; }
.msg-cell { color: #374151; }

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 1.25rem;
}
.summary-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sc-label { font-size: 0.75rem; color: #6b7280; font-weight: 500; }
.sc-value { font-size: 1.2rem; font-weight: 600; color: #1a1a2e; }

.data-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.preview-table th { font-size: 0.75rem; }
.preview-table td { font-size: 0.8rem; white-space: nowrap; }
.money-cell {
  text-align: right;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.78rem;
}
.num-cell { text-align: center; color: #9ca3af; }

.estado-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.est-pendiente     { background: #f3f4f6; color: #374151; }
.est-enviada       { background: #eff6ff; color: #1d4ed8; }
.est-recibida      { background: #f0fdf4; color: #15803d; }
.est-en_rendicion  { background: #fefce8; color: #854d0e; }
.est-rendida       { background: #f5f3ff; color: #6d28d9; }
.est-observada     { background: #fff7ed; color: #c2410c; }
.est-aprobada      { background: #dcfce7; color: #166534; }

.actions-bar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 1rem;
}

.success-detail {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}
.success-detail p { margin: 0; font-size: 0.9rem; color: #374151; }
.success-detail strong { color: #166534; }

@media (max-width: 600px) {
  .page-header { flex-direction: column; }
  .cols-grid { grid-template-columns: 1fr; }
}
</style>