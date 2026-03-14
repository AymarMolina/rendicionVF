<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="app-body">
      <AppTopBar />
      <main class="app-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopBar  from '@/components/layout/AppTopBar.vue'
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100dvh;
  overflow: hidden;
}
.app-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  background: #f0f2f8;
}
</style>
