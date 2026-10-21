// The devices the simulator frames, in CSS px, measured on the platform's own simulator.
//
// Each posture lists its screen for both orientations. `crease` is the hinge's division region (where a half-open
// device bends) in the screen's coordinates, as the OS reports it to a page. A device without a hinge has only `open`.
//
// A device without a hinge (a phone, a tablet, a laptop) has one posture, `flat`, and reports hinge `none`; a laptop
// has only `landscape`. Sizes are the browser viewport (the screen less the status bar's space is the page's to deal
// with, as with viewport-fit=cover); a laptop's is its default scaled resolution, without the browser's toolbar.
//
// iPhone Duo: Xcode 27.1's iPhone Duo simulator. Closed is the outer screen; unfolded, "portrait" is wider than tall
// (held like a book) and "landscape" is taller than wide (held like a laptop).

export const DEVICES = {
  'iphone-duo': {
    name: 'iPhone Duo',
    radius: 34,
    postures: {
      closed: {
        portrait: { w: 466, h: 678 },
        landscape: { w: 678, h: 466 },
      },
      half: {
        portrait: { w: 951, h: 669, fold: 'vertical', crease: { x: 456, y: 0, w: 40, h: 669 } },
        landscape: { w: 669, h: 951, fold: 'horizontal', crease: { x: 0, y: 456, w: 669, h: 40 } },
      },
      open: {
        portrait: { w: 951, h: 669 },
        landscape: { w: 669, h: 951 },
      },
    },
  },
  'iphone-17': flat('iPhone 17', 402, 874, 48),
  'iphone-17-pro-max': flat('iPhone 17 Pro Max', 440, 956, 52),
  'ipad-mini': flat('iPad mini', 744, 1133, 22),
  'ipad-pro-13': flat('iPad Pro 13″', 1032, 1376, 20),
  'macbook-air-13': { ...flat('MacBook Air 13″', 1470, 956, 10, false), laptop: true },
}

/** A phone or tablet without a hinge: one posture, both orientations. A laptop keeps only landscape. */
function flat(name, w, h, radius, touch = true) {
  const portrait = touch ? { w, h } : null
  const landscape = touch ? { w: h, h: w } : { w, h }
  return { name, radius, touch, postures: { flat: { ...(portrait && { portrait }), landscape } } }
}

/** The postures a device has, in order: closed / half / open for a foldable, flat for anything else. */
export const posturesOf = deviceId => Object.keys((DEVICES[deviceId] ?? DEVICES['iphone-duo']).postures)

/** The orientations a device has in a posture. */
export const orientationsOf = (deviceId, posture) =>
  Object.keys((DEVICES[deviceId] ?? DEVICES['iphone-duo']).postures[posture] ?? {})

/** The posture's screen, with what a page is told about it. */
export function screenFor(deviceId, posture, orientation) {
  const device = DEVICES[deviceId] ?? DEVICES['iphone-duo']
  const set = device.postures[posture] ?? Object.values(device.postures).at(-1)
  const s = set[orientation] ?? Object.values(set)[0]
  const hinge = posture === 'flat' ? 'none' : posture === 'closed' ? 'closed' : posture === 'half' ? 'partial' : 'open'
  return {
    w: s.w, h: s.h, hinge, fold: s.fold ?? 'none', crease: s.crease ?? null, radius: device.radius,
    touch: device.touch !== false, laptop: !!device.laptop,
  }
}
