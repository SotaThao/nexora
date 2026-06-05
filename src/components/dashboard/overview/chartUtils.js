import { useState, useEffect, useRef } from 'react'

export const TIP_SERIES_BY_RANGE = {
  '7 Days': [
    { label: 'Mon', value: 1200 },
    { label: 'Tue', value: 1900 },
    { label: 'Wed', value: 3000 },
    { label: 'Thu', value: 2500 },
    { label: 'Fri', value: 3800 },
    { label: 'Sat', value: 4200 },
    { label: 'Sun', value: 3500 }
  ],
  '30 Days': [
    { label: 'Week 1', value: 8200 },
    { label: 'Week 2', value: 10450 },
    { label: 'Week 3', value: 9800 },
    { label: 'Week 4', value: 12650 },
    { label: 'Today', value: 14200 }
  ],
  '90 Days': [
    { label: 'Jan', value: 24600 },
    { label: 'Feb', value: 28100 },
    { label: 'Mar', value: 26300 },
    { label: 'Apr', value: 31800 },
    { label: 'May', value: 35400 }
  ],
  '180 Days': [
    { label: 'Dec', value: 42600 },
    { label: 'Jan', value: 48100 },
    { label: 'Feb', value: 53600 },
    { label: 'Mar', value: 51200 },
    { label: 'Apr', value: 60400 },
    { label: 'May', value: 68800 }
  ],
  '365 Days': [
    { label: 'Q2 2025', value: 84000 },
    { label: 'Q3 2025', value: 97500 },
    { label: 'Q4 2025', value: 112800 },
    { label: 'Q1 2026', value: 128400 },
    { label: 'Q2 2026', value: 147600 }
  ]
}

export function buildChartPoints(series) {
  const width = 680
  const height = 265
  if (!series || series.length === 0) {
    return { points: [], max: 0, width, height }
  }
  const maxValue = Math.max(...series.map((item) => item.value))
  const max = maxValue === 0 ? 1000 : Math.ceil(maxValue / 1000) * 1000
  const points = series.map((item, index) => ({
    ...item,
    x: series.length === 1 ? width / 2 : (index / (series.length - 1)) * width,
      y: height - (item.value / max) * height
  }))
  return { points, max, width, height }
}

export function getBezierPath(points) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const cp1x = p0.x + (p1.x - p0.x) / 3
    const cp1y = p0.y
    const cp2x = p0.x + 2 * (p1.x - p0.x) / 3
    const cp2y = p1.y
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`
  }
  return d
}

export function useTransitionedPoints(targetPoints, range, duration = 650) {
  const [currentPoints, setCurrentPoints] = useState(targetPoints)
  const currentPointsRef = useRef(currentPoints)

  useEffect(() => {
    currentPointsRef.current = currentPoints
  }, [currentPoints])

  useEffect(() => {
    const prevPoints = currentPointsRef.current

    let equal = prevPoints.length === targetPoints.length
    if (equal) {
      for (let i = 0; i < targetPoints.length; i++) {
        if (prevPoints[i].x !== targetPoints[i].x || prevPoints[i].y !== targetPoints[i].y || prevPoints[i].value !== targetPoints[i].value) {
          equal = false
          break
        }
      }
    }
    if (equal) return

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setCurrentPoints(targetPoints)
      return undefined
    }

    const interpolatePoint = (points, t) => {
      if (points.length === 0) return { x: 0, y: 0, value: 0, label: '' }
      if (points.length === 1) return points[0]
      const index = t * (points.length - 1)
      const low = Math.floor(index)
      const high = Math.min(points.length - 1, Math.ceil(index))
      if (low === high) return points[low]
      const ratio = index - low
      const p1 = points[low]
      const p2 = points[high]
      return {
        x: p1.x + (p2.x - p1.x) * ratio,
        y: p1.y + (p2.y - p1.y) * ratio,
        value: p1.value + (p2.value - p1.value) * ratio,
        label: ratio > 0.5 ? p2.label : p1.label
      }
    }

    const startPoints = targetPoints.map((_, i) => {
      const t = targetPoints.length > 1 ? i / (targetPoints.length - 1) : 0.5
      return interpolatePoint(prevPoints, t)
    })

    let frameId
    const startTime = performance.now()

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

      const nextPoints = targetPoints.map((target, i) => {
        const start = startPoints[i]
        return {
          ...target,
          x: start.x + (target.x - start.x) * eased,
          y: start.y + (target.y - start.y) * eased,
          value: start.value + (target.value - start.value) * eased
        }
      })

      setCurrentPoints(nextPoints)

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [targetPoints, range, duration])

  return currentPoints
}
