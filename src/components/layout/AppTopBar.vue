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
      <div class="user-avatar" :title="auth.nombreCompleto">{{ inicial }}</div>
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
  new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
)

function nivelLabel(nivel: string) {
  const map: Record<string, string> = {
    inicial:    'Inicial',
    primaria:   'Primaria',
    secundaria: 'Secundaria',
  }
  return map[nivel] ?? nivel
}
</script>

<style scoped>
.topbar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #d4dae8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 16px;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(26, 47, 110, .06);
}

/* IE info (tesorero) */
.ie-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.ie-name {
  font-size: 13px;
  font-weight: 700;
  color: #1a2340;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 380px;
}
.ie-badges {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.nivel-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  letter-spacing: .2px;
  cursor: default;
}
.nivel-badge.inicial    { background: #e0f2fe; color: #0369a1; }
.nivel-badge.primaria   { background: #dcfce7; color: #16a34a; }
.nivel-badge.secundaria { background: #fef3c7; color: #b45309; }

/* Fecha */
.topbar-date {
  font-size: 12px;
  color: #6b7597;
  background: #f0f2f8;
  border: 1px solid #d4dae8;
  border-radius: 8px;
  padding: 5px 12px;
  white-space: nowrap;
}

/* Derecha */
.topbar-left  { flex: 1; min-width: 0; }
.topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.user-info    { text-align: right; }
.user-name    { display: block; font-size: 13px; font-weight: 700; color: #1a2340; line-height: 1.2; }
.user-role    { display: block; font-size: 11px; color: #6b7597; }
.user-avatar  {
  width: 36px; height: 36px; border-radius: 50%;
  background: #1a2f6e; color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; cursor: pointer;
  flex-shrink: 0;
}
</style>