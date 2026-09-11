/**
 * webrtc.ts — thin, signaling-agnostic RTCPeerConnection helpers.
 *
 * Used unchanged by both Phase 1 (voice, US-05/US-06) and Phase 2 (video, US-07) — nothing here
 * is audio-only. Signaling (who sends what, when) lives in callState.ts; this file only owns the
 * RTCPeerConnection lifecycle, trickle-ICE queuing, and track helpers.
 */

export interface ManagedPeerConnection {
  readonly pc: RTCPeerConnection
  /**
   * Add a remote ICE candidate. Queues it if the remote description isn't set yet (trickle ICE
   * candidates routinely arrive before the SDP answer/offer they belong to) and flushes the
   * queue once `setRemoteDescription` runs.
   */
  addRemoteIceCandidate(candidate: RTCIceCandidateInit): Promise<void>
  /** Set the remote SDP (offer or answer) and flush any candidates queued before it was ready. */
  setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>
  /** Add every track of a local stream to the connection. */
  addLocalStream(stream: MediaStream): void
  /** Replace (or remove, passing null) the sender for a track kind — Phase 2 camera toggle. */
  replaceTrack(kind: 'audio' | 'video', track: MediaStreamTrack | null): Promise<void>
  /** Stop local tracks on every sender and close the underlying connection. */
  close(): void
}

export interface CreatePeerConnectionOptions {
  iceServers: RTCIceServer[]
  onIceCandidate?: (candidate: RTCIceCandidate) => void
  onTrack?: (event: RTCTrackEvent) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
}

export function createPeerConnection(options: CreatePeerConnectionOptions): ManagedPeerConnection {
  const { iceServers, onIceCandidate, onTrack, onConnectionStateChange } = options
  const pc = new RTCPeerConnection({ iceServers })

  let remoteDescriptionSet = false
  const pendingRemoteCandidates: RTCIceCandidateInit[] = []

  pc.onicecandidate = (event) => {
    if (event.candidate) onIceCandidate?.(event.candidate)
  }
  if (onTrack) pc.ontrack = onTrack
  if (onConnectionStateChange) {
    pc.onconnectionstatechange = () => onConnectionStateChange(pc.connectionState)
  }

  async function flushPendingCandidates() {
    while (pendingRemoteCandidates.length > 0) {
      const candidate = pendingRemoteCandidates.shift()
      if (candidate) await pc.addIceCandidate(candidate)
    }
  }

  return {
    pc,
    async addRemoteIceCandidate(candidate) {
      if (!remoteDescriptionSet) {
        pendingRemoteCandidates.push(candidate)
        return
      }
      await pc.addIceCandidate(candidate)
    },
    async setRemoteDescription(description) {
      await pc.setRemoteDescription(description)
      remoteDescriptionSet = true
      await flushPendingCandidates()
    },
    addLocalStream(stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))
    },
    async replaceTrack(kind, track) {
      const sender = pc.getSenders().find((s) => s.track?.kind === kind)
      if (sender) await sender.replaceTrack(track)
    },
    close() {
      pc.getSenders().forEach((sender) => sender.track?.stop())
      pc.onicecandidate = null
      pc.ontrack = null
      pc.onconnectionstatechange = null
      pc.close()
    },
  }
}
