<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo-wrap">
        <img src="@/assets/images/logo_pae.png" alt="PAE" class="logo-img" />
      </div>
      <h1 class="card-title">PAE – Rendición de Cuentas</h1>
      <p class="card-sub">Plataforma Institucional · Modalidad Comida Caliente · Subvención Económica</p>
      <div class="divider" />
      <AuthForm />
    </div>
  </div>
</template>

<script setup lang="ts">
import AuthForm from '../components/AuthForm.vue'
</script>

<style scoped>
.login-page {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  background: #dde3f0;
}
.login-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(26,47,110,.12), 0 2px 8px rgba(26,47,110,.08);
  width: 100%;
  max-width: 440px;
  padding: 40px 44px 36px;
}
.logo-wrap { display: flex; justify-content: center; margin-bottom: 18px; }
.logo-img { height: 52px; }
.card-title {
  font-size: 20px; font-weight: 800;
  color: #1a2340; text-align: center; margin: 0;
}
.card-sub {
  font-size: 12.5px; color: #6b7597;
  text-align: center; margin-top: 5px; line-height: 1.5;
}
.divider { height: 1px; background: #d4dae8; margin: 22px 0; }
</style>
