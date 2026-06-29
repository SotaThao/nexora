/** Homepage section component */
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'
import { UserRound, Store, Car, Brush, GraduationCap, Building2, Camera } from 'lucide-react'

export default function HomePageTaxIQSection() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()

  return (
    <>
      <section className="py-16 sm:py-24 bg-slate-900 text-white relative overflow-hidden ds-section" id="tax-iq">
          <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-purple/10 rounded-full blur-[130px] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 bg-purple/20 text-purple font-extrabold text-xs px-3.5 py-1.5 rounded-full tracking-wider border border-purple/30">
                  🤖 AI ASSISTED • CPA REVIEW RECOMMENDED
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight" data-i18n="tax-landing-title">NEXORA Tax IQ — Quick Deduction Optimizer</h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed" data-i18n="tax-landing-desc-1">Tip income and independent contractor earnings can introduce complex tax liabilities—especially when differentiating between W2 salon employees and 1099 boutique contractors.</p>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed" data-i18n="tax-landing-desc-2">Tax IQ helps nail salon owners and technicians identify common deductions, prepare expense documentation, and understand estimated tax savings—before sending records to a CPA or tax professional.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div className="space-y-1">
                    <strong className="text-green text-lg font-bold">CPA-Ready</strong>
                    <p className="text-xs text-slate-400 font-bold uppercase" data-i18n="tax-substat-1">Prepare Docs Before Filing</p>
                  </div>
                  <div className="space-y-1">
                    <strong className="text-purple text-lg font-bold">Estimate Only</strong>
                    <p className="text-xs text-slate-400 font-bold uppercase" data-i18n="tax-substat-2">AI-Assisted Deduction Review</p>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-7 bg-slate-800 border border-slate-700/80 rounded-[32px] p-5 sm:p-7 shadow-2xl relative overflow-hidden premium-shadow">
                <div className="absolute -right-16 -top-16 w-36 h-36 bg-purple/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10 space-y-5">
      
                  
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple to-blue flex items-center justify-center text-white font-black text-xs">IQ</div>
                      <div>
                        <h4 className="font-extrabold text-xs text-white">NEXORA TAX IQ</h4>
                        <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider" data-i18n="tax-iq-app-subtitle">Quick Deduction Optimizer</span>
                      </div>
                    </div>
                    <span className="text-[8px] bg-purple/20 text-purple font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple/30" data-i18n="tax-iq-badge-ai">AI Assisted</span>
                  </div>
      
                  
                  <div className="space-y-2.5">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest" data-i18n="tax-iq-block1">① Tax Profile</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button id="role-btn-staff" onClick={() => { hp.selectTaxRole('staff') }} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-purple bg-purple/10 text-white transition-all ds-control btn-exp-action">
                        <UserRound size={28} strokeWidth={2} className="flex-shrink-0 text-white" aria-hidden="true" />
                        <div className="text-left">
                          <span className="block text-[11px] font-extrabold leading-tight" data-i18n="tax-role-staff-title">Nail Technician</span>
                          <span className="block text-[9px] leading-tight" data-i18n="tax-role-staff-sub">Staff / 1099</span>
                        </div>
                      </button>
                      <button id="role-btn-owner" onClick={() => { hp.selectTaxRole('owner') }} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/40 text-slate-400 transition-all ds-control btn-exp-action">
                        <Store size={28} strokeWidth={2} className="flex-shrink-0 text-slate-400" aria-hidden="true" />
                        <div className="text-left">
                          <span className="block text-[11px] font-extrabold leading-tight" data-i18n="tax-role-owner-title">Salon Owner</span>
                          <span className="block text-[9px] leading-tight" data-i18n="tax-role-owner-sub">Owner / Multi-loc</span>
                        </div>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-slate-900/60 border border-slate-700/40 p-2.5 rounded-xl">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1" data-i18n="tax-iq-income-label">Est. Annual Gross Income</label>
                        <input className="w-full bg-black border border-slate-700 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-purple ds-field" id="tax-iq-custom-income" onInput={() => { hp.calculateNailTax() }} type="number" defaultValue={55000} />
                      </div>
                      <div className="bg-slate-900/60 border border-slate-700/40 p-2.5 rounded-xl">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <span data-i18n="tax-worker-type">Worker Classification</span>
                          <span className="ml-1 text-slate-600 cursor-help" title="This helps estimate tax treatment. Worker classification should be confirmed with a CPA or tax professional.">ⓘ</span>
                        </label>
                        <select className="w-full bg-black border border-slate-700 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-purple ds-field ds-select" id="tax-iq-worker-type" onChange={() => { hp.calculateNailTax() }}>
                          <option value="1099" data-i18n="tax-type-1099">1099 Independent Contractor</option>
                          <option value="w2" data-i18n="tax-type-w2">W2 Employee</option>
                          <option value="booth" data-i18n="tax-type-booth">Booth Renter</option>
                          <option value="owner" data-i18n="tax-type-owner">Salon Owner</option>
                          <option value="multi" data-i18n="tax-type-multi">Multi-location Owner</option>
                        </select>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-700/30 p-2.5 rounded-xl opacity-75">
                        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1"><span data-i18n="tax-filing-status">Filing Status</span> <span className="text-slate-600 normal-case font-medium" data-i18n="tax-iq-optional">(optional)</span></label>
                        <select className="w-full bg-black border border-slate-700 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-purple ds-field ds-select" id="tax-iq-filing-status" defaultValue="single" onChange={() => { hp.calculateNailTax() }}>
                          <option value="single" data-i18n="tax-status-single">Single</option>
                          <option value="married" data-i18n="tax-status-married">Married Filing Jointly</option>
                          <option value="married_sep" data-i18n="tax-status-married-sep">Married Filing Separately</option>
                          <option value="hoh" data-i18n="tax-status-hoh">Head of Household</option>
                        </select>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-700/30 p-2.5 rounded-xl opacity-75">
                        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1"><span data-i18n="tax-children-count">Qualifying Children (&lt;17)</span> <span className="text-slate-600 normal-case font-medium" data-i18n="tax-iq-optional">(optional)</span></label>
                        <select className="w-full bg-black border border-slate-700 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-purple ds-field ds-select" id="tax-iq-children" onChange={() => { hp.calculateNailTax() }}>
                          <option value="0" data-i18n="opt-child-0">0 children</option>
                          <option value="1" data-i18n="opt-child-1">1 child (-$2,000 Credit)</option>
                          <option value="2" data-i18n="opt-child-2">2 children (-$4,000 Credit)</option>
                          <option value="3" data-i18n="opt-child-3">3 children (-$6,000 Credit)</option>
                        </select>
                      </div>
                    </div>
                  </div>
      
                  
                  <div className="space-y-2">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest" data-i18n="tax-iq-block2">② Quick Search: Deductible Categories</span>
                    <input className="w-full bg-black border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple placeholder:text-slate-600 font-medium ds-field" id="tax-iq-search-input" onInput={(e) => hp.filterTaxWriteoffs(e.currentTarget.value)} placeholder="Search deductible items, receipts, or business expenses" type="text" />
                    
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => { (document.getElementById('tax-iq-search-input') as HTMLInputElement).value='nail supplies';hp.filterTaxWriteoffs('nail supplies') }} className="text-[7px] font-bold px-1.5 rounded-full bg-slate-700/50 text-slate-300 hover:bg-purple/30 hover:text-purple border border-slate-700 transition-all ds-control inline-flex items-center" style={{ height: '28px', minHeight: '28px' }}>Nail Supplies</button>
                      <button onClick={() => { (document.getElementById('tax-iq-search-input') as HTMLInputElement).value='booth rent';hp.filterTaxWriteoffs('booth rent') }} className="text-[7px] font-bold px-1.5 rounded-full bg-slate-700/50 text-slate-300 hover:bg-purple/30 hover:text-purple border border-slate-700 transition-all ds-control inline-flex items-center" style={{ height: '28px', minHeight: '28px' }}>Booth Rent</button>
                      <button onClick={() => { (document.getElementById('tax-iq-search-input') as HTMLInputElement).value='mileage';hp.filterTaxWriteoffs('mileage') }} className="text-[7px] font-bold px-1.5 rounded-full bg-slate-700/50 text-slate-300 hover:bg-purple/30 hover:text-purple border border-slate-700 transition-all ds-control inline-flex items-center" style={{ height: '28px', minHeight: '28px' }}>Mileage</button>
                      <button onClick={() => { (document.getElementById('tax-iq-search-input') as HTMLInputElement).value='phone';hp.filterTaxWriteoffs('phone') }} className="text-[7px] font-bold px-1.5 rounded-full bg-slate-700/50 text-slate-300 hover:bg-purple/30 hover:text-purple border border-slate-700 transition-all ds-control inline-flex items-center" style={{ height: '28px', minHeight: '28px' }}>Phone</button>
                      <button onClick={() => { (document.getElementById('tax-iq-search-input') as HTMLInputElement).value='license';hp.filterTaxWriteoffs('license') }} className="text-[7px] font-bold px-1.5 rounded-full bg-slate-700/50 text-slate-300 hover:bg-purple/30 hover:text-purple border border-slate-700 transition-all ds-control inline-flex items-center" style={{ height: '28px', minHeight: '28px' }}>License</button>
                      <button onClick={() => { (document.getElementById('tax-iq-search-input') as HTMLInputElement).value='marketing';hp.filterTaxWriteoffs('marketing') }} className="text-[7px] font-bold px-1.5 rounded-full bg-slate-700/50 text-slate-300 hover:bg-purple/30 hover:text-purple border border-slate-700 transition-all ds-control inline-flex items-center" style={{ height: '28px', minHeight: '28px' }}>Marketing</button>
                      <button onClick={() => { (document.getElementById('tax-iq-search-input') as HTMLInputElement).value='tools';hp.filterTaxWriteoffs('tools') }} className="text-[7px] font-bold px-1.5 rounded-full bg-slate-700/50 text-slate-300 hover:bg-purple/30 hover:text-purple border border-slate-700 transition-all ds-control inline-flex items-center" style={{ height: '28px', minHeight: '28px' }}>Tools</button>
                    </div>
                    
                    <div className="space-y-1.5 pt-0.5 max-h-28 overflow-y-auto pr-1 no-scrollbar animate-fadeIn" id="tax-iq-search-results"></div>
                  </div>
      
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest" data-i18n="tax-iq-block3">③ Select Your Actual Expenses</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button type="button" onClick={() => { hp.openReceiptScanModal() }} className="text-[9px] font-extrabold text-green border border-green/40 bg-green/10 px-2.5 py-1 rounded-full hover:bg-green/20 transition-all ds-control btn-exp-action flex items-center gap-1" data-i18n="tax-iq-btn-scan"><Camera size={10} strokeWidth={2} /> Scan Receipt</button>
                        <button type="button" onClick={() => { hp.showToast('Add Expense: Add Manually · Upload Receipt · Ask Tax IQ') }} className="text-[9px] font-extrabold text-purple border border-purple/40 bg-purple/10 px-2.5 py-1 rounded-full hover:bg-purple/20 transition-all ds-control btn-exp-action" data-i18n="tax-iq-btn-add">+ Add</button>
                      </div>
                    </div>
                    <p className="text-[8px] text-slate-500 leading-relaxed" data-i18n="tax-iq-expenses-desc">Choose items you paid for. Tax IQ will check receipts, missing info, and CPA review needs.</p>
                    <div className="space-y-2 max-h-[90px] overflow-y-auto pr-1 no-scrollbar">
      
                      
                      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-2.5 flex items-start gap-2.5">
                        <input className="mt-0.5 flex-shrink-0 rounded text-purple focus:ring-0 focus:ring-offset-0 ds-field" id="chk-deduct-mileage" onChange={() => { hp.calculateNailTax() }} type="checkbox" />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <strong className="text-[10px] text-slate-200 flex items-center gap-1" data-i18n="tax-chk-mileage-title"><Car size={12} strokeWidth={2} className="text-slate-400" /> Mileage</strong>
                            <span data-expense-badge="mileage" className="text-[8px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" data-i18n="tax-badge-needs-log">Needs Mileage Log</span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[8px] text-slate-500">1,500 business miles · Est. deduction: $1,005</span>
                            <button data-expense-action="mileage" onClick={() => { hp.simulateReceiptUpload('mileage') }} className="text-[8px] text-purple font-bold hover:underline flex-shrink-0 ds-control btn-exp-action" data-i18n="tax-act-add-trip">Add Trip Details</button>
                          </div>
                        </div>
                      </div>
      
                      
                      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-2.5 flex items-start gap-2.5">
                        <input className="mt-0.5 flex-shrink-0 rounded text-purple focus:ring-0 focus:ring-offset-0 ds-field" id="chk-deduct-supplies" onChange={() => { hp.calculateNailTax() }} type="checkbox" />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <strong className="text-[10px] text-slate-200 flex items-center gap-1" data-i18n="tax-chk-supplies-title"><Brush size={12} strokeWidth={2} className="text-slate-400" /> Gel Polish, Brushes, UV Lamp</strong>
                            <span data-expense-badge="supplies" className="text-[8px] bg-red-500/15 text-red-400 border border-red-500/30 font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" data-i18n="tax-iq-sum-missing">Missing Receipt</span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[8px] text-slate-500">Nail supplies for client services · $450</span>
                            <button data-expense-action="supplies" onClick={() => { hp.simulateReceiptUpload('supplies') }} className="text-[8px] text-purple font-bold hover:underline flex-shrink-0 ds-control btn-exp-action" data-i18n="tax-act-upload-receipt">Upload Receipt</button>
                          </div>
                        </div>
                      </div>
      
                      
                      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-2.5 flex items-start gap-2.5">
                        <input defaultChecked className="mt-0.5 flex-shrink-0 rounded text-purple focus:ring-0 focus:ring-offset-0 ds-field" id="chk-deduct-license" onChange={() => { hp.calculateNailTax() }} type="checkbox" />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <strong className="text-[10px] text-slate-200 flex items-center gap-1" data-i18n="tax-chk-license-title"><GraduationCap size={12} strokeWidth={2} className="text-slate-400" /> State Board License Fee</strong>
                            <span data-expense-badge="license" className="text-[8px] bg-green/15 text-green border border-green/30 font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" data-i18n="tax-badge-ready">Ready</span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[8px] text-slate-500">Education &amp; professional license · $150</span>
                            <button data-expense-action="license" onClick={() => { hp.showToast('Receipt on file ✓') }} className="text-[8px] text-slate-400 font-bold hover:underline flex-shrink-0 ds-control btn-exp-action" data-i18n="tax-act-view-receipt">View Receipt</button>
                          </div>
                        </div>
                      </div>
      
                      
                      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-2.5 flex items-start gap-2.5">
                        <input className="mt-0.5 flex-shrink-0 rounded text-purple focus:ring-0 focus:ring-offset-0 ds-field" id="chk-deduct-rent" onChange={() => { hp.calculateNailTax() }} type="checkbox" />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <strong className="text-[10px] text-slate-200 flex items-center gap-1" data-i18n="tax-chk-rent-title"><Building2 size={12} strokeWidth={2} className="text-slate-400" /> Booth Rent</strong>
                            <span data-expense-badge="rent" className="text-[8px] bg-red-500/15 text-red-400 border border-red-500/30 font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" data-i18n="tax-badge-missing-proof">Missing Proof</span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[8px] text-slate-500">Booth rental deduction · $1,200</span>
                            <button data-expense-action="rent" onClick={() => { hp.simulateReceiptUpload('rent') }} className="text-[8px] text-purple font-bold hover:underline flex-shrink-0 ds-control btn-exp-action" data-i18n="tax-act-upload-proof">Upload Proof</button>
                          </div>
                        </div>
                      </div>
      
                      
                      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-2.5 flex items-start gap-2.5">
                        <input className="mt-0.5 flex-shrink-0 rounded text-purple focus:ring-0 focus:ring-offset-0 ds-field" id="chk-deduct-phone" onChange={() => { hp.calculateNailTax() }} type="checkbox" />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <strong className="text-[10px] text-slate-200" data-i18n="tax-chk-phone-title">📱 Phone &amp; Internet</strong>
                            <span data-expense-badge="phone" className="text-[8px] bg-blue/15 text-blue border border-blue/30 font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" data-i18n="tax-badge-partial">Partially Deductible</span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[8px] text-slate-500">70% business-use · $960 annual → $672 deductible</span>
                            <button data-expense-action="phone" onClick={() => { hp.simulateReceiptUpload('phone') }} className="text-[8px] text-purple font-bold hover:underline flex-shrink-0 ds-control btn-exp-action" data-i18n="tax-act-confirm-pct">Confirm %</button>
                          </div>
                        </div>
                      </div>
      
                    </div>
                  </div>
      
                  
                  <div className="bg-slate-950/80 border border-slate-700/50 rounded-xl p-3 space-y-2">
                    
                    <a type="button" onClick={() => { hp.toggleTaxSummary() }} className="w-full flex items-center justify-between btn-exp-action ds-control">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest" data-i18n="tax-iq-sum-heading">④ Estimated Tax Summary</span>
                      <svg id="tax-summary-chevron" style={{ transform: 'rotate(180deg)' }} className="w-3 h-3 text-slate-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                      </svg>
                    </a>
                    
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-500 font-bold" id="tax-iq-title-due" data-i18n="tax-iq-sum-liability">Est. Tax Liability</span>
                      <strong className="text-green text-sm font-black transition-all duration-300" id="tax-iq-final-tax">$12,808</strong>
                    </div>
                    
                    <div id="tax-summary-detail" style={{ display: 'block' }} className="space-y-1.5 text-[9px] border-t border-slate-800 pt-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold" data-i18n="tax-iq-sum-gross">Gross Income</span>
                        <span className="text-slate-200 font-extrabold" id="tax-iq-gross-income">$55,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold" data-i18n="tax-iq-sum-deductions">Selected Deductions</span>
                        <span className="text-slate-200 font-extrabold" id="tax-iq-total-deductions">$2,805</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-slate-800">
                        <span className="text-slate-500 font-bold" data-i18n="tax-iq-sum-taxable">Est. Taxable Income</span>
                        <span className="text-slate-200 font-extrabold" id="tax-iq-taxable-income">$52,195</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold" data-i18n="tax-iq-sum-savings">Est. Savings</span>
                        <strong className="text-purple font-black transition-all duration-300" id="tax-iq-saved-amount">$406</strong>
                      </div>
                      <div id="summary-missing-row" className="flex justify-between">
                        <span className="text-red-400 font-bold" data-i18n="tax-iq-sum-missing">Missing Receipt</span>
                        <span id="summary-missing-count" className="text-red-400 font-extrabold">2 items</span>
                      </div>
                      <div id="summary-cpa-row" className="flex justify-between">
                        <span className="text-yellow-400 font-bold" data-i18n="tax-iq-sum-cpa">Needs CPA Review</span>
                        <span id="summary-cpa-count" className="text-yellow-400 font-extrabold">1 item</span>
                      </div>
                      <p className="text-[7px] text-slate-600 leading-relaxed border-t border-slate-800 pt-1.5" data-i18n="tax-iq-sum-footnote">This estimate is for planning only and may change after CPA review, filing status, state tax rules, and final income adjustments.</p>
                    </div>
                  </div>
      
                  
                  <div className="space-y-2">
                    <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple to-indigo-600 text-white font-extrabold text-[10px] tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-1.5 ds-control ds-button" onClick={() => { hp.reviewWithTaxIQ() }}>
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                      </svg>
                      <span data-i18n="tax-iq-btn-review">Review with Tax IQ</span>
                    </button>
                    <p className="text-[7px] text-slate-600 text-center leading-relaxed pt-1" data-i18n="tax-iq-disclaimer">Estimate only. This is not tax advice. Final tax treatment should be reviewed by a CPA or tax professional.</p>
                  </div>
      
                </div>
              </div>
            </div>
          </div>
        </section>
    </>
  )
}
