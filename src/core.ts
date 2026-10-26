import { icons } from './icons'
import { css } from './styles'

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
export type ToastTheme = 'light' | 'dark' | 'colored'
export type ToastTransition = 'bounce' | 'slide' | 'zoom' | 'flip'

/** Why a toast closed. */
export type ToastCloseReason = 'timeout' | 'button' | 'click' | 'swipe' | 'action' | 'dismiss'

/**
 * Your own icon. A string is shown as text (an emoji works well), a DOM node such as an
 * inline SVG is copied in, and `false` hides the icon.
 */
export type ToastIcon = false | string | Node

/** Inline styles. Use camelCase (`borderRadius`), kebab-case, or custom properties (`--sz-bg`). */
export type ToastStyle = Partial<CSSStyleDeclaration> & { [property: `--${string}`]: string }

export interface ToastAction {
  label: string
  onClick?: (event: MouseEvent) => void
  /** Keep the toast open after the button is clicked. By default it closes. */
  keepOpen?: boolean
}

/** Options that every toast resolves, so each has a built-in default. */
interface Behavior {
  /** Milliseconds before auto-dismiss. 0 keeps the toast until dismissed. */
  duration: number
  /** Show the countdown bar. Ignored when duration is 0. */
  progress: boolean
  position: ToastPosition
  /** Dismiss when the toast body is clicked. */
  closeOnClick: boolean
  pauseOnHover: boolean
  /** Pause the countdown while the browser window is not focused. */
  pauseOnFocusLoss: boolean
  /** Swipe sideways to dismiss. */
  draggable: boolean
  theme: ToastTheme
  transition: ToastTransition
}

/** Class names for each part of a toast, e.g. Tailwind utilities. */
export interface ToastClassNames {
  /** The toast box itself. Same as `className`. */
  toast?: string
  icon?: string
  /** Wraps the title and description. */
  content?: string
  title?: string
  description?: string
  action?: string
  close?: string
  /** The countdown bar. */
  progress?: string
}

/**
 * Your brand color for each toast type: any CSS color. It colors the icon and countdown bar,
 * and becomes the background in the `colored` theme. Types you leave out keep the built-in color.
 */
export type ToastColors = Partial<Record<ToastType, string>>

const CLASS_PARTS = ['toast', 'icon', 'content', 'title', 'description', 'action', 'close', 'progress'] as const

/** Options that have no default and can also be set globally. */
interface Look {
  /** Extra class names for the toast box. A global className and a per-toast one are combined. */
  className?: string
  /** Extra class names for individual parts. Merged with the global ones part by part. */
  classNames?: ToastClassNames
  /** Colors per toast type. A global and a per-toast value are merged type by type. */
  colors?: ToastColors
  style?: ToastStyle
  icon?: ToastIcon
  /** Runs once when the toast closes, whatever the reason. */
  onClose?: (reason: ToastCloseReason, id: string) => void
  /** Runs when the countdown ends and closes the toast. Also followed by `onClose`. */
  onAutoClose?: (id: string) => void
}

export interface ToastOptions extends Partial<Behavior>, Look {
  type?: ToastType
  description?: string
  /**
   * Your own id. While a toast with this id is on screen, showing it again updates that
   * toast in place instead of stacking a duplicate.
   */
  id?: string
  action?: ToastAction
}

/** Defaults for every toast, plus a few options that only make sense globally. */
export interface ToastConfig extends Partial<Behavior>, Look {
  /** Put new toasts above older ones instead of below. */
  newestOnTop?: boolean
  rtl?: boolean
  /** Max toasts on screen at once; extras wait in a queue. 0 = unlimited. */
  limit?: number
}

export type ToastUpdate = ToastOptions & { title?: string }

type Resolved = Behavior & Look & { type: ToastType; action?: ToastAction }

