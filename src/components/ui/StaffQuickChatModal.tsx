// StaffQuickChatModal — local-only mock 1:1 chat to demo "chat with staff" in the
// real Owner dashboard. No backend/repository — messages live in component state only.
// Styled as a floating bottom-right window (like the real Community DM dock window)
// instead of a centered blocking modal, per user feedback.
import { useState } from 'react'
import { Send, X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'

const gradientClass = 'bg-gradient-to-br from-nexoraElectric to-nexoraViolet'

function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function nowLabel() {
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date())
}

export default function StaffQuickChatModal({ staffName, onClose }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState(() => [
    { id: 1, from: 'them', body: `Chào chị/anh, ${staffName} có thể giúp gì cho tiệm hôm nay?`, time: nowLabel() },
  ])
  const [body, setBody] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    setMessages((current) => [...current, { id: Date.now(), from: 'me', body: trimmed, time: nowLabel() }])
    setBody('')
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex justify-end pr-4 sm:pr-6">
      <div
        role="dialog"
        aria-label={t('staff_detail.chat_with', { name: staffName })}
        className="pointer-events-auto flex h-[430px] w-[340px] flex-col overflow-hidden rounded-t-2xl border border-nexoraBorder bg-white font-sans shadow-2xl"
      >
        <header className="flex shrink-0 items-center gap-2.5 border-b border-nexoraBorder bg-nexoraSurface px-3 py-2.5">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white ${gradientClass}`}>
            {initials(staffName)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-extrabold text-nexoraText">{staffName}</h3>
            <p className="truncate text-[10.5px] text-nexoraMuted">{t('staff_detail.chat_demo_hint')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <section className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 py-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                message.from === 'me' ? 'ml-auto bg-nexoraBrand text-white' : 'bg-nexoraSurfaceMuted text-nexoraText'
              }`}
            >
              <p className="whitespace-pre-wrap text-[13px] leading-snug">{message.body}</p>
              <div className={`mt-0.5 text-right text-[10px] ${message.from === 'me' ? 'text-white/70' : 'text-nexoraSubtle'}`}>
                {message.time}
              </div>
            </div>
          ))}
        </section>

        <form onSubmit={submit} className="flex shrink-0 items-center gap-1.5 border-t border-nexoraBorder bg-nexoraSurface p-2">
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t('staff_detail.chat_placeholder')}
            aria-label={t('staff_detail.chat_with', { name: staffName })}
            className="min-h-9 min-w-0 flex-1 rounded-full border border-nexoraBorder bg-white px-3 text-xs text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand"
          />
          <button
            type="submit"
            disabled={!body.trim()}
            aria-label={t('staff_detail.chat_send')}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${gradientClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  )
}
