'use client';
import { useState, useMemo } from 'react';

const STAFF_MEMBERS = [
  { id: 1, name: 'David L.', role: 'Nail Technician', avatar: 'D', color: 'c1' },
  { id: 2, name: 'Sunny K.', role: 'Senior Gel Specialist', avatar: 'S', color: 'c2' },
  { id: 3, name: 'Jenny T.', role: 'Senior Nail Technician', avatar: 'J', color: 'c3' },
  { id: 4, name: 'Kevin V.', role: 'Acrylic & Gel Specialist', avatar: 'K', color: 'c4' },
  { id: 5, name: 'Mary S.', role: 'Nail Technician', avatar: 'M', color: 'c5' },
  { id: 6, name: 'Lisa N.', role: 'Gel & Extensions', avatar: 'L', color: 'c6' }
];

const QUICK_TIPS_COMBINE = [10, 20, 30, 40];
const QUICK_TIPS_SPLIT = [5, 10, 15, 20];

export default function TipAndReview() {
  const [activeScreen, setActiveScreen] = useState(1);
  const [scenario, setScenario] = useState('1'); // '1', '2', '3', '4'

  // State
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [tipMode, setTipMode] = useState('combine'); // 'combine', 'split'
  const [combineTip, setCombineTip] = useState(0);
  const [customCombineTip, setCustomCombineTip] = useState('');
  
  const [splitTips, setSplitTips] = useState({});
  const [customSplitTips, setCustomSplitTips] = useState({});
  
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rating, setRating] = useState(0);

  // Logic functions
  const selectScenario = (s) => {
    setScenario(s);
    setActiveScreen(s === '2' ? 1 : 2); // Scenario 2 starts at screen 1
    
    // Reset state
    setCombineTip(0);
    setCustomCombineTip('');
    setSplitTips({});
    setCustomSplitTips({});
    setSelectedPayment(null);
    setRating(0);

    // Set staff based on scenario
    if (s === '1') {
      setSelectedStaff([STAFF_MEMBERS[0]]); // Only David
    } else if (s === '2') {
      setSelectedStaff([]); // Start empty
    } else if (s === '3') {
      setSelectedStaff([STAFF_MEMBERS[0], STAFF_MEMBERS[1]]); // David, Sunny
      setTipMode('combine');
    } else if (s === '4') {
      setSelectedStaff([STAFF_MEMBERS[0], STAFF_MEMBERS[1]]); // David, Sunny
      setTipMode('split');
    }
  };

  const toggleStaff = (id) => {
    if (scenario === '2') {
      setSelectedStaff([STAFF_MEMBERS.find(m => m.id === id)]);
    } else {
      const isSelected = selectedStaff.some(s => s.id === id);
      if (isSelected) {
        setSelectedStaff(selectedStaff.filter(s => s.id !== id));
      } else {
        setSelectedStaff([...selectedStaff, STAFF_MEMBERS.find(m => m.id === id)]);
      }
    }
  };

  const isStaffSelected = (id) => selectedStaff.some(s => s.id === id);

  const setSplitTip = (staffId, val) => {
    setSplitTips(prev => ({ ...prev, [staffId]: val }));
    setCustomSplitTips(prev => ({ ...prev, [staffId]: '' }));
  };

  const handleCustomSplit = (staffId, val) => {
    setSplitTips(prev => ({ ...prev, [staffId]: 0 }));
    setCustomSplitTips(prev => ({ ...prev, [staffId]: val }));
  };

  const handleCustomCombine = (val) => {
    setCombineTip(0);
    setCustomCombineTip(val);
  };

  const totalSplit = useMemo(() => {
    return selectedStaff.reduce((sum, s) => {
      const predefined = splitTips[s.id] || 0;
      const custom = parseFloat(customSplitTips[s.id]) || 0;
      return sum + predefined + custom;
    }, 0);
  }, [selectedStaff, splitTips, customSplitTips]);

  const totalCombine = customCombineTip !== '' ? parseFloat(customCombineTip) || 0 : combineTip;
  const perPerson = selectedStaff.length > 0 ? (totalCombine / selectedStaff.length).toFixed(2) : 0;

  const isScreen1Valid = selectedStaff.length > 0;
  const isScreen2Valid = (tipMode === 'combine' && totalCombine > 0 && selectedPayment) || 
                         (tipMode === 'split' && totalSplit > 0 && selectedPayment);
  const isScreen3Valid = rating > 0;

  return (
    <>
      <div className="sidebar">
        <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Nexora Flow</h2>
        <div className={`menu-item ${scenario === '1' ? 'active' : ''}`} onClick={() => selectScenario('1')}>1. Quét Staff QR: 1 thợ</div>
        <div className={`menu-item ${scenario === '2' ? 'active' : ''}`} onClick={() => selectScenario('2')}>2. Quét Business QR: Quét 1 thợ</div>
        <div className={`menu-item ${scenario === '3' ? 'active' : ''}`} onClick={() => selectScenario('3')}>3. Quét Business QR: Chọn 2 thợ (Chia đều)</div>
        <div className={`menu-item ${scenario === '4' ? 'active' : ''}`} onClick={() => selectScenario('4')}>4. Quét Business QR: Chọn 2 thợ (Tip riêng)</div>
      </div>

      <div className="preview-area">
        <div className="mobile-container">
          <div className="header">
            <div className="header-brand">
              <div className="header-logo-icon">N</div>
              NEXORA <span>TOUCH</span>
            </div>
            <div className="header-title">Tip & Review</div>
          </div>

          {/* SCREEN 1: Staff Selection */}
          <div className={`screen ${activeScreen === 1 ? 'active' : ''}`}>
            <div className="content">
              <h2 className="page-title">WHO SERVED YOU TODAY?</h2>
              <p className="page-subtitle">Select the staff member you'd like to tip.</p>

              <div className="search-container">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" placeholder="Search staff..." />
              </div>

              <div className="staff-grid">
                {STAFF_MEMBERS.map(staff => (
                  <div key={staff.id} className={`staff-card-grid ${isStaffSelected(staff.id) ? 'selected' : ''}`} onClick={() => toggleStaff(staff.id)}>
                    <div className="radio-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div className={`avatar ${staff.color}`}>{staff.avatar}</div>
                    <div className="staff-name">{staff.name}</div>
                    <div className="staff-role">{staff.role}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="footer-actions">
              <button className="btn-primary" disabled={!isScreen1Valid} onClick={() => setActiveScreen(2)}>
                NEXT
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>

          {/* SCREEN 2: TIP INPUT */}
          <div className={`screen ${activeScreen === 2 ? 'active' : ''}`}>
            <div className="content">
              {/* Staff Info Card */}
              <div className="staff-info-card">
                <div className="staff-info-left">
                  {selectedStaff.length === 1 ? (
                    <>
                      <div className={`staff-avatar ${selectedStaff[0].color}`}>{selectedStaff[0].avatar}</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{selectedStaff[0].name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedStaff[0].role}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="stacked-avatars">
                        {selectedStaff.map(s => (
                          <div key={s.id} className={`avatar-sm ${s.color}`}>{s.avatar}</div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{selectedStaff.map(s => s.name.split(' ')[0]).join(', ')}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedStaff.length} Staff selected</div>
                      </div>
                    </>
                  )}
                </div>
                <div className="staff-rating">
                  <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  4.9
                </div>
              </div>

              {selectedStaff.length > 1 && (
                <div className="tabs">
                  <div className={`tab ${tipMode === 'combine' ? 'active' : ''}`} onClick={() => setTipMode('combine')}>Split Evenly</div>
                  <div className={`tab ${tipMode === 'split' ? 'active' : ''}`} onClick={() => setTipMode('split')}>Split Individually</div>
                </div>
              )}

              <div className="section-title">SELECT TIP AMOUNT</div>

              {tipMode === 'combine' || selectedStaff.length === 1 ? (
                <>
                  <div className="tip-grid">
                    {QUICK_TIPS_COMBINE.map(amount => (
                      <button key={amount} className={`tip-btn ${combineTip === amount ? 'active' : ''}`} onClick={() => { setCombineTip(amount); setCustomCombineTip(''); }}>
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <div className={`custom-tip-container ${customCombineTip !== '' ? 'active' : ''}`}>
                    <span>$</span>
                    <input type="number" placeholder="Custom Tip" value={customCombineTip} onChange={(e) => handleCustomCombine(e.target.value)} />
                  </div>
                  {selectedStaff.length > 1 && totalCombine > 0 && (
                    <div className="per-person-text">= ${perPerson} / person</div>
                  )}
                </>
              ) : (
                <div className="split-list">
                  {selectedStaff.map(staff => (
                    <div className="split-row" key={staff.id}>
                      <div className="split-row-user">
                        <div className={`avatar-sm ${staff.color}`}>{staff.avatar}</div>
                        <span>{staff.name.split(' ')[0]}</span>
                      </div>
                      <div className="split-row-tips">
                        {QUICK_TIPS_SPLIT.map(amount => (
                          <button key={amount} className={splitTips[staff.id] === amount ? 'active' : ''} onClick={() => setSplitTip(staff.id, amount)}>${amount}</button>
                        ))}
                      </div>
                      <div className={`split-row-input ${customSplitTips[staff.id] ? 'active' : ''}`}>
                        <span>$</span>
                        <input type="number" placeholder="0" value={customSplitTips[staff.id] || ''} onChange={(e) => handleCustomSplit(staff.id, e.target.value)} />
                      </div>
                    </div>
                  ))}
                  <div className="split-total-row">
                    <span>TOTAL TIP</span>
                    <span>${totalSplit.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="section-title" style={{ marginTop: '24px' }}>PAYMENT METHOD</div>
              <div className="payment-grid">
                {[
                  { id: 'zelle', name: 'Zelle', icon: '/images/zelle.png' },
                  { id: 'venmo', name: 'Venmo', icon: '/images/venmo.png' },
                  { id: 'cashapp', name: 'Cash App', icon: '/images/cash-app.png' },
                  { id: 'apple', name: 'Apple Cash', icon: '/images/apple-cash.png' },
                  { id: 'paypal', name: 'Paypal', icon: '/images/paypal.png' },
                  { id: 'vlink', name: 'VLINKPAY', icon: '/images/vlinkpay.png' }
                ].map(p => (
                  <div key={p.id} className={`pay-method ${selectedPayment === p.id ? 'active' : ''}`} onClick={() => setSelectedPayment(p.id)}>
                    <div className="icon-wrapper">
                      <img src={p.icon} alt={p.name} />
                    </div>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>

              {selectedPayment && (
                <div className="instruction-box active">
                  <div className="copy-row">
                    <div className="copy-left">
                      <span className="tag-zelle">{selectedPayment}</span>
                      <span className="copy-text">402-402-4422</span>
                    </div>
                    <button className="btn-copy">Copy</button>
                  </div>
                  <p className="instruction-text">
                    Open your {selectedPayment} app, paste the number to send ${tipMode === 'combine' ? totalCombine : totalSplit}. Don't forget to return here after completing.
                  </p>
                </div>
              )}
            </div>
            
            <div className="footer-actions">
              <button className="btn-primary" disabled={!isScreen2Valid} onClick={() => setActiveScreen(3)}>
                PAID, CONTINUE TO REVIEW
              </button>
              {scenario !== '1' && <button className="btn-secondary" onClick={() => setActiveScreen(1)}>GO BACK</button>}
            </div>
          </div>

          {/* SCREEN 3: REVIEW */}
          <div className={`screen ${activeScreen === 3 ? 'active' : ''}`}>
            <div className="content">
              <div className="success-banner">
                <div className="success-banner-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div>
                  <h3>Tip sent successfully!</h3>
                  <p>Thank you for tipping our staff.</p>
                </div>
              </div>

              <div className="review-multi-card">
                <div className="store-info">
                  <div className="store-icon">
                    <img src="/images/bitcoin-nail-bar.png" alt="Store" />
                  </div>
                  <div>
                    <div className="store-name">Bitcoin Nail Bar</div>
                    <div className="store-staffs">Tipped to {selectedStaff.map(s => s.name.split(' ')[0]).join(', ')}</div>
                  </div>
                </div>

                <div className="total-tip-row">
                  <div className="total-tip-left">
                    <div className="label">Total Paid</div>
                    <div className="amount">${(tipMode === 'combine' ? totalCombine : totalSplit).toFixed(2)}</div>
                  </div>
                  <div className="total-tip-right">
                    <div className="icon-wrapper">
                      <img src={`/images/${selectedPayment === 'apple' ? 'apple-cash' : selectedPayment === 'cashapp' ? 'cash-app' : selectedPayment}.png`} alt="Payment" />
                    </div>
                    <span>{selectedPayment}</span>
                  </div>
                </div>

                {selectedStaff.length > 1 && (
                  <div className="breakdown-list">
                    {selectedStaff.map(s => (
                      <div key={s.id} className="breakdown-row">
                        <div className="breakdown-left">
                          <div className={`avatar-sm ${s.color}`}>{s.avatar}</div>
                          <span>{s.name}</span>
                        </div>
                        {tipMode === 'combine' ? (
                          <div className="breakdown-right per-person">${perPerson}/person</div>
                        ) : (
                          <div className="breakdown-right">${((splitTips[s.id] || 0) + (parseFloat(customSplitTips[s.id]) || 0)).toFixed(2)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="review-box">
                <div className="review-box-header">
                  <div>
                    <div className="review-box-title">Rate your experience</div>
                    <div className="review-box-subtitle">How was the service?</div>
                  </div>
                  <div className="review-box-status">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}</div>
                </div>
                <div className="stars-large">
                  {[1,2,3,4,5].map(star => (
                    <div key={star} className={`star-l ${rating >= star ? 'active' : ''}`} onClick={() => setRating(star)}>★</div>
                  ))}
                </div>
                <div className="tags-grid">
                  {['Great Service', 'Clean', 'Friendly Staff', 'Beautiful Nails', 'Fast'].map(tag => (
                    <div key={tag} className="tag">{tag}</div>
                  ))}
                </div>
                <textarea placeholder="Enter comment or select suggestions above..."></textarea>
              </div>
            </div>

            <div className="footer-actions">
              <button className="btn-primary" disabled={!isScreen3Valid} onClick={() => setActiveScreen(4)}>SUBMIT REVIEW</button>
            </div>
          </div>

          {/* SCREEN 4: SUCCESS */}
          <div className={`screen ${activeScreen === 4 ? 'active' : ''}`}>
            <div className="content success-screen-content">
              <img src="/images/nexora-logo.png" style={{ width: 120, marginBottom: 20 }} alt="Nexora" />
              <div style={{ width: 80, height: 80, background: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 24 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2>All Done!</h2>
              <p>Your feedback helps us improve.<br/>Have a wonderful day!</p>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}