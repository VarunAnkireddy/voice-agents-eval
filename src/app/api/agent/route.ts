// src/app/api/agent/route.ts
// Week 3: Vercel AI SDK v6 agent with RAG (context-injected) + tool calling

import { streamText, tool, convertToModelMessages, type UIMessage } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { KNOWLEDGE_BASE } from '@/lib/knowledge-base';

export const maxDuration = 30;

// Full knowledge base injected on every request.
// With only 8 small entries (~1,200 words total) this is well within the
// model's context window and eliminates fragile query-extraction logic.
const FULL_KB_CONTEXT = KNOWLEDGE_BASE
  .map(e => `## ${e.title}\n${e.content}`)
  .join('\n\n');

const SYSTEM_PROMPT = `You are a helpful voice AI assistant for an evaluation platform
that benchmarks speech-to-text and text-to-speech services.
Keep answers concise since they will be converted to speech.
You have two tools available: calculate (for maths) and getWeather (demo).
Always answer from the knowledge base context below when relevant.

--- KNOWLEDGE BASE ---
${FULL_KB_CONTEXT}
--- END KNOWLEDGE BASE ---`;

export async function POST(req: Request) {
  const { messages: uiMessages }: { messages: UIMessage[] } = await req.json();

  const messages = await convertToModelMessages(uiMessages);

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: SYSTEM_PROMPT,
    messages,
    tools: {
      calculate: tool({
        description: 'Evaluate a safe arithmetic expression and return the numeric result.',
        inputSchema: z.object({ expression: z.string() }),
        execute: async ({ expression }: { expression: string }) => {
          if (!/^[\d\s+\-*/().%]+$/.test(expression)) return 'Invalid expression';
          try {
            return String(Function(`"use strict"; return (${expression})`)());
          } catch {
            return 'Calculation error';
          }
        },
      }),
      getWeather: tool({
        description: 'Get current weather for a city.',
        inputSchema: z.object({ city: z.string() }),
        execute: async ({ city }: { city: string }) => {
          const conditions = ['Sunny', 'Partly cloudy', 'Overcast', 'Rainy'];
          const temps = [65, 72, 58, 80, 45];
          return {
            city,
            temperature: `${temps[city.length % temps.length]}°F`,
            condition: conditions[city.length % conditions.length],
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}