const DEFAULTS: Behavior & Required<Pick<ToastConfig, 'newestOnTop' | 'rtl' | 'limit'>> = {
  position: 'top-right',
  duration: 3000,
  progress: true,
  closeOnClick: false,
  pauseOnHover: true,
  pauseOnFocusLoss: true,
  draggable: true,
  theme: 'dark',
  transition: 'bounce',
  newestOnTop: false,
  rtl: false,
  limit: 0,
}

const STYLE_ID = 'sz-toast-styles'
const LEAVE_MS = 300
const DRAG_DISMISS_RATIO = 0.4

let config: typeof DEFAULTS & Look = { ...DEFAULTS }
let counter = 0
let windowBound = false

interface Entry {
  id: string
  el: HTMLElement
  /** Options exactly as the caller gave them, so an update can re-resolve. */
  raw: ToastOptions
  title: string
  description?: string
  opts: Resolved
  timer?: ReturnType<typeof setTimeout>
  remaining: number
  startedAt: number
  /** Why the countdown is frozen (hover, focus, drag, window). Empty = running. */
  reasons: Set<string>
  dragged: boolean
}
interface Job {
  id: string
  title: string
  raw: ToastOptions
}

const containers = new Map<ToastPosition, HTMLElement>()
const entries = new Map<string, Entry>()
const queue: Job[] = []

function mergeClassNames(a?: ToastClassNames, b?: ToastClassNames): ToastClassNames | undefined {
  if (!a && !b) return undefined
  const out: ToastClassNames = {}
  for (const part of CLASS_PARTS) {
    const merged = [a?.[part], b?.[part]].filter(Boolean).join(' ')
    if (merged) out[part] = merged
  }
  return out
}

function resolve(o: ToastOptions): Resolved {
  const type = o.type ?? 'default'
  const className = [config.className, o.className].filter(Boolean).join(' ')
  return {
    type,
    position: o.position ?? config.position,
    duration: o.duration ?? (type === 'loading' ? 0 : config.duration),
    progress: o.progress ?? config.progress,
    closeOnClick: o.closeOnClick ?? config.closeOnClick,
    pauseOnHover: o.pauseOnHover ?? config.pauseOnHover,
    pauseOnFocusLoss: o.pauseOnFocusLoss ?? config.pauseOnFocusLoss,
    draggable: o.draggable ?? config.draggable,
    theme: o.theme ?? config.theme,
    transition: o.transition ?? config.transition,
    className: className || undefined,
    classNames: mergeClassNames(config.classNames, o.classNames),
    colors: config.colors || o.colors ? { ...config.colors, ...o.colors } : undefined,
    style: config.style || o.style ? ({ ...config.style, ...o.style } as ToastStyle) : undefined,
    icon: o.icon !== undefined ? o.icon : config.icon,
    onClose: o.onClose ?? config.onClose,
    onAutoClose: o.onAutoClose ?? config.onAutoClose,
    action: o.action,
  }
}

// Everything touching the DOM is deferred to call time so importing
// this module is safe during SSR.
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = css
  // Unlayered and last in <head>, so it beats @layer resets and page CSS at equal specificity still wins.
  document.head.append(style)
}

function getContainer(position: ToastPosition) {
  let el = containers.get(position)
  if (!el || !el.isConnected) {
    el = document.createElement('div')
    el.className = `sz-container sz-${position}`
    el.dir = config.rtl ? 'rtl' : 'ltr'
    document.body.appendChild(el)
    containers.set(position, el)
  }
  return el
}

function div(className: string, text?: string) {
  const el = document.createElement('div')
  el.className = className
  if (text !== undefined) el.textContent = text
  return el
}

function applyStyle(el: HTMLElement, style?: ToastStyle) {
  if (!style) return
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue
    if (key.startsWith('--') || key.includes('-')) el.style.setProperty(key, String(value))
    else (el.style as unknown as Record<string, string>)[key] = String(value)
  }
}

// Only #rgb / #rrggbb can be measured here; other CSS colors keep the theme's text color.
function isLightColor(color: string): boolean {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!m?.[1]) return false
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  // 0.35 sits a little above the strict contrast crossover (~0.18), tuned so mid greens and
  // blues keep white text like the built-in colors, while yellows and pastels switch to dark.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35
}

