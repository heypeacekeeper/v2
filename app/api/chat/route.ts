import {
  consumeStream,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const JARVIS_SYSTEM_PROMPT = `You are Jarvis, an AI assistant for StartiGeniX - a startup launchpad platform for students and founders.

Your role is to help users with:
- Startup advice and strategy
- Business model development
- Fundraising guidance
- Product development best practices
- Marketing and growth tactics
- Technical architecture decisions
- Team building and hiring
- Legal and compliance basics

Personality:
- Be helpful, encouraging, and supportive
- Provide actionable advice
- Use examples when helpful
- Be concise but thorough
- Acknowledge when something is outside your expertise

Always remember you're talking to aspiring entrepreneurs who may be early in their journey.`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: JARVIS_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  });
}
