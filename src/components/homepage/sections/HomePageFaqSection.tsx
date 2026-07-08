/** Homepage FAQ section — app value, convenience, and product-fit answers. */
import { useState } from 'react'
import LucideIcon from '../ui/LucideIcon'

const FAQ_ITEMS = [
  {
    tag: 'faq-tag-overview',
    question: 'faq-q-1',
    answer: 'faq-a-1',
    defaultTag: 'App Overview',
    defaultQuestion: 'What is Nexora Touch?',
    defaultAnswer:
      'Nexora Touch is a Smart QR app that helps businesses manage direct tips, reviews, staff, QR stations, and loyalty in one system.',
  },
  {
    tag: 'faq-tag-why',
    question: 'faq-q-2',
    answer: 'faq-a-2',
    defaultTag: 'Why Nexora',
    defaultQuestion: 'How is Nexora Touch different from regular tipping or QR apps?',
    defaultAnswer:
      'Many tools only handle QR, tipping, or reviews. Nexora Touch connects the full journey from scan, staff selection, tipping, reviews, rewards, and business dashboards.',
  },
  {
    tag: 'faq-tag-direct-tip',
    question: 'faq-q-3',
    answer: 'faq-a-3',
    defaultTag: 'Direct Tips',
    defaultQuestion: 'Why should a business use Nexora Touch instead of only personal wallet tips?',
    defaultAnswer:
      'Customers still tip through familiar methods, but the business gains transaction records, correct staff routing, tip history, reviews, and performance reports.',
  },
  {
    tag: 'faq-tag-customer',
    question: 'faq-q-4',
    answer: 'faq-a-4',
    defaultTag: 'Customer Flow',
    defaultQuestion: 'Do customers need to download an app?',
    defaultAnswer:
      'No. Customers scan a QR code and use the browser, making tipping, payment, and reviews much faster than forcing an app download.',
  },
  {
    tag: 'faq-tag-qr',
    question: 'faq-q-5',
    answer: 'faq-a-5',
    defaultTag: 'Smart QR',
    defaultQuestion: 'How is Smart QR better than a regular QR code?',
    defaultAnswer:
      'A regular QR opens a static link. Nexora Smart QR can connect to stations, tables, front desk, or staff, while owners track scans, status, and performance.',
  },
  {
    tag: 'faq-tag-direct-tip',
    question: 'faq-q-6',
    answer: 'faq-a-6',
    defaultTag: 'Direct Tips',
    defaultQuestion: 'How does direct tipping work?',
    defaultAnswer:
      'Customers scan, select staff, choose a tip amount, and send it directly through the configured method. The app records and organizes the tipping flow.',
  },
  {
    tag: 'faq-tag-dashboard',
    question: 'faq-q-7',
    answer: 'faq-a-7',
    defaultTag: 'Dashboards',
    defaultQuestion: 'What do owners and staff use the app for?',
    defaultAnswer:
      'Owners manage staff, QR, reviews, tips, payments, and reports. Staff get their own dashboard for tips, reviews, personal QR, payment methods, and linked businesses.',
  },
  {
    tag: 'faq-tag-reviews',
    question: 'faq-q-8',
    answer: 'faq-a-8',
    defaultTag: 'Reviews',
    defaultQuestion: 'How does Nexora Touch help increase Google/Yelp reviews?',
    defaultAnswer:
      'After tipping or service, the app prompts customers to rate the experience. Happy customers can be routed to Google/Yelp, while lower feedback is captured privately.',
  },
  {
    tag: 'faq-tag-why',
    question: 'faq-q-9',
    answer: 'faq-a-9',
    defaultTag: 'Connected App',
    defaultQuestion: 'Does Nexora Touch only handle tips?',
    defaultAnswer:
      'No. The app also supports business payment QR, review routing, loyalty rewards, staff portals, and owner dashboards.',
  },
  {
    tag: 'faq-tag-setup',
    question: 'faq-q-10',
    answer: 'faq-a-10',
    defaultTag: 'Setup',
    defaultQuestion: 'How does a business start using Nexora Touch after signing up?',
    defaultAnswer:
      'The business sets up its profile, adds staff, configures receiving methods, creates QR stations, and starts sharing QR codes with customers.',
  },
]

export default function HomePageFaqSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="relative overflow-hidden bg-[#050510] py-12 text-white sm:py-16 ds-section" id="faq">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.28),transparent_34%),radial-gradient(circle_at_85%_25%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.14),transparent_34%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto space-y-5 text-center">
          <div className="mx-auto max-w-3xl space-y-2.5">
            <span className="inline-flex items-center rounded-full border border-cyan-300/25 bg-white/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-cyan-300" data-i18n="faq-eyebrow">
              FAQ
            </span>
            <h2 className="font-black tracking-tight text-white text-3xl sm:text-4xl leading-tight" data-i18n="faq-title">
              Nexora Touch FAQ
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base" data-i18n="faq-intro">
              Smart QR for tips, reviews, loyalty, and owner/staff dashboards.
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-2.5 text-left">
            {FAQ_ITEMS.map((item, index) => (
              (() => {
                const isOpen = openIndex === index
                const panelId = `homepage-faq-panel-${index + 1}`

                return (
              <article
                key={item.question}
                className={`group overflow-hidden rounded-xl border bg-[#141428]/90 shadow-[0_16px_42px_rgba(0,0,0,0.2)] transition-all duration-300 ${
                  isOpen
                    ? 'border-cyan-300/45 bg-[#1c1c36]'
                    : 'border-white/10 hover:border-cyan-300/30 hover:bg-[#18182f]'
                }`}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left sm:px-4"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex((current) => (current === index ? -1 : index))}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-extrabold leading-snug text-white sm:text-sm" data-i18n={item.question}>
                      {item.defaultQuestion}
                    </span>
                  </span>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-cyan-200 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <LucideIcon name="chevron-down" className="h-3.5 w-3.5" />
                  </span>
                </button>
                <div
                  id={panelId}
                  className={`px-4 pb-4 pr-5 transition-all duration-300 ${
                    isOpen ? 'border-t border-white/10 pt-3' : 'pt-0'
                  }`}
                  hidden={!isOpen}
                >
                  <p
                    className="text-[12px] leading-relaxed text-slate-300 sm:text-[13px]"
                    data-i18n={item.answer}
                    hidden={!isOpen}
                  >
                    {item.defaultAnswer}
                  </p>
                </div>
              </article>
                )
              })()
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
