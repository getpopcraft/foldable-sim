// The simulator: your app in a frame the size of a foldable's screen, in each posture, with the posture reported to
// it the way the device would. Cross-origin apps get it by postMessage (include client/foldable-posture.js); a
// same-origin app gets it written straight onto its document too, so it needs no client at all.

import { screenFor } from './devices.js'
import { MESSAGE_TYPE } from './client/foldable-posture.js'

const $ = id => document.getElementById(id)
const frame = $('app'), device = $('device'), crease = $('crease'), stage = $('stage')
const params = new URLSearchParams(location.search)

const store = {
  get: (k, d) => { try { return localStorage.getItem(`foldable-sim:${k}`) ?? d } catch { return d } },
  set: (k, v) => { try { localStorage.setItem(`foldable-sim:${k}`, v) } catch { /* private mode */ } },
}

const state = {
  device: params.get('device') ?? store.get('device', 'iphone-duo'),
  posture: params.get('posture') ?? store.get('posture', 'half'),
  orientation: params.get('orientation') ?? store.get('orientation', 'landscape'),
  // Same-origin apps: also write attributes with this prefix directly (PopCraft uses ?prefix=pc).
  prefix: params.get('prefix') ?? store.get('prefix', ''),
  // The demo when nothing else has been opened, so the hosted page shows something straight away.
  url: params.get('url') ?? store.get('url', new URL('./demo/', location.href).href),
}

const BEZEL = 14

function posture() {
  const s = screenFor(state.device, state.posture, state.orientation)
  return { type: MESSAGE_TYPE, device: state.device, hinge: s.hinge, fold: s.fold, crease: s.crease, touch: true, screen: s }
}

/** Tell the app: by message always, and onto its document when it is same-origin (no client script needed). */
function publish() {
  const p = posture()
  const win = frame.contentWindow
  if (!win) return
  const { screen, ...message } = p
  win.postMessage(message, '*')
  try {
    const d = frame.contentDocument?.documentElement
    if (!d) return
    const a = n => (state.prefix ? `data-${state.prefix}-${n}` : `data-${n}`)
    const v = n => (state.prefix ? `--${state.prefix}-${n}` : `--${n}`)
    const c = p.crease ?? { x: 0, y: 0, w: 0, h: 0 }
    d.setAttribute(a('hinge'), p.hinge)
    d.setAttribute(a('fold'), p.fold)
    d.setAttribute(a('touch'), '')
    // The app's own Viewport Segments reader should not overwrite what the simulator says.
    d.setAttribute(a('native-fold'), '')
    for (const [k, val] of [['fold-x', c.x], ['fold-y', c.y], ['fold-w', c.w], ['fold-h', c.h]]) d.style.setProperty(v(k), `${val}px`)
    win.dispatchEvent(new win.CustomEvent(state.prefix ? `${state.prefix}-fold` : 'foldable-posture', { detail: message }))
  } catch { /* cross-origin: the message carries it */ }
}

function layout() {
  const s = posture().screen
  device.style.width = `${s.w + 2 * BEZEL}px`
  device.style.height = `${s.h + 2 * BEZEL}px`
  device.style.padding = `${BEZEL}px`
  device.style.borderRadius = `${s.radius}px`
  frame.style.width = `${s.w}px`
  frame.style.height = `${s.h}px`
  frame.style.borderRadius = `${Math.max(0, s.radius - BEZEL + 2)}px`
  if (s.crease) {
    Object.assign(crease.style, { display: 'block', left: `${BEZEL + s.crease.x}px`, top: `${BEZEL + s.crease.y}px`, width: `${s.crease.w}px`, height: `${s.crease.h}px` })
    crease.dataset.fold = s.fold
  } else crease.style.display = 'none'
  // Shrink to fit a smaller screen (an iPad mini in portrait); never enlarge.
  const r = stage.getBoundingClientRect()
  const scale = Math.min(1, (r.width - 24) / (s.w + 2 * BEZEL), (r.height - 24) / (s.h + 2 * BEZEL))
  device.style.transform = `scale(${scale})`
  $('size').textContent = `${s.w}×${s.h}${scale < 1 ? ` · ${Math.round(scale * 100)}%` : ''}`
  for (const b of document.querySelectorAll('[data-posture]')) b.setAttribute('aria-selected', String(b.dataset.posture === state.posture))
  publish()
}

function setUrl(url) {
  state.url = url
  store.set('url', url)
  $('url').value = url
  $('empty').hidden = !!url
  device.hidden = !url
  if (url && frame.getAttribute('src') !== url) frame.src = url
}

// The app asks for the posture when its client starts, and every page it loads gets it again.
window.addEventListener('message', e => { if (e.source === frame.contentWindow && e.data?.type === 'foldable-sim:ready') publish() })
frame.addEventListener('load', publish)
new ResizeObserver(layout).observe(stage)

$('url-form').addEventListener('submit', e => { e.preventDefault(); setUrl($('url').value.trim()) })
for (const b of document.querySelectorAll('[data-posture]')) {
  b.addEventListener('click', () => { state.posture = b.dataset.posture; store.set('posture', state.posture); layout() })
}
$('rotate').addEventListener('click', () => {
  state.orientation = state.orientation === 'portrait' ? 'landscape' : 'portrait'
  store.set('orientation', state.orientation)
  layout()
})
if (params.get('prefix') !== null) store.set('prefix', state.prefix)

setUrl(state.url)
layout()
