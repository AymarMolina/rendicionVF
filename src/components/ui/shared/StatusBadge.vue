<template>
  <span class="badge" :class="variantClass">{{ label ?? status }}</span>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ status: string; label?: string }>()
const variantClass = computed(() => {
  const map: Record<string,string> = {
    'Enviada':'green','En proceso':'blue','Observada':'yellow','Pendiente':'gray',
    'VALIDO':'green','Aprobado':'green','Borrador':'yellow','Realizada':'green',
    'Programada':'blue','Finalizado':'green','En curso':'blue',
    'listo':'green','critico':'red','observado':'yellow','en_proceso':'blue',
    'LISTO':'green','OBSERVADO':'yellow',
  }
  return map[props.status] ?? 'gray'
})
</script>
<style scoped>
.badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:700; white-space:nowrap; }
.badge::before { content:''; width:5px; height:5px; border-radius:50%; background:currentColor; opacity:.7; }
.badge.green  { background:#dcfce7; color:#16a34a; }
.badge.yellow { background:#fef3c7; color:#b45309; }
.badge.red    { background:#fee2e2; color:#dc2626; }
.badge.blue   { background:#e8edf9; color:#2c4fd4; }
.badge.gray   { background:#f1f3f8; color:#6b7597; }
</style>
