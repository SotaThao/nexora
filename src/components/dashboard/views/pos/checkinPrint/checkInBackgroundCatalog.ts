import type { CheckInBackgroundTemplate } from './useCheckInBackgroundPrint'

/** Interior QR areas measured on the supplied 2550 × 3300 Letter artwork. */
function artwork(id: string, x: number, y: number, width: number, height: number, brandingColor: string, brandingFont: CheckInBackgroundTemplate['brandingFont']): CheckInBackgroundTemplate {
  return {
    id,
    imageUrl: `${import.meta.env.BASE_URL}images/checkin-templates/${id}.jpg`,
    brandingColor, brandingFont,
    brandingArea: id === 'modern-dark-glow'
      ? { x: .2, y: .05, width: .6, height: .095 }
      : { x: .2, y: .07, width: .6, height: .105 },
    qrBox: { x: x / 2550, y: y / 3300, width: width / 2550, height: height / 3300 },
  }
}
export const CHECK_IN_BACKGROUNDS: CheckInBackgroundTemplate[] = [
  artwork('modern-minimal-light', 806, 1153, 944, 865, '#8b652d', 'heading'),
  artwork('dark-luxury', 848, 1108, 852, 839, '#f0d77f', 'heading'),
  artwork('elegant-floral', 845, 1206, 862, 847, '#a05256', 'heading'),
  artwork('modern-dark-glow', 851, 1072, 875, 861, '#cdf8fc', 'body'),
  artwork('clean-friendly', 847, 1192, 878, 849, '#12477b', 'heading'),
  artwork('premium-portrait', 842, 1157, 872, 817, '#8b652d', 'heading'),
  artwork('minimal-line-art', 873, 1117, 809, 790, '#27352e', 'body'),
  artwork('bold-vivid', 845, 1130, 910, 933, '#edcf79', 'heading'),
]
