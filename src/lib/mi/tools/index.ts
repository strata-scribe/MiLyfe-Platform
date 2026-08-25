/**
 * Mi Function-Calling Tools
 *
 * These are the actions Mi can draft or perform on behalf of the member.
 * All state-changing tools return drafts that require human confirmation.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  requires_confirmation: boolean;
}

interface ToolParameter {
  type: string;
  description: string;
  required?: boolean;
  enum?: string[];
}

export const MI_TOOLS: ToolDefinition[] = [
  {
    name: 'pocket_draft_thank',
    description: 'Draft a $MLY thank-you payment. Requires member confirmation before executing.',
    parameters: {
      recipient_name: { type: 'string', description: 'Name of the person to thank', required: true },
      amount: { type: 'number', description: 'Amount of $MLY to send (1-1000)', required: true },
      reason: { type: 'string', description: 'Reason for thanking (max 200 chars)', required: true },
    },
    requires_confirmation: true,
  },
  {
    name: 'street_search_resource',
    description: 'Search community resources (shelters, food banks, clinics, legal aid, transit, jobs, housing)',
    parameters: {
      category: {
        type: 'string',
        description: 'Resource category',
        required: true,
        enum: ['shelter', 'food', 'legal', 'clinic', 'transit', 'jobs', 'housing', 'mental_health'],
      },
      max_results: { type: 'number', description: 'Maximum results to return (default 5)', required: false },
    },
    requires_confirmation: false,
  },
  {
    name: 'learn_suggest_path',
    description: 'Suggest a learning path based on member interests and situation',
    parameters: {
      interest_area: { type: 'string', description: 'What the member wants to learn about', required: true },
      time_available: { type: 'string', description: 'How much time they have (e.g. "2 hours/week")', required: false },
    },
    requires_confirmation: false,
  },
  {
    name: 'voice_explain_proposal',
    description: 'Explain a governance proposal in plain language',
    parameters: {
      proposal_id: { type: 'string', description: 'ID of the proposal to explain', required: true },
    },
    requires_confirmation: false,
  },
  {
    name: 'safety_escalate',
    description: 'Escalate a safety concern to a human keeper. NEVER auto-resolves.',
    parameters: {
      urgency: {
        type: 'string',
        description: 'How urgent is this',
        required: true,
        enum: ['routine', 'soon', 'urgent', 'emergency'],
      },
      category: {
        type: 'string',
        description: 'Type of safety concern',
        required: true,
        enum: ['self_harm', 'dv', 'child_safety', 'threat', 'other'],
      },
      context_summary: { type: 'string', description: 'Brief context (NO names, NO PII)', required: true },
    },
    requires_confirmation: true,
  },
  {
    name: 'handoff_to_human',
    description: 'Route member to a human helper when Mi cannot or should not continue',
    parameters: {
      need_category: {
        type: 'string',
        description: 'What kind of help is needed',
        required: true,
        enum: ['legal', 'medical', 'safety', 'financial', 'emotional', 'technical', 'housing', 'employment', 'education'],
      },
      urgency: {
        type: 'string',
        description: 'How urgent',
        required: true,
        enum: ['routine', 'soon', 'urgent', 'emergency'],
      },
    },
    requires_confirmation: true,
  },
];

/**
 * Convert tool definitions to the format expected by the AI SDK
 */
export function getToolsForSDK() {
  return MI_TOOLS.reduce(
    (acc, tool) => {
      acc[tool.name] = {
        description: tool.description,
        parameters: {
          type: 'object' as const,
          properties: Object.fromEntries(
            Object.entries(tool.parameters).map(([key, param]) => [
              key,
              {
                type: param.type,
                description: param.description,
                ...(param.enum ? { enum: param.enum } : {}),
              },
            ]),
          ),
          required: Object.entries(tool.parameters)
            .filter(([, param]) => param.required)
            .map(([key]) => key),
        },
      };
      return acc;
    },
    {} as Record<string, any>,
  );
}
