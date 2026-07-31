import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock3,
  Globe2,
  Info,
  PhoneForwarded,
  PhoneOff,
  Printer,
  RotateCcw,
  SlidersHorizontal,
  Voicemail,
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { BOOKING_HUB_PATH } from '../constants'
import {
  GUIDE_MVNO,
  GUIDE_PANIC_CODES,
  getGuideModeCodes,
  type GuideCarrier,
  type GuideLang,
  type GuideMode,
} from './aiVoiceSetupGuideCodes'
import './ai-voice-setup-guide.css'

const GUIDE_TOKEN_KEYS = ['phone', 'ai', 'sname', 'sphone', 'semail'] as const
type GuideTokenKey = (typeof GUIDE_TOKEN_KEYS)[number]

function BiText({ vi, en }: { vi: React.ReactNode; en: React.ReactNode }) {
  return (
    <>
      <span className="guide-vi">{vi}</span>
      <span className="guide-en">{en}</span>
    </>
  )
}

function tokenLabel(key: GuideTokenKey) {
  return `[${key.toUpperCase()}]`
}

export default function AiVoiceSetupGuideView() {
  const navigate = useNavigate()
  const { currentLanguage } = useTranslation()
  const [searchParams] = useSearchParams()
  const lang: GuideLang = currentLanguage === 'vi' ? 'vi' : 'en'
  const [carrier, setCarrier] = useState<GuideCarrier>('verizon')
  const [mode, setMode] = useState<GuideMode>('ring')
  const [copiedKey, setCopiedKey] = useState<GuideTokenKey | null>(null)

  const tokens = useMemo(() => {
    const next: Partial<Record<GuideTokenKey, string>> = {}
    GUIDE_TOKEN_KEYS.forEach((key) => {
      const value = searchParams.get(key)
      if (value) next[key] = value
    })
    return next
  }, [searchParams])

  const aiNumber = tokens.ai || '[AI NUMBER]'
  const modeCodes = getGuideModeCodes(carrier, mode)
  const panicCode = GUIDE_PANIC_CODES[carrier]
  const codeOn = modeCodes.on.replace('{AI}', aiNumber)
  const modeTag =
    mode === 'ring'
      ? lang === 'vi'
        ? '3 hồi · khoảng 20 giây'
        : '3 rings · ~20 seconds'
      : lang === 'vi'
        ? 'AI bắt ngay'
        : 'AI answers immediately'

  const showRing = mode === 'ring' && carrier !== 'voip'
  const showVmWarn = mode === 'ring' && carrier !== 'voip'
  const showMvnoWarn = mode === 'ring' && Boolean(GUIDE_MVNO[carrier])
  const showVoipWarn = carrier === 'voip'

  useEffect(() => {
    const printClass = 'printing-ai-voice-guide'
    const onBeforePrint = () => document.body.classList.add(printClass)
    const onAfterPrint = () => document.body.classList.remove(printClass)
    window.addEventListener('beforeprint', onBeforePrint)
    window.addEventListener('afterprint', onAfterPrint)
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint)
      window.removeEventListener('afterprint', onAfterPrint)
      document.body.classList.remove(printClass)
    }
  }, [])

  const handlePrint = () => {
    document.body.classList.add('printing-ai-voice-guide')
    window.print()
  }

  const handleCopy = async (key: GuideTokenKey) => {
    const value = tokens[key]
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(null), 1300)
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="ai-voice-setup-guide-view">
      <section
        className="ai-guide-page"
        data-guide-lang={lang}
        aria-labelledby="guide-page-title"
      >
        <div className="guide-toolbar">
          <button
            className="guide-back-button"
            type="button"
            onClick={() => navigate(BOOKING_HUB_PATH)}
            aria-label={lang === 'vi' ? 'Quay lại AI Hub' : 'Back to AI Hub'}
          >
            <ArrowLeft aria-hidden="true" />
            <BiText vi="Quay lại AI Hub" en="Back to AI Hub" />
          </button>
          <button className="guide-print-button" type="button" onClick={handlePrint}>
            <Printer aria-hidden="true" />
            <BiText vi="In hướng dẫn" en="Print guide" />
          </button>
        </div>

        <div className="guide-heading">
          <div>
            <p className="guide-eyebrow">AI Voice setup</p>
            <h1 id="guide-page-title">
              <BiText vi="Hướng dẫn AI Voice cho tiệm" en="Salon AI Voice guide" />
            </h1>
            <p className="guide-description">
              <BiText
                vi="Cài một lần, xử lý cuộc gọi hàng ngày dễ dàng hơn — kèm mã tắt khẩn cấp và cách xử lý các tình huống thường gặp."
                en="Set it up once, handle calls with confidence every day — with an emergency off code and answers for common situations."
              />
            </p>
          </div>
        </div>

        <section className="guide-panel guide-controls" aria-labelledby="guide-controls-title">
          <div className="guide-panel-heading">
            <span className="guide-panel-heading-icon">
              <SlidersHorizontal aria-hidden="true" />
            </span>
            <div>
              <h2 id="guide-controls-title">
                <BiText vi="Chọn cấu hình điện thoại" en="Choose your phone setup" />
              </h2>
              <p>
                <BiText
                  vi="Mã bấm thay đổi theo nhà mạng và cách bạn muốn AI bắt máy."
                  en="Codes change by carrier and by when you want AI to answer."
                />
              </p>
            </div>
          </div>
          <div className="guide-control-grid">
            <div className="guide-field">
              <label htmlFor="guide-carrier">
                <BiText vi="Nhà mạng của tiệm" en="Your carrier" />
              </label>
              <div className="guide-select-wrap">
                <select
                  id="guide-carrier"
                  value={carrier}
                  onChange={(event) => setCarrier(event.target.value as GuideCarrier)}
                >
                  <option value="verizon">Verizon</option>
                  <option value="att">AT&T</option>
                  <option value="tmobile">T-Mobile</option>
                  <option value="cricket">Cricket (mạng AT&T)</option>
                  <option value="metro">Metro / Mint (mạng T-Mobile)</option>
                  <option value="visible">Visible / Total (mạng Verizon)</option>
                  <option value="landline">Điện thoại bàn · Landline</option>
                  <option value="voip">Internet · VoIP</option>
                </select>
              </div>
            </div>
            <div className="guide-field">
              <label htmlFor="guide-mode">
                <BiText vi="Kiểu trả lời" en="Answering mode" />
              </label>
              <div className="guide-select-wrap">
                <select
                  id="guide-mode"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as GuideMode)}
                >
                  <option value="ring">Chuông reo 3 hồi rồi mới qua AI</option>
                  <option value="now">AI bắt máy ngay từ đầu</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="guide-danger-card" aria-labelledby="guide-panic-title">
          <div className="guide-danger-header">
            <PhoneOff aria-hidden="true" />
            <span id="guide-panic-title">
              <BiText vi="Tắt ngay khi có sự cố" en="Turn it off now" />
            </span>
          </div>
          <div className="guide-danger-body">
            <div className="guide-big-code">{panicCode}</div>
            <p>
              <BiText
                vi={
                  <>
                    Bấm mã này <strong>từ điện thoại của tiệm</strong>. Nó xoá{' '}
                    <strong>hết mọi kiểu chuyển tiếp</strong> — không cần biết đang cài kiểu nào.
                    Cuộc gọi về tiệm ngay lập tức.
                  </>
                }
                en={
                  <>
                    Dial this <strong>from the shop phone</strong>. It clears{' '}
                    <strong>every kind of forwarding</strong> — no need to know which mode is set.
                    Calls come straight back to you.
                  </>
                }
              />
            </p>
          </div>
        </section>

        <div className="guide-main-grid">
          <section className="guide-panel" aria-labelledby="guide-on-title">
            <div className="guide-panel-heading">
              <span className="guide-panel-heading-icon">
                <PhoneForwarded aria-hidden="true" />
              </span>
              <div>
                <h2 id="guide-on-title">
                  <BiText vi="Bật lại" en="Turn it back on" />{' '}
                  <span className="guide-mode-tag">{modeTag}</span>
                </h2>
              </div>
            </div>
            <div className="guide-code">{codeOn}</div>
            <p
              className="guide-panel-copy guide-code-note"
              dangerouslySetInnerHTML={{
                __html: `<span class="guide-vi">${modeCodes.vi}</span><span class="guide-en">${modeCodes.en}</span>`,
              }}
            />
            <div className="guide-secondary-action">
              <RotateCcw aria-hidden="true" />
              <span>
                <BiText vi="Tắt riêng kiểu này:" en="Turn off just this mode:" />{' '}
                <strong>{modeCodes.off}</strong>
              </span>
            </div>
          </section>

          <section
            className={`guide-panel${showRing ? '' : ' guide-is-hidden'}`}
            aria-labelledby="ring-title"
          >
            <div className="guide-panel-heading">
              <span className="guide-panel-heading-icon">
                <Clock3 aria-hidden="true" />
              </span>
              <div>
                <h2 id="ring-title">
                  <BiText
                    vi="“3 hồi chuông” là bao nhiêu giây?"
                    en="What does “3 rings” mean?"
                  />
                </h2>
              </div>
            </div>
            <p className="guide-panel-copy">
              <BiText
                vi={
                  <>
                    Nhà mạng không có ô “số hồi chuông” — chỉ có <strong>số giây</strong>. Ở Mỹ một
                    hồi chuông khoảng 6 giây.
                  </>
                }
                en={
                  <>
                    Carriers have no “ring count” setting — only <strong>seconds</strong>. In the US
                    one ring is about 6 seconds.
                  </>
                }
              />
            </p>
            <div className="guide-ring-track">
              <div className="guide-ring-item">
                <strong>
                  2 <BiText vi="hồi" en="rings" />
                </strong>
                <span>≈ 12s</span>
              </div>
              <div className="guide-ring-item is-selected">
                <strong>
                  3 <BiText vi="hồi" en="rings" />
                </strong>
                <span>≈ 20s ✓</span>
              </div>
              <div className="guide-ring-item">
                <strong>
                  4 <BiText vi="hồi" en="rings" />
                </strong>
                <span>≈ 25s</span>
              </div>
              <div className="guide-ring-item">
                <strong>
                  5 <BiText vi="hồi" en="rings" />
                </strong>
                <span>≈ 30s</span>
              </div>
            </div>
            <p className="guide-panel-copy">
              <BiText
                vi="Chỉ đặt được bội số của 5, tối đa 30 giây."
                en="Only multiples of 5, up to 30 seconds."
              />
            </p>
          </section>

          <section
            className={`guide-callout is-danger${showVmWarn ? '' : ' guide-is-hidden'}`}
            aria-labelledby="vm-warn-title"
          >
            <span className="guide-callout-icon">
              <Voicemail aria-hidden="true" />
            </span>
            <div>
              <h3 id="vm-warn-title">
                <BiText
                  vi="Voicemail là thứ làm hỏng kiểu này"
                  en="Voicemail is what breaks this mode"
                />
              </h3>
              <p>
                <BiText
                  vi={
                    <>
                      Voicemail của tiệm cũng bắt máy khoảng 20–25 giây. Nếu nó bắt trước AI thì
                      khách vào hộp thư thoại và tưởng tiệm không ai nghe. <strong>Tắt voicemail</strong>
                      , hoặc đặt AI ở 15–20 giây còn voicemail ở 30 giây.
                    </>
                  }
                  en={
                    <>
                      Your voicemail also picks up around 20–25 seconds. If it wins, callers land in
                      voicemail and think nobody answered. <strong>Turn voicemail off</strong>, or
                      set the AI to 15–20 seconds and voicemail to 30.
                    </>
                  }
                />
              </p>
            </div>
          </section>

          <section
            className={`guide-callout is-warning guide-warning${showMvnoWarn ? '' : ' guide-is-hidden'}`}
            aria-labelledby="mvno-warn-title"
          >
            <span className="guide-callout-icon">
              <Info aria-hidden="true" />
            </span>
            <div>
              <h3 id="mvno-warn-title">
                <BiText
                  vi="Gói này có thể không cho “chuông reo trước”"
                  en="This plan may not support “ring first”"
                />
              </h3>
              <p>
                <BiText
                  vi="Nhiều gói mạng phụ chỉ cho chuyển toàn bộ cuộc gọi. Bấm mã mà báo lỗi hoặc không thấy gì xảy ra → đổi qua “AI bắt máy ngay”, hoặc gọi nhà mạng hỏi có mở được không."
                  en="Many prepaid plans only allow forwarding every call. If the code errors or nothing happens → switch to “AI answers immediately”, or ask the carrier to enable it."
                />
              </p>
            </div>
          </section>

          <section
            className={`guide-callout is-info guide-info${showVoipWarn ? '' : ' guide-is-hidden'}`}
            aria-labelledby="voip-warn-title"
          >
            <span className="guide-callout-icon">
              <Globe2 aria-hidden="true" />
            </span>
            <div>
              <h3 id="voip-warn-title">
                <BiText
                  vi="Mạng internet không dùng mã bấm"
                  en="Internet lines have no star codes"
                />
              </h3>
              <p>
                <BiText
                  vi={
                    <>
                      Vào trang quản lý của nhà cung cấp → Voice → Call Forwarding. Chọn{' '}
                      <strong>No Answer</strong> và đặt 20 giây, hoặc <strong>Always</strong> nếu
                      muốn AI bắt ngay. Không rành thì gọi người hỗ trợ bên dưới.
                    </>
                  }
                  en={
                    <>
                      Go to your provider portal → Voice → Call Forwarding. Choose{' '}
                      <strong>No Answer</strong> and set 20 seconds, or <strong>Always</strong> for
                      immediate. Not sure? Call your support contact below.
                    </>
                  }
                />
              </p>
            </div>
          </section>
        </div>

        <section className="guide-number-card" aria-labelledby="guide-numbers-title">
          <div className="guide-section-heading">
            <h2 id="guide-numbers-title">
              <BiText vi="Số cần dùng khi cài đặt" en="Numbers for setup" />
            </h2>
            <p>
              <BiText
                vi="Các số này có thể được truyền qua query params khi mở guide cho từng tiệm."
                en="These numbers can be passed through query params when opening the guide for a salon."
              />
            </p>
          </div>
          <div className="guide-number-grid">
            {(['ai', 'phone'] as const).map((key) => {
              const value = tokens[key]
              return (
                <div className="guide-number" key={key}>
                  <div className="guide-number-copy">
                    <div className="guide-metric-label">
                      {key === 'ai' ? (
                        <BiText vi="Số AI" en="AI number" />
                      ) : (
                        <BiText vi="Số tiệm" en="Shop number" />
                      )}
                    </div>
                    <div className={`guide-metric-value guide-token${value ? '' : ' empty'}`}>
                      {value || tokenLabel(key)}
                    </div>
                  </div>
                  <button
                    className={`guide-copy-button${copiedKey === key ? ' is-done' : ''}`}
                    type="button"
                    disabled={!value}
                    onClick={() => handleCopy(key)}
                  >
                    {copiedKey === key ? (
                      <BiText vi="Đã chép" en="Copied" />
                    ) : (
                      <BiText vi="Chép" en="Copy" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <section className="guide-situations" aria-labelledby="guide-situations-title">
          <div className="guide-situations-heading guide-section-heading">
            <h2 id="guide-situations-title">
              <BiText vi="Gặp tình huống này thì làm vầy" en="When this happens, do this" />
            </h2>
            <p>
              <BiText
                vi="Năm việc hay gặp nhất. Ngoài năm việc này thì gọi hỗ trợ."
                en="The five most common ones. Anything else, call support."
              />
            </p>
          </div>
          {[
            {
              qVi: 'Điện thoại báo “cuộc gọi nhỡ”',
              qEn: 'You get a “missed call” alert',
              aVi: (
                <>
                  Mở app, đọc <strong>tóm tắt</strong> — không cần nghe lại. Khách hỏi giá hoặc muốn
                  đặt hẹn thì gọi lại trong <strong>15 phút</strong>.
                </>
              ),
              aEn: (
                <>
                  Open the app, read the <strong>summary</strong>. If they asked about price or
                  wanted to book, call back within <strong>15 minutes</strong>.
                </>
              ),
            },
            {
              qVi: 'Có tin nhắn mới trong app',
              qEn: 'A new text in the app',
              aVi: (
                <>
                  Trả lời ngay trong app, đừng nhắn từ điện thoại riêng. Khách nhắn{' '}
                  <strong>STOP</strong> thì <strong>đừng nhắn lại</strong>.
                </>
              ),
              aEn: (
                <>
                  Reply inside the app, not your personal phone. If they text <strong>STOP</strong>,{' '}
                  <strong>do not text back</strong>.
                </>
              ),
            },
            {
              qVi: 'Khách gọi mà không ai bắt, cũng không qua AI',
              qEn: 'Nobody answers and it never reaches the AI',
              aVi: (
                <>
                  Chín phần mười là <strong>voicemail bắt trước</strong>. Tắt voicemail rồi thử lại.
                  Vẫn vậy thì bấm mã đỏ ở trên và gọi hỗ trợ.
                </>
              ),
              aEn: (
                <>
                  Nine times out of ten it is <strong>voicemail winning</strong>. Turn voicemail off
                  and retest. Still broken → dial the red code above and call support.
                </>
              ),
            },
            {
              qVi: 'AI nói sai giá hoặc sai giờ',
              qEn: 'The AI gave a wrong price or time',
              aVi: (
                <>
                  Chụp màn hình, ghi <strong>giờ gọi</strong>, gửi người hỗ trợ. Đang có khách bị
                  ảnh hưởng thì <strong>gọi</strong>, đừng email.
                </>
              ),
              aEn: (
                <>
                  Screenshot, note the <strong>call time</strong>, send to support. Customer affected
                  right now → <strong>call</strong>, do not email.
                </>
              ),
            },
            {
              qVi: 'Cuối ngày',
              qEn: 'End of day',
              aVi: 'Mở app 2 phút: còn tin nào chưa trả lời, còn cuộc gọi nhỡ nào chưa gọi lại. Xong là đóng.',
              aEn: 'Two minutes in the app: unanswered texts, missed calls not returned. Then close it.',
            },
          ].map((item) => (
            <div className="guide-situation" key={item.qEn}>
              <div className="guide-situation-question">
                <BiText vi={item.qVi} en={item.qEn} />
              </div>
              <div className="guide-situation-answer">
                <BiText vi={item.aVi} en={item.aEn} />
              </div>
            </div>
          ))}
        </section>

        <section className="guide-script" aria-labelledby="guide-script-title">
          <div className="guide-script-label" id="guide-script-title">
            <BiText
              vi="Khách quen hỏi “sao gọi lại gặp máy?” — nói câu này"
              en="Regular asks “why did a machine answer?” — say this"
            />
          </div>
          <p className="guide-vi">
            “Dạ tiệm mới có thêm trợ lý trả lời điện thoại, để lúc tụi em đang làm khách thì không ai
            bị bỏ lỡ nữa. Chị cứ nói bình thường, hoặc chị nhắn tin cũng được, em thấy liền.”
          </p>
          <p className="guide-en">
            “We added an assistant that answers the phone so nobody gets missed while we are with a
            client. You can talk to it normally, or just text us — we see it right away.”
          </p>
        </section>

        <section className="guide-support" aria-label="AI Voice support">
          {(
            [
              { key: 'sname' as const, vi: 'Kẹt thì gọi', en: 'Stuck? Call' },
              { key: 'sphone' as const, vi: 'Điện thoại', en: 'Phone' },
              { key: 'semail' as const, vi: 'Email', en: 'Email' },
            ] as const
          ).map((item) => {
            const value = tokens[item.key]
            return (
              <div key={item.key}>
                <div className="guide-support-label">
                  <BiText vi={item.vi} en={item.en} />
                </div>
                <div className={`guide-support-value guide-token${value ? '' : ' empty'}`}>
                  {value || tokenLabel(item.key)}
                </div>
              </div>
            )
          })}
        </section>

        <p className="guide-footer-note">
          <BiText vi="In ra, ép nhựa, dán ở quầy." en="Print it, laminate it, tape it to the counter." />{' '}
          <button type="button" onClick={handlePrint}>
            <BiText vi="In tờ này" en="Print this" />
          </button>
        </p>
      </section>
    </section>
  )
}
