'use client'

import { toast } from './index'

export { toast }
export type {
  ToastAction,
  ToastClassNames,
  ToastColors,
  ToastCloseReason,
  ToastConfig,
  ToastIcon,
  ToastOptions,
  ToastPosition,
  ToastStyle,
  ToastTheme,
  ToastTransition,
  ToastType,
  ToastUpdate,
} from './index'

/** Stable handle for components: `const t = useToast(); t.success('Saved')`. */
export function useToast() {
  return toast
}
