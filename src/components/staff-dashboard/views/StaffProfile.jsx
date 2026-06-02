// StaffProfile — personal profile (staff-owned: display name + bio) and
// per-business display names. Identity basics come from the merchant record.
import { useEffect, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'
const labelCls = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-nexoraSubtle'
const inputCls = 'w-full rounded-xl border border-nexoraBorder bg-nexoraSurface px-3 py-2.5 text-sm text-nexoraText outline-none focus:border-nexoraBrand'
const readOnlyCls = 'w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas px-3 py-2.5 text-sm font-medium text-nexoraMuted'

export default function StaffProfile() {
  const { t } = useTranslation()
  const { staffMember, account, linkedBusinesses, saveProfile, setBusinessDisplayName } = useStaffAccount()

  const [displayName, setDisplayName] = useState(account.defaultDisplayName || '')
  const [bio, setBio] = useState(account.bio || '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDisplayName(account.defaultDisplayName || '')
    setBio(account.bio || '')
  }, [account.defaultDisplayName, account.bio])

  const handleSave = () => {
    saveProfile({ defaultDisplayName: displayName, bio })
    setSaved(true)
  }

  return (
    <div className="space-y-4">
      <section className={panel}>
        <h3 className="mb-4 text-base font-extrabold text-nexoraText">{t('staff_dashboard.profile.title')}</h3>

        <div className="space-y-3">
          <div>
            <label className={labelCls}>{t('staff_dashboard.profile.full_name')}</label>
            <div className={readOnlyCls}>{staffMember.fullName || '—'}</div>
          </div>
          <div>
            <label className={labelCls}>{t('staff_dashboard.profile.display_name')}</label>
            <input className={inputCls} value={displayName} onChange={(e) => { setDisplayName(e.target.value); setSaved(false) }} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t('staff_dashboard.profile.phone')}</label>
              <div className={readOnlyCls}>{staffMember.phone || '—'}</div>
            </div>
            <div>
              <label className={labelCls}>{t('staff_dashboard.profile.email')}</label>
              <div className={readOnlyCls}>{staffMember.email || '—'}</div>
            </div>
          </div>
          <div>
            <label className={labelCls}>{t('staff_dashboard.profile.bio')}</label>
            <textarea
              className={`${inputCls} h-24 resize-none`}
              value={bio}
              onChange={(e) => { setBio(e.target.value); setSaved(false) }}
            />
          </div>
        </div>

        <p className="mt-3 text-[11px] text-nexoraSubtle">{t('staff_dashboard.profile.identity_note')}</p>

        <button
          type="button"
          onClick={handleSave}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] py-3 text-sm font-extrabold text-white transition hover:opacity-90"
        >
          {saved ? t('staff_dashboard.profile.saved') : t('staff_dashboard.profile.save')}
        </button>
      </section>

      <section className={panel}>
        <h3 className="mb-3 text-base font-extrabold text-nexoraText">{t('staff_dashboard.profile.business_names')}</h3>
        <div className="space-y-3">
          {linkedBusinesses.map((biz) => (
            <div key={biz.businessStaffLinkId}>
              <label className={labelCls}>{biz.businessName}</label>
              <input
                className={inputCls}
                value={biz.displayName}
                onChange={(e) => setBusinessDisplayName(biz.businessStaffLinkId, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
