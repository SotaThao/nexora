import type { PosTechnicianReportPrint } from '../../../../../types/domain'

/** Resolved text only, shared by preview, browser printing and PassPRNT serialization. */
export default function PosTechnicianReportPrintDocument({ report, fontSize = 12 }: {
  report: PosTechnicianReportPrint
  fontSize?: number
}) {
  const grid = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: '0.75em' }
  const pair = { display: 'flex', justifyContent: 'space-between', gap: '0.75em' }
  return <div style={{ fontFamily: 'Arial, sans-serif', fontSize, lineHeight: 1.5, color: '#000', overflowWrap: 'anywhere' }}>
    <div style={{ textAlign: 'center', borderBottom: '1px dashed #777', paddingBottom: '1em', marginBottom: '1em' }}>
      <h3 style={{ fontSize: '1.33em', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>{report.name}</h3>
      <p style={{ margin: 0, fontWeight: 600 }}>{report.heading}</p>
      <p style={{ margin: 0, fontWeight: 700 }}>{report.period}</p>
    </div>
    <div style={{ ...grid, fontWeight: 900, textTransform: 'uppercase', borderBottom: '1px dashed #777' }}>
      {report.columns.map((label, index) => <span key={index} style={{ textAlign: index ? 'right' : 'left' }}>{label}</span>)}
    </div>
    {report.entries.length ? report.entries.map((entry, index) => <section key={entry.id} style={{ padding: '0.65em 0', borderBottom: index < report.entries.length - 1 ? '1px dashed #aaa' : undefined }}>
      <div style={{ ...grid, fontWeight: 700 }}><span>{entry.label}</span><span>{entry.amount}</span><span>{entry.tips}</span></div>
      {entry.time ? <p style={{ margin: '0.3em 0', fontWeight: 700 }}>{entry.time}</p> : null}
      {entry.services?.map((service, index) => <div key={index}>{service}</div>)}
      {entry.discount ? <div style={{ ...pair, marginTop: '0.3em' }}><span>-- {entry.discount.label}</span><strong>{entry.discount.value}</strong></div> : null}
    </section>) : <p style={{ textAlign: 'center', padding: '1em 0' }}>{report.emptyLabel}</p>}
    <div style={{ borderTop: '1px dashed #777', marginTop: '1em', paddingTop: '0.65em' }}>
      {report.totals.map((total, index) => <div key={index} style={{ ...pair, padding: '0.15em 0', fontWeight: index === 0 ? 900 : 400 }}>
        <span>{total.label}</span><strong>{total.value}</strong>
      </div>)}
    </div>
  </div>
}
