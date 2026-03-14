import { PushOptions, ToastItem, ToastState } from "@/types/toast";
import { defineStore } from "pinia";

export const useToastStore = defineStore("toast", {
  state: (): ToastState => ({
    items: [],
    max: 4,
  }),

  actions: {
    push(options: PushOptions) {
      const id = `t_${Math.random().toString(16).slice(2)}`;

      const item: ToastItem = {
        id,
        title: options.title,
        message: options.message,
        variant: options.variant ?? "info",
        duration: options.duration ?? 4500,
        sticky: options.sticky ?? false,
        createdAt: Date.now(),
      };

      this.items = [item, ...this.items].slice(0, this.max);

      if (!item.sticky) {
        window.setTimeout(() => {
          this.remove(id);
        }, item.duration);
      }

      return id;
    },

    success(title: string, message?: string, duration = 3500) {
      return this.push({ title, message, variant: "success", duration });
    },

    error(title: string, message?: string, sticky = false) {
      return this.push({
        title,
        message,
        variant: "error",
        duration: 5000,
        sticky,
      });
    },

    info(title: string, message?: string, duration = 4000) {
      return this.push({ title, message, variant: "info", duration });
    },

    warning(title: string, message?: string, duration = 4500) {
      return this.push({ title, message, variant: "warning", duration });
    },

    remove(id: string) {
      this.items = this.items.filter((t) => t.id !== id);
    },

    clear() {
      this.items = [];
    },
  },
});