function applyColors(el: HTMLElement, opts: Resolved) {
  if (!opts.colors) return
  for (const [type, color] of Object.entries(opts.colors)) {
    if (color) el.style.setProperty(`--sz-${type}`, color)
  }
  // In the colored theme the brand color is the background, so keep the text readable on it.
  const own = opts.colors[opts.type]
  if (own && opts.theme === 'colored' && isLightColor(own)) {
    el.style.setProperty('--fg', '#111827')
    el.style.setProperty('--muted', 'rgb(17 24 39 / 75%)')
    el.style.setProperty('--close', 'rgb(17 24 39 / 70%)')
    el.style.setProperty('--close-hover-bg', 'rgb(17 24 39 / 12%)')
    el.style.setProperty('--close-hover', '#111827')
    el.style.setProperty('--toast-accent', '#111827')
  }
}

// A throwing callback must not stop the toast from closing.
function safely(fn: () => void) {
  try {
    fn()
  } catch (err) {
    console.error(err)
  }
}

// ---- countdown -----------------------------------------------------------

function arm(e: Entry) {
  e.startedAt = Date.now()
  e.timer = setTimeout(() => remove(e.id, 'timeout'), e.remaining)
}

function pause(e: Entry, reason: string) {
  if (e.opts.duration <= 0 || !entries.has(e.id)) return
  if (e.reasons.size === 0) {
    clearTimeout(e.timer)
    e.remaining -= Date.now() - e.startedAt
    e.el.setAttribute('data-paused', '')
  }
  e.reasons.add(reason)
}

function resume(e: Entry, reason: string) {
  if (!e.reasons.delete(reason)) return
  if (e.reasons.size === 0 && entries.has(e.id)) {
    e.el.removeAttribute('data-paused')
    arm(e)
  }
}

function bindWindowFocus() {
  if (windowBound) return
  windowBound = true
  window.addEventListener('blur', () =>
    entries.forEach((e) => e.opts.pauseOnFocusLoss && pause(e, 'window')),
  )
  window.addEventListener('focus', () => entries.forEach((e) => resume(e, 'window')))
}

// ---- lifecycle -----------------------------------------------------------

function flushQueue() {
  while (queue.length && (config.limit <= 0 || entries.size < config.limit)) {
    const job = queue.shift()
    if (job) mount(job.id, job.title, job.raw)
  }
}

function remove(id: string, reason: ToastCloseReason = 'dismiss') {
  const e = entries.get(id)
  if (!e) {
    const i = queue.findIndex((job) => job.id === id)
    if (i >= 0) queue.splice(i, 1)
    return
  }
  clearTimeout(e.timer)
  entries.delete(id)
  e.el.setAttribute('data-leaving', '')

  const { onClose, onAutoClose } = e.opts
  if (reason === 'timeout') safely(() => onAutoClose?.(id))
  safely(() => onClose?.(reason, id))

  let finished = false
  const done = () => {
    if (finished) return
    finished = true
    e.el.remove()
    flushQueue()
  }
  // Child animations (icon, bar) bubble up; only the toast's own exit counts.
  e.el.addEventListener('animationend', (ev) => ev.target === e.el && done())
  setTimeout(done, LEAVE_MS)
}

/** A part's own class plus whatever the caller asked for. */
const cls = (e: Entry, base: string, part: keyof ToastClassNames) =>
  [base, e.opts.classNames?.[part]].filter(Boolean).join(' ')

function makeIcon(e: Entry): HTMLElement | null {
  const { icon, type } = e.opts
  if (icon === false) return null
  if (icon !== undefined) {
    const wrap = div(cls(e, 'sz-toast__icon', 'icon'))
    if (typeof icon === 'string') wrap.textContent = icon
    else wrap.appendChild(icon.cloneNode(true))
    return wrap
  }
  if (type === 'default') return null
  const wrap = div(cls(e, 'sz-toast__icon', 'icon'))
  wrap.innerHTML = icons[type] // static trusted markup, never user input
  return wrap
}

