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
const leaving = (el: Element | null | undefined) => el?.hasAttribute('data-leaving')

describe('custom look', () => {
  it('adds className and inline style, including custom properties', () => {
    toast('Hi', { className: 'my-toast', style: { borderRadius: '4px', '--sz-bg': '#123456' } })
    const el = first()
    expect(el.classList.contains('my-toast')).toBe(true)
    expect(el.classList.contains('sz-toast')).toBe(true)
    expect(el.style.borderRadius).toBe('4px')
    expect(el.style.getPropertyValue('--sz-bg')).toBe('#123456')
  })

  it('combines a global className with a per-toast one and merges styles', () => {
    toast.configure({ className: 'all', style: { color: 'red' } })
    toast('Hi', { className: 'one', style: { opacity: '0.9' } })
    expect(first().className).toContain('all one')
    expect(first().style.color).toBe('red')
    expect(first().style.opacity).toBe('0.9')
  })

  it('shows a text icon, a DOM node icon, and hides the icon with false', () => {
    toast.success('A', { icon: '🎉', duration: 0 })
    expect(all()[0]?.querySelector('.sz-toast__icon')?.textContent).toBe('🎉')

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('data-mine', '')
    toast.success('B', { icon: svg, duration: 0 })
    expect(all()[1]?.querySelector('.sz-toast__icon [data-mine]')).not.toBeNull()

    toast.success('C', { icon: false, duration: 0 })
    expect(all()[2]?.querySelector('.sz-toast__icon')).toBeNull()
  })

  it('does not treat a text icon as HTML', () => {
    toast('Hi', { icon: '<img src=x onerror=alert(1)>' })
    expect(document.querySelector('.sz-toast img')).toBeNull()
  })

  it('works through update()', () => {
    const id = toast.success('Hi', { duration: 0 })
    toast.update(id, { icon: false, className: 'changed' })
    expect(first().querySelector('.sz-toast__icon')).toBeNull()
    expect(first().classList.contains('changed')).toBe(true)
  })
})

