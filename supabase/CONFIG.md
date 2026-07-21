# Community Supabase Dashboard Configuration

This file records dashboard state that is intentionally outside the SQL migrations. Configure it before using the Community demo.

## Auth

- Enable **Anonymous sign-ins** (Authentication -> Providers -> Anonymous).
- Enable the **Email** provider. Run `pnpm seed:demo` locally with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to provision the Community personas. The seeded accounts are `jessica@demo.nexora` (thợ), `kayla@demo.nexora` (chủ), and `linh@demo.nexora` (khách). Their password comes from `DEMO_PASSWORD` (or the local-only default `demo1234`). Do not use the default outside the demo.
- Configure Auth rate limits as **per IP** limits appropriate for the demo and leave CAPTCHA disabled. The `validate_invite` RPC has its own server/edge rate-limit expectation noted in its SQL comment.
- Add redirect URLs for the Vercel production deployment and preview deployments, for example `https://<project>.vercel.app/**` and `https://<project>-*.vercel.app/**`, plus the local development origin used by the team.

## Realtime

- Enable Realtime for the project.
- The migration adds `public.messages` to the `supabase_realtime` publication. Confirm the publication remains enabled after project restores or dashboard changes.

## Storage

Create both buckets with these exact settings:

| Bucket | Public access | Size limit | Allowed MIME types | Use |
| --- | --- | --- | --- | --- |
| `community-public` | Public read | 5 MB | `image/*` | Media for public communities |
| `community-private` | Private; serve through signed URLs | 5 MB | `image/*` | Media for private and salon communities |

Store object paths using `{community_id}/{post_id}/...`. Database DTOs keep those paths; repositories resolve public or signed URLs when rendering requires one.

## Migration Boundary

Do not treat dashboard configuration as optional because it cannot be fully reproduced by the migrations. Do not apply the migrations automatically from the frontend project; use the approved Supabase migration workflow.

## Demo seed

- Official community slug: `nexora-official`. This exact slug is the anonymous-read exception in the RLS policy pack.
- The seed creates `Bitcoin Nail Bar Team` (verified Salon Group), `Nail Houston` (public), posts, comments, reactions, one pending join request, and an active single-use invite.
- The raw local demo invite token is `nexora-demo-invite`; open `/community/join/nexora-demo-invite` after seeding. The database stores only its SHA-256 hash.
- To re-create demo data after a linked database reset, first log in and link the CLI, then run `node scripts/reset-demo.mjs` with the same service-role environment variables. `supabase/seed.sql` uses the documented `app.demo_*_id` UUID settings and intentionally skips itself during a plain reset.
