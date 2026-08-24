# Contributing to MiLyfe

Welcome! MiLyfe is community-owned and community-built. Every contribution earns $MLY.

## Bounty System

We use a bounty system instead of traditional open source volunteering. Check [BOUNTY_ROADMAP.md](./BOUNTY_ROADMAP.md) for 160 available bounties.

### Tiers

| Tier | $MLY Range | Scope |
|------|-----------|-------|
| Small | 50-150 | Single component, utility, or fix |
| Medium | 150-500 | Full page/feature with DB integration |
| Large | 500-1500 | Multi-page system with business logic |
| Epic | 1500-5000 | Full domain requiring architecture decisions |

### Bonuses

- Speed bonus: +25% (completed within 3 days)
- Test coverage: +20%
- Documentation: +10%
- Clean PR (no review cycles): +15%
- First-time contributor: +50 $MLY welcome bonus

## How to Claim a Bounty

1. Find a bounty in [BOUNTY_ROADMAP.md](./BOUNTY_ROADMAP.md) or in GitHub Issues
2. Comment "Claiming this" on the issue
3. You have 7 days to submit a PR. No progress = auto-release.
4. Build it, test it, document it
5. Submit a PR referencing the bounty ID
6. Once merged: $MLY credited + "Built by" credit + Standing boost

## Development Setup

```bash
git clone https://github.com/RealMiLyfe/MiLyfe-Platform.git
cd MiLyfe-Platform
npm install
cp .env.local.example .env.local
# Add your Supabase keys
npm run dev
```

## Branch Strategy

- `main` — The lean 14-route MVP. Production code only.
- `reference` — The old 143-route codebase. Study it for context, don't PR against it.
- Feature branches: `feat/bounty-id-short-name` (e.g., `feat/p2-01-pocket-alive`)

## PR Guidelines

- One bounty per PR (unless tightly coupled)
- Include the bounty ID in your PR title: `feat(P2-01): Pocket Alive wallet animations`
- All PRs must pass CI (lint + typecheck)
- Keep changes focused. Don't refactor unrelated code.
- Mobile-first. Every UI must work on 320px screens.
- Accessible. Minimum: proper labels, focus management, color contrast.

## Code Standards

- TypeScript strict mode
- Server components by default, client components only when needed
- Supabase queries in server components (page.tsx), UI in client components
- Every route needs: `page.tsx`, `loading.tsx`, and a client view component
- Use existing UI components from `src/components/ui/`
- Tailwind only (no CSS modules, no styled-components)
- No `any` types without a comment explaining why

## What We Won't Merge

- Features not in the 14 core routes (those are bounties for later phases)
- PRs that add new dependencies without discussion
- Code without TypeScript types
- UI that doesn't work on mobile
- Changes that break existing routes

## Questions?

Open a Discussion on GitHub or post in the Builders forum space on the platform.