describe('action button', () => {
  it('renders, calls onClick, then closes the toast', () => {
    const onClick = vi.fn()
    toast('Deleted', { duration: 0, action: { label: 'Undo', onClick } })
    const btn = first().querySelector<HTMLButtonElement>('.sz-toast__action')
    expect(btn?.textContent).toBe('Undo')
    btn?.click()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(leaving(first())).toBe(true)
  })

  it('keepOpen leaves the toast on screen', () => {
    toast('Hi', { duration: 0, action: { label: 'More', keepOpen: true } })
    first().querySelector<HTMLButtonElement>('.sz-toast__action')?.click()
    expect(leaving(first())).toBe(false)
  })

  it('a throwing onClick still closes the toast', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    toast('Hi', {
      duration: 0,
      action: {
        label: 'Go',
        onClick: () => {
          throw new Error('boom')
        },
      },
    })
    first().querySelector<HTMLButtonElement>('.sz-toast__action')?.click()
    expect(leaving(first())).toBe(true)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('is not rendered when no action is given', () => {
    toast('Hi')
    expect(document.querySelector('.sz-toast__action')).toBeNull()
  })
})

describe('close callbacks', () => {
  it('onAutoClose and onClose("timeout") run when the countdown ends', () => {
    vi.useFakeTimers()
    const onAutoClose = vi.fn()
    const onClose = vi.fn()
    const id = toast('Hi', { duration: 1000, onAutoClose, onClose })
    vi.advanceTimersByTime(1000)
    expect(onAutoClose).toHaveBeenCalledWith(id)
    expect(onClose).toHaveBeenCalledWith('timeout', id)
  })

  it('reports why a toast closed, and onAutoClose stays silent for manual closes', () => {
    const onAutoClose = vi.fn()
    const reasons: string[] = []
    const onClose = (reason: string) => reasons.push(reason)

    toast('A', { duration: 0, onClose, onAutoClose })
    all()[0]?.querySelector<HTMLButtonElement>('.sz-toast__close')?.click()

    toast('B', { duration: 0, onClose, onAutoClose, closeOnClick: true })
    all()[1]?.click()

    toast('C', { duration: 0, onClose, onAutoClose, action: { label: 'x' } })
    all()[2]?.querySelector<HTMLButtonElement>('.sz-toast__action')?.click()

    const d = toast('D', { duration: 0, onClose, onAutoClose })
    toast.dismiss(d)

    expect(reasons).toEqual(['button', 'click', 'action', 'dismiss'])
    expect(onAutoClose).not.toHaveBeenCalled()
  })

  it('reports "swipe" when dragged away', () => {
    const onClose = vi.fn()
    toast('Swipe', { duration: 0, onClose })
    const el = first()
    Object.defineProperty(el, 'offsetWidth', { value: 380 })
    el.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0 }))
    el.dispatchEvent(new MouseEvent('pointermove', { clientX: 300 }))
    el.dispatchEvent(new MouseEvent('pointerup', { clientX: 300 }))
    expect(onClose).toHaveBeenCalledWith('swipe', expect.any(String))
  })

  it('fires only once even if closed twice', () => {
    const onClose = vi.fn()
    const id = toast('Hi', { duration: 0, onClose })
    toast.dismiss(id)
    toast.dismiss(id)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('a global onClose applies unless the toast sets its own', () => {
    const global = vi.fn()
    const own = vi.fn()
    toast.configure({ onClose: global })
    const a = toast('A', { duration: 0 })
    const b = toast('B', { duration: 0, onClose: own })
    toast.dismiss(a)
    toast.dismiss(b)
    expect(global).toHaveBeenCalledTimes(1)
    expect(own).toHaveBeenCalledTimes(1)
  })

  it('a throwing callback does not stop the toast closing', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const id = toast('Hi', {
      duration: 0,
      onClose: () => {
        throw new Error('boom')
      },
    })
    toast.dismiss(id)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('custom id', () => {
  it('shows a repeat of the same id in place instead of stacking', () => {
    vi.useFakeTimers()
    const a = toast.error('Offline', { id: 'net', duration: 3000 })
    vi.advanceTimersByTime(2000)
    const b = toast.error('Still offline', { id: 'net', duration: 3000 })
    expect(a).toBe('net')
    expect(b).toBe('net')
    expect(all()).toHaveLength(1)
    expect(titles()).toEqual(['Still offline'])
    // the countdown restarted, so 2s later it is still up
    vi.advanceTimersByTime(2000)
    expect(leaving(first())).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(leaving(first())).toBe(true)
  })

  it('different ids stack, and the id can be used to dismiss', () => {
    vi.useFakeTimers()
    toast('A', { id: 'a', duration: 0 })
    toast('B', { id: 'b', duration: 0 })
    expect(all()).toHaveLength(2)
    toast.dismiss('a')
    vi.advanceTimersByTime(400)
    expect(titles()).toEqual(['B'])
  })

  it('isActive reflects on-screen and queued toasts', () => {
    vi.useFakeTimers()
    toast.configure({ limit: 1 })
    toast('A', { id: 'a', duration: 0 })
    toast('B', { id: 'b', duration: 0 })
    expect(toast.isActive('a')).toBe(true)
    expect(toast.isActive('b')).toBe(true) // waiting in the queue
    expect(toast.isActive('nope')).toBe(false)
    toast.dismiss('a')
    expect(toast.isActive('a')).toBe(false)
  })

  it('a duplicate id of a queued toast updates the queued one', () => {
    vi.useFakeTimers()
    toast.configure({ limit: 1 })
    toast('A', { id: 'a', duration: 0 })
    toast('B', { id: 'b', duration: 0 })
    toast('B2', { id: 'b', duration: 0 })
    toast.dismiss('a')
    vi.advanceTimersByTime(400)
    expect(titles()).toEqual(['B2'])
  })

  it('the same id can be reused after the toast has closed', () => {
    vi.useFakeTimers()
    toast('A', { id: 'x', duration: 100 })
    vi.advanceTimersByTime(500)
    toast('A again', { id: 'x', duration: 0 })
    expect(titles()).toEqual(['A again'])
  })
})

describe('classNames per part', () => {
  it('puts Tailwind-style classes on each part', () => {
    toast.success('Hi', {
      description: 'There',
      duration: 0,
      action: { label: 'Go' },
      classNames: {
        toast: 'rounded-none bg-red-500',
        icon: 'text-white',
        content: 'gap-2',
        title: 'text-lg font-bold',
        description: 'opacity-70',
        action: 'uppercase',
        close: 'hidden',
        progress: 'h-1',
      },
    })
    const el = first()
    expect(el.classList.contains('rounded-none')).toBe(true)
    expect(el.classList.contains('bg-red-500')).toBe(true)
    expect(el.querySelector('.sz-toast__icon')?.classList.contains('text-white')).toBe(true)
    expect(el.querySelector('.sz-toast__content')?.classList.contains('gap-2')).toBe(true)
    expect(el.querySelector('.sz-toast__title')?.classList.contains('font-bold')).toBe(true)
    expect(el.querySelector('.sz-toast__description')?.classList.contains('opacity-70')).toBe(true)
    expect(el.querySelector('.sz-toast__action')?.classList.contains('uppercase')).toBe(true)
    expect(el.querySelector('.sz-toast__close')?.classList.contains('hidden')).toBe(true)
  })

  it('shows the progress class on the countdown bar', () => {
    toast('Hi', { classNames: { progress: 'h-1' } })
    expect(first().querySelector('.sz-toast__bar')?.classList.contains('h-1')).toBe(true)
  })

  it('merges global and per-toast classNames part by part', () => {
    toast.configure({ classNames: { title: 'a', icon: 'x' } })
    toast.success('Hi', { duration: 0, classNames: { title: 'b' } })
    expect(first().querySelector('.sz-toast__title')?.className).toBe('sz-toast__title a b')
    expect(first().querySelector('.sz-toast__icon')?.classList.contains('x')).toBe(true)
  })

  it('keeps working after update()', () => {
    const id = toast('Hi', { duration: 0, classNames: { title: 'one' } })
    toast.update(id, { classNames: { title: 'two' } })
    expect(first().querySelector('.sz-toast__title')?.className).toBe('sz-toast__title two')
  })

  it('injects unlayered CSS so @layer resets (Tailwind v4 preflight) cannot override it', () => {
    toast('Hi')
    const css = document.getElementById('sz-toast-styles')?.textContent ?? ''
    expect(css).not.toContain('@layer')
    expect(css.startsWith('.sz-container{')).toBe(true)
  })

})

describe('colors per type', () => {
  it('sets the per-type color variables on the toast', () => {
    toast.success('Hi', { colors: { success: '#123456', error: 'rebeccapurple' } })
    expect(first().style.getPropertyValue('--sz-success')).toBe('#123456')
    expect(first().style.getPropertyValue('--sz-error')).toBe('rebeccapurple')
  })

  it('merges global and per-toast colors type by type', () => {
    toast.configure({ colors: { success: '#111111', error: '#222222' } })
    toast.success('Hi', { colors: { success: '#333333' } })
    expect(first().style.getPropertyValue('--sz-success')).toBe('#333333')
    expect(first().style.getPropertyValue('--sz-error')).toBe('#222222')
  })

  it('leaves everything alone when no colors are given', () => {
    toast.success('Hi')
    expect(first().style.getPropertyValue('--sz-success')).toBe('')
  })

  it('switches to dark text on a light brand color in the colored theme', () => {
    toast.warning('Hi', { theme: 'colored', colors: { warning: '#facc15' } })
    expect(first().style.getPropertyValue('--fg')).toBe('#111827')
  })

  it('keeps white text on a dark brand color in the colored theme', () => {
    toast.success('Hi', { theme: 'colored', colors: { success: '#166534' } })
    expect(first().style.getPropertyValue('--fg')).toBe('')
  })

  it('does not touch text color outside the colored theme', () => {
    toast.warning('Hi', { theme: 'dark', colors: { warning: '#facc15' } })
    expect(first().style.getPropertyValue('--fg')).toBe('')
  })

  it('understands 3-digit hex, and ignores colors it cannot measure', () => {
    toast.warning('A', { theme: 'colored', duration: 0, colors: { warning: '#ff0' } })
    expect(all()[0]?.style.getPropertyValue('--fg')).toBe('#111827')
    toast.warning('B', { theme: 'colored', duration: 0, colors: { warning: 'yellow' } })
    expect(all()[1]?.style.getPropertyValue('--fg')).toBe('')
  })

  it('works through update()', () => {
    const id = toast.success('Hi', { duration: 0 })
    toast.update(id, { colors: { success: '#abcdef' } })
    expect(first().style.getPropertyValue('--sz-success')).toBe('#abcdef')
  })
})
