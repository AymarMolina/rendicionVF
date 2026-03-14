<template>
  <div class="list-header">
    <div class="section-header">
      <h1 :class="titleClass">{{ title }}</h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    color?: "blue" | "green";
  }>(),
  { color: "blue" },
);

const titleClass = computed(() =>
  props.color === "green" ? "title t-green" : "title t-blue",
);
</script>

<style scoped>
.list-header {
  width: 100%;
  margin-bottom: 16px;
}

.section-header {
  background: #f0f4ff;
  padding: 16px 22px;
  border-radius: 10px;
  border-left: 5px solid #2f5fb3;
}

.title {
  font-size: 1.5em;
  font-weight: 800;
  line-height: 1.3;
  margin: 0;
}

.t-blue {
  color: #2f5fb3;
}

.t-green {
  color: #2e9e44;
}
</style>
