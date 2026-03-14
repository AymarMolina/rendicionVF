<template>
  <div class="table-footer">
    <div class="footer-row footer-top">
      <div class="count">
        <template v-if="totalCount > 0">
          Mostrando <b>{{ pageCount }}</b> de <b>{{ totalCount }}</b>
          {{ entityLabel }}
        </template>
        <template v-else>
          No hay {{ entityLabel.toLowerCase() }} para mostrar
        </template>
      </div>
      <div class="right">
        <div class="page-size">
          <span class="page-size-label">Filas:</span>
          <select
            class="page-size-select"
            :value="pageSize"
            @change="onChangePageSize"
          >
            <option v-for="n in pageSizeOptions" :key="n" :value="n">
              {{ n }} / pág
            </option>
          </select>
        </div>
        <div class="pagination">
          <button
            class="pager-btn"
            type="button"
            :disabled="page === 1"
            @click="$emit('update:page', page - 1)"
          >
            ‹
          </button>
          <span class="pager-text">
            Página <b>{{ page }}</b> de <b>{{ totalPages }}</b>
          </span>
          <button
            class="pager-btn"
            type="button"
            :disabled="page === totalPages || totalPages === 0"
            @click="$emit('update:page', page + 1)"
          >
            ›
          </button>
        </div>
      </div>
    </div>
    <div class="footer-row footer-bottom">
      <slot name="actions" />
    </div>
  </div>
</template>
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    page: number;
    totalPages: number;
    pageCount: number;
    totalCount: number;
    entityLabel: string;

    pageSize: number;
    pageSizeOptions?: number[];
  }>(),
  {
    pageSizeOptions: () => [5, 10, 20, 50],
  },
);

const emit = defineEmits<{
  (e: "update:page", value: number): void;
  (e: "update:pageSize", value: number): void;
}>();

function onChangePageSize(e: Event) {
  const raw = (e.target as HTMLSelectElement).value;
  const next = Number(raw);

  if (!Number.isFinite(next) || next <= 0) return;

  emit("update:pageSize", next);
  emit("update:page", 1);
}
</script>

<style scoped>
.right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-size {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-label {
  font-size: 0.85rem;
  color: #64748b;
}

.page-size-select {
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 6px 8px;
  font-weight: 600;
  color: #111827;
}
</style>
