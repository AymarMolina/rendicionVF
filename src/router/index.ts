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
      { path: 'reuniones',      name: 'reuniones',      component: () => import('@/modules/tesorero/pages/ReunionesPage.vue') },
      { path: 'acta-asamblea',      name: 'acta-asamblea',      component: () => import('@/modules/tesorero/pages/Actasview.vue') }
    ],
  },
  {
    path: '/atc',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'revision' } },
      { path: 'anexos',         name: 'atc-anexos',         component: () => import('@/modules/atc/pages/RevisionAnexosPage.vue') },
      { path: 'revision',           name: 'revision',           component: () => import('@/modules/atc/pages/RevisionPage.vue') },
    ],
  },
  {
    path: '/coordinador',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'dashboard-coordinador' } },
      { path: 'importar-transferencia', name: 'importar-transferencia', component: () => import('@/modules/coordinador/pages/CoordinadorPage.vue') },
      { path: 'asignar-tesorero', name: 'asignar-tesorero', component: () => import('@/modules/coordinador/pages/AsignarTesorero.vue') },
      { path: 'asignar-atc', name: 'asignar-atc', component: () => import('@/modules/coordinador/pages/AsignarATC.vue') },
      { path: 'dashboard-coordinador', name: 'dashboard-coordinador', component: () => import('@/modules/coordinador/pages/Dashboardcoordinador.vue') },
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
