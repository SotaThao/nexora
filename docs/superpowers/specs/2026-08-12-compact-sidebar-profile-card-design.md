# Compact Sidebar Profile Card Design

## Goal

Make the shared sidebar profile card more compact while preserving its current layout, appearance, and behavior.

## Scope

Update the shared classes in `src/components/ui/sidebarMenuStyles.js` so the change applies consistently to:

- The merchant dashboard sidebar.
- The staff dashboard sidebar.
- The merchant mobile menu drawer.

## Design

- Change the profile card padding from `p-4` to `p-2`.
- Change image and fallback avatar dimensions from `h-11 w-11` (44px) to `h-9 w-9` (36px).
- Change fallback avatar text from `text-base` to `text-sm` so its initial remains visually balanced at the smaller size.
- Preserve all borders, backgrounds, rounding, spacing outside the card, content, dropdown behavior, and responsive behavior.

## Testing

Add a focused test for the shared style exports. It must verify the compact padding and avatar dimensions, including both image and fallback variants, and guard against the replaced size and padding tokens returning.

Run the focused test first, then the broader relevant test suite and project validation commands available in `package.json`.

## Success Criteria

- All three consumers render the shared profile card with 8px padding.
- Image and fallback avatars render at 36px square.
- The fallback initial remains centered and uses the smaller text size.
- No component logic or unrelated sidebar styling changes.
