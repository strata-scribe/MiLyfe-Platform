# MiLyfe — Developer Bounty Roadmap

**What this is:** Every feature, system, protocol, and module that MiLyfe needs — broken into claimable bounties for open source contributors. Built from ALL design documents.

**How bounties work:**
- Dynamic value: base × priority multiplier × community demand
- Appreciates 5%/week if unclaimed
- Bonuses: speed (+25%), tests (+20%), docs (+10%), clean PR (+15%), first-time contributor (+50 $MLY welcome)
- Claim locks for 7 days. No progress = auto-release.
- Merged = $MLY credited + permanent "Built by" credit + Standing (Maker facet)

**Bounty tiers:**
- 🟢 Small (50-150 $MLY) — Single component, utility, or fix
- 🟡 Medium (150-500 $MLY) — Full page/feature with DB integration
- 🟠 Large (500-1500 $MLY) — Multi-page system with business logic
- 🔴 Epic (1500-5000 $MLY) — Full domain/protocol requiring architecture decisions

---

## P0 — THE COORDINATION LAYER (Genuine Invention)

*These are what make MiLyfe different from every other platform. The "Mi Protocols" — the new thing nobody else has built.*

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P0-01 | **MiAction** — Common Human-Action Protocol | Every consequential action (spend, vote, transfer, publish, report) wrapped in a standard envelope with: actor, intent, scope, receipt, appeal path, offline capability. The spine everything else hangs on. | 🔴 Epic |
| P0-02 | **MiScope** — Relationship, Permission & Consent Graph | Who can see what. Who can do what. Household, guardian, care, separation, delegation — all modeled as a graph. "Only these people can see this." | 🔴 Epic |
| P0-03 | **MiReceipt** — Understandable Proof | Every action generates a human-readable receipt. Portable. Verifiable. "I can prove I voted, paid, contributed, was harmed." | 🟠 Large |
| P0-04 | **MiSource** — Provenance, Freshness & Correction | Where did this info come from? When was it last verified? Has it been corrected? Lineage tracking for all content. | 🟠 Large |
| P0-05 | **MiHandoff** — Helper-to-Human Case Routing | When AI can't handle it, seamless handoff to a human. Case management for escalation. "A human must decide." | 🟡 Medium |
| P0-06 | **MiAppeal** — Due-Process Correction Engine | Every enforcement action can be appealed. Structured appeal flow with community jury. "This person may appeal." | 🟠 Large |
| P0-07 | **MiStage** — Capability Readiness Gate | Practice vs Live. Features unlock when safety conditions are met. "This action is still walking." | 🟡 Medium |
| P0-08 | **MiWalk** — Offline Action & Conflict Engine | Actions taken offline queue, sync, and resolve conflicts when connectivity returns. CRDT-based. | 🔴 Epic |
| P0-09 | **MiShared** — Safe Shared-Device Shell | Multiple people on one phone. Privacy between users. Kiosk mode for library/community center. | 🟠 Large |
| P0-10 | **MiChildGate** — Age, Guardian, CSAM-Safe Surfaces | Non-optional child safety. Cannot be voted off. Age verification, guardian consent, safe public surfaces. | 🔴 Epic |

---

## P1 — CORE PLATFORM

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P1-01 | **Animated Citizen Card** | Visual identity card with standing facets, QR code, endorsements, contribution history. Exportable. | 🟡 Medium |
| P1-02 | **Visual Standing System** | 8-facet display (Neighbor/Carer/Maker/Teacher/Keeper/Voice/Shop/Helper). Decay visualization. Attestation UI. | 🟠 Large |
| P1-03 | **Journey Visualization** | Timeline of your MiLyfe — milestones, contributions, badges, growth. Not a feed — a story. | 🟡 Medium |
| P1-04 | **Personhood Verification** | Prove you're a unique human (for UBI anti-farming). Privacy-preserving. Not government ID. Web of trust or biometric. | 🔴 Epic |
| P1-05 | **Life Events System** | Name change, death, birth, move, marriage, separation, incarceration, release — events that affect identity and permissions. | 🟠 Large |
| P1-06 | **MiPlaceShift** — Portable Profile | When you move cities, what travels with you and what stays. Jurisdiction-aware. | 🟠 Large |
| P1-07 | **MiKinship** — Household Graph | Family, guardian, care relationships. Separation handling. Custody. Elder care. Who speaks for whom. | 🟠 Large |
| P1-08 | **MiNotify** — Privacy-Aware Notification Router | Route notifications by channel (in-app, push, email, SMS) respecting privacy settings, do-not-disturb, urgency levels. | 🟡 Medium |
| P1-09 | **MiRender** — Cross-Format Content Package | Same content renders as: app page, print PDF, SMS, voice (TTS), offline cached, screen-reader optimized. | 🟠 Large |
| P1-10 | **Guest Experience** | Browse without signup. See what's available. Understand the value prop. Convert without pressure. | 🟢 Small |

