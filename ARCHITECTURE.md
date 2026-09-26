# Dawosti Architecture & System Blueprint

> **CRITICAL DIRECTIVE FOR ALL FUTURE DEVELOPERS & AI AGENTS**:
> Read this document completely before modifying code. Dawosti is a production boutique fashion platform operating live on `https://dawosti.com`. Preserve all architectural invariants, role-based security barriers, authentic catalog garments, and smooth navigation mechanics detailed below.

---

## 1. Brand Vision & Cultural Mandate
* **Company**: DAWOSTI Boutique Kathmandu (`dawosti.com`).
* **Mission**: Leading women's high fashion, avant-garde streetwear, and heritage reimagination in Nepal (traditional Nepali Dhaka, raw silks, Pashmina, Newari cuts married to modern couture).
* **Flagship Studio**: New Road (Opposite Bishal Bazar), Kathmandu, Nepal.
* **Merchant Contact / WhatsApp Order Dispatch**: `+977 9808251494` (`contact.dawosti@gmail.com`).
* **Logistics Partner**: Sundar Express Logistics (Kathmandu Valley & nationwide delivery).

---

## 2. Infrastructure & Hosting
* **Repository**: `https://github.com/sagardawadi16-web/shop.git` (branch: `main`).
* **Production Edge**: Cloudflare Worker named `dashain-shopping` / `dashain-offer` bound to domain `dawosti.com` and workers.dev triggers.
* **SPA Routing**: Cloudflare Worker Assets configuration with `"not_found_handling": "single-page-application"`. All deep links (`/admin`, `/referral`, `/checkout`) correctly fall through to `dist/index.html`.
* **Frontend Tech Stack**: React 19, TypeScript 7, Vite 8, Zustand 5, Tailwind CSS v4, Lucide Icons, Motion.
* **Dual Runtime Engine**:
  * Edge: `src/worker.ts` handles API routes (`/api/*`) and static asset dispatch.
  * Node Server: `server.ts` / `dist/server.cjs` for local development or containerized environments.

---

## 3. URL Architecture & Browser Navigation
The platform operates a state-driven client-side routing model synchronized with `window.history` and browser URLs:

| Route / State | URL / Hash | Description |
| :--- | :--- | :--- |
| `home` | `/` | Luxury boutique storefront, hero showcase, catalog grid, filter bar. |
| `checkout` | `#checkout` | Single-page checkout with COD, eSewa, Khalti, and Fonepay QR. |
| `order-confirmation` | `#order-confirmed` | Order success confirmation and WhatsApp dispatch tracker. |
| `referral` | `/referral`, `/creator`, `#referral` | Creator affiliate ledger, promo generation, payout dashboard. |
| `admin` | `/admin` (or `#admin`) | Dedicated Executive Management Console. |

### Browser Back-Button Mechanics (`useMobileHistory`)
* **Hardware / Swipe / Toolbar Back Button**:
  * If on `/admin` or `isAdminModalOpen`: smoothly closes Admin and returns to `/` without exiting the app or triggering accidental exit warnings.
  * If inside Product Detail Modal: closes modal, remains on `/`.
  * If inside Cart Drawer: closes drawer, remains on `/`.
  * If on `#checkout` or `#order-confirmed`: returns to `/`.
  * If on root `/` with no overlays: requires double back-press within 2.5s ("Press back again to exit Dawosti") to prevent accidental tab closing.

---

## 4. Role-Based Access Control (RBAC) & Admin Portal
Access to the Executive Console (`/admin`) is strictly governed:

### 👑 Master Owners (Immutable)
* `sagardawadi16@gmail.com` (Sagar Dawadi — Creator & Master Owner)
* `sagardawadi10@gmail.com`
* Master owners can never be deleted or downgraded from the `owner` role.

### 🏛️ Role Hierarchy
1. **Owner / Super Admin**: Unrestricted access to all 7 tabs: Orders & Dispatch, Store Catalog, Creator Payouts, Wholesale Stockists, Profit Simulator, Payment QR Terminal, and Staff & Owner Whitelist.
2. **Manager**: Access to all operational tabs + Unit Economics & Profit Simulator. (Excluded: Whitelist modification).
3. **Staff / Clerk**: Direct access to day-to-day store operations: Orders & Dispatch, Store Catalog & Inventory, Wholesale Stockists, Creator Payouts, and Payment QR Terminal.

### 🛡️ Security & Whitelist Sync
* Whitelist collection in Firestore: `admin_whitelist`.
* Real-time sync via `firestoreWhitelist.ts` with instant `localStorage` cache fallback (`dawosti_admin_whitelist_v2`).
* Unauthenticated visitors landing on `/admin` see the protected Executive Sign-In gate.
* Logged-in Google users without whitelisted roles receive a strict 403 Access Denied lockout with a "Return to Boutique" button.
* **Header Visibility**: The Admin / Clerk badge appears dynamically in the header and mobile drawer ONLY for users who are logged in and authorized (`isAuthorizedAdmin === true`). Regular shoppers see a clean, luxury interface.

---

## 5. Authentic Product Catalog & Data Integrity
* **Core Catalog Garments (`daw-001` through `daw-008`)**:
  * `daw-001`: Midnight Velvet Kurthi with Zari Embroidery (NPR 4,850)
  * `daw-002`: Heritage Palpali Dhaka Fusion Jacket (NPR 6,200)
  * `daw-003`: Royal Crimson Bridal Silk Lehenga (NPR 18,500)
  * `daw-004`: Pure Handspun Himalayan Pashmina Shawl (NPR 9,500)
  * `daw-005`: Ochre Festive Anarkali Gown (NPR 7,800)
  * `daw-006`: Raw Tussar Silk Kurti & Pant Set (NPR 5,400)
  * `daw-007`: Handwoven Emerald Green Chiffon Saree (NPR 8,900)
  * `daw-008`: Modern Tibetan Chuba Capelet (NPR 6,800)
* **Zero Catalog Wipe Rule**: Deletion handlers in `firestoreProducts.ts` strictly prohibit deletion of authentic catalog products (`daw-001` to `daw-008`).
* **Showcase Demo Order Purge**: The 1-click wipe button in the Admin Orders tab purges seed/demo orders and writes `dawosti_purged_demo_orders: 'true'` to `localStorage` so demo orders never re-seed on page reload.

---

## 6. Header Subnav Dynamic Scroll Physics
* Directional auto-collapse hides the category pills on downward scroll (`accumulatedDelta > 65px` beyond `150px` depth) to minimize browsing distraction.
* Reveals instantly on scroll up (`accumulatedDelta < -45px`) and is always fully visible near top (`scrollY <= 60px`).
* Protected by a 350ms transition lock and an 850ms programmatic click lock to permanently eliminate layout shift oscillation and scroll jitter.

---

## 7. Discord Guild Architecture (Fashion Guild)
* Community blueprint governed by meritocracy: Vanguard (Council), Couturier (Verified Designers), Artisan (Stylists), Atelier (Initiates).
* Provisioning scripts located in `scripts/guild-bot.js`, `scripts/register-commands.js`, `scripts/provision-discord.js`.

---

## 8. Development & Deployment Protocol
* Before committing, always run:
  1. `npx tsc --noEmit`
  2. `npm run build`
* Deploy commands:
  * Push to git: `git push origin main`
  * Deploy Edge Worker: `npx wrangler deploy`
* Live verification domain: `https://dawosti.com`
