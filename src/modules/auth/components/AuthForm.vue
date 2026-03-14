<template>
  <form @submit.prevent="handleSubmit" class="auth-form">
    <div class="form-group">
      <label class="form-label">DNI / Usuario</label>
      <div class="input-wrap">
        <CreditCard class="input-ico" />
        <input
          v-model.trim="usuario"
          type="text"
          class="form-input"
          placeholder="Ingrese su DNI o usuario"
          required
        />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Contraseña</label>
      <div class="input-wrap">
        <Lock class="input-ico" />
        <input
          v-model="clave"
          :type="showPw ? 'text' : 'password'"
          class="form-input"
          placeholder="Contraseña"
          required
        />
        <button type="button" class="pw-toggle" @click="showPw = !showPw">
          <Eye v-if="!showPw" class="pw-icon" />
          <EyeOff v-else class="pw-icon" />
        </button>
      </div>
    </div>

    <button type="submit" class="btn-submit" :disabled="auth.loading">
      <span v-if="!auth.loading">Ingresar al Sistema</span>
      <span v-else class="spinner-wrap"><span class="spinner" /> Validando...</span>
    </button>

    <!-- Demo shortcuts -->
    <div class="demo-section">
      <div class="demo-title">Acceso Rápido – Demo</div>
      <div class="demo-grid">
        <button type="button" class="demo-btn" @click="quickLogin('tesorero')">
          <div class="demo-icon" style="background:#e8edf9">
            <User class="demo-ico" style="color:#1a2f6e" />
          </div>
          <div>
            <div class="demo-name">Tesorero</div>
            <span class="role-tag tesorero">TESORERO CGAE</span>
          </div>
        </button>
        <button type="button" class="demo-btn" @click="quickLogin('atc')">
          <div class="demo-icon" style="background:#dcfce7">
            <Users class="demo-ico" style="color:#16a34a" />
          </div>
          <div>
            <div class="demo-name">ATC</div>
            <span class="role-tag atc">ATC PAE</span>
          </div>
        </button>
        <button type="button" class="demo-btn" @click="quickLogin('coordinador')">
          <div class="demo-icon" style="background:#fef3c7">
            <Briefcase class="demo-ico" style="color:#b45309" />
          </div>
          <div>
            <div class="demo-name">Coordinador</div>
            <span class="role-tag coordinador">COORDINADOR</span>
          </div>
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CreditCard, Lock, Eye, EyeOff, User, Users, Briefcase } from 'lucide-vue-next'
import { useAuthStore }  from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'

const auth   = useAuthStore()
const toast  = useToastStore()
const router = useRouter()

const usuario = ref('')
const clave   = ref('')
const showPw  = ref(false)

async function handleSubmit() {
  try {
    const u = await auth.login({ Usuario: usuario.value, Clave: clave.value })
    toast.success(`¡Bienvenido/a, ${u.NombreCompleto}!`)
    redirect(u.Rol ?? null)
  } catch (e: any) {
    toast.error('Error de autenticación', e?.message ?? 'Usuario o contraseña incorrectos')
  }
}

async function quickLogin(rol: string) {
  usuario.value = rol
  clave.value   = rol
  await handleSubmit()
}

function redirect(rol: string | null) {
  if (rol === 'Tesorero')    router.push('/tesorero/transferencias')
  else if (rol === 'ATC')    router.push('/atc/control')
  else                       router.push('/coordinador/panel')
}
</script>

<style scoped>
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 13px; font-weight: 600; color: #1a2340; }
.input-wrap { position: relative; }
.input-ico {
  position: absolute; left: 12px; top: 50%;
  transform: translateY(-50%); color: #9ba6c0;
  width: 16px; height: 16px;
}
.form-input {
  width: 100%; height: 44px; padding: 0 40px;
  border: 1.5px solid #d4dae8; border-radius: 10px;
  font-size: 14px; color: #1a2340;
  background: #fafbfd; outline: none;
  transition: border-color .15s, box-shadow .15s;
  box-sizing: border-box;
}
.form-input:focus {
  border-color: #2c4fd4;
  box-shadow: 0 0 0 3px rgba(44,79,212,.1);
  background: #fff;
}
.pw-toggle {
  position: absolute; right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: #9ba6c0; padding: 4px;
  display: flex; align-items: center;
  transition: color .15s;
}
.pw-toggle:hover { color: #2c4fd4; }
.pw-icon { width: 16px; height: 16px; }
.btn-submit {
  width: 100%; height: 46px;
  background: #1a2f6e; color: #fff; border: none;
  border-radius: 10px; font-size: 14px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background .2s;
  box-shadow: 0 3px 12px rgba(26,47,110,.3);
}
.btn-submit:hover:not(:disabled) { background: #2c4fd4; }
.btn-submit:disabled { opacity: .6; cursor: not-allowed; }
.spinner-wrap { display: flex; align-items: center; gap: 8px; }
.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Demo */
.demo-section { margin-top: 8px; padding-top: 18px; border-top: 1px solid #d4dae8; }
.demo-title {
  font-size: 10.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .7px;
  color: #1a2340; text-align: center; margin-bottom: 12px;
}
.demo-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.demo-btn {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 12px 8px;
  background: #f9fafb; border: 1.5px solid #d4dae8;
  border-radius: 10px; cursor: pointer;
  transition: all .2s; text-align: center;
}
.demo-btn:hover {
  background: #e8edf9; border-color: #2c4fd4;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(44,79,212,.12);
}
.demo-icon {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}
.demo-ico { width: 15px; height: 15px; }
.demo-name { font-size: 12px; font-weight: 700; color: #1a2340; }
.role-tag {
  display: inline-block; padding: 2px 6px;
  border-radius: 20px; font-size: 9px; font-weight: 700;
  letter-spacing: .2px;
}
.role-tag.tesorero    { background: #e8edf9; color: #1a2f6e; }
.role-tag.atc         { background: #dcfce7; color: #16a34a; }
.role-tag.coordinador { background: #fef3c7; color: #b45309; }
</style>
