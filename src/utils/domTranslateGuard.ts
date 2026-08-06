import { logger } from './logger'

/**
 * Chrome's built-in page translation splices extra <font> wrapper nodes into
 * the DOM outside of React's control. When React later reconciles that same
 * subtree, it can call removeChild/insertBefore with a reference node that
 * Chrome has already relocated, which throws NotFoundError and crashes the
 * whole page. React does not plan to fix this (facebook/react#11538) — the
 * standard workaround is to make these two DOM methods tolerate a stale
 * reference instead of throwing.
 */
export function installDomTranslateGuard(): void {
  if (typeof Node !== 'function' || !Node.prototype) return

  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      logger.warn('domTranslateGuard: skipped removeChild for a node that is not a current child', child)
      return child
    }
    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      logger.warn('domTranslateGuard: skipped insertBefore for a stale reference node', referenceNode)
      return newNode
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T
  }
}
