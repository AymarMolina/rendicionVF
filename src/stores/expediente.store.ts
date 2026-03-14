import { defineStore } from 'pinia'
import type { Expediente } from '@/types/rendicion'
import { mockExpedientes } from '@/mocks/data.mock'

export const useExpedienteStore = defineStore('expediente', {
  state: () => ({
    expedientes: [...mockExpedientes] as Expediente[],
  }),
  getters: {
    porId: (s) => (id: string) => s.expedientes.find(e => e.id === id) ?? null,
    porUT: (s) => (ut: string) => ut === 'Todas las UT' ? s.expedientes : s.expedientes.filter(e => e.ut === ut),
  },
})
