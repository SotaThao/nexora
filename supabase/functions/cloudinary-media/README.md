# Cloudinary community media function

`cloudinary-media` signs browser uploads and private delivery URLs without exposing the Cloudinary API secret to the SPA.

## Required Supabase Edge secrets

```sh
supabase secrets set CLOUDINARY_CLOUD_NAME=<cloud-name>
supabase secrets set CLOUDINARY_API_KEY=<api-key>
supabase secrets set CLOUDINARY_API_SECRET=<api-secret>
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided to deployed Edge Functions by Supabase. Do not add `CLOUDINARY_API_SECRET` to a Vite environment file, source file, or frontend deployment variable.

## Deploy

```sh
supabase functions deploy cloudinary-media
```

Keep JWT verification enabled at the function gateway. The function also verifies the caller JWT itself, calls `public.is_member(p_community_id)`, and checks the community's immutable `media_visibility` before signing.

## Client environment

The SPA needs only this non-secret value to assemble public Cloudinary URLs:

```sh
VITE_CLOUDINARY_CLOUD_NAME=<cloud-name>
```

The function returns the Cloudinary API key only as part of a short-lived, member-authorized signed-upload response. The API secret never leaves the Edge Function.

Uploads preserve the `community/{community_id}/{post_id}/...` public-ID convention in both Cloudinary folder modes: `folder` covers legacy fixed folders and `public_id_prefix` covers current dynamic folders.

## Delivery model

- Public communities upload with Cloudinary delivery type `upload` and render the ordinary public delivery URL.
- Private/salon communities upload with delivery type `authenticated`. The function produces a five-minute signed Cloudinary image-download URL after re-checking membership. The database stores only `publicId`, delivery type, and original format; it never stores a signed URL.
