<template>
  <FormField :label="label">
    <div class="radio-row">
      <label v-for="opt in options" :key="String(opt.value)" class="radio">
        <input
          type="radio"
          :name="name"
          :value="opt.value"
          v-model="model"
        />
        <span>{{ opt.label }}</span>
      </label>
    </div>
  </FormField>
</template>

<script setup lang="ts">
import FormField from "./FormField.vue";

defineProps<{
  label?: string;
  name: string;
  options: { label: string; value: string | number | boolean }[];
}>();

const model = defineModel<string | number | boolean>();
</script>
