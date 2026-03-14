<script setup lang="ts">
import ToastHost   from '@/components/ui/feedback/ToastHost.vue'
import ConfirmHost from '@/components/ui/feedback/ConfirmHost.vue'
</script>

<template>
  <router-view />
  <ToastHost />
  <ConfirmHost />
</template>
