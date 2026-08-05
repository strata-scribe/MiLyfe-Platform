# MiLyfe OS — Official Launch Checklist & 24-Hour Runbook

> **Targeting the First Founding Circle (7–13 Citizens in Jacksonville, FL)**
> This runbook is your step-by-step operational guide from first light to Circle consensus.

---

## Part I: Pre-Launch Readiness (Check Before Opening Traffic)

### 1. Choose & Verify Your Hosting Package
- [x] **Option 1: Standard Shared Hosting (Hostinger Non-VPS / PHP 8.x)**
  - Upload `hostinger/public_html/*` to your domain web root (`public_html/`).
  - Set folder permissions: `data/` (`0755`) and `data/db.json` (`0644` or `0666`).
- [x] **Option 2: Dedicated Server / Node.js Environment (`milyfe-platform/`)**
  - Run `npm install` and start the server:
    ```bash
    cd milyfe-platform
    PORT=3000 FIRST_USER_ADMIN=true npm start
    ```
- [x] **Option 3: Pure Static CDN / PWA (`hostinger/static-client-pwa/`)**
  - Upload static files; runs 100% local-first inside visitor browser storage.

### 2. Verify Canonical Logo & Locales
- [x] Canonical `logo.png` is embedded via base64 data URIs across all HTML pages and browser favicons.
- [x] Language switcher (`EN` / `ES` / `FR`) tested and active across all views.

---

## Part II: First 24 Hours — Launching Circle 1 (Jacksonville, FL)

### Step 1: Onboard Founding Citizen #1 (The Organizer)
1. Open your domain (or `http://localhost:3000/onboarding.html`).
2. Complete the 7-step wizard with location **`Jacksonville, FL`** and focus **`Governance`**.
3. Because `FIRST_USER_ADMIN=true` is enabled, Citizen #1 automatically receives the **`admin`** and **`organizer`** role.

### Step 2: Onboard Founding Citizens #2 through #7 (Quorum Achievement)
1. Share Citizen #1's invite link with 6 trusted founding citizens.
2. Ensure each citizen enters location **`Jacksonville, FL`** and selects their primary community need (`Housing`, `Food`, `Health`, `Wealth`, etc.).
3. Each citizen generates their **12-Word Spore Seed** backup in the **Data Pod (`pod`)** tab.

### Step 3: Trigger Circle Formation Auto-Match (7 Citizens)
1. Organizer logs in and opens the Formation Command Center (`/admin`).
2. Navigate to the **`Circles`** tab.
3. Click **`Run Auto-Match (7-13)`**.
   - *Result*: The system groups the 7 unassigned citizens into **`Circle_Jacksonville, FL_1`**.
   - Every citizen's dashboard status updates from `"Circle pending"` to `"Circle matched"`.

### Step 4: First Deliberation & 67% Supermajority MIP Vote
1. Citizens log in and open the **`Circle Hub`** tab.
2. Create the first community proposal:
   - **Title**: `Allocate 200 MLY for Circle community garden seeds and soil`
   - **Description**: `Founding Circle food resilience initiative in Jacksonville.`
3. All 7 citizens click **`Vote YES`**.
   - *Result*: Upon reaching 5/7 YES votes (**>= 67% Supermajority** with quorum), the MIP status instantly upgrades to **`PASSED`**.

### Step 5: Test the SLM Ribosome Co-Pilot & Sovereign Treasury
1. Open the **`Wealth / MLY`** tab.
2. In the SLM Ribosome box, type: `"Allocate 200 MLY for Circle community garden"`.
3. Click **`Draft AST`** -> inspect the Charter compliance badges -> click **`Approve & Sign`**.
4. Verify the cryptographic signature in the **`Immutable Ledger`** table and confirm balance updates.

### Step 6: Navigate the 5 Sovereign Civic Pillars (MiClass, MiJourney, MiDiscovery, MiStanding, MiStory)
1. **`MiClass`** (Civic Learning & U.S. Constitution Bridge): Explore how the 5 Charter principles map directly to the U.S. Constitution (4th, 5th, 1st, 9th, and 10th Amendments) and complete self-paced micro-lessons for +5 MiStanding.
2. **`MiJourney`** (11-Stage Sovereign Citizen Journey Map): Review your progress from First Light (Step 1) through Circle Matching (Step 5) to Elder Archiving (Step 11).
3. **`MiDiscovery`** (Academia R&D & Formal Verification): Confirm that all Ledger formulas are formally verified against Lean 4 proofs before execution.
4. **`MiStanding`** (Reputation & Rewards): Track your Fibonacci Level-Up progression (Levels 1, 2, 3, 5, 8, 13...) and non-extractive soulbound W3C badges.
5. **`MiStory`** (Collective Chronicle & ZK Privacy): Set your exteroception privacy dial (Level 0 Private, Level 1 ZK Anonymized, Level 2 Public) and view the Circle Tapestry.

### Step 7: Toggling the Global SLM Ribosome Chat Co-Pilot
1. From any tab in the Citizen Dashboard, click the floating **`💬 Ask SLM Ribosome`** button in the bottom-right corner.
2. The on-device assistant drawer opens, automatically aware of your current tab (`tab`).
3. Ask it questions about `MiClass`, `MiJourney`, `MiDiscovery`, `MiStanding`, `MiStory`, or ask it to draft Word-to-Math formula proposals!

---

## Part III: Ongoing Governance & Antifragility Drills

### 1. Weekly Offline Spore Snapshot Backup
Organizers should download a cryptographically signed, complete offline snapshot once per week:
- **Via Admin UI**: Open `/admin` -> click **`Export`** -> download JSON-LD Spore Snapshot.
- **Via Command Line**:
  ```bash
  node scripts/spore_backup.mjs milyfe-backup.jsonld
  ```

### 2. Emergency Recovery Drill (1-Second Restore)
If a server or cloud provider ever fails, restore your Circle in seconds:
- **Via Command Line**:
  ```bash
  node scripts/spore_recovery.mjs milyfe-backup.jsonld
  ```

---

## Part IV: Automated System Verification Commands

Run the full automated test suite anytime to prove 100% system health:
```bash
# Test the 7-Fold Vertical Slice Genesis Kit (10/10 passing)
cd milyfe-mvp && npm test && npm run slice

# Test the Web Platform & API Server (13/13 passing)
cd ../milyfe-platform && npm test
```
