const GSM7_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
const GSM7_EXT = '^{}\\[~]|€'

export interface SmsCharInfo {
  units: number
  parts: number
  encoding: 'GSM-7' | 'UCS-2'
  perPart: number
}

/** GSM-7 vs UCS-2 SMS segment counting (matches HTML reference). */
export function getSmsCharInfo(text: string): SmsCharInfo {
  if (!text) return { units: 0, parts: 0, encoding: 'GSM-7', perPart: 160 }

  let isUnicode = false
  let gsmUnits = 0
  for (const ch of text) {
    if (GSM7_BASIC.includes(ch)) gsmUnits += 1
    else if (GSM7_EXT.includes(ch)) gsmUnits += 2
    else {
      isUnicode = true
      break
    }
  }

  if (isUnicode) {
    const units = text.length
    const parts = units <= 70 ? 1 : Math.ceil(units / 67)
    return { units, parts, encoding: 'UCS-2', perPart: units <= 70 ? 70 : 67 }
  }

  const parts = gsmUnits <= 160 ? 1 : Math.ceil(gsmUnits / 153)
  return {
    units: gsmUnits,
    parts,
    encoding: 'GSM-7',
    perPart: gsmUnits <= 160 ? 160 : 153,
  }
}
