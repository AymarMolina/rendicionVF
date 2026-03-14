<template>
  <FormField :label="label">
    <div class="search-select" ref="root">      
      <div class="input-wrapper">
        <input
          class="input"
          :disabled="disabled"
          :placeholder="computedPlaceholder"
          :value="displayText"
          @focus="open = true"
          @click="open = true"
          @input="onInput"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="selectHighlighted()"
          @keydown.esc.prevent="close()"
        />
        <span class="select-icon" :class="{ open }"> ▼ </span>
      </div>

      <div v-if="open && !disabled" class="dropdown" role="listbox">
        <div
          v-if="placeholder"
          class="option option--disabled"
          aria-disabled="true"
        >
          {{ placeholder }}
        </div>

        <div
          v-for="(o, idx) in filteredOptions"
          :key="String(o.value)"
          class="option"
          :class="{ 'option--active': idx === highlightedIndex }"
          role="option"
          @mousedown.prevent="select(o)"
          @mousemove="highlightedIndex = idx"
        >
          {{ o.label }}
        </div>
        <div v-if="filteredOptions.length === 0" class="empty">
          Sin resultados
        </div>
      </div>
    </div>
  </FormField>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import FormField from "./FormField.vue";

type OptionValue = string | number;

const props = defineProps<{
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  placeholderValue?: OptionValue;
  options: { label: string; value: OptionValue }[];
}>();

const model = defineModel<OptionValue>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);
const query = ref("");
const highlightedIndex = ref(0);

const selectedOption = computed(() =>
  props.options.find((o) => o.value === model.value),
);

const computedPlaceholder = computed(() => props.placeholder ?? "");

const displayText = computed(() => {
  if (open.value) return query.value;

  if (selectedOption.value) return selectedOption.value.label;

  return "";
});

const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;

  return props.options.filter((o) => o.label.toLowerCase().includes(q));
});

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value;
  open.value = true;
  highlightedIndex.value = 0;
}

function select(o: { label: string; value: OptionValue }) {
  model.value = o.value;
  query.value = "";
  close();
}

function close() {
  open.value = false;
  query.value = "";
  highlightedIndex.value = 0;
}

function move(delta: number) {
  const len = filteredOptions.value.length;
  if (len === 0) return;
  const next = highlightedIndex.value + delta;
  highlightedIndex.value = (next + len) % len;
}

function selectHighlighted() {
  const o = filteredOptions.value[highlightedIndex.value];
  if (!o) return;
  select(o);
}

watch(
  () => filteredOptions.value.length,
  (len) => {
    if (len === 0) highlightedIndex.value = 0;
    else if (highlightedIndex.value > len - 1) highlightedIndex.value = 0;
  },
);

function onDocMouseDown(ev: MouseEvent) {
  if (!open.value) return;
  const el = root.value;
  if (!el) return;
  if (!el.contains(ev.target as Node)) close();
}

document.addEventListener("mousedown", onDocMouseDown);
onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocMouseDown);
});

watch(
  () => props.disabled,
  (d) => {
    if (d) close();
  },
);
</script>

<style scoped>
.search-select {
  position: relative;
}

.dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 50;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 240px;
  overflow: auto;
}

.option {
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
}

.option--active {
  background: #f3f4f6;
}

.option--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty {
  padding: 10px 12px;
  opacity: 0.7;
}

.input-wrapper {
  position: relative;
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  opacity: 0.7;
  pointer-events: none;
  transition: transform 0.2s ease;
}

.select-icon.open {
  transform: translateY(-50%) rotate(180deg);
}
</style>
