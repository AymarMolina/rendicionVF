import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      { path: '', name: 'login', component: () => import('@/modules/auth/pages/AuthPage.vue') },
    ],
  },
  {
    path: '/tesorero',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'transferencias' } },
      { path: 'transferencias', name: 'transferencias', component: () => import('@/modules/tesorero/pages/TransferenciasPage.vue') },
      { path: 'gastos',         name: 'gastos',         component: () => import('@/modules/tesorero/pages/GastosPage.vue') },
      { path: 'rendicion',      name: 'rendicion',      component: () => import('@/modules/tesorero/pages/RendicionPage.vue') },
    ],
  },
  {
    path: '/atc',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'atc-control' } },
      { path: 'control',        name: 'atc-control',        component: () => import('@/modules/atc/pages/CentroControlPage.vue') },
      { path: 'instituciones',  name: 'atc-instituciones',  component: () => import('@/modules/atc/pages/InstitucionesPage.vue') },
      { path: 'validacion',     name: 'atc-validacion',     component: () => import('@/modules/atc/pages/ValidacionPage.vue') },
      { path: 'anexos',         name: 'atc-anexos',         component: () => import('@/modules/atc/pages/RevisionAnexosPage.vue') },
      { path: 'capacitaciones', name: 'atc-capacitaciones', component: () => import('@/modules/atc/pages/CapacitacionesPage.vue') },
      { path: 'menu',           name: 'atc-menu',           component: () => import('@/modules/atc/pages/MenuPage.vue') },
    ],
  },
  {
    path: '/coordinador',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'coord-panel' } },
      { path: 'panel',       name: 'coord-panel',       component: () => import('@/modules/coordinador/pages/PanelEjecutivoPage.vue') },
      { path: 'expedientes', name: 'coord-expedientes', component: () => import('@/modules/coordinador/pages/ExpedientesPage.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth  = useAuthStore()
  const isAuth = !!auth.token

  if (to.name === 'login' && isAuth) {
   return next(getRolRedirect(auth.user?.rol ?? null))
  }
  if (to.meta.requiresAuth && !isAuth) {
    return next({ name: 'login' })
  }
  next()
})
function getRolRedirect(rol: string | null) {
  if (rol === 'tesorero')                   return { name: 'transferencias' }
  if (rol === 'atc')                        return { name: 'atc-control' }
  if (rol === 'coordinador_administrativo') return { name: 'coord-panel' }
  return { name: 'login' }
}
