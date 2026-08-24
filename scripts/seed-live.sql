-- MiLyfe MVP — Seed Demo Data
-- Uses existing user IDs from the live database

-- ===== FORUM SPACES =====
INSERT INTO public.forum_spaces (name, slug, description, icon, post_count, member_count) VALUES
  ('General', 'general', 'Open discussion for the community', '💬', 3, 5),
  ('Governance', 'governance', 'Proposals, voting, and civic discussion', '🏛️', 2, 5),
  ('Economy', 'economy', '$MLY, tokenomics, and community commerce', '💰', 1, 5),
  ('Neighborhood', 'neighborhood', 'Local issues and neighborhood coordination', '🏘️', 2, 5),
  ('Help & Support', 'help', 'Ask questions and help fellow citizens', '🤝', 1, 5),
  ('Builders', 'builders', 'For developers and contributors building MiLyfe', '🔨', 1, 5)
ON CONFLICT (slug) DO NOTHING;

-- ===== FORUM POSTS =====
INSERT INTO public.forum_posts (space_id, author_id, title, body, upvotes, reply_count) VALUES
  ((SELECT id FROM public.forum_spaces WHERE slug='general'), '8a682bed-30ef-4c36-9ace-da3062115c36', 'Welcome to MiLyfe!', 'Hey everyone! Excited to see this platform come together. Let''s build something real for our community. What features are you most looking forward to?', 8, 3),
  ((SELECT id FROM public.forum_spaces WHERE slug='general'), 'b8388317-778a-4566-906c-8ba51bb77d9b', 'How does $MLY work?', 'I just got my first 50 $MLY from signing up. Can someone explain how the three pots system works? What goes into savings vs community?', 5, 2),
  ((SELECT id FROM public.forum_spaces WHERE slug='governance'), '5b582ba5-5e8b-4504-b5dd-9044ade2fedb', 'Proposal: Weekly Community Call', 'I think we should have a weekly video call for community coordination. Sundays at 5pm? We could use LiveKit since it''s already integrated. Thoughts?', 12, 4),
  ((SELECT id FROM public.forum_spaces WHERE slug='governance'), '4c9dbd9c-e911-42b2-a267-5f154fd0a19e', 'Standing Decay Rate Discussion', 'The current decay model hasn''t been set yet. What do you all think is fair? 1% per week? 5% per month? We need to balance activity incentive with not punishing people who take breaks.', 7, 3),
  ((SELECT id FROM public.forum_spaces WHERE slug='neighborhood'), '8a682bed-30ef-4c36-9ace-da3062115c36', 'Eastside Cleanup This Saturday', 'Organizing a neighborhood cleanup at MLK Park this Saturday 9am. Trash bags provided. Earn $MLY for participating! Meet at the pavilion.', 15, 5),
  ((SELECT id FROM public.forum_spaces WHERE slug='neighborhood'), 'b8388317-778a-4566-906c-8ba51bb77d9b', 'Streetlight out on Maple Ave', 'The streetlight at Maple and 5th has been out for two weeks. Anyone know how to report this through the city? Or should we use our own channels?', 4, 2),
  ((SELECT id FROM public.forum_spaces WHERE slug='economy'), '5b582ba5-5e8b-4504-b5dd-9044ade2fedb', 'First shops accepting $MLY', 'James''s Barbershop is now accepting $MLY! Who else wants to list their business? The more places that accept it, the more real it becomes.', 20, 6),
  ((SELECT id FROM public.forum_spaces WHERE slug='help'), '4c9dbd9c-e911-42b2-a267-5f154fd0a19e', 'How do I earn more standing?', 'My standing is all zeros right now. How do I start building it up? Do I just need to be active or do people need to attest for me?', 3, 2),
  ((SELECT id FROM public.forum_spaces WHERE slug='builders'), '5b582ba5-5e8b-4504-b5dd-9044ade2fedb', 'Contributing to MiLyfe — Getting Started', 'For any developers joining: check CONTRIBUTING.md and the BOUNTY_ROADMAP.md. There are 160 bounties ranging from 50-5000 $MLY. Start with "good first issue" labeled ones.', 9, 1),
  ((SELECT id FROM public.forum_spaces WHERE slug='general'), '4c9dbd9c-e911-42b2-a267-5f154fd0a19e', 'Introduce yourself!', 'Let''s get to know each other. I''m Gloria, retired teacher, been in this neighborhood 30 years. What brought you to MiLyfe?', 11, 7)
ON CONFLICT DO NOTHING;

