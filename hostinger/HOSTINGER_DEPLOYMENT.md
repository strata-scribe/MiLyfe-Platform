# MiLyfe OS — Hostinger Non-VPS Deployment & Launch Setup Guide

This guide covers how to deploy the full **MiLyfe OS Platform** (including all 13 canonical **`Mi`** pillars, dynamic W3C QR check-in credentials, and 5 emergent civic features) on **Hostinger Shared / Web Hosting** (Single, Premium, Business Shared Web Hosting, Cloud Hosting, and hPanel environments) in under 3 minutes.

---

## 1. Choose Your Hosting Package

Inside the `hostinger/` directory in your repository, you will find two pre-packaged deployment bundles:

```text
hostinger/
├── public_html/        # Option A: Full PHP 8.x + Shared Hosting Package (RECOMMENDED)
└── static-client-pwa/  # Option B: Standalone 100% Client-Side PWA (CDN / Static Hosting)
```

### **Option A: Full PHP 8.x Backend (`hostinger/public_html/`)** — *Recommended*
Use this for any standard Hostinger web hosting plan (Single, Premium, Business, or Cloud Hosting via hPanel).
* **What is Included:**
  * **`api.php`**: Complete, zero-dependency PHP 8.x REST API implementing 100% of the platform:
    * BCrypt password hashing & session cookies (`HttpOnly`, `SameSite=Lax`, `Secure`)
    * All 13 **`Mi`** pillars (`MiPass`, `MiCircle`, `MiWealth`, `MiPod`, `MiStanding`, `MiStory`, `MiJourney`, `MiClass`, `MiDiscovery`, `MiAgenda`, `MiMissions`, `MiCommand`, plus **`Mi`** AI Chat)
    * **`MiPass`** Verifiable W3C QR code matrix & Offline Assembly Check-in (`+10 MiStanding`)
    * **`MiChiasm`** Cross-Circle Hybridization & Mutual Sponsorship
    * **`MiMandate`** Constitutional Word-to-Math recurring rules
    * **`MiTwin`** Spore Mesh Heartbeat & offline verification
    * **`MiJury`** Sortition-based civic deliberation panel
    * Solid-Pod Data Sovereignty Export (`GET /api/export/pod`)
  * **`.htaccess`**: Automatically routes `/api/...` to `api.php`, enforces HTTPS redirect, adds strict security headers, and blocks direct web access to any files inside `data/`.
  * **`data/db.json` & `data/.htaccess`**: File-locked (`flock`) JSON data store ready out of the box—no database creation or MySQL setup required.
  * **All Frontend Pages**: `index.html`, `onboarding.html`, `login.html`, `citizen.html`, `admin.html`, `style.css`, and `common.js` in a crisp light theme ("thin visual and UI premium").

---

## 2. Step-by-Step Deployment Instructions (Hostinger hPanel)

### Step 1: Zip the Contents of `hostinger/public_html/`
1. On your computer (or in your repository export), open the **`hostinger/public_html/`** folder.
2. Select **all files and folders** inside (`index.html`, `onboarding.html`, `login.html`, `citizen.html`, `admin.html`, `logo.png`, `style.css`, `common.js`, `api.php`, `.htaccess`, and the `data/` folder).
3. Compress/zip them into a single archive file: **`milyfe-hostinger.zip`**.

### Step 2: Open Hostinger File Manager
1. Log in to your **Hostinger account** and open **hPanel** (Hosting Dashboard).
2. Click **Manage** next to your domain name (e.g., `milyfe.fun`).
3. In the left sidebar, click **Files** -> **File Manager**.
4. In File Manager, double-click to open the **`public_html`** directory.

### Step 3: Upload & Extract
1. Delete any existing default placeholder files inside `public_html/` (such as `default.php` or `index.html`).
2. Click the **Upload** icon (up-arrow) in the top-right corner and select **`milyfe-hostinger.zip`**.
3. Once uploaded, right-click `milyfe-hostinger.zip` and choose **Extract** -> extract directly into `/public_html/`.
4. Delete the `.zip` file after extraction.

### Step 4: Verify Folder Permissions
1. Right-click the **`data`** folder and select **Permissions**:
   * Set directory permissions to **`0755`** (Read/Write/Execute for Owner, Read/Execute for Group/Public).
2. Open `data/`, right-click **`db.json`**, and select **Permissions**:
   * Set file permissions to **`0644`** (or **`0666`** if required by your PHP handler).

---

## 3. How to Launch & Create the First Admin Account

1. Open your browser and navigate to your domain (e.g., `https://milyfe.fun`).
2. Click **"Join as Founding Citizen"** (or go to `https://milyfe.fun/onboarding.html`).
3. Complete the 7-step onboarding wizard for **Citizen #1** with your location (e.g., `Jacksonville, FL`) and focus (`Governance`).
4. **Admin Promotion:** By default, the very first account registered on a clean database is automatically granted the **`admin`** and **`organizer`** roles.
5. You can now immediately open:
   * **Citizen Dashboard (`/citizen.html`)**: View all 13 **`Mi`** tabs, generate your 12-word Spore Seed, inspect your **`MiPass`** QR code, test the floating **`Mi`** AI chat drawer, and draft Word-to-Math formulas.
   * **Formation Command Center (`/admin.html`)**: Search citizens, click **`Run Auto-Match (7-13)`** to form your first Circle, use **`MiCommand`** diagnostics, and scan **`MiPass`** QR check-in codes to award instant **`+10 MiStanding`**.

---

## 4. Troubleshooting & FAQ

* **Q: Why do I get a 404 when calling an API route?**
  * **A:** Verify that `.htaccess` was uploaded into `public_html/`. In Hostinger File Manager, click **Settings** (gear icon) -> turn on **"Show Hidden Files"** to confirm `.htaccess` is present.
* **Q: Why does saving a citizen or formula say "Request failed"?**
  * **A:** Verify that the `data/` folder is writable (`0755`) and `data/db.json` has `0644` or `0666` permissions.
* **Q: Can I use MySQL or SQLite instead of `db.json` later?**
  * **A:** Yes! The PHP `api.php` file is structured with clean `db_read()` and `db_write()` helper functions. You can swap these two functions to use PHP PDO for SQLite (`data/db.sqlite`) or MySQL whenever your community scales past 1,000 citizens.
