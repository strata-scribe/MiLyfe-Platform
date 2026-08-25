-- ============================================================================
-- Seed real content for Rights and Papers path modules
-- Migration 006
-- ============================================================================

-- Module 1: Know Your Rights
UPDATE public.learn_modules SET content_markdown = '## Know Your Rights

Every person has fundamental rights in everyday situations. This module covers the basics.

### When Stopped by Police

- **Stay calm.** Keep your hands visible.
- **Ask:** "Am I free to leave?" If yes, walk away calmly.
- **If detained:** You have the right to remain silent. Say: "I am exercising my right to remain silent."
- **Never consent to a search.** Say: "I do not consent to a search."
- **You can record.** You have the right to record police interactions in public.

### Your Rights at Work

- You cannot be fired for your race, gender, religion, disability, or age (over 40).
- You have the right to a safe workplace (OSHA).
- You must be paid at least minimum wage for all hours worked.
- Overtime (1.5x) is required after 40 hours/week for most workers.

### Your Rights as a Tenant

- Your landlord must provide habitable housing (working plumbing, heat, no pests).
- You cannot be evicted without proper notice and court process.
- Retaliation for reporting code violations is illegal.

### Your Rights in Healthcare

- Emergency rooms must treat you regardless of ability to pay (EMTALA).
- You have the right to see your medical records.
- You can refuse treatment at any time.

### Key Takeaway

