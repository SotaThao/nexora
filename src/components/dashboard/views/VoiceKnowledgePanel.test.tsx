import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VoiceKnowledgeStatus as Status } from '@/constants/voiceKnowledge'
import { useVoiceKnowledge } from '@/data/hooks/useVoiceKnowledge'
import type { VoiceKnowledgeDocument } from '@/data/repositories/voiceKnowledge'
import { VoiceKnowledgePanel } from './VoiceKnowledgePanel'

vi.mock('@/data/hooks/useVoiceKnowledge', () => ({
  useVoiceKnowledge: vi.fn(),
  useVoiceUnanswered: vi.fn(),
}))

const activeDocument: VoiceKnowledgeDocument = {
  id: 'document-active',
  fileName: 'Salon policies.pdf',
  fileExtension: '.pdf',
  contentType: 'application/pdf',
  fileSizeBytes: 1434,
  condensedContent: JSON.stringify({
    facts: [{ question: 'What is the cancellation policy?', answer: 'Please give 24 hours notice.' }],
  }),
  status: Status.Active,
  injectionFlags: [],
  failureReasonCode: null,
  processedAt: '2026-09-12T15:30:00.000Z',
  createdAt: '2026-09-12T14:00:00.000Z',
  isManuallyEdited: false,
  isOverBudget: false,
  regenerateCount: 0,
  lastRegeneratedAt: null,
  approvedAt: '2026-09-12T15:30:00.000Z',
  isEditedAfterApproval: false,
}

const upload = vi.fn()
const download = vi.fn()
const content = vi.fn()
const status = vi.fn()
const regenerate = vi.fn()
const deleteDocument = vi.fn()
const mutateAsync = vi.fn((action: () => Promise<unknown>) => action())

type QueryOverrides = Partial<{
  data: unknown
  error: unknown
  isPending: boolean
  isError: boolean
  isFetching: boolean
  mutationPending: boolean
}>

function renderPanel(
  items: VoiceKnowledgeDocument[] = [activeDocument],
  slotsUsed = items.length,
  overrides: QueryOverrides = {},
) {
  const data = {
    items,
    pageNumber: 1,
    totalPages: 1,
    totalCount: items.length,
    hasPreviousPage: false,
    hasNextPage: false,
    slotsUsed,
    activeCharacters: 1200,
  }
  vi.mocked(useVoiceKnowledge).mockReturnValue({
    query: {
      data: overrides.data === undefined ? data : overrides.data,
      error: overrides.error ?? null,
      isPending: overrides.isPending ?? false,
      isError: overrides.isError ?? false,
      isFetching: overrides.isFetching ?? false,
      refetch: vi.fn(),
    },
    mutation: {
      mutateAsync,
      isPending: overrides.mutationPending ?? false,
    },
    actions: {
      list: vi.fn(),
      upload,
      download,
      content,
      status,
      regenerate,
      delete: deleteDocument,
      unanswered: vi.fn(),
    },
  } as unknown as ReturnType<typeof useVoiceKnowledge>)

  return render(<VoiceKnowledgePanel />)
}

