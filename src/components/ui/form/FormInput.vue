<template>
  <FormField :label="label">
    <input
      class="input"
      :class="{ 'is-uppercase': isText && !allowLowercase }"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      v-model="model"
    />
  </FormField>
</template>

<script setup lang="ts">
import { computed } from "vue";
import FormField from "./FormField.vue";

const props = withDefaults(
  defineProps<{
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    type?: "text" | "number" | "email" | "password";
    allowLowercase?: boolean;
  }>(),
  {
    type: "text",
    allowLowercase: false,
  }
);
const isText = computed(() => props.type === "text");

const model = defineModel<string | number>({
  set(v) {
    if (props.type === "number") {
      const n = typeof v === "string" ? Number(v) : v;
      return Number.isNaN(n) ? 0 : n;
    }    
    if (isText.value && !props.allowLowercase && typeof v === "string") {
      return v.toUpperCase();
    }
    return v;
  },
});
</script>

<style scoped>
.is-uppercase {
  text-transform: uppercase;
}
</style>
