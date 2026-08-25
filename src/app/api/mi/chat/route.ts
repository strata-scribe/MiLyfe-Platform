import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { MI_SYSTEM_PROMPT, checkInputRails } from '@/lib/mi/rails';

/**
 * Mi Chat API — Streaming via fetch to OpenAI-compatible API
 *
 * Streams responses from any OpenAI-compatible backend (Ollama, OpenAI, vLLM).
 * Includes function calling with tool execution against Supabase.
 */

interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { messages, conversationId, currentPath } = body;

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'Messages required' }, { status: 400 });
  }

  // Rail check on latest user message
  const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
  if (lastUserMsg) {
    const railCheck = checkInputRails(lastUserMsg.content);
    if (!railCheck.passed && railCheck.action === 'redirect') {
      return NextResponse.json({
        role: 'assistant',
        content: railCheck.redirect_message,
        rail_triggered: true,
      });
    }
  }

  const apiBase = process.env.OPENAI_API_BASE_URL || 'http://localhost:11434/v1';
  const apiKey = process.env.OPENAI_API_KEY || 'ollama';
  const model = process.env.MI_MODEL || 'llama3.2:3b';

  // Persist user message
  if (conversationId && lastUserMsg) {
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: user.id,
      body: lastUserMsg.content,
      metadata: { conversation_id: conversationId, role: 'user' },
    });
  }

  // Build context-aware system prompt
  const contextHint = currentPath ? getContextHint(currentPath) : '';
  const systemPrompt = contextHint
    ? `${MI_SYSTEM_PROMPT}\n\n## Current Context\nThe member is currently on: ${currentPath}\n${contextHint}`
    : MI_SYSTEM_PROMPT;

  // Build messages with system prompt
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-20),
  ];

  try {
    // Try primary backend, fall back to cloud if local fails
    let response = await tryFetch(apiBase, apiKey, model, fullMessages);

    // If primary fails and cloud fallback is configured, try that
    if ((!response || !response.ok) && process.env.MI_FALLBACK_API_BASE_URL) {
      response = await tryFetch(
        process.env.MI_FALLBACK_API_BASE_URL,
        process.env.MI_FALLBACK_API_KEY || '',
        process.env.MI_FALLBACK_MODEL || 'gpt-4o-mini',
        fullMessages,
      );
    }

    if (!response || !response.ok || !response.body) {
      return NextResponse.json({
        role: 'assistant',
        content: "I'm having trouble connecting right now. Try again in a moment, or I can connect you with a person.",
        error: true,
      });
    }

    // Stream the response through
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        let fullContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;

                if (delta?.content) {
                  fullContent += delta.content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta.content })}\n\n`));
                }

                // Handle tool calls
                if (delta?.tool_calls) {
                  for (const toolCall of delta.tool_calls) {
                    if (toolCall.function?.name) {
                      const toolResult = await executeTool(toolCall.function.name, toolCall.function.arguments, supabase, user.id);
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tool_result: { name: toolCall.function.name, result: toolResult } })}\n\n`));
                    }
                  }
                }
              } catch {
                // Skip unparseable chunks
              }
            }
          }

          // Persist assistant message
          if (conversationId && fullContent) {
            await supabase.from('messages').insert({
              sender_id: user.id,
              receiver_id: user.id,
              body: fullContent,
              metadata: { conversation_id: conversationId, role: 'assistant' },
            });
          }
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Mi chat error:', error);
    return NextResponse.json({
      role: 'assistant',
      content: "I can't reach my thinking backend right now. You can still use all of MiLyfe — I'm just not available for chat at the moment.",
      error: true,
    });
  }
}

// Tool definitions for the AI model
function getMiTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'search_resources',
        description: 'Search community resources (shelters, food banks, clinics, legal aid)',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: ['shelter', 'food', 'legal', 'clinic', 'transit', 'jobs', 'housing', 'mental_health'] },
          },
          required: ['category'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'draft_thank',
        description: 'Draft a $MLY payment (requires member confirmation)',
        parameters: {
          type: 'object',
          properties: {
            recipient_name: { type: 'string' },
            amount: { type: 'number' },
            reason: { type: 'string' },
          },
          required: ['recipient_name', 'amount', 'reason'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'suggest_learn_path',
        description: 'Suggest learning paths based on interests',
        parameters: {
          type: 'object',
          properties: {
            interest: { type: 'string' },
          },
          required: ['interest'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'handoff_to_human',
        description: 'Connect member to a human helper',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: ['legal', 'medical', 'safety', 'financial', 'emotional', 'housing', 'employment'] },
            urgency: { type: 'string', enum: ['routine', 'soon', 'urgent', 'emergency'] },
          },
          required: ['category', 'urgency'],
        },
      },
    },
  ];
}

// Execute a tool against the database
async function executeTool(name: string, argsJson: string, supabase: any, userId: string) {
  try {
    const args = JSON.parse(argsJson);

    switch (name) {
      case 'search_resources': {
        const { data } = await supabase
          .from('community_resources')
          .select('name, category, address, phone, description')
          .eq('category', args.category)
          .in('status', ['active', 'stale'])
          .limit(5);
        return { resources: data || [] };
      }

      case 'draft_thank': {
        const { data: recipient } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .or(`username.ilike.%${args.recipient_name}%,display_name.ilike.%${args.recipient_name}%`)
          .limit(1)
          .single();

        if (!recipient) return { error: `Could not find "${args.recipient_name}"` };
        return {
          draft: true,
          recipient_name: recipient.display_name || recipient.username,
          amount: args.amount,
          reason: args.reason,
          confirm_url: `/wallet?send=${recipient.id}&amount=${args.amount}`,
        };
      }

      case 'suggest_learn_path': {
        const { data } = await supabase
          .from('learn_paths')
          .select('slug, title, description, icon, duration_weeks')
          .eq('is_active', true);

        const lower = (args.interest || '').toLowerCase();
        const matches = (data || []).filter((p: any) =>
          p.title.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower)
        );
        return { paths: matches.length > 0 ? matches.slice(0, 3) : (data || []).slice(0, 3) };
      }

      case 'handoff_to_human': {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'system',
          title: 'Human help requested',
          body: `Mi is connecting you with a ${args.category} helper (${args.urgency}).`,
          link: '/connect',
        });
        return { success: true, message: 'A community member will be in touch.' };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch {
    return { error: 'Tool execution failed' };
  }
}


// Helper: try fetching from an AI backend
async function tryFetch(apiBase: string, apiKey: string, model: string, messages: ChatMessage[]) {
  try {
    return await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
        tools: getMiTools(),
      }),
    });
  } catch {
    return null;
  }
}

// Context hints based on current page
function getContextHint(path: string): string {
  if (path.startsWith('/wallet')) return 'They might need help sending $MLY, checking balance, or understanding transactions. Offer to help with transfers.';
  if (path.startsWith('/learn')) return 'They are exploring learning paths. Offer to suggest paths based on their interests or help with current modules.';
  if (path.startsWith('/street')) return 'They are browsing the marketplace, quests, or resources. Offer to help find resources, create listings, or find quests.';
  if (path.startsWith('/governance')) return 'They are looking at governance. Offer to explain proposals in plain language or help them understand the voting process.';
  if (path.startsWith('/safety')) return 'They may need safety support. Be gentle. Offer crisis resources if appropriate. Never minimize their situation.';
  if (path.startsWith('/profile')) return 'They are managing their profile. Offer help with settings, standing explanation, or privacy controls.';
  return '';
}
