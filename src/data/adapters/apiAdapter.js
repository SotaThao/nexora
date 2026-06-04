/**
 * apiAdapter — stub for the upcoming real-API phase.
 *
 * Every method throws NotImplemented so any accidental call in the current
 * phase surfaces immediately rather than silently returning wrong data.
 * Replace this file (or provide a real implementation) when VITE_DATA_SOURCE=api.
 */

const notImplemented = (method) => {
  throw new Error(
    `NotImplemented: apiAdapter.${method} — wired in the API phase`
  )
}

export const apiAdapter = {
  async get(_key) {
    notImplemented('get')
  },
  async set(_key, _value) {
    notImplemented('set')
  },
  async remove(_key) {
    notImplemented('remove')
  },
}
