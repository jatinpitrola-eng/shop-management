# Task 3 — Agent Work Record

**Agent:** full-stack-developer
**Task ID:** 3
**Task:** Add email+password customer login + branding section + cow on dashboard

## Files Modified (7)

1. `/home/z/my-project/src/lib/i18n.ts` — Added 16 new keys (email, password, customer_login_helper, settings_branding, tagline, accent_emoji, theme_color, logo_upload, logo_too_big, live_preview, color_dairy_green, color_milky_blue, color_buttery_amber, color_grape, color_tomato, color_teal, t_branding_saved) to all 3 dicts (gu/hi/en).

2. `/home/z/my-project/src/components/owner/OwnerCustomersScreen.tsx` — AddCustomerSheet now has email + password fields (with helper text), the Customer interface includes email + passwordHash, the list row shows the email under the phone number + a ✉️ badge next to the name when email is set. The submit POSTs email + password to /api/customers (which bcrypt-hashes via the existing route). EMAIL_EXISTS error surfaced as a friendly toast.

3. `/home/z/my-project/src/components/owner/OwnerSettingsScreen.tsx` — Inserted a new "🎨 Branding" Section BEFORE the General section (only shown when session.role === 'owner'). The Branding section has:
   - Live preview card with gradient background showing custom logo (or NexoryosLogo fallback) + business name + accent emoji + tagline
   - Business name input
   - Tagline input (placeholder in 3 langs)
   - Accent emoji input (maxLength 4)
   - Theme color picker (`<input type="color">`) + hex text input side-by-side
   - 6 preset color swatches (dairy green, milky blue, buttery amber, grape, tomato, teal) — selected swatch shows a ✓ checkmark
   - Logo upload: hidden `<input type="file" accept="image/*">` triggered by a button; FileReader reads as data URL; preview thumbnail; max 200KB; clear button; error display
   - Save button → PATCH /api/business/branding with all branding fields → toast `t_branding_saved` + reload business info
   - After save, the DynamicTheme component (already mounted at root in OwnerApp via session.bid) automatically picks up the new themeColor and applies it.
   - New state vars: bBusinessName, tagline, accentEmoji, themeColor, logoUrl, logoError, savingBranding, fileInputRef (useRef)
   - load() now also fetches GET /api/business/branding to populate branding fields

4. `/home/z/my-project/src/app/api/seed/route.ts` — Idempotent seed now backfills branding + email/password on the existing demo business (for users who already seeded). New business gets themeColor #0B7A4B, tagline "તાજું દૂધ, રોજ સવાર", accentEmoji "🐄". Patel Bhai (+919876543220) gets email "patel@demo.com" + password "1234" (bcrypt-hashed via hashPassword). Note string updated to mention both login flows.

5. `/home/z/my-project/src/components/owner/OwnerDashboardScreen.tsx` — Added CuteCow hero mascot at the top (size=100, centered). Wrapped the top stat cards (this/last month + delta/collection rate + month-end/grace countdowns) in a gradient container with `linear-gradient(135deg, var(--brand-tint), rgba(255,224,138,0.15))`, borderRadius 16, padding 16, to make the dashboard feel "wow". Top 5 overdue + on-vacation-today cards remain below outside the gradient wrapper.

6. `/home/z/my-project/src/components/owner/OwnerTodayScreen.tsx` — Added absolutely-positioned floating CuteCow (size=56) at top-right + an extra milk drop animation (framer-motion motion.div with floating SVG drop). Both have `pointerEvents: 'none'` so they don't interfere with taps on the date header / progress bar below.

7. `/home/z/my-project/src/lib/db.ts` — Added a SCHEMA_HASH mechanism that drops the cached globalThis.prisma instance whenever the prisma schema changes (forces a fresh PrismaClient on hot reload). This prevents "Unknown argument themeColor" errors when the schema is updated mid-session.

8. `/home/z/my-project/next.config.ts` — Added `serverExternalPackages: ["@prisma/client", ".prisma/client"]` so Next.js loads @prisma/client at runtime via require (not bundled). Without this, the Turbopack bundle cached the OLD @prisma/client module (pre-branding-fields) and the dev server kept returning "Unknown argument themeColor" even after `bun run db:push` regenerated the client. Changing next.config.ts triggered a full dev server restart which picked up the new client.

## Lint Results

`bun run lint` → exit 0, 0 errors, 0 warnings. All files pass ESLint cleanly.

## Verification

- `POST /api/seed` → 200 (idempotent; backfills branding + Patel email/password on existing business)
- `POST /api/auth/customer-login` with `{email: "patel@demo.com", password: "1234"}` → 200 with `{role: "customer", name: "Patel Bhai", businessId, customerId}` — both login flows work
- `GET /` → 200 (root page compiles cleanly)
- PrismaClient SELECT now includes themeColor, logoUrl, tagline, accentEmoji (proving the runtime client picked up the new schema)

## Test Login Credentials

- Owner: +91 98765 43210, OTP 123456
- Owner: +91 98765 43211 (Kaju), OTP 123456
- Staff: +91 98765 43212 (Mohan), OTP 123456
- Customer (phone OTP): +91 98765 43220 (Patel Bhai), OTP 123456
- Customer (email+password): patel@demo.com / 1234

## Stage Summary

- Owner can now add a customer with email+password (customer can install PWA + login with email+password via the LoginScreen "✉️ Email" tab).
- Owner can brand their dairy via Settings → 🎨 Branding (logo upload, theme color picker + 6 presets, tagline, accent emoji, business name, live preview).
- Dashboard shows a friendly CuteCow mascot at the top + a gradient-wrapped stat container.
- Today screen has a floating CuteCow + milk drop on the right.
- Seed auto-applies branding to the demo business (themeColor #0B7A4B, tagline, accentEmoji 🐄) and gives Patel Bhai email "patel@demo.com" + password "1234" so users can test BOTH login flows.
- DynamicTheme (mounted at root in OwnerApp) automatically picks up the saved themeColor and overrides the default dairy green CSS vars at runtime.
- All FooterCredit "By Pitroda Jatin Jayeshbhai" remain visible on every screen.
- All touch targets ≥48px (.clean-btn).
- All Gujarati strings via t(lang, 'key'); new keys added to all 3 dicts.
