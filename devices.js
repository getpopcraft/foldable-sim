// The devices the simulator frames, in CSS px, measured on the platform's own simulator.
//
// Each posture lists its screen for both orientations. `crease` is the hinge's division region (where a half-open
// device bends) in the screen's coordinates, as the OS reports it to a page. A device without a hinge has only `open`.
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
}

/** The posture's screen, with what a page is told about it. */
export function screenFor(deviceId, posture, orientation) {
  const device = DEVICES[deviceId] ?? DEVICES['iphone-duo']
  const s = (device.postures[posture] ?? device.postures.open)[orientation]
  const hinge = posture === 'closed' ? 'closed' : posture === 'half' ? 'partial' : 'open'
  return { w: s.w, h: s.h, hinge, fold: s.fold ?? 'none', crease: s.crease ?? null, radius: device.radius }
}
