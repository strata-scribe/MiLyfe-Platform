import { describe, it, expect } from 'vitest';
import { emailSchema, passwordSchema, usernameSchema, urlSchema, amountSchema, validate } from '../validation';

describe('validation', () => {
  describe('emailSchema', () => {
    it('validates correct emails', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(emailSchema.safeParse('testexample.com').success).toBe(false);
      expect(emailSchema.safeParse('').success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('validates strong passwords', () => {
      expect(passwordSchema.safeParse('StrongPass1!').success).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(passwordSchema.safeParse('weak').success).toBe(false);
      expect(passwordSchema.safeParse('NoSpecialChar1').success).toBe(false);
      expect(passwordSchema.safeParse('nonumber!@').success).toBe(false);
    });
  });

  describe('usernameSchema', () => {
    it('validates correct usernames', () => {
      expect(usernameSchema.safeParse('valid_user123').success).toBe(true);
    });

    it('rejects invalid usernames', () => {
      expect(usernameSchema.safeParse('ab').success).toBe(false); // too short
      expect(usernameSchema.safeParse('invalid-user').success).toBe(false); // dash not allowed
      expect(usernameSchema.safeParse('a'.repeat(21)).success).toBe(false); // too long
    });
  });

  describe('urlSchema', () => {
    it('validates correct URLs', () => {
      expect(urlSchema.safeParse('https://example.com').success).toBe(true);
      expect(urlSchema.safeParse('').success).toBe(true); // optional/empty string allowed
      expect(urlSchema.safeParse(undefined).success).toBe(true); // optional allowed
    });

    it('rejects invalid URLs', () => {
      expect(urlSchema.safeParse('not-a-url').success).toBe(false);
    });
  });

  describe('amountSchema', () => {
    it('validates correct amounts', () => {
      expect(amountSchema.safeParse(100).success).toBe(true);
      expect(amountSchema.safeParse(1000000).success).toBe(true);
    });

    it('rejects invalid amounts', () => {
      expect(amountSchema.safeParse(-10).success).toBe(false);
      expect(amountSchema.safeParse(0).success).toBe(false);
      expect(amountSchema.safeParse(1000001).success).toBe(false);
    });
  });

  describe('validate', () => {
    it('returns success object for valid data', () => {
      const result = validate(emailSchema, 'test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('returns error object for invalid data', () => {
      const result = validate(emailSchema, 'invalid-email');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toBe('Invalid email address');
      }
    });
  });
});
