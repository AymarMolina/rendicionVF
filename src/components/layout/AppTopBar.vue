<template>
  <header class="topbar">
    <div class="topbar-left">
      <span class="topbar-date">{{ fechaHoy }}</span>
    </div>
    <div class="topbar-right">
      <div class="user-info">
        <span class="user-name">{{ auth.nombreCompleto }}</span>
        <span class="user-role">{{ auth.rol }}</span>
      </div>
      <div class="user-avatar">{{ inicial }}</div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()

const inicial = computed(() =>
  (auth.nombreCompleto ?? 'U').charAt(0).toUpperCase()
)

const fechaHoy = computed(() =>
  new Date().toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })
)
</script>

<style scoped>
.topbar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #d4dae8;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px;
  gap: 16px;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(26,47,110,.06);
}
.topbar-left { flex:1; }
.topbar-right { display:flex; align-items:center; gap:10px; }
.user-info { text-align:right; }
.user-name { display:block; font-size:13px; font-weight:700; color:#1a2340; line-height:1.2; }
.user-role { display:block; font-size:11px; color:#6b7597; }
.user-avatar {
  width:36px; height:36px; border-radius:50%;
  background:#1a2f6e; color:white;
  display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:700; cursor:pointer;
}
.topbar-date {
  font-size:12px; color:#6b7597;
  background:#f0f2f8; border:1px solid #d4dae8;
  border-radius:8px; padding:5px 12px;
}
</style>
