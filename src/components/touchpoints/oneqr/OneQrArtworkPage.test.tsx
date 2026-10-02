import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTranslation } from '../../../contexts/LanguageContext'
import { APP_LANG_STORAGE_KEY } from '../../../utils/appLanguage'
import { ONEQR_INDUSTRIES } from './oneQrArtworkCatalog'
import en from '../../../locales/en.json'
import vietnamese from '../../../locales/vi.json'
import { OneQrArtworkEditor } from './OneQrArtworkPage'
import type { CheckInPrintDocument, PrintAssets } from '../../dashboard/views/pos/checkinPrint/checkInPrintTypes'

const mocks = vi.hoisted(() => ({
  render: vi.fn(),
  print: vi.fn(),
  png: vi.fn(),
  pdf: vi.fn(),
  qr: vi.fn(),
}))
vi.mock('../../../data/hooks/useMerchantSetup', () => ({
  useBusinessHours: () => ({ data: [], isPending: false, isError: false }),
  useMerchantSetup: () => ({ data: undefined }),
}))
vi.mock('../../dashboard/views/pos/checkinPrint/renderCheckInBackgroundCanvas', () => ({ renderCheckInBackgroundCanvas: mocks.render }))
vi.mock('../../dashboard/views/pos/checkinPrint/useCheckInPrintAssets', () => ({
  useCheckInPrintAssets: () => ({ status: 'ready', assets: null, retry: vi.fn() }),
}))
vi.mock('../../dashboard/views/pos/checkinPrint/useCheckInTemplatePrint', () => ({
  useCheckInTemplatePrint: () => ({ job: null, print: mocks.print, cancel: vi.fn() }),
}))
vi.mock('../../dashboard/views/pos/checkinPrint/CheckInPrintSurface', () => ({ CheckInPrintSurface: () => null }))
vi.mock('../../dashboard/views/pos/checkinPrint/exportCheckInPrintPng', () => ({ createCheckInPrintPng: mocks.png }))
vi.mock('../../dashboard/views/pos/checkinPrint/exportCheckInPrintPdf', () => ({ createCheckInPrintPdf: mocks.pdf }))
vi.mock('../../../utils/qrUtils', () => ({ downloadQrCode: mocks.qr, QR_IMAGE_SIZES: { print: 1200 } }))

const url = 'https://nexoratouch.com/o/example?as=customer'
let heldImage: string | null
let releaseImage: (() => void) | undefined
let anchorClick: ReturnType<typeof vi.spyOn>

class TestImage {
  src = ''
  crossOrigin = ''
  decode() {
    if (heldImage && this.src.includes(heldImage)) return new Promise<void>(resolve => { releaseImage = resolve })
    return Promise.resolve()
  }
}

function Harness() {
  const { setLanguage } = useTranslation()
  return <>
    <button onClick={() => setLanguage('vi')}>Use Vietnamese system language</button>
    <button onClick={() => setLanguage('en')}>Use English system language</button>
    <OneQrArtworkEditor url={url} fileSlug="oneqr-example-customer" />
  </>
}

function renderEditor() {
  return render(<Harness />)
}

function selectIndustry(id: string) {
  fireEvent.change(screen.getByRole('combobox'), { target: { value: id } })
}

async function expectReady(language: 'en' | 'vi') {
  await waitFor(() => expect(screen.getByRole('button', { name: language === 'en' ? 'Download PNG' : 'Tải PNG' })).toBeEnabled())
}

function composedSource(assets: PrintAssets) {
  return atob(assets.images.poster.objectUrl.split(',')[1])
}

beforeEach(() => {
  localStorage.setItem(APP_LANG_STORAGE_KEY, 'en')
  heldImage = null
  releaseImage = undefined
  vi.clearAllMocks()
  vi.stubGlobal('Image', TestImage)
  vi.stubGlobal('fetch', vi.fn(async () => ({ arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer })))
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:unit-export'), revokeObjectURL: vi.fn() }))
  anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  mocks.render.mockImplementation(async ({ background }: { background: TestImage }) => ({ dataUrl: 'data:image/png;base64,' + btoa(background.src) }))
  mocks.png.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
  mocks.pdf.mockResolvedValue(new Uint8Array([1, 2, 3]))
})

