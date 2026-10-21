// foldable-posture — the half of foldable-sim that runs inside the app being tested.
//
// The simulator frames your app at a foldable's screen size and sends it the device's posture by postMessage. This
// applies that posture to the page the same way a native shell or the browser would, so the app's own foldable
// layout runs unchanged:
//
//   <html data-hinge="closed|partial|open|none|unknown" data-fold="none|vertical|horizontal" data-touch>
//   --fold-x / --fold-y / --fold-w / --fold-h      the crease (the division region) in CSS px, 0 when there is none
//   window 'foldable-posture' event                 { hinge, fold, crease } after every change
//   window.viewport.segments                        the Viewport Segments API, as the simulated device would report it
//
// Nothing happens unless the page is framed by the simulator: include it in development builds and forget it.
//
//   import { installFoldablePosture } from './foldable-posture.js'
//   installFoldablePosture({ prefix: 'pc' })   // → data-pc-hinge, --pc-fold-x, 'pc-fold' event
//
// MIT licensed. https://github.com/getpopcraft/foldable-sim

export const MESSAGE_TYPE = 'foldable-sim:posture'

/**
 * Start listening for postures from the simulator. Returns a function that stops.
 *
 * @param {{ prefix?: string, origin?: string | string[], segments?: boolean, onChange?: (p: Posture) => void }} [options]
 *   prefix    names the attributes, variables and event: 'pc' gives data-pc-hinge, --pc-fold-x and 'pc-fold'.
 *   origin    the simulator's origin(s) to accept messages from; by default any (it is a development tool).
 *   segments  shim window.viewport.segments when the browser has no Viewport Segments API (default true).
 *   onChange  called with each posture.
 */
export function installFoldablePosture(options = {}) {
  if (typeof window === 'undefined' || window.parent === window) return () => {}
  const { prefix = '', origin, segments = true, onChange } = options
  const attr = name => (prefix ? `data-${prefix}-${name}` : `data-${name}`)
  const cssVar = name => (prefix ? `--${prefix}-${name}` : `--${name}`)
  const eventName = prefix ? `${prefix}-fold` : 'foldable-posture'
  const allowed = origin == null ? null : [].concat(origin)

  /** @param {Posture} p */
  const apply = p => {
    const d = document.documentElement
    if (!d) return
    const c = p.crease ?? { x: 0, y: 0, w: 0, h: 0 }
    d.setAttribute(attr('hinge'), p.hinge)
    d.setAttribute(attr('fold'), p.fold)
    // The simulated device's touch screen, even when the simulator runs on a laptop (a simulated laptop has none).
    d.toggleAttribute(attr('touch'), p.touch !== false)
    d.style.setProperty(cssVar('fold-x'), `${c.x}px`)
    d.style.setProperty(cssVar('fold-y'), `${c.y}px`)
    d.style.setProperty(cssVar('fold-w'), `${c.w}px`)
    d.style.setProperty(cssVar('fold-h'), `${c.h}px`)
    if (segments) shimSegments(p)
    window.dispatchEvent(new CustomEvent(eventName, { detail: p }))
    onChange?.(p)
  }

  const onMessage = e => {
    if (allowed && !allowed.includes(e.origin)) return
    const p = e.data
    if (!p || p.type !== MESSAGE_TYPE) return
    apply(p)
  }
  window.addEventListener('message', onMessage)
  // Ask for the current posture: the simulator may have sent it before this script ran.
  window.parent.postMessage({ type: 'foldable-sim:ready' }, '*')
  return () => window.removeEventListener('message', onMessage)
}

/**
 * The Viewport Segments API (window.viewport.segments): one segment flat or closed, two either side of a crease.
 * Inside the simulator the simulated device is the truth: this shadows the browser's own (a desktop browser that
 * implements the API reports no segments) with an own property on window.viewport, set only while framed.
 */
function shimSegments(p) {
  const W = window.innerWidth, H = window.innerHeight
  let list = [{ x: 0, y: 0, width: W, height: H }]
  if (p.hinge === 'partial' && p.crease) {
    const c = p.crease
    list = p.fold === 'vertical'
      ? [{ x: 0, y: 0, width: c.x, height: H }, { x: c.x + c.w, y: 0, width: W - c.x - c.w, height: H }]
      : [{ x: 0, y: 0, width: W, height: c.y }, { x: 0, y: c.y + c.h, width: W, height: H - c.y - c.h }]
  }
  if (!window.viewport) Object.defineProperty(window, 'viewport', { value: {}, configurable: true })
  Object.defineProperty(window.viewport, 'segments', { value: list, configurable: true, writable: true })
  // Apps re-read segments on resize, as they would when a real device folds.
  window.dispatchEvent(new Event('resize'))
}

/**
 * @typedef {{ type: string, device: string, hinge: 'closed'|'partial'|'open'|'none'|'unknown', fold: 'none'|'vertical'|'horizontal',
 *   crease: { x: number, y: number, w: number, h: number } | null, touch?: boolean }} Posture
 */