---

## P2 — ECONOMY & TOKENOMICS

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P2-01 | **Pocket Alive** | Wallet that FEELS alive — particle effects on transactions, $MLY flowing visually, spending categories animated. | 🟡 Medium |
| P2-02 | **Three Pots System** | Spending pot, savings pot, community pot — with rules for each. Auto-allocation. | 🟡 Medium |
| P2-03 | **Offline Pocket** | Spend and receive $MLY without internet. Store-carry-forward. Reconcile on reconnect. | 🔴 Epic |
| P2-04 | **Peer Swap Engine** | Direct person-to-person exchange with escrow, dispute resolution, and reputation impact. | 🟠 Large |
| P2-05 | **Community Treasury Dashboard** | Where the burned $MLY goes. What it funds. How to propose spending it. Full transparency. | 🟡 Medium |
| P2-06 | **Tokenomics Governance** | UI for proposing changes to: UBI amount, decay rate, burn rate, max balance. Vote required. | 🟡 Medium |
| P2-07 | **Economic Abuse Detection** | Patterns: coerced transfers, hoarding via proxies, UBI farming. Alert without auto-punish. | 🟠 Large |
| P2-08 | **$MLY Transaction History (Rich)** | Categorized spending, monthly summaries, trends, export for personal records. | 🟢 Small |
| P2-09 | **Business Acceptance Tools** | POS for shops accepting $MLY. QR scan, receipt generation, daily settlement view. | 🟡 Medium |
| P2-10 | **MiTax** — Tax Documentation | Annual $MLY earnings statement. What's reportable. IRS guidance. Export for accountant. | 🟡 Medium |

---

## P3 — SOCIAL & COMMUNICATION

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P3-01 | **Messages Alive** | Typing ripples. Read receipts as gentle presence. Voice messages that play as waveforms. | 🟡 Medium |
| P3-02 | **Care Exchange (Time Banking)** | I do 1 hour for you, you do 1 hour for someone else. Network of reciprocal care. | 🟠 Large |
| P3-03 | **Quick Post (10-Second Content)** | Photo + one line + post. Fastest possible content creation. No friction. | 🟢 Small |
| P3-04 | **Live Activity Feed (Heartbeat)** | Real-time pulse of community activity. Not algorithmic — chronological with priority bubbling. | 🟡 Medium |
| P3-05 | **Celebrations System** | Confetti, community-wide announcements, milestone celebrations. Shared joy. | 🟢 Small |
| P3-06 | **E2EE Messaging** | End-to-end encryption for sensitive conversations. Signal Protocol or equivalent. | 🔴 Epic |
| P3-07 | **Federation / ActivityPub Full** | Two-way post sync with Mastodon/Threads. Real federation, not just outbox. | 🔴 Epic |
| P3-08 | **MiMesh** — Peer-to-Peer Communication | Device-to-device messaging without internet (Bluetooth/WiFi Direct). For when infrastructure fails. | 🔴 Epic |
| P3-09 | **Circles System** | Private groups with shared governance. Neighborhood circles, interest circles, family circles. | 🟠 Large |
| P3-10 | **MiStory Studios** — Autonomous Content Production | AI-assisted content pipeline: community news, event recaps, story generation. 130+ open source tools integrated. | 🔴 Epic |

---

