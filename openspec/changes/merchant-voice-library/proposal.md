# Merchant Voice Library integration

## Source and scope
Implements the user-approved 2026-09-07 merchant voice library plan (tasks 5–6), tracked by US-046. Additive merchant catalog GET and config selection updates; no admin endpoints or provider IDs are consumed.

## Compatibility
Older config responses normalize missing voiceSelections to an empty list. Omitted/inactive selection languages preserve server assignments. Existing user edits and full salon config fields remain intact.
