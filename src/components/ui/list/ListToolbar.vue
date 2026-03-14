<template>
  <div class="toolbar">
    <div class="actions">
      <label class="field">
        <input
          class="input"
          :placeholder="placeholder"
          v-model.trim="model"
          @keyup.enter="$emit('search')"
        />
      </label>
    </div>
    <!--
      <button class="btn primary" type="button" @click="$emit('search')">
        {{ buttonText }}
      </button>
  --></div>
</template>

<script setup lang="ts">
const model = defineModel<string>({ default: "" });

withDefaults(
  defineProps<{
    placeholder?: string;
    buttonText?: string;
  }>(),
  { placeholder: "Buscar...", buttonText: "Buscar" },
);

defineEmits<{ (e: "search"): void }>();
</script>
