// Injected at runtime so consumers don't need to import a CSS file.
// Override the look with --sz-bg, --sz-fg, --sz-border, --sz-muted, --sz-accent, --sz-radius and --sz-font.
// Per-type brand colors: --sz-success, --sz-error, --sz-info, --sz-warning, --sz-loading, --sz-default.
// Without --sz-font the toast inherits the page font.
// Everything sits in one cascade layer. Unlayered CSS always beats layered CSS, and a layer
// declared first loses to later ones, so page styles, Tailwind (v3 and v4) and CSS modules
// all override the defaults without needing higher specificity or !important.
export const css = `@layer sharkzen-toast{
.sz-container{position:fixed;z-index:2147483647;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;max-width:100%;pointer-events:none;
padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));
--sz-x:24px;--sz-y:0px}
.sz-top-right{top:0;right:0}
.sz-top-left{top:0;left:0;--sz-x:-24px}
.sz-top-center{top:0;left:0;right:0;align-items:center;--sz-x:0px;--sz-y:-24px}
.sz-bottom-right{bottom:0;right:0}
.sz-bottom-left{bottom:0;left:0;--sz-x:-24px}
.sz-bottom-center{bottom:0;left:0;right:0;align-items:center;--sz-x:0px;--sz-y:24px}

.sz-toast{--toast-accent:var(--sz-default,#60a5fa);--bg:#181a20;--fg:#f4f4f5;--border:#30343b;--muted:#a1a1aa;
--close:#71717a;--close-hover-bg:#2b2d35;--close-hover:#fff;
position:relative;overflow:hidden;pointer-events:auto;display:flex;align-items:flex-start;gap:12px;
width:min(380px,calc(100vw - 32px));padding:16px;box-sizing:border-box;
border:1px solid var(--sz-border,var(--border));border-radius:var(--sz-radius,16px);
background:var(--sz-bg,var(--bg));color:var(--sz-fg,var(--fg));
box-shadow:0 12px 40px rgb(0 0 0/24%),0 2px 8px rgb(0 0 0/12%);
font-family:var(--sz-font,inherit)}
.sz-toast[data-draggable]{touch-action:pan-y}
.sz-toast[data-clickable]{cursor:pointer}

.sz-toast--success{--toast-accent:var(--sz-success,#4ade80)}
.sz-toast--error{--toast-accent:var(--sz-error,#fb7185)}
.sz-toast--info{--toast-accent:var(--sz-info,#60a5fa)}
.sz-toast--warning{--toast-accent:var(--sz-warning,#fbbf24)}
.sz-toast--loading{--toast-accent:var(--sz-loading,#a1a1aa)}

.sz-toast[data-theme=light]{--bg:#fff;--fg:#18181b;--border:#e4e4e7;--muted:#52525b;
--close:#a1a1aa;--close-hover-bg:#f4f4f5;--close-hover:#18181b;box-shadow:0 8px 28px rgb(0 0 0/12%),0 2px 6px rgb(0 0 0/8%)}
.sz-toast[data-theme=light].sz-toast--success{--toast-accent:var(--sz-success,#16a34a)}
.sz-toast[data-theme=light].sz-toast--error{--toast-accent:var(--sz-error,#e11d48)}
.sz-toast[data-theme=light].sz-toast--info{--toast-accent:var(--sz-info,#2563eb)}
.sz-toast[data-theme=light].sz-toast--warning{--toast-accent:var(--sz-warning,#d97706)}
.sz-toast[data-theme=light].sz-toast--loading{--toast-accent:var(--sz-loading,#71717a)}

.sz-toast[data-theme=colored]{--bg:var(--sz-default,#3f3f46);--fg:#fff;--border:transparent;--muted:rgb(255 255 255/85%);
--close:rgb(255 255 255/80%);--close-hover-bg:rgb(255 255 255/20%);--close-hover:#fff;--toast-accent:#fff}
.sz-toast[data-theme=colored].sz-toast--success{--bg:var(--sz-success,#16a34a);--toast-accent:#fff}
.sz-toast[data-theme=colored].sz-toast--error{--bg:var(--sz-error,#e11d48);--toast-accent:#fff}
.sz-toast[data-theme=colored].sz-toast--info{--bg:var(--sz-info,#2563eb);--toast-accent:#fff}
.sz-toast[data-theme=colored].sz-toast--warning{--bg:var(--sz-warning,#b45309);--toast-accent:#fff}
.sz-toast[data-theme=colored].sz-toast--loading{--bg:var(--sz-loading,#3f3f46);--toast-accent:#fff}

.sz-toast__icon{display:grid;place-items:center;color:var(--sz-accent,var(--toast-accent));flex-shrink:0;font-size:1.25rem;line-height:1}
.sz-toast__content{flex:1;min-width:0}
.sz-toast__title{font-size:14px;font-weight:650;line-height:1.5;overflow-wrap:anywhere}
.sz-toast__description{margin-top:4px;color:var(--sz-muted,var(--muted));font-size:13px;line-height:1.6;overflow-wrap:anywhere}
.sz-toast__action{flex-shrink:0;align-self:center;padding:6px 12px;border:1px solid var(--sz-accent,var(--toast-accent));border-radius:8px;background:transparent;color:var(--sz-accent,var(--toast-accent));font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.sz-toast__action:hover{background:color-mix(in srgb,var(--sz-accent,var(--toast-accent)) 16%,transparent)}
.sz-toast__action:focus-visible{outline:2px solid var(--sz-accent,var(--toast-accent));outline-offset:2px}
.sz-toast__close{display:grid;place-items:center;padding:3px;border:0;border-radius:6px;background:transparent;color:var(--close);cursor:pointer}
.sz-toast__close:hover{background:var(--close-hover-bg);color:var(--close-hover)}
.sz-toast__close:focus-visible{outline:2px solid var(--sz-accent,var(--toast-accent));outline-offset:1px}

.sz-toast__bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--sz-accent,var(--toast-accent));opacity:.8;
transform-origin:left;animation:sz-bar linear forwards}
.sz-toast[data-paused] .sz-toast__bar{animation-play-state:paused}
[dir=rtl] .sz-toast__bar{transform-origin:right}

.sz-toast[data-transition=bounce]{animation:sz-in-slide 380ms cubic-bezier(.34,1.5,.64,1)}
.sz-toast[data-transition=slide]{animation:sz-in-slide 260ms cubic-bezier(.22,1,.36,1)}
.sz-toast[data-transition=zoom]{animation:sz-in-zoom 260ms cubic-bezier(.22,1,.36,1)}
.sz-toast[data-transition=flip]{animation:sz-in-flip 420ms cubic-bezier(.22,1,.36,1)}
.sz-toast[data-leaving][data-transition=bounce],.sz-toast[data-leaving][data-transition=slide]{animation:sz-out-slide 200ms ease-in forwards}
.sz-toast[data-leaving][data-transition=zoom]{animation:sz-out-zoom 200ms ease-in forwards}
.sz-toast[data-leaving][data-transition=flip]{animation:sz-out-flip 200ms ease-in forwards}
@keyframes sz-in-slide{from{opacity:0;transform:translate(var(--sz-x),var(--sz-y)) scale(.98)}to{opacity:1;transform:none}}
@keyframes sz-out-slide{to{opacity:0;transform:translate(var(--sz-x),var(--sz-y)) scale(.98)}}
@keyframes sz-in-zoom{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes sz-out-zoom{to{opacity:0;transform:scale(.6)}}
@keyframes sz-in-flip{from{opacity:0;transform:perspective(600px) rotateX(-90deg)}to{opacity:1;transform:none}}
@keyframes sz-out-flip{to{opacity:0;transform:perspective(600px) rotateX(90deg)}}
@keyframes sz-bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}

.sz-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:sz-draw 450ms ease-out forwards}
.sz-d1{animation-delay:260ms;animation-duration:300ms}
.sz-d2{animation-delay:380ms;animation-duration:300ms}
.sz-pop{transform-box:fill-box;transform-origin:center;opacity:0;animation:sz-pop 300ms cubic-bezier(.34,1.8,.64,1) 280ms forwards}
.sz-toast--success .sz-toast__icon{animation:sz-bounce 500ms cubic-bezier(.34,1.8,.64,1)}
.sz-toast--error .sz-toast__icon{animation:sz-shake 450ms ease-in-out 250ms}
.sz-toast--info .sz-toast__icon{animation:sz-bounce 500ms cubic-bezier(.34,1.8,.64,1)}
.sz-toast--warning .sz-toast__icon{transform-origin:50% 80%;animation:sz-wobble 700ms ease-in-out 250ms}
.sz-toast--loading .sz-toast__icon svg{animation:sz-spin 900ms linear infinite}
@keyframes sz-draw{to{stroke-dashoffset:0}}
@keyframes sz-pop{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
@keyframes sz-bounce{0%{transform:scale(.6)}100%{transform:scale(1)}}
@keyframes sz-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
@keyframes sz-wobble{0%,100%{transform:rotate(0)}20%{transform:rotate(-12deg)}40%{transform:rotate(10deg)}60%{transform:rotate(-6deg)}80%{transform:rotate(3deg)}}
@keyframes sz-spin{to{transform:rotate(360deg)}}

@media (max-width:480px){
.sz-container{left:0;right:0;width:100%;align-items:stretch;gap:8px;padding-left:max(12px,env(safe-area-inset-left));padding-right:max(12px,env(safe-area-inset-right));--sz-x:0px}
.sz-container[class*=sz-top-]{top:0;bottom:auto;--sz-y:-24px}
.sz-container[class*=sz-bottom-]{bottom:0;top:auto;--sz-y:24px}
.sz-toast{width:100%}
}
@media (prefers-reduced-motion:reduce){
.sz-toast[data-transition]{animation-duration:.01ms!important}
.sz-draw,.sz-pop,.sz-toast__icon{animation-duration:.01ms!important;animation-delay:0s!important}}
}`
