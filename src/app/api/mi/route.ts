import { NextResponse } from 'next/server';
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

// Mi AI Assistant — uses Groq (free, fast, no signup for public models)
// Falls back to local response if API unavailable

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are Mi, the community assistant for MiLyfe — a civic engagement platform in Jacksonville, FL. You help residents with:

- Finding food, shelter, legal aid, health services
- Understanding how to report city issues (potholes, lights, dumping)
- Explaining how $MLY credits work (earn by check-ins, reporting, events; spend at local shops)
- Directing people to the right part of the app
- Crisis support (always direct to 911 for emergencies, 988 for mental health)
- Job resources and community events

Your tone: warm, direct, plain language. Never condescending. You speak like a trusted neighbor who knows the system.

RULES:
- Keep responses under 150 words
- If someone is in danger, lead with 911/988 before anything else
- Never make up resource addresses or phone numbers you don't know
- Suggest specific MiLyfe features when relevant (MiCity, MiHealth, MiShop, MiConnect, MiVault)
- You cannot spend money, change settings, or access private data
- If you don't know, say so and suggest who might help`;

export async function POST(request: Request) {
  // Rate limit
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateCheck = checkRateLimit(`mi:${ip}`, RATE_LIMITS.ai);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { response: "I need a moment to catch my breath. Try again in a minute!" },
      { status: 429, headers: rateLimitHeaders(rateCheck) }
    );
  }

  const { message, history = [] } = await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ response: "I'm here when you need me. What can I help with?" });
  }

  // Build messages array
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-6).map((h: any) => ({
      role: h.role === 'mi' ? 'assistant' : 'user',
      content: h.content,
    })),
    { role: 'user', content: message },
  ];

  // Try Groq first (free tier, very fast)
  if (GROQ_API_KEY) {
    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages,
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content;
        if (aiResponse) {
          return NextResponse.json({ response: aiResponse, source: 'groq' });
        }
      }
    } catch {
      // Fall through to local
    }
  }

  // Fallback: smart local responses
  const localResponse = getLocalResponse(message);
  return NextResponse.json({ response: localResponse, source: 'local' });
}

function getLocalResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.match(/emergency|911|danger|hurt|attack/)) {
    return "If you're in immediate danger, call 911 NOW. For mental health crisis, call 988. I'm here for non-emergency help after you're safe.";
  }
  if (lower.match(/food|hungry|eat|meal|pantry/)) {
    return "For food help: Feeding Northeast Florida (904-513-1232) has pantries across Jacksonville. Clara White Mission serves meals daily. Check the Map tab → Resources to find the nearest option. You can also browse MiShop for local food vendors accepting $MLY.";
  }
  if (lower.match(/shelter|homeless|housing|sleep|evict/)) {
    return "Sulzbacher Center (904-394-1356) has emergency shelter beds. Salvation Army also takes walk-ins. For eviction help, Jacksonville Legal Aid: 904-356-8371. Open the Map → Resources to see all shelters near you.";
  }
  if (lower.match(/job|work|employ|hire|gig/)) {
    return "Check MiCity → Jobs tab for local gigs paying in $MLY. WorkSource Jacksonville (904-798-9229) does free job placement. Clara White Mission has job training programs. You earn $MLY just by participating in community — that builds trust with local employers.";
  }
  if (lower.match(/id|license|document|birth cert|social security/)) {
    return "MiVault stores your documents securely. For a replacement ID: visit your local DMV or call 904-350-7575. Birth certificates: Duval County Health Department. MiVault lets you share verified docs with employers without giving away originals.";
  }
  if (lower.match(/health|doctor|clinic|sick|medicine|prescription/)) {
    return "Agape Community Health Center offers sliding-scale healthcare — no insurance needed. For mental health: call 988 or visit Gateway Community Services. Do your daily MiHealth check-in — it earns $MLY and helps you track patterns over time.";
  }
  if (lower.match(/mly|credits|money|balance|earn|spend/)) {
    return "You earn $MLY by: daily health check-ins (+5), reporting issues (+10), attending events (+varies), and daily UBI if you stay active (+10). Spend at local vendors on MiShop. It's community currency — the more you participate, the more you earn.";
  }
  if (lower.match(/safe|abuse|domestic|violence|hide|ex|stalker/)) {
    return "Your safety comes first. National DV Hotline: 1-800-799-7233. Hubbard House Jacksonville: 904-354-3114 (24hr). In MiLyfe, enable Safety Mode in your profile — it hides you from all searches and neighbor visibility. One tap to disappear.";
  }
  if (lower.match(/legal|lawyer|court|ticket|warrant|arrest/)) {
    return "Jacksonville Area Legal Aid: 904-356-8371 (free for qualifying residents). For public defender: 904-255-4400. If you have a court date, MiVault can help you keep documents organized. Don't miss dates — set a reminder.";
  }
  if (lower.match(/vote|election|ballot|candidate|register/)) {
    return "Register to vote at registertovoteflorida.gov or Duval County Supervisor of Elections: 904-255-8683. In MiLyfe, the MiCity → Vote tab lets you participate in community decisions about your neighborhood. Your voice matters here.";
  }

  return "I hear you. Here's what I can help with: finding resources (food, shelter, health, legal), understanding $MLY credits, reporting city issues, or connecting with neighbors. What area do you need help with?";
}
