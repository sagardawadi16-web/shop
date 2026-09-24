# Dawosti Boutique — Clean Rebuild Plan

## Goal
Rebuild the Dawosti e-commerce site from scratch with a clean, lean, fully-working codebase.
Same beautiful UI. Same Firebase backend. Same Cloudflare Pages auto-deploy.
No accumulated bugs, no dead code, no race conditions.

## What's Being Kept (Reused)
- Firebase project (`gen-lang-client-0845537081`) — same config
- GitHub repo (`sagardawadi16-web/shop`) — overwrite with new clean code
- Cloudflare Pages deployment (connected to same repo) — auto-deploys on push
- Design language: warm ivory/burgundy palette, Nepali boutique aesthetic
- WhatsApp number: `+977 9708251494`
- Admin emails: `sagardawadi10@gmail.com`, `sagardawadi16@gmail.com`

## What's Being Rebuilt (From Scratch)
Everything in `src/` — clean architecture, no bloat.

---

## Architecture (New, Clean)

### State Management
- **Zustand** (replacing the massive 1885-line React Context) — tiny, fast, no boilerplate
- Separate stores: `useProductStore`, `useCartStore`, `useOrderStore`, `useAdminStore`

### Firebase Strategy
- **Firestore** for: products, orders, site settings (real-time `onSnapshot`)
- **Firebase Auth** for: Google Sign-In (real, not faked)
- Security rules: open read, auth-required write for admin collections
- **Auto-seed**: on first load, if Firestore `products` collection is empty → batch write mock catalog

### Routing
- Single-page app with `pageView` state (no react-router needed for this scope)
- Cloudflare `wrangler.jsonc` SPA mode (already working)

### Key Pages/Views
1. `HomePage` — product grid, categories, filters, hero banner
2. `ProductDetailModal` — full product view, size picker, add to cart
3. `CartDrawer` — slide-in cart, quantity controls
4. `CheckoutPage` — shipping form, payment method (COD/eSewa/Khalti/Fonepay)
5. `OrderConfirmationPage` — order summary + WhatsApp dispatch button
6. `AdminPanel` — modal with tabs: Orders, Catalog, Theme, Settings, QR

---

## File Structure (New)

```
src/
  stores/
    productStore.ts      — products CRUD + Firestore sync
    cartStore.ts         — cart state + localStorage
    orderStore.ts        — orders CRUD + Firestore sync
    adminStore.ts        — admin auth + settings
    settingsStore.ts     — theme, merchant settings, site content
  services/
    firebase.ts          — single Firebase init
    firestoreProducts.ts — product listener + CRUD
    firestoreOrders.ts   — order listener + CRUD
    firestoreSettings.ts — settings listener + publish
    firebaseAuth.ts      — real Google Sign-In
  components/
    layout/
      Header.tsx
      Footer.tsx
      MobileNav.tsx
    products/
      ProductGrid.tsx
      ProductCard.tsx
      ProductDetailModal.tsx
      QuickViewModal.tsx
    cart/
      CartDrawer.tsx
      CartItem.tsx
    checkout/
      CheckoutForm.tsx
      PaymentSelector.tsx
      OrderConfirmation.tsx
    admin/
      AdminModal.tsx
      tabs/
        OrdersTab.tsx
        CatalogTab.tsx
        ThemeTab.tsx
        SettingsTab.tsx
    common/
      Logo.tsx
      Button.tsx
      Toast.tsx
      LoadingSpinner.tsx
  pages/
    HomePage.tsx
    CheckoutPage.tsx
  types.ts
  mockData.ts
  App.tsx
  main.tsx
  index.css
```

---

## Critical Fixes vs Old Codebase

| Old Bug | New Approach |
|---|---|
| 1885-line monolithic shopStore | Split into 5 focused Zustand stores |
| Firestore listener ignored empty snapshot | Always fires; empty → auto-seed |
| localStorage vs Firestore race condition | Firestore is source of truth; localStorage is write-through cache only |
| Fake Google auth fallback | Real auth with clear error UI; no silent fake sessions |
| Dead `/api/orders` fetch | Removed entirely |
| `sendNewProductEmailCampaign` called on every add | Opt-in only from Admin UI |
| Multiple Firebase app initializations | Single `firebase.ts` init module |
| 138KB AdminPanelModal.tsx | Split into tab components |

---

## Firestore Security Rules (To Apply in Firebase Console)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products: anyone can read, only admin can write
    match /products/{id} {
      allow read: if true;
      allow write: if request.auth != null &&
        (request.auth.token.email == 'sagardawadi10@gmail.com' ||
         request.auth.token.email == 'sagardawadi16@gmail.com');
    }
    // Orders: anyone can create (place order), admin can read/update/delete
    match /orders/{id} {
      allow create: if true;
      allow read, update, delete: if request.auth != null &&
        (request.auth.token.email == 'sagardawadi10@gmail.com' ||
         request.auth.token.email == 'sagardawadi16@gmail.com');
    }
    // Settings: anyone can read, only admin can write
    match /store_settings/{id} {
      allow read: if true;
      allow write: if request.auth != null &&
        (request.auth.token.email == 'sagardawadi10@gmail.com' ||
         request.auth.token.email == 'sagardawadi16@gmail.com');
    }
    // User carts: user can read/write their own cart
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Open Questions (For User)

> **IMPORTANT**: Before starting, confirm:
> 1. Should the new code go into the same repo (`sagardawadi16-web/shop`) and **overwrite** the old code? (Yes = Cloudflare auto-deploys immediately)
> 2. Should mock products be seeded to Firestore on first load, or start with empty catalog?
> 3. Is Zustand okay, or do you prefer to keep React Context?

---

## Verification Plan

### Automated
- `npm run build` must pass with 0 errors before any push

### Manual (on dawosti.com after deploy)
1. Products load from Firestore (not mock data)
2. Add product in Admin → appears live on homepage without refresh
3. Place a test order → appears in Admin Orders tab
4. Order status update in Admin → customer-facing tracking shows updated status
5. Google Sign-In works (after adding dawosti.com to Firebase Authorized Domains)
6. Admin panel accessible to sagardawadi16@gmail.com automatically
