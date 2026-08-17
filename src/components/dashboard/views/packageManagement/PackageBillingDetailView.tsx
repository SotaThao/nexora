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
import { Link, useLocation, useOutletContext, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { usePurchaseHistoryItem } from '../../../../data/hooks/useSubscriptionPayments'
import {
  SubscriptionPaymentStatus,
  type SubscriptionPurchaseHistoryItem,
} from '../../../../data/repositories/subscriptionPayments'
import { getApiErrorCode } from '../../../../types/domain'
import {
  PACKAGE_BILLING_QUERY_PARAM,
  packageManagementPath,
} from '../../constants'
import { parseApiDateTime } from '../../utils'
import { BOOKING_HUB_EMPTY_CELL } from '../bookingHubFormatters'
import {
  PACKAGE_HISTORY_STATUS_LABEL_KEY,
  PackageHistoryDocumentKind,
  formatPackageBillingMoney,
  formatPackageHistoryPackageLabel,
  formatPackageHistoryTerm,
  isPackageHistorySubscriptionTerm,
  packageHistoryTransactionKey,
  resolvePackageHistoryDisplayAt,
} from '../plans/constants'
import {
  downloadPackageHistoryDocument,
  type PackageHistoryDocumentCopy,
  type PackageHistoryDocumentValues,
} from '../plans/packageHistoryDocuments'
import { PackageManagementTab } from './constants'
import './package-billing-detail.css'

const PLANS_TK = 'components.dashboard.views.BookingHubView.plans'
const TK = 'components.dashboard.views.PackageManagementView.billing'

export type PackageBillingLocationState = {
  purchaseHistoryItem?: SubscriptionPurchaseHistoryItem
}

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

export default function PackageBillingDetailView() {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const ctx = useOutletContext<LooseObject>()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const transactionId = searchParams.get(PACKAGE_BILLING_QUERY_PARAM.transaction)?.trim() || ''
  const locationItem = (location.state as PackageBillingLocationState | null)?.purchaseHistoryItem
  const {
    data: item,
    isLoading,
    isError,
    error,
  } = usePurchaseHistoryItem(transactionId || undefined, locationItem)
  const historyPath = packageManagementPath(PackageManagementTab.History)

  if (!transactionId || (!isLoading && !item)) {
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

  if (isLoading && !item) {
    return (
      <section className="package-billing-detail-page" aria-busy="true" aria-labelledby="billing-detail-title">
        <Link className="billing-detail-back" to={historyPath}>
          <ArrowLeft aria-hidden="true" />
          <span>{t(`${TK}.back`)}</span>
        </Link>
        <h1 className="sr-only" id="billing-detail-title">{t(`${TK}.pageTitle`)}</h1>
        <p className="billing-detail-date">{t(`${TK}.loading`)}</p>
      </section>
    )
  }

  if (isError && !item) {
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

  const record = item as SubscriptionPurchaseHistoryItem
  const paid = record.paymentStatus === SubscriptionPaymentStatus.Paid
  const overdue = record.paymentStatus === SubscriptionPaymentStatus.Failed
  const money = formatPackageBillingMoney(record.amount, record.currency)
  const packageLabel = formatPackageHistoryPackageLabel(record.planName)
  const termLabel = isPackageHistorySubscriptionTerm(record.periodInMonths)
    ? formatPackageHistoryTerm(record.periodInMonths, t, PLANS_TK)
    : BOOKING_HUB_EMPTY_CELL
  const transactionKey = packageHistoryTransactionKey(record) || BOOKING_HUB_EMPTY_CELL
  const statusLabel = t(`${PLANS_TK}.${PACKAGE_HISTORY_STATUS_LABEL_KEY[record.uiStatus]}`)
  const issuedAt = formatBillingDate(record.createdAt, currentLanguage)
  const paidAt = formatBillingDate(record.paidAt, currentLanguage, true)
  const dueAt = formatBillingDate(record.validUntil, currentLanguage)
  const billToName = displayOrEmpty(ctx?.profile?.businessName || ctx?.profile?.fullName)
  const billToEmail = displayOrEmpty(ctx?.profile?.email)
  const documentNumber = transactionKey
  const sellerName = t(`${TK}.sellerName`)
  const sellerEmail = t(`${TK}.sellerEmail`)

  const documentValues: PackageHistoryDocumentValues = {
    packageName: packageLabel,
    term: termLabel,
    transactionId: transactionKey,
    date: paid ? paidAt : issuedAt,
    status: statusLabel,
    amount: money,
  }

  const documentCopy = (kind: PackageHistoryDocumentKind): PackageHistoryDocumentCopy => ({
    documentLabel:
      kind === PackageHistoryDocumentKind.Invoice
        ? t(`${PLANS_TK}.packageHistoryDocumentInvoice`)
        : t(`${PLANS_TK}.packageHistoryDocumentReceipt`),
    sellerName,
    descriptionLabel: t(`${TK}.colDescription`),
    qtyLabel: t(`${TK}.colQty`),
    unitLabel: t(`${TK}.colUnit`),
    amountLabel: t(`${TK}.colAmount`),
    totalLabel: t(`${TK}.total`),
    packageLabel: t(`${PLANS_TK}.packageHistoryColPackage`),
    termLabel: t(`${PLANS_TK}.packageHistoryColTerm`),
    transactionLabel: t(`${PLANS_TK}.packageHistoryColTransaction`),
    dateLabel: t(`${PLANS_TK}.packageHistoryColDate`),
    statusLabel: t(`${PLANS_TK}.packageHistoryColStatus`),
  })

  const download = (kind: PackageHistoryDocumentKind) => {
    try {
      downloadPackageHistoryDocument(kind, documentCopy(kind), documentValues)
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

          {overdue ? (
            <div className="billing-detail-overdue-notice">
              <AlertTriangle aria-hidden="true" />
              <span>{t(`${TK}.overdueNotice`)}</span>
            </div>
          ) : null}

          <div
            className="billing-detail-actions"
            aria-label={t(paid ? `${TK}.documentActions` : `${TK}.invoiceActions`)}
          >
            <button
              className="billing-detail-action"
              type="button"
              onClick={() => download(PackageHistoryDocumentKind.Invoice)}
            >
              <Download aria-hidden="true" />
              <span>{t(`${PLANS_TK}.packageHistoryActionDownloadInvoice`)}</span>
            </button>
            {paid ? (
              <button
                className="billing-detail-action"
                type="button"
                onClick={() => download(PackageHistoryDocumentKind.Receipt)}
              >
                <Download aria-hidden="true" />
                <span>{t(`${PLANS_TK}.packageHistoryActionDownloadReceipt`)}</span>
              </button>
            ) : null}
            <button
              className="billing-detail-action"
              type="button"
              onClick={() =>
                showToast(
                  t(paid ? `${TK}.emailResent` : `${TK}.reminderSent`, {
                    email: billToEmail,
                  }),
                  'success',
                )
              }
            >
              {paid ? <Mail aria-hidden="true" /> : <Bell aria-hidden="true" />}
              <span>{t(paid ? `${TK}.resendEmail` : `${TK}.sendReminder`)}</span>
            </button>
            {!paid ? (
              <button
                className="billing-detail-action is-primary"
                type="button"
                onClick={() => showToast(t(`${TK}.payUnavailable`), 'info')}
              >
                <CreditCard aria-hidden="true" />
                <span>{t(`${TK}.payNow`)}</span>
              </button>
            ) : null}
          </div>

          <dl className="billing-detail-meta">
            {paid ? (
              <div>
                <dt>{t(`${TK}.receiptNumber`)}</dt>
                <dd>{documentNumber}</dd>
              </div>
            ) : null}
            <div>
              <dt>{t(`${TK}.invoiceNumber`)}</dt>
              <dd>{documentNumber}</dd>
            </div>
            {paid ? (
              <div>
                <dt>{t(`${TK}.paymentMethod`)}</dt>
                <dd>{BOOKING_HUB_EMPTY_CELL}</dd>
              </div>
            ) : (
              <div>
                <dt>{t(`${TK}.dateIssued`)}</dt>
                <dd>{issuedAt}</dd>
              </div>
            )}
            {paid ? (
              <div>
                <dt>{t(`${TK}.processor`)}</dt>
                <dd>{BOOKING_HUB_EMPTY_CELL}</dd>
              </div>
            ) : (
              <div>
                <dt>{t(`${TK}.dueDate`)}</dt>
                <dd>{dueAt}</dd>
              </div>
            )}
            <div>
              <dt>{t(`${TK}.transactionId`)}</dt>
              <dd>{transactionKey}</dd>
            </div>
            {paid ? (
              <div>
                <dt>{t(`${TK}.processorTransactionId`)}</dt>
                <dd>{displayOrEmpty(record.orderId)}</dd>
              </div>
            ) : (
              <div>
                <dt>{t(`${TK}.seller`)}</dt>
                <dd>
                  {sellerName}
                  <span>{sellerEmail}</span>
                </dd>
              </div>
            )}
            <div>
              <dt>{t(`${TK}.billTo`)}</dt>
              <dd>
                {billToName}
                <span>{billToEmail}</span>
              </dd>
            </div>
            {!paid ? (
              <div>
                <dt>{t(`${TK}.billingTerm`)}</dt>
                <dd>{termLabel}</dd>
              </div>
            ) : null}
          </dl>
        </article>

        <article className="billing-detail-document" aria-labelledby="billing-document-title">
          <div className="billing-detail-document-head">
            <div>
              <span className="billing-detail-document-kicker">
                {t(paid ? `${TK}.paidDocument` : `${TK}.unpaidDocument`)}
              </span>
              <h2 id="billing-document-title">
                {paid
                  ? t(`${TK}.receiptHeading`, { number: documentNumber })
                  : t(`${TK}.invoiceHeading`, { number: documentNumber })}
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
                  <td>{money}</td>
                  <td>
                    <strong>{money}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <dl className="billing-detail-totals">
            <div>
              <dt>{t(`${TK}.subtotal`)}</dt>
              <dd>{money}</dd>
            </div>
            <div>
              <dt>{t(`${TK}.totalExcludingTax`)}</dt>
              <dd>{money}</dd>
            </div>
            <div className="is-muted">
              <dt>{t(`${TK}.tax`)}</dt>
              <dd>{formatPackageBillingMoney(0, record.currency)}</dd>
            </div>
            <div className="is-total">
              <dt>{t(`${TK}.total`)}</dt>
              <dd>{money}</dd>
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
