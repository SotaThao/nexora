import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CreditCard,
  Download,
  FileText,
  HelpCircle,
  Mail,
  ReceiptText,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { useReceiptDetail } from '../../../../data/hooks/useSubscriptionPayments'
import subscriptionPaymentsRepository, {
  type SubscriptionReceiptDetail,
} from '../../../../data/repositories/subscriptionPayments'
import { getApiErrorCode } from '../../../../types/domain'
import {
  PACKAGE_BILLING_QUERY_PARAM,
  packageManagementPath,
} from '../../constants'
import { parseApiDateTime } from '../../utils'
import { BOOKING_HUB_EMPTY_CELL } from '../bookingHubFormatters'
import {
  formatPackageBillingMoney,
  formatPackageHistoryPackageLabel,
  formatPackageHistoryTerm,
  isPackageHistorySubscriptionTerm,
} from '../plans/constants'
import { PackageManagementTab } from './constants'
import './package-billing-detail.css'

const PLANS_TK = 'components.dashboard.views.BookingHubView.plans'
const TK = 'components.dashboard.views.PackageManagementView.billing'

function formatBillingDate(
  value: string | null | undefined,
  language: string,
  withTime = false,
): string {
  const date = parseApiDateTime(value)
  if (!date) return BOOKING_HUB_EMPTY_CELL
  const locale = String(language || 'en').toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US'
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

function displayOrEmpty(value: string | null | undefined): string {
  const trimmed = String(value ?? '').trim()
  return trimmed || BOOKING_HUB_EMPTY_CELL
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <span
      className={`billing-detail-skeleton ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}

function BillingDetailSkeleton({ historyPath, t }: { historyPath: string; t: (key: string) => string }) {
  return (
    <section className="package-billing-detail-page" aria-busy="true" aria-labelledby="billing-detail-title">
      <Link className="billing-detail-back" to={historyPath}>
        <ArrowLeft aria-hidden="true" />
        <span>{t(`${TK}.back`)}</span>
      </Link>
      <h1 className="sr-only" id="billing-detail-title">{t(`${TK}.pageTitle`)}</h1>

      <div className="package-billing-detail-root">
        <article className="billing-detail-summary">
          <div className="billing-detail-summary-main">
            <div>
              <SkeletonBlock className="skel-eyebrow" />
              <SkeletonBlock className="skel-amount" />
              <SkeletonBlock className="skel-date" />
            </div>
            <SkeletonBlock className="skel-icon" />
          </div>

          <div className="billing-detail-actions">
            <SkeletonBlock className="skel-btn" />
            <SkeletonBlock className="skel-btn" />
            <SkeletonBlock className="skel-btn" />
          </div>

          <dl className="billing-detail-meta">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i}>
                <dt><SkeletonBlock className="skel-meta-label" /></dt>
                <dd><SkeletonBlock className="skel-meta-value" /></dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="billing-detail-document">
          <div className="billing-detail-document-head">
            <div>
              <SkeletonBlock className="skel-kicker" />
              <SkeletonBlock className="skel-heading" />
            </div>
          </div>
          <div className="billing-detail-table-wrap">
            <table className="billing-detail-table">
              <thead>
                <tr>
                  <th><SkeletonBlock className="skel-th" /></th>
                  <th><SkeletonBlock className="skel-th-short" /></th>
                  <th><SkeletonBlock className="skel-th-short" /></th>
                  <th><SkeletonBlock className="skel-th-short" /></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><SkeletonBlock className="skel-td" /></td>
                  <td><SkeletonBlock className="skel-td-short" /></td>
                  <td><SkeletonBlock className="skel-td-short" /></td>
                  <td><SkeletonBlock className="skel-td-short" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <dl className="billing-detail-totals">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i}>
                <dt><SkeletonBlock className="skel-total-label" /></dt>
                <dd><SkeletonBlock className="skel-total-value" /></dd>
              </div>
            ))}
          </dl>
        </article>
      </div>
    </section>
  )
}

export default function PackageBillingDetailView() {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [searchParams] = useSearchParams()
  const transactionId = searchParams.get(PACKAGE_BILLING_QUERY_PARAM.transaction)?.trim() || ''
  const {
    data: receipt,
    isLoading,
    isError,
    error,
  } = useReceiptDetail(transactionId || undefined)
  const historyPath = packageManagementPath(PackageManagementTab.History)

  if (!transactionId || (!isLoading && !receipt)) {
    return (
      <section className="package-billing-detail-page" aria-labelledby="billing-detail-title">
        <Link className="billing-detail-back" to={historyPath}>
          <ArrowLeft aria-hidden="true" />
          <span>{t(`${TK}.back`)}</span>
        </Link>
        <h1 className="sr-only" id="billing-detail-title">{t(`${TK}.pageTitle`)}</h1>
        <article className="billing-detail-empty" role="status">
          <span className="billing-detail-empty-icon">
            <HelpCircle aria-hidden="true" />
          </span>
          <h2>{t(`${TK}.notFoundTitle`)}</h2>
          <p>{t(`${TK}.notFoundBody`)}</p>
          <Link className="billing-detail-action is-primary" to={historyPath}>
            {t(`${TK}.back`)}
          </Link>
        </article>
      </section>
    )
  }

  if (isLoading) {
    return <BillingDetailSkeleton historyPath={historyPath} t={t} />
  }

  if (isError && !receipt) {
    return (
      <section className="package-billing-detail-page" aria-labelledby="billing-detail-title">
        <Link className="billing-detail-back" to={historyPath}>
          <ArrowLeft aria-hidden="true" />
          <span>{t(`${TK}.back`)}</span>
        </Link>
        <h1 className="sr-only" id="billing-detail-title">{t(`${TK}.pageTitle`)}</h1>
        <article className="billing-detail-empty" role="alert">
          <h2>{t(getErrorI18nKey(getApiErrorCode(error)))}</h2>
          <Link className="billing-detail-action is-primary" to={historyPath}>
            {t(`${TK}.back`)}
          </Link>
        </article>
      </section>
    )
  }

  const record = receipt as SubscriptionReceiptDetail
  const paid = Boolean(record.paidAt)
  const money = formatPackageBillingMoney(record.amountPaid || record.total, record.currency)
  const subtotal = formatPackageBillingMoney(record.subtotal, record.currency)
  const taxMoney = formatPackageBillingMoney(record.tax, record.currency)
  const totalMoney = formatPackageBillingMoney(record.total, record.currency)
  const packageLabel = formatPackageHistoryPackageLabel(record.planName)
  const termLabel = isPackageHistorySubscriptionTerm(record.periodInMonths)
    ? formatPackageHistoryTerm(record.periodInMonths, t, PLANS_TK)
    : BOOKING_HUB_EMPTY_CELL
  const issuedAt = formatBillingDate(record.issuedAt, currentLanguage)
  const paidAt = formatBillingDate(record.paidAt, currentLanguage, true)
  const dueAt = formatBillingDate(record.issuedAt, currentLanguage)
  const sellerName = displayOrEmpty(record.sellerName)
  const sellerEmail = displayOrEmpty(record.sellerEmail)
  const sellerPhone = displayOrEmpty(record.sellerPhone)
  const billToName = displayOrEmpty(record.billToName)
  const billToEmail = displayOrEmpty(record.billToEmail)
  const invoiceNumber = displayOrEmpty(record.invoiceNumber)
  const receiptNumber = displayOrEmpty(record.receiptNumber)
  const paymentMethodLabel = displayOrEmpty(record.paymentMethodLabel)
  const processorName = displayOrEmpty(record.processorName)
  const providerTransactionId = displayOrEmpty(record.providerTransactionId)
  const transactionRef = displayOrEmpty(record.referenceId || record.orderId)

  const sendEmail = async () => {
    try {
      await subscriptionPaymentsRepository.sendReceiptEmail(record.orderId)
      showToast(
        t(paid ? `${TK}.emailResent` : `${TK}.reminderSent`, { email: billToEmail }),
        'success',
      )
    } catch {
      showToast(t(`${PLANS_TK}.packageHistoryDocumentDownloadFailed`), 'error')
    }
  }

  const downloadPdf = async (type: 'Invoice' | 'Receipt') => {
    try {
      const { blob, filename } = await subscriptionPaymentsRepository.downloadReceiptPdf(
        record.orderId,
        type,
      )
      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = href
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(href)
      showToast(t(`${PLANS_TK}.packageHistoryDocumentDownloaded`), 'success')
    } catch {
      showToast(t(`${PLANS_TK}.packageHistoryDocumentDownloadFailed`), 'error')
    }
  }

  return (
    <section className="package-billing-detail-page" aria-labelledby="billing-detail-title">
      <Link className="billing-detail-back" to={historyPath}>
        <ArrowLeft aria-hidden="true" />
        <span>{t(`${TK}.back`)}</span>
      </Link>
      <h1 className="sr-only" id="billing-detail-title">{t(`${TK}.pageTitle`)}</h1>

      <div className="package-billing-detail-root">
        <article className="billing-detail-summary" aria-labelledby="billing-summary-title">
          <div className="billing-detail-summary-main">
            <div>
              <p className="billing-detail-eyebrow">
                {t(paid ? `${TK}.receiptFrom` : `${TK}.invoiceFrom`, { seller: sellerName })}
              </p>
              <h2 id="billing-summary-title">
                {paid ? money : t(`${TK}.amountDue`, { amount: money })}
              </h2>
              <p className="billing-detail-date">
                {paid
                  ? t(`${TK}.paidOn`, { date: paidAt })
                  : t(`${TK}.dueOn`, { date: dueAt })}
              </p>
            </div>
            <span className="billing-detail-document-icon" aria-hidden="true">
              {paid ? <ReceiptText /> : <FileText />}
            </span>
          </div>

          {paid ? (
            <div className="billing-detail-actions" aria-label={t(`${TK}.documentActions`)}>
              <button
                className="billing-detail-action"
                type="button"
                onClick={() => void downloadPdf('Invoice')}
              >
                <Download aria-hidden="true" />
                <span>{t(`${PLANS_TK}.packageHistoryActionDownloadInvoice`)}</span>
              </button>
              <button
                className="billing-detail-action"
                type="button"
                onClick={() => void downloadPdf('Receipt')}
              >
                <Download aria-hidden="true" />
                <span>{t(`${PLANS_TK}.packageHistoryActionDownloadReceipt`)}</span>
              </button>
              <button
                className="billing-detail-action"
                type="button"
                onClick={() => void sendEmail()}
              >
                <Mail aria-hidden="true" />
                <span>{t(`${TK}.resendEmail`)}</span>
              </button>
            </div>
          ) : (
            <>
              <div className="billing-detail-overdue-notice">
                <AlertTriangle aria-hidden="true" />
                <span>{t(`${TK}.overdueNotice`)}</span>
              </div>
              <div className="billing-detail-actions" aria-label={t(`${TK}.invoiceActions`)}>
                <button
                  className="billing-detail-action"
                  type="button"
                  onClick={() => void downloadPdf('Invoice')}
                >
                  <Download aria-hidden="true" />
                  <span>{t(`${PLANS_TK}.packageHistoryActionDownloadInvoice`)}</span>
                </button>
                <button
                  className="billing-detail-action"
                  type="button"
                  onClick={() => void sendEmail()}
                >
                  <Bell aria-hidden="true" />
                  <span>{t(`${TK}.sendReminder`)}</span>
                </button>
                <button
                  className="billing-detail-action is-primary"
                  type="button"
                  onClick={() => showToast(t(`${TK}.payUnavailable`), 'info')}
                >
                  <CreditCard aria-hidden="true" />
                  <span>{t(`${TK}.payNow`)}</span>
                </button>
              </div>
            </>
          )}

          {paid ? (
            <dl className="billing-detail-meta">
              <div>
                <dt>{t(`${TK}.receiptNumber`)}</dt>
                <dd>{receiptNumber}</dd>
              </div>
              <div>
                <dt>{t(`${TK}.invoiceNumber`)}</dt>
                <dd>{invoiceNumber}</dd>
              </div>
              <div>
                <dt>{t(`${TK}.paymentMethod`)}</dt>
                <dd>{paymentMethodLabel}</dd>
              </div>
              <div>
                <dt>{t(`${TK}.processor`)}</dt>
                <dd>{processorName}</dd>
              </div>
              <div>
                <dt>{t(`${TK}.transactionId`)}</dt>
                <dd>{transactionRef}</dd>
              </div>
              <div>
                <dt>{t(`${TK}.processorTransactionId`)}</dt>
                <dd>{providerTransactionId}</dd>
              </div>
              <div>
                <dt>{t(`${TK}.billTo`)}</dt>
                <dd>
                  {billToName}
                  <span>{billToEmail}</span>
                </dd>
              </div>
            </dl>
          ) : (
            <dl className="billing-detail-meta">
              <div>
                <dt>{t(`${TK}.invoiceNumber`)}</dt>
                <dd>{invoiceNumber}</dd>
              </div>
              <div>
                <dt>{t(`${TK}.dateIssued`)}</dt>
                <dd>{issuedAt}</dd>
              </div>
              <div>
                <dt>{t(`${TK}.dueDate`)}</dt>
                <dd>{dueAt}</dd>
              </div>
              <div>
                <dt>{t(`${TK}.seller`)}</dt>
                <dd>
                  {sellerName}
                  <span>{sellerPhone}</span>
                  <span>{sellerEmail}</span>
                </dd>
              </div>
              <div>
                <dt>{t(`${TK}.billTo`)}</dt>
                <dd>
                  {billToName}
                  <span>{billToEmail}</span>
                </dd>
              </div>
              <div>
                <dt>{t(`${TK}.billingTerm`)}</dt>
                <dd>{termLabel}</dd>
              </div>
            </dl>
          )}
        </article>

        <article className="billing-detail-document" aria-labelledby="billing-document-title">
          <div className="billing-detail-document-head">
            <div>
              <span className="billing-detail-document-kicker">
                {t(paid ? `${TK}.paidDocument` : `${TK}.unpaidDocument`)}
              </span>
              <h2 id="billing-document-title">
                {paid
                  ? t(`${TK}.receiptHeading`, { number: receiptNumber })
                  : t(`${TK}.invoiceHeading`, { number: invoiceNumber })}
              </h2>
            </div>
          </div>

          <div className="billing-detail-table-wrap">
            <table className="billing-detail-table">
              <caption className="sr-only">{t(`${TK}.lineItemsCaption`)}</caption>
              <thead>
                <tr>
                  <th scope="col">{t(`${TK}.colDescription`)}</th>
                  <th scope="col">{t(`${TK}.colQty`)}</th>
                  <th scope="col">{t(`${TK}.colUnit`)}</th>
                  <th scope="col">{t(`${TK}.colAmount`)}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{packageLabel}</strong>
                    <span>{termLabel}</span>
                  </td>
                  <td>1</td>
                  <td>{formatPackageBillingMoney(record.amount, record.currency)}</td>
                  <td>
                    <strong>{formatPackageBillingMoney(record.amount, record.currency)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <dl className="billing-detail-totals">
            <div>
              <dt>{t(`${TK}.subtotal`)}</dt>
              <dd>{subtotal}</dd>
            </div>
            <div>
              <dt>{t(`${TK}.totalExcludingTax`)}</dt>
              <dd>{subtotal}</dd>
            </div>
            <div className="is-muted">
              <dt>{t(`${TK}.tax`)}</dt>
              <dd>{taxMoney}</dd>
            </div>
            <div className="is-total">
              <dt>{t(`${TK}.total`)}</dt>
              <dd>{totalMoney}</dd>
            </div>
            <div className="is-final">
              <dt>{t(paid ? `${TK}.amountPaid` : `${TK}.amountDueLabel`)}</dt>
              <dd>{money}</dd>
            </div>
          </dl>

          {paid ? (
            <p className="billing-detail-support">
              {t(`${TK}.support`)}{' '}
              <a href={`mailto:${sellerEmail}`}>{sellerEmail}</a>.
            </p>
          ) : null}
        </article>
      </div>
    </section>
  )
}
