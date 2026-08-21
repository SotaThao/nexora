import { sendCommunityChatHubMessage } from '../../lib/communityChatHub'
import {
  ensureCommunityChatHubSessionJoined,
  getCommunityChatHubConnection,
} from './communityChatRealtime'

/**
 * Prefer SignalR send; fall back to REST when hub is disconnected.
 * Shared by header messenger + staff chat surfaces.
 */
export async function sendCommunityChatOutboundText(params: {
  sessionId: string
  content: string
  sendViaRest: (input: { content: string; sessionId: string }) => Promise<unknown>
}): Promise<void> {
  const { sessionId, content, sendViaRest } = params
  await ensureCommunityChatHubSessionJoined(sessionId)
  const connection = await getCommunityChatHubConnection()
  if (connection?.state === 'Connected') {
    await sendCommunityChatHubMessage(connection, { sessionId, content })
    return
  }
  await sendViaRest({ content, sessionId })
}
