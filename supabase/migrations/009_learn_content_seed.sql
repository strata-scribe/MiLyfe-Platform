-- ============================================================================
-- Seed 3 modules per remaining 9 learn paths (27 modules total)
-- Migration 009
-- ============================================================================

-- ─── PARENTING ───────────────────────────────────────────────────────────────
INSERT INTO public.learn_modules (path_id, slug, title, description, type, duration_minutes, sort_order, assessment_type, content_markdown) VALUES
((SELECT id FROM learn_paths WHERE slug='parenting'), 'child-development-basics', 'Child Development Basics', 'Understand how children grow at different ages and what they need from you at each stage.', 'lesson', 45, 1, 'completion', '## Child Development Basics

Children develop in predictable stages, but every child is different.

### Ages 0-2: Trust
- Respond to crying (you cannot spoil a baby)
- Consistent routine builds security
- Talk, sing, read — even before they understand words

### Ages 2-5: Independence
- Let them try (and fail safely)
- Name their emotions: "You seem frustrated"
- Consistent boundaries = safety, not cruelty

### Ages 6-12: Competence
- Encourage effort, not just results
- Let them solve problems before jumping in
- Their friendships matter — listen

### Ages 13-18: Identity
- They need privacy AND connection
- Pick your battles (hair color vs. safety)
- Stay available even when they push away

### Key Takeaway
Your job isn''t to be perfect. It''s to be consistent, present, and willing to repair when you mess up.'),
((SELECT id FROM learn_paths WHERE slug='parenting'), 'coparenting-communication', 'Co-Parenting Communication', 'Communicate effectively with a co-parent, even when the relationship is difficult.', 'exercise', 30, 2, 'portfolio', '## Co-Parenting Communication

Even when the adult relationship is over, the parenting relationship continues.

### The BIFF Method (Brief, Informative, Friendly, Firm)
- **Brief:** Keep messages short. No essays.
- **Informative:** Facts only. "Pickup is at 3pm Thursday."
- **Friendly:** One kind sentence. "Hope the week is going well."
- **Firm:** No opening for argument. Don''t ask "Is that OK?" — state what was agreed.

### What to NEVER do in co-parent messages
- Relitigate the relationship
- Use the child as messenger
- Badmouth the other parent to the child
- Make threats
- Respond when angry (wait 24h rule)

### Exercise
Write a BIFF response to this scenario: Your co-parent texts "You NEVER bring them on time and I''m sick of it." Draft a response that is Brief, Informative, Friendly, and Firm.'),
((SELECT id FROM learn_paths WHERE slug='parenting'), 'self-care-for-parents', 'Self-Care for Parents', 'You cannot pour from an empty cup. Build sustainable practices that keep you well.', 'reflection', 20, 3, 'portfolio', '## Self-Care for Parents

This is not luxury. This is maintenance. A burned-out parent cannot show up for their kids.

### Minimum Viable Self-Care
1. **Sleep:** Get what you can. Nap when they nap is real advice.
2. **Movement:** 10 minutes walking counts. Don''t aim for the gym.
3. **One thing that is yours:** A book, a podcast, a 5-minute coffee in silence.
4. **One adult conversation per day:** Even a text thread counts.

### When it''s too much
- Ask for help. This is not weakness.
- Call 211 for respite care options
- MiLyfe care exchange: trade hours with another parent
- "Good enough" parenting IS good parenting

### Reflection
What is one thing you did for yourself this week? What is one thing you could add next week that takes less than 10 minutes?')
ON CONFLICT (path_id, slug) DO NOTHING;

-- ─── REENTRY ────────────────────────────────────────────────────────────────
INSERT INTO public.learn_modules (path_id, slug, title, description, type, duration_minutes, sort_order, assessment_type, content_markdown) VALUES
((SELECT id FROM learn_paths WHERE slug='reentry'), 'first-72-hours', 'The First 72 Hours', 'What to do in the first three days after release. Priorities, resources, common mistakes.', 'lesson', 40, 1, 'completion', '## The First 72 Hours

The first days out are overwhelming. Here''s what matters most, in order.

### Day 1: Basics
1. **ID:** If you don''t have one, go to the DMV/tax collector ASAP. Some states issue temp IDs at release.
2. **Phone:** Get a prepaid phone if you don''t have one. You need to be reachable for PO, jobs, housing.
3. **Food:** Find your nearest food bank (MiLyfe Resources tab). No shame. Eat.
4. **Shelter:** If no family/friend option, call 211 for transitional housing.

### Day 2: Obligations
1. **Report to PO** if required. Don''t miss this. Don''t be late.
2. **Understand your conditions.** Write them down. Put reminders in your phone.
3. **Get your court dates on a calendar.** Every single one.

### Day 3: Foundation
1. **Apply for benefits:** SNAP, Medicaid, whatever you qualify for.
2. **Start job search:** Ban-the-box employers exist. MiLyfe Jobs section.
3. **Find your people:** AA/NA if needed, reentry support groups, your MiLyfe circle.

### Common Mistakes
- Trying to fix everything at once (overwhelm → shutdown)
- Old habits/old people/old places too soon
- Not asking for help because of pride
- Ignoring conditions "just this once"'),
((SELECT id FROM learn_paths WHERE slug='reentry'), 'employment-with-record', 'Employment With a Record', 'How to find work, handle applications, and know your rights as someone with a criminal record.', 'lesson', 45, 2, 'completion', '## Employment With a Record

Having a record makes job hunting harder. It doesn''t make it impossible.

### Ban-the-Box
Many states/cities prohibit asking about criminal history on the initial application. You only disclose later (after interview or conditional offer). Know your local law.

### What Employers Can and Cannot Do
- **Can:** Run a background check (with your consent)
- **Can:** Consider convictions related to the job
- **Cannot:** Blanket-reject everyone with any record (EEOC guidance)
- **Cannot:** Ask about arrests that didn''t lead to conviction

### How to Discuss Your Record
- Be honest when asked directly
- Be brief: "I made a mistake, I served my time, I''ve changed"
- Pivot to what you''ve done since: classes, certifications, volunteer work
- Have references who can speak to your character NOW

### Industries That Hire
- Construction and trades
- Warehousing and logistics
- Food service and restaurants
- Landscaping and maintenance
- Tech (some companies specifically hire returning citizens)

### MiLyfe Resources
Check the Street → Jobs section for local ban-the-box employers. Your Forge helper can help with resume writing.'),
((SELECT id FROM learn_paths WHERE slug='reentry'), 'rebuilding-relationships', 'Rebuilding Relationships', 'How to reconnect with family, handle expectations, and build new support networks.', 'practice', 30, 3, 'portfolio', '## Rebuilding Relationships

Time inside damages relationships. Rebuilding takes patience — from everyone.

### With Family
- **Don''t expect things to be the same.** People changed while you were gone. So did you.
- **Actions over words.** Saying "I''ve changed" means nothing. Showing up consistently does.
- **Respect their boundaries.** If someone isn''t ready, that''s their right.
- **Start small.** A phone call before a visit. A visit before moving in.

### With Children
- Let them set the pace
- Don''t badmouth the other parent or caregiver
- Be reliable: if you say Saturday, BE THERE Saturday
- They may be angry. That''s legitimate. Don''t punish them for it.

### Building New Community
- MiLyfe circles: join one. Show up.
- Support groups: people who understand without judgment
- Volunteering: builds connections AND standing
- Avoid: old networks that pull you back

### Reflection
Who is one person you want to reconnect with? What is the smallest first step you could take this week?')
ON CONFLICT (path_id, slug) DO NOTHING;

-- ─── PEACE ──────────────────────────────────────────────────────────────────
INSERT INTO public.learn_modules (path_id, slug, title, description, type, duration_minutes, sort_order, assessment_type, content_markdown) VALUES
((SELECT id FROM learn_paths WHERE slug='peace'), 'understanding-conflict', 'Understanding Conflict', 'Why conflicts happen, what escalates them, and what de-escalation actually looks like.', 'lesson', 45, 1, 'completion', '## Understanding Conflict

Conflict is normal. Violence is a choice. This module is about understanding the space between.

### Why Conflicts Escalate
1. **Pride/respect:** Someone feels disrespected
2. **Territory:** Physical space, social space, economic space
3. **Fear:** Feeling threatened (real or perceived)
4. **Audience:** Performing for watchers
5. **Substances:** Impaired judgment

### The Escalation Ladder
- Disagreement → Argument → Threats → Posturing → Contact → Weapons → Lethal

**De-escalation means moving DOWN the ladder, not up.**

### What De-escalation Looks Like
- Lower your voice (forces them to listen)
- Open hands, visible (no threat)
- Give space (don''t corner)
- Acknowledge their feeling: "I hear you''re upset"
- Offer an exit that saves face: "Let''s talk about this tomorrow"
- Remove the audience if possible

### What De-escalation Is NOT
- Being weak
- Letting people walk over you
- Agreeing with them
- Surrendering your rights

It''s choosing not to burn down the house you live in.'),
((SELECT id FROM learn_paths WHERE slug='peace'), 'mediation-basics', 'Mediation Basics', 'How to sit between two people in conflict and help them find resolution without violence.', 'practice', 60, 2, 'portfolio', '## Mediation Basics

A mediator doesn''t take sides. They hold space for both people to be heard.

### The Mediator''s Role
- Neutral party (no dog in the fight)
- Sets ground rules
- Ensures both sides speak AND listen
- Helps identify what each person actually needs
- Proposes options (doesn''t dictate solutions)

### Ground Rules for a Peace Table
1. No weapons at the table
2. No interrupting (use a talking object if needed)
3. No threats
4. What''s said here stays here (confidentiality)
5. Either party can leave at any time
6. No recording without consent

### The Process
1. **Opening:** Mediator explains rules, sets expectations
2. **Stories:** Each person tells their version without interruption
3. **Needs:** "What do you actually need here?"
4. **Options:** Brainstorm solutions together
5. **Agreement:** What will each person do? Be specific.
6. **Follow-up:** Check in after 1 week

### Practice
Find a low-stakes conflict between two people you know (roommates arguing about dishes, friends with a misunderstanding). Offer to mediate using this framework. Document what happened.'),
((SELECT id FROM learn_paths WHERE slug='peace'), 'community-protection', 'Community Protection Without Violence', 'How to keep your block safe through presence, relationships, and organized response.', 'lesson', 45, 3, 'completion', '## Community Protection Without Violence

The safest blocks aren''t the ones with the most cameras. They''re the ones where people know each other.

### Presence > Surveillance
- People on porches
- Walking the block (not patrolling — being present)
- Knowing your neighbors by name
- Eyes on the street (Jane Jacobs was right)

### The Vanguard Model
- Small groups (5-12) committed to their block
- Regular tasks: walk-home escorts, cleanup, event security
- Peer accountability (Coordinape-style weekly review)
- Paid from community treasury — not vigilantism

### What This Is NOT
- Not a gang with different branding
- Not intimidation or territory claiming
- Not replacing police or courts
- Not armed response

### What Works
- Interrupting conflicts BEFORE they escalate (credible messengers)
- Youth mentoring (the next generation watches what you do)
- Block events (cookouts create connections)
- Economic alternatives (if the corner is the only job, people take the corner)')
ON CONFLICT (path_id, slug) DO NOTHING;

-- ─── FOOD AND FIRST AID ─────────────────────────────────────────────────────
INSERT INTO public.learn_modules (path_id, slug, title, description, type, duration_minutes, sort_order, assessment_type, content_markdown) VALUES
((SELECT id FROM learn_paths WHERE slug='food-and-first-aid'), 'basic-first-aid', 'Basic First Aid', 'What to do in the first minutes of common emergencies before help arrives.', 'lesson', 40, 1, 'quiz', '## Basic First Aid

You are not a doctor. But you can keep someone alive until one arrives.

### Bleeding
- Apply direct pressure with clean cloth
- Elevate above the heart if possible
- Don''t remove the cloth — add more on top
- Call 911 if bleeding won''t stop after 10 minutes

### Burns
- Cool under running water for 10+ minutes (NOT ice)
- Don''t pop blisters
- Don''t put butter, toothpaste, or anything else on it
- Seek help for burns larger than your palm

### Choking (Adult)
- "Are you choking?" If they can''t speak/breathe:
- Stand behind, fist above navel, thrust inward and up (Heimlich)
- Repeat until object comes out or they go unconscious
- If unconscious: call 911, start CPR

### CPR (Hands-Only)
- Call 911 first
- Push hard and fast in center of chest (100-120 beats/min)
- Don''t stop until paramedics arrive
- Any CPR is better than no CPR

### When to Call 911
- Uncontrolled bleeding
- Difficulty breathing
- Chest pain
- Unconsciousness
- Seizures lasting >5 minutes
- Allergic reaction with swelling throat'),
((SELECT id FROM learn_paths WHERE slug='food-and-first-aid'), 'cooking-on-budget', 'Cooking on a Budget', 'Make real food with $5 or less per meal. No fancy equipment needed.', 'exercise', 45, 2, 'completion', '## Cooking on a Budget

Eating well is not about money. It''s about knowing what to buy and what to do with it.

### The $20 Grocery List (feeds 1 person for a week)
- Rice (2lb bag): $2
- Dried beans (1lb): $1.50
- Eggs (dozen): $3
- Onions (3lb bag): $2
- Frozen vegetables (2 bags): $3
- Chicken thighs (family pack): $5
- Oil, salt, pepper (if you don''t have): $3
- Total: ~$19.50

### 3 Meals From This
**Rice and beans:** Cook rice. Cook beans with onion and salt. That''s a complete protein.

**Egg fried rice:** Leftover rice + scrambled eggs + frozen veg + soy sauce (ask someone for a splash).

**Chicken and veg:** Season thighs with salt/pepper/oil. Bake at 400°F for 35min. Serve with rice + steamed frozen veg.

### Tips
- Buy in bulk when you can
- Dried beans > canned (cheaper, but need soaking time)
- Frozen vegetables are as nutritious as fresh and don''t spoil
- Learn 5 meals and rotate. You don''t need a cookbook.
- SNAP benefits work at most grocery stores and some farmers markets'),
((SELECT id FROM learn_paths WHERE slug='food-and-first-aid'), 'food-safety', 'Food Safety Basics', 'Don''t make people sick. How to store, prepare, and serve food safely.', 'lesson', 30, 3, 'quiz', '## Food Safety Basics

Food poisoning sends 128,000 Americans to the hospital every year. Most of it is preventable.

### The Danger Zone: 40°F - 140°F
Bacteria multiply rapidly between these temperatures. Food should not sit in this range for more than 2 hours (1 hour if it''s hot outside).

### Four Rules
1. **Clean:** Wash hands 20 seconds before and after handling food. Wash cutting boards.
2. **Separate:** Raw meat away from everything else. Use different cutting boards.
3. **Cook:** Use a thermometer. Chicken: 165°F. Ground beef: 160°F. Pork: 145°F.
4. **Chill:** Refrigerate leftovers within 2 hours. Eat within 3-4 days.

### Common Mistakes
- Thawing meat on the counter (use fridge, cold water, or microwave)
- Tasting food to check if it''s still good (you can''t taste bacteria)
- Washing raw chicken (spreads bacteria via splashing)
- Keeping leftovers too long ("when in doubt, throw it out")

### If Someone Gets Sick
- Hydrate (small sips of water or electrolyte drink)
- Most food poisoning passes in 24-48 hours
- Seek help if: bloody stool, fever >101.5°F, can''t keep liquids down for 24h, or symptoms in elderly/children/pregnant')
ON CONFLICT (path_id, slug) DO NOTHING;

-- ─── MONEY NOT CASINO ────────────────────────────────────────────────────────
INSERT INTO public.learn_modules (path_id, slug, title, description, type, duration_minutes, sort_order, assessment_type, content_markdown) VALUES
((SELECT id FROM learn_paths WHERE slug='money-not-casino'), 'budgeting-basics', 'Budgeting Basics', 'Track what comes in and what goes out. No apps required — just honesty.', 'lesson', 30, 1, 'completion', '## Budgeting Basics

A budget is not a punishment. It''s knowing where your money goes instead of wondering.

### The Simplest Budget
Write down two numbers:
1. **What comes in** this month (total income)
2. **What MUST go out** (rent, utilities, food, transport, debt minimums)

Subtract #2 from #1. What''s left is your actual choices.

### The 50/30/20 Rule (adapted)
- **50% Needs:** Rent, food, utilities, transport, minimum debts
- **30% Wants:** Everything else you choose to spend on
- **20% Future:** Savings, extra debt payments, emergency fund

If your needs are over 50%, that''s not your fault — it''s the economy. Adjust the ratios to reality.

### Tracking
- **Week 1:** Write down EVERY purchase. Pen and paper works.
- **Week 2:** Look at the list. Anything surprise you?
- **Week 3:** Choose ONE thing to change. Just one.

### Emergency Fund
Goal: $500 first, then 1 month of expenses, then 3 months. Any amount is better than zero. Even $20 set aside this week is a win.'),
((SELECT id FROM learn_paths WHERE slug='money-not-casino'), 'debt-traps', 'Debt Traps and How to Escape', 'Payday loans, overdraft fees, and predatory lending. How they work and what to do instead.', 'lesson', 35, 2, 'completion', '## Debt Traps

Some financial products are designed to keep you borrowing. Understanding how they work is the first step to escaping.

### Payday Loans
- Average APR: 400%+
- You borrow $500, owe $575 in 2 weeks
- Can''t pay? Roll over. Now you owe $650.
- The trap: you''re always paying fees, never paying down

**What to do instead:** Ask employer for advance. Call 211. Use credit union emergency loan. Ask family. Literally anything else.

### Overdraft Fees
- Bank charges $35 for a $5 purchase that overdrew your account
- Multiple charges in one day can cost $100+
- Opt OUT of overdraft "protection" — a declined card is cheaper than a fee

### Buy-Here-Pay-Here Car Lots
- 20%+ interest rates
- Repossession after one missed payment
- Car worth $3,000 costs you $12,000

**What to do instead:** Save for a $2,000 cash car. Join a credit union. Build credit first.

### Getting Out
1. List all debts (amount, interest rate, minimum payment)
2. Pay minimums on all except the smallest
3. Throw everything extra at the smallest (snowball method)
4. When smallest is gone, roll that payment to the next one
5. Never borrow from a payday lender again'),
((SELECT id FROM learn_paths WHERE slug='money-not-casino'), 'community-economics', 'Community Economics and $MLY', 'How $MLY works, why it exists, and how community currencies build local wealth.', 'lesson', 30, 3, 'completion', '## Community Economics and $MLY

$MLY is not fake money. It''s real community credit — and it works differently from dollars.

### Why Community Currency
- Dollars leave the neighborhood (spent at chains → headquarters elsewhere)
- $MLY stays local (can only be earned and spent within the community)
- Creates circulation: your spend becomes someone else''s income, becomes someone else''s income
- Velocity matters: $MLY that moves 5 times creates 5x the value of $MLY that sits

### How $MLY Works
- **UBI:** Everyone gets 100 $MLY/week just for being a member
- **Earn more:** Complete quests, teach, care, build, keep peace
- **Spend:** Thank someone, buy from marketplace, shop at local businesses
- **Save:** Put in savings jar for goals (emergency fund, birthday, school supplies)
- **No debt:** You cannot go negative. No loans. No interest. No predation.

### The 70/30 Split
- 70% of community value stays local (your Jacksonville $MLY stays in Jacksonville)
- 30% goes to commons (protocol development, new community bootstrapping)
- This prevents wealth extraction — the same problem dollars have

### Key Difference from Dollars
$MLY cannot be hoarded by billionaires, can''t be inflated by banks, can''t be extracted by corporations. It only works because people use it, and it only exists because people earn it.')
ON CONFLICT (path_id, slug) DO NOTHING;

-- ─── REPAIR ─────────────────────────────────────────────────────────────────
INSERT INTO public.learn_modules (path_id, slug, title, description, type, duration_minutes, sort_order, assessment_type, content_markdown) VALUES
((SELECT id FROM learn_paths WHERE slug='repair'), 'basic-tools', 'Basic Tool Knowledge', 'The 10 tools that fix 90% of household problems. What they are and how to use them safely.', 'lesson', 30, 1, 'completion', '## Basic Tool Knowledge

You don''t need a workshop. These 10 tools handle most household repairs.

### The Essential 10
1. **Screwdriver set** (Phillips + flathead) — assembles/disassembles everything
2. **Adjustable wrench** — fits any nut/bolt
3. **Pliers** (needle-nose) — gripping, pulling, bending
4. **Hammer** — nails, breaking things free
5. **Tape measure** — measure twice, cut once
6. **Utility knife** — cutting, scoring, stripping
7. **Level** (or phone app) — hanging things straight
8. **Plunger** — clogs in toilet or sink
9. **Duct tape** — temporary fix for almost anything
10. **WD-40** — unsticks stuck things

### Safety
- Wear eye protection for anything that chips/splashes
- Never force a tool — if it''s not working, you''re using the wrong one
- Righty-tighty, lefty-loosey (most standard threads)
- Turn off power/water BEFORE working on electrical/plumbing

### Where to Get Tools Cheap
- Harbor Freight (budget tools that work)
- Garage sales and estate sales
- MiLyfe tool library (borrow, don''t buy)
- Facebook Marketplace / Craigslist free section'),
((SELECT id FROM learn_paths WHERE slug='repair'), 'plumbing-101', 'Plumbing 101', 'Fix a running toilet, unclog a drain, and stop a leak. The 3 most common plumbing problems.', 'exercise', 45, 2, 'completion', '## Plumbing 101

Plumbers charge $100+/hour. These 3 fixes take 15 minutes and $10 in parts.

### Running Toilet
**Symptom:** Toilet runs constantly or randomly fills
**Usually:** The flapper (rubber seal at bottom of tank) is worn

Fix:
1. Turn off water (valve behind toilet)
2. Flush to empty tank
3. Unhook old flapper, take to hardware store for match ($5)
4. Hook new one on, turn water back on
5. Done.

### Clogged Drain
**Symptom:** Slow drain or standing water

Fix (no chemicals needed):
1. Remove drain cover/stopper
2. Pull out hair/gunk with pliers or a zip-it tool ($3)
3. Run hot water for 2 minutes
4. If still slow: plunger (yes, works on sinks too)
5. Nuclear option: baking soda + vinegar, wait 30min, hot water

### Leaky Faucet
**Symptom:** Drip drip drip

Fix:
1. Turn off water under sink
2. Remove handle (usually a screw under a cap)
3. Replace the washer or cartridge inside ($3-8 at hardware store)
4. Reassemble, turn water on
5. YouTube your specific faucet brand for visual guide

### When to Call a Plumber
- Sewage backup
- No hot water from water heater
- Burst pipe (turn off main water FIRST)
- Anything involving the main line'),
((SELECT id FROM learn_paths WHERE slug='repair'), 'bike-maintenance', 'Basic Bike Maintenance', 'Keep a bike running. Fix a flat, adjust brakes, lubricate chain — all in 30 minutes.', 'exercise', 40, 3, 'portfolio', '## Basic Bike Maintenance

A bike is freedom. A broken bike is a paperweight. Learn to keep yours rolling.

### Fix a Flat (15 minutes)
1. Remove wheel (quick release or wrench)
2. Pry tire off rim with tire levers (or spoon handles)
3. Pull out tube, inflate slightly, find the hole (listen/feel)
4. Patch kit: sand area, apply glue, wait 1 min, apply patch, press hard
5. Or just put in a new tube ($5-8)
6. Reassemble (make sure tire bead is seated evenly)

### Adjust Brakes (5 minutes)
- If brakes feel spongy: tighten the barrel adjuster (turn counter-clockwise)
- If pads are worn (less than 1mm): replace ($5-10/pair)
- If wheel rubs: loosen pad bolt, realign, retighten

### Lubricate Chain (3 minutes)
- Wipe chain with rag
- Apply chain lube to each link while pedaling backward
- Wipe excess (a lubed chain should not drip)
- Do this every 2 weeks or after rain

### Monthly Check
- Tire pressure (feel firm? pump up)
- Brakes grab before levers hit handlebars?
- Chain not rusty?
- Nothing rattling loose?

### Portfolio
Take a photo of your bike before and after doing all 3 maintenance tasks. Describe what you did.')
ON CONFLICT (path_id, slug) DO NOTHING;

-- ─── LITERACY ───────────────────────────────────────────────────────────────
INSERT INTO public.learn_modules (path_id, slug, title, description, type, duration_minutes, sort_order, assessment_type, content_markdown) VALUES
((SELECT id FROM learn_paths WHERE slug='literacy'), 'reading-strategies', 'Reading Strategies for Adults', 'Practical techniques to improve reading speed and comprehension.', 'lesson', 30, 1, 'completion', '## Reading Strategies for Adults

If reading is hard for you, you are not dumb. You just need different strategies than school gave you.

### Start Where You Are
- Read things you WANT to read (not textbooks)
- Sports articles, recipes, song lyrics, Reddit posts — all count
- 5 minutes a day beats 0 minutes

### Active Reading
- Read the title and headings first (preview)
- Ask: "What do I already know about this?"
- Read in chunks (paragraph at a time)
- After each chunk: "What did that just say?" (summarize in your head)
- Underline or highlight key words (not whole sentences)

### When You Get Stuck
- Skip the word and read the rest of the sentence (context often tells you)
- Sound it out (phonics still works for adults)
- Google the word (no shame — everyone does this)
- Use text-to-speech to hear it while you read along

### Building Speed
- Don''t move your lips (subvocalization slows you down)
- Use your finger as a guide (forces eyes forward)
- Practice with easy material first, then harder

### Resources
- Libby app: free ebooks/audiobooks from your library
- Khan Academy: free literacy courses
- MiLyfe Learn: this path (you''re already doing it!)'),
((SELECT id FROM learn_paths WHERE slug='literacy'), 'practical-math', 'Practical Math', 'Math you actually use: percentages, tips, unit prices, measuring.', 'exercise', 35, 2, 'quiz', '## Practical Math

You don''t need algebra. You need to not get ripped off.

### Percentages (Tips, Discounts, Interest)
- **10%:** Move the decimal one place left. $85 → $8.50
- **20%:** Double the 10%. $85 → $17
- **15%:** 10% + half of 10%. $85 → $8.50 + $4.25 = $12.75
- **50%:** Half. Easy.
- **Sale "30% off":** Find 30%, subtract from price.

### Unit Pricing
"Which is cheaper?" — always compare per-unit price.
- 16oz for $3.20 = $0.20/oz
- 24oz for $4.32 = $0.18/oz ← cheaper
- The bigger package isn''t always cheaper. Check the per-unit.

### Measuring
- 12 inches = 1 foot
- 3 feet = 1 yard
- Use your body: your foot is ~12 inches, your arm span is ~your height
- "Measure twice, cut once" — because material costs money

### Budgeting Math
- Monthly income ÷ 4 = weekly budget
- If rent is 30% of income: income × 0.30 = max rent
- Always round UP expenses and DOWN income (conservative)'),
((SELECT id FROM learn_paths WHERE slug='literacy'), 'writing-for-life', 'Writing for Real Life', 'Emails, texts, applications, complaints — how to write clearly when it matters.', 'exercise', 30, 3, 'completion', '## Writing for Real Life

You don''t need to write essays. You need to write things that get results.

### Emails That Get Answered
- Subject line: specific ("Appointment reschedule request" not "Hi")
- First sentence: what you want
- Body: the minimum context needed
- Last sentence: clear next step ("Please confirm by Friday")
- Sign your name

### Text Messages (Professional)
- Full words (not "u" and "2")
- One topic per message
- If it''s longer than 3 sentences, it should be an email or call

### Job Applications
- Match their language (use words from the job posting)
- Specific > vague ("Managed 5-person team" not "leadership skills")
- Proofread by reading OUT LOUD (catches errors eyes miss)

### Complaint Letters
1. What happened (date, time, specifics)
2. What you want done (refund, repair, apology)
3. Deadline ("Please respond by [date]")
4. What you''ll do if not resolved ("I will contact [agency]")
5. Keep a copy.

### Exercise
Write a short email requesting a meeting with your case manager (or any appointment). Use the format above. Read it aloud. Fix anything that sounds wrong.')
ON CONFLICT (path_id, slug) DO NOTHING;

-- ─── THE TRADE / RUN A STREET ───────────────────────────────────────────────
-- (Abbreviated — 3 modules each with shorter content)

INSERT INTO public.learn_modules (path_id, slug, title, description, type, duration_minutes, sort_order, assessment_type, content_markdown) VALUES
((SELECT id FROM learn_paths WHERE slug='the-trade'), 'finding-your-trade', 'Finding Your Trade', 'Identify what your community needs, what you enjoy, and where they overlap.', 'lesson', 30, 1, 'portfolio', '## Finding Your Trade

The best trade isn''t the one that pays the most. It''s the one your community needs that you can stand doing every day.

### Questions to Ask
1. What do people in your neighborhood pay for (or wish they could)?
2. What do you enjoy working on even when no one is watching?
3. What can you learn in 12-24 weeks to a useful level?

### Trades in Demand (Most Communities)
- HVAC (heating/cooling) — always needed, good pay
- Electrical — every building needs it
- Plumbing — see above
- Auto repair — everyone has a car problem
- Barbering — people always need cuts
- Welding — construction never stops
- Phone/computer repair — $50-100 per fix
- Food prep/catering — everyone eats

### The Apprenticeship Path
1. Find someone who does the trade locally
2. Offer to work for free initially (learning is the pay)
3. As you gain skill, negotiate compensation
4. Get any required certifications
5. Start taking your own clients

### Exercise
Ask 5 neighbors: "What service do you wish was available nearby but isn''t?" Write their answers down.'),
((SELECT id FROM learn_paths WHERE slug='the-trade'), 'getting-certified', 'Getting Certified', 'What certifications exist, which matter, and how to get them for free or cheap.', 'lesson', 35, 2, 'completion', '## Getting Certified

Some trades require licenses. Others don''t but certification helps you charge more.

### Free/Cheap Certification Paths
- **OSHA 10/30:** $25 online, required for most construction jobs
- **ServSafe:** Food handler certification, often free through workforce programs
- **EPA 608:** HVAC refrigerant handling, $20-50 for the test
- **CPR/First Aid:** Free through Red Cross for low-income or MiLyfe quests
- **CompTIA A+:** IT support cert, study materials free (Professor Messer YouTube)

### Workforce Development Programs
- Your state has free job training programs. Search "[your state] workforce development" or call 211.
- Programs often include: training, certification testing, job placement, work clothes, tool stipends
- Some specifically serve returning citizens, veterans, or low-income adults

### MiLyfe Integration
Complete a trade path here → earn the Tradesperson badge → get listed in MiLyfe marketplace → first clients find you through the platform'),
((SELECT id FROM learn_paths WHERE slug='the-trade'), 'first-clients', 'Getting Your First Clients', 'How to find work when you have no reputation yet. Start small, deliver well, grow from referrals.', 'exercise', 40, 3, 'project', '## Getting Your First Clients

No reputation? No portfolio? No problem. Start with one person and deliver so well they tell everyone.

### The First 5 Clients
1. **Free work for someone you know** — builds your portfolio
2. **Heavily discounted for a neighbor** — they become a testimonial
3. **MiLyfe quest/marketplace** — your first paid gig at community rates
4. **Word of mouth** — ask clients 1-2 to tell one person
5. **Repeat client** — someone comes back because you did great work

### Pricing
- Research what others charge locally
- Start at 70% of market rate while building portfolio
- Raise to market rate after 10 completed jobs
- Never work for free after your first portfolio piece (exposure doesn''t pay rent)

### Project
Get your first client or complete your first paid job in your chosen trade. Document: what you did, how long it took, what you charged, what you learned.'),

((SELECT id FROM learn_paths WHERE slug='run-a-street'), 'community-organizing-101', 'Community Organizing 101', 'How to identify a problem, build a team, and make something happen on your block.', 'lesson', 40, 1, 'completion', '## Community Organizing 101

Change doesn''t come from one hero. It comes from organized people with a shared goal.

### The Organizing Cycle
1. **Listen:** What are people actually upset about? (Not what you think they should be upset about)
2. **Identify:** What is ONE specific, winnable issue?
3. **Build:** Who else cares? Find 5 people.
4. **Plan:** What specific action will you take? Who is the decision-maker?
5. **Act:** Do the thing. Show up.
6. **Reflect:** What worked? What didn''t? Next time?

### Principles
- Start with relationships, not issues
- One-on-ones are the foundation (30-minute conversations)
- Winnable > righteous (pick fights you can actually win first)
- Power comes from organized people OR organized money. You have people.

### Common Mistakes
- Trying to do everything yourself
- Skipping the listening phase
- Picking an issue too big for your current power
- Not celebrating wins (people burn out without progress)'),
((SELECT id FROM learn_paths WHERE slug='run-a-street'), 'running-meetings', 'Running Good Meetings', 'How to facilitate a circle meeting that respects everyone''s time and actually decides things.', 'exercise', 30, 2, 'completion', '## Running Good Meetings

Bad meetings kill movements. Good ones energize them.

### The 45-Minute Meeting Template
- **Check-in (5min):** Each person: one sentence about how they''re doing
- **Agenda review (2min):** "Here''s what we''re covering. Add anything?"
- **Discussion (25min):** One topic at a time. Facilitator keeps time.
- **Decisions (8min):** What did we decide? Who does what by when?
- **Check-out (5min):** "One word for how you''re leaving"

### Facilitator Rules
- You don''t talk the most. You make sure everyone does.
- "Step up / step back" — invite quiet people in, ask frequent speakers to listen
- Use a "stack" — people raise hands, you call on them in order
- Time-box topics — "We have 5 more minutes on this"
- If it''s getting heated: "Let''s take a breath. What do we actually agree on?"

### Decision Methods
- **Consensus:** Everyone can live with it (best for small groups)
- **Majority vote:** 50%+1 (faster, but losers may not buy in)
- **Consent:** "Does anyone have a strong objection?" No? Proceed.'),
((SELECT id FROM learn_paths WHERE slug='run-a-street'), 'stewardship', 'Stewardship and Servant Leadership', 'Lead without power-hoarding. Rotate roles, build others up, step back when it''s time.', 'reflection', 35, 3, 'portfolio', '## Stewardship and Servant Leadership

In MiLyfe, leaders don''t accumulate power. They hold space, then pass it on.

### What Stewardship Means
- You serve the circle, the circle doesn''t serve you
- Your job: keep things running, not decide for everyone
- Term-limited: 3-6 months, then someone else takes the role
- No consecutive terms: prevents "it''s always been [name]"

### Servant Leadership in Practice
- Ask "What do you need?" more than "Here''s what I think"
- Develop other leaders (who could replace you tomorrow?)
- Share information transparently (no gatekeeping)
- Take blame, give credit
- Know when to step back

### The Sortition Principle
Your steward isn''t elected by campaign. They''re randomly selected from willing volunteers. This means:
- No popularity contests
- No campaigning
- Different perspectives get a turn
- Everyone stays equal

### Reflection
Think about a leader you''ve seen who held power too long. What happened? Now think about someone who shared power well. What made the difference?')
ON CONFLICT (path_id, slug) DO NOTHING;

-- Update module counts for all paths
UPDATE public.learn_paths SET module_count = (
  SELECT COUNT(*) FROM public.learn_modules WHERE path_id = learn_paths.id AND is_active = true
);
