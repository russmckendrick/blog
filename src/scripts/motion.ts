import { animate } from 'motion/mini'
import { inView } from 'motion'

const EASE_SETTLE: [number, number, number, number] = [0.22, 0.61, 0.36, 1]

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* Page-load entrance ([data-entrance]) and hero settle ([data-settle]) are
   pure CSS animations in global.css: they must start at first paint, not
   after this chunk loads, or the hero sits invisible and LCP slips. */

/* astro:page-load also fires on the initial load, so every init below
   claims its elements with a data flag to avoid animating twice. */
const claim = (el: HTMLElement) => {
  if (el.dataset.motionClaimed === 'true') return false
  el.dataset.motionClaimed = 'true'
  return true
}

/**
 * Scroll reveals: entries fade up once as they enter the viewport;
 * rule lines ([data-reveal="rule"]) draw in horizontally.
 * Replaces the old .reveal/.revealed IntersectionObserver system.
 */
export function initInViewReveals(root: ParentNode = document) {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]')).filter(claim)
  if (!elements.length) return
  if (prefersReducedMotion()) {
    elements.forEach((el) => {
      el.style.opacity = '1'
      el.style.transform = 'none'
    })
    return
  }
  for (const el of elements) {
    const isRule = el.dataset.reveal === 'rule'
    el.style.opacity = '0'
    if (isRule) {
      el.style.transform = 'scaleX(0)'
      el.style.transformOrigin = 'left center'
    } else {
      el.style.transform = 'translateY(14px)'
    }
    inView(
      el,
      (target) => {
        animate(
          target,
          isRule
            ? { opacity: [0, 1], transform: ['scaleX(0)', 'scaleX(1)'] }
            : { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0)'] },
          { duration: isRule ? 0.7 : 0.55, ease: EASE_SETTLE }
        )
      },
      { amount: 0.15 }
    )
  }
}

/** Run everything for a freshly loaded (or client-side navigated) page. */
export function initPageMotion() {
  initInViewReveals()
}
