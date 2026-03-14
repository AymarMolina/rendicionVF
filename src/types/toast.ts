export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  title: string
  message?: string
  variant: ToastVariant
  duration: number
  sticky: boolean
  createdAt: number
}

export interface ToastState {
  items: ToastItem[]
  max: number
}

export interface PushOptions {
  title: string
  message?: string
  variant?: ToastVariant
  duration?: number
  sticky?: boolean
}
