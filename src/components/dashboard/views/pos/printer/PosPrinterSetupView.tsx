/**
 * POS > Printer. Its own sidebar entry rather than another card on the POS settings page, because
 * everything here describes *this iPad* — the printer it talks to and how many copies it puts out.
 * Filing it under business settings would invite "I set it on the office laptop, why is the front
 * desk not printing".
 */
import { useCallback } from 'react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import PosPassPrntCard from './PosPassPrntCard'
import PosReceiptSettingsCard from './PosReceiptSettingsCard'
import { usePosReceiptPrint } from '../receipt/usePosReceiptPrint'
import { usePassPrntReturn } from '../receipt/usePassPrntReturn'
import { buildPosReceiptSampleDocument } from '../receipt/posReceiptSample'
import {
  resolvePosReceiptLabels,
  resolvePosReceiptTotalsLabels,
} from '../receipt/posReceiptLabels'
import { POS_PRINTER_I18N_PREFIX as K } from '../../../../../constants/posPrinter'
import { formatPosDateTime } from '../posDateTime'

export const POS_PRINTER_ROUTE_PATH = '/dashboard/pos/printer'

export default function PosPrinterSetupView({
  businessName,
  businessAddress,
  businessPhone,
}: {
  businessName?: string
  businessAddress?: string
  businessPhone?: string
}) {
  const { t, currentLanguage } = useTranslation()
  const { print, isPrinting, printSurface } = usePosReceiptPrint()

  // A test print leaves for PassPRNT and comes back here, so this screen hosts the return leg.
  usePassPrntReturn({ surface: 'printerSetup', backPath: POS_PRINTER_ROUTE_PATH })

  const handleTestPrint = useCallback(() => {
    const totals = resolvePosReceiptTotalsLabels(t)
    const sample = buildPosReceiptSampleDocument({
      business: { name: businessName, address: businessAddress, phone: businessPhone },
      labels: resolvePosReceiptLabels(t),
      totalsLabels: {
        subtotal: totals.subtotal,
        salesTax: totals.salesTax,
        tip: totals.tip,
        total: totals.total,
      },
      completedAtLabel: formatPosDateTime(new Date().toISOString(), currentLanguage),
      technicianLabel: t(
        'components.dashboard.views.pos.PosOrderWorkspace.firstAvailableLabel',
      ),
      serviceLabel: t('components.dashboard.views.pos.PosOrderWorkspace.summaryItem'),
      sampleCustomerName: t(`${K}.step3Title`),
    })

    print(sample, {
      jobId: `test-${Date.now()}`,
      copies: 1,
      restore: { surface: 'printerSetup' },
      backPath: POS_PRINTER_ROUTE_PATH,
      kind: 'testPrint',
    })
  }, [print, t, currentLanguage, businessName, businessAddress, businessPhone])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold leading-tight text-nexoraText">{t(`${K}.title`)}</h1>
        <p className="mt-1 text-sm font-medium text-nexoraMuted">{t(`${K}.description`)}</p>
        <p className="mt-1 text-[11px] text-nexoraMuted">{t(`${K}.deviceScopeNote`)}</p>
      </div>

      <PosPassPrntCard onTestPrint={handleTestPrint} isPrinting={isPrinting} />
      <PosReceiptSettingsCard />
      {printSurface}
    </div>
  )
}
