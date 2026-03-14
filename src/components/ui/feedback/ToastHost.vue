<script setup lang="ts">
import { computed } from "vue";
import {
  CheckCircle2,
  Info,
  XCircle,
  AlertTriangle,
  X,
} from "lucide-vue-next";
import { useToastStore } from "@/stores/toast.store";


const toast = useToastStore();
const items = computed(() => toast.items);

function iconFor(variant: string) {
  if (variant === "success") return CheckCircle2;
  if (variant === "error") return XCircle;
  if (variant === "warning") return AlertTriangle;
  return Info;
}

function accentClass(variant: string) {
  if (variant === "success") return "accent-success";
  if (variant === "error") return "accent-error";
  if (variant === "warning") return "accent-warning";
  return "accent-info";
}
</script>

<template>
  <div class="toast-portal" aria-live="polite" aria-relevant="additions removals">
    <div class="toast-stack">
      <TransitionGroup name="toast" tag="div" class="toast-group">
        <div
          v-for="t in items"
          :key="t.id"
          class="toast"
          :class="accentClass(t.variant)"
          role="status"
        >
          <div class="toast-inner">
            <component :is="iconFor(t.variant)" class="toast-icon" aria-hidden="true" />

            <div class="toast-body">
              <div class="toast-title">{{ t.title }}</div>
              <div v-if="t.message" class="toast-message">{{ t.message }}</div>
            </div>

            <button
              type="button"
              class="toast-close"
              @click="toast.remove(t.id)"
              aria-label="Cerrar"
            >
              <X class="toast-close-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.toast-portal {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10000;
}

.toast-stack {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: min(520px, calc(100% - 24px));
}

.toast-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  pointer-events: auto;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
  box-shadow:
    0 10px 30px rgba(2, 6, 23, 0.10),
    0 2px 8px rgba(2, 6, 23, 0.06);
  overflow: hidden;
}

.toast::before {
  content: "";
  display: block;
  width: 100%;
  height: 3px;
  opacity: 0.95;
}

.accent-success::before { background: #10b981; }
.accent-error::before { background: #ef4444; }
.accent-warning::before { background: #f59e0b; }
.accent-info::before { background: #2956a1; }

.toast-inner {
  display: flex;
  gap: 12px;
  padding: 12px 12px 12px 14px;
  align-items: flex-start;
}

.toast-icon {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  flex: 0 0 auto;
}

.accent-success .toast-icon { color: #10b981; }
.accent-error .toast-icon { color: #ef4444; }
.accent-warning .toast-icon { color: #f59e0b; }
.accent-info .toast-icon { color: #2956a1; }

.toast-body {
  min-width: 0;
  flex: 1;
}

.toast-title {
  font-size: 0.92rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.toast-message {
  margin-top: 4px;
  font-size: 0.82rem;
  color: #475569;
  line-height: 1.3;
}

.toast-close {
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 10px;
  padding: 6px;
  color: #64748b;
  transition: background 0.15s ease, transform 0.15s ease;
}

.toast-close:hover {
  background: rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.toast-close:active {
  transform: translateY(0px);
}

.toast-close-icon {
  width: 16px;
  height: 16px;
}

.toast-enter-active,
.toast-leave-active {
  transition: transform 220ms ease, opacity 220ms ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.toast-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.toast-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.toast-move {
  transition: transform 220ms ease;
}

@media (max-width: 480px) {
  .toast-stack {
    top: 10px;
    width: calc(100% - 18px);
  }
}
</style>