## P4 — CIVIC & GOVERNANCE

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P4-01 | **Zero-Knowledge Voting** | Vote without revealing your choice. Verifiable results without individual disclosure. ZK-SNARKs or similar. | 🔴 Epic |
| P4-02 | **Delegation Engine (Full)** | Liquid democracy — delegate your vote by topic. Constrained delegation. Revocable. Chain-aware. | 🟠 Large |
| P4-03 | **MiNation** — Multi-City Federation | Multiple MiLyfe cities connected. Shared protocols. Local governance. Inter-city trade. | 🔴 Epic |
| P4-04 | **MiTreaty** — Inter-Circle Diplomacy | Circles negotiate agreements. Shared resources. Mutual aid between circles. | 🟠 Large |
| P4-05 | **MiCommons** — Sovereign Infrastructure Registry | Community-owned resources: spectrum, land, tools, vehicles. Tracked. Maintained. Shared. | 🟠 Large |
| P4-06 | **MiStewardship** — Democratic Leadership Rotation | No permanent leaders. Roles rotate. Performance tracked. Community evaluates. | 🟡 Medium |
| P4-07 | **Petition/Referendum System** | Collect signatures. Trigger votes. Recall leaders. Direct democracy tools. | 🟡 Medium |
| P4-08 | **Living Compact (Interactive Constitution)** | Amendment workflow. Annotation. Community commentary. Audio reading. Scenario simulator. | 🟠 Large |
| P4-09 | **Transparency Dashboard (Real-time)** | Live updating: treasury, moderation, governance, platform health. Drill-down. Time ranges. | 🟡 Medium |
| P4-10 | **MiModerate** — Federated Safety Protocol | Cross-circle moderation. Shared block lists (opt-in). Community juries. Appeal system. | 🟠 Large |

---

## P5 — COMMERCE & LIVELIHOOD

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P5-01 | **Full Marketplace (7 Categories)** | Goods, services, gigs, housing, vehicles, food, barter. Each with appropriate lifecycle. | 🔴 Epic |
| P5-02 | **Quests System** | Community tasks that need doing. Claim, complete, earn. Verified by community. | 🟠 Large |
| P5-03 | **Shop Profiles (First-Class)** | Business pages with: menu/catalog, hours, $MLY acceptance, reviews, gallery, map pin. | 🟠 Large |
| P5-04 | **Rides Coordination** | Offer/request rides. Route matching. $MLY payment. Safety features. | 🟡 Medium |
| P5-05 | **MiWork** — Gig/Job Matching | Post work needed. Find workers. Track hours. Pay in $MLY. No middleman fees. | 🟠 Large |
| P5-06 | **MiHouse** — Full Housing System | Listings, applications, lease management, roommate matching, maintenance requests. | 🟠 Large |
| P5-07 | **MiCar** — Vehicle Lifecycle | Registration, maintenance, sharing, gas/EV tracking, insurance co-op, parking. | 🟠 Large |
| P5-08 | **MiFood** — Food System | Community gardens, food sharing, meal coordination, pantry inventory, farm-to-table. | 🟠 Large |
| P5-09 | **MiSupply** — Supply Chain | Track goods from source to community. Bulk buying. Group orders. Delivery coordination. | 🟠 Large |
| P5-10 | **Commerce Infrastructure** | Escrow, dispute resolution, seller analytics, buyer protection, order lifecycle state machine. | 🔴 Epic |

---

## P6 — MEDIA & CULTURE

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P6-01 | **Media Creation (10-second)** | Record → post. Photo + caption → post. Voice note → post. Minimum friction. | 🟢 Small |
| P6-02 | **MiTV Live Streaming** | OBS → platform → viewers. Chat. Tips. Scheduling. DVR. Channels. | 🟠 Large |
| P6-03 | **MiBlog — Rich Long-Form** | WYSIWYG editor, series, newsletter, comments, cross-post to forum. | 🟡 Medium |
| P6-04 | **Podcast Network** | RSS generation, episode management, cross-promotion, listener stats. | 🟡 Medium |
| P6-05 | **Radio DJ System** | Live audio rooms, request queue, dedications, genre stations, scheduling. | 🟡 Medium |
| P6-06 | **MiVlog — Daily Video** | Quick chronological diary format. Templates. Community challenges. | 🟢 Small |
| P6-07 | **Creator Analytics** | Views, engagement, revenue, audience demographics, content performance. | 🟡 Medium |
| P6-08 | **Content Scheduling** | Queue posts for future. Optimal time suggestions. Calendar view. | 🟢 Small |
| P6-09 | **Witness Mode** | One-tap recording that's timestamped, geotagged, and immediately backed up. For police encounters, incidents. | 🟠 Large |
| P6-10 | **MiPress** — Community Journalism | Collaborative reporting. Fact-checking. Source credibility. Corrections protocol. | 🟠 Large |

