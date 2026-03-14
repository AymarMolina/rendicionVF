<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useConfirmStore } from "@/stores/confirm.store";

const confirm = useConfirmStore();
const { open, title, message, confirmText, cancelText, variant } =
  storeToRefs(confirm);
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="overlay">
        <div class="dialog">
          <h3 class="title">{{ title }}</h3>
          <p class="message">{{ message }}</p>

          <div class="actions">
            <button class="btn ghost" @click="confirm.cancel">
              {{ cancelText }}
            </button>

            <button
              class="btn"
              :class="variant === 'danger' ? 'danger' : 'primary'"
              @click="confirm.confirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
  z-index: 9999;
}

.message {
    margin-top: 10px;
    margin-bottom: 20px;
}

.dialog {
  background: white;
  border-radius: 14px;
  padding: 20px;
  width: 100%;
  max-width: 380px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.btn.primary {
  background: #2956a1;
  color: white;
}

.btn.danger {
  background: #b91c1c;
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
