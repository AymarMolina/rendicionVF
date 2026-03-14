export interface Usuario {
  Operacion: number
  Autenticado: boolean
  Token: string
  Mensaje: string
  Correo: string | null
  PersonaId: number
  NumeroDocumento: string | null
  FotografiaDriveUrl: string | null
  NombreCompleto: string
  UsuarioId: number
  Rol?: 'Tesorero' | 'ATC' | 'Coordinador'
  IE?: string
  Zona?: string
}
