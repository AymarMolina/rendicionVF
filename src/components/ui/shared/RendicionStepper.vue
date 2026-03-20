<template>
  <div class="stepper-wrap">
    <template v-for="(step, i) in STEPS" :key="step.key">
      <div v-if="i > 0" class="connector" :class="{ done: stepState(i - 1) === 'done' }" />
      <div class="step" :class="stepState(i)">
        <div class="step-bubble">
          <CheckIcon v-if="stepState(i) === 'done'" />
          <AlertIcon v-else-if="stepState(i) === 'observada'" />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div class="step-label">{{ step.label }}</div>
        <div class="step-sublabel" v-if="stepState(i) === 'active'">{{ step.sub }}</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check as CheckIcon, AlertTriangle as AlertIcon } from 'lucide-vue-next'

const props = defineProps<{
  estado: string
  tieneGastos?: boolean
  tieneRendicion?: boolean
}>()

const STEPS = [
  { key: 'recibida',   label: 'Transferencia recibida', sub: 'Fondos en cuenta'      },
  { key: 'gastos',     label: 'Registrar gastos',       sub: 'Comprobantes y DJ'     },
  { key: 'rendicion',  label: 'Crear rendición',        sub: 'Conciliar saldo'       },
  { key: 'enviada',    label: 'Enviar al ATC',          sub: 'Esperando revisión'    },
  { key: 'aprobada',   label: 'Aprobada',               sub: 'Proceso completo'      },
]

const activeStep = computed(() => {
  switch (props.estado) {
    case 'recibida':      return 0
    case 'en_rendicion':
      if (!props.tieneGastos)   return 1   
      if (!props.tieneRendicion) return 2   
      return 2
    case 'rendida':
    case 'enviada':       return 3
    case 'observada':     return 3   
    case 'aprobada':      return 4
    default:              return 0
  }
})

const isObservada = computed(() => props.estado === 'observada')
const isAprobada  = computed(() => props.estado === 'aprobada')

type StepState = 'done' | 'active' | 'observada' | 'pending'

function stepState(idx: number): StepState {
  if (isAprobada.value) return 'done'          
  if (idx < activeStep.value)   return 'done'
  if (idx === activeStep.value) return isObservada.value ? 'observada' : 'active'
  return 'pending'
}
</script>

<style scoped>
.stepper-wrap {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #fff;
  border: 1px solid #d4dae8;
  border-radius: 14px;
  margin-bottom: 20px;
  overflow-x: auto;
  gap: 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  flex: 1;
  min-width: 76px;
}

.step-bubble {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #d4dae8;
  background: #f7f8fc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #9ba6c0;
  transition: all .2s;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
.step-bubble svg { width: 15px; height: 15px; }

.step.done .step-bubble      { background: #16a34a; border-color: #16a34a; color: #fff; }
.step.active .step-bubble    { background: #1a2f6e; border-color: #1a2f6e; color: #fff;
                                box-shadow: 0 0 0 4px rgba(26,47,110,.15); }
.step.observada .step-bubble { background: #f59e0b; border-color: #f59e0b; color: #fff; }

.step-label {
  font-size: 11px;
  font-weight: 700;
  color: #9ba6c0;
  text-align: center;
  line-height: 1.3;
}
.step.done .step-label      { color: #16a34a; }
.step.active .step-label    { color: #1a2340; }
.step.observada .step-label { color: #b45309; }

.step-sublabel {
  font-size: 10px;
  color: #6b7597;
  text-align: center;
  line-height: 1.2;
}

.connector {
  flex: 1;
  height: 2px;
  background: #d4dae8;
  min-width: 12px;
  margin-bottom: 20px;
  transition: background .3s;
}
.connector.done { background: #16a34a; }
</style>