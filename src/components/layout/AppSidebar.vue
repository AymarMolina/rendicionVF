<template>
  <aside class="sidebar">
    <!-- Brand -->
    <div class="sidebar-brand">
      <div class="brand-logo">
        <img src="@/assets/images/logo_pae.png" alt="PAE" class="brand-img" />
      </div>
      <span class="brand-name">PAE SISTEMA</span>
    </div>

    <!-- Meta: Tesorero -->
    <div class="sidebar-meta" v-if="auth.rol === 'Tesorero'">
      <div class="meta-label">Institución Educativa</div>
      <div class="meta-value">{{ auth.nombreInstitucion || auth.ie }}</div>
      <div class="meta-sub">{{ auth.zona }}</div>

      <!-- Módulos / niveles que administra -->
      <div class="modulos-row" v-if="auth.modulos.length">
        <span
          v-for="m in auth.modulos"
          :key="m.modulo_id"
          class="modulo-pill"
          :class="m.nivel"
          :title="`Cód. modular: ${m.codigo_modular}`"
        >
          {{ nivelLabel(m.nivel) }}
          <span class="modulo-cod">{{ m.codigo_modular }}</span>
        </span>
      </div>
    </div>

    <!-- Meta: ATC -->
    <div class="sidebar-meta" v-else-if="auth.rol === 'ATC'">
      <div class="meta-label">Zona de Cobertura</div>
      <div class="meta-value">{{ auth.zona }}</div>
      <div class="badges-row">
        <span class="badge green">{{ instStore.listos }} Listos</span>
        <span class="badge red">{{ instStore.criticos }} Críticos</span>
      </div>
    </div>

    <!-- Nav -->
    <div class="sidebar-section-label">Rendición de Cuentas</div>
    <nav class="sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        active-class="active"
      >
        <component :is="item.icon" class="nav-icon" />
        <span>{{ item.label }}</span>
        <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
      </router-link>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <button class="btn-logout" @click="logout">
        <LogOut class="logout-icon" />
        Cerrar Sesión
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftRight, FileText, CheckSquare,
  LayoutDashboard, Building2, ShieldCheck,
  ClipboardList, Users, UtensilsCrossed, LogOut,
} from 'lucide-vue-next'
import { useAuthStore }       from '@/stores/auth.store'
import { useInstitucionStore } from '@/stores/institucion.store'

const auth      = useAuthStore()
const instStore = useInstitucionStore()
const router    = useRouter()

function nivelLabel(nivel: string) {
  const map: Record<string, string> = {
    inicial:    'Inicial',
    primaria:   'Primaria',
    secundaria: 'Secundaria',
  }
  return map[nivel] ?? nivel
}

const navItems = computed(() => {
  if (auth.rol === 'Tesorero') return [
    { to: '/tesorero/transferencias', label: 'Transferencias',       icon: ArrowLeftRight },
    { to: '/tesorero/gastos',         label: 'Gastos y Comprobantes', icon: FileText },
    { to: '/tesorero/rendicion',      label: 'Rendición de Cuentas',  icon: CheckSquare },
    { to: '/tesorero/reuniones',      label: 'Reuniones',             icon: Users },
    { to: '/tesorero/acta-asamblea',  label: 'Acta Asamblea',         icon: Users },
  ]
  if (auth.rol === 'ATC') return [
    { to: '/atc/control',        label: 'Centro de Control',      icon: LayoutDashboard },
    { to: '/atc/instituciones',  label: 'Mis Instituciones',      icon: Building2 },
    { to: '/atc/validacion',     label: 'Validación & Co-Autoría', icon: ShieldCheck },
    { to: '/atc/anexos',         label: 'Revisión Anexos',        icon: ClipboardList, badge: 3 },
    { to: '/atc/capacitaciones', label: 'Capacitaciones',         icon: Users },
    { to: '/atc/menu',           label: 'Menú Semanal',           icon: UtensilsCrossed },
    { to: '/atc/revision',           label: 'Revision Rendiciones',           icon: UtensilsCrossed },
  ]
  if (auth.rol === 'Coordinador') return [
    { to: '/coordinador/importar-transferencia', label: 'Importar Transferencia',     icon: ClipboardList },
    { to: '/coordinador/asignar-tesorero', label: 'Asignar tesorero',     icon: ClipboardList },
    { to: '/coordinador/asignar-atc', label: 'Asignar ATC',     icon: ClipboardList },
  ]
  return []
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #d4dae8;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow-y: auto;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-bottom: 1px solid #d4dae8;
  flex-shrink: 0;
}
.brand-img  { height: 28px; }
.brand-name { font-weight: 700; font-size: 13px; color: #1a2f6e; }

.sidebar-meta {
  padding: 14px 20px 12px;
  border-bottom: 1px solid #d4dae8;
}
.meta-label { font-size: 10px; color: #6b7597; text-transform: uppercase; letter-spacing: .5px; }
.meta-value { font-size: 13px; font-weight: 700; color: #1a2340; margin-top: 2px; }
.meta-sub   { font-size: 11.5px; color: #6b7597; margin-top: 1px; }

/* Módulos del tesorero */
.modulos-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
}
.modulo-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: default;
}
.modulo-pill.inicial    { background: #e0f2fe; color: #0369a1; }
.modulo-pill.primaria   { background: #dcfce7; color: #16a34a; }
.modulo-pill.secundaria { background: #fef3c7; color: #b45309; }
.modulo-cod {
  font-size: 10px;
  font-weight: 400;
  opacity: .75;
  font-family: monospace;
}

/* ATC badges */
.badges-row { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
.badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
.badge.green { background: #dcfce7; color: #16a34a; }
.badge.red   { background: #fee2e2; color: #dc2626; }

/* Nav */
.sidebar-section-label {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .7px;
  color: #6b7597; padding: 16px 20px 8px;
}
.sidebar-nav { flex: 1; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 20px;
  font-size: 13.5px; font-weight: 500;
  color: #6b7597; cursor: pointer;
  border-left: 3px solid transparent;
  text-decoration: none;
  transition: all .15s;
}
.nav-item:hover  { background: #f0f4ff; color: #1a2340; }
.nav-item.active {
  background: #e8edf9; color: #2c4fd4;
  border-left-color: #2c4fd4; font-weight: 700;
}
.nav-icon  { width: 16px; height: 16px; flex-shrink: 0; }
.nav-badge {
  margin-left: auto;
  background: #dc2626; color: #fff;
  font-size: 10px; font-weight: 700;
  padding: 1px 6px; border-radius: 20px;
}

/* Footer */
.sidebar-footer {
  margin-top: auto;
  padding: 16px 20px;
  border-top: 1px solid #d4dae8;
}
.btn-logout {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #dc2626;
  background: none; border: none;
  cursor: pointer; padding: 0;
  font-family: inherit; font-weight: 500;
  transition: opacity .15s;
}
.btn-logout:hover { opacity: .7; }
.logout-icon { width: 15px; height: 15px; }
</style>