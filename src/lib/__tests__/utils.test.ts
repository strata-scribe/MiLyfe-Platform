import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, truncateText, slugify, generateId } from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges tailwind classes properly', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8');
      expect(cn('p-4', { 'bg-red-500': true, 'text-white': false })).toBe('p-4 bg-red-500');
    });
  });

  describe('formatCurrency', () => {
    it('formats numbers as USD currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('formatDate', () => {
    it('formats date objects properly', () => {
      const date = new Date('2023-01-15T12:00:00Z');
      expect(formatDate(date)).toMatch(/Jan 15, 2023/);
    });

    it('formats date strings properly', () => {
      expect(formatDate('2023-01-15')).toMatch(/Jan 1[45], 2023/);
    });
  });

  describe('truncateText', () => {
    it('truncates text that is too long', () => {
      expect(truncateText('Hello world', 5)).toBe('Hello...');
    });

    it('does not truncate text that is short enough', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });
  });

  describe('slugify', () => {
    it('converts text to a url-friendly slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('  Testing 123!@#  ')).toBe('testing-123');
      expect(slugify('multiple---dashes')).toBe('multiple-dashes');
    });
  });

  describe('generateId', () => {
    it('generates a random string of the specified length', () => {
      const id = generateId(10);
      expect(typeof id).toBe('string');
      expect(id.length).toBe(10);
    });

    it('uses a default length of 8', () => {
      expect(generateId().length).toBe(8);
    });
  });
});