-- ===== PROPOSALS =====
INSERT INTO public.proposals (author_id, creator_id, title, body, category, status, votes_for, votes_against, quorum_required, opens_at, closes_at) VALUES
  ('5b582ba5-5e8b-4504-b5dd-9044ade2fedb', '5b582ba5-5e8b-4504-b5dd-9044ade2fedb', 'Set Daily UBI to 10 $MLY', 'Proposal: Set the daily universal basic income distribution to 10 $MLY per citizen. This amount is sustainable with our current treasury and provides meaningful daily value. Can be adjusted by future vote.', 'policy', 'active', 4, 1, 5, NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days'),
  ('4c9dbd9c-e911-42b2-a267-5f154fd0a19e', '4c9dbd9c-e911-42b2-a267-5f154fd0a19e', 'Establish Community Garden at Oak Park', 'Allocate 200 $MLY from treasury to fund raised beds, soil, and seeds for a community garden at Oak Park. Gloria and Maria will coordinate. Open to all citizens.', 'treasury', 'active', 3, 0, 5, NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days'),
  ('8a682bed-30ef-4c36-9ace-da3062115c36', '8a682bed-30ef-4c36-9ace-da3062115c36', 'Weekly Community Cleanup Bounty', 'Create a standing bounty: 25 $MLY for anyone who participates in weekly neighborhood cleanups (verified by 2 witnesses). Builds Neighbor standing facet.', 'policy', 'active', 5, 0, 5, NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days'),
  ('b8388317-778a-4566-906c-8ba51bb77d9b', 'b8388317-778a-4566-906c-8ba51bb77d9b', 'Add Spanish Language Support', 'Our community is 40% Spanish-speaking. We should prioritize i18n for the core routes. This is a bounty-eligible task — any developer can claim it.', 'general', 'active', 4, 0, 5, NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- ===== WIKI PAGES =====
INSERT INTO public.wiki_pages (slug, title, body, category, author_id, published, revision_count) VALUES
  ('what-is-milyfe', 'What is MiLyfe?', 'MiLyfe is a community-owned civic platform where every citizen earns $MLY (community currency), participates in governance, connects with neighbors, and accesses resources.\n\n## Core Principles\n\n- **Community-owned**: No corporation owns your data or decides the rules\n- **Universal Basic Income**: Every citizen earns $MLY daily just for being part of the community\n- **Direct Democracy**: Propose, discuss, and vote on changes\n- **8-Facet Standing**: Reputation earned through action, not popularity\n\n## How It Works\n\n1. Sign up and complete onboarding\n2. Receive your welcome $MLY\n3. Start participating — vote, post, connect, check in\n4. Earn standing as others attest to your contributions\n5. Use $MLY at participating businesses or save it', 'general', '5b582ba5-5e8b-4504-b5dd-9044ade2fedb', true, 1),
  ('mly-tokenomics', '$MLY Tokenomics', '## The Three Pots\n\nEvery citizen has three pots in their wallet:\n\n- **Spending**: For daily transactions, transfers, and payments\n- **Savings**: Protected funds that grow. Cannot be spent impulsively.\n- **Community**: Your contribution to the collective. Funds proposals and projects.\n\n## How $MLY is Created\n\n- **UBI Distribution**: 10 $MLY/day to every citizen\n- **Rewards**: Earned through community participation\n- **Quest Completion**: Bounties for specific tasks\n\n## How $MLY is Destroyed\n\n- **Community Contributions**: Burns reduce supply\n- **Decay**: Inactive balances slowly decay (proposed, not yet active)\n\n## Value\n\n$MLY has value because local businesses accept it and because it represents real community contribution.', 'economy', '5b582ba5-5e8b-4504-b5dd-9044ade2fedb', true, 2),
  ('standing-system', 'The 8-Facet Standing System', '## What is Standing?\n\nStanding is MiLyfe''s reputation system. Unlike followers or likes, standing is earned through verified actions and attestations from other citizens.\n\n## The 8 Facets\n\n1. **Neighbor** — Community presence, showing up, local participation\n2. **Carer** — Caring for others, mutual aid, support\n3. **Maker** — Building things, creating, contributing code or art\n4. **Teacher** — Sharing knowledge, mentoring, educating\n5. **Keeper** — Moderation, safety, stewardship of shared resources\n6. **Voice** — Governance participation, voting, proposing\n7. **Shop** — Fair commerce, reliable business dealings\n8. **Helper** — Answering questions, supporting newcomers\n\n## How It Grows\n\nOther citizens attest to your contributions. Each attestation increases the relevant facet. The more standing the attester has, the more weight their attestation carries.\n\n## Decay\n\nStanding decays slowly over time to ensure it reflects current participation, not past glory.', 'governance', '4c9dbd9c-e911-42b2-a267-5f154fd0a19e', true, 1),
  ('governance-guide', 'How Governance Works', '## Proposals\n\nAny citizen can create a proposal. Proposals have:\n\n- A title and body explaining the change\n- A category (general, treasury, policy, amendment, recall)\n- A voting period (default 7 days)\n- A quorum requirement (minimum votes needed)\n\n## Voting\n\n- Every citizen gets one vote per proposal\n- Votes are weighted by standing (higher standing = slightly more weight)\n- You can vote For, Against, or Abstain\n- Abstain counts toward quorum but not the result\n\n## Passing\n\nA proposal passes if:\n1. Quorum is met\n2. More weighted votes For than Against\n\n## Implementation\n\nPassed proposals are implemented by the community. Treasury proposals release funds. Policy proposals update the rules.', 'governance', '8a682bed-30ef-4c36-9ace-da3062115c36', true, 1),
  ('getting-started', 'Getting Started with MiLyfe', '## Welcome!\n\nHere''s how to get the most out of MiLyfe:\n\n### First Steps\n\n1. **Complete your profile** — Add your neighborhood and bio\n2. **Claim your welcome reward** — Check /rewards for your 50 $MLY\n3. **Introduce yourself** — Post in the General forum\n4. **Connect** — Find and connect with neighbors\n\n### Daily Habits\n\n- **Health check-in** — Track your mood and energy (/health)\n- **Check governance** — Vote on active proposals (/governance)\n- **Browse the forum** — Join conversations (/forum)\n- **Read the news** — Stay informed about your community (/news)\n\n### Earning $MLY\n\n- Daily UBI: 10 $MLY automatically\n- Forum participation: Standing increases\n- Quest completion: Variable bounties\n- Attestations received: Standing growth', 'general', 'b8388317-778a-4566-906c-8ba51bb77d9b', true, 1)
ON CONFLICT (slug) DO NOTHING;

-- ===== NEWS ARTICLES =====
INSERT INTO public.news_articles (author_id, title, slug, body, excerpt, category, published, featured, view_count, published_at) VALUES
  ('8a682bed-30ef-4c36-9ace-da3062115c36', 'MiLyfe MVP Launches — 14 Routes, Community-Owned', 'milyfe-mvp-launches', 'The MiLyfe platform is now live with its core 14 routes. This lean MVP includes everything needed for a functioning community: wallet, governance, forum, health check-ins, and more.\n\nThe remaining 146 features from the roadmap are available as developer bounties — earn $MLY by building features the community needs.\n\nWhat''s included:\n- $MLY wallet with three-pot system\n- Direct democracy (proposals + voting)\n- 8-facet standing system\n- Community forum with spaces\n- Health & wellness tracking\n- Community wiki\n- News (you''re reading it!)\n- Neighbor connections\n\nThis is just the beginning. Every feature from here is governed by the community.', 'The MiLyfe platform is live with 14 core routes and 160 bounties for community builders.', 'community', true, true, 42, NOW() - INTERVAL '1 day'),
  ('5b582ba5-5e8b-4504-b5dd-9044ade2fedb', 'First Businesses Accept $MLY', 'first-businesses-accept-mly', 'James''s Barbershop on Main Street is now the first local business to accept $MLY for services. A standard haircut costs 15 $MLY (equivalent to the community-set value).\n\nWant your business listed? Head to /apps and submit your listing, or post in the Economy forum space.\n\nOur goal: 10 businesses accepting $MLY by end of month.', 'James''s Barbershop becomes the first local business to accept $MLY payments.', 'economy', true, true, 28, NOW() - INTERVAL '12 hours'),
  ('4c9dbd9c-e911-42b2-a267-5f154fd0a19e', 'Community Garden Proposal Gains Support', 'community-garden-proposal', 'Gloria M.''s proposal to establish a community garden at Oak Park has gained 3 votes with 0 against. The proposal would allocate 200 $MLY from the community treasury for raised beds, soil, and seeds.\n\nVoting closes in 6 days. If you support local food sovereignty and green spaces, head to /governance to cast your vote.', 'The Oak Park community garden proposal is gaining momentum with unanimous support so far.', 'governance', true, false, 15, NOW() - INTERVAL '6 hours'),
  ('b8388317-778a-4566-906c-8ba51bb77d9b', 'Eastside Cleanup Earns $MLY for 12 Volunteers', 'eastside-cleanup-success', 'Saturday''s neighborhood cleanup at MLK Park brought together 12 community members who collected 15 bags of trash and cleared the creek trail.\n\nEach participant earned 25 $MLY and a boost to their Neighbor standing facet. Next cleanup is scheduled for the following Saturday — same time, same place.', 'Twelve volunteers earned $MLY for the MLK Park cleanup, with another scheduled next week.', 'community', true, false, 19, NOW() - INTERVAL '3 hours')
ON CONFLICT (slug) DO NOTHING;

-- ===== HEALTH RESOURCES =====
INSERT INTO public.health_resources (name, category, description, address, phone, accepts_mly) VALUES
  ('Community Health Center', 'clinic', 'Sliding scale primary care. No one turned away.', '450 MLK Blvd', '555-0100', true),
  ('MiMind Peer Support', 'mental_health', 'Free peer counseling. Trained community volunteers. Walk-in or appointment.', '220 Oak Street, Suite 3', '555-0101', false),
  ('988 Suicide & Crisis Lifeline', 'crisis', 'Call or text 988. Free, confidential, 24/7.', NULL, '988', false),
  ('Naloxone at Main Library', 'harm_reduction', 'Free Narcan kits available at the front desk. No questions asked.', '100 Main Street', '555-0103', false),
  ('Community Wellness Circle', 'wellness', 'Weekly mindfulness and movement group. Tuesdays 6pm at the Park Pavilion.', 'MLK Park Pavilion', NULL, false),
  ('Eastside Pharmacy', 'pharmacy', 'Community pharmacy. $MLY accepted for OTC items. Prescription assistance available.', '789 Eastside Ave', '555-0105', true)
ON CONFLICT DO NOTHING;

-- ===== STANDING DATA =====
UPDATE public.standing SET
  neighbor = 25, carer = 15, maker = 10, teacher = 5, keeper = 5, voice = 20, shop = 30, helper = 10
WHERE user_id = '8a682bed-30ef-4c36-9ace-da3062115c36';

UPDATE public.standing SET
  neighbor = 10, carer = 20, maker = 5, teacher = 30, keeper = 10, voice = 15, shop = 0, helper = 25
WHERE user_id = '4c9dbd9c-e911-42b2-a267-5f154fd0a19e';

UPDATE public.standing SET
  neighbor = 30, carer = 25, maker = 0, teacher = 10, keeper = 5, voice = 10, shop = 5, helper = 20
WHERE user_id = 'b8388317-778a-4566-906c-8ba51bb77d9b';

UPDATE public.standing SET
  neighbor = 15, carer = 10, maker = 40, teacher = 15, keeper = 5, voice = 25, shop = 20, helper = 10
WHERE user_id = '5b582ba5-5e8b-4504-b5dd-9044ade2fedb';

-- ===== APPS =====
INSERT INTO public.apps (developer_id, name, slug, description, category, status, install_count, rating) VALUES
  ('5b582ba5-5e8b-4504-b5dd-9044ade2fedb', 'MiTransit', 'mitransit', 'Real-time bus tracking and route planning for community transit.', 'utility', 'published', 23, 4.2),
  ('5b582ba5-5e8b-4504-b5dd-9044ade2fedb', 'Safety Timer', 'safety-timer', 'Walking-home timer. Alerts your contacts if you don''t check in.', 'safety', 'published', 45, 4.8),
  ('8a682bed-30ef-4c36-9ace-da3062115c36', 'MLY POS', 'mly-pos', 'Point-of-sale for businesses accepting $MLY. QR scan payments.', 'economy', 'published', 8, 4.5),
  ('4c9dbd9c-e911-42b2-a267-5f154fd0a19e', 'Community Calendar', 'community-calendar', 'Shared calendar for neighborhood events, meetings, and deadlines.', 'social', 'published', 31, 4.0),
  ('b8388317-778a-4566-906c-8ba51bb77d9b', 'Rights Card', 'rights-card', 'Know your rights. Audio playback. Police encounter guidance.', 'safety', 'published', 67, 4.9)
ON CONFLICT (slug) DO NOTHING;

-- ===== Update profiles to be onboarding_complete =====
UPDATE public.profiles SET onboarding_complete = true, neighborhood = 'Eastside' WHERE id = '8a682bed-30ef-4c36-9ace-da3062115c36';
UPDATE public.profiles SET onboarding_complete = true, neighborhood = 'Downtown' WHERE id = 'b8388317-778a-4566-906c-8ba51bb77d9b';
UPDATE public.profiles SET onboarding_complete = true, neighborhood = 'Oak Park' WHERE id = '5b582ba5-5e8b-4504-b5dd-9044ade2fedb';
UPDATE public.profiles SET onboarding_complete = true, neighborhood = 'Westside' WHERE id = '4c9dbd9c-e911-42b2-a267-5f154fd0a19e';
