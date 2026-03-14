<template>
  <div class="kpi-card">
    <div class="kpi-label">{{ label }}</div>
    <div class="kpi-value" :class="color">{{ value }}</div>
    <div v-if="sub" class="kpi-sub">{{ sub }}</div>
    <slot />
  </div>
</template>
<script setup lang="ts">
defineProps<{ label:string; value:string|number; sub?:string; color?:string }>()
</script>
<style scoped>
.kpi-card { background:#fff; border:1px solid #d4dae8; border-radius:14px; padding:20px 22px; box-shadow:0 2px 12px rgba(26,47,110,.08); }
.kpi-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#6b7597; margin-bottom:6px; }
.kpi-value { font-size:26px; font-weight:800; color:#1a2340; letter-spacing:-.5px; line-height:1; }
.kpi-value.green  { color:#16a34a; }
.kpi-value.orange { color:#ea580c; }
.kpi-value.red    { color:#dc2626; }
.kpi-value.blue   { color:#2c4fd4; }
.kpi-sub { font-size:11.5px; color:#6b7597; margin-top:4px; }
</style>
