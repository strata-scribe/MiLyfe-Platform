/**
 * Mi Rails — Non-Negotiable Limits
 *
 * These checks run BEFORE every AI response is returned to the user.
 * No helper may violate these. Hardcoded, not configurable, not voteable.
 */

export interface RailCheckResult {
  passed: boolean;
  violation?: string;
  rail_id?: number;
  action?: 'block' | 'redirect' | 'warn';
  redirect_message?: string;
}

/**
 * Check user input for safety-critical patterns that require immediate human intervention.
 */
export function checkInputRails(userMessage: string): RailCheckResult {
  const lowerMessage = userMessage.toLowerCase();

  // Rail 7: Self-harm detection → immediate redirect
  const selfHarmPatterns = [
    'kill myself',
    'want to die',
    'end my life',
    'suicide',
    'self harm',
    'self-harm',
    'hurt myself',
    'no reason to live',
    "don't want to be alive",
    "don't want to live",
  ];

  for (const pattern of selfHarmPatterns) {
    if (lowerMessage.includes(pattern)) {
      return {
        passed: false,
        violation: 'Self-harm language detected',
        rail_id: 7,
        action: 'redirect',
        redirect_message:
          "I hear you, and I want you to talk to someone who can really help right now.\n\n" +
          "**988 Suicide & Crisis Lifeline:** Call or text **988**\n" +
          "**Crisis Text Line:** Text **HOME** to **741741**\n\n" +
          "These are free, confidential, and available 24/7. You matter.",
      };
    }
  }

  return { passed: true };
}

/**
 * Check AI response before sending to user.
 */
export function checkOutputRails(
  response: string,
  context: { is_helper: boolean; has_sources: boolean },
): RailCheckResult {
  // Rail 5: Never impersonate a human
  // (enforced by always showing [Helper] label in UI, not by content filtering)

  // Rail 8: Never provide legal/medical advice
  const advicePatterns = [
    'you should sue',
    'you should file a lawsuit',
    'take this medication',
    'stop taking your medication',
    'you have [disease]',
    'my legal advice is',
    'as your doctor',
    'i diagnose',
  ];

  const lowerResponse = response.toLowerCase();
  for (const pattern of advicePatterns) {
    if (lowerResponse.includes(pattern)) {
      return {
        passed: false,
        violation: 'Response contains legal/medical advice',
        rail_id: 8,
        action: 'block',
      };
    }
  }

  // Rail 10: No factual claim without source attribution
  // (soft check — warn rather than block if no citations in factual response)
  if (!context.has_sources && containsFactualClaim(lowerResponse)) {
    return {
      passed: true, // warn, don't block
      violation: 'Factual claim without citation',
      rail_id: 10,
      action: 'warn',
    };
  }

  return { passed: true };
}

/**
 * Simple heuristic for factual claims (numbers, dates, named entities + "is/are/was/were")
 */
function containsFactualClaim(text: string): boolean {
  // Contains specific numbers + assertion patterns
  const patterns = [
    /\d+%/,
    /\d{4}/, // years
    /according to/,
    /studies show/,
    /research indicates/,
    /it is (a )?fact/,
  ];
  return patterns.some((p) => p.test(text));
}

/**
 * The system prompt that enforces helper behavior.
 */
export const MI_SYSTEM_PROMPT = `You are Mi, the general assistant for MiLyfe — a community-owned digital voluntary commons.

## Who You Are
- You are a helpful AI assistant, NOT a person, NOT a lawyer, NOT a doctor, NOT the police.
- You always disclose that you are an AI helper.
- You speak at a 6th-grade reading level unless asked otherwise.
- You are warm, direct, and never condescending.

## What You Can Do
- Answer questions about MiLyfe (Pocket, Learn, Street, Voice, You tabs)
- Help navigate resources (shelters, food, legal aid, clinics)
- Draft $MLY transactions (but NEVER execute without human confirmation)
- Explain governance proposals in plain language
- Suggest learning paths based on interests
- Help with marketplace listings and quest descriptions
- Provide information (with sources when possible)

## What You CANNOT Do (Rails — Hardcoded)
1. You CANNOT spend $MLY without the member confirming.
2. You CANNOT make decisions about children without a guardian.
3. You CANNOT alter governance rules or the Living Compact.
4. You CANNOT make peace/mediation decisions — only schedule.
5. You CANNOT pretend to be human. Always identify as "[Mi - Helper]".
6. You CANNOT access safety case details.
7. If someone expresses self-harm intent, IMMEDIATELY provide crisis resources (988, Crisis Text Line) and offer to connect them with a human.
8. You CANNOT provide legal or medical advice. You CAN navigate, inform, and help prepare — but always say "I'm not a lawyer/doctor."
9. You CANNOT retain conversation memory beyond this session without explicit opt-in.
10. You MUST cite sources for factual claims or say "I don't know."
11. If someone says "stop" or "no" or "leave me alone" — disengage immediately.
12. You CANNOT share what one member said with another.
13. You CANNOT train on member data.
14. You CANNOT enforce disputed decisions during active appeals.
15. You CANNOT process child data through external (cloud) services.

## Handoff
When you can't help or shouldn't help, say: "This is beyond what I can do. Let me connect you with a person who can help." Then offer to use the handoff system.

## Tone
- Warm but not performative
- Direct but not cold
- Honest about limitations
- Never uses exclamation marks excessively
- Uses plain language (6th grade reading level default)
`;
