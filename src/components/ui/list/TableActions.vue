<template>
  <div class="footer-actions">
    <button type="button" class="btn ghost" @click="$emit('print')">
      <Printer class="btn-icon" />
      Imprimir
    </button>
    <button type="button" class="btn secondary" @click="$emit('export')">
      <Share class="btn-icon" />
      Exportar
    </button>
    <button type="button" class="btn primary" @click="$emit('new')">
      <Plus class="btn-icon" />
      Nuevo
    </button>
  </div>
</template>

<script setup lang="ts">
import { Printer, Share, Plus } from "lucide-vue-next";

defineEmits<{
  (e: "print"): void;
  (e: "export"): void;
  (e: "new"): void;
}>();
</script>

<style scoped>
.footer-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 14px 16px;
  background: #f7f9fc;
  border-radius: 10px;
  border: 1px solid #e3e8f3;
  width: 100%;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  stroke-width: 2.2px;
}

/* Neutro → Imprimir */
.btn.ghost {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn.ghost:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

/* Secundario → Exportar */
.btn.secondary {
  background: #e8edf7;
  border: 1px solid #c7d3ee;
  color: #2f5fb3;
}

.btn.secondary:hover {
  background: #d6e0f5;
  border-color: #2f5fb3;
}

/* Primario → Nuevo */
.btn.primary {
  background: #2f5fb3;
  border: 1px solid #2f5fb3;
  color: #ffffff;
}

.btn.primary:hover {
  background: #244c91;
  border-color: #244c91;
}
</style>