afterEach(() => {
  cleanup()
  anchorClick.mockRestore()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('OneQR artwork editor using the system language', () => {
  it('shows 108 concepts, including the eight original Nail templates', async () => {
    renderEditor()
    await expectReady('en')
    expect(screen.getAllByRole('radio')).toHaveLength(108)
    for (const industry of ONEQR_INDUSTRIES) {
      expect(screen.getByRole('option', { name: en.oneqr.artwork.industries[industry] })).toBeInTheDocument()
      selectIndustry(industry)
      expect(screen.getByRole('combobox')).toHaveValue(industry)
      expect(screen.getAllByRole('radio')).toHaveLength(industry === 'food' ? 4 : 8)
      expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1)
      await expectReady('en')
    }
    selectIndustry('all')
    expect(screen.getAllByRole('radio')).toHaveLength(108)
  })

  it('selects and exports an original Nail design with its original asset name', async () => {
    renderEditor()
    selectIndustry('nail')
    expect(screen.getByText(en.oneqr.artwork.legacyFixed)).toBeInTheDocument()
    const choices = screen.getAllByRole('radio')
    expect(choices.map(choice => choice.getAttribute('aria-label'))).toEqual(
      ['01', '02', '03', '04', '05', '06', '07', '08'].map(id => en.oneqr.artwork.templates[id as keyof typeof en.oneqr.artwork.templates]),
    )
    fireEvent.click(screen.getByRole('radio', { name: 'Ocean Breeze' }))
    await expectReady('en')
    expect(mocks.render.mock.lastCall?.[0].background.src).toContain('/08.webp?v=2')
    fireEvent.click(screen.getByRole('button', { name: 'Download PNG' }))
    await waitFor(() => expect(anchorClick).toHaveBeenCalledTimes(1))
    expect((anchorClick.mock.instances[0] as HTMLAnchorElement).download).toBe('oneqr-example-customer-08.png')
    fireEvent.click(screen.getByRole('button', { name: 'Use Vietnamese system language' }))
    expect(screen.getByText(vietnamese.oneqr.artwork.legacyFixed)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: vietnamese.oneqr.artwork.templates['08'] })).toHaveAttribute('aria-checked', 'true')
    await expectReady('vi')
    expect(mocks.render.mock.lastCall?.[0].background.src).toContain('/08.webp?v=2')
  })

  it('keeps the chosen industry and concept when the global language changes', async () => {
    renderEditor()
    selectIndustry('travel')
    fireEvent.click(screen.getByRole('radio', { name: en.oneqr.artwork.templates['travel-atelier'] }))
    await expectReady('en')
    fireEvent.click(screen.getByRole('button', { name: 'Use Vietnamese system language' }))
    expect(screen.getByRole('combobox')).toHaveValue('travel')
    expect(screen.getAllByRole('radio')).toHaveLength(8)
    expect(screen.getByRole('radio', { name: vietnamese.oneqr.artwork.templates['travel-atelier'] })).toHaveAttribute('aria-checked', 'true')
    await expectReady('vi')
    expect(mocks.render.mock.lastCall?.[0].background.src).toContain('travel-atelier-vi.webp')
    fireEvent.click(screen.getByRole('button', { name: 'Use English system language' }))
    await expectReady('en')
    expect(screen.getByRole('radio', { name: en.oneqr.artwork.templates['travel-atelier'] })).toHaveAttribute('aria-checked', 'true')
  })

  it('starts with Vietnamese image variants when the app is already Vietnamese', async () => {
    localStorage.setItem(APP_LANG_STORAGE_KEY, 'vi')
    renderEditor()
    await expectReady('vi')
    expect(screen.getAllByRole('radio')).toHaveLength(108)
    expect(mocks.render.mock.lastCall?.[0].background.src).toContain('beauty-nail-vi.webp')
    const gallery = screen.getByRole('radiogroup')
    const images = within(gallery).getAllByRole('presentation')
    expect(images).toHaveLength(108)
    for (const image of images.slice(0, 100)) expect(image.getAttribute('src')).toContain('-vi-thumb.webp')
    for (const image of images.slice(100)) expect(image.getAttribute('src')).toMatch(/\/0[1-8]-thumb\.webp\?v=2$/)
  })

  it('does not expose the previous language preview or export while the new image is loading', async () => {
    renderEditor()
    await expectReady('en')
    expect(screen.getByRole('img', { name: url })).toBeInTheDocument()
    heldImage = 'beauty-nail-vi.webp'
    fireEvent.click(screen.getByRole('button', { name: 'Use Vietnamese system language' }))
    expect(screen.queryByRole('img', { name: url })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tải PNG' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Tải PDF' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'In' })).toBeDisabled()
    await waitFor(() => expect(releaseImage).toBeDefined())
    heldImage = null
    await act(async () => releaseImage?.())
    await expectReady('vi')
    expect(screen.getByRole('img', { name: url })).toBeInTheDocument()
  })

  it('discards a slow obsolete language image after a rapid VI to EN switch', async () => {
    renderEditor()
    await expectReady('en')
    heldImage = 'beauty-nail-vi.webp'
    fireEvent.click(screen.getByRole('button', { name: 'Use Vietnamese system language' }))
    await waitFor(() => expect(releaseImage).toBeDefined())
    const releaseObsolete = releaseImage
    fireEvent.click(screen.getByRole('button', { name: 'Use English system language' }))
    await expectReady('en')
    heldImage = null
    await act(async () => releaseObsolete?.())
    expect(mocks.render.mock.lastCall?.[0].background.src).toContain('beauty-nail-en.webp')
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeEnabled()
  })

  it.each(['png', 'pdf'] as const)('exports the Vietnamese %s artwork and its matching filename', async kind => {
    renderEditor()
    selectIndustry('food')
    fireEvent.click(screen.getByRole('radio', { name: 'Butter & Bloom' }))
    fireEvent.click(screen.getByRole('button', { name: 'Use Vietnamese system language' }))
    await expectReady('vi')
    fireEvent.click(screen.getByRole('button', { name: kind === 'png' ? 'Tải PNG' : 'Tải PDF' }))
    const exporter = kind === 'png' ? mocks.png : mocks.pdf
    await waitFor(() => expect(exporter).toHaveBeenCalledTimes(1))
    const [document, assets] = exporter.mock.calls[0] as [CheckInPrintDocument, PrintAssets]
    expect(document.qrUrl).toBe(url)
    expect(composedSource(assets)).toContain('food-bakery-vi.webp')
    await waitFor(() => expect(anchorClick).toHaveBeenCalledTimes(1))
    expect((anchorClick.mock.instances[0] as HTMLAnchorElement).download).toBe(`oneqr-example-customer-food-bakery-vi.${kind}`)
  })

  it('preserves the pending export snapshot and filename when the global language changes', async () => {
    let finish: ((blob: Blob) => void) | undefined
    mocks.png.mockImplementation(() => new Promise<Blob>(resolve => { finish = resolve }))
    renderEditor()
    selectIndustry('food')
    fireEvent.click(screen.getByRole('radio', { name: 'Coffee Ritual' }))
    await expectReady('en')
    fireEvent.click(screen.getByRole('button', { name: 'Download PNG' }))
    await waitFor(() => expect(finish).toBeDefined())
    fireEvent.click(screen.getByRole('button', { name: 'Use Vietnamese system language' }))
    expect(screen.getByRole('button', { name: 'Tải PDF' })).toBeDisabled()
    expect(composedSource(mocks.png.mock.calls[0][1])).toContain('food-coffee-en.webp')
    await act(async () => finish?.(new Blob(['png'])))
    await waitFor(() => expect(anchorClick).toHaveBeenCalledTimes(1))
    expect((anchorClick.mock.instances[0] as HTMLAnchorElement).download).toBe('oneqr-example-customer-food-coffee-en.png')
    await expectReady('vi')
  })

  it('prints the selected language document and preserves the independent QR download', async () => {
    renderEditor()
    selectIndustry('food')
    fireEvent.click(screen.getByRole('button', { name: 'Use Vietnamese system language' }))
    await expectReady('vi')
    fireEvent.click(screen.getByRole('button', { name: 'In' }))
    expect(composedSource(mocks.print.mock.calls[0][1])).toContain('food-bistro-vi.webp')
    fireEvent.click(screen.getByRole('button', { name: 'Tải mã QR PNG' }))
    await waitFor(() => expect(mocks.qr).toHaveBeenCalledTimes(1))
    expect(mocks.qr.mock.calls[0][1]).toBe('oneqr-example-customer.png')
  })
})
