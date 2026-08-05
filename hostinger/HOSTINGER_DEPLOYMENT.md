# MiLyfe OS — Hostinger Non-VPS (Shared Hosting & Static CDN) Deployment Guide

This folder contains **production-ready packages** specifically built for **Hostinger Non-VPS plans** (Single, Premium, Business Shared Web Hosting, Cloud Hosting, and hPanel environments).

---

## Which Package Should You Upload?

### 1. **Option A: Full Backend Package (`hostinger/public_html/`)** — *Recommended for Shared Hosting*
Use this on any standard Hostinger Shared Hosting plan (Single, Premium, Business, or Cloud Hosting via hPanel).
* **What's included**:
  * Complete **PHP 8.x REST API (`api.php`)** implementing 100% of the MiLyfe platform (auth, dashboards, Word-to-Math formula review, $MLY sovereign ledger, circle auto-matching, and Solid-Pod data export).
  * **`.htaccess`** rules that route `/api/...` to `api.php`, force HTTPS, add security headers, and block direct browser downloads of database files.
  * **`data/db.json`** file-locked JSON database (zero database setup or MySQL configuration required).
  * All 6 HTML pages (`index.html`, `onboarding.html`, `login.html`, `citizen.html`, `admin.html`) and styling with the canonical MiLyfe logo inlined.

#### **How to Deploy (2 Minutes):**
1. Log in to your **Hostinger hPanel**.
2. Go to **File Manager** -> open `public_html/` for your domain (e.g., `milyfe.fun`).
3. Upload the contents of `hostinger/public_html/` directly into your `public_html/` folder.
4. Set permissions on `public_html/data/` to `0755` and `public_html/data/db.json` to `0644` (or `0666` if required by PHP).
5. Open your domain in your browser!
   * The first citizen to register when `FIRST_USER_ADMIN=true` is enabled in your environment will automatically become the **Admin**.

---

### 2. **Option B: Standalone Static PWA (`hostinger/static-client-pwa/`)** — *For Zero-Backend CDN / Static Hosting*
Use this if you are deploying to a purely static Hostinger CDN, Cloudflare Pages, Netlify, or want 100% client-side execution.
* **What's included**:
  * A custom `common.js` adapter that intercepts all `/api/...` calls and persists citizen vaults, Word-to-Math formulas, ledgers, and Solid-Pod exports directly in the visitor's browser (`localStorage` / IndexedDB).
  * No backend server or PHP database is required.

#### **How to Deploy:**
1. Upload the contents of `hostinger/static-client-pwa/` to your static web root.
2. Open your browser—the complete vertical-slice PWA runs locally on the user's device.

---

## Security Built Into `hostinger/public_html/`

* **BCrypt Password Hashing**: Native PHP `password_hash()` and `password_verify()`.
* **Cookie Security**: `HttpOnly`, `SameSite=Lax`, and `Secure` flag on HTTPS.
* **CSRF Protection**: Token validation on all write operations (`POST`, `PUT`, `DELETE`).
* **Protected Storage**: `.htaccess` explicitly denies HTTP access to any `.json`, `.sqlite`, or `.log` files in `data/`.
* **File Locking**: Uses `flock(LOCK_EX)` on writes to prevent race conditions in shared hosting environments.
