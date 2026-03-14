// ─── Usuarios ────────────────────────────────────────────────────────
export type RolUsuario = 'Tesorero' | 'ATC' | 'Coordinador'

export interface UsuarioApp {
  id: number
  usuario: string
  nombre: string
  rol: RolUsuario
  ie?: string
  zona?: string
  iiees?: number
  cargo?: string
}

// ─── Transferencias ──────────────────────────────────────────────────
export type EstadoTransferencia = 'Enviada' | 'En proceso' | 'Observada' | 'Pendiente'

export interface RubrosTransferencia {
  alimentos: number
  transporte: number
  gas: number
  estipendio: number
  limpieza: number
  otros: number
}

export interface Transferencia {
  id: string
  codigo: string
  fechaTransf: string
  fechaRendir: string
  monto: number
  sustentado: number
  saldo: number
  estado: EstadoTransferencia
  rubros: RubrosTransferencia
}

// ─── Gastos ──────────────────────────────────────────────────────────
export type EstadoGasto = 'VALIDO' | 'En proceso' | 'Observado'
export type RubroGasto = 'alimentos' | 'transporte' | 'gas' | 'estipendio' | 'limpieza' | 'otros'

export interface Gasto {
  id: number
  transferenciaId: string
  fecha: string
  concepto: string
  rubro: RubroGasto
  comprobante: string
  monto: number
  tieneRuc: boolean
  estado: EstadoGasto
}

export interface GastoCreacion {
  transferenciaId: string
  fecha: string
  concepto: string
  rubro: RubroGasto
  tieneRuc: boolean
  tipoComprobante?: string
  nComprobante?: string
  monto: number
}

// ─── Instituciones ───────────────────────────────────────────────────
export type EstadoIE = 'listo' | 'critico' | 'observado' | 'en_proceso'

export interface Institucion {
  id: string
  nombre: string
  alumnos: number
  tesorera: string
  progreso: number
  estado: EstadoIE
}

// ─── Rendición ───────────────────────────────────────────────────────
export interface RendicionDetalle {
  transferenciaId: string
  saldoAnterior: number
  transferencia: number
  totalGastos: number
  efectivo: number
  saldoFinal: number
  observaciones?: string
  estadoCuenta?: string
}

// ─── Capacitación ────────────────────────────────────────────────────
export type EstadoCapacitacion = 'Programada' | 'Borrador' | 'Realizada'

export interface Capacitacion {
  id: number
  tema: string
  fecha: string
  iees: string
  asistentes?: number
  descripcion?: string
  estado: EstadoCapacitacion
}

// ─── Menú ────────────────────────────────────────────────────────────
export type EstadoMenu = 'En curso' | 'Finalizado'
export type AmbitoMenu = 'Rural' | 'Urbana'
export type NivelMenu = 'Inicial' | 'Primaria' | 'Secundaria'

export interface MenuSemanal {
  id: number
  fechaInicio: string
  fechaFin: string
  ambito: AmbitoMenu
  nivel: NivelMenu
  estado: EstadoMenu
}

// ─── Expediente ──────────────────────────────────────────────────────
export type EstadoExpediente = 'Aprobado' | 'Pendiente' | 'Observado'

export interface Expediente {
  id: string
  ie: string
  transf: string
  tesorera: string
  ut: string
  estado: EstadoExpediente
  docs: string[]
}
