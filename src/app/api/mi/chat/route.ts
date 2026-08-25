import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { MI_SYSTEM_PROMPT, checkInputRails } from '@/lib/mi/rails';
import { getToolsForSDK } from '@/lib/mi/tools';

/**
 * Mi Chat API — Streaming chat endpoint
 *
 * MVP approach: proxy to any OpenAI-compatible API (Ollama, OpenAI, etc.)
 * configured via OPENAI_API_BASE_URL and OPENAI_API_KEY env vars.
 *
 * For production: use Vercel AI SDK with proper streaming.
 * For MVP without `ai` package installed: simple fetch-based proxy.
 */

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { messages }: { messages: ChatMessage[] } = body;

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'Messages required' }, { status: 400 });
  }

  // Get the latest user message
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
  if (!lastUserMessage) {
    return NextResponse.json({ error: 'No user message found' }, { status: 400 });
  }

  // Rail check on input
  const inputCheck = checkInputRails(lastUserMessage.content);
  if (!inputCheck.passed && inputCheck.action === 'redirect') {
    // Return crisis resources immediately without calling AI
    return NextResponse.json({
      role: 'assistant',
      content: inputCheck.redirect_message,
      rail_triggered: true,
    });
  }

  // Build conversation with system prompt
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: MI_SYSTEM_PROMPT },
    ...messages.slice(-20), // Keep last 20 messages for context window
  ];

  // Call AI backend
  const apiBase = process.env.OPENAI_API_BASE_URL || 'http://localhost:11434/v1';
  const apiKey = process.env.OPENAI_API_KEY || 'ollama';
  const model = process.env.MI_MODEL || 'llama3.2:3b';

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false, // MVP: non-streaming for simplicity
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return NextResponse.json({
        role: 'assistant',
        content:
          "I'm having trouble connecting right now. Is there something I can help you with that doesn't need me to think too hard? Or I can connect you with a person.",
        error: true,
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "I'm not sure how to respond to that.";

    return NextResponse.json({
      role: 'assistant',
      content: assistantMessage,
    });
  } catch (error) {
    console.error('Mi chat error:', error);
    return NextResponse.json({
      role: 'assistant',
      content:
        "I can't reach my thinking backend right now. This might mean the AI server is offline. You can still use all of MiLyfe — I'm just not available for chat at the moment.",
      error: true,
    });
  }
}
