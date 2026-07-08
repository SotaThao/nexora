import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { logger } from '../utils/logger'

export type CapgoUpdatePhase = 'hidden' | 'downloading' | 'ready' | 'failed'

export interface CapgoUpdateUiState {
  phase: CapgoUpdatePhase
  percent: number
  version: string
}

const hiddenState: CapgoUpdateUiState = {
  phase: 'hidden',
  percent: 0,
  version: '',
}

type CapgoUpdateSubscriber = (state: CapgoUpdateUiState) => void

let currentState: CapgoUpdateUiState = hiddenState
let phase: CapgoUpdatePhase = 'hidden'
let initialized = false
const subscribers = new Set<CapgoUpdateSubscriber>()

function publish(patch: Partial<CapgoUpdateUiState>) {
  currentState = { ...currentState, ...patch }
  if (patch.phase) {
    phase = patch.phase
  }
  subscribers.forEach((listener) => listener(currentState))
}

function markDownloading(version = '', percent = 0) {
  publish({
    phase: 'downloading',
    version,
    percent: Math.max(0, Math.min(100, Math.round(percent))),
  })
}

function markReady(version = '') {
  publish({
    phase: 'ready',
    version,
    percent: 100,
  })
}

export function getCapgoUpdateUiState() {
  return currentState
}

export function dismissCapgoUpdateUi() {
  phase = 'hidden'
  currentState = hiddenState
  subscribers.forEach((listener) => listener(currentState))
}

export function subscribeCapgoUpdateUi(listener: CapgoUpdateSubscriber) {
  subscribers.add(listener)
  listener(currentState)
  return () => {
    subscribers.delete(listener)
  }
}

export async function initCapgoUpdateListeners() {
  if (!Capacitor.isNativePlatform() || initialized) {
    return
  }

  initialized = true
  const handles: PluginListenerHandle[] = []

  try {
    handles.push(
      await CapacitorUpdater.addListener('updateAvailable', ({ bundle }) => {
        markDownloading(bundle.version || '', 0)
      }),
    )

    handles.push(
      await CapacitorUpdater.addListener('download', ({ percent, bundle }) => {
        markDownloading(bundle.version || '', percent)
      }),
    )

    handles.push(
      await CapacitorUpdater.addListener('downloadComplete', ({ bundle }) => {
        markReady(bundle.version || '')
      }),
    )

    handles.push(
      await CapacitorUpdater.addListener('setNext', ({ bundle }) => {
        if (phase === 'downloading') {
          markReady(bundle.version || '')
        }
      }),
    )

    handles.push(
      await CapacitorUpdater.addListener('downloadFailed', () => {
        publish({ phase: 'failed' })
      }),
    )
  } catch (error) {
    initialized = false
    logger.warn('Capgo update listeners unavailable', error)
    handles.forEach((handle) => {
      void handle.remove()
    })
  }
}
