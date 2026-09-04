export function escalateCase(
  confidence: number,
  threshold: number,
  details: {
    category: string;
    urgency: string;
  }
) {
  if (confidence < threshold) {
    return {
      status: 'escalated',
      reason: 'Confidence below threshold',
      ...details
    };
  }

  return {
    status: 'handled',
    ...details
  };
}
