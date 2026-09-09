// PosStaffProfileView — POS > Staff Profiles (US-019). Searchable, paginated staff
// table; "View" opens PosStaffProfileDetailModal for the actual POS profile form.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Search, UserPlus, Users } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useMerchantStaff } from '../../../../data/hooks/useMerchantStaff'
import { usePagination } from '../../../../hooks/usePagination'
import { SkeletonList } from '../../../ui/skeleton'
import Pagination from '../../../ui/Pagination'
import TechnicianInfoModal from '../TechnicianInfoModal'
import PosStaffProfileDetailModal from './modals/PosStaffProfileDetailModal'
import {
  POS_TABLE_HEADER_CELL_CLASS,
  POS_TABLE_HEADER_ROW_CLASS,
  POS_TABLE_STICKY_ACTION_CELL_CLASS,
  POS_TABLE_STICKY_ACTION_HEADER_CLASS,
} from './posTableStyles'

const SEARCH_DEBOUNCE_MS = 350
const STAFF_TABLE_PAGE_SIZE = 10

interface StaffTableItem {
  linkId: string | null
  fullName: string
  displayName: string | null
  avatar: string | null
  position: string | null
  staffLevelName: string | null
  phone: string | null
  email: string | null
}

export default function PosStaffProfileView({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedLinkId = searchParams.get('staff') ?? undefined

  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [technicianInfoOpen, setTechnicianInfoOpen] = useState(false)
  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({
    pageSize: STAFF_TABLE_PAGE_SIZE,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword((prev) => {
        if (prev === searchInput) return prev
        resetPage()
        return searchInput
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput, resetPage])

  const staffListQuery = useMerchantStaff({ statusFilter: 'Active', pageNumber, pageSize, keyword })
  const staffItems = (staffListQuery.data?.items ?? []) as unknown as StaffTableItem[]
  const totalCount = staffListQuery.data?.totalCount ?? 0
  const totalPages = staffListQuery.data?.totalPages ?? 1

  const handleViewDetail = (linkId: string) => {
    setSearchParams({ staff: linkId })
  }

  const handleCloseModal = () => {
    searchParams.delete('staff')
    setSearchParams(searchParams)
  }

  const selectedStaff = staffItems.find((member) => member.linkId === selectedLinkId)
  const selectedStaffLabel = selectedStaff ? selectedStaff.displayName || selectedStaff.fullName : ''
  const selectedStaffAvatar = selectedStaff?.avatar ?? null
  const selectedStaffPosition = selectedStaff?.position ?? null
  const selectedStaffContact = selectedStaff ? selectedStaff.phone || selectedStaff.email : null

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 px-0.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {!embedded ? <h1 className="text-2xl font-bold leading-tight text-nexoraText">{t('dashboard.menu.pos_staff')}</h1> : null}
          <p className={`${embedded ? 'text-xs' : 'text-sm'} font-medium text-nexoraMuted`}>
            {t('components.dashboard.views.pos.PosStaffProfileView.description')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('components.dashboard.views.pos.PosStaffProfileView.searchPlaceholder')}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs font-medium text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
          <button
            type="button"
            onClick={() => setTechnicianInfoOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-nexoraBrand px-3.5 py-2 text-xs font-bold text-white hover:bg-nexoraBrandDark"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {t('components.dashboard.views.pos.PosStaffProfileView.addStaffButton')}
          </button>
        </div>
      </section>

      <div className="rounded-xl border border-nexoraBorder bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {staffListQuery.isLoading ? (
            <div className="p-5">
              <SkeletonList count={pageSize} showAvatar lines={2} />
            </div>
          ) : (
            <table className="w-full min-w-[720px] table-auto border-collapse text-left text-sm">
              <thead>
                <tr className={POS_TABLE_HEADER_ROW_CLASS}>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>
                    {t('components.dashboard.views.pos.PosStaffProfileView.tableColumnStaff')}
                  </th>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>
                    {t('components.dashboard.views.pos.PosStaffProfileView.tableColumnPosition')}
                  </th>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>
                    {t('components.dashboard.views.pos.PosStaffProfileView.tableColumnLevel')}
                  </th>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>
                    {t('components.dashboard.views.pos.PosStaffProfileView.tableColumnContact')}
                  </th>
                  <th className={`${POS_TABLE_HEADER_CELL_CLASS} ${POS_TABLE_STICKY_ACTION_HEADER_CLASS} text-center`}>
                    {t('components.dashboard.views.pos.PosStaffProfileView.tableColumnActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {staffListQuery.isFetching && staffItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-nexoraBrand" />
                    </td>
                  </tr>
                ) : staffItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12">
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <Users className="h-8 w-8 text-nexoraSubtle" />
                        <p className="text-sm font-extrabold text-nexoraMuted">
                          {t('components.dashboard.views.pos.PosStaffProfileView.pickerEmpty')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  staffItems.map((member, index) => {
                    const linkId = member.linkId ?? ''
                    const label = member.displayName || member.fullName
                    return (
                      <tr
                        key={linkId || index}
                        className="border-b border-nexoraRule last:border-0 hover:bg-slate-50/40 transition"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt=""
                                className="h-10 w-10 rounded-full border border-nexoraBorder object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-extrabold text-indigo-600">
                                {(label || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="font-extrabold text-nexoraText">{label}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-nexoraMuted">
                          {member.position || '—'}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-nexoraMuted">
                          {member.staffLevelName || '—'}
                        </td>
                        <td className={`px-5 py-4 text-xs font-semibold text-nexoraMuted ${member.phone ? 'whitespace-nowrap tabular-nums' : ''}`}>
                          {member.phone || member.email || '—'}
                        </td>
                        <td className={`${POS_TABLE_STICKY_ACTION_CELL_CLASS} px-5 py-4 text-center`}>
                          <div className="inline-flex w-max justify-center">
                            <button
                              type="button"
                              onClick={() => linkId && handleViewDetail(linkId)}
                              disabled={!linkId}
                              className="rounded-lg border border-nexoraBorder px-2.5 py-1 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-60"
                            >
                              {t('common.view')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalCount > 0 && totalPages > 1 ? (
          <Pagination
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={totalCount}
            hasNextPage={staffListQuery.data?.hasNextPage}
            hasPreviousPage={staffListQuery.data?.hasPreviousPage}
            onPageChange={setPage}
            isLoading={staffListQuery.isFetching}
            className="mt-0 border-t-0"
          />
        ) : null}
      </div>

      {selectedLinkId && (
        <PosStaffProfileDetailModal
          key={selectedLinkId}
          linkId={selectedLinkId}
          staffLabel={selectedStaffLabel}
          staffAvatar={selectedStaffAvatar}
          staffPosition={selectedStaffPosition}
          staffContact={selectedStaffContact}
          onClose={handleCloseModal}
        />
      )}

      {technicianInfoOpen ? (
        <TechnicianInfoModal
          posPayEnabled
          onClose={() => setTechnicianInfoOpen(false)}
        />
      ) : null}
    </div>
  )
}
