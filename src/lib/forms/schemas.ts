import { z } from 'zod';

// ═══════════════════════════════════════════════════════════
// Shared Zod Schemas for MiLyfe Platform
// Use these across forms for consistent validation
// ═══════════════════════════════════════════════════════════

// — General —

export const titleSchema = z.string().min(1, 'Title is required').max(200, 'Title too long');
export const descriptionSchema = z.string().max(5000, 'Description too long').optional();
export const mlyAmountSchema = z.number().min(0, 'Amount must be positive').max(1000000);
export const urlSchema = z.string().url('Invalid URL').or(z.literal('')).optional();
export const tagsSchema = z.string().transform((val) => val.split(',').map(t => t.trim()).filter(Boolean));

// — Forum —

export const createPostSchema = z.object({
  space_id: z.string().min(1, 'Select a space'),
  title: titleSchema,
  body: z.string().max(10000).optional(),
  type: z.enum(['text', 'link', 'image']),
  url: urlSchema,
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createSpaceSchema = z.object({
  name: z.string().min(2, 'Name too short').max(50, 'Name too long'),
  description: z.string().max(500).optional(),
  icon: z.string().max(2).default('💬'),
});
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;

// — Market —

export const createListingSchema = z.object({
  type: z.enum(['product', 'service', 'classified', 'gig']),
  title: titleSchema,
  description: z.string().min(10, 'Add more detail').max(5000),
  price: z.number().min(0, 'Price must be positive'),
  price_type: z.enum(['fixed', 'negotiable', 'free', 'trade']),
  category: z.string().min(1, 'Select a category'),
  location: z.string().max(100).optional(),
});
export type CreateListingInput = z.infer<typeof createListingSchema>;

// — MiHome —

export const createHomeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['apartment', 'house', 'condo', 'room', 'studio']),
  address: z.string().max(200).optional(),
  monthly_budget: z.number().min(0).optional(),
});
export type CreateHomeInput = z.infer<typeof createHomeSchema>;

export const maintenanceTaskSchema = z.object({
  title: z.string().min(1, 'What needs fixing?').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().min(1),
  due_date: z.string().optional(),
  cost_estimate: z.number().min(0).optional(),
});
export type MaintenanceTaskInput = z.infer<typeof maintenanceTaskSchema>;

export const projectSchema = z.object({
  title: z.string().min(1, 'Project name required').max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(1),
  budget: z.number().min(0).optional(),
  target_date: z.string().optional(),
});
export type ProjectInput = z.infer<typeof projectSchema>;

// — Media —

export const blogPostSchema = z.object({
  title: titleSchema,
  content: z.string().min(50, 'Write at least 50 characters'),
  excerpt: z.string().max(300).optional(),
  tags: z.string().optional(),
  series_id: z.string().optional(),
});
export type BlogPostInput = z.infer<typeof blogPostSchema>;

export const streamSchema = z.object({
  title: z.string().min(1, 'Stream title required').max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1, 'Select a category'),
});
export type StreamInput = z.infer<typeof streamSchema>;

export const podcastSchema = z.object({
  title: z.string().min(1, 'Podcast name required').max(100),
  description: z.string().min(10, 'Add a description').max(1000),
  category: z.string().min(1),
});
export type PodcastInput = z.infer<typeof podcastSchema>;

export const episodeSchema = z.object({
  podcast_id: z.string().min(1, 'Select a podcast'),
  title: z.string().min(1, 'Episode title required').max(200),
  description: z.string().max(2000).optional(),
  show_notes: z.string().max(5000).optional(),
  guests: z.string().optional(),
});
export type EpisodeInput = z.infer<typeof episodeSchema>;

// — Financial Services —

export const savingsCircleSchema = z.object({
  name: z.string().min(1, 'Circle name required').max(100),
  description: z.string().max(500).optional(),
  contribution_amount: z.number().min(1, 'Minimum $1 MLY'),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  max_members: z.number().min(2).max(50),
});
export type SavingsCircleInput = z.infer<typeof savingsCircleSchema>;

export const microLoanSchema = z.object({
  amount: z.number().min(1, 'Minimum $1 MLY').max(5000),
  purpose: z.string().min(10, 'Explain the purpose').max(500),
  repayment_months: z.number().min(1).max(24),
});
export type MicroLoanInput = z.infer<typeof microLoanSchema>;

// — Research —

export const researchProjectSchema = z.object({
  title: titleSchema,
  abstract: z.string().min(50, 'Abstract must be at least 50 characters').max(2000),
  field: z.string().min(1, 'Select a field'),
  methodology: z.string().max(5000).optional(),
  tags: z.string().optional(),
  funding_needed: z.number().min(0).optional(),
});
export type ResearchProjectInput = z.infer<typeof researchProjectSchema>;

export const peerReviewSchema = z.object({
  feedback: z.string().min(20, 'Provide at least 20 characters of feedback').max(5000),
  methodology_score: z.number().min(1).max(5),
  rigor_score: z.number().min(1).max(5),
  impact_score: z.number().min(1).max(5),
});
export type PeerReviewInput = z.infer<typeof peerReviewSchema>;

// — Roommates —

export const expenseSchema = z.object({
  description: z.string().min(1, 'Describe the expense').max(200),
  amount: z.number().min(0.01, 'Amount must be positive'),
  category: z.string().min(1),
  split_type: z.enum(['equal', 'custom', 'percentage']).default('equal'),
});
export type ExpenseInput = z.infer<typeof expenseSchema>;

// — Auto —

export const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(2030),
  color: z.string().min(1),
  fuel_type: z.enum(['gas', 'diesel', 'electric', 'hybrid']),
  mileage: z.number().min(0),
  vin: z.string().max(17).optional(),
  license_plate: z.string().max(10).optional(),
});
export type VehicleInput = z.infer<typeof vehicleSchema>;
