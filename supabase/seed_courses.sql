-- ============================================================================
-- MiLearn — 25 Real Courses with Module Content
-- Run after 002_full_platform_tables.sql
-- ============================================================================

-- ─── LEGAL & RIGHTS (5 courses) ──────────────────────────────────────────

INSERT INTO courses (title, description, category, difficulty, mly_reward, module_count) VALUES
('Know Your Rights: Complete Guide', 'A comprehensive guide to your constitutional rights, how to exercise them, and what to do when they''re violated.', 'legal', 'beginner', 15, 10),
('Tenant Rights in Florida', 'Everything renters need to know about Florida landlord-tenant law, eviction protections, and how to fight back.', 'legal', 'beginner', 12, 8),
('Police Encounters: What to Do', 'Step-by-step guide for traffic stops, pedestrian stops, home visits, and arrest scenarios. Know what to say and when to stay silent.', 'legal', 'beginner', 10, 6),
('Small Claims Court: Step by Step', 'How to file, prepare, and win in small claims court without a lawyer. Covers disputes up to $8,000 in Florida.', 'legal', 'intermediate', 12, 7),
('Immigration Rights Basics', 'Your rights regardless of immigration status. ICE encounters, workplace rights, family separation resources.', 'legal', 'beginner', 12, 8);

-- Modules for Course 1: Know Your Rights