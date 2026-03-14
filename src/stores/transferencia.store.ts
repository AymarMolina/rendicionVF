import { defineStore } from 'pinia'
import type { Transferencia, GastoCreacion, Gasto } from '@/types/rendicion'
import { mockTransferencias, mockGastos } from '@/mocks/data.mock'

export const useTransferenciaStore = defineStore('transferencia', {
  state: () => ({
    transferencias: [...mockTransferencias] as Transferencia[],
    gastos: [...mockGastos] as Gasto[],
    loading: false,
  }),
  getters: {
    porId: (s) => (id: string) => s.transferencias.find(t => t.id === id) ?? null,
    gastosPorTransferencia: (s) => (id: string) => s.gastos.filter(g => g.transferenciaId === id),
    activa: (s) => s.transferencias.find(t => t.estado === 'Pendiente' || t.estado === 'En proceso') ?? s.transferencias[0],
    totalRecibido: (s) => s.transferencias.reduce((a, t) => a + t.monto, 0),
    totalSustentado: (s) => s.transferencias.reduce((a, t) => a + t.sustentado, 0),
    totalSaldo: (s) => s.transferencias.reduce((a, t) => a + t.saldo, 0),
  },
  actions: {
    agregarGasto(payload: GastoCreacion) {
      const newGasto: Gasto = {
        id: Date.now(),
        ...payload,
        estado: 'VALIDO',
      }
      this.gastos.push(newGasto)
      return newGasto
    },
    eliminarGasto(id: number) {
      this.gastos = this.gastos.filter(g => g.id !== id)
    },
  },
})
