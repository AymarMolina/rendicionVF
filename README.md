# PAE – Sistema de Rendición de Cuentas

Sistema Vue 3 + TypeScript para la gestión del proceso de Rendición de Cuentas del Programa de Alimentación Escolar (PAE) – MIDIS.

## Stack
- **Vue 3** + Composition API + `<script setup>`
- **TypeScript**
- **Vite**
- **Pinia** (state management + persistedstate)
- **Vue Router 4**
- **Lucide Vue Next** (iconos)
- **Axios**

## Roles y acceso demo

| Usuario       | Contraseña    | Rol                      |
|---------------|---------------|--------------------------|
| `tesorero`    | `tesorero`    | Tesorero CGAE            |
| `atc`         | `atc`         | Acompañante Técnico      |
| `coordinador` | `coordinador` | Coordinador Administrativo|

## Instalación y uso

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` y usa los accesos demo del login.

## Estructura

```
src/
├── modules/
│   ├── auth/              ← Login con acceso por rol
│   ├── tesorero/          ← Transferencias, Gastos, Rendición
│   ├── atc/               ← Control, Instituciones, Validación, Anexos, Capacitaciones, Menú
│   └── coordinador/       ← Panel Ejecutivo, Expedientes
├── stores/                ← Pinia: auth, transferencia, institucion, expediente
├── types/                 ← Interfaces TypeScript del dominio
├── mocks/                 ← Datos de demostración (VITE_USE_MOCK=true)
├── components/
│   ├── layout/            ← AppSidebar, AppTopBar
│   └── ui/shared/         ← StatusBadge, KpiCard, ProgressBar
└── router/                ← Rutas por rol + guard de autenticación
```

## Variables de entorno (.env.development)
```
VITE_APP_NAME=PAE – Rendición de Cuentas
VITE_USE_MOCK=true
VITE_APP_BACKEND_URL=http://...
```
