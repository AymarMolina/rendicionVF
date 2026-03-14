<template>
  <div class="progress-bar">
    <div class="progress-fill" :class="colorClass" :style="{ width: pct + '%' }" />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ value:number; max?:number }>()
const pct = computed(() => Math.min(100, Math.round((props.value / (props.max ?? 100)) * 100)))
const colorClass = computed(() => pct.value >= 100 ? 'green' : pct.value >= 70 ? 'yellow' : 'red')
</script>
<style scoped>
.progress-bar { height:5px; border-radius:99px; background:#e8edf9; overflow:hidden; margin-top:8px; }
.progress-fill { height:100%; border-radius:99px; transition:width .4s; }
.progress-fill.green  { background:#16a34a; }
.progress-fill.yellow { background:#f59e0b; }
.progress-fill.red    { background:#dc2626; }
</style>
