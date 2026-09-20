import { create } from 'zustand'

let nextId = 0

/**
 * Global toast queue. Import `toast` anywhere; `<Toaster />` renders the queue.
 */
export const useToastStore = create((set, get) => ({
  /** @type {Array<{id:number,title:string,description?:string,variant:'default'|'success'|'warning'|'danger'|'info'}>} */
  toasts: [],

  /**
   * @param {{title:string,description?:string,variant?:string,duration?:number}} toastInput
   * @returns {number} the toast id
   */
  push: ({ title, description, variant = 'default', duration = 4000 }) => {
    const id = ++nextId
    set((state) => ({ toasts: [...state.toasts, { id, title, description, variant }] }))
    if (duration > 0) setTimeout(() => get().dismiss(id), duration)
    return id
  },

  /** @param {number} id */
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),

  clear: () => set({ toasts: [] }),
}))

const push = (variant) => (title, description) =>
  useToastStore.getState().push({ title, description, variant })

/** Convenience API: `toast.success('Saved', 'Order PO-1024 updated')`. */
export const toast = {
  show: push('default'),
  success: push('success'),
  warning: push('warning'),
  error: push('danger'),
  info: push('info'),
  dismiss: (id) => useToastStore.getState().dismiss(id),
}
