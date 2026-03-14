import { computed, ref, watch, type Ref } from "vue";

export function useTableFilterPagination<T>(
  items: Ref<T[]>,
  match: (x: T, term: string) => boolean,
  pageSize: Ref<number>,
) {
  const q = ref("");
  const page = ref(1);

  const filtered = computed(() => {
    const term = q.value.trim().toLowerCase();
    if (!term) return items.value;
    return items.value.filter((x) => match(x, term));
  });

  const totalPages = computed(() => {
    const size = Math.max(1, Number(pageSize.value) || 1);
    return Math.max(1, Math.ceil(filtered.value.length / size));
  });

  const pagedItems = computed(() => {
    const size = Math.max(1, Number(pageSize.value) || 1);
    const safePage = Math.min(Math.max(1, page.value), totalPages.value);

    const start = (safePage - 1) * size;
    return filtered.value.slice(start, start + size);
  });
  
  watch([q, pageSize], () => {
    page.value = 1;
  });
  
  watch(totalPages, (tp) => {
    if (page.value > tp) page.value = tp;
  });

  return { q, page, filtered, totalPages, pagedItems };
}