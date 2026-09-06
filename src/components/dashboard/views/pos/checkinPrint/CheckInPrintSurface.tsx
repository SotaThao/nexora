import { createPortal } from 'react-dom'
import { CheckInPrintPreview } from './CheckInPrintPreview'
import type { CheckInPrintJob } from './useCheckInTemplatePrint'

export function CheckInPrintSurface({ job }: { job: CheckInPrintJob | null }) {
  if (!job || typeof document === 'undefined') return null
  const pageName = `checkin-letter-${job.landscape ? 'landscape' : 'portrait'}`
  return createPortal(<div className="pos-checkin-qr-print" aria-hidden="true" style={{ page: pageName, width: `${job.widthPt}pt`, height: `${job.heightPt}pt` }}>
    {/* Chromium can let a later stylesheet's generic @page override an earlier named rule.
        Keep this job's rule after the application styles and remove it with the portal. */}
    <style>{`@media print { @page ${pageName} { size: ${job.widthPt}pt ${job.heightPt}pt; margin: 0; } }`}</style>
    <div style={{ width: `${job.document.widthPt}pt`, height: `${job.document.heightPt}pt`, flexShrink: 0 }}><CheckInPrintPreview document={job.document} assets={job.assets} /></div>
  </div>, document.body)
}
