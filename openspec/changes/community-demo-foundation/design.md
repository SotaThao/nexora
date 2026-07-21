## Contract Position

This is a transport-agnostic contract proposal. Supabase resources describe the demo implementation only; components depend on backend-neutral repository interfaces and DTOs, so a real Nexora backend can replace the adapter without changing UI consumers.

| Entity / feature | Supabase resource | Repository interface method | Future real-backend endpoint guess |
| --- | --- | --- | --- |
| Community discovery and detail | `communities` table | `communitiesRepository.list/getById/getBySlug` | `GET /api/v1/communities`, `GET /api/v1/communities/{id}` |
| Community administration | `communities`, `community_members` | `communitiesRepository.create/update` | `POST/PATCH /api/v1/communities/{id}` |
| Membership and roles | `community_members`, `change_role` RPC | `membersRepository.list/get/changeRole/remove` | `GET /api/v1/communities/{id}/members`, `PATCH /members/{userId}` |
| Posts and media references | `posts`, Storage buckets | `postsRepository.list/getById/create/remove` | `GET/POST /api/v1/communities/{id}/posts` |
| Comments | `comments`, notification trigger | `commentsRepository.list/create/remove` | `GET/POST /api/v1/posts/{id}/comments` |
| Reactions | `reactions` | `reactionsRepository.list/set/remove` | `PUT/DELETE /api/v1/posts/{id}/reactions/me` |
| Invite lifecycle | `invites`, `validate_invite`, `consume_invite` RPCs | `invitesRepository.create/validate/consume/revoke` | `POST /api/v1/communities/{id}/invites`, `POST /invites/{token}/consume` |
| Join requests | `join_requests`, approval RPCs | `joinRequestsRepository.create/list/approve/reject` | `POST /api/v1/communities/{id}/join-requests` |
| Main group channel | `channels` | `channelsRepository.list/getMain` | `GET /api/v1/communities/{id}/channels` |
| Chat and live updates | `messages`, `supabase_realtime` publication | `messagesRepository.list/send` | `GET/POST /api/v1/channels/{id}/messages`, WebSocket subscription |
| Moderation reports | `reports`, `moderate` RPC | `reportsRepository.create/list/updateStatus` | `POST /api/v1/reports`, `PATCH /api/v1/reports/{id}` |
| User notifications | `notifications`, producer triggers | `notificationsRepository.list/getUnreadCount/markRead` | `GET/PATCH /api/v1/notifications` |
| Profiles and media URL resolution | `profiles`, Storage buckets | `profilesRepository.getById/getMe/updateMe/resolveMediaUrl` | `GET/PATCH /api/v1/profiles/{id}`, media-signing endpoint |
| Audit trail | `audit_log`, privileged RPC writes | producer-only in this foundation | `GET /api/v1/communities/{id}/audit-log` |

### Boundary Rules

- DTOs use camelCase and contain storage paths, never Supabase row shapes or signed URLs.
- Repositories are the only future location for Supabase normalization and signed-URL resolution.
- Cursor pagination is keyset-based on `(created_at, id)` with an explicit direction.
- The security model belongs to the backend contract; client-side role checks are never authorization.