---

## P7 — SAFETY & DEFENSE

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P7-01 | **Leave-Now Flow** | DV escape: one tap → hide profile, alert contacts, activate escape plan, hidden finances. | 🟠 Large |
| P7-02 | **Walking-Home Timer** | Timer that alerts contacts if not cancelled. GPS sharing during walk. | 🟢 Small |
| P7-03 | **Rights Card** | Your constitutional rights on your phone. Audio playback. Police encounter guidance. | 🟢 Small |
| P7-04 | **Mutual Defense Circles** | Groups that watch out for each other. Alert systems. Coordinated response. | 🟡 Medium |
| P7-05 | **Mental Health Crisis Flow** | 988 integration. De-escalation. Peer support activation. Not calling police. | 🟡 Medium |
| P7-06 | **Traffic Stop Protocol** | Camera auto-records. Rights displayed. Contact notified. Location shared. Legal guidance. | 🟡 Medium |
| P7-07 | **Emergency Crisis Streaming** | One tap: live stream to trusted contacts + cloud backup. Uninterruptible. | 🟠 Large |
| P7-08 | **Vanguard Protocol (Gangs to Guilds)** | Peace economy. Street leaders become guild coordinators. Paid for peace, not territory. | 🔴 Epic |
| P7-09 | **MiGuard** — Community Patrol System | Routes, shifts, real-time coordination, incident reporting, de-escalation protocols. | 🟠 Large |
| P7-10 | **Sovereign Safety (Advanced)** | Threat detection across multiple signals. Pattern recognition. Proactive protection. | 🔴 Epic |

---

## P8 — EDUCATION & GROWTH

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P8-01 | **Learn Alive** | Not a textbook — interactive, gamified, with streaks, XP, and community cohorts. | 🟠 Large |
| P8-02 | **MiChild / MiKids** | Full interactive experience for children. Parental controls. Age-appropriate content. Safe. | 🔴 Epic |
| P8-03 | **MiSandbox** — Youth Sandbox | Safe space for teens. Limited economy. Mentored. Cannot be exploited. | 🟠 Large |
| P8-04 | **Coaching Marketplace** | Find coaches (financial, career, health, life). Book. Pay in $MLY. Rate. | 🟡 Medium |
| P8-05 | **Certificate Generation** | Verifiable credentials for course completion. Portable. Employer-verifiable. | 🟡 Medium |
| P8-06 | **MiLang** — Language Learning | Community-taught language exchange. Pairs speakers of different languages. | 🟡 Medium |
| P8-07 | **MiArchive** — Community Memory | Oral histories. Neighborhood stories. Preserved knowledge. Searchable. | 🟡 Medium |
| P8-08 | **Research Platform (MiAcademia)** | Community R&D. Study groups. Papers. Grants funded by $MLY. Peer review. | 🟠 Large |
| P8-09 | **Word-to-Math Engine** | "If I save $50/week for a year" → shows the math, visualized. Financial literacy tool. | 🟡 Medium |
| P8-10 | **MiScenario** — Rights & Failure Simulator | "What happens if..." scenarios. Practice your rights. Understand consequences. | 🟡 Medium |

---

## P9 — HEALTH & WELLNESS

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P9-01 | **Health Sharing Pool (Full)** | 4 tiers, claims, community voting on large claims, telehealth integration. | 🔴 Epic |
| P9-02 | **Risk Sharing (Property/Vehicle/Life/Business)** | Category pools, monthly contributions, 2-witness claims, auto-approve under threshold. | 🔴 Epic |
| P9-03 | **MiWell** — Holistic Wellness Tracking | Beyond check-ins: habits, goals, correlations ("you sleep better when you exercise"). | 🟡 Medium |
| P9-04 | **MiCare** — Caregiver Coordination | For those caring for elderly/disabled family. Scheduling, respite, support groups. | 🟡 Medium |
| P9-05 | **Crisis Resources (Live)** | Real-time updated crisis numbers, locations, availability. Not static links. | 🟢 Small |
| P9-06 | **Harm Reduction Resources** | Naloxone locations, safe use info, test strips, no-judgment support. | 🟢 Small |
| P9-07 | **MiClinic** — Community Health Directory | Map of free/sliding-scale clinics. Wait times. Accepts $MLY. Telehealth options. | 🟡 Medium |
| P9-08 | **Sobriety Tracking (Full)** | Streaks, milestones, sponsor matching, meeting finder, relapse protocol. | 🟠 Large |
| P9-09 | **MiMind** — Mental Health Tools | Mood journaling, therapy directory, peer support matching, CBT exercises. | 🟠 Large |
| P9-10 | **Community Health Dashboard** | Anonymous aggregate: community mood, wellness trends, resource utilization. | 🟡 Medium |

