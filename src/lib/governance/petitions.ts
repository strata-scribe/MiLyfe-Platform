import { z } from 'zod';

export const PetitionStatus = z.enum(['active', 'successful', 'failed', 'closed']);
export type PetitionStatusType = z.infer<typeof PetitionStatus>;

export const PetitionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(1000, 'Description must be less than 1000 characters'),
  authorId: z.string(),
  createdAt: z.date().default(() => new Date()),
  expiresAt: z.date(),
  signatureCount: z.number().int().nonnegative().default(0),
  referendumThreshold: z.number().int().positive(),
  status: PetitionStatus.default('active'),
});

export type Petition = z.infer<typeof PetitionSchema>;

export const CreatePetitionSchema = PetitionSchema.omit({
  id: true,
  createdAt: true,
  signatureCount: true,
  status: true,
}).extend({
  expiresAt: z.coerce.date().min(new Date(), 'Expiration date must be in the future'),
});

export type CreatePetition = z.infer<typeof CreatePetitionSchema>;

export const SignatureSchema = z.object({
  id: z.string().uuid().optional(),
  petitionId: z.string(),
  userId: z.string(),
  signedAt: z.date().default(() => new Date()),
});

export type Signature = z.infer<typeof SignatureSchema>;