Rights exist whether you know them or not. But knowing them helps you protect yourself and others. You don''t need to argue or fight — just clearly state what you know.'
WHERE slug = 'know-your-rights' AND path_id = (SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers');

-- Module 2: Documents Checklist
UPDATE public.learn_modules SET content_markdown = '## Documents Checklist

Having your documents in order makes everything easier: jobs, housing, benefits, voting.

### Essential Documents (Priority Order)

1. **Birth Certificate** — Foundation for everything else
   - Get from the vital records office in the state where you were born
   - Cost: $10-30 depending on state
   - Can request by mail if you''re not in that state

2. **Social Security Card** — Needed for employment
   - Free replacement from SSA.gov or local office
   - Need proof of identity (any photo ID, or birth certificate + school record)
   - Takes 2-4 weeks by mail

3. **State ID or Driver''s License** — Primary photo ID
   - Go to local DMV/tax collector
   - Need: birth certificate OR passport + proof of address + Social Security card
   - Cost: $15-30 for state ID

4. **Proof of Address** — Needed for many applications
   - Utility bill, bank statement, or official mail
   - Shelter letters count if you''re experiencing homelessness
   - Library cards can sometimes serve as proof

### Where to Keep Them Safe

- **Primary:** Waterproof folder in a secure place you control
- **Backup:** Photos of all documents stored in encrypted cloud (or printed at a trusted friend''s house)
- **Never** leave originals with someone you don''t fully trust

### If You''ve Lost Everything

Start with birth certificate → Social Security → State ID. In that order. Each one makes the next one easier to get.

### Exercise

Make a checklist: which documents do you have? Which do you need? Write down the next step for each missing one.'
WHERE slug = 'documents-checklist' AND path_id = (SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers');

-- Module 3: Court Preparation
UPDATE public.learn_modules SET content_markdown = '## Court Preparation

Going to court is stressful. Knowing what to expect makes it manageable.

### Before You Go

- **Know your date and time.** Set 3 alarms. Arrive 30 minutes early.
- **Know the address.** Courts are often confusing buildings. Find your courtroom number.
- **Bring:** Your ID, any paperwork related to your case, a pen, something to write on.
- **Dress:** Clean, neat, conservative. No hats, no sunglasses inside. Button-up shirt if you have one.

### In the Courtroom

- **Stand** when the judge enters or speaks to you directly.
- **Address the judge** as "Your Honor."
- **Speak clearly** and only when spoken to.
- **Never interrupt** anyone — not the judge, not the other side, not your own lawyer.
- **Tell the truth.** Lying to a judge (perjury) is a separate crime.

### Working with a Public Defender

- They are real lawyers. They are overworked but qualified.
- **Help them help you:** bring your documents organized, write down your timeline, be honest about everything (even bad facts).
- Ask questions: "What are my options?" "What happens next?" "What''s the worst case?"

### If You Don''t Understand

Say: "Your Honor, I don''t understand. Can you explain that?" This is always allowed. Never pretend to understand something you don''t.

### Key Takeaway

Courts are formal but not mysterious. Showing up, being respectful, and being prepared is already ahead of most people.'
WHERE slug = 'court-preparation' AND path_id = (SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers');

-- Module 4: Finding Legal Aid
UPDATE public.learn_modules SET content_markdown = '## Finding Legal Aid

Free legal help exists. Knowing how to find it is half the battle.

### What Legal Aid Covers

- Eviction defense
- Family law (custody, divorce, protective orders)
- Benefits appeals (SSI/SSDI, SNAP, Medicaid denials)
- Immigration
- Consumer debt
- Employment disputes
- Expungement/record clearing

### What It Usually Does NOT Cover

- Criminal defense (you get a public defender for that)
- Civil cases where you''re suing for money
- Business disputes

### How to Find Help

1. **211 Hotline** — Dial 211 or visit 211.org. They connect you to local resources.
2. **Legal Aid Society** — Search "[your city] legal aid" or LawHelp.org
3. **Bar Association** — Many have free referral lines and pro bono programs
4. **Law School Clinics** — Free help from supervised law students
5. **Court Self-Help Centers** — Many courthouses have free assistance

### Income Qualification

Most legal aid requires income below 200% of poverty level. But ASK even if you think you won''t qualify — some programs have higher limits or make exceptions.

### Prepare Before You Call

Have ready: what happened (timeline), any documents, what you need help with, your income info. The clearer you are, the faster they can help.'
WHERE slug = 'legal-aid-resources' AND path_id = (SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers');

-- Module 5: Housing Rights
UPDATE public.learn_modules SET content_markdown = '## Housing Rights

Your landlord has legal obligations. Knowing them protects you.

### You Cannot Be Evicted Without

1. **Written notice** (3-day, 7-day, or 30-day depending on reason and state)
2. **A court hearing** where you can tell your side
3. **A court order** — only a sheriff can physically remove you, never the landlord directly

### Illegal Landlord Actions

- Changing locks without court order
- Shutting off utilities
- Removing your belongings
- Threatening or harassing you into leaving
- Raising rent in retaliation for complaints

### Your Right to Habitable Housing

Your landlord MUST provide:
- Working plumbing and hot water
- Heat (and AC where required by law)
- No serious pest infestations
- Structural safety (no holes in roof, no exposed wiring)
- Working smoke detectors

If they don''t: document everything (photos + dates), report to code enforcement, and look into rent withholding laws in your state.

### Fair Housing

It is ILLEGAL to discriminate in housing based on: race, color, national origin, religion, sex, familial status (having kids), or disability. Report violations to HUD (1-800-669-9777).

### Section 8 / Housing Choice Voucher

- Waitlists are long (months to years) but worth applying
- Once you have a voucher, you choose where to live (landlord must accept)
- Your portion of rent is 30% of your income'
WHERE slug = 'housing-rights' AND path_id = (SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers');

-- Module 6: Employment Rights
UPDATE public.learn_modules SET content_markdown = '## Employment Rights

Workers have rights. Most people don''t know them. You will.

### Wage Theft (The #1 Workplace Crime)

If your employer:
- Doesn''t pay you for all hours worked
- Makes you work off the clock
- Takes illegal deductions from your check
- Doesn''t pay overtime (1.5x after 40 hours)
- Pays below minimum wage

**That is wage theft.** File a complaint with your state labor department or the federal DOL. You can recover back wages + penalties.

### You Cannot Be Fired For

- Your race, gender, religion, national origin, disability, or age (40+)
- Reporting safety violations (whistleblower protection)
- Filing a workers'' comp claim
- Discussing wages with coworkers (this is federally protected!)
- Taking FMLA leave (if eligible)

### Unsafe Workplace

- You have the right to refuse dangerous work
- Report to OSHA: 1-800-321-6742 (anonymous)
- Retaliation for reporting is illegal

### Unemployment Insurance

If you''re fired (not for serious misconduct) or laid off:
- Apply immediately at your state unemployment website
- You usually get ~60% of your wages for up to 26 weeks
- If denied, APPEAL — many denials are overturned on appeal

### Key Takeaway

Document everything. Save texts, emails, pay stubs, schedules. The person with records wins.'
WHERE slug = 'employment-rights' AND path_id = (SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers');

-- Module 7: Benefits Navigation
UPDATE public.learn_modules SET content_markdown = '## Benefits Navigation

Public benefits exist to help you through hard times. No shame in using them.

### SNAP (Food Stamps)

- **Who:** Income below 130% of poverty (~$1,580/month for 1 person)
- **What:** Monthly card for groceries (not hot food, alcohol, or non-food items)
- **How:** Apply at your state DHS office or online
- **How long:** Usually approved in 7-30 days

### Medicaid

- **Who:** Low-income adults, pregnant women, children, disabled persons
- **What:** Free or very low-cost health insurance
- **How:** Apply at healthcare.gov or your state Medicaid office
- **Covers:** Doctor visits, prescriptions, emergency care, mental health

### SSI / SSDI (Disability)

- **SSI:** For disabled people with limited income/assets (no work history needed)
- **SSDI:** For disabled people who worked enough quarters
- **Reality:** Most people are denied the first time. APPEAL. Get a disability attorney (they only get paid if you win).

### TANF (Cash Assistance)

- **Who:** Very low-income families with children
- **What:** Monthly cash payment + sometimes job training
- **Limits:** Usually 5 years lifetime (varies by state)

### WIC (Women, Infants, Children)

- **Who:** Pregnant women, new mothers, children under 5
- **What:** Specific foods (milk, eggs, cereal, formula) + nutrition education

### If You''re Denied

**Always appeal.** Many denials are reversed on appeal. You usually have 30-90 days to file. Ask legal aid for help with the appeal.'
WHERE slug = 'benefits-navigation' AND path_id = (SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers');

-- Module 8: Community Project
UPDATE public.learn_modules SET content_markdown = '## Rights Navigator Project

This is your final module. Instead of a test, you''re going to help someone.

### The Assignment

Help one person in your community navigate a legal or documents challenge. This could be:

- Helping someone get their birth certificate
- Accompanying someone to court
- Walking someone through a benefits application
- Helping someone write a letter to their landlord
- Connecting someone to legal aid

### What to Document

Write about:
1. **What was the situation?** (No real names — protect privacy)
2. **What did you help them do?**
3. **What resources did you use?**
4. **What did you learn that wasn''t in the modules?**
5. **What would you do differently next time?**

### Rules

- **Never give legal advice.** You''re a navigator, not a lawyer. Help people find resources and understand their options.
- **Respect privacy.** Don''t share their story without permission. Change names in your write-up.
- **Know your limits.** If something is beyond you, connect them to legal aid.

### Completion

Submit your write-up (minimum 200 words) describing the experience. This earns your **Rights Navigator** badge — portable, verifiable, and yours forever.'
WHERE slug = 'community-project' AND path_id = (SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers');
