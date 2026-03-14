import { defineStore } from "pinia";

type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
};

type Resolver = (value: boolean) => void;

export const useConfirmStore = defineStore("confirm", {
  state: () => ({
    open: false,
    title: "",
    message: "",
    confirmText: "Aceptar",
    cancelText: "Cancelar",
    variant: "primary" as "danger" | "primary",
    resolver: null as Resolver | null,
  }),

  actions: {
    ask(options: ConfirmOptions) {
      this.title = options.title ?? "Confirmar";
      this.message = options.message ?? "";
      this.confirmText = options.confirmText ?? "Aceptar";
      this.cancelText = options.cancelText ?? "Cancelar";
      this.variant = options.variant ?? "primary";
      this.open = true;

      return new Promise<boolean>((resolve) => {
        this.resolver = resolve;
      });
    },

    confirm() {
      this.resolver?.(true);
      this.reset();
    },

    cancel() {
      this.resolver?.(false);
      this.reset();
    },

    reset() {
      this.open = false;
      this.resolver = null;
    },
  },
});
