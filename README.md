# sharkzen-toast

Lightweight, dependency-free toast notifications. Works with plain JS, React, Next.js, Vue, Svelte.

```bash
npm install sharkzen-toast
```

```ts
import { toast } from 'sharkzen-toast'

toast.success('Saved', { description: 'Your changes are live.' })
toast.error('Something went wrong', { duration: 0 })
toast('Hello', { position: 'bottom-center', theme: 'colored' })
```

React / Next.js (client components):

```tsx
import { useToast } from 'sharkzen-toast/react'
```

No setup, container or CSS import needed. Styles are injected on first use.

## API

| Call | |
|---|---|
| `toast(title, options?)` | Default toast. Returns its id |
| `toast.success / error / warning / info / loading(title, options?)` | Typed toasts |
| `toast.promise(promise, { pending, success, error }, options?)` | Loading toast that becomes success or error. `success`/`error` can be functions |
| `toast.update(id, { title, description, type, ...options })` | Change a toast in place and restart its timer |
| `toast.dismiss(id?)` | Close one toast, or all (and the queue) |
| `toast.isActive(id)` | Is a toast with this id showing or queued? |
| `toast.configure(config)` | Defaults for every toast |
| `toast.reset()` | Back to built-in defaults |

## Options

Per toast, or as defaults through `toast.configure()`:

| Option | Default | Notes |
|---|---|---|
| `description` | – | Second line of text (per toast only) |
| `duration` | `3000` | ms; `0` keeps it until closed |
| `progress` | `true` | Countdown bar |
| `position` | `top-right` | `top-left` `top-center` `top-right` `bottom-left` `bottom-center` `bottom-right` |
| `theme` | `dark` | `light` `dark` `colored` |
| `transition` | `bounce` | `bounce` `slide` `zoom` `flip` |
| `closeOnClick` | `false` | Click the body to dismiss |
| `pauseOnHover` | `true` | Also pauses while focused |
| `pauseOnFocusLoss` | `true` | Pauses while the window is not focused |
| `draggable` | `true` | Swipe sideways to dismiss |
| `className` | – | Extra class names (combined with a global one) |
| `classNames` | – | Classes per part (`toast`, `icon`, `content`, `title`, `description`, `action`, `close`, `progress`), e.g. Tailwind utilities |
| `colors` | – | Brand color per type: `{ success: '#14b8a6', error: '#f43f5e', … }`. Colors the icon and bar, and the background in the `colored` theme |
| `style` | – | Inline styles, CSS variables allowed (`'--sz-accent': '#a855f7'`) |
| `icon` | by type | Your own icon: text/emoji or a DOM node. `false` hides it |
| `onClose` | – | `(reason, id) => void`, runs once on every close |
| `onAutoClose` | – | `(id) => void`, runs when the countdown ends |
| `id` | auto | Your own id. Showing it again refreshes the toast instead of duplicating it (per toast only) |
| `action` | – | `{ label, onClick?, keepOpen? }` button such as Undo (per toast only) |

```ts
toast.success('Message deleted', {
  duration: 6000,
  action: { label: 'Undo', onClick: () => restoreMessage(id) },
})
```

Only through `toast.configure()`:

| Option | Default | Notes |
|---|---|---|
| `newestOnTop` | `false` | New toasts go above older ones |
| `rtl` | `false` | Right-to-left layout |
| `limit` | `0` | Max toasts on screen; the rest wait in a queue |

On screens ≤ 480px toasts automatically become full width and stick to the top or bottom edge.

## Theming

Override CSS variables: `--sz-bg`, `--sz-fg`, `--sz-border`, `--sz-muted`, `--sz-accent`, `--sz-radius`, `--sz-font`. Toasts use your page's font unless you set `--sz-font`.

## Documentation

The docs site (English and Thai) lives in [`docs/`](docs) and is built with Astro Starlight. It imports the library from `src/`, so every demo runs the current code.

```bash
cd docs && npm install
npm run docs:dev      # from the repo root: http://localhost:4321
npm run docs:build
```

Pushing to `main` deploys it to GitHub Pages through [.github/workflows/docs.yml](.github/workflows/docs.yml).

## Development

```bash
npm run playground   # interactive demo with live code
npm test
npm run build
```

## License

MIT
