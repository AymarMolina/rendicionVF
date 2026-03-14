import { defineStore } from 'pinia'
import type { Institucion, Capacitacion, MenuSemanal } from '@/types/rendicion'
import { mockInstituciones, mockCapacitaciones, mockMenus } from '@/mocks/data.mock'

export const useInstitucionStore = defineStore('institucion', {
  state: () => ({
    instituciones: [...mockInstituciones] as Institucion[],
    capacitaciones: [...mockCapacitaciones] as Capacitacion[],
    menus: [...mockMenus] as MenuSemanal[],
    loading: false,
  }),
  getters: {
    porId: (s) => (id: string) => s.instituciones.find(i => i.id === id) ?? null,
    listos:   (s) => s.instituciones.filter(i => i.estado === 'listo').length,
    criticos: (s) => s.instituciones.filter(i => i.estado === 'critico').length,
  },
  actions: {
    agregarCapacitacion(c: Omit<Capacitacion, 'id'>) {
      this.capacitaciones.unshift({ id: Date.now(), ...c })
    },
    agregarMenu(m: Omit<MenuSemanal, 'id'>) {
      this.menus.unshift({ id: Date.now(), ...m })
    },
  },
})
