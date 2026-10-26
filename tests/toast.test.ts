import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from '../src'

afterEach(() => {
  toast.dismiss()
  toast.reset()
  document.body.innerHTML = ''
  vi.useRealTimers()
})

const first = () => document.querySelector('.sz-toast') as HTMLElement
const all = () => [...document.querySelectorAll<HTMLElement>('.sz-toast')]
const titles = () => all().map((el) => el.querySelector('.sz-toast__title')?.textContent)
const leaving = (el: Element | null) => el?.hasAttribute('data-leaving')

describe('rendering', () => {
  it('renders title, description, icon and aria role', () => {
    toast.error('Boom', { description: 'Try again' })
    const el = first()
    expect(el.querySelector('.sz-toast__title')?.textContent).toBe('Boom')
    expect(el.querySelector('.sz-toast__description')?.textContent).toBe('Try again')
    expect(el.querySelector('.sz-toast__icon svg')).not.toBeNull()
    expect(el.classList.contains('sz-toast--error')).toBe(true)
    expect(el.getAttribute('role')).toBe('alert')
  })

  it('escapes user text', () => {
    toast('<img src=x onerror=alert(1)>')
    expect(document.querySelector('.sz-toast img')).toBeNull()
  })

  it('appends its styles last in <head>, unlayered, so page CSS can override them', () => {
    document.head.innerHTML = '<link rel="stylesheet" href="/app.css">'
    document.getElementById('sz-toast-styles')?.remove()
    toast('Hi')
    const style = document.head.lastElementChild as HTMLElement
    expect(style.id).toBe('sz-toast-styles')
    expect(style.textContent).not.toContain('@layer')
  })

  it.each(['light', 'dark', 'colored'] as const)('applies theme %s', (theme) => {
    toast('Hi', { theme })
    expect(first().dataset.theme).toBe(theme)
  })

  it.each(['bounce', 'slide', 'zoom', 'flip'] as const)('applies transition %s', (transition) => {
    toast('Hi', { transition })
    expect(first().dataset.transition).toBe(transition)
  })

  it.each(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const)(
    'supports position %s',
    (position) => {
      toast('Hi', { position })
      expect(first().parentElement?.classList.contains(`sz-${position}`)).toBe(true)
    },
  )
})

describe('timing', () => {
  it('defaults to 3 seconds and shows a progress bar', () => {
    vi.useFakeTimers()
    toast.success('Hi')
    expect(first().querySelector<HTMLElement>('.sz-toast__bar')?.style.animationDuration).toBe('3000ms')
    vi.advanceTimersByTime(2999)
    expect(leaving(first())).toBe(false)
    vi.advanceTimersByTime(1)
    expect(leaving(first())).toBe(true)
  })

  it('has no bar when progress is false or duration is 0', () => {
    toast('A', { progress: false })
    toast('B', { duration: 0 })
    expect(document.querySelector('.sz-toast__bar')).toBeNull()
  })

  it('removes the toast after the exit animation', () => {
    vi.useFakeTimers()
    toast('Hi', { duration: 1000 })
    vi.advanceTimersByTime(1400)
    expect(first()).toBeNull()
  })

  it('close button dismisses the toast', () => {
    vi.useFakeTimers()
    toast.info('Hi', { duration: 0 })
    first().querySelector<HTMLButtonElement>('.sz-toast__close')?.click()
    vi.advanceTimersByTime(400)
    expect(first()).toBeNull()
  })

  it('pauses on hover and resumes with the remaining time', () => {
    vi.useFakeTimers()
    toast('Hi')
    const el = first()
    vi.advanceTimersByTime(1000)
    el.dispatchEvent(new MouseEvent('mouseenter'))
    expect(el.hasAttribute('data-paused')).toBe(true)
    vi.advanceTimersByTime(60_000)
    expect(leaving(el)).toBe(false)
    el.dispatchEvent(new MouseEvent('mouseleave'))
    expect(el.hasAttribute('data-paused')).toBe(false)
    vi.advanceTimersByTime(1999)
    expect(leaving(el)).toBe(false)
    vi.advanceTimersByTime(1)
    expect(leaving(el)).toBe(true)
  })

  it('does not pause on hover when pauseOnHover is false', () => {
    vi.useFakeTimers()
    toast('Hi', { pauseOnHover: false })
    first().dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(3000)
    expect(leaving(first())).toBe(true)
  })

  it('pauses while the window is not focused', () => {
    vi.useFakeTimers()
    toast('Hi')
    window.dispatchEvent(new Event('blur'))
    vi.advanceTimersByTime(60_000)
    expect(leaving(first())).toBe(false)
    window.dispatchEvent(new Event('focus'))
    vi.advanceTimersByTime(3000)
    expect(leaving(first())).toBe(true)
  })

  it('ignores window blur when pauseOnFocusLoss is false', () => {
    vi.useFakeTimers()
    toast('Hi', { pauseOnFocusLoss: false })
    window.dispatchEvent(new Event('blur'))
    vi.advanceTimersByTime(3000)
    expect(leaving(first())).toBe(true)
  })
})