describe('VoiceKnowledgePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    upload.mockResolvedValue({})
    download.mockResolvedValue(new Blob(['file']))
    content.mockResolvedValue({})
    status.mockResolvedValue({})
    regenerate.mockResolvedValue({})
    deleteDocument.mockResolvedValue({})
    mutateAsync.mockImplementation((action: () => Promise<unknown>) => action())
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:knowledge-file'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('renders the approved knowledge library structure and document table', () => {
    renderPanel()

    expect(screen.getByRole('heading', { name: 'Knowledge files' })).toBeInTheDocument()
    expect(screen.getByText("Your salon's reference library")).toBeInTheDocument()
    expect(screen.getByText('1 of 5 files')).toBeInTheDocument()
    expect(screen.getByText('4 slots available')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Uploaded files' })).toBeInTheDocument()
    expect(screen.getByText('Salon policies.pdf')).toBeInTheDocument()
    expect(screen.getByText('Sep 12, 2026')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What to upload' })).toBeInTheDocument()
  })

  it('uploads one selected file through the existing action', async () => {
    renderPanel([])
    const file = new File(['policy'], 'policy.pdf', { type: 'application/pdf' })

    fireEvent.change(screen.getByLabelText('Upload knowledge file'), {
      target: { files: [file] },
    })

    await waitFor(() => expect(upload).toHaveBeenCalledWith(file))
    expect(upload).toHaveBeenCalledTimes(1)
  })

  it('uploads only the first valid dropped file', async () => {
    renderPanel([])
    const first = new File(['policy'], 'policy.pdf', { type: 'application/pdf' })
    const second = new File(['faq'], 'faq.txt', { type: 'text/plain' })

    fireEvent.drop(screen.getByRole('button', { name: 'Drop a file here or choose a file' }), {
      dataTransfer: { files: [first, second] },
    })

    await waitFor(() => expect(upload).toHaveBeenCalledWith(first))
    expect(upload).toHaveBeenCalledTimes(1)
  })

  it('rejects an invalid file before calling upload', () => {
    renderPanel([])
    const file = new File(['image'], 'salon.png', { type: 'image/png' })

    fireEvent.change(screen.getByLabelText('Upload knowledge file'), {
      target: { files: [file] },
    })

    expect(upload).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/TXT, DOCX, or PDF/i)
  })

  it.each([
    ['an empty file', new File([], 'empty.txt', { type: 'text/plain' })],
    [
      'a file over 5 MB',
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.pdf', {
        type: 'application/pdf',
      }),
    ],
  ])('rejects %s before calling upload', (_name, file) => {
    renderPanel([])

    fireEvent.change(screen.getByLabelText('Upload knowledge file'), {
      target: { files: [file] },
    })

    expect(upload).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/no larger than 5 MB/i)
  })

  it('locks upload when all five slots are used', () => {
    renderPanel([activeDocument], 5)

    expect(screen.getByLabelText('Upload knowledge file')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Drop a file here or choose a file' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(screen.getByText(/5-document limit has been reached/i)).toBeInTheDocument()
  })

  it('keeps download visible and moves valid document actions into the overflow menu', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Download Salon policies.pdf' }))
    await waitFor(() => expect(download).toHaveBeenCalledWith(activeDocument.id))

    expect(screen.queryByRole('button', { name: 'Review / edit answers' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Salon policies.pdf' }))

    const menu = screen.getByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: 'Review / edit answers' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Regenerate' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Disable' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()
  })

  it('opens the existing fact editor directly below the selected document', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Salon policies.pdf' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Review / edit answers' }))

    const editor = screen.getByRole('region', { name: 'Edit Salon policies.pdf' })
    expect(within(editor).getByDisplayValue('What is the cancellation policy?')).toBeInTheDocument()
    expect(within(editor).getByDisplayValue('Please give 24 hours notice.')).toBeInTheDocument()
    expect(within(editor).getByRole('button', { name: 'Save answers' })).toBeEnabled()
  })

  it('keeps edit disabled while another document mutation is pending', () => {
    renderPanel([activeDocument], 1, { mutationPending: true })

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Salon policies.pdf' }))

    expect(screen.getByRole('menuitem', { name: 'Review / edit answers' })).toBeDisabled()
  })

  it('moves focus through the action menu and restores it on Escape', () => {
    renderPanel()
    const trigger = screen.getByRole('button', { name: 'Actions for Salon policies.pdf' })

    fireEvent.click(trigger)
    const edit = screen.getByRole('menuitem', { name: 'Review / edit answers' })
    const regenerateItem = screen.getByRole('menuitem', { name: 'Regenerate' })
    expect(edit).toHaveFocus()

    fireEvent.keyDown(edit, { key: 'ArrowDown' })
    expect(regenerateItem).toHaveFocus()

    fireEvent.keyDown(regenerateItem, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('preserves regenerate, held activation, disable, and delete confirmations', async () => {
    const heldDocument = {
      ...activeDocument,
      id: 'document-held',
      status: Status.HeldForReview,
      isManuallyEdited: true,
      injectionFlags: ['ignore_previous_instructions'],
      isEditedAfterApproval: true,
      isOverBudget: true,
    }
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPanel([heldDocument])

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Salon policies.pdf' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Regenerate' }))
    expect(confirm).toHaveBeenCalledWith(
      'Regenerate this document? Your manual edits will be overwritten.',
    )
    await waitFor(() => expect(regenerate).toHaveBeenCalledWith(heldDocument.id, true))

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Salon policies.pdf' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Activate anyway' }))
    expect(confirm).toHaveBeenCalledWith(
      'Review all answers and flagged patterns first. Activate this document for calls anyway?',
    )
    await waitFor(() => expect(status).toHaveBeenCalledWith(heldDocument.id, Status.Active))

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Salon policies.pdf' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disable' }))
    await waitFor(() => expect(status).toHaveBeenCalledWith(heldDocument.id, Status.Disabled))

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Salon policies.pdf' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(confirm).toHaveBeenCalledWith(
      'Delete this document and its original file? This cannot be undone.',
    )
    await waitFor(() => expect(deleteDocument).toHaveBeenCalledWith(heldDocument.id))
  })

  it('requires explicit approval when re-enabling a disabled document that still has injection flags', async () => {
    const flaggedDisabledDocument = {
      ...activeDocument,
      status: Status.Disabled,
      injectionFlags: ['ignore_previous_instructions'],
    }
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    renderPanel([flaggedDisabledDocument])

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Salon policies.pdf' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Enable' }))
    expect(confirm).toHaveBeenCalledWith(
      'Review all answers and flagged patterns first. Activate this document for calls anyway?',
    )
    expect(status).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Salon policies.pdf' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Enable' }))
    await waitFor(() => expect(status).toHaveBeenCalledWith(flaggedDisabledDocument.id, Status.Active))
  })

  it('renders status warnings and limits processing actions to delete', () => {
    const processingDocument = {
      ...activeDocument,
      id: 'document-processing',
      status: Status.Processing,
      isManuallyEdited: true,
      isEditedAfterApproval: true,
      isOverBudget: true,
      injectionFlags: ['suspicious_prompt'],
    }
    renderPanel([processingDocument])

    expect(screen.getByText('Manually edited')).toBeInTheDocument()
    expect(screen.getByText(/edited after approval/i)).toBeInTheDocument()
    expect(screen.getByText(/over knowledge limit/i)).toBeInTheDocument()
    expect(screen.getByText(/suspicious_prompt/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Salon policies.pdf' }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()
    expect(within(menu).queryByRole('menuitem', { name: 'Regenerate' })).not.toBeInTheDocument()
    expect(within(menu).queryByRole('menuitem', { name: 'Review / edit answers' })).not.toBeInTheDocument()
    expect(within(menu).queryByRole('menuitem', { name: 'Disable' })).not.toBeInTheDocument()
  })

  it('keeps pagination wired to the existing paged query', () => {
    renderPanel([activeDocument], 1, {
      data: {
        items: [activeDocument],
        pageNumber: 2,
        totalPages: 3,
        totalCount: 7,
        hasPreviousPage: true,
        hasNextPage: true,
        slotsUsed: 1,
        activeCharacters: 1200,
      },
    })

    expect(screen.getByRole('navigation', { name: 'Document pages' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('Page 2 of 3')
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('keeps loading, empty, error, and locked states accessible', () => {
    const loading = renderPanel([], 0, { isPending: true, data: null })
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
    loading.unmount()

    const empty = renderPanel([], 0)
    expect(screen.getByText('No knowledge documents yet.')).toBeInTheDocument()
    empty.unmount()

    const error = renderPanel([], 0, {
      data: null,
      error: new Error('failed'),
      isError: true,
    })
    expect(screen.getByRole('alert')).toHaveTextContent(/Unable to complete/i)
    error.unmount()

    renderPanel([], 0, { data: null, error: { status: 403 }, isError: true })
    expect(screen.getByRole('alert')).toHaveTextContent(/upgrade/i)
  })
})
