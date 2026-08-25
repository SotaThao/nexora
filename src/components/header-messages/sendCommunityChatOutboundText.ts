import { sendCommunityChatHubMessage } from '../../lib/communityChatHub'
import {
  ensureCommunityChatHubSessionJoined,
  getCommunityChatHubConnection,
} from './communityChatRealtime'

/**
 * Prefer SignalR send; fall back to REST when hub is disconnected.
 * Shared by header messenger + staff chat surfaces.
 * IMPORTANT: Always ensures session group is joined to receive broadcast replies.
 */
export async function sendCommunityChatOutboundText(params: {
  sessionId: string
  content: string
  sendViaRest: (input: { content: string; sessionId: string }) => Promise<unknown>
}): Promise<void> {
  const { sessionId, content, sendViaRest } = params
  
  // CRITICAL: Join session group FIRST before sending
  // This ensures we receive the broadcast reply (both SignalR and REST send trigger broadcasts)
  let joinSucceeded = false
  try {
    await ensureCommunityChatHubSessionJoined(sessionId)
    joinSucceeded = true
  } catch (error) {
    // Join failed - continue anyway, message will be sent but may not receive real-time reply
  }
  
  // Try to send via SignalR Hub if connection is ready AND join succeeded
  if (joinSucceeded) {
    try {
      const connection = await getCommunityChatHubConnection()
      
      if (connection?.state === 'Connected') {
        await sendCommunityChatHubMessage(connection, { sessionId, content })
        return
      }
    } catch (error) {
      // Hub send failed - fall through to REST
    }
  }
  
  // Fallback to REST when hub is not connected or join/send failed
  await sendViaRest({ content, sessionId })
}