---

## P10 — FINANCIAL SERVICES

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P10-01 | **Savings Circles (Tandas/SuSu)** | Create, join, contribute, rotate payouts. Full lifecycle with defaults handling. | 🟠 Large |
| P10-02 | **Peer Micro-Lending** | Request, offer, agree, track repayments, close. Standing impact on default. | 🟠 Large |
| P10-03 | **Emergency Fund** | Pool + committee + request + 4-hour response. Categories: eviction, medical, car, utility, funeral. | 🟠 Large |
| P10-04 | **Bill Splitting** | Create, add members, track who paid, settle. Recurring splits. | 🟡 Medium |
| P10-05 | **Will/Trust/POA Builder** | Guided questionnaire → legal document → community witnesses → vault storage. | 🟠 Large |
| P10-06 | **Community Credit Score** | Internal reputation based on: circle payments, loan repayment, reliability. Never shared externally. | 🟡 Medium |
| P10-07 | **Predatory Lender Database** | Community-flagged. True cost calculator. Alternatives section. Report new. | 🟡 Medium |
| P10-08 | **Financial Coaching** | Peer coaches who completed courses. Book sessions. Rate. Track progress. | 🟡 Medium |
| P10-09 | **MiInsure** — Community Insurance Alternative | Full mutual aid insurance: property, vehicle, life transition, business. | 🔴 Epic |
| P10-10 | **MiPurse** — Group Savings Goals | Vacation fund, equipment fund, event fund. Transparent. Withdrawal rules. | 🟢 Small |

---

## P11 — POPULATION SERVICES

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P11-01 | **MiReentry** — Formerly Incarcerated | Housing without background checks, ID rebuilding, expungement guide, mentor matching, voting restoration. | 🟠 Large |
| P11-02 | **MiShelter** — Unhoused | Resource map (real-time), day storage, mail service, income without address, transition housing. | 🟠 Large |
| P11-03 | **MiElders** — Aging/Isolated | One-button check-in, companion matching, scam protection, home repair help, legacy planning. | 🟠 Large |
| P11-04 | **MiYouth** — Foster Youth Aging Out | Bonus UBI, vetted housing, life skills fast-track, mentor matching, chosen family network. | 🟠 Large |
| P11-05 | **MiSafety** — DV/Trafficking Survivors | Anonymous mode, escape plan, hidden finances, safe houses, quick-exit disguise. | 🔴 Epic |
| P11-06 | **MiRecovery** — Addiction | Sobriety tracking, meeting finder, sponsor matching, relapse protocol (support not punishment), milestones. | 🟠 Large |
| P11-07 | **MiVeterans** — Those Who Served | Benefits navigator, disability claim assistant, MOS translator, peer network, vet business directory. | 🟠 Large |
| P11-08 | **MiAccess** — Disability | Equipment lending library, accessible transport, adaptive employment, ADA advocacy, PCA matching. | 🟠 Large |
| P11-09 | **MiImmigrant** — Regardless of Status | Know Your Rights (multilingual), community ID, sanctuary employers, family safety plan, rapid response. | 🟠 Large |
| P11-10 | **MiParents** — Single Parents | Childcare exchange, co-parent communication (documented), meal trains, activity exchange, respite care. | 🟠 Large |

---

