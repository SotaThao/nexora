/** Smooth-scroll a DOM element into view by id, deferred a frame so layout has settled. */
export function scrollToElementById(id: string) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}
