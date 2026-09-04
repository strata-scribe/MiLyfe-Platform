import { describe, it, expect } from 'vitest';
import { escalateCase } from '../handoff';

describe('handoff case escalation', () => {
  it('should escalate when confidence is below threshold', () => {
    const result = escalateCase(0.4, 0.5, { category: 'financial', urgency: 'routine' });
    expect(result.status).toBe('escalated');
    expect(result.reason).toBe('Confidence below threshold');
  });

  it('should not escalate when confidence is above threshold', () => {
    const result = escalateCase(0.8, 0.5, { category: 'financial', urgency: 'routine' });
    expect(result.status).toBe('handled');
  });

  it('should not escalate when confidence equals threshold', () => {
    const result = escalateCase(0.5, 0.5, { category: 'financial', urgency: 'routine' });
    expect(result.status).toBe('handled');
  });
});