## P12 — INFRASTRUCTURE & DEVOPS

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P12-01 | **Local-First Data (CRDT/Automerge)** | All user data lives on-device first. Syncs to cloud optionally. Conflict resolution. | 🔴 Epic |
| P12-02 | **Self-Hosted Supabase** | Full Supabase stack on community hardware. Migration from cloud. Zero dependency on Supabase Inc. | 🟠 Large |
| P12-03 | **MiGit (Forgejo)** | Community-owned git hosting. For the platform's own code. Decentralized development. | 🟡 Medium |
| P12-04 | **Federation Protocol** | Connect multiple MiLyfe instances. Shared identity. Cross-instance messaging and trade. | 🔴 Epic |
| P12-05 | **K3s Deployment** | Kubernetes-lite for community infrastructure. Auto-scaling. Self-healing. | 🟠 Large |
| P12-06 | **IoT Spine (MiSpine)** | FIWARE-MQTT bus connecting physical devices: air quality, water, traffic, energy. | 🔴 Epic |
| P12-07 | **MiDTN** — Store-Carry-Forward | Messages and transactions travel across disconnected networks. Mesh relay. | 🔴 Epic |
| P12-08 | **MiTURN** — Distributed NAT Traversal | Community-contributed TURN servers for WebRTC. No corporate dependency for video calls. | 🟡 Medium |
| P12-09 | **MiNOC** — Network Operations Center | Topology map, health monitoring, coverage visualization. Community-visible. | 🟡 Medium |
| P12-10 | **Hybrid Node (Desktop/Home Server)** | One-click install: run a MiLyfe node from your home. Contribute storage, compute, relay. | 🟠 Large |

---

## P13 — AI & HELPERS

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P13-01 | **Mi (Front-Door Helper)** | Conversational AI that navigates the platform for you. "Mi, send $5 to Maria." | 🟠 Large |
| P13-02 | **Domain Helpers (6+)** | Legal Mi, Health Mi, Finance Mi, Safety Mi, Learning Mi, Career Mi — specialized. | 🔴 Epic |
| P13-03 | **Helper Rails (Cannot Override)** | AI cannot: spend money, publish content, change safety settings, make legal claims, impersonate. | 🟡 Medium |
| P13-04 | **SLM Pipeline (On-Device AI)** | Small language models running locally. Private. No cloud. Works offline. | 🔴 Epic |
| P13-05 | **RAG over Community Knowledge** | Mi searches wiki, courses, resources, forum to answer questions with community-specific context. | 🟡 Medium |
| P13-06 | **Proactive Nudges** | "You haven't checked in for 3 days — everything okay?" Caring, not nagging. | 🟢 Small |
| P13-07 | **Helper Citizenship** | AI earns standing over time. Community evaluates helpers. Bad helpers can be recalled. | 🟡 Medium |
| P13-08 | **MiTwin** — Personal Digital Twin | Learns your patterns. Predicts needs. Acts on your behalf (with permission). | 🔴 Epic |
| P13-09 | **Eco-Bounties (AI-Verified Environmental)** | Report trash/pollution with photo → AI verifies → community validates → earn $MLY. | 🟠 Large |
| P13-10 | **Content Moderation AI** | Pre-screening for toxicity, NSFW, misinformation. Flags for human review. Never auto-punishes. | 🟡 Medium |

---

## P14 — MOBILE & HARDWARE

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P14-01 | **React Native App** | Full native mobile experience. Same codebase philosophy. Push notifications. Biometric auth. | 🔴 Epic |
| P14-02 | **PWA Enhancements** | Install prompt, shortcuts, offline mode, background sync, share target. | 🟡 Medium |
| P14-03 | **MiESP** — $5 Mesh Nodes | ESP32 firmware: LoRa + ESP-NOW + WiFi. Community mesh infrastructure for $5/node. | 🔴 Epic |
| P14-04 | **MiKit** — Offline Mesh-in-a-Box | Hardware BOM + firmware + docs for deploying a neighborhood mesh network. | 🔴 Epic |
| P14-05 | **MiSpectrum** — RF Optimizer | Within legal power/duty-cycle, optimize radio frequency usage for mesh. | 🟠 Large |
| P14-06 | **MiSFU** — Video Across Mesh Islands | Cascade video conferences across disconnected mesh segments. | 🔴 Epic |
| P14-07 | **MiAudio** — On-Device Audio Processing | RNNoise + AEC + Codec2. Crystal clear voice on bad connections. | 🟠 Large |
| P14-08 | **MiDNS** — Human Names Without ICANN | Resolve community names without depending on domain registrars. | 🟠 Large |
| P14-09 | **MiVoiceMail** — DTN Async Voice | Send voice messages on narrowband (LoRa). Arrive when connectivity permits. | 🟡 Medium |
| P14-10 | **Community Kiosk/Terminal** | Physical device at community centers. Public access point. Accessible. | 🟠 Large |

---

## P15 — SMART UNIVERSE (Physical World Domains)