/** (Re)builds a toast's contents; used on first show and on every update. */
function fill(e: Entry) {
  const { el, opts } = e
  el.className = [
    'sz-toast',
    `sz-toast--${opts.type}`,
    opts.className,
    opts.classNames?.toast,
  ]
    .filter(Boolean)
    .join(' ')
  el.removeAttribute('style')
  applyColors(el, opts)
  applyStyle(el, opts.style)
  el.dataset.theme = opts.theme
  el.dataset.transition = opts.transition
  el.toggleAttribute('data-clickable', opts.closeOnClick)
  el.toggleAttribute('data-draggable', opts.draggable)
  el.setAttribute('role', opts.type === 'error' ? 'alert' : 'status')
  el.setAttribute('aria-live', opts.type === 'error' ? 'assertive' : 'polite')

  const parts: HTMLElement[] = []

  const icon = makeIcon(e)
  if (icon) parts.push(icon)

  const content = div(cls(e, 'sz-toast__content', 'content'))
  content.appendChild(div(cls(e, 'sz-toast__title', 'title'), e.title))
  if (e.description) content.appendChild(div(cls(e, 'sz-toast__description', 'description'), e.description))
  parts.push(content)

  const action = opts.action
  if (action) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = cls(e, 'sz-toast__action', 'action')
    btn.textContent = action.label
    btn.addEventListener('click', (ev) => {
      safely(() => action.onClick?.(ev))
      if (!action.keepOpen) remove(e.id, 'action')
    })
    parts.push(btn)
  }

  const close = document.createElement('button')
  close.type = 'button'
  close.className = cls(e, 'sz-toast__close', 'close')
  close.setAttribute('aria-label', 'Close notification')
  close.innerHTML = icons.close
  close.addEventListener('click', () => remove(e.id, 'button'))
  parts.push(close)

  if (opts.duration > 0 && opts.progress) {
    const bar = div(cls(e, 'sz-toast__bar', 'progress'))
    bar.style.animationDuration = `${opts.duration}ms`
    parts.push(bar)
  }

  el.replaceChildren(...parts)
}

function bindDrag(e: Entry) {
  const { el } = e
  let startX = 0
  let dx = 0
  let active = false

  el.addEventListener('pointerdown', (ev) => {
    if (!e.opts.draggable || ev.button > 0 || (ev.target as Element).closest('button')) return
    active = true
    startX = ev.clientX
    dx = 0
    e.dragged = false
    el.setPointerCapture?.(ev.pointerId)
    el.style.transition = 'none'
    el.style.userSelect = 'none'
    pause(e, 'drag')
  })

  el.addEventListener('pointermove', (ev) => {
    if (!active) return
    dx = ev.clientX - startX
    if (Math.abs(dx) > 4) e.dragged = true
    el.style.transform = `translateX(${dx}px)`
    el.style.opacity = String(1 - Math.min(Math.abs(dx) / (el.offsetWidth || 1), 1))
  })

  const end = () => {
    if (!active) return
    active = false
    el.style.userSelect = ''
    if (Math.abs(dx) > (el.offsetWidth || 1) * DRAG_DISMISS_RATIO) {
      remove(e.id, 'swipe')
    } else {
      el.style.transition = 'transform 200ms ease, opacity 200ms ease'
      el.style.transform = ''
      el.style.opacity = ''
      resume(e, 'drag')
    }
    // The click that follows pointerup must still see `dragged`.
    setTimeout(() => (e.dragged = false), 0)
  }
  el.addEventListener('pointerup', end)
  el.addEventListener('pointercancel', end)
}

