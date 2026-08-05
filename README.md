# MiLyfe OS — Sovereign Community Governance & Economy Platform

[![CC0 Public Domain](https://img.shields.io/badge/License-CC0_1.0-blue.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
[![Tests Passing](https://img.shields.io/badge/Tests-29%2F29_Passing-brightgreen.svg)](#6-automated-verification-matrix-2929-passing)
[![Hostinger Ready](https://img.shields.io/badge/Hostinger-hPanel_%2F_PHP_8.x_Ready-00a991.svg)](hostinger/HOSTINGER_DEPLOYMENT.md)

> **"De-hype the internals, honor the 13 Laws, and ship vertical slices that breathe."**
> 
> MiLyfe is a living organism that grows by Fibonacci, repeats by Fractal, breeds by Chiasm, refuses to die by Quantum Immortality, sees twice by Dual Telemetry, holds infinity inside by Tesseract, lives circularly by Waste+Recycling, feels by Perception, thinks by a rainforest of Agents, speaks by SLM as foundation, reasons by Word-to-Math that grows, governs itself by Governance, and operates itself by Autonomous Ops — all folding 7 times around a live image of itself.

---

## 1. Where to Find Your Ready-to-Deploy Packages

When you download or clone this GitHub repository, you have instant access to three pre-configured, production-ready hosting packages:

```text
MiLyfe-Platform/
├── hostinger/
│   ├── public_html/         # ⭐ OPTION A: Full PHP 8.x Backend for Hostinger Shared/Non-VPS
│   ├── static-client-pwa/   # ⭐ OPTION B: Zero-Backend Local-First Static PWA (CDN Hosting)
│   └── HOSTINGER_DEPLOYMENT.md  # Detailed Hostinger hPanel File Manager deployment runbook
├── milyfe-platform/         # ⭐ OPTION C: Full Node.js 18+ Web Server & API Application
├── milyfe-mvp/              # ⭐ GENESIS KIT: 7-Fold Vertical Slice Core Engine (.mjs)
├── scripts/                 # ⭐ CLI TOOLS: Spore Backup & Recovery scripts
├── LAUNCH_CHECKLIST.md      # ⭐ LAUNCH RUNBOOK: Official 24-Hour Jacksonville, FL Runbook
└── uploads/                 # ⭐ NORTH STAR: Canonical 13 Laws Constitution & Masterlist
```

### Which Option Should You Choose?
* **For Hostinger Non-VPS / Shared Hosting (Single, Premium, Business, Cloud)** -> Use **`hostinger/public_html/`**. Read **[`hostinger/HOSTINGER_DEPLOYMENT.md`](hostinger/HOSTINGER_DEPLOYMENT.md)**.
* **For Static Hosting / CDN (Cloudflare Pages, Netlify, Hostinger Static)** -> Use **`hostinger/static-client-pwa/`**.
* **For Dedicated Server / VPS / Node.js Environment** -> Use **`milyfe-platform/`** (`PORT=3000 FIRST_USER_ADMIN=true npm start`).
* **For Core Engine R&D & Formal Proofs** -> Explore **`milyfe-mvp/`** (`npm run slice`).

---

## 2. Quick Start: Deploy to Hostinger in 2 Minutes

1. On your computer, open the **`hostinger/public_html/`** folder inside this downloaded repository.
2. Select **all files and folders inside** (`index.html`, `onboarding.html`, `login.html`, `citizen.html`, `admin.html`, `logo.png`, `style.css`, `common.js`, `api.php`, `.htaccess`, and `data/`) and zip them into `milyfe-hostinger.zip`.
3. Log in to **Hostinger hPanel** -> open **File Manager** -> double-click **`public_html/`**.
4. Delete any default placeholder files (like `default.php`), click **Upload**, and select `milyfe-hostinger.zip`.
5. Right-click `milyfe-hostinger.zip` -> **Extract** directly into `public_html/` -> delete the zip file.
6. Right-click `data/` -> **Permissions** -> set to **`0755`**. Open `data/`, right-click `db.json` -> **Permissions** -> set to **`0644`** (or `0666`).
7. Open your domain in your browser!
   * *Automatic Admin Promotion*: The first citizen to register on a clean database automatically becomes **Admin & Organizer**.

---

## 3. The 13 Canonical "Mi" Pillars

All dashboards and APIs are unified under the canonical **`Mi`** branding:

| Pillar | Canonical Space | Description & Key Functionality |
| :--- | :--- | :--- |
| **1. `Mi`** | **Floating AI Drawer** | On-device SLM Ribosome conversational co-pilot (`💬 Ask SLM Ribosome`), aware of your active tab. |
| **2. `MiPass`** | **Citizen Pass (`pass`)** | Verifiable W3C Identity with dynamic SVG QR Code check-in matrix & pledge signature. |
| **3. `MiCircle`** | **Circle Hub (`circle`)** | RSVP, upcoming assemblies, and 21-day MIP Supermajority voting toward 67% consensus. |
| **4. `MiWealth`** | **Treasury (`wealth`)** | Sovereign `$MLY` & Standing Ledger with verify-before-act Word-to-Math AST editor. |
| **5. `MiPod`** | **Data Pod (`pod`)** | Solid-Pod JSON-LD export, 12-word Spore Seed backup, and WebAuthn Passkeys. |
| **6. `MiStanding`** | **Reputation (`standing`)** | Non-extractive soulbound reputation and Fibonacci Level-Up progression (1, 2, 3, 5, 8, 13...). |
| **7. `MiStory`** | **Chronicle (`story`)** | Private interoception journal and Zero-Knowledge (ZK) opt-in privacy dials (`Level 0, 1, 2`). |
| **8. `MiJourney`** | **Journey Map (`journey`)** | 11-Stage Sovereign Citizen Journey Map tracking growth from First Light to Elder Heritage. |
| **9. `MiClass`** | **Civic Learning (`class`)** | Self-paced civic learning modules and the United States Constitution Alignment Bridge. |
| **10. `MiDiscovery`** | **Academia R&D (`discovery`)** | Lean 4 formal mathematical theorem verification and anonymized differential privacy datasets. |
| **11. `MiAgenda`** | **Values Agenda (`values`)** | Community need priority submission and ranking. |
| **12. `MiMissions`** | **Role Missions (`missions`)** | Suggested role onboarding task checklists and support lane mastery. |
| **13. `MiCommand`** | **Organizer Grid (`admin.html`)**| Citizen search, Auto-Match Circles (7-13), Solitude Alerts, and `MiPass` QR scan. |

---

## 4. Five Breakthrough Emergent Civic Features

1. **`MiPass` Verifiable QR Code & Offline Assembly Check-in (`POST /api/admin/attendance/scan`)**
   * Organizers in `MiCommand` can scan or enter a citizen's code to log assembly attendance and instantly award **`+10 MiStanding`**.
2. **`MiChiasm` Cross-Circle Hybridization (`POST /api/circles/chiasm`)**
   * Allows two formed Circles of 7–13 to weave their `MiStory` chronicles together and co-sponsor joint regional resilience projects.
3. **`MiMandate` Constitutional Word-to-Math Auto-Execution (`POST /api/formulas/mandate`)**
   * Lets citizens establish automated, recurring mutual-aid rules on the `MiWealth` ledger (e.g., *"If emergency fund drops below 100 MLY, allocate 5 MLY from Level 3+ citizens"*).
4. **`MiTwin` Spore Mesh Heartbeat (`GET /api/mesh/heartbeat`)**
   * Monitors offline peer-to-peer mesh synchronization and recovery status across Hot/Warm/Cold twins.
5. **`MiJury` Sortition Civic Deliberation Panel (`POST /api/circles/jury/select`)**
   * Performs an automated democratic sortition that randomly selects a Fibonacci panel of 5 citizens with Level 3+ `MiStanding` to deliberate on contested proposals.

---

## 5. Standalone Offline Spore Backup & Recovery CLI

For Organizers who want to backup or restore their entire community database off-grid:

```bash
# Export SHA-256 verified, HMAC-signed JSON-LD Spore Snapshot
node scripts/spore_backup.mjs milyfe-backup.jsonld

# Instantly verify SHA-256 integrity and restore database
node scripts/spore_recovery.mjs milyfe-backup.jsonld
```

---

## 6. Automated Verification Matrix (29/29 Passing)

The repository includes complete automated integration test suites for both the core engine and the platform API:

```bash
# 1. Run MiLyfe OS Genesis Kit Vertical Slice Tests (10/10 passing)
cd milyfe-mvp
npm test
npm run slice

# 2. Run Full Platform API & Emergent Feature Tests (19/19 passing)
cd ../milyfe-platform
npm test
```

### Verified Test Suites:
* **`1.`–`8.`**: Core Auth, CSRF, Word-to-Math, Ledger, Auto-Matching, Solid-Pod Export, and SSE Streams.
* **`9.`**: Circle Hub MIP 21-Day Supermajority Voting Engine (`POST /api/circles/proposals/vote`).
* **`10.`**: SLM Ribosome AI Co-Pilot Assistant (`POST /api/slm/assist`).
* **`11.`**: Sovereign Key Management, Spore Seed Backup & WebAuthn Passkeys.
* **`12.`**: Organizer Command Center Diagnostics & Solitude Alerts.
* **`13.`**: Complete Offline Spore Snapshot Backup & Instant Restore.
* **`14.`**: Integrated SLM Ribosome Co-Pilot & 5 Canonical Pillars (`MiClass`, `MiJourney`, `MiDiscovery`, `MiStanding`, `MiStory`).
* **`15.`**: `MiPass` Verifiable QR Code & Offline Assembly Attendance Scan (`+10 MiStanding`).
* **`16.`**: `MiChiasm` Cross-Circle Hybridization & Mutual Sponsorship Handshake.
* **`17.`**: `MiMandate` Constitutional Word-to-Math Auto-Execution Rule Engine.
* **`18.`**: `MiTwin` Spore Mesh Heartbeat & Offline Peer-to-Peer Verification.
* **`19.`**: `MiJury` Sortition-Based Civic Deliberation Panel.

---

## 7. Official Launch Runbook
Open **[`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md)** for the step-by-step 24-hour runbook to launch your first founding Circle of 7–13 citizens in Jacksonville, FL.
