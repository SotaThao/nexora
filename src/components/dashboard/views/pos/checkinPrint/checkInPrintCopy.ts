import en from '../../../../../locales/en.json'
import vi from '../../../../../locales/vi.json'
import type { PrintLanguage } from './checkInPrintTypes'
interface PrintCopy { headline: string; closingText: string; instructions: string[]; hoursLabel: string }
export function getCheckInPrintCopy(language: PrintLanguage): PrintCopy {
  const english = (en as unknown as {checkInPrint:{printCopy:PrintCopy}}).checkInPrint.printCopy
  const vietnamese = (vi as unknown as {checkInPrint:{printCopy:PrintCopy}}).checkInPrint.printCopy
  if (language === 'en') return english
  if (language === 'vi') return vietnamese
  return { headline: `${english.headline}\n${vietnamese.headline}`, closingText: `${english.closingText}\n${vietnamese.closingText}`, hoursLabel: `${english.hoursLabel} / ${vietnamese.hoursLabel}`, instructions: english.instructions.map((text, i) => `${text} / ${vietnamese.instructions[i]}`) }
}
