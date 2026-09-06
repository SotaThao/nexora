import type { CheckInPalette } from './checkInPrintCatalog'
import type { PrintNode, TemplateId } from './checkInPrintTypes'

/** Artwork uses a normalized canvas so all curves remain vector geometry in both adapters. */
export function createCheckInPrintDecoration(template: TemplateId, width: number, height: number, palette: CheckInPalette): PrintNode[] {
  const nodes: PrintNode[] = []
  const path = (outline: string, fill: string) => {
    let coordinate = 0
    const d = outline.replace(/-?\d*\.?\d+/g, value => String(Number(value) * (coordinate++ % 2 === 0 ? width : height) / 100))
    nodes.push({ kind: 'path', d, fill, x: 0, y: 0 })
  }
  const gold = palette.id === 'ink' ? '#83939d' : '#b89350'
  const lightGold = palette.id === 'ink' ? '#d9e0e3' : '#ead7a5'
  const deepGold = palette.id === 'ink' ? '#657782' : '#88632d'
  if (template === 'classic-gold') {
    // Quiet marble veins: a few unequal curves, never a tiled or raster background.
    path('M 0 35 C 15 23 18 34 35 22 C 53 10 62 19 83 3 L 84 3 C 62 20 53 11 36 23 C 18 36 15 24 0 36 Z', '#efede7')
    path('M 100 50 C 83 67 81 53 68 73 C 58 88 39 83 30 100 L 29 100 C 38 82 57 87 67 72 C 81 52 83 65 100 49 Z', '#ebe9e3')
    path('M 8 100 C 22 84 13 75 27 62 C 33 57 30 49 46 43 L 46.2 43.3 C 31 50 34 58 28 63 C 14 76 23 85 8.4 100 Z', '#f0eee8')
    path('M 0 0 L 46 0 C 20 3 9 9 0 27 Z', deepGold)
    path('M 0 0 L 40 0 C 18 4 7 11 0 29 L 0 20 C 8 7 18 3 29 0 Z', gold)
    path('M 0 14 C 8 5 17 2 33 0 L 39 0 C 19 3 8 7 0 20 Z', lightGold)
    path('M 0 29 C 7 13 14 8 26 5 C 13 10 6 17 0 32 Z', gold)
    path('M 100 100 L 54 100 C 80 97 91 91 100 73 Z', deepGold)
    path('M 100 100 L 60 100 C 82 96 93 89 100 71 L 100 80 C 92 93 82 97 71 100 Z', gold)
    path('M 100 86 C 92 95 83 98 67 100 L 61 100 C 81 97 92 93 100 80 Z', lightGold)
    path('M 100 71 C 93 87 86 92 74 95 C 87 90 94 83 100 68 Z', gold)
  }
  if (template === 'modern-navy') {
    const wave = palette.id === 'forest' ? '#20483b' : '#1b3454'
    const shadow = palette.id === 'forest' ? '#102b23' : '#0c192f'
    path('M 0 0 L 75 0 C 44 3 16 9 0 31 Z', shadow)
    path('M 0 0 L 60 0 C 24 5 10 13 0 31 L 0 23 C 9 11 22 4 42 0 Z', wave)
    path('M 0 17 C 13 5 32 1 55 0 L 70 0 C 35 2 13 9 0 22 Z', gold)
    path('M 0 17 C 13 5 32 1 55 0 L 61 0 C 33 2 13 7 0 19 Z', lightGold)
    path('M 0 26 C 9 15 14 12 26 8 C 13 14 7 20 0 29 Z', deepGold)
    path('M 100 100 L 25 100 C 56 97 84 91 100 69 Z', shadow)
    path('M 100 100 L 40 100 C 76 95 90 87 100 69 L 100 77 C 91 89 78 96 58 100 Z', wave)
    path('M 100 83 C 87 95 68 99 45 100 L 30 100 C 65 98 87 91 100 78 Z', gold)
    path('M 100 83 C 87 95 68 99 45 100 L 39 100 C 67 98 87 93 100 81 Z', lightGold)
    path('M 100 74 C 91 85 86 88 74 92 C 87 86 93 80 100 71 Z', deepGold)
  }
  if (template === 'minimal-clean') {
    path('M 0 0 L 29 0 C 15 5 12 15 0 21 Z', '#f0f4ee')
    path('M 100 100 L 71 100 C 85 95 88 85 100 79 Z', '#f0f4ee')
    const botanical = (mirror: boolean) => {
      const leaf = (d: string, fill: string) => {
        if (!mirror) { path(d, fill); return }
        path(d.replace(/-?\d*\.?\d+/g, v => String(100 - Number(v))), fill)
      }
      leaf('M 0 23 C 5 16 9 9 15 0 L 15.35 0 C 9.4 9.3 5.3 16.3 0 23.5 Z', '#8ca899')
      leaf('M 5 16 C 0 13 1 8 1 6 C 7 9 8 12 5 16 Z', '#becfc0')
      leaf('M 5 16 C 10 16 14 13 15 10 C 9 10 6 12 5 16 Z', '#a1baac')
      leaf('M 10 8 C 5 6 6 2 6 0 C 11 2 12 5 10 8 Z', '#a1baac')
      leaf('M 10 8 C 16 8 20 5 20 2 C 14 2 11 4 10 8 Z', '#c4d3c5')
      leaf('M 1 22 C 6 22 10 20 11 17 C 6 17 3 19 1 22 Z', '#cedbd0')
    }
    botanical(false); botanical(true)
  }
  if (template === 'wide-counter') {
    const dark = palette.id === 'navy'
    path('M 51 0 L 100 0 L 100 100 L 51 100 Z', dark ? '#0b192d' : '#f1f3f0')
    path('M 51 0 C 60 18 46 40 53 59 C 59 78 50 94 46 100 L 47 100 C 54 91 60 78 54 59 C 47 40 61 18 52 0 Z', gold)
    path('M 100 0 L 69 0 C 82 3 93 9 100 22 Z', gold)
    path('M 100 0 L 77 0 C 88 4 95 10 100 17 L 100 13 C 95 6 90 3 84 0 Z', lightGold)
    path('M 0 100 L 34 100 C 19 98 7 92 0 83 Z', deepGold)
    path('M 0 92 C 8 98 19 100 30 100 L 38 100 C 19 98 7 93 0 86 Z', gold)
    path('M 0 92 C 8 98 19 100 30 100 L 34 100 C 18 98 7 94 0 90 Z', lightGold)
  }
  return nodes
}
