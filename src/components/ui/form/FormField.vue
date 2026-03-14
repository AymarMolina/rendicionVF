<template>
  <div class="field" :class="{ inline }">
    <label v-if="label" class="label">{{ label }}</label>
    <div class="control">
      <slot />
    </div>
    <span v-if="error" class="error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string;
  error?: string;
  inline?: boolean;    
  labelWidth?: string; 
}>();
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.inline {
  flex-direction: row;
  align-items: center;
  gap: 25px;
}

.label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #374151;
}

.field.inline .label {
  white-space: nowrap;
  min-width: 140px; 
}

.control {
  width: 100%;
}

.field.inline .control {
  flex: 1;
  min-width: 0;
}

.error {
  font-size: 0.8rem;
  color: #b91c1c;
}
</style>
