<template>
  <div class="form-title">
    <!-- <div class="divider"></div> -->
    <div class="title-row" :class="{ left: align === 'left' }">
      <h1 class="title-part" :class="colorClass">
        {{ title }}
      </h1>
    </div>
    <div v-if="description" class="desc" :class="{ left: align === 'left' }">
      {{ description }}
    </div>

    <div class="divider"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    color?: "blue" | "green";
    align?: "left" | "center";
  }>(),
  {
    color: "blue",
    align: "left",
  },
);

const colorClass = computed(() => ({
  blue: props.color === "blue",
  green: props.color === "green",
}));
</script>

<style scoped>
.divider {
  height: 1px;
  background: #e5e7eb;
  width: 100%;
}

.form-title {
  padding: 0px 15px 0px;
}

.title-row {
  padding: 10px 0 4px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 800;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.title-row.left {
  justify-content: flex-start;
  text-align: left;
  
}

.title-part.blue {
  color: #2956a1;
  font-weight: bold;
}

.title-part.green {
  color: #298c2e;
  font-weight: bold;
}

.desc {
  text-align: center;
  color: #6b7280;
  font-size: 0.92rem;
  padding-bottom: 10px;
}

.desc.left {
  text-align: left;
}
</style>