function mount(id: string, title: string, raw: ToastOptions) {
  ensureStyles()
  bindWindowFocus()

  const opts = resolve(raw)
  const el = document.createElement('div')
  el.dataset.toastId = id
  const e: Entry = {
    id,
    el,
    raw,
    title,
    description: raw.description,
    opts,
    remaining: opts.duration,
    startedAt: 0,
    reasons: new Set(),
    dragged: false,
  }
  entries.set(id, e)
  fill(e)

  // Handlers read `e.opts` at event time so updates take effect immediately.
  el.addEventListener('mouseenter', () => e.opts.pauseOnHover && pause(e, 'hover'))
  el.addEventListener('mouseleave', () => resume(e, 'hover'))
  el.addEventListener('focusin', () => e.opts.pauseOnHover && pause(e, 'focus'))
  el.addEventListener('focusout', () => resume(e, 'focus'))
  el.addEventListener('click', (ev) => {
    if (e.opts.closeOnClick && !e.dragged && !(ev.target as Element).closest('button')) remove(id, 'click')
  })
  bindDrag(e)

  const container = getContainer(opts.position)
  if (config.newestOnTop) container.prepend(el)
  else container.appendChild(el)

  if (opts.duration > 0) arm(e)
}

// ---- public API ----------------------------------------------------------

export function show(title: string, options: ToastOptions = {}): string {
  if (typeof document === 'undefined') return ''
  const id = options.id ?? `sz-toast-${++counter}`
  // Same custom id already showing (or waiting): refresh it instead of stacking a copy.
  if (options.id !== undefined && isActive(id)) {
    update(id, { ...options, title })
    return id
  }
  if (config.limit > 0 && entries.size >= config.limit) queue.push({ id, title, raw: options })
  else mount(id, title, options)
  return id
}

export function update(id: string, options: ToastUpdate = {}) {
  if (typeof document === 'undefined') return
  const { title, ...rest } = options
  const job = queue.find((j) => j.id === id)
  if (job) {
    job.title = title ?? job.title
    job.raw = { ...job.raw, ...rest }
    return
  }

  const e = entries.get(id)
  if (!e) return
  clearTimeout(e.timer)
  e.raw = { ...e.raw, ...rest }
  e.title = title ?? e.title
  if ('description' in options) e.description = options.description
  e.opts = resolve(e.raw)
  e.remaining = e.opts.duration
  fill(e)
  // Still hovered/focused/dragged? Stay frozen; the matching leave event re-arms it.
  if (e.opts.duration > 0 && e.reasons.size === 0) arm(e)
}

export function dismiss(id?: string) {
  if (typeof document === 'undefined') return
  if (id) return remove(id)
  queue.length = 0
  for (const key of [...entries.keys()]) remove(key)
}

/** True while a toast with this id is on screen or waiting in the queue. */
export function isActive(id: string): boolean {
  return entries.has(id) || queue.some((job) => job.id === id)
}

type Message<T> = string | ((value: T) => string)
const text = <T>(m: Message<T>, value: T) => (typeof m === 'function' ? m(value) : m)

export function promise<T>(
  source: Promise<T> | (() => Promise<T>),
  messages: { pending: string; success: Message<T>; error: Message<unknown> },
  options: Omit<ToastOptions, 'type'> = {},
): Promise<T> {
  const id = show(messages.pending, { ...options, type: 'loading', duration: 0 })
  const p = typeof source === 'function' ? source() : source
  // An explicit `duration: undefined` resets the loading override back to the default.
  p.then(
    (value) => update(id, { title: text(messages.success, value), type: 'success', duration: options.duration }),
    (err: unknown) => update(id, { title: text(messages.error, err), type: 'error', duration: options.duration }),
  )
  return p
}

function applyConfig() {
  containers.forEach((c) => (c.dir = config.rtl ? 'rtl' : 'ltr'))
}

/** Change the defaults every toast inherits. Options passed to a single toast still win. */
export function configure(next: ToastConfig = {}) {
  const defined = Object.entries(next).filter(([, v]) => v !== undefined)
  config = { ...config, ...Object.fromEntries(defined) }
  applyConfig()
}

export function reset() {
  config = { ...DEFAULTS }
  applyConfig()
}
