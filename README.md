# Foldable Sim

Foldable Sim tests your web app's responsive and foldable layouts in any browser: iPhone, iPad and MacBook screens, and the iPhone Duo closed, half open and open, in portrait and landscape. It runs on a device that can actually run your whole app, such as an iPad, a laptop or a desktop.

Foldable phones are new, and the official simulators are limited. For example, the iOS simulator has no WebGPU adapter, so canvas-heavy apps render black there. Foldable Sim instead frames your app at the device's real screen size and tells it the posture the same way the device would. Your app's own fold handling runs unchanged, on hardware that can draw it.

It started as PopCraft's internal harness for the iPhone Duo; [PopCraft](https://popcraft.app) is a design tool. It is MIT licensed.

## Use it

Open the hosted simulator, paste your app's URL, and switch postures with the tabs at the bottom.

**https://getpopcraft.github.io/foldable-sim/**

Or run it locally:

```bash
npx serve .            # then open http://localhost:3000/?url=https://localhost:5173/
```

| Query parameter | Meaning |
|---|---|
| `url` | The app to frame. Without one, the Tailwind example opens. |
| `device` | `iphone-duo`, `iphone-17`, `iphone-17-pro-max`, `ipad-mini`, `ipad-pro-13` or `macbook-air-13` |
| `posture` | `closed`, `half` or `open` (foldables only) |
| `orientation` | `portrait` or `landscape` |
| `prefix` | For same-origin apps: the attribute and variable prefix the app reads (`pc` → `data-pc-hinge`) |

Your app must allow being framed by the simulator's origin: no `X-Frame-Options: DENY`, and a `frame-ancestors` CSP that includes the simulator.

## What your app receives

When it's framed, the page gets the same facts a native shell or browser would report. For example, after the simulator half-opens the device:

```html
<html data-hinge="partial" data-fold="horizontal" data-touch
      style="--fold-x: 0px; --fold-y: 456px; --fold-w: 669px; --fold-h: 40px">
```

| What | Meaning |
|---|---|
| `data-hinge` | `closed`, `partial` (half open), `open`, `none` (no hinge: a phone, tablet or laptop) or `unknown` |
| `data-fold` | `none`, `vertical` (the device is held like a book) or `horizontal` (held like a laptop) |
| `--fold-x/y/w/h` | The crease, in CSS pixels. `0px` when there is none. |
| `data-touch` | Present while the simulated device has a touch screen (every one but the MacBook), even when you test on a laptop. |
| `foldable-posture` event | Fired on `window` after every change, with `{ hinge, fold, crease }` |
| `window.viewport.segments` | The standard [Viewport Segments API](https://developer.mozilla.org/docs/Web/API/Viewport/segments), as the simulated device would report it: one segment when flat or closed, two either side of the crease. It shadows the browser's own while framed. |

### Cross-origin apps: include the client

Postures cross origins by `postMessage`. Add the client to your development build. It does nothing unless the page is framed.

```js
import { installFoldablePosture } from '@popcraft/foldable-sim'   // or ./client/foldable-posture.js

installFoldablePosture()                     // data-hinge, --fold-x, 'foldable-posture'
installFoldablePosture({ prefix: 'pc' })     // data-pc-hinge, --pc-fold-x, 'pc-fold'
installFoldablePosture({ origin: 'https://getpopcraft.github.io', onChange: p => console.log(p) })
```

### Same-origin apps need nothing

If the simulator is served from the same origin as your app (for example, from a route of its dev server), it writes the posture straight onto the framed document. Pass `?prefix=` to match the names your app reads.

## Lay out for it

```css
/* Half open with a horizontal crease: the top pane ends exactly at the hinge. */
html[data-hinge="partial"][data-fold="horizontal"] .app {
  display: grid;
  grid-template-rows: var(--fold-y) var(--fold-h) 1fr;
}
```

## Examples

- **`examples/tailwind/`**: Netrunner Notes, a notes app in Tailwind v4 with a Cyberpunk look and five layouts: a
  phone's list-then-note, list beside note from `sm`, a third outline column from `lg`, and both half-open postures.
  It defines `half:`, `fold-v:`, `fold-h:` and `touch:` variants:

  ```css
  @custom-variant fold-v (&:where([data-hinge="partial"][data-fold="vertical"], [data-hinge="partial"][data-fold="vertical"] *));
  ```
  ```html
  <div class="grid sm:grid-cols-[15rem_1fr] fold-v:grid-cols-[var(--fold-x)_1fr] fold-v:gap-x-[var(--fold-w)]">
  ```
- **`demo/`**: the smallest possible example, in plain CSS.

## Devices

| Device | Screen (closed, for the Duo) | Half open / open |
|---|---|---|
| iPhone Duo | 466 × 678 | 951 × 669 (portrait, crease at x 456–496) · 669 × 951 (landscape, crease at y 456–496) |
| iPhone 17 | 402 × 874 | — |
| iPhone 17 Pro Max | 440 × 956 | — |
| iPad mini | 744 × 1133 | — |
| iPad Pro 13″ | 1032 × 1376 | — |
| MacBook Air 13″ | 1470 × 956 (landscape only, no touch) | — |

The sizes were measured in CSS pixels on the iPhone Duo simulator (Xcode 27.1). You can add a device in `devices.js` with its screen and crease for each posture; pull requests are welcome.

## On a real device

On iOS, a WKWebView app can report the real hinge to the same contract. In iOS 27.1, `UIHingeInteraction` gives the hinge status, and the web view's `.division` reserved region gives the crease. Write them to the page as the attributes and variables above. PopCraft's shell does exactly this, so the layouts you test here run unchanged on the device.

## License

MIT © PopCraft
