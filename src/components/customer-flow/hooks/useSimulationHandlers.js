import { logger } from '../../../utils/logger'

/**
 * Creates simulation-mode payment and review handlers.
 * These replicate the original mock flow using local mutations.
 *
 * @param {Object} deps - Dependencies from the parent hook.
 * @param {Object} deps.addTransactionMutation - useAddTransaction mutation.
 * @param {Object} deps.addReviewMutation - useAddReview mutation.
 * @param {Object} deps.addNotificationMutation - useAddNotification mutation.
 * @param {Array} deps.selectedStaffMembers - Currently selected staff members.
 * @param {Object} deps.selectedTips - Map of staffId → tip selection.
 * @param {Object} deps.customTips - Map of staffId → custom tip amount.
 * @param {string} deps.techSlug - Tech slug from query string.
 * @param {Object|null} deps.setupData - Merchant setup data.
 * @param {Function} deps.setStep - Step navigation setter.
 * @param {Function} deps.setIsProcessing - Processing state setter.
 * @returns {Object} Simulation handler functions.
 */
export function createSimulationHandlers({
  addTransactionMutation,
  addReviewMutation,
  addNotificationMutation,
  selectedStaffMembers,
  selectedTips,
  customTips,
  techSlug,
  setupData,
  setStep,
  setIsProcessing,
}) {
  /**
   * Simulates a payment transaction with a delay.
   * @param {string} walletName - Payment method selected.
   */
  const simulatePay = (walletName) => {
    setIsProcessing(true)

    setTimeout(() => {
      setIsProcessing(false)
      setStep('success_payment')

      const baseTxIdNum = Math.floor(2000 + Math.random() * 1000)
      const touchpointStr = techSlug
        ? (techSlug.startsWith('staff/') ? 'Staff Personal QR' : (setupData?.touchPoints?.find(tp => techSlug.includes(tp.id))?.name || 'QR Touchpoint'))
        : 'Lobby Welcome QR'

      selectedStaffMembers.forEach((member, index) => {
        const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
        const amount = selTip === 'custom' ? Number(customTips[member.id]) || 0 : selTip
        const txId = selectedStaffMembers.length > 1
          ? `TX-${baseTxIdNum}-${index + 1}`
          : `TX-${baseTxIdNum}`

        const tx = {
          id: txId,
          dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
          amount: amount,
          staffName: member.nickname,
          staffId: member.id,
          touchpoint: touchpointStr,
          paymentMethod: walletName,
          status: 'Success'
        }

        addTransactionMutation.mutate(tx, {
          onError: (e) => logger.error('Error saving transaction', e)
        })

        const notification = {
          id: `noti-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'tip_success',
          title: `New Tip Received ($${Number(amount).toFixed(2)})`,
          message: `${member.nickname} received $${Number(amount).toFixed(2)} tip via ${walletName} at ${touchpointStr}.`,
          time: 'Just now',
          read: false,
          linkTab: 'reports'
        }

        addNotificationMutation.mutate(notification, {
          onError: (e) => logger.error('Error saving notification', e)
        })
      })
    }, 1800)
  }

  /**
   * Saves simulated review and notification for each staff member.
   * @param {number} rating - Star rating.
   * @param {string} cleanComment - Trimmed comment text.
   * @returns {'google_yelp_review'|'final_done'} Next step to navigate to.
   */
  const simulateReview = (rating, cleanComment) => {
    selectedStaffMembers.forEach((member, index) => {
      const review = {
        id: `R-${Date.now()}-${member.id}`,
        rating: rating,
        comment: cleanComment || (rating >= 4 ? 'Good service' : 'Needs improvement'),
        staffName: member.nickname,
        staffId: member.id,
        category: rating >= 4 ? 'Good (Google)' : 'Internal Feedback',
        date: new Date().toISOString().substring(0, 10)
      }

      addReviewMutation.mutate(review, {
        onError: (e) => logger.error('Error saving review', e)
      })

      const notification = {
        id: `noti-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
        type: rating >= 4 ? 'review_good' : 'feedback_alert',
        title: rating >= 4 ? `New Review (${rating}★)` : `New Internal Feedback (${rating}★)`,
        message: `Customer left feedback for ${member.nickname}: "${cleanComment.substring(0, 50)}${cleanComment.length > 50 ? '...' : ''}"`,
        time: 'Just now',
        read: false,
        linkTab: 'reviews'
      }

      addNotificationMutation.mutate(notification, {
        onError: (e) => logger.error('Error saving notification', e)
      })
    })

    return rating >= 4 ? 'google_yelp_review' : 'final_done'
  }

  return { simulatePay, simulateReview }
}
