# Story 4.4: Products Catalog and Management

Status: done

## Story

As a shopper,
I want a Products tab where I can search and maintain my products,
so that product records used in Results and Shopping stay accurate.

## Acceptance Criteria

1. Given I open the Products tab, when I view the screen, then I see a list of saved products with name, barcode, and active status.
2. Given I need to find a product, when I enter text in search, then products are filterable by name or barcode.
3. Given I need to add a new product, when I enter barcode and product name then save, then a new product record is created and appears in the list.
4. Given a product already exists, when I edit the product name, then the product updates and latest name is reflected.
5. Given I want to hide a product from active use, when I set the product to inactive, then its status becomes inactive without deleting historical data.
6. Given products are used in Shopping and Results, when product records are updated, then Shopping and Results continue using the same shared product source of truth.

## Implementation Summary

- Added 5th navigation tab `Products` in `app/(tabs)/_layout.tsx` and route files for both `app` and `app-production` router roots.
- Implemented `ProductsFeatureScreen` with:
  - searchable list by name/barcode,
  - add product form (barcode + name),
  - edit-name flow,
  - active/inactive toggle.
- Added `src/db/repositories/product-repository.ts` and `src/db/validation/products.ts`.
- Added `products.is_active` schema field and migration `drizzle/0006_product_active_flag.sql`.
- Updated shared product writers (`pricing-repository`, `shopping-list-repository`) to keep reused products active and aligned.

## Validation Evidence

- `npm run typecheck` ✅
- `npx jest __tests__/story-4-1-primary-navigation-shell.test.js __tests__/story-1-4-navigation-smoke.test.js __tests__/story-4-4-products-management-ui.test.js --runInBand --watchman=false` ✅

## File List

- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/products.tsx`
- `app-production/(tabs)/products.tsx`
- `src/features/products/products-screen.tsx`
- `src/db/validation/products.ts`
- `src/db/repositories/product-repository.ts`
- `src/db/schema/products.ts`
- `src/db/repositories/pricing-repository.ts`
- `src/db/repositories/shopping-list-repository.ts`
- `drizzle/0006_product_active_flag.sql`
- `drizzle/migrations.js`
- `drizzle/meta/_journal.json`
- `__tests__/story-4-1-primary-navigation-shell.test.js`
- `__tests__/story-1-4-navigation-smoke.test.js`
- `__tests__/story-4-4-products-management-ui.test.js`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-02-27.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-02-27: Added Products navigation and catalog management UI with shared product model integration across Results and Shopping.
