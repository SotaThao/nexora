## ADDED Requirements

### Requirement: Notification Feed
Both the merchant and staff dashboards SHALL fetch the notification feed from `GET /api/v1/notifications` via `notificationsRepository.list()` and the `useNotifications()` hook, keyed by `qk.notifications()`.

Each notification SHALL carry at least: id, type, title/body text, read state, and timestamp, normalized in the repository to the shape the existing notification components consume.

#### Scenario: Feed loads
- **WHEN** a user opens the notification panel
- **THEN** `useNotifications()` SHALL call `GET /api/v1/notifications` and render the returned notifications newest-first

#### Scenario: Empty feed
- **WHEN** the endpoint returns an empty list
- **THEN** the panel SHALL render a "no notifications" empty state

### Requirement: Unread Count Badge
The dashboard header bell (merchant `DashboardHeader.jsx` and staff `StaffHeader.jsx`) SHALL show an unread count from `GET /api/v1/notifications/unread-count` via `notificationsRepository.unreadCount()` and a dedicated `useUnreadCount()` hook keyed by `qk.notificationsUnreadCount()`.

The unread-count query SHALL refetch periodically and on window focus; it SHALL NOT fetch the full notification list to compute the badge.

#### Scenario: Badge reflects unread count
- **WHEN** the unread-count endpoint returns a positive number
- **THEN** the header bell SHALL display that count as a badge

#### Scenario: Zero unread hides badge
- **WHEN** the unread-count endpoint returns `0`
- **THEN** the header bell SHALL render without a count badge

#### Scenario: Periodic refresh
- **WHEN** the dashboard remains open and the tab is focused
- **THEN** the unread-count query SHALL refetch on its interval so the badge stays reasonably fresh without manual reload

### Requirement: Mark Notification Read
A user SHALL be able to mark a single notification read via `PUT /api/v1/notifications/{id}/read` through `notificationsRepository.markRead(id)` and the `useMarkNotificationRead()` mutation hook.

#### Scenario: Mark one read
- **WHEN** the user opens/acts on a single unread notification
- **THEN** the hook SHALL call `PUT /api/v1/notifications/{id}/read` and on success SHALL invalidate both `qk.notifications()` and `qk.notificationsUnreadCount()`

### Requirement: Mark All Read
A user SHALL be able to mark all notifications read via `PUT /api/v1/notifications/read-all` through `notificationsRepository.markAllRead()` and the `useMarkAllNotificationsRead()` mutation hook.

#### Scenario: Mark all read
- **WHEN** the user taps "Mark all read"
- **THEN** the hook SHALL call `PUT /api/v1/notifications/read-all` and on success SHALL invalidate `qk.notifications()` and set the unread badge to zero (via `qk.notificationsUnreadCount()` invalidation)

### Requirement: Deprecated Local Notification Mutations Removed
The storage-era `add()` and `replaceAll()` notification repository methods SHALL no longer write client-side notifications; notification creation is a server-side concern. Any remaining callers SHALL be migrated to read-only consumption.

#### Scenario: No client-side notification creation
- **WHEN** any dashboard flow previously called `notificationsRepository.add()` to inject a local notification
- **THEN** that call SHALL be removed (notifications originate server-side); the UI SHALL rely on the server feed
