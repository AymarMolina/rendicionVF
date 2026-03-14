import { computed, ref, type Ref } from "vue";

export function useTableSelection<T extends { Id: number }>(pagedItems: Ref<T[]>) {
  const selectedIds = ref<Set<number>>(new Set());

  const allSelected = computed(() => {
    if (pagedItems.value.length === 0) return false;
    return pagedItems.value.every((x) => selectedIds.value.has(x.Id));
  });

  const someSelected = computed(() =>
    pagedItems.value.some((x) => selectedIds.value.has(x.Id)),
  );

  const toggleRow = (id: number) => {
    const set = new Set(selectedIds.value);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    selectedIds.value = set;
  };

  const toggleSelectAll = (checked: boolean) => {
    const set = new Set(selectedIds.value);
    for (const item of pagedItems.value) {
      if (checked) set.add(item.Id);
      else set.delete(item.Id);
    }
    selectedIds.value = set;
  };

  return { selectedIds, allSelected, someSelected, toggleRow, toggleSelectAll };
}
