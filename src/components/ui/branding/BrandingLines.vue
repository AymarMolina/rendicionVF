<template>
  <div class="branding-lines">
    <div v-if="showTop" class="top-line" :style="{ height: topHeight }"></div>

    <div class="bottom-lines" :style="{ height: bottomHeight }">
      <div class="red-line" :style="{ width: redWidth }"></div>
      <div class="blue-line" :style="{ width: blueWidth }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    showTop?: boolean;
    topHeight?: string;
    bottomHeight?: string;
    redWidth?: string;
  }>(),
  {
    showTop: true,
    topHeight: "10px",
    bottomHeight: "10px",
    redWidth: "60%",
  },
);

const blueWidth = computed(() => {
  return props.redWidth.endsWith("%")
    ? `${100 - Number(props.redWidth.replace("%", ""))}%`
    : `calc(100% - ${props.redWidth})`;
});
</script>

<style scoped>
.branding-lines {
  width: 100%;
}

.top-line {
  width: 100%;
  background: #2e9e44;
}

.bottom-lines {
  width: 100%;
  display: flex;
}

.red-line {
  background: #f44336;
}

.blue-line {
  background: #2f5fb3;
}
</style>
