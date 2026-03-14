<template>
  <teleport to="body">
    <div
      v-if="open"
      class="backdrop"
      @click.self="emit('close')"
      role="presentation"
    >
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="ariaLabel"
      >
        <slot />
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    ariaLabel?: string;
    maxWidth?: string;
  }>(),
  { ariaLabel: "Modal", maxWidth: "1100px" },
);

const emit = defineEmits<{
  (e: "close"): void;
}>();

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? "hidden" : "";
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  document.body.style.overflow = "";
});
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: v-bind(maxWidth);
  max-height: calc(100vh - 32px);
  overflow: auto;

  background: #ffffff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(17, 24, 39, 0.1);
}
</style>