<template>
  <div class="auth-wrapper">
    <router-view />
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  background: #dde3f0;
  background-image:
    linear-gradient(rgba(44,79,212,.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(44,79,212,.06) 1px, transparent 1px);
  background-size: 40px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
</style>
