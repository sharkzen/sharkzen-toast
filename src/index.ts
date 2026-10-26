import { configure, dismiss, isActive, promise, reset, show, update, type ToastOptions } from './core'

type Shortcut = (title: string, options?: Omit<ToastOptions, 'type'>) => string

const shortcut =
  (type: NonNullable<ToastOptions['type']>): Shortcut =>
  (title, options) =>
    show(title, { ...options, type })

export const toast = Object.assign(show, {
  success: shortcut('success'),
  error: shortcut('error'),
  warning: shortcut('warning'),
  info: shortcut('info'),
  loading: shortcut('loading'),
  promise,
  update,
  isActive,
  dismiss,
  configure,
  reset,
})

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
} from './core'