describe('interaction', () => {
  it('closeOnClick dismisses when the body is clicked, but not by default', () => {
    toast('A', { duration: 0 })
    first().click()
    expect(leaving(first())).toBe(false)

    toast('B', { duration: 0, closeOnClick: true })
    all()[1]?.click()
    expect(leaving(all()[1] ?? null)).toBe(true)
  })

  it('dismisses when swiped far enough, and springs back otherwise', () => {
    toast('Swipe', { duration: 0 })
    const el = first()
    // jsdom has no layout, so give the toast a real width for the 40% threshold.
    Object.defineProperty(el, 'offsetWidth', { value: 380 })
    const fire = (type: string, clientX: number) => el.dispatchEvent(new MouseEvent(type, { clientX }))

    fire('pointerdown', 0)
    fire('pointermove', 5)
    fire('pointerup', 5)
    expect(leaving(el)).toBe(false)

    fire('pointerdown', 0)
    fire('pointermove', 300)
    fire('pointerup', 300)
    expect(leaving(el)).toBe(true)
  })

  it('does not swipe when draggable is false', () => {
    toast('Stay', { duration: 0, draggable: false })
    const el = first()
    el.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0 }))
    el.dispatchEvent(new MouseEvent('pointermove', { clientX: 300 }))
    el.dispatchEvent(new MouseEvent('pointerup', { clientX: 300 }))
    expect(leaving(el)).toBe(false)
  })
})

describe('container config', () => {
  it('configure() sets defaults and per-toast options still win', () => {
    toast.configure({ theme: 'light', position: 'bottom-center', duration: 1000 })
    toast('A')
    toast('B', { theme: 'colored' })
    expect(first().dataset.theme).toBe('light')
    expect(first().parentElement?.classList.contains('sz-bottom-center')).toBe(true)
    expect(all()[1]?.dataset.theme).toBe('colored')
    expect(first().querySelector<HTMLElement>('.sz-toast__bar')?.style.animationDuration).toBe('1000ms')
  })

  it('reset() restores the built-in defaults', () => {
    toast.configure({ theme: 'light' })
    toast.reset()
    toast('A')
    expect(first().dataset.theme).toBe('dark')
  })

  it('newestOnTop puts new toasts before older ones', () => {
    toast('A', { duration: 0 })
    toast('B', { duration: 0 })
    expect(titles()).toEqual(['A', 'B'])
    toast.dismiss()
    document.body.innerHTML = ''

    toast.configure({ newestOnTop: true })
    toast('A', { duration: 0 })
    toast('B', { duration: 0 })
    expect(titles()).toEqual(['B', 'A'])
  })

  it('rtl sets the container direction, including existing containers', () => {
    toast('A', { duration: 0 })
    toast.configure({ rtl: true })
    expect(first().parentElement?.dir).toBe('rtl')
  })

  it('limit queues extra toasts until a slot frees up', () => {
    vi.useFakeTimers()
    toast.configure({ limit: 2 })
    toast('A', { duration: 0 })
    toast('B', { duration: 0 })
    toast('C', { duration: 0 })
    expect(titles()).toEqual(['A', 'B'])
    toast.dismiss(first().dataset.toastId)
    vi.advanceTimersByTime(400)
    expect(titles()).toEqual(['B', 'C'])
  })

  it('dismiss() also clears the queue', () => {
    vi.useFakeTimers()
    toast.configure({ limit: 1 })
    toast('A', { duration: 0 })
    toast('B', { duration: 0 })
    toast.dismiss()
    vi.advanceTimersByTime(400)
    expect(all()).toHaveLength(0)
  })
})

describe('update and promise', () => {
  it('update() changes the toast in place and restarts the countdown', () => {
    vi.useFakeTimers()
    const id = toast.loading('Working')
    expect(first().classList.contains('sz-toast--loading')).toBe(true)
    toast.update(id, { title: 'Done', type: 'success', description: 'All good' })
    const el = first()
    expect(all()).toHaveLength(1)
    expect(el.classList.contains('sz-toast--success')).toBe(true)
    expect(el.querySelector('.sz-toast__title')?.textContent).toBe('Done')
    expect(el.querySelector('.sz-toast__description')?.textContent).toBe('All good')
    vi.advanceTimersByTime(3000)
    expect(leaving(el)).toBe(true)
  })

  it('promise() shows a loading toast, then the success message', async () => {
    let resolve!: (v: string) => void
    const p = new Promise<string>((r) => (resolve = r))
    toast.promise(p, { pending: 'Saving', success: (v) => `Saved ${v}`, error: 'Nope' })
    expect(first().classList.contains('sz-toast--loading')).toBe(true)
    expect(first().querySelector('.sz-toast__title')?.textContent).toBe('Saving')

    resolve('file')
    await p
    expect(first().classList.contains('sz-toast--success')).toBe(true)
    expect(first().querySelector('.sz-toast__title')?.textContent).toBe('Saved file')
  })

  it('promise() shows the error message on rejection', async () => {
    const p = Promise.reject(new Error('x'))
    toast.promise(p, { pending: 'Saving', success: 'ok', error: (e) => `Failed: ${(e as Error).message}` }).catch(() => {})
    await p.catch(() => {})
    expect(first().classList.contains('sz-toast--error')).toBe(true)
    expect(first().querySelector('.sz-toast__title')?.textContent).toBe('Failed: x')
  })

  it('dismiss(id) removes only that toast', () => {
    vi.useFakeTimers()
    const a = toast('A', { duration: 0 })
    toast('B', { duration: 0 })
    toast.dismiss(a)
    vi.advanceTimersByTime(400)
    expect(all()).toHaveLength(1)
  })
})
