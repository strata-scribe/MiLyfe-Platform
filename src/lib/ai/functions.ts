/**
 * Mi AI Function Calling System
 * 
 * Allows Mi to execute platform actions on behalf of users via natural language.
 * Each function has: name, description, parameters, and an executor.
 */

export interface AIFunction {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

export const AI_FUNCTIONS: AIFunction[] = [
  {
    name: 'send_mly',
    description: 'Send $MLY to another user',
    parameters: {
      recipient: { type: 'string', description: 'Email or display name of recipient', required: true },
      amount: { type: 'number', description: 'Amount of $MLY to send', required: true },
      note: { type: 'string', description: 'Optional note with the transfer' },
    },
  },
  {
    name: 'report_issue',
    description: 'Report a community issue to MiCity',
    parameters: {
      title: { type: 'string', description: 'Brief title of the issue', required: true },
      category: { type: 'string', description: 'Category: infrastructure, safety, environment, community, transit', required: true },
      description: { type: 'string', description: 'Detailed description' },
    },
  },
  {
    name: 'create_post',
    description: 'Create a post in the community feed',
    parameters: {
      content: { type: 'string', description: 'Post content text', required: true },
    },
  },
  {
    name: 'check_balance',
    description: 'Check the user\'s current $MLY balance',
    parameters: {},
  },
  {
    name: 'find_resource',
    description: 'Find a community resource (food, housing, legal aid, health)',
    parameters: {
      category: { type: 'string', description: 'Resource category', required: true },
      query: { type: 'string', description: 'What specifically they need' },
    },
  },
  {
    name: 'health_checkin',
    description: 'Perform a health check-in for the user',
    parameters: {
      mood: { type: 'number', description: 'Mood 1-5 (1=rough, 5=great)', required: true },
      energy: { type: 'number', description: 'Energy 1-5', required: true },
      sleep: { type: 'number', description: 'Hours of sleep', required: true },
    },
  },
  {
    name: 'search_courses',
    description: 'Search available courses on MiLearn',
    parameters: {
      query: { type: 'string', description: 'What they want to learn' },
      category: { type: 'string', description: 'Course category' },
    },
  },
  {
    name: 'navigate',
    description: 'Navigate user to a specific page/app within MiLyfe',
    parameters: {
      destination: { type: 'string', description: 'Page name or route', required: true },
    },
  },
];

/**
 * Build the function definitions for the LLM prompt
 */
export function getFunctionDefinitionsForPrompt(): string {
  return AI_FUNCTIONS.map(f => {
    const params = Object.entries(f.parameters).map(([k, v]) => `  - ${k} (${v.type}${v.required ? ', required' : ''}): ${v.description}`).join('\n');
    return `${f.name}: ${f.description}\n${params || '  (no parameters)'}`;
  }).join('\n\n');
}

/**
 * Parse a function call from the AI response
 */
export function parseFunctionCall(response: string): { name: string; args: Record<string, unknown> } | null {
  // Look for JSON function call pattern in response
  const match = response.match(/\[FUNCTION_CALL\]\s*(\{[\s\S]*?\})/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);
    if (parsed.name && AI_FUNCTIONS.some(f => f.name === parsed.name)) {
      return { name: parsed.name, args: parsed.arguments || {} };
    }
  } catch {
    // Not valid JSON
  }
  return null;
}