| ID | Bounty | Description | Tier |
|----|--------|-------------|------|
| P15-01 | **MiTransit** — Public Transit Integration | GTFS real-time, route planning, community bus/shuttle coordination. | 🟡 Medium |
| P15-02 | **MiGrid** — Community Energy | Solar sharing, battery storage coordination, outage reporting, usage tracking. | 🔴 Epic |
| P15-03 | **MiWater** — Water Quality | Sensor data, contamination alerts, conservation tracking, infrastructure reporting. | 🟠 Large |
| P15-04 | **MiFarm** — Community Agriculture | Garden plots, seed exchange, harvest sharing, growing guides, seasonal planning. | 🟡 Medium |
| P15-05 | **MiWaste** — Waste Coordination | Recycling, composting, bulk pickup coordination, zero-waste challenges. | 🟢 Small |
| P15-06 | **MiEarth** — Environmental Monitoring | Air quality, noise, light pollution. Community sensors. Data visualization. | 🟠 Large |
| P15-07 | **MiFactory** — Community Manufacturing | Shared tools, 3D printers, workshop scheduling, skill sharing, project collaboration. | 🟡 Medium |
| P15-08 | **MiCarbon** — Cross-Domain Carbon Ledger | No fake offsets. Real measurement across energy, transport, waste, food. Community targets. | 🟠 Large |
| P15-09 | **MiEmergency** — Cross-Domain Emergency | When disaster hits: coordinate across all domains simultaneously. Shelter + food + transport + safety. | 🔴 Epic |
| P15-10 | **MiDistrict** — Neighborhood Dashboard | Aggregate view of one neighborhood: health, safety, economy, infrastructure, demographics. | 🟡 Medium |

---

## TOTALS

| Priority | Bounties | Epics | Large | Medium | Small |
|----------|----------|-------|-------|--------|-------|
| P0 Coordination | 10 | 4 | 4 | 2 | 0 |
| P1 Core Platform | 10 | 1 | 5 | 3 | 1 |
| P2 Economy | 10 | 1 | 2 | 6 | 1 |
| P3 Social | 10 | 4 | 2 | 2 | 2 |
| P4 Civic | 10 | 2 | 5 | 3 | 0 |
| P5 Commerce | 10 | 2 | 6 | 2 | 0 |
| P6 Media | 10 | 0 | 4 | 4 | 3 |
| P7 Safety | 10 | 3 | 3 | 3 | 1 |
| P8 Education | 10 | 1 | 3 | 6 | 0 |
| P9 Health | 10 | 2 | 3 | 4 | 2 |
| P10 Financial | 10 | 2 | 5 | 4 | 1 |
| P11 Population | 10 | 1 | 9 | 0 | 0 |
| P12 Infrastructure | 10 | 5 | 3 | 3 | 0 |
| P13 AI | 10 | 4 | 2 | 4 | 1 |
| P14 Mobile/Hardware | 10 | 5 | 4 | 2 | 0 |
| P15 Smart Universe | 10 | 3 | 4 | 4 | 1 |
| **TOTAL** | **160** | **40** | **64** | **52** | **13** |

---

## BOUNTY VALUE ESTIMATES

| Tier | Count | Base Range | Total Range |
|------|-------|-----------|-------------|
| 🟢 Small | 13 | 50-150 $MLY | 650 — 1,950 $MLY |
| 🟡 Medium | 52 | 150-500 $MLY | 7,800 — 26,000 $MLY |
| 🟠 Large | 64 | 500-1500 $MLY | 32,000 — 96,000 $MLY |
| 🔴 Epic | 40 | 1500-5000 $MLY | 60,000 — 200,000 $MLY |
| **TOTAL** | **160** | — | **100,450 — 323,950 $MLY** |

*Values are dynamic. Community governance adjusts amounts. Priority multiplier increases bounties the community votes for. Time appreciation increases unclaimed bounties.*

---

## HOW THIS MAPS TO THE EXISTING CODE

Everything in `src/app/(platform)/` is a **reference implementation** for these bounties. Contributors study it, then either:
- Polish it into production quality (add tests, optimize, document)
- Rewrite it properly against the spec
- Extend it with missing sub-features

The 37,000 lines already written are the blueprints. The bounties are the contract to make them real.

---

*Built for the people who need it most. Governed by the people who use it. Built by the people who believe in it.*
