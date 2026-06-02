# Statement tab

Password-protected financial statement for an HCI site, with a **two-tier reveal**:

- **Guest code** → itemised charges + running balance + a Stripe **Pay** button
- **Staff code** → the same statement *plus* cost / profit / margin

It also includes an idle **auto-lock**, a **lock & log out** button, and a built-in
**`#encrypt` console** that builds both encrypted blobs from one master sheet.

Encryption is real (AES-256-GCM, PBKDF2-SHA-256 via the browser’s Web Crypto API).
The internal numbers exist **only** inside `ENC_INTERNAL`, so the guest code can
never decrypt them. No backend; works on GitHub Pages.

## Files

|File      |What it is                                                                           |
|----------|-------------------------------------------------------------------------------------|
|`tab.html`|Three fragments: the nav button, the `#panel-statement` section, the `#console` block|
|`tab.css` |The styles this tab needs (merge into the host stylesheet)                           |
|`tab.js`  |Self-contained module (IIFE). Exposes `HCIStatement.init()` and `HCIStatement.lock()`|

## Add it to a site

1. **CSS** — paste `tab.css` into the host stylesheet.
1. **HTML** — from `tab.html`, paste: (1) the nav button into `<nav class="tabs">`,
   (2) the `#panel-statement` section into `<main>`, (3) the `#console` block before your scripts.
1. **JS** — include `tab.js` (a `<script>` tag or pasted inline).
1. In the host **`init()`**, call once:
   
   ```js
   HCIStatement.init();
   ```
1. In the host **tab switcher**, relock on leaving the tab:
   
   ```js
   if (tab.dataset.tab !== "statement") HCIStatement.lock();
   ```

## Set the content (per trip)

1. Open the published site with `#encrypt` on the end.
1. Enter a **guest code** and a (different) **staff code**.
1. **Load current** (staff code) or **Blank template**, edit the master sheet.
   `cost` per item is internal only — it is auto-stripped from the guest blob.
   Use the **Record a payment** row to log payments tap-only.
1. **Encrypt & generate both blobs**, then paste `3a → ENC_GUEST` and
   `3b → ENC_INTERNAL` at the top of `tab.js`. Commit.

`payLink` may be any Stripe URL (`buy.stripe.com/...` or `invoice.stripe.com/...`).
With no `payLink`, the guest sees a greyed “Payment link not yet available”.

## Config (top of `tab.js`)

- `ENC_GUEST`, `ENC_INTERNAL` — the two ciphertext blobs
- `TIMEOUT_SEC` — idle auto-lock seconds (`0` = off)

## Notes

- The Statement view runs only over **https** (Web Crypto needs a secure origin);
  test on the deployed URL, not a local file.
- Demo codes for the blank starter blobs: **GUEST** and **STAFF** — replace with
  strong, distinct per-trip codes before sharing.
- **Never** put cost/profit/margin anywhere but `ENC_INTERNAL`.
