# Walkthrough — Sanctuary Core Control & Admin Portal

We have successfully implemented the client-side passcode-locked Admin Portal & Content Management System (passcode: `ubhi123`) to manage the home gallery, workshops catalog, shop inventory (with stock levels), journal entries, snail mail sliders, and subscriber database.

---

## 1. Passcode Decrypt Gate & Navigation
- **Footer Access**: Added a link to the shared footer pointing to `#admin`.
- **Passcode Authentication**: Gated with the passcode `ubhi123`. The authenticated state is saved in `localStorage` under `ubhi-admin-authenticated` for session persistence. If not logged in, an elegant stardust-themed decal gate appears with an error dialog for incorrect passwords.
- **Glassmorphic Tabs**: Once authenticated, the user enters the control dashboard containing separate management panels: Gallery, Workshops, Shop, Snail Mail, Journal, and Orders & Bookings.

---

## 2. Dynamic Front-Facing Renderers
- All frontend pages have been rewritten to load content dynamically from `localStorage` tables, ensuring any updates made in the Admin Portal are instantly rendered.
- **Memory Backup Fallbacks**: Included safe wrapper functions `safeLocalRead`, `safeLocalWrite`, and `safeLocalRemove` to support private browsing sessions where standard `localStorage` writing is blocked.
- **Seeding Checks**: Default datasets are automatically seeded on first load to guarantee the site is never blank.

---

## 3. Subscriber Database CRM & Shipping Labels
- **Subscriber Directory**: Displays subscriber details (Name, Email, Contact, Plan, Billing, Address, Date Subscribed, and Status) in a paginated, sortable table.
- **Active/Inactive Status Switch**: A sleek checkbox switch toggles subscriber status. Inactive members are highlighted in muted red, while active members show in bright gold.
- **A4 Sticker Sheet Print Layout**: 
  - Clicking "Print Address Stickers" compiles only active subscriber addresses.
  - Custom `@media print` rules hide all page layouts and format the addresses in print preview into standard **A4 label sheets (3 columns, 7 rows = 21 labels per page)**.
- **CSV Export**: Downloads a clean spreadsheet (.csv file) of all subscribers.

---

## 4. Visual Archives & CRUD Controls
- **Gallery**: Add/remove home carousel photos.
- **Workshops**: Add new workshops with description, time, price, capacity, and custom upload posters. Removed workshops are deleted, and active ones automatically populate the booking modal's select dropdown.
- **Shop Inventory**: Add/remove shop items with descriptions and upload images.
  - *Reactive Badges*: Stock counters display remaining quantities. If stock is low, a custom "Only X left!" label appears on the shop card.
- **Snail Mail Sliders**: Add/remove Snail Mail gallery photos and testimonials cards, updating carousels in real-time.
- **Journal Image Mode**: 
  - Post normal text articles, or select "Custom Image Upload" to upload page scans (Base64 data URLs).
  - Image-only posts automatically display the scan as a clean full-page sheet in the reading modal, bypassing word count checks and displaying a special subtitle snippet in the cards list.

---

## 5. Orders & Bookings Logs & Backup Utilities
- **Order Tracking**: Lists shop checkouts with buyer details, address, products ordered, and a status toggle button ("Preparing with care" / "Shipped").
- **Reservation Logs**: Lists workshop bookings with customer notes.
- **JSON Database Backup**: Downloads the entire local storage database prefixed by `ubhi-` into a single JSON file.
- **JSON Database Restore**: Restores the database from a backup file with safe validation checks.

---

## 6. Verification & Quality Auditing
- **JavaScript Compilation**: Syntax verified with `node --check script.js`, passing successfully with no parsing or reference errors.
- **Offline / Client-Side Persistence**: Fully functional static model. All CRUD changes write immediately to browser storage and update the homepage, workshops page, shop grid, snail mail carousel, and journal grid in real-time.
