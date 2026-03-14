<template>
  <div class="footer-actions">
    <div>
      <slot name="left">
        <button
          class="btn ghost"
          type="button"
          :disabled="loading"
          @click="$emit('cancel')"
        >
          Cancelar
        </button>
      </slot>
    </div>

    <div class="right-actions">
      <slot name="right">
        <button
          class="btn ghost"
          type="button"
          :disabled="loading"
          @click="$emit('clear')"
        >
          Limpiar
        </button>

        <button
          class="btn primary"
          type="button"
          :disabled="loading || disabled"
          @click="$emit('save')"
        >
          <span v-if="loading" class="spinner" aria-hidden="true"></span>
          <span>{{ loading ? loadingText : "Continuar" }}</span>
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    loading?: boolean
    disabled?: boolean
    loadingText?: string
  }>(),
  {
    loading: false,
    disabled: false,
    loadingText: "Procesando...",
  },
)

defineEmits<{
  (e: "cancel"): void
  (e: "clear"): void
  (e: "save"): void
}>()
</script>
