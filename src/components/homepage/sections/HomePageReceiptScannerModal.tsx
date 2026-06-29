/** Homepage section component */
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'

export default function HomePageReceiptScannerModal() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()

  return (
    <>
      <div id="receipt-scan-modal" role="dialog" aria-modal="true">
          <div className="scan-card">
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: '900', color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0' }}>📷 Receipt Scanner</p>
                
              </div>
              <button type="button" onClick={() => { hp.closeReceiptScanModal() }} style={{ width: '28px', height: '28px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#1e293b', color: '#64748b', border: '1px solid #334155', cursor: 'pointer', flexShrink: '0' }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              </button>
            </div>
      
            
            <div id="scan-state-upload">
              <div style={{ border: '2px dashed #334155', borderRadius: '14px', padding: '22px 16px', textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🧾</div>
                <p style={{ fontSize: '10px', color: '#e2e8f0', fontWeight: '800', margin: '0 0 4px' }}>Take a photo or upload a receipt</p>
                <p style={{ fontSize: '8px', color: '#475569', margin: '0' }}>JPG, PNG — any nail salon expense receipt</p>
              </div>
              <input type="file" id="receipt-file-input" accept="image/*" style={{ display: 'none' }} onChange={(e) => hp.handleReceiptFile(e.currentTarget)} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => { hp.triggerReceiptCapture() }} style={{ flex: '1', height: '40px', minHeight: '40px', background: 'linear-gradient(135deg,#00a76f,#059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>📷 Camera</button>
                <button type="button" onClick={() => { hp.triggerReceiptUpload() }} style={{ flex: '1', height: '40px', minHeight: '40px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '12px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>📁 Upload File</button>
              </div>
              <p style={{ fontSize: '7px', color: '#334155', textAlign: 'center', margin: '8px 0 0' }}>OCR runs locally in your browser — no data is sent to any server</p>
            </div>
      
            
            <div id="scan-state-processing" style={{ display: 'none' }}>
              <img id="scan-preview-img" src="" alt="Receipt" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px', border: '1px solid #1e293b' }} />
              <p id="scan-ocr-status" style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', margin: '0 0 6px' }}>Analyzing receipt…</p>
              <div style={{ background: '#1e293b', borderRadius: '9999px', height: '4px', overflow: 'hidden' }}>
                <div id="scan-ocr-bar" style={{ width: '0%', height: '100%', background: 'linear-gradient(90deg,#00a76f,#6c4df6)', borderRadius: '9999px', transition: 'width 0.4s ease' }}></div>
              </div>
              <p style={{ fontSize: '7px', color: '#334155', textAlign: 'center', margin: '8px 0 0' }}>This may take 5–15 seconds on first run</p>
            </div>
      
            
            <div id="scan-state-results" style={{ display: 'none' }}>
              <p style={{ fontSize: '8px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Detected Deductions</p>
              <div id="scan-results-list" style={{ marginBottom: '10px' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#0f172a', borderRadius: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '8px', color: '#475569', fontWeight: '700' }}>Total on receipt</span>
                <span id="scan-results-total" style={{ fontSize: '10px', color: '#00a76f', fontWeight: '900' }}></span>
              </div>
              <details style={{ marginBottom: '12px' }}>
                <summary style={{ fontSize: '8px', color: '#334155', cursor: 'pointer' }}>Show raw OCR text ▾</summary>
                <pre id="scan-raw-text" style={{ fontSize: '7px', color: '#475569', background: '#0f172a', padding: '8px', borderRadius: '6px', whiteSpace: 'pre-wrap', margin: '6px 0 0', maxHeight: '80px', overflowY: 'auto', fontFamily: 'monospace' }}></pre>
              </details>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => { hp.closeReceiptScanModal() }} style={{ flex: '1', height: '38px', minHeight: '38px', background: '#1e293b', color: '#64748b', border: '1px solid #334155', borderRadius: '12px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="button" onClick={() => { hp.applyScannedDeductions() }} style={{ flex: '2', height: '38px', minHeight: '38px', background: 'linear-gradient(135deg,#00a76f,#059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>✓ Apply Deductions</button>
              </div>
            </div>
          </div>
        </div>
    </>
  )
}
